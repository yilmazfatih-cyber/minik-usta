/**
 * `TutorialController` (docs/GDD.md K-53, §14.1; TECH_DESIGN §2R.9 part 1; UX_FLOWS §13.1; LEVELS `tutorial[]`). Pure
 * state machine over a level's tutorial steps — which step is ACTIVE and when it ends. What is on screen (wait / shown /
 * hidden, glove, bubble) is `TutorialPresence`'s; the view (`TutorialView`) draws it. No Phaser, no clock of its own:
 * the scene passes its animation time.
 *
 * Faz 2R light tutorial (K-53, R2-10):
 * - Steps never lock input: there is no required step, no pick gate, no never-lock guarantee (the scene's
 *   `DragController` does not know the tutorial). A `mode` other than `'soft'` is a validator error (`tut_blocking`);
 *   old data that still carries one is played as soft.
 * - Steps run in order. A step with `startOn` WAITS (nothing shown, play is free) until its start event happens after
 *   the previous step ended; without `startOn` it starts when the previous one ends (the first one at level start). A
 *   `startOn` that never happens hides that step and every later one (GDD §14.1/5).
 * - A step ends ONLY on its `done` event (K-53/3; GDD §14.1/3 vocabulary with its filters, `piece` included): the
 *   counter starts at 0 when the step starts (earlier events never count), `count` defaults to 1, a move-end event
 *   counts at most once per move, a drag signal at most once per drag. Hiding the step (presence) never ends it.
 *   Move-end events reach the controller when the EventPlayer has finished playing the move (TECH §8.2).
 * - A `tut.ctx.<topic>` text marks `seenContextTips.<topic>` the moment the step starts (GDD §14.1/2).
 * - K-53/6: a level the save marks `won` shows no step (`createTutorial`).
 * - K-43 resume (K-53/5: `inLevel.tutorial` unchanged): the scene saves `position()` + the actions it includes whenever
 *   it changes; on resume the controller goes to that saved position (`restore`) after the actions it includes, then
 *   reads only the move ends of the later actions. Without a saved position (old save) it is rebuilt from the log
 *   (`replayTutorialAction`): a replayed drag gives only the signals its result proves (`overWall`: yard → site FREE,
 *   `gapPass`: released on a rail); a hold has no duration in the log, so `holdOverBuild` is never assumed.
 */
import type { CompiledLevel } from '../../../core/level/compile.ts';
import type { TutCondition, TutorialStepData } from '../../../core/level/schema.ts';
import type { GameState } from '../../../core/state.ts';
import type { GameEvent, PieceId, SessionAction } from '../../../core/types.ts';
import { moveMatches } from './tutorialEvents.ts';
import type { DragSignalEvent } from './tutorialEvents.ts';

export interface TutorialHost {
  /** Current game state (null while no attempt runs). */
  state(): GameState | null;
  /** GDD §14.1/2: `seenContextTips.<topic>` (written at once). */
  markContextTip(topic: string): void;
  /** A step ended on its `done` event (ANALYTICS `tutorial_step`; `shows` / `msToDone` come from its presence). */
  stepEnded(step: number, now: number): void;
  /** A counted event of the active step that did not end it yet (`count` > 1): the presence hides (K-53/3). */
  progressed?(step: number, now: number): void;
}

/** The active step (started, not ended: shown or hidden on screen, K-53/3). */
export interface ActiveStep {
  /** Index in the sorted `tutorial[]`. */
  readonly index: number;
  readonly data: TutorialStepData;
  /** Highlighted blocks (`piece:` / `debris:` resolved through `CompiledLevel.tutorialPieceIds`). */
  readonly pieces: readonly PieceId[];
  /** Animation time the step started. */
  readonly since: number;
}

type Phase = 'idle' | 'waiting' | 'active' | 'finished';

/**
 * Where the tutorial is (K-43 resume, `inLevel.tutorial` without its `actions`): step `index` of the sorted steps
 * (`steps.length` = finished), started (`shown`; the save field keeps its Faz 2 name, K-53/5) or waiting for its
 * `startOn`, `count` events toward its condition.
 */
export interface TutorialPosition {
  readonly index: number;
  readonly shown: boolean;
  readonly count: number;
}

const CTX_PREFIX = 'tut.ctx.';

/** `piece:<i>`, `piece:k<p>_<i>`, `debris:<i>` of a step → PieceIds (TECH §8.2 "Vurgu → blok çözümü"). */
export function highlightedPieces(lvl: CompiledLevel, highlight: readonly string[]): PieceId[] {
  const out: PieceId[] = [];
  for (const h of highlight) {
    if (!h.startsWith('piece:') && !h.startsWith('debris:')) continue;
    const id = lvl.tutorialPieceIds.get(h);
    if (id !== undefined && !out.includes(id)) out.push(id);
  }
  return out;
}

/**
 * The tutorial of an attempt (K-53/6): null when the level has no steps or the player's save marks it won (replays of
 * the 1–10 loop and Usta Modu show no step; contextual lines follow their own `seenContextTips` rule).
 */
export function createTutorial(
  lvl: CompiledLevel,
  host: TutorialHost,
  progress: { readonly won: boolean },
): TutorialController | null {
  if (progress.won) return null;
  if (!lvl.data.tutorial || lvl.data.tutorial.length === 0) return null;
  return new TutorialController(lvl, host);
}

export class TutorialController {
  readonly lvl: CompiledLevel;
  readonly steps: readonly TutorialStepData[];
  readonly #host: TutorialHost;
  #phase: Phase = 'idle';
  #index = -1;
  #count = 0;
  #since = 0;
  #pieces: PieceId[] = [];
  /** Drag signals already counted in this drag. */
  #dragCounted = new Set<DragSignalEvent>();
  #version = 0;
  /** Bumped on every change of `position()` (visible changes and counter steps). */
  #positionVersion = 0;

  constructor(lvl: CompiledLevel, host: TutorialHost) {
    this.lvl = lvl;
    this.steps = [...(lvl.data.tutorial ?? [])].sort((a, b) => a.step - b.step);
    this.#host = host;
  }

  /** Bumped when the active step changes (a new presence starts then). */
  get version(): number {
    return this.#version;
  }

  /** Bumped whenever `position()` may have changed (the scene's K-43 save compares it each frame, allocation-free). */
  get positionVersion(): number {
    return this.#positionVersion;
  }

  get finished(): boolean {
    return this.#phase === 'finished';
  }

  /** The active step (K-53/3: started and not ended), or null (waiting for `startOn`, idle or finished). */
  get current(): ActiveStep | null {
    if (this.#phase !== 'active') return null;
    const data = this.steps[this.#index];
    if (!data) return null;
    return { index: this.#index, data, pieces: this.#pieces, since: this.#since };
  }

  /** The step waiting for its `startOn` event (nothing on screen), if any. */
  get waiting(): TutorialStepData | null {
    return this.#phase === 'waiting' ? (this.steps[this.#index] ?? null) : null;
  }

  /** The position (K-43 save); null before `start`. */
  position(): TutorialPosition | null {
    if (this.#phase === 'idle') return null;
    if (this.#phase === 'finished') return { index: this.steps.length, shown: false, count: 0 };
    return { index: this.#index, shown: this.#phase === 'active', count: this.#count };
  }

  /** Can `pos` be a position of this tutorial (a damaged or foreign save is not restored)? */
  accepts(pos: TutorialPosition): boolean {
    const { index, shown, count } = pos;
    if (!Number.isInteger(index) || !Number.isInteger(count) || index < 0 || count < 0) return false;
    if (index >= this.steps.length) return index === this.steps.length && !shown && count === 0;
    const step = this.steps[index];
    if (!step) return false;
    const cond = shown ? step.done : step.startOn;
    if (!cond) return false; // a step without `startOn` never waits
    return count < (cond.count ?? 1);
  }

  /**
   * K-43 resume: goes to the saved position — the step with its `tut.ctx.*` mark and its counter (its presence starts
   * again with the step). Neither `tutorial_step` nor a later step. False (nothing changed) when `accepts(pos)` is false.
   */
  restore(pos: TutorialPosition, now: number): boolean {
    if (!this.accepts(pos)) return false;
    this.#dragCounted.clear();
    this.#index = pos.index;
    if (pos.index >= this.steps.length) {
      this.#phase = 'finished';
      this.#count = 0;
      this.#bump();
      return true;
    }
    if (pos.shown) {
      this.#activate(now);
      this.#count = pos.count;
    } else {
      this.#phase = 'waiting';
      this.#count = pos.count;
      this.#bump();
    }
    return true;
  }

  /** Level start: the first step (or its `startOn` wait). */
  start(now: number): void {
    this.#index = -1;
    this.#phase = 'idle';
    this.#next(now);
  }

  /** Level over: nothing more is shown (GDD §14.1/5: steps whose `startOn` never came stay hidden). */
  stop(): void {
    if (this.#phase === 'finished') return;
    this.#phase = 'finished';
    this.#bump();
  }

  /** The player lifted a block (K-07 threshold passed): a new drag for the drag-signal counting. */
  dragStarted(_pieceId: PieceId): void {
    this.#dragCounted.clear();
  }

  /** Is `pieceId` one of the active step's highlighted blocks (presence `correctAction`, UX §13.1)? */
  highlights(pieceId: PieceId): boolean {
    return this.#phase === 'active' && this.#pieces.includes(pieceId);
  }

  /**
   * Drag signal (`overWall` = DragSession `crossedWall`, `gapPass` = `enteredRail`, `holdOverBuild` from the scene's
   * hold timer); each counts at most once per drag, even when the drag is cancelled later. Any block counts (no gate).
   */
  dragSignal(kind: DragSignalEvent, now: number, holdMs = 0): void {
    if (this.#dragCounted.has(kind)) return;
    const cond = this.#activeCond();
    if (!cond || cond.event !== kind) return;
    if (kind === 'holdOverBuild' && cond.event === 'holdOverBuild' && holdMs < cond.minMs) return;
    this.#dragCounted.add(kind);
    this.#hit(cond, now);
  }

  /** `holdOverBuild.minMs` the scene's hold timer must reach now; null when no step listens for it. */
  holdMinMs(): number | null {
    const cond = this.#activeCond();
    return cond?.event === 'holdOverBuild' ? cond.minMs : null;
  }

  /**
   * A tap (under the K-07 threshold) on block `target` (a PieceId) or on a highlighted HUD target (`booster:hammer` …):
   * counts for `tap` when the target is highlighted by the step.
   */
  tapped(target: PieceId | string, now: number): void {
    const cond = this.#activeCond();
    if (!cond || cond.event !== 'tap') return;
    const step = this.steps[this.#index];
    if (!step) return;
    const hit =
      typeof target === 'number'
        ? highlightedPieces(this.lvl, step.highlight).includes(target)
        : step.highlight.includes(target);
    if (hit) this.#hit(cond, now);
  }

  /** One committed move (drag or booster use) finished playing: a move-end event counts once. */
  moveEnded(events: readonly GameEvent[], now: number): void {
    const cond = this.#activeCond();
    if (cond && moveMatches(cond, events, this.#host.state())) this.#hit(cond, now);
  }

  // --- internals ---------------------------------------------------------------------------------------------------------

  /** The condition the controller listens for now: `startOn` while waiting, `done` while active. */
  #activeCond(): TutCondition | null {
    const step = this.steps[this.#index];
    if (!step) return null;
    if (this.#phase === 'waiting') return step.startOn ?? null;
    if (this.#phase === 'active') return step.done;
    return null;
  }

  #hit(cond: TutCondition, now: number): void {
    this.#count += 1;
    this.#positionVersion += 1;
    if (this.#count < (cond.count ?? 1)) {
      const step = this.steps[this.#index];
      if (this.#phase === 'active' && step) this.#host.progressed?.(step.step, now);
      return;
    }
    if (this.#phase === 'waiting') this.#activate(now);
    else this.#complete(now);
  }

  #next(now: number): void {
    this.#index += 1;
    this.#count = 0;
    this.#dragCounted.clear();
    const step = this.steps[this.#index];
    if (!step) {
      this.#phase = 'finished';
      this.#bump();
      return;
    }
    if (step.startOn) {
      this.#phase = 'waiting';
      this.#bump();
      return;
    }
    this.#activate(now);
  }

  #activate(now: number): void {
    const step = this.steps[this.#index];
    if (!step) return;
    this.#phase = 'active';
    this.#count = 0;
    this.#since = now;
    this.#pieces = highlightedPieces(this.lvl, step.highlight);
    if (step.textKey.startsWith(CTX_PREFIX)) this.#host.markContextTip(step.textKey.slice(CTX_PREFIX.length));
    this.#bump();
  }

  #complete(now: number): void {
    const step = this.steps[this.#index];
    if (step) this.#host.stepEnded(step.step, now);
    this.#next(now);
  }

  #bump(): void {
    this.#version += 1;
    this.#positionVersion += 1;
  }
}

/**
 * K-43 resume without a saved position (old save): feeds one replayed action to `tut` like the live scene did — a drag
 * starts, gives the drag signals its result proves (from the action's `pieceMoved` event: `overWall` for a yard block
 * released FREE over the site, `gapPass` for a block released on a rail) and ends with the move's events.
 * `holdOverBuild` is never assumed (the log has no hold duration). Undo is skipped (the controller does not rewind).
 */
export function replayTutorialAction(
  tut: TutorialController,
  action: SessionAction,
  events: readonly GameEvent[],
  now: number,
): void {
  if (action.kind === 'start' || action.kind === 'undo') return;
  if (action.kind === 'drag') {
    tut.dragStarted(action.pieceId);
    const moved = events.find((e) => e.t === 'pieceMoved' && e.pieceId === action.pieceId);
    if (moved?.t === 'pieceMoved') {
      if (moved.entry === 'gap') tut.dragSignal('gapPass', now);
      if (moved.entry === 'overWall' && moved.from.zone === 'yard') tut.dragSignal('overWall', now);
    }
  }
  tut.moveEnded(events, now);
}

/** A saved K-43 tutorial position: `TutorialPosition` + how many log entries (`start` included) it includes. */
export interface SavedTutorialPosition extends TutorialPosition {
  readonly actions: number;
}

/**
 * K-43 resume of the tutorial (TECH §8.2), driven by `GameSession.replay`'s per-action callback (`index` 0 = `start`;
 * the host's `state()` = the state right after `action`):
 * - with a usable saved position (`usable`): nothing until the last action it includes, then `restore` (the step of
 *   that time, not one step further: the cancelled drags and holds the log does not hold are in it); every later
 *   action (its cues were still playing at the kill) gives only its move end;
 * - without one: the whole log through `replayTutorialAction`.
 */
export class TutorialResume {
  readonly #tut: TutorialController;
  readonly #saved: SavedTutorialPosition | null;

  /** `saved` is used only when the controller accepts it and it includes 1…`logLength` entries. */
  constructor(tut: TutorialController, saved: SavedTutorialPosition | null, logLength: number) {
    this.#tut = tut;
    this.#saved =
      saved !== null && saved.actions >= 1 && saved.actions <= logLength && tut.accepts(saved) ? saved : null;
  }

  /** The saved position is the one restored (tests, debug). */
  get usable(): boolean {
    return this.#saved !== null;
  }

  /**
   * Action `index` of the replay is after the saved position: the player made it live, but its move end never reached
   * the tutorial (a kill while its cues played). A step it ends was never reported, so ANALYTICS `tutorial_step` is
   * sent for it now (the scene mutes the rest of a replay).
   */
  isTail(index: number): boolean {
    return this.#saved !== null && index >= this.#saved.actions;
  }

  action(index: number, action: SessionAction, events: readonly GameEvent[], now: number): void {
    const saved = this.#saved;
    if (saved === null) {
      if (index === 0) this.#tut.start(now);
      else replayTutorialAction(this.#tut, action, events, now);
      return;
    }
    if (index === saved.actions - 1) this.#tut.restore(saved, now);
    else if (index >= saved.actions && action.kind !== 'start' && action.kind !== 'undo')
      this.#tut.moveEnded(events, now);
  }
}
