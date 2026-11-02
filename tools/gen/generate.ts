/**
 * `npm run levels:gen` — deterministic level generator for D-099 fixed-yard levels (docs/LEVELS.md §7 U-5; GDD K-47,
 * K-50…K-52, K-55; docs/TECH_DESIGN.md §D99). Pure apart from the CLI's file writes: one seeded PRNG (core rng.ts
 * `mulberry32`), a fixed iteration count, no clock.
 *
 * 1. Plan → exact-cover piece set: every segment plan is tiled with the plan's shape kinds (all rotations of width ≤
 *    Ws; colour per region; enumeration in a fixed order, the PRNG picks one tiling per segment).
 * 2. Yard layout = a drop sequence: pieces (material and the plan's Ağır Yük) fall with gravity into their column in
 *    sequence order, so every block rests on the floor or another block (LEVELS §7 U-5 item 3: no hanging start).
 *    The first sequence is the "reverse stack" — later pieces of the build order fall first, so the first needed
 *    blocks lie on top (T2).
 * 3. Measure: the level JSON (`schemaVersion` 2, one batch) goes through the validator and the solver (full
 *    exploration with a state budget; `moves = min + P`, K-52 D-099 with a = 0); the score is a weighted distance
 *    to the target bands plus large penalties for hard constraints (unsolved, error codes, incomplete scan,
 *    `undetected_dead`, `d1_reachable`, YAO < 0.60, Kolay/Normal traps).
 * 4. Search: hill climbing with a fixed number of iterations over neighbours of the best layout — swap two sequence
 *    items, move one item, change one drop column, re-tile one segment. Ties keep the earlier candidate.
 * 5. Output: the best `count` distinct candidates (level JSON with `targets` and the metric report).
 */
import { mulberry32 } from '../../src/core/rng.ts';
import type { Rng } from '../../src/core/rng.ts';
import { shapeById, SHAPES } from '../../src/core/shapes.ts';
import type { ShapeDef } from '../../src/core/shapes.ts';
import type { ColorCode, ShapeId } from '../../src/core/types.ts';
import { validateLevelJson } from '../../src/core/level/logic.ts';
import type { LevelData, LevelInput } from '../../src/core/level/schema.ts';
import { compile } from '../../src/core/level/compile.ts';
import { createInitialState } from '../../src/core/state.ts';
import { toAscii } from '../../src/core/ascii.ts';
import { levelHooks } from '../../src/core/obstacles/registry.ts';
import { hashState } from '../../src/core/hash.ts';
import { explore, solverStart } from '../solver/explore.ts';
import { astarMin } from '../solver/astar.ts';
import { Expander, KIND_RAIL, KIND_SHIFT, infoKind } from '../solver/expand.ts';
import { StateSpace } from '../solver/space.ts';
import { computeMetrics, coverOf, movesBand, puzzleChecks } from '../solver/metrics.ts';
import type { PuzzleMetrics, SolveIssue } from '../solver/metrics.ts';
import { d099Checks } from '../solver/puzzle.ts';

// --- input ----------------------------------------------------------------------------------------------------------

/** `--plan` file (contract: docs/TECH_DESIGN.md §D99.5). */
export interface GenPlan {
  readonly id: number;
  readonly name: { readonly tr: string; readonly en: string };
  readonly difficulty: LevelData['difficulty'];
  readonly teaches?: LevelData['teaches'];
  readonly yard: { readonly cols: number; readonly rows: number };
  readonly site: { readonly cols: number; readonly rows: number };
  readonly wall: LevelInput['wall'];
  readonly gravity?: LevelInput['gravity'];
  /** Segment plans, top → bottom rows (K-15). */
  readonly segments: readonly {
    readonly name: { readonly tr: string; readonly en: string };
    readonly rows: readonly string[];
  }[];
  /** Shape kinds of the material blocks (`D2`, `O4`, `C3` …): every rotation that fits the site width is used. */
  readonly shapes: readonly string[];
  /** Ağır Yük pieces (`Q9_0`, `I5_0` …) dropped with the material (K-44). */
  readonly cargo?: readonly ShapeId[];
  readonly tutorial?: LevelInput['tutorial'];
  readonly seed?: number;
}

/** `--targets` file: the level `targets` bands (schema `Targets`, GDD §14). */
export type GenTargets = NonNullable<LevelInput['targets']>;

export interface GenOptions {
  readonly seed: number;
  /** Hill-climbing iterations after the start layouts (default 120). */
  readonly iterations?: number;
  /** Distinct start layouts (default 6). */
  readonly starts?: number;
  /** Candidates returned (default 3). */
  readonly count?: number;
  /** Exploration budget per candidate (default 400 000 states; a larger space is rejected, LEVELS §6.3). */
  readonly maxStates?: number;
  /** Full solves at most (default 40): the cheap bound filters the rest. */
  readonly maxFull?: number;
  /** Called after every full solve (CLI progress on stderr; never changes the result). */
  readonly onSolved?: (info: {
    readonly iteration: number;
    readonly score: number;
    readonly states: number;
  }) => void;
}

// --- tiling ---------------------------------------------------------------------------------------------------------

interface Placed {
  readonly shape: ShapeDef;
  readonly color: ColorCode;
  /** Site anchor (local column, plan row from the bottom). */
  readonly x: number;
  readonly y: number;
}

const TILING_CAP = 400;

/** Shapes of the plan: every distinct rotation of each kind whose width fits the site (no heavy shape, K-44). */
export function planShapes(plan: GenPlan): ShapeDef[] {
  const kinds = new Set(plan.shapes);
  return SHAPES.filter(
    (s) => kinds.has(s.kind) && s.id === s.canonical && !s.heavy && s.w <= plan.site.cols,
  ).sort((a, b) => a.index - b.index);
}

/**
 * Every exact cover of a segment plan (rows top → bottom) by the shapes, colour per piece, up to `TILING_CAP`, in a
 * fixed order: the lowest empty cell (row, then column) is covered by each shape whose first cell can sit there.
 */
export function tilings(rows: readonly string[], shapes: readonly ShapeDef[]): Placed[][] {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const color = (x: number, y: number): string => rows[h - 1 - y]?.[x] ?? '.';
  const filled = new Uint8Array(w * h);
  const out: Placed[][] = [];
  const cur: Placed[] = [];
  const firstCell = (s: ShapeDef): { x: number; y: number } =>
    [...s.cells].sort((a, b) => a.y - b.y || a.x - b.x)[0] ?? { x: 0, y: 0 };
  const rec = (): void => {
    if (out.length >= TILING_CAP) return;
    let at = -1;
    for (let i = 0; i < w * h; i++)
      if (filled[i] === 0) {
        at = i;
        break;
      }
    if (at < 0) {
      out.push([...cur]);
      return;
    }
    const ex = at % w;
    const ey = Math.floor(at / w);
    const c = color(ex, ey);
    for (const s of shapes) {
      const f = firstCell(s);
      const x0 = ex - f.x;
      const y0 = ey - f.y;
      const ok = s.cells.every((cell) => {
        const x = x0 + cell.x;
        const y = y0 + cell.y;
        return x >= 0 && x < w && y >= 0 && y < h && filled[y * w + x] === 0 && color(x, y) === c;
      });
      if (!ok) continue;
      for (const cell of s.cells) filled[(y0 + cell.y) * w + x0 + cell.x] = 1;
      cur.push({ shape: s, color: c as ColorCode, x: x0, y: y0 });
      rec();
      cur.pop();
      for (const cell of s.cells) filled[(y0 + cell.y) * w + x0 + cell.x] = 0;
    }
  };
  rec();
  return out;
}

// --- layout ---------------------------------------------------------------------------------------------------------

/** One item of the drop sequence: a material block (segment, index in its tiling) or an Ağır Yük. */
interface Item {
  readonly shape: ShapeDef;
  readonly color: ColorCode | null;
  /** Build order key (segment, row, column) of a material block; cargo: −1. */
  readonly order: number;
}

/** A candidate: one tiling per segment and the drop sequence with a column per item. */
export interface Layout {
  readonly tiling: readonly number[];
  readonly items: readonly Item[];
  readonly columns: readonly number[];
}

function itemsOf(plan: GenPlan, tiles: readonly (readonly Placed[])[]): Item[] {
  const items: Item[] = [];
  tiles.forEach((t, k) => {
    for (const p of t) items.push({ shape: p.shape, color: p.color, order: k * 1000 + p.y * 10 + p.x });
  });
  for (const c of plan.cargo ?? []) items.push({ shape: shapeById(c), color: null, order: -1 });
  return items;
}

/** Drops the items in sequence order (gravity; column = anchor x). Null when an item does not fit the yard. */
export function dropLayout(
  plan: GenPlan,
  items: readonly Item[],
  columns: readonly number[],
): { shape: ShapeDef; color: ColorCode | null; x: number; y: number }[] | null {
  const { cols, rows } = plan.yard;
  const occ = new Uint8Array(cols * rows);
  const out: { shape: ShapeDef; color: ColorCode | null; x: number; y: number }[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i] as Item;
    const x0 = columns[i] ?? 0;
    if (x0 < 0 || x0 + it.shape.w > cols) return null;
    const free = (y0: number): boolean =>
      it.shape.cells.every((c) => {
        const y = y0 + c.y;
        return y < rows && occ[y * cols + x0 + c.x] === 0;
      });
    // highest free start, then fall while the next row down is free
    let y0 = rows - it.shape.h;
    if (y0 < 0 || !free(y0)) return null;
    while (y0 > 0 && free(y0 - 1)) y0--;
    for (const c of it.shape.cells) occ[(y0 + c.y) * cols + x0 + c.x] = 1;
    out.push({ shape: it.shape, color: it.color, x: x0, y: y0 });
  }
  return out;
}

/** Level JSON of a layout (`schemaVersion` 2, one batch, K-55; `moves` given by the caller). */
export function levelOf(
  plan: GenPlan,
  layout: Layout,
  moves: number,
  targets?: GenTargets,
): LevelInput | null {
  const dropped = dropLayout(plan, layout.items, layout.columns);
  if (!dropped) return null;
  return {
    schemaVersion: 2,
    id: plan.id,
    chapter: Math.ceil(plan.id / 10),
    name: { ...plan.name },
    difficulty: plan.difficulty,
    moves,
    ...(plan.teaches ? { teaches: plan.teaches } : {}),
    ...(plan.seed !== undefined ? { seed: plan.seed } : {}),
    goals: [{ type: 'build' }],
    gravity: plan.gravity ?? { build: 'normal', yard: false },
    wall: plan.wall,
    site: { ...plan.site },
    build: {
      mode: 'segments',
      segments: plan.segments.map((sg) => ({ name: { ...sg.name }, rows: [...sg.rows] })),
    },
    yard: {
      cols: plan.yard.cols,
      rows: plan.yard.rows,
      batches: [
        {
          forSegment: 0,
          pieces: dropped
            // the level lists the blocks top-down, left to right (LEVELS tables read the yard from the top)
            .map((d, i) => ({ d, i }))
            .sort((a, b) => b.d.y - a.d.y || a.d.x - b.d.x || a.i - b.i)
            .map(({ d }) => ({
              shape: d.shape.id,
              ...(d.color !== null ? { color: d.color } : {}),
              x: d.x,
              y: d.y,
            })),
        },
      ],
    },
    obstacles: [],
    ...(plan.tutorial ? { tutorial: plan.tutorial } : {}),
    ...(targets ? { targets } : {}),
  };
}

// --- measure and score ------------------------------------------------------------------------------------------------

export interface Measure {
  readonly score: number;
  readonly level: LevelInput | null;
  readonly metrics: PuzzleMetrics | null;
  readonly issues: readonly (SolveIssue | { code: string; severity: string; message: string })[];
  readonly states: number;
  readonly notes: readonly string[];
}

const HARD = 1000;
/** LEVELS §7 U-5 item 4: the puzzle-intelligence metrics first, then the size metrics. */
const WEIGHTS: Readonly<Record<string, number>> = {
  ahaMin: 4,
  greedyWin: 4,
  forced: 3,
  depLater: 3,
  parkSlack: 3,
  crossDeps: 2,
  greedyExcess: 2,
  min: 2,
  minShifts: 1,
  maxCover: 1,
  branch3: 1,
  firstNeedDepth: 1,
  choices0: 1,
  deadRate: 1,
};

function bandDistance(v: number | null | undefined, band: readonly [number, number]): number {
  if (v === undefined) return 0;
  if (v === null) return 1;
  if (v === Infinity) return band[1] >= 99 ? 0 : 1;
  const width = Math.max(1, band[1] - band[0]);
  if (v < band[0]) return (band[0] - v) / width;
  if (v > band[1]) return (v - band[1]) / width;
  return 0;
}

function metricValue(m: PuzzleMetrics, key: string): number | null | undefined {
  const d = m.d099;
  const table: Record<string, number | null | undefined> = {
    minShifts: m.minShifts,
    firstNeedDepth: m.firstNeedDepth,
    choices0: m.choices[0] ?? null,
    deadRate: m.deadRate,
    min: m.min,
    maxCover: d.maxCover,
    depLater: d.depLater,
    crossDeps: d.crossDeps,
    parkSlack: d.parkSlack ?? undefined,
    forced: d.forced,
    greedyExcess: d.greedyExcess ?? Infinity,
    greedyWin: Math.round(d.greedyWin * 100) / 100,
    ahaMin: d.ahaMin,
    branch3: d.branch3,
  };
  return table[key];
}

/** Shifts from the start until a correct placement is possible (K-50/5; BFS over shift moves, capped). */
function shiftDepth(lvl: ReturnType<typeof compile>, cap: number): number | null {
  const hooks = levelHooks(lvl);
  const x = new Expander(lvl, hooks);
  const start = solverStart(lvl);
  const h = hashState(start);
  const space = new StateSpace(start.buf);
  space.add(h[0] ?? 0, h[1] ?? 0, start.buf);
  const depth = [0];
  const cur = { lvl, buf: new Int32Array(lvl.layout.size) };
  for (let i = 0; i < space.count && space.count < cap; i++) {
    space.load(i, cur.buf);
    let placement = false;
    x.expand(cur, space.hashLo(i), space.hashHi(i), (lo, hi, info) => {
      if (infoKind(info) <= KIND_RAIL) placement = true;
      if (infoKind(info) !== KIND_SHIFT || space.find(lo, hi) >= 0) return;
      space.add(lo, hi, x.materialize().buf);
      depth.push((depth[i] ?? 0) + 1);
    });
    if (placement) return depth[i] ?? 0;
  }
  return null;
}

/** No move costs more than 1 (no glass, no mortar, no move-cost rule): `min = N + minShifts` (K-50/2). */
function penaltyFree(lvl: ReturnType<typeof compile>): boolean {
  const hooks = levelHooks(lvl);
  return hooks.moveCost === undefined && hooks.placement === undefined && hooks.fall === undefined;
}

/** Score terms of the targets that a measure knows (the others are skipped). */
function bandScore(targets: GenTargets, value: (key: string) => number | null | undefined | false): number {
  let score = 0;
  for (const [key, b] of Object.entries(targets)) {
    if (!b) continue;
    const v = value(key);
    if (v === false) continue;
    score += (WEIGHTS[key] ?? 1) * 10 * bandDistance(v, b as readonly [number, number]);
  }
  return score;
}

/**
 * Cheap lower bound of `measure` (branch and bound of the search): validation, A* `min` (K-50/2), `firstNeedDepth`
 * (K-50/5) and the static `maxCover` (K-50/11). Every term is also a term of the full score, so `cheap ≤ full`.
 */
export function measureCheap(plan: GenPlan, layout: Layout, targets: GenTargets, maxStates: number): Measure {
  const probe = levelOf(plan, layout, 99);
  if (!probe)
    return { score: HARD * 100, level: null, metrics: null, issues: [], states: 0, notes: ['does not fit'] };
  const v = validateLevelJson(probe, { fileId: plan.id });
  const verrors = v.issues.filter((i) => i.severity === 'error' && i.code !== 'moves_budget');
  if (!v.level || verrors.length > 0)
    return {
      score: HARD * (50 + verrors.length),
      level: probe,
      metrics: null,
      issues: verrors,
      states: 0,
      notes: ['validate'],
    };
  const lvl = compile(v.level);
  const a = astarMin(lvl, { maxStates, maxMs: Infinity });
  if (!a.complete)
    return { score: 0, level: probe, metrics: null, issues: [], states: a.states, notes: ['a* unknown'] };
  if (a.min === null)
    return {
      score: HARD * 30,
      level: probe,
      metrics: null,
      issues: [],
      states: a.states,
      notes: ['unsolvable'],
    };
  const depth = shiftDepth(lvl, 50_000);
  const start = createInitialState(lvl);
  let maxCover: number | null = null;
  for (let id = 0; id < lvl.layout.counts.pieces; id++) {
    if (lvl.pieces[id]?.cls !== 'material') continue;
    const c = coverOf(start, id);
    maxCover = maxCover === null ? c : Math.max(maxCover, c);
  }
  const min = a.min;
  // K-51 item 1 errors the full solve would report too (penalty-free levels: minShifts = min − N, K-50/2)
  let hard = 0;
  if (plan.id >= 3 && depth === 0) hard++;
  if (plan.id >= 3 && penaltyFree(lvl) && min - lvl.materialCount < 1) hard++;
  const score =
    HARD * hard +
    bandScore(targets, (key) =>
      key === 'min'
        ? min
        : key === 'firstNeedDepth'
          ? depth
          : key === 'maxCover'
            ? maxCover
            : key === 'minShifts' && penaltyFree(lvl)
              ? min - lvl.materialCount
              : false,
    );
  return { score, level: probe, metrics: null, issues: [], states: a.states, notes: ['cheap'] };
}

/** Validates and solves one layout; the score is 0 inside every band without hard failures. */
export function measure(plan: GenPlan, layout: Layout, targets: GenTargets, maxStates: number): Measure {
  const notes: string[] = [];
  const probe = levelOf(plan, layout, 99);
  if (!probe)
    return { score: HARD * 100, level: null, metrics: null, issues: [], states: 0, notes: ['does not fit'] };
  const v = validateLevelJson(probe, { fileId: plan.id });
  const verrors = v.issues.filter((i) => i.severity === 'error' && i.code !== 'moves_budget');
  if (!v.level || verrors.length > 0)
    return {
      score: HARD * (50 + verrors.length),
      level: probe,
      metrics: null,
      issues: verrors,
      states: 0,
      notes: ['validate'],
    };
  const lvl = compile(v.level);
  const g = explore(lvl, { maxStates, maxMs: Infinity });
  if (!g.complete)
    return {
      score: HARD * 40,
      level: probe,
      metrics: null,
      issues: [],
      states: g.count,
      notes: ['incomplete'],
    };
  const first = computeMetrics(g, 99);
  if (!first.metrics)
    return {
      score: HARD * 30,
      level: probe,
      metrics: null,
      issues: [],
      states: g.count,
      notes: ['unsolvable'],
    };
  const band = movesBand(first.metrics.min, plan.difficulty, plan.teaches !== undefined, true);
  const level = levelOf(plan, layout, band.lo, targets) as LevelInput;
  const data = validateLevelJson(level, { fileId: plan.id }).level as LevelData;
  const res = computeMetrics(g, band.lo);
  const m = res.metrics as PuzzleMetrics;
  const issues: SolveIssue[] = [
    ...puzzleChecks({ level: data, lvl, metrics: m, canonical: res.canonical, complete: true }),
    ...d099Checks(data, m.d099),
  ];
  let score = 0;
  for (const i of issues) {
    if (i.code === 'metric_out_of_band') continue;
    score += i.severity === 'error' ? HARD : 25;
  }
  score += bandScore(targets, (key) => metricValue(m, key));
  return { score, level, metrics: m, issues, states: g.count, notes };
}

// --- search ---------------------------------------------------------------------------------------------------------

export interface Candidate {
  readonly rank: number;
  readonly score: number;
  readonly iteration: number;
  readonly level: LevelInput;
  readonly metrics: PuzzleMetrics | null;
  readonly issues: readonly { code: string; severity: string; message: string }[];
  readonly states: number;
  readonly ascii: string;
}

export interface GenResult {
  readonly seed: number;
  /** Distinct layouts measured (cheap bound or full solve). */
  readonly evaluated: number;
  /** Layouts that went through the full solve. */
  readonly solved: number;
  readonly startScore: number;
  readonly candidates: readonly Candidate[];
  /** Score of the best layout after each iteration (the search trace). */
  readonly trace: readonly number[];
}

/** Random columns where every item fits, retried a fixed number of times; null when none was found. */
function randomColumns(
  plan: GenPlan,
  items: readonly Item[],
  rng: Rng,
  keep = 0,
  base?: readonly number[],
): number[] | null {
  // greedy packing: each item falls into a column where it fits, the lowest landing first (ties: seeded), so a tight
  // yard (K-02: E ≥ 2) still packs; the first `keep` columns are taken from `base`
  const { cols, rows } = plan.yard;
  for (let attempt = 0; attempt < 8; attempt++) {
    const occ = new Uint8Array(cols * rows);
    const out: number[] = [];
    let ok = true;
    for (let i = 0; i < items.length && ok; i++) {
      const it = items[i] as Item;
      const options: { x: number; y: number }[] = [];
      for (let x0 = 0; x0 + it.shape.w <= cols; x0++) {
        const y = landing(it.shape, x0, occ, cols, rows);
        if (y !== null) options.push({ x: x0, y });
      }
      const fixed = i < keep ? base?.[i] : undefined;
      let pick = fixed !== undefined ? options.find((o) => o.x === fixed) : undefined;
      if (!pick && options.length > 0) {
        // mostly the lowest landing (tight packing), sometimes any column (variety); fixed by the PRNG
        const low = Math.min(...options.map((o) => o.y));
        const pool = rng.next() < 0.75 ? options.filter((o) => o.y === low) : options;
        pick = pool[rng.nextInt(pool.length)];
      }
      if (!pick) {
        ok = false;
        break;
      }
      for (const c of it.shape.cells) occ[(pick.y + c.y) * cols + pick.x + c.x] = 1;
      out.push(pick.x);
    }
    if (ok) return out;
  }
  return null;
}

/** Landing row of a shape dropped into column `x0` (gravity from the top), or null when it does not fit. */
function landing(shape: ShapeDef, x0: number, occ: Uint8Array, cols: number, rows: number): number | null {
  const free = (y0: number): boolean =>
    shape.cells.every((c) => y0 + c.y < rows && occ[(y0 + c.y) * cols + x0 + c.x] === 0);
  let y0 = rows - shape.h;
  if (y0 < 0 || !free(y0)) return null;
  while (y0 > 0 && free(y0 - 1)) y0--;
  return y0;
}

/** Start layout `k`: the reverse stack (later build order falls first) with seeded columns. */
function startLayout(plan: GenPlan, all: readonly Placed[][][], rng: Rng): Layout | null {
  const tiling = all.map((list) => rng.nextInt(Math.max(1, list.length)));
  const items = itemsOf(
    plan,
    tiling.map((t, k) => all[k]?.[t] ?? []),
  ).sort((a, b) => b.order - a.order);
  // cargo first (bottom), then the later floors, the first needed blocks last (on top)
  const ordered = [...items.filter((i) => i.order < 0), ...items.filter((i) => i.order >= 0)];
  const columns = randomColumns(plan, ordered, rng);
  return columns ? { tiling, items: ordered, columns } : null;
}

function neighbour(plan: GenPlan, all: readonly Placed[][][], base: Layout, rng: Rng): Layout | null {
  const n = base.items.length;
  const op = rng.nextInt(4);
  const items = [...base.items];
  const columns = [...base.columns];
  let tiling = [...base.tiling];
  if (op === 0 && n >= 2) {
    const i = rng.nextInt(n);
    const j = rng.nextInt(n);
    [items[i], items[j]] = [items[j] as Item, items[i] as Item];
    [columns[i], columns[j]] = [columns[j] ?? 0, columns[i] ?? 0];
  } else if (op === 1 && n >= 2) {
    const i = rng.nextInt(n);
    const j = rng.nextInt(n);
    const [it] = items.splice(i, 1);
    const [c] = columns.splice(i, 1);
    items.splice(j, 0, it as Item);
    columns.splice(j, 0, c ?? 0);
  } else if (op === 2) {
    const i = rng.nextInt(n);
    const it = items[i] as Item;
    columns[i] = rng.nextInt(Math.max(1, plan.yard.cols - it.shape.w + 1));
  } else {
    const k = rng.nextInt(all.length);
    const options = all[k]?.length ?? 1;
    if (options <= 1) return null;
    tiling = [...tiling];
    tiling[k] = ((tiling[k] ?? 0) + 1 + rng.nextInt(options - 1)) % options;
    return startLayoutWith(plan, all, tiling, rng);
  }
  if (dropLayout(plan, items, columns)) return { tiling, items, columns };
  // repair: keep the sequence, re-pack the columns from the first item that no longer fits
  const repaired = randomColumns(plan, items, rng, firstMisfit(plan, items, columns), columns);
  return repaired ? { tiling, items, columns: repaired } : null;
}

/** A layout with a new tiling: same sequence policy as the start layout, new seeded columns. */
function startLayoutWith(
  plan: GenPlan,
  all: readonly Placed[][][],
  tiling: readonly number[],
  rng: Rng,
): Layout | null {
  const items = itemsOf(
    plan,
    tiling.map((t, k) => all[k]?.[t] ?? []),
  ).sort((a, b) => b.order - a.order);
  const ordered = [...items.filter((i) => i.order < 0), ...items.filter((i) => i.order >= 0)];
  const columns = randomColumns(plan, ordered, rng);
  return columns ? { tiling: [...tiling], items: ordered, columns } : null;
}

/** Index of the first item that does not fit when dropping in sequence (items before it keep their columns). */
function firstMisfit(plan: GenPlan, items: readonly Item[], columns: readonly number[]): number {
  for (let k = 1; k <= items.length; k++)
    if (!dropLayout(plan, items.slice(0, k), columns.slice(0, k))) return k - 1;
  return items.length;
}

const layoutKey = (plan: GenPlan, l: Layout): string => {
  const d = dropLayout(plan, l.items, l.columns) ?? [];
  return d
    .map((p) => `${p.shape.id}${p.color ?? '-'}@${p.x},${p.y}`)
    .sort()
    .join(' ');
};

/** The generator (LEVELS §7 U-5): deterministic for the same plan, targets, options and solver version. */
export function generate(plan: GenPlan, targets: GenTargets, opts: GenOptions): GenResult {
  const rng = mulberry32(opts.seed);
  const iterations = opts.iterations ?? 120;
  const starts = opts.starts ?? 6;
  const count = opts.count ?? 3;
  const maxStates = opts.maxStates ?? 400_000;
  const shapes = planShapes(plan);
  const all = plan.segments.map((sg) => tilings(sg.rows, shapes));
  if (all.some((t) => t.length === 0))
    throw new Error('levels:gen: a segment plan has no tiling with the plan shapes');

  const maxFull = opts.maxFull ?? 40;
  const seen = new Map<string, { layout: Layout; m: Measure; iteration: number; full: boolean }>();
  let fullRuns = 0;
  let best: { layout: Layout; m: Measure } | null = null;
  /** Cheap bound first; the full solve only when the bound does not exceed the best full score (≤: plateau moves). */
  const evaluate = (l: Layout, iteration: number): Measure | null => {
    const key = layoutKey(plan, l);
    const hit = seen.get(key);
    if (hit) return hit.full ? hit.m : null;
    const cheap = measureCheap(plan, l, targets, maxStates);
    const bound = best?.m.score ?? Infinity;
    if (cheap.score >= HARD * 30 || cheap.score > bound || fullRuns >= maxFull) {
      seen.set(key, { layout: l, m: cheap, iteration, full: false });
      return null;
    }
    fullRuns++;
    const m = measure(plan, l, targets, maxStates);
    seen.set(key, { layout: l, m, iteration, full: true });
    opts.onSolved?.({ iteration, score: m.score, states: m.states });
    return m;
  };

  let startScore = Infinity;
  for (let k = 0; k < starts; k++) {
    const l = startLayout(plan, all, rng);
    if (!l) continue;
    const m = evaluate(l, 0);
    if (!m) continue;
    if (startScore === Infinity) startScore = m.score;
    if (!best || m.score < best.m.score) best = { layout: l, m };
  }
  if (!best) throw new Error('levels:gen: no start layout fits the yard and solves');
  const trace: number[] = [];
  for (let it = 1; it <= iterations; it++) {
    const l = neighbour(plan, all, best.layout, rng);
    if (l) {
      const m = evaluate(l, it);
      // plateau moves keep the walk going; ties keep the stored best for the ranking below
      if (m && m.score <= best.m.score) best = { layout: l, m };
    }
    trace.push(best.m.score);
  }
  const ranked = [...seen.values()]
    .filter((e) => e.full && e.m.level !== null && e.m.metrics !== null)
    .sort((a, b) => a.m.score - b.m.score || a.iteration - b.iteration);
  const candidates: Candidate[] = ranked.slice(0, count).map((e, i) => {
    const level = e.m.level as LevelInput;
    const data = validateLevelJson(level, { fileId: plan.id }).level;
    return {
      rank: i + 1,
      score: Math.round(e.m.score * 100) / 100,
      iteration: e.iteration,
      level,
      metrics: e.m.metrics,
      issues: e.m.issues.map((x) => ({ code: x.code, severity: x.severity, message: x.message })),
      states: e.m.states,
      ascii: data ? toAscii(createInitialState(compile(data))) : '',
    };
  });
  return { seed: opts.seed, evaluated: seen.size, solved: fullRuns, startScore, candidates, trace };
}
