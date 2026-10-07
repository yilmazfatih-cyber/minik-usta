/**
 * Effect textures v2 (ART_DIRECTION §15, JUICE §8; ASSET_LIST §12, §16.5): 4-point sparkle, small star, ring, 12-ray
 * sunburst, soft dust puff, gold coin and confetti. All are drawn ONCE into the kit atlas page and tinted / scaled /
 * rotated by the pooled particle layer (JUICE §0 rule 4; no runtime Filter, no mask).
 *
 * Tint rule: frames that take a per-use colour (sparkle, ring, sunburst, dust, confetti) are drawn WHITE (opaque
 * centre, soft alpha edge) so `setTint(colour)` gives the colour; the star and the coin carry their own token colours.
 */
import type { Tokens } from '../tokens.ts';
import { WHITE, css, mix, parseHex, shade } from './color.ts';
import type { DrawContext, Size } from './context.ts';

export const FX = Object.freeze({
  sparkle: 'fx_sparkle4',
  star: 'fx_star_small',
  ring: 'fx_ring',
  sunburst: 'fx_sunburst',
  dust: 'fx_dust',
  gold: 'fx_gold',
  confetti: 'fx_confetti',
});

/** Frame sizes (ASSET §12, §16.5; the sunburst is 512 px and scaled up: its rays are soft). */
export const FX_SIZE: Readonly<Record<keyof typeof FX, Size>> = Object.freeze({
  sparkle: { w: 48, h: 48 },
  star: { w: 40, h: 40 },
  ring: { w: 256, h: 256 },
  sunburst: { w: 512, h: 512 },
  dust: { w: 32, h: 32 },
  gold: { w: 40, h: 40 },
  confetti: { w: 16, h: 24 },
});

/** Pure geometry of the 4-point sparkle (long axis `long`, waist `short`), centred on (cx, cy). */
export function sparklePath(ctx: DrawContext, cx: number, cy: number, long: number, short: number): void {
  const a = long / 2;
  const b = short / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - a);
  ctx.quadraticCurveTo(cx + b * 0.35, cy - b * 0.35, cx + a, cy);
  ctx.quadraticCurveTo(cx + b * 0.35, cy + b * 0.35, cx, cy + a);
  ctx.quadraticCurveTo(cx - b * 0.35, cy + b * 0.35, cx - a, cy);
  ctx.quadraticCurveTo(cx - b * 0.35, cy - b * 0.35, cx, cy - a);
  ctx.closePath();
}

/** ART §15 `fx_sparkle4`: 4-point star, long axis 48, waist 16; white core with a soft halo (tint = glow tone). */
export function drawSparkle(ctx: DrawContext): void {
  const { w, h } = FX_SIZE.sparkle;
  const cx = w / 2;
  const cy = h / 2;
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
  halo.addColorStop(0, css(WHITE, 0.55));
  halo.addColorStop(1, css(WHITE, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);
  sparklePath(ctx, cx, cy, w, 16);
  ctx.fillStyle = css(WHITE);
  ctx.fill();
}

/** Points of a rounded 5-point star (outer radius R, inner r), first point up. */
export function starPoints(cx: number, cy: number, R: number, r: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad });
  }
  return pts;
}

/** Traces a 5-point star with rounded tips (`arcTo` at every vertex). */
export function traceStar(
  ctx: DrawContext,
  cx: number,
  cy: number,
  R: number,
  r: number,
  round: number,
): void {
  const pts = starPoints(cx, cy, R, r);
  const n = pts.length;
  const first = pts[0] as { x: number; y: number };
  const last = pts[n - 1] as { x: number; y: number };
  ctx.beginPath();
  ctx.moveTo((first.x + last.x) / 2, (first.y + last.y) / 2);
  for (let i = 0; i < n; i++) {
    const p = pts[i] as { x: number; y: number };
    const q = pts[(i + 1) % n] as { x: number; y: number };
    ctx.arcTo(p.x, p.y, q.x, q.y, i % 2 === 0 ? round : round * 0.5);
  }
  ctx.closePath();
}

/** Volumetric star (ART §9 "tombul 5 köşe", `ui.star` / `ui.starOutline`), used by `fx_star_small` and the icon. */
export function drawStarShape(ctx: DrawContext, cx: number, cy: number, R: number, tokens: Tokens): void {
  const star = parseHex(tokens.color.ui.star);
  const edge = parseHex(tokens.color.ui.starOutline);
  const lw = Math.max(2, R * 0.16);
  traceStar(ctx, cx, cy, R, R * 0.5, R * 0.18);
  ctx.lineJoin = 'round';
  ctx.lineWidth = lw * 2;
  ctx.strokeStyle = css(shade(edge, 0.75));
  ctx.stroke();
  const g = ctx.createLinearGradient(0, cy - R, 0, cy + R);
  g.addColorStop(0, css(mix(star, WHITE, 0.45)));
  g.addColorStop(0.45, css(star));
  g.addColorStop(1, css(shade(star, 0.85)));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - R * 0.18, cy - R * 0.28, R * 0.22, R * 0.11, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = css(WHITE, 0.6);
  ctx.fill();
}

/** ART §15 `fx_star_small` (yıldız patlaması, 20–36 px when scaled). */
export function drawSmallStar(ctx: DrawContext, tokens: Tokens): void {
  const { w } = FX_SIZE.star;
  drawStarShape(ctx, w / 2, w / 2 + 1, w / 2 - 5, tokens);
}

/** ART §15 ring (yıldız patlaması halkası): white 8 px ring with soft inner and outer edges. */
export function drawRing(ctx: DrawContext): void {
  const { w } = FX_SIZE.ring;
  const c = w / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, c - 12, 0, Math.PI * 2);
  ctx.shadowColor = css(WHITE, 0.8);
  ctx.shadowBlur = 8;
  ctx.lineWidth = 8;
  ctx.strokeStyle = css(WHITE);
  ctx.stroke();
  ctx.restore();
}

/**
 * ART §15 sunburst `fx_sunburst`: `kit.sunburst.rays` white rays from the centre, alternating with gaps, fading out to
 * the edge. The scene tints it `kit.sunburst.rayColor`, sets α `rayAlpha` and turns it `turnsPerSecond`.
 */
export function drawSunburst(ctx: DrawContext, tokens: Tokens): void {
  const { w } = FX_SIZE.sunburst;
  const c = w / 2;
  const n = tokens.kit.sunburst.rays;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, css(WHITE));
  g.addColorStop(0.55, css(WHITE, 0.8));
  g.addColorStop(1, css(WHITE, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  const half = Math.PI / n / 2;
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI) / n - Math.PI / 2;
    ctx.moveTo(c, c);
    ctx.lineTo(c + Math.cos(a - half) * c, c + Math.sin(a - half) * c);
    ctx.lineTo(c + Math.cos(a + half) * c, c + Math.sin(a + half) * c);
    ctx.closePath();
  }
  ctx.fill();
}

/** `fx_dust`: soft white puff (tinted with the yard frame / wall colour). */
export function drawDust(ctx: DrawContext): void {
  const { w } = FX_SIZE.dust;
  const c = w / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, css(WHITE, 0.95));
  g.addColorStop(0.6, css(WHITE, 0.6));
  g.addColorStop(1, css(WHITE, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, w);
}

/** Gold coin (`ui.gold`, `ui.goldDark`, a trowel-blade emboss): `fx_gold` and the coin icon fallback. */
export function drawCoinShape(ctx: DrawContext, cx: number, cy: number, d: number, tokens: Tokens): void {
  const gold = parseHex(tokens.color.ui.gold);
  const dark = parseHex(tokens.color.ui.goldDark);
  const ink = parseHex(tokens.color.ui.ink);
  const r = d / 2;
  const lw = Math.max(2, d * 0.07);
  ctx.beginPath();
  ctx.arc(cx, cy + lw * 0.6, r - lw / 2, 0, Math.PI * 2);
  ctx.fillStyle = css(ink);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r - lw / 2, 0, Math.PI * 2);
  ctx.fillStyle = css(ink);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r - lw * 1.4, 0, Math.PI * 2);
  ctx.fillStyle = css(dark);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy - lw * 0.4, r - lw * 1.9, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, css(mix(gold, WHITE, 0.45)));
  g.addColorStop(0.5, css(gold));
  g.addColorStop(1, css(shade(gold, 0.9)));
  ctx.fillStyle = g;
  ctx.fill();
  // embossed trowel blade (ART §9 "sikke, üstünde kabartma mala")
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.42);
  ctx.lineTo(cx + r * 0.3, cy + r * 0.12);
  ctx.lineTo(cx, cy + r * 0.3);
  ctx.lineTo(cx - r * 0.3, cy + r * 0.12);
  ctx.closePath();
  ctx.fillStyle = css(dark, 0.75);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.3, cy - r * 0.38, r * 0.2, r * 0.1, -0.6, 0, Math.PI * 2);
  ctx.fillStyle = css(WHITE, 0.7);
  ctx.fill();
}

export function drawGoldParticle(ctx: DrawContext, tokens: Tokens): void {
  const { w } = FX_SIZE.gold;
  drawCoinShape(ctx, w / 2, w / 2 - 1, w - 4, tokens);
}

/** ART §15 confetti v2: light rectangle with a 2 px white α 0.5 gloss strip (tinted per piece). */
export function drawConfetti(ctx: DrawContext): void {
  const { w, h } = FX_SIZE.confetti;
  ctx.fillStyle = css([226, 226, 226]);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = css(WHITE);
  ctx.fillRect(2, 2, 2, h - 4);
}
