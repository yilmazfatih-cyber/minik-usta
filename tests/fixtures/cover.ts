/**
 * Seeded full-cover levels (GDD K-47) for property tests: the plan is painted FROM a random bottom-up tiling, so every
 * level has supply = demand per colour and at least one K-34 build. Not a test file.
 *
 * - Board: yard 6 × 6, site 2 × Hs (Hs 3–5), 1–2 segments, colours W Y G.
 * - Tiling per segment: the lowest (then leftmost) column takes a B1, D2_0, D2_90 or O4 that fits.
 * - Batch 0 = the blocks of segment 0 (one of segment 1 may be carried early, LEVELS §2.0); batch 1 (forSegment 1) =
 *   the rest of segment 1. Batch-0 blocks drop into random yard columns; batch-1 blocks get a random drop column.
 * - Extras (seeded): an Ağır Yük (Q9 / I5) in the yard; a debris B1 of segment 0 parked on its top-left cell (wrong:
 *   no support below, OBSTACLES S4).
 */
import { mulberry32 } from '../../src/core/rng.ts';
import type { Rng } from '../../src/core/rng.ts';
import type { ColorCode, ShapeId } from '../../src/core/types.ts';
import type { DebrisSpec, LevelSpec, PieceSpec } from './builders.ts';

const PALETTE: readonly ColorCode[] = ['W', 'Y', 'G'];
const YARD = { cols: 6, rows: 6 } as const;

interface Placed {
  readonly shape: ShapeId;
  readonly color: ColorCode;
  /** Local site anchor. */
  readonly sx: number;
  readonly sy: number;
}

const CELLS: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
  B1_0: [[0, 0]],
  D2_0: [
    [0, 0],
    [0, 1],
  ],
  D2_90: [
    [0, 0],
    [1, 0],
  ],
  O4_0: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
};

/** One segment: a random bottom-up tiling and the plan rows it paints (top → bottom). */
function tileSegment(rng: Rng, hs: number): { readonly pieces: Placed[]; readonly rows: string[] } {
  const h = [0, 0];
  const grid: ColorCode[][] = Array.from({ length: hs }, () => ['W', 'W']);
  const pieces: Placed[] = [];
  for (let guard = 0; guard < 64 && ((h[0] ?? 0) < hs || (h[1] ?? 0) < hs); guard++) {
    const c = (h[0] ?? 0) <= (h[1] ?? 0) ? 0 : 1;
    const y = h[c] ?? 0;
    const level = h[0] === h[1];
    const options: { shape: ShapeId; sx: number }[] = [{ shape: 'B1_0', sx: c }];
    if (y + 2 <= hs) options.push({ shape: 'D2_0', sx: c });
    if (level) options.push({ shape: 'D2_90', sx: 0 });
    if (level && y + 2 <= hs) options.push({ shape: 'O4_0', sx: 0 });
    const pick = options[rng.nextInt(options.length)] ?? { shape: 'B1_0' as ShapeId, sx: c };
    const color = PALETTE[rng.nextInt(PALETTE.length)] ?? 'W';
    for (const [dx, dy] of CELLS[pick.shape] ?? []) {
      const row = grid[y + dy];
      if (row) row[pick.sx + dx] = color;
      h[pick.sx + dx] = Math.max(h[pick.sx + dx] ?? 0, y + dy + 1);
    }
    pieces.push({ shape: pick.shape, color, sx: pick.sx, sy: y });
  }
  const rows = grid.map((r) => r.join('')).reverse();
  return { pieces, rows };
}

/** Drops blocks into the yard (heights per column), random columns where they fit; returns batch-0 specs. */
function dropInYard(rng: Rng, blocks: readonly { shape: ShapeId; color: ColorCode }[]): PieceSpec[] {
  const height = Array.from({ length: YARD.cols }, () => 0);
  const out: PieceSpec[] = [];
  for (const b of blocks) {
    const cells = CELLS[b.shape] ?? [];
    const w = Math.max(...cells.map((c) => c[0])) + 1;
    const hh = Math.max(...cells.map((c) => c[1])) + 1;
    const fits: number[] = [];
    for (let x = 0; x + w <= YARD.cols; x++) {
      const base = Math.max(...Array.from({ length: w }, (_, i) => height[x + i] ?? 0));
      if (base + hh <= YARD.rows) fits.push(x);
    }
    const x = fits[rng.nextInt(Math.max(1, fits.length))] ?? 0;
    const base = Math.max(...Array.from({ length: w }, (_, i) => height[x + i] ?? 0));
    for (let i = 0; i < w; i++) height[x + i] = base + hh;
    out.push([b.shape, b.color, x, base]);
  }
  return out;
}

/** A seeded full-cover level (see the module comment). */
export function coverLevel(seed: number): LevelSpec {
  const rng = mulberry32(seed * 7919 + 13);
  const hs = 3 + rng.nextInt(3);
  const segCount = 1 + rng.nextInt(2);
  const segs = Array.from({ length: segCount }, () => tileSegment(rng, hs));
  const seg0 = segs[0]?.pieces ?? [];
  const seg1 = segs[1]?.pieces ?? [];
  const debris: DebrisSpec[] = [];
  let yardBlocks = seg0.map((p) => ({ shape: p.shape, color: p.color }));
  // a debris B1 of segment 0 on its top-left cell (no support below → never correct there)
  const b1 = seg0.findIndex((p) => p.shape === 'B1_0');
  if (b1 >= 0 && rng.next() < 0.35 && hs >= 2) {
    const d = seg0[b1];
    if (d) debris.push(['B1_0', d.color, 6, hs - 1, 0]);
    yardBlocks = yardBlocks.filter((_, i) => i !== b1);
  }
  const carried = seg1.length > 1 && rng.next() < 0.5 ? seg1.slice(0, 1) : [];
  const truck = seg1.slice(carried.length);
  yardBlocks = [...yardBlocks, ...carried.map((p) => ({ shape: p.shape, color: p.color }))];
  const pieces = dropInYard(rng, yardBlocks);
  if (rng.next() < 0.3) {
    // an Ağır Yük on top of the yard where it fits (colour is ignored, K-44)
    const used = new Set(
      pieces.flatMap(([shape, , x, y]) => (CELLS[shape] ?? []).map(([dx, dy]) => `${x + dx},${y + dy}`)),
    );
    const q9 = rng.next() < 0.5;
    const w = q9 ? 3 : 5;
    const hh = q9 ? 3 : 1;
    outer: for (let y = YARD.rows - hh; y >= 0; y--) {
      for (let x = 0; x + w <= YARD.cols; x++) {
        let free = true;
        for (let dx = 0; dx < w && free; dx++)
          for (let dy = 0; dy < hh && free; dy++) if (used.has(`${x + dx},${y + dy}`)) free = false;
        if (free) {
          pieces.push([q9 ? 'Q9_0' : 'I5_0', 'W', x, y]);
          break outer;
        }
      }
    }
  }
  return {
    id: 1,
    moves: 60,
    yard: { ...YARD },
    site: { cols: 2, rows: hs },
    wall: { height: 2 },
    plan: segs.map((s) => s.rows),
    pieces,
    ...(truck.length > 0
      ? {
          batches: [
            {
              forSegment: 1,
              pieces: truck.map((p): PieceSpec => [p.shape, p.color, rng.nextInt(YARD.cols - 1), YARD.rows]),
            },
          ],
        }
      : {}),
    ...(debris.length > 0 ? { debris } : {}),
  };
}
