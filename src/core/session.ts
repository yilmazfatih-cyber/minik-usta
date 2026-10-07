/**
 * `GameSession` (docs/GDD.md K-39, K-43, K-29, K-28, K-40; TECH_DESIGN §1.2, §6.1, §11.1): one attempt at one level.
 * Pure (no clock, no storage): the scene commits actions, the save service stores the action log after each one.
 *
 * - State + move log: `log[0]` is the `start` action (pre-level boosters, streak tier); then every committed drag,
 *   trowel use, accepted +5 offer and undo, in order (TECH §11.1 `InLevel.actions`). Cancelled drags and rejected
 *   boosters change nothing and are not logged.
 * - K-39 Undo: before each action the buffer is copied (≈ 0.7–4 KB); the copy is the K-30 Söküm target of that
 *   action (`ApplyOptions.preAction`, no second copy) and, for a drag, the Undo snapshot. Undo restores it IN PLACE
 *   (the scene keeps its state reference), so counter, `m`, `movesSpent` (−1), timers, streak, trowels, deliveries and
 *   queue, segment shift, goals — and a truck help or Söküm of that move's step 12 (E-37) — all come back. Depth 1;
 *   not after a booster / trowel / +5 offer; not while the out-of-moves window is open (core/boosters.ts `undoBlock`).
 * - `apply(action)` (TECH §2R.15): one package per action — the events in step order (a Söküm's `teardown` last), the
 *   `teardown` short cut and the `TurnSummary` of the state after it (core/summary.ts).
 * - K-43 resume: `GameSession.replay(level, log)` rebuilds the attempt deterministically, bit for bit (E-38), with the
 *   same undo snapshot, offer count and out-of-moves window (UX §1 (a)). A replay that does not apply throws
 *   `ReplayError` (the caller voids the attempt, like a level hash / rules version mismatch, K-43 item 4).
 * - K-29: when a move ends with 0 moves and no win, the window offers `n = offersUsed + 1` (n ≤ 3; the ad option only
 *   for n = 1). Accepting runs `addMoves` (+5, step 12 once); declining loses the level. With 3 offers used the level is
 *   lost at once (no window).
 * - K-43 exit: only with the player's confirmation; `movesSpent ≥ 1` is a loss, `movesSpent = 0` is free (life and
 *   pre-level boosters are refunded by meta, the streak bonus is not consumed, E-41). Faz 2R: `movesSpent`, not `m`
 *   (a Söküm gives `m` back but never `movesSpent`).
 * - Attempt counting (`levels[id].attempts`, K-43: a resume is the same attempt) lives in the save service;
 *   `resumed` tells the caller which case it is.
 */
import type { GameEvent, Move, PreBooster, SessionAction } from './types.ts';
import { H, STATE_FLAG, createInitialState, hdr, setHdr } from './state.ts';
import type { GameState } from './state.ts';
import type { CompiledLevel } from './level/compile.ts';
import { ArraySink, NULL_SINK, applyMove, canonicalJson, fnv1a64, measureYao } from './moves.ts';
import type { EventSink, MoveHooks, MoveResult, YaoMeasure } from './moves.ts';
import { grantTrowels } from './combo.ts';
import { undoBlock } from './boosters.ts';
import type { BoosterOutcome, UndoBlock } from './boosters.ts';
import { levelHooks } from './obstacles/registry.ts';
import { turnSummary } from './summary.ts';
import type { TurnSummary } from './summary.ts';

/**
 * Core rules version (K-43 item 4): bump it whenever a rule change can change the replay of a saved log. 2 = Faz 2R
 * (full cover K-47/K-48, sizes K-49, Söküm K-30, new boosters, Zobrist frame positions; TECH §2R.0 item 4).
 */
export const RULES_VERSION = 2;
/** K-29: moves of an accepted offer. */
export const OFFER_MOVES = 5;
/** K-29: offers per attempt (ad or coins). */
export const MAX_OFFERS = 3;
/** K-40 Termos: extra moves. */
export const THERMOS_MOVES = 3;
/** K-40 Mala Başlangıcı: extra trowels. */
export const TROWEL_START = 1;
/** K-40 Açık Kepenk: W4 / W7 count as open while `m < 5`. */
export const OPEN_SHUTTER_MOVES = 5;

/** `playing` · `outOfMoves` (K-29 window open) · `won` (K-28) · `lost` (declined / no offer left / exit with m ≥ 1) ·
 * `exited` (free exit at m = 0). */
export type SessionOutcome = BoosterOutcome;

export type StartAction = Extract<SessionAction, { kind: 'start' }>;

/** `GameSession.replay` observer: called after action `index` of the log applied (`start` = index 0). */
export type ReplayStep = (index: number, action: SessionAction, session: GameSession) => void;
export type StreakTier = StartAction['streakTier'];

/** Win-streak level-start bonus of a tier (amounts: config/economy.json `winStreak`, META; read by meta). */
export interface StreakBonus {
  readonly moves: number;
  readonly trowels: number;
}

export interface SessionOptions {
  readonly hooks?: MoveHooks;
  /**
   * Bonus of streak tier 1–3. Core cannot read config/economy.json, so the caller passes it; the default throws for a
   * tier above 0 (a silent zero would hide a wiring bug).
   */
  readonly streakBonus?: (tier: 1 | 2 | 3) => StreakBonus;
  /** Invalid move records throw (development) instead of becoming `moveCancelled{reason: 'invalid'}`. */
  readonly strict?: boolean;
}

/** The +5 offer the out-of-moves window shows (K-29). */
export interface OfferInfo {
  /** Offer number of this attempt (1–3); the price step is `offerCosts[n − 1]` (meta). */
  readonly n: number;
  /** The ad option exists only on the first offer of an attempt. */
  readonly adAllowed: boolean;
}

export interface ExitResult {
  /** `free`: `movesSpent` = 0 (K-43 item 2, E-41); `loss`: `movesSpent` ≥ 1. */
  readonly kind: 'free' | 'loss';
  readonly movesMade: number;
  /** K-43 item 2 (Faz 2R): the counter the penalty reads. */
  readonly movesSpent: number;
  /** Free exit: pre-level boosters to give back (the reserved life is meta's). Empty on a loss. */
  readonly refundPreBoosters: readonly PreBooster[];
  /** The win-streak bonus counts as used (false on a free exit: given again next time). */
  readonly streakBonusConsumed: boolean;
}

/** A logged action that does not replay (K-43): the attempt cannot be rebuilt. */
export class ReplayError extends Error {
  readonly index: number;
  constructor(index: number, message: string) {
    super(`replay: action ${index}: ${message}`);
    this.name = 'ReplayError';
    this.index = index;
  }
}

/** The K-30 Söküm event of a package (TECH §2R.15). */
export type TeardownEvent = Extract<GameEvent, { t: 'teardown' }>;

/** What `GameSession.apply` takes: a move, Undo, or an accepted +5 offer (`addMoves` from `offerCoins` / `offerAd`). */
export type SessionInput = Move | { readonly kind: 'undo' };

/**
 * One action package (TECH §2R.15 item 3, DL-2R-15/3): the result, the events in step order (a Söküm's `teardown` is
 * the last one), the `teardown` short cut (the scene skips the correct-placement rewards when it is set, JUICE §0
 * rule 14) and the summary of the state after the action.
 */
export interface ActionResult extends MoveResult {
  readonly events: readonly GameEvent[];
  readonly teardown: TeardownEvent | null;
  readonly summary: TurnSummary;
}

const NOT_PLAYING: MoveResult = Object.freeze({
  status: 'rejected',
  reason: 'notPlaying',
  won: false,
  outOfMoves: false,
});

function noStreakBonus(tier: number): StreakBonus {
  throw new Error(`GameSession: streak tier ${tier} needs options.streakBonus (META win-streak amounts)`);
}

function copyAction<T extends SessionAction>(a: T): T {
  return JSON.parse(JSON.stringify(a)) as T;
}

export class GameSession {
  readonly lvl: CompiledLevel;
  /** Built by `replay` (K-43 resume: the same attempt, `attempts` does not grow). */
  readonly resumed: boolean;
  readonly preBoosters: readonly PreBooster[];
  readonly streakTier: StreakTier;

  readonly #state: GameState;
  readonly #log: SessionAction[];
  readonly #opts: SessionOptions;
  /** Pre-move buffer of the last committed drag while it may be undone (K-39). */
  #undo: Int32Array | null = null;
  #outcome: SessionOutcome = 'playing';
  #offersUsed = 0;
  #adOfferUsed = false;

  private constructor(
    lvl: CompiledLevel,
    start: StartAction,
    opts: SessionOptions,
    resumed: boolean,
    sink: EventSink,
  ) {
    this.lvl = lvl;
    this.resumed = resumed;
    this.#opts = opts;
    this.preBoosters = Object.freeze([...start.preBoosters]);
    this.streakTier = start.streakTier;
    this.#state = createInitialState(lvl);
    this.#log = [copyAction(start)];
    this.#applyStart(sink);
  }

  /** A new attempt (K-40 bonuses applied: Termos, streak moves, trowels, Open Shutter). */
  static start(
    lvl: CompiledLevel,
    start: { readonly preBoosters?: readonly PreBooster[]; readonly streakTier?: StreakTier } = {},
    opts: SessionOptions = {},
    sink: EventSink = NULL_SINK,
  ): GameSession {
    const action: StartAction = {
      kind: 'start',
      preBoosters: [...(start.preBoosters ?? [])],
      streakTier: start.streakTier ?? 0,
    };
    return new GameSession(lvl, action, opts, false, sink);
  }

  /**
   * K-43 resume: rebuilds the attempt from its action log. Throws `ReplayError` when it does not apply. `sink` receives
   * the events of every replayed action in log order (start included): the caller rebuilds per-attempt counters from
   * them (`level_end.wrongPlacements`, `truckHelps`; review Faz 2 tur 1 #19). `step` is called after every action
   * (`start` included, index 0) with the session as it is right then: the scene rebuilds its tutorial step from the log,
   * each move seen with the state of its time (review Faz 2 tur 2 #8).
   */
  static replay(
    lvl: CompiledLevel,
    log: readonly SessionAction[],
    opts: SessionOptions = {},
    sink: EventSink = NULL_SINK,
    step?: ReplayStep,
  ): GameSession {
    const first = log[0];
    if (!first || first.kind !== 'start') throw new ReplayError(0, 'the log must start with a start action');
    const session = new GameSession(lvl, first, opts, true, sink);
    step?.(0, first, session);
    for (let i = 1; i < log.length; i++) {
      const a = log[i] as SessionAction;
      if (a.kind === 'start') throw new ReplayError(i, 'a second start action');
      if (a.kind === 'undo') {
        if (!session.undo()) throw new ReplayError(i, `undo is not available (${session.undoBlock()})`);
      } else if (a.kind === 'addMoves') {
        if (a.source !== 'offerCoins' && a.source !== 'offerAd')
          throw new ReplayError(i, `addMoves from ${a.source} belongs to the start action`);
        if (a.amount !== OFFER_MOVES) throw new ReplayError(i, `an offer adds ${OFFER_MOVES} moves`);
        const res = session.acceptOffer(a.source, sink);
        if (res.status !== 'applied') throw new ReplayError(i, `offer not accepted (${res.reason})`);
      } else {
        const res = session.commit(a, sink);
        if (res.status !== 'applied') throw new ReplayError(i, `${a.kind} did not apply (${res.reason})`);
      }
      step?.(i, a, session);
    }
    return session;
  }

  /** The live state. Read it; never change it outside the session (the scene only replays events, TECH §1.4). */
  get state(): GameState {
    return this.#state;
  }

  /** The action log (a copy), `start` first (TECH §11.1 `InLevel.actions`). */
  get log(): SessionAction[] {
    return this.#log.map(copyAction);
  }

  /** GDD `m`: completed moves (`level_resume.movesMade`); a Söküm gives it back. */
  get movesMade(): number {
    return hdr(this.#state, H.turn);
  }

  /** GDD `movesSpent` (K-43 item 2): non-cancelled drag moves of this attempt; Undo −1, a Söküm keeps it. */
  get movesSpent(): number {
    return hdr(this.#state, H.movesSpent);
  }

  /** The level's rule hooks (registry, or the options' hooks). */
  get hooks(): MoveHooks {
    return this.#opts.hooks ?? levelHooks(this.lvl);
  }

  /** TECH §2R.15: the summary of the current state (bölüm başı and after every package). */
  summary(): TurnSummary {
    return turnSummary(this.#state, { hooks: this.hooks, undoable: this.canUndo() });
  }

  /**
   * TECH §2R.15 `GameSession.apply(action) → ActionResult`: a drag, a booster, the Golden Trowel, Undo or an accepted +5
   * offer, as one package. Events also go to `sink`. A refused / cancelled action changes nothing (`status`).
   */
  apply(action: SessionInput, sink: EventSink = NULL_SINK): ActionResult {
    const own = new ArraySink();
    const tee: EventSink =
      sink.enabled === false
        ? own
        : {
            push: (e: GameEvent): void => {
              own.push(e);
              sink.push(e);
            },
          };
    let res: MoveResult;
    if (action.kind === 'undo') {
      const ok = this.undo();
      res = ok
        ? { status: 'applied', reason: null, won: false, outOfMoves: false }
        : { ...NOT_PLAYING, reason: this.undoBlock() ?? 'noDragMove' };
    } else if (action.kind === 'addMoves') {
      if (action.source !== 'offerCoins' && action.source !== 'offerAd')
        throw new Error('GameSession.apply: start bonuses belong to GameSession.start (K-40)');
      res = this.acceptOffer(action.source, tee);
    } else {
      res = this.commit(action, tee);
    }
    const events = own.events;
    const last = events[events.length - 1];
    const teardown = last?.t === 'teardown' ? last : null;
    return Object.freeze({ ...res, events: Object.freeze([...events]), teardown, summary: this.summary() });
  }

  get movesLeft(): number {
    return hdr(this.#state, H.movesLeft);
  }

  get outcome(): SessionOutcome {
    return this.#outcome;
  }

  /** K-29 offers accepted in this attempt (ad or coins). */
  get offersUsed(): number {
    return this.#offersUsed;
  }

  get adOfferUsed(): boolean {
    return this.#adOfferUsed;
  }

  /** K-46 YAO of this attempt (`level_end`). */
  yao(): YaoMeasure {
    return measureYao(this.#state);
  }

  /** K-39 precondition (`canUseUndo`): null when Undo may be used. */
  undoBlock(): UndoBlock | null {
    return undoBlock({ outcome: this.#outcome, lastDragUndoable: this.#undo !== null });
  }

  canUndo(): boolean {
    return this.undoBlock() === null;
  }

  /** The offer of the open out-of-moves window (K-29); null when no window is open or 3 offers were used. */
  nextOffer(): OfferInfo | null {
    if (this.#outcome !== 'outOfMoves' || this.#offersUsed >= MAX_OFFERS) return null;
    return { n: this.#offersUsed + 1, adAllowed: this.#offersUsed === 0 };
  }

  /**
   * Commits a drag, a booster (hammer, crane, paint brush) or the Golden Trowel. Cancelled / rejected moves change
   * nothing and are not logged; a won level or an open out-of-moves window rejects every move. +5 offers go through
   * `acceptOffer`.
   */
  commit(move: Move, sink: EventSink = NULL_SINK): MoveResult {
    if (move.kind === 'addMoves') throw new Error('GameSession.commit: use acceptOffer for +5 offers (K-29)');
    if (this.#outcome !== 'playing') return NOT_PLAYING;
    const snapshot = this.#state.buf.slice();
    const res = applyMove(this.#state, move, sink, { ...this.#applyOptions(), preAction: snapshot });
    if (res.status !== 'applied') return res;
    this.#log.push(copyAction(move));
    this.#undo = move.kind === 'drag' ? snapshot : null; // K-39: only a drag move is undone
    if (res.won) this.#outcome = 'won';
    else if (res.outOfMoves) this.#outcome = this.#offersUsed >= MAX_OFFERS ? 'lost' : 'outOfMoves';
    if (this.#outcome === 'lost') this.#markLost();
    return res;
  }

  /** K-39: restores the state before the last drag (in place). Returns false when Undo is not available. */
  undo(): boolean {
    const snapshot = this.#undo;
    if (this.undoBlock() !== null || snapshot === null) return false;
    this.#state.buf.set(snapshot);
    this.#undo = null;
    this.#log.push({ kind: 'undo' });
    return true;
  }

  /** K-29: accepts offer `n` of the open window (+5 moves, step 12 once). Rejected when not allowed. */
  acceptOffer(source: 'offerCoins' | 'offerAd', sink: EventSink = NULL_SINK): MoveResult {
    const offer = this.nextOffer();
    if (!offer) return { ...NOT_PLAYING, reason: 'noOffer' };
    if (source === 'offerAd' && !offer.adAllowed) return { ...NOT_PLAYING, reason: 'adNotAllowed' };
    const move: Move = { kind: 'addMoves', amount: OFFER_MOVES, source };
    const res = applyMove(this.#state, move, sink, this.#applyOptions());
    if (res.status !== 'applied') return res;
    this.#log.push(move);
    this.#offersUsed += 1;
    if (source === 'offerAd') this.#adOfferUsed = true;
    this.#undo = null; // K-39: no Undo across a +5 offer
    this.#outcome = 'playing';
    return res;
  }

  /** K-29: the player declines the offer: the level is lost. */
  declineOffer(): void {
    if (this.#outcome !== 'outOfMoves')
      throw new Error(`declineOffer: no out-of-moves window (${this.#outcome})`);
    this.#outcome = 'lost';
    this.#markLost();
  }

  /** K-43 item 2: confirmed exit. `movesSpent ≥ 1` → loss; `movesSpent = 0` → free (refunds, streak bonus kept). */
  exit(): ExitResult {
    if (this.#outcome !== 'playing') throw new Error(`exit: the attempt is not running (${this.#outcome})`);
    const movesMade = this.movesMade;
    const movesSpent = this.movesSpent;
    if (movesSpent >= 1) {
      this.#outcome = 'lost';
      this.#markLost();
      return { kind: 'loss', movesMade, movesSpent, refundPreBoosters: [], streakBonusConsumed: true };
    }
    this.#outcome = 'exited';
    return {
      kind: 'free',
      movesMade,
      movesSpent,
      refundPreBoosters: [...this.preBoosters],
      streakBonusConsumed: false,
    };
  }

  #applyOptions(): { hooks?: MoveHooks; strict?: boolean } {
    return { hooks: this.#opts.hooks, strict: this.#opts.strict };
  }

  #markLost(): void {
    setHdr(this.#state, H.flags, hdr(this.#state, H.flags) | STATE_FLAG.lost);
  }

  /** K-40 level start: Termos, streak bonus, Mala Başlangıcı, Açık Kepenk (no step 12, no timers, `m` stays 0). */
  #applyStart(sink: EventSink): void {
    const s = this.#state;
    const opts = this.#applyOptions();
    let trowels = 0;
    if (this.preBoosters.includes('thermos'))
      applyMove(s, { kind: 'addMoves', amount: THERMOS_MOVES, source: 'thermos' }, sink, opts);
    if (this.streakTier > 0) {
      const bonus = (this.#opts.streakBonus ?? noStreakBonus)(this.streakTier as 1 | 2 | 3);
      if (bonus.moves > 0)
        applyMove(s, { kind: 'addMoves', amount: bonus.moves, source: 'streak' }, sink, opts);
      trowels += bonus.trowels;
    }
    if (this.preBoosters.includes('trowelStart')) trowels += TROWEL_START;
    if (trowels > 0) grantTrowels(s, trowels);
    if (this.preBoosters.includes('openShutter')) setHdr(s, H.openShutterUntil, OPEN_SHUTTER_MOVES);
  }
}

/**
 * K-43 item 4 `levelHash` (TECH §11.1): FNV-1a 64 of the canonical JSON of the level data, 16 hex digits. The single
 * implementation (services/save re-exports it). Hash the level as loaded (`CompiledLevel.data`, a `LevelData`) at
 * attempt start and at resume; any JSON value is accepted so tools and tests can hash raw data too.
 */
export function levelHash(data: unknown): string {
  return fnv1a64(canonicalJson(data));
}
