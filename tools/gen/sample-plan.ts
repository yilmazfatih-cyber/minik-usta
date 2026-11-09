/**
 * `node tools/gen/sample-plan.ts <spec.json> <seed> > plan.json` — turns a level SPEC (segment count and height, colour
 * palette, shape pool, two-tone pairs, block band) into a `levels:gen` plan whose segment rows are guaranteed to be
 * tileable: every segment (`site.cols` wide: 2, or 3 on a D-103 wide site) is tiled at random with the pool, then painted piece by piece (a two-tone
 * piece gets two colours of an allowed pair). The generator re-tiles and lays out the yard; this only designs the colour
 * plan (CL-V3-04: the layout, shape mix and colours change from level to level). Deterministic: one mulberry32 stream.
 */
import { readFileSync } from 'node:fs';
import { mulberry32 } from '../../src/core/rng.ts';
import type { Rng } from '../../src/core/rng.ts';
import { shapeById } from '../../src/core/shapes.ts';
import type { ShapeId } from '../../src/core/types.ts';
import type { GenPlan, PlanPiece } from './generate.ts';
import { validateLevelJson, planTrapScan } from '../../src/core/level/logic.ts';
import { buildPlans } from '../../src/core/level/plan.ts';
import type { ColorCode } from '../../src/core/types.ts';
import type { LevelInput } from '../../src/core/level/schema.ts';

export interface PlanSpec {
  readonly id: number;
  readonly name: { readonly tr: string; readonly en: string };
  readonly difficulty: GenPlan['difficulty'];
  readonly teaches?: GenPlan['teaches'];
  readonly yard: { readonly cols: number; readonly rows: number };
  /** Site width Ws (K-49, D-103: 2, or 3 from level 6); default 2. The site height is the tallest segment. */
  readonly site?: { readonly cols: number };
  readonly wall: GenPlan['wall'];
  readonly gravity?: GenPlan['gravity'];
  readonly segments: readonly { readonly name: { tr: string; en: string }; readonly rows: number }[];
  readonly colors: string;
  readonly orientations: readonly ShapeId[];
  /** Highest share of 2-cell dominoes in the plan (CL-V3-04: 0.5 after level 3). */
  readonly maxDominoShare?: number;
  /** Two-tone pieces: allowed pairs (letters sorted), count, and the shapes allowed to be two-tone. */
  readonly twoTone?: {
    readonly pairs: readonly string[];
    readonly count: number;
    readonly shapes?: readonly string[];
  };
  readonly minKinds?: number;
  /** The colour of the first-built blocks (segment 0, bottom row) is used by at most this many blocks (easy to bury). */
  readonly rareFirst?: number;
  /** v3c 3-column plans: steps of the trap-repair hill climb (default 800; K-63 D-103 annex). */
  readonly trapRepair?: number;
  /** Random drop-sequence mutations of the picker (default 10). */
  readonly mutations?: number;
  readonly blocks: readonly [number, number];
  readonly traits?: GenPlan['traits'];
  readonly pallets?: GenPlan['pallets'];
  /**
   * v3c (LEVELS §8.13.4): the data orientation of each pallet (`D2_90`, `C3_0` …; one per pallet). The sampler paints
   * `layers` pieces of that orientation in one colour, so the fixed tiling it writes holds the pallet group.
   */
  readonly palletShapes?: readonly ShapeId[];
  readonly tutorial?: GenPlan['tutorial'];
}

/** One random exact cover of a W × rows grid (cells filled bottom row first, left first). */
function tileSegment(
  W: number,
  rows: number,
  pool: readonly ShapeId[],
  rng: Rng,
): { id: ShapeId; x: number; y: number }[] | null {
  const filled = new Uint8Array(W * rows);
  const out: { id: ShapeId; x: number; y: number }[] = [];
  const rec = (): boolean => {
    const at = filled.indexOf(0);
    if (at < 0) return true;
    const ex = at % W;
    const ey = Math.floor(at / W);
    const order = [...pool];
    for (let i = order.length - 1; i > 0; i--) {
      const j = rng.nextInt(i + 1);
      [order[i], order[j]] = [order[j] as ShapeId, order[i] as ShapeId];
    }
    for (const id of order) {
      const s = shapeById(id);
      const f = [...s.cells].sort((a, b) => a.y - b.y || a.x - b.x)[0] ?? { x: 0, y: 0 };
      const x0 = ex - f.x;
      const y0 = ey - f.y;
      const ok = s.cells.every((c) => {
        const x = x0 + c.x;
        const y = y0 + c.y;
        return x >= 0 && x < W && y >= 0 && y < rows && filled[y * W + x] === 0;
      });
      if (!ok) continue;
      for (const c of s.cells) filled[(y0 + c.y) * W + x0 + c.x] = 1;
      out.push({ id, x: x0, y: y0 });
      if (rec()) return true;
      out.pop();
      for (const c of s.cells) filled[(y0 + c.y) * W + x0 + c.x] = 0;
    }
    return false;
  };
  return rec() ? out : null;
}

interface BuiltPlan {
  readonly segments: { readonly name: { tr: string; en: string }; readonly rows: string[] }[];
  readonly tiling: PlanPiece[][];
}

/** Segment rows (top → bottom) and the fixed tiling of painted pieces (`paint[i]` = cell colours of piece i). */
function buildPlan(
  spec: PlanSpec,
  W: number,
  tiles: readonly (readonly { id: ShapeId; x: number; y: number }[])[],
  paint: readonly string[],
): BuiltPlan {
  let i = 0;
  const segments: BuiltPlan['segments'] = [];
  const tiling: PlanPiece[][] = [];
  tiles.forEach((t, k) => {
    const rowsN = spec.segments[k]?.rows ?? 0;
    const grid = new Array<string>(W * rowsN).fill('.');
    const list: PlanPiece[] = [];
    for (const p of t) {
      const cells = paint[i++] ?? '';
      shapeById(p.id).cells.forEach((c, ci) => {
        grid[(p.y + c.y) * W + p.x + c.x] = cells[ci] ?? '.';
      });
      const mono = new Set(cells).size === 1;
      list.push({
        shape: p.id,
        color: cells[0] as ColorCode,
        ...(mono ? {} : { colors: cells }),
        x: p.x,
        y: p.y,
      });
    }
    const rows: string[] = [];
    for (let y = rowsN - 1; y >= 0; y--) rows.push(grid.slice(y * W, y * W + W).join(''));
    segments.push({ name: spec.segments[k]?.name ?? { tr: '', en: '' }, rows });
    tiling.push(list);
  });
  return { segments, tiling };
}

/**
 * Trap count of a painted plan (K-63 D-103 annex, `planTrapScan`): the plan with its pieces as the material (yard
 * positions do not matter for the scan); −1 when the scan is unfinished or the plan cannot be tiled.
 */
function planTraps(spec: PlanSpec, { segments, tiling }: BuiltPlan): number {
  const json = {
    schemaVersion: 3,
    id: spec.id,
    chapter: Math.ceil(spec.id / 10),
    name: spec.name,
    difficulty: spec.difficulty,
    moves: 99,
    goals: [{ type: 'build' }],
    gravity: { build: 'normal', yard: false },
    wall: { height: 0, gaps: [] },
    site: {
      cols: segments[0]?.rows[0]?.length ?? 2,
      rows: Math.max(...segments.map((sg) => sg.rows.length)),
    },
    build: { mode: 'segments', segments: segments.map((sg) => ({ name: sg.name, rows: [...sg.rows] })) },
    yard: {
      cols: spec.yard.cols,
      rows: spec.yard.rows,
      batches: [
        {
          forSegment: 0,
          pieces: tiling.flat().map((p) => ({
            shape: p.shape,
            color: p.color,
            ...(p.colors !== undefined ? { colors: p.colors } : {}),
            x: 0,
            y: 0,
          })),
        },
      ],
    },
    obstacles: [],
  } as unknown as LevelInput;
  const level = validateLevelJson(json, { only: [] }).level;
  if (!level) return -1;
  const r = planTrapScan(level, buildPlans(level).plans);
  return r.status === 'done' && r.tileable ? r.traps : -1;
}

export function samplePlan(spec: PlanSpec, seed: number): GenPlan {
  const rng = mulberry32(seed);
  const W = spec.site?.cols ?? 2;
  for (let attempt = 0; attempt < 20000; attempt++) {
    const tiles = spec.segments.map((sg) => tileSegment(W, sg.rows, spec.orientations, rng));
    if (tiles.some((t) => t === null)) continue;
    const all = tiles.flat() as { id: ShapeId; x: number; y: number }[];
    if (all.length < spec.blocks[0] || all.length > spec.blocks[1]) continue;
    const dominoes = all.filter((p) => shapeById(p.id).cells.length === 2).length;
    if (dominoes / all.length > (spec.maxDominoShare ?? 1)) continue;
    // every pool shape the spec lists must appear at least once (variety)
    const kinds = new Set(all.map((p) => shapeById(p.id).kind));
    const wanted = new Set(spec.orientations.map((id) => shapeById(id).kind));
    if (kinds.size < Math.min(wanted.size, spec.minKinds ?? 3)) continue;
    // paint
    const grids = spec.segments.map((sg) => new Array<string>(W * sg.rows).fill('.'));
    let tonedLeft = spec.twoTone?.count ?? 0;
    const cand = all
      .map((_, i) => i)
      .filter((i) => {
        const k = shapeById((all[i] as { id: ShapeId }).id).kind;
        return spec.twoTone?.shapes ? spec.twoTone.shapes.includes(k) : true;
      });
    const segIndex: number[] = tiles.flatMap((t, k) => (t ?? []).map(() => k));
    // v3c pallets: `layers` pieces of each pallet orientation, one colour per pallet (never two-tone)
    const palletColor = new Map<number, string>();
    let palletsOk = true;
    (spec.palletShapes ?? []).forEach((id, k) => {
      const layers = spec.pallets?.layers ?? 0;
      // the latest-built pieces of that orientation (story 1: a pallet stands on the ground, under the blocks that
      // are needed before it — the reverse stack of the generator; K-58 item 9 g, U-v3c-8)
      const order = (i: number): number =>
        (segIndex[i] ?? 0) * 1000 + (all[i]?.y ?? 0) * 10 + (all[i]?.x ?? 0);
      const free = all
        .flatMap((p, i) => (p.id === id && !palletColor.has(i) ? [i] : []))
        .sort((x, y) => order(y) - order(x))
        .slice(0, layers + 1);
      if (k >= (spec.pallets?.count ?? 0) || free.length < layers) {
        palletsOk = palletsOk && k >= (spec.pallets?.count ?? 0);
        return;
      }
      const c = spec.colors[rng.nextInt(spec.colors.length)] as string;
      for (let n = 0; n < layers; n++) {
        const i = free.splice(rng.nextInt(free.length), 1)[0] as number;
        palletColor.set(i, c);
      }
    });
    if (!palletsOk) continue;
    const toneAt = new Set<number>();
    const toneCand = cand.filter((i) => !palletColor.has(i));
    while (tonedLeft > 0 && toneCand.length > 0) {
      const i = toneCand.splice(rng.nextInt(toneCand.length), 1)[0] as number;
      toneAt.add(i);
      tonedLeft--;
    }
    const rare =
      spec.rareFirst !== undefined ? (spec.colors[rng.nextInt(spec.colors.length)] as string) : null;
    const firstCount = (tiles[0] ?? []).filter((q) => q.y === 0).length;
    let rareLeft = Math.max(0, (spec.rareFirst ?? 0) - firstCount);
    let idx = 0;
    tiles.forEach((t, k) => {
      for (const p of t as { id: ShapeId; x: number; y: number }[]) {
        const s = shapeById(p.id);
        let colors: string[];
        const pc = palletColor.get(idx);
        if (pc !== undefined) {
          colors = s.cells.map(() => pc);
        } else if (toneAt.has(idx) && spec.twoTone) {
          const okPairs = spec.twoTone.pairs.filter((q) => rare === null || !q.includes(rare));
          const pair = (okPairs.length > 0 ? okPairs : spec.twoTone.pairs)[
            rng.nextInt(Math.max(1, okPairs.length || spec.twoTone.pairs.length))
          ] as string;
          colors = s.cells.map((_, c) => pair[c % 2] as string);
          // shuffle so both orientations of a pair occur
          for (let i = colors.length - 1; i > 0; i--) {
            const j = rng.nextInt(i + 1);
            [colors[i], colors[j]] = [colors[j] as string, colors[i] as string];
          }
          if (new Set(colors).size < 2)
            colors[0] = pair[0] === colors[0] ? (pair[1] as string) : (pair[0] as string);
        } else {
          let c: string;
          if (rare !== null) {
            const first = k === 0 && p.y === 0;
            if (first) c = rare;
            else {
              // horizontal colour bands (two rows each, shifted per floor) read as a building; 25 % random pieces
              const others = spec.colors.replace(rare, '');
              const useRare = rareLeft > 0 && rng.next() < 0.3;
              if (useRare) rareLeft--;
              const band = (Math.floor(p.y / 2) + k) % others.length;
              c = useRare ? rare : (others[rng.next() < 0.25 ? rng.nextInt(others.length) : band] as string);
            }
          } else c = spec.colors[rng.nextInt(spec.colors.length)] as string;
          colors = s.cells.map(() => c);
        }
        s.cells.forEach((cell, ci) => {
          (grids[k] as string[])[(p.y + cell.y) * W + p.x + cell.x] = colors[ci] as string;
        });
        idx++;
      }
    });
    const pieces = tiles.flat() as { id: ShapeId; x: number; y: number }[];
    const segOf: number[] = tiles.flatMap((t, k) => (t ?? []).map(() => k));
    // per piece: its cell colours (shape cell order), read back from the painted grid
    const paint = pieces.map((p, i) =>
      shapeById(p.id)
        .cells.map((c) => (grids[segOf[i] ?? 0] as string[])[(p.y + c.y) * W + p.x + c.x] as string)
        .join(''),
    );
    let built = buildPlan(spec, W, tiles as { id: ShapeId; x: number; y: number }[][], paint);
    if (W >= 3) {
      // K-63 D-103 annex: a 3-column plan must be trap free (`plan_trap`, a generator constraint). A random painting
      // almost never is (D2 / C3 in three colours steal each other's cells), so the one-colour pieces that are not
      // pallet layers are repainted by a seeded hill climb on the trap count (accept ≤, so plateaus are crossed).
      const free = paint.flatMap((c, i) => (new Set(c).size === 1 && !palletColor.has(i) ? [i] : []));
      let cur = planTraps(spec, built);
      for (let step = 0; step < (spec.trapRepair ?? 800) && cur !== 0 && free.length > 0; step++) {
        const i = free[rng.nextInt(free.length)] as number;
        const old = paint[i] as string;
        const c = spec.colors[rng.nextInt(spec.colors.length)] as string;
        if (c === old[0]) continue;
        paint[i] = old.replace(/./g, c);
        const next = buildPlan(spec, W, tiles as { id: ShapeId; x: number; y: number }[][], paint);
        const v = planTraps(spec, next);
        if (v >= 0 && (cur < 0 || v <= cur)) {
          cur = v;
          built = next;
        } else paint[i] = old;
      }
      if (cur !== 0) continue;
      // K-31: the level keeps its whole colour set
      if (new Set(paint.join('')).size < spec.colors.length) continue;
    }
    const { segments, tiling } = built;
    return {
      id: spec.id,
      name: spec.name,
      difficulty: spec.difficulty,
      ...(spec.teaches ? { teaches: spec.teaches } : {}),
      yard: spec.yard,
      site: { cols: W, rows: Math.max(...spec.segments.map((s) => s.rows)) },
      wall: spec.wall,
      ...(spec.gravity ? { gravity: spec.gravity } : {}),
      segments,
      shapes: [...new Set(spec.orientations.map((id) => shapeById(id).kind))],
      orientations: spec.orientations,
      ...(spec.twoTone ? { twoTone: { pairs: spec.twoTone.pairs, max: spec.twoTone.count } } : {}),
      ...(spec.pallets ? { pallets: spec.pallets } : {}),
      ...(spec.traits ? { traits: spec.traits } : {}),
      blocks: spec.blocks,
      ...(spec.maxDominoShare !== undefined ? { maxDominoShare: spec.maxDominoShare } : {}),
      ...(spec.tutorial ? { tutorial: spec.tutorial } : {}),
      tiling,
    };
  }
  throw new Error(`sample-plan: no plan within the spec (level ${spec.id}, seed ${seed})`);
}

if (process.argv[1]?.endsWith('sample-plan.ts')) {
  const spec = JSON.parse(readFileSync(process.argv[2] as string, 'utf8')) as PlanSpec;
  process.stdout.write(`${JSON.stringify(samplePlan(spec, Number(process.argv[3] ?? 1)), null, 2)}\n`);
}
