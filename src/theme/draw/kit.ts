/**
 * UI kit v2 (ART_DIRECTION §14, §2.6, §8.1; ASSET_LIST §16.5; TECH_DESIGN §2R.7; R2-12): candy buttons (4 states × 6
 * colours), round close / plus buttons, the "Bölüm N" shine band, wood-framed panel + HUD panel + inset well, ribbon,
 * square badge, counter capsule, progress bar, indigo bottom navigation, tutorial bubble + tail, highlight ring,
 * portrait ring and two small HUD badges.
 *
 * Every drawer is pure Canvas2D on a `DrawContext` at the origin of its frame; sizes come from `tokens.kit.*`. Fixed
 * size items are baked once into the `kit` atlas page (theme/textures.ts `kitAtlasFrames`); items of variable width
 * are baked at a small source size and stretched by Phaser `NineSlice` with the insets of `*Slices()` (3-slice when
 * `top = bottom = 0`). Labels are Phaser Text in the ART §8.1 looks (`textLook`), never baked.
 */
import type { Tokens } from '../tokens.ts';
import { KIT_BUTTON_COLORS, KIT_RIBBON_COLORS } from '../tokens.ts';
import { BLACK, WHITE, css, mix, parseHex, shade } from './color.ts';
import type { Rgb } from './color.ts';
import type { DrawContext, Size } from './context.ts';
import { roundRect } from './blockV2.ts';
import type { Rect } from './blockV2.ts';

export type KitButtonColor = (typeof KIT_BUTTON_COLORS)[number];
export type KitRibbonColor = (typeof KIT_RIBBON_COLORS)[number];
export { KIT_BUTTON_COLORS, KIT_RIBBON_COLORS };

/** ART §14.1 states. `locked` = `disabled` + the lock icon placed by the scene (no own frame). */
export const BUTTON_STATES = ['normal', 'pressed', 'disabled'] as const;
export type ButtonState = (typeof BUTTON_STATES)[number];

/** Insets for Phaser `NineSlice` (`top = bottom = 0` → 3-slice: the frame height is used as is). */
export interface Slices {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

const hexRgb = (h: string): Rgb => parseHex(h);

/** Vertical linear gradient with `[offset, colour, alpha]` stops. */
function vGradient(
  ctx: DrawContext,
  y0: number,
  y1: number,
  stops: readonly (readonly [number, Rgb, number?])[],
): CanvasGradient {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [o, c, a] of stops) g.addColorStop(o, css(c, a ?? 1));
  return g;
}

// ---------------------------------------------------------------------------------------------------------------
// Text looks (ART §8.1) — plain numbers for Phaser Text (`stroke`, `strokeThickness`, `shadow`)

export type TextRole = 'brightTitle' | 'counter' | 'panel' | 'secondary';

export interface TextLook {
  readonly fill: string;
  /** Contour colour or null. */
  readonly stroke: string | null;
  /**
   * Canvas line width of the contour (Phaser `strokeThickness`). Canvas strokes are centred on the glyph outline, so
   * the visible outer contour is half of it: the ART §8.1 "0,16 em" contour is `2 × 0.16 em`.
   */
  readonly strokePx: number;
  /** Hard shadow: the same text in `shadow` colour `shadowDy` px lower, drawn first (Phaser `shadowStroke` + fill). */
  readonly shadow: string | null;
  readonly shadowDy: number;
}

/**
 * ART §8.1 text look for a font size: bright title (white, `textStrokeEm` contour + `textShadowEm` shadow in the
 * ground's contour colour), counter (white + 0.12 em `kit.capsule.textStroke`), panel (`ui.ink`), secondary
 * (`ui.inkSoft`). `contour` = the ground's stroke colour for bright titles (`kit.buttonColor.<v>.stroke`,
 * `kit.ribbon.<v>.stroke`, `ui.ink` on scenes).
 */
export function textLook(role: TextRole, sizePx: number, tokens: Tokens, contour?: string): TextLook {
  const b = tokens.kit.button;
  const ui = tokens.color.ui;
  switch (role) {
    case 'brightTitle': {
      const c = contour ?? ui.ink;
      return {
        fill: '#FFFFFF',
        stroke: c,
        strokePx: 2 * b.textStrokeEm * sizePx,
        shadow: c,
        shadowDy: b.textShadowEm * sizePx,
      };
    }
    case 'counter':
      return {
        fill: '#FFFFFF',
        stroke: tokens.kit.capsule.textStroke,
        strokePx: 2 * tokens.stroke.textEm * sizePx,
        shadow: null,
        shadowDy: 0,
      };
    case 'panel':
      return { fill: ui.ink, stroke: null, strokePx: 0, shadow: null, shadowDy: 0 };
    case 'secondary':
      return { fill: ui.inkSoft, stroke: null, strokePx: 0, shadow: null, shadowDy: 0 };
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Button (ART §14.1)

export interface ButtonSpec {
  readonly color: KitButtonColor;
  readonly w: number;
  readonly h: number;
  readonly state?: ButtonState;
}

/** Corner radius r = min(radiusMaxPx, radiusHeightRatio·h). */
export function buttonRadius(h: number, tokens: Tokens): number {
  const b = tokens.kit.button;
  return Math.min(b.radiusMaxPx, b.radiusHeightRatio * h);
}

/** Frame = the button plus its drop shadow below (`dropShadowYPx`). */
export function buttonFrameSize(spec: ButtonSpec, tokens: Tokens): Size {
  return { w: spec.w, h: spec.h + tokens.kit.button.dropShadowYPx };
}

/** Face rectangle (label centre = face centre + 4 px; shine band crop) in frame px. */
export function buttonFaceRect(spec: ButtonSpec, tokens: Tokens): Rect {
  const b = tokens.kit.button;
  const top = spec.state === 'pressed' ? b.lipPx - b.pressedLipPx : 0;
  const s = b.strokePx;
  return { x: s, y: top + s, w: spec.w - 2 * s, h: spec.h - 2 * s - b.lipPx };
}

/** 3-slice insets: the corner, the gloss inset and a margin stay unstretched. */
export function buttonSlices(spec: ButtonSpec, tokens: Tokens): Slices {
  const b = tokens.kit.button;
  const side = Math.ceil(buttonRadius(spec.h, tokens) + b.strokePx + b.glossInsetXPx);
  return { left: side, right: side, top: 0, bottom: 0 };
}

/** Smallest width a 3-sliced button of height h can be drawn at (both side slices). */
export function buttonMinWidth(h: number, tokens: Tokens): number {
  const s = buttonSlices({ color: 'green', w: 0, h }, tokens);
  return s.left + s.right;
}

/**
 * ART §14.1: drop shadow → contour (`stroke`) → thickness (`lip`) → face gradient top → base (`faceGradientStop`) →
 * gloss band (white α `glossAlphaTop` → `glossAlphaBottom`). Pressed: everything above the base sinks
 * `lipPx − pressedLipPx` (10 px), the lip shows `pressedLipPx`. Disabled: gloss α `disabledGlossAlpha`.
 */
export function drawButton(ctx: DrawContext, spec: ButtonSpec, tokens: Tokens): void {
  const b = tokens.kit.button;
  const q = tokens.kit.buttonColor[spec.color];
  const state = spec.state ?? 'normal';
  const { w, h } = spec;
  const r = buttonRadius(h, tokens);
  const s = b.strokePx;
  const top = state === 'pressed' ? b.lipPx - b.pressedLipPx : 0;
  const lip = state === 'pressed' ? b.pressedLipPx : b.lipPx;
  // 1. drop shadow
  roundRect(ctx, 0, b.lipPx + b.dropShadowYPx, w, h - b.lipPx, r);
  ctx.fillStyle = css(BLACK, b.dropShadowAlpha);
  ctx.fill();
  // 2. contour, 3. thickness
  roundRect(ctx, 0, top, w, h - top, r);
  ctx.fillStyle = css(hexRgb(q.stroke));
  ctx.fill();
  roundRect(ctx, s, top + s, w - 2 * s, h - top - 2 * s, r - s);
  ctx.fillStyle = css(hexRgb(q.lip));
  ctx.fill();
  // 4. face
  const fy = top + s;
  const fh = h - top - 2 * s - lip;
  roundRect(ctx, s, fy, w - 2 * s, fh, r - s);
  ctx.fillStyle = vGradient(ctx, fy, fy + fh, [
    [0, hexRgb(q.top)],
    [b.faceGradientStop, hexRgb(q.base)],
    [1, hexRgb(q.base)],
  ]);
  ctx.fill();
  // 5. gloss band
  const gx = s + b.glossInsetXPx;
  const gy = fy + b.glossInsetYPx;
  const gh = fh * b.glossHeightRatio;
  roundRect(ctx, gx, gy, w - 2 * gx, gh, Math.max(4, r - 14));
  const a0 = state === 'disabled' ? b.disabledGlossAlpha : b.glossAlphaTop;
  ctx.fillStyle = vGradient(ctx, gy, gy + gh, [
    [0, WHITE, a0],
    [1, WHITE, state === 'disabled' ? 0 : b.glossAlphaBottom],
  ]);
  ctx.fill();
}

export type RoundGlyph = 'close' | 'plus' | 'none';

export interface RoundButtonSpec {
  readonly color: KitButtonColor;
  /** Outer diameter (frame width). */
  readonly d: number;
  readonly glyph: RoundGlyph;
  readonly state?: ButtonState;
}

export function roundButtonFrameSize(spec: RoundButtonSpec, tokens: Tokens): Size {
  return buttonFrameSize({ color: spec.color, w: spec.d, h: spec.d }, tokens);
}

/**
 * Round candy button (R2-12): red "×" close, green "+" (capsule plus, Ø `kit.capsule.plusPx`). The §14.1 layers with
 * r = d / 2; the white glyph carries a contour in the colour's `stroke` (it reads on any ground).
 */
export function drawRoundButton(ctx: DrawContext, spec: RoundButtonSpec, tokens: Tokens): void {
  const b = tokens.kit.button;
  const d = spec.d;
  // scale the thickness with small buttons (Ø 68 plus: 14 px lip would eat the face)
  const k = Math.min(1, d / 120);
  const s = Math.max(3, b.strokePx * k);
  const lipFull = Math.max(4, b.lipPx * k);
  const state = spec.state ?? 'normal';
  const top = state === 'pressed' ? lipFull * 0.7 : 0;
  const lip = state === 'pressed' ? lipFull * 0.3 : lipFull;
  const q = tokens.kit.buttonColor[spec.color];
  const r = d / 2;
  roundRect(ctx, 0, lipFull + b.dropShadowYPx * k, d, d - lipFull, r);
  ctx.fillStyle = css(BLACK, b.dropShadowAlpha);
  ctx.fill();
  roundRect(ctx, 0, top, d, d - top, r);
  ctx.fillStyle = css(hexRgb(q.stroke));
  ctx.fill();
  roundRect(ctx, s, top + s, d - 2 * s, d - top - 2 * s, r - s);
  ctx.fillStyle = css(hexRgb(q.lip));
  ctx.fill();
  const fy = top + s;
  const fh = d - top - 2 * s - lip;
  roundRect(ctx, s, fy, d - 2 * s, fh, r - s);
  ctx.fillStyle = vGradient(ctx, fy, fy + fh, [
    [0, hexRgb(q.top)],
    [b.faceGradientStop, hexRgb(q.base)],
    [1, hexRgb(q.base)],
  ]);
  ctx.fill();
  // gloss: a flattened ellipse on the upper face
  ctx.beginPath();
  ctx.ellipse(d / 2, fy + fh * 0.26, (d - 2 * s) * 0.32, fh * 0.14, 0, 0, Math.PI * 2);
  ctx.fillStyle = css(WHITE, state === 'disabled' ? b.disabledGlossAlpha : b.glossAlphaTop * 0.8);
  ctx.fill();
  if (spec.glyph === 'none') return;
  const cx = d / 2;
  const cy = fy + fh / 2;
  const arm = fh * (spec.glyph === 'close' ? 0.2 : 0.24);
  const thick = Math.max(4, fh * 0.15);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (spec.glyph === 'close') {
    ctx.moveTo(cx - arm, cy - arm);
    ctx.lineTo(cx + arm, cy + arm);
    ctx.moveTo(cx + arm, cy - arm);
    ctx.lineTo(cx - arm, cy + arm);
  } else {
    ctx.moveTo(cx - arm, cy);
    ctx.lineTo(cx + arm, cy);
    ctx.moveTo(cx, cy - arm);
    ctx.lineTo(cx, cy + arm);
  }
  ctx.lineWidth = thick + Math.max(4, thick * 0.55);
  ctx.strokeStyle = css(hexRgb(q.stroke));
  ctx.stroke();
  ctx.lineWidth = thick;
  ctx.strokeStyle = css(WHITE);
  ctx.stroke();
  ctx.restore();
}

/**
 * `ui_button_shine` (ART §14.1 "Dikkat", JUICE #98): a `shineAngleDeg` slanted white band, `shineWidthRatio · w` wide,
 * soft edges, α `shineAlpha` at its centre. The scene crops it to the face rectangle (`setCrop`, no mask).
 */
export function shineSize(spec: { readonly buttonW: number; readonly h: number }, tokens: Tokens): Size {
  const b = tokens.kit.button;
  const band = Math.round(b.shineWidthRatio * spec.buttonW);
  const slant = Math.ceil(Math.tan((b.shineAngleDeg * Math.PI) / 180) * spec.h);
  return { w: band + slant, h: spec.h };
}

export function drawButtonShine(
  ctx: DrawContext,
  spec: { readonly buttonW: number; readonly h: number },
  tokens: Tokens,
): void {
  const b = tokens.kit.button;
  const { w, h } = shineSize(spec, tokens);
  const angle = (b.shineAngleDeg * Math.PI) / 180;
  // in the rotated frame the band is a vertical strip; its horizontal width on screen is `shineWidthRatio · w`
  const across = Math.round(b.shineWidthRatio * spec.buttonW) * Math.cos(angle);
  const len = h / Math.cos(angle) + across;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(angle);
  const g = ctx.createLinearGradient(-across / 2, 0, across / 2, 0);
  g.addColorStop(0, css(WHITE, 0));
  g.addColorStop(0.5, css(WHITE, b.shineAlpha));
  g.addColorStop(1, css(WHITE, 0));
  ctx.fillStyle = g;
  ctx.fillRect(-across / 2, -len / 2, across, len);
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------
// Panels (ART §14.2)

export type PanelVariant = 'frame' | 'hud';

export function panelFrameSize(
  spec: { readonly w: number; readonly h: number; readonly variant: PanelVariant },
  tokens: Tokens,
): Size {
  const p = tokens.kit.panel;
  return { w: spec.w, h: spec.h + (spec.variant === 'frame' ? p.shadowYPx : 0) };
}

/** HUD panel corner (ART §14.2 "HUD varyantı": köşe 32). */
export const HUD_PANEL_RADIUS = 32;

export function panelSlices(variant: PanelVariant, tokens: Tokens): Slices {
  const p = tokens.kit.panel;
  if (variant === 'hud') return { left: 40, right: 40, top: 40, bottom: 40 };
  const edge = Math.max(p.radiusPx, p.outlinePx + p.framePx + p.innerLinePx + p.innerShadowPx) + 16;
  return { left: edge, right: edge, top: edge, bottom: edge + p.shadowYPx };
}

/**
 * ART §14.2 panel: drop shadow (y + `shadowYPx`) → `outline` → wood frame gradient `frameTop` → `frameBottom` (with a
 * thin light line) → `frameInner` line → cream `body` → inner shadow over the body's top `innerShadowPx`. HUD variant:
 * contour + cream body only, corner 32.
 */
export function drawPanel(
  ctx: DrawContext,
  spec: { readonly w: number; readonly h: number; readonly variant: PanelVariant },
  tokens: Tokens,
): void {
  const p = tokens.kit.panel;
  const { w, h } = spec;
  if (spec.variant === 'hud') {
    roundRect(ctx, 0, 0, w, h, HUD_PANEL_RADIUS);
    ctx.fillStyle = css(hexRgb(p.outline));
    ctx.fill();
    roundRect(
      ctx,
      p.outlinePx,
      p.outlinePx,
      w - 2 * p.outlinePx,
      h - 2 * p.outlinePx,
      HUD_PANEL_RADIUS - p.outlinePx,
    );
    ctx.fillStyle = vGradient(ctx, 0, h, [
      [0, mix(hexRgb(p.body), WHITE, 0.4)],
      [0.35, hexRgb(p.body)],
      [1, hexRgb(p.body)],
    ]);
    ctx.fill();
    return;
  }
  const o = p.outlinePx;
  const f = p.framePx;
  const l = p.innerLinePx;
  const R = p.radiusPx;
  roundRect(ctx, 0, p.shadowYPx, w, h, R);
  ctx.fillStyle = css(BLACK, p.shadowAlpha);
  ctx.fill();
  roundRect(ctx, 0, 0, w, h, R);
  ctx.fillStyle = css(hexRgb(p.outline));
  ctx.fill();
  roundRect(ctx, o, o, w - 2 * o, h - 2 * o, R - o);
  ctx.fillStyle = vGradient(ctx, o, h - o, [
    [0, hexRgb(p.frameTop)],
    [1, hexRgb(p.frameBottom)],
  ]);
  ctx.fill();
  // light line along the frame's top inner edge (wood bevel)
  roundRect(ctx, o + 3, o + 3, w - 2 * o - 6, h - 2 * o - 6, R - o - 3);
  ctx.lineWidth = 3;
  ctx.strokeStyle = css(WHITE, 0.35);
  ctx.stroke();
  roundRect(ctx, o + f, o + f, w - 2 * (o + f), h - 2 * (o + f), R - o - f);
  ctx.fillStyle = css(hexRgb(p.frameInner));
  ctx.fill();
  const bx = o + f + l;
  roundRect(ctx, bx, bx, w - 2 * bx, h - 2 * bx, Math.max(4, R - bx));
  ctx.fillStyle = css(hexRgb(p.body));
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = vGradient(ctx, bx, bx + p.innerShadowPx, [
    [0, hexRgb(p.innerShadow), p.innerShadowAlpha],
    [1, hexRgb(p.innerShadow), 0],
  ]);
  ctx.fillRect(bx, bx, w - 2 * bx, p.innerShadowPx);
  ctx.restore();
}

/** Inset well radius (ART §14.2: "köşe 24, üstte 3 px iç gölge"). */
export const INSET_RADIUS = 24;

export function insetSlices(): Slices {
  return { left: 32, right: 32, top: 32, bottom: 32 };
}

/** ART §14.2 inset well (`kit.panel.inset`): goal box, list row; 3 px inner shadow at the top. */
export function drawInset(
  ctx: DrawContext,
  spec: { readonly w: number; readonly h: number },
  tokens: Tokens,
): void {
  const p = tokens.kit.panel;
  roundRect(ctx, 0, 0, spec.w, spec.h, INSET_RADIUS);
  ctx.fillStyle = css(hexRgb(p.inset));
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = vGradient(ctx, 0, 8, [
    [0, hexRgb(p.innerShadow), 0.55],
    [1, hexRgb(p.innerShadow), 0],
  ]);
  ctx.fillRect(0, 0, spec.w, 8);
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------
// Ribbon (ART §14.3)

/** Horizontal room a tail takes outside the body (tail − 20 px hidden behind it). */
const ribbonTailOut = (tokens: Tokens): number => tokens.kit.ribbon.tailPx - 20;

export function ribbonFrameSize(spec: { readonly bodyW: number }, tokens: Tokens): Size {
  const rb = tokens.kit.ribbon;
  return { w: spec.bodyW + 2 * ribbonTailOut(tokens), h: rb.heightPx + rb.tailDropPx + rb.strokePx };
}

/** Body rectangle inside the ribbon frame (text centre = body centre). */
export function ribbonBodyRect(spec: { readonly bodyW: number }, tokens: Tokens): Rect {
  return { x: ribbonTailOut(tokens), y: 0, w: spec.bodyW, h: tokens.kit.ribbon.heightPx };
}

export function ribbonSlices(tokens: Tokens): Slices {
  const side = ribbonTailOut(tokens) + tokens.kit.ribbon.radiusPx + 48;
  return { left: side, right: side, top: 0, bottom: 0 };
}

/**
 * ART §14.3 ribbon: two tails (`dark` + contour, V notch `notchPx`, `tailDropPx` lower, 20 px behind the body) and the
 * body (contour `strokePx`, gradient top → base at 0.5, white α `glossAlpha` band over the top 35 %).
 */
export function drawRibbon(
  ctx: DrawContext,
  spec: { readonly color: KitRibbonColor; readonly bodyW: number },
  tokens: Tokens,
): void {
  const rb = tokens.kit.ribbon;
  const q = rb[spec.color];
  const out = ribbonTailOut(tokens);
  const { w } = ribbonFrameSize(spec, tokens);
  const H = rb.heightPx;
  const sp = rb.strokePx;
  const ty = rb.tailDropPx;
  const th = H - 8;
  const notch = rb.notchPx;
  const tail = (x0: number, dir: 1 | -1): void => {
    // x0 = outer end; the tail runs inwards by tailPx
    const xi = x0 + dir * rb.tailPx;
    ctx.beginPath();
    ctx.moveTo(x0, ty);
    ctx.lineTo(xi, ty);
    ctx.lineTo(xi, ty + th);
    ctx.lineTo(x0, ty + th);
    ctx.lineTo(x0 + dir * notch, ty + th / 2);
    ctx.closePath();
  };
  ctx.save();
  ctx.lineJoin = 'round';
  for (const [x0, dir] of [
    [sp / 2, 1],
    [w - sp / 2, -1],
  ] as const) {
    tail(x0, dir);
    ctx.fillStyle = css(hexRgb(q.dark));
    ctx.fill();
    ctx.lineWidth = sp;
    ctx.strokeStyle = css(hexRgb(q.stroke));
    ctx.stroke();
    // fold shadow where the tail goes behind the body
    const fx = dir === 1 ? out - 2 : w - out + 2;
    ctx.beginPath();
    ctx.moveTo(fx, H - sp);
    ctx.lineTo(fx - dir * 18, ty + th - 2);
    ctx.lineTo(fx, ty + th - 2);
    ctx.closePath();
    ctx.fillStyle = css(shade(hexRgb(q.dark), 0.7));
    ctx.fill();
  }
  ctx.restore();
  // body
  roundRect(ctx, out, 0, spec.bodyW, H, rb.radiusPx);
  ctx.fillStyle = css(hexRgb(q.stroke));
  ctx.fill();
  roundRect(ctx, out + sp, sp, spec.bodyW - 2 * sp, H - 2 * sp, rb.radiusPx - sp);
  ctx.fillStyle = vGradient(ctx, sp, H - sp, [
    [0, hexRgb(q.top)],
    [0.5, hexRgb(q.base)],
    [1, shade(hexRgb(q.base), 0.94)],
  ]);
  ctx.fill();
  const gh = (H - 2 * sp) * 0.35;
  roundRect(ctx, out + sp + 14, sp + 6, spec.bodyW - 2 * sp - 28, gh, Math.max(4, rb.radiusPx - 10));
  ctx.fillStyle = vGradient(ctx, sp + 6, sp + 6 + gh, [
    [0, WHITE, rb.glossAlpha],
    [1, WHITE, rb.glossAlpha * 0.2],
  ]);
  ctx.fill();
}

// ---------------------------------------------------------------------------------------------------------------
// Badge (ART §14.4), capsule (§14.5), progress (§14.6)

export type BadgeVariant = 'red' | 'locked';

/** Badge frame: the square plus its 3 px contour (+3 px more at the bottom). */
export function badgeFrameSize(sizePx: number): Size {
  return { w: sizePx + 6, h: sizePx + 9 };
}

/**
 * ART §14.4 square badge (R2-12): 3 px `stroke` contour (bottom +3 px), `ringPx` white ring, inner vertical gradient
 * `top` → `bottom` (locked: `ui.badgeLocked`), a small top gloss. The number is Phaser Text (bright title,
 * `kit.badge.fontPx`). `sizePx` = `kit.badge.diameterPx` (60) by default; the truck sub-badge uses 40.
 */
export function drawBadge(
  ctx: DrawContext,
  spec: { readonly variant: BadgeVariant; readonly sizePx?: number },
  tokens: Tokens,
): void {
  const bd = tokens.kit.badge;
  const s = spec.sizePx ?? bd.diameterPx;
  const k = s / bd.diameterPx;
  const corner = bd.cornerPx * k;
  const ring = Math.max(3, bd.ringPx * k);
  const round = bd.shape === 'circle';
  const rr = (x: number, y: number, w: number, h: number, r: number): void =>
    roundRect(ctx, x, y, w, h, round ? Math.min(w, h) / 2 : r);
  rr(0, 0, s + 6, s + 9, corner + 3);
  ctx.fillStyle = css(hexRgb(bd.stroke));
  ctx.fill();
  rr(3, 3, s, s, corner);
  ctx.fillStyle = css(hexRgb(bd.ring));
  ctx.fill();
  rr(3 + ring, 3 + ring, s - 2 * ring, s - 2 * ring, Math.max(2, corner - ring));
  const locked = spec.variant === 'locked';
  const base = hexRgb(tokens.color.ui.badgeLocked);
  ctx.fillStyle = vGradient(ctx, 3 + ring, 3 + s - ring, [
    [0, locked ? mix(base, WHITE, 0.25) : hexRgb(bd.top)],
    [1, locked ? base : hexRgb(bd.bottom)],
  ]);
  ctx.fill();
  roundRect(ctx, 3 + ring + 4 * k, 3 + ring + 3 * k, s - 2 * ring - 8 * k, (s - 2 * ring) * 0.3, 6 * k);
  ctx.fillStyle = css(WHITE, 0.3);
  ctx.fill();
}

export function capsuleSlices(tokens: Tokens): Slices {
  const h = tokens.kit.capsule.heightPx;
  return { left: h / 2 + 8, right: h / 2 + 8, top: 0, bottom: 0 };
}

/** ART §14.5 counter capsule: dark translucent pill + `innerStrokePx` white α line inside. */
export function drawCapsule(ctx: DrawContext, spec: { readonly w: number }, tokens: Tokens): void {
  const cp = tokens.kit.capsule;
  const h = cp.heightPx;
  roundRect(ctx, 0, 0, spec.w, h, h / 2);
  ctx.fillStyle = css(hexRgb(cp.fill), cp.fillAlpha);
  ctx.fill();
  const i = cp.innerStrokePx / 2 + 3;
  roundRect(ctx, i, i, spec.w - 2 * i, h - 2 * i, h / 2 - i);
  ctx.lineWidth = cp.innerStrokePx;
  ctx.strokeStyle = css(hexRgb(cp.innerStroke), cp.innerStrokeAlpha);
  ctx.stroke();
}

/** Inner padding of the progress track (ART §14.6 "içte 6 px payla"). */
export const PROGRESS_PAD = 6;

export function progressSlices(tokens: Tokens): Slices {
  const h = tokens.kit.progress.heightPx;
  return { left: h / 2 + 4, right: h / 2 + 4, top: 0, bottom: 0 };
}

/** ART §14.6 track: `track` pill with a white α `trackInnerAlpha` well inside (6 px pad). */
export function drawProgressTrack(ctx: DrawContext, spec: { readonly w: number }, tokens: Tokens): void {
  const p = tokens.kit.progress;
  const h = p.heightPx;
  roundRect(ctx, 0, 0, spec.w, h, h / 2);
  ctx.fillStyle = css(hexRgb(p.track));
  ctx.fill();
  roundRect(
    ctx,
    PROGRESS_PAD,
    PROGRESS_PAD,
    spec.w - 2 * PROGRESS_PAD,
    h - 2 * PROGRESS_PAD,
    h / 2 - PROGRESS_PAD,
  );
  ctx.fillStyle = css(WHITE, p.trackInnerAlpha);
  ctx.fill();
}

/** Fill frame height (inside the track's padding). */
export const progressFillHeight = (tokens: Tokens): number => tokens.kit.progress.heightPx - 2 * PROGRESS_PAD;

export function progressFillSlices(tokens: Tokens): Slices {
  const h = progressFillHeight(tokens);
  return { left: h / 2 + 2, right: h / 2 + 2, top: 0, bottom: 0 };
}

/** ART §14.6 fill: vertical gradient `fillTop` → `fillBottom` with a top gloss. */
export function drawProgressFill(ctx: DrawContext, spec: { readonly w: number }, tokens: Tokens): void {
  const p = tokens.kit.progress;
  const h = progressFillHeight(tokens);
  roundRect(ctx, 0, 0, spec.w, h, h / 2);
  ctx.fillStyle = vGradient(ctx, 0, h, [
    [0, hexRgb(p.fillTop)],
    [1, hexRgb(p.fillBottom)],
  ]);
  ctx.fill();
  roundRect(ctx, h * 0.3, 3, spec.w - h * 0.6, h * 0.32, h * 0.16);
  ctx.fillStyle = css(WHITE, 0.45);
  ctx.fill();
}

// ---------------------------------------------------------------------------------------------------------------
// Bottom navigation (ART §14.7)

/** `ui_nav_bar`: a narrow vertical strip (`barTop` → `barBottom`, `edgePx` `edge` line on top); stretched in x. */
export function drawNavBar(
  ctx: DrawContext,
  spec: { readonly w: number; readonly h: number },
  tokens: Tokens,
): void {
  const n = tokens.kit.nav;
  ctx.fillStyle = vGradient(ctx, 0, spec.h, [
    [0, hexRgb(n.barTop)],
    [1, hexRgb(n.barBottom)],
  ]);
  ctx.fillRect(0, 0, spec.w, spec.h);
  ctx.fillStyle = css(hexRgb(n.edge));
  ctx.fillRect(0, 0, spec.w, n.edgePx);
}

/** Selected tab tile corner. */
export const NAV_TAB_RADIUS = 36;

/** ART §14.7 selected tab: `selectedTop` → `selectedBottom` tile with a `selectedStroke` contour and a gloss band. */
export function drawNavTab(
  ctx: DrawContext,
  spec: { readonly w: number; readonly h: number },
  tokens: Tokens,
): void {
  const n = tokens.kit.nav;
  const s = 6;
  const { w, h } = spec;
  roundRect(ctx, 0, 0, w, h, NAV_TAB_RADIUS);
  ctx.fillStyle = css(hexRgb(n.selectedStroke));
  ctx.fill();
  roundRect(ctx, s, s, w - 2 * s, h - 2 * s, NAV_TAB_RADIUS - s);
  ctx.fillStyle = vGradient(ctx, s, h - s, [
    [0, hexRgb(n.selectedTop)],
    [1, hexRgb(n.selectedBottom)],
  ]);
  ctx.fill();
  roundRect(ctx, s + 14, s + 8, w - 2 * s - 28, (h - 2 * s) * 0.3, 18);
  ctx.fillStyle = vGradient(ctx, s + 8, s + 8 + (h - 2 * s) * 0.3, [
    [0, WHITE, 0.4],
    [1, WHITE, 0.05],
  ]);
  ctx.fill();
}

// ---------------------------------------------------------------------------------------------------------------
// Tutorial bubble (ART §14.8), highlight, portrait ring, small badges

export function bubbleSlices(tokens: Tokens): Slices {
  const bb = tokens.kit.bubble;
  const e = bb.radiusPx + bb.strokePx + 6;
  return { left: e, right: e, top: e, bottom: e + bb.shadowYPx };
}

export function bubbleFrameSize(spec: { readonly w: number; readonly h: number }, tokens: Tokens): Size {
  return { w: spec.w, h: spec.h + tokens.kit.bubble.shadowYPx };
}

/** ART §14.8 bubble body: drop shadow y + `shadowYPx`, `stroke` contour `strokePx`, white `fill`, corner `radiusPx`. */
export function drawBubble(
  ctx: DrawContext,
  spec: { readonly w: number; readonly h: number },
  tokens: Tokens,
): void {
  const bb = tokens.kit.bubble;
  roundRect(ctx, 0, bb.shadowYPx, spec.w, spec.h, bb.radiusPx);
  ctx.fillStyle = css(BLACK, bb.shadowAlpha);
  ctx.fill();
  roundRect(ctx, 0, 0, spec.w, spec.h, bb.radiusPx);
  ctx.fillStyle = css(hexRgb(bb.stroke));
  ctx.fill();
  roundRect(
    ctx,
    bb.strokePx,
    bb.strokePx,
    spec.w - 2 * bb.strokePx,
    spec.h - 2 * bb.strokePx,
    bb.radiusPx - bb.strokePx,
  );
  ctx.fillStyle = css(hexRgb(bb.fill));
  ctx.fill();
}

export type TailDir = 'left' | 'down' | 'up';

/** Tail frame: `tailPx` long + the contour it covers on the bubble edge. */
export function bubbleTailSize(dir: TailDir, tokens: Tokens): Size {
  const bb = tokens.kit.bubble;
  const len = bb.tailPx + bb.strokePx * 2;
  const base = bb.tailPx * 2;
  return dir === 'left' ? { w: len, h: base } : { w: base, h: len };
}

/**
 * Bubble tail: white triangle whose base overlaps the bubble's contour (`strokePx`) so the joint shows no line; the
 * two free edges carry the contour. Place the base edge (right edge for `left`, top edge for `down`, bottom for `up`)
 * `strokePx` inside the bubble edge.
 */
export function drawBubbleTail(ctx: DrawContext, spec: { readonly dir: TailDir }, tokens: Tokens): void {
  const bb = tokens.kit.bubble;
  const { w, h } = bubbleTailSize(spec.dir, tokens);
  const s = bb.strokePx;
  ctx.save();
  if (spec.dir !== 'left') {
    // rotate the 'left' geometry: down = base on top, apex at the bottom
    ctx.translate(w / 2, h / 2);
    ctx.rotate(spec.dir === 'down' ? -Math.PI / 2 : Math.PI / 2);
    ctx.translate(-h / 2, -w / 2);
  }
  const L = spec.dir === 'left' ? w : h;
  const B = spec.dir === 'left' ? h : w;
  ctx.beginPath();
  ctx.moveTo(L, s);
  ctx.lineTo(s, B / 2);
  ctx.lineTo(L, B - s);
  ctx.lineJoin = 'round';
  ctx.lineWidth = s;
  ctx.strokeStyle = css(hexRgb(bb.stroke));
  ctx.stroke();
  ctx.closePath();
  ctx.fillStyle = css(hexRgb(bb.fill));
  ctx.fill();
  ctx.restore();
}

/** Highlight frame: target box + `highlightPadPx` + room for the glow on every side. */
export function highlightPad(tokens: Tokens): number {
  const t = tokens.tutorial;
  return t.highlightPadPx + t.highlightStrokePx + t.highlightGlowPx;
}

export function highlightSlices(tokens: Tokens): Slices {
  const e = highlightPad(tokens) + 24;
  return { left: e, right: e, top: e, bottom: e };
}

/**
 * `ui_highlight` (UX §13.1, ART §14.8): `highlightStrokePx` white α 0.95 rounded contour around the target box (+pad)
 * with a `highlightGlowPx` soft white glow. `w × h` = the frame (target + 2 × `highlightPad`).
 */
export function drawHighlight(
  ctx: DrawContext,
  spec: { readonly w: number; readonly h: number },
  tokens: Tokens,
): void {
  const t = tokens.tutorial;
  const inset = t.highlightGlowPx + t.highlightStrokePx / 2;
  ctx.save();
  roundRect(ctx, inset, inset, spec.w - 2 * inset, spec.h - 2 * inset, 28);
  ctx.shadowColor = css(WHITE, 0.9);
  ctx.shadowBlur = t.highlightGlowPx;
  ctx.lineWidth = t.highlightStrokePx;
  ctx.strokeStyle = css(WHITE, 0.95);
  ctx.stroke();
  ctx.restore();
}

/** `ui_portrait_ring` (ART §14.8): Ø `tutorial.portraitPx` cream disc with a 6 px `ui.ink` ring. */
export function drawPortraitRing(ctx: DrawContext, spec: { readonly d: number }, tokens: Tokens): void {
  const d = spec.d;
  ctx.beginPath();
  ctx.arc(d / 2, d / 2, d / 2 - 3, 0, Math.PI * 2);
  ctx.fillStyle = css(hexRgb(tokens.kit.buttonColor.cream.base));
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = css(hexRgb(tokens.color.ui.ink));
  ctx.stroke();
}

/** `ui_badge_nextfloor` (UX §5.9 item 3): cream disc, `ui.ink` up arrow over a floor line. */
export function drawNextFloorBadge(ctx: DrawContext, spec: { readonly d: number }, tokens: Tokens): void {
  const d = spec.d;
  const ink = hexRgb(tokens.color.ui.ink);
  ctx.beginPath();
  ctx.arc(d / 2, d / 2, d / 2 - 1.5, 0, Math.PI * 2);
  ctx.fillStyle = css(hexRgb(tokens.kit.buttonColor.cream.base));
  ctx.fill();
  ctx.lineWidth = Math.max(2, d * 0.08);
  ctx.strokeStyle = css(ink);
  ctx.stroke();
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, d * 0.1);
  ctx.beginPath();
  ctx.moveTo(d * 0.5, d * 0.62);
  ctx.lineTo(d * 0.5, d * 0.24);
  ctx.moveTo(d * 0.33, d * 0.4);
  ctx.lineTo(d * 0.5, d * 0.24);
  ctx.lineTo(d * 0.67, d * 0.4);
  ctx.moveTo(d * 0.28, d * 0.76);
  ctx.lineTo(d * 0.72, d * 0.76);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------
// Frame catalogue of the kit atlas (sizes the HUD / home / win layouts use; more heights bake on demand)

/** Button heights baked at boot: play / Devam 176, booster slot 172, popup option and side icon 152, pause 128, settings 120, 96, tag 80. */
export const KIT_BUTTON_HEIGHTS = [176, 172, 152, 128, 120, 96, 80] as const;

export const kitButtonFrameName = (color: KitButtonColor, h: number, state: ButtonState = 'normal'): string =>
  `ui_button_${color}_h${h}${state === 'normal' ? '' : `_${state}`}`;

/** Source width of a 3-sliced button frame (min width + a stretchable middle). */
export const kitButtonSourceW = (h: number, tokens: Tokens): number => buttonMinWidth(h, tokens) + 16;
