/**
 * WP-G level screen v2 (docs/TECH_DESIGN.md §2R.1 web back guard, §2R.8 HUD v2 + booster flows, §2R.15 presentation
 * hooks; UX_FLOWS §5.1, §5.2, §5.8–§5.10; JUICE #94, #107, #108, §0 rule 14; GDD K-33, K-34 hook 5, K-36, K-37, K-43,
 * K-48, K-54). Pure parts of the scene: the back guard, the booster slot models, the stuck pulse, the low-moves rule,
 * the JUICE schedule of the Faz 2R packages and the picker's core queries.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: { TintModes: { FILL: 1 }, BlendModes: { ADD: 1, NORMAL: 0 }, Geom: { Rectangle: class {} } },
}));

import { blocksLeft } from '../../src/core/goals.ts';
import { loadLevel } from '../../src/core/level/compile.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import { GameSession } from '../../src/core/session.ts';
import { pieceZone } from '../../src/core/state.ts';
import type { GameEvent } from '../../src/core/types.ts';
import { Zone } from '../../src/core/types.ts';
import { BACK_EVENT, BACK_GUARD_STATE, installBackGuard } from '../../src/scenes/backGuard.ts';
import type { BackGuardHost } from '../../src/scenes/backGuard.ts';
import { planMove } from '../../src/scenes/level/juice/plan.ts';
import type { PlanContext } from '../../src/scenes/level/juice/plan.ts';
import { STUCK_PULSES, StuckPulse, stuckIdleMs } from '../../src/scenes/level/stuckPulse.ts';
import { pickEligible, pickSpots } from '../../src/scenes/level/TrowelPicker.ts';
import { BOOSTER_SLOT_IDS, boosterSlotModels, slotLook, usedInAttempt } from '../../src/ui/boosterSlots.ts';
import { chipMetrics, goalChips } from '../../src/ui/GoalsPanel.ts';
import { lowMovesWarning, remainingBlocks } from '../../src/ui/remaining.ts';
import { exitKind } from '../../src/ui/windowLines.ts';
import { TOKENS } from '../../src/theme/tokens.ts';
import { loadFixture } from '../fixtures/builders.ts';

const src = (path: string): string => readFileSync(new URL(`../../src/${path}`, import.meta.url), 'utf8');

/** LEVELS §2 draft of level `n` (Faz 2R format, tests/level/fixtures/levels-2r), without its tutorial. */
function draft(n: number): CompiledLevel {
  const data = loadFixture('levels-2r', `level_${String(n).padStart(3, '0')}`) as Record<string, unknown>;
  delete data['tutorial'];
  const res = loadLevel(data);
  if (!res.ok) throw new Error(`level ${n}: ${JSON.stringify(res.issues)}`);
  return res.level;
}

// --- web back guard ----------------------------------------------------------------------------------------------------

function fakeWindow(): BackGuardHost & { pushed: unknown[]; fire(type: string): void } {
  const listeners = new Map<string, Set<(e: Event) => void>>();
  const pushed: unknown[] = [];
  return {
    pushed,
    history: { pushState: (data: unknown) => void pushed.push(data) },
    addEventListener: (type, fn) => {
      const set = listeners.get(type) ?? new Set();
      set.add(fn);
      listeners.set(type, set);
    },
    removeEventListener: (type, fn) => void listeners.get(type)?.delete(fn),
    fire: (type) => {
      for (const fn of listeners.get(type) ?? []) fn(new Event(type));
    },
  };
}

describe('UX 5.8 web back guard (TECH 2R.1, DL-2R-16)', () => {
  it('UX 5.8 popstate opens pause instead of leaving: one guard entry after the first activating input, re-pushed on back', () => {
    const win = fakeWindow();
    let backs = 0;
    const off = installBackGuard(win, () => (backs += 1));
    win.fire('popstate'); // before any activation: Chrome would skip the entry anyway — nothing to guard
    expect([win.pushed.length, backs]).toEqual([0, 0]);
    win.fire('pointerup');
    win.fire('pointerup');
    expect(win.pushed).toEqual([BACK_GUARD_STATE]); // one entry, added with user activation
    win.fire('popstate');
    expect(backs).toBe(1);
    expect(win.pushed).toEqual([BACK_GUARD_STATE, BACK_GUARD_STATE]); // the guard is back for the next gesture
    off();
    win.fire('popstate');
    expect(backs).toBe(1);
    // main.ts emits BACK_EVENT on the game; the level scene answers with its Pause window
    expect(src('main.ts')).toMatch(/installBackGuard\(window, \(\) => game\.events\.emit\(BACK_EVENT\)\)/);
    const scene = src('scenes/level/LevelScene.ts');
    expect(scene).toMatch(/this\.game\.events\.on\(BACK_EVENT, onBack\)/);
    expect(scene).toMatch(
      /const onBack = \(\): void => \{\s+if \(this\.sys\.isActive\(\)\) this\.openPause\(false\);/,
    );
    expect(BACK_EVENT).toBe('backGuard');
  });
});

// --- K-54 booster slots ------------------------------------------------------------------------------------------------

const NO_INV = { inventory: {}, freeTrialsGranted: [] } as const;

describe('UX 5.10 booster bar (K-54, META 4)', () => {
  it('K-54 slot models: locked below the unlock level (levels 1–7 all four), free trials at unlock, applied boosters subtract', () => {
    const lvl = draft(1);
    const g = GameSession.start(lvl);
    const m1 = boosterSlotModels({
      levelId: 1,
      inv: NO_INV,
      log: g.log,
      targets: g.summary().boosterTargets,
    });
    expect(m1.map((m) => m.id)).toEqual([...BOOSTER_SLOT_IDS]);
    expect(m1.map((m) => m.state)).toEqual(['locked', 'locked', 'locked', 'locked']);
    expect(m1.map((m) => m.unlockLevel)).toEqual([8, 10, 22, 13]);
    // level 8: the hammer is open with its 3 free trials; one applied hammer leaves 2
    const b8 = draft(8);
    const s8 = GameSession.start(b8);
    const cargo =
      [...Array(b8.layout.counts.pieces).keys()].find((id) => b8.pieces[id]?.cls === 'cargo') ?? -1;
    const before = boosterSlotModels({
      levelId: 8,
      inv: NO_INV,
      log: s8.log,
      targets: s8.summary().boosterTargets,
    });
    expect(before[0]).toMatchObject({ id: 'hammer', state: 'ready', count: 3 });
    const res = s8.apply({ kind: 'hammer', target: { pieceId: cargo } });
    expect(res.status).toBe('applied');
    expect(usedInAttempt('hammer', s8.log)).toBe(1);
    const after = boosterSlotModels({
      levelId: 8,
      inv: NO_INV,
      log: s8.log,
      targets: res.summary.boosterTargets,
    });
    // K-54: the only hammer target is gone → noTarget wins over the count (no "+", no purchase window)
    expect(after[0]).toMatchObject({ id: 'hammer', state: 'noTarget', count: 2 });
    // stored inventory adds up; a granted trial is not given twice
    const stored = boosterSlotModels({
      levelId: 8,
      inv: { inventory: { hammer: 2 }, freeTrialsGranted: ['hammer'] },
      log: s8.log,
      targets: { ...res.summary.boosterTargets, hammer: true },
    });
    expect(stored[0]).toMatchObject({ state: 'ready', count: 1 });
    const empty = boosterSlotModels({
      levelId: 8,
      inv: { inventory: {}, freeTrialsGranted: ['hammer'] },
      log: [],
      targets: { ...res.summary.boosterTargets, hammer: true },
    });
    expect(empty[0]?.state).toBe('empty');
    expect(slotLook('ready').color).toBe('green');
    expect(slotLook('locked').color).toBe('grey');
    expect(slotLook('noTarget').color).toBe('grey');
  });

  it('E-61 hammer slot without target in level 9 (K-54: unlocked at 8, nothing to break in 9)', () => {
    const g = GameSession.start(draft(9));
    const [hammer, crane] = boosterSlotModels({
      levelId: 9,
      inv: NO_INV,
      log: g.log,
      targets: g.summary().boosterTargets,
    });
    expect(hammer).toMatchObject({ id: 'hammer', state: 'noTarget' });
    expect(crane).toMatchObject({ id: 'crane', state: 'locked' });
  });

  it('UX 5.2 the scene answers K-54: locked → common.unlockAt, noTarget → #108 shake + booster.<id>.noTarget, ready → the pick', () => {
    const scene = src('scenes/level/LevelScene.ts');
    expect(scene).toMatch(
      /model\.state === 'locked'[\s\S]{0,200}t\('common\.unlockAt', \{ n: model\.unlockLevel \}\)/,
    );
    expect(scene).toMatch(
      /model\.state === 'noTarget'[\s\S]{0,200}this\.boosters\.shake\(id, this\.animNow\)/,
    );
    expect(scene).toMatch(/optText\(SLOT_NO_TARGET_KEY\[id\]\)/);
    expect(scene).toMatch(/if \(model\.state === 'empty'\) return;/); // the mini purchase window is Faz 4
  });
});

// --- K-34 hook 5 stuck pulse ---------------------------------------------------------------------------------------------

describe('K-34 hook 5 stuck pulse (GDD Faz 2R, TECH 2R.15 item 2)', () => {
  it('K-34 hook 5 the neededNow pulse comes after 6000 ms (easy) / 12000 ms (normal) without a touch, once per idle period, never on hard', () => {
    expect([
      stuckIdleMs('easy'),
      stuckIdleMs('normal'),
      stuckIdleMs('hard'),
      stuckIdleMs('superhard'),
    ]).toEqual([6000, 12000, null, null]);
    expect(STUCK_PULSES).toBe(2);
    const p = new StuckPulse();
    p.level('easy', 1000);
    expect(p.due(6999, false)).toBe(false);
    expect(p.due(7000, true)).toBe(false); // a tutorial step / window / drag keeps it quiet …
    expect(p.due(7100, false)).toBe(true); // … and it comes when allowed
    expect(p.due(20000, false)).toBe(false); // once per idle period
    p.touched(20000);
    expect(p.due(25999, false)).toBe(false);
    expect(p.due(26000, false)).toBe(true);
    const n = new StuckPulse();
    n.level('normal', 0);
    expect([n.due(11999, false), n.due(12000, false)]).toEqual([false, true]);
    const h = new StuckPulse();
    h.level('hard', 0);
    expect(h.due(1e9, false)).toBe(false);
  });

  it('K-34 hook 5 the scene pulses summary.neededNow and queries unlockedNeeded the frame after a package', () => {
    const scene = src('scenes/level/LevelScene.ts');
    expect(scene).toMatch(/unlockedNeeded\(this\.summaryNow, game\.state, this\.reach, this\.hooks\)/);
    expect(scene).toMatch(/this\.tutorial\?\.current != null/); // K-53 item 4: no pulse while a step is active
    expect(scene).toMatch(/this\.summaryNow\?\.neededNow/);
  });
});

// --- HUD v2 ---------------------------------------------------------------------------------------------------------------

describe('UX 5.9 HUD v2: blocks-left chip and low moves', () => {
  it('K-48 blocks-left chip equals N minus correct (the core formula: Ağır Yük not counted, Söküm / Undo give it back)', () => {
    const b8 = draft(8);
    const g = GameSession.start(b8);
    const material = b8.pieces.filter((p) => p.cls === 'material').length;
    expect(b8.materialCount).toBe(material);
    expect(remainingBlocks(g.state)).toBe(material);
    expect(remainingBlocks(g.state)).toBe(blocksLeft(g.state));
    expect(g.summary().blocksLeft).toBe(remainingBlocks(g.state));
  });

  it('UX 5.1 low-moves warning (DL-2R-19): movesLeft − blocksLeft ≤ 1 or movesLeft ≤ 2; a flawless B10 player (3 spare) never sees it', () => {
    expect(lowMovesWarning(16, 9)).toBe(false);
    expect(lowMovesWarning(10, 9)).toBe(true);
    expect(lowMovesWarning(11, 9)).toBe(false);
    expect(lowMovesWarning(2, 0)).toBe(true);
    expect(lowMovesWarning(3, 0)).toBe(false);
    for (let left = 9; left >= 1; left--) expect(lowMovesWarning(left + 3, left), `${left}`).toBe(false);
  });

  it('UX 5.9 item 7 goal chips: structure + blocks left + ≤ 2 extra goals; 3–4 chips use the compact icon and gap', () => {
    const view = (kind: 'build' | 'clear' | 'collect'): never =>
      ({ index: 0, kind, value: 0, target: 1, done: false }) as never;
    expect(goalChips([view('build')])).toEqual(['build', 'blocks']);
    expect(goalChips([view('build'), view('clear'), view('collect'), view('clear')])).toHaveLength(4);
    expect(chipMetrics(2)).toEqual({ iconPx: 96, gapPx: 24 });
    expect(chipMetrics(3)).toEqual({ iconPx: 72, gapPx: 16 });
  });

  it('K-43 the exit window reads movesSpent (a Söküm gives m back, never movesSpent; CL-2R-01)', () => {
    expect(src('scenes/level/LevelScene.ts')).toMatch(/movesMade: game\.movesSpent,/);
    expect([exitKind(0), exitKind(1)]).toEqual(['free', 'loss']);
  });
});

// --- JUICE schedule of the Faz 2R packages ------------------------------------------------------------------------------

const ctx: Omit<PlanContext, 'reduced'> & { reduced: boolean } = {
  reduced: false,
  gravity: 'normal',
  queuedBefore: [],
  movesBefore: 10,
  pieceHeight: () => 1,
  gridRows: 7,
  blocksLeft: 3,
};
const ev = (body: Record<string, unknown>, step: number, seq = 0): GameEvent =>
  ({ ...body, step, seq }) as unknown as GameEvent;
const at = { zone: 'site', x: 4, y: 0, seg: 0 } as const;

describe('JUICE Faz 2R cues (#94, #107, #61, crane; JUICE 0 rule 14)', () => {
  it('JUICE 0 rule 14 a package that ends in a Söküm plays no correct-placement reward; #107 is its last board cue (locked)', () => {
    const events = [
      ev({ t: 'pieceFell', pieceId: 1, from: at, to: at, rows: 3, cause: 'release' }, 2),
      ev({ t: 'placementCorrect', pieceId: 1, cells: [at], overWall: true }, 3),
      ev({ t: 'comboChanged', combo: 1 }, 3),
      ev({ t: 'movesChanged', movesLeft: 9, delta: -1, reason: 'move' }, 4),
      ev(
        {
          t: 'teardown',
          toTurn: 0,
          cause: 'tiling',
          pieces: [{ pieceId: 1, from: at, to: { zone: 'yard', x: 1, y: 0 } }],
        },
        12,
      ),
    ];
    const plan = planMove(events, ctx, 10);
    const kinds = plan.cues.map((c) => c.kind);
    for (const reward of [12, 15, 16, 83]) expect(kinds).not.toContain(reward);
    const tear = plan.cues.find((c) => c.kind === 'teardown');
    expect(tear?.lock).toBe(true);
    expect(tear?.ms).toBe(TOKENS.duration.teardownSettle + TOKENS.duration.teardown);
    const boardKinds = kinds.filter((k) => k !== 'resync' && k !== 'end');
    expect(boardKinds.at(-1)).toBe('teardown');
    // the same move without the Söküm keeps its rewards
    const plain = planMove(events.slice(0, 4), ctx, 10).cues.map((c) => c.kind);
    expect(plain).toEqual(expect.arrayContaining([12, 15, 83]));
  });

  it('JUICE #94 "Bütün bloklar yerinde" plays right before #55 when K-48 is reached (locked)', () => {
    const events = [
      ev({ t: 'placementCorrect', pieceId: 1, cells: [at], overWall: true }, 3),
      ev({ t: 'segmentCompleted', seg: 0 }, 8),
      ev({ t: 'levelWon', movesLeft: 4 }, 11),
    ];
    const kinds = planMove(events, ctx, 10).cues.map((c) => c.kind);
    const i94 = kinds.indexOf('yardClear');
    expect(i94).toBeGreaterThan(kinds.indexOf(18));
    expect(kinds[i94 + 1]).toBe(55);
  });

  it('K-36 / K-37 the hammer smashes the Ağır Yük, the crane flies its block (step 1 of the booster mini pipeline)', () => {
    const hammer = planMove(
      [
        ev({ t: 'boosterApplied', booster: 'hammer', detail: { target: 'cargo', pieceId: 2 } }, 1),
        ev({ t: 'cargoSmashed', pieceId: 2, at: { zone: 'yard', x: 0, y: 0 } }, 1, 1),
      ],
      ctx,
      10,
    );
    expect(hammer.cues.find((c) => c.kind === 'smash')).toMatchObject({
      piece: 2,
      ms: TOKENS.duration.hammer,
    });
    const crane = planMove(
      [
        ev({ t: 'boosterApplied', booster: 'crane', detail: { pieceId: 3 } }, 1),
        ev({ t: 'pieceLifted', pieceId: 3, by: 'crane', from: at, to: at, shape: 'O4_0' }, 1, 1),
      ],
      ctx,
      10,
    );
    expect(crane.cues.find((c) => c.kind === 'lift')).toMatchObject({
      piece: 3,
      ms: TOKENS.duration.craneBooster,
    });
  });

  it('UX 5.1 #51 follows the Faz 2R trigger when the package carries blocksLeft', () => {
    const tick = (movesLeft: number, blocks: number): boolean =>
      planMove(
        [ev({ t: 'movesChanged', movesLeft, delta: -1, reason: 'move' }, 4)],
        { ...ctx, blocksLeft: blocks },
        10,
      ).cues.some((c) => c.kind === 51);
    expect(tick(4, 3)).toBe(true); // 4 − 3 ≤ 1
    expect(tick(5, 1)).toBe(false); // the Faz 2 "last 5" alone no longer fires
    expect(tick(2, 0)).toBe(true);
  });
});

// --- picker queries ------------------------------------------------------------------------------------------------------

describe('UX 5.2 booster picks read the core (K-33, K-36, K-37)', () => {
  it('K-33 Golden Trowel: selectable = yard material blocks with a non-empty P; the spots are P as goldTrowel moves', () => {
    const g = GameSession.start(draft(1));
    const s = g.state;
    const ids = pickEligible('trowel', s, g.hooks);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(pieceZone(s, id)).toBe(Zone.yard);
      const spots = pickSpots('trowel', s, id);
      expect(spots.length).toBeGreaterThan(0);
      for (const sp of spots)
        expect(sp.move).toMatchObject({ kind: 'goldTrowel', pieceId: id, x: sp.ax, y: sp.ay });
    }
  });

  it('K-36 / K-37 hammer targets the Ağır Yük of level 8; the crane spots of a level 10 block are correct site spots', () => {
    const b8 = draft(8);
    const g8 = GameSession.start(b8);
    expect(pickEligible('hammer', g8.state, g8.hooks).map((id) => b8.pieces[id]?.cls)).toEqual(['cargo']);
    const g10 = GameSession.start(draft(10));
    const id = g10.summary().neededNow[0] ?? -1;
    const spots = pickSpots('crane', g10.state, id);
    expect(spots.length).toBeGreaterThan(0);
    const first = spots[0];
    if (!first) throw new Error('no spot');
    const res = g10.apply(first.move);
    expect(res.status).toBe('applied');
    expect(res.events.some((e) => e.t === 'pieceLifted' && e.by === 'crane')).toBe(true);
  });
});
