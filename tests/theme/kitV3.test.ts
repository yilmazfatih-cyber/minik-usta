/**
 * UI kit v3 (docs/ART_REFERENCE.md §3, §4, §7; `kit.v3`; R2-13): button anatomy and sizes, the round × / +, capsules,
 * badges, the indigo window, progress, navigation, bubble, lock, text looks, the kit atlas v3 and determinism of every
 * v3 drawer.
 */
import { describe, expect, it } from 'vitest';
import { TOKENS } from '../../src/theme/tokens.ts';
import * as K3 from '../../src/theme/draw/kitV3.ts';
import { css, parseHex } from '../../src/theme/draw/color.ts';
import type { DrawContext } from '../../src/theme/draw/context.ts';
import { KIT, KIT_PAGE, kitAtlasFrames, kitSlices, packFrames } from '../../src/theme/textures.ts';
import { STICKY_KEYS, createRecorder, isGradient, record, styleAt } from './recordingContext.ts';

const V = TOKENS.kit.v3;

const pureCheck = (name: string, draw: (ctx: DrawContext) => void): void => {
  it(`TECH 2R.7 v3 ${name}: deterministic, balanced save/restore, no leaked sticky state`, () => {
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

describe('button v3 (ART_REFERENCE 3.1, 2.3)', () => {
  it('ART_REFERENCE 3.1 three sizes by height: L ≥ 180 (560 × 212, r 48, contour 6, plate 30, bevel 38, lip 40, 96 px), M ≥ 120, S', () => {
    expect(K3.buttonV3Size(212)).toBe('L');
    expect(K3.buttonV3Size(136)).toBe('M');
    expect(K3.buttonV3Size(100)).toBe('S');
    const L = K3.buttonV3Metrics(212, TOKENS);
    expect(L).toMatchObject({
      size: 'L',
      r: 48,
      strokePx: 6,
      plateInsetPx: 30,
      bevelPx: 38,
      lipPx: 40,
      fontPx: 96,
    });
    const M = K3.buttonV3Metrics(136, TOKENS);
    expect(M).toMatchObject({
      size: 'M',
      r: 36,
      strokePx: 5,
      plateInsetPx: 20,
      bevelPx: 24,
      lipPx: 28,
      fontPx: 56,
    });
    const S = K3.buttonV3Metrics(100, TOKENS);
    expect(S).toMatchObject({
      size: 'S',
      r: 28,
      strokePx: 4,
      plateInsetPx: 14,
      bevelPx: 16,
      lipPx: 20,
      fontPx: 44,
    });
    // ART_REFERENCE §9.4 booster square: contour 8, bevel 18, lip 20
    expect(K3.buttonV3Metrics(160, TOKENS, true)).toMatchObject({ strokePx: 8, bevelPx: 18, lipPx: 20 });
  });

  it('ART_REFERENCE 3.1 layers: shadow → contour (2 px darker bottom) → lip → outer face → lip line → plate (top / 0,55 / bottom) → bevel band', () => {
    const q = V.buttonColor.green;
    const ops = record((ctx) => K3.drawButtonV3(ctx, { color: 'green', w: 560, h: 212 }, TOKENS));
    const fills = styleAt(ops, 'fill', 'fillStyle').map((f) => (isGradient(f) ? f.stops : f));
    // [0] soft shadow, [1] darker contour, [2] contour, [3] lip, [4] outer face gradient, [5] plate gradient, [6] bevel …
    expect(fills[2]).toBe(q.stroke);
    expect(fills[3]).toBe(q.lip);
    expect(isGradient(styleAt(ops, 'fill', 'fillStyle')[4])).toBe(true);
    expect(fills[5]).toEqual([
      [0, q.faceTop],
      [0.55, q.faceMid],
      [1, q.faceBottom],
    ]);
    const bevel = styleAt(ops, 'fillRect', 'fillStyle').find((f) => isGradient(f));
    expect(isGradient(bevel) ? bevel.stops[0] : null).toEqual([0, q.bevel]);
  });

  it('ART_REFERENCE 2.3 pressed: the plate sinks pressedDropPx (8), the lip shrinks to 35 %; disabled = the grey quadruple', () => {
    const n = K3.buttonV3PlateRect({ color: 'green', w: 560, h: 212 }, TOKENS);
    const p = K3.buttonV3PlateRect({ color: 'green', w: 560, h: 212, state: 'pressed' }, TOKENS);
    expect(p.y - n.y).toBe(V.button.pressedDropPx);
    expect(p.h).toBeGreaterThan(n.h); // the shorter lip gives the plate its room back
    const ops = record((ctx) =>
      K3.drawButtonV3(ctx, { color: 'green', w: 300, h: 136, state: 'disabled' }, TOKENS),
    );
    expect(styleAt(ops, 'fill', 'fillStyle')[2]).toBe(V.buttonColor.grey.stroke);
  });

  it('ART_REFERENCE 3.1 3-slice insets cover the corner and the plate corner; min width = both slices; frame = h + shadow', () => {
    for (const h of [212, 136, 100]) {
      const s = K3.buttonV3Slices({ color: 'blue', w: 0, h }, TOKENS);
      const m = K3.buttonV3Metrics(h, TOKENS);
      expect(s.top + s.bottom).toBe(0);
      expect(s.left).toBeGreaterThanOrEqual(Math.max(m.r, m.strokePx + m.plateInsetPx + m.plateRadiusPx));
      expect(K3.buttonV3MinWidth(h, TOKENS)).toBe(s.left + s.right);
    }
    expect(K3.buttonV3FrameSize({ color: 'green', w: 560, h: 212 }, TOKENS)).toEqual({
      w: 560,
      h: 212 + V.button.shadowYPx + V.button.shadowBlurPx / 2,
    });
  });

  it('ART_REFERENCE 3.2 / 3.3 the red × (ring #A30101, lip, face, cream glyph with its contour) and the green +', () => {
    const c = V.close;
    const ops = record((ctx) => K3.drawCloseV3(ctx, {}, TOKENS));
    const fills = styleAt(ops, 'fill', 'fillStyle').map((f) => (isGradient(f) ? 'gradient' : f));
    expect(fills.slice(1, 3)).toEqual([c.ring, c.lip]);
    expect(fills).toContain(c.glyphStroke);
    expect(fills.at(-1)).toBe(c.glyph);
    expect(K3.closeV3FrameSize(TOKENS).w).toBe(c.diameterPx);
    const plus = record((ctx) => K3.drawPlusV3(ctx, {}, TOKENS));
    expect(styleAt(plus, 'fill', 'fillStyle')[0]).toBe(V.plus.stroke);
    expect(styleAt(plus, 'fill', 'fillStyle').at(-1)).toBe('#FFFFFF');
  });
});

describe('capsule, badge, window, progress, nav, bubble, lock (ART_REFERENCE 3.4–3.14)', () => {
  it('ART_REFERENCE 3.4 capsules: home 88 (#23164D α 0,85) / HUD 60 (#14113A), dark inner ring #0E0C2C α 0,7', () => {
    const c = V.capsule;
    expect(K3.capsuleV3Height('home', TOKENS)).toBe(88);
    expect(K3.capsuleV3Height('hud', TOKENS)).toBe(60);
    const ops = record((ctx) => K3.drawCapsuleV3(ctx, { w: 290, variant: 'home' }, TOKENS));
    expect(styleAt(ops, 'fill', 'fillStyle')[0]).toBe(css(parseHex(c.fill), c.fillAlpha));
    expect(styleAt(ops, 'stroke', 'strokeStyle')).toEqual([css(parseHex(c.innerRing), c.innerRingAlpha)]);
    const hud = record((ctx) => K3.drawCapsuleV3(ctx, { w: 220, variant: 'hud' }, TOKENS));
    expect(styleAt(hud, 'fill', 'fillStyle')[0]).toBe(css(parseHex(c.hudFill), c.fillAlpha));
    expect(K3.capsuleV3Slices('home', TOKENS).left).toBeGreaterThanOrEqual(44);
  });

  it('ART_REFERENCE 3.5 badge 72: shadow → contour #9C0B00 → lip → face gradient top / 0,45 / bottom → bevel α 0,22', () => {
    const b = V.badge;
    const ops = record((ctx) => K3.drawBadgeV3(ctx, { sizePx: 72 }, TOKENS));
    const fills = styleAt(ops, 'fill', 'fillStyle').map((f) => (isGradient(f) ? f.stops : f));
    expect(fills[1]).toBe(b.stroke);
    expect(fills[2]).toBe(b.lip);
    expect(fills[3]).toEqual([
      [0, b.top],
      [0.45, b.mid],
      [1, b.bottom],
    ]);
    expect(styleAt(ops, 'fillRect', 'fillStyle')).toEqual([css([255, 255, 255], b.bevelAlpha)]);
    expect(K3.badgeV3FrameSize(72)).toEqual({ w: 72, h: 76 });
  });

  it('ART_REFERENCE 3.7 window: outline #221380 7 → rim #3A27B0 16 → groove #27198A 8 → bevel #3C2AAD 22 → body gradient → two lip bands', () => {
    const p = V.panel;
    const ops = record((ctx) => K3.drawPanelV3(ctx, { w: 400, h: 400 }, TOKENS));
    const fills = styleAt(ops, 'fill', 'fillStyle').map((f) =>
      isGradient(f) ? f.stops.map((x) => x[1]) : f,
    );
    expect(fills.slice(1, 6)).toEqual([p.outline, p.rim, p.groove, p.bevel, [p.bodyTop, p.bodyBottom]]);
    expect(styleAt(ops, 'fillRect', 'fillStyle')).toEqual([p.lip, p.lipDark]);
    const s = K3.panelV3Slices(TOKENS);
    expect(s.top).toBeGreaterThanOrEqual(p.radiusPx);
    expect(s.bottom).toBeGreaterThanOrEqual(
      p.outlinePx + p.rimPx + p.groovePx + p.bevelPx + p.lipPx + p.lipDarkPx,
    );
    const plate = record((ctx) => K3.drawPlateV3(ctx, { w: 200, h: 120 }, TOKENS));
    expect(styleAt(plate, 'fill', 'fillStyle')).toEqual([p.plateStroke, p.plate]);
    const card = record((ctx) => K3.drawCardV3(ctx, { w: 200, h: 120 }, TOKENS));
    expect(styleAt(card, 'fill', 'fillStyle')).toEqual([p.creamEdge, p.cream]);
  });

  it('ART_REFERENCE 3.8 meta progress 84: orange contour 8, track #06436D, fill #7FC21A → #4E9300 with the dark edge and the gloss', () => {
    const p = V.progress;
    expect(K3.progressV3Height('meta', TOKENS)).toBe(84);
    expect(K3.progressV3Height('compact', TOKENS)).toBe(48);
    const track = record((ctx) => K3.drawProgressV3Track(ctx, { w: 300, variant: 'meta' }, TOKENS));
    expect(styleAt(track, 'fill', 'fillStyle')).toEqual([p.stroke, p.track]);
    const fill = record((ctx) => K3.drawProgressV3Fill(ctx, { w: 200, variant: 'meta' }, TOKENS));
    const g = styleAt(fill, 'fill', 'fillStyle')[1];
    expect(styleAt(fill, 'fill', 'fillStyle')[0]).toBe(p.fillEdge);
    expect(isGradient(g) ? g.stops.map((x) => x[1]) : null).toEqual([p.fillTop, p.fillBottom]);
    expect(K3.progressV3FillHeight('meta', TOKENS)).toBe(84 - 2 * K3.progressV3Pad('meta', TOKENS));
  });

  it('ART_REFERENCE 3.9 nav: bar #533FE9 → #4E3CDB with the dark + light top edges; raised tab 300 × 300, contour #2C1E94 12, inner line, face', () => {
    const n = V.nav;
    const bar = record((ctx) => K3.drawNavBarV3(ctx, { w: 8, h: 200 }, TOKENS));
    const g = styleAt(bar, 'fillRect', 'fillStyle')[0];
    expect(isGradient(g) ? g.stops.map((x) => x[1]) : null).toEqual([n.barTop, n.barBottom]);
    expect(styleAt(bar, 'fillRect', 'fillStyle').slice(1)).toEqual([n.edgeDark, n.edgeLight]);
    expect(K3.navTabV3Size(TOKENS)).toEqual({ w: 300, h: 300 });
    const tab = record((ctx) => K3.drawNavTabV3(ctx, TOKENS));
    const fills = styleAt(tab, 'fill', 'fillStyle').map((f) =>
      isGradient(f) ? f.stops.map((x) => x[1]) : f,
    );
    expect(fills).toEqual([n.raisedStroke, n.raisedInnerLine, [n.raisedTop, n.raisedBottom]]);
  });

  it('ART_REFERENCE 3.14 bubble: shadow +10 α 0,25 → outer ring #0B3A6E (bottom 10) → inner ring #2E9BF0 → cream #FFF6D2; the tail carries both rings', () => {
    const b = V.bubble;
    const ops = record((ctx) => K3.drawBubbleV3(ctx, { w: 400, h: 160 }, TOKENS));
    expect(styleAt(ops, 'fill', 'fillStyle')).toEqual([
      css([0, 0, 0], b.shadowAlpha),
      b.strokeOuter,
      b.strokeInner,
      b.fill,
    ]);
    expect(K3.bubbleV3FrameSize({ w: 400, h: 160 }, TOKENS)).toEqual({ w: 400, h: 170 });
    expect(K3.bubbleV3Inset(TOKENS)).toEqual({ side: 14, bottom: 18 });
    for (const dir of ['left', 'down', 'up'] as const) {
      const t = record((ctx) => K3.drawBubbleV3Tail(ctx, { dir }, TOKENS));
      expect(styleAt(t, 'stroke', 'strokeStyle')).toEqual([b.strokeOuter, b.strokeInner]);
      expect(styleAt(t, 'fill', 'fillStyle').at(-1)).toBe(b.fill);
    }
  });

  it('ART_REFERENCE 3.13 small lock 48 × 56: gold body gradient, #7A3A00 contour, shackle, keyhole', () => {
    const l = V.lock;
    expect(K3.lockV3Size('small', TOKENS)).toEqual({ w: 48, h: 60 });
    const ops = record((ctx) => K3.drawLockV3(ctx, { variant: 'small' }, TOKENS));
    expect(styleAt(ops, 'stroke', 'strokeStyle')).toEqual([l.stroke, l.shackle, l.shackleInner]);
    const fills = styleAt(ops, 'fill', 'fillStyle');
    expect(fills).toContain(l.stroke);
    expect(fills.at(-1)).toBe(l.keyhole);
  });

  it('ART_REFERENCE 7.2 scene glow: base #1A173C, radial #2B2661 at (0,5 W, 0,26 H), vignette; §7.4 loading sky stops', () => {
    const ops = record((ctx) => K3.drawSceneGlowV3(ctx, { w: 1080, h: 1920 }, TOKENS));
    const fills = styleAt(ops, 'fillRect', 'fillStyle');
    expect(fills[0]).toBe(V.scene.gameBase);
    expect(isGradient(fills[1]) ? fills[1].stops[0] : null).toEqual([0, css(parseHex(V.scene.gameGlow), 1)]);
    const sky = record((ctx) => K3.drawLoadingSkyV3(ctx, { w: 270, h: 480 }, TOKENS));
    const g = styleAt(sky, 'fillRect', 'fillStyle')[0];
    expect(isGradient(g) ? g.stops.slice(0, 3).map((x) => x[1]) : null).toEqual([
      V.palette.loadTop,
      V.palette.loadMid,
      V.palette.loadLight,
    ]);
  });
});

describe('text looks v3 (ART_REFERENCE 4)', () => {
  it('ART_REFERENCE 4 button: white + 0,06 em contour (≥ 4 px) + 0,04 em shadow; counters; big number; plain; two-ring title layers', () => {
    const b = K3.textLookV3('button', 96, TOKENS, { stroke: '#0E5A14' });
    expect(b).toMatchObject({ fill: '#FFFFFF', stroke: '#0E5A14', shadow: '#0E5A14', weight: 800 });
    expect(b.strokePx).toBeCloseTo(2 * 0.06 * 96, 9);
    expect(K3.textLookV3('button', 34, TOKENS).strokePx).toBe(8); // min 4 px visible contour
    expect(K3.textLookV3('counterCream', 48, TOKENS)).toMatchObject({ fill: '#FFF6E3', stroke: '#0B0918' });
    expect(K3.textLookV3('counterLavender', 40, TOKENS)).toMatchObject({
      fill: '#A09AFC',
      stroke: null,
      shadowDy: 3,
    });
    expect(K3.textLookV3('bigNumber', 96, TOKENS)).toMatchObject({ fill: '#FBF1BD', stroke: '#00325A' });
    expect(K3.textLookV3('plain', 64, TOKENS)).toMatchObject({ fill: '#FFFFFF', stroke: '#111111' });
    const front = K3.textLookV3('titleRingFront', 112, TOKENS);
    const back = K3.textLookV3('titleRingBack', 112, TOKENS);
    expect(front).toMatchObject({ fill: '#FFFFFF', stroke: '#5A47EF' });
    expect(back).toMatchObject({ stroke: '#3325A2', shadow: '#211865' });
    expect(back.strokePx).toBeGreaterThan(front.strokePx);
    expect(K3.textLookV3('titleGold', 112, TOKENS)).toMatchObject({ stroke: '#B8430A', shadowAlpha: 0.6 });
  });
});

describe('kit atlas v3 (TECH 2R.7)', () => {
  it('TECH 2R.7 kit atlas v3: unique names, every KIT frame present, every sliced frame has insets, pages ≤ 2048 × 1024', () => {
    const frames = kitAtlasFrames(TOKENS);
    const names = frames.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
    for (const n of Object.values(KIT)) expect(names, n).toContain(n);
    for (const [color, h, square] of K3.KIT_V3_BUTTON_BAKES)
      expect(names).toContain(K3.kitButtonV3FrameName(color, h, 'normal', square));
    const slices = kitSlices(TOKENS);
    for (const [name, s] of slices) {
      const f = frames.find((x) => x.name === name);
      expect(f, name).toBeDefined();
      expect(s.left + s.right, name).toBeLessThan(f?.w ?? 0);
      expect(s.top + s.bottom, name).toBeLessThan(f?.h ?? 0);
    }
    const pages = packFrames(frames, KIT_PAGE);
    expect(pages.length).toBeLessThanOrEqual(2);
    for (const p of pages) expect([p.width <= 2048, p.height <= 1024]).toEqual([true, true]);
  });
});

describe('determinism of every v3 drawer (TECH 2R.7)', () => {
  pureCheck('button L green', (ctx) => K3.drawButtonV3(ctx, { color: 'green', w: 560, h: 212 }, TOKENS));
  pureCheck('button M cream pressed', (ctx) =>
    K3.drawButtonV3(ctx, { color: 'cream', w: 360, h: 136, state: 'pressed' }, TOKENS),
  );
  pureCheck('button square purple', (ctx) =>
    K3.drawButtonV3(ctx, { color: 'purple', w: 136, h: 136, square: true }, TOKENS),
  );
  pureCheck('button greenSoft', (ctx) =>
    K3.drawButtonV3(ctx, { color: 'greenSoft', w: 560, h: 240 }, TOKENS),
  );
  pureCheck('close', (ctx) => K3.drawCloseV3(ctx, {}, TOKENS));
  pureCheck('close pressed', (ctx) => K3.drawCloseV3(ctx, { state: 'pressed' }, TOKENS));
  pureCheck('plus', (ctx) => K3.drawPlusV3(ctx, {}, TOKENS));
  pureCheck('capsule hud', (ctx) => K3.drawCapsuleV3(ctx, { w: 220, variant: 'hud' }, TOKENS));
  pureCheck('badge circle', (ctx) => K3.drawBadgeV3(ctx, { sizePx: 56, shape: 'circle' }, TOKENS));
  pureCheck('panel', (ctx) => K3.drawPanelV3(ctx, { w: 200, h: 320 }, TOKENS));
  pureCheck('plate', (ctx) => K3.drawPlateV3(ctx, { w: 128, h: 128 }, TOKENS));
  pureCheck('card', (ctx) => K3.drawCardV3(ctx, { w: 128, h: 128 }, TOKENS));
  pureCheck('ray fan', (ctx) =>
    K3.drawRayFan(ctx, { w: 300, h: 200, rays: 20, light: '#FAEFBC', dark: '#F1E5BD' }),
  );
  pureCheck('progress compact', (ctx) => {
    K3.drawProgressV3Track(ctx, { w: 200, variant: 'compact' }, TOKENS);
    K3.drawProgressV3Fill(ctx, { w: 120, variant: 'compact' }, TOKENS);
  });
  pureCheck('nav bar + tab', (ctx) => {
    K3.drawNavBarV3(ctx, { w: 8, h: 200 }, TOKENS);
    K3.drawNavTabV3(ctx, TOKENS);
  });
  pureCheck('bubble + tails', (ctx) => {
    K3.drawBubbleV3(ctx, { w: 160, h: 140 }, TOKENS);
    for (const dir of ['left', 'down', 'up'] as const) K3.drawBubbleV3Tail(ctx, { dir }, TOKENS);
  });
  pureCheck('lock big', (ctx) => K3.drawLockV3(ctx, { variant: 'big' }, TOKENS));
  pureCheck('toggle on / off', (ctx) => {
    K3.drawToggleV3(ctx, { on: true }, TOKENS);
    K3.drawToggleV3(ctx, { on: false }, TOKENS);
  });
  pureCheck('moves plate', (ctx) => K3.drawMovesPlateV3(ctx, TOKENS));
  pureCheck('highlight + portrait ring', (ctx) => {
    K3.drawHighlightV3(ctx, { w: 160, h: 160 }, TOKENS);
    K3.drawPortraitRingV3(ctx, { d: 128 }, TOKENS);
  });
  pureCheck('scene glow + loading sky', (ctx) => {
    K3.drawSceneGlowV3(ctx, { w: 270, h: 480 }, TOKENS);
    K3.drawLoadingSkyV3(ctx, { w: 270, h: 480 }, TOKENS);
  });
});
