/**
 * Home screen model v2 (docs/TECH_DESIGN.md §2R.8 `HomeModel`; UX_FLOWS §3 ana sayfa v2; META §10 Faz 2R dilim
 * kapsamı, PL-2R-18; ART §7.2 kırpma). Pure and engine-free (ESLint: meta imports no Phaser, no scenes/ui): the save
 * data + `config/economy.json` + the bundled level ids in, one immutable model out. The home scene only draws it.
 *
 * Faz 2R slice rules (META §10):
 * - no town tasks and no star spending: `progress` = distinct levels won for the first time / 10, and the tree house
 *   opens linearly with it (ART §7.2 "Faz 2R dilimi: oran = kazanılmış farklı bölüm / 10 (doğrusal)");
 * - the level chest ring n/10 is always shown (META §8.2, UX §3), the other side icons are hidden;
 * - every bottom tab but "Ana Sayfa" is locked ("Yakında"); the shop is locked, so the coin "+" says "Yakında";
 * - after level 10 the button loops 1 … 10 (META §10 "1–10 döngüsü"): original budget, no star, base coins only, no
 *   tutorial (GDD K-53 item 6) — `sliceWinRewards` is the reward side of that rule.
 *
 * The loop ends at the last level of 1…10 that is bundled without a gap (`available`), so a build that still ships
 * five level files loops 1–5 exactly like the Phase 2 slice did.
 */
import economy from '../../config/economy.json' with { type: 'json' };
import type { DeepReadonly, SaveData } from '../services/save.ts';

/** META §10 / R2-06: the Faz 2R vertical slice is levels 1–10; progress and the tree house count up to it. */
export const SLICE_LEVEL_COUNT = 10;

/** UX §3 bottom navigation, left → right (ANALYTICS `nav_tap.tab`). */
export const HOME_TABS = ['shop', 'league', 'home', 'team', 'album'] as const;
export type HomeTab = (typeof HOME_TABS)[number];

export type Difficulty = keyof typeof economy.levelRewards.winCoins;

/** The level the home screen came back from (win → next level, loss / exit → the same level). */
export interface HomeLast {
  readonly levelId: number;
  readonly won: boolean;
}

export interface HomeInput {
  readonly save: DeepReadonly<SaveData>;
  /** Wall clock (ms); the lives countdown freezes at `save.lastSeenNow` when the clock goes back (TECH §11.2). */
  readonly now: number;
  readonly last?: HomeLast | null;
  /** Level ids bundled with this build (`availableLevels()`). */
  readonly available: readonly number[];
  /** Difficulty of `nextLevel` once its JSON is loaded (the ZOR / ÇOK ZOR tag, UX §3); unknown → no tag. */
  readonly nextDifficulty?: Difficulty | null;
}

/** META §2 lives as the capsule shows them (UX §3 "Can kapsülü"). */
export interface LivesView {
  readonly count: number;
  readonly max: number;
  /** `hud.livesFull` "Dolu" instead of the countdown. */
  readonly full: boolean;
  /** Unlimited lives running (`icon_life_unlimited` + countdown, Faz 4). */
  readonly unlimited: boolean;
  /** Time to the next life ("29:12"), null when full or unlimited. */
  readonly nextInMs: number | null;
}

export interface HomeTabState {
  readonly id: HomeTab;
  readonly locked: boolean;
}

export interface HomeModel {
  readonly lives: LivesView;
  readonly coins: number;
  readonly stars: number;
  /** Level the "Bölüm N" button opens. */
  readonly nextLevel: number;
  /** Last level of the slice loop (≤ `SLICE_LEVEL_COUNT`). */
  readonly sliceEnd: number;
  /** Area progress bar: distinct slice levels won / `SLICE_LEVEL_COUNT` (UX §3 "Faz 2R yedeği"). */
  readonly progress: { readonly value: number; readonly max: number };
  /** Revealed share of the tree house from the bottom, 0…1 (ART §7.2, linear in the slice). */
  readonly structureRatio: number;
  /** How many `layout.home.ch1CropStops` the reveal has passed (0…7; the Faz 4 task stages). */
  readonly structureStage: number;
  /** Level chest ring (META §8.2): wins towards the next chest. `full` = opened / complete (✓ in the loop). */
  readonly chest: { readonly value: number; readonly max: number; readonly full: boolean };
  readonly tabs: readonly HomeTabState[];
  /** UX §3 difficulty tag over the button (`difficulty.hard` / `.superhard`), null for easy / normal / unknown. */
  readonly difficultyTag: 'hard' | 'superhard' | null;
  /** Every slice level is won: the `home.moreSoon` band shows and the button loops (META §10). */
  readonly contentEnd: boolean;
  /** `nextLevel` was won before: a 1–10 loop replay (no star, base coins, no tutorial). */
  readonly replayLoop: boolean;
  /** UX §2.2 step 11: "Bölüm 2" pulses right after level 1 until level 2 is tried. */
  readonly pulse: boolean;
}

const won = (save: DeepReadonly<SaveData>, id: number): boolean =>
  save.progress.levels[String(id)]?.won === true;

/** Last level of 1…`SLICE_LEVEL_COUNT` bundled without a gap (≥ 1 so the button always has a level). */
export function sliceEndOf(available: readonly number[]): number {
  const have = new Set(available);
  let n = 0;
  while (n < SLICE_LEVEL_COUNT && have.has(n + 1)) n += 1;
  return Math.max(1, n);
}

/** Distinct levels of 1…`count` won at least once. */
export function wonLevels(save: DeepReadonly<SaveData>, count = SLICE_LEVEL_COUNT): number {
  let n = 0;
  for (let id = 1; id <= count; id++) if (won(save, id)) n += 1;
  return n;
}

/** The loop step: 1 → 2 … sliceEnd → 1. */
export function nextInSlice(id: number, sliceEnd: number): number {
  return id >= sliceEnd || id < 1 ? 1 : id + 1;
}

/**
 * The "Bölüm N" level: after a win the next one of the loop, after a loss / exit / voided attempt the same one, on a
 * cold start the first slice level not won yet (1 once all are won, META §10 loop).
 */
export function homeNextLevel(
  save: DeepReadonly<SaveData>,
  last: HomeLast | null | undefined,
  sliceEnd: number,
): number {
  const voided = save.voidNotice?.level;
  const from = last ?? (voided !== undefined ? { levelId: voided, won: false } : null);
  if (from) {
    if (from.won) return nextInSlice(from.levelId, sliceEnd);
    return from.levelId >= 1 && from.levelId <= sliceEnd ? from.levelId : 1;
  }
  for (let id = 1; id <= sliceEnd; id++) if (!won(save, id)) return id;
  return 1;
}

/** META §2 lives view: shown = stored − reserved, +1 every `regenMinutes` from `regenAnchor` up to `max`. */
export function livesView(
  lives: DeepReadonly<SaveData['lives']>,
  now: number,
  lastSeenNow: number,
  eco: { readonly max: number; readonly regenMinutes: number } = economy.lives,
): LivesView {
  const t = Math.max(now, lastSeenNow);
  const unlimited = lives.unlimitedUntil > t;
  const base = Math.max(0, lives.stored - lives.reserved);
  if (unlimited) return { count: eco.max, max: eco.max, full: true, unlimited, nextInMs: null };
  if (base >= eco.max) return { count: base, max: eco.max, full: true, unlimited, nextInMs: null };
  const step = eco.regenMinutes * 60_000;
  const elapsed = Math.max(0, t - lives.regenAnchor);
  const count = Math.min(eco.max, base + Math.floor(elapsed / step));
  const full = count >= eco.max;
  return { count, max: eco.max, full, unlimited, nextInMs: full ? null : step - (elapsed % step) };
}

/** "29:12" (mm:ss, minutes not capped) for the lives countdown. */
export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/** ART §7.2: number of crop stops the ratio reached (a stop counts when the ratio is within 1e-9 of it). */
export function structureStageOf(ratio: number, stops: readonly number[]): number {
  let n = 0;
  for (const s of stops) if (ratio + 1e-9 >= s) n += 1;
  return n;
}

export function homeModel(input: HomeInput, cropStops: readonly number[]): HomeModel {
  const { save } = input;
  const sliceEnd = sliceEndOf(input.available);
  const nextLevel = homeNextLevel(save, input.last, sliceEnd);
  const value = wonLevels(save);
  const ratio = Math.min(1, value / SLICE_LEVEL_COUNT);
  const chestMax = economy.levelChest.everyLevels;
  const chestValue = Math.min(chestMax, wonLevels(save, chestMax));
  let contentEnd = true;
  for (let id = 1; id <= sliceEnd; id++) if (!won(save, id)) contentEnd = false;
  const triedNext = (save.progress.levels[String(nextLevel)]?.attempts ?? 0) > 0;
  const d = input.nextDifficulty ?? null;
  return {
    lives: livesView(save.lives, input.now, save.lastSeenNow),
    coins: save.coins,
    stars: save.stars,
    nextLevel,
    sliceEnd,
    progress: { value, max: SLICE_LEVEL_COUNT },
    structureRatio: ratio,
    structureStage: structureStageOf(ratio, cropStops),
    chest: { value: chestValue, max: chestMax, full: chestValue >= chestMax },
    // META §10: the shop (5) and league (25) stay locked in the slice; team and album are MVP-locked (R-19)
    tabs: HOME_TABS.map((id) => ({ id, locked: id !== 'home' })),
    difficultyTag: d === 'hard' || d === 'superhard' ? d : null,
    contentEnd,
    replayLoop: won(save, nextLevel),
    pulse: nextLevel === 2 && save.progress.highestLevel === 1 && !triedNext,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Win rewards in the slice (META §3.1 + §10 "Bölüm 10'dan sonra")

export interface SliceWinInput {
  readonly difficulty: Difficulty;
  readonly movesLeft: number;
  /** Golden Trowels held at the win (K-33). */
  readonly trowels: number;
  /** The level was won before this attempt (`isSliceReplay` read at the attempt start). */
  readonly replay: boolean;
}

/** Same fields as ui/rewards `WinRewards` (structurally assignable; meta cannot import ui). */
export interface SliceWinRewards {
  readonly baseCoins: number;
  readonly bonusMoves: number;
  readonly bonusCoins: number;
  readonly trowels: number;
  readonly trowelCoins: number;
  readonly stars: number;
  readonly totalCoins: number;
}

/** True when `levelId` already counts as won: its next win is a META §10 loop replay. */
export function isSliceReplay(save: DeepReadonly<SaveData>, levelId: number): boolean {
  return won(save, levelId);
}

/**
 * META §3.1 rewards, with the §10 loop rule: a first win pays base + Bonus İnşaat (≤ `bonusMaxMovesCounted` moves) +
 * leftover trowels and 1 ★; a replay pays only the base coins of the level's difficulty — no star, no bonus, no trowel
 * coins (the trowel is still earned and used in play).
 */
export function sliceWinRewards(input: SliceWinInput, eco = economy): SliceWinRewards {
  const r = eco.levelRewards;
  const baseCoins = r.winCoins[input.difficulty];
  if (input.replay) {
    return {
      baseCoins,
      bonusMoves: 0,
      bonusCoins: 0,
      trowels: 0,
      trowelCoins: 0,
      stars: 0,
      totalCoins: baseCoins,
    };
  }
  const bonusMoves = Math.max(0, Math.min(input.movesLeft, r.bonusMaxMovesCounted));
  const bonusCoins = bonusMoves * r.bonusCoinsPerMoveLeft;
  const trowels = Math.max(0, input.trowels);
  const trowelCoins = trowels * r.coinsPerLeftoverTrowel;
  return {
    baseCoins,
    bonusMoves,
    bonusCoins,
    trowels,
    trowelCoins,
    stars: eco.stars.perWin,
    totalCoins: baseCoins + bonusCoins + trowelCoins,
  };
}
