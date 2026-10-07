/**
 * UI kit v2, effects, scene drawing, character and icon fallbacks, and their atlases (ART_DIRECTION §7, §8.1, §9, §11,
 * §14, §15; ASSET_LIST §16.5; TECH_DESIGN §2R.6–§2R.7, WP-F): geometry from tokens, slice insets, text looks, the
 * kit atlas page budget, the v2 level bake and determinism of every drawer.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadLevel } from '../../src/core/level/compile.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import { TOKENS } from '../../src/theme/tokens.ts';
import * as K from '../../src/theme/draw/kit.ts';
import * as FX from '../../src/theme/draw/fx.ts';
import * as SC from '../../src/theme/draw/scene.ts';
import * as CH from '../../src/theme/draw/characters.ts';
import { ICON_NAMES, drawKitIcon } from '../../src/theme/draw/kitIcons.ts';
import { css, parseHex } from '../../src/theme/draw/color.ts';
import type { DrawContext } from '../../src/theme/draw/context.ts';
import {
  KIT,
  KIT_PAGE,
  blockFrame,
  blockFrameName,
  bootAtlasFrames,
  cargoKindOf,
  dedePortraitFallback,
  fallbackArt,
  glossFrameName,
  glowFrameName,
  iconFallbackFrames,
  kitAtlasFrames,
  kitSlices,
  levelFrames,
  packFrames,
  renderPage,
  silhouetteFrameName,
  YARD_PREVIEW_FRAME,
  FRAME,
} from '../../src/theme/textures.ts';
import type { AtlasPage } from '../../src/theme/textures.ts';
import { ASSET_CATALOG } from '../../src/services/assetCatalog.ts';
import { STICKY_KEYS, createRecorder, isGradient, opsOf, record, styleAt } from './recordingContext.ts';

const ROOT = join(import.meta.dirname, '..', '..');

function level(n: number): CompiledLevel {
  const json: unknown = JSON.parse(readFileSync(join(ROOT, 'levels', `level_00${n}.json`), 'utf8'));
  const res = loadLevel(json);
  if (!res.ok) throw new Error(`level ${n} failed to load: ${JSON.stringify(res.issues)}`);
  return res.level;
}

const pureCheck = (name: string, draw: (ctx: DrawContext) => void): void => {
  it(`TECH 2R.7 ${name}: deterministic, balanced save/restore, no leaked sticky state`, () => {
    const a = createRecorder();
    const b = createRecorder();
    draw(a.ctx);
    draw(b.ctx);
    expect(a.ops).toEqual(b.ops);
    expect(a.ops.length).toBeGreaterThan(0);
    expect(a.depth()).toBe(0);
    const s = a.state();
    for (const k of STICKY_KEYS) {
      if (k === 'transforms' || k === 'clips') expect(s[k], k).toBe(0);
      if (k === 'lineDash') expect(s.lineDash, k).toEqual([]);
    }
    expect([s.globalAlpha, s.shadowBlur, s.shadowOffsetX]).toEqual([1, 0, 0]);
  });
};

describe('candy button (ART 14.1, JUICE 97)', () => {
  const b = TOKENS.kit.button;

  it('ART 14.1 radius = min(48, 0.32·h); frame = button + drop shadow', () => {
    expect(K.buttonRadius(176, TOKENS)).toBe(48);
    expect(K.buttonRadius(96, TOKENS)).toBeCloseTo(30.72, 9);
    expect(K.buttonFrameSize({ color: 'green', w: 720, h: 176 }, TOKENS)).toEqual({
      w: 720,
      h: 176 + b.dropShadowYPx,
    });
  });

  it('ART 14.1 layers: drop shadow → contour → lip → face gradient top → base (0.55) → gloss band', () => {
    const q = TOKENS.kit.buttonColor.green;
    const ops = record((ctx) => K.drawButton(ctx, { color: 'green', w: 720, h: 176 }, TOKENS));
    const fills = styleAt(ops, 'fill', 'fillStyle').map((f) => (isGradient(f) ? f.stops : f));
    expect(fills[0]).toBe(css([0, 0, 0], b.dropShadowAlpha));
    expect(fills[1]).toBe(q.stroke);
    expect(fills[2]).toBe(q.lip);
    expect(fills[3]).toEqual([
      [0, q.top],
      [b.faceGradientStop, q.base],
      [1, q.base],
    ]);
    expect(fills[4]).toEqual([
      [0, css([255, 255, 255], b.glossAlphaTop)],
      [1, css([255, 255, 255], b.glossAlphaBottom)],
    ]);
  });

  it('JUICE 97 pressed: the face sinks lipPx − pressedLipPx (10 px), its height is unchanged, 4 px lip shows', () => {
    const n = K.buttonFaceRect({ color: 'green', w: 300, h: 152 }, TOKENS);
    const p = K.buttonFaceRect({ color: 'green', w: 300, h: 152, state: 'pressed' }, TOKENS);
    expect(p.y - n.y).toBe(b.lipPx - b.pressedLipPx);
    expect(p.h).toBe(n.h);
    expect(152 - (p.y + p.h) - b.strokePx).toBe(b.pressedLipPx);
  });

  it('ART 14.1 disabled: gloss α disabledGlossAlpha', () => {
    const ops = record((ctx) =>
      K.drawButton(ctx, { color: 'grey', w: 300, h: 120, state: 'disabled' }, TOKENS),
    );
    const gloss = styleAt(ops, 'fill', 'fillStyle').at(-1);
    expect(isGradient(gloss) ? gloss.stops[0] : null).toEqual([
      0,
      css([255, 255, 255], b.disabledGlossAlpha),
    ]);
  });

  it('ART 14.1 3-slice insets cover the corner and the gloss inset; min width = both slices', () => {
    for (const h of K.KIT_BUTTON_HEIGHTS) {
      const s = K.buttonSlices({ color: 'blue', w: 0, h }, TOKENS);
      expect(s.top + s.bottom).toBe(0);
      expect(s.left).toBeGreaterThanOrEqual(K.buttonRadius(h, TOKENS) + b.strokePx + b.glossInsetXPx);
      expect(K.buttonMinWidth(h, TOKENS)).toBe(s.left + s.right);
    }
  });

  it('ART 8.1 text looks: bright title = white + 0.16 em contour (canvas line 2 × 0.16 em) + 0.07 em shadow; counter 0.12 em', () => {
    const t = K.textLook('brightTitle', 80, TOKENS, TOKENS.kit.buttonColor.green.stroke);
    expect(t).toEqual({
      fill: '#FFFFFF',
      stroke: '#16501A',
      strokePx: 25.6,
      shadow: '#16501A',
      shadowDy: 5.6000000000000005,
    });
    expect(K.textLook('counter', 52, TOKENS).strokePx).toBeCloseTo(12.48, 9);
    expect(K.textLook('panel', 44, TOKENS).fill).toBe(TOKENS.color.ui.ink);
    expect(K.textLook('secondary', 44, TOKENS).fill).toBe(TOKENS.color.ui.inkSoft);
  });

  it('R2-12 round close × (red) and plus + (green) carry a white glyph with a contour in the colour stroke', () => {
    const ops = record((ctx) => K.drawRoundButton(ctx, { color: 'red', d: 112, glyph: 'close' }, TOKENS));
    expect(styleAt(ops, 'stroke', 'strokeStyle')).toEqual([TOKENS.kit.buttonColor.red.stroke, '#FFFFFF']);
  });
});

describe('panels, ribbon, badge, capsule, progress, nav, bubble (ART 14.2–14.8)', () => {
  it('ART 14.2 framed panel: shadow → outline → wood gradient frameTop → frameBottom → inner line → cream body → inner shadow', () => {
    const p = TOKENS.kit.panel;
    const ops = record((ctx) => K.drawPanel(ctx, { w: 400, h: 300, variant: 'frame' }, TOKENS));
    const fills = styleAt(ops, 'fill', 'fillStyle').map((f) =>
      isGradient(f) ? f.stops.map((x) => x[1]) : f,
    );
    expect(fills).toEqual([
      css([0, 0, 0], p.shadowAlpha),
      p.outline,
      [p.frameTop, p.frameBottom],
      p.frameInner,
      p.body,
    ]);
    const s = K.panelSlices('frame', TOKENS);
    expect(s.top).toBeGreaterThanOrEqual(p.outlinePx + p.framePx + p.innerLinePx + p.innerShadowPx);
    expect(s.bottom - s.top).toBe(p.shadowYPx);
  });

  it('ART 14.3 ribbon: body + 2 tails with a V notch, frame = body + 2 × (tail − 20), h = 104 + 22 + stroke', () => {
    const r = TOKENS.kit.ribbon;
    expect(K.ribbonFrameSize({ bodyW: 560 }, TOKENS)).toEqual({
      w: 560 + 2 * (r.tailPx - 20),
      h: r.heightPx + r.tailDropPx + r.strokePx,
    });
    const ops = record((ctx) => K.drawRibbon(ctx, { color: 'gold', bodyW: 560 }, TOKENS));
    expect(styleAt(ops, 'stroke', 'strokeStyle')).toEqual([r.gold.stroke, r.gold.stroke]);
    expect(K.ribbonSlices(TOKENS).left).toBeGreaterThan(r.tailPx);
  });

  it('ART 14.4 R2-12 square badge 60 × 60, corner 16, white ring, gradient top → bottom; locked = ui.badgeLocked', () => {
    const bd = TOKENS.kit.badge;
    expect(bd.shape).toBe('roundedSquare');
    expect(K.badgeFrameSize(60)).toEqual({ w: 66, h: 69 });
    const red = record((ctx) => K.drawBadge(ctx, { variant: 'red' }, TOKENS));
    const fills = styleAt(red, 'fill', 'fillStyle').map((f) =>
      isGradient(f) ? f.stops.map((x) => x[1]) : f,
    );
    expect(fills.slice(0, 3)).toEqual([bd.stroke, bd.ring, [bd.top, bd.bottom]]);
    expect(opsOf(red, 'arcTo')[0]?.[5]).toBe(bd.cornerPx + 3);
  });

  it('ART 14.5 capsule: fill α 0.78, 3 px white α 0.22 inner line; 3-slice by its half height', () => {
    const cp = TOKENS.kit.capsule;
    const ops = record((ctx) => K.drawCapsule(ctx, { w: 330 }, TOKENS));
    expect(styleAt(ops, 'fill', 'fillStyle')).toEqual([css(parseHex(cp.fill), cp.fillAlpha)]);
    expect(styleAt(ops, 'stroke', 'strokeStyle')).toEqual([
      css(parseHex(cp.innerStroke), cp.innerStrokeAlpha),
    ]);
    expect(K.capsuleSlices(TOKENS).left).toBeGreaterThanOrEqual(cp.heightPx / 2);
  });

  it('ART 14.6 progress: dark track + white α well, fill gradient fillTop → fillBottom inside a 6 px pad', () => {
    const p = TOKENS.kit.progress;
    const fill = record((ctx) => K.drawProgressFill(ctx, { w: 200 }, TOKENS));
    const g = styleAt(fill, 'fill', 'fillStyle')[0];
    expect(isGradient(g) ? g.stops.map((x) => x[1]) : null).toEqual([p.fillTop, p.fillBottom]);
    expect(K.progressFillHeight(TOKENS)).toBe(p.heightPx - 2 * K.PROGRESS_PAD);
  });

  it('ART 14.7 R2-12 indigo nav bar (barTop → barBottom + edge line) and the selected tab tile', () => {
    const n = TOKENS.kit.nav;
    const bar = record((ctx) => K.drawNavBar(ctx, { w: 8, h: 176 }, TOKENS));
    const g = styleAt(bar, 'fillRect', 'fillStyle')[0];
    expect(isGradient(g) ? g.stops.map((x) => x[1]) : null).toEqual([n.barTop, n.barBottom]);
    expect(styleAt(bar, 'fillRect', 'fillStyle')[1]).toBe(n.edge);
  });

  it('ART 14.8 bubble: shadow y + 8 α 0.18, 6 px ui.ink contour, corner 32; the tail covers the contour at the joint', () => {
    const bb = TOKENS.kit.bubble;
    expect(K.bubbleFrameSize({ w: 400, h: 120 }, TOKENS)).toEqual({ w: 400, h: 128 });
    const ops = record((ctx) => K.drawBubble(ctx, { w: 400, h: 120 }, TOKENS));
    expect(styleAt(ops, 'fill', 'fillStyle')).toEqual([css([0, 0, 0], bb.shadowAlpha), bb.stroke, bb.fill]);
    for (const dir of ['left', 'down', 'up'] as const) {
      const t = record((ctx) => K.drawBubbleTail(ctx, { dir }, TOKENS));
      expect(styleAt(t, 'fill', 'fillStyle')).toEqual([bb.fill]);
      expect(styleAt(t, 'stroke', 'lineWidth')).toEqual([bb.strokePx]);
    }
    expect(K.bubbleTailSize('left', TOKENS)).toEqual({ w: bb.tailPx + 2 * bb.strokePx, h: 2 * bb.tailPx });
  });

  it('UX 13.1 highlight: 8 px white α 0.95 contour with an 18 px glow; frame pad = pad + stroke + glow', () => {
    const t = TOKENS.tutorial;
    const ops = record((ctx) => K.drawHighlight(ctx, { w: 200, h: 160 }, TOKENS));
    expect(styleAt(ops, 'stroke', 'lineWidth')).toEqual([t.highlightStrokePx]);
    expect(ops).toContainEqual(['=shadowBlur', t.highlightGlowPx]);
    expect(K.highlightPad(TOKENS)).toBe(t.highlightPadPx + t.highlightStrokePx + t.highlightGlowPx);
  });
});

describe('effects (ART 15)', () => {
  it('ART 15 frame sizes: sparkle 48, star 40, ring 256, sunburst 512 (12 rays, soft), dust 32, gold 40, confetti 16 × 24', () => {
    expect(FX.FX_SIZE.sparkle).toEqual({ w: 48, h: 48 });
    expect(FX.FX_SIZE.sunburst).toEqual({ w: 512, h: 512 });
    const rays = record((ctx) => FX.drawSunburst(ctx, TOKENS));
    expect(opsOf(rays, 'closePath')).toHaveLength(TOKENS.kit.sunburst.rays);
  });

  it('ART 15 fx_sparkle4: 4-point star, long axis 48, white (tinted at runtime)', () => {
    const ops = record((ctx) => FX.drawSparkle(ctx));
    const moves = opsOf(ops, 'moveTo');
    expect(moves.at(-1)).toEqual(['moveTo', 24, 0]);
    expect(styleAt(ops, 'fill', 'fillStyle').at(-1)).toBe('#FFFFFF');
  });
});

describe('scene drawing (ART 2.4, 7.1–7.4; UX 5.8)', () => {
  it('ART 7.1 R2-12 game background spec: gameTop → gameBottom, 120 px blueprint grid α 0.04, every 4th line 3 px α 0.07', () => {
    const s = SC.gameBackgroundSpec(TOKENS, 1080, 2337);
    expect([s.top, s.bottom]).toEqual([TOKENS.color.scene.gameTop, TOKENS.color.scene.gameBottom]);
    const v = s.lines.filter((l) => l.axis === 'v');
    expect(v.map((l) => l.at)).toEqual([120, 240, 360, 480, 600, 720, 840, 960]);
    expect(v.find((l) => l.at === 480)).toMatchObject({ px: 3, alpha: TOKENS.alpha.sceneGridMajor });
    expect(v.find((l) => l.at === 120)).toMatchObject({ px: 2, alpha: TOKENS.alpha.sceneGridMinor });
    expect(s.lines.filter((l) => l.axis === 'h')).toHaveLength(19);
  });

  it('ART 2.4 DL-2R-18 pegboard cell: one Ø yardHolePx hole in the cell centre, shade arc in its lower half', () => {
    const ops = record((ctx) => SC.drawYardFloorV2(ctx, TOKENS));
    const arcs = opsOf(ops, 'arc');
    expect(arcs[0]).toEqual(['arc', 60, 60, TOKENS.layout.adaptive.yardHolePx / 2, 0, Math.PI * 2]);
    expect(arcs[1]?.[4]).toBeGreaterThan(0);
    expect(arcs[1]?.[5]).toBeLessThan(Math.PI);
    const k = record((ctx) => SC.drawYardFloorV2(ctx, TOKENS, 1.2));
    expect(opsOf(k, 'arc')[0]?.slice(0, 3)).toEqual(['arc', 72, 72]);
    expect(opsOf(k, 'arc')[0]?.[3]).toBeCloseTo(7.2, 9);
  });

  it('UX 5.8 yard frame: even-odd rings only (nothing is cleared under the hole), 9-slice insets ≥ radius + frame', () => {
    const size = SC.yardFrameSize(TOKENS);
    const ops = record((ctx) => SC.drawYardFrameV2(ctx, size, TOKENS));
    expect(opsOf(ops, 'clearRect')).toEqual([]);
    expect(opsOf(ops, 'fill').every((f) => f[1] === 'evenodd')).toBe(true);
    const a = TOKENS.layout.adaptive;
    expect(SC.yardFrameSlices(TOKENS).left).toBeGreaterThanOrEqual(a.yardFrameRadiusPx + a.yardFramePx);
  });

  it('ART 7.2 structure ghost: ONE union fill (blueprint α 0.35) + white α 0.9 dashed 16/12 contour per part, no foliage', () => {
    const ops = record((ctx) => SC.drawStructureFallback(ctx, 'ghost', TOKENS));
    expect(styleAt(ops, 'fill', 'fillStyle')).toEqual([css(parseHex(TOKENS.color.board.blueprint), 0.35)]);
    expect(opsOf(ops, 'setLineDash')).toEqual([['setLineDash', [16, 12]]]);
    const color = record((ctx) => SC.drawStructureFallback(ctx, 'color', TOKENS));
    expect(opsOf(color, 'fill').length).toBe(opsOf(ops, 'stroke').length + 3);
  });
});

describe('fallback art registry (ASSET 16.3 "Prosedürel yedek"; TECH 2R.6)', () => {
  it('TECH 2R.6 every catalogue image except bg_level_site_edge and the icons has a procedural fallback at its raster size', () => {
    for (const a of ASSET_CATALOG) {
      if (a.inAtlas) continue;
      const fb = fallbackArt(a.id, a.raster, TOKENS);
      if (a.id === 'bg_level_site_edge') expect(fb).toBeNull();
      else expect(fb, a.id).toMatchObject({ w: a.raster.w, h: a.raster.h });
    }
    expect(fallbackArt('town_ch1_treehouse_ghost', { w: 760, h: 820 }, TOKENS)).not.toBeNull();
    expect(dedePortraitFallback(TOKENS)).toMatchObject({ w: 128, h: 128 });
  });

  it('ART 9 fallback icon atlas: every catalogue icon has a procedural frame `icon_<name>`', () => {
    const names = iconFallbackFrames(TOKENS).map((f) => f.name);
    const icons = ASSET_CATALOG.filter((a) => a.inAtlas).map((a) => a.id);
    expect(names.sort()).toEqual([...icons].sort());
  });

  it('ART 11 character fallbacks use the signature colours of color.character verbatim', () => {
    const fills = (id: CH.CharacterId): string[] => {
      const ops = record((ctx) => CH.drawCharacter(ctx, id, CH.CHARACTER_VIEWBOX[id], TOKENS));
      return [...styleAt(ops, 'fill', 'fillStyle'), ...styleAt(ops, 'stroke', 'strokeStyle')].flatMap((f) =>
        isGradient(f) ? f.stops.map((s) => s[1]) : [String(f)],
      );
    };
    const ch = TOKENS.color.character;
    expect(fills('chr_tuna_bust')).toEqual(
      expect.arrayContaining([ch.tuna['helmet'], ch.tuna['vest'], ch.tuna['gloves']]),
    );
    expect(fills('chr_dede_bust')).toEqual(expect.arrayContaining([ch.dede['cap'], ch.dede['jacket']]));
    expect(fills('chr_kepce_bust')).toEqual(expect.arrayContaining([ch.kepce['helmet'], ch.kepce['collar']]));
    expect(fills('chr_gribeton_bust')).toEqual(
      expect.arrayContaining([ch.gribeton['suit'], ch.gribeton['hair']]),
    );
  });
});

describe('determinism of every v2 drawer (TECH 2R.7)', () => {
  pureCheck('kit button pressed', (ctx) =>
    K.drawButton(ctx, { color: 'orange', w: 400, h: 152, state: 'pressed' }, TOKENS),
  );
  pureCheck('kit round button', (ctx) =>
    K.drawRoundButton(ctx, { color: 'green', d: 68, glyph: 'plus' }, TOKENS),
  );
  pureCheck('kit shine band', (ctx) => K.drawButtonShine(ctx, { buttonW: 720, h: 176 }, TOKENS));
  pureCheck('kit panel frame', (ctx) => K.drawPanel(ctx, { w: 600, h: 400, variant: 'frame' }, TOKENS));
  pureCheck('kit panel hud', (ctx) => K.drawPanel(ctx, { w: 600, h: 104, variant: 'hud' }, TOKENS));
  pureCheck('kit inset', (ctx) => K.drawInset(ctx, { w: 400, h: 100 }, TOKENS));
  pureCheck('kit ribbon', (ctx) => K.drawRibbon(ctx, { color: 'orange', bodyW: 560 }, TOKENS));
  pureCheck('kit badge locked', (ctx) => K.drawBadge(ctx, { variant: 'locked' }, TOKENS));
  pureCheck('kit capsule', (ctx) => K.drawCapsule(ctx, { w: 290 }, TOKENS));
  pureCheck('kit progress track', (ctx) => K.drawProgressTrack(ctx, { w: 600 }, TOKENS));
  pureCheck('kit nav tab', (ctx) => K.drawNavTab(ctx, { w: 200, h: 212 }, TOKENS));
  pureCheck('kit bubble tail down', (ctx) => K.drawBubbleTail(ctx, { dir: 'down' }, TOKENS));
  pureCheck('kit portrait ring', (ctx) => K.drawPortraitRing(ctx, { d: 128 }, TOKENS));
  pureCheck('kit next floor badge', (ctx) => K.drawNextFloorBadge(ctx, { d: 32 }, TOKENS));
  pureCheck('fx sparkle', (ctx) => FX.drawSparkle(ctx));
  pureCheck('fx star', (ctx) => FX.drawSmallStar(ctx, TOKENS));
  pureCheck('fx ring', (ctx) => FX.drawRing(ctx));
  pureCheck('fx gold', (ctx) => FX.drawGoldParticle(ctx, TOKENS));
  pureCheck('fx dust + confetti', (ctx) => {
    FX.drawDust(ctx);
    FX.drawConfetti(ctx);
  });
  pureCheck('scene game background', (ctx) => SC.drawGameBackground(ctx, { w: 1080, h: 1920 }, TOKENS));
  pureCheck('scene yard preview', (ctx) => SC.drawYardPreviewCell(ctx, TOKENS));
  pureCheck('scene town fallback', (ctx) => SC.drawTownFallback(ctx, { w: 540, h: 960 }, TOKENS));
  pureCheck('scene win plaza fallback', (ctx) => SC.drawWinPlazaFallback(ctx, { w: 540, h: 960 }, TOKENS));
  pureCheck('scene structure colour', (ctx) => SC.drawStructureFallback(ctx, 'color', TOKENS));
  pureCheck('scene logo emblem', (ctx) => SC.drawLogoEmblemFallback(ctx, TOKENS));
  for (const id of CH.CHARACTER_IDS)
    pureCheck(`character ${id}`, (ctx) => CH.drawCharacter(ctx, id, { w: 300, h: 375 }, TOKENS));
  pureCheck('character glove', (ctx) => CH.drawGlove(ctx, TOKENS));
  pureCheck('character dede portrait', (ctx) => CH.drawDedePortrait(ctx, 128, TOKENS));
  for (const n of ICON_NAMES) pureCheck(`icon ${n}`, (ctx) => drawKitIcon(ctx, n, TOKENS));
});

describe('atlases (TECH 10.2, 2R.7)', () => {
  it('TECH 2R.7 kit atlas: unique names, every sliced frame has insets, pages ≤ 2048 × 1024, deterministic', () => {
    const frames = kitAtlasFrames(TOKENS);
    const names = frames.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
    for (const n of Object.values(KIT)) expect(names, n).toContain(n);
    for (const n of Object.values(FX.FX)) expect(names, n).toContain(n);
    const slices = kitSlices(TOKENS);
    for (const name of slices.keys()) expect(names, name).toContain(name);
    for (const [name, s] of slices) {
      const f = frames.find((x) => x.name === name);
      expect(s.left + s.right, name).toBeLessThan(f?.w ?? 0);
      expect(s.top + s.bottom, name).toBeLessThan(f?.h ?? 0);
    }
    const pages = packFrames(frames, KIT_PAGE);
    expect(pages.length).toBeLessThanOrEqual(2);
    for (const p of pages) expect([p.width <= 2048, p.height <= 1024]).toEqual([true, true]);
    const page = pages[0] as AtlasPage;
    expect(record((ctx) => renderPage(ctx, page))).toEqual(record((ctx) => renderPage(ctx, page)));
  });

  it('ART 2.4 boot atlas v2: pegboard floor is ONE cell (v1: 2 × 2 checker) + the yard drop preview frame', () => {
    const v1 = bootAtlasFrames(TOKENS);
    const v2 = bootAtlasFrames(TOKENS, undefined, 'v2');
    expect(v1.find((f) => f.name === FRAME.yardFloor)).toMatchObject({ w: 240, h: 240 });
    expect(v2.find((f) => f.name === FRAME.yardFloor)).toMatchObject({ w: 120, h: 120 });
    expect(v2.map((f) => f.name)).toContain(YARD_PREVIEW_FRAME);
    expect(v1.map((f) => f.name)).not.toContain(YARD_PREVIEW_FRAME);
  });

  for (const n of [1, 2, 3, 4, 5]) {
    it(`TECH 2R.7 level ${n} v2 bake: same block names and boxes as v1, + blk_gloss / blk_glow per shape`, () => {
      const lv = level(n);
      const v1 = levelFrames(lv, TOKENS);
      const v2 = levelFrames(lv, TOKENS, undefined, { variant: 'v2' });
      const blocks = (fs: typeof v1) =>
        fs.filter((f) => /^blk_[A-Z]\d_\d+_[A-Z]/.test(f.name)).map((f) => [f.name, f.w, f.h]);
      expect(blocks(v2)).toEqual(blocks(v1));
      const shapes = new Set(blocks(v1).map((b) => String(b[0]).split('_').slice(1, 3).join('_')));
      const names = v2.flatMap((f) => [f.name, ...f.aliases]);
      for (const s of shapes) {
        expect(names).toContain(glossFrameName(s as never));
        expect(names).toContain(glowFrameName(s as never));
        expect(names).toContain(silhouetteFrameName(s as never, 'crane'));
      }
      const pages = packFrames(v2, { maxWidth: 2048, maxHeight: 1024, gutter: 2 });
      expect(pages.length).toBeLessThanOrEqual(2);
    });
  }

  it('TECH 2R.1 v2 bake at k = 1.2 scales the block boxes (B1 144 px) and keeps the names', () => {
    const f = blockFrame({ shape: 'D2_0', color: 'P' }, TOKENS, { variant: 'v2', k: 1.2 });
    expect([f.name, f.w, f.h]).toEqual([blockFrameName('D2_0', 'P'), 144, 288]);
  });

  it('ART 6 cargo kinds: I5 and Q9 are Heavy Load (cargo_i5 / cargo_q9), the rest are blocks', () => {
    expect(cargoKindOf('Q9_0')).toBe('Q9');
    expect(cargoKindOf('I5_0')).toBe('I5');
    expect(cargoKindOf('I4_90')).toBeNull();
  });
});
