/**
 * Y13 Kaygan Blok — slippery block (docs/OBSTACLES.md "Bölümler v3" Y13; docs/GDD.md §16 ÖNERİ K-61; first level 13 in
 * the v3 plan, story chapter 2).
 *
 * Rule: a `slippery` yard block falls in K-35 step 6 like a Y6 block even when `gravity.yard` is off (K-20 rules, only
 * this block; every other block is solid for it). On the site it is an ordinary block.
 *
 * The fall is the core yard gravity (core/gravity.ts `yardEntities` takes slippery blocks), so this plugin carries no
 * hook; the fast yard path of the solver is off on such a level (tools/solver/expand.ts `fastYardBlockers`).
 */
import type { ObstacleRule } from './types.ts';
import { defineRule, obstacleInfoKey, usesMechanic } from './types.ts';

export const Y13_slippery: ObstacleRule = defineRule({
  id: 'Y13',
  zone: 'yard',
  order: 213,
  infoKeys: [obstacleInfoKey('Y13')],
  appliesTo: (lvl) => usesMechanic(lvl, 'Y13'),
});
