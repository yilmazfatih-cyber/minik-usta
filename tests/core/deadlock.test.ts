import { describe, expect, it } from 'vitest';
import {
  D3A_MAX_EXPANSIONS,
  D3A_STATS,
  ANALYTICS_CAUSE,
  anyOneMoveCorrect,
  colorImbalance,
  deadTableFromJson,
  detectDeadlock,
  isFullCover,
  noMoves,
  tileRemaining,
} from '../../src/core/deadlock.ts';
import type { DeadTable } from '../../src/core/deadlock.ts';
import { ArraySink, applyMove } from '../../src/core/moves.ts';
import type { MoveHooks, RuleContext } from '../../src/core/moves.ts';
import { GameSession, levelHash, RULES_VERSION } from '../../src/core/session.ts';
import { blocksLeft } from '../../src/core/goals.ts';
import { hashState } from '../../src/core/hash.ts';
import { stateInvariantErrors } from '../../src/core/grid.ts';
import { mulberry32 } from '../../src/core/rng.ts';
import type { Rng } from '../../src/core/rng.ts';
import { shapeById } from '../../src/core/shapes.ts';
import {
  GF,
  H,
  cloneState,
  createInitialState,
  gapField,
  hasFlag,
  hdr,
  pieceColor,
  pieceShape,
  pieceX,
  pieceY,
  pieceZone,
  setGapField,
  setHdr,
} from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import { COLOR_CODES, Zone } from '../../src/core/types.ts';
import type { ColorCode, Move, ShapeId } from '../../src/core/types.ts';
import { compiledLevel, initialState } from '../fixtures/builders.ts';
import type { LevelSpec, PieceSpec } from '../fixtures/builders.ts';
import { dragTo, expectConsistent, find, run, types } from './moves.fixtures.ts';

/**
 * GDD K-30 "döşeme çıkmazı" example (Ws = 2): plan bottom → top YW, YW, WW, WW; blocks D2_0 Y, D2_0 W, O4 W.
 * Putting D2_0 W on column 0 (x 6) rows 2–3 is correct by K-16, but the O4 W then fits nowhere.
 */
const TILING: LevelSpec = {
  wall: { height: 2 },
  site: { cols: 2, rows: 4 },
  plan: ['WW', 'WW', 'YW', 'YW'],
  pieces: [
    ['D2_0', 'Y', 0, 0],
    ['D2_0', 'W', 1, 0],
    ['O4_0', 'W', 2, 0],
  ],
};

/** The pieces after the dead-end placement, as a teardown would list them. */
function place(s: GameState, id: number): [number, number, number] {
  return [pieceZone(s, id), pieceX(s, id), pieceY(s, id)];
}

describe('K-30 D3a tiling (tileRemaining)', () => {
  it('K-30 D3a detects the GDD tiling dead end; the start state is tileable', () => {
    const s = initialState(TILING);
    expect(isFullCover(s.lvl)).toBe(true);
    expect(tileRemaining(s)).toBe('ok');
    run(s, dragTo(0, 6, 8), { noTruckHelp: true });
    expect(tileRemaining(s)).toBe('ok');
    run(s, dragTo(1, 6, 8), { noTruckHelp: true });
    expect(hasFlag(s, 1, 'locked')).toBe(true); // K-16 correct …
    expect(tileRemaining(s)).toBe('dead'); // … but the O4 W fits nowhere
    expect(D3A_STATS.expansions).toBeLessThanOrEqual(200);
  });

  it('K-30 D3a a block may wait for its neighbour column: C3 over a B1 is tileable (TECH §2R.4 note: the lowest-column shortcut would call it dead)', () => {
    // plan bottom → top: W Y / W W; C3_90 = (0,0)(0,1)(1,1) must wait for the B1 Y under its overhang
    const spec: LevelSpec = {
      wall: { height: 2 },
      site: { cols: 2, rows: 2 },
      plan: ['WW', 'WY'],
      pieces: [
        ['C3_90', 'W', 0, 0],
        ['B1_0', 'Y', 3, 0],
      ],
    };
    const s = initialState(spec);
    expect(tileRemaining(s)).toBe('ok');
    run(s, dragTo(1, 7, 8));
    const last = run(s, dragTo(0, 6, 8));
    expect(last.res.won).toBe(true);
  });

  it('K-30 D3a respects batch availability: an undelivered batch k block only fills segments ≥ k', () => {
    const base: LevelSpec = { wall: { height: 2 }, site: { cols: 2, rows: 1 }, plan: [['WW'], ['YY']] };
    const late = initialState({
      ...base,
      pieces: [
        ['B1_0', 'W', 0, 0],
        ['B1_0', 'Y', 1, 0],
      ],
      batches: [
        {
          forSegment: 1,
          pieces: [
            ['B1_0', 'W', 0, 8],
            ['B1_0', 'Y', 1, 8],
          ],
        },
      ],
    });
    expect(isFullCover(late.lvl)).toBe(true);
    expect(colorImbalance(late)).toBe(-1); // D2 is balanced …
    expect(tileRemaining(late)).toBe('dead'); // … but the second W only comes with segment 1
    const carried = initialState({
      ...base,
      pieces: [
        ['B1_0', 'W', 0, 0],
        ['B1_0', 'W', 1, 0],
        ['B1_0', 'Y', 2, 0],
      ],
      batches: [{ forSegment: 1, pieces: [['B1_0', 'Y', 0, 8]] }],
    });
    expect(tileRemaining(carried)).toBe('ok'); // a Y carried early is fine (LEVELS §2.0 "taşınan malzeme")
  });

  it('K-30 D3a paint joker: a block whose box height fits a W6 gate may take its colour; K-30 W6 level skips D2', () => {
    const gate = { type: 'paint' as const, y: 0, size: 1, color: 'R' as const };
    const flat = initialState({
      wall: { height: 2, gaps: [gate] },
      site: { cols: 2, rows: 2 },
      plan: ['RR', 'RR'],
      pieces: [
        ['D2_90', 'W', 0, 0],
        ['D2_90', 'W', 2, 0],
      ],
    });
    expect(isFullCover(flat.lvl)).toBe(true); // W6: cell totals
    expect(colorImbalance(flat)).toBeGreaterThanOrEqual(0); // D2 would fire …
    expect(detectDeadlock(flat, { table: null })).toBeNull(); // … but W6 skips it; the joker tiles R with W
    expect(tileRemaining(flat)).toBe('ok');
    const tall = initialState({
      wall: { height: 2, gaps: [gate] },
      site: { cols: 2, rows: 2 },
      plan: ['RR', 'RR'],
      pieces: [['O4_0', 'W', 0, 0]],
    });
    expect(tileRemaining(tall)).toBe('dead'); // 2 rows high > gate size 1: no joker
    expect(detectDeadlock(tall, { table: null })).toBe('tiling');
  });

  it('K-30 D3a budget exhaustion is unknown, not dead; the budget is the GDD number 20 000', () => {
    const s = initialState({
      wall: { height: 2 },
      site: { cols: 2, rows: 6 },
      plan: ['WY', 'WW', 'WW', 'WW', 'WW', 'WW'],
      // ten B1 W and a D2_0 Y: the cell totals match, but the single Y cell takes no 2-cell block (found by search)
      pieces: [
        ...Array.from({ length: 10 }, (_, i): PieceSpec => ['B1_0', 'W', i % 6, Math.floor(i / 6)]),
        ['D2_0', 'Y', 0, 3],
      ],
    });
    expect(D3A_MAX_EXPANSIONS).toBe(20_000);
    expect(tileRemaining(s)).toBe('dead');
    expect(D3A_STATS.expansions).toBeGreaterThan(1);
    expect(tileRemaining(s, 1)).toBe('unknown');
    expect(D3A_STATS.expansions).toBe(1);
  });

  it('K-30 D3a equals an independent oracle (every exact cover, then a bottom-up build order = an acyclic "under" graph) on 400 seeded plans', () => {
    const rng = mulberry32(2026);
    let dead = 0;
    for (let n = 0; n < 400; n++) {
      const { spec, plan, blocks } = randomTiling(rng);
      const s = initialState(spec);
      const want = oracle(plan, blocks) ? 'ok' : 'dead';
      expect(tileRemaining(s), `case ${n}: ${JSON.stringify({ plan, blocks })}`).toBe(want);
      if (want === 'dead') dead++;
    }
    expect(dead).toBeGreaterThan(20);
    expect(dead).toBeLessThan(380);
  });
});

describe('K-30 Söküm (teardown)', () => {
  it('K-30 teardown restores the pre-action state except moves left and moves spent; c = 0; it is the last event (GDD example)', () => {
    const s = initialState(TILING);
    run(s, dragTo(0, 6, 8));
    expect([hdr(s, H.combo), hdr(s, H.movesSpent)]).toEqual([1, 1]);
    const pre = s.buf.slice();
    const r = run(s, dragTo(1, 6, 8));
    expect(r.res).toEqual({
      status: 'applied',
      reason: null,
      won: false,
      outOfMoves: false,
      teardownCause: 'tiling',
    });
    expect(r.ev.at(-1)).toEqual({
      seq: r.ev.length - 1,
      step: 12,
      t: 'teardown',
      toTurn: 1,
      cause: 'tiling',
      pieces: [{ pieceId: 1, from: { zone: 'site', x: 6, y: 2, seg: 0 }, to: { zone: 'yard', x: 1, y: 0 } }],
    });
    expect(types(r.ev)).toContain('placementCorrect');
    expect(place(s, 1)).toEqual([Zone.yard, 1, 0]);
    // every field but the counter, movesSpent and the streak is the pre-action value
    const fields = [H.movesLeft, H.movesSpent, H.combo];
    s.buf.forEach((v, i) => {
      if (!fields.includes(i as 1 | 2 | 17)) expect(v, `word ${i}`).toBe(pre[i]);
    });
    expect([hdr(s, H.turn), hdr(s, H.movesLeft), hdr(s, H.movesSpent), hdr(s, H.combo)]).toEqual([
      1, 18, 2, 0,
    ]);
    expect(ANALYTICS_CAUSE[r.res.teardownCause ?? 'color']).toBe('tiling');
    expectConsistent(s);
  });

  it('E-26 the last 1×1 W cell with only a 2-cell W block left is a tiling dead end → Söküm takes the last placement back (no refund)', () => {
    // plan bottom → top: W W / W Y; blocks D2_0 W, B1 W, B1 Y. A B1 W on (6,0) leaves (6,1) + (7,0) for the D2_0 W
    const s = initialState({
      wall: { height: 2 },
      site: { cols: 2, rows: 2 },
      plan: ['WY', 'WW'],
      pieces: [
        ['D2_0', 'W', 0, 0],
        ['B1_0', 'W', 2, 0],
        ['B1_0', 'Y', 3, 0],
      ],
    });
    const r = run(s, dragTo(1, 6, 8));
    expect(find(r.ev, 'teardown')).toMatchObject({ cause: 'tiling', toTurn: 0 });
    expect([place(s, 1), hdr(s, H.movesLeft), hdr(s, H.movesSpent)]).toEqual([[Zone.yard, 2, 0], 19, 1]);
    expect(blocksLeft(s)).toBe(3);
  });

  it('K-30 step 12 runs at zero moves before the offer window; E13 out-of-moves offer only after deadlock check (E-58)', () => {
    const lvl = compiledLevel(TILING);
    const game = GameSession.start(lvl);
    game.commit(dragTo(0, 6, 8));
    setHdr(game.state, H.movesLeft, 1);
    const pack = game.apply(dragTo(1, 6, 8));
    expect([pack.status, pack.outOfMoves, pack.teardownCause]).toEqual(['applied', true, 'tiling']);
    expect(types(pack.events).slice(-2)).toEqual(['outOfMoves', 'teardown']);
    expect(pack.teardown).toMatchObject({ t: 'teardown', cause: 'tiling', step: 12 });
    expect(game.outcome).toBe('outOfMoves');
    expect([game.movesLeft, game.movesSpent, game.movesMade]).toEqual([0, 2, 1]);
    // the window shows the post-Söküm board: the torn-down block counts again
    expect(pack.summary.blocksLeft).toBe(2);
    expect(game.nextOffer()).toEqual({ n: 1, adAllowed: true });
  });

  it('E-37 undo after teardown returns the move: the counter comes back, movesSpent drops by 1 (GDD K-30 "Geri Al ile")', () => {
    const game = GameSession.start(compiledLevel(TILING));
    game.commit(dragTo(0, 6, 8));
    const before = game.state.buf.slice();
    const r = game.commit(dragTo(1, 6, 8));
    expect(r.teardownCause).toBe('tiling');
    expect([game.movesLeft, game.movesSpent]).toEqual([18, 2]);
    expect(game.undo()).toBe(true);
    expect(game.state.buf).toEqual(before);
    expect([game.movesLeft, game.movesSpent, game.movesMade]).toEqual([19, 1, 1]);
    // E-37: the same placement goes to the same Söküm again
    expect(game.commit(dragTo(1, 6, 8)).teardownCause).toBe('tiling');
  });

  it('K-43 exit penalty uses movesSpent: a move taken back by a Söküm still makes the exit a loss (GDD K-43 example)', () => {
    const undone = GameSession.start(compiledLevel(TILING));
    undone.commit(dragTo(0, 6, 8));
    undone.undo(); // K-39: movesSpent back to 0
    expect(undone.exit()).toMatchObject({ kind: 'free', movesMade: 0, movesSpent: 0 });
    const torn = GameSession.start(compiledLevel(E26));
    expect(torn.commit(dragTo(1, 6, 8)).teardownCause).toBe('tiling'); // m back to 0 …
    expect([torn.movesMade, torn.movesSpent]).toEqual([0, 1]); // … movesSpent stays 1
    expect(torn.exit()).toMatchObject({ kind: 'loss', movesMade: 0, movesSpent: 1 });
  });

  it('E-48 teardown undoes the segment shift and the delivery: the segment comes back, the batch is pending again (D3b table cause)', () => {
    const lvl = compiledLevel({
      wall: { height: 2 },
      site: { cols: 2, rows: 1 },
      plan: [['WW'], ['YY']],
      pieces: [['D2_90', 'W', 0, 0]],
      batches: [{ forSegment: 1, pieces: [['D2_90', 'Y', 2, 8]] }],
    });
    const probe = createInitialState(lvl);
    applyMove(probe, dragTo(0, 6, 8), undefined, { noTruckHelp: true });
    expect([hdr(probe, H.activeSeg), pieceZone(probe, 1)]).toEqual([1, Zone.yard]);
    const table = tableOf(probe);
    const s = createInitialState(lvl);
    const pre = s.buf.slice();
    const sink = new ArraySink();
    const res = applyMove(s, dragTo(0, 6, 8), sink, { deadTable: table });
    expect(res.teardownCause).toBe('access');
    expect(types(sink.events)).toEqual(
      expect.arrayContaining(['segmentCompleted', 'siteShifted', 'deliveryArrived', 'teardown']),
    );
    expect(sink.events.at(-1)).toMatchObject({
      t: 'teardown',
      cause: 'access',
      pieces: [
        { pieceId: 0, from: { zone: 'site', x: 6, y: 0, seg: 0 }, to: { zone: 'yard', x: 0, y: 0 } },
        { pieceId: 1, from: { zone: 'yard' }, to: 'pending' },
      ],
    });
    expect([hdr(s, H.activeSeg), hdr(s, H.deliveryCursor), pieceZone(s, 1)]).toEqual([0, 0, Zone.pending]);
    s.buf.forEach((v, i) => {
      if (i !== H.movesLeft && i !== H.movesSpent) expect(v, `word ${i}`).toBe(pre[i]);
    });
  });

  it('E-59 teardown restores the shutter phase: m 3 → 4 opens the shutter, the Söküm takes m back to 3 and closes it', () => {
    const spec: LevelSpec = {
      ...TILING,
      wall: { height: 4, gaps: [{ type: 'shutter', y: 0, size: 1, period: 2, phase: 0 }] },
    };
    const lvl = compiledLevel(spec);
    const hooks: MoveHooks = { timers: { W4: shutterTick, 'K-40': () => undefined } };
    const s = createInitialState(lvl);
    run(s, dragTo(0, 6, 8), { hooks }); // m 1
    run(s, dragTo(2, 2, 2), { hooks }); // m 2 (yard)
    run(s, dragTo(2, 2, 0), { hooks }); // m 3 (yard)
    expect([hdr(s, H.turn), gapField(s, 0, GF.open)]).toEqual([3, 0]); // ⌊3/2⌋ odd → closed
    const pre = s.buf.slice();
    const r = run(s, dragTo(1, 6, 8), { hooks });
    expect(find(r.ev, 'gapChanged')).toMatchObject({ step: 10, open: true }); // m 4 → open …
    expect(r.res.teardownCause).toBe('tiling');
    expect([hdr(s, H.turn), gapField(s, 0, GF.open)]).toEqual([3, 0]); // … and closed again after the Söküm
    s.buf.forEach((v, i) => {
      if (i !== H.movesLeft && i !== H.movesSpent && i !== H.combo) expect(v, `word ${i}`).toBe(pre[i]);
    });
    expect([hdr(s, H.movesLeft), hdr(s, H.movesSpent)]).toEqual([16, 4]);
  });

  it('K-30 teardown after a booster keeps the inventory spent: the hammer stays applied (meta spends it), the board comes back (D3b table)', () => {
    const lvl = compiledLevel({
      wall: { height: 2 },
      site: { cols: 2, rows: 2 },
      plan: ['RR', 'RR'],
      pieces: [
        ['O4_0', 'R', 0, 0],
        ['Q9_0', 'W', 0, 2],
      ],
    });
    const probe = createInitialState(lvl);
    applyMove(probe, { kind: 'hammer', target: { pieceId: 1 } }, undefined, { noTruckHelp: true });
    expect(pieceZone(probe, 1)).toBe(Zone.gone);
    const s = createInitialState(lvl);
    const pre = s.buf.slice();
    const sink = new ArraySink();
    const res = applyMove(s, { kind: 'hammer', target: { pieceId: 1 } }, sink, { deadTable: tableOf(probe) });
    expect([res.status, res.teardownCause]).toEqual(['applied', 'access']);
    expect(types(sink.events)).toEqual(['boosterApplied', 'cargoSmashed', 'teardown']);
    expect(s.buf).toEqual(pre); // a booster spends no move: the whole buffer is back
    expect(pieceZone(s, 1)).toBe(Zone.yard);
  });

  it('K-30 table is ignored on levelHash mismatch (and on another rules version); a matching table answers by Zobrist hash', () => {
    const lvl = compiledLevel(TILING);
    const s = createInitialState(lvl);
    const h = hashState(s);
    const entry = (h[1] ?? 0).toString(16).padStart(8, '0') + (h[0] ?? 0).toString(16).padStart(8, '0');
    const json = {
      levelHash: levelHash(lvl.data),
      rulesVersion: RULES_VERSION,
      complete: true,
      entries: [entry],
    };
    const table = deadTableFromJson(json, { levelHash: levelHash(lvl.data), rulesVersion: RULES_VERSION });
    expect(table?.has(h[0] ?? 0, h[1] ?? 0)).toBe(true);
    expect(table?.has((h[0] ?? 0) ^ 1, h[1] ?? 0)).toBe(false);
    expect(detectDeadlock(s, { table })).toBe('access');
    expect(
      deadTableFromJson(json, { levelHash: '0000000000000000', rulesVersion: RULES_VERSION }),
    ).toBeNull();
    expect(
      deadTableFromJson(json, { levelHash: levelHash(lvl.data), rulesVersion: RULES_VERSION + 1 }),
    ).toBeNull();
  });
});

describe('K-30 D1 no moves, K-29 after +5', () => {
  /** Yard 5 × 4: four blocks under an I5 Ağır Yük, crates on top of it; two free blocks on the top row. Plan 2 × 4 W. */
  const JAM: LevelSpec = {
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
  };

  it('K-30 D1 reshuffles a jammed yard (crates stay, shapes, colours and count kept) so one drag move places a block correctly', () => {
    const s = initialState(JAM);
    expect(isFullCover(s.lvl)).toBe(true);
    run(s, dragTo(5, 5, 4));
    expect(noMoves(s)).toBe(false);
    const before = [0, 1, 2, 3, 4].map((id) => [pieceShape(s, id), pieceColor(s, id)]);
    const r = run(s, dragTo(6, 5, 4));
    expect(find(r.ev, 'deadlockDetected')).toMatchObject({ reason: 'noMoves', step: 12 });
    const help = find(r.ev, 'truckHelp');
    expect(help.kind).toBe('reshuffle');
    expect((help.moves ?? []).length).toBeGreaterThan(0);
    expect(noMoves(s)).toBe(false);
    expect(anyOneMoveCorrect(s)).toBe(true);
    expect([0, 1, 2, 3, 4].map((id) => [pieceShape(s, id), pieceColor(s, id)])).toEqual(before);
    expect([0, 1, 2, 3, 4].every((id) => pieceZone(s, id) === Zone.yard)).toBe(true);
    expect(stateInvariantErrors(s)).toEqual([]);
  });

  it('K-30 D1 removes chains first: two chained blocks touching each other are freed by the truck help (Y3), no reshuffle', () => {
    const s = initialState({
      wall: { height: 2 },
      site: { cols: 2, rows: 2 },
      plan: ['WW', 'WW'],
      pieces: [
        ['B1_0', 'W', 0, 0, ['chained']],
        ['B1_0', 'W', 1, 0, ['chained']],
        ['D2_0', 'W', 4, 0],
      ],
    });
    const r = run(s, dragTo(2, 6, 8));
    expect(types(r.ev).slice(-4)).toEqual([
      'deadlockDetected',
      'chainReleased',
      'chainReleased',
      'truckHelp',
    ]);
    expect(find(r.ev, 'truckHelp').kind).toBe('unchain');
    expect([hasFlag(s, 0, 'chained'), hasFlag(s, 1, 'chained')]).toEqual([false, false]);
  });

  it('K-30 D1 not run at zero moves; K-29 after +5 only D1 runs once (E-42)', () => {
    const lvl = compiledLevel({ ...JAM, moves: 2 });
    const game = GameSession.start(lvl);
    game.commit(dragTo(5, 5, 4));
    const last = game.apply(dragTo(6, 5, 4)); // counter 0 → no D1 help
    expect(last.outOfMoves).toBe(true);
    expect(types(last.events)).not.toContain('truckHelp');
    expect(noMoves(game.state, game.hooks.drag)).toBe(true);
    expect(last.summary.holdable).toEqual([]);
    const offer = game.apply({ kind: 'addMoves', amount: 5, source: 'offerCoins' });
    expect(offer.events.map((e) => [e.t, e.step])).toEqual([
      ['movesChanged', 1],
      ['deadlockDetected', 12],
      ['truckHelp', 12],
    ]);
    expect(offer.summary.holdable.length).toBeGreaterThan(0);
    expect([game.movesLeft, game.movesMade, game.movesSpent]).toEqual([5, 2, 2]);
  });
});

// --- helpers -------------------------------------------------------------------------------------------------------

const E26: LevelSpec = {
  wall: { height: 2 },
  site: { cols: 2, rows: 2 },
  plan: ['WY', 'WW'],
  pieces: [
    ['D2_0', 'W', 0, 0],
    ['B1_0', 'W', 2, 0],
    ['B1_0', 'Y', 3, 0],
  ],
};

/** W4-like step-10 hook for the test: open ⇔ ⌊(m + phase) / period⌋ even (OBSTACLES W4); emits gapChanged. */
function shutterTick(ctx: RuleContext): void {
  ctx.lvl.gaps.forEach((g, i) => {
    if (g.type !== 'shutter') return;
    const open = Math.floor((hdr(ctx.s, H.turn) + g.phase) / g.period) % 2 === 0 ? 1 : 0;
    if (gapField(ctx.s, i, GF.open) !== open) {
      setGapField(ctx.s, i, GF.open, open);
      ctx.emit({ t: 'gapChanged', gap: i, open: open === 1, y: g.y });
    }
  });
}

/** A one-entry D3b table holding the state `s`. */
function tableOf(s: GameState): DeadTable {
  const h = hashState(cloneState(s));
  const lo = h[0] ?? 0;
  const hi = h[1] ?? 0;
  return { complete: true, has: (a, b) => a >>> 0 === lo >>> 0 && b >>> 0 === hi >>> 0 };
}

// --- the D3a oracle --------------------------------------------------------------------------------------------------

const ORACLE_SHAPES: readonly ShapeId[] = [
  'B1_0',
  'D2_0',
  'D2_90',
  'O4_0',
  'C3_0',
  'C3_90',
  'C3_180',
  'C3_270',
];
const ORACLE_COLORS: readonly ColorCode[] = ['W', 'Y'];

interface OracleBlock {
  readonly shape: ShapeId;
  readonly color: ColorCode;
}

/**
 * A random 2-wide plan (2–4 rows) painted from a random exact cover; then, half of the time, one block's colour or
 * shape is perturbed (a dead case is likely, but the oracle decides).
 */
function randomTiling(rng: Rng): { spec: LevelSpec; plan: ColorCode[][]; blocks: OracleBlock[] } {
  const hs = 2 + rng.nextInt(3);
  const plan: ColorCode[][] = Array.from({ length: hs }, () => ['W', 'W']);
  const covered: boolean[][] = Array.from({ length: hs }, () => [false, false]);
  const blocks: OracleBlock[] = [];
  for (let guard = 0; guard < 40; guard++) {
    let cell: [number, number] | null = null;
    for (let y = 0; y < hs && !cell; y++)
      for (let x = 0; x < 2 && !cell; x++) if (!covered[y]?.[x]) cell = [x, y];
    if (!cell) break;
    const [cx, cy] = cell;
    const fits: { shape: ShapeId; ax: number; ay: number }[] = [];
    for (const id of ORACLE_SHAPES) {
      const sh = shapeById(id);
      for (const c of sh.cells) {
        const ax = cx - c.x;
        const ay = cy - c.y;
        const ok = sh.cells.every((d) => {
          const x = ax + d.x;
          const y = ay + d.y;
          return x >= 0 && x < 2 && y >= 0 && y < hs && !covered[y]?.[x];
        });
        if (ok) fits.push({ shape: id, ax, ay });
      }
    }
    const pick = fits[rng.nextInt(fits.length)] ?? { shape: 'B1_0' as ShapeId, ax: cx, ay: cy };
    const color = ORACLE_COLORS[rng.nextInt(2)] ?? 'W';
    for (const d of shapeById(pick.shape).cells) {
      const row = plan[pick.ay + d.y];
      const cov = covered[pick.ay + d.y];
      if (row) row[pick.ax + d.x] = color;
      if (cov) cov[pick.ax + d.x] = true;
    }
    blocks.push({ shape: pick.shape, color });
  }
  if (rng.next() < 0.5 && blocks.length > 0) {
    const i = rng.nextInt(blocks.length);
    const b = blocks[i];
    if (b) {
      const twin = ORACLE_SHAPES.filter((id) => shapeById(id).cellCount === shapeById(b.shape).cellCount);
      blocks[i] =
        rng.next() < 0.5
          ? { shape: b.shape, color: b.color === 'W' ? 'Y' : 'W' }
          : { shape: twin[rng.nextInt(twin.length)] ?? b.shape, color: b.color };
    }
  }
  // the blocks wait in a 6 × 8 yard, one per 2 × 2 slot
  const pieces: PieceSpec[] = blocks.map((b, i) => [b.shape, b.color, (i % 3) * 2, Math.floor(i / 3) * 2]);
  const spec: LevelSpec = {
    wall: { height: 2 },
    site: { cols: 2, rows: hs },
    plan: plan.map((r) => r.join('')).reverse(),
    pieces,
  };
  return { spec, plan, blocks };
}

/** Every exact cover of the plan by the blocks (colours matching), then K-34: the "sits on" graph has no cycle. */
function oracle(plan: readonly ColorCode[][], blocks: readonly OracleBlock[]): boolean {
  const hs = plan.length;
  const owner: number[][] = Array.from({ length: hs }, () => [-1, -1]);
  const used = blocks.map(() => false);
  const placed: { block: number; ax: number; ay: number }[] = [];
  const firstFree = (): [number, number] | null => {
    for (let y = 0; y < hs; y++) for (let x = 0; x < 2; x++) if ((owner[y]?.[x] ?? 0) < 0) return [x, y];
    return null;
  };
  const buildable = (): boolean => {
    // edge a → b: a covers the cell right under b's bottom cell of some column
    const n = placed.length;
    const deps: number[][] = Array.from({ length: n }, () => []);
    placed.forEach((p, i) => {
      const sh = shapeById(blocks[p.block]?.shape ?? 'B1_0');
      for (let c = 0; c < sh.w; c++) {
        const y = p.ay + (sh.colBottom[c] ?? 0) - 1;
        if (y < 0) continue;
        const o = owner[y]?.[p.ax + c] ?? -1;
        const j = placed.findIndex((q) => q.block === o);
        if (j >= 0) deps[i]?.push(j);
      }
    });
    const state = new Array<number>(n).fill(0);
    const cyclic = (i: number): boolean => {
      if (state[i] === 1) return true;
      if (state[i] === 2) return false;
      state[i] = 1;
      for (const j of deps[i] ?? []) if (cyclic(j)) return true;
      state[i] = 2;
      return false;
    };
    for (let i = 0; i < n; i++) if (cyclic(i)) return false;
    return true;
  };
  const search = (): boolean => {
    const cell = firstFree();
    if (!cell) return used.every(Boolean) && buildable();
    const [cx, cy] = cell;
    for (let b = 0; b < blocks.length; b++) {
      if (used[b]) continue;
      const blk = blocks[b];
      if (!blk) continue;
      const sh = shapeById(blk.shape);
      for (const c of sh.cells) {
        const ax = cx - c.x;
        const ay = cy - c.y;
        const ok = sh.cells.every((d) => {
          const x = ax + d.x;
          const y = ay + d.y;
          return (
            x >= 0 && x < 2 && y >= 0 && y < hs && (owner[y]?.[x] ?? 0) < 0 && plan[y]?.[x] === blk.color
          );
        });
        if (!ok) continue;
        for (const d of sh.cells) {
          const row = owner[ay + d.y];
          if (row) row[ax + d.x] = b;
        }
        used[b] = true;
        placed.push({ block: b, ax, ay });
        const found = search();
        placed.pop();
        used[b] = false;
        for (const d of sh.cells) {
          const row = owner[ay + d.y];
          if (row) row[ax + d.x] = -1;
        }
        if (found) return true;
      }
    }
    return false;
  };
  return search();
}

/** Keep the colour list import used (debug output of failing oracle cases). */
export const ORACLE_PALETTE = COLOR_CODES.filter((c) => ORACLE_COLORS.includes(c));
export type { Move };
