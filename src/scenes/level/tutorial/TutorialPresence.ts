/**
 * `TutorialPresence` (docs/TECH_DESIGN.md §2R.9 part 2; UX_FLOWS §13.1 "Zamanlama"; GDD K-53/3): the pure reducer of
 * what one ACTIVE tutorial step shows. It never ends a step (only the step's `done` event does, `TutorialController`);
 * it only decides whether the glove, the bubble and the highlight are on screen. No Phaser, no clock of its own: every
 * input carries the scene's animation time `t` (ms); the timings are `tokens.tutorial` (`PRESENCE_TIMINGS`).
 *
 * | Phase  | Shows                                   | Leaves                                                          |
 * | ------ | --------------------------------------- | --------------------------------------------------------------- |
 * | wait   | nothing                                 | `delayMs` after the start → shown                               |
 * | shown  | bubble, glove (no touch held), highlight | `stepDone` → done · `visibleMs` → hidden · a touch: glove off, bubble faded, its lift → hidden · `correctAction` → hidden |
 * | hidden | nothing                                 | `stepDone` → done · `idleReshowMs` without any touch → shown (every touch restarts the count) |
 * | done   | nothing (the view fades out, `hideMs`)  | —                                                               |
 *
 * - The step is ACTIVE in wait, shown and hidden (it started and has not ended): input is never blocked in any phase.
 * - `shows` counts every entry into shown (the first one included); after `reshowsWithBubble` re-shows the bubble
 *   stays away (the text was read), the glove and the highlight still come back.
 * - `windowOpen` … `windowClose` (a window, or the Söküm line `tut.ctx.teardown` that takes the bubble for 1.2 s, K-53/4)
 *   stop every timer and hide everything; on the last close the step goes on from the phase it was in.
 * - ANALYTICS `tutorial_step` (§2 v6): `shows` (≥ 1) and `msToDone` = first show → done.
 */
import { TOKENS } from '../../../theme/tokens.ts';

export type PresencePhase = 'wait' | 'shown' | 'hidden' | 'done';

export type PresenceInputKind =
  'tick' | 'touchDown' | 'touchUp' | 'correctAction' | 'stepDone' | 'windowOpen' | 'windowClose';

export interface PresenceInput {
  readonly t: number;
  readonly kind: PresenceInputKind;
}

export interface PresenceTimings {
  readonly visibleMs: number;
  readonly idleReshowMs: number;
  readonly reshowsWithBubble: number;
}

/** `tokens.tutorial` (UX §13.1): 4000 / 4000 ms, 3 re-shows with the bubble. */
export const PRESENCE_TIMINGS: PresenceTimings = Object.freeze({
  visibleMs: TOKENS.tutorial.visibleMs,
  idleReshowMs: TOKENS.tutorial.idleReshowMs,
  reshowsWithBubble: TOKENS.tutorial.reshowsWithBubble,
});

export interface PresenceState {
  readonly phase: PresencePhase;
  /** When the phase was entered (shifted by the paused time, so `t − since` is the running time in the phase). */
  readonly since: number;
  /** Wait before the first show (`startDelayMs`, + `nextStepDelayMs` after an earlier step). */
  readonly delayMs: number;
  /** Last touch down / up (or the moment the step was hidden): the idle count of the hidden phase starts here. */
  readonly idleSince: number;
  readonly touching: boolean;
  /** Open windows (and Söküm lines) now; > 0 = paused. */
  readonly pauses: number;
  /** When the pause began (null: running). */
  readonly pausedAt: number | null;
  /** Entries into shown so far (the first one included). */
  readonly shows: number;
  readonly firstShownAt: number | null;
  readonly doneAt: number | null;
}

/** A step started at `t`: it shows after `delayMs` (UX §13.1 "Bekleme"). */
export function presenceStart(t: number, delayMs: number): PresenceState {
  return {
    phase: 'wait',
    since: t,
    delayMs,
    idleSince: t,
    touching: false,
    pauses: 0,
    pausedAt: null,
    shows: 0,
    firstShownAt: null,
    doneAt: null,
  };
}

function show(s: PresenceState, t: number): PresenceState {
  return { ...s, phase: 'shown', since: t, shows: s.shows + 1, firstShownAt: s.firstShownAt ?? t };
}

function hide(s: PresenceState, t: number): PresenceState {
  return { ...s, phase: 'hidden', since: t, idleSince: t };
}

/** The next state after `input` (pure; `s` is not changed). */
export function presenceStep(
  s: PresenceState,
  input: PresenceInput,
  timings: PresenceTimings = PRESENCE_TIMINGS,
): PresenceState {
  const { t, kind } = input;
  if (s.phase === 'done') return s;
  switch (kind) {
    case 'stepDone':
      return { ...s, phase: 'done', since: t, doneAt: t, touching: false };
    case 'windowOpen':
      // the input goes to the window: a touch held now never ends on the board
      return { ...s, pauses: s.pauses + 1, pausedAt: s.pausedAt ?? t, touching: false };
    case 'windowClose': {
      if (s.pauses === 0) return s;
      if (s.pauses > 1) return { ...s, pauses: s.pauses - 1 };
      const shift = t - (s.pausedAt ?? t);
      return {
        ...s,
        pauses: 0,
        pausedAt: null,
        since: s.since + shift,
        idleSince: s.idleSince + shift,
      };
    }
    default:
      break;
  }
  if (s.pauses > 0) return s; // timers stopped, nothing on screen
  switch (kind) {
    case 'tick':
      if (s.phase === 'wait') return t - s.since >= s.delayMs ? show(s, t) : s;
      if (s.phase === 'shown') return !s.touching && t - s.since >= timings.visibleMs ? hide(s, t) : s;
      return !s.touching && t - s.idleSince >= timings.idleReshowMs ? show(s, t) : s;
    case 'touchDown':
      return { ...s, touching: true, idleSince: t };
    case 'touchUp': {
      const up = { ...s, touching: false, idleSince: t };
      return s.phase === 'shown' ? hide(up, t) : up;
    }
    case 'correctAction':
      return s.phase === 'shown' ? hide(s, t) : { ...s, idleSince: t };
    default:
      return s;
  }
}

/** What the view draws for a presence (UX §13.1 "Ne görünür"). */
export interface PresenceLook {
  /** Highlight pulse (and the panorama arrow) on screen. */
  readonly highlight: boolean;
  /** Bubble on screen (shown and not past `reshowsWithBubble` re-shows). */
  readonly bubble: boolean;
  /** Bubble at `dragFadeAlpha` (a touch is held). */
  readonly faded: boolean;
  /** Glove on screen (shown, no touch held; the view also needs its play condition, DL-2R-20). */
  readonly glove: boolean;
}

export function presenceLook(s: PresenceState, timings: PresenceTimings = PRESENCE_TIMINGS): PresenceLook {
  const on = s.phase === 'shown' && s.pauses === 0;
  return {
    highlight: on,
    bubble: on && s.shows - 1 <= timings.reshowsWithBubble,
    faded: on && s.touching,
    glove: on && !s.touching,
  };
}

/** ANALYTICS `tutorial_step` of an ended step: `shows` ≥ 1 (a step done before its first show counts one), ms. */
export function presenceReport(
  s: PresenceState,
  t: number,
): { readonly shows: number; readonly msToDone: number } {
  const end = s.doneAt ?? t;
  return {
    shows: Math.max(1, s.shows),
    msToDone: s.firstShownAt === null ? 0 : Math.max(0, Math.round(end - s.firstShownAt)),
  };
}
