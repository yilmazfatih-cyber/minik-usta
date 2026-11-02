/**
 * Shared assertions of the solver tests on the SHIPPED D-099 levels (shipped.test.ts, shipped.heavy.test.ts; P4B-01/02/03): one
 * `describe` per level with the K-50 metrics, the K-51 gates of a fixed-yard level, the K-52 D-099 move budget, the golden
 * (`tests/golden/level_NNN.solver.json`) and the skill-bot proxy.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { LevelSchema } from '../../../src/core/level/schema.ts';
import { solveLevelData } from '../../../tools/solver/solveLevel.ts';
import type { SolveReport } from '../../../tools/solver/solveLevel.ts';
import { specGaps } from '../../../tools/solver/spec.ts';
import { SHIPPED } from './shipped.expected.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (rel: string): unknown => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const pad = (n: number): string => String(n).padStart(3, '0');

export function describeShipped(n: number, timeoutMs: number): void {
  const exp = SHIPPED[n];
  if (!exp) throw new Error(`no expectation for shipped level ${n}`);
  describe(`shipped level ${n} (levels/level_${pad(n)}.json, schemaVersion 2)`, () => {
    let r: SolveReport;
    beforeAll(() => {
      r = solveLevelData(LevelSchema.parse(read(`levels/level_${pad(n)}.json`)), { fileId: n });
    }, timeoutMs);

    it(`K-50 K-55 level ${n}: solved on a complete scan with the LEVEL_REPORT metrics (min, shifts, YAO, choices, D-099 columns)`, () => {
      const m = r.metrics;
      const d = m?.d099;
      expect(r.status).toBe('solved');
      expect(r.schemaVersion).toBe(2);
      expect(d?.complete).toBe(true);
      expect({
        min: m?.min,
        minShifts: m?.minShifts,
        shiftsBySegment: m?.shiftsBySegment,
        firstNeedDepth: m?.firstNeedDepth,
        yao: [m?.yao.overWall, m?.yao.rail],
        choices: m?.choices,
        maxCover: d?.maxCover,
        depLater: d?.depLater,
        crossDeps: d?.crossDeps,
        parkSlack: d?.parkSlack,
        forced: d?.forced,
        greedyExcess: d?.greedyExcess,
        greedyWin: Math.round((d?.greedyWin ?? -1) * 100) / 100,
        ahaMin: d?.ahaMin,
        branch3: d?.branch3,
      }).toEqual({
        min: exp.min,
        minShifts: exp.minShifts,
        shiftsBySegment: exp.shiftsBySegment,
        firstNeedDepth: exp.firstNeedDepth,
        yao: exp.yao,
        choices: exp.choices,
        maxCover: exp.maxCover,
        depLater: exp.depLater,
        crossDeps: exp.crossDeps,
        parkSlack: exp.parkSlack,
        forced: exp.forced,
        greedyExcess: exp.greedyExcess,
        greedyWin: exp.greedyWin,
        ahaMin: exp.ahaMin,
        branch3: exp.branch3,
      });
    });

    it(`K-51 level ${n}: no error, no undetected dead state (item 7), no reachable D1 (item 8), no Kolay/Normal greedy trap (item 6); the warnings are exactly the documented ones`, () => {
      expect(r.issues.filter((i) => i.severity === 'error')).toEqual([]);
      expect(r.metrics?.d099.undetectedDead).toBe(0);
      expect(r.metrics?.d099.d1States).toBe(0);
      expect(r.metrics?.d099.greedyTrap).toBeNull();
      expect(r.issues.filter((i) => i.severity === 'warn').map((i) => i.code)).toEqual(exp.warnings);
    });

    it(`K-52 level ${n}: moves ${exp.moves} lie in the D-099 band [min + P, min + P + aMax] = [${exp.band[0]}, ${exp.band[1]}]`, () => {
      expect(r.moves).toBe(exp.moves);
      expect([r.band?.lo, r.band?.hi]).toEqual([...exp.band]);
      expect(exp.moves).toBeGreaterThanOrEqual(exp.band[0]);
      expect(exp.moves).toBeLessThanOrEqual(exp.band[1]);
    });

    it(`K-43 K-50 level ${n}: the canonical solution replays on the core and its eventLogHash is the golden's`, () => {
      expect(r.replay?.ok).toBe(true);
      expect(r.replay?.eventLogHash).toBe(exp.eventLogHash);
      const golden = read(`tests/golden/level_${pad(n)}.solver.json`) as {
        eventLogHash: string;
        min: number;
      };
      expect(golden.eventLogHash).toBe(exp.eventLogHash);
      expect(golden.min).toBe(exp.min);
    });

    it(`K-50 level ${n}: the skill-bot proxy (ε 0.12) wins ${Math.round(exp.skillMid * 100)} % and is ordered novice ≤ mid ≤ expert (P4B-03)`, () => {
      const s = r.metrics?.d099.skillWin;
      expect(Math.round((s?.mid ?? -1) * 100) / 100).toBe(exp.skillMid);
      expect(s?.novice ?? 2).toBeLessThanOrEqual(s?.mid ?? -1);
      expect(s?.mid ?? 2).toBeLessThanOrEqual(s?.expert ?? -1);
    });

    it(`K-50 level ${n}: the spec-gap list is what LEVEL_REPORT shows (P4B-02; no new gap appears unnoticed)`, () => {
      const gaps = specGaps(LevelSchema.parse(read(`levels/level_${pad(n)}.json`)), r.metrics!);
      expect(r.specGaps?.map((g) => g.metric)).toEqual(gaps.map((g) => g.metric));
      // the greedy-play gap is the one the owner cares about: it is reported exactly when greedy play finishes a Normal level
      const greedy = gaps.find((g) => g.metric === 'greedyWin');
      if (exp.difficulty === 'normal' && exp.greedyWin === 1) expect(greedy?.actualOut).toBe(true);
    });
  });
}
