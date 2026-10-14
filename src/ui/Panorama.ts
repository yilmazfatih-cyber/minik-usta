/**
 * Panorama strip (GDD K-06; UX_FLOWS §5.1; TECH_DESIGN §1.2, §10.3): a small preview of every segment of the plan in
 * `layout.top.panorama`. It only draws the data of core `panoramaView(state)` (a pure read; it never changes the game):
 * segments side by side as Ws-column strips (UX §5.8 rule 6, K-49: the level's site width), bottom-aligned on a common base, the block vertically centred in the strip;
 * completed segments in full block colour, the active one framed in white with its plan colours, future ones with plan
 * colours at `alpha.panoramaFuture`; unrevealed `?` cells keep the `?` tag (K-32), `.` cells and cells outside the plan
 * stay empty. Cell size (UX §5.1 Faz 2 tur 2, review #7): from the level's tallest segment, `min(24, ⌊(110 − 2·pad) /
 * rows⌋)`, at least 12 px — every segment at the same scale (an 8-row plan keeps 12 px, the 3–5-row plans of levels
 * 1–5 get 18–24 px).
 *
 * Built from boot-atlas frames scaled down (≤ 16 images per segment); no RenderTexture. The tap → large preview is
 * MVP-lite UI work (TECH §14.1 #12).
 */
import type Phaser from 'phaser';
import type { PanoramaSegment } from '../core/panorama.ts';
import type { Rect } from '../theme/layout.ts';
import { FRAME, planFrameName } from '../theme/textures.ts';
import type { FrameRef } from '../theme/textures.ts';
import { TOKENS } from '../theme/tokens.ts';

/** Frame lookup the strip needs (scenes/atlas.ts `Frames`). */
export interface PanoramaFrames {
  ref(name: string): FrameRef;
}

export interface PanoramaStyle {
  /** Depth of the strip (HUD). */
  readonly depth: number;
  /** Inner padding and active-frame line width (px), gap between segments (cells). */
  readonly padPx: number;
  /** Cell size bounds (UX §5.1: 24 px at most, 12 px at least). */
  readonly maxCellPx: number;
  readonly minCellPx: number;
  readonly gapCells: number;
  readonly framePx: number;
}

/**
 * Where the tutorial's panorama arrow points (UX §13.2; pure, exported for tests):
 * - `right` (Bölüm 5 adım 1): from the active segment's strip to the next one;
 * - `up` (Bölüm 2 adım 1, single-segment plan): inside the active strip, from its bottom row to its top row ("alttan
 *   üste").
 * `from` / `to` are the two end rects; null when there is no active segment, or a multi-segment plan has no next one.
 */
export interface PanoramaArrowPair {
  readonly from: Rect;
  readonly to: Rect;
  readonly dir: 'right' | 'up';
}

export function panoramaArrowPair(
  rect: Rect,
  segments: readonly PanoramaSegment[],
  style: Pick<PanoramaStyle, 'padPx' | 'gapCells' | 'maxCellPx' | 'minCellPx'>,
): PanoramaArrowPair | null {
  const active = segments.findIndex((v) => v.status === 'active');
  const here = active < 0 ? null : panoramaSlot(rect, segments, active, style);
  if (!here) return null;
  if (segments.length === 1) {
    const row = here.h / Math.max(1, segments[active]?.rows.length ?? 1);
    return {
      from: { x: here.x, y: here.y + here.h - row, w: here.w, h: row },
      to: { x: here.x, y: here.y, w: here.w, h: row },
      dir: 'up',
    };
  }
  const next = panoramaSlot(rect, segments, active + 1, style);
  return next ? { from: here, to: next, dir: 'right' } : null;
}

/**
 * Pose of the 64 × 40 arrow (drawn pointing right) at `slide` px of its loop (0 … `VIEW.panoramaArrowSlidePx`): centred
 * between the two end rects; `right` slides right, `up` is turned −90° and slides up (UX §13.2: 16 px every 1,2 s).
 */
export function panoramaArrowPose(
  pair: PanoramaArrowPair,
  slide: number,
  slidePx: number,
): { readonly x: number; readonly y: number; readonly rotation: number } {
  if (pair.dir === 'up') {
    const x = pair.from.x + pair.from.w / 2;
    const y = (pair.from.y + pair.from.h / 2 + pair.to.y + pair.to.h / 2) / 2 + slidePx / 2;
    return { x, y: y - slide, rotation: -Math.PI / 2 };
  }
  const y = (pair.from.y + pair.from.h / 2 + pair.to.y + pair.to.h / 2) / 2;
  const x = (pair.from.x + pair.from.w + pair.to.x) / 2 - slidePx / 2;
  return { x: x + slide, y, rotation: 0 };
}

/** Cell size and origin of the strip for `segments` in `rect` (pure; exported for tests). */
export function panoramaGeometry(
  rect: Rect,
  segments: readonly PanoramaSegment[],
  style: Pick<PanoramaStyle, 'padPx' | 'gapCells' | 'maxCellPx' | 'minCellPx'>,
): { cell: number; x0: number; bottom: number; colW: number; step: number } {
  const n = Math.max(1, segments.length);
  const rows = Math.max(1, ...segments.map((s) => s.rows.length));
  const cols = Math.max(1, ...segments.map((s) => s.rows[0]?.length ?? 0));
  const innerW = rect.w - 2 * style.padPx;
  const innerH = rect.h - 2 * style.padPx;
  const byH = Math.floor(innerH / rows);
  const byW = Math.floor(innerW / (cols * n + style.gapCells * (n - 1)));
  const cell = Math.max(1, Math.min(byW, Math.max(style.minCellPx, Math.min(style.maxCellPx, byH))));
  const colW = cols * cell;
  const step = colW + style.gapCells * cell;
  const total = n * colW + (n - 1) * style.gapCells * cell;
  // the tallest segment is vertically centred; the others stand on the same base
  const bottom = rect.y + (rect.h + rows * cell) / 2;
  return { cell, x0: rect.x + (rect.w - total) / 2, bottom, colW, step };
}

/** UX §5.9 item 8 (DS-12): inner pad of the well around the level label and the panorama. */
export const WELL_LABEL_PAD_PX = 24;

/**
 * UX §5.9 item 8 (2026-10-08, DS-12): the "BÖLÜM {n}" label sits at the left of the panorama well (pad 24, `labelW`
 * wide, vertically centred) and the panorama is centred in the rest (`label right + 24 … well right − 24`) at its own
 * cell size (§5.8 rule 6). When the panorama would have to shrink to fit there (Faz 3 plans with 4+ segments), there is
 * no label and the panorama uses the whole well. Pure.
 */
export function panoramaWellSplit(
  well: Rect,
  segments: readonly PanoramaSegment[],
  style: Pick<PanoramaStyle, 'padPx' | 'gapCells' | 'maxCellPx' | 'minCellPx'>,
  labelW: number,
  padPx: number = WELL_LABEL_PAD_PX,
): { readonly label: Rect | null; readonly strip: Rect } {
  const label = { x: well.x + padPx, y: well.y, w: labelW, h: well.h };
  const x = label.x + labelW + padPx;
  const strip = { x, y: well.y, w: well.x + well.w - padPx - x, h: well.h };
  if (labelW <= 0 || strip.w <= 2 * style.padPx || segments.length === 0) return { label: null, strip: well };
  const rows = Math.max(1, ...segments.map((sg) => sg.rows.length));
  const natural = Math.max(
    style.minCellPx,
    Math.min(style.maxCellPx, Math.floor((well.h - 2 * style.padPx) / rows)),
  );
  return panoramaGeometry(strip, segments, style).cell < natural
    ? { label: null, strip: well }
    : { label, strip };
}

/** Column of segment `index` in the strip (JUICE #18: the completed segment flies here). */
export function panoramaSlot(
  rect: Rect,
  segments: readonly PanoramaSegment[],
  index: number,
  style: Pick<PanoramaStyle, 'padPx' | 'gapCells' | 'maxCellPx' | 'minCellPx'>,
): Rect | null {
  const seg = segments[index];
  if (!seg) return null;
  const geo = panoramaGeometry(rect, segments, style);
  const h = seg.rows.length * geo.cell;
  return { x: geo.x0 + index * geo.step, y: geo.bottom - h, w: geo.colW, h };
}

export class Panorama {
  private readonly scene: Phaser.Scene;
  private readonly style: PanoramaStyle;
  private readonly imgs: Phaser.GameObjects.Image[] = [];
  private used = 0;

  constructor(scene: Phaser.Scene, style: PanoramaStyle) {
    this.scene = scene;
    this.style = style;
  }

  /** Redraws the strip for `segments` in `rect`. */
  draw(rect: Rect, segments: readonly PanoramaSegment[], frames: PanoramaFrames): void {
    for (let i = 0; i < this.used; i++) this.imgs[i]?.setVisible(false);
    this.used = 0;
    if (segments.length === 0) return;
    const geo = panoramaGeometry(rect, segments, this.style);
    const px = frames.ref(FRAME.whitePixel);
    const backing = TOKENS.color.board.blueprint;
    const tint = (hex: string): number => Number.parseInt(hex.slice(1), 16);

    segments.forEach((seg, i) => {
      const left = geo.x0 + i * geo.step;
      const h = seg.rows.length * geo.cell;
      const top = geo.bottom - h;
      this.rect(px, left, top, geo.colW, h, tint(backing), 1);
      seg.rows.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell === null || cell === '.') return;
          const x = left + c * geo.cell;
          const y = top + r * geo.cell;
          if (seg.status === 'done' && cell !== '?') {
            this.rect(px, x, y, geo.cell, geo.cell, tint(TOKENS.color.block[cell]), 1);
            return;
          }
          const ref = frames.ref(cell === '?' ? FRAME.hidden : planFrameName(cell));
          const img = this.take();
          img.setTexture(ref.key, ref.frame).setOrigin(0, 0).setPosition(x, y);
          img.setDisplaySize(geo.cell, geo.cell).clearTint();
          img.setAlpha(seg.status === 'future' ? TOKENS.alpha.panoramaFuture : 1);
        });
      });
      if (seg.status === 'active') {
        const f = this.style.framePx;
        const white = tint(TOKENS.color.ui.inkOnDark);
        this.rect(px, left - f, top - f, geo.colW + 2 * f, f, white, 1);
        this.rect(px, left - f, top + h, geo.colW + 2 * f, f, white, 1);
        this.rect(px, left - f, top, f, h, white, 1);
        this.rect(px, left + geo.colW, top, f, h, white, 1);
      }
    });
  }

  /** Column of segment `index` for `segments` in `rect` (JUICE #18). */
  slot(rect: Rect, segments: readonly PanoramaSegment[], index: number): Rect | null {
    return panoramaSlot(rect, segments, index, this.style);
  }

  /** The tutorial arrow ends for this strip's style (`panoramaArrowPair`). */
  arrow(rect: Rect, segments: readonly PanoramaSegment[]): PanoramaArrowPair | null {
    return panoramaArrowPair(rect, segments, this.style);
  }

  destroy(): void {
    for (const img of this.imgs) img.destroy();
    this.imgs.length = 0;
    this.used = 0;
  }

  private take(): Phaser.GameObjects.Image {
    let img = this.imgs[this.used];
    if (!img) {
      img = this.scene.add.image(0, 0, '__WHITE');
      this.imgs.push(img);
    }
    this.used += 1;
    return img.setVisible(true).setDepth(this.style.depth).setScale(1).setAlpha(1);
  }

  private rect(px: FrameRef, x: number, y: number, w: number, h: number, color: number, alpha: number): void {
    const img = this.take();
    img.setTexture(px.key, px.frame).setOrigin(0, 0).setPosition(x, y);
    img.setDisplaySize(w, h).setTint(color).setAlpha(alpha);
  }
}
