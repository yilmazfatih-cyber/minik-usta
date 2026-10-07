/**
 * Procedural icon fallbacks (ART_DIRECTION §9; ASSET_LIST §16.3 rows 11–26 + `icon_piggy`, `icon_kettlebell`,
 * `icon_nextfloor`, prosedürel yedek "ART §9 v1 prosedürel ikonlar"): one 128 × 128 drawer per icon of the v2 icon
 * atlas, same frame names (`icon_<name>`), so the game is complete when `icons_v2` (design-lead SVG raster) is missing
 * or rejected. Style: 8 px `ui.ink` contour, soft vertical volume, top-left white gloss; no text.
 *
 * `icon_nav_home` and `icon_nav_album` are drawn here too: UX §3's bottom navigation needs them, ASSET §16.3 has no SVG
 * row for them yet (REVIEW_LOG note to design-lead).
 */
import type { Tokens } from '../tokens.ts';
import { WHITE, css, mix, parseHex, shade } from './color.ts';
import type { Rgb } from './color.ts';
import type { DrawContext } from './context.ts';
import { roundRect } from './blockV2.ts';
import { drawCoinShape, drawStarShape } from './fx.ts';

export const ICON_PX = 128;

export const ICON_NAMES = [
  'coin',
  'life',
  'star',
  'moves',
  'settings',
  'lock',
  'hammer',
  'crane',
  'brush',
  'undo',
  'thermos',
  'gold_trowel',
  'chest',
  'nav_shop',
  'nav_league',
  'nav_team',
  'piggy',
  'kettlebell',
  'nextfloor',
  'nav_home',
  'nav_album',
] as const;
export type IconName = (typeof ICON_NAMES)[number];

export const iconFrameName = (name: IconName): string => `icon_${name}`;

interface Pen {
  readonly ctx: DrawContext;
  readonly ink: Rgb;
  vol(c: Rgb, y0: number, y1: number, lw?: number): void;
  line(lw: number, c?: Rgb): void;
  gloss(x: number, y: number, rx: number, ry: number, rot?: number): void;
}

function pen(ctx: DrawContext, tokens: Tokens): Pen {
  const ink = parseHex(tokens.color.ui.ink);
  return {
    ctx,
    ink,
    vol(c, y0, y1, lw = 8) {
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, css(mix(c, WHITE, 0.32)));
      g.addColorStop(0.5, css(c));
      g.addColorStop(1, css(shade(c, 0.78)));
      ctx.fillStyle = g;
      ctx.fill();
      if (lw > 0) {
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = lw;
        ctx.strokeStyle = css(ink);
        ctx.stroke();
      }
    },
    line(lw, c = ink) {
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = lw;
      ctx.strokeStyle = css(c);
      ctx.stroke();
    },
    gloss(x, y, rx, ry, rot = -0.5) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
      ctx.fillStyle = css(WHITE, 0.5);
      ctx.fill();
    },
  };
}

const H = (tokens: Tokens, key: keyof Tokens['color']['ui']): Rgb => parseHex(tokens.color.ui[key]);

function heart(ctx: DrawContext, cx: number, cy: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy + 40 * s);
  ctx.bezierCurveTo(cx - 60 * s, cy + 2 * s, cx - 46 * s, cy - 46 * s, cx, cy - 22 * s);
  ctx.bezierCurveTo(cx + 46 * s, cy - 46 * s, cx + 60 * s, cy + 2 * s, cx, cy + 40 * s);
  ctx.closePath();
}

function gear(ctx: DrawContext, cx: number, cy: number, R: number, r: number, teeth: number): void {
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i * Math.PI) / teeth - Math.PI / 2;
    const a1 = ((i + 1) * Math.PI) / teeth - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    const p0 = { x: cx + Math.cos(a0 + 0.08) * rad, y: cy + Math.sin(a0 + 0.08) * rad };
    if (i === 0) ctx.moveTo(p0.x, p0.y);
    else ctx.lineTo(p0.x, p0.y);
    ctx.lineTo(cx + Math.cos(a1 - 0.08) * rad, cy + Math.sin(a1 - 0.08) * rad);
  }
  ctx.closePath();
}

function trowelBlade(ctx: DrawContext): void {
  ctx.beginPath();
  ctx.moveTo(30, 98);
  ctx.lineTo(74, 40);
  ctx.quadraticCurveTo(98, 52, 100, 80);
  ctx.closePath();
}

const DRAW: Readonly<Record<IconName, (p: Pen, t: Tokens) => void>> = {
  coin: (p, t) => drawCoinShape(p.ctx, 64, 64, 112, t),
  life: (p, t) => {
    heart(p.ctx, 64, 66, 1.05);
    p.vol(H(t, 'heart'), 20, 110);
    p.gloss(42, 46, 12, 7);
    // star sticker (Tuna's helmet star, ART §9)
    p.ctx.beginPath();
    const s = 13;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? s : s * 0.45;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const x = 64 + Math.cos(a) * r;
      const y = 64 + Math.sin(a) * r;
      if (i === 0) p.ctx.moveTo(x, y);
      else p.ctx.lineTo(x, y);
    }
    p.ctx.closePath();
    p.ctx.fillStyle = css(WHITE);
    p.ctx.fill();
  },
  star: (p, t) => drawStarShape(p.ctx, 64, 68, 54, t),
  moves: (p, t) => {
    // wall cap + up-and-over arrow (not the undo curl)
    roundRect(p.ctx, 50, 70, 28, 46, 6);
    p.vol(parseHex(t.color.board.wall), 70, 116);
    p.ctx.beginPath();
    p.ctx.moveTo(22, 96);
    p.ctx.quadraticCurveTo(26, 22, 64, 22);
    p.ctx.quadraticCurveTo(100, 22, 104, 74);
    p.line(16);
    p.line(8, H(t, 'gold'));
    p.ctx.beginPath();
    p.ctx.moveTo(88, 68);
    p.ctx.lineTo(104, 96);
    p.ctx.lineTo(118, 68);
    p.ctx.closePath();
    p.vol(H(t, 'gold'), 68, 96, 6);
  },
  settings: (p, t) => {
    gear(p.ctx, 64, 64, 54, 42, 8);
    p.vol(parseHex(t.color.board.scaffold), 10, 118);
    p.ctx.beginPath();
    p.ctx.arc(64, 64, 18, 0, Math.PI * 2);
    p.vol(parseHex(t.color.board.wallLight), 46, 82, 6);
    p.ctx.beginPath();
    p.ctx.moveTo(56, 64);
    p.ctx.lineTo(72, 64);
    p.line(5);
  },
  lock: (p, t) => {
    p.ctx.beginPath();
    p.ctx.arc(64, 54, 26, Math.PI, 0);
    p.ctx.lineTo(90, 66);
    p.line(22);
    p.line(10, parseHex(t.color.board.scaffold));
    roundRect(p.ctx, 26, 56, 76, 62, 14);
    p.vol(H(t, 'gold'), 56, 118);
    p.gloss(42, 70, 10, 5);
    p.ctx.beginPath();
    p.ctx.arc(64, 82, 8, 0, Math.PI * 2);
    p.ctx.fillStyle = css(p.ink);
    p.ctx.fill();
    p.ctx.fillRect(60, 84, 8, 18);
  },
  hammer: (p, t) => {
    p.ctx.save();
    p.ctx.translate(64, 64);
    p.ctx.rotate((20 * Math.PI) / 180);
    roundRect(p.ctx, -9, -16, 18, 76, 8);
    p.vol(parseHex(t.color.block.W), -16, 60);
    roundRect(p.ctx, -40, -46, 80, 34, 10);
    p.vol(H(t, 'danger'), -46, -12);
    p.gloss(-22, -36, 12, 5, 0);
    p.ctx.restore();
  },
  crane: (p, t) => {
    p.ctx.beginPath();
    p.ctx.moveTo(64, 8);
    p.ctx.lineTo(64, 52);
    p.line(14);
    p.line(6, parseHex(t.color.board.scaffold));
    p.ctx.beginPath();
    p.ctx.moveTo(64, 50);
    p.ctx.lineTo(64, 82);
    p.ctx.arc(48, 82, 16, 0, Math.PI);
    p.ctx.lineTo(28, 72);
    p.line(22);
    p.line(12, H(t, 'secondary'));
    roundRect(p.ctx, 50, 40, 28, 18, 6);
    p.vol(H(t, 'secondary'), 40, 58, 6);
  },
  brush: (p, t) => {
    p.ctx.save();
    p.ctx.translate(64, 64);
    p.ctx.rotate((-30 * Math.PI) / 180);
    roundRect(p.ctx, -8, 0, 16, 60, 7);
    p.vol(parseHex(t.color.block.W), 0, 60);
    roundRect(p.ctx, -22, -14, 44, 18, 4);
    p.vol(parseHex(t.color.board.scaffold), -14, 4);
    const cols = [t.color.block.G, t.color.block.Y, t.color.block.B];
    cols.forEach((c, i) => {
      roundRect(p.ctx, -22 + i * 15, -52, 14, 40, 6);
      p.vol(parseHex(c), -52, -12, 5);
    });
    p.ctx.restore();
  },
  undo: (p, t) => {
    p.ctx.beginPath();
    p.ctx.arc(66, 70, 34, Math.PI * 1.05, Math.PI * 0.65, false);
    p.line(22);
    p.line(12, H(t, 'secondaryTop'));
    p.ctx.beginPath();
    p.ctx.moveTo(14, 44);
    p.ctx.lineTo(46, 30);
    p.ctx.lineTo(44, 66);
    p.ctx.closePath();
    p.vol(H(t, 'secondaryTop'), 30, 66, 6);
  },
  thermos: (p, t) => {
    roundRect(p.ctx, 38, 42, 52, 78, 16);
    p.vol(parseHex(t.color.block.B), 42, 120);
    roundRect(p.ctx, 44, 28, 40, 18, 6);
    p.vol(parseHex(t.color.block.C), 28, 46, 6);
    p.gloss(52, 64, 6, 16, 0);
    // two steam curls inside the frame (ART §9 "buhar 2 kıvrım")
    p.ctx.beginPath();
    p.ctx.moveTo(56, 22);
    p.ctx.quadraticCurveTo(48, 14, 56, 6);
    p.ctx.moveTo(72, 22);
    p.ctx.quadraticCurveTo(64, 14, 72, 6);
    p.line(9);
    p.line(5, WHITE);
  },
  gold_trowel: (p, t) => {
    trowelBlade(p.ctx);
    p.vol(H(t, 'gold'), 40, 100);
    p.gloss(64, 62, 10, 5, -0.9);
    p.ctx.beginPath();
    p.ctx.moveTo(84, 54);
    p.ctx.lineTo(104, 26);
    p.line(16);
    p.line(8, parseHex(t.color.block.W));
  },
  chest: (p, t) => {
    roundRect(p.ctx, 14, 52, 100, 62, 10);
    p.vol(parseHex(t.color.block.W), 52, 114);
    roundRect(p.ctx, 10, 30, 108, 30, 10);
    p.vol(mix(parseHex(t.color.block.W), WHITE, 0.2), 30, 60);
    for (const x of [14, 100]) {
      p.ctx.fillStyle = css(parseHex(t.color.board.scaffold));
      p.ctx.fillRect(x, 54, 14, 56);
    }
    roundRect(p.ctx, 54, 52, 20, 24, 5);
    p.vol(H(t, 'gold'), 52, 76, 5);
  },
  nav_shop: (p, t) => {
    roundRect(p.ctx, 18, 60, 92, 54, 8);
    p.vol(H(t, 'panel'), 60, 114);
    roundRect(p.ctx, 50, 78, 28, 36, 6);
    p.vol(parseHex(t.color.block.W), 78, 114, 6);
    // striped awning
    for (let i = 0; i < 5; i++) {
      p.ctx.beginPath();
      p.ctx.moveTo(14 + i * 20, 30);
      p.ctx.lineTo(34 + i * 20, 30);
      p.ctx.lineTo(34 + i * 20, 54);
      p.ctx.arc(24 + i * 20, 54, 10, 0, Math.PI);
      p.ctx.closePath();
      p.vol(i % 2 === 0 ? H(t, 'danger') : WHITE, 30, 64, 6);
    }
  },
  nav_league: (p, t) => {
    // trowel-shaped cup
    p.ctx.beginPath();
    p.ctx.moveTo(30, 22);
    p.ctx.lineTo(98, 22);
    p.ctx.quadraticCurveTo(98, 78, 64, 82);
    p.ctx.quadraticCurveTo(30, 78, 30, 22);
    p.ctx.closePath();
    p.vol(H(t, 'gold'), 22, 82);
    p.gloss(46, 38, 8, 14, 0);
    roundRect(p.ctx, 54, 80, 20, 18, 4);
    p.vol(H(t, 'goldDark'), 80, 98, 6);
    roundRect(p.ctx, 36, 96, 56, 20, 6);
    p.vol(parseHex(t.color.block.W), 96, 116, 6);
  },
  nav_team: (p, t) => {
    for (const [x, c] of [
      [40, t.color.character.tuna?.helmet ?? '#7FE0C4'],
      [84, t.color.character.kepce?.helmet ?? '#FF9A1F'],
    ] as const) {
      p.ctx.beginPath();
      p.ctx.ellipse(x, 76, 34, 34, 0, Math.PI, Math.PI * 2);
      p.ctx.closePath();
      p.vol(parseHex(c), 42, 76);
      roundRect(p.ctx, x - 40, 72, 80, 14, 7);
      p.vol(shade(parseHex(c), 0.85), 72, 86, 6);
    }
  },
  piggy: (p, t) => {
    // brick-shaped money box (not a pig, ART §9)
    roundRect(p.ctx, 14, 40, 100, 70, 12);
    p.vol(parseHex(t.color.block.R), 40, 110);
    p.ctx.beginPath();
    p.ctx.moveTo(14, 75);
    p.ctx.lineTo(114, 75);
    p.ctx.moveTo(64, 40);
    p.ctx.lineTo(64, 75);
    p.ctx.moveTo(40, 75);
    p.ctx.lineTo(40, 110);
    p.ctx.moveTo(88, 75);
    p.ctx.lineTo(88, 110);
    p.line(5, shade(parseHex(t.color.block.R), 0.6));
    roundRect(p.ctx, 44, 30, 40, 12, 6);
    p.vol(p.ink, 30, 42, 0);
    drawCoinShape(p.ctx, 64, 22, 34, t);
  },
  kettlebell: (p, t) => {
    p.ctx.beginPath();
    p.ctx.arc(64, 44, 26, Math.PI, 0);
    p.line(26);
    p.line(14, parseHex(t.color.obstacle.cargoSteel));
    p.ctx.beginPath();
    p.ctx.arc(64, 78, 40, 0, Math.PI * 2);
    p.vol(parseHex(t.color.obstacle.cargoSteel), 38, 118);
    p.gloss(46, 62, 12, 7);
  },
  nextfloor: (p, t) => {
    roundRect(p.ctx, 14, 92, 100, 22, 6);
    p.vol(parseHex(t.color.block.O), 92, 114, 6);
    p.ctx.beginPath();
    p.ctx.moveTo(64, 80);
    p.ctx.lineTo(64, 24);
    p.ctx.moveTo(38, 48);
    p.ctx.lineTo(64, 22);
    p.ctx.lineTo(90, 48);
    p.line(22);
    p.line(12, H(t, 'primary'));
  },
  nav_home: (p, t) => {
    roundRect(p.ctx, 26, 58, 76, 58, 8);
    p.vol(H(t, 'panel'), 58, 116);
    p.ctx.beginPath();
    p.ctx.moveTo(10, 66);
    p.ctx.lineTo(64, 16);
    p.ctx.lineTo(118, 66);
    p.ctx.closePath();
    p.vol(parseHex(t.color.block.O), 16, 66);
    roundRect(p.ctx, 52, 80, 24, 36, 6);
    p.vol(parseHex(t.color.block.W), 80, 116, 6);
    p.gloss(44, 44, 10, 5);
  },
  nav_album: (p, t) => {
    roundRect(p.ctx, 22, 18, 88, 96, 10);
    p.vol(parseHex(t.color.block.P), 18, 114);
    roundRect(p.ctx, 40, 36, 56, 44, 6);
    p.vol(H(t, 'panel'), 36, 80, 6);
    for (let i = 0; i < 5; i++) {
      p.ctx.beginPath();
      p.ctx.arc(22, 30 + i * 18, 6, 0, Math.PI * 2);
      p.line(5);
    }
  },
};

/** Draws `icon_<name>` into a 128 × 128 frame at the origin. */
export function drawKitIcon(ctx: DrawContext, name: IconName, tokens: Tokens): void {
  ctx.save();
  DRAW[name](pen(ctx, tokens), tokens);
  ctx.restore();
}
