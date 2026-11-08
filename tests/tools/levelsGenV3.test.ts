/**
 * `npm run levels:gen` levels v3 plan fields (docs/TECH_DESIGN.md §V3.4; LEVELS §8.10 U-v3-4; GDD §16 ÖNERİ K-56…K-65):
 * orientation pool, two-tone tilings, single-type pallets, trait density, the N band, `schemaVersion` 3 output and
 * determinism. A plan without v3 fields generates exactly as before (tests/tools/levelsGen.test.ts).
 */
import { describe, expect, it } from 'vitest';
import { generate, isV3Plan, planShapes, startLevel, tilings } from '../../tools/gen/generate.ts';
import type { GenPlan } from '../../tools/gen/generate.ts';
import { validateLevelJson } from '../../src/core/level/logic.ts';

const PLAN: GenPlan = {
  id: 7,
  name: { tr: 'Deneme', en: 'Trial' },
  difficulty: 'normal',
  yard: { cols: 4, rows: 4 },
  site: { cols: 2, rows: 4 },
  wall: { height: 4, gaps: [] },
  // two floors, 8 D2_90 blocks: footprint 16 − 2 (one two-layer pallet) = 14 → E 2 (K-02)
  segments: [
    { name: { tr: 'Kat 1', en: 'Floor 1' }, rows: ['WY', 'YW', 'WW', 'WW'] },
    { name: { tr: 'Kat 2', en: 'Floor 2' }, rows: ['YY', 'WW', 'WY', 'YY'] },
  ],
  shapes: ['D2'],
  orientations: ['D2_90'],
  twoTone: { pairs: ['WY'], max: 2 },
  pallets: { count: 1, layers: 2 },
  blocks: [8, 8],
};

describe('U-v3-4 levels:gen v3 plan fields', () => {
  it('K-56 U-v3-4 orientations: only the listed orientations tile (no D2_0 when the pool is D2_90)', () => {
    expect(planShapes(PLAN).map((s) => s.id)).toEqual(['D2_90']);
    expect(isV3Plan(PLAN)).toBe(true);
    expect(
      isV3Plan({
        ...PLAN,
        orientations: undefined,
        twoTone: undefined,
        pallets: undefined,
        blocks: undefined,
      }),
    ).toBe(false);
  });

  it('K-57 U-v3-4 twoTone: a mixed row is one two-tone block of an allowed pair; without the field the plan has no tiling', () => {
    const rows = PLAN.segments[0]?.rows ?? [];
    const two = tilings(rows, planShapes(PLAN), PLAN.twoTone);
    expect(two.length).toBeGreaterThan(0);
    const t = two[0] ?? [];
    expect(t.filter((p) => p.colors !== undefined).map((p) => p.colors)).toEqual(['YW', 'WY']);
    expect(tilings(rows, planShapes(PLAN))).toEqual([]);
    expect(tilings(rows, planShapes(PLAN), { pairs: ['GY'], max: 2 })).toEqual([]);
    expect(tilings(rows, planShapes(PLAN), { pairs: ['WY'], max: 1 })).toEqual([]);
  });

  it('K-58 K-65 U-v3-4 pallets: identical blocks stack into a single-type pallet; the level is schemaVersion 3 and valid', () => {
    const json = startLevel(PLAN, 5);
    expect(json?.schemaVersion).toBe(3);
    const pieces = json?.yard.batches[0]?.pieces ?? [];
    expect(pieces).toHaveLength(8);
    const layers = pieces.filter((p) => p.stack !== undefined);
    expect(layers.map((p) => p.stack?.z)).toEqual([0, 1]);
    expect(new Set(layers.map((p) => `${p.shape}${p.color}${p.colors ?? ''}@${p.x},${p.y}`)).size).toBe(1);
    const v = validateLevelJson(json);
    expect(v.issues.filter((i) => i.severity === 'error').map((i) => i.code)).toEqual([]);
    expect(startLevel(PLAN, 5)).toEqual(json); // deterministic
  });

  it('K-59 K-60 U-v3-4 traits: wrapped blocks bring one scissors block; bonus and slippery flag single blocks only', () => {
    const plan: GenPlan = {
      ...PLAN,
      id: 13,
      yard: { cols: 4, rows: 5 },
      segments: [{ name: { tr: 'Kat', en: 'Floor' }, rows: ['WW', 'YY', 'WY', 'YW', 'WW'] }],
      site: { cols: 2, rows: 5 },
      pallets: undefined,
      traits: { wrapped: 1, bonus: 1, slippery: 1 },
      blocks: [5, 5],
    };
    const json = startLevel(plan, 3);
    const flags = (json?.yard.batches[0]?.pieces ?? []).flatMap((p) => p.flags ?? []);
    expect([...flags].sort()).toEqual(['bonus', 'scissors', 'slippery', 'wrapped']);
    expect((json?.yard.batches[0]?.pieces ?? []).every((p) => (p.flags?.length ?? 0) <= 1)).toBe(true);
  });

  it('U-v3-4 generate: deterministic for the same seed; candidates carry the v3 measures (K-64)', () => {
    const targets = { min: [8, 12] as [number, number] };
    const opts = { seed: 3, iterations: 2, starts: 1, count: 1, maxFull: 1 };
    const a = generate(PLAN, targets, opts);
    const b = generate(PLAN, targets, opts);
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    const best = a.candidates[0];
    expect(best?.level.schemaVersion).toBe(3);
    expect(best?.v3?.placements).toBe(8);
    expect(best?.v3?.liftRatio).toBe(1);
  }, 120_000);
});
