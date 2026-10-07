import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/core/session.ts';
import { ArraySink } from '../../src/core/moves.ts';
import {
  blocksLeft,
  isMaterial,
  levelGoalsMet,
  materialLeft,
  remainingDemandByColor,
  remainingSupplyByColor,
} from '../../src/core/goals.ts';
import { isFullCover, tileRemaining } from '../../src/core/deadlock.ts';
import {
  craneSelectable,
  craneSiteSpots,
  hammerTargets,
  paintPartners,
  trowelPieces,
  trowelSpots,
} from '../../src/core/boosters.ts';
import { tryBeginDrag } from '../../src/core/movement.ts';
import { stateInvariantErrors } from '../../src/core/grid.ts';
import { mulberry32 } from '../../src/core/rng.ts';
import type { Rng } from '../../src/core/rng.ts';
import {
  FLAG_BIT,
  H,
  goalValue,
  hasFlag,
  hdr,
  pieceFlags,
  pieceShape,
  pieceX,
  pieceY,
  pieceZone,
} from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import { shapeByIndex } from '../../src/core/shapes.ts';
import { Zone } from '../../src/core/types.ts';
import type { Move, PieceId } from '../../src/core/types.ts';
import { compiledLevel, initialState } from '../fixtures/builders.ts';
import type { LevelSpec } from '../fixtures/builders.ts';
import { coverLevel } from '../fixtures/cover.ts';
import { dragTo, expectConsistent, find, run, types } from './moves.fixtures.ts';

const sum = (a: readonly number[]): number => a.reduce((x, y) => x + y, 0);

describe('K-47 full cover: compile totals', () => {
  it('K-47 compile: supply and demand per colour, per segment and per batch (debris in its segment, Ağır Yük excluded), N', () => {
    const lvl = compiledLevel({
      plan: [['WY', 'WW'], ['YY']],
      pieces: [
        ['O4_0', 'W', 0, 0],
        ['B1_0', 'Y', 2, 0],
        ['Q9_0', 'R', 3, 0],
      ],
      batches: [{ forSegment: 1, pieces: [['B1_0', 'Y', 0, 8]] }],
      debris: [['B1_0', 'W', 7, 0, 1]],
    });
    // plan: segment 0 W 3 + Y 1, segment 1 Y 2
    expect(lvl.demandBySegment.map((r) => [r[0], r[1]])).toEqual([
      [3, 1],
      [0, 2],
    ]);
    expect([lvl.demand[0], lvl.demand[1]]).toEqual([3, 3]);
    // supply: O4 W 4, B1 Y, truck B1 Y, debris B1 W (segment 1 → batch row 1); Q9 is cargo
    expect([lvl.supply[0], lvl.supply[1], lvl.supply[3]]).toEqual([5, 2, 0]);
    expect(lvl.supplyByBatch.map((r) => [r[0], r[1]])).toEqual([
      [4, 1],
      [1, 1],
    ]);
    expect(lvl.materialCount).toBe(4);
    expect(isFullCover(lvl)).toBe(false); // W 5 ≠ 3, Y 2 ≠ 3
  });

  it('K-44 an Ağır Yük (I5, Q9) is cargo: colourless (−1 whatever the data colour), never supply, demand or blocks left', () => {
    const lvl = compiledLevel({
      plan: ['WW'],
      pieces: [
        ['D2_90', 'W', 0, 0],
        ['I5_0', 'Y', 0, 1],
        ['Q9_0', 'G', 0, 2],
      ],
    });
    expect(lvl.pieces.map((p) => [p.cls, p.colorIndex])).toEqual([
      ['material', 0],
      ['cargo', -1],
      ['cargo', -1],
    ]);
    expect(isFullCover(lvl)).toBe(true);
    const s = initialState({
      plan: ['WW'],
      pieces: [
        ['D2_90', 'W', 0, 0],
        ['I5_0', 'Y', 0, 1],
        ['Q9_0', 'G', 0, 2],
      ],
    });
    expect([isMaterial(s, 0), isMaterial(s, 1), isMaterial(s, 2)]).toEqual([true, false, false]);
    expect(blocksLeft(s)).toBe(1);
    expect(sum(remainingSupplyByColor(s))).toBe(2);
  });
});

describe('K-48 win: full use', () => {
  it('K-48 GDD test fixture (bozuk veri): the plan is complete but a B1 is left in the yard → not won', () => {
    const s = initialState({
      wall: { height: 2 },
      plan: ['WW'],
      pieces: [
        ['D2_90', 'W', 0, 0],
        ['B1_0', 'W', 3, 0],
      ],
    });
    const r = run(s, dragTo(0, 6, 8));
    expect(find(r.ev, 'segmentCompleted').seg).toBe(0);
    expect(r.res.won).toBe(false);
    expect([materialLeft(s), levelGoalsMet(s)]).toEqual([true, false]);
  });

  it('E-49 the last segment completes with an Ağır Yük and two crates left in the yard: won (K-28, K-48)', () => {
    const s = initialState({
      wall: { height: 2 },
      plan: ['WW'],
      pieces: [
        ['D2_90', 'W', 0, 0],
        ['Q9_0', 'W', 2, 0],
      ],
      obstacles: [
        { type: 'crate', x: 5, y: 0, hp: 1 },
        { type: 'crate', x: 5, y: 1, hp: 2 },
      ],
    });
    const r = run(s, dragTo(0, 6, 8));
    expect(r.res).toEqual({ status: 'applied', reason: null, won: true, outOfMoves: false });
    expect(find(r.ev, 'levelWon').step).toBe(11);
    expect(pieceZone(s, 1)).toBe(Zone.yard);
  });

  it('K-48 blocks-left chip equals N minus correct: −1 per correct placement, unchanged by yard moves and wrong drops, 0 ⇔ every segment complete', () => {
    const s = initialState({
      wall: { height: 2 },
      plan: ['YY', 'WW'],
      pieces: [
        ['D2_90', 'W', 0, 0],
        ['B1_0', 'Y', 2, 0],
        ['B1_0', 'Y', 3, 0],
      ],
    });
    expect(blocksLeft(s)).toBe(3);
    run(s, dragTo(1, 1, 3)); // yard move
    expect(blocksLeft(s)).toBe(3);
    run(s, dragTo(1, 6, 8)); // Y on W: wrong, bounces
    expect(blocksLeft(s)).toBe(3);
    run(s, dragTo(0, 6, 8));
    expect(blocksLeft(s)).toBe(2);
    run(s, dragTo(1, 6, 8));
    run(s, dragTo(2, 7, 8));
    expect([blocksLeft(s), levelGoalsMet(s)]).toEqual([0, true]);
  });
});

describe('K-41 S4 debris (Faz 2R: a coloured material block)', () => {
  const DEBRIS: LevelSpec = {
    wall: { height: 2 },
    plan: ['WR', 'RR'],
    pieces: [
      ['D2_90', 'R', 0, 0],
      ['B1_0', 'W', 2, 0],
    ],
    debris: [['B1_0', 'R', 6, 1]],
    goals: [{ type: 'build' }, { type: 'clear', target: 'debris', count: 1 }],
  };

  it('E-44 K-47 debris is supply; once it leaves its start spot it counts once (K-41), loses the debris flag and is placed like any block', () => {
    const s = initialState(DEBRIS);
    const debris = 2;
    expect(isFullCover(s.lvl)).toBe(true);
    expect(remainingSupplyByColor(s)).toEqual(remainingDemandByColor(s));
    const lift = run(s, dragTo(debris, 3, 0)); // to the yard
    expect(find(lift.ev, 'goalProgress')).toMatchObject({ goal: 1, value: 1, step: 7 });
    expect([pieceZone(s, debris), hasFlag(s, debris, 'debris')]).toEqual([Zone.yard, false]);
    run(s, dragTo(0, 6, 8)); // R R on row 0
    const placed = run(s, dragTo(debris, 7, 8)); // R on (7,1): correct
    expect(types(placed.ev)).toContain('placementCorrect');
    expect(goalValue(s, 1)).toBe(1); // counted once
    run(s, dragTo(1, 6, 8));
    expect(levelGoalsMet(s)).toBe(true);
  });

  it('K-41 a debris placed correctly elsewhere on the site counts in that move and locks (no yard trip)', () => {
    const s = initialState({
      ...DEBRIS,
      pieces: [
        ['B1_0', 'R', 0, 0],
        ['B1_0', 'R', 1, 0],
        ['B1_0', 'W', 2, 0],
      ],
    });
    const debris = 3;
    expect(isFullCover(s.lvl)).toBe(true);
    run(s, dragTo(0, 7, 8)); // R on (7,0)
    const r = run(s, dragTo(debris, 7, 8)); // the debris itself, from (6,1) over to (7,1): correct
    expect(find(r.ev, 'placementCorrect').pieceId).toBe(debris);
    expect(goalValue(s, 1)).toBe(1);
    expect((pieceFlags(s, debris) & (FLAG_BIT.debris | FLAG_BIT.locked)) === FLAG_BIT.locked).toBe(true);
    run(s, dragTo(1, 6, 8));
    expect(run(s, dragTo(2, 6, 8)).res.won).toBe(true);
    expectConsistent(s);
  });
});

// --- K-47 conservation: seeded random play -------------------------------------------------------------------------

/** One random action of the session; returns false when nothing could be done. */
function randomAction(game: GameSession, rng: Rng): { kind: string; applied: boolean; teardown: boolean } {
  const s = game.state;
  const hooks = game.hooks;
  const roll = rng.next();
  if (roll < 0.06 && game.canUndo()) return { kind: 'undo', applied: game.undo(), teardown: false };
  let move: Move | null = null;
  if (roll < 0.14) {
    const targets = hammerTargets(s, hooks);
    const t = targets[rng.nextInt(Math.max(1, targets.length))];
    if (t) move = { kind: 'hammer', target: t };
  } else if (roll < 0.22) {
    const P = s.lvl.layout.counts.pieces;
    const ids = Array.from({ length: P }, (_, i) => i).filter((id) => craneSelectable(s, id, hooks));
    const id = ids[rng.nextInt(Math.max(1, ids.length))];
    if (id !== undefined) {
      const spots = craneSiteSpots(s, id);
      const spot = spots[rng.nextInt(Math.max(1, spots.length))];
      if (spot && rng.next() < 0.6)
        move = {
          kind: 'crane',
          pieceId: id,
          to: { zone: 'site', x: spot.at.ix, y: spot.at.iy },
          rotation: spot.rotation,
        };
      else {
        const shape = shapeByIndex(pieceShape(s, id));
        move = {
          kind: 'crane',
          pieceId: id,
          to: {
            zone: 'yard',
            x: rng.nextInt(s.lvl.geo.wy - shape.w + 1),
            y: rng.nextInt(s.lvl.geo.hy - shape.h + 1),
          },
          rotation: shape.rotation,
        };
      }
    }
  } else if (roll < 0.28) {
    const P = s.lvl.layout.counts.pieces;
    const a = rng.nextInt(P);
    const bs = paintPartners(s, a);
    const b = bs[rng.nextInt(Math.max(1, bs.length))];
    if (b !== undefined) move = { kind: 'paint', a, b };
  } else if (roll < 0.36) {
    const ids = trowelPieces(s, hooks);
    const id = ids[rng.nextInt(Math.max(1, ids.length))];
    if (id !== undefined) {
      const spots = trowelSpots(s, id);
      const at = spots[rng.nextInt(Math.max(1, spots.length))];
      if (at) move = { kind: 'goldTrowel', pieceId: id, x: at.ix, y: at.iy };
    }
  }
  if (move === null) {
    const P = s.lvl.layout.counts.pieces;
    const start = rng.nextInt(P);
    for (let k = 0; k < P && move === null; k++) {
      const id = (start + k) % P;
      const z = pieceZone(s, id);
      if (z !== Zone.yard && z !== Zone.site) continue;
      const a = tryBeginDrag(s, id, hooks.drag);
      if (!a.ok) continue;
      const nodes = a.session.reachableNodes();
      // favour site releases so the plan fills
      const site = nodes.filter((n) => n.ix >= s.lvl.geo.siteX);
      const pool = site.length > 0 && rng.next() < 0.6 ? site : nodes;
      const to = pool[rng.nextInt(pool.length)];
      if (to) move = { kind: 'drag', pieceId: id, to };
    }
  }
  if (move === null) return { kind: 'none', applied: false, teardown: false };
  const res = game.commit(move, new ArraySink());
  return { kind: move.kind, applied: res.status === 'applied', teardown: res.teardownCause !== undefined };
}

function expectConserved(s: GameState, where: string): void {
  const sup = remainingSupplyByColor(s);
  const dem = remainingDemandByColor(s);
  expect(sum(sup), `${where}: Σ supply = Σ demand`).toBe(sum(dem));
  expect(sup, `${where}: per colour`).toEqual(dem);
}

const LEVELS = Number(process.env.K47_LEVELS ?? 20);
const SEEDS = Number(process.env.K47_SEEDS ?? 500);

describe('K-47 conservation (GDD K-47 item 5; TECH §2R.2)', () => {
  it('K-47 the generated levels are full covers with a tiling at the start', () => {
    for (let n = 1; n <= LEVELS; n++) {
      const s = initialState(coverLevel(n));
      expect(isFullCover(s.lvl), `level ${n}`).toBe(true);
      expect(tileRemaining(s), `level ${n}`).toBe('ok');
      expect(stateInvariantErrors(s), `level ${n}`).toEqual([]);
    }
  });

  it(`K-47 conservation: ${LEVELS} levels × ${SEEDS} seeded action sequences (drags, hammer, crane, paint brush, Golden Trowel, Undo, +5): remaining supply = remaining demand per colour at every step; K-47 boosters never create a D3a dead end`, () => {
    let actions = 0;
    let boosters = 0;
    let wins = 0;
    for (let n = 1; n <= LEVELS; n++) {
      const lvl = compiledLevel(coverLevel(n));
      for (let seed = 1; seed <= SEEDS; seed++) {
        const rng = mulberry32(n * 1000 + seed);
        const game = GameSession.start(lvl, { preBoosters: ['trowelStart', 'thermos'] });
        for (let step = 0; step < 24 && game.outcome !== 'won' && game.outcome !== 'lost'; step++) {
          if (game.outcome === 'outOfMoves') {
            if (game.acceptOffer('offerCoins').status !== 'applied') break;
            continue;
          }
          const a = randomAction(game, rng);
          if (a.kind === 'none') break;
          actions++;
          const where = `level ${n} seed ${seed} step ${step} (${a.kind})`;
          expectConserved(game.state, where);
          if (
            a.applied &&
            !a.teardown &&
            (a.kind === 'crane' || a.kind === 'paint' || a.kind === 'goldTrowel')
          ) {
            boosters++;
            expect(tileRemaining(game.state), `${where}: K-47 booster dead end`).not.toBe('dead');
          }
        }
        if (game.outcome === 'won') wins++;
        expect(stateInvariantErrors(game.state), `level ${n} seed ${seed}`).toEqual([]);
        expect(blocksLeft(game.state) >= 0).toBe(true);
      }
    }
    expect(actions).toBeGreaterThan(LEVELS * SEEDS * 4);
    expect(boosters).toBeGreaterThan(0);
    expect(wins).toBeGreaterThanOrEqual(0);
  }, 120_000);
});

/** Unused helpers kept typed (pieceX / pieceY for debugging failing seeds). */
export const debugPlace = (s: GameState, id: PieceId): [number, number, number] => [
  pieceZone(s, id),
  pieceX(s, id),
  pieceY(s, id),
];
export const debugMoves = (s: GameState): number => hdr(s, H.movesLeft);
