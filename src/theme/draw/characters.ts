/**
 * Procedural character fallbacks (ART_DIRECTION §11, §11.7 placeholder SVG recipes; ASSET_LIST §16.3 rows 5–9 "ART
 * §11.7 …"; TECH_DESIGN §2R.6 "Prosedürel yedekler"): Tuna bust, Tuna cheer, Usta Dede bust, Kepçe bust, Bay
 * Gribeton bust, the tutorial glove (`ui_tutorial_glove`, UX §13.1) and the round Usta Dede portrait (ART §14.8).
 *
 * The geometry is the ART §11.7 SVG (same coordinates, viewBox units); the v2 volume recipe of ASSET §16.2 is added:
 * every main surface has a 2-stop vertical gradient (light = c·0.68 + white·0.32 → c × 0.92), a top-left white gloss
 * and the 6 px `color.character.outline` contour. Signature colours are `color.character.*` verbatim. The game shows
 * these only while (or when) the SVG art is not loaded; they never block the FTUE.
 */
import type { Tokens } from '../tokens.ts';
import { WHITE, css, mix, parseHex, shade } from './color.ts';
import type { Rgb } from './color.ts';
import type { DrawContext, Size } from './context.ts';
import { roundRect } from './blockV2.ts';
import { traceStar } from './fx.ts';

export const CHARACTER_IDS = [
  'chr_tuna_bust',
  'chr_tuna_cheer',
  'chr_dede_bust',
  'chr_kepce_bust',
  'chr_gribeton_bust',
] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

/** viewBox of each figure (ASSET §16.3). */
export const CHARACTER_VIEWBOX: Readonly<Record<CharacterId, Size>> = Object.freeze({
  chr_tuna_bust: { w: 256, h: 320 },
  chr_tuna_cheer: { w: 300, h: 400 },
  chr_dede_bust: { w: 256, h: 320 },
  chr_kepce_bust: { w: 320, h: 220 },
  chr_gribeton_bust: { w: 256, h: 320 },
});

const C = (h: string | undefined, fallback = '#3B2A1A'): Rgb => parseHex(h ?? fallback);

/** Painter bound to one context: volume fill + contour in the character outline colour. */
class Vol {
  private readonly ctx: DrawContext;
  private readonly ink: Rgb;
  constructor(ctx: DrawContext, tokens: Tokens) {
    this.ctx = ctx;
    this.ink = C(tokens.color.character.outline);
  }

  /** ASSET §16.2 volume: vertical gradient light → c × 0.92 over [y0, y1], then the 6 px contour. */
  fill(c: Rgb, y0: number, y1: number, contour = 6): void {
    const g = this.ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, css(mix(c, WHITE, 0.32)));
    g.addColorStop(0.45, css(c));
    g.addColorStop(1, css(shade(c, 0.92)));
    this.ctx.fillStyle = g;
    this.ctx.fill();
    if (contour > 0) this.stroke(contour);
  }

  flat(c: Rgb, contour = 6): void {
    this.ctx.fillStyle = css(c);
    this.ctx.fill();
    if (contour > 0) this.stroke(contour);
  }

  stroke(w = 6, c: Rgb = this.ink, alpha = 1): void {
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.lineWidth = w;
    this.ctx.strokeStyle = css(c, alpha);
    this.ctx.stroke();
  }

  /** Top-left gloss ellipse (white α 0.45). */
  gloss(x: number, y: number, rx: number, ry: number, rot = -0.5, alpha = 0.45): void {
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    this.ctx.fillStyle = css(WHITE, alpha);
    this.ctx.fill();
  }

  get inkRgb(): Rgb {
    return this.ink;
  }
}

function ellipsePath(ctx: DrawContext, x: number, y: number, rx: number, ry: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function circlePath(ctx: DrawContext, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

// --- Tuna (ART §11.1, §11.7) ------------------------------------------------------------------------------------

function tunaHead(ctx: DrawContext, v: Vol, tokens: Tokens): void {
  const t = tokens.color.character.tuna;
  // hair tufts from under the helmet
  for (const side of [-1, 1]) {
    ctx.beginPath();
    const x = (n: number): number => 128 + side * (n - 128);
    ctx.moveTo(x(52), 128);
    ctx.quadraticCurveTo(x(44), 176, x(74), 198);
    ctx.lineTo(x(88), 188);
    ctx.quadraticCurveTo(x(70), 162, x(76), 130);
    ctx.closePath();
    v.fill(C(t.hair), 128, 198);
  }
  circlePath(ctx, 128, 138, 76);
  v.fill(C(t.skin), 62, 214);
  // pencil behind the right ear
  ctx.save();
  ctx.translate(204, 139);
  ctx.rotate((18 * Math.PI) / 180);
  roundRect(ctx, -6, -27, 12, 54, 4);
  v.flat(C(t.pencil), 4);
  ctx.restore();
  // helmet dome + brim + star sticker
  ctx.beginPath();
  ctx.ellipse(128, 118, 82, 76, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  v.fill(C(t.helmet), 42, 118);
  v.gloss(84, 76, 26, 11, -0.6, 0.5);
  roundRect(ctx, 34, 108, 188, 22, 11);
  v.fill(C(t.helmetBrim), 108, 130);
  traceStar(ctx, 128, 80, 22, 10, 3);
  v.flat(WHITE, 4);
  // face: eyes, highlights, freckles, smile
  ctx.fillStyle = css(v.inkRgb);
  ellipsePath(ctx, 102, 150, 12, 15);
  ctx.fill();
  ellipsePath(ctx, 154, 150, 12, 15);
  ctx.fill();
  ctx.fillStyle = css(WHITE);
  circlePath(ctx, 106, 144, 4);
  ctx.fill();
  circlePath(ctx, 158, 144, 4);
  ctx.fill();
  ctx.fillStyle = css(C('#B5652B'), 0.55);
  for (const [x, y] of [
    [86, 172],
    [96, 178],
    [160, 178],
    [170, 172],
  ] as const) {
    circlePath(ctx, x, y, 3);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(108, 182);
  ctx.quadraticCurveTo(128, 202, 148, 182);
  v.stroke(6);
  v.gloss(92, 104, 18, 9, -0.4, 0.3);
}

function tunaTorso(ctx: DrawContext, v: Vol, tokens: Tokens, gloves: boolean): void {
  const t = tokens.color.character.tuna;
  roundRect(ctx, 80, 206, 96, 92, 28);
  v.fill(C(t.shirt), 206, 298);
  ctx.beginPath();
  ctx.moveTo(84, 212);
  ctx.lineTo(172, 212);
  ctx.lineTo(172, 286);
  ctx.quadraticCurveTo(172, 298, 160, 298);
  ctx.lineTo(96, 298);
  ctx.quadraticCurveTo(84, 298, 84, 286);
  ctx.closePath();
  v.fill(C(t.vest), 212, 298);
  ctx.beginPath();
  ctx.moveTo(87, 240);
  ctx.lineTo(169, 240);
  ctx.moveTo(87, 264);
  ctx.lineTo(169, 264);
  v.stroke(10, C(t.reflective));
  if (gloves) {
    for (const x of [64, 192]) {
      circlePath(ctx, x, 262, 30);
      v.fill(C(t.gloves), 232, 292);
      v.gloss(x - 10, 250, 10, 6, -0.6, 0.55);
    }
  }
}

function drawTunaBust(ctx: DrawContext, tokens: Tokens): void {
  const v = new Vol(ctx, tokens);
  tunaTorso(ctx, v, tokens, true);
  tunaHead(ctx, v, tokens);
}

/** Tuna cheer pose (ASSET §16.3 #6 fallback "Tuna SVG + eldivenler yukarıda"), viewBox 300 × 400. */
function drawTunaCheer(ctx: DrawContext, tokens: Tokens): void {
  const v = new Vol(ctx, tokens);
  const t = tokens.color.character.tuna;
  ctx.save();
  ctx.translate(22, 70);
  // arms up behind the head
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(128 + side * 40, 226);
    ctx.quadraticCurveTo(128 + side * 110, 190, 128 + side * 104, 70);
    ctx.lineWidth = 30;
    ctx.lineCap = 'round';
    ctx.strokeStyle = css(v.inkRgb);
    ctx.stroke();
    ctx.lineWidth = 18;
    ctx.strokeStyle = css(C(t.shirt));
    ctx.stroke();
  }
  tunaTorso(ctx, v, tokens, false);
  tunaHead(ctx, v, tokens);
  for (const side of [-1, 1]) {
    circlePath(ctx, 128 + side * 104, 46, 32);
    v.fill(C(t.gloves), 14, 78);
    v.gloss(128 + side * 104 - 10, 34, 11, 6, -0.6, 0.55);
  }
  ctx.restore();
}

// --- Usta Dede (ART §11.2) --------------------------------------------------------------------------------------

function drawDedeBust(ctx: DrawContext, tokens: Tokens): void {
  const v = new Vol(ctx, tokens);
  const d = tokens.color.character.dede;
  roundRect(ctx, 70, 200, 116, 110, 26);
  v.fill(C(d.jacket), 200, 310);
  ctx.beginPath();
  ctx.moveTo(112, 200);
  ctx.lineTo(128, 236);
  ctx.lineTo(144, 200);
  ctx.closePath();
  v.flat(C(d.shirt));
  roundRect(ctx, 70, 282, 116, 14, 4);
  v.flat(C(d.belt));
  roundRect(ctx, 150, 276, 30, 26, 6);
  v.fill(C(d.tape), 276, 302);
  // signature: folding ruler held up at the side (ART §11.2)
  ctx.save();
  ctx.translate(214, 300);
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate(((i % 2 === 0 ? -14 : 14) * Math.PI) / 180);
    roundRect(ctx, -9, -62, 18, 64, 3);
    v.flat(C(d.ruler), 4);
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      ctx.moveTo(-9, -54 + k * 12);
      ctx.lineTo(-1, -54 + k * 12);
    }
    v.stroke(2);
    ctx.restore();
    ctx.translate(i % 2 === 0 ? -14 : 14, -58);
  }
  ctx.restore();
  ellipsePath(ctx, 128, 134, 70, 78);
  v.fill(C(d.skin), 56, 212);
  ctx.beginPath();
  ctx.moveTo(60, 124);
  ctx.quadraticCurveTo(56, 150, 70, 160);
  ctx.moveTo(196, 124);
  ctx.quadraticCurveTo(200, 150, 186, 160);
  v.stroke(12, C(d.mustache));
  // cap
  ctx.beginPath();
  ctx.moveTo(52, 92);
  ctx.quadraticCurveTo(128, 30, 204, 92);
  ctx.lineTo(210, 104);
  ctx.lineTo(46, 104);
  ctx.closePath();
  v.fill(C(d.cap), 50, 104);
  v.gloss(96, 66, 22, 9, -0.35, 0.45);
  roundRect(ctx, 40, 98, 140, 16, 8);
  v.fill(C(d.capBand), 98, 114);
  // glasses, pupils, moustache, mouth
  for (const x of [102, 154]) {
    circlePath(ctx, x, 138, 24);
    ctx.fillStyle = css(WHITE, 0.4);
    ctx.fill();
    v.stroke(9);
  }
  ctx.beginPath();
  ctx.moveTo(126, 138);
  ctx.lineTo(130, 138);
  v.stroke(9);
  ctx.fillStyle = css(v.inkRgb);
  for (const x of [102, 154]) {
    circlePath(ctx, x, 140, 9);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(86, 178);
  ctx.quadraticCurveTo(106, 164, 128, 174);
  ctx.quadraticCurveTo(150, 164, 170, 178);
  ctx.quadraticCurveTo(170, 194, 150, 192);
  ctx.quadraticCurveTo(138, 190, 128, 184);
  ctx.quadraticCurveTo(118, 190, 106, 192);
  ctx.quadraticCurveTo(86, 194, 86, 178);
  ctx.closePath();
  v.fill(C(d.mustache), 164, 194);
  ctx.beginPath();
  ctx.moveTo(116, 202);
  ctx.quadraticCurveTo(128, 210, 140, 202);
  v.stroke(6);
}

// --- Kepçe (ART §11.3) ------------------------------------------------------------------------------------------

function drawKepceBust(ctx: DrawContext, tokens: Tokens): void {
  const v = new Vol(ctx, tokens);
  const k = tokens.color.character.kepce;
  ctx.beginPath();
  ctx.moveTo(268, 128);
  ctx.quadraticCurveTo(300, 112, 306, 90);
  v.stroke(10);
  roundRect(ctx, 70, 110, 200, 70, 35);
  v.fill(C(k.fur), 110, 180);
  for (const x of [88, 230]) {
    roundRect(ctx, x, 168, 22, 34, 8);
    v.fill(C(k.fur), 168, 202);
  }
  roundRect(ctx, 78, 128, 40, 18, 9);
  v.fill(C(k.collar), 128, 146);
  ellipsePath(ctx, 78, 104, 56, 48);
  v.fill(C(k.fur), 56, 152);
  ellipsePath(ctx, 38, 122, 30, 22);
  v.fill(C(k.muzzle), 100, 144);
  circlePath(ctx, 14, 114, 10);
  v.flat(v.inkRgb, 0);
  v.gloss(11, 110, 3.5, 2.5, -0.4, 0.8);
  // ear hanging from under the helmet (signature)
  ctx.beginPath();
  ctx.moveTo(104, 92);
  ctx.quadraticCurveTo(132, 130, 112, 168);
  ctx.quadraticCurveTo(96, 150, 98, 112);
  ctx.closePath();
  v.fill(C(k.ear), 92, 168);
  // helmet, tilted
  ctx.save();
  ctx.translate(85, 72);
  ctx.rotate((-12 * Math.PI) / 180);
  ctx.translate(-85, -72);
  ctx.beginPath();
  ctx.ellipse(85, 74, 56, 50, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(146, 78);
  ctx.lineTo(24, 78);
  ctx.closePath();
  v.fill(C(k.helmet), 24, 78);
  v.gloss(60, 46, 16, 7, -0.5, 0.5);
  ctx.restore();
  ctx.fillStyle = css(v.inkRgb);
  ellipsePath(ctx, 66, 96, 9, 12);
  ctx.fill();
  ctx.fillStyle = css(WHITE);
  circlePath(ctx, 69, 91, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(24, 134);
  ctx.quadraticCurveTo(38, 144, 52, 134);
  v.stroke(5);
}

// --- Bay Gribeton (ART §11.4) -----------------------------------------------------------------------------------

function drawGribetonBust(ctx: DrawContext, tokens: Tokens): void {
  const v = new Vol(ctx, tokens);
  const g = tokens.color.character.gribeton;
  roundRect(ctx, 62, 196, 132, 116, 10);
  v.fill(C(g.suit), 196, 312);
  ctx.beginPath();
  ctx.moveTo(110, 196);
  ctx.lineTo(128, 230);
  ctx.lineTo(146, 196);
  ctx.closePath();
  v.flat(WHITE);
  ctx.beginPath();
  ctx.moveTo(122, 214);
  ctx.lineTo(134, 214);
  ctx.lineTo(138, 270);
  ctx.lineTo(128, 282);
  ctx.lineTo(118, 270);
  ctx.closePath();
  v.flat(C(g.tie));
  roundRect(ctx, 150, 226, 40, 54, 4);
  v.fill(C(g.folder), 226, 280);
  roundRect(ctx, 62, 70, 132, 132, 26);
  v.fill(C(g.skin), 70, 202);
  // concrete-block hair with form lines (signature)
  roundRect(ctx, 54, 30, 148, 56, 8);
  v.fill(C(g.hair), 30, 86);
  ctx.beginPath();
  ctx.moveTo(60, 46);
  ctx.lineTo(196, 46);
  ctx.moveTo(60, 62);
  ctx.lineTo(196, 62);
  v.stroke(3, C(g.hairLine));
  ctx.beginPath();
  ctx.moveTo(84, 116);
  ctx.lineTo(118, 116);
  ctx.moveTo(138, 116);
  ctx.lineTo(172, 116);
  v.stroke(10, C(g.brows));
  ctx.beginPath();
  ctx.moveTo(90, 136);
  ctx.quadraticCurveTo(101, 130, 112, 136);
  ctx.moveTo(144, 136);
  ctx.quadraticCurveTo(155, 130, 166, 136);
  v.stroke(6);
  ctx.fillStyle = css(v.inkRgb);
  circlePath(ctx, 101, 140, 6);
  ctx.fill();
  circlePath(ctx, 155, 140, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(106, 166);
  ctx.lineTo(150, 166);
  v.stroke(6, C(g.brows));
  ctx.beginPath();
  ctx.moveTo(112, 182);
  ctx.quadraticCurveTo(128, 186, 146, 178);
  v.stroke(6);
}

const DRAWERS: Readonly<Record<CharacterId, (ctx: DrawContext, tokens: Tokens) => void>> = {
  chr_tuna_bust: drawTunaBust,
  chr_tuna_cheer: drawTunaCheer,
  chr_dede_bust: drawDedeBust,
  chr_kepce_bust: drawKepceBust,
  chr_gribeton_bust: drawGribetonBust,
};

/** Draws a character fallback scaled from its viewBox into `size` (aspect kept, centred). */
export function drawCharacter(ctx: DrawContext, id: CharacterId, size: Size, tokens: Tokens): void {
  const vb = CHARACTER_VIEWBOX[id];
  const s = Math.min(size.w / vb.w, size.h / vb.h);
  ctx.save();
  ctx.translate((size.w - vb.w * s) / 2, (size.h - vb.h * s) / 2);
  ctx.scale(s, s);
  DRAWERS[id](ctx, tokens);
  ctx.restore();
}

// --- tutorial glove and portrait --------------------------------------------------------------------------------

/** Fingertip of the glove in its frame (the point that "touches" a cell, UX §13.1). */
export function gloveTip(tokens: Tokens): { x: number; y: number } {
  return { x: tokens.tutorial.gloveW * 0.36, y: 8 };
}

/**
 * `ui_tutorial_glove` (UX §13.1, ASSET §16.5): Tuna's big yellow work glove (`color.character.tuna.gloves`), index
 * finger up (tip `gloveTip`), cuff band, volume + gloss; the drop shadow (y + 8, α 0.30) is part of the frame.
 */
export function drawGlove(ctx: DrawContext, tokens: Tokens): void {
  const v = new Vol(ctx, tokens);
  const W = tokens.tutorial.gloveW;
  const H = tokens.tutorial.gloveH;
  const glove = C(tokens.color.character.tuna.gloves);
  const sx = W / 140;
  const sy = H / 160;
  ctx.save();
  ctx.scale(sx, sy);
  // drop shadow
  ctx.save();
  ctx.translate(0, 8);
  roundRect(ctx, 26, 58, 92, 80, 34);
  ctx.fillStyle = css([0, 0, 0], 0.3);
  ctx.fill();
  ctx.restore();
  // index finger
  roundRect(ctx, 38, 4, 28, 84, 14);
  v.fill(glove, 4, 88);
  // fist / palm
  roundRect(ctx, 26, 52, 92, 80, 34);
  v.fill(glove, 52, 132);
  // folded fingers lines
  ctx.beginPath();
  ctx.moveTo(70, 70);
  ctx.quadraticCurveTo(92, 66, 110, 74);
  ctx.moveTo(70, 90);
  ctx.quadraticCurveTo(92, 86, 112, 94);
  v.stroke(4, shade(glove, 0.55));
  // thumb
  roundRect(ctx, 14, 80, 40, 26, 13);
  v.fill(glove, 80, 106);
  // cuff
  roundRect(ctx, 34, 124, 80, 28, 10);
  v.fill(C(tokens.color.character.tuna.vest), 124, 152);
  v.gloss(50, 22, 7, 14, 0, 0.55);
  v.gloss(54, 66, 14, 7, -0.4, 0.4);
  ctx.restore();
}

/**
 * Usta Dede portrait (ART §14.8, CL-2R-26): Ø `d` cream disc, the bust's head clipped to the circle, 6 px `ui.ink`
 * ring. The same arc + clip runs once on the loaded SVG raster (services/assets.ts); this is the procedural version.
 */
export function drawDedePortrait(ctx: DrawContext, d: number, tokens: Tokens): void {
  const r = d / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(r, r, r - 3, 0, Math.PI * 2);
  ctx.fillStyle = css(C(tokens.kit.buttonColor.cream.base));
  ctx.fill();
  ctx.clip();
  // head centre (128, 134) of the 256 × 320 bust → the disc centre, head + cap ≈ 190 units across
  const s = d / 190;
  ctx.translate(r - 128 * s, r - 128 * s);
  ctx.scale(s, s);
  drawDedeBust(ctx, tokens);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(r, r, r - 3, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = css(C(tokens.color.ui.ink));
  ctx.stroke();
}
