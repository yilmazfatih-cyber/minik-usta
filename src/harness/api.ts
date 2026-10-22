/**
 * Shape of the Playwright harness (`window.__harness`, docs/TECH_DESIGN.md §1.2, §10.7, §12.2, §12.4; R-20). Types only:
 * the browser side (src/harness/index.ts) implements it, the Node tools (tools/screens.ts, tools/perf.ts,
 * tests/e2e) call it through `page.evaluate`. The harness exists only in `vite build --mode harness`
 * (artifacts/harness); the store/web bundle in dist/ never contains it (tools/verify-dist.ts).
 *
 * Coordinates: `ClientPoint` = CSS px of the page viewport (what CDP `Input.dispatchTouchEvent` takes); design px are
 * the game's 1080-wide units and stay inside the harness.
 */
import type { DragNode, PieceId, SessionAction } from '../core/types.ts';
import type { TimingKey } from '../services/timings.ts';

/**
 * A cue kind of the EventPlayer's plan (`scenes/level/juice/plan.ts` `CueKind`: a JUICE id or an internal kind such as
 * `'teardown'`). Declared here as `number | string` so this file stays free of scene imports: tools/ type-check without
 * `vite/client` and must not reach `import.meta.env` through the scene graph.
 */
export type CueKey = number | string;

export interface ClientPoint {
  readonly x: number;
  readonly y: number;
}

/** A drag move as the core records it (`{ kind: 'drag', pieceId, to }`, TECH §6.1). */
export interface DragMove {
  readonly pieceId: PieceId;
  readonly to: DragNode;
}

/**
 * What a drag search looks for (screens: shadows; tools: moves that spend a move without placing):
 * - `correct` / `wrong`: a FREE release over the site whose fall shadow is ✓ / ! (`reasons[0]` ≠ `support`);
 * - `support`: a release whose shadow's primary reason is K-34 missing support (the ↓ badge and hatch), rail first;
 * - `rail`: a release on a W1 gap rail (K-12);
 * - `yard`: a K-10 yard reposition (costs a move, places nothing);
 * - `cancel`: a node whose release would cancel with the UX §5.3 preview (K-07 rows 3–4: crane area over the yard,
 *   straddling the wall) — the dragged block turns 60 % opaque with the ↩ badge.
 */
export type DragKind = 'correct' | 'wrong' | 'support' | 'rail' | 'yard' | 'cancel';

export interface DragCandidate extends DragMove {
  readonly kind: DragKind;
  /** K-18 shadow of the release (`shadowInfo`); null for a yard drop. */
  readonly tone: 'correct' | 'wrong' | 'neutral' | null;
  readonly reasons: readonly string[];
  /** BFS steps from the piece's start node. */
  readonly steps: number;
}

/** One touch gesture, timed from the touch start (ms). */
export interface TouchPlan {
  readonly pieceId: PieceId;
  readonly to: DragNode;
  /** Nodes of the BFS path the finger follows, start node first. */
  readonly nodes: number;
  readonly down: ClientPoint;
  readonly moves: readonly (ClientPoint & { readonly atMs: number })[];
  /** Release time (the finger rests on the target from the last move until then). */
  readonly upAtMs: number;
  /** Points back along the path to the start node: a held drag released there cancels (K-07 row 1, no move spent). */
  readonly back: readonly ClientPoint[];
}

export interface DragPlanOptions {
  /** Finger speed along the path, cells per second (default 8). */
  readonly speedCellsPerSec?: number;
  /** Still time after the press: hold-to-lift (`drag.holdMs`) + finger-offset glide (`duration.fingerOffset`). */
  readonly liftHoldMs?: number;
  /** Still time on the target before the release. */
  readonly endHoldMs?: number;
  /** Interval of the touch moves (default 1000 / 60). */
  readonly frameMs?: number;
}

export type TapTarget =
  /** The level screen's pause button (`layout.top.pause`). */
  | { readonly kind: 'pause' }
  /** The visible text object showing `t(key)` (or its upper-cased form): a window option, the intro's "Geç" … */
  | {
      readonly kind: 'text';
      readonly key: string;
      /** i18n parameters of the text (`home.play` → `{ n: 2 }`). */
      readonly params?: Readonly<Record<string, string | number>>;
    }
  /** The × of the open level window (UX §0.3) or of the home screen's open window (settings, level start). */
  | { readonly kind: 'close' }
  /** A pre-level booster slot of the open level-start window (`thermos`, `trowelStart`, `openShutter`; K-40). */
  | { readonly kind: 'preSlot'; readonly id: string }
  /** The Golden Trowel icon of the status strip (UX §5.2; its tap target is the whole streak strip). */
  | { readonly kind: 'trowel' }
  /** A booster slot of the level screen (K-54; `hammer`, `crane`, `paintBrush`, `undo`). */
  | { readonly kind: 'slot'; readonly id: string }
  /** The × "Vazgeç" of the open booster / trowel pick (UX §5.2 step 1, DS-13). */
  | { readonly kind: 'cancel' }
  /** A piece at rest (pick modes: the block to hammer / lift / fly). */
  | { readonly kind: 'piece'; readonly pieceId: PieceId }
  /** Target spot `index` the open pick shows (crane / trowel ghosts). */
  | { readonly kind: 'spot'; readonly index: number }
  /** The home screen's settings gear (UX §3). */
  | { readonly kind: 'settings' }
  /** Any point in design px of the active scene (home screen icons; `y` < 0 counts from the bottom). */
  | { readonly kind: 'design'; readonly x: number; readonly y: number };

export interface TutorialInfo {
  readonly index: number;
  /** K-53 presence of the active step (UX §13.1): waiting to show, on screen, or hidden until the player is idle. */
  readonly phase: 'wait' | 'shown' | 'hidden';
  readonly pieces: readonly PieceId[];
  readonly textKey: string;
  /** The Usta Dede bubble on screen (design px) and its dock (UX §13.1), null when it is not shown. */
  readonly bubble: { readonly x: number; readonly y: number; readonly w: number; readonly h: number } | null;
  readonly dock: 'top' | 'bottom' | null;
}

/** Cheap per-frame view of the game (waits poll this; `state()` adds the board, log and hash). */
export interface HarnessStatus {
  /** Active scene key (`Boot`, `Intro`, `Home`, `Level`). */
  readonly scene: string | null;
  /** Boot finished (route chosen) and the document fonts are loaded. */
  readonly ready: boolean;
  readonly levelId: number | null;
  readonly outcome: string | null;
  readonly movesMade: number | null;
  /** Length of the attempt's action log (`start` included). */
  readonly logLength: number;
  /** Open window: level (`pause`, `exit`, `offer`, `loss`, `win`, `store`) or home (`levelStart`, `settings`, `notice`). */
  readonly window: string | null;
  /** The board takes a grab now: attempt running, no window, no pending or locked cues. */
  readonly interactive: boolean;
  /** Game clock (ms): the sum of Phaser's smoothed frame deltas since the page loaded (`waitGameMs` pace diagnostics). */
  readonly gameMs: number;
  /** Phaser's loop is running (not paused by a hidden document) and the document is visible (stall diagnostics). */
  readonly loopRunning: boolean;
  readonly docHidden: boolean;
  /**
   * DS3-01 (a): live `ArtImage`s still waiting for their raster (ids), and whether the `icons_v2` atlas is in use. The
   * screens tool shoots only when `artPending` is empty (and the icons are in where P1 was requested).
   */
  readonly artPending: readonly string[];
  readonly iconsArt: boolean;
}

export interface HarnessState extends HarnessStatus {
  readonly renderer: 'webgl' | 'canvas' | 'headless' | 'unknown';
  /** Design height H (EXPAND, D-015) and CSS px per design px. */
  readonly designHeight: number;
  /** CSS px per design px of the canvas (`1 / ScaleManager.displayScale.x`), unrounded (the cell gate). */
  readonly displayScale: number;
  readonly movesLeft: number | null;
  /** The attempt's action log (`start` first, TECH §6.1 / §11.1). */
  readonly log: readonly SessionAction[];
  /** Core board (TECH Ek A) and state hash (§2.6). */
  readonly ascii: string | null;
  readonly hash: string | null;
  /** Truck queue (K-26), FIFO. */
  readonly queue: readonly PieceId[];
  readonly busy: boolean;
  readonly locked: boolean;
  readonly tutorial: TutorialInfo | null;
  /** The glove of the active step (UX §13.1): its gesture and whether it is off screen now (null: the step has none). */
  readonly tutorialHand: { readonly kind: 'tap' | 'drag' | 'hold'; readonly hidden: boolean } | null;
  /**
   * Contextual Usta Dede lines (UX §13.2, `tut.ctx.<topic>`): the one on screen, the ones waiting, and the topics the
   * account has seen (`seenContextTips`).
   */
  readonly contextTip: {
    readonly showing: string | null;
    readonly queued: readonly string[];
    readonly seen: readonly string[];
  };
  /** Saved lives (META: `stored`, and the one `reserved` by the running attempt). */
  readonly lives: { readonly stored: number; readonly reserved: number };
  /** K-43 saved attempt (`inLevel`): level, log length and the saved tutorial position (`inLevel.tutorial`). */
  readonly savedAttempt: {
    readonly levelId: number;
    readonly actions: number;
    readonly tutorial: {
      readonly index: number;
      readonly shown: boolean;
      readonly count: number;
      readonly actions: number;
    } | null;
  } | null;
  readonly reducedMotion: boolean;
  /** Times the level scene ran `create` (TECH §10.4: level changes reuse it — home sleeps it, the next level wakes it). */
  readonly levelCreates: number;
  /** Cell size of the level's board in design px (UX §5.8 adaptive cell; × `displayScale` = CSS px). */
  readonly cellPx: number;
  /** The open booster / trowel pick (`hammer`, `crane`, `trowel`) and how many target spots it shows. */
  readonly pick: { readonly kind: string | null; readonly spots: number };
  /** Save inventory of the boosters (META §4; WP-K). */
  readonly boosters: Readonly<Record<string, number>>;
  /** Game objects of the active scene (containers walked) and how many of them render (TECH §10.6: ≤ 400). */
  readonly objects: { readonly total: number; readonly visible: number };
}

/** Frame statistics of one sampled phase (TECH §10.7 item 5). Times in ms. */
export interface PerfStats {
  readonly label: string;
  readonly frames: number;
  readonly durationMs: number;
  /** rAF rate over the phase (includes the GPU / compositor share; SwiftShader in headless runs). */
  readonly fps: number;
  readonly intervalP50: number;
  readonly intervalP95: number;
  readonly intervalP99: number;
  /** Share of frame intervals over 20 ms, and intervals over 50 ms. */
  readonly over20Ratio: number;
  readonly over50: number;
  /** rAF time → end of Phaser's render submission: main-thread time of the frame, waits before its start included. */
  readonly workP50: number;
  readonly workP95: number;
  /**
   * CPU side: the frame's touch handlers + Phaser's step (`PRE_STEP` → `POST_RENDER`), GPU waits excluded. `cpuFps` =
   * 1000 / mean(max(cpu, 1000 / 60)): the frame rate the CPU side sustains on a 60 Hz display (the perf gate).
   */
  readonly cpuP50: number;
  readonly cpuP95: number;
  readonly cpuMax: number;
  readonly cpuOver50: number;
  readonly cpuFps: number;
  /** Phaser step split: scene updates + tweens (`PRE_STEP` → `PRE_RENDER`) and the render calls. */
  readonly updateP50: number;
  readonly updateP95: number;
  readonly renderP50: number;
  readonly renderP95: number;
  /**
   * Input latency (TECH §10.7 item 5): touch move that wrote the dragged block's pose → `POST_RENDER` of the frame that
   * draws it, in ms and in rendered frames (1 = the next frame; TECH §4.6 one-frame response).
   */
  readonly inputSamples: number;
  readonly inputP50: number;
  readonly inputP95: number;
  readonly inputFramesP95: number;
  readonly inputFramesMax: number;
  /** `long-animation-frame` entries (Chromium 123+) during the phase, and the longest one. */
  readonly longFrames: number;
  readonly longestFrameMs: number;
  /**
   * The frame with the longest CPU side: its split (touch handlers, update, render), the touch events dispatched before
   * it (`touchstart+touchmove`, `touchend`, … ; '' none) and its index in its recording window (1 = first frame).
   */
  readonly cpuMaxFrame: {
    readonly cpuMs: number;
    readonly handlersMs: number;
    readonly updateMs: number;
    readonly renderMs: number;
    readonly touches: string;
    readonly frameInWindow: number;
  } | null;
}

export interface HarnessApi {
  readonly version: 1;
  status(): HarnessStatus;
  state(): HarnessState;
  /**
   * Starts level `id` as a new attempt once the boot has finished (other scenes stop). Resolves when the level is
   * loaded (its first board fall may still play: `waitInteractive`). A saved attempt of this level resumes on its
   * window; one of another level is refused (K-43 item 3: one attempt at a time).
   */
  loadLevel(id: number): Promise<HarnessState>;
  /** Resolves when the level screen is interactive (and the given level runs, when `id` is set). */
  waitInteractive(timeoutMs?: number, id?: number): Promise<HarnessState>;
  /** Drag moves of the hand golden of level `id` (tests/golden/level_NNN.hand.json, TECH §9.5). */
  golden(id: number): DragMove[];
  /** A drag of the running level matching `kind` (core queries only: BFS, `classify`, `computeFall`). */
  findDrag(kind: DragKind): DragCandidate | null;
  /** The touch gesture that plays `move` through the real input path (DragController → core). */
  planDrag(move: DragMove, opts?: DragPlanOptions): TouchPlan;
  /** Client point of a tap target, or null when it is not on screen. */
  tapPoint(target: TapTarget): ClientPoint | null;
  /**
   * Resolves once the game clock (Phaser's smoothed frame delta, the time the scenes animate and the DragController
   * lifts by) has advanced `ms`. On a slow frame pace Phaser caps each frame's delta (`fps.min` 5 → 200 ms, then the
   * last sane delta), so game time can run far slower than wall time: gestures rest in game time, not wall time.
   */
  waitGameMs(ms: number): Promise<void>;
  /**
   * Times the level's EventPlayer started a cue `id` (screens: shoot inside an effect, review Faz 2 tur 2 #6). `id` is
   * the plan's cue kind: a JUICE number, or an internal kind such as `'teardown'` (JUICE #107 Söküm is planned under
   * that string kind, never under 107).
   */
  cueCount(id: CueKey): number;
  /** Resolves once cue `id` has started more than `after` times. */
  waitCue(id: CueKey, after: number): Promise<void>;
  /** "Animasyonları azalt" through the settings stub (`changeSetting`, JUICE §0 rule 8). */
  setReducedMotion(on: boolean): void;
  /**
   * Plays `moves` one after the other with synthetic DOM touch (or mouse) events in the page, each planned on the
   * state it starts from: for devices without a CDP driver (R-23 device round, `?autoplay=golden`).
   */
  playInPage(moves: readonly DragMove[], opts?: DragPlanOptions): Promise<void>;
  /**
   * The intro (if it runs) shows panel `n` (0-based) and stays on it: screen shots of each panel without the wall-clock
   * auto-advance (review Faz 2 tur 1 #10).
   */
  introPanel(n: number): Promise<void>;
  /** Stops every scene and shows the 8-colour palette fixture (shot `19-palette`, harness only). */
  showPalette(): Promise<void>;
  /**
   * TECH §2R.11: `art` = the SVG rasters (default), `fallback` = the procedural art only (`assets=fallback` shots).
   */
  assetMode(mode: 'art' | 'fallback'): void;
  /**
   * TECH §2R.11 `loadAscii` (fixture boards: the Söküm of a dead end, a slot without target): registers level data for
   * id `id` (validated like a bundled file, `levels.ts setLevelSource`) and starts it as a new attempt.
   */
  loadLevelData(id: number, data: unknown): Promise<HarnessState>;
  /** The home screen (`Home`, a fresh build of it); resolves when it runs. */
  goHome(): Promise<void>;
  /** Opens the "Dokun ve al" reward layer over the home screen (UX §6.2; the slice has no trigger of its own). */
  showReward(): Promise<void>;
  /** Releases a boot held by `window.__holdBoot` (the loading-screen shot). */
  releaseBoot(): void;
  /**
   * Screens set-up of the meta save (never the game state of an attempt): the prologue seen, levels 1…`won` won
   * (`stars` = `won`, META §10) and META §4 boosters (`inventory`, `freeTrialsGranted`). One save write; refused while
   * an attempt is saved.
   */
  seedSave(seed: {
    readonly won: number;
    readonly boosters?: Readonly<Record<string, number>>;
    readonly granted?: readonly string[];
  }): void;
  /**
   * The visible text objects of the active scene (containers walked): the screens tool's raw i18n key gate (DS-01:
   * no `^[a-z]+(\.[A-Za-z0-9_]+)+$` text, no debug label on screen).
   */
  texts(): string[];
  /** TECH §2R.13 timing samples (ms): `kitBake`, `levelBake`, `apply`, `commit`, `saveWrite` (services/timings.ts). */
  timings(): Partial<Record<TimingKey, number[]>>;
  clearTimings(): void;
  /** TECH §2R.13 "Bellek": every texture source of the game, width × height × 4 bytes, in MB (≤ 64). */
  textureMB(): number;
  /** Frame sampler (perf.ts): start (or continue) recording into bucket `label`; stop; read; clear all buckets. */
  perfStart(label: string): void;
  perfStop(): void;
  perfStats(label: string): PerfStats | null;
  perfReset(): void;
  /**
   * Phaser `TimeStep.smoothStep` on / off (perf.ts). Off: game time follows wall time — a frame slower than `fps.min`
   * (200 ms) counts its real delta instead of the last sane one, so on a software GPU at 4× CPU (frames of seconds) the
   * scenes step like on a device with sane frames and a gesture's lift rest takes one frame, not sixteen. Screens keep
   * it on (transient balloons are shot while game time crawls).
   */
  setSmoothStep(on: boolean): void;
  /**
   * TECH §2R.4 / §2R.13 "Adım 12" gate: `GameSession.apply` durations (ms) of the hand goldens of `levels`, replayed on
   * the pure core (no scene, no save) in a fresh session per replay, cycling the levels until ≥ `minActions` actions.
   */
  applyBench(levels: readonly number[], minActions: number): Promise<number[]>;
}

declare global {
  interface Window {
    __harness?: HarnessApi;
    /** TECH §12.2: boot finished and fonts loaded. */
    __ready?: boolean;
    /** TECH §10.7 FTUE gate: ms since navigation start when the level screen first became interactive. */
    __levelInteractive?: number;
    /** FTUE breakdown: ms since navigation start when the intro, then the level screen (level loaded) first ran. */
    __introShown?: number;
    __levelShown?: number;
  }
}
