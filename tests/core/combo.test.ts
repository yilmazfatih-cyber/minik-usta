import { describe, expect, it } from 'vitest';
import {
  COMBO_FOR_TROWEL,
  comboOf,
  comboOnCorrect,
  comboReset,
  grantTrowels,
  trowelsOf,
} from '../../src/core/combo.ts';
import { trowelSpots } from '../../src/core/boosters.ts';
import { measureYao } from '../../src/core/moves.ts';
import { H, filledMask, hasFlag, hdr, pieceZone, revealedMask } from '../../src/core/state.ts';
import { Zone } from '../../src/core/types.ts';
import type { Move } from '../../src/core/types.ts';
import { initialState } from '../fixtures/builders.ts';
import type { LevelSpec } from '../fixtures/builders.ts';
import { dragTo, expectConsistent, find, run, types } from './moves.fixtures.ts';

/** Plan of four W rows; four vertical W dominoes, a Y block and a W single. */
const TOWER: LevelSpec = {
  wall: { height: 2 },
  plan: ['WW', 'WW', 'WW', 'WW'],
  pieces: [
    ['D2_0', 'W', 0, 0],
    ['D2_0', 'W', 1, 0],
    ['D2_0', 'W', 2, 0],
    ['D2_0', 'W', 3, 0],
    ['B1_0', 'Y', 4, 0],
    ['B1_0', 'W', 5, 0],
  ],
};

const trowel = (seg: number, x: 0 | 1, y: number): Move => ({ kind: 'trowel', seg, x, y });

describe('K-33 Usta Serisi', () => {
  it('K-33 GDD example: correct, correct, yard move, correct, correct → 1 Golden Trowel and c = 0', () => {
    const s = initialState(TOWER);
    run(s, dragTo(0, 6, 8));
    run(s, dragTo(1, 7, 8));
    expect(comboOf(s)).toBe(2);
    run(s, dragTo(4, 4, 1)); // yard move: c unchanged
    expect(comboOf(s)).toBe(2);
    run(s, dragTo(2, 6, 8));
    expect(comboOf(s)).toBe(3);
    const fourth = run(s, dragTo(3, 7, 8));
    expect(
      fourth.ev.filter((e) => e.t === 'comboChanged' || e.t === 'trowelEarned').map((e) => [e.t, e.step]),
    ).toEqual([
      ['comboChanged', 3],
      ['trowelEarned', 3],
      ['comboChanged', 3],
    ]);
    expect(
      fourth.ev.filter((e) => e.t === 'comboChanged').map((e) => (e.t === 'comboChanged' ? e.combo : -1)),
    ).toEqual([4, 0]);
    expect(find(fourth.ev, 'trowelEarned').trowels).toBe(1);
    expect([comboOf(s), trowelsOf(s)]).toEqual([0, 1]);
  });

  it('K-33 a wrong placement sets c = 0 (correct, correct, wrong)', () => {
    const s = initialState(TOWER);
    run(s, dragTo(0, 6, 8));
    run(s, dragTo(1, 7, 8));
    const wrong = run(s, dragTo(4, 6, 8)); // Y on W
    expect(types(wrong.ev)).toContain('pieceBounced');
    expect(comboOf(s)).toBe(0);
  });

  it('K-33 counter helpers: the 4th step earns a trowel; reset reports a change only when c > 0', () => {
    const s = initialState(TOWER);
    expect(COMBO_FOR_TROWEL).toBe(4);
    expect([1, 2, 3].map(() => comboOnCorrect(s).combo)).toEqual([1, 2, 3]);
    expect(comboOnCorrect(s)).toEqual({ reached: 4, combo: 0, earned: true, trowels: 1 });
    expect(comboReset(s)).toBe(false);
    comboOnCorrect(s);
    expect(comboReset(s)).toBe(true);
    expect(() => grantTrowels(s, -1)).toThrow(RangeError);
  });
});

describe('K-33 Golden Trowel (Faz 2R: a yard block flies to a spot of its P set)', () => {
  /** GDD K-33 example (Bölüm 8 shape, default board): `O4` R buried under an Ağır Yük; plan bottom → top RR, RR, WW. */
  const BURIED: LevelSpec = {
    wall: { height: 2 },
    plan: ['WW', 'RR', 'RR'],
    pieces: [
      ['O4_0', 'R', 0, 0],
      ['Q9_0', 'W', 0, 2],
      ['D2_90', 'W', 3, 0],
    ],
  };

  it('K-33 GDD example: the buried O4 R flies to its only spot (6,0) and locks; no move, m or streak (E-50: a D2_90 W with an empty P is refused, the trowel kept)', () => {
    const s = initialState(BURIED);
    grantTrowels(s, 1);
    expect(trowelSpots(s, 0)).toEqual([{ ix: 6, iy: 0 }]);
    expect(trowelSpots(s, 2)).toEqual([]);
    const refused = run(s, { kind: 'goldTrowel', pieceId: 2, x: 6, y: 2 });
    expect(refused.res).toEqual({ status: 'rejected', reason: 'noTarget', won: false, outOfMoves: false });
    expect(trowelsOf(s)).toBe(1);
    const before = {
      m: hdr(s, H.turn),
      moves: hdr(s, H.movesLeft),
      c: comboOf(s),
      spent: hdr(s, H.movesSpent),
    };
    const r = run(s, { kind: 'goldTrowel', pieceId: 0, x: 6, y: 0 });
    expect(r.res.status).toBe('applied');
    expect(find(r.ev, 'boosterApplied')).toMatchObject({
      step: 1,
      booster: 'trowel',
      detail: { pieceId: 0, to: { zone: 'site', x: 6, y: 0, seg: 0 }, trowels: 0 },
    });
    expect(find(r.ev, 'pieceLifted')).toMatchObject({ by: 'trowel', from: { zone: 'yard', x: 0, y: 0 } });
    expect(types(r.ev)).not.toContain('placementCorrect');
    expect([pieceZone(s, 0), hasFlag(s, 0, 'locked'), filledMask(s, 0, 0) & 0b11]).toEqual([
      Zone.site,
      true,
      0b11,
    ]);
    // boosters never spend a move, advance m / movesSpent or touch the streak (GDD §10); YAO ignores it (K-46)
    expect({
      m: hdr(s, H.turn),
      moves: hdr(s, H.movesLeft),
      c: comboOf(s),
      spent: hdr(s, H.movesSpent),
    }).toEqual(before);
    expect(measureYao(s).yao).toBeNull();
    expect(types(r.ev)).not.toContain('movesChanged');
    expectConsistent(s);
  });

  it('K-33 a refused trowel target is not consumed and changes nothing (no trowel, empty P, a spot outside P, the Faz 2 cell trowel)', () => {
    const s = initialState(BURIED);
    const none = run(s, { kind: 'goldTrowel', pieceId: 0, x: 6, y: 0 });
    expect(none.res).toEqual({ status: 'rejected', reason: 'noTrowel', won: false, outOfMoves: false });
    expect(none.ev).toEqual([
      { seq: 0, step: 0, t: 'boosterRejected', booster: 'trowel', reason: 'noTrowel' },
    ]);
    grantTrowels(s, 1);
    const before = s.buf.slice();
    expect(run(s, { kind: 'goldTrowel', pieceId: 0, x: 6, y: 1 }).res.reason).toBe('notCorrect');
    expect(run(s, { kind: 'goldTrowel', pieceId: 1, x: 6, y: 0 }).res.reason).toBe('noTarget'); // Ağır Yük
    expect(run(s, trowel(0, 0, 0)).res.reason).toBe('legacyTrowel');
    expect(s.buf).toEqual(before);
  });

  it('K-33 a trowel that completes the segment runs the mini pipeline: shift and delivery, no m, no timers (E-09)', () => {
    const s = initialState({
      wall: { height: 2 },
      plan: [['WW'], ['WW']],
      pieces: [
        ['B1_0', 'W', 0, 0],
        ['B1_0', 'W', 1, 0],
      ],
      batches: [{ forSegment: 1, pieces: [['D2_90', 'W', 0, 8]] }],
    });
    run(s, dragTo(0, 6, 8));
    grantTrowels(s, 1);
    const r = run(s, { kind: 'goldTrowel', pieceId: 1, x: 7, y: 0 });
    expect(r.ev.map((e) => [e.t, e.step])).toEqual([
      ['boosterApplied', 1],
      ['pieceLifted', 1],
      ['segmentCompleted', 8],
      ['goalProgress', 8],
      ['siteShifted', 8],
      ['deliveryArrived', 9],
      ['pieceFell', 9],
    ]);
    expect([hdr(s, H.turn), hdr(s, H.activeSeg)]).toEqual([1, 1]);
    expectConsistent(s);
  });

  it('K-33 a trowel placement on a hidden `?` cell opens it (K-32)', () => {
    const s = initialState({
      wall: { height: 2 },
      plan: ['??', 'WY'],
      hidden: [{ kind: 'repeat', period: 1 }],
      pieces: [
        ['B1_0', 'W', 0, 0],
        ['B1_0', 'Y', 1, 0],
        ['B1_0', 'W', 2, 0],
        ['B1_0', 'Y', 3, 0],
      ],
    });
    run(s, dragTo(0, 6, 8));
    run(s, dragTo(1, 7, 8));
    grantTrowels(s, 1);
    const r = run(s, { kind: 'goldTrowel', pieceId: 3, x: 7, y: 1 });
    expect(find(r.ev, 'cellsRevealed')).toMatchObject({
      step: 1,
      seg: 0,
      cells: [{ x: 7, y: 1, color: 'Y' }],
    });
    expect(revealedMask(s, 0)).toBe(1 << 3);
  });

  it('K-33 pre-check: a P spot whose result is a D3a dead end is left out and refused (CL-2R-05, GDD K-30 tiling example)', () => {
    // plan bottom → top: YW, YW, WW, WW; blocks D2_0 Y, D2_0 W, O4 W (GDD K-30 "döşeme çıkmazı")
    const s = initialState({
      wall: { height: 2 },
      plan: ['WW', 'WW', 'YW', 'YW'],
      pieces: [
        ['D2_0', 'Y', 0, 0],
        ['D2_0', 'W', 1, 0],
        ['O4_0', 'W', 2, 0],
      ],
    });
    run(s, dragTo(0, 6, 8)); // Y on column 6, rows 0–1
    grantTrowels(s, 1);
    expect(trowelSpots(s, 1)).toEqual([
      { ix: 6, iy: 2 },
      { ix: 7, iy: 0 },
    ]);
    expect(trowelSpots(s, 1, { precheck: true })).toEqual([{ ix: 7, iy: 0 }]);
    const before = s.buf.slice();
    const r = run(s, { kind: 'goldTrowel', pieceId: 1, x: 6, y: 2 });
    expect(r.res.reason).toBe('precheck');
    expect(s.buf).toEqual(before);
    expect(run(s, { kind: 'goldTrowel', pieceId: 1, x: 7, y: 0 }).res.status).toBe('applied');
  });
});
