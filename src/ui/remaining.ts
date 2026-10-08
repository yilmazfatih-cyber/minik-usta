/**
 * "Kalan: {n} hücre" (UX_FLOWS §7 window 1 neutral info, `lose.left`; GDD K-15): plan cells that still have to be
 * filled, over every segment. A pure read of the core state (plan masks of the compiled level, `filledMask`); it never
 * changes the game.
 */
import { blocksLeft } from '../core/goals.ts';
import { filledMask } from '../core/state.ts';
import type { GameState } from '../core/state.ts';

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
    for (let sx = 0; sx < s.lvl.geo.ws; sx++) {
      const need = seg.planMask[sx] ?? 0;
      left += popcount(need & ~filledMask(s, seg.index, sx));
    }
  }
  return left;
}

/**
 * Blocks still to place (UX §5.9 item 1 "kalan blok", `lose.blocksLeft`, ANALYTICS §2 v6 `level_end.blocksLeft`; GDD
 * K-47, K-48; TECH §2R.2): `N − correctly placed material blocks`, the core's single formula (`core/goals.ts`
 * `blocksLeft`; Ağır Yük, crates and bags never count, a held block is not counted twice, Söküm / Undo give it back).
 */
export function remainingBlocks(s: GameState): number {
  return blocksLeft(s);
}

/**
 * UX §5.1 "Az hamle uyarısı" (Faz 2R, DL-2R-19; JUICE #51): the moves plate turns red and pulses when
 * `movesLeft − blocksLeft ≤ 1` or `movesLeft ≤ 2` (a flawless player of levels 5–10 ends with 3–4 moves left and
 * never sees it). The old "last 5 moves" trigger is gone.
 */
export function lowMovesWarning(movesLeft: number, blocksLeft: number): boolean {
  return movesLeft - blocksLeft <= 1 || movesLeft <= 2;
}
