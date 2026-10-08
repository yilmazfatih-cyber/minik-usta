/**
 * K-50 puzzle metrics, the canonical solution and the solve-stage checks (docs/GDD.md K-46, K-50, K-51, K-52, K-45
 * item 9; docs/TECH_DESIGN.md §2R.3 L-19, L-27, L-32…L-34, §2R.5 "Ölçütler").
 *
 * Every metric is computed on the complete explored graph (explore.ts) with the K-50 definitions:
 * - `min` = dist(start); `minShifts` = 0-1 distance (shifts 1, placements 0) from the start; both may come from
 *   different solutions (K-50 item 3).
 * - Canonical solution (K-50 item 4, K-46): on the DAG of shortest-solution edges (`dist(s) = c(e) + dist(s')`), first
 *   the most over-the-wall placements (YAO; the denominator is N in a full cover), then, step by step, the smallest
 *   move by (over the wall < rail < shift, shape kind as a string, angle, colour W Y G R O C B P, start x, y, target x,
 *   y). The target of a site placement is its landing anchor; ties beyond the GDD tuple (never seen in valid data) go
 *   to the smaller piece id, then the release node.
 * - F0 / `cover` / `firstNeedCover` on the start state (access ignored: core `neededNow`), `firstNeedDepth` by a BFS
 *   over shift edges (distance.ts).
 * - Scope K (K-50 item 8): states whose fewest shifts from the start is ≤ minShifts + 1. `trapCount` = correct
 *   placement (or W6 paint) edges from a live K state into a dead state; `deadRate` = trapCount / every such edge from a
 *   live K state. (An edge out of a dead state is not a trap and is counted in neither.)
 * - `choices@k`, `bestChoices@k` (k = 0, 1, 2) on the canonical path, budget = the JSON `moves`.
 */
import { COLOR_CODES, SHAPE_KINDS, Zone } from '../../src/core/types.ts';
import type { ColorCode, DragNode, PieceId, SessionAction, ShapeId } from '../../src/core/types.ts';
import { H, PF, PIECE_STRIDE, yardOcc } from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import { detectDeadlock, neededNow, noMoves } from '../../src/core/deadlock.ts';
import { shapeByIndex } from '../../src/core/shapes.ts';
import type { LevelData } from '../../src/core/level/schema.ts';
import type { Graph } from './explore.ts';
import { solverStart, stateAt } from './explore.ts';
import {
  Expander,
  KIND_NAMES,
  KIND_OVERWALL,
  KIND_RAIL,
  KIND_SHIFT,
  infoCost,
  infoKind,
  infoPaint,
  isPlacementInfo,
} from './expand.ts';
import {
  INF,
  distanceFromStart,
  distanceToWin,
  firstNeedDepth,
  reverseEdges,
  shiftsFromStart,
  shiftsToWin,
} from './distance.ts';
import type { DistanceResult } from './distance.ts';

/** One finding of the solve stage (same shape as the validator's `Issue`; `check` adds `tool` for tool gates). */
export interface SolveIssue {
  readonly code: string;
  readonly rule: string;
  readonly check: string;
  readonly severity: 'error' | 'warn';
  readonly path: string;
  readonly message: string;
}

export type KindName = (typeof KIND_NAMES)[number];

/** One move of the canonical solution. */
export interface CanonicalStep {
  /** 1-based move number. */
  readonly n: number;
  readonly kind: KindName;
  readonly pieceId: PieceId;
  /** Tutorial / LEVELS reference: `piece:<i>`, `piece:k<p>_<i>`, `debris:<i>`. */
  readonly ref: string;
  readonly shape: ShapeId;
  /** Colour code; `-` for Ağır Yük. */
  readonly color: ColorCode | '-';
  /** Start anchor (board coordinates). */
  readonly from: readonly [number, number];
  /** Landing anchor (board coordinates). */
  readonly to: readonly [number, number];
  /** The release node of the move record. */
  readonly node: DragNode;
  readonly via?: number;
  readonly cost: number;
  /** Active (front) segment when the move is made. */
  readonly segment: number;
  /** Truck queue length after the move (L-34). */
  readonly queueAfter: number;
}

export interface PuzzleMetrics {
  /** K-47 N: material blocks. */
  readonly N: number;
  readonly min: number;
  readonly minShifts: number;
  /** K-50 item 2: `min = N + minShifts` (expected on a level without move penalties). */
  readonly minIsNPlusShifts: boolean;
  readonly shiftsBySegment: readonly number[];
  readonly firstNeedDepth: number | null;
  /** F0 refs (K-50 item 5). */
  readonly F0: readonly string[];
  /** `cover(b)` of every start yard material block, by ref (K-50 item 6). */
  readonly cover: Readonly<Record<string, number>>;
  readonly firstNeedCover: number | null;
  readonly scope: {
    /** minShifts + 1. */
    readonly maxShifts: number;
    readonly states: number;
    readonly placementEdges: number;
  };
  readonly trapCount: number;
  readonly deadRate: number;
  /** Dead states of the whole explored space (K-50 item 7). */
  readonly deadStates: number;
  /**
   * Every live → dead transition of the WHOLE space (scope K and beyond, any move kind): `edges`, of which `shiftEdges`
   * are shifts (a yard move whose step 9 delivers a queued truck block into a dead layout; not a K-50 ✓-trap), the
   * distinct dead `states` entered, and how many of those the runtime catches without a D3b table (`caught`: D1 no
   * moves, D2 colour balance or D3a tiling; TECH §2R.4). `states − caught` would need the D3b table (cut 1, Faz 3).
   */
  readonly deadEntries: {
    readonly edges: number;
    readonly shiftEdges: number;
    readonly states: number;
    readonly caught: number;
  };
  /**
   * GDD K-51 item 5 (delivery fairness), one entry per truck batch k ≥ 1 (by `forSegment`): `D` = fewest moves from the
   * start to a state where the batch was delivered (segment k − 1 completed, `deliveryCursor ≥ k`), `states` = how many
   * such states are reached in `D` moves (T(k)), `distMin` / `distMax` = their fewest moves to a win (null = a dead
   * state in T(k)); foresight gain `g = D + distMin − min`, luck gap `f = distMax − distMin` (null with a dead state).
   * The rule wants `g = 0` and `f = 0` (`delivery_foresight`, warn).
   */
  readonly delivery: readonly DeliveryFairness[];
  readonly liveStates: number;
  readonly wonStates: number;
  /** Budget used by `choices@k` (JSON `moves`). */
  readonly budget: number;
  readonly choices: readonly (number | null)[];
  readonly bestChoices: readonly (number | null)[];
  readonly yao: { readonly overWall: number; readonly rail: number; readonly value: number | null };
}

/** GDD K-51 item 5 values of one truck batch (see `PuzzleMetrics.delivery`). */
export interface DeliveryFairness {
  readonly forSegment: number;
  readonly D: number;
  readonly states: number;
  readonly distMin: number | null;
  readonly distMax: number | null;
  readonly g: number | null;
  readonly f: number | null;
}

/**
 * GDD K-51 item 5 on the complete graph: for each `forSegment` k ≥ 1 of the level's truck batches, T(k) = the states
 * with `deliveryCursor ≥ k` at the fewest moves from the start (the first such state on any path is the one entered by
 * the completing move, so the minimum is always an entry state).
 */
export function deliveryFairness(g: Graph, dist: DistanceResult, min: number): DeliveryFairness[] {
  const ks = [...new Set(g.lvl.batches.map((b) => b.forSegment).filter((k) => k >= 1))].sort((a, b) => a - b);
  if (ks.length === 0) return [];
  const fwd = distanceFromStart(g);
  const buf = new Int32Array(g.lvl.layout.size);
  const best = ks.map(() => ({ D: INF, states: 0, lo: INF, hi: -1, dead: false }));
  for (let s = 0; s < g.count; s++) {
    const d = fwd[s] ?? INF;
    if (d >= INF) continue;
    g.space.load(s, buf);
    const cursor = buf[H.deliveryCursor] ?? 0;
    ks.forEach((k, i) => {
      const b = best[i];
      if (!b || cursor < k || d > b.D) return;
      if (d < b.D) Object.assign(b, { D: d, states: 0, lo: INF, hi: -1, dead: false });
      b.states++;
      const w = dist.dist[s] ?? INF;
      if (w >= INF) b.dead = true;
      else {
        if (w < b.lo) b.lo = w;
        if (w > b.hi) b.hi = w;
      }
    });
  }
  return ks.map((k, i) => {
    const b = best[i] ?? { D: INF, states: 0, lo: INF, hi: -1, dead: true };
    const distMin = b.lo >= INF ? null : b.lo;
    const distMax = b.dead || b.hi < 0 ? null : b.hi;
    return {
      forSegment: k,
      D: b.D,
      states: b.states,
      distMin,
      distMax,
      g: distMin === null ? null : b.D + distMin - min,
      f: distMin === null || distMax === null ? null : distMax - distMin,
    };
  });
}

/** Everything the metrics step returns; `metrics` is null when the start is dead. */
export interface MetricsResult {
  readonly metrics: PuzzleMetrics | null;
  readonly canonical: readonly CanonicalStep[];
  /** Graph state index of each canonical position (0 = start … final won state). */
  readonly pathStates: readonly number[];
  readonly dist: DistanceResult;
}

// --- references ---------------------------------------------------------------------------------------------------

/** PieceId → LEVELS / tutorial reference (`piece:<i>`, `piece:k<p>_<i>`, `debris:<i>`, GDD §14). */
export function pieceRef(lvl: CompiledLevel, id: PieceId): string {
  const p = lvl.pieces[id];
  if (!p) return `#${id}`;
  if (p.origin === 'debris') return `debris:${p.index}`;
  if (p.batch === 0) return `piece:${p.index}`;
  return `piece:k${p.batch}_${p.index}`;
}

// --- canonical order (K-50 item 4) ---------------------------------------------------------------------------------

interface Candidate {
  readonly target: number;
  readonly key: readonly (number | string)[];
  readonly step: Omit<CanonicalStep, 'n' | 'segment' | 'queueAfter'>;
}

function compareKeys(a: readonly (number | string)[], b: readonly (number | string)[]): number {
  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x === y) continue;
    if (typeof x === 'string' && typeof y === 'string') return x < y ? -1 : 1;
    return (x as number) < (y as number) ? -1 : 1;
  }
  return 0;
}

/** Number of over-the-wall edges on the best shortest path from each live state (K-46 DP), −1 when dead. */
function bestOverWall(g: Graph, d: DistanceResult): Int32Array {
  const best = new Int32Array(g.count).fill(-1);
  for (const s of d.order) {
    if ((g.won[s] ?? 0) === 1) {
      best[s] = 0;
      continue;
    }
    const ds = d.dist[s] ?? INF;
    let b = -1;
    for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
      const t = g.edgeTo[e] ?? 0;
      const info = g.edgeInfo[e] ?? 0;
      if ((d.dist[t] ?? INF) + infoCost(info) !== ds) continue;
      const bt = best[t] ?? -1;
      if (bt < 0) continue;
      const v = bt + (infoKind(info) === KIND_OVERWALL ? 1 : 0);
      if (v > b) b = v;
    }
    best[s] = b;
  }
  return best;
}

/** The canonical shortest solution (K-50 item 4, K-46) as graph states and steps. */
function canonicalSolution(
  g: Graph,
  d: DistanceResult,
): { readonly steps: CanonicalStep[]; readonly states: number[] } {
  const lvl = g.lvl;
  const best = bestOverWall(g, d);
  const x = new Expander(lvl, g.hooks);
  const steps: CanonicalStep[] = [];
  const states: number[] = [0];
  let s = 0;
  const colorRank = (c: number): number => (c < 0 ? 99 : c);
  while ((g.won[s] ?? 0) === 0) {
    const ds = d.dist[s] ?? INF;
    const bs = best[s] ?? -1;
    // allowed next states and their edge kind (the edge keeps the smallest kind of its moves)
    const allowed = new Map<number, number>();
    for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
      const t = g.edgeTo[e] ?? 0;
      const info = g.edgeInfo[e] ?? 0;
      if ((d.dist[t] ?? INF) + infoCost(info) !== ds) continue;
      if ((best[t] ?? -1) + (infoKind(info) === KIND_OVERWALL ? 1 : 0) !== bs) continue;
      allowed.set(t, info);
    }
    const cur = stateAt(g, s);
    let pick: Candidate | null = null;
    x.expand(cur, g.space.hashLo(s), g.space.hashHi(s), (lo, hi, info) => {
      const t = g.space.find(lo, hi);
      const edge = allowed.get(t);
      if (edge === undefined || infoKind(edge) !== infoKind(info)) return;
      const id = x.lastPiece;
      const base = lvl.layout.pieces + id * PIECE_STRIDE;
      const shape = shapeByIndex(cur.buf[base + PF.shape] ?? 0);
      const color = cur.buf[base + PF.color] ?? -1;
      const isCargo = lvl.pieces[id]?.cls === 'cargo';
      const key = [
        infoKind(info),
        shape.kind,
        shape.rotation,
        isCargo ? 99 : colorRank(color),
        x.lastFromX,
        x.lastFromY,
        x.lastToX,
        x.lastToY,
        id,
        x.lastMode,
        x.lastIy,
        x.lastIx,
        x.lastVia ?? -1,
      ];
      if (pick && compareKeys(key, pick.key) >= 0) return;
      pick = {
        target: t,
        key,
        step: {
          kind: KIND_NAMES[infoKind(info)],
          pieceId: id,
          ref: pieceRef(lvl, id),
          shape: shape.id,
          color: isCargo ? '-' : (COLOR_CODES[color] ?? 'W'),
          from: [x.lastFromX, x.lastFromY],
          to: [x.lastToX, x.lastToY],
          node: { ix: x.lastIx, iy: x.lastIy, mode: x.lastMode },
          ...(x.lastVia !== undefined ? { via: x.lastVia } : {}),
          cost: infoCost(edge),
        },
      };
    });
    const chosen = pick as Candidate | null;
    if (!chosen) throw new Error(`canonical solution: no move found from state ${s} (solver bug)`);
    const segment = lvl.mode === 'carousel' ? (cur.buf[H.frontSeg] ?? 0) : (cur.buf[H.activeSeg] ?? 0);
    const next = stateAt(g, chosen.target);
    steps.push({
      n: steps.length + 1,
      ...chosen.step,
      segment,
      queueAfter: next.buf[H.queueLen] ?? 0,
    });
    states.push(chosen.target);
    s = chosen.target;
  }
  return { steps, states };
}

// --- static start metrics (K-50 items 5, 6) ------------------------------------------------------------------------

/** `cover(b)`: distinct pieces / obstacles on the yard cells above b's top cell in each of b's columns (K-50 item 6). */
export function coverOf(s: GameState, id: PieceId): number {
  const { geo } = s.lvl;
  const base = s.lvl.layout.pieces + id * PIECE_STRIDE;
  const shape = shapeByIndex(s.buf[base + PF.shape] ?? 0);
  const x0 = s.buf[base + PF.x] ?? 0;
  const y0 = s.buf[base + PF.y] ?? 0;
  const seen = new Set<number>();
  for (let c = 0; c < shape.w; c++) {
    for (let y = y0 + (shape.colTop[c] ?? 0) + 1; y < geo.hy; y++) {
      const v = yardOcc(s, x0 + c, y);
      if (v !== 0 && v !== id + 1) seen.add(v);
    }
  }
  return seen.size;
}

function startMetrics(lvl: CompiledLevel): {
  F0: string[];
  cover: Record<string, number>;
  firstNeedCover: number | null;
} {
  const s = solverStart(lvl);
  const f0 = neededNow(s);
  const cover: Record<string, number> = {};
  for (let id = 0; id < lvl.layout.counts.pieces; id++) {
    const base = lvl.layout.pieces + id * PIECE_STRIDE;
    if ((s.buf[base + PF.zone] ?? 0) !== Zone.yard || lvl.pieces[id]?.cls !== 'material') continue;
    cover[pieceRef(lvl, id)] = coverOf(s, id);
  }
  let firstNeedCover: number | null = null;
  for (const id of f0) {
    const c = coverOf(s, id);
    if (firstNeedCover === null || c < firstNeedCover) firstNeedCover = c;
  }
  return { F0: f0.map((id) => pieceRef(lvl, id)), cover, firstNeedCover };
}

// --- metrics ------------------------------------------------------------------------------------------------------

export function computeMetrics(g: Graph, budget: number): MetricsResult {
  const rev = reverseEdges(g);
  const dist = distanceToWin(g, rev);
  const minCost = dist.dist[0] ?? INF;
  if (minCost >= INF) return { metrics: null, canonical: [], pathStates: [0], dist };
  const toWin = shiftsToWin(g, rev);
  const fromStart = shiftsFromStart(g);
  const minShifts = toWin[0] ?? INF;
  const { steps, states } = canonicalSolution(g, dist);

  // scope K and traps (K-50 items 7, 8)
  const maxShifts = minShifts + 1;
  let scopeStates = 0;
  let placementEdges = 0;
  let trapCount = 0;
  let dead = 0;
  let won = 0;
  for (let s = 0; s < g.count; s++) {
    const live = (dist.dist[s] ?? INF) < INF;
    if (!live) dead++;
    if ((g.won[s] ?? 0) === 1) won++;
    if ((fromStart[s] ?? INF) > maxShifts) continue;
    scopeStates++;
    if (!live) continue;
    for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
      const info = g.edgeInfo[e] ?? 0;
      if (!isPlacementInfo(info) && !infoPaint(info)) continue;
      placementEdges++;
      if ((dist.dist[g.edgeTo[e] ?? 0] ?? INF) >= INF) trapCount++;
    }
  }

  // dead entries of the whole space and what the runtime catches without a D3b table
  let deadEdges = 0;
  let deadShiftEdges = 0;
  const deadTargets = new Set<number>();
  for (let s = 0; s < g.count; s++) {
    if ((dist.dist[s] ?? INF) >= INF) continue;
    for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
      const t = g.edgeTo[e] ?? 0;
      if ((dist.dist[t] ?? INF) < INF) continue;
      deadEdges++;
      if (infoKind(g.edgeInfo[e] ?? 0) === KIND_SHIFT) deadShiftEdges++;
      deadTargets.add(t);
    }
  }
  let caught = 0;
  for (const t of deadTargets) {
    const st = stateAt(g, t);
    if (noMoves(st, g.hooks.drag) || detectDeadlock(st, { table: null }) !== null) caught++;
  }

  // choices@k (K-50 item 9)
  const choices: (number | null)[] = [];
  const bestChoices: (number | null)[] = [];
  let spent = 0;
  for (let k = 0; k < 3; k++) {
    const s = states[k];
    if (s === undefined || (g.won[s] ?? 0) === 1) {
      choices.push(null);
      bestChoices.push(null);
      continue;
    }
    const ds = dist.dist[s] ?? INF;
    let c = 0;
    let b = 0;
    for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
      const t = g.edgeTo[e] ?? 0;
      const cost = infoCost(g.edgeInfo[e] ?? 0);
      const dt = dist.dist[t] ?? INF;
      if (dt >= INF || spent + cost + dt > budget) continue;
      c++;
      if (dt === ds - cost) b++;
    }
    choices.push(c);
    bestChoices.push(b);
    spent += steps[k]?.cost ?? 0;
  }

  // shifts per segment and YAO of the canonical solution (K-46)
  const S = g.lvl.segments.length;
  const shiftsBySegment = Array.from({ length: S }, () => 0);
  let overWall = 0;
  let rail = 0;
  for (const st of steps) {
    if (st.kind === KIND_NAMES[KIND_SHIFT])
      shiftsBySegment[st.segment] = (shiftsBySegment[st.segment] ?? 0) + 1;
    if (st.kind === KIND_NAMES[KIND_OVERWALL]) overWall++;
    if (st.kind === KIND_NAMES[KIND_RAIL]) rail++;
  }
  const N = g.lvl.materialCount;
  const start = startMetrics(g.lvl);
  return {
    metrics: {
      N,
      min: minCost,
      minShifts,
      minIsNPlusShifts: minCost === N + minShifts,
      shiftsBySegment,
      firstNeedDepth: firstNeedDepth(g),
      F0: start.F0,
      cover: start.cover,
      firstNeedCover: start.firstNeedCover,
      scope: { maxShifts, states: scopeStates, placementEdges },
      trapCount,
      deadRate: placementEdges === 0 ? 0 : trapCount / placementEdges,
      deadStates: dead,
      deadEntries: { edges: deadEdges, shiftEdges: deadShiftEdges, states: deadTargets.size, caught },
      delivery: deliveryFairness(g, dist, minCost),
      liveStates: g.count - dead,
      wonStates: won,
      budget,
      choices,
      bestChoices,
      yao: { overWall, rail, value: overWall + rail === 0 ? null : overWall / (overWall + rail) },
    },
    canonical: steps,
    pathStates: states,
    dist,
  };
}

/** Session log of the canonical solution: `start` + one drag per step (TECH §6.1 / §11.1 `inLevel.actions`). */
export function canonicalActions(steps: readonly CanonicalStep[]): SessionAction[] {
  return [
    { kind: 'start', preBoosters: [], streakTier: 0 },
    ...steps.map((st): SessionAction => ({
      kind: 'drag',
      pieceId: st.pieceId,
      to: st.node,
      ...(st.via !== undefined ? { via: st.via } : {}),
    })),
  ];
}

// --- K-52 move budget --------------------------------------------------------------------------------------------

export type Difficulty = LevelData['difficulty'];

const ROWS: Readonly<
  Record<Difficulty, { readonly pct: number; readonly minT: number; readonly floor: number }>
> = {
  easy: { pct: 50, minT: 6, floor: 4 },
  normal: { pct: 35, minT: 4, floor: 3 },
  hard: { pct: 20, minT: 3, floor: 2 },
  superhard: { pct: 12, minT: 2, floor: 1 },
};
const EASIER: Readonly<Record<Difficulty, Difficulty>> = {
  easy: 'easy',
  normal: 'easy',
  hard: 'normal',
  superhard: 'hard',
};

export interface MovesBand {
  /** The K-52 row used (an intro level takes the easier row, DL-2R-05). */
  readonly row: Difficulty;
  readonly T: number;
  readonly floor: number;
  /** A = max(1, ⌊0.1 · min⌋). */
  readonly A: number;
  /** min + T (a = 0). */
  readonly nominal: number;
  /** Lowest / highest valid `moves`: [max(min + T − A, min + floor), min + T + A]. */
  readonly lo: number;
  readonly hi: number;
}

/** GDD K-52: `moves = min + T + a`, |a| ≤ max(1, ⌊0.1·min⌋), `moves − min ≥ taban`; intro levels one row easier. */
export function movesBand(min: number, difficulty: Difficulty, intro: boolean): MovesBand {
  const row = intro ? EASIER[difficulty] : difficulty;
  const r = ROWS[row];
  const T = Math.max(r.minT, Math.ceil((r.pct * min) / 100));
  const A = Math.max(1, Math.floor(min / 10));
  return {
    row,
    T,
    floor: r.floor,
    A,
    nominal: min + T,
    lo: Math.max(min + T - A, min + r.floor),
    hi: min + T + A,
  };
}

// --- solve-stage checks (K-45 item 9, K-51, K-52, K-46) -------------------------------------------------------------

export interface CheckInput {
  readonly level: LevelData;
  readonly lvl: CompiledLevel;
  readonly metrics: PuzzleMetrics;
  readonly canonical: readonly CanonicalStep[];
  readonly complete: boolean;
}

const BAND_KEYS = ['minShifts', 'firstNeedDepth', 'choices0', 'deadRate'] as const;

/** L-19, L-27, L-32, L-33, L-34 on a solved level (the unsolvable / unknown cases are reported by the caller). */
export function puzzleChecks(input: CheckInput): SolveIssue[] {
  const { level, lvl, metrics: m, canonical } = input;
  const out: SolveIssue[] = [];
  const add = (
    code: string,
    rule: string,
    check: string,
    severity: 'error' | 'warn',
    path: string,
    message: string,
  ): void => {
    out.push({ code, rule, check, severity, path, message });
  };
  // L-19 unused_block (K-47 item 3): every material block placed exactly once in the canonical solution
  const placed = new Map<PieceId, number>();
  for (const st of canonical)
    if (st.kind === 'overWall' || st.kind === 'rail')
      placed.set(st.pieceId, (placed.get(st.pieceId) ?? 0) + 1);
  const unused = lvl.pieces.filter((p) => p.cls === 'material' && placed.get(p.id) !== 1).map((p) => p.id);
  if (unused.length > 0)
    add(
      'unused_block',
      'K-45/9',
      'L-19',
      'error',
      'yard',
      `blocks not placed exactly once by the canonical solution: ${unused.map((id) => pieceRef(lvl, id)).join(', ')} (K-47/3)`,
    );
  // L-19 moves_budget (K-52)
  const band = movesBand(m.min, level.difficulty, level.teaches !== undefined);
  if (level.moves < band.lo || level.moves > band.hi)
    add(
      'moves_budget',
      'K-52',
      'L-19',
      'error',
      'moves',
      `moves ${level.moves} is outside [${band.lo}, ${band.hi}] (min ${m.min}, ${band.row} row T ${band.T}, A ${band.A}, floor ${band.floor}; nominal ${band.nominal})`,
    );
  // L-19 yao_low (K-46)
  if (m.yao.value !== null && m.yao.value < 0.6)
    add(
      'yao_low',
      'K-46',
      'L-19',
      'error',
      'build',
      `YAO ${m.yao.overWall}/${m.yao.overWall + m.yao.rail} = ${m.yao.value.toFixed(2)} < 0.60 on the canonical solution`,
    );
  // L-32 (K-51 item 1)
  if (level.id >= 3 && (m.firstNeedDepth ?? 0) < 1)
    add(
      'puzzle_first_reachable',
      'K-51/1',
      'L-32',
      'error',
      'yard',
      `firstNeedDepth ${m.firstNeedDepth}: a correct placement is possible at the start (id ≥ 3 needs ≥ 1)`,
    );
  if (level.id >= 3 && m.minShifts < 1)
    add('puzzle_no_shift', 'K-51/1', 'L-32', 'error', 'yard', `minShifts ${m.minShifts}: id ≥ 3 needs ≥ 1`);
  // L-27 (K-51 item 2)
  if (!input.complete)
    add(
      'trap_scan_incomplete',
      'K-51/2',
      'L-27',
      'warn',
      'yard',
      'the scope K was not scanned to the end (state or time limit)',
    );
  if (m.trapCount > 0) {
    const easy = level.difficulty === 'easy' || level.difficulty === 'normal';
    add(
      easy ? 'trap_in_easy' : 'trap_warn',
      'K-51/2',
      'L-27',
      easy ? 'error' : 'warn',
      'build',
      `${m.trapCount} ✓-trap transition(s) in scope K (deadRate ${m.deadRate.toFixed(3)}, ${m.scope.states} states)`,
    );
  }
  // L-33 metric_out_of_band (K-51 item 3)
  const t = level.targets;
  if (t) {
    const value: Record<(typeof BAND_KEYS)[number], number | null> = {
      minShifts: m.minShifts,
      firstNeedDepth: m.firstNeedDepth,
      choices0: m.choices[0] ?? null,
      deadRate: m.deadRate,
    };
    for (const k of BAND_KEYS) {
      const bandK = t[k];
      if (!bandK) continue;
      const v = value[k];
      if (v === null || v < bandK[0] || v > bandK[1])
        add(
          'metric_out_of_band',
          'K-51/3',
          'L-33',
          'warn',
          `targets.${k}`,
          `${k} = ${v === null ? 'none' : v} is outside [${bandK[0]}, ${bandK[1]}]`,
        );
    }
  }
  // L-34 batch_queued (E-54): a truck block waits in the queue during the canonical solution
  const queued = canonical.find((st) => st.queueAfter > 0);
  if (queued)
    add(
      'batch_queued',
      'K-45/9',
      'L-34',
      'warn',
      'yard.batches',
      `after canonical move ${queued.n} ${queued.queueAfter} truck block(s) wait in the queue`,
    );
  return out;
}

/** The colour order of K-50 item 4 (for docs/tests): W Y G R O C B P. */
export const CANONICAL_COLOR_ORDER: readonly ColorCode[] = COLOR_CODES;
/** The shape-kind order of K-50 item 4 is the string order of the kind names (`B1` < `C3` < `D2` …). */
export const CANONICAL_KIND_ORDER: readonly string[] = [...SHAPE_KINDS].sort();
