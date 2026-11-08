/**
 * Y12 Bonus Blok — bonus block (docs/OBSTACLES.md "Bölümler v3" Y12; docs/GDD.md §16 ÖNERİ K-60, K-62; first level 9 in
 * the v3 plan).
 *
 * Rule: K-35 step 4, after the cost, a correct placement (drag, crane or Golden Trowel) of a `bonus` block adds its
 * `bonusMoves` (1–3, default 2) to the counter (`movesChanged { reason: 'bonus' }`) and the badge goes (the flag is
 * cleared); so a last move that hits 0 and places the bonus block keeps the level going (step 11 reads the counter
 * after the bonus). A wrong placement or a shift gives nothing. Undo and Söküm take the bonus back (core buffer).
 * The move budget rule (K-62, `k`) is the validator's / solver's; the core only adds the moves.
 */
import { hasFlag, setFlag } from '../state.ts';
import { DEFAULT_BONUS_MOVES } from '../level/compile.ts';
import type { ObstacleRule } from './types.ts';
import { defineRule, obstacleInfoKey, usesMechanic } from './types.ts';

export const Y12_bonus: ObstacleRule = defineRule({
  id: 'Y12',
  zone: 'yard',
  order: 212,
  infoKeys: [obstacleInfoKey('Y12')],
  appliesTo: (lvl) => usesMechanic(lvl, 'Y12'),
  placementBonus: (ctx, id) => {
    if (!hasFlag(ctx.s, id, 'bonus')) return 0;
    setFlag(ctx.s, id, 'bonus', false);
    const n = ctx.lvl.pieces[id]?.bonusMoves ?? 0;
    return n > 0 ? n : DEFAULT_BONUS_MOVES;
  },
});
