import { describe, expect, it } from 'vitest';
import {
  batchesFor,
  deliverQueue,
  deliveryColumns,
  deliveryLanding,
  enqueueBatchesFor,
} from '../../src/core/delivery.ts';
import { movePiece } from '../../src/core/placement.ts';
import {
  PF,
  createInitialState,
  hdr,
  H,
  pieceField,
  pieceX,
  pieceY,
  pieceZone,
  queueIds,
} from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import { Zone } from '../../src/core/types.ts';
import type { PieceId } from '../../src/core/types.ts';
import { initialState } from '../fixtures/builders.ts';
import type { LevelSpec, PieceSpec } from '../fixtures/builders.ts';
import { HAND, dragTo, expectConsistent, find, levelFile, run } from './moves.fixtures.ts';

const at = (s: GameState, id: PieceId): [number, number, number] => [
  pieceZone(s, id),
  pieceX(s, id),
  pieceY(s, id),
];

/** The whole yard filled with B1 W blocks (id = y · 6 + x when there are no holes), except the cells in `holes`. */
function fullYard(holes: readonly [number, number][] = []): PieceSpec[] {
  const out: PieceSpec[] = [];
  const isHole = (x: number, y: number): boolean => holes.some(([hx, hy]) => hx === x && hy === y);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 6; x++) if (!isHole(x, y)) out.push(['B1_0', 'W', x, y]);
  return out;
}

describe('K-25 truck delivery', () => {
  it('K-25 GDD example: O4 G x = 4 lands on (4,4); B1 R with column 0 full falls in column 1 at (1,6)', () => {
    const spec: LevelSpec = {
      plan: [['WW'], ['WW']],
      pieces: [
        ['D2_0', 'W', 0, 0],
        ['D2_0', 'W', 0, 2],
        ['D2_0', 'W', 0, 4],
        ['D2_0', 'W', 0, 6],
        ['D2_0', 'W', 1, 0],
        ['D2_0', 'W', 1, 2],
        ['D2_0', 'W', 1, 4],
        ['O4_0', 'W', 4, 0],
        ['O4_0', 'W', 4, 2],
      ],
      batches: [
        {
          forSegment: 1,
          pieces: [
            ['O4_0', 'G', 4, 8],
            ['B1_0', 'R', 0, 8],
          ],
        },
      ],
    };
    const s = initialState(spec);
    expect(batchesFor(s, 1).map((b) => b.index)).toEqual([1]);
    expect(enqueueBatchesFor(s, 1)).toEqual([9, 10]);
    expect(queueIds(s)).toEqual([9, 10]);
    const res = deliverQueue(s);
    expect(res.delivered.map((d) => [d.pieceId, d.to.ix, d.to.iy, d.from.iy, d.rows])).toEqual([
      [9, 4, 4, 8, 4],
      [10, 1, 6, 9, 3],
    ]);
    expect(res.queued).toBe(0);
    expectConsistent(s);
  });

  it('K-25 column order: x, then dropColumns in list order, then the rest nearest to x (ties nearer the wall)', () => {
    const s = initialState({
      plan: [['WW'], ['WW']],
      pieces: [['B1_0', 'W', 0, 0]],
      batches: [{ forSegment: 1, dropColumns: [5, 0], pieces: [['B1_0', 'W', 2, 8]] }],
    });
    expect(deliveryColumns(s, 1)).toEqual([2, 5, 0, 3, 1, 4]);
    expect(deliveryColumns(s, 0)).toEqual([0, 1, 2, 3, 4, 5]); // batch 0: no dropColumns
  });

  it('E-34 x and both dropColumns are full: stage 3 still runs; with no room at all the block stays queued', () => {
    const holes: [number, number][] = [[2, 7]];
    const s = initialState({
      plan: [['WW'], ['WW']],
      pieces: fullYard(holes),
      batches: [
        { forSegment: 1, dropColumns: [3, 0], pieces: [['B1_0', 'R', 1, 8]] },
        { forSegment: 2, pieces: [['B1_0', 'G', 0, 8]] },
      ],
    });
    const red = s.lvl.batches[1]?.pieceIds[0] ?? -1;
    enqueueBatchesFor(s, 1);
    expect(deliveryLanding(s, red)).toEqual({ ix: 2, iy: 7 });
    expect(deliverQueue(s).queued).toBe(0);
    expect(at(s, red)).toEqual([Zone.yard, 2, 7]);
    const green = s.lvl.batches[2]?.pieceIds[0] ?? -1;
    enqueueBatchesFor(s, 2);
    expect(deliveryLanding(s, green)).toBeNull();
    expect(deliverQueue(s)).toEqual({ delivered: [], queued: 1 });
    expect(pieceZone(s, green)).toBe(Zone.queue);
  });
});

describe('K-26 FIFO truck queue', () => {
  it('K-26 GDD example: queue [O4 W, B1 Y], only (5,7) free → O4 stays, B1 lands on (5,7), "Kamyonda: 1"', () => {
    const s = initialState({
      plan: [['WW'], ['WW']],
      pieces: fullYard([[5, 7]]),
      batches: [
        {
          forSegment: 1,
          pieces: [
            ['O4_0', 'W', 0, 8],
            ['B1_0', 'Y', 0, 8],
          ],
        },
      ],
    });
    const [o4, b1] = enqueueBatchesFor(s, 1) as [PieceId, PieceId];
    const res = deliverQueue(s);
    expect(res.delivered.map((d) => d.pieceId)).toEqual([b1]);
    expect(at(s, b1)).toEqual([Zone.yard, 5, 7]);
    expect(res.queued).toBe(1);
    expect(queueIds(s)).toEqual([o4]);
  });

  it('K-26 older queued pieces deliver first; a new batch joins behind them', () => {
    const s = initialState({
      plan: [['WW'], ['WW'], ['WW']],
      pieces: fullYard(),
      batches: [
        { forSegment: 1, pieces: [['B1_0', 'R', 0, 8]] },
        { forSegment: 2, pieces: [['B1_0', 'G', 5, 8]] },
      ],
    });
    const [old] = enqueueBatchesFor(s, 1) as [PieceId];
    expect(deliverQueue(s).queued).toBe(1);
    const [young] = enqueueBatchesFor(s, 2) as [PieceId];
    expect(queueIds(s)).toEqual([old, young]);
    movePiece(s, 47, { zone: 'gone', x: 5, y: 7, seg: -1 }); // frees (5,7): room for one block
    const res = deliverQueue(s);
    expect(res.delivered.map((d) => d.pieceId)).toEqual([old]);
    expect(at(s, old)).toEqual([Zone.yard, 5, 7]);
    expect(queueIds(s)).toEqual([young]);
  });

  /**
   * E-03 board (the Faz 2R levels 1–10 never queue in their canonical solutions, LEVELS §2.0 3f): 3×4 yard, 2×4
   * site (x 3–4). Four D2_0 W build Taban; a carried D2_0 Y hangs at (1,2) (yard gravity off), so the truck's O4 G finds
   * no two free top cells (K-25) and waits, while the D2_0 Y behind it lands (K-26: every queued block is tried once).
   */
  const QUEUE: LevelSpec = {
    yard: { cols: 3, rows: 4 },
    site: { cols: 2, rows: 4 },
    wall: { height: 4 },
    plan: [
      ['WW', 'WW', 'WW', 'WW'],
      ['GG', 'GG', 'YY', 'YY'],
    ],
    pieces: [
      ['D2_0', 'W', 0, 2],
      ['D2_0', 'W', 0, 0],
      ['D2_0', 'W', 2, 2],
      ['D2_0', 'W', 2, 0],
      ['D2_0', 'Y', 1, 2],
    ],
    batches: [
      {
        forSegment: 1,
        pieces: [
          ['O4_0', 'G', 0, 4],
          ['D2_0', 'Y', 2, 4],
        ],
      },
    ],
  };
  const QUEUE_SEG0 = [dragTo(0, 3, 0), dragTo(1, 3, 2), dragTo(2, 4, 0), dragTo(3, 4, 2)];

  it("E-03 no room for the truck: blocks wait in the queue and drop in a later move's step 9", () => {
    const s = initialState(QUEUE);
    const [o4, d2] = s.lvl.batches[1]?.pieceIds ?? [];
    const runs = QUEUE_SEG0.map((m) => run(s, m));
    const completing = runs[3]?.ev ?? [];
    expect(find(completing, 'segmentCompleted').seg).toBe(0);
    expect(find(completing, 'deliveryArrived').pieces).toEqual([d2]);
    expect(find(completing, 'deliveryQueued').queued).toBe(1);
    expect(queueIds(s)).toEqual([o4]);
    expect(hdr(s, H.queueLen)).toBe(1);
    expect(at(s, d2 ?? -1)).toEqual([Zone.yard, 2, 0]);
    // the hanging Y leaves for the site: step 9 of that move drops the waiting O4 into the freed columns 0–1
    const next = run(s, dragTo(4, 3, 0));
    expect(find(next.ev, 'placementCorrect').pieceId).toBe(4);
    const truck = next.ev.filter((e) => e.t === 'pieceFell' && e.cause === 'delivery');
    expect(truck).toHaveLength(1);
    expect(truck[0]).toMatchObject({ step: 9, pieceId: o4, to: { zone: 'yard', x: 0, y: 0 } });
    expect(queueIds(s)).toEqual([]);
    expectConsistent(s);
  });

  it('K-25 a delivered block remembers the move it arrived in (E-31: wet blocks keep their counter that move)', () => {
    const s = initialState(QUEUE);
    const [o4, d2] = s.lvl.batches[1]?.pieceIds ?? [];
    for (const m of QUEUE_SEG0) run(s, m);
    expect(pieceField(s, d2 ?? -1, PF.arrivedTurn)).toBe(4);
    expect(pieceField(s, o4 ?? -1, PF.arrivedTurn)).toBe(-1);
    run(s, dragTo(4, 3, 0));
    expect(pieceField(s, o4 ?? -1, PF.arrivedTurn)).toBe(5);
  });

  it('K-25 level 5 (LEVELS §2 Bölüm 5): the four truck blocks of Sağ Oda land in the 5th move, none waits', () => {
    const s = createInitialState(levelFile(5));
    for (const m of HAND[5].slice(0, 5)) run(s, m);
    expect([4, 5, 6, 7].map((id) => at(s, id))).toEqual([
      [Zone.yard, 0, 0],
      [Zone.yard, 0, 2],
      [Zone.yard, 1, 2],
      [Zone.yard, 2, 0],
    ]);
    expect([4, 5, 6, 7].map((id) => pieceField(s, id, PF.arrivedTurn))).toEqual([5, 5, 5, 5]);
    expect(queueIds(s)).toEqual([]);
  });
});
