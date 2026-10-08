/**
 * Solver variants (docs/TECH_DESIGN.md §2R.5 "Varyantlar", LEVELS §2 CL-2R-13): data transforms whose `min` is compared
 * with the level's own `min` in LEVEL_REPORT (no K-50 metric, no validator code):
 * - `no-gaps`: every wall gap removed → "geçitsiz min"; a gap level needs `geçitsiz min − min ≥ 1` (LEVELS: 4, 9);
 * - `hammer-start`: every Ağır Yük (I5 / Q9) removed at the start → "Çekiç'le min"; a cargo level needs
 *   `min − Çekiç'le min ≥ 2` (LEVELS: 8, 10).
 * The variant drops `tutorial` and `targets` (piece references may change) and is not re-validated.
 */
import type { LevelData } from '../../src/core/level/schema.ts';
import { isCargo } from '../../src/core/level/mechanics.ts';
import { shapeById } from '../../src/core/shapes.ts';

export const VARIANTS = ['no-gaps', 'hammer-start'] as const;
export type VariantName = (typeof VARIANTS)[number];

export function isVariantName(v: string): v is VariantName {
  return (VARIANTS as readonly string[]).includes(v);
}

/** The variant changes this level (a gap to remove, a cargo block to smash). */
export function variantApplies(level: LevelData, v: VariantName): boolean {
  if (v === 'no-gaps') return level.wall.gaps.length > 0;
  return level.yard.batches.some((b) => b.pieces.some((p) => isCargo(shapeById(p.shape))));
}

/** The level data of a variant (a deep copy). */
export function applyVariant(level: LevelData, v: VariantName): LevelData {
  const copy = JSON.parse(JSON.stringify(level)) as LevelData;
  delete copy.tutorial;
  delete copy.targets;
  if (v === 'no-gaps') copy.wall.gaps = [];
  else
    copy.yard.batches = copy.yard.batches
      .map((b) => ({ ...b, pieces: b.pieces.filter((p) => !isCargo(shapeById(p.shape))) }))
      .filter((b, i) => i === 0 || b.pieces.length > 0);
  return copy;
}

/** LEVEL_REPORT band of a variant: `no-gaps` min − min ≥ 1, `hammer-start` min − variant min ≥ 2. */
export function variantBandOk(v: VariantName, min: number, variantMin: number | null): boolean {
  if (v === 'no-gaps') return variantMin === null || variantMin - min >= 1;
  return variantMin !== null && min - variantMin >= 2;
}
