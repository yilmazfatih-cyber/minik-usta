/**
 * Small procedural scenery of the home screen (ART §7.2 style: round shapes, 8 px ink contour, a light top highlight;
 * ART §7.4 chapter colours). Only one piece today: the foreground hedge in front of the character corner, which grounds
 * Tuna's bust (its straight lower edge would otherwise stand on the grass like a cut-out) and Kepçe on the lawn.
 * Drawn once into a baked Graphics (TECH §10.6); solid fills only (a baked buffer with gradients renders live).
 */
import type Phaser from 'phaser';
import { TOKENS } from '../../theme/tokens.ts';
import { hex } from '../text.ts';

/** ART §7 background contour (≥ 8 px). */
const INK_PX = 8;

/**
 * A hedge of overlapping round bushes, its base on `baseY`, spanning `x … x + w`, about `h` high. Circles get one shared
 * outline (all stroked first, then all filled), a darker lower band and a white highlight on the upper left of each.
 */
export function drawHedge(
  g: Phaser.GameObjects.Graphics,
  x: number,
  baseY: number,
  w: number,
  h: number,
  chapter: keyof typeof TOKENS.color.chapter = 'ch1',
): void {
  const ch = TOKENS.color.chapter[chapter];
  const ink = hex(TOKENS.color.ui.ink);
  const n = Math.max(3, Math.round(w / (h * 0.9)));
  const step = w / n;
  const blobs: { cx: number; cy: number; r: number }[] = [];
  for (let i = 0; i < n; i++) {
    // alternate radii: a lively, deterministic outline
    const r = h * (i % 2 === 0 ? 0.62 : 0.5);
    blobs.push({ cx: x + step * (i + 0.5), cy: baseY - r * 0.75, r });
  }
  g.fillStyle(ink, 1);
  for (const b of blobs) g.fillCircle(b.cx, b.cy, b.r + INK_PX);
  g.fillRect(x - INK_PX, baseY - h * 0.3, w + 2 * INK_PX, h * 0.3 + INK_PX);
  g.fillStyle(hex(ch.near), 1);
  for (const b of blobs) g.fillCircle(b.cx, b.cy, b.r);
  g.fillRect(x, baseY - h * 0.3, w, h * 0.3);
  g.fillStyle(hex(ch.mid), 1);
  for (const b of blobs) g.fillCircle(b.cx - b.r * 0.12, b.cy - b.r * 0.14, b.r * 0.78);
  g.fillStyle(0xffffff, 0.35);
  for (const b of blobs) g.fillEllipse(b.cx - b.r * 0.35, b.cy - b.r * 0.42, b.r * 0.55, b.r * 0.28);
}
