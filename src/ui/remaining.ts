/**
 * "Kalan: {n} hücre" (UX_FLOWS §7 window 1 neutral info, `lose.left`; GDD K-15): plan cells that still have to be
 * filled, over every segment. A pure read of the core state (plan masks of the compiled level, `filledMask`); it never
 * changes the game.
 */
import { SITE_COLS } from '../core/coords.ts';
import { filledMask, hasFlag, pieceZone } from '../core/state.ts';
import type { GameState } from '../core/state.ts';
import { Zone } from '../core/types.ts';

function popcount(v: number): number {
  let n = 0;
  let x = v >>> 0;
  while (x !== 0) {
    x &= x - 1;
    n += 1;
  }
  return n;
}

export function remainingPlanCells(s: GameState): number {
  let left = 0;
  for (const seg of s.lvl.segments) {
    for (let sx = 0; sx < SITE_COLS; sx++) {
      const need = seg.planMask[sx] ?? 0;
      left += popcount(need & ~filledMask(s, seg.index, sx));
    }
  }
  return left;
}

/**
 * Blocks still to place (ANALYTICS §2 v6 `level_end.blocksLeft`; UX §5.9 "N − correctly placed"; GDD K-48): pieces in
 * play that are not locked on the site — in the yard, in the truck queue, in undelivered batches, or on the site as
 * debris / a stuck mortar block. A pure read of the core state. Faz 2 core: every piece counts; the Faz 2R core (TECH
 * §2R.2, WP-C) excludes cargo (I5 / Q9) and moves this query to `core/summary.ts` (WP-P).
 */
export function remainingBlocks(s: GameState): number {
  let left = 0;
  for (let id = 0; id < s.lvl.layout.counts.pieces; id++) {
    const zone = pieceZone(s, id);
    if (zone === Zone.gone) continue;
    if (zone === Zone.site && hasFlag(s, id, 'locked')) continue;
    left += 1;
  }
  return left;
}
