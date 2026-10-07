import { describe, expect, it } from 'vitest';
import {
  ReachCache,
  carryIds,
  holdableIds,
  pendingCounts,
  purchaseOffered,
  queueEntries,
  slotState,
  turnSummary,
  unlockedNeeded,
} from '../../src/core/summary.ts';
import { neededNow, hasReachableCorrect, quickHoldable } from '../../src/core/deadlock.ts';
import { coverLevel } from '../fixtures/cover.ts';
import { levelHooks } from '../../src/core/obstacles/registry.ts';
import { tryBeginDrag } from '../../src/core/movement.ts';
import { GameSession } from '../../src/core/session.ts';
import { H, setHdr } from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import type { PieceId } from '../../src/core/types.ts';
import { compiledLevel, initialState } from '../fixtures/builders.ts';
import type { LevelSpec } from '../fixtures/builders.ts';
import { dragTo, run } from './moves.fixtures.ts';

/** LEVELS Bölüm 3 (Faz 2R draft): yard 4 × 4, site 2 × 5, wall 4; a D2_0 Y, b D2_0 W under c O4 G; d D2_90 Y. */
const B3: LevelSpec = {
  id: 3,
  difficulty: 'easy',
  yard: { cols: 4, rows: 4 },
  site: { cols: 2, rows: 5 },
  wall: { height: 4 },
  plan: ['YY', 'GG', 'GG', 'YW', 'YW'],
  pieces: [
    ['D2_0', 'Y', 0, 0],
    ['D2_0', 'W', 1, 0],
    ['O4_0', 'G', 0, 2],
    ['D2_90', 'Y', 2, 0],
  ],
};

/** LEVELS Bölüm 9 (Faz 2R draft): no Ağır Yük, crate, bag, chain or debris. */
const B9: LevelSpec = {
  id: 9,
  difficulty: 'normal',
  yard: { cols: 4, rows: 4 },
  site: { cols: 2, rows: 6 },
  wall: { height: 4, gaps: [{ type: 'static', y: 0, size: 1 }] },
  plan: ['RR', 'RR', 'WW', 'WW', 'GG', 'RR'],
  pieces: [
    ['D2_90', 'R', 0, 0],
    ['D2_90', 'G', 2, 0],
    ['O4_0', 'R', 0, 1],
    ['O4_0', 'W', 2, 2],
  ],
};

function pickable(s: GameState): PieceId[] {
  const out: PieceId[] = [];
  const hooks = levelHooks(s.lvl);
  for (let id = 0; id < s.lvl.layout.counts.pieces; id++)
    if (tryBeginDrag(s, id, hooks.drag).ok) out.push(id);
  return out;
}

describe('TECH 2R.15 presentation hooks (TurnSummary)', () => {
  it('K-09 holdable list after every action and delivery: the package summary equals K-09 (a)–(e) of the state after it', () => {
    const game = GameSession.start(
      compiledLevel({
        wall: { height: 2 },
        site: { cols: 2, rows: 1 },
        plan: [['WW'], ['YY']],
        pieces: [
          ['D2_90', 'W', 0, 0],
          ['O4_0', 'Y', 2, 0],
        ],
        batches: [{ forSegment: 1, pieces: [['B1_0', 'R', 4, 8]] }],
      }),
    );
    expect(game.summary().holdable).toEqual(pickable(game.state));
    const yard = game.apply(dragTo(1, 2, 2));
    expect(yard.summary.holdable).toEqual(pickable(game.state));
    const shift = game.apply(dragTo(0, 6, 8)); // segment done → the truck block lands in the same package
    expect(shift.events.map((e) => e.t)).toContain('deliveryArrived');
    expect(shift.summary.holdable).toContain(2);
    expect(shift.summary.holdable).toEqual(pickable(game.state));
    setHdr(game.state, H.movesLeft, 0);
    expect(holdableIds(game.state, game.hooks)).toEqual([]); // (e) the counter
  });

  it('K-09 the µs up-step test never claims a block that the K-08 BFS cannot move (40 seeded boards)', () => {
    for (let n = 1; n <= 40; n++) {
      const s = initialState(coverLevel(n));
      const hooks = levelHooks(s.lvl);
      for (let id = 0; id < s.lvl.layout.counts.pieces; id++)
        if (quickHoldable(s, id, hooks.drag))
          expect(tryBeginDrag(s, id, hooks.drag).ok, `level ${n} piece ${id}`).toBe(true);
      expect(holdableIds(s, hooks)).toEqual(pickable(s));
    }
  });

  it('K-34 hook 5 neededNow ignores access: Bölüm 3 start → {a, b}, both buried (no reachable correct release)', () => {
    const s = initialState(B3);
    expect(neededNow(s)).toEqual([0, 1]);
    expect([hasReachableCorrect(s, 0), hasReachableCorrect(s, 1)]).toEqual([false, false]);
    expect(turnSummary(s, { hooks: levelHooks(s.lvl), undoable: false }).neededNow).toEqual([0, 1]);
  });

  it("K-34 hook 5 unlockedNeeded after dig (GDD Bölüm 3 example): the c shift unlocks a, a's placement unlocks b; hard levels get nothing", () => {
    const game = GameSession.start(compiledLevel(B3));
    const cache = new ReachCache();
    let prev = game.summary();
    expect(unlockedNeeded(null, game.state, cache)).toEqual([]); // level start only primes the cache
    const dig = game.apply(dragTo(2, 1, 2));
    expect(unlockedNeeded(prev, game.state, cache)).toEqual([0]);
    prev = dig.summary;
    game.apply(dragTo(0, 4, 5)); // a over the wall to (4,0)
    expect(unlockedNeeded(prev, game.state, cache)).toEqual([1]);

    const hard = GameSession.start(compiledLevel({ ...B3, difficulty: 'hard' }));
    const hc = new ReachCache();
    unlockedNeeded(null, hard.state, hc);
    hard.apply(dragTo(2, 1, 2));
    expect(unlockedNeeded(null, hard.state, hc)).toEqual([]);
    expect(hc.primed).toBe(false);
  });

  it('K-26 queue entries in FIFO order with shape and colour; pending batches and their blocks for the "+n" badge (UX 5.9)', () => {
    const s = initialState({
      yard: { cols: 2, rows: 2 },
      site: { cols: 2, rows: 1 },
      wall: { height: 1 },
      plan: [['WW'], ['YY']],
      pieces: [
        ['B1_0', 'R', 0, 0],
        ['B1_0', 'R', 1, 0],
        ['D2_90', 'W', 0, 1],
      ],
      batches: [
        {
          forSegment: 1,
          pieces: [
            ['D2_90', 'Y', 0, 2],
            ['B1_0', 'G', 0, 2],
            ['B1_0', 'Y', 1, 2],
          ],
        },
      ],
    });
    expect(pendingCounts(s)).toEqual({ batches: 1, blocks: 3 });
    const r = run(s, dragTo(2, 2, 3)); // segment 0 done; only row 1 is free: the D2_90 Y lands, the others wait
    expect(r.ev.find((e) => e.t === 'deliveryArrived')).toMatchObject({ pieces: [3] });
    expect(queueEntries(s)).toEqual([
      { pieceId: 4, shape: 'B1_0', color: 'G' },
      { pieceId: 5, shape: 'B1_0', color: 'Y' },
    ]);
    expect(pendingCounts(s)).toEqual({ batches: 0, blocks: 0 });
  });

  it('UX 5.9 item 3 carryIds: a yard block bigger than what its colour still needs on the active segment ("next floor")', () => {
    const s = initialState({
      wall: { height: 2 },
      site: { cols: 2, rows: 1 },
      plan: [['GW'], ['GG']],
      pieces: [
        ['B1_0', 'G', 0, 0],
        ['B1_0', 'W', 1, 0],
        ['D2_90', 'G', 2, 0],
      ],
    });
    expect(carryIds(s)).toEqual([2]); // G still needed on segment 0: 1 cell < 2
    run(s, dragTo(0, 6, 8));
    run(s, dragTo(1, 7, 8)); // segment 1 comes
    expect(carryIds(s)).toEqual([]);
  });

  it('K-30 teardown is the last event of the package; the summary describes the state after the Söküm', () => {
    const game = GameSession.start(
      compiledLevel({
        wall: { height: 2 },
        site: { cols: 2, rows: 4 },
        plan: ['WW', 'WW', 'YW', 'YW'],
        pieces: [
          ['D2_0', 'Y', 0, 0],
          ['D2_0', 'W', 1, 0],
          ['O4_0', 'W', 2, 0],
        ],
      }),
    );
    game.apply(dragTo(0, 6, 8));
    const pack = game.apply(dragTo(1, 6, 8));
    expect(pack.teardown).not.toBeNull();
    expect(pack.events.at(-1)).toBe(pack.teardown);
    expect(pack.summary.blocksLeft).toBe(2);
    expect(pack.summary.holdable).toContain(1);
    const ok = game.apply(dragTo(1, 7, 8));
    expect(ok.teardown).toBeNull();
  });

  it('E-61 hammer slot without target in level 9: grey, no "+", no purchase window (K-54); undo becomes a target after a drag', () => {
    const game = GameSession.start(compiledLevel(B9));
    const t0 = game.summary().boosterTargets;
    expect(t0.hammer).toBe(false);
    const hammer = slotState({ unlocked: true, hasTarget: t0.hammer, count: 0 });
    expect(hammer).toBe('noTarget');
    expect(purchaseOffered(hammer)).toBe(false);
    expect(t0.undo).toBe(false);
    const pack = game.apply(dragTo(1, 2, 1));
    expect(pack.summary.boosterTargets.undo).toBe(true);
    expect(pack.summary.boosterTargets.hammer).toBe(false);
  });
});
