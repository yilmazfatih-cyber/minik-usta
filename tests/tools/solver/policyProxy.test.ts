/**
 * CL-V3C-13: the play proxies of the large-level gate (tools/solver/walks.ts) — `policyGames` plays (default 400), several
 * budgets measured on the same plays (a larger budget never wins less: the Bolum 6 pair 0.25 / 0.24 came from two
 * separately seeded streams), and a Wilson 95 % interval next to every rate (reported only; the K-51 item 3 band gate
 * reads the point estimate).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compile, loadLevel } from '../../../src/core/level/compile.ts';
import { validateLevelJson } from '../../../src/core/level/logic.ts';
import type { LevelInput } from '../../../src/core/level/schema.ts';
import {
  POLICY_GAMES_DEFAULT,
  policyWinRate,
  policyWinRates,
  wilsonInterval,
} from '../../../tools/solver/walks.ts';
import { levelJson } from '../../fixtures/builders.ts';
import type { LevelSpec } from '../../fixtures/builders.ts';

function lvlOf(spec: LevelSpec): ReturnType<typeof compile> {
  const base = levelJson({ ...spec, schemaVersion: 3 });
  const json = {
    ...base,
    yard: { ...base.yard, ...(spec.yard ?? {}) },
    ...(spec.site ? { site: { cols: spec.site.cols ?? 2, rows: spec.site.rows ?? 4 } } : {}),
  } as LevelInput;
  return compile(validateLevelJson(json, { only: [] }).level!);
}

/** Two W dominoes, one of them a +2 bonus (the K-62 proxy board of tests/tools/packageF.test.ts). */
const BONUS: LevelSpec = {
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

describe('K-51 item 3 CL-V3C-13 play proxy sample size and interval', () => {
  it('K-51 item 3 CL-V3C-13 the Wilson 95 % interval: known values, inside [0, 1], never empty at 0 or n wins', () => {
    const near = (a: readonly number[], b: readonly number[]): void => {
      expect(a[0]).toBeCloseTo(b[0] ?? NaN, 4);
      expect(a[1]).toBeCloseTo(b[1] ?? NaN, 4);
    };
    near(wilsonInterval(0, 10), [0, 0.2775]);
    near(wilsonInterval(10, 10), [0.7225, 1]);
    near(wilsonInterval(80, 100), [0.7112, 0.8666]);
    expect(wilsonInterval(0, 0)).toEqual([0, 0]);
    // 400 plays at p = 0.5: half-width about 4.9 points (200 plays: about 6.9)
    const [lo, hi] = wilsonInterval(200, 400);
    expect(hi - lo).toBeLessThan(0.1);
    expect(POLICY_GAMES_DEFAULT).toBeGreaterThanOrEqual(400);
  });

  it('K-51 item 3 CL-V3C-13 budgets on the same plays: a larger budget never wins less; one budget equals policyWinRate', () => {
    const lvl = lvlOf(BONUS);
    const r = policyWinRates(lvl, [1, 2, 3], { plays: 80, seed: 5 });
    expect(r.map((x) => x.games)).toEqual([80, 80, 80]);
    expect(r[0]!.wins).toBeLessThanOrEqual(r[1]!.wins);
    expect(r[1]!.wins).toBeLessThanOrEqual(r[2]!.wins);
    for (const x of r) {
      expect(x.ci[0]).toBeLessThanOrEqual(x.rate);
      expect(x.rate).toBeLessThanOrEqual(x.ci[1]);
    }
    expect(policyWinRate(lvl, 1, { plays: 80, seed: 5 })).toBe(
      policyWinRates(lvl, [1], { plays: 80, seed: 5 })[0]!.rate,
    );
    // deterministic (seeded)
    expect(policyWinRates(lvl, [1, 3], { plays: 80, seed: 5 })).toEqual(
      policyWinRates(lvl, [1, 3], { plays: 80, seed: 5 }),
    );
  });

  it('K-51 item 3 CL-V3C-13 Bolum 6: within moves never above within moves + N/2 (the 0.25 / 0.24 inversion was two streams)', () => {
    const json: unknown = JSON.parse(
      readFileSync(new URL('../../../levels/level_006.json', import.meta.url), 'utf8'),
    );
    const res = loadLevel(json);
    if (!res.ok) throw new Error('level 6 does not load');
    const moves = (json as { moves: number }).moves;
    const loose = moves + Math.round(res.level.materialCount / 2);
    const [tight, wide] = policyWinRates(res.level, [moves, loose], { plays: 120, seed: 6 });
    expect(tight!.wins).toBeLessThanOrEqual(wide!.wins);
  });

  it('K-51 item 3 CL-V3C2-03 two dig steps: Bolum 4 (two lids on a dig) is seen through by lookDepth 2 (default) and not by lookDepth 1', () => {
    const json: unknown = JSON.parse(
      readFileSync(new URL('../../../levels/level_004.json', import.meta.url), 'utf8'),
    );
    const res = loadLevel(json);
    if (!res.ok) throw new Error('level 4 does not load');
    const moves = (json as { moves: number }).moves;
    const opts = { plays: 120, seed: 4, lookahead: true, eps: 0.1 } as const;
    const one = policyWinRates(res.level, [moves], { ...opts, lookDepth: 1 })[0]!;
    const two = policyWinRates(res.level, [moves], { ...opts, lookDepth: 2 })[0]!;
    // measured at the gate seed and 400 plays: 0.44 (one step) against 0.89 (two steps)
    expect(two.rate).toBeGreaterThanOrEqual(one.rate + 0.2);
    expect(two.rate).toBeGreaterThan(0.7);
    // two steps is the default of a lookahead player, and it is deterministic (seeded)
    expect(policyWinRates(res.level, [moves], opts)[0]).toEqual(two);
    expect(policyWinRates(res.level, [moves], { ...opts, lookDepth: 2 })[0]).toEqual(two);
  });

  it('K-51 item 3 CL-V3C2-03 where the first dig step already opens a placement the second step changes nothing: Bolum 1 equals at both depths', () => {
    const json: unknown = JSON.parse(
      readFileSync(new URL('../../../levels/level_001.json', import.meta.url), 'utf8'),
    );
    const res = loadLevel(json);
    if (!res.ok) throw new Error('level 1 does not load');
    const moves = (json as { moves: number }).moves;
    const o = { plays: 60, seed: 1, lookahead: true, eps: 0.1 } as const;
    expect(policyWinRates(res.level, [moves], { ...o, lookDepth: 2 })[0]!.rate).toBeGreaterThanOrEqual(0.95);
    expect(policyWinRates(res.level, [moves], { ...o, lookDepth: 1 })[0]!.rate).toBeGreaterThanOrEqual(0.95);
  });
});
