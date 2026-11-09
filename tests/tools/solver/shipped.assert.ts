/**
 * Shared assertions of the solver tests on the SHIPPED levels (shipped.test.ts, shipped.heavy.test.ts; P4B-01/02/03,
 * CL-V3-01): one `describe` per level. A level with a complete scan carries the K-50 metrics and the K-51 whole-space gates;
 * a large level (N ≥ 9, `LARGE_MIN_BLOCKS`) carries the large-level search result, the random-walk dead-state gate (≤ 1 %),
 * the placement-first play proxy and the K-52 band computed from the best found solution. Both: no error, the documented
 * warnings, the golden (`tests/golden/level_NNN.solver.json`) and the move budget.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { LevelSchema } from '../../../src/core/level/schema.ts';
import { solveLevelData } from '../../../tools/solver/solveLevel.ts';
import type { SolveReport } from '../../../tools/solver/solveLevel.ts';
import { UNDETECTED_MAX } from '../../../tools/solver/walks.ts';
import { SHIPPED } from './shipped.expected.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (rel: string): unknown => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const pad = (n: number): string => String(n).padStart(3, '0');
/** Walks of the test gate (the CLI default is 10 000; the expectations are written with the same number). */
export const TEST_WALKS = 600;
/** Walk ends the beam probes in the tests (the CLI default is 200). */
export const TEST_SAMPLE = 40;

export function describeShipped(n: number, timeoutMs: number): void {
  const exp = SHIPPED[n];
  if (!exp) throw new Error(`no expectation for shipped level ${n}`);
  describe(`shipped level ${n} (levels/level_${pad(n)}.json, ${exp.scan} scan, ${exp.blocks} blocks)`, () => {
    let r: SolveReport;
    beforeAll(() => {
      r = solveLevelData(
        LevelSchema.parse(read(`levels/level_${pad(n)}.json`)),
        { fileId: n },
        { walks: TEST_WALKS, walkSample: TEST_SAMPLE },
      );
    }, timeoutMs);

    it(`K-50 K-55 level ${n}: solved (${exp.scan === 'full' ? 'complete scan, proven min' : 'best found by the large-level search'}) with min ${exp.best} and YAO ${exp.yao.join('/')}`, () => {
      expect(r.status).toBe('solved');
      const m = r.metrics;
      if (exp.scan === 'full') {
        expect(m?.min).toBe(exp.best);
        expect([m?.yao.overWall, m?.yao.rail]).toEqual([...exp.yao]);
        expect(m?.d099.complete).toBe(true);
        const f = exp.full;
        const d = m?.d099;
        expect({
          minShifts: m?.minShifts,
          shiftsBySegment: m?.shiftsBySegment,
          firstNeedDepth: m?.firstNeedDepth,
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
          skillMid: Math.round((d?.skillWin?.mid ?? -1) * 100) / 100,
        }).toEqual(f);
      } else {
        expect(m).toBeNull();
        expect(r.large?.status).toBe('solved');
        expect(r.large?.replayOk).toBe(true);
        expect(r.large?.best).toBe(exp.best);
        expect(r.large?.lowerBound).toBe(exp.lowerBound);
        expect([r.large?.yao.overWall, r.large?.yao.rail]).toEqual([...exp.yao]);
        expect(exp.best).toBeGreaterThanOrEqual(exp.lowerBound);
        // K-51 item 1 (id >= 3): a dig comes first, so the lower bound is N + 1 and a shift is in the solution
        if (n >= 3) {
          expect(exp.lowerBound).toBeGreaterThan(exp.blocks);
          expect(exp.best).toBeGreaterThan(exp.blocks);
        }
      }
    });

    it(`K-51 level ${n}: no error; ${exp.scan === 'full' ? 'no undetected dead state (item 7), no reachable D1 (item 8), no greedy trap on Kolay / Normal (item 6)' : 'the random-walk dead-state gate holds (CL-V3-01 option B: at most 1 % undetected dead ends)'}; the warnings are exactly the documented ones`, () => {
      expect(r.issues.filter((i) => i.severity === 'error')).toEqual([]);
      if (exp.scan === 'full') {
        expect(r.metrics?.d099.undetectedDead).toBe(0);
        expect(r.metrics?.d099.d1States).toBe(0);
        expect(r.metrics?.d099.greedyTrap).toBeNull();
      } else {
        const w = r.large?.walks;
        expect(w?.walks).toBe(TEST_WALKS);
        expect(w?.rate ?? 1).toBeLessThanOrEqual(UNDETECTED_MAX);
        expect(w?.ok).toBe(true);
        // the probe sample is a uniform sample of the unresolved ends (at most TEST_SAMPLE)
        expect(w?.probed).toBe(Math.min(w?.unresolved ?? 0, TEST_SAMPLE));
      }
      expect(r.issues.filter((i) => i.severity === 'warn').map((i) => i.code)).toEqual(exp.warnings);
    });

    it(`K-52 level ${n}: moves ${exp.moves} lie in the D-099 band [${exp.band[0]}, ${exp.band[1]}] of the ${exp.scan === 'full' ? 'proven min' : 'best found solution'} (moves never below it)`, () => {
      expect(r.moves).toBe(exp.moves);
      expect([r.band?.lo, r.band?.hi]).toEqual([...exp.band]);
      expect(exp.moves).toBeGreaterThanOrEqual(Math.max(exp.band[0], exp.best));
      expect(exp.moves).toBeLessThanOrEqual(exp.band[1]);
    });

    it(`K-43 K-50 level ${n}: the solution replays on the core and its eventLogHash is the golden's`, () => {
      expect(r.replay?.ok).toBe(true);
      expect(r.replay?.eventLogHash).toBe(exp.eventLogHash);
      const golden = read(`tests/golden/level_${pad(n)}.solver.json`) as {
        eventLogHash: string;
        min: number;
      };
      expect(golden.eventLogHash).toBe(exp.eventLogHash);
      expect(golden.min).toBe(exp.best);
    });

    if (exp.scan === 'large')
      it(`K-50 level ${n}: the placement-first player wins ${exp.policyLoose} within moves + N / 2 and ${exp.policyTight} within moves (CL-V3-03 proxy, not ahaMin)`, () => {
        expect(r.large?.policy?.loose).toBe(exp.policyLoose);
        expect(r.large?.policy?.tight).toBe(exp.policyTight);
      });
  });
}
