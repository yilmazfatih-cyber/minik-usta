/**
 * Y3 Zincir — chain (docs/OBSTACLES.md Y3; docs/GDD.md K-09 (c), K-35 step 5, K-36, K-41, K-30 D1, E-13, E-53; first
 * level 24).
 *
 * Rule: a `chained` yard block cannot be held (K-09 (c)) nor taken by the crane, but falls with yard gravity. The chain
 * goes (and `clear: chain` counts 1, K-41) when:
 * - a neighbour moves (K-35 step 5 / 6 neighbour effect: a block whose start cells — or pre-fall cells — touch it);
 * - Faz 2R (full cover, E-53): at the end of step 5 no block, Ağır Yük, crate or bag is left on its 4-neighbourhood
 *   (inside the yard; the wall boundary is never crossed) — otherwise it could never be freed and the yard would never
 *   empty (K-48);
 * - the hammer hits it (K-36: the chain, not the block);
 * - the truck help D1 lifts every chain (K-30).
 * Chains are released in (y, x) order of the blocks' anchors.
 */
import { Zone } from '../types.ts';
import type { PieceId } from '../types.ts';
import { hasFlag, pieceShape, pieceX, pieceY, pieceZone, setFlag, yardOcc } from '../state.ts';
import type { GameState } from '../state.ts';
import { shapeByIndex } from '../shapes.ts';
import { neighbors4 } from '../coords.ts';
import { addGoalCount } from '../goals.ts';
import type { ObstacleRule, RuleContext } from './types.ts';
import { defineRule, obstacleInfoKey, usesMechanic } from './types.ts';

function chainedYard(s: GameState, id: PieceId): boolean {
  return pieceZone(s, id) === Zone.yard && hasFlag(s, id, 'chained');
}

/** Removes the chain of `id`, counts `clear: chain` and emits `chainReleased` (K-41). */
function release(ctx: RuleContext, id: PieceId): void {
  setFlag(ctx.s, id, 'chained', false);
  addGoalCount(ctx.s, 'chain', 1);
  ctx.emit({ t: 'chainReleased', pieceId: id });
}

/** Chained yard blocks in (y, x) order of their anchors (K-35 processing order). */
function chainedBlocks(s: GameState): PieceId[] {
  const out: PieceId[] = [];
  const P = s.lvl.layout.counts.pieces;
  for (let id = 0; id < P; id++) if (chainedYard(s, id)) out.push(id);
  return out.sort((a, b) => pieceY(s, a) - pieceY(s, b) || pieceX(s, a) - pieceX(s, b) || a - b);
}

/** E-53: some yard cell next to the block holds another block, an Ağır Yük, a crate or a bag. */
function hasNeighbour(s: GameState, id: PieceId): boolean {
  const shape = shapeByIndex(pieceShape(s, id));
  const x0 = pieceX(s, id);
  const y0 = pieceY(s, id);
  const self = id + 1;
  for (const c of shape.cells) {
    for (const n of neighbors4(s.lvl.geo, x0 + c.x, y0 + c.y)) {
      const v = yardOcc(s, n.ix, n.iy);
      if (v !== 0 && v !== self) return true;
    }
  }
  return false;
}

export const Y3_chain: ObstacleRule = defineRule({
  id: 'Y3',
  zone: 'yard',
  order: 203,
  infoKeys: [obstacleInfoKey('Y3')],
  appliesTo: (lvl) => usesMechanic(lvl, 'Y3'),
  owns: { pieceFlag: 'chained' },
  canPick: (s, id) => !hasFlag(s, id, 'chained'),
  onNeighborMoved: (ctx, entity) => {
    if (entity.kind !== 'piece' || !chainedYard(ctx.s, entity.id)) return 'none';
    release(ctx, entity.id);
    return 'affected';
  },
  afterNeighbors: (ctx) => {
    for (const id of chainedBlocks(ctx.s)) if (!hasNeighbour(ctx.s, id)) release(ctx, id);
  },
  canHammer: (s, entity) => entity.kind === 'piece' && chainedYard(s, entity.id),
  onHammer: (ctx, entity) => {
    if (entity.kind === 'piece') release(ctx, entity.id);
    return 'chain';
  },
  onTruckHelp: (ctx) => {
    const ids = chainedBlocks(ctx.s);
    for (const id of ids) release(ctx, id);
    return ids.length > 0;
  },
});
