/**
 * D-099 solver gates and metrics on small `schemaVersion` 2 levels (GDD K-50 items 11–19, K-51 items 6–9, K-52 D-099
 * budget, K-45 item 11; docs/TECH_DESIGN.md §D99.3).
 */
import { describe, expect, it } from 'vitest';
import { level } from '../../fixtures/builders.ts';
import type { LevelSpec } from '../../fixtures/builders.ts';
import { solveLevelData } from '../../../tools/solver/solveLevel.ts';
import { movesBand } from '../../../tools/solver/metrics.ts';
import { d099AMax, d099Band, d099Checks } from '../../../tools/solver/puzzle.ts';
import type { D099Metrics } from '../../../tools/solver/puzzle.ts';
import { MICRO } from './micro.ts';

/**
 * Plan (top → bottom) WY, WY, WW, WW; O4 W buried under a vertical D2 Y, the D2 W free: the free D2 W fits the bottom
 * W rows (K-16 correct) and then the O4 W has no place — the greedy player's first placement is a trap.
 */
const GREEDY_TRAP: LevelSpec = {
  id: 5,
  schemaVersion: 2,
  yard: { cols: 3, rows: 4 },
  site: { cols: 2, rows: 4 },
  wall: { height: 4 },
  plan: ['WY', 'WY', 'WW', 'WW'],
  pieces: [
    ['O4_0', 'W', 0, 0],
    ['D2_0', 'W', 2, 0],
    ['D2_0', 'Y', 0, 2],
  ],
  difficulty: 'normal',
  moves: 6,
};

/** The K-30 D1 jam (deadlock.test.ts) as a v2 level: the second move leaves no holdable block. */
const D1_JAM: LevelSpec = {
  id: 8,
  schemaVersion: 2,
  yard: { cols: 5, rows: 4 },
  site: { cols: 2, rows: 4 },
  wall: { height: 2 },
  plan: ['WW', 'WW', 'WW', 'WW'],
  pieces: [
    ['D2_90', 'W', 0, 0],
    ['B1_0', 'W', 2, 0],
    ['B1_0', 'W', 3, 0],
    ['B1_0', 'W', 4, 0],
    ['I5_0', 'W', 0, 1],
    ['D2_90', 'W', 0, 3],
    ['B1_0', 'W', 2, 3],
  ],
  obstacles: [0, 1, 2, 3, 4].map((x) => ({ type: 'crate' as const, x, y: 2, hp: 1 })),
  moves: 30,
};

const codes = (r: ReturnType<typeof solveLevelData>): string[] => r.issues.map((i) => i.code);

describe('D-099 solver gates (K-51 items 6–9, schemaVersion 2)', () => {
  it('K-51 item 6 greedy_trap_in_easy: on Normal the greedy first placement is a trap (greedyTrap 1, D3a catches it); on Zor it is allowed', () => {
    const normal = solveLevelData(level(GREEDY_TRAP), {}, { variants: false });
    const d = normal.metrics?.d099;
    expect(normal.status).toBe('solved');
    expect(d?.greedyTrap).toBe(1);
    expect(d?.undetectedDead).toBe(0);
    expect(normal.issues.find((i) => i.code === 'greedy_trap_in_easy')).toMatchObject({
      rule: 'K-51/6',
      check: 'L-38',
      severity: 'error',
    });
    const hard = solveLevelData(
      level({ ...GREEDY_TRAP, difficulty: 'hard', moves: 5 }),
      {},
      { variants: false },
    );
    expect(codes(hard)).not.toContain('greedy_trap_in_easy');
    // v1: the D-099 gates do not run (Faz 2R archive)
    const v1 = solveLevelData(level({ ...GREEDY_TRAP, schemaVersion: 1 }), {}, { variants: false });
    expect(codes(v1)).not.toContain('greedy_trap_in_easy');
    expect(v1.metrics?.d099.greedyTrap).toBe(1);
  });

  it('K-51 item 8 d1_reachable: the gate reads d1States; on a static (pure) board D1 is never entered from a live state', () => {
    // the K-30 jam is unsolvable (its buried blocks never come out): the solver stops at `unsolvable`
    const jam = solveLevelData(level(D1_JAM), {}, { variants: false });
    expect(jam.status).toBe('unsolvable');
    const base = solveLevelData(level(MICRO.floors ?? {}), {}, { variants: false }).metrics
      ?.d099 as D099Metrics;
    expect(base.d1States).toBe(0);
    const data = level(MICRO.floors ?? {});
    expect(d099Checks(data, { ...base, d1States: 2 }).find((i) => i.code === 'd1_reachable')).toMatchObject({
      rule: 'K-51/8',
      check: 'L-37',
      severity: 'error',
    });
  });

  it('K-51 item 7 scan_incomplete: a v2 level whose space is not scanned to the end is an error (state budget)', () => {
    const r = solveLevelData(level(MICRO.floors ?? {}), {}, { variants: false, maxStates: 50 });
    expect(r.status).toBe('unknown');
    expect(r.issues.find((i) => i.code === 'scan_incomplete')).toMatchObject({
      rule: 'K-51/7',
      check: 'L-37',
      severity: 'error',
    });
  });

  it('K-51 item 7 undetected_dead and item 9 floors come from the D-099 metrics (hand-made metric records)', () => {
    const base = solveLevelData(level(MICRO.floors ?? {}), {}, { variants: false }).metrics
      ?.d099 as D099Metrics;
    const data = level({ ...(MICRO.floors ?? {}), difficulty: 'hard', moves: 6 });
    const check = (over: Partial<D099Metrics>): string[] =>
      d099Checks(data, { ...base, ...over }).map((i) => i.code);
    expect(check({ undetectedDead: 3 })).toContain('undetected_dead');
    expect(check({ crossDeps: 0 })).toContain('puzzle_no_cross');
    expect(check({ ahaMin: 0, greedyWin: 0.9 })).toContain('puzzle_greedy_easy');
    expect(check({ ahaMin: 1, greedyWin: 0.9 })).not.toContain('puzzle_greedy_easy');
    expect(check({ greedyMin: 5, greedyTrap: null, greedyWin: 0.5 })).toContain('puzzle_greedy_wins');
    expect(check({ greedyMin: 5, greedyTrap: 4, greedyWin: 0.5 })).not.toContain('puzzle_greedy_wins');
    expect(check({ greedyMin: 99, greedyTrap: null, greedyWin: 0.5 })).not.toContain('puzzle_greedy_wins');
    // a Normal intro level is exempt from puzzle_greedy_easy; ids 1–2 from item 9
    const intro = level({ ...(MICRO.floors ?? {}), difficulty: 'normal', teaches: 'S1' });
    expect(d099Checks(intro, { ...base, ahaMin: 0, greedyWin: 0.9 }).map((i) => i.code)).not.toContain(
      'puzzle_greedy_easy',
    );
    const early = level({ ...(MICRO.floors ?? {}), id: 2 });
    expect(d099Checks(early, { ...base, crossDeps: 0 }).map((i) => i.code)).not.toContain('puzzle_no_cross');
  });

  it('K-52 D-099 budget: moves = min + P + a, P Kolay 4 / Normal 2 / Zor 1 / Çok Zor 1, intro one row easier, 0 ≤ a ≤ aMax', () => {
    // GDD K-52 examples: Normal min 14 → 16 … 19; Zor min 20 → 21 … 23; Normal intro min 12 → 16 … 18; Kolay min 7 → 11 … 13
    expect(d099Band(14, 'normal', false)).toEqual({ P: 2, aMax: 3, lo: 16, hi: 19 });
    expect(d099Band(20, 'hard', false)).toEqual({ P: 1, aMax: 2, lo: 21, hi: 23 });
    expect(d099Band(12, 'normal', true)).toEqual({ P: 4, aMax: 2, lo: 16, hi: 18 });
    expect(d099Band(7, 'easy', false)).toEqual({ P: 4, aMax: 2, lo: 11, hi: 13 });
    // LEVELS §6.4: Bölüm 7 min 15 → 17 … 20; Bölüm 10 min 24 → 25 … 28
    expect(d099Band(15, 'normal', false)).toMatchObject({ lo: 17, hi: 20 });
    expect(d099Band(24, 'hard', false)).toMatchObject({ lo: 25, hi: 28 });
    expect(d099Band(13, 'superhard', true)).toMatchObject({ P: 1 });
    expect(d099AMax(30, 'superhard')).toBe(3);
    expect(movesBand(14, 'normal', false, true)).toMatchObject({ version: 2, T: 2, A: 3, lo: 16, hi: 19 });
    expect(movesBand(14, 'normal', false)).toMatchObject({ version: 1 });
    // the solver checks v2 levels with it (L-19 moves_budget)
    const r = solveLevelData(
      level({ ...GREEDY_TRAP, difficulty: 'hard', moves: 9 }),
      {},
      { variants: false },
    );
    expect(r.band).toMatchObject({ version: 2, lo: (r.metrics?.min ?? 0) + 1 });
    expect(codes(r)).toContain('moves_budget');
  });

  it('K-50 items 11–14 on the P1 calibration draft shape (micro floors): seg, cover pairs, park slack and the report lines', () => {
    const r = solveLevelData(level(MICRO.floors ?? {}), {}, { variants: false });
    const d = r.metrics?.d099;
    expect(r.schemaVersion).toBe(2);
    expect(d).toBeDefined();
    if (!d) return;
    // every block is placed once, two per floor (K-50/13 seg)
    expect(Object.values(d.seg).sort()).toEqual([0, 0, 1, 1]);
    expect(d.crossDeps).toBe(d.depLater + d.depEarlier);
    expect(d.E0).toBe(8);
    expect(d.parkSlack === null ? d.parkPeak : d.parkSlack).toBe(
      d.parkSlack === null ? 0 : d.E0 / d.parkPeak,
    );
    expect(d.choicesAll).toHaveLength(r.steps.length);
    expect(d.forced).toBeLessThanOrEqual(d.decisionPoints);
  });
});
