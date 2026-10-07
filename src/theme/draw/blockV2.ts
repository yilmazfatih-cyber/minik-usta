/**
 * Candy block v2 (ART_DIRECTION §2.5, §3A, §3A.5, §6 Ağır Yük; TECH_DESIGN §2R.7, R2-12).
 *
 * One texture per piece (shape × colour), drawn at the origin in a `w·c × h·c` box, `c = cellPx · k` (k = TECH §2R.1
 * cell scale; every `blockV2.*Px` value is multiplied by k). Draw order ART §3A.4:
 *   S = outline polygon inset `insetPx` → filled with the outline tone (it stays a ring under B)
 *   B = S inset `outlinePx`            → side-wall tone (visible only as the 12 px lip under open bottom edges)
 *   F = B with its bottom edges lifted `lipPx` → groove tone (between and around the pillows)
 *   per cell: pillow P (gradient light → base → bottom, inner shade, gloss ellipse) → ONE stud (side crescent, flat
 *   base face, rim) → the colour symbol on the stud's top with an emboss copy.
 * The stud's gloss arc + dot is NOT part of the block: it is a separate colourless texture (`drawBlockGlossV2`) that
 * the scene puts only on holdable pieces (K-09, DL-2R-17). Also here: blurred v2 silhouettes, fall-shadow ghosts on
 * the v2 outline, the lift glow ring (#91), the neutral "blocks left" icon (ART §14.9) and the Heavy Load (Y5, ART §6).
 *
 * Pure Canvas2D calls on a `DrawContext`; same input → same call sequence (tests/theme/blockV2.test.ts).
 */
import { shapeById } from '../../core/shapes.ts';
import type { ShapeDef } from '../../core/shapes.ts';
import type { ColorCode, ShapeId } from '../../core/types.ts';
import type { Tokens } from '../tokens.ts';
import { ART } from './art.ts';
import { GHOST_STYLES, ghostPad, silhouettePad } from './block.ts';
import type { BakedFlag, GhostStyle, SilhouetteKind } from './block.ts';
import { BLACK, DEFAULT_MODE, WHITE, blockBase, css, lstar, mix, parseHex, shade } from './color.ts';
import type { DrawMode, Ink, Rgb } from './color.ts';
import type { DrawContext, Size } from './context.ts';
import { canvasCells, polyominoOutline } from './path.ts';
import type { Corner, Point } from './path.ts';
import { drawSymbol } from './symbols.ts';

export { GHOST_STYLES };

// ---------------------------------------------------------------------------------------------------------------
// Colours (ART §2.5)

/** The six derived tones of a base colour (ART §2.5 formulas, `blockV2.*Mix` / `*Factor`). */
export interface BlockV2Tones {
  readonly base: Rgb;
  /** base·(1 − lightMix) + white·lightMix: top stop of the pillow gradient. */
  readonly light: Rgb;
  /** base × bottomFactor: bottom stop of the pillow gradient. */
  readonly bottom: Rgb;
  /** base × grooveFactor: face between and around the pillows. */
  readonly groove: Rgb;
  /** base × darkFactor: side wall (lip), inner shade, stud side. */
  readonly dark: Rgb;
  /** base × outlineFactor: outer contour, stud rim, dark emboss. */
  readonly outline: Rgb;
  /** base·(1 − glowMix) + white·glowMix: lift glow, sparkles, confetti edge. */
  readonly glow: Rgb;
}

export interface BlockV2Palette extends BlockV2Tones {
  readonly symbol: Ink;
  /** Emboss copy drawn under the symbol: white α `embossLightAlpha` (dark ink) or outline α `embossDarkAlpha`. */
  readonly emboss: Ink;
  /** Emboss offset (px at k = 1): `embossLightOffsetPx` or `embossDarkOffsetPx`. */
  readonly embossOffsetPx: number;
}

/** ART §2.5 tones of any base colour (blocks, the cream kit icon …). */
export function blockV2Tones(tokens: Tokens, base: Rgb): BlockV2Tones {
  const v = tokens.blockV2;
  return {
    base,
    light: mix(base, WHITE, v.lightMix),
    bottom: shade(base, v.bottomFactor),
    groove: shade(base, v.grooveFactor),
    dark: shade(base, v.darkFactor),
    outline: shade(base, v.outlineFactor),
    glow: mix(base, WHITE, v.glowMix),
  };
}

/** True when the colour takes the dark (×0.40) symbol ink (ART §2.2: L* ≥ `block.symbolLightThresholdLstar`). */
export function hasDarkInk(tokens: Tokens, color: ColorCode): boolean {
  return lstar(blockBase(tokens, color)) >= tokens.block.symbolLightThresholdLstar;
}

/**
 * v2 symbol ink (ART §2.5): the §2.2 rule with white at `blockV2.symbolWhiteAlpha` (92 %); colour-blind mode (ART §10)
 * boosts it like v1 (dark × (1 − boost), white α × (1 + boost), capped at 1).
 */
export function symbolInkV2(tokens: Tokens, color: ColorCode, mode: DrawMode = DEFAULT_MODE): Ink {
  const base = blockBase(tokens, color);
  const boost = mode.colorBlind ? tokens.a11y.colorBlindContrastBoost : 0;
  if (hasDarkInk(tokens, color)) {
    return { rgb: shade(base, tokens.block.symbolDarkFactor * (1 - boost)), alpha: 1 };
  }
  return { rgb: WHITE, alpha: Math.min(1, tokens.blockV2.symbolWhiteAlpha * (1 + boost)) };
}

export function blockV2Palette(
  tokens: Tokens,
  color: ColorCode,
  mode: DrawMode = DEFAULT_MODE,
): BlockV2Palette {
  const v = tokens.blockV2;
  const tones = blockV2Tones(tokens, blockBase(tokens, color));
  const dark = hasDarkInk(tokens, color);
  return {
    ...tones,
    symbol: symbolInkV2(tokens, color, mode),
    emboss: dark
      ? { rgb: WHITE, alpha: v.embossLightAlpha }
      : { rgb: tones.outline, alpha: v.embossDarkAlpha },
    embossOffsetPx: dark ? v.embossLightOffsetPx : v.embossDarkOffsetPx,
  };
}

/**
 * Palette of the neutral "blocks left" icon (ART §14.9, PL-2R-14): §3A geometry in the cream kit colours — face
 * `kit.buttonColor.cream.base`, side wall `cream.lip`, contour `ui.ink`; no symbol.
 */
export function creamBlockPalette(tokens: Tokens): BlockV2Palette {
  const cream = tokens.kit.buttonColor.cream;
  const tones = blockV2Tones(tokens, parseHex(cream.base));
  const outline = parseHex(tokens.color.ui.ink);
  return {
    ...tones,
    light: parseHex(cream.top),
    dark: parseHex(cream.lip),
    outline,
    symbol: { rgb: outline, alpha: 1 },
    emboss: { rgb: WHITE, alpha: 0 },
    embossOffsetPx: 0,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Geometry (ART §3A.1)

export type EdgeSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Which side of the shape a directed outline edge a → b is (clockwise on screen, y down, interior on the right):
 * → top, ← bottom, ↓ right, ↑ left.
 */
export function edgeSide(a: Point, b: Point): EdgeSide {
  if (a.y === b.y) return b.x > a.x ? 'top' : 'bottom';
  return b.y > a.y ? 'right' : 'left';
}

/**
 * ART §3A.1 item 3 / §3A.4 `offsetEdges`: moves every edge of a clockwise rectilinear outline along its inward normal
 * by the amount of its side (top edges by `top`, …; negative = outward). A corner is the intersection of its two moved
 * edges (exact for rectilinear outlines). Convexity flags are kept. Pure.
 */
export function offsetEdges(
  poly: readonly Corner[],
  top: number,
  right: number,
  bottom: number,
  left: number,
): Corner[] {
  const n = poly.length;
  return poly.map((v, i) => {
    const prev = poly[(i + n - 1) % n] as Corner;
    const next = poly[(i + 1) % n] as Corner;
    let x = v.x;
    let y = v.y;
    for (const side of [edgeSide(prev, v), edgeSide(v, next)]) {
      if (side === 'top') y = v.y + top;
      else if (side === 'bottom') y = v.y - bottom;
      else if (side === 'right') x = v.x - right;
      else x = v.x + left;
    }
    return { x, y, convex: v.convex };
  });
}

/** Cell size of a bake: `layout.grid.cellPx · k` (TECH §2R.1, `k = c / 120`). */
export const cellPxOf = (tokens: Tokens, k = 1): number => tokens.layout.grid.cellPx * k;

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface Stud {
  readonly cx: number;
  readonly cy: number;
  readonly d: number;
}

export interface BlockV2Geometry {
  readonly c: number;
  /** Silhouette S (`insetPx`), body B (+`outlinePx`), face F (B with open bottom edges lifted `lipPx`). */
  readonly S: Corner[];
  readonly B: Corner[];
  readonly F: Corner[];
  /** Corner radii (convex / concave) of S and of B / F. */
  readonly radiiS: readonly [number, number];
  readonly radiiB: readonly [number, number];
  /** Canvas cells (column, row) in shape cell order. */
  readonly cells: readonly Point[];
  /** Pillow rectangle per cell (ART §3A.1 item 4) and its corner radius. */
  readonly pillows: readonly Rect[];
  readonly pillowRadius: number;
  /** One stud per cell (ART §3A.5 layer 6a). */
  readonly studs: readonly Stud[];
}

/** ART §3A.1 geometry of a shape at scale k (pure; the drawers and tests share it). */
export function blockV2Geometry(shape: ShapeDef, tokens: Tokens, k = 1): BlockV2Geometry {
  const v = tokens.blockV2;
  const c = cellPxOf(tokens, k);
  const cells = canvasCells(shape.cells, shape.h);
  const poly = polyominoOutline(cells, c);
  const ins = v.insetPx * k;
  const out = v.outlinePx * k;
  const lip = v.lipPx * k;
  const S = offsetEdges(poly, ins, ins, ins, ins);
  const B = offsetEdges(S, out, out, out, out);
  const F = offsetEdges(B, 0, 0, lip, 0);
  const R = v.cornerRadiusRatio * c;
  const r = v.innerCornerRadiusRatio * c;
  const has = (x: number, y: number): boolean => cells.some((p) => p.x === x && p.y === y);
  const shared = v.pillowInsetRatio * c;
  const open = v.pillowOpenInsetRatio * c;
  const pillows = cells.map((p) => {
    const l = p.x * c + (has(p.x - 1, p.y) ? shared : open);
    const rr = (p.x + 1) * c - (has(p.x + 1, p.y) ? shared : open);
    const t = p.y * c + (has(p.x, p.y - 1) ? shared : open);
    const b = (p.y + 1) * c - (has(p.x, p.y + 1) ? shared : open + lip);
    return { x: l, y: t, w: rr - l, h: b - t };
  });
  const margin = v.studMarginPx * k;
  const side = v.studSidePx * k;
  const studs = pillows.map((P) => {
    const d = Math.min(v.studDiameterRatio * c, P.w - 2 * margin, P.h - 2 * margin - side);
    return { cx: P.x + P.w / 2, cy: P.y + (P.h - side) / 2, d };
  });
  return {
    c,
    S,
    B,
    F,
    radiiS: [R, r],
    radiiB: [R - out, Math.max(2 * k, r - 2 * k)],
    cells,
    pillows,
    pillowRadius: v.pillowRadiusRatio * c,
    studs,
  };
}

const edgeLen = (a: Point, b: Point): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/**
 * `beginPath` + a rectilinear outline with `arcTo` corners (convex `rConvex`, concave `rConcave`); every radius is
 * clamped to half of its shorter edge so a short step never overshoots (lifted faces have 90 px steps).
 */
export function traceCorners(
  ctx: DrawContext,
  corners: readonly Corner[],
  rConvex: number,
  rConcave: number,
): void {
  const n = corners.length;
  const first = corners[0] as Corner;
  const last = corners[n - 1] as Corner;
  ctx.beginPath();
  ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
  for (let i = 0; i < n; i++) {
    const prev = corners[(i + n - 1) % n] as Corner;
    const v = corners[i] as Corner;
    const next = corners[(i + 1) % n] as Corner;
    const r = Math.min(v.convex ? rConvex : rConcave, edgeLen(prev, v) / 2, edgeLen(v, next) / 2);
    ctx.arcTo(v.x, v.y, next.x, next.y, Math.max(0, r));
  }
  ctx.closePath();
}

/** `beginPath` + rounded rectangle with the radius clamped to half the short side. */
export function roundRect(ctx: DrawContext, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  roundRectSub(ctx, x, y, w, h, r);
}

/** Appends a clockwise rounded rectangle sub-path (no `beginPath`): rings with `fill('evenodd')`, unions. */
export function roundRectSub(ctx: DrawContext, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const rad = (deg: number): number => (deg * Math.PI) / 180;

// ---------------------------------------------------------------------------------------------------------------
// Block

export interface BlockV2Spec {
  readonly shape: ShapeId;
  readonly color: ColorCode;
  /** Phase 3 layers (S3, Y8, S8, Y3, Y4, S4): a flagged v2 spec throws until its layer exists. */
  readonly flags?: readonly BakedFlag[];
  readonly mode?: DrawMode;
  /** Cell scale (TECH §2R.1); default 1 (120 px). */
  readonly k?: number;
}

export function blockV2Size(shape: ShapeId, tokens: Tokens, k = 1): Size {
  const s = shapeById(shape);
  const c = cellPxOf(tokens, k);
  return { w: s.w * c, h: s.h * c };
}

/** Draws a placed v2 block at the origin (ART §3A.4 order). */
export function drawBlockV2(ctx: DrawContext, spec: BlockV2Spec, tokens: Tokens): void {
  if (spec.flags && spec.flags.length > 0) {
    throw new Error(`drawBlockV2: flag layers ${spec.flags.join(',')} are Phase 3 (ART §3A.2 layer 8)`);
  }
  const mode = spec.mode ?? DEFAULT_MODE;
  drawCandyBody(ctx, shapeById(spec.shape), blockV2Palette(tokens, spec.color, mode), tokens, spec.k ?? 1, {
    color: spec.color,
    scale: mode.colorBlind ? tokens.a11y.colorBlindSymbolScale : 1,
  });
}

/** The cream, symbol-less "blocks left" goal icon (ART §14.9): C3 at the scale that fits `sizePx`. */
export function drawBlocksLeftIcon(ctx: DrawContext, sizePx: number, tokens: Tokens): void {
  const shape = shapeById('C3_0');
  const k = sizePx / (Math.max(shape.w, shape.h) * tokens.layout.grid.cellPx);
  drawCandyBody(ctx, shape, creamBlockPalette(tokens), tokens, k, null);
}

/**
 * Layers 1–7 of ART §3A.2 / §3A.5 for any palette. `symbol = null` draws no symbol (kit icon). The stud gloss arc and
 * dot (6e, 6f) are never drawn here (holdable layer, `drawBlockGlossV2`); the pillow gloss DOT is drawn only when studs
 * are disabled (`blockV2.studEnabled` false: the first v2 recipe, ART §3A.5 fallback).
 */
function drawCandyBody(
  ctx: DrawContext,
  shape: ShapeDef,
  pal: BlockV2Palette,
  tokens: Tokens,
  k: number,
  symbol: { readonly color: ColorCode; readonly scale: number } | null,
): void {
  const v = tokens.blockV2;
  const g = blockV2Geometry(shape, tokens, k);
  const c = g.c;

  // 1–3: contour ring, side wall, face (one continuous body per piece, ART §3A.3)
  traceCorners(ctx, g.S, g.radiiS[0], g.radiiS[1]);
  ctx.fillStyle = css(pal.outline);
  ctx.fill();
  traceCorners(ctx, g.B, g.radiiB[0], g.radiiB[1]);
  ctx.fillStyle = css(pal.dark);
  ctx.fill();
  traceCorners(ctx, g.F, g.radiiB[0], g.radiiB[1]);
  ctx.fillStyle = css(pal.groove);
  ctx.fill();

  const [ex, ey, erx, ery] = v.glossEllipse;
  const [dx, dy, dr] = v.glossDot;
  for (let i = 0; i < g.pillows.length; i++) {
    const P = g.pillows[i] as Rect;
    // 4: pillow, vertical gradient light → base (gradientStop) → bottom
    const grad = ctx.createLinearGradient(0, P.y, 0, P.y + P.h);
    grad.addColorStop(0, css(pal.light));
    grad.addColorStop(v.gradientStop, css(pal.base));
    grad.addColorStop(1, css(pal.bottom));
    roundRect(ctx, P.x, P.y, P.w, P.h, g.pillowRadius);
    ctx.fillStyle = grad;
    ctx.fill();
    // 5: inner shade, the pillow's bottom `innerShadeRatio`, clipped to the pillow
    ctx.save();
    ctx.clip();
    const sh = P.h * v.innerShadeRatio;
    const shade5 = ctx.createLinearGradient(0, P.y + P.h - sh, 0, P.y + P.h);
    shade5.addColorStop(0, css(pal.dark, 0));
    shade5.addColorStop(1, css(pal.dark, v.innerShadeAlpha));
    ctx.fillStyle = shade5;
    ctx.fillRect(P.x, P.y + P.h - sh, P.w, sh);
    ctx.restore();
    // 6: gloss ellipse (+ the pillow dot only without studs)
    ctx.beginPath();
    ctx.ellipse(P.x + ex * P.w, P.y + ey * P.h, erx * P.w, ery * P.h, rad(v.glossRotDeg), 0, Math.PI * 2);
    ctx.fillStyle = css(WHITE, v.glossAlpha);
    ctx.fill();
    if (!v.studEnabled) {
      ctx.beginPath();
      ctx.arc(P.x + dx * P.w, P.y + dy * P.h, dr * c, 0, Math.PI * 2);
      ctx.fillStyle = css(WHITE, v.glossDotAlpha);
      ctx.fill();
    }

    let sx = P.x + P.w / 2;
    let sy = P.y + v.symbolCenterYRatio * P.h;
    let box = v.symbolSizeRatio * c;
    if (v.studEnabled) {
      // 6a–6d: stud side crescent, flat top face, rim
      const s = g.studs[i] as Stud;
      ctx.beginPath();
      ctx.arc(s.cx, s.cy + v.studSidePx * k, s.d / 2, 0, Math.PI * 2);
      ctx.fillStyle = css(pal.dark);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s.cx, s.cy, s.d / 2, 0, Math.PI * 2);
      ctx.fillStyle = css(pal.base);
      ctx.fill();
      ctx.lineWidth = v.studRimPx * k;
      ctx.strokeStyle = css(pal.outline, v.studRimAlpha);
      ctx.stroke();
      sx = s.cx;
      sy = s.cy;
      box = Math.min(v.symbolSizeRatio * c, v.studSymbolMaxRatio * s.d);
    }
    // 7: symbol with its emboss copy under it (carved lines only on the real glyph)
    if (symbol) {
      const size = box * symbol.scale;
      if (pal.emboss.alpha > 0) {
        drawSymbol(ctx, symbol.color, sx, sy + pal.embossOffsetPx * k, size, pal.emboss, null);
      }
      drawSymbol(ctx, symbol.color, sx, sy, size, pal.symbol, pal.base);
    }
  }
}

/**
 * Holdable gloss layer `blk_gloss_<shape>` (ART §3A.5 6e + 6f, DL-2R-17): white, colourless, one arc + dot per stud,
 * in the block box. The scene places it over holdable pieces only; a not-holdable piece shows no stud gloss and is
 * tinted `blockV2.notHoldableTint`.
 */
export function drawBlockGlossV2(
  ctx: DrawContext,
  spec: { readonly shape: ShapeId; readonly k?: number },
  tokens: Tokens,
): void {
  const v = tokens.blockV2;
  const k = spec.k ?? 1;
  const g = blockV2Geometry(shapeById(spec.shape), tokens, k);
  const [arcR, a0, a1] = v.studGlossArc;
  const [dotR, dotA, dotPx] = v.studDot;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = v.studGlossWidthPx * k;
  ctx.strokeStyle = css(WHITE, v.studGlossAlpha);
  for (const s of g.studs) {
    ctx.beginPath();
    ctx.arc(s.cx, s.cy, arcR * s.d, rad(a0), rad(a1));
    ctx.stroke();
  }
  ctx.fillStyle = css(WHITE, v.studDotAlpha);
  for (const s of g.studs) {
    ctx.beginPath();
    ctx.arc(
      s.cx + Math.cos(rad(dotA)) * dotR * s.d,
      s.cy + Math.sin(rad(dotA)) * dotR * s.d,
      dotPx * k,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------
// Silhouettes, lift glow and ghosts on the v2 outline

/** Far enough left that the source fill never lands on any atlas page (pages are ≤ 4096 px). */
const SHADOW_THROW_PX = 8192;

const shifted = (corners: readonly Corner[], dx: number, dy: number): Corner[] =>
  corners.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));

export function silhouetteV2Size(
  spec: { readonly shape: ShapeId; readonly kind: SilhouetteKind; readonly k?: number },
  tokens: Tokens,
): Size {
  const s = blockV2Size(spec.shape, tokens, spec.k ?? 1);
  const pad = silhouettePad(spec.kind, tokens);
  return { w: s.w + 2 * pad, h: s.h + 2 * pad };
}

/**
 * Blurred, opaque black silhouette of the v2 outline S (contact / lifted / crane shadow; the scene applies the token
 * alpha and offset). The block box starts at (pad, pad). Same throw-off-frame trick as v1 (no runtime Filter).
 */
export function drawSilhouetteV2(
  ctx: DrawContext,
  spec: { readonly shape: ShapeId; readonly kind: SilhouetteKind; readonly k?: number },
  tokens: Tokens,
): void {
  const g = blockV2Geometry(shapeById(spec.shape), tokens, spec.k ?? 1);
  const pad = silhouettePad(spec.kind, tokens);
  ctx.save();
  ctx.shadowColor = css(BLACK);
  ctx.shadowBlur = tokens.shadow[spec.kind].blur;
  ctx.shadowOffsetX = SHADOW_THROW_PX;
  ctx.shadowOffsetY = 0;
  traceCorners(ctx, shifted(g.S, pad - SHADOW_THROW_PX, pad), g.radiiS[0], g.radiiS[1]);
  ctx.fillStyle = css(BLACK);
  ctx.fill();
  ctx.restore();
}

/** Blur of the lift glow's soft edge (px at k = 1): half the ring width. */
const glowBlur = (tokens: Tokens, k: number): number => (tokens.blockV2.liftGlowPx * k) / 2;

/** Transparent margin of a `blk_glow_<shape>` frame around the block box. */
export function liftGlowPad(tokens: Tokens, k = 1): number {
  return Math.ceil(tokens.blockV2.liftGlowPx * k + glowBlur(tokens, k) * 1.5);
}

export function liftGlowSize(spec: { readonly shape: ShapeId; readonly k?: number }, tokens: Tokens): Size {
  const k = spec.k ?? 1;
  const s = blockV2Size(spec.shape, tokens, k);
  const pad = liftGlowPad(tokens, k);
  return { w: s.w + 2 * pad, h: s.h + 2 * pad };
}

/**
 * Lift glow ring `blk_glow_<shape>` (ART §3A.2 "Kaldırılmış", JUICE #91): the silhouette S grown by `liftGlowPx` with
 * a soft edge, opaque WHITE; the scene tints it with the colour's glow tone at `blockV2.liftGlowAlpha` behind the
 * lifted block (colour-independent: one frame per shape). The block box starts at (pad, pad).
 */
export function drawLiftGlowV2(
  ctx: DrawContext,
  spec: { readonly shape: ShapeId; readonly k?: number },
  tokens: Tokens,
): void {
  const k = spec.k ?? 1;
  const g = blockV2Geometry(shapeById(spec.shape), tokens, k);
  const pad = liftGlowPad(tokens, k);
  const grow = tokens.blockV2.liftGlowPx * k;
  const ring = offsetEdges(g.S, -grow, -grow, -grow, -grow);
  ctx.save();
  ctx.shadowColor = css(WHITE);
  ctx.shadowBlur = glowBlur(tokens, k);
  ctx.shadowOffsetX = SHADOW_THROW_PX;
  ctx.shadowOffsetY = 0;
  traceCorners(ctx, shifted(ring, pad - SHADOW_THROW_PX, pad), g.radiiS[0] + grow, g.radiiS[1]);
  ctx.fillStyle = css(WHITE);
  ctx.fill();
  ctx.restore();
}

export function ghostV2Size(
  spec: { readonly shape: ShapeId; readonly mode?: DrawMode; readonly k?: number },
  tokens: Tokens,
): Size {
  const s = blockV2Size(spec.shape, tokens, spec.k ?? 1);
  const pad = ghostPad(tokens, spec.mode);
  return { w: s.w + 2 * pad, h: s.h + 2 * pad };
}

/** UX §5.4 fall-shadow outline styles on the v2 outline S (same colours, widths and dashes as v1, `block.ts`). */
export function drawGhostV2(
  ctx: DrawContext,
  spec: {
    readonly shape: ShapeId;
    readonly style: GhostStyle;
    readonly mode?: DrawMode;
    readonly k?: number;
  },
  tokens: Tokens,
): void {
  const mode = spec.mode ?? DEFAULT_MODE;
  const pad = ghostPad(tokens, mode);
  const add = mode.colorBlind ? tokens.a11y.colorBlindGhostStrokeAddPx : 0;
  const g = blockV2Geometry(shapeById(spec.shape), tokens, spec.k ?? 1);
  const s = tokens.stroke;
  const ghost = tokens.color.ghost;
  ctx.save();
  traceCorners(ctx, shifted(g.S, pad, pad), g.radiiS[0], g.radiiS[1]);
  ctx.lineJoin = 'round';
  switch (spec.style) {
    case 'body':
      ctx.fillStyle = css(WHITE);
      ctx.fill();
      break;
    case 'valid':
      ctx.shadowColor = css(parseHex(ghost.valid), tokens.alpha.ghostGlow);
      ctx.shadowBlur = s.ghostGlowPx;
      ctx.lineWidth = s.ghostPx + add;
      ctx.strokeStyle = css(parseHex(ghost.valid));
      ctx.stroke();
      break;
    case 'invalid':
      ctx.setLineDash([...ART.ghostDash]);
      ctx.lineWidth = s.ghostInvalidPx + add;
      ctx.strokeStyle = css(parseHex(ghost.invalid));
      ctx.stroke();
      break;
    case 'neutral':
      ctx.setLineDash([...ART.ghostDash]);
      ctx.lineWidth = s.ghostNeutralPx + add;
      ctx.strokeStyle = css(parseHex(ghost.neutral), tokens.alpha.ghostNeutralStroke);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------
// Heavy Load (Y5, ART §6, PL-2R-04): `cargo_q9` (3 × 3 pallet), `cargo_i5` (5 × 1 steel I-beam)

export type CargoKind = 'Q9' | 'I5';
export const CARGO_KINDS: readonly CargoKind[] = ['Q9', 'I5'];

export function cargoSize(kind: CargoKind, tokens: Tokens, k = 1): Size {
  const c = cellPxOf(tokens, k);
  return kind === 'Q9' ? { w: 3 * c, h: 3 * c } : { w: 5 * c, h: c };
}

/** 45° hazard stripes (`ui.hazardYellow` / `ui.hazardBlack`) inside the current clip, band `bandPx`. */
function hazardStripes(
  ctx: DrawContext,
  x: number,
  y: number,
  w: number,
  h: number,
  bandPx: number,
  tokens: Tokens,
): void {
  ctx.fillStyle = css(parseHex(tokens.color.ui.hazardYellow));
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = css(parseHex(tokens.color.ui.hazardBlack));
  ctx.beginPath();
  for (let s = -h; s < w + h; s += bandPx * 2) {
    ctx.moveTo(x + s, y + h);
    ctx.lineTo(x + s + bandPx, y + h);
    ctx.lineTo(x + s + bandPx + h, y);
    ctx.lineTo(x + s + h, y);
    ctx.closePath();
  }
  ctx.fill();
}

/** The kettlebell badge of the Heavy Load (cream disc, `ui.ink` kettlebell silhouette; ART §6, `icon_kettlebell`). */
export function drawKettlebellBadge(
  ctx: DrawContext,
  cx: number,
  cy: number,
  d: number,
  tokens: Tokens,
): void {
  const ink = parseHex(tokens.color.ui.ink);
  const cream = parseHex(tokens.kit.buttonColor.cream.base);
  ctx.beginPath();
  ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
  ctx.fillStyle = css(cream);
  ctx.fill();
  ctx.lineWidth = Math.max(2, d * 0.08);
  ctx.strokeStyle = css(ink);
  ctx.stroke();
  // handle ring + bell
  ctx.beginPath();
  ctx.arc(cx, cy - d * 0.12, d * 0.17, Math.PI, 0);
  ctx.lineWidth = d * 0.09;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy + d * 0.08, d * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = css(ink);
  ctx.fill();
  ctx.fillRect(cx - d * 0.2, cy + d * 0.2, d * 0.4, d * 0.07);
}

/**
 * ART §6 Heavy Load, one piece (no pillows, studs or symbol): steel body `obstacle.cargoSteel` with panel lines,
 * straps + buckles (Q9) or flanges + bolt holes (I5), a 4 px light line on top, 6 px `ui.hazardBlack` contour (corner
 * 18), hazard bands in the top-left and bottom-right corners and the kettlebell badge top-left.
 */
export function drawCargo(
  ctx: DrawContext,
  spec: { readonly kind: CargoKind; readonly k?: number },
  tokens: Tokens,
): void {
  const k = spec.k ?? 1;
  const { w, h } = cargoSize(spec.kind, tokens, k);
  const o = tokens.color.obstacle;
  const steel = parseHex(o.cargoSteel);
  const dark = parseHex(o.cargoDark);
  const buckle = parseHex(o.cargoBuckle);
  const black = parseHex(tokens.color.ui.hazardBlack);
  const ins = tokens.blockV2.insetPx * k;
  const line = 6 * k;
  const corner = 18 * k;
  const x0 = ins;
  const y0 = ins;
  const bw = w - 2 * ins;
  const bh = h - 2 * ins;

  ctx.save();
  // contour + steel body
  roundRect(ctx, x0, y0, bw, bh, corner);
  ctx.fillStyle = css(black);
  ctx.fill();
  roundRect(ctx, x0 + line, y0 + line, bw - 2 * line, bh - 2 * line, corner - line);
  const body = ctx.createLinearGradient(0, y0, 0, y0 + bh);
  body.addColorStop(0, css(mix(steel, WHITE, 0.18)));
  body.addColorStop(0.5, css(steel));
  body.addColorStop(1, css(shade(steel, 0.86)));
  ctx.fillStyle = body;
  ctx.fill();
  ctx.save();
  ctx.clip();
  const ix = x0 + line;
  const iy = y0 + line;
  const iw = bw - 2 * line;
  const ih = bh - 2 * line;
  if (spec.kind === 'Q9') {
    // pallet: bottom 24 px dark with 3 feet gaps
    const pal = 24 * k;
    ctx.fillStyle = css(dark);
    ctx.fillRect(ix, iy + ih - pal, iw, pal);
    ctx.fillStyle = css(shade(dark, 0.6));
    for (let i = 0; i < 2; i++)
      ctx.fillRect(ix + iw * (0.3 + 0.4 * i) - 14 * k, iy + ih - pal * 0.55, 28 * k, pal * 0.55);
    // horizontal panel lines
    ctx.fillStyle = css(dark, 0.5);
    for (let i = 1; i <= 4; i++) ctx.fillRect(ix, iy + ((ih - pal) * i) / 5, iw, 4 * k);
    // two vertical straps + buckles
    for (const fx of [0.3, 0.7]) {
      ctx.fillStyle = css(dark);
      ctx.fillRect(ix + iw * fx - 8 * k, iy, 16 * k, ih - pal);
      roundRect(ctx, ix + iw * fx - 10 * k, iy + (ih - pal) * 0.45, 20 * k, 14 * k, 3 * k);
      ctx.fillStyle = css(buckle);
      ctx.fill();
    }
  } else {
    // I-beam: top and bottom flanges + 3 bolt holes
    const fl = 14 * k;
    ctx.fillStyle = css(dark);
    ctx.fillRect(ix, iy, iw, fl);
    ctx.fillRect(ix, iy + ih - fl, iw, fl);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(ix + iw * (0.3 + 0.2 * i), iy + ih / 2, 5 * k, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // top light line
  ctx.fillStyle = css(WHITE, 0.35);
  ctx.fillRect(ix, iy + (spec.kind === 'I5' ? 14 * k : 0), iw, 4 * k);
  // hazard corners (top-left, bottom-right), 16 px wide 45° bands
  const hz = Math.min(iw, ih) * (spec.kind === 'Q9' ? 0.34 : 0.7);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ix, iy);
  ctx.lineTo(ix + hz, iy);
  ctx.lineTo(ix, iy + hz);
  ctx.closePath();
  ctx.moveTo(ix + iw, iy + ih);
  ctx.lineTo(ix + iw - hz, iy + ih);
  ctx.lineTo(ix + iw, iy + ih - hz);
  ctx.closePath();
  ctx.clip();
  hazardStripes(ctx, ix, iy, iw, ih, 16 * k, tokens);
  ctx.restore();
  ctx.restore();
  ctx.restore();
  const badge = 40 * k;
  drawKettlebellBadge(ctx, x0 + line + badge * 0.75, y0 + line + badge * 0.75, badge, tokens);
}

/** All ghost styles a v2 level bakes per shape (body is drawn from the block frame with a FILL tint, as in v1). */
export const GHOST_V2_STYLES: readonly GhostStyle[] = GHOST_STYLES;
