/**
 * Scene drawing v2 (ART_DIRECTION §2.4, §7, §7.1–§7.4; UX §3, §5.8, §6.1; ASSET_LIST §16.3 "Prosedürel yedek",
 * §16.5; TECH_DESIGN §2R.6, R2-12):
 *  - the indigo game scene (`scene_game_bg`): a pure SPEC for Phaser `Graphics` (gradient + 120 px blueprint pattern;
 *    not a texture, ART §7.1) plus the same picture as a Canvas2D drawer for previews and tools;
 *  - the v2 yard floor tile (pegboard: one hole per cell, DL-2R-18) and the 9-slice wooden yard frame (UX §5.8);
 *  - procedural fallbacks of the SVG art: Renkli Tepe town (`bg_home_town`, ART §7.4 chapter colours), win plaza
 *    (`bg_win_plaza`), the chapter 1 structure (`town_ch1_treehouse`) and its blueprint ghost (ART §7.2).
 * Pure Canvas2D on a `DrawContext`; seeded, so every bake is identical.
 */
import { COLOR_CODES } from '../../core/types.ts';
import type { Tokens } from '../tokens.ts';
import { BLACK, WHITE, css, mix, parseHex, shade } from './color.ts';
import type { Rgb } from './color.ts';
import type { DrawContext, Size } from './context.ts';
import { drawBlockGlossV2, drawBlockV2, roundRect, roundRectSub } from './blockV2.ts';
import { drawSunburst } from './fx.ts';

const hexRgb = (h: string): Rgb => parseHex(h);

/** Mulberry32: tiny seeded PRNG for scene decoration (deterministic bakes). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Game scene (ART §7.1)

export interface GridLine {
  /** 'v' = vertical line at x, 'h' = horizontal at y. */
  readonly axis: 'v' | 'h';
  readonly at: number;
  readonly px: number;
  readonly alpha: number;
}

export interface GameBackgroundSpec {
  readonly top: string;
  readonly bottom: string;
  readonly line: string;
  readonly lines: readonly GridLine[];
}

/** Blueprint pattern of the game scene (ART §7.1): 120 px grid, 2 px α minor, every 4th cell 3 px α major. */
export const SCENE_GRID_PX = 120;
export const SCENE_GRID_MAJOR_EVERY = 4;

/**
 * `scene_game_bg` as data for Phaser `Graphics` (ART §7.1): vertical gradient `color.scene.gameTop` → `gameBottom`
 * over `w × h` (EXPAND included) and the faint blueprint lines (`alpha.sceneGridMinor` / `sceneGridMajor`).
 */
export function gameBackgroundSpec(tokens: Tokens, w: number, h: number): GameBackgroundSpec {
  const sc = tokens.color.scene;
  const lines: GridLine[] = [];
  const add = (axis: 'v' | 'h', at: number, i: number): void => {
    const major = i % SCENE_GRID_MAJOR_EVERY === 0;
    lines.push({
      axis,
      at,
      px: major ? 3 : 2,
      alpha: major ? tokens.alpha.sceneGridMajor : tokens.alpha.sceneGridMinor,
    });
  };
  for (let i = 1; i * SCENE_GRID_PX < w; i++) add('v', i * SCENE_GRID_PX, i);
  for (let i = 1; i * SCENE_GRID_PX < h; i++) add('h', i * SCENE_GRID_PX, i);
  return { top: sc.gameTop, bottom: sc.gameBottom, line: sc.gameLine, lines };
}

/** Canvas2D rendering of `gameBackgroundSpec` (previews, screen tools; the game uses Graphics). */
export function drawGameBackground(ctx: DrawContext, size: Size, tokens: Tokens): void {
  const spec = gameBackgroundSpec(tokens, size.w, size.h);
  const g = ctx.createLinearGradient(0, 0, 0, size.h);
  g.addColorStop(0, spec.top);
  g.addColorStop(1, spec.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size.w, size.h);
  for (const l of spec.lines) {
    ctx.fillStyle = css(hexRgb(spec.line), l.alpha);
    if (l.axis === 'v') ctx.fillRect(l.at - l.px / 2, 0, l.px, size.h);
    else ctx.fillRect(0, l.at - l.px / 2, size.w, l.px);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Yard (ART §2.4 DL-2R-18, UX §5.8)

/** `board_yard_floor` v2: one cell (the yard is a grid of identical holes; the checker of v1 is gone). */
export function yardFloorV2Size(tokens: Tokens, k = 1): Size {
  const c = tokens.layout.grid.cellPx * k;
  return { w: c, h: c };
}

/**
 * Pegboard cell (ART §2.4 "delikli pano"): `board.yardFloor` with a soft top light, `board.yardGrid` cell edges and a
 * Ø `layout.adaptive.yardHolePx`·k hole in the centre whose lower half carries a 2 px `board.yardFrame` shade arc.
 */
export function drawYardFloorV2(ctx: DrawContext, tokens: Tokens, k = 1): void {
  const b = tokens.color.board;
  const { w: c } = yardFloorV2Size(tokens, k);
  const floor = hexRgb(b.yardFloor);
  const g = ctx.createLinearGradient(0, 0, 0, c);
  g.addColorStop(0, css(mix(floor, WHITE, 0.12)));
  g.addColorStop(1, css(floor));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c, c);
  // cell edges: half lines on each side, so tiles join into 3 px lines
  ctx.fillStyle = css(hexRgb(b.yardGrid));
  const half = 1.5 * k;
  ctx.fillRect(0, 0, c, half);
  ctx.fillRect(0, c - half, c, half);
  ctx.fillRect(0, 0, half, c);
  ctx.fillRect(c - half, 0, half, c);
  // hole
  const r = (tokens.layout.adaptive.yardHolePx * k) / 2;
  ctx.beginPath();
  ctx.arc(c / 2, c / 2, r, 0, Math.PI * 2);
  ctx.fillStyle = css(hexRgb(b.yardGrid));
  ctx.fill();
  ctx.beginPath();
  ctx.arc(c / 2, c / 2, r - 1 * k, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.lineWidth = 2 * k;
  ctx.strokeStyle = css(hexRgb(b.yardFrame));
  ctx.stroke();
  // a tiny light under the hole (pressed-in look)
  ctx.beginPath();
  ctx.arc(c / 2, c / 2 + r + 1.5 * k, r * 0.8, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.lineWidth = 1.5 * k;
  ctx.strokeStyle = css(WHITE, 0.35);
  ctx.stroke();
}

/** UX §5.8 yard frame colours (wood gradient + contour); no token yet → requested `color.board.yardFrameTop/Bottom`. */
export const YARD_FRAME = Object.freeze({
  top: '#E2A653',
  bottom: '#B97A35',
  outline: '#5A3A1E',
  outlinePx: 6,
});

/** 9-slice source of the yard frame: a `2·(radius + frame) + 32` square; the centre is transparent. */
export function yardFrameSize(tokens: Tokens): Size {
  const a = tokens.layout.adaptive;
  const s = 2 * (a.yardFrameRadiusPx + a.yardFramePx) + 32;
  return { w: s, h: s };
}

export function yardFrameSlices(tokens: Tokens): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  const a = tokens.layout.adaptive;
  const e = a.yardFrameRadiusPx + a.yardFramePx + 8;
  return { left: e, right: e, top: e, bottom: e };
}

/**
 * UX §5.8 "malzeme sandığı" frame (ASSET §16.5 `yard_frame` v2): `yardFramePx` wooden ring (vertical gradient
 * #E2A653 → #B97A35) with a 6 px #5A3A1E contour, an inner shade line and outer corner `yardFrameRadiusPx`. The frame
 * sits OUTSIDE the yard cells: the inner hole is the yard rectangle.
 */
export function drawYardFrameV2(ctx: DrawContext, size: Size, tokens: Tokens): void {
  const a = tokens.layout.adaptive;
  const f = a.yardFramePx;
  const R = a.yardFrameRadiusPx;
  const { w, h } = size;
  const o = YARD_FRAME.outlinePx;
  const inner = R / 2;
  // every layer is a ring (outer rounded rect + inner hole, even-odd): nothing under the hole is touched
  const ring = (inset: number, r: number, holeInset: number, holeR: number): void => {
    ctx.beginPath();
    roundRectSub(ctx, inset, inset, w - 2 * inset, h - 2 * inset, r);
    roundRectSub(ctx, holeInset, holeInset, w - 2 * holeInset, h - 2 * holeInset, holeR);
  };
  ctx.save();
  ring(0, R + f, f - o / 2, inner + o / 2);
  ctx.fillStyle = css(hexRgb(YARD_FRAME.outline));
  ctx.fill('evenodd');
  ring(o, R + f - o, f - o / 2, inner + o / 2);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, YARD_FRAME.top);
  g.addColorStop(1, YARD_FRAME.bottom);
  ctx.fillStyle = g;
  ctx.fill('evenodd');
  // top light on the wood
  ring(o, R + f - o, o + 3, R + f - o - 3);
  ctx.fillStyle = css(WHITE, 0.3);
  ctx.fill('evenodd');
  // inner shadow from the frame onto the floor (top edge), inside the hole only
  ctx.beginPath();
  roundRectSub(ctx, f, f, w - 2 * f, h - 2 * f, inner);
  ctx.clip();
  const sg = ctx.createLinearGradient(0, f, 0, f + 14);
  sg.addColorStop(0, css(BLACK, 0.28));
  sg.addColorStop(1, css(BLACK, 0));
  ctx.fillStyle = sg;
  ctx.fillRect(f, f, w - 2 * f, 14);
  ctx.restore();
}

/**
 * `ui_yard_preview` (UX §5.3, ART §2.4): one cell's dotted drop preview, 4 px white α `alpha.yardPreview` dots (4 on,
 * 10 off) 6 px inside the cell edge.
 */
export function drawYardPreviewCell(ctx: DrawContext, tokens: Tokens, k = 1): void {
  const c = tokens.layout.grid.cellPx * k;
  const inset = 6 * k;
  const lw = tokens.stroke.yardPreviewPx * k;
  ctx.save();
  roundRect(ctx, inset + lw / 2, inset + lw / 2, c - 2 * inset - lw, c - 2 * inset - lw, 14 * k);
  ctx.setLineDash([4 * k, 10 * k]);
  ctx.lineCap = 'round';
  ctx.lineWidth = lw;
  ctx.strokeStyle = css(WHITE, tokens.alpha.yardPreview);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------------------
// Fallback art (ART §7.4): Renkli Tepe town, win plaza, chapter 1 structure + ghost

/** Design canvas of the full-screen art (SVG viewBox 1080 × 1920). */
const ART_W = 1080;
const ART_H = 1920;

function scaleTo(ctx: DrawContext, size: Size): void {
  ctx.scale(size.w / ART_W, size.h / ART_H);
}

function cloud(ctx: DrawContext, x: number, y: number, s: number, color: Rgb, alpha: number): void {
  ctx.beginPath();
  ctx.arc(x, y, 34 * s, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(x + 40 * s, y - 30 * s, 42 * s, Math.PI, Math.PI * 1.85);
  ctx.arc(x + 100 * s, y - 22 * s, 36 * s, Math.PI * 1.2, Math.PI * 1.95);
  ctx.arc(x + 132 * s, y, 30 * s, Math.PI * 1.5, Math.PI * 0.5);
  ctx.closePath();
  ctx.fillStyle = css(color, alpha);
  ctx.fill();
}

/** Rolling hill band from y `base` with bumps of height `amp`, filled with a vertical gradient. */
function hills(
  ctx: DrawContext,
  base: number,
  amp: number,
  phase: number,
  top: Rgb,
  bottom: Rgb,
  edge: Rgb,
): void {
  ctx.beginPath();
  ctx.moveTo(-20, ART_H);
  ctx.lineTo(-20, base);
  const n = 4;
  for (let i = 0; i < n; i++) {
    const x0 = -20 + (i * (ART_W + 40)) / n;
    const x1 = -20 + ((i + 1) * (ART_W + 40)) / n;
    const lift = amp * (0.6 + 0.4 * Math.sin(phase + i * 1.7));
    ctx.quadraticCurveTo((x0 + x1) / 2, base - lift * 2, x1, base);
  }
  ctx.lineTo(ART_W + 20, ART_H);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, base - amp * 2, 0, base + 400);
  g.addColorStop(0, css(top));
  g.addColorStop(1, css(bottom));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = css(edge, 0.55);
  ctx.stroke();
}

function house(
  ctx: DrawContext,
  x: number,
  base: number,
  w: number,
  h: number,
  roof: Rgb,
  wall: Rgb,
  ink: Rgb,
): void {
  const lw = 8;
  ctx.lineJoin = 'round';
  // walls
  roundRect(ctx, x, base - h, w, h, 10);
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, css(mix(wall, WHITE, 0.25)));
  g.addColorStop(1, css(shade(wall, 0.9)));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = css(ink);
  ctx.stroke();
  // roof
  ctx.beginPath();
  ctx.moveTo(x - 18, base - h + 6);
  ctx.lineTo(x + w / 2, base - h - w * 0.55);
  ctx.lineTo(x + w + 18, base - h + 6);
  ctx.closePath();
  const rg = ctx.createLinearGradient(0, base - h - w * 0.55, 0, base - h);
  rg.addColorStop(0, css(mix(roof, WHITE, 0.3)));
  rg.addColorStop(1, css(roof));
  ctx.fillStyle = rg;
  ctx.fill();
  ctx.stroke();
  // window + door
  roundRect(ctx, x + w * 0.18, base - h * 0.72, w * 0.26, h * 0.26, 6);
  ctx.fillStyle = css(WARM_LIGHT);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.stroke();
  roundRect(ctx, x + w * 0.56, base - h * 0.48, w * 0.24, h * 0.48, 8);
  ctx.fillStyle = css(shade(roof, 0.75));
  ctx.fill();
  ctx.stroke();
}

const hexRgbSafe = (h: string): Rgb => parseHex(h);
/** Warm window light (ART §7.4 ch2 "sıcak pencere ışıkları" #FFE7A3 = `kit.sunburst.innerColor`). */
const WARM_LIGHT: Rgb = [0xff, 0xe7, 0xa3];

/** Tree trunk wood (`kit.panel.frameInner` #8A5A26). */
const TRUNK = '#8A5A26';

function roundTree(ctx: DrawContext, x: number, base: number, s: number, leaf: Rgb, ink: Rgb): void {
  ctx.lineJoin = 'round';
  roundRect(ctx, x - 9 * s, base - 70 * s, 18 * s, 70 * s, 6 * s);
  ctx.fillStyle = css(hexRgbSafe(TRUNK));
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = css(ink);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, base - 105 * s, 52 * s, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(0, base - 160 * s, 0, base - 50 * s);
  g.addColorStop(0, css(mix(leaf, WHITE, 0.3)));
  g.addColorStop(1, css(shade(leaf, 0.85)));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x - 18 * s, base - 128 * s, 16 * s, 9 * s, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = css(WHITE, 0.4);
  ctx.fill();
}

/**
 * `bg_home_town` fallback (ART §7.2, §7.4 chapter colours; UX §3 "Yükleniyor"): sky gradient, clouds, far / mid / near
 * hills, a row of houses on the far slope, round trees at the sides, daisies on the near grass. The middle lot
 * (x 160–920, y 360–1240) stays calm grass for the structure.
 */
export function drawTownFallback(
  ctx: DrawContext,
  size: Size,
  tokens: Tokens,
  chapter: keyof Tokens['color']['chapter'] = 'ch1',
): void {
  const ch = tokens.color.chapter[chapter];
  const ink = hexRgb(tokens.color.ui.ink);
  const rnd = seeded(0x70776e);
  ctx.save();
  scaleTo(ctx, size);
  const sky = ctx.createLinearGradient(0, 0, 0, ART_H * 0.7);
  sky.addColorStop(0, ch.skyTop);
  sky.addColorStop(1, ch.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, ART_W, ART_H);
  const cloudC = hexRgb(ch.cloud);
  cloud(ctx, 90, 330, 1.3, cloudC, 0.95);
  cloud(ctx, 760, 250, 1.0, cloudC, 0.9);
  cloud(ctx, 520, 470, 0.7, cloudC, 0.75);
  const far = hexRgb(ch.far);
  const mid = hexRgb(ch.mid);
  const near = hexRgb(ch.near);
  hills(ctx, 760, 70, 0.4, mix(far, WHITE, 0.25), far, shade(far, 0.7));
  // houses on the far slope (left and right thirds, the middle stays open)
  const roofs = [
    tokens.color.block.O,
    tokens.color.character.tuna['helmet'] ?? tokens.color.block.G,
    tokens.color.block.Y,
    tokens.color.character.selin['cardigan'] ?? tokens.color.block.P,
  ];
  const wall = hexRgb(tokens.kit.panel.body);
  const spots = [60, 210, 790, 930];
  spots.forEach((x, i) => {
    const w = 96 + Math.round(rnd() * 30);
    house(
      ctx,
      x,
      800 + (i % 2) * 26,
      w,
      90 + Math.round(rnd() * 30),
      hexRgb(roofs[i % roofs.length] ?? '#EC8D20'),
      wall,
      ink,
    );
  });
  hills(ctx, 980, 90, 2.1, mix(mid, WHITE, 0.15), mid, shade(mid, 0.7));
  roundTree(ctx, 80, 1000, 1.25, mid, ink);
  roundTree(ctx, 1000, 980, 1.1, mid, ink);
  hills(ctx, 1300, 60, 4.2, mix(near, WHITE, 0.2), shade(near, 0.85), shade(near, 0.65));
  // daisies on the near grass, away from the button and nav zone centre
  for (let i = 0; i < 26; i++) {
    const x = rnd() * ART_W;
    const y = 1340 + rnd() * 520;
    ctx.beginPath();
    ctx.arc(x, y, 6 + rnd() * 4, 0, Math.PI * 2);
    ctx.fillStyle = css(i % 3 === 0 ? hexRgb(tokens.color.block.Y) : WHITE, 0.9);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * `bg_win_plaza` fallback (ART §7.3): radial `kit.sunburst.innerColor` → `outerColor`, 12 light rays, bunting of block
 * colour triangles in the top 30 %. The rotating ray layer of the win screen is a separate texture (`fx_sunburst`).
 */
export function drawWinPlazaFallback(ctx: DrawContext, size: Size, tokens: Tokens): void {
  const sb = tokens.kit.sunburst;
  ctx.save();
  scaleTo(ctx, size);
  const g = ctx.createRadialGradient(ART_W / 2, 740, 40, ART_W / 2, 740, 1250);
  g.addColorStop(0, sb.innerColor);
  g.addColorStop(1, sb.outerColor);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ART_W, ART_H);
  ctx.save();
  ctx.translate(ART_W / 2 - 1100, 740 - 1100);
  ctx.scale(2200 / 512, 2200 / 512);
  ctx.globalAlpha = sb.rayAlpha;
  drawSunburst(ctx, tokens);
  ctx.restore();
  // bunting strings
  const colors = COLOR_CODES.filter((c) => c !== 'W' && c !== 'C').map((c) => hexRgb(tokens.color.block[c]));
  const ink = hexRgb(tokens.color.ui.ink);
  for (const [y0, sag, phase] of [
    [120, 90, 0],
    [300, 70, 2],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(-20, y0);
    ctx.quadraticCurveTo(ART_W / 2, y0 + sag * 2, ART_W + 20, y0);
    ctx.lineWidth = 6;
    ctx.strokeStyle = css(ink, 0.6);
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const t = (i + 0.5) / 12;
      const x = -20 + t * (ART_W + 40);
      const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y0 + sag * 2) + t * t * y0;
      ctx.beginPath();
      ctx.moveTo(x - 28, y);
      ctx.lineTo(x + 28, y);
      ctx.lineTo(x, y + 62);
      ctx.closePath();
      ctx.fillStyle = css(colors[(i + phase) % colors.length] ?? WHITE);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = css(ink, 0.7);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// --- chapter 1 structure (tree house) -------------------------------------------------------------------------

/** viewBox of `town_ch1_treehouse` (ASSET §16.3). */
export const STRUCTURE_SIZE: Size = Object.freeze({ w: 760, h: 820 });

export type StructureStyle = 'color' | 'ghost';

/** One drawn part of the fallback structure: `trace` appends sub-paths (no `beginPath`). */
interface StructurePart {
  readonly trace: (ctx: DrawContext) => void;
  readonly color: Rgb;
  /** Top colour of a vertical volume gradient (none = flat). */
  readonly top?: Rgb;
  /** Decoration (foliage): drawn in colour only, not part of the blueprint ghost. */
  readonly decor?: boolean;
}

const disc =
  (x: number, y: number, r: number) =>
  (ctx: DrawContext): void => {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.closePath();
  };
const rrect =
  (x: number, y: number, w: number, h: number, r: number) =>
  (ctx: DrawContext): void =>
    roundRectSub(ctx, x, y, w, h, r);
const poly =
  (pts: readonly (readonly [number, number])[]) =>
  (ctx: DrawContext): void => {
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
  };

/** Parts of the chapter 1 tree house, bottom-up in the ART §7.2 task order (t1 … t7), foliage first. */
function structureParts(tokens: Tokens): StructurePart[] {
  const cx = STRUCTURE_SIZE.w / 2;
  const H = STRUCTURE_SIZE.h;
  const wood = hexRgb(tokens.color.block.W);
  const woodLight = mix(wood, WHITE, 0.32);
  const leaf = hexRgb(tokens.color.chapter.ch1.mid);
  const roof = hexRgb(tokens.color.block.R);
  const wall = hexRgb(tokens.color.block.O);
  const rope = hexRgb(tokens.color.board.yardFrame);
  const steel = hexRgb(tokens.color.board.scaffold);
  const parts: StructurePart[] = [];
  for (const [x, y, r] of [
    [cx - 210, 300, 140],
    [cx + 220, 330, 130],
    [cx, 190, 170],
  ] as const) {
    parts.push({ trace: disc(x, y, r), color: shade(leaf, 0.9), top: mix(leaf, WHITE, 0.25), decor: true });
  }
  // t1 trunk + steps
  parts.push({ trace: rrect(cx - 46, 470, 92, H - 480, 18), color: shade(wood, 0.95), top: woodLight });
  for (let i = 0; i < 4; i++) {
    parts.push({ trace: rrect(cx + 60 + i * 34, H - 40 - i * 36, 70, 22, 6), color: wood, top: woodLight });
  }
  // t2 platform + posts
  parts.push({ trace: rrect(cx - 250, 540, 500, 46, 12), color: wood, top: woodLight });
  for (const x of [cx - 230, cx + 206])
    parts.push({ trace: rrect(x, 586, 24, 90, 6), color: shade(wood, 0.9) });
  // t3 walls, t4 window + door
  parts.push({ trace: rrect(cx - 190, 400, 380, 140, 10), color: wall, top: mix(wall, WHITE, 0.3) });
  parts.push({ trace: rrect(cx - 140, 425, 100, 80, 10), color: WARM_LIGHT });
  parts.push({ trace: rrect(cx + 50, 430, 86, 110, 12), color: shade(wood, 0.85), top: wood });
  // t5 roof
  parts.push({
    trace: poly([
      [cx - 230, 410],
      [cx, 220],
      [cx + 230, 410],
    ]),
    color: roof,
    top: mix(roof, WHITE, 0.3),
  });
  // t6 rope ladder + pulley, reaching UP to the lookout branch
  for (const x of [cx + 150, cx + 190]) parts.push({ trace: rrect(x, 110, 8, 230, 4), color: rope });
  for (let i = 0; i < 5; i++) parts.push({ trace: rrect(cx + 146, 130 + i * 42, 56, 8, 4), color: rope });
  parts.push({ trace: disc(cx + 170, 104, 20), color: steel });
  // t7 flag pole + flag
  parts.push({ trace: rrect(cx - 4, 20, 8, 210, 4), color: steel });
  parts.push({
    trace: poly([
      [cx + 4, 24],
      [cx + 110, 52],
      [cx + 4, 82],
    ]),
    color: hexRgb(tokens.color.block.Y),
  });
  return parts;
}

/**
 * `town_ch1_treehouse` fallback (ASSET §16.3: trunk + leaf discs + platform …) drawn bottom-up in the order of the ART
 * §7.2 tasks (steps → platform → walls → window → roof → rope ladder + pulley → flag), so `setCrop` at
 * `layout.home.ch1CropStops` reveals one task per stop. `ghost` = the blueprint ghost (ART §7.2): ONE union fill of
 * the parts in `board.blueprint` α 0.35 (no alpha stacking) + 4 px white α 0.9 dashed contour (16/12) per part;
 * foliage is decoration and has no ghost.
 */
export function drawStructureFallback(ctx: DrawContext, style: StructureStyle, tokens: Tokens): void {
  const ink = hexRgb(tokens.color.ui.ink);
  const parts = structureParts(tokens);
  ctx.save();
  ctx.lineJoin = 'round';
  if (style === 'ghost') {
    const solid = parts.filter((p) => !p.decor);
    ctx.beginPath();
    for (const p of solid) p.trace(ctx);
    ctx.fillStyle = css(hexRgb(tokens.color.board.blueprint), 0.35);
    ctx.fill('nonzero');
    ctx.setLineDash([16, 12]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = css(WHITE, 0.9);
    for (const p of solid) {
      ctx.beginPath();
      p.trace(ctx);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  for (const p of parts) {
    ctx.beginPath();
    p.trace(ctx);
    if (p.top) {
      const g = ctx.createLinearGradient(0, 0, 0, STRUCTURE_SIZE.h);
      g.addColorStop(0, css(p.top));
      g.addColorStop(1, css(p.color));
      ctx.fillStyle = g;
    } else ctx.fillStyle = css(p.color);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = css(ink);
    ctx.stroke();
  }
  ctx.restore();
}

/** viewBox of `logo_emblem` (ASSET §16.3 #10). */
export const LOGO_SIZE: Size = Object.freeze({ w: 360, h: 360 });

/**
 * `logo_emblem` fallback (ASSET §16.3 #10 motif, no letters): one studded candy brick (colour O, ART §3A) hanging
 * from a crane hook over a hazard-striped wall cap.
 */
export function drawLogoEmblemFallback(ctx: DrawContext, tokens: Tokens): void {
  const ink = hexRgb(tokens.color.ui.ink);
  const cx = LOGO_SIZE.w / 2;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // wall cap with hazard stripes
  roundRect(ctx, 40, 292, 280, 44, 12);
  ctx.fillStyle = css(hexRgb(tokens.color.ui.hazardYellow));
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = css(hexRgb(tokens.color.ui.hazardBlack));
  ctx.beginPath();
  for (let x = 20; x < 340; x += 48) {
    ctx.moveTo(x, 336);
    ctx.lineTo(x + 24, 336);
    ctx.lineTo(x + 68, 292);
    ctx.lineTo(x + 44, 292);
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
  roundRect(ctx, 40, 292, 280, 44, 12);
  ctx.lineWidth = 8;
  ctx.strokeStyle = css(ink);
  ctx.stroke();
  // rope + hook
  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, 58);
  ctx.lineWidth = 14;
  ctx.strokeStyle = css(ink);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.strokeStyle = css(hexRgb(tokens.color.board.scaffold));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - 14, 74, 18, -0.2, Math.PI * 1.05);
  ctx.lineWidth = 20;
  ctx.strokeStyle = css(ink);
  ctx.stroke();
  ctx.lineWidth = 10;
  ctx.strokeStyle = css(hexRgb(tokens.color.ui.secondary));
  ctx.stroke();
  ctx.restore();
  // the brick: a 2 × 1 candy block, scaled to 240 px
  ctx.save();
  ctx.translate(cx - 120, 104);
  drawBlockV2(ctx, { shape: 'D2_90', color: 'O', k: 1 }, tokens);
  drawBlockGlossV2(ctx, { shape: 'D2_90', k: 1 }, tokens);
  ctx.restore();
}
