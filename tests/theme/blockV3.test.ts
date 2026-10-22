/**
 * Block v3 (ART_REFERENCE §5.2 on top of ART §3A; `kit.v3.block`; TECH_DESIGN §2R.7): the recipe, the v3 geometry
 * (inset 4, contour 4, lip 20), the tones (× 0,50 / × 0,74), the new layers (pillow bevel band, mat gloss, stud shade
 * crescent, holdable highlight crescent) and the ART §2.5 contrast measurement re-run on the v3 tones.
 */
import { describe, expect, it } from 'vitest';
import { shapeById } from '../../src/core/shapes.ts';
import { COLOR_CODES } from '../../src/core/types.ts';
import type { ColorCode } from '../../src/core/types.ts';
import { TOKENS } from '../../src/theme/tokens.ts';
import {
  STUD_HIGHLIGHT_WHITE_ALPHA,
  STUD_SHADE_ARC,
  blockRecipe,
  blockV2Geometry,
  blockV2Palette,
  drawBlockGlossV2,
  drawBlockV2,
  drawCargo,
} from '../../src/theme/draw/blockV2.ts';
import { blockBase, css, parseHex, shade } from '../../src/theme/draw/color.ts';
import type { Rgb } from '../../src/theme/draw/color.ts';
import { isGradient, opsOf, record, styleAt } from './recordingContext.ts';
import type { Op } from './recordingContext.ts';

const V3 = TOKENS.kit.v3.block;
const rad = (deg: number): number => (deg * Math.PI) / 180;
const lin = (v: number): number => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = (c: Rgb): number => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const contrast = (a: Rgb, b: Rgb): number => {
  const x = lum(a);
  const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const over = (ink: { rgb: Rgb; alpha: number }, bg: Rgb): Rgb =>
  [0, 1, 2].map((i) => (ink.rgb[i] ?? 0) * ink.alpha + (bg[i] ?? 0) * (1 - ink.alpha)) as unknown as Rgb;
const fills = (ops: readonly Op[], op: 'fill' | 'fillRect' = 'fill'): unknown[] =>
  styleAt(ops, op, 'fillStyle').map((s) => (isGradient(s) ? s.stops : s));
const near = (a: Rgb, b: Rgb): boolean => a.every((v, i) => Math.abs(v - (b[i] ?? 0)) <= 1);

describe('block recipe (ART_REFERENCE 5.2, kit.v3.block)', () => {
  it('ART_REFERENCE 5.2 v3 recipe = kit.v3.block: inset 4, contour 4 × 0,50, lip 20 × 0,74, gloss α 0,30 rx 0,18, bevel 0,20 h × 1,28, stud shade 8 × 0,80, highlight 6', () => {
    const r = blockRecipe(TOKENS);
    expect(r).toEqual({
      variant: 'v3',
      insetPx: 4,
      outlinePx: 4,
      lipPx: 20,
      darkFactor: 0.74,
      outlineFactor: 0.5,
      glossAlpha: 0.3,
      glossRxRatio: 0.18,
      bevel: { heightRatio: 0.2, lighten: 1.28 },
      studShade: { px: 8, factor: 0.8 },
      studHighlight: { px: 6, alpha: STUD_HIGHLIGHT_WHITE_ALPHA },
    });
    expect(r.insetPx).toBe(V3.insetPx);
    expect(r.lipPx).toBe(V3.lipPx);
  });

  it('ART 3A v2 recipe = tokens.blockV2 (inset 3, contour 6 × 0,42, lip 12 × 0,68, gloss α 0,5 rx 0,22), no v3 layers', () => {
    const v = TOKENS.blockV2;
    expect(blockRecipe(TOKENS, 'v2')).toEqual({
      variant: 'v2',
      insetPx: v.insetPx,
      outlinePx: v.outlinePx,
      lipPx: v.lipPx,
      darkFactor: v.darkFactor,
      outlineFactor: v.outlineFactor,
      glossAlpha: v.glossAlpha,
      glossRxRatio: v.glossEllipse[2],
      bevel: null,
      studShade: null,
      studHighlight: null,
    });
  });
});

describe('v3 geometry (ART_REFERENCE 5.2 items 1, 3, 6)', () => {
  it('ART_REFERENCE 5.2 B1: S = box − 4, B = S − 4, F lifted 20 (8 px floor + 4 + 4 contour between two blocks)', () => {
    const g = blockV2Geometry(shapeById('B1_0'), TOKENS);
    expect(g.S.map((p) => [p.x, p.y])).toEqual([
      [4, 4],
      [116, 4],
      [116, 116],
      [4, 116],
    ]);
    expect(g.B.map((p) => [p.x, p.y])).toEqual([
      [8, 8],
      [112, 8],
      [112, 112],
      [8, 112],
    ]);
    expect(g.F.map((p) => [p.x, p.y])).toEqual([
      [8, 8],
      [112, 8],
      [112, 92],
      [8, 92],
    ]);
  });

  it('ART_REFERENCE 5.2 the open bottom lifts the pillow 20: 1×1 pillow 14,4–85,6 high, stud Ø 53,2 (= 0,44 c, the reference stud ratio)', () => {
    const g = blockV2Geometry(shapeById('B1_0'), TOKENS);
    const P = g.pillows[0];
    expect(P?.y).toBeCloseTo(14.4, 9);
    expect((P?.y ?? 0) + (P?.h ?? 0)).toBeCloseTo(85.6, 9);
    expect(g.studs[0]?.d).toBeCloseTo(53.2, 9);
    expect((g.studs[0]?.d ?? 0) / 120).toBeCloseTo(V3.refStudRatio, 1);
    // inner cells of a vertical I4 keep the full 0,54 c stud
    const i4 = blockV2Geometry(shapeById('I4_0'), TOKENS);
    expect(Math.max(...i4.studs.map((s) => s.d))).toBeCloseTo(64.8, 9);
  });

  it('ART_REFERENCE 5.2 the Heavy Load keeps the block inset (4)', () => {
    const ops = record((ctx) => drawCargo(ctx, { kind: 'I5' }, TOKENS));
    expect(opsOf(ops, 'moveTo')[0]).toEqual(['moveTo', 4 + 18, 4]);
  });
});

describe('v3 tones and ART 2.5 contrast re-run (ART_REFERENCE 5.2, 2.5)', () => {
  for (const c of COLOR_CODES) {
    it(`ART_REFERENCE 5.2 ${c}: contour = base × 0,50, side wall = base × 0,74; light / bottom / groove / glow unchanged`, () => {
      const p = blockV2Palette(TOKENS, c);
      const v2 = blockV2Palette(TOKENS, c, undefined, blockRecipe(TOKENS, 'v2'));
      const base = blockBase(TOKENS, c);
      expect(near(p.outline, shade(base, 0.5))).toBe(true);
      expect(near(p.dark, shade(base, 0.74))).toBe(true);
      expect(p.light).toEqual(v2.light);
      expect(p.bottom).toEqual(v2.bottom);
      expect(p.groove).toEqual(v2.groove);
      expect(p.glow).toEqual(v2.glow);
    });
  }

  it('ART 2.5 symbol contrast on the stud face (= base) is untouched by v3 (W 7.4 · Y 5.3 · G 4.5 · R 4.2 · O 4.1 · C 4.9 · B 3.5 · P 6.9, every ≥ 3:1)', () => {
    const table: Record<ColorCode, number> = {
      W: 7.4,
      Y: 5.3,
      G: 4.5,
      R: 4.2,
      O: 4.1,
      C: 4.9,
      B: 3.5,
      P: 6.9,
    };
    for (const c of COLOR_CODES) {
      const p = blockV2Palette(TOKENS, c);
      const cr = contrast(over(p.symbol, p.base), p.base);
      expect(cr, c).toBeGreaterThanOrEqual(3);
      expect(Math.abs(cr - table[c]), `${c} ${cr.toFixed(2)}`).toBeLessThanOrEqual(0.06);
    }
  });

  it('ART 2.5 re-run: the lighter v3 contour (× 0,50) still reads on the warm yard floor #E9C891 ≥ 3:1 (Y 3,06 the lowest; v2 4,01)', () => {
    const yard = parseHex(TOKENS.color.board.yardFloor);
    const all = COLOR_CODES.map((c) => ({ c, cr: contrast(blockV2Palette(TOKENS, c).outline, yard) }));
    for (const { c, cr } of all) expect(cr, c).toBeGreaterThanOrEqual(3);
    const lowest = all.reduce((a, b) => (b.cr < a.cr ? b : a));
    expect(lowest.c).toBe('Y');
    expect(lowest.cr).toBeCloseTo(3.06, 1);
  });

  it('ART 2.5 re-run: side wall / base ≥ 1,37 and bevel band / base ≥ 1,21 on every colour (the volume reads without the contour)', () => {
    for (const c of COLOR_CODES) {
      const p = blockV2Palette(TOKENS, c);
      const bevel = [0, 1, 2].map((i) => Math.min(255, (p.base[i] ?? 0) * V3.bevelLighten)) as unknown as Rgb;
      expect(contrast(p.dark, p.base), `wall ${c}`).toBeGreaterThanOrEqual(1.37);
      expect(contrast(bevel, p.base), `bevel ${c}`).toBeGreaterThanOrEqual(1.21);
    }
  });

  it('ART_REFERENCE 5.3 floorDark variant is OFF: on #2C2670 the v3 contour would fall to 1,12 (W) — the contour must come from the floor there', () => {
    expect(TOKENS.kit.v3.board.floorDarkEnabled).toBe(false);
    const dark = parseHex(TOKENS.kit.v3.board.floorDark);
    const lowest = Math.min(...COLOR_CODES.map((c) => contrast(blockV2Palette(TOKENS, c).outline, dark)));
    expect(lowest).toBeLessThan(1.5);
  });
});

describe('v3 layers (ART_REFERENCE 5.2 items 2, 4, 5)', () => {
  const R = blockV2Palette(TOKENS, 'R');

  it('ART_REFERENCE 5.2 item 2: every pillow gets the top bevel band (0,20 h, base × 1,28 → α 0) after the inner shade, inside the pillow clip', () => {
    const ops = record((ctx) => drawBlockV2(ctx, { shape: 'O4_0', color: 'R' }, TOKENS));
    const lit = [0, 1, 2].map((i) => Math.min(255, (R.base[i] ?? 0) * 1.28)) as unknown as Rgb;
    const rectFills = fills(ops, 'fillRect');
    const bands = rectFills.filter(
      (f) =>
        Array.isArray(f) &&
        f.length === 2 &&
        (f as [number, string][])[0]?.[1] === css(lit) &&
        (f as [number, string][])[1]?.[1] === css(lit, 0),
    );
    expect(bands).toHaveLength(4);
    // the band's rect is the pillow's top 0,20 h
    const P = blockV2Geometry(shapeById('O4_0'), TOKENS).pillows[0];
    const rects = opsOf(ops, 'fillRect');
    expect(
      rects.some((r) => r[1] === P?.x && r[2] === P?.y && r[3] === P?.w && r[4] === (P?.h ?? 0) * 0.2),
    ).toBe(true);
    // inner shade → bevel band (the next rect fill, both inside the same clip)
    const ix = rectFills.findIndex(
      (f) => Array.isArray(f) && (f as [number, string][])[1]?.[1] === css(R.dark, 0.28),
    );
    expect(ix).toBeGreaterThanOrEqual(0);
    expect(rectFills[ix + 1]).toEqual([
      [0, css(lit)],
      [1, css(lit, 0)],
    ]);
  });

  it('ART_REFERENCE 5.2 item 4: the pillow gloss ellipse is mat — α 0,30, rx 0,18 w (v2: 0,50 / 0,22 w)', () => {
    const ops = record((ctx) => drawBlockV2(ctx, { shape: 'B1_0', color: 'G' }, TOKENS));
    const P = blockV2Geometry(shapeById('B1_0'), TOKENS).pillows[0];
    const ell = opsOf(ops, 'ellipse')[0];
    expect(ell?.[3]).toBeCloseTo(0.18 * (P?.w ?? 0), 9);
    expect(fills(ops)).toContain(css([255, 255, 255], 0.3));
    expect(fills(ops)).not.toContain(css([255, 255, 255], 0.5));
  });

  it('ART_REFERENCE 5.2 item 5: the stud face gets an 8 px bottom shade crescent (20° → 160°, base × 0,80) under the rim; the face is re-traced for the rim', () => {
    const ops = record((ctx) => drawBlockV2(ctx, { shape: 'B1_0', color: 'B' }, TOKENS));
    const B = blockV2Palette(TOKENS, 'B');
    const s = blockV2Geometry(shapeById('B1_0'), TOKENS).studs[0];
    const arcs = opsOf(ops, 'arc');
    const crescent = arcs.find((a) => a[4] === rad(STUD_SHADE_ARC[0]));
    expect(crescent).toEqual(['arc', s?.cx, s?.cy, (s?.d ?? 0) / 2 - 4, rad(20), rad(160)]);
    const widths = styleAt(ops, 'stroke', 'lineWidth');
    const strokes = styleAt(ops, 'stroke', 'strokeStyle');
    const i = widths.indexOf(8);
    expect(strokes[i]).toBe(css(shade(B.base, 0.8)));
    expect(widths[i + 1]).toBe(2);
    expect(strokes[i + 1]).toBe(css(B.outline, 0.45));
    // the rim's path is the full face circle, traced again after the crescent
    const full = arcs.filter(
      (a) => a[1] === s?.cx && a[2] === s?.cy && a[3] === (s?.d ?? 0) / 2 && a[4] === 0,
    );
    expect(full).toHaveLength(2);
  });

  it('ART_REFERENCE 5.2 item 5 + DL-2R-17: the top-left highlight crescent lives in the holdable gloss layer only (6 px, white α 0,3, at the face edge)', () => {
    const block = record((ctx) => drawBlockV2(ctx, { shape: 'B1_0', color: 'Y' }, TOKENS));
    expect(styleAt(block, 'stroke', 'strokeStyle')).not.toContain(
      css([255, 255, 255], STUD_HIGHLIGHT_WHITE_ALPHA),
    );
    const gloss = record((ctx) => drawBlockGlossV2(ctx, { shape: 'B1_0' }, TOKENS));
    const s = blockV2Geometry(shapeById('B1_0'), TOKENS).studs[0];
    expect(opsOf(gloss, 'arc')[0]).toEqual(['arc', s?.cx, s?.cy, (s?.d ?? 0) / 2 - 3, rad(205), rad(285)]);
    expect(styleAt(gloss, 'stroke', 'lineWidth')).toEqual([6]);
    expect(styleAt(gloss, 'stroke', 'strokeStyle')).toEqual([
      css([255, 255, 255], STUD_HIGHLIGHT_WHITE_ALPHA),
    ]);
  });

  it('TECH 2R.7 the v3 drawers scale with k (contour 4k, lip 20k, crescent 8k, highlight 6k)', () => {
    const g = blockV2Geometry(shapeById('B1_0'), TOKENS, 1.2);
    expect(g.S[0]).toEqual({ x: 4.8, y: 4.8, convex: true });
    expect(g.F[2]?.y).toBeCloseTo(144 - 4.8 - 4.8 - 24, 9);
    const ops = record((ctx) => drawBlockV2(ctx, { shape: 'B1_0', color: 'R', k: 1.2 }, TOKENS));
    expect(styleAt(ops, 'stroke', 'lineWidth')).toContain(8 * 1.2);
    const gloss = record((ctx) => drawBlockGlossV2(ctx, { shape: 'B1_0', k: 1.2 }, TOKENS));
    expect(styleAt(gloss, 'stroke', 'lineWidth')).toEqual([6 * 1.2]);
  });
});
