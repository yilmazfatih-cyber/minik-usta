/**
 * `node tools/gen/sample-plan.ts <spec.json> <seed> > plan.json` — turns a level SPEC (segment count and height, colour
 * palette, shape pool, two-tone pairs, block band) into a `levels:gen` plan whose segment rows are guaranteed to be
 * tileable: every segment (2 columns wide) is tiled at random with the pool, then painted piece by piece (a two-tone
 * piece gets two colours of an allowed pair). The generator re-tiles and lays out the yard; this only designs the colour
 * plan (CL-V3-04: the layout, shape mix and colours change from level to level). Deterministic: one mulberry32 stream.
 */
import { readFileSync } from 'node:fs';
import { mulberry32 } from '../../src/core/rng.ts';
import type { Rng } from '../../src/core/rng.ts';
import { shapeById } from '../../src/core/shapes.ts';
import type { ShapeId } from '../../src/core/types.ts';
import type { GenPlan } from './generate.ts';

export interface PlanSpec {
  readonly id: number;
  readonly name: { readonly tr: string; readonly en: string };
  readonly difficulty: GenPlan['difficulty'];
  readonly teaches?: GenPlan['teaches'];
  readonly yard: { readonly cols: number; readonly rows: number };
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
  /** Random drop-sequence mutations of the picker (default 10). */
  readonly mutations?: number;
  readonly blocks: readonly [number, number];
  readonly traits?: GenPlan['traits'];
  readonly pallets?: GenPlan['pallets'];
  readonly tutorial?: GenPlan['tutorial'];
}

const W = 2;

/** One random exact cover of a W × rows grid (cells filled bottom row first, left first). */
function tileSegment(
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

export function samplePlan(spec: PlanSpec, seed: number): GenPlan {
  const rng = mulberry32(seed);
  for (let attempt = 0; attempt < 20000; attempt++) {
    const tiles = spec.segments.map((sg) => tileSegment(sg.rows, spec.orientations, rng));
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
    const toneAt = new Set<number>();
    while (tonedLeft > 0 && cand.length > 0) {
      const i = cand.splice(rng.nextInt(cand.length), 1)[0] as number;
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
        if (toneAt.has(idx) && spec.twoTone) {
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
    const segments = spec.segments.map((sg, k) => {
      const rows: string[] = [];
      for (let y = sg.rows - 1; y >= 0; y--)
        rows.push(`${(grids[k] as string[])[y * W]}${(grids[k] as string[])[y * W + 1]}`);
      return { name: sg.name, rows };
    });
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
    };
  }
  throw new Error(`sample-plan: no plan within the spec (level ${spec.id}, seed ${seed})`);
}

if (process.argv[1]?.endsWith('sample-plan.ts')) {
  const spec = JSON.parse(readFileSync(process.argv[2] as string, 'utf8')) as PlanSpec;
  process.stdout.write(`${JSON.stringify(samplePlan(spec, Number(process.argv[3] ?? 1)), null, 2)}\n`);
}
