/**
 * Contextual Usta Dede lines `tut.ctx.*` (UX_FLOWS §13.1 "Bağlamsal öğreticiler", §13.2; STORY §6; GDD K-53/4, §14.1/2,
 * K-34 hook 4; TECH_DESIGN §2R.9). Each one appears ONCE per account, the first time its trigger happens (the save's
 * `seenContextTips`); a tutorial step that reuses the same text marks it too. They use the tutorial bubble (no glove,
 * a soft highlight), never block input and stay `TOKENS.tutorial.visibleMs` (4 s; faded while a block is held).
 *
 * Pure: triggers are read from a committed move's events (and a few scene signals). Queue rule (K-53/4, PL-2R-12):
 * - one line on screen at a time; AT MOST ONE waits — a newer one replaces it (the dropped one is not marked seen);
 * - while a tutorial step is active (shown or hidden) the line waits and shows `TOKENS.tutorial.nextStepDelayMs`
 *   (400 ms) after the step's end (`stepEnded`), even when the next step is already active;
 * - the Söküm line `tut.ctx.teardown` (K-30) never queues: it shows at once (it replaces a line on screen) for
 *   `TEARDOWN_LINE_MS`, on EVERY Söküm (the exception to "once"; never marked seen). The active step's presence hides
 *   for that time and then goes on (`TutorialPresence` windowOpen / windowClose).
 * Showing a line marks it seen. A queued line whose trigger no longer holds when it could show (the truck queue
 * emptied, the streak was reset, another move was made after a bounce) is dropped WITHOUT marking: the next
 * occurrence triggers it again, in context.
 *
 * Highlights (UX §13.2 "Vurgu"): a line lights its static ids (`CTX_HIGHLIGHT`) plus the ids of its occurrence
 * (`ctxMoveHighlight`, `trigger(…, highlight)`): the bounced block and its reason cells, the missing-support cells
 * (+ `front`), the block that could not be picked, the torn-down blocks.
 */
import { blockCells } from '../../../core/movement.ts';
import { reasonCells } from '../../../core/placement.ts';
import { shapeByIndex } from '../../../core/shapes.ts';
import { pieceShape } from '../../../core/state.ts';
import type { GameState } from '../../../core/state.ts';
import type { At, GameEvent, VerdictReason } from '../../../core/types.ts';
import { pidHighlight } from './highlights.ts';

export const CTX_TOPICS = [
  'streak',
  'goldtrowel',
  'bounce.color',
  'bounce.window',
  'bounce.offplan',
  'support',
  'tootall',
  'lastmoves',
  'queue',
  'truckhelp.free',
  'reshuffle',
  'teardown',
  'blocked',
  'resume',
] as const;
export type CtxTopic = (typeof CTX_TOPICS)[number];

/**
 * Static highlight of a tip (UX §13.2 "Vurgu" column; empty = only the occurrence's ids, `ctxMoveHighlight`, or the
 * bubble alone).
 */
export const CTX_HIGHLIGHT: Readonly<Record<CtxTopic, readonly string[]>> = {
  streak: ['streak'],
  goldtrowel: ['streak', 'front'],
  'bounce.color': [],
  'bounce.window': [],
  'bounce.offplan': [],
  support: ['front'],
  tootall: ['crane'],
  lastmoves: ['moves'],
  queue: ['truck'],
  'truckhelp.free': [],
  reshuffle: [],
  teardown: [],
  blocked: [],
  resume: [],
};

const cellId = (c: { readonly x: number; readonly y: number }): string => `cell:${c.x},${c.y}`;

/**
 * Occurrence highlight of a move-triggered tip (UX §13.2; `s` = the state after the move): `bounce.*` → the bounced
 * block (`pid:`) + the cells of its primary reason at the landing it tried (`reasonCells`); `support` → the
 * missing-support cells (`cell:`; `front` comes from `CTX_HIGHLIGHT`). Other topics: [].
 */
export function ctxMoveHighlight(topic: CtxTopic, events: readonly GameEvent[], s: GameState): string[] {
  const out: string[] = [];
  const add = (id: string): void => {
    if (!out.includes(id)) out.push(id);
  };
  const support = (cells: readonly At[]): void => {
    for (const c of cells) add(cellId(c));
  };
  for (const e of events) {
    if (e.t === 'pieceBounced') {
      if (e.reason === 'support') {
        if (topic === 'support') support(e.missingSupport);
        continue;
      }
      if (BOUNCE[e.reason] !== topic) continue;
      add(pidHighlight(e.pieceId));
      const shape = shapeByIndex(pieceShape(s, e.pieceId));
      const landing = blockCells(shape, e.from.x, e.from.y);
      for (const c of reasonCells(s, e.pieceId, landing, e.reason)) add(cellId(c));
    } else if (e.t === 'mortarStuck' && e.reason === 'support' && topic === 'support') {
      support(e.missingSupport);
    }
  }
  return out;
}

const BOUNCE: Partial<Record<VerdictReason, CtxTopic>> = {
  color: 'bounce.color',
  window: 'bounce.window',
  outside: 'bounce.offplan',
};

/**
 * Tips a committed move triggers, in display priority. `streakBeforeTrowel` = `combo.correctPlacementsPerTrowel − 1`
 * (the first "3/4"); `lastMovesAt` = the last-moves threshold (5).
 */
export function ctxFromMove(
  events: readonly GameEvent[],
  movesBefore: number,
  streakBeforeTrowel: number,
  lastMovesAt: number,
): CtxTopic[] {
  const out: CtxTopic[] = [];
  const add = (t: CtxTopic): void => {
    if (!out.includes(t)) out.push(t);
  };
  for (const e of events) {
    switch (e.t) {
      case 'pieceBounced':
      case 'mortarStuck':
        if (e.reason === 'support') add('support');
        else {
          const t = BOUNCE[e.reason];
          if (t) add(t);
        }
        break;
      case 'placementWrong': {
        const primary = e.reasons[0];
        if (primary === 'support') add('support');
        else if (primary) {
          const t = BOUNCE[primary];
          if (t) add(t);
        }
        break;
      }
      case 'comboChanged':
        if (e.combo === streakBeforeTrowel) add('streak');
        break;
      case 'trowelEarned':
        add('goldtrowel');
        break;
      case 'movesChanged':
        if (movesBefore > lastMovesAt && e.movesLeft <= lastMovesAt && e.movesLeft > 0) add('lastmoves');
        break;
      case 'deliveryQueued':
        if (e.queued > 0) add('queue');
        break;
      case 'pieceReturned':
        if (e.to === 'queue') add('queue');
        break;
      case 'truckHelp':
        // K-30 D1 (Faz 2R): unchain → `truckhelp.free`, a reshuffle → `reshuffle`; the truck never brings blocks (R2-05)
        if (e.kind === 'unchain') add('truckhelp.free');
        else if (e.kind === 'reshuffle' || e.kind === 'reshape') add('reshuffle');
        break;
      default:
        break;
    }
  }
  return out;
}

export interface CtxTipHost {
  seen(topic: CtxTopic): boolean;
  markSeen(topic: CtxTopic): void;
}

/**
 * Is a queued tip still in context? `serial` = the attempt's action count when it was triggered (the scene's
 * `GameSession.log.length`).
 */
export type CtxValidity = (topic: CtxTopic, serial: number) => boolean;

/** Topics whose trigger is a state that lasts (queue, streak, trowel, last moves, resume); the rest are moments. */
export const CTX_LASTING: ReadonlySet<CtxTopic> = new Set<CtxTopic>([
  'queue',
  'streak',
  'goldtrowel',
  'lastmoves',
  'resume',
]);

/** UX §13.1 / JUICE #107: the Söküm line stays 1,2 s (no token yet; design-lead `tutorial.teardownLineMs`). */
export const TEARDOWN_LINE_MS = 1200;

interface Showing {
  readonly topic: CtxTopic;
  readonly since: number;
  readonly ms: number;
  readonly highlight: readonly string[];
}

/** What may show a line now (the scene's frame state). */
export interface CtxGate {
  /** A tutorial step is active (shown or hidden, K-53/3). */
  readonly stepActive: boolean;
  /** A window is open or a block is being dragged (no new bubble opens then). */
  readonly blocked: boolean;
}

/** One line on screen at a time; at most one waits (see the module comment). */
export class ContextTips {
  readonly #host: CtxTipHost;
  #queued: {
    readonly topic: CtxTopic;
    readonly serial: number;
    readonly highlight: readonly string[];
  } | null = null;
  #showing: Showing | null = null;
  /** A step ended: the waiting line may show at this time even while the next step is active (null: none due). */
  #flushAt: number | null = null;
  #version = 0;

  constructor(host: CtxTipHost) {
    this.#host = host;
  }

  get version(): number {
    return this.#version;
  }

  get showing(): CtxTopic | null {
    return this.#showing?.topic ?? null;
  }

  /** Animation time the line on screen opened (null when none shows). */
  get showingSince(): number | null {
    return this.#showing?.since ?? null;
  }

  /** Highlight ids of the line on screen: `CTX_HIGHLIGHT` + its occurrence's ids (empty when none shows). */
  get highlight(): readonly string[] {
    const sh = this.#showing;
    return sh ? [...CTX_HIGHLIGHT[sh.topic], ...sh.highlight] : [];
  }

  /** Topics waiting (0 or 1; tests, harness). */
  get queued(): readonly CtxTopic[] {
    return this.#queued ? [this.#queued.topic] : [];
  }

  /**
   * A trigger happened (`serial`: see `CtxValidity`; `highlight`: the occurrence's ids): it waits when never seen and
   * not on screen; it replaces a waiting line (K-53/4: at most one waits; the dropped one stays unseen).
   */
  trigger(topic: CtxTopic, serial = 0, highlight: readonly string[] = []): void {
    if (topic === 'teardown') return; // never queued: `teardown`
    if (this.#host.seen(topic)) return;
    if (this.#showing?.topic === topic) return;
    this.#queued = { topic, serial, highlight };
  }

  /**
   * Several triggers of one move, in display priority (`ctxFromMove`): only the first unseen one waits (the rest would
   * replace it, K-53/4).
   */
  triggerFirst(
    topics: readonly CtxTopic[],
    serial: number,
    highlight: (t: CtxTopic) => readonly string[],
  ): void {
    const first = topics.find((t) => t !== 'teardown' && !this.#host.seen(t) && this.#showing?.topic !== t);
    if (first !== undefined) this.trigger(first, serial, highlight(first));
  }

  /** K-30 Söküm (K-53/4): `tut.ctx.teardown` shows now, on every Söküm, for `TEARDOWN_LINE_MS`; never queued. */
  teardown(now: number, highlight: readonly string[] = []): void {
    this.#showing = { topic: 'teardown', since: now, ms: TEARDOWN_LINE_MS, highlight };
    this.#version += 1;
  }

  /** The active tutorial step ended at `now`: a waiting line shows `nextStepDelayMs` later (K-53/4). */
  stepEnded(now: number, delayMs: number): void {
    this.#flushAt = now + delayMs;
  }

  /**
   * Per frame: hides the line after its time (`showMs`; the Söküm line its own), shows the waiting one when the gate
   * lets it (no step active — or a step just ended, `stepEnded` — no window, no drag). Showing marks the line seen; a
   * line `valid` rejects is dropped unmarked.
   */
  update(now: number, gate: CtxGate, showMs: number, valid: CtxValidity = () => true): void {
    const sh = this.#showing;
    if (sh && now - sh.since >= sh.ms) {
      this.#showing = null;
      this.#version += 1;
    }
    if (this.#flushAt !== null && now < this.#flushAt) return; // a step just ended: 400 ms first
    const flush = this.#flushAt !== null;
    if (this.#showing || gate.blocked || (gate.stepActive && !flush)) return;
    this.#flushAt = null;
    const next = this.#queued;
    this.#queued = null;
    if (next === null) return;
    if (this.#host.seen(next.topic)) return; // a tutorial step showed the same text meanwhile
    if (!valid(next.topic, next.serial)) return; // out of context now: the next occurrence brings it back
    this.#host.markSeen(next.topic);
    this.#showing = { topic: next.topic, since: now, ms: showMs, highlight: next.highlight };
    this.#version += 1;
  }

  /**
   * The player did what the line teaches through a screen that gives the same instruction itself (UX §13.2 "Altın Mala
   * ilk kez kazanıldı", Faz 2 tur 3: the trowel pick's `booster.hint.trowel` strip): the line leaves the screen if it
   * shows, drops if it waits, and counts as seen in both cases, so it never comes back. Not triggered yet: no-op.
   */
  retire(topic: CtxTopic): void {
    let hit = false;
    if (this.#showing?.topic === topic) {
      this.#showing = null;
      this.#version += 1;
      hit = true;
    }
    if (this.#queued?.topic === topic) {
      this.#queued = null;
      hit = true;
    }
    if (hit && !this.#host.seen(topic)) this.#host.markSeen(topic);
  }

  /** Level change. */
  clear(): void {
    this.#queued = null;
    this.#flushAt = null;
    if (this.#showing) this.#version += 1;
    this.#showing = null;
  }
}
