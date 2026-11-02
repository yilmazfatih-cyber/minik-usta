/**
 * GDD K-55 sabit saha (D-099, `schemaVersion` 2) and its edge cases E-62, E-63, E-65, E-66 (E-64 is in
 * deadlock.test.ts, E-67 in services/save.test.ts). Fixture: the LEVELS §6.8 calibration draft P1 (6×4 yard, two 2×5
 * floors, 8 blocks) as `schemaVersion` 2 (`tests/level/fixtures/v2/p1_two_floors.json`).
 */
import { describe, expect, it } from 'vitest';
import { validateLevelJson } from '../../src/core/level/logic.ts';
import { LevelSchema, isFixedYardLevel, schemaVersionOf } from '../../src/core/level/schema.ts';
import { compile, loadLevel } from '../../src/core/level/compile.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import { GameSession } from '../../src/core/session.ts';
import { ArraySink } from '../../src/core/moves.ts';
import { tryBeginDrag } from '../../src/core/movement.ts';
import { stateInvariantErrors } from '../../src/core/grid.ts';
import { mulberry32 } from '../../src/core/rng.ts';
import { tileRemaining } from '../../src/core/deadlock.ts';
import {
  FLAG_BIT,
  H,
  createInitialState,
  hdr,
  pieceFlags,
  pieceX,
  pieceY,
  pieceZone,
} from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import { Zone } from '../../src/core/types.ts';
import type { GameEvent, Move, PieceId } from '../../src/core/types.ts';
import { initialState, loadFixture, loadLevelJson } from '../fixtures/builders.ts';
import { dragTo, find, run, types } from './moves.fixtures.ts';

const P1_JSON = (): Record<string, unknown> => loadFixture('v2', 'p1_two_floors') as Record<string, unknown>;

function p1(): CompiledLevel {
  return compile(LevelSchema.parse(P1_JSON()));
}

/**
 * The P1 solution (GDD K-55 example): the two D2_0 R (ids 5, 6) fill the ground floor's base, the top D2_90 W (3) is
 * parked once, D2_0 W / D2_0 Y (1, 2) and then 3 finish floor 1 on move 6; O4 Y (4), D2_90 W (7) and O4 R (0) build
 * floor 2. Releases are FREE nodes in the Vinç Alanı (y = H = 5) over the site columns.
 */
const P1_SOLUTION: readonly Move[] = [
  dragTo(5, 6, 5),
  dragTo(6, 7, 5),
  dragTo(3, 4, 3),
  dragTo(1, 6, 5),
  dragTo(2, 7, 5),
  dragTo(3, 6, 5),
  dragTo(4, 6, 5),
  dragTo(7, 6, 5),
  dragTo(0, 6, 5),
];

/** Yard records of every piece except `except`: id → [zone, x, y, flags]. */
function yardOf(s: GameState, except: PieceId = -1): (readonly number[])[] {
  const out: (readonly number[])[] = [];
  for (let id = 0; id < s.lvl.layout.counts.pieces; id++) {
    if (id === except || pieceZone(s, id) !== Zone.yard) continue;
    out.push([id, pieceX(s, id), pieceY(s, id), pieceFlags(s, id)]);
  }
  return out;
}

/** K-55 item 2: unlocked material blocks anywhere (yard, queue, pending batch, unlocked in the site). */
function unlockedMaterial(s: GameState): Set<PieceId> {
  const out = new Set<PieceId>();
  for (let id = 0; id < s.lvl.layout.counts.pieces; id++) {
    if (s.lvl.pieces[id]?.cls !== 'material') continue;
    if ((pieceFlags(s, id) & FLAG_BIT.locked) !== 0) continue;
    const z = pieceZone(s, id);
    if (z === Zone.yard || z === Zone.queue || z === Zone.pending || z === Zone.site) out.add(id);
  }
  return out;
}

const DELIVERY_EVENTS = new Set<GameEvent['t']>(['deliveryArrived', 'deliveryQueued']);

describe('K-55 sabit saha (D-099, schemaVersion 2)', () => {
  it('K-55 item 1 schemaVersion: missing = 1, 2 = fixed yard; the P1 fixture is a valid v2 level with one batch', () => {
    const json = P1_JSON();
    expect(schemaVersionOf({})).toBe(1);
    expect(schemaVersionOf({ schemaVersion: 1 })).toBe(1);
    expect(isFixedYardLevel(json as { schemaVersion?: number })).toBe(true);
    const { level, issues } = validateLevelJson(json, { fileId: 5 });
    expect(issues).toEqual([]);
    expect(level?.yard.batches).toHaveLength(1);
    expect(loadLevel(json).ok).toBe(true);
  });

  it('K-55 segment change keeps the yard (E-62): move 6 finishes floor 1, step 8 shifts the site, the yard stays bit for bit, no delivery', () => {
    const lvl = p1();
    const game = GameSession.start(lvl);
    for (const m of P1_SOLUTION.slice(0, 5)) expect(game.commit(m).status).toBe('applied');
    const before = yardOf(game.state, 3);
    const queueBefore = hdr(game.state, H.queueLen);
    const res = game.apply(P1_SOLUTION[5] as Move);
    expect(types(res.events)).toEqual(expect.arrayContaining(['segmentCompleted', 'siteShifted']));
    expect(find(res.events, 'siteShifted')).toMatchObject({ step: 8, toSeg: 1 });
    expect(res.events.filter((e) => DELIVERY_EVENTS.has(e.t))).toEqual([]);
    expect(res.events.filter((e) => e.t === 'pieceFell' && e.cause === 'delivery')).toEqual([]);
    // every event from step 8 on is about the site, the goals or the win: none moves a yard block
    expect(res.events.filter((e) => e.step >= 8).map((e) => e.t)).not.toContain('pieceReturned');
    expect(yardOf(game.state)).toEqual(before);
    expect([queueBefore, hdr(game.state, H.queueLen)]).toEqual([0, 0]);
    expect([res.summary.queue, res.summary.pendingBatches, res.summary.pendingBlocks]).toEqual([[], 0, 0]);
    // GDD example: the three blocks of floor 2 sit where they started
    expect(yardOf(game.state).map((r) => r.slice(0, 3))).toEqual([
      [0, 0, 0],
      [4, 4, 0],
      [7, 2, 0],
    ]);
    expect(hdr(game.state, H.activeSeg)).toBe(1);
  });

  it('K-55 the P1 solution wins in 9 moves (min = N 8 + 1 shift) with every block placed exactly once and no truck event', () => {
    const game = GameSession.start(p1());
    const all: GameEvent[] = [];
    for (const m of P1_SOLUTION) {
      const r = game.apply(m);
      expect(r.status).toBe('applied');
      all.push(...r.events);
    }
    expect(game.outcome).toBe('won');
    expect(all.filter((e) => DELIVERY_EVENTS.has(e.t))).toEqual([]);
    expect(all.filter((e) => e.t === 'placementCorrect')).toHaveLength(8);
    expect([game.movesLeft, game.yao().overWall]).toEqual([11 - 9, 8]);
  });

  it('K-55 no block enters the yard: 200 seeded random sessions (drags, Undo, +5) — the unlocked material set only shrinks by correct placements and grows back only by Söküm or Undo', () => {
    const lvl = p1();
    const initial = unlockedMaterial(createInitialState(lvl));
    expect(initial.size).toBe(8);
    let actions = 0;
    let teardowns = 0;
    let undos = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const rng = mulberry32(55_000 + seed);
      const game = GameSession.start(lvl);
      let prev = unlockedMaterial(game.state);
      for (let step = 0; step < 30 && game.outcome !== 'won' && game.outcome !== 'lost'; step++) {
        const where = `seed ${seed} step ${step}`;
        if (game.outcome === 'outOfMoves') {
          if (game.acceptOffer('offerCoins').status !== 'applied') break;
          continue;
        }
        const undo = rng.next() < 0.08 && game.canUndo();
        const move = undo ? null : randomDrag(game.state, rng);
        if (!undo && !move) break;
        const kind: 'drag' | 'undo' = undo ? 'undo' : 'drag';
        const res = move ? game.apply(move, new ArraySink()) : game.apply({ kind: 'undo' });
        if (undo) undos++;
        actions++;
        const cur = unlockedMaterial(game.state);
        for (const id of cur) expect(initial.has(id), `${where}: block ${id} is new`).toBe(true);
        for (let id = 0; id < lvl.layout.counts.pieces; id++)
          expect(pieceZone(game.state, id), `${where}: no pending batch`).not.toBe(Zone.pending);
        const grewBack = kind === 'undo' || res.teardown !== null;
        if (res.teardown) teardowns++;
        if (!grewBack)
          for (const id of cur) expect(prev.has(id), `${where}: block ${id} came back`).toBe(true);
        expect(stateInvariantErrors(game.state), where).toEqual([]);
        prev = cur;
      }
    }
    expect(actions).toBeGreaterThan(2000);
    expect(undos).toBeGreaterThan(30);
    expect(teardowns).toBeGreaterThanOrEqual(0);
  }, 30_000);

  it('E-63 K-55 item 4 a block is not bound to a segment: the swap of the GDD example (both D2_0 R to floor 1) is correct and wins', () => {
    // the GDD K-55 example: the design meant the two D2_0 R for floor 2's roof and O4 R for floor 1's base; P1_SOLUTION
    // uses the opposite assignment and wins (above). Here floor 1's base is built with them and the level stays tileable.
    const s = createInitialState(p1());
    run(s, P1_SOLUTION[0] as Move);
    run(s, P1_SOLUTION[1] as Move);
    expect([pieceFlags(s, 5) & FLAG_BIT.locked, pieceFlags(s, 6) & FLAG_BIT.locked]).toEqual([
      FLAG_BIT.locked,
      FLAG_BIT.locked,
    ]);
    expect(tileRemaining(s)).toBe('ok');
  });

  it("E-63 K-55 a later floor's block placed on the active floor where the rest cannot tile → D3a dead end → Söküm takes the move back, no refund", () => {
    // floor 1 is a 2×2 Y block, floor 2 = YY (bottom) + WW; supply O4 Y, D2_90 Y, D2_90 W. The D2_90 Y fits floor 1's
    // bottom row (K-16 correct) but then floor 1's top row needs a second D2_90 Y: untileable (D3a).
    const s = initialState({
      schemaVersion: 2,
      yard: { cols: 4, rows: 2 },
      site: { cols: 2, rows: 2 },
      wall: { height: 2 },
      plan: [
        ['YY', 'YY'],
        ['WW', 'YY'],
      ],
      pieces: [
        ['O4_0', 'Y', 0, 0],
        ['D2_90', 'Y', 2, 1],
        ['D2_90', 'W', 2, 0],
      ],
      moves: 9,
    });
    const before = s.buf.slice();
    const r = run(s, dragTo(1, 4, 3)); // yard 4 wide: the site columns are x = 4, 5
    expect(find(r.ev, 'placementCorrect')).toMatchObject({ pieceId: 1, step: 3 });
    expect(find(r.ev, 'teardown')).toMatchObject({ cause: 'tiling', step: 12 });
    expect(hdr(s, H.movesLeft)).toBe(8);
    expect(pieceZone(s, 1)).toBe(Zone.yard);
    const restored = s.buf.slice();
    restored[H.movesLeft] = before[H.movesLeft] ?? 0;
    restored[H.movesSpent] = before[H.movesSpent] ?? 0;
    expect([...restored]).toEqual([...before]);
  });

  it('E-65 K-55 a Faz 2R multi-batch level written as schemaVersion 2 → fixed_yard_batches (error, not loaded); as schemaVersion 1 it stays valid', () => {
    const v1 = loadLevelJson(5) as Record<string, unknown>;
    expect(validateLevelJson(v1, { fileId: 5 }).issues.filter((i) => i.severity === 'error')).toEqual([]);
    const v2 = { ...v1, schemaVersion: 2 };
    const issues = validateLevelJson(v2, { fileId: 5 }).issues;
    expect(issues.filter((i) => i.code === 'fixed_yard_batches')).toMatchObject([
      { rule: 'K-45/11', check: 'L-36', severity: 'error', path: 'yard.batches' },
    ]);
    expect(loadLevel(v2).ok).toBe(false);
    // the single batch must be forSegment 0 without dropColumns
    const one = P1_JSON() as { yard: { batches: Record<string, unknown>[] } };
    const first = one.yard.batches[0] as Record<string, unknown>;
    const drop = { ...one, yard: { ...one.yard, batches: [{ ...first, dropColumns: [0] }] } };
    expect(validateLevelJson(drop, { fileId: 5 }).issues.map((i) => [i.code, i.path])).toContainEqual([
      'fixed_yard_batches',
      'yard.batches[0].dropColumns',
    ]);
  });

  it('E-66 K-55 item 5 with no empty yard cell the hammer sends site debris to the truck queue (N = 1); a correct placement frees a cell and it drops at step 9', () => {
    const s = initialState({
      schemaVersion: 2,
      yard: { cols: 2, rows: 1 },
      site: { cols: 2, rows: 2 },
      wall: { height: 1 },
      plan: ['WW', 'RR'],
      pieces: [['D2_90', 'R', 0, 0]],
      debris: [['D2_90', 'W', 2, 0]], // yard 2 wide: the site columns are x = 2, 3
    });
    const hit = run(s, { kind: 'hammer', target: { pieceId: 1 } });
    expect(find(hit.ev, 'pieceReturned')).toMatchObject({ pieceId: 1, to: 'queue' });
    expect(find(hit.ev, 'deliveryQueued')).toMatchObject({ queued: 1 });
    expect([pieceZone(s, 1), hdr(s, H.queueLen)]).toEqual([Zone.queue, 1]);
    const next = run(s, dragTo(0, 2, 3));
    expect(find(next.ev, 'placementCorrect')).toMatchObject({ pieceId: 0 });
    expect(find(next.ev, 'deliveryArrived')).toMatchObject({ step: 9, pieces: [1] });
    expect(find(next.ev, 'deliveryQueued')).toMatchObject({ queued: 0 });
    expect([pieceZone(s, 1), hdr(s, H.queueLen)]).toEqual([Zone.yard, 0]);
  });
});

/** A random drag of a random holdable block to a random reachable node (site releases favoured). */
function randomDrag(s: GameState, rng: { next(): number; nextInt(n: number): number }): Move | null {
  const P = s.lvl.layout.counts.pieces;
  const start = rng.nextInt(P);
  for (let k = 0; k < P; k++) {
    const id = (start + k) % P;
    const z = pieceZone(s, id);
    if (z !== Zone.yard && z !== Zone.site) continue;
    const a = tryBeginDrag(s, id);
    if (!a.ok) continue;
    const nodes = a.session.reachableNodes();
    const site = nodes.filter((n) => n.ix >= s.lvl.geo.siteX);
    const pool = site.length > 0 && rng.next() < 0.6 ? site : nodes;
    const to = pool[rng.nextInt(pool.length)];
    if (to) return { kind: 'drag', pieceId: id, to };
  }
  return null;
}
