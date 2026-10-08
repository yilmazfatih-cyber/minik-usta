/**
 * The solver against an independent brute force on micro levels (TECH §2R.5 "K-50 metrics match brute force on micro
 * levels"; GDD K-46, K-50). Both use the real core rules; everything else is written twice (see micro.ts).
 */
import { describe, expect, it } from 'vitest';
import { compiledLevel, level } from '../../fixtures/builders.ts';
import { solveLevelData } from '../../../tools/solver/solveLevel.ts';
import { explore } from '../../../tools/solver/explore.ts';
import { astarMin } from '../../../tools/solver/astar.ts';
import { MICRO, bruteExplore, bruteMetrics, treeMin } from './micro.ts';

describe('K-50 solver metrics on micro levels (3×4 yard, ≤ 4 blocks)', () => {
  for (const [name, spec] of Object.entries(MICRO)) {
    it(`K-50 metrics match brute force on micro levels: ${name}`, () => {
      const data = level(spec);
      const report = solveLevelData(data, {}, { variants: false });
      const brute = bruteMetrics(bruteExplore(compiledLevel(spec)), data.moves);
      const m = report.metrics;
      expect(report.status).toBe('solved');
      expect(m, name).not.toBeNull();
      if (!m) return;
      expect(report.stats?.states, 'state count (Zobrist identity = canonical key identity)').toBe(
        brute.states,
      );
      expect({
        min: m.min,
        minShifts: m.minShifts,
        firstNeedDepth: m.firstNeedDepth,
        trapCount: m.trapCount,
        deadRate: m.deadRate,
        choices0: m.choices[0],
        bestChoices0: m.bestChoices[0],
      }).toEqual({
        min: brute.min,
        minShifts: brute.minShifts,
        firstNeedDepth: brute.firstNeedDepth,
        trapCount: brute.trapCount,
        deadRate: brute.deadRate,
        choices0: brute.choices0,
        bestChoices0: brute.bestChoices0,
      });
      // K-46: the canonical solution has the most over-the-wall placements among the shortest solutions
      expect(m.yao.overWall, 'K-46 canonical YAO').toBe(brute.maxOverWall);
      expect(report.steps.length, 'one step per move (unit costs)').toBe(m.min);
    });
  }

  it('K-46 canonical solution has max YAO among min-move solutions (brute-force DP over every shortest solution)', () => {
    for (const [name, spec] of Object.entries(MICRO)) {
      const data = level(spec);
      const report = solveLevelData(data, {}, { variants: false });
      const brute = bruteMetrics(bruteExplore(compiledLevel(spec)), data.moves);
      expect(report.metrics?.yao.overWall, name).toBe(brute.maxOverWall);
      expect(
        (report.metrics?.yao.overWall ?? 0) + (report.metrics?.yao.rail ?? 0),
        `${name}: N placements`,
      ).toBe(report.metrics?.N);
    }
  });

  it('K-50 min of a pure tree search (iterative deepening, no transposition table) equals the solver min', () => {
    for (const name of ['gap', 'trap']) {
      const spec = MICRO[name];
      if (!spec) continue;
      const solved = solveLevelData(level(spec), {}, { variants: false });
      expect(treeMin(compiledLevel(spec), 3), name).toBe(solved.metrics?.min ?? null);
    }
  }, 30_000);

  it('K-50 A* min equals the explored min on every micro level', () => {
    for (const [name, spec] of Object.entries(MICRO)) {
      const lvl = compiledLevel(spec);
      const solved = solveLevelData(level(spec), {}, { variants: false });
      const a = astarMin(lvl);
      expect(a.complete, name).toBe(true);
      expect(a.min, name).toBe(solved.metrics?.min ?? null);
    }
  });

  it('K-50 the micro trap level really has ✓-traps and dead states (the scan is not vacuous)', () => {
    const report = solveLevelData(level({ ...MICRO.trap, difficulty: 'hard' }), {}, { variants: false });
    expect(report.metrics?.trapCount).toBeGreaterThan(0);
    expect(report.metrics?.deadRate).toBeGreaterThan(0);
    expect(report.metrics?.deadStates).toBeGreaterThan(0);
  });

  it('K-50 the explored graph is complete and every state is reachable from the start', () => {
    const g = explore(compiledLevel(MICRO.truck ?? {}));
    expect(g.complete).toBe(true);
    const seen = new Uint8Array(g.count);
    const queue = [0];
    seen[0] = 1;
    for (let h = 0; h < queue.length; h++) {
      const s = queue[h] ?? 0;
      for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
        const t = g.edgeTo[e] ?? 0;
        if (!seen[t]) {
          seen[t] = 1;
          queue.push(t);
        }
      }
    }
    expect(queue.length).toBe(g.count);
  });
});
