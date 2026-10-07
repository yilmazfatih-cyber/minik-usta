/**
 * Mechanic data signatures (GDD K-45/10, R-21; TECH_DESIGN §8.3, §2R.3 CL-2R-12): the code twin of the OBSTACLES
 * "Veri imzası" table (Faz 2R: W1 first level 4, W2 `height = H`, Y5 = I5/Q9 Ağır Yük, S2 out of the MVP, S9 new).
 * A level's mechanic set is derived ONLY from its data; `teaches` adds nothing (it is checked by L-16).
 */
import { DEFAULT_SIZES, MAX_BOARD_ROWS } from '../geometry.ts';
import { ALWAYS_HEAVY, shapeById } from '../shapes.ts';
import type { ShapeDef } from '../shapes.ts';
import { MECHANIC_IDS } from './schema.ts';
import type { LevelData, MechanicId, PieceData } from './schema.ts';

export interface MechanicSignature {
  readonly id: MechanicId;
  /** OBSTACLES "İlk bölüm" column (design data; the derivation never uses it). */
  readonly firstLevel: number;
  readonly detect: (level: LevelData) => boolean;
}

function allPieces(level: LevelData): PieceData[] {
  return level.yard.batches.flatMap((b) => b.pieces);
}
function anyFlag(level: LevelData, flag: NonNullable<PieceData['flags']>[number]): boolean {
  return allPieces(level).some((p) => p.flags?.includes(flag) ?? false);
}
function anyGap(level: LevelData, type: LevelData['wall']['gaps'][number]['type']): boolean {
  return level.wall.gaps.some((g) => g.type === type);
}
function anyObstacle(level: LevelData, type: LevelData['obstacles'][number]['type']): boolean {
  return level.obstacles.some((o) => o.type === type);
}

/**
 * Ağır Yük (Y5, GDD K-44 Faz 2R): I5 and Q9 in every orientation; not material, no colour. Same predicate as
 * movement.ts `isCargoShape` (a test keeps them equal); read from shapes.ts so the level modules stay out of the
 * movement → grid → compile import cycle.
 */
export function isCargo(shape: ShapeDef): boolean {
  return ALWAYS_HEAVY.has(shape.kind);
}

/**
 * Board height H = max(Hy, Hs + eMax) (K-49) from the data, without building a `BoardGeo`: it never throws on a level
 * whose sizes break the frame (L-28 reports those), and it clamps like `makeGeo`.
 */
export function boardHeight(level: LevelData): number {
  const hy = level.yard.rows ?? DEFAULT_SIZES.hy;
  const hs = level.site?.rows ?? DEFAULT_SIZES.hs;
  const eMax = level.build.elevator ? Math.max(0, level.build.elevator.range[1]) : 0;
  return Math.min(MAX_BOARD_ROWS, Math.max(hy, hs + eMax));
}

/** One row per OBSTACLES "Veri imzası" line (Faz 2R), same order. */
export const MECHANICS: readonly MechanicSignature[] = [
  { id: 'W1', firstLevel: 4, detect: (l) => anyGap(l, 'static') },
  { id: 'W2', firstLevel: 6, detect: (l) => l.wall.height === boardHeight(l) },
  // N2: W3 is a size, not a type.
  { id: 'W3', firstLevel: 9, detect: (l) => l.wall.gaps.some((g) => g.size === 1) },
  { id: 'W4', firstLevel: 13, detect: (l) => anyGap(l, 'shutter') },
  { id: 'W5', firstLevel: 16, detect: (l) => anyGap(l, 'slider') },
  { id: 'W6', firstLevel: 22, detect: (l) => anyGap(l, 'paint') },
  { id: 'W7', firstLevel: 26, detect: (l) => anyGap(l, 'locked') },
  { id: 'W8', firstLevel: 32, detect: (l) => l.wall.fan !== undefined },
  { id: 'Y1', firstLevel: 11, detect: (l) => anyObstacle(l, 'crate') },
  { id: 'Y2', firstLevel: 18, detect: (l) => anyObstacle(l, 'cement_bag') },
  { id: 'Y3', firstLevel: 24, detect: (l) => anyFlag(l, 'chained') },
  { id: 'Y4', firstLevel: 28, detect: (l) => anyFlag(l, 'wet') },
  // Faz 2R: Ağır Yük = I5/Q9 in any batch (K-44); the w ≥ 3 "heavy" orientations are material blocks now.
  { id: 'Y5', firstLevel: 8, detect: (l) => allPieces(l).some((p) => isCargo(shapeById(p.shape))) },
  { id: 'Y6', firstLevel: 14, detect: (l) => l.gravity.yard },
  { id: 'Y7', firstLevel: 19, detect: (l) => anyObstacle(l, 'screw') },
  { id: 'Y8', firstLevel: 35, detect: (l) => anyFlag(l, 'mortar') },
  { id: 'S1', firstLevel: 5, detect: (l) => l.build.mode === 'segments' && l.build.segments.length >= 2 },
  { id: 'S3', firstLevel: 21, detect: (l) => anyFlag(l, 'glass') },
  { id: 'S4', firstLevel: 17, detect: (l) => (l.build.debris?.length ?? 0) > 0 },
  { id: 'S5', firstLevel: 31, detect: (l) => l.build.mode === 'carousel' },
  { id: 'S6', firstLevel: 37, detect: (l) => l.build.elevator !== undefined },
  { id: 'S7-R', firstLevel: 27, detect: (l) => l.build.segments.some((s) => s.hidden?.kind === 'repeat') },
  { id: 'S7-M', firstLevel: 29, detect: (l) => l.build.segments.some((s) => s.hidden?.kind === 'mirrorOf') },
  { id: 'S8', firstLevel: 38, detect: (l) => anyFlag(l, 'balloon') },
  { id: 'G-H', firstLevel: 15, detect: (l) => l.gravity.build === 'high' },
  { id: 'G-L', firstLevel: 23, detect: (l) => l.gravity.build === 'low' },
  // S9 Geniş Şantiye (K-49, R2-02): a site of 3 or 4 columns.
  { id: 'S9', firstLevel: 12, detect: (l) => (l.site?.cols ?? DEFAULT_SIZES.ws) >= 3 },
];

if (MECHANICS.length !== MECHANIC_IDS.length)
  throw new Error('mechanics table out of sync with MECHANIC_IDS');

/** The level's mechanic set, in table order. */
export function deriveMechanics(level: LevelData): MechanicId[] {
  return MECHANICS.filter((m) => m.detect(level)).map((m) => m.id);
}

/** Mechanics of `level` that are not in `previous` (the union of earlier levels' sets), in table order. */
export function newMechanics(level: LevelData, previous: ReadonlySet<MechanicId>): MechanicId[] {
  return deriveMechanics(level).filter((id) => !previous.has(id));
}
