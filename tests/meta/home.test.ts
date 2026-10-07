/**
 * Home model v2 (TECH §2R.8 `HomeModel`, UX_FLOWS §3, META §10 slice scope, ART §7.2 reveal) and the slice's win
 * rewards (META §3.1 + §10 "1–10 döngüsü").
 */
import { describe, expect, it } from 'vitest';
import economy from '../../config/economy.json' with { type: 'json' };
import {
  HOME_TABS,
  SLICE_LEVEL_COUNT,
  formatCountdown,
  homeModel,
  homeNextLevel,
  isSliceReplay,
  livesView,
  sliceEndOf,
  sliceWinRewards,
  structureStageOf,
} from '../../src/meta/home.ts';
import type { HomeInput } from '../../src/meta/home.ts';
import { createDefaultSave } from '../../src/services/save.ts';
import type { SaveData } from '../../src/services/save.ts';
import { TOKENS } from '../../src/theme/tokens.ts';
import { winRewards } from '../../src/ui/rewards.ts';

const NOW = 1_800_000_000_000;
const STOPS = TOKENS.layout.home.ch1CropStops;
const TEN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function save(won: readonly number[], patch: (d: SaveData) => void = () => undefined): SaveData {
  const d = createDefaultSave({
    analyticsId: 'a',
    installId: 'i',
    now: NOW,
    wallet: { coins: 500, lives: 5, boosters: {} },
  });
  for (const id of won) d.progress.levels[String(id)] = { won: true, attempts: 1 };
  d.progress.highestLevel = Math.max(0, ...won);
  d.stars = won.length;
  patch(d);
  return d;
}

const input = (d: SaveData, extra: Partial<HomeInput> = {}): HomeInput => ({
  save: d,
  now: NOW,
  available: TEN,
  ...extra,
});

describe('UX 3 home model (META §10 slice)', () => {
  it('UX 3 home model: progress and the tree house reveal count distinct first wins out of 10', () => {
    const m = homeModel(input(save([1, 2, 3, 4])), STOPS);
    expect(m.progress).toEqual({ value: 4, max: SLICE_LEVEL_COUNT });
    expect(m.structureRatio).toBeCloseTo(0.4);
    // ART §7.2 stops 0.18, 0.36 passed; 0.52 not yet
    expect(m.structureStage).toBe(2);
    expect(m.coins).toBe(500);
    expect(m.stars).toBe(4);
  });

  it('UX 3 home model: a replayed level does not count twice and levels past 10 do not count', () => {
    const d = save([1, 2, 3], (x) => {
      x.progress.levels['2'] = { won: true, attempts: 5 };
      x.progress.levels['12'] = { won: true, attempts: 1 };
    });
    expect(homeModel(input(d), STOPS).progress.value).toBe(3);
  });

  it('UX 3 home model: the next level follows the last result (win → next, loss → same, cold → first not won)', () => {
    const d = save([1, 2]);
    expect(homeNextLevel(d, { levelId: 2, won: true }, 10)).toBe(3);
    expect(homeNextLevel(d, { levelId: 3, won: false }, 10)).toBe(3);
    expect(homeNextLevel(d, null, 10)).toBe(3);
    // a voided attempt keeps its level (UX §1 (c))
    const v = save([1, 2], (x) => {
      x.voidNotice = { level: 2, refunds: { life: 1, boosters: {}, coins: 0 }, bridge: false };
    });
    expect(homeNextLevel(v, null, 10)).toBe(2);
  });

  it('META 10 after level 10 the button loops 1 … 10 and the more-soon band shows', () => {
    const d = save(TEN);
    const m = homeModel(input(d, { last: { levelId: 10, won: true } }), STOPS);
    expect(m.nextLevel).toBe(1);
    expect(m.contentEnd).toBe(true);
    expect(m.replayLoop).toBe(true);
    expect(homeModel(input(d, { last: { levelId: 4, won: true } }), STOPS).nextLevel).toBe(5);
    expect(homeModel(input(d), STOPS).nextLevel).toBe(1);
  });

  it('UX 3 home model: the loop ends at the last bundled level without a gap (five files → 1–5)', () => {
    expect(sliceEndOf([1, 2, 3, 4, 5])).toBe(5);
    expect(sliceEndOf([1, 2, 4, 5])).toBe(2);
    expect(sliceEndOf(TEN.concat([11, 12]))).toBe(10);
    expect(sliceEndOf([])).toBe(1);
    const d = save([1, 2, 3, 4, 5]);
    const m = homeModel(input(d, { available: [1, 2, 3, 4, 5], last: { levelId: 5, won: true } }), STOPS);
    expect(m.nextLevel).toBe(1);
    expect(m.contentEnd).toBe(true);
    // progress still counts out of 10 (META §10)
    expect(m.progress).toEqual({ value: 5, max: 10 });
  });

  it('UX 3 home model: the level chest ring shows n/10 from level 1 and is full (✓) at 10', () => {
    expect(homeModel(input(save([1])), STOPS).chest).toEqual({ value: 1, max: 10, full: false });
    expect(homeModel(input(save(TEN)), STOPS).chest).toEqual({ value: 10, max: 10, full: true });
    expect(economy.levelChest.everyLevels).toBe(10);
  });

  it('UX 3 home model: every tab but home is locked in the slice', () => {
    const m = homeModel(input(save(TEN)), STOPS);
    expect(m.tabs.map((x) => x.id)).toEqual([...HOME_TABS]);
    expect(m.tabs.filter((x) => !x.locked).map((x) => x.id)).toEqual(['home']);
  });

  it('UX 3 home model: the difficulty tag shows only for hard and super hard', () => {
    const d = save([1]);
    expect(homeModel(input(d, { nextDifficulty: 'hard' }), STOPS).difficultyTag).toBe('hard');
    expect(homeModel(input(d, { nextDifficulty: 'superhard' }), STOPS).difficultyTag).toBe('superhard');
    expect(homeModel(input(d, { nextDifficulty: 'normal' }), STOPS).difficultyTag).toBeNull();
    expect(homeModel(input(d), STOPS).difficultyTag).toBeNull();
  });

  it('UX 3 home model: "Bölüm 2" pulses after level 1 until level 2 is tried (UX §2.2 step 11)', () => {
    expect(homeModel(input(save([1]), { last: { levelId: 1, won: true } }), STOPS).pulse).toBe(true);
    const tried = save([1], (x) => {
      x.progress.levels['2'] = { won: false, attempts: 1 };
    });
    expect(homeModel(input(tried), STOPS).pulse).toBe(false);
    expect(homeModel(input(save([1, 2])), STOPS).pulse).toBe(false);
  });

  it('UX 3 home model: lives show stored − reserved, regenerate every 30 min up to 5, "Dolu" when full', () => {
    const full = livesView({ stored: 5, reserved: 0, regenAnchor: NOW, unlimitedUntil: 0 }, NOW, NOW);
    expect(full).toMatchObject({ count: 5, full: true, nextInMs: null });
    const min = 60_000;
    const two = livesView(
      { stored: 2, reserved: 0, regenAnchor: NOW, unlimitedUntil: 0 },
      NOW + 45 * min,
      NOW,
    );
    expect(two.count).toBe(3);
    expect(two.nextInMs).toBe(15 * min);
    expect(formatCountdown(two.nextInMs ?? 0)).toBe('15:00');
    const reserved = livesView({ stored: 5, reserved: 1, regenAnchor: NOW, unlimitedUntil: 0 }, NOW, NOW);
    expect(reserved.count).toBe(4);
    // the clock went back: the countdown freezes at lastSeenNow (TECH §11.2)
    const back = livesView(
      { stored: 2, reserved: 0, regenAnchor: NOW, unlimitedUntil: 0 },
      NOW - 10 * min,
      NOW,
    );
    expect(back.count).toBe(2);
    expect(back.nextInMs).toBe(30 * min);
    const unl = livesView({ stored: 0, reserved: 0, regenAnchor: NOW, unlimitedUntil: NOW + min }, NOW, NOW);
    expect(unl).toMatchObject({ unlimited: true, full: true });
  });

  it('UX 3 home model: crop stops are counted inclusively', () => {
    expect(structureStageOf(0, STOPS)).toBe(0);
    expect(structureStageOf(0.18, STOPS)).toBe(1);
    expect(structureStageOf(1, STOPS)).toBe(STOPS.length);
  });
});

describe('META 10 slice win rewards', () => {
  it('META 10 replay loop gives base coins only (no star, no Bonus İnşaat, no trowel coins)', () => {
    const r = sliceWinRewards({ difficulty: 'normal', movesLeft: 7, trowels: 1, replay: true });
    expect(r).toEqual({
      baseCoins: economy.levelRewards.winCoins.normal,
      bonusMoves: 0,
      bonusCoins: 0,
      trowels: 0,
      trowelCoins: 0,
      stars: 0,
      totalCoins: economy.levelRewards.winCoins.normal,
    });
  });

  it('META 10 a first win pays META §3.1 in full and 1 star (same as ui/rewards)', () => {
    for (const difficulty of ['easy', 'normal', 'hard', 'superhard'] as const) {
      for (const movesLeft of [0, 4, 15]) {
        const first = sliceWinRewards({ difficulty, movesLeft, trowels: 1, replay: false });
        expect(first).toEqual(winRewards({ difficulty, movesLeft, trowels: 1 }));
      }
    }
    // META §3.1 example: normal, 4 moves and 1 trowel left → 30 + 12 + 10
    expect(
      sliceWinRewards({ difficulty: 'normal', movesLeft: 4, trowels: 1, replay: false }).totalCoins,
    ).toBe(52);
  });

  it('META 10 a level counts as a replay once it was won', () => {
    expect(isSliceReplay(save([1, 2]), 2)).toBe(true);
    expect(isSliceReplay(save([1, 2]), 3)).toBe(false);
  });
});
