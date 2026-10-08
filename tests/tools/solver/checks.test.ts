/**
 * Solve-stage checks (GDD K-45 item 9, K-46, K-51, K-52, K-53; TECH §2R.3 L-19, L-27, L-32…L-35, §2R.5): every code
 * the solver reports, on Faz 2R draft levels (tests/level/fixtures/levels-2r) and hand-made boards.
 */
import { describe, expect, it } from 'vitest';
import { LevelSchema } from '../../../src/core/level/schema.ts';
import type { LevelData } from '../../../src/core/level/schema.ts';
import { solveLevelData, solveLevelJson } from '../../../tools/solver/solveLevel.ts';
import type { SolveReport } from '../../../tools/solver/solveLevel.ts';
import { movesBand } from '../../../tools/solver/metrics.ts';
import { level, loadFixture } from '../../fixtures/builders.ts';
import { MICRO } from './micro.ts';

const draft = (n: number): LevelData =>
  LevelSchema.parse(loadFixture('levels-2r', `level_${String(n).padStart(3, '0')}`));
const solve = (data: LevelData): SolveReport => solveLevelData(data, {}, { variants: false });
const codes = (r: SolveReport): string[] => r.issues.map((i) => i.code);
const issue = (r: SolveReport, code: string) => r.issues.find((i) => i.code === code);

/** Draft n with one tutorial step's hand path replaced. */
function withHand(n: number, step: number, path: [number, number][], kind?: 'drag' | 'hold'): LevelData {
  const d = draft(n);
  const tutorial = (d.tutorial ?? []).map((s, i) =>
    i === step ? { ...s, hand: { kind: kind ?? s.hand?.kind ?? 'drag', path } } : s,
  );
  return { ...d, tutorial };
}

describe('K-53 tutorial hand path (L-35 tut_hand_invalid)', () => {
  it('K-53 tutorial hand path reachable and not cancel: level 4 step 2 old path [[1,1],[4,1]] fails, [[1,1],[5,1]] passes', () => {
    const old = solve(
      withHand(4, 1, [
        [1, 1],
        [4, 1],
      ]),
    );
    const hit = issue(old, 'tut_hand_invalid');
    expect(hit?.path).toBe('tutorial[1].hand.path[1]');
    expect(hit?.message).toMatch(/cancels \(K-07 row 4, straddle\)/);
    expect(hit?.severity).toBe('error');
    expect(
      codes(
        solve(
          withHand(4, 1, [
            [1, 1],
            [5, 1],
          ]),
        ),
      ),
    ).not.toContain('tut_hand_invalid');
  });

  it('K-53 every drag / hold hand of the drafts 1–7 and 9 is valid on the canonical solution', () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 9])
      expect(codes(solve(draft(n))), `level ${n}`).not.toContain('tut_hand_invalid');
  });

  it('K-53 hand path[0] must be a cell of a highlighted block', () => {
    const r = solve(
      withHand(3, 0, [
        [2, 3],
        [3, 3],
      ]),
    );
    expect(issue(r, 'tut_hand_invalid')?.message).toMatch(/not a cell of a highlighted block/);
  });

  it('K-53 hand path points share a row or a column', () => {
    const r = solve(
      withHand(3, 0, [
        [0, 3],
        [1, 2],
      ]),
    );
    expect(issue(r, 'tut_hand_invalid')?.message).toMatch(/not on one row or column/);
  });

  it('K-53 hand path through a blocked cell leaves R (K-08)', () => {
    // level 3: c (O4 G at (0,2)) held at (0,3); (0,3) → (0,1) pushes c down into a and b
    const r = solve(
      withHand(3, 0, [
        [0, 3],
        [0, 1],
      ]),
    );
    expect(issue(r, 'tut_hand_invalid')?.message).toMatch(/outside R/);
  });

  it('K-53 hand path ending over the yard air cancels (K-07 row 3)', () => {
    const r = solve(
      withHand(3, 0, [
        [0, 3],
        [0, 5],
      ]),
    );
    expect(issue(r, 'tut_hand_invalid')?.message).toMatch(/cancels \(K-07 row 3/);
  });

  it('K-53 a drag hand must be the first move of a shortest solution', () => {
    // level 1: a (D2_0 Y at (0,2)) parked in the yard at (2,2) is a shift; min 5 = N 5 has no shift
    const r = solve(
      withHand(1, 0, [
        [0, 3],
        [0, 5],
        [2, 5],
        [2, 3],
      ]),
    );
    expect(issue(r, 'tut_hand_invalid')?.message).toMatch(/not the first move of a shortest solution/);
  });

  it('K-53 a hold hand ends over the site columns', () => {
    const ok = solve(
      withHand(
        2,
        1,
        [
          [1, 3],
          [1, 5],
          [5, 5],
        ],
        'hold',
      ),
    );
    expect(codes(ok)).not.toContain('tut_hand_invalid');
    const r = solve(
      withHand(
        2,
        1,
        [
          [1, 3],
          [1, 2],
        ],
        'hold',
      ),
    );
    expect(codes(r)).toContain('tut_hand_invalid');
  });
});

describe('K-51 puzzle requirements', () => {
  it('K-51 puzzle_first_reachable and puzzle_no_shift: level 3 with O4 G bottom right and the first blocks open (GDD K-51 example)', () => {
    const d = draft(3);
    const pieces = [
      { shape: 'D2_0', color: 'Y', x: 0, y: 0 },
      { shape: 'D2_0', color: 'W', x: 1, y: 0 },
      { shape: 'O4_0', color: 'G', x: 2, y: 0 },
      { shape: 'D2_90', color: 'Y', x: 2, y: 2 },
    ] as const;
    const r = solve({
      ...d,
      yard: { ...d.yard, batches: [{ forSegment: 0, pieces: pieces.map((p) => ({ ...p })) }] },
    });
    expect(r.metrics?.firstNeedDepth).toBe(0);
    expect(issue(r, 'puzzle_first_reachable')).toMatchObject({
      severity: 'error',
      check: 'L-32',
      rule: 'K-51/1',
    });
    expect(issue(r, 'puzzle_no_shift')).toMatchObject({ severity: 'error', check: 'L-32' });
    // levels 1–2 are tutorials: 0 is allowed
    expect(codes(solve(draft(1)))).not.toContain('puzzle_first_reachable');
  });

  it('K-51 trap_in_easy: a ✓-trap on an easy level is an error; trap_warn on a hard level is a warning', () => {
    const easy = solve(level({ ...MICRO.trap, difficulty: 'easy' }));
    expect(issue(easy, 'trap_in_easy')).toMatchObject({ severity: 'error', check: 'L-27', rule: 'K-51/2' });
    const hard = solve(level({ ...MICRO.trap, difficulty: 'hard' }));
    expect(issue(hard, 'trap_warn')).toMatchObject({ severity: 'warn', check: 'L-27' });
    expect(codes(hard)).not.toContain('trap_in_easy');
    // TECH §2R.4 cut 1: no D3b table in Faz 2R, so deadRate > 0 fails the tool gate on any difficulty
    expect(issue(hard, 'dead_table_missing')?.severity).toBe('error');
  });

  it('K-51 metric_out_of_band: a K-50 metric outside the targets band warns (L-33)', () => {
    const d = draft(3);
    const r = solve({ ...d, targets: { ...d.targets, minShifts: [2, 3], choices0: [6, 6] } });
    const out = r.issues.filter((i) => i.code === 'metric_out_of_band');
    expect(out.map((i) => i.path)).toEqual(['targets.minShifts']);
    expect(out[0]?.severity).toBe('warn');
  });

  it('K-51 the drafts 1–7 and 9 meet K-51 and K-52 with no error and no warning', () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 9]) expect(solve(draft(n)).issues, `level ${n}`).toEqual([]);
  });
});

describe('K-52 move budget and K-46 YAO', () => {
  it('K-52 moves_budget: moves outside [min + T − A, min + T + A] or below min + floor is an error (level 3: band 10–12)', () => {
    const d = draft(3);
    for (const [moves, bad] of [
      [9, true],
      [10, false],
      [11, false],
      [12, false],
      [13, true],
    ] as const) {
      const r = solve({ ...d, moves });
      expect(codes(r).includes('moves_budget'), `moves ${moves}`).toBe(bad);
    }
  });

  it('K-52 the GDD examples: level 3 min 5 easy → 11, level 10 min 13 hard → 16 (A 1, floor 2)', () => {
    expect(movesBand(5, 'easy', false)).toMatchObject({ T: 6, nominal: 11, lo: 10, hi: 12 });
    expect(movesBand(13, 'hard', false)).toMatchObject({ T: 3, A: 1, floor: 2, nominal: 16, lo: 15, hi: 17 });
    // floor wins over T − A: min 30 superhard → T max(2, ⌈3.6⌉) = 4, A 3: [min + 1, min + 7]
    expect(movesBand(30, 'superhard', false)).toMatchObject({ T: 4, A: 3, lo: 31, hi: 37 });
  });

  it('K-52 intro level uses the easier row (DL-2R-05): level 5 normal + teaches S1, min 11 → T 6 → 17', () => {
    expect(movesBand(11, 'normal', true)).toMatchObject({ row: 'easy', T: 6, floor: 4, nominal: 17 });
    expect(movesBand(11, 'normal', false)).toMatchObject({ row: 'normal', T: 4, floor: 3, nominal: 15 });
    expect(movesBand(13, 'hard', true).row).toBe('normal');
    expect(movesBand(13, 'superhard', true).row).toBe('hard');
    expect(movesBand(13, 'easy', true).row).toBe('easy');
  });

  it('K-46 yao_low: a canonical solution with half of its placements on the rail is an error', () => {
    const r = solve(
      level({
        id: 4,
        yard: { cols: 3, rows: 4 },
        site: { cols: 2, rows: 4 },
        wall: { height: 4, gaps: [{ type: 'static', y: 0, size: 2 }] },
        plan: ['YY', 'YY', 'WW', 'WW'],
        pieces: [
          ['O4_0', 'W', 0, 0],
          ['O4_0', 'Y', 0, 2],
        ],
        moves: 8,
      }),
    );
    expect(r.metrics?.yao).toEqual({ overWall: 1, rail: 1, value: 0.5 });
    expect(issue(r, 'yao_low')).toMatchObject({ severity: 'error', rule: 'K-46', check: 'L-19' });
  });

  it('K-46 canonical edge keeps over the wall when the rail reaches the same next state', () => {
    // the uncovered O4 W can slide through the gap or fly over the wall: both land at (4,0)
    const r = solve(
      level({
        id: 4,
        yard: { cols: 4, rows: 4 },
        site: { cols: 2, rows: 4 },
        wall: { height: 4, gaps: [{ type: 'static', y: 0, size: 2 }] },
        plan: ['YY', 'YY', 'WW', 'WW'],
        pieces: [
          ['O4_0', 'W', 0, 0],
          ['D2_0', 'Y', 2, 2],
          ['D2_0', 'Y', 3, 2],
        ],
        moves: 9,
      }),
    );
    expect(r.steps[0]).toMatchObject({ kind: 'overWall', ref: 'piece:0', to: [4, 0] });
    expect(r.metrics?.yao).toMatchObject({ overWall: 3, rail: 0 });
  });
});

describe('K-45/9 solver status codes', () => {
  it('K-45/9 unsolvable: no drag sequence wins (colours do not match the plan)', () => {
    const r = solve(
      level({
        id: 3,
        yard: { cols: 3, rows: 4 },
        site: { cols: 2, rows: 4 },
        wall: { height: 4 },
        plan: ['WW', 'WW', 'WW', 'WW'],
        pieces: [
          ['O4_0', 'Y', 0, 0],
          ['O4_0', 'Y', 0, 2],
        ],
      }),
    );
    expect(r.status).toBe('unsolvable');
    expect(issue(r, 'unsolvable')).toMatchObject({ severity: 'error', check: 'L-19' });
    expect(r.metrics).toBeNull();
  });

  it('K-45/9 a state limit gives an explicit unknown, never a guess (solve_unknown + trap_scan_incomplete)', () => {
    const r = solveLevelData(draft(5), {}, { variants: false, maxStates: 200 });
    expect(r.status).toBe('unknown');
    expect(r.metrics).toBeNull();
    expect(r.stats?.complete).toBe(false);
    expect(r.stats?.limit).toBe('maxStates');
    expect(issue(r, 'solve_unknown')?.severity).toBe('error');
    expect(issue(r, 'trap_scan_incomplete')?.severity).toBe('warn');
  });

  it('K-45/9 a level that fails the validate stage is not solved (level_invalid)', () => {
    const json = loadFixture('levels-2r', 'level_003') as Record<string, unknown>;
    const r = solveLevelJson({ ...json, moves: 0 }, { fileId: 3 });
    expect(r.status).toBe('invalid');
    expect(codes(r)).toEqual(['level_invalid']);
  });
});
