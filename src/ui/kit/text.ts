/**
 * ART §8.1 v2 text styles as Phaser Text (TECH §2R.7 "Yazı stilleri"): bright title (white, `textStrokeEm` contour in
 * the ground's stroke colour + a hard `textShadowEm` shadow of the same colour), counter (white + 0.12 em
 * `kit.capsule.textStroke`), panel (`ui.ink`) and secondary (`ui.inkSoft`). Numbers come from theme/draw/kit.ts
 * `textLook`; no mask, no filter. Texts always come from i18n.
 */
import type Phaser from 'phaser';
import { LOCALE_TAGS, getLocale } from '../../services/i18n.ts';
import { textLook } from '../../theme/draw/kit.ts';
import type { TextRole } from '../../theme/draw/kit.ts';
import { TOKENS } from '../../theme/tokens.ts';

export type { TextRole };

const FAMILY = [TOKENS.font.family, ...TOKENS.font.fallback]
  .map((f) => (f.includes(' ') ? `"${f}"` : f))
  .join(', ');

/** Font weight per v2 role (ART §8: display / h1 800 for titles and counters, body 600 / 700 on panels). */
const WEIGHT: Readonly<Record<TextRole, number>> = {
  brightTitle: TOKENS.font.weight.display,
  counter: TOKENS.font.weight.display,
  panel: TOKENS.font.weight.button,
  secondary: TOKENS.font.weight.body,
};

/** Phaser style of a v2 role at `sizePx`; `contour` = the ground's stroke colour (bright title). */
export function kitTextStyle(
  role: TextRole,
  sizePx: number,
  contour?: string,
  weight?: number,
): Phaser.Types.GameObjects.Text.TextStyle {
  const look = textLook(role, sizePx, TOKENS, contour);
  const stroke = look.stroke ? Math.round(look.strokePx) : 0;
  const dy = Math.round(look.shadowDy);
  return {
    fontFamily: FAMILY,
    fontSize: `${Math.round(sizePx)}px`,
    fontStyle: String(weight ?? WEIGHT[role]),
    color: look.fill,
    align: 'center',
    ...(look.stroke ? { stroke: look.stroke, strokeThickness: stroke } : {}),
    ...(look.shadow
      ? {
          shadow: {
            offsetX: 0,
            offsetY: dy,
            color: look.shadow,
            blur: 0,
            stroke: true,
            fill: true,
          },
        }
      : {}),
    // the hard shadow sits under the glyphs: room for it below, and for the contour's outer half all round
    padding: { left: 2, right: 2, top: 2, bottom: 2 + dy },
  };
}

/** Adds a v2 text centred on (x, y) (origin 0.5, the shadow's padding compensated). */
export function addKitText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  role: TextRole,
  sizePx: number,
  contour?: string,
): Phaser.GameObjects.Text {
  const style = kitTextStyle(role, sizePx, contour);
  const t = scene.add.text(x, y, text, style).setOrigin(0.5, 0.5);
  centreOnGlyphs(t);
  return t;
}

/** Keeps the glyph box (not the shadow padding) centred on the origin. */
export function centreOnGlyphs(t: Phaser.GameObjects.Text): void {
  const top = t.padding.top ?? 0;
  const bottom = t.padding.bottom ?? 0;
  const h = t.height;
  if (h <= 0) return;
  // origin y so that the middle of (top pad … height − bottom pad) is at y
  const mid = (top + (h - bottom)) / 2;
  t.setOrigin(t.originX, mid / h);
}

/** Shrinks `t` uniformly so its width fits `maxW` (TR texts run longer than EN; never grows). */
export function fitWidth(t: Phaser.GameObjects.Text, maxW: number): void {
  t.setScale(1);
  if (t.width > maxW && t.width > 0) t.setScale(maxW / t.width);
}

/** A counter number in the current locale (TR "1.250", EN "1,250"; same rule as i18n `{n}`). */
export function formatCount(n: number): string {
  return new Intl.NumberFormat(LOCALE_TAGS[getLocale()], { maximumFractionDigits: 0 }).format(n);
}
