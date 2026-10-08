/**
 * Shared assertions of the level solver tests (levels.test.ts, level10.test.ts): one `describe` per real level
 * (levels/level_NNN.json, WP-M) with the LEVELS §2 metrics, the canonical solution, the replay, the K-30 cut-1 gate,
 * the K-51 item 2 whole-space gate, the K-51 item 5 delivery fairness and the variants.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { LevelSchema } from '../../../src/core/level/schema.ts';
import { solveLevelData } from '../../../tools/solver/solveLevel.ts';
import type { SolveReport } from '../../../tools/solver/solveLevel.ts';
import { refLabel } from '../../../tools/solver/report.ts';
import { loadAllowList } from '../../../tools/lib/levelsAllow.ts';
import { LEVELS_2 } from './levels.expected.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** The raw JSON of levels/level_NNN.json. */
export function levelJsonFile(n: number): unknown {
  return JSON.parse(readFileSync(join(ROOT, 'levels', `level_${String(n).padStart(3, '0')}.json`), 'utf8'));
}

/** `extra` registers more tests in the same describe; `report()` is the solved level. */
export function describeLevel(
  n: number,
  timeoutMs: number,
  extra?: (report: () => SolveReport) => void,
): void {
  const exp = LEVELS_2[n];
  if (!exp) throw new Error(`no LEVELS 2 expectation for level ${n}`);
  describe(`level ${n} (levels/level_${String(n).padStart(3, '0')}.json)`, () => {
    let r: SolveReport;
    beforeAll(() => {
      r = solveLevelData(LevelSchema.parse(levelJsonFile(n)), { fileId: n });
    }, timeoutMs);

    it(`K-50 LEVELS 2 summary metrics of level ${n}`, () => {
      const m = r.metrics;
      expect(r.status).toBe('solved');
      expect({
        N: m?.N,
        min: m?.min,
        minShifts: m?.minShifts,
        shiftsBySegment: m?.shiftsBySegment,
        firstNeedDepth: m?.firstNeedDepth,
        F0: m?.F0,
        yao: [m?.yao.overWall, m?.yao.rail],
        choices: m?.choices,
        best: m?.bestChoices,
        nominal: r.band?.nominal,
      }).toEqual({
        N: exp.N,
        min: exp.min,
        minShifts: exp.minShifts,
        shiftsBySegment: exp.shiftsBySegment,
        firstNeedDepth: exp.firstNeedDepth,
        F0: exp.F0,
        yao: exp.yao,
        choices: exp.choices,
        best: exp.best,
        nominal: exp.moves,
      });
      if (exp.firstNeedCover !== undefined) expect(m?.firstNeedCover).toBe(exp.firstNeedCover);
      expect(m?.minIsNPlusShifts, 'K-50 item 2: min = N + minShifts').toBe(true);
    });

    it(`K-46 canonical solution of level ${n} follows K-50 item 4 (max YAO, then the move order)`, () => {
      expect(r.steps.map((st) => `${refLabel(st.ref)} ${st.from.join(',')}→${st.to.join(',')}`)).toEqual(
        exp.solution,
      );
    });

    it(`K-30 levels 1–10 need no dead table: level ${n} has trapCount 0 and deadRate 0 on a complete scan`, () => {
      expect(r.stats?.complete).toBe(true);
      expect(r.metrics?.trapCount).toBe(0);
      expect(r.metrics?.deadRate).toBe(0);
      expect(r.issues.map((i) => i.code)).not.toContain('dead_table_missing');
    });

    it(`K-51 item 2 whole space of level ${n}: no dead state at all (no D3b table needed, LEVELS §2.0 item 10)`, () => {
      expect(r.metrics?.deadStates).toBe(0);
      expect(r.metrics?.deadEntries).toEqual({ edges: 0, shiftEdges: 0, states: 0, caught: 0 });
    });

    it(`K-51 item 5 delivery fairness of level ${n}: g = 0 and f = 0 for every truck batch (LEVELS §2.0 item 9)`, () => {
      const trucks = [...new Set(r.metrics?.delivery.map((d) => d.forSegment))];
      expect(trucks).toEqual(exp.shiftsBySegment.length > 1 ? [1] : []);
      for (const d of r.metrics?.delivery ?? [])
        expect([d.g, d.f], `segment ${d.forSegment}`).toEqual([0, 0]);
      expect(r.issues.map((i) => i.code)).not.toContain('delivery_foresight');
    });

    it(`K-50 canonical solution of level ${n} replays on the core (GameSession, step 12 on) and wins`, () => {
      expect(r.replay?.ok, r.replay?.message ?? '').toBe(true);
      expect(r.replay?.eventLogHash).toMatch(/^[0-9a-f]{16}$/);
    });

    it(`K-45/9 level ${n} has no solve-stage error; warnings are in tools/levels-allow.json`, () => {
      const allow = loadAllowList();
      expect(r.issues.filter((i) => i.severity === 'error')).toEqual([]);
      for (const w of r.issues.filter((i) => i.severity === 'warn'))
        expect(allow.get(n)?.has(w.code), `${w.code}: ${w.message}`).toBe(true);
    });

    extra?.(() => r);

    if (exp.variant) {
      const v = exp.variant;
      it(`K-50 level ${n} variant ${v.name} min ${v.min} and its LEVELS band`, () => {
        const got = r.variants.find((x) => x.name === v.name);
        expect(got?.min).toBe(v.min);
        expect(got?.bandOk).toBe(true);
      });
    }
  });
}
