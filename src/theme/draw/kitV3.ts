/**
 * UI kit v3 (docs/ART_REFERENCE.md §3 "Bileşen tarifleri", §2 colours, §4 text, §5.3 board frame, §7.2 scene; R2-13):
 * the chunky three-size button (outer contour, outer face, lip, inner plate, bevel band), the round red × and green +,
 * the counter capsules (home 88 / HUD 60), the square count badge, the indigo 7-layer window, its lavender inner plate
 * and cream card, the meta progress bar, the indigo bottom navigation + raised tab, the cream two-ring bubble + tail,
 * the small gold lock, the toggle pill, the HUD moves plate, the cyan highlight and the scene glow / loading sky.
 *
 * Every drawer is pure Canvas2D on a `DrawContext` at the origin of its frame; sizes come from `tokens.kit.v3.*`.
 * Fixed-size items are baked once into the `kit` atlas page (theme/textures.ts `kitAtlasFrames`); items of variable
 * size are baked small and stretched by Phaser `NineSlice` with the insets of `*Slices()` (3-slice when
 * `top = bottom = 0`). Labels are Phaser Text in the ART_REFERENCE §4 looks (ui/kit/text.ts), never baked.
 */
import type { KitV3ButtonColor, KitV3ButtonSize, Tokens } from '../tokens.ts';
import { KIT_V3_BUTTON_COLORS } from '../tokens.ts';
import { BLACK, WHITE, css, mix, parseHex, shade } from './color.ts';
import type { Rgb } from './color.ts';
import type { DrawContext, Size } from './context.ts';
import { roundRect } from './blockV2.ts';
import type { Rect } from './blockV2.ts';
import type { Slices } from './kit.ts';

export type { KitV3ButtonColor, KitV3ButtonSize };
export { KIT_V3_BUTTON_COLORS };

/** Button states (ART_REFERENCE §2.3): pressed = plate sinks, lip shrinks; disabled = grey quadruple, no bevel line. */
export type ButtonV3State = 'normal' | 'pressed' | 'disabled';

const rgb = (h: string): Rgb => parseHex(h);

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

/** A rounded rectangle whose top corners only are rounded (bevel bands, raised nav tab). */
function topRoundRect(ctx: DrawContext, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

/** Soft drop shadow of a rounded rectangle (`blur` through the canvas shadow, inside save / restore). */
function softShadow(
  ctx: DrawContext,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  alpha: number,
  blur: number,
): void {
  ctx.save();
  ctx.shadowColor = css(BLACK, alpha);
  ctx.shadowBlur = blur;
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = css(BLACK, alpha * 0.6);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------
// Button (ART_REFERENCE §3.1)

export interface ButtonV3Metrics {
  readonly size: KitV3ButtonSize;
  readonly r: number;
  readonly strokePx: number;
  readonly plateInsetPx: number;
  /** Plate top inset from the outer face (0,8 × the side inset). */
  readonly plateTopPx: number;
  readonly plateRadiusPx: number;
  readonly bevelPx: number;
  readonly bevelLinePx: number;
  readonly lipPx: number;
  readonly fontPx: number;
}

/** Size preset of a button height: L ≥ 180, M ≥ 120, S below (ART_REFERENCE §3.1 three sizes). */
export function buttonV3Size(h: number): KitV3ButtonSize {
  return h >= 180 ? 'L' : h >= 120 ? 'M' : 'S';
}

/**
 * Metrics of a button `h` px high: the preset of its size scaled by `h / preset.h` (0,6 … 1,25). `square` (the HUD
 * booster squares, ART_REFERENCE §9.4): thinner bands — contour 8, bevel 18, lip 20 — so the icon keeps the face.
 */
export function buttonV3Metrics(h: number, tokens: Tokens, square = false): ButtonV3Metrics {
  const b = tokens.kit.v3.button;
  const size = buttonV3Size(h);
  const p = b[size];
  const k = Math.min(1.25, Math.max(0.6, h / p.h));
  if (square) {
    const inset = Math.round(20 * Math.min(1.2, h / 160));
    return {
      size,
      r: Math.round(h * 0.25),
      strokePx: 8,
      plateInsetPx: inset,
      plateTopPx: Math.round(inset * 0.8),
      plateRadiusPx: Math.max(8, Math.round(h * 0.25) - inset + 6),
      bevelPx: 18,
      bevelLinePx: 4,
      lipPx: 20,
      fontPx: p.fontPx,
    };
  }
  const inset = Math.round(p.plateInsetPx * k);
  const r = Math.round(p.r * k);
  return {
    size,
    r,
    strokePx: Math.max(3, Math.round(p.strokePx * k)),
    plateInsetPx: inset,
    plateTopPx: Math.round(inset * 0.8),
    plateRadiusPx: Math.max(8, r - inset + 8),
    bevelPx: Math.round(p.bevelPx * k),
    bevelLinePx: Math.max(2, Math.round(p.bevelLinePx * k)),
    lipPx: Math.round(p.lipPx * k),
    fontPx: p.fontPx,
  };
}

export interface ButtonV3Spec {
  readonly color: KitV3ButtonColor;
  readonly w: number;
  readonly h: number;
  readonly state?: ButtonV3State;
  readonly square?: boolean;
}

/** Frame = the button plus its drop shadow below (`shadowYPx` + blur room). */
export function buttonV3FrameSize(spec: ButtonV3Spec, tokens: Tokens): Size {
  const b = tokens.kit.v3.button;
  return { w: spec.w, h: spec.h + b.shadowYPx + Math.round(b.shadowBlurPx / 2) };
}

/** Inner plate rectangle (label centre = plate centre + 2) in frame px. */
export function buttonV3PlateRect(spec: ButtonV3Spec, tokens: Tokens): Rect {
  const b = tokens.kit.v3.button;
  const m = buttonV3Metrics(spec.h, tokens, spec.square ?? false);
  const pressed = spec.state === 'pressed';
  const drop = pressed ? b.pressedDropPx : 0;
  const lip = pressed ? Math.round(m.lipPx * b.pressedLipRatio) : m.lipPx;
  const s = m.strokePx;
  const px = s + m.plateInsetPx;
  const py = s + m.plateTopPx + drop;
  const bottom = spec.h - s - lip - Math.max(4, Math.round(s));
  return { x: px, y: py, w: spec.w - 2 * px, h: Math.max(8, bottom - py) };
}

/** 3-slice insets: the corner, the plate's corner and a margin stay unstretched. */
export function buttonV3Slices(spec: ButtonV3Spec, tokens: Tokens): Slices {
  const m = buttonV3Metrics(spec.h, tokens, spec.square ?? false);
  const side = Math.ceil(Math.max(m.r, m.strokePx + m.plateInsetPx + m.plateRadiusPx) + 6);
  return { left: side, right: side, top: 0, bottom: 0 };
}

/** Smallest width a 3-sliced button of height h can be drawn at (both side slices). */
export function buttonV3MinWidth(h: number, tokens: Tokens, square = false): number {
  const s = buttonV3Slices({ color: 'green', w: 0, h, square }, tokens);
  return s.left + s.right;
}

/**
 * ART_REFERENCE §3.1 layers: soft shadow → contour (2 px darker at the bottom) → lip → outer face (the plate's darker
 * "rim") → 3 px lip line → inner plate gradient (top / 0,55 / bottom) → bevel band + light line → gloss ellipse
 * (greenSoft only). Pressed: plate and bevel sink `pressedDropPx`, the lip shrinks to `pressedLipRatio`. Disabled: the
 * grey quadruple, no bevel line.
 */
export function drawButtonV3(ctx: DrawContext, spec: ButtonV3Spec, tokens: Tokens): void {
  const b = tokens.kit.v3.button;
  const state = spec.state ?? 'normal';
  const color: KitV3ButtonColor = state === 'disabled' ? 'grey' : spec.color;
  const q = tokens.kit.v3.buttonColor[color];
  const m = buttonV3Metrics(spec.h, tokens, spec.square ?? false);
  const { w, h } = spec;
  const r = m.r;
  const s = m.strokePx;
  const pressed = state === 'pressed';
  const lip = pressed ? Math.round(m.lipPx * b.pressedLipRatio) : m.lipPx;
  const stroke = rgb(q.stroke);
  const lipC = rgb(q.lip);
  // 1 shadow
  softShadow(ctx, 0, b.shadowYPx, w, h, r, b.shadowAlpha, b.shadowBlurPx);
  // 2 contour, bottom 2 px darker
  roundRect(ctx, 0, 0, w, h, r);
  ctx.fillStyle = css(shade(stroke, 0.6));
  ctx.fill();
  roundRect(ctx, 0, 0, w, h - 2, r);
  ctx.fillStyle = css(stroke);
  ctx.fill();
  // 3 lip (the whole inner area; the faces cover its upper part)
  roundRect(ctx, s, s, w - 2 * s, h - 2 * s, r - s);
  ctx.fillStyle = css(lipC);
  ctx.fill();
  // 4 outer face: the plate gradient's dark rim
  const faceBottom = h - s - lip;
  roundRect(ctx, s, s, w - 2 * s, faceBottom - s, r - s);
  ctx.fillStyle = vGradient(ctx, s, faceBottom, [
    [0, mix(rgb(q.faceMid), lipC, 0.25)],
    [1, mix(rgb(q.faceBottom), lipC, 0.35)],
  ]);
  ctx.fill();
  // lip line (3 px lighter lip right under the face)
  ctx.fillStyle = css(shade(lipC, 1.4));
  ctx.fillRect(s + r / 2, faceBottom, w - 2 * s - r, 3);
  // 5 inner plate
  const p = buttonV3PlateRect(spec, tokens);
  roundRect(ctx, p.x, p.y, p.w, p.h, m.plateRadiusPx);
  ctx.fillStyle = vGradient(ctx, p.y, p.y + p.h, [
    [0, rgb(q.faceTop)],
    [0.55, rgb(q.faceMid)],
    [1, rgb(q.faceBottom)],
  ]);
  ctx.fill();
  // 6 bevel band (clipped to the plate) + light line
  ctx.save();
  roundRect(ctx, p.x, p.y, p.w, p.h, m.plateRadiusPx);
  ctx.clip();
  const bevelH = Math.min(m.bevelPx, p.h * 0.45);
  ctx.fillStyle = vGradient(ctx, p.y, p.y + bevelH, [
    [0, rgb(q.bevel), state === 'disabled' ? 0.5 : 1],
    [1, rgb(q.bevel), 0],
  ]);
  ctx.fillRect(p.x, p.y, p.w, bevelH);
  if (state !== 'disabled') {
    const lw = p.w * 0.92;
    roundRect(ctx, p.x + (p.w - lw) / 2, p.y + 1, lw, m.bevelLinePx, m.bevelLinePx / 2);
    ctx.fillStyle = css(rgb(q.bevelLine), 0.9);
    ctx.fill();
  }
  // 7 gloss ellipse (RM type)
  if (color === 'greenSoft') {
    ctx.beginPath();
    ctx.ellipse(p.x + p.w - 70, p.y + 26, 34, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = css(WHITE, b.glossAlpha);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------
// Round × (§3.2) and + (§3.3)

export function closeV3FrameSize(tokens: Tokens): Size {
  const c = tokens.kit.v3.close;
  return { w: c.diameterPx, h: c.diameterPx + c.shadowYPx + 8 };
}

/**
 * ART_REFERENCE §3.2 red round ×: shadow → ring → lip (4 px lower) → face (radial, light at the upper left) → upper
 * gloss half-ring → the cream glyph with its contour and shadow. Pressed: face and glyph 4 px lower, no gloss ring.
 */
export function drawCloseV3(
  ctx: DrawContext,
  spec: { readonly state?: ButtonV3State },
  tokens: Tokens,
): void {
  const c = tokens.kit.v3.close;
  const d = c.diameterPx;
  const R = d / 2;
  const cx = R;
  const cy = R;
  const pressed = spec.state === 'pressed';
  const drop = pressed ? c.lipDropPx : 0;
  ctx.save();
  ctx.shadowColor = css(BLACK, c.shadowAlpha);
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(cx, cy + c.shadowYPx, R, 0, Math.PI * 2);
  ctx.fillStyle = css(BLACK, c.shadowAlpha * 0.6);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = css(rgb(c.ring));
  ctx.fill();
  const ri = R - c.ringPx;
  ctx.beginPath();
  ctx.arc(cx, cy + c.lipDropPx, ri, 0, Math.PI * 2);
  ctx.fillStyle = css(rgb(c.lip));
  ctx.fill();
  const fy = cy - c.lipDropPx / 2 + drop;
  ctx.beginPath();
  ctx.arc(cx, fy, ri, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(cx - ri * 0.4, fy - ri * 0.4, ri * 0.1, cx, fy, ri);
  g.addColorStop(0, css(rgb(c.face)));
  g.addColorStop(1, css(rgb(c.faceDeep)));
  ctx.fillStyle = g;
  ctx.fill();
  if (!pressed) {
    ctx.beginPath();
    ctx.arc(cx, fy, ri - c.glossRingPx, (200 * Math.PI) / 180, (340 * Math.PI) / 180);
    ctx.lineWidth = c.glossRingPx;
    ctx.lineCap = 'round';
    ctx.strokeStyle = css(rgb(c.glossRing), 0.9);
    ctx.stroke();
  }
  // glyph: two rounded bars at ±45°
  const arm = c.glyphArmL / 2;
  const half = c.glyphArmW / 2;
  const bar = (angle: number, fill: string, grow: number, dy: number): void => {
    ctx.save();
    ctx.translate(cx, fy + dy);
    ctx.rotate(angle);
    roundRect(ctx, -arm - grow, -half - grow, 2 * (arm + grow), 2 * (half + grow), half + grow);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
  };
  for (const a of [Math.PI / 4, -Math.PI / 4]) bar(a, css(rgb(c.glyphStroke)), c.glyphStrokePx / 2, 3);
  for (const a of [Math.PI / 4, -Math.PI / 4]) bar(a, css(rgb(c.glyphStroke)), c.glyphStrokePx / 2, 0);
  for (const a of [Math.PI / 4, -Math.PI / 4]) bar(a, css(rgb(c.glyph)), 0, 0);
  ctx.lineCap = 'butt';
}

export function plusV3FrameSize(tokens: Tokens): Size {
  const p = tokens.kit.v3.plus;
  return { w: p.diameterPx, h: p.diameterPx + 6 };
}

/** ART_REFERENCE §3.3 green round +: contour → lip (lower crescent) → radial face → upper white arc → the "+" bars. */
export function drawPlusV3(ctx: DrawContext, spec: { readonly state?: ButtonV3State }, tokens: Tokens): void {
  const p = tokens.kit.v3.plus;
  const d = p.diameterPx;
  const R = d / 2;
  const pressed = spec.state === 'pressed';
  const drop = pressed ? 3 : 0;
  ctx.beginPath();
  ctx.arc(R, R, R, 0, Math.PI * 2);
  ctx.fillStyle = css(rgb(p.stroke));
  ctx.fill();
  const ri = R - p.strokePx;
  ctx.beginPath();
  ctx.arc(R, R + 4, ri, 0, Math.PI * 2);
  ctx.fillStyle = css(rgb(p.lip));
  ctx.fill();
  const fy = R - 2 + drop;
  ctx.beginPath();
  ctx.arc(R, fy, ri, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(R - ri * 0.35, fy - ri * 0.35, ri * 0.1, R, fy, ri);
  g.addColorStop(0, css(rgb(p.faceTop)));
  g.addColorStop(1, css(rgb(p.faceBottom)));
  ctx.fillStyle = g;
  ctx.fill();
  if (!pressed) {
    ctx.beginPath();
    ctx.arc(R, fy, ri - 4, (210 * Math.PI) / 180, (330 * Math.PI) / 180);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = css(WHITE, 0.5);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }
  const t = p.barT;
  const L = p.barW;
  roundRect(ctx, R - L / 2, fy + 2 - t / 2, L, t, t / 2);
  ctx.fillStyle = css(rgb(p.stroke));
  ctx.fill();
  roundRect(ctx, R - t / 2, fy + 2 - L / 2, t, L, t / 2);
  ctx.fill();
  roundRect(ctx, R - L / 2, fy - t / 2, L, t, t / 2);
  ctx.fillStyle = css(WHITE);
  ctx.fill();
  roundRect(ctx, R - t / 2, fy - L / 2, t, L, t / 2);
  ctx.fill();
}

// ---------------------------------------------------------------------------------------------------------------
// Capsule (§3.4), badge (§3.5)

export type CapsuleV3Variant = 'home' | 'hud';

export function capsuleV3Height(variant: CapsuleV3Variant, tokens: Tokens): number {
  const c = tokens.kit.v3.capsule;
  return variant === 'home' ? c.homeH : c.hudH;
}

export function capsuleV3Slices(variant: CapsuleV3Variant, tokens: Tokens): Slices {
  const h = capsuleV3Height(variant, tokens);
  return { left: h / 2 + 8, right: h / 2 + 8, top: 0, bottom: 0 };
}

/** ART_REFERENCE §3.4: dark translucent pill → dark inner ring (the capsule is a hollow) → faint top line. */
export function drawCapsuleV3(
  ctx: DrawContext,
  spec: { readonly w: number; readonly variant: CapsuleV3Variant },
  tokens: Tokens,
): void {
  const c = tokens.kit.v3.capsule;
  const h = capsuleV3Height(spec.variant, tokens);
  const r = h / 2;
  roundRect(ctx, 0, 0, spec.w, h, r);
  ctx.fillStyle = css(rgb(spec.variant === 'home' ? c.fill : c.hudFill), c.fillAlpha);
  ctx.fill();
  const i = 2 + c.innerRingPx / 2;
  roundRect(ctx, i, i, spec.w - 2 * i, h - 2 * i, r - i);
  ctx.lineWidth = c.innerRingPx;
  ctx.strokeStyle = css(rgb(c.innerRing), c.innerRingAlpha);
  ctx.stroke();
  ctx.fillStyle = css(WHITE, c.topLineAlpha);
  ctx.fillRect(r, 3, spec.w - 2 * r, 2);
}

export type BadgeV3Shape = 'square' | 'circle';

/** Badge frame: the square plus 4 px of shadow below. */
export function badgeV3FrameSize(sizePx: number): Size {
  return { w: sizePx, h: sizePx + 4 };
}

/**
 * ART_REFERENCE §3.5 red count badge: shadow → contour → lip (bottom 6 px) → face gradient (top / 0,45 / bottom) →
 * top bevel (white α `bevelAlpha`). `circle` = the small event badge.
 */
export function drawBadgeV3(
  ctx: DrawContext,
  spec: { readonly sizePx: number; readonly shape?: BadgeV3Shape },
  tokens: Tokens,
): void {
  const bd = tokens.kit.v3.badge;
  const s = spec.sizePx;
  const k = s / bd.sizePx;
  const r = spec.shape === 'circle' ? s / 2 : bd.radiusPx * k;
  const sp = Math.max(3, Math.round(bd.strokePx * k));
  const lip = Math.max(3, Math.round(bd.lipPx * k));
  roundRect(ctx, 0, 4, s, s, r);
  ctx.fillStyle = css(BLACK, 0.3);
  ctx.fill();
  roundRect(ctx, 0, 0, s, s, r);
  ctx.fillStyle = css(rgb(bd.stroke));
  ctx.fill();
  roundRect(ctx, sp, sp, s - 2 * sp, s - 2 * sp, Math.max(2, r - sp));
  ctx.fillStyle = css(rgb(bd.lip));
  ctx.fill();
  const fh = s - 2 * sp - lip;
  roundRect(ctx, sp, sp, s - 2 * sp, fh, Math.max(2, r - sp));
  ctx.fillStyle = vGradient(ctx, sp, sp + fh, [
    [0, rgb(bd.top)],
    [0.45, rgb(bd.mid)],
    [1, rgb(bd.bottom)],
  ]);
  ctx.fill();
  ctx.save();
  roundRect(ctx, sp, sp, s - 2 * sp, fh, Math.max(2, r - sp));
  ctx.clip();
  ctx.fillStyle = css(WHITE, bd.bevelAlpha);
  ctx.fillRect(sp, sp, s - 2 * sp, Math.round(bd.bevelPx * k));
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------
// Window (§3.7): panel, lavender plate, cream card

/** Panel frame = the panel plus its shadow below. */
export function panelV3FrameSize(spec: { readonly w: number; readonly h: number }, tokens: Tokens): Size {
  const p = tokens.kit.v3.panel;
  return { w: spec.w, h: spec.h + p.shadowYPx + Math.round(p.shadowBlurPx / 2) };
}

/** 9-slice insets: the corner at the top, the corner + both lip bands + the shadow at the bottom. */
export function panelV3Slices(tokens: Tokens): Slices {
  const p = tokens.kit.v3.panel;
  const side = p.radiusPx + 8;
  const lips = p.outlinePx + p.rimPx + p.groovePx + p.bevelPx + p.lipPx + p.lipDarkPx;
  return {
    left: side,
    right: side,
    top: side,
    bottom: Math.max(side, lips) + p.shadowYPx + Math.round(p.shadowBlurPx / 2) + 8,
  };
}

/**
 * ART_REFERENCE §3.7 indigo window: shadow → outline → light rim → groove → inner bevel → body gradient → two dark lip
 * bands at the bottom (inside the bevel).
 */
export function drawPanelV3(
  ctx: DrawContext,
  spec: { readonly w: number; readonly h: number },
  tokens: Tokens,
): void {
  const p = tokens.kit.v3.panel;
  const { w, h } = spec;
  const R = p.radiusPx;
  softShadow(ctx, 0, p.shadowYPx, w, h, R, p.shadowAlpha, p.shadowBlurPx);
  const ring = (inset: number, color: string, radius: number): void => {
    roundRect(ctx, inset, inset, w - 2 * inset, h - 2 * inset, Math.max(4, radius));
    ctx.fillStyle = css(rgb(color));
    ctx.fill();
  };
  let inset = 0;
  ring(inset, p.outline, R);
  inset += p.outlinePx;
  ring(inset, p.rim, R - inset);
  inset += p.rimPx;
  ring(inset, p.groove, R - inset);
  inset += p.groovePx;
  ring(inset, p.bevel, R - inset);
  inset += p.bevelPx;
  const bodyR = Math.max(8, R - inset);
  roundRect(ctx, inset, inset, w - 2 * inset, h - 2 * inset, bodyR);
  ctx.fillStyle = vGradient(ctx, inset, h - inset, [
    [0, rgb(p.bodyTop)],
    [1, rgb(p.bodyBottom)],
  ]);
  ctx.fill();
  // lip bands clipped to the body
  ctx.save();
  roundRect(ctx, inset, inset, w - 2 * inset, h - 2 * inset, bodyR);
  ctx.clip();
  const lipTop = h - inset - p.lipPx - p.lipDarkPx;
  ctx.fillStyle = css(rgb(p.lip));
  ctx.fillRect(inset, lipTop, w - 2 * inset, p.lipPx);
  ctx.fillStyle = css(rgb(p.lipDark));
  ctx.fillRect(inset, lipTop + p.lipPx, w - 2 * inset, p.lipDarkPx + 4);
  ctx.restore();
}

/** Lavender inner plate (§3.7 layer 8): 9-slice insets. */
export function plateV3Slices(tokens: Tokens): Slices {
  const p = tokens.kit.v3.panel;
  const e = p.plateRadiusPx + p.plateStrokePx + 4;
  return { left: e, right: e, top: e, bottom: e + p.plateBottomBandPx };
}

export function drawPlateV3(
  ctx: DrawContext,
  spec: { readonly w: number; readonly h: number },
  tokens: Tokens,
): void {
  const p = tokens.kit.v3.panel;
  const { w, h } = spec;
  const r = p.plateRadiusPx;
  const s = p.plateStrokePx;
  roundRect(ctx, 0, 0, w, h, r);
  ctx.fillStyle = css(rgb(p.plateStroke));
  ctx.fill();
  roundRect(ctx, s, s, w - 2 * s, h - 2 * s, r - s);
  ctx.fillStyle = css(rgb(p.plate));
  ctx.fill();
  ctx.save();
  roundRect(ctx, s, s, w - 2 * s, h - 2 * s, r - s);
  ctx.clip();
  ctx.fillStyle = css(rgb(p.plateTopLine));
  ctx.fillRect(s, s, w - 2 * s, p.plateTopLinePx);
  ctx.fillStyle = css(rgb(p.plateBottomBand));
  ctx.fillRect(s, h - s - p.plateBottomBandPx, w - 2 * s, p.plateBottomBandPx);
  ctx.restore();
}

/** Cream content card (§3.7 layer 9): 9-slice insets (the inner shadow sits in the top slice). */
export function cardV3Slices(tokens: Tokens): Slices {
  const p = tokens.kit.v3.panel;
  const e = 28 + p.creamEdgePx + 4;
  return { left: e, right: e, top: e + p.creamInnerShadowPx, bottom: e };
}

export const CARD_V3_RADIUS = 28;

export function drawCardV3(
  ctx: DrawContext,
  spec: { readonly w: number; readonly h: number },
  tokens: Tokens,
): void {
  const p = tokens.kit.v3.panel;
  const { w, h } = spec;
  const r = CARD_V3_RADIUS;
  roundRect(ctx, 0, 0, w, h, r);
  ctx.fillStyle = css(rgb(p.creamEdge));
  ctx.fill();
  const e = p.creamEdgePx;
  roundRect(ctx, e, e, w - 2 * e, h - 2 * e, r - e);
  ctx.fillStyle = css(rgb(p.cream));
  ctx.fill();
  ctx.save();
  roundRect(ctx, e, e, w - 2 * e, h - 2 * e, r - e);
  ctx.clip();
  ctx.fillStyle = vGradient(ctx, e, e + p.creamInnerShadowPx, [
    [0, rgb(p.creamInnerShadow), 0.9],
    [1, rgb(p.creamInnerShadow), 0],
  ]);
  ctx.fillRect(e, e, w - 2 * e, p.creamInnerShadowPx);
  ctx.restore();
}

/**
 * ART_REFERENCE §8 ray fan: `rays` wedges alternating light / dark around (cx, cy), clipped to the frame. Used behind
 * the cream card content and the reward object (the scene tints / rotates it).
 */
export function drawRayFan(
  ctx: DrawContext,
  spec: {
    readonly w: number;
    readonly h: number;
    readonly rays: number;
    readonly light: string;
    readonly dark: string;
    readonly alpha?: number;
  },
): void {
  const { w, h } = spec;
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.hypot(w, h);
  const n = Math.max(2, spec.rays);
  const step = (Math.PI * 2) / n;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  for (let i = 0; i < n; i++) {
    const a0 = i * step;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(a0), cy + R * Math.sin(a0));
    ctx.lineTo(cx + R * Math.cos(a0 + step), cy + R * Math.sin(a0 + step));
    ctx.closePath();
    ctx.fillStyle = css(rgb(i % 2 === 0 ? spec.light : spec.dark), spec.alpha ?? 1);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------
// Progress (§3.8)

export type ProgressV3Variant = 'meta' | 'compact';

export function progressV3Height(variant: ProgressV3Variant, tokens: Tokens): number {
  const p = tokens.kit.v3.progress;
  return variant === 'meta' ? p.metaH : p.compactH;
}

/** Track padding the fill keeps inside the contour (contour + 2 px). */
export function progressV3Pad(variant: ProgressV3Variant, tokens: Tokens): number {
  const p = tokens.kit.v3.progress;
  return (variant === 'meta' ? p.strokePx : 4) + 2;
}

export function progressV3Slices(variant: ProgressV3Variant, tokens: Tokens): Slices {
  const h = progressV3Height(variant, tokens);
  return { left: h / 2 + 4, right: h / 2 + 4, top: 0, bottom: 0 };
}

/** Fill frame height (inside the track's pad). */
export const progressV3FillHeight = (variant: ProgressV3Variant, tokens: Tokens): number =>
  progressV3Height(variant, tokens) - 2 * progressV3Pad(variant, tokens);

export function progressV3FillSlices(variant: ProgressV3Variant, tokens: Tokens): Slices {
  const h = progressV3FillHeight(variant, tokens);
  return { left: h / 2 + 2, right: h / 2 + 2, top: 0, bottom: 0 };
}

/** ART_REFERENCE §3.8 track: orange contour (compact: `ui.ink`) around the dark blue (compact: brown) well. */
export function drawProgressV3Track(
  ctx: DrawContext,
  spec: { readonly w: number; readonly variant: ProgressV3Variant },
  tokens: Tokens,
): void {
  const p = tokens.kit.v3.progress;
  const h = progressV3Height(spec.variant, tokens);
  const meta = spec.variant === 'meta';
  const sp = meta ? p.strokePx : 4;
  roundRect(ctx, 0, 0, spec.w, h, h / 2);
  ctx.fillStyle = css(rgb(meta ? p.stroke : tokens.color.ui.ink));
  ctx.fill();
  roundRect(ctx, sp, sp, spec.w - 2 * sp, h - 2 * sp, h / 2 - sp);
  ctx.fillStyle = css(rgb(meta ? p.track : tokens.color.ui.ink));
  ctx.fill();
  if (!meta) {
    roundRect(ctx, sp, sp, spec.w - 2 * sp, h - 2 * sp, h / 2 - sp);
    ctx.fillStyle = css(rgb(tokens.kit.progress.track));
    ctx.fill();
  }
}

/** ART_REFERENCE §3.8 fill: dark green edge → green gradient (compact: gold) → white gloss on the top 14 px. */
export function drawProgressV3Fill(
  ctx: DrawContext,
  spec: { readonly w: number; readonly variant: ProgressV3Variant },
  tokens: Tokens,
): void {
  const p = tokens.kit.v3.progress;
  const h = progressV3FillHeight(spec.variant, tokens);
  const meta = spec.variant === 'meta';
  const e = meta ? p.fillEdgePx : 2;
  roundRect(ctx, 0, 0, spec.w, h, h / 2);
  ctx.fillStyle = css(rgb(meta ? p.fillEdge : tokens.kit.v3.palette.goldStroke));
  ctx.fill();
  roundRect(ctx, e, e, spec.w - 2 * e, h - 2 * e, h / 2 - e);
  ctx.fillStyle = vGradient(ctx, e, h - e, [
    [0, rgb(meta ? p.fillTop : tokens.kit.v3.palette.goldLight)],
    [1, rgb(meta ? p.fillBottom : tokens.kit.v3.palette.goldDark)],
  ]);
  ctx.fill();
  ctx.save();
  roundRect(ctx, e, e, spec.w - 2 * e, h - 2 * e, h / 2 - e);
  ctx.clip();
  ctx.fillStyle = css(WHITE, p.fillGlossAlpha);
  ctx.fillRect(e, e, spec.w - 2 * e, Math.min(p.fillGlossPx, h * 0.3));
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------
// Bottom navigation (§3.9)

/** `ui_nav_bar`: a narrow vertical strip of the bar (gradient + the dark / light top edge lines); stretched in x. */
export function drawNavBarV3(
  ctx: DrawContext,
  spec: { readonly w: number; readonly h: number },
  tokens: Tokens,
): void {
  const n = tokens.kit.v3.nav;
  ctx.fillStyle = vGradient(ctx, 0, spec.h, [
    [0, rgb(n.barTop)],
    [1, rgb(n.barBottom)],
  ]);
  ctx.fillRect(0, 0, spec.w, spec.h);
  ctx.fillStyle = css(rgb(n.edgeDark));
  ctx.fillRect(0, 0, spec.w, n.edgeDarkPx);
  ctx.fillStyle = css(rgb(n.edgeLight));
  ctx.fillRect(0, n.edgeDarkPx, spec.w, n.edgeLightPx);
}

export function navTabV3Size(tokens: Tokens): Size {
  const n = tokens.kit.v3.nav;
  return { w: n.raisedW, h: n.raisedH };
}

/** ART_REFERENCE §3.9 raised selected tab: contour → inner light line → face gradient; round at the top only. */
export function drawNavTabV3(ctx: DrawContext, tokens: Tokens): void {
  const n = tokens.kit.v3.nav;
  const { w, h } = navTabV3Size(tokens);
  const r = n.raisedRadiusPx;
  const s = n.raisedStrokePx;
  topRoundRect(ctx, 0, 0, w, h, r);
  ctx.fillStyle = css(rgb(n.raisedStroke));
  ctx.fill();
  topRoundRect(ctx, s, s, w - 2 * s, h - s, r - s);
  ctx.fillStyle = css(rgb(n.raisedInnerLine));
  ctx.fill();
  const i = s + n.raisedInnerLinePx;
  topRoundRect(ctx, i, i, w - 2 * i, h - i, r - i);
  ctx.fillStyle = vGradient(ctx, i, h, [
    [0, rgb(n.raisedTop)],
    [1, rgb(n.raisedBottom)],
  ]);
  ctx.fill();
}

// ---------------------------------------------------------------------------------------------------------------
// Bubble (§3.14)

export function bubbleV3FrameSize(spec: { readonly w: number; readonly h: number }, tokens: Tokens): Size {
  const b = tokens.kit.v3.bubble;
  return { w: spec.w, h: spec.h + b.shadowYPx };
}

export function bubbleV3Slices(tokens: Tokens): Slices {
  const b = tokens.kit.v3.bubble;
  const e = b.radiusPx + 4;
  return { left: e, right: e, top: e, bottom: e + b.strokeOuterBottomPx - b.strokeOuterPx + b.shadowYPx };
}

/** Inner padding of the bubble body (the two rings). */
export function bubbleV3Inset(tokens: Tokens): { readonly side: number; readonly bottom: number } {
  const b = tokens.kit.v3.bubble;
  return { side: b.strokeOuterPx + b.strokeInnerPx, bottom: b.strokeOuterBottomPx + b.strokeInnerPx };
}

/** ART_REFERENCE §3.14 cream bubble: shadow → dark outer ring (thicker at the bottom) → blue inner ring → cream fill. */
export function drawBubbleV3(
  ctx: DrawContext,
  spec: { readonly w: number; readonly h: number },
  tokens: Tokens,
): void {
  const b = tokens.kit.v3.bubble;
  const { w, h } = spec;
  const r = b.radiusPx;
  roundRect(ctx, 0, b.shadowYPx, w, h, r);
  ctx.fillStyle = css(BLACK, b.shadowAlpha);
  ctx.fill();
  roundRect(ctx, 0, 0, w, h, r);
  ctx.fillStyle = css(rgb(b.strokeOuter));
  ctx.fill();
  const o = b.strokeOuterPx;
  const ob = b.strokeOuterBottomPx;
  roundRect(ctx, o, o, w - 2 * o, h - o - ob, r - o);
  ctx.fillStyle = css(rgb(b.strokeInner));
  ctx.fill();
  const i = o + b.strokeInnerPx;
  const ib = ob + b.strokeInnerPx;
  roundRect(ctx, i, i, w - 2 * i, h - i - ib, Math.max(6, r - i));
  ctx.fillStyle = css(rgb(b.fill));
  ctx.fill();
}

export type TailDirV3 = 'left' | 'down' | 'up';

/** Tail frame: 28 px long + the rings it covers; base = 56. */
export const BUBBLE_V3_TAIL_PX = 28;

export function bubbleV3TailSize(dir: TailDirV3, tokens: Tokens): Size {
  const b = tokens.kit.v3.bubble;
  const len = BUBBLE_V3_TAIL_PX + b.strokeOuterPx + b.strokeInnerPx;
  const base = BUBBLE_V3_TAIL_PX * 2;
  return dir === 'left' ? { w: len, h: base } : { w: base, h: len };
}

/**
 * Bubble tail (the short hint balloons): a cream triangle whose base overlaps the bubble's rings so the joint shows no
 * line; the two free edges carry the blue ring and the dark outer ring.
 */
export function drawBubbleV3Tail(ctx: DrawContext, spec: { readonly dir: TailDirV3 }, tokens: Tokens): void {
  const b = tokens.kit.v3.bubble;
  const { w, h } = bubbleV3TailSize(spec.dir, tokens);
  const so = b.strokeOuterPx;
  const si = b.strokeInnerPx;
  ctx.save();
  if (spec.dir !== 'left') {
    ctx.translate(w / 2, h / 2);
    ctx.rotate(spec.dir === 'down' ? -Math.PI / 2 : Math.PI / 2);
    ctx.translate(-h / 2, -w / 2);
  }
  const L = spec.dir === 'left' ? w : h;
  const B = spec.dir === 'left' ? h : w;
  const tri = (inset: number): void => {
    ctx.beginPath();
    ctx.moveTo(L, inset);
    ctx.lineTo(inset * 1.6, B / 2);
    ctx.lineTo(L, B - inset);
    ctx.closePath();
  };
  ctx.lineJoin = 'round';
  tri(so / 2);
  ctx.lineWidth = so;
  ctx.strokeStyle = css(rgb(b.strokeOuter));
  ctx.stroke();
  ctx.fillStyle = css(rgb(b.strokeOuter));
  ctx.fill();
  tri(so + si / 2);
  ctx.lineWidth = si;
  ctx.strokeStyle = css(rgb(b.strokeInner));
  ctx.stroke();
  ctx.fillStyle = css(rgb(b.strokeInner));
  ctx.fill();
  tri(so + si + 1);
  ctx.fillStyle = css(rgb(b.fill));
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------
// Lock (§3.13), toggle (§9.5), moves plate (§9.4), highlight (§9.9)

export function lockV3Size(variant: 'small' | 'big', tokens: Tokens): Size {
  const l = tokens.kit.v3.lock;
  return variant === 'small' ? { w: l.smallW, h: l.smallH + 4 } : { w: l.bigW, h: l.bigH + 6 };
}

/** ART_REFERENCE §3.13 gold padlock: shackle ("U") → body (gradient, contour, top-left gloss) → keyhole; shadow +4. */
export function drawLockV3(
  ctx: DrawContext,
  spec: { readonly variant: 'small' | 'big' },
  tokens: Tokens,
): void {
  const l = tokens.kit.v3.lock;
  const small = spec.variant === 'small';
  const w = small ? l.smallW : l.bigW;
  const h = small ? l.smallH : l.bigH;
  const sp = small ? Math.max(2, l.strokePx - 1) : l.strokePx;
  const sh = small ? 6 : l.shacklePx;
  const bodyH = h * 0.58;
  const bodyY = h - bodyH;
  const r = small ? 8 : 22;
  // shackle
  const sw = w * l.shackleWidthRatio;
  const cx = w / 2;
  const top = sh + 2;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - sw / 2, bodyY + 4);
  ctx.lineTo(cx - sw / 2, top + sw / 2);
  ctx.arc(cx, top + sw / 2, sw / 2, Math.PI, 0);
  ctx.lineTo(cx + sw / 2, bodyY + 4);
  ctx.lineWidth = sh + 2 * sp;
  ctx.strokeStyle = css(rgb(l.stroke));
  ctx.stroke();
  ctx.lineWidth = sh;
  ctx.strokeStyle = css(rgb(l.shackle));
  ctx.stroke();
  ctx.lineWidth = Math.max(1, sh * 0.3);
  ctx.strokeStyle = css(rgb(l.shackleInner));
  ctx.stroke();
  ctx.restore();
  // body
  roundRect(ctx, 0, bodyY + 4, w, bodyH, r);
  ctx.fillStyle = css(BLACK, l.shadowAlpha);
  ctx.fill();
  roundRect(ctx, 0, bodyY, w, bodyH, r);
  ctx.fillStyle = css(rgb(l.stroke));
  ctx.fill();
  roundRect(ctx, sp, bodyY + sp, w - 2 * sp, bodyH - 2 * sp, r - sp);
  ctx.fillStyle = vGradient(ctx, bodyY, bodyY + bodyH, [
    [0, rgb(l.bodyTop)],
    [0.5, rgb(l.bodyMid)],
    [1, rgb(l.bodyBottom)],
  ]);
  ctx.fill();
  roundRect(ctx, sp + 3, bodyY + sp + 3, w * 0.45, small ? 3 : 6, 3);
  ctx.fillStyle = css(WHITE, l.glossAlpha);
  ctx.fill();
  // keyhole: disc + trapezoid
  const kr = (w * l.keyholeRatio) / 2;
  const ky = bodyY + bodyH * 0.42;
  ctx.beginPath();
  ctx.arc(cx, ky, kr, 0, Math.PI * 2);
  ctx.fillStyle = css(rgb(l.keyhole));
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - kr * 0.55, ky + kr * 0.4);
  ctx.lineTo(cx + kr * 0.55, ky + kr * 0.4);
  ctx.lineTo(cx + kr * 0.8, bodyY + bodyH - sp - 4);
  ctx.lineTo(cx - kr * 0.8, bodyY + bodyH - sp - 4);
  ctx.closePath();
  ctx.fill();
}

export function toggleV3Size(tokens: Tokens): Size {
  const p = tokens.kit.v3.screen.pause;
  return { w: p.toggleW, h: p.toggleH + 6 };
}

/** ART_REFERENCE §9.5 switch: green (on) / grey (off) pill with a dark lip and a white knob (right = on). */
export function drawToggleV3(ctx: DrawContext, spec: { readonly on: boolean }, tokens: Tokens): void {
  const p = tokens.kit.v3.screen.pause;
  const w = p.toggleW;
  const h = p.toggleH;
  const r = h / 2;
  const base = rgb(spec.on ? p.toggleOn : p.toggleOff);
  roundRect(ctx, 0, 6, w, h, r);
  ctx.fillStyle = css(shade(base, 0.55));
  ctx.fill();
  roundRect(ctx, 0, 0, w, h, r);
  ctx.fillStyle = css(shade(base, 0.7));
  ctx.fill();
  roundRect(ctx, 3, 3, w - 6, h - 6, r - 3);
  ctx.fillStyle = vGradient(ctx, 3, h - 3, [
    [0, shade(base, 1.08)],
    [1, shade(base, 0.92)],
  ]);
  ctx.fill();
  const kr = p.knobPx / 2;
  const kx = spec.on ? w - 8 - kr : 8 + kr;
  ctx.beginPath();
  ctx.arc(kx, h / 2 + 4, kr, 0, Math.PI * 2);
  ctx.fillStyle = css(BLACK, 0.25);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(kx, h / 2, kr, 0, Math.PI * 2);
  ctx.fillStyle = vGradient(ctx, h / 2 - kr, h / 2 + kr, [
    [0, WHITE],
    [1, rgb('#E6E0F0')],
  ]);
  ctx.fill();
}

export function movesPlateV3Size(tokens: Tokens): Size {
  const h = tokens.kit.v3.screen.hud;
  return { w: h.movesW, h: h.movesH + 8 };
}

/** ART_REFERENCE §9.4 moves plate: navy contour → cream plate → navy top band with two gold lines (+ 8 px shadow). */
export function drawMovesPlateV3(ctx: DrawContext, tokens: Tokens): void {
  const s = tokens.kit.v3.screen.hud;
  const pal = tokens.kit.v3.palette;
  const hd = tokens.kit.v3.header;
  const w = s.movesW;
  const h = s.movesH;
  const r = 24;
  roundRect(ctx, 0, 8, w, h, r);
  ctx.fillStyle = css(BLACK, 0.3);
  ctx.fill();
  roundRect(ctx, 0, 0, w, h, r);
  ctx.fillStyle = css(rgb(pal.navy));
  ctx.fill();
  roundRect(ctx, 4, 4, w - 8, h - 8, r - 4);
  ctx.fillStyle = vGradient(ctx, 4, h - 4, [
    [0, rgb(s.movesCream)],
    [1, shade(rgb(s.movesCream), 0.94)],
  ]);
  ctx.fill();
  ctx.save();
  roundRect(ctx, 4, 4, w - 8, h - 8, r - 4);
  ctx.clip();
  ctx.fillStyle = css(rgb(s.movesBand));
  ctx.fillRect(4, 4, w - 8, s.movesBandH);
  ctx.fillStyle = css(rgb(hd.goldLine1));
  ctx.fillRect(4, 4 + s.movesBandH - 8, w - 8, 4);
  ctx.fillStyle = css(rgb(hd.goldLine2));
  ctx.fillRect(4, 4 + s.movesBandH - 4, w - 8, 4);
  ctx.restore();
}

export function highlightV3Pad(tokens: Tokens): number {
  const t = tokens.tutorial;
  return t.highlightPadPx + t.highlightStrokePx + t.highlightGlowPx;
}

export function highlightV3Slices(tokens: Tokens): Slices {
  const e = highlightV3Pad(tokens) + 24;
  return { left: e, right: e, top: e, bottom: e };
}

/** ART_REFERENCE §9.9 highlight: 8 px cyan α 0,9 contour + 18 px cyan α 0,35 glow (the v2 geometry, cyan). */
export function drawHighlightV3(
  ctx: DrawContext,
  spec: { readonly w: number; readonly h: number },
  tokens: Tokens,
): void {
  const t = tokens.tutorial;
  const b = tokens.kit.v3.bubble;
  const inset = t.highlightGlowPx + t.highlightStrokePx / 2;
  ctx.save();
  roundRect(ctx, inset, inset, spec.w - 2 * inset, spec.h - 2 * inset, 28);
  ctx.shadowColor = css(rgb(b.highlight), b.highlightGlowAlpha * 2);
  ctx.shadowBlur = t.highlightGlowPx;
  ctx.lineWidth = t.highlightStrokePx;
  ctx.strokeStyle = css(rgb(b.highlight), b.highlightAlpha);
  ctx.stroke();
  ctx.restore();
}

/** Portrait ring v3: cream disc with the bubble's dark ring (ART_REFERENCE §3.14). */
export function drawPortraitRingV3(ctx: DrawContext, spec: { readonly d: number }, tokens: Tokens): void {
  const b = tokens.kit.v3.bubble;
  const d = spec.d;
  ctx.beginPath();
  ctx.arc(d / 2, d / 2, d / 2 - 3, 0, Math.PI * 2);
  ctx.fillStyle = css(rgb(b.fill));
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = css(rgb(b.strokeOuter));
  ctx.stroke();
}

// ---------------------------------------------------------------------------------------------------------------
// Scene grounds (§7.2 game, §7.4 loading)

/**
 * ART_REFERENCE §7.2 game ground: base → radial glow at (0,5 W, 0,26 H) r 0,6 W → vignette (× `vignette` at the
 * edges). Drawn at any size (the scene bakes it small and stretches it).
 */
export function drawSceneGlowV3(ctx: DrawContext, size: Size, tokens: Tokens): void {
  const s = tokens.kit.v3.scene;
  const { w, h } = size;
  ctx.fillStyle = css(rgb(s.gameBase));
  ctx.fillRect(0, 0, w, h);
  const cx = s.glowCx * w;
  const cy = s.glowCy * h;
  const r = s.glowR * w;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, css(rgb(s.gameGlow), 1));
  g.addColorStop(1, css(rgb(s.gameGlow), 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const v = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.35,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.75,
  );
  v.addColorStop(0, css(BLACK, 0));
  v.addColorStop(1, css(BLACK, 1 - s.vignette));
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

/** ART_REFERENCE §7.4 loading sky: the `load*` gradient and three cloud layers from `loadCloudStart` down. */
export function drawLoadingSkyV3(ctx: DrawContext, size: Size, tokens: Tokens): void {
  const p = tokens.kit.v3.palette;
  const s = tokens.kit.v3.scene;
  const { w, h } = size;
  ctx.fillStyle = vGradient(ctx, 0, h, [
    [0, rgb(p.loadTop)],
    [0.3, rgb(p.loadMid)],
    [0.46, rgb(p.loadLight)],
    [0.61, rgb(p.loadCloud)],
    [1, rgb('#D9BFC8')],
  ]);
  ctx.fillRect(0, 0, w, h);
  const layers: readonly (readonly [string, number, number])[] = [
    ['#E6D2DD', 0.62, 0.11],
    ['#F4E3E8', 0.68, 0.09],
    ['#FFFFFF', 0.74, 0.08],
  ];
  layers.forEach(([color, at, bump], li) => {
    const y = h * at;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, y + h * 0.04);
    const n = 7 + li;
    for (let i = 0; i <= n; i++) {
      const x = (w * i) / n;
      const rr = w * bump * (0.8 + 0.4 * ((i * 7 + li * 3) % 3)) * 0.5;
      ctx.arc(x, y + rr * 0.4, rr, Math.PI, 0);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = css(rgb(color), li === 2 ? 0.95 : 1);
    ctx.fill();
  });
  // soft white haze band between the sky and the clouds (§7.1 layer 8)
  ctx.fillStyle = vGradient(ctx, h * (s.loadCloudStart - 0.12), h * s.loadCloudStart, [
    [0, WHITE, 0],
    [1, WHITE, 0.12],
  ]);
  ctx.fillRect(0, h * (s.loadCloudStart - 0.12), w, h * 0.12);
}

// ---------------------------------------------------------------------------------------------------------------
// Frame catalogue helpers (names the kit atlas and the components share)

/** Button bakes made at boot: the (colour, height) pairs the v3 screens use; other heights bake on demand. */
export const KIT_V3_BUTTON_BAKES: readonly (readonly [KitV3ButtonColor, number, boolean])[] = Object.freeze([
  ['green', 212, false],
  ['green', 200, false],
  ['green', 176, false],
  ['green', 152, false],
  ['green', 160, true],
  ['grey', 160, true],
  ['blue', 184, true],
  ['grey', 184, true],
  ['purple', 136, true],
  ['purple', 104, true],
  ['cream', 136, false],
  ['cream', 152, false],
  ['cream', 128, false],
  ['orange', 152, false],
]);

export const kitButtonV3FrameName = (
  color: KitV3ButtonColor,
  h: number,
  state: ButtonV3State = 'normal',
  square = false,
): string => `ui3_button_${color}_h${h}${square ? 'sq' : ''}${state === 'normal' ? '' : `_${state}`}`;

/** Source width of a 3-sliced v3 button frame (min width + a stretchable middle). */
export const kitButtonV3SourceW = (h: number, tokens: Tokens, square = false): number =>
  square ? h : buttonV3MinWidth(h, tokens) + 16;

/** Which states a colour bakes: grey = normal + disabled (the passive look), the rest normal + pressed. */
export function kitButtonV3States(color: KitV3ButtonColor): readonly ButtonV3State[] {
  return color === 'grey' ? ['normal', 'disabled'] : ['normal', 'pressed'];
}

// ---------------------------------------------------------------------------------------------------------------
// Text looks (ART_REFERENCE §4) — plain numbers for Phaser Text (`stroke`, `strokeThickness`, `shadow`)

export type TextRoleV3 =
  | 'button'
  | 'counterCream'
  | 'counterLavender'
  | 'bigNumber'
  | 'cardText'
  | 'rowText'
  | 'label'
  | 'plain'
  /** Front layer of the two-ring title: white + ring 1. */
  | 'titleRingFront'
  /** Back layer of the two-ring title: ring 2 (outside ring 1) + the shadow. */
  | 'titleRingBack'
  /** Gold title: the stroke + shadow look; the scene tints the white fill top → bottom. */
  | 'titleGold';

export interface TextLookV3 {
  readonly fill: string;
  readonly stroke: string | null;
  /** Canvas line width (the visible outer contour is half of it). */
  readonly strokePx: number;
  readonly shadow: string | null;
  readonly shadowDy: number;
  readonly shadowAlpha: number;
  readonly weight: number;
}

/**
 * ART_REFERENCE §4 look of a role at `sizePx`; `colors` = the ground's text / contour colours for `button`
 * (`kit.v3.buttonColor.<v>.text / textStroke`). Em values × size; canvas strokes are centred on the outline, so the
 * line width is twice the visible contour.
 */
export function textLookV3(
  role: TextRoleV3,
  sizePx: number,
  tokens: Tokens,
  colors?: { readonly fill?: string; readonly stroke?: string },
): TextLookV3 {
  const T = tokens.kit.v3.text;
  const none = { stroke: null, strokePx: 0, shadow: null, shadowDy: 0, shadowAlpha: 1 };
  switch (role) {
    case 'button': {
      const b = T.button;
      const stroke = colors?.stroke ?? tokens.kit.v3.buttonColor.green.textStroke;
      return {
        fill: colors?.fill ?? '#FFFFFF',
        stroke,
        strokePx: 2 * Math.max(b.strokeMinPx, b.strokeEm * sizePx),
        shadow: stroke,
        shadowDy: b.shadowEm * sizePx,
        shadowAlpha: 1,
        weight: 800,
      };
    }
    case 'counterCream':
      return {
        ...none,
        fill: T.counterCream.fill,
        stroke: T.counterCream.stroke,
        strokePx: 2 * T.counterCream.strokeEm * sizePx,
        weight: 800,
      };
    case 'counterLavender':
      return {
        ...none,
        fill: T.counterLavender.fill,
        shadow: T.counterLavender.shadow,
        shadowDy: T.counterLavender.shadowPx,
        weight: 800,
      };
    case 'bigNumber':
      return {
        fill: T.bigNumber.fill,
        stroke: T.bigNumber.stroke,
        strokePx: 2 * T.bigNumber.strokeEm * sizePx,
        shadow: T.bigNumber.stroke,
        shadowDy: T.bigNumber.shadowEm * sizePx,
        shadowAlpha: 1,
        weight: 800,
      };
    case 'cardText':
      return { ...none, fill: T.cardText.fill, weight: 700 };
    case 'rowText':
      return { ...none, fill: T.rowText.fill, weight: 700 };
    case 'label':
      return { ...none, fill: T.label.fill, weight: 700 };
    case 'plain':
      return {
        fill: T.plain.fill,
        stroke: T.plain.stroke,
        strokePx: 2 * T.plain.strokeEm * sizePx,
        shadow: T.plain.stroke,
        shadowDy: T.plain.shadowEm * sizePx,
        shadowAlpha: 1,
        weight: 800,
      };
    case 'titleRingFront':
      return {
        ...none,
        fill: T.titleTwoRing.fill,
        stroke: T.titleTwoRing.ring1,
        strokePx: 2 * T.titleTwoRing.ring1Em * sizePx,
        weight: 800,
      };
    case 'titleRingBack':
      return {
        fill: T.titleTwoRing.ring2,
        stroke: T.titleTwoRing.ring2,
        strokePx: 2 * (T.titleTwoRing.ring1Em + T.titleTwoRing.ring2Em) * sizePx,
        shadow: T.titleTwoRing.shadow,
        shadowDy: T.titleTwoRing.shadowEm * sizePx,
        shadowAlpha: 1,
        weight: 800,
      };
    case 'titleGold':
      return {
        fill: '#FFFFFF',
        stroke: T.titleGold.stroke,
        strokePx: 2 * T.titleGold.strokeEm * sizePx,
        shadow: T.titleGold.shadow,
        shadowDy: T.titleGold.shadowEm * sizePx,
        shadowAlpha: T.titleGold.shadowAlpha,
        weight: 800,
      };
  }
}
