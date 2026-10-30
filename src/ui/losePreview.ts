/**
 * "Hamleler bitti!" preview (UX_FLOWS §7 window 1 "▣ ▣ önizleme | Kalan: n blok"; ART_REFERENCE §9.7 "kalan blok
 * önizlemesi krem kart 880 × 300 içinde"; GDD K-29): which material blocks still have to be placed, and how they sit
 * in the card. Pure: the core read lists the blocks (yard, truck queue, undelivered batch — the K-48 (3) set), the row
 * layout scales them to the card. Phaser draws them from the level bake (scenes/level/LevelWindows.ts).
 */
import { isMaterial } from '../core/goals.ts';
import { pieceFlags, pieceZone, readPiece } from '../core/state.ts';
import type { GameState } from '../core/state.ts';
import { Zone } from '../core/types.ts';
import type { ColorCode, ShapeId } from '../core/types.ts';
import { shapeById } from '../core/shapes.ts';

export interface PreviewPiece {
  readonly shape: ShapeId;
  readonly color: ColorCode;
  /** Current flag bits (the baked frame of a mortar block carries its flag, theme/textures `bakedFlagsOf`). */
  readonly flags: number;
}

/** Material blocks not yet placed (K-48 (3)): in the yard, the truck queue or an undelivered batch, in id order. */
export function remainingPreviewPieces(s: GameState): PreviewPiece[] {
  const out: PreviewPiece[] = [];
  const P = s.lvl.layout.counts.pieces;
  for (let id = 0; id < P; id++) {
    if (!isMaterial(s, id)) continue;
    const zone = pieceZone(s, id);
    if (zone !== Zone.yard && zone !== Zone.queue && zone !== Zone.pending) continue;
    const v = readPiece(s, id);
    out.push({ shape: v.shape, color: v.color, flags: pieceFlags(s, id) });
  }
  return out;
}

export interface PreviewRowLayout {
  /** Cell size the blocks are drawn at (design px). */
  readonly cell: number;
  /** Centre x of each shown block relative to the row's centre, and its box. */
  readonly items: readonly { readonly cx: number; readonly w: number; readonly h: number }[];
  /** Blocks beyond `maxShown` are not drawn (the count line says how many there are). */
  readonly hidden: number;
}

/**
 * ART_REFERENCE §9.7 preview row: up to `maxShown` blocks, `cellMax` per cell, shrunk together so the row fits `width`
 * and the tallest block fits `maxH` (the card's upper band over the count line), never under `cellMin`.
 */
export function previewRow(
  pieces: readonly PreviewPiece[],
  width: number,
  cellMax: number,
  gap: number,
  maxShown: number,
  maxH = Number.POSITIVE_INFINITY,
  cellMin = 24,
): PreviewRowLayout {
  const shown = pieces.slice(0, maxShown);
  const dims = shown.map((p) => {
    const sh = shapeById(p.shape);
    return { w: sh.w, h: sh.h };
  });
  const cellsW = dims.reduce((n, d) => n + d.w, 0);
  const tallest = dims.reduce((n, d) => Math.max(n, d.h), 0);
  const gaps = Math.max(0, shown.length - 1) * gap;
  const fitW = cellsW > 0 ? (width - gaps) / cellsW : cellMax;
  const fitH = tallest > 0 ? maxH / tallest : cellMax;
  const cell = Math.max(cellMin, Math.min(cellMax, fitW, fitH));
  const total = cellsW * cell + gaps;
  let x = -total / 2;
  const items = dims.map((d) => {
    const w = d.w * cell;
    const h = d.h * cell;
    const cx = x + w / 2;
    x += w + gap;
    return { cx, w, h };
  });
  return { cell, items, hidden: pieces.length - shown.length };
}
