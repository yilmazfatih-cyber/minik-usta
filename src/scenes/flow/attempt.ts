/**
 * One level attempt as the save and analytics see it (GDD K-28, K-29, K-43; TECH_DESIGN §11.1, §11.4; META §2, §3, §5;
 * ANALYTICS §2). The core `GameSession` decides the game; this class only records what happened:
 *
 * - start: `save.beginAttempt` (life reserved, `inLevel` with the `start` action) + `level_start`;
 * - every committed action: `save.recordAction` (K-43 resume log; written at once);
 * - out-of-moves window: `setOutcomeWindow('outOfMoves')` + `offer_shown`; paying an offer (coins or the lifetime-first
 *   gift) + `offer_result` / `coin_sink`; declining → loss;
 * - end: ONE `save.endAttempt` write per outcome — win (rewards, `recordWin`, streak +1), loss (the reserved life is
 *   charged, streak reset; K-29 decline or a confirmed exit with `m ≥ 1`), free exit (`m = 0`: life and pre-level
 *   boosters back, streak untouched, E-41) — then `level_end` (+ `coin_source`, `life_lost`). A commit that ends the game
 *   by itself (step 11 win, or out of moves with no offer left) is saved by `settle` right after the commit, BEFORE its
 *   cues and window (K-43: "kazanma anında"; a kill during the cues neither loses the rewards nor strands the attempt).
 *
 * Faz 2R slice (META §4, §10; ANALYTICS §2 v6, TECH §2R.10, §2R.16):
 * - a level won before is a 1–10 loop replay (`isSliceReplay`, read at the start): `mode = replay`, win rewards from
 *   `sliceWinRewards` (base coins only), no star — a star is written only on the level's first win;
 * - the attempt start grants the META §4 free trials of the boosters unlocked by now (`pendingFreeTrials`); an applied
 *   booster leaves the inventory in the same write as its log entry (`SaveService.recordAction`);
 * - `applied(action, package)` is the one entry of every action package of the scene: it records the action, counts
 *   `wrongPlacements`, `truckHelps` (D1 + Söküm) and `teardowns` (an Undo takes back the Söküm / help of the drag it
 *   undoes, E-37, K-39), then sends `booster_used { target }` and `deadlock_teardown { cause }` — after the write.
 *
 * Phase 2 stand-in for `meta/economy` + `meta/lives` + `meta/streak` (TECH §1.2, Phase 4): only the few wallet changes
 * the vertical slice needs, amounts from `config/economy.json`. Pure TypeScript (no Phaser): tests drive it with a
 * `MemoryStore` save and a `FakeClock`.
 */
import economy from '../../../config/economy.json' with { type: 'json' };
import { trowelsOf } from '../../core/combo.ts';
import { ANALYTICS_CAUSE } from '../../core/deadlock.ts';
import type { CompiledLevel } from '../../core/level/compile.ts';
import { RULES_VERSION, levelHash } from '../../core/session.ts';
import type { GameSession, StreakBonus, TeardownEvent } from '../../core/session.ts';
import type { GameEvent, PreBooster, SessionAction } from '../../core/types.ts';
import { pendingFreeTrials } from '../../meta/boosters.ts';
import { isSliceReplay, sliceWinRewards } from '../../meta/home.ts';
import type { AnalyticsEventOf, Track } from '../../services/analytics.ts';
import type { Clock } from '../../services/clock.ts';
import { addBoosters } from '../../services/save.ts';
import type { DeepReadonly, GameMode, InLevel, SaveService } from '../../services/save.ts';
import { offerPrice } from '../../ui/offer.ts';
import type { OfferModel } from '../../ui/offer.ts';
import { remainingBlocks } from '../../ui/remaining.ts';
import type { Difficulty, WinRewards } from '../../ui/rewards.ts';

export interface AttemptDeps {
  readonly save: SaveService;
  readonly track: Track;
  readonly clock: Clock;
}

export type StreakTier = 0 | 1 | 2 | 3;

/** META §5: the win streak counts from `winStreak.unlockLevel` (15) on; below it the counter does not move. */
export function streakActive(levelId: number): boolean {
  return levelId >= economy.winStreak.unlockLevel;
}

/** Level-start tier of streak `s` (META §5 table, `winStreak.tiers`: highest tier whose `minStreak ≤ s`). */
export function streakTierOf(levelId: number, winStreak: number): StreakTier {
  if (!streakActive(levelId)) return 0;
  let tier: StreakTier = 0;
  for (const t of economy.winStreak.tiers) if (winStreak >= t.minStreak) tier = t.tier as StreakTier;
  return tier;
}

/** `GameSession` `streakBonus` option: the tier's moves and trowels (META §5). */
export function streakBonusOf(tier: 1 | 2 | 3): StreakBonus {
  const t = economy.winStreak.tiers.find((x) => x.tier === tier);
  if (!t) throw new Error(`winStreak tier ${tier} missing in config/economy.json`);
  return { moves: t.extraMoves, trowels: t.trowels };
}

/** The smallest coin pack that covers `missing` coins (UX §7 "Altın yetmez": the store highlights it). */
export function packFor(missing: number): (typeof economy.shop.coinPacks)[number] {
  const packs = [...economy.shop.coinPacks].sort((a, b) => a.coins - b.coins);
  return packs.find((p) => p.coins >= missing) ?? (packs[packs.length - 1] as (typeof packs)[number]);
}

/** Store SKUs of ANALYTICS `purchase.sku`; a coin pack's `sku` must be one of them. */
export type CoinPackSku = AnalyticsEventOf<'purchase'>['sku'];

const PACK_SKUS: readonly string[] = [
  'coins_1000',
  'coins_2750',
  'coins_6000',
  'coins_13000',
  'coins_35000',
  'coins_75000',
];

/** A coin pack's SKU as an analytics SKU (throws on a config typo). */
export function packSku(sku: string): CoinPackSku {
  if (!PACK_SKUS.includes(sku)) throw new Error(`coin pack sku ${sku} is not an ANALYTICS purchase sku`);
  return sku as CoinPackSku;
}

export interface LossResult {
  /** The reserved life was charged (no unlimited lives). */
  readonly lifeLost: boolean;
  /** A streak `s > 0` was reset (window 2 `lose.streak`). */
  readonly streakLost: boolean;
}

/** One replayed log entry and its events (K-43 resume: the counters of `level_end` cover the whole attempt). */
export interface ReplayedAction {
  readonly action: SessionAction;
  readonly events: readonly GameEvent[];
}

/** What `applied` reads of an action package (`GameSession.apply` → `ActionResult`). */
export interface AppliedPackage {
  readonly events: readonly GameEvent[];
  readonly teardown: TeardownEvent | null;
}

type BoosterTarget = AnalyticsEventOf<'booster_used'>['target'];
type UsedBooster = AnalyticsEventOf<'booster_used'>['booster'];

/**
 * ANALYTICS v6 `booster_used` of an applied action (TECH §2R.16): Hammer → its K-36 target kind (from the core's
 * `boosterApplied.detail.target`), Crane and Paint Brush → `block`, Undo → `null`. The Golden Trowel is not an
 * inventory booster (`booster` enum = economy.json ids): null, no event.
 */
export function boosterUse(
  action: SessionAction,
  events: readonly GameEvent[],
): { readonly booster: UsedBooster; readonly target: BoosterTarget } | null {
  switch (action.kind) {
    case 'hammer': {
      const hit = events.find((e) => e.t === 'boosterApplied' && e.booster === 'hammer');
      const detail = hit && hit.t === 'boosterApplied' ? (hit.detail as { target?: unknown }) : null;
      const target = typeof detail?.target === 'string' ? (detail.target as BoosterTarget) : null;
      return { booster: 'hammer', target };
    }
    case 'crane':
      return { booster: 'crane', target: 'block' };
    case 'paint':
      return { booster: 'paintBrush', target: 'block' };
    case 'undo':
      return { booster: 'undo', target: null };
    default:
      return null;
  }
}

/** How a game-ending commit was saved (`LevelAttempt.settle`); the scene opens its window when the cues end. */
export type AttemptEnd =
  | { readonly kind: 'win'; readonly rewards: WinRewards }
  | { readonly kind: 'loss'; readonly result: LossResult };

export class LevelAttempt {
  readonly levelId: number;
  /** META §10: the level was won before this attempt (a 1–10 loop replay: base coins only, no star). */
  readonly replay: boolean;
  /** ANALYTICS `level_start.mode` / `level_end.mode` of the attempt (the same after a resume). */
  readonly mode: GameMode;
  readonly #deps: AttemptDeps;
  /** `inLevel.startedAt` (kept: `endAttempt` clears `inLevel` before `level_end` is sent). */
  readonly #startedAt: number;
  #wrong = 0;
  #truckHelps = 0;
  #teardowns = 0;
  /** Truck helps and Söküms of the last drag while an Undo may take it back (K-39 depth 1, E-37). */
  #lastDrag: { readonly helps: number; readonly teardowns: number } | null = null;
  #ended = false;

  private constructor(deps: AttemptDeps, levelId: number, mode: GameMode) {
    this.#deps = deps;
    this.levelId = levelId;
    this.mode = mode;
    this.replay = isSliceReplay(deps.save.data, levelId);
    this.#startedAt = deps.save.data.inLevel?.startedAt ?? deps.clock.now();
  }

  /**
   * A new attempt: `inLevel` + `start` action and the META §4 free trials due now (one write), then `level_start`.
   * A level the save marks won is a replay (`mode = replay`, META §10).
   */
  static begin(
    deps: AttemptDeps,
    lvl: CompiledLevel,
    start: { readonly preBoosters: readonly PreBooster[]; readonly streakTier: StreakTier },
  ): LevelAttempt {
    const d = deps.save.data;
    const unlimited = d.lives.unlimitedUntil > deps.clock.now();
    const mode: GameMode = isSliceReplay(d, lvl.id) ? 'replay' : 'story';
    const attempt = deps.save.beginAttempt({
      levelId: lvl.id,
      seed: lvl.seed,
      mode,
      preBoosters: start.preBoosters,
      streakTier: start.streakTier,
      levelHash: levelHash(lvl.data),
      rulesVersion: RULES_VERSION,
      reserveLife: economy.lives.reserveOnLevelStart && !unlimited,
      freeTrials: pendingFreeTrials(lvl.id, d.boosters.freeTrialsGranted),
    });
    deps.track({
      name: 'level_start',
      level: lvl.id,
      attempt,
      mode,
      preBoosters: start.preBoosters.length,
    });
    return new LevelAttempt(deps, lvl.id, mode);
  }

  /**
   * The attempt already in the save (K-43 resume: same attempt, `attempts` does not grow). `replayed` = the log entries
   * of `GameSession.replay` with their events (or, older callers, all events at once): the counters of `level_end`
   * cover the whole attempt, the moves before the kill included (ANALYTICS §2; review Faz 2 tur 1 #19). Nothing is sent
   * again (`booster_used` / `deadlock_teardown` went out in the killed run). Free trials an older attempt began without
   * are granted now.
   */
  static resumed(
    deps: AttemptDeps,
    inLevel: DeepReadonly<InLevel>,
    replayed: readonly ReplayedAction[] | readonly GameEvent[] = [],
  ): LevelAttempt {
    const attempt = new LevelAttempt(deps, inLevel.levelId, inLevel.mode);
    deps.save.grantTrials(pendingFreeTrials(inLevel.levelId, deps.save.data.boosters.freeTrialsGranted));
    if (replayed.length > 0 && 'action' in (replayed[0] as object)) {
      for (const r of replayed as readonly ReplayedAction[]) attempt.#count(r.action, r.events);
    } else attempt.#count(null, replayed as readonly GameEvent[]);
    return attempt;
  }

  get ended(): boolean {
    return this.#ended;
  }

  /** `level_end` counters so far (tests, debug): wrong placements, truck helps (D1 + Söküm), Söküms. */
  get counters(): {
    readonly wrongPlacements: number;
    readonly truckHelps: number;
    readonly teardowns: number;
  } {
    return { wrongPlacements: this.#wrong, truckHelps: this.#truckHelps, teardowns: this.#teardowns };
  }

  /**
   * Counts `level_end.wrongPlacements`, `truckHelps` and `teardowns` from a package's events (a +5 offer's D1, a
   * replay). A Y8 mortar stick is one wrong placement: the core emits `placementWrong` for it and `mortarStuck` as its
   * outcome (instead of `pieceBounced`). No Undo crosses a +5 offer (K-39), so the last drag is forgotten.
   */
  observe(events: readonly GameEvent[]): void {
    this.#count(null, events);
  }

  /**
   * One applied action package of the scene (`GameSession.apply`): the save records the action at once (K-43; an
   * inventory booster leaves the inventory in the same write), the counters follow its events, then — after the write —
   * `booster_used` (TECH §2R.16 target) and, when the package ended in a Söküm, `deadlock_teardown` (`cause` from the
   * core's D2 / D3a / D3b cause, `movesLeft` after it, `piecesReturned` = its blocks; the table's
   * "unknown before the offer" value has no send point, GDD K-30).
   */
  applied(action: SessionAction, pkg: AppliedPackage, session: GameSession): void {
    if (this.#ended) return;
    this.#count(action, pkg.events);
    this.#deps.save.recordAction(action, { movesMade: session.movesMade });
    const use = boosterUse(action, pkg.events);
    if (use)
      this.#deps.track({
        name: 'booster_used',
        booster: use.booster,
        level: this.levelId,
        target: use.target,
      });
    const td = pkg.teardown;
    if (td) {
      this.#deps.track({
        name: 'deadlock_teardown',
        level: this.levelId,
        cause: ANALYTICS_CAUSE[td.cause],
        movesLeft: session.movesLeft,
        piecesReturned: td.pieces.length,
      });
    }
  }

  /** A committed action (drag, trowel, undo; offers go through `payOffer`). Written at once (K-43). */
  recorded(action: SessionAction, movesMade: number): void {
    if (this.#ended) return;
    this.#deps.save.recordAction(action, { movesMade });
  }

  /** META §3.1 / §10 rewards of a win now: a replay pays the base coins only (`sliceWinRewards`). */
  rewards(session: GameSession, difficulty: Difficulty): WinRewards {
    return sliceWinRewards({
      difficulty,
      movesLeft: session.movesLeft,
      trowels: trowelsOf(session.state),
      replay: this.replay,
    });
  }

  /**
   * Right after a commit (drag, trowel; also after a resume's replay): a game the commit ended is saved at once —
   * `won` → `win` with `rewards()`, `lost` (K-29: out of moves with no offer left) → `loss('lose')`. `null` while the game
   * goes on, waits on the out-of-moves window, or the attempt was already ended.
   */
  settle(session: GameSession, rewards: () => WinRewards): AttemptEnd | null {
    if (this.#ended) return null;
    if (session.outcome === 'won') {
      const r = rewards();
      this.win(session, r);
      return { kind: 'win', rewards: r };
    }
    if (session.outcome === 'lost') return { kind: 'loss', result: this.loss(session, 'lose') };
    return null;
  }

  /** "Altın al" in the out-of-moves window opened the (fake) store (ANALYTICS v5 `store_open.source`). */
  storeOpened(): void {
    this.#deps.track({ name: 'store_open', source: 'out_of_moves' });
  }

  /** Window 1 is open: a kill reopens the same offer (UX §1 (a)); `offer_shown` once per opening. */
  offerShown(model: OfferModel): void {
    if (this.#ended) return;
    const save = this.#deps.save;
    if (save.data.inLevel?.outcomeWindow !== 'outOfMoves') save.setOutcomeWindow('outOfMoves');
    this.#deps.track({
      name: 'offer_shown',
      offer: 'continue',
      placement: 'out_of_moves',
      offerIndex: model.n,
      priceCoins: offerPrice(model),
    });
  }

  /**
   * The coin option was taken: pays the price (0 for the gift, which is then used up), then records the accepted
   * offer action. Returns false (nothing changes) when the wallet cannot pay.
   */
  payOffer(model: OfferModel, action: SessionAction, movesMade: number): boolean {
    if (this.#ended || model.coin.kind === 'short') return false;
    const price = offerPrice(model);
    const save = this.#deps.save;
    if (save.data.coins < price) return false;
    const gift = model.coin.kind === 'gift';
    save.commit((d) => {
      d.coins -= price;
      if (gift) d.firstOfferGiftUsed = true;
    });
    save.recordAction(action, { movesMade, offerCoins: price });
    if (price > 0)
      this.#deps.track({
        name: 'coin_sink',
        amount: price,
        reason: 'continue',
        balanceAfter: save.data.coins,
      });
    this.#deps.track({
      name: 'offer_result',
      offer: 'continue',
      placement: 'out_of_moves',
      offerIndex: model.n,
      priceCoins: price,
      result: gift ? 'free' : 'coins',
    });
    return true;
  }

  /** "Hayır, teşekkürler" (or × ): the offer result; the caller then ends the attempt with `loss`. */
  declined(model: OfferModel): void {
    if (model.coin.kind === 'gift') this.#deps.save.commit((d) => void (d.firstOfferGiftUsed = true));
    this.#deps.track({
      name: 'offer_result',
      offer: 'continue',
      placement: 'out_of_moves',
      offerIndex: model.n,
      priceCoins: offerPrice(model),
      result: 'declined',
    });
  }

  /** Fake store purchase (MVP: no charge, BUSINESS E9): the pack's coins are added. */
  fakePurchase(sku: CoinPackSku): void {
    const pack = economy.shop.coinPacks.find((p) => p.sku === sku);
    if (!pack) throw new Error(`unknown coin pack ${sku}`);
    const save = this.#deps.save;
    save.commit((d) => {
      d.coins += pack.coins;
      d.payer = true;
    });
    this.#deps.track({ name: 'purchase', sku, fake: true });
    this.#deps.track({
      name: 'coin_source',
      amount: pack.coins,
      reason: 'purchase',
      balanceAfter: save.data.coins,
    });
  }

  /**
   * K-28 win: rewards and progress in one write, then `coin_source` per source and `level_end`. META §10: the star is
   * written only on the level's first win (a replay's rewards carry none, and a level already won never adds one).
   */
  win(session: GameSession, rewards: WinRewards): void {
    if (this.#ended) return;
    this.#ended = true;
    const save = this.#deps.save;
    const id = this.levelId;
    save.endAttempt((d) => {
      const key = String(id);
      const rec = d.progress.levels[key] ?? { won: false, attempts: 0 };
      const first = !rec.won;
      rec.won = true;
      d.progress.levels[key] = rec;
      d.progress.highestLevel = Math.max(d.progress.highestLevel, id);
      d.coins += rewards.totalCoins;
      if (first) d.stars += rewards.stars;
      if (streakActive(id)) d.winStreak += 1;
    });
    let balance = save.data.coins - rewards.totalCoins;
    const source = (amount: number, reason: 'level_win' | 'bonus' | 'golden_trowel'): void => {
      if (amount <= 0) return;
      balance += amount;
      this.#deps.track({ name: 'coin_source', amount, reason, balanceAfter: balance });
    };
    source(rewards.baseCoins, 'level_win');
    source(rewards.bonusCoins, 'bonus');
    source(rewards.trowelCoins, 'golden_trowel');
    this.#levelEnd(session, 'win');
  }

  /**
   * K-29 decline / no offer left, or a confirmed exit with `m ≥ 1` (K-43 item 2): the reserved life is charged and the
   * streak resets, in one write; then `life_lost` and `level_end`.
   */
  loss(session: GameSession, result: 'lose' | 'quit'): LossResult {
    if (this.#ended) return { lifeLost: false, streakLost: false };
    this.#ended = true;
    const save = this.#deps.save;
    const lifeLost = save.data.lives.reserved > 0;
    const streakLost = streakActive(this.levelId) && save.data.winStreak > 0;
    save.endAttempt((d) => {
      if (d.lives.reserved > 0) d.lives.stored = Math.max(0, d.lives.stored - 1);
      if (streakActive(this.levelId)) d.winStreak = 0;
    });
    if (lifeLost) this.#deps.track({ name: 'life_lost', level: this.levelId });
    this.#levelEnd(session, result);
    return { lifeLost, streakLost };
  }

  /** K-43 item 2 / E-41: exit at `m = 0` — life and pre-level boosters back, the streak bonus is not consumed. */
  exitFree(session: GameSession, refund: readonly PreBooster[]): void {
    if (this.#ended) return;
    this.#ended = true;
    const counts: Partial<Record<PreBooster, number>> = {};
    for (const p of refund) counts[p] = (counts[p] ?? 0) + 1;
    this.#deps.save.endAttempt((d) => addBoosters(d, counts));
    this.#levelEnd(session, 'quit');
  }

  /**
   * ANALYTICS `tutorial_step` v6: once, when the step ends on its `done` event (K-53; hiding and showing again send
   * nothing). `shows` (≥ 1) and `msToDone` (first show → done) come from the step's `TutorialPresence` (TECH §2R.9).
   */
  tutorialStep(step: number, msToDone: number, shows = 1): void {
    this.#deps.track({ name: 'tutorial_step', level: this.levelId, step, shows, msToDone });
  }

  /** The counters of one package; `action` = its log entry (null: an offer's D1 or an older resume's flat events). */
  #count(action: SessionAction | null, events: readonly GameEvent[]): void {
    let helps = 0;
    let teardowns = 0;
    for (const e of events) {
      if (e.t === 'placementWrong') this.#wrong += 1;
      else if (e.t === 'truckHelp') helps += 1;
      else if (e.t === 'teardown') teardowns += 1;
    }
    // ANALYTICS v6: truckHelps = D1 helps + Söküms (teardowns ≤ truckHelps)
    this.#truckHelps += helps + teardowns;
    this.#teardowns += teardowns;
    if (action?.kind === 'undo') {
      // K-39 / E-37: the Undo takes back the help or Söküm of the drag it undoes (the core restores the state before it)
      const last = this.#lastDrag;
      if (last) {
        this.#truckHelps -= last.helps;
        this.#teardowns -= last.teardowns;
      }
      this.#lastDrag = null;
      return;
    }
    this.#lastDrag = action?.kind === 'drag' ? { helps: helps + teardowns, teardowns } : null;
  }

  #levelEnd(session: GameSession, result: 'win' | 'lose' | 'quit'): void {
    const yao = session.yao().yao;
    this.#deps.track({
      name: 'level_end',
      level: this.levelId,
      mode: this.mode,
      result,
      movesLeft: session.movesLeft,
      wrongPlacements: this.#wrong,
      yao: yao === null ? 0 : Math.round(yao * 100),
      durationMs: Math.max(0, Math.round(this.#deps.clock.now() - this.#startedAt)),
      extensions: Math.min(3, session.offersUsed),
      // K-43 Faz 2R / ANALYTICS v6: a free exit is a quit with no move spent (a Söküm never gives `movesSpent` back)
      exitFree: result === 'quit' && session.movesSpent === 0,
      truckHelps: this.#truckHelps,
      teardowns: this.#teardowns,
      // bitişteki kalan malzeme bloğu (K-48; 0 on a win) = the loss window's `lose.blocksLeft`
      blocksLeft: result === 'win' ? 0 : remainingBlocks(session.state),
    });
  }
}
