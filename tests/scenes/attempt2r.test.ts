/**
 * WP-K attempt record of the Faz 2R slice (docs/TECH_DESIGN.md §2R.10, §2R.16; META §4, §10; ANALYTICS §2 v6;
 * GDD K-28, K-30, K-39, K-43, K-54): booster inventory and free trials, the first-win star, the 1–10 loop replay, and
 * the v6 send points (`booster_used.target`, `deadlock_teardown`, `level_end.teardowns / truckHelps / blocksLeft /
 * exitFree`). Pure: a `MemoryStore` save, a `FakeClock`, the validated analytics service.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import economy from '../../config/economy.json' with { type: 'json' };
import { trowelsOf } from '../../src/core/combo.ts';
import { ArraySink } from '../../src/core/moves.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import { GameSession } from '../../src/core/session.ts';
import type { GameEvent, Move, SessionAction } from '../../src/core/types.ts';
import { Analytics, ANALYTICS_EVENTS } from '../../src/services/analytics.ts';
import type { AnalyticsEvent, AnalyticsEventOf } from '../../src/services/analytics.ts';
import { FakeClock } from '../../src/services/clock.ts';
import { MemoryStore, SaveService } from '../../src/services/save.ts';
import { LevelAttempt, boosterUse, streakBonusOf } from '../../src/scenes/flow/attempt.ts';
import { sliceWinRewards } from '../../src/meta/home.ts';
import { compiledLevel } from '../fixtures/builders.ts';
import type { LevelSpec } from '../fixtures/builders.ts';
import { dragTo, handMoves, levelFile } from '../core/moves.fixtures.ts';

function harness(seed?: (save: SaveService) => void) {
  const clock = new FakeClock(1_000_000);
  const events: AnalyticsEvent[] = [];
  let n = 0;
  const save = SaveService.open({
    store: new MemoryStore(),
    clock,
    scheduler: clock,
    startingWallet: economy.startingWallet,
    newId: () => `id${n++}`,
  });
  seed?.(save);
  const analytics = new Analytics({
    clock,
    common: () => ({
      sessionId: 's',
      appVersion: 'test',
      platform: 'web',
      lang: 'tr',
      coins: save.data.coins,
      lives: save.data.lives.stored,
      highestLevel: save.data.progress.highestLevel,
      payer: save.data.payer,
    }),
    onInvalid: (issues) => {
      throw new Error(issues.join('\n'));
    },
  });
  analytics.addSink((r) => events.push(r.event));
  return { clock, save, events, deps: { save, track: analytics.track, clock } };
}

const named = <N extends AnalyticsEvent['name']>(events: readonly AnalyticsEvent[], name: N) =>
  events.filter((e): e is AnalyticsEventOf<N> => e.name === name);

/** Plays `actions` through `GameSession.apply` and the attempt's single entry, as LevelScene does. */
function play(a: LevelAttempt, g: GameSession, actions: readonly (Move | { kind: 'undo' })[]): void {
  for (const action of actions) {
    const res = g.apply(action);
    if (res.status !== 'applied') throw new Error(`${action.kind} not applied: ${res.reason}`);
    a.applied(action as SessionAction, res, g);
  }
}

const start = (lvl: CompiledLevel) =>
  GameSession.start(lvl, { preBoosters: [], streakTier: 0 }, { streakBonus: streakBonusOf });

/** GDD K-30 "döşeme çıkmazı" (tests/core/deadlock.test.ts): D2_0 W at x 6 rows 2–3 is correct, then O4 W fits nowhere. */
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

function cargoOf(lvl: CompiledLevel): number {
  const id = [...Array(lvl.layout.counts.pieces).keys()].find((i) => lvl.pieces[i]?.cls === 'cargo');
  if (id === undefined) throw new Error(`level ${lvl.id} has no Ağır Yük`);
  return id;
}

describe('META 4 booster inventory and free trials (WP-K)', () => {
  it('META 4 the opening level grants its free trials at the attempt start, once per account', () => {
    const h = harness();
    LevelAttempt.begin(h.deps, levelFile(8), { preBoosters: [], streakTier: 0 });
    expect(h.save.data.boosters).toEqual({ inventory: { hammer: 3 }, freeTrialsGranted: ['hammer'] });
    // a free exit, then the same level again: no second grant
    const g = start(levelFile(8));
    const again = LevelAttempt.resumed(h.deps, h.save.data.inLevel ?? fail());
    again.exitFree(g, []);
    LevelAttempt.begin(h.deps, levelFile(8), { preBoosters: [], streakTier: 0 });
    expect(h.save.data.boosters.inventory.hammer).toBe(3);
    // levels below every unlock grant nothing
    const low = harness();
    LevelAttempt.begin(low.deps, levelFile(7), { preBoosters: [], streakTier: 0 });
    expect(low.save.data.boosters).toEqual({ inventory: {}, freeTrialsGranted: [] });
  });

  it('META 4 locked booster grant is kept and free trials add', () => {
    // a hammer from a pack before level 8 stays in the inventory (slot locked); the 3 trials add on top at level 8
    const h = harness((s) => s.commit((d) => void (d.boosters.inventory.hammer = 1)));
    LevelAttempt.begin(h.deps, levelFile(7), { preBoosters: [], streakTier: 0 });
    expect(h.save.data.boosters.inventory.hammer).toBe(1);
    LevelAttempt.resumed(h.deps, h.save.data.inLevel ?? fail()).exitFree(start(levelFile(7)), []);
    LevelAttempt.begin(h.deps, levelFile(8), { preBoosters: [], streakTier: 0 });
    expect(h.save.data.boosters.inventory.hammer).toBe(4);
  });

  it('UX 5.2 step 3 an applied booster leaves the inventory in the same write as its log entry; a void gives it back', () => {
    const h = harness();
    const lvl = levelFile(8);
    const a = LevelAttempt.begin(h.deps, lvl, { preBoosters: [], streakTier: 0 });
    const g = start(lvl);
    play(a, g, [{ kind: 'hammer', target: { pieceId: cargoOf(lvl) } }]);
    expect(h.save.data.boosters.inventory.hammer).toBe(2);
    expect(h.save.data.inLevel?.actions.at(-1)).toMatchObject({ kind: 'hammer' });
    // K-43 item 4: the attempt is voided (rules / level changed) — exactly the logged hammer comes back
    const d = h.save.resumeOnLaunch(() => null);
    expect(d).toMatchObject({ kind: 'void', notice: { refunds: { boosters: { hammer: 1 } } } });
    expect(h.save.data.boosters.inventory.hammer).toBe(3);
  });
});

describe('META 10 slice wins (first win star, 1–10 loop replay; WP-K)', () => {
  it('META 10 a star only on the first win; the replay of a won level pays the base coins only, mode replay', () => {
    const h = harness();
    const lvl = levelFile(1);
    const first = LevelAttempt.begin(h.deps, lvl, { preBoosters: [], streakTier: 0 });
    expect(first.replay).toBe(false);
    const g1 = start(lvl);
    play(first, g1, handMoves(1));
    const r1 = first.rewards(g1, lvl.difficulty);
    expect(first.settle(g1, () => r1)).toMatchObject({ kind: 'win' });
    expect(r1).toEqual(
      sliceWinRewards({
        difficulty: lvl.difficulty,
        movesLeft: g1.movesLeft,
        trowels: trowelsOf(g1.state),
        replay: false,
      }),
    );
    expect(r1.trowels).toBe(1); // the 4-in-a-row Usta Serisi trowel of the golden, unused: its coins on a first win
    expect(h.save.data.stars).toBe(1);
    const coins = h.save.data.coins;

    const again = LevelAttempt.begin(h.deps, lvl, { preBoosters: [], streakTier: 0 });
    expect([again.replay, again.mode, h.save.data.inLevel?.mode]).toEqual([true, 'replay', 'replay']);
    const g2 = start(lvl);
    play(again, g2, handMoves(1));
    const r2 = again.rewards(g2, lvl.difficulty);
    expect(r2).toMatchObject({
      stars: 0,
      bonusCoins: 0,
      trowelCoins: 0,
      totalCoins: economy.levelRewards.winCoins.easy,
    });
    again.settle(g2, () => r2);
    expect(h.save.data.stars).toBe(1);
    expect(h.save.data.coins).toBe(coins + economy.levelRewards.winCoins.easy);
    const starts = named(h.events, 'level_start').map((e) => e.mode);
    const ends = named(h.events, 'level_end').map((e) => e.mode);
    expect([starts, ends]).toEqual([
      ['story', 'replay'],
      ['story', 'replay'],
    ]);
  });

  it('META 10 a level already won never adds a star, even with rewards that carry one (attempt.ts guard)', () => {
    const h = harness((s) =>
      s.commit((d) => {
        d.progress.levels['1'] = { won: true, attempts: 1 };
        d.progress.highestLevel = 1;
        d.stars = 1;
      }),
    );
    const lvl = levelFile(1);
    const a = LevelAttempt.begin(h.deps, lvl, { preBoosters: [], streakTier: 0 });
    const g = start(lvl);
    play(a, g, handMoves(1));
    a.win(
      g,
      sliceWinRewards({ difficulty: lvl.difficulty, movesLeft: g.movesLeft, trowels: 0, replay: false }),
    );
    expect(h.save.data.stars).toBe(1);
  });
});

describe('ANALYTICS v6 send points (TECH 2R.16; WP-K)', () => {
  it('ANALYTICS booster_used target: hammer = its K-36 kind, crane and brush = block, undo = null, trowel = no event', () => {
    const h = harness();
    const lvl = levelFile(8);
    const a = LevelAttempt.begin(h.deps, lvl, { preBoosters: [], streakTier: 0 });
    const g = start(lvl);
    play(a, g, [{ kind: 'hammer', target: { pieceId: cargoOf(lvl) } }]);
    expect(named(h.events, 'booster_used')).toEqual([
      { name: 'booster_used', booster: 'hammer', level: 8, target: 'cargo' },
    ]);
    const ev = new ArraySink();
    expect(
      boosterUse({ kind: 'crane', pieceId: 0, to: { zone: 'yard', x: 0, y: 0 }, rotation: 0 }, ev.events),
    ).toEqual({
      booster: 'crane',
      target: 'block',
    });
    expect(boosterUse({ kind: 'paint', a: 0, b: 1 }, [])).toEqual({ booster: 'paintBrush', target: 'block' });
    expect(boosterUse({ kind: 'undo' }, [])).toEqual({ booster: 'undo', target: null });
    expect(boosterUse({ kind: 'goldTrowel', pieceId: 0, x: 4, y: 0 }, [])).toBeNull();
    expect(boosterUse(dragTo(0, 4, 0), [])).toBeNull();
  });

  it('ANALYTICS deadlock_teardown once per Söküm with its cause; level_end counts it in teardowns and truckHelps', () => {
    const h = harness();
    const lvl = compiledLevel(TILING);
    const a = LevelAttempt.begin(h.deps, lvl, { preBoosters: [], streakTier: 0 });
    const g = start(lvl);
    play(a, g, [dragTo(0, 6, 8), dragTo(1, 6, 8)]);
    const tear = named(h.events, 'deadlock_teardown');
    expect(tear).toEqual([
      {
        name: 'deadlock_teardown',
        level: lvl.id,
        cause: 'tiling',
        movesLeft: g.movesLeft,
        piecesReturned: 1,
      },
    ]);
    expect(a.counters).toEqual({ wrongPlacements: 0, truckHelps: 1, teardowns: 1 });
    a.loss(g, 'quit'); // movesSpent 2 ≥ 1: a loss, not a free exit
    expect(named(h.events, 'level_end')[0]).toMatchObject({
      result: 'quit',
      exitFree: false,
      teardowns: 1,
      truckHelps: 1,
      blocksLeft: 2,
    });
  });

  it('ANALYTICS level_end teardowns: an Undo of the Söküm drag takes it back from both counters (K-39, E-37), no new event', () => {
    const h = harness();
    const lvl = compiledLevel(TILING);
    const a = LevelAttempt.begin(h.deps, lvl, { preBoosters: [], streakTier: 0 });
    const g = start(lvl);
    play(a, g, [dragTo(0, 6, 8), dragTo(1, 6, 8)]);
    expect(a.counters.teardowns).toBe(1);
    play(a, g, [{ kind: 'undo' }]);
    expect(a.counters).toEqual({ wrongPlacements: 0, truckHelps: 0, teardowns: 0 });
    expect(named(h.events, 'deadlock_teardown')).toHaveLength(1);
    // the K-43 resume replays the same log per entry (as LevelScene does): the counters are the live ones
    const sink = new ArraySink();
    const packages: { action: SessionAction; events: readonly GameEvent[] }[] = [];
    let mark = 0;
    GameSession.replay(lvl, g.log, { streakBonus: streakBonusOf }, sink, (_i, action) => {
      packages.push({ action, events: sink.events.slice(mark) });
      mark = sink.events.length;
    });
    expect(packages.map((p) => p.action.kind)).toEqual(['start', 'drag', 'drag', 'undo']);
    expect(packages[2]?.events.at(-1)?.t).toBe('teardown');
    const r = LevelAttempt.resumed(h.deps, h.save.data.inLevel ?? fail(), packages);
    expect(r.counters).toEqual({ wrongPlacements: 0, truckHelps: 0, teardowns: 0 });
    expect(named(h.events, 'deadlock_teardown')).toHaveLength(1); // a resume sends nothing again
  });

  it('ANALYTICS deadlock_teardown never sends unknown_before_offer (GDD K-30: the "bilinmiyor → dön" branch is gone)', () => {
    const spec = ANALYTICS_EVENTS.deadlock_teardown.cause;
    expect(spec.values).toContain('unknown_before_offer'); // the table keeps the value …
    const src = readFileSync(new URL('../../src/scenes/flow/attempt.ts', import.meta.url), 'utf8');
    const core = readFileSync(new URL('../../src/core/deadlock.ts', import.meta.url), 'utf8');
    // … but the only cause map is the core's D2 / D3a / D3b one, and no code names the value
    expect(core).toMatch(
      /ANALYTICS_CAUSE = \{ color: 'color_balance', tiling: 'tiling', access: 'access' \}/,
    );
    expect(src).toMatch(/cause: ANALYTICS_CAUSE\[td\.cause\]/);
    for (const text of [src, core]) expect(text).not.toMatch(/unknown_before_offer/);
  });

  it('ANALYTICS level_end exitFree = quit with movesSpent 0; blocksLeft = the blocks still to place (0 on a win)', () => {
    const h = harness();
    const lvl = levelFile(2);
    const a = LevelAttempt.begin(h.deps, lvl, { preBoosters: [], streakTier: 0 });
    const g = start(lvl);
    const ex = g.exit();
    expect(ex.kind).toBe('free');
    a.exitFree(g, ex.refundPreBoosters);
    const n = lvl.layout.counts.pieces;
    expect(named(h.events, 'level_end')[0]).toMatchObject({ result: 'quit', exitFree: true, blocksLeft: n });
    const w = harness();
    const b = LevelAttempt.begin(w.deps, lvl, { preBoosters: [], streakTier: 0 });
    const g2 = start(lvl);
    play(b, g2, handMoves(2));
    b.settle(g2, () => b.rewards(g2, lvl.difficulty));
    expect(named(w.events, 'level_end')[0]).toMatchObject({ result: 'win', exitFree: false, blocksLeft: 0 });
  });

  it('ANALYTICS v6 every new event has a send point in the code (deadlock_teardown, booster_used, nav_tap, tutorial_step)', () => {
    const read = (p: string): string => readFileSync(new URL(`../../src/${p}`, import.meta.url), 'utf8');
    expect(read('scenes/flow/attempt.ts')).toMatch(/name: 'deadlock_teardown'/);
    expect(read('scenes/flow/attempt.ts')).toMatch(/name: 'booster_used'/);
    expect(read('scenes/flow/attempt.ts')).toMatch(
      /name: 'tutorial_step', level: this\.levelId, step, shows, msToDone/,
    );
    expect(read('scenes/HomeScene.ts')).toMatch(/name: 'nav_tap', tab: id, locked/);
    const scene = read('scenes/level/LevelScene.ts');
    expect(scene).toMatch(/this\.attempt\?\.applied\(action, res, game\)/);
    expect(scene).toMatch(/this\.attempt\?\.applied\(\{ kind: 'undo' \}, res, game\)/);
  });
});

function fail(): never {
  throw new Error('no attempt in the save');
}
