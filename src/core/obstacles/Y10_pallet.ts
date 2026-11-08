/**
 * Y10 Palet — pallet (docs/OBSTACLES.md "Bölümler v3" Y10; docs/GDD.md §16 ÖNERİ K-58, K-65 item 1, K-66; first level 3
 * in the v3 plan).
 *
 * Rule: blocks with the same `stack.id` lie on the same cells, layer `z` 0 at the bottom. Only the top layer can be
 * held (K-09; a covered layer gives `covered`, no move); the pallet's cells stay full while a layer is left (the layer
 * below takes the occupancy when the top leaves), so the held top layer cannot be dropped onto its own cells (its start
 * node is the K-07 row 1 cancel) and a lifted layer never goes back. Crane and Golden Trowel target only the top layer
 * (K-66 item 1), the brush only the top layer (item 2), the hammer never a layer (item 3). Undo and Söküm restore the
 * buffer, so the layer is back on its pallet (K-58 item 6).
 *
 * Pallets are a core model (CompiledPiece `stackBelow`, grid `layerBelow` / `isCovered` / `ownCellCode`, movement
 * `covered`, gravity skips covered layers), so this plugin carries no hook.
 */
import type { ObstacleRule } from './types.ts';
import { defineRule, obstacleInfoKey, usesMechanic } from './types.ts';

export const Y10_pallet: ObstacleRule = defineRule({
  id: 'Y10',
  zone: 'yard',
  order: 210,
  infoKeys: [obstacleInfoKey('Y10')],
  appliesTo: (lvl) => usesMechanic(lvl, 'Y10'),
});
