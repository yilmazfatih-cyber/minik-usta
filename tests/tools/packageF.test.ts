/**
 * Paket F (CL-V3C-01/02/03/05/07): wide-site requirement, pallet_stuck (retired by D-106; tests/core/palletD106.test.ts),
 * plan_trap on a 2-column site, the Y12 exemption of L-16 / L-22 and the lookahead play proxy with the bonus applied
 * like the game.
 */
import { describe, expect, it } from 'vitest';
import { compile } from '../../src/core/level/compile.ts';
import { siteColsRange, validateLevelJson } from '../../src/core/level/logic.ts';
import type { LevelInput } from '../../src/core/level/schema.ts';
import { deriveMechanics, mechanicFirstLevel } from '../../src/core/level/mechanics.ts';
import { readFileSync } from 'node:fs';
import { levelJson } from '../fixtures/builders.ts';
import type { LevelSpec } from '../fixtures/builders.ts';
import { policyWinRate } from '../../tools/solver/walks.ts';

function json(spec: LevelSpec): LevelInput {
  const base = levelJson({ ...spec, schemaVersion: 3 });
  return {
    ...base,
    yard: { ...base.yard, ...(spec.yard ?? {}) },
    ...(spec.site ? { site: { cols: spec.site.cols ?? 2, rows: spec.site.rows ?? 4 } } : {}),
  } as LevelInput;
}
const codes = (spec: LevelSpec): string[] => validateLevelJson(json(spec)).issues.map((i) => i.code);

describe('K-49 item 2 levels 6-10 require Ws = 3', () => {
  it('K-49 item 2 levels 6-10 require Ws = 3, levels 1-5 Ws = 2, later levels either', () => {
    expect([1, 5].map((id) => siteColsRange(id))).toEqual([
      [2, 2],
      [2, 2],
    ]);
    expect([6, 10].map((id) => siteColsRange(id))).toEqual([
      [3, 3],
      [3, 3],
    ]);
    expect(siteColsRange(11)).toEqual([2, 3]);
  });
  it('K-49 item 2 a 2-column site in level 6 is size_out_of_range', () => {
    const spec: LevelSpec = {
      id: 6,
      yard: { cols: 4, rows: 4 },
      site: { cols: 2, rows: 4 },
      plan: ['GG', 'GG', 'WW', 'WW'],
      pieces: [
        ['D2_90', 'W', 0, 0],
        ['D2_90', 'W', 0, 2],
        ['D2_90', 'G', 2, 0],
        ['D2_90', 'G', 2, 2],
      ],
    };
    expect(codes(spec)).toContain('size_out_of_range');
    expect(codes({ ...spec, id: 5 })).not.toContain('size_out_of_range');
  });
});

describe('K-58 item 10 pallet_stuck (retired by D-106)', () => {
  it('K-58 item 10 a C3 pallet (once pallet_stuck) and a D2 pallet both validate without pallet_stuck', () => {
    const pallet = (shape: 'C3_0' | 'D2_90'): LevelSpec => ({
      id: 8,
      yard: { cols: 6, rows: 4 },
      site: { cols: 3, rows: 4 },
      plan: ['GGG', 'GGG', 'WWW', 'WWW'],
      pieces: [
        [shape, 'W', 0, 0],
        [shape, 'W', 0, 0],
        ['D2_90', 'G', 3, 0],
        ['D2_90', 'G', 3, 2],
      ],
      traits: { 0: { stack: { id: 0, z: 0 } }, 1: { stack: { id: 0, z: 1 } } },
    });
    expect(codes(pallet('C3_0'))).not.toContain('pallet_stuck');
    expect(codes(pallet('D2_90'))).not.toContain('pallet_stuck');
  });
});

describe('K-60 item 6 the bonus is not a new mechanic', () => {
  it('K-60 item 6 Y12 unlocks at level 7 and L-22 does not count it', () => {
    expect(mechanicFirstLevel('Y12')).toBe(7);
    const spec: LevelSpec = {
      id: 8,
      yard: { cols: 4, rows: 4 },
      site: { cols: 2, rows: 4 },
      plan: ['WW', 'WW'],
      pieces: [
        ['D2_90', 'W', 0, 0, ['bonus']],
        ['D2_90', 'W', 2, 0],
      ],
    };
    const lvl = validateLevelJson(json(spec), { only: [] }).level!;
    expect(deriveMechanics(lvl)).toContain('Y12');
    const res = validateLevelJson(json(spec), { previousMechanics: new Set(['S1']) });
    expect(res.issues.map((i) => i.code)).not.toContain('too_many_new_mechanics');
  });
});

describe('K-62 play proxy credits the bonus', () => {
  const spec: LevelSpec = {
    id: 9,
    yard: { cols: 4, rows: 4 },
    site: { cols: 2, rows: 4 },
    moves: 1,
    plan: ['WW', 'WW'],
    pieces: [
      ['D2_90', 'W', 0, 0, ['bonus']],
      ['D2_90', 'W', 2, 0],
    ],
  };
  const lvl = (): ReturnType<typeof compile> => compile(validateLevelJson(json(spec), { only: [] }).level!);
  it('K-62 play proxy credits the bonus: budget 1 is won when the bonus block goes first (net cost -1)', () => {
    const r = policyWinRate(lvl(), 1, { plays: 60, seed: 3 });
    expect(r).toBeGreaterThan(0.2);
    expect(r).toBeLessThan(0.8);
  });
  it('K-62 the lookahead proxy is deterministic and wins a single-choice level at eps 0', () => {
    const a = policyWinRate(lvl(), 3, { plays: 20, seed: 1, lookahead: true });
    expect(a).toBe(1);
    expect(policyWinRate(lvl(), 1, { plays: 20, seed: 4, lookahead: true, eps: 0.1 })).toBe(
      policyWinRate(lvl(), 1, { plays: 20, seed: 4, lookahead: true, eps: 0.1 }),
    );
  });
});

describe('K-63 plan_trap scan on a 2-column site', () => {
  const sev = (file: string, patch: Record<string, unknown>): string[] => {
    const raw = JSON.parse(
      readFileSync(new URL(`../../levels/${file}`, import.meta.url), 'utf8'),
    ) as LevelInput;
    return validateLevelJson({ ...raw, ...patch } as LevelInput)
      .issues.filter((i) => i.code === 'plan_trap')
      .map((i) => i.severity);
  };
  it('K-63 plan_trap (Ws = 2): Easy is an error, Normal a warning; the known open level 4 is a warning until repainted', () => {
    expect(sev('level_004.json', { id: 14 })).toEqual(['error']);
    expect(sev('level_004.json', {})).toEqual(['warn']);
    expect(sev('level_005.json', {})).toEqual(['warn']);
    expect(sev('level_003.json', {})).toEqual([]);
  });
});
