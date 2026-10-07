/**
 * Candy block v2 (ART_DIRECTION §2.5, §3A, §3A.5, §6; TECH_DESIGN §2R.7, §2R.12 WP-F): `offsetEdges` corners of L4 and
 * T4, pillow and stud geometry, tones vs `check.v2`, symbol contrast, the ART §3A.4 draw order, the separate holdable
 * gloss layer (DL-2R-17), v2 silhouettes / glow / ghosts, the Heavy Load and determinism.
 */
import { describe, expect, it } from 'vitest';
import rawTokens from '../../src/theme/tokens.json' with { type: 'json' };
import { shapeById } from '../../src/core/shapes.ts';
import { COLOR_CODES } from '../../src/core/types.ts';
import type { ColorCode, ShapeId } from '../../src/core/types.ts';
import { TOKENS, parseTokens } from '../../src/theme/tokens.ts';
import type { Tokens } from '../../src/theme/tokens.ts';
import {
  blockV2Geometry,
  blockV2Palette,
  blockV2Size,
  cargoSize,
  creamBlockPalette,
  drawBlockGlossV2,
  drawBlockV2,
  drawBlocksLeftIcon,
  drawCargo,
  drawGhostV2,
  drawLiftGlowV2,
  drawSilhouetteV2,
  edgeSide,
  liftGlowPad,
  liftGlowSize,
  offsetEdges,
} from '../../src/theme/draw/blockV2.ts';
import { css, parseHex, toHex } from '../../src/theme/draw/color.ts';
import type { Rgb } from '../../src/theme/draw/color.ts';
import { canvasCells, polyominoOutline } from '../../src/theme/draw/path.ts';
import type { Corner } from '../../src/theme/draw/path.ts';
import { STICKY_KEYS, createRecorder, isGradient, opsOf, record, styleAt } from './recordingContext.ts';
import type { Op } from './recordingContext.ts';

const xy = (cs: readonly Corner[]): [number, number][] => cs.map((p) => [p.x, p.y]);
const outline = (id: ShapeId): Corner[] => {
  const s = shapeById(id);
  return polyominoOutline(canvasCells(s.cells, s.h), 120);
};

type V2Group = 'light' | 'bottom' | 'dark' | 'outline' | 'groove' | 'glow';
const checkV2 = (rawTokens as unknown as { check: { v2: Record<V2Group, Record<ColorCode, string>> } }).check
  .v2;

function withinOne(actual: Rgb, expected: string, label: string): void {
  const e = parseHex(expected);
  const a = parseHex(toHex(actual));
  for (let i = 0; i < 3; i++) {
    expect(
      Math.abs((a[i] ?? 0) - (e[i] ?? 0)),
      `${label}: ${toHex(actual)} vs ${expected}`,
    ).toBeLessThanOrEqual(1);
  }
}

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

/** Tokens with one blockV2 value changed (the schema is re-run, so the copy is valid and frozen). */
function tokensWith(patch: Partial<Tokens['blockV2']>): Tokens {
  const raw = JSON.parse(JSON.stringify(rawTokens)) as { blockV2: Record<string, unknown> };
  Object.assign(raw.blockV2, patch);
  return parseTokens(raw);
}

describe('offsetEdges (ART 3A.1, 3A.4; TECH 2R.7 unit test)', () => {
  it('ART 3A.4 edge sides of a clockwise outline: → top, ↓ right, ← bottom, ↑ left', () => {
    expect(edgeSide({ x: 0, y: 0 }, { x: 5, y: 0 })).toBe('top');
    expect(edgeSide({ x: 5, y: 0 }, { x: 5, y: 5 })).toBe('right');
    expect(edgeSide({ x: 5, y: 5 }, { x: 0, y: 5 })).toBe('bottom');
    expect(edgeSide({ x: 0, y: 5 }, { x: 0, y: 0 })).toBe('left');
  });

  it('ART 3A.4 L4 corners: S = poly − 3, B = S − 6, F = B with the bottom edges lifted 12 (concave corner kept)', () => {
    const poly = outline('L4_0');
    expect(xy(poly)).toEqual([
      [0, 0],
      [120, 0],
      [120, 240],
      [240, 240],
      [240, 360],
      [0, 360],
    ]);
    const S = offsetEdges(poly, 3, 3, 3, 3);
    const B = offsetEdges(S, 6, 6, 6, 6);
    const F = offsetEdges(B, 0, 0, 12, 0);
    expect(xy(S)).toEqual([
      [3, 3],
      [117, 3],
      [117, 243],
      [237, 243],
      [237, 357],
      [3, 357],
    ]);
    expect(xy(B)).toEqual([
      [9, 9],
      [111, 9],
      [111, 249],
      [231, 249],
      [231, 351],
      [9, 351],
    ]);
    expect(xy(F)).toEqual([
      [9, 9],
      [111, 9],
      [111, 249],
      [231, 249],
      [231, 339],
      [9, 339],
    ]);
    expect(F.map((p) => p.convex)).toEqual([true, true, false, true, true, true]);
  });

  it('ART 3A.4 T4 corners: the nub bottom edge is lifted too, so every step shows its side wall', () => {
    const S = offsetEdges(outline('T4_0'), 3, 3, 3, 3);
    const B = offsetEdges(S, 6, 6, 6, 6);
    const F = offsetEdges(B, 0, 0, 12, 0);
    expect(xy(S)).toEqual([
      [3, 3],
      [117, 3],
      [117, 123],
      [237, 123],
      [237, 237],
      [117, 237],
      [117, 357],
      [3, 357],
    ]);
    expect(xy(F)).toEqual([
      [9, 9],
      [111, 9],
      [111, 129],
      [231, 129],
      [231, 219],
      [111, 219],
      [111, 339],
      [9, 339],
    ]);
    expect(F.map((p) => p.convex)).toEqual([true, true, false, true, true, false, true, true]);
  });

  it('ART 3A.2 negative amounts grow the outline (lift glow ring)', () => {
    const grown = offsetEdges(outline('B1_0'), -10, -10, -10, -10);
    expect(xy(grown)).toEqual([
      [-10, -10],
      [130, -10],
      [130, 130],
      [-10, 130],
    ]);
  });

  it('TECH 2R.1 geometry scales with k (c = 120·k, every px value × k)', () => {
    const g = blockV2Geometry(shapeById('L4_0'), TOKENS, 1.2);
    expect(g.c).toBe(144);
    expect(g.S[0]?.x).toBeCloseTo(3.6, 9);
    expect(g.S[0]?.y).toBeCloseTo(3.6, 9);
    expect(g.F[4]?.y).toBeCloseTo(432 - 3.6 - 7.2 - 14.4, 9);
  });
});

describe('pillows and studs (ART 3A.1 item 4, 3A.5)', () => {
  it('ART 3A.1 1×1 pillow x 14.4–105.6, y 14.4–93.6 (open sides 0.12c, open bottom +12)', () => {
    const g = blockV2Geometry(shapeById('B1_0'), TOKENS);
    const P = g.pillows[0];
    expect(P?.x).toBeCloseTo(14.4, 9);
    expect(P?.y).toBeCloseTo(14.4, 9);
    expect((P?.x ?? 0) + (P?.w ?? 0)).toBeCloseTo(105.6, 9);
    expect((P?.y ?? 0) + (P?.h ?? 0)).toBeCloseTo(93.6, 9);
    expect(g.pillowRadius).toBeCloseTo(19.2, 9);
  });

  it('ART 3A.1 horizontal I4: inner pillows 105.6 wide, end pillows 98.4, 14.4 px groove between neighbours', () => {
    const g = blockV2Geometry(shapeById('I4_90'), TOKENS);
    const ws = g.pillows.map((p) => Math.round(p.w * 10) / 10).sort((a, b) => a - b);
    expect(ws).toEqual([98.4, 98.4, 105.6, 105.6]);
    const xs = [...g.pillows].sort((a, b) => a.x - b.x);
    for (let i = 1; i < xs.length; i++) {
      const prev = xs[i - 1];
      expect((xs[i]?.x ?? 0) - ((prev?.x ?? 0) + (prev?.w ?? 0))).toBeCloseTo(14.4, 9);
    }
  });

  it('ART 3A.5 one stud per cell: d = 61.2 on a 1×1 (height bound), 64.8 = 0.54c on a vertical I4 inner cell', () => {
    const one = blockV2Geometry(shapeById('B1_0'), TOKENS);
    expect(one.studs).toHaveLength(1);
    expect(one.studs[0]?.d).toBeCloseTo(61.2, 9);
    expect(one.studs[0]?.cx).toBeCloseTo(60, 9);
    expect(one.studs[0]?.cy).toBeCloseTo(14.4 + (79.2 - 6) / 2, 9);
    const i4 = blockV2Geometry(shapeById('I4_0'), TOKENS);
    expect(i4.studs).toHaveLength(4);
    expect(Math.max(...i4.studs.map((s) => s.d))).toBeCloseTo(64.8, 9);
  });
});

describe('tones and contrast (ART 2.5; tokens check.v2)', () => {
  for (const c of COLOR_CODES) {
    it(`ART 2.5 ${c}: light / bottom / groove / side wall / outline / glow = check.v2 ±1`, () => {
      const p = blockV2Palette(TOKENS, c);
      withinOne(p.light, checkV2.light[c], `light ${c}`);
      withinOne(p.bottom, checkV2.bottom[c], `bottom ${c}`);
      withinOne(p.groove, checkV2.groove[c], `groove ${c}`);
      withinOne(p.dark, checkV2.dark[c], `dark ${c}`);
      withinOne(p.outline, checkV2.outline[c], `outline ${c}`);
      withinOne(p.glow, checkV2.glow[c], `glow ${c}`);
    });
  }

  it('ART 2.5 check.v2 symbol contrast on the stud face (= base) ≥ 3:1 and equal to the ART table (W 7.4 · Y 5.3 · G 4.5 · R 4.2 · O 4.1 · C 4.9 · B 3.5 · P 6.9)', () => {
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

  it('ART 2.5 studless recipe: contrast at the symbol top edge (inside the 0.30 gradient stop) ≥ 3:1, B the lowest', () => {
    // ART's "sembol üst kenarı" column (B 3.2 …) was measured a few px lower than the symbol box top used here (0.22h of
    // the 1×1 pillow); this test takes the stricter top edge: B 3.13, R 3.74, every colour ≥ 3:1.
    const v = TOKENS.blockV2;
    const P = blockV2Geometry(shapeById('B1_0'), TOKENS).pillows[0];
    const ph = P?.h ?? 0;
    const top = (v.symbolCenterYRatio * ph - (v.symbolSizeRatio * 120) / 2) / ph;
    expect(top).toBeLessThan(v.gradientStop);
    const all = COLOR_CODES.map((c) => {
      const p = blockV2Palette(TOKENS, c);
      const t = top / v.gradientStop;
      const bg = [0, 1, 2].map((i) => (p.light[i] ?? 0) * (1 - t) + (p.base[i] ?? 0) * t) as unknown as Rgb;
      return { c, cr: contrast(over(p.symbol, bg), bg) };
    });
    for (const { c, cr } of all) expect(cr, c).toBeGreaterThanOrEqual(3);
    expect(all.reduce((a, b) => (b.cr < a.cr ? b : a)).c).toBe('B');
  });

  it('ART 2.5 white ink is 92 % (v1 85 %); colour-blind mode boosts it ×1.15 (capped at 100 %)', () => {
    expect(blockV2Palette(TOKENS, 'B').symbol.alpha).toBe(0.92);
    expect(blockV2Palette(TOKENS, 'B', { colorBlind: true }).symbol.alpha).toBe(1);
    expect(blockV2Palette(TOKENS, 'Y').symbol.alpha).toBe(1);
  });
});

/** Fill colours in call order (gradients as their stop list). */
const fills = (ops: readonly Op[]): unknown[] =>
  styleAt(ops, 'fill', 'fillStyle').map((s) => (isGradient(s) ? s.stops : s));

describe('draw order and layers (ART 3A.2, 3A.4, 3A.5)', () => {
  const W = blockV2Palette(TOKENS, 'R');

  it('ART 3A.4 body: contour (outline tone) → side wall (dark) → face (groove), one continuous body per piece', () => {
    const ops = record((ctx) => drawBlockV2(ctx, { shape: 'L4_0', color: 'R' }, TOKENS));
    expect(fills(ops).slice(0, 3)).toEqual([css(W.outline), css(W.dark), css(W.groove)]);
  });

  it('ART 3A.2 layer 4: every pillow has the vertical gradient light → base (0.30) → bottom', () => {
    const ops = record((ctx) => drawBlockV2(ctx, { shape: 'O4_0', color: 'R' }, TOKENS));
    const pillows = fills(ops).filter(
      (f) => Array.isArray(f) && f.length === 3 && (f as [number, string][])[1]?.[0] === 0.3,
    );
    expect(pillows).toHaveLength(4);
    expect(pillows[0]).toEqual([
      [0, css(W.light)],
      [0.3, css(W.base)],
      [1, css(W.bottom)],
    ]);
  });

  it('ART 3A.5 per cell: stud side crescent (dark) 6 px under a flat base face with a 2 px outline rim α 0.45', () => {
    const ops = record((ctx) => drawBlockV2(ctx, { shape: 'B1_0', color: 'R' }, TOKENS));
    const arcs = opsOf(ops, 'arc');
    const stud = blockV2Geometry(shapeById('B1_0'), TOKENS).studs[0];
    expect(arcs.slice(0, 2)).toEqual([
      ['arc', stud?.cx, (stud?.cy ?? 0) + 6, (stud?.d ?? 0) / 2, 0, Math.PI * 2],
      ['arc', stud?.cx, stud?.cy, (stud?.d ?? 0) / 2, 0, Math.PI * 2],
    ]);
    const f = fills(ops);
    expect(f).toContain(css(W.dark));
    expect(styleAt(ops, 'stroke', 'strokeStyle')[0]).toBe(css(W.outline, 0.45));
    expect(styleAt(ops, 'stroke', 'lineWidth')[0]).toBe(2);
  });

  it('DL-2R-17 the stud gloss arc and dot are NOT in the block (holdable layer is separate)', () => {
    const ops = record((ctx) => drawBlockV2(ctx, { shape: 'O4_0', color: 'G' }, TOKENS));
    const glossArcs = opsOf(ops, 'arc').filter((a) => a[4] !== 0);
    expect(glossArcs).toEqual([]);
    expect(fills(ops)).not.toContain(css([255, 255, 255], TOKENS.blockV2.studDotAlpha));
  });

  it('DL-2R-17 blk_gloss: colourless white arc 205°→285° (r 0.42d, 5 px, α 0.5) + dot (225°, 0.30d, 4 px, α 0.8) per stud', () => {
    const ops = record((ctx) => drawBlockGlossV2(ctx, { shape: 'O4_0' }, TOKENS));
    const arcs = opsOf(ops, 'arc');
    expect(arcs).toHaveLength(8);
    const g = blockV2Geometry(shapeById('O4_0'), TOKENS);
    const s = g.studs[0];
    expect(arcs[0]?.[3]).toBeCloseTo(0.42 * (s?.d ?? 0), 9);
    expect(arcs[0]?.[4]).toBeCloseTo((205 * Math.PI) / 180, 9);
    expect(arcs[0]?.[5]).toBeCloseTo((285 * Math.PI) / 180, 9);
    expect(styleAt(ops, 'stroke', 'strokeStyle')).toEqual(Array(4).fill(css([255, 255, 255], 0.5)));
    expect(styleAt(ops, 'stroke', 'lineWidth')).toEqual(Array(4).fill(5));
    expect(styleAt(ops, 'fill', 'fillStyle')).toEqual(Array(4).fill(css([255, 255, 255], 0.8)));
    const dot = arcs[4];
    expect(dot?.[1]).toBeCloseTo((s?.cx ?? 0) + Math.cos((225 * Math.PI) / 180) * 0.3 * (s?.d ?? 0), 9);
    expect(dot?.[3]).toBe(4);
  });

  it('ART 3A.2 layer 7: the emboss copy comes first, offset +3 (white α 0.45, dark ink) or +4 (outline α 0.55, white ink)', () => {
    for (const [c, dy, ink] of [
      ['Y', 3, css([255, 255, 255], 0.45)],
      ['B', 4, css(blockV2Palette(TOKENS, 'B').outline, 0.55)],
    ] as const) {
      const ops = record((ctx) => drawBlockV2(ctx, { shape: 'B1_0', color: c }, TOKENS));
      const tr = opsOf(ops, 'translate');
      const stud = blockV2Geometry(shapeById('B1_0'), TOKENS).studs[0];
      const box = Math.min(0.42 * 120, 0.82 * (stud?.d ?? 0));
      expect(tr[0]).toEqual(['translate', (stud?.cx ?? 0) - box / 2, (stud?.cy ?? 0) + dy - box / 2]);
      expect(tr[1]).toEqual(['translate', (stud?.cx ?? 0) - box / 2, (stud?.cy ?? 0) - box / 2]);
      const inkStyles = [...styleAt(ops, 'fill', 'fillStyle'), ...styleAt(ops, 'stroke', 'strokeStyle')];
      expect(inkStyles).toContain(ink);
    }
  });

  it('ART 3A.5 fallback studEnabled=false: no stud, the pillow gloss dot returns and the symbol sits at 0.54h', () => {
    const t = tokensWith({ studEnabled: false });
    const ops = record((ctx) => drawBlockV2(ctx, { shape: 'B1_0', color: 'R' }, t));
    const P = blockV2Geometry(shapeById('B1_0'), t).pillows[0];
    const arcs = opsOf(ops, 'arc');
    expect(arcs).toHaveLength(1);
    expect(arcs[0]?.[1]).toBeCloseTo((P?.x ?? 0) + 0.7 * (P?.w ?? 0), 9);
    const tr = opsOf(ops, 'translate');
    expect(tr[0]?.[2]).toBeCloseTo((P?.y ?? 0) + 0.54 * (P?.h ?? 0) + 4 - 25.2, 9);
  });

  it('ART 10 colour-blind v2: symbols × 1.2', () => {
    const scaleOf = (cb: boolean): unknown =>
      opsOf(
        record((ctx) => drawBlockV2(ctx, { shape: 'B1_0', color: 'G', mode: { colorBlind: cb } }, TOKENS)),
        'scale',
      )[0]?.[1];
    expect((scaleOf(true) as number) / (scaleOf(false) as number)).toBeCloseTo(1.2, 9);
  });

  it('S3 v2 flag layers are Phase 3: a flagged spec fails loudly', () => {
    expect(() =>
      record((ctx) => drawBlockV2(ctx, { shape: 'B1_0', color: 'R', flags: ['glass'] }, TOKENS)),
    ).toThrow(/Phase 3/);
  });
});

describe('silhouettes, glow, ghosts, Heavy Load, kit icon (ART 3A.2, 6, 14.9)', () => {
  it('ART 3A.2 v2 silhouette is blurred off-frame on the S outline (corner 0.20c)', () => {
    const ops = record((ctx) => drawSilhouetteV2(ctx, { shape: 'B1_0', kind: 'lifted' }, TOKENS));
    expect(ops).toContainEqual(['=shadowBlur', TOKENS.shadow.lifted.blur]);
    expect(ops).toContainEqual(['=shadowOffsetX', 8192]);
    expect(opsOf(ops, 'arcTo')[0]?.[5]).toBeCloseTo(24, 9);
  });

  it('JUICE 91 lift glow: white silhouette grown liftGlowPx with a soft edge; frame = box + 2·pad', () => {
    const pad = liftGlowPad(TOKENS);
    expect(liftGlowSize({ shape: 'D2_0' }, TOKENS)).toEqual({ w: 120 + 2 * pad, h: 240 + 2 * pad });
    const ops = record((ctx) => drawLiftGlowV2(ctx, { shape: 'D2_0' }, TOKENS));
    expect(styleAt(ops, 'fill', 'fillStyle')).toEqual(['#FFFFFF']);
    const first = opsOf(ops, 'arcTo')[0];
    // the ring's first corner: S (3, 3) grown 10 → (−7, −7), shifted by pad and thrown off-frame
    expect(first?.[1]).toBeCloseTo(-7 + pad - 8192, 9);
    expect(first?.[2]).toBeCloseTo(-7 + pad, 9);
  });

  it('UX 5.4 v2 ghosts keep the v1 styles (valid solid + glow, invalid / neutral dashed) on the S outline', () => {
    const valid = record((ctx) => drawGhostV2(ctx, { shape: 'O4_0', style: 'valid' }, TOKENS));
    const invalid = record((ctx) => drawGhostV2(ctx, { shape: 'O4_0', style: 'invalid' }, TOKENS));
    expect(opsOf(valid, 'setLineDash')).toEqual([]);
    expect(opsOf(invalid, 'setLineDash')).toHaveLength(1);
    expect(styleAt(invalid, 'stroke', 'lineWidth')[0]).toBe(TOKENS.stroke.ghostInvalidPx);
  });

  it('ART 6 Heavy Load: one colourless piece (no stud, no symbol), Q9 360², I5 600×120, kettlebell badge', () => {
    expect(cargoSize('Q9', TOKENS)).toEqual({ w: 360, h: 360 });
    expect(cargoSize('I5', TOKENS)).toEqual({ w: 600, h: 120 });
    for (const kind of ['Q9', 'I5'] as const) {
      const ops = record((ctx) => drawCargo(ctx, { kind }, TOKENS));
      expect(opsOf(ops, 'scale')).toEqual([]);
      const colours = [...styleAt(ops, 'fill', 'fillStyle'), ...styleAt(ops, 'fillRect', 'fillStyle')].filter(
        (s): s is string => typeof s === 'string',
      );
      expect(colours).toContain(TOKENS.color.ui.hazardBlack);
      expect(colours).toContain(TOKENS.color.ui.hazardYellow);
      for (const c of COLOR_CODES) expect(colours).not.toContain(TOKENS.color.block[c]);
    }
  });

  it('ART 14.9 blocks-left icon: C3 in cream kit colours, ui.ink contour, no symbol, fits the requested size', () => {
    const cream = creamBlockPalette(TOKENS);
    expect(toHex(cream.dark)).toBe(TOKENS.kit.buttonColor.cream.lip);
    expect(toHex(cream.outline)).toBe(TOKENS.color.ui.ink);
    const ops = record((ctx) => drawBlocksLeftIcon(ctx, 96, TOKENS));
    expect(opsOf(ops, 'scale')).toEqual([]);
    expect(styleAt(ops, 'fill', 'fillStyle')[0]).toBe(TOKENS.color.ui.ink);
    const xs = opsOf(ops, 'arcTo').map((a) => a[1] as number);
    expect(Math.max(...xs)).toBeLessThanOrEqual(96);
  });
});

describe('determinism (TECH 2R.7: drawers are pure)', () => {
  const cases: [string, (r: ReturnType<typeof createRecorder>) => void][] = [
    ['drawBlockV2', (r) => drawBlockV2(r.ctx, { shape: 'S4_90', color: 'P' }, TOKENS)],
    ['drawBlockV2 k 1.2', (r) => drawBlockV2(r.ctx, { shape: 'J4_180', color: 'O', k: 1.2 }, TOKENS)],
    ['drawBlockGlossV2', (r) => drawBlockGlossV2(r.ctx, { shape: 'Z4_0' }, TOKENS)],
    ['drawLiftGlowV2', (r) => drawLiftGlowV2(r.ctx, { shape: 'C3_270' }, TOKENS)],
    ['drawSilhouetteV2', (r) => drawSilhouetteV2(r.ctx, { shape: 'T4_90', kind: 'contact' }, TOKENS)],
    ['drawGhostV2', (r) => drawGhostV2(r.ctx, { shape: 'L4_90', style: 'neutral' }, TOKENS)],
    ['drawCargo', (r) => drawCargo(r.ctx, { kind: 'Q9' }, TOKENS)],
    ['drawBlocksLeftIcon', (r) => drawBlocksLeftIcon(r.ctx, 72, TOKENS)],
  ];
  for (const [name, draw] of cases) {
    it(`TECH 2R.7 ${name}: same input → same Canvas2D log, balanced save/restore, no leaked state`, () => {
      const a = createRecorder();
      const b = createRecorder();
      draw(a);
      draw(b);
      expect(a.ops).toEqual(b.ops);
      expect(a.depth()).toBe(0);
      const s = a.state();
      for (const k of STICKY_KEYS) {
        if (k === 'transforms' || k === 'clips') expect(s[k], k).toBe(0);
      }
      expect(s.shadowBlur).toBe(0);
      expect(s.globalAlpha).toBe(1);
    });
  }

  it('TECH 2R.7 every shape × colour draws inside its w·c × h·c box', () => {
    for (const id of [
      'B1_0',
      'D2_90',
      'I3_0',
      'I4_90',
      'O4_0',
      'C3_90',
      'L4_180',
      'J4_270',
      'T4_0',
      'S4_0',
      'Z4_90',
    ] as const) {
      const size = blockV2Size(id, TOKENS);
      const ops = record((ctx) => drawBlockV2(ctx, { shape: id, color: 'W' }, TOKENS));
      for (const o of [...opsOf(ops, 'arcTo'), ...opsOf(ops, 'moveTo'), ...opsOf(ops, 'lineTo')]) {
        expect(o[1] as number).toBeGreaterThanOrEqual(0);
        expect(o[1] as number).toBeLessThanOrEqual(size.w);
      }
    }
  });
});
