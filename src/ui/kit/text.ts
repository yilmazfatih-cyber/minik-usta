/**
 * Kit text styles as Phaser Text (TECH §2R.7 "Yazı stilleri"). v3 (ART_REFERENCE §4; `kit.v3.text`): button label
 * (white + 0,06 em contour of the ground + 0,04 em shadow), cream / lavender counters, big number, card / row text,
 * plain scene text, the two-ring title (`addTitleTwoRing`: two stacked texts — ring 2 + shadow under ring 1 + white)
 * and the gold title (`addTitleGold`: white + brown contour, tinted top → bottom). The v2 roles (ART §8.1
 * `brightTitle`, `counter`, `panel`, `secondary`) stay for the parts not restyled yet. Numbers come from
 * theme/draw/kit.ts `textLook` and theme/draw/kitV3.ts `textLookV3`; no mask, no filter. Texts always come from i18n.
 */
import type Phaser from 'phaser';
import { LOCALE_TAGS, getLocale } from '../../services/i18n.ts';
import { textLook } from '../../theme/draw/kit.ts';
import type { TextRole as TextRoleV2 } from '../../theme/draw/kit.ts';
import { textLookV3 } from '../../theme/draw/kitV3.ts';
import type { TextRoleV3 } from '../../theme/draw/kitV3.ts';
import { TOKENS } from '../../theme/tokens.ts';
import { hex } from '../text.ts';

export type TextRole = TextRoleV2 | TextRoleV3;

const FAMILY = [TOKENS.font.family, ...TOKENS.font.fallback]
  .map((f) => (f.includes(' ') ? `"${f}"` : f))
  .join(', ');

/** Font weight per v2 role (ART §8: display / h1 800 for titles and counters, body 600 / 700 on panels). */
const WEIGHT_V2: Readonly<Record<TextRoleV2, number>> = {
  brightTitle: TOKENS.font.weight.display,
  counter: TOKENS.font.weight.display,
  panel: TOKENS.font.weight.button,
  secondary: TOKENS.font.weight.body,
};

const V2_ROLES: ReadonlySet<string> = new Set(['brightTitle', 'counter', 'panel', 'secondary']);

interface Look {
  readonly fill: string;
  readonly stroke: string | null;
  readonly strokePx: number;
  readonly shadow: string | null;
  readonly shadowDy: number;
  readonly shadowAlpha: number;
  readonly weight: number;
}

function lookOf(role: TextRole, sizePx: number, contour?: string, fill?: string): Look {
  if (V2_ROLES.has(role)) {
    const l = textLook(role as TextRoleV2, sizePx, TOKENS, contour);
    return { ...l, shadowAlpha: 1, weight: WEIGHT_V2[role as TextRoleV2] };
  }
  return textLookV3(role as TextRoleV3, sizePx, TOKENS, {
    ...(contour ? { stroke: contour } : {}),
    ...(fill ? { fill } : {}),
  });
}

/** `#RRGGBB` at alpha as a CSS colour (text shadows). */
function withAlpha(color: string, alpha: number): string {
  if (alpha >= 1) return color;
  const n = hex(color);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Phaser style of a role at `sizePx`; `contour` = the ground's stroke colour (bright title / button). */
export function kitTextStyle(
  role: TextRole,
  sizePx: number,
  contour?: string,
  weight?: number,
  fill?: string,
): Phaser.Types.GameObjects.Text.TextStyle {
  const look = lookOf(role, sizePx, contour, fill);
  const stroke = look.stroke ? Math.round(look.strokePx) : 0;
  const dy = Math.round(look.shadowDy);
  return {
    fontFamily: FAMILY,
    fontSize: `${Math.round(sizePx)}px`,
    fontStyle: String(weight ?? look.weight),
    color: look.fill,
    align: 'center',
    ...(look.stroke ? { stroke: look.stroke, strokeThickness: stroke } : {}),
    ...(look.shadow
      ? {
          shadow: {
            offsetX: 0,
            offsetY: dy,
            color: withAlpha(look.shadow, look.shadowAlpha),
            blur: 0,
            stroke: true,
            fill: true,
          },
        }
      : {}),
    // the hard shadow sits under the glyphs: room for it below, and for the contour's outer half all round
    padding: { left: 2 + stroke / 2, right: 2 + stroke / 2, top: 2, bottom: 2 + dy },
  };
}

/** Adds a kit text centred on (x, y) (origin 0.5, the shadow's padding compensated). */
export function addKitText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  role: TextRole,
  sizePx: number,
  contour?: string,
  fill?: string,
): Phaser.GameObjects.Text {
  const style = kitTextStyle(role, sizePx, contour, undefined, fill);
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

/** A two-layer title (two-ring / gold): the container and its front text (for `setText`). */
export interface LayeredTitle {
  readonly root: Phaser.GameObjects.Container;
  readonly front: Phaser.GameObjects.Text;
  readonly back: Phaser.GameObjects.Text | null;
  readonly width: number;
  setText(text: string): void;
  /** Shrinks the whole title to `maxW` (never grows). */
  fit(maxW: number): void;
}

/**
 * ART_REFERENCE §4 `titleTwoRing`: white glyphs with ring 1 (lavender) and, under them, the same glyphs with ring 2
 * (indigo, outside ring 1) and the hard shadow. Centred on (x, y) in the container's parent.
 */
export function addTitleTwoRing(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  sizePx: number,
): LayeredTitle {
  const back = addKitText(scene, 0, 0, text, 'titleRingBack', sizePx);
  const front = addKitText(scene, 0, 0, text, 'titleRingFront', sizePx);
  const root = scene.add.container(x, y, [back, front]);
  return layered(root, front, back);
}

/**
 * ART_REFERENCE §4 `titleGold`: white glyphs with the brown contour and shadow, tinted gold top → bottom (the tint
 * multiplies the white fill; the contour stays dark). Centred on (x, y).
 */
export function addTitleGold(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  sizePx: number,
): LayeredTitle {
  const g = TOKENS.kit.v3.text.titleGold;
  const front = addKitText(scene, 0, 0, text, 'titleGold', sizePx);
  front.setTint(hex(g.top), hex(g.top), hex(g.bottom), hex(g.bottom));
  const root = scene.add.container(x, y, [front]);
  return layered(root, front, null);
}

function layered(
  root: Phaser.GameObjects.Container,
  front: Phaser.GameObjects.Text,
  back: Phaser.GameObjects.Text | null,
): LayeredTitle {
  return {
    root,
    front,
    back,
    get width() {
      return front.width * root.scaleX;
    },
    setText: (text) => {
      front.setText(text);
      back?.setText(text);
    },
    fit: (maxW) => {
      root.setScale(1);
      if (front.width > maxW && front.width > 0) root.setScale(maxW / front.width);
    },
  };
}
