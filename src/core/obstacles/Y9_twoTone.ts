/**
 * Y9 İki Renkli Blok — two-tone block (docs/OBSTACLES.md "Bölümler v3" Y9; docs/GDD.md §16 ÖNERİ K-57, K-65 item 3;
 * first level 5 in the v3 plan).
 *
 * Rule: a block with `colors` has one colour per cell (the shape's (y, x) cell order). A correct placement needs every
 * cell on a plan cell of its own colour (K-16 per cell); supply / demand count cell colours (K-47); a W6 paint gate does
 * not repaint it, the paint brush cannot pick it and the crane does not turn it (K-57 items 5–6).
 *
 * Per-cell colour is a core model (CompiledPiece `cellColors`, state `pieceCellColor`, placement `isCorrectPlacement`,
 * D3a classes, cover totals), so this plugin carries no hook: it declares the rule for the level and its info card.
 */
import type { ObstacleRule } from './types.ts';
import { defineRule, obstacleInfoKey, usesMechanic } from './types.ts';

export const Y9_twoTone: ObstacleRule = defineRule({
  id: 'Y9',
  zone: 'yard',
  order: 209,
  infoKeys: [obstacleInfoKey('Y9')],
  appliesTo: (lvl) => usesMechanic(lvl, 'Y9'),
});
