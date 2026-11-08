/**
 * Y11 Sargılı Blok ve Makas — wrapped block and scissors (docs/OBSTACLES.md "Bölümler v3" Y11; docs/GDD.md §16 ÖNERİ
 * K-59, K-66 items 1 and 3; first level 7 in the v3 plan).
 *
 * Rule:
 * - a `wrapped` block cannot be held (K-09 (c)), nor taken by the crane or the Golden Trowel (they ask `canPick`);
 * - K-35 step 5 of the action whose correct placement (drag, crane or Golden Trowel) puts the `scissors` block on the
 *   site: every wrap of the level goes, and the scissors flag with it (`unwrapped { by: 'scissors' }`); a wrong
 *   placement or a shift of the scissors block does nothing;
 * - the hammer cuts one wrap (K-36, analytics kind `wrap`; the block itself stays);
 * - Undo and Söküm restore the flags (core buffer).
 * Neither the wraps nor the scissors count for a `clear` goal.
 */
import { Zone } from '../types.ts';
import type { PieceId } from '../types.ts';
import { hasFlag, pieceZone, setFlag } from '../state.ts';
import type { GameState } from '../state.ts';
import { isCovered } from '../grid.ts';
import type { ObstacleRule } from './types.ts';
import { defineRule, obstacleInfoKey, usesMechanic } from './types.ts';

function wrappedYard(s: GameState, id: PieceId): boolean {
  return pieceZone(s, id) === Zone.yard && hasFlag(s, id, 'wrapped') && !isCovered(s, id);
}

export const Y11_wrap: ObstacleRule = defineRule({
  id: 'Y11',
  zone: 'yard',
  order: 211,
  infoKeys: [obstacleInfoKey('Y11')],
  appliesTo: (lvl) => usesMechanic(lvl, 'Y11'),
  owns: { pieceFlag: 'wrapped' },
  canPick: (s, id) => !hasFlag(s, id, 'wrapped'),
  onCorrectPlacement: (ctx, id) => {
    if (!hasFlag(ctx.s, id, 'scissors')) return;
    setFlag(ctx.s, id, 'scissors', false);
    const pieces: PieceId[] = [];
    const P = ctx.lvl.layout.counts.pieces;
    for (let p = 0; p < P; p++) {
      if (!hasFlag(ctx.s, p, 'wrapped')) continue;
      setFlag(ctx.s, p, 'wrapped', false);
      pieces.push(p);
    }
    ctx.emit({ t: 'unwrapped', by: 'scissors', pieceId: id, pieces });
  },
  hammerKind: 'wrap',
  canHammer: (s, entity) => entity.kind === 'piece' && wrappedYard(s, entity.id),
  onHammer: (ctx, entity) => {
    if (entity.kind === 'piece') {
      setFlag(ctx.s, entity.id, 'wrapped', false);
      ctx.emit({ t: 'unwrapped', by: 'hammer', pieceId: entity.id, pieces: [entity.id] });
    }
    return 'wrap';
  },
});
