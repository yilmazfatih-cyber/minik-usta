import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import rawTokens from '../../src/theme/tokens.json' with { type: 'json' };
import { COLOR_CODES } from '../../src/core/types.ts';
import type { ColorCode } from '../../src/core/types.ts';
import {
  CHECK_TYPED_GROUPS,
  PENDING_TOKEN_KEYS,
  RETIRED_TOKEN_KEYS,
  SVG_TONES_V3,
  TOKENS,
  V3_ADDENDA,
  parseSvgTonesV3,
  parseTokens,
  parseV3Addenda,
} from '../../src/theme/tokens.ts';
import {
  blockPalette,
  css,
  lstar,
  parseHex,
  planPalette,
  symbolInk,
  toHex,
} from '../../src/theme/draw/color.ts';
import type { Rgb } from '../../src/theme/draw/color.ts';

type CheckGroup = 'blockTop' | 'blockBottom' | 'blockOutline' | 'symbolInk' | 'plan' | 'planStroke';
const ROOT = join(import.meta.dirname, '..', '..');
const check = (rawTokens as unknown as { check: Record<CheckGroup, Record<ColorCode, string>> }).check;

function expectWithinOne(actual: Rgb, expectedHex: string, label: string): void {
  const e = parseHex(expectedHex);
  const a = parseHex(toHex(actual));
  for (let i = 0; i < 3; i++) {
    expect(
      Math.abs((a[i] ?? 0) - (e[i] ?? 0)),
      `${label}: ${toHex(actual)} vs ${expectedHex}`,
    ).toBeLessThanOrEqual(1);
  }
}

const clone = (): Record<string, unknown> => JSON.parse(JSON.stringify(rawTokens)) as Record<string, unknown>;

describe('tokens loader (TECH 10.2, D-003)', () => {
  it('TECH 10.2 tokens.json parses; check.* and _doc keys are not part of the runtime tokens', () => {
    expect(TOKENS.layout.grid.cellPx).toBe(120);
    expect('check' in TOKENS).toBe(false);
    expect('_doc' in TOKENS.layout).toBe(false);
    expect('_doc' in TOKENS.audio).toBe(false);
    expect(Object.keys(TOKENS.color.block)).toEqual([...COLOR_CODES]);
  });

  it('TECH 10.2 runtime tokens are deeply frozen (read only)', () => {
    expect(Object.isFrozen(TOKENS)).toBe(true);
    expect(Object.isFrozen(TOKENS.layout.grid)).toBe(true);
    expect(Object.isFrozen(TOKENS.block.glossRect)).toBe(true);
    expect(Object.isFrozen(TOKENS.audio.seq.sfx_segment)).toBe(true);
  });

  it('TECH 10.2 a missing key is a boot error that names the path', () => {
    const t = clone();
    delete ((t.layout as Record<string, unknown>).grid as Record<string, unknown>).cellPx;
    expect(() => parseTokens(t)).toThrow(/layout\.grid\.cellPx/);
  });

  it('TECH 10.2 a malformed colour or a missing block colour is rejected', () => {
    const bad = clone();
    ((bad.color as Record<string, unknown>).block as Record<string, unknown>).W = 'brown';
    expect(() => parseTokens(bad)).toThrow(/color\.block\.W/);
    const missing = clone();
    delete ((missing.color as Record<string, unknown>).block as Record<string, unknown>).P;
    expect(() => parseTokens(missing)).toThrow(/color\.block\.P/);
  });

  it('TECH 10.2 every Phase 2 sound in audio.sfx / audio.seq is typed and present', () => {
    expect(TOKENS.audio.sfx.sfx_streak_pip.length).toBeGreaterThan(0);
    expect(TOKENS.audio.sfx.sfx_trowel.length).toBeGreaterThan(0);
    expect(TOKENS.audio.sfx.sfx_clamp.length).toBeGreaterThan(0);
    expect(TOKENS.audio.seq.sfx_gap_rail.length).toBeGreaterThan(0);
  });
});

describe('formula colours match check.* within ±1 (ART 3, ART 4, D-013; default mode only)', () => {
  for (const c of COLOR_CODES) {
    it(`ART 3 block layer colours of ${c} (top +20 % white, bottom ×0.75, outline ×0.55)`, () => {
      const p = blockPalette(TOKENS, c);
      expectWithinOne(p.top, check.blockTop[c], `blockTop ${c}`);
      expectWithinOne(p.bottom, check.blockBottom[c], `blockBottom ${c}`);
      expectWithinOne(p.outline, check.blockOutline[c], `blockOutline ${c}`);
    });

    it(`D-013 symbol ink of ${c} follows the L* rule`, () => {
      const ink = symbolInk(TOKENS, c);
      expectWithinOne(ink.rgb, check.symbolInk[c], `symbolInk ${c}`);
      const light = lstar(parseHex(TOKENS.color.block[c])) >= TOKENS.block.symbolLightThresholdLstar;
      expect(ink.alpha).toBe(light ? 1 : TOKENS.alpha.symbolWhite);
    });

    it(`D-013 plan composite and dashed stroke of ${c} (underlay + 80 % colour, stroke ×0.65)`, () => {
      const p = planPalette(TOKENS, c);
      expectWithinOne(p.fill, check.plan[c], `plan ${c}`);
      expectWithinOne(p.stroke, check.planStroke[c], `planStroke ${c}`);
    });
  }
});

describe('palette rules (ART 2.1, ART 2.2, ART 4, ART 10)', () => {
  it('ART 2.1 lightness ladder Y › C › G › O › B › R › P › W', () => {
    const order = (['Y', 'C', 'G', 'O', 'B', 'R', 'P', 'W'] as const).map((c) =>
      lstar(parseHex(TOKENS.color.block[c])),
    );
    for (let i = 1; i < order.length; i++) expect(order[i - 1]).toBeGreaterThan(order[i] ?? 0);
  });

  it('ART 2.2 dark ink exactly for Y, C, G, O (L* ≥ 60); white ink for W, R, B, P', () => {
    const dark = COLOR_CODES.filter((c) => symbolInk(TOKENS, c).alpha === 1);
    expect(dark.sort()).toEqual(['C', 'G', 'O', 'Y']);
  });

  it('ART 4 plan ink: dark #14233D on Y, G, O, C, B; white at alpha.planInkLight on W, R, P', () => {
    for (const c of COLOR_CODES) {
      const ink = planPalette(TOKENS, c).ink;
      if (['W', 'R', 'P'].includes(c))
        expect([toHex(ink.rgb), ink.alpha]).toEqual(['#FFFFFF', TOKENS.alpha.planInkLight]);
      else expect([toHex(ink.rgb), ink.alpha]).toEqual(['#14233D', 1]);
    }
  });

  it('ART 10 colour-blind mode: plan fill 90 %, dark ink ×0.34, white ink opacity ×1.15', () => {
    const mode = { colorBlind: true };
    const y = parseHex(TOKENS.color.block.Y);
    expect(toHex(symbolInk(TOKENS, 'Y', mode).rgb)).toBe(toHex([y[0] * 0.34, y[1] * 0.34, y[2] * 0.34]));
    expect(symbolInk(TOKENS, 'W', mode).alpha).toBeCloseTo(0.85 * 1.15, 10);
    const under = parseHex(TOKENS.color.board.planUnderlay);
    const b = parseHex(TOKENS.color.block.B);
    const expected: Rgb = [0, 1, 2].map((i) => (under[i] ?? 0) * 0.1 + (b[i] ?? 0) * 0.9) as unknown as Rgb;
    expect(toHex(planPalette(TOKENS, 'B', mode).fill)).toBe(toHex(expected));
  });

  it('css() renders opaque colours as hex and translucent ones as rgba with 4 decimals', () => {
    expect(css([255, 255, 255])).toBe('#FFFFFF');
    expect(css([255, 255, 255], 0.28)).toBe('rgba(255,255,255,0.28)');
    expect(css([1.4, 2.6, 300], 1 / 3)).toBe('rgba(1,3,255,0.3333)');
  });
});

describe('tokens v2 schema (TECH 2R.7; ART 3A, 7.1, 14; UX 3, 5.8, 5.9, 6.1, 13.1)', () => {
  it('TECH 2R.7 the v2 groups design-lead added are typed in the runtime tokens', () => {
    expect(TOKENS.blockV2.lipPx).toBe(12);
    expect(TOKENS.blockV2.studEnabled).toBe(true);
    expect(TOKENS.blockV2.studGlossArc).toEqual([0.42, 205, 285]);
    expect(TOKENS.kit.buttonColor.green.base).toBe('#4CC23F');
    expect(TOKENS.kit.badge.shape).toBe('roundedSquare');
    expect(TOKENS.kit.ribbon.gold.stroke).toMatch(/^#/);
    expect(TOKENS.tutorial.visibleMs).toBe(4000);
    expect(TOKENS.layout.adaptive.yardHolePx).toBe(12);
    expect(TOKENS.layout.home.ch1CropStops.at(-1)).toBe(1);
    expect(TOKENS.layout.hud.goalChipMax).toBe(4);
    expect(TOKENS.layout.win.cardSize).toBe(600);
    expect(TOKENS.color.scene.gameTop).toBe('#3B2C85');
    expect(TOKENS.color.obstacle.cargoSteel).toBe('#7A7A7A');
    expect(TOKENS.alpha.sceneGridMajor).toBe(0.07);
    expect(TOKENS.stroke.yardPreviewPx).toBe(4);
    expect(TOKENS.duration.placeSheen).toBe(260);
    expect(TOKENS.particles.sparkle).toBe(6);
    expect(PENDING_TOKEN_KEYS).toEqual([]);
    expect(Object.isFrozen(TOKENS.kit.buttonColor.green)).toBe(true);
    expect('_doc' in TOKENS.blockV2 || '_docStud' in TOKENS.blockV2).toBe(false);
  });

  it('TECH 2R.7 every key of tokens.json (except _doc*, meta.units and the test-only check.* tables) reaches the runtime tokens; check.v3Addenda / check.svgTonesV3 reach V3_ADDENDA / SVG_TONES_V3', () => {
    const missing: string[] = [];
    const walk = (raw: unknown, typed: unknown, path: string): void => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
      for (const [k, v] of Object.entries(raw)) {
        if (k.startsWith('_doc') || path + k === 'meta.units') continue;
        if (path + k === 'check') {
          // the two schema-typed check.* subgroups (the PENDING path of ART_REFERENCE v1.1 / SVG v3); the other
          // check.* tables (blockTop, plan, v2 …) are read by this file only
          const c = v as Record<string, unknown>;
          for (const g of CHECK_TYPED_GROUPS) {
            const typed = g === 'v3Addenda' ? V3_ADDENDA : SVG_TONES_V3;
            if (c[g] === undefined) missing.push(`check.${g}`);
            else walk(c[g], typed, `check.${g}.`);
          }
          continue;
        }
        if (PENDING_TOKEN_KEYS.includes(path + k) || RETIRED_TOKEN_KEYS.includes(path + k)) continue;
        const t = (typed as Record<string, unknown> | undefined)?.[k];
        if (t === undefined) missing.push(path + k);
        else walk(v, t, `${path}${k}.`);
      }
    };
    walk(rawTokens, TOKENS, '');
    expect(missing).toEqual([]);
  });

  it('TECH 2R.7 retired keys (tokens meta._docRetire 1–2) are not typed and no source file reads them', () => {
    expect(RETIRED_TOKEN_KEYS).toEqual([
      'alpha.tutorialOverlay',
      'alpha.tutorialSoftOverlay',
      'duration.tutorialHandLoop',
      'duration.tutorialHandPause',
      'duration.spotlightPulse',
    ]);
    const typed = TOKENS as unknown as Record<string, Record<string, unknown>>;
    for (const key of RETIRED_TOKEN_KEYS) {
      const [group, leaf] = key.split('.') as [string, string];
      expect(typed[group]?.[leaf], key).toBeUndefined();
    }
    const files = (dir: string): string[] =>
      readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? files(`${dir}/${e.name}`) : e.name.endsWith('.ts') ? [`${dir}/${e.name}`] : [],
      );
    const readers = files('src').filter((f) => {
      const text = readFileSync(join(ROOT, f), 'utf8');
      return RETIRED_TOKEN_KEYS.some((k) => text.includes(k) && !f.endsWith('theme/tokens.ts'));
    });
    expect(readers).toEqual([]);
  });

  it('TECH 2R.7 a missing v2 key is a boot error that names the path', () => {
    const a = clone();
    delete (a.blockV2 as Record<string, unknown>).lipPx;
    expect(() => parseTokens(a)).toThrow(/blockV2\.lipPx/);
    const b = clone();
    delete ((b.kit as Record<string, Record<string, unknown>>).buttonColor?.green as Record<string, unknown>)
      .top;
    expect(() => parseTokens(b)).toThrow(/kit\.buttonColor\.green\.top/);
    const c = clone();
    delete ((c.layout as Record<string, unknown>).home as Record<string, unknown>).playButtonW;
    expect(() => parseTokens(c)).toThrow(/layout\.home\.playButtonW/);
  });

  it('TECH 2R.7 check.v3Addenda and check.svgTonesV3 are schema-validated at module load (PENDING path); TOKENS carries no check.*', () => {
    expect([...CHECK_TYPED_GROUPS]).toEqual(['v3Addenda', 'svgTonesV3']);
    expect('check' in TOKENS).toBe(false);
    const raw = rawTokens as unknown as { check: Record<string, unknown> };
    for (const g of CHECK_TYPED_GROUPS) expect(raw.check[g], g).toBeDefined();
    // addenda: a missing value is a boot error that names the path
    const a = structuredClone(raw.check.v3Addenda) as Record<string, Record<string, unknown>>;
    delete (a.rewardLayer as Record<string, unknown>).itemPx;
    expect(() => parseV3Addenda(a)).toThrow(/rewardLayer\.itemPx/);
    expect(Object.isFrozen(V3_ADDENDA.arrow)).toBe(true);
    // the boot pack (§9.1) lives under kit.v3.screen.loading since 2026-10-22: typed, frozen, a missing value named
    expect('bootPack' in a).toBe(false);
    const loading = TOKENS.kit.v3.screen.loading;
    expect(Object.isFrozen(loading.bootPack.ids)).toBe(true);
    expect(loading.bootPack.ids).toHaveLength(8);
    const b = structuredClone(rawTokens) as unknown as {
      kit: { v3: { screen: { loading: { bootPack: Record<string, unknown> } } } };
    };
    delete b.kit.v3.screen.loading.bootPack.maxKb;
    expect(() => parseTokens(b)).toThrow(/kit\.v3\.screen\.loading\.bootPack\.maxKb/);
    // tones: every group of the table (minus _doc) is typed as a frozen record of #RRGGBB
    const groups = Object.keys(raw.check.svgTonesV3 as object).filter((k) => !k.startsWith('_doc'));
    expect([...Object.keys(SVG_TONES_V3)].sort()).toEqual([...groups].sort());
    expect(groups.length).toBeGreaterThanOrEqual(10);
    let tones = 0;
    for (const group of Object.values(SVG_TONES_V3)) {
      expect(Object.isFrozen(group)).toBe(true);
      for (const hex of Object.values(group)) {
        expect(hex).toMatch(/^#[0-9A-F]{6}$/i);
        tones++;
      }
    }
    expect(tones).toBeGreaterThanOrEqual(200);
    // a malformed tone or a non-record group is a boot error that names the path
    const t = structuredClone(raw.check.svgTonesV3) as Record<string, Record<string, unknown>>;
    (t.tuna as Record<string, unknown>).skinHi = 'red';
    expect(() => parseSvgTonesV3(t)).toThrow(/tuna\.skinHi/);
    const u = structuredClone(raw.check.svgTonesV3) as Record<string, unknown>;
    u.block = 'not a group';
    expect(() => parseSvgTonesV3(u)).toThrow(/block/);
    expect(() => parseSvgTonesV3(undefined)).toThrow(/check\.svgTonesV3/);
  });

  it('TECH 2R.1 layout.adaptive.cellMaxPx is optional: absent → the cell stays 120, present → typed', () => {
    const t = clone();
    ((t.layout as Record<string, unknown>).adaptive as Record<string, unknown>).cellMaxPx = 144;
    expect(parseTokens(t).layout.adaptive.cellMaxPx).toBe(144);
    const u = clone();
    delete ((u.layout as Record<string, unknown>).adaptive as Record<string, unknown>).cellMaxPx;
    expect(parseTokens(u).layout.adaptive.cellMaxPx).toBeUndefined();
  });
});
