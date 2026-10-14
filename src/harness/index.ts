/**
 * Playwright harness (docs/TECH_DESIGN.md §1.2, §10.7, §12.2, §12.4, §14.1 #15; R-20): `window.__harness` for
 * tools/screens.ts, tools/perf.ts and tests/e2e. Loaded only by `vite build --mode harness` (main.ts guards the dynamic
 * import with `import.meta.env.MODE`), never in the store/web bundle (tools/verify-dist.ts checks dist/).
 *
 * The harness reads the game and plans gestures; it never changes the game state itself and decides no rule:
 * - levels start through the scene manager like the home button does (`Level` scene, `{ levelId }`);
 * - moves are played as touch gestures through the real input path (Phaser input → DragController → core); the
 *   gesture is planned from core queries (BFS path, plan.ts) and dispatched by the tool (CDP) or in the page
 *   (synthetic.ts);
 * - "reduce motion" goes through the settings stub `changeSetting` (JUICE §0 rule 8);
 * - state reads are core read-only functions (`toAscii`, `hashHex`, `queueIds`) and the scene's public getters.
 *
 * Page flags: `window.__ready` (boot finished + fonts loaded, TECH §12.2), `window.__levelInteractive` (ms since
 * navigation start when the level screen first took input, the FTUE gate of TECH §10.7 item 6).
 * URL parameters: `reducedMotion=1|0`, `level=N` (start level N after the boot), `autoplay=golden` (with `level`:
 * play the hand golden in the page), `cvd=protanopia|deuteranopia|tritanopia` (colour-vision simulation on `#game`,
 * screens `--cvd`).
 */
import Phaser from 'phaser';
import { scaleMode } from '../config/display.ts';
import { toAscii } from '../core/ascii.ts';
import { hashHex } from '../core/hash.ts';
import { levelHooks } from '../core/obstacles/registry.ts';
import type { CompiledLevel } from '../core/level/compile.ts';
import { GameSession } from '../core/session.ts';
import { queueIds } from '../core/state.ts';
import { appSave, changeSetting } from '../scenes/appServices.ts';
import { DEPTH } from '../scenes/level/depth.ts';
import { HOME_SCENE_KEY, LEVEL_SCENE_KEY } from '../scenes/level/LevelScene.ts';
import { loadLevelById, setLevelSource } from '../scenes/level/levels.ts';
import { PROLOGUE_SCENE } from '../scenes/flow/launch.ts';
import { gameAssets } from '../scenes/AssetLoaderScene.ts';
import type { LevelScene, LevelSceneData } from '../scenes/level/LevelScene.ts';
import type { CueKind } from '../scenes/level/juice/plan.ts';
import { tDynamic, upper } from '../services/i18n.ts';
import { clearTimings, timingSamples } from '../services/timings.ts';
import { createLayout, designHeight } from '../theme/layout.ts';
import type { Layout } from '../theme/layout.ts';
import { TOKENS } from '../theme/tokens.ts';
import type {
  ClientPoint,
  CueKey,
  DragKind,
  DragMove,
  DragPlanOptions,
  HarnessApi,
  HarnessState,
  HarnessStatus,
  TapTarget,
  TouchPlan,
  TutorialInfo,
} from './api.ts';
import { goldenMoves } from './golden.ts';
import { PerfSampler } from './perf.ts';
import { planDragDesign } from './plan.ts';
import type { DesignPoint } from './plan.ts';
import { findDragOn } from './search.ts';
import { dispatchGesture } from './synthetic.ts';
import { applyCvd, isCvdKind } from './cvd.ts';
import { PALETTE_SCENE_KEY, PaletteScene } from './palette.ts';
import type { HomeScene } from '../scenes/HomeScene.ts';
import type { IntroScene } from '../scenes/IntroScene.ts';

const BOOT_SCENE_KEY = 'Boot';
const INTRO_SCENE_KEY = 'Intro';
const DEFAULT_WAIT_MS = 20_000;

/** A poll runs at least this often (wall ms) even when no frame comes: a stopped loop still reaches its timeout. */
const POLL_MS = 1000;

const round2 = (v: number): number => Math.round(v * 100) / 100;
const nextFrame = (): Promise<number> => new Promise((resolve) => requestAnimationFrame(resolve));
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
/** Resolves at the next frame, or after `POLL_MS` when the frame does not come (rAF paused, a frozen loop). */
const nextPoll = (): Promise<unknown> => Promise.race([nextFrame(), sleep(POLL_MS)]);

async function waitFor(pred: () => boolean, timeoutMs: number, what: string): Promise<void> {
  const end = performance.now() + timeoutMs;
  while (!pred()) {
    if (performance.now() > end) throw new Error(`harness: timed out waiting for ${what}`);
    await nextPoll();
  }
}

export function installHarness(game: Phaser.Game): HarnessApi {
  const sampler = new PerfSampler(game);
  /** TECH §10.4: how many times the level scene ran `create` (a home round trip wakes it, review Faz 2 tur 1 #17). */
  let levelCreates = 0;
  let levelHooked = false;
  const hookLevel = (): void => {
    if (levelHooked) return;
    const lv = game.scene.getScene(LEVEL_SCENE_KEY);
    if (!lv) return;
    levelHooked = true;
    if (game.scene.isActive(LEVEL_SCENE_KEY) || game.scene.isSleeping(LEVEL_SCENE_KEY)) levelCreates += 1;
    lv.sys.events.on(Phaser.Scenes.Events.CREATE, () => {
      levelCreates += 1;
    });
  };
  /** Game clock: sum of Phaser's smoothed frame deltas (what the scenes' `update(time, delta)` receive). */
  let gameClock = 0;
  game.events.on(Phaser.Core.Events.POST_STEP, () => {
    gameClock += game.loop.delta;
  });
  /**
   * Game time has no wall budget of its own: on a slow frame pace Phaser swaps a long frame's delta for the last sane
   * one (`fps.min` 5 → every frame over 200 ms counts ≤ 200 ms, on a software GPU 16,7 ms per 600 ms … 8 s frame), so
   * 257 ms of game time can be 16 frames = minutes of wall time at 4× CPU (TECH §10.7 item 7). The wait fails only when
   * the clock stops advancing for `DEFAULT_WAIT_MS × 6` — a frozen loop, not a slow one.
   */
  const waitGameMs = async (ms: number): Promise<void> => {
    const start = gameClock;
    let last = gameClock;
    let lastAt = performance.now();
    while (gameClock - start < ms) {
      if (gameClock !== last) {
        last = gameClock;
        lastAt = performance.now();
      } else if (performance.now() - lastAt > DEFAULT_WAIT_MS * 6) {
        throw new Error(
          `harness: the game clock stopped for ${DEFAULT_WAIT_MS * 6} ms while waiting for ${ms} ms of game time (${round2(gameClock - start)} ms advanced)`,
        );
      }
      await nextPoll();
    }
  };

  const activeKey = (): string | null => game.scene.getScenes(true)[0]?.sys.settings.key ?? null;
  const bootDone = (): boolean => !game.scene.isActive(BOOT_SCENE_KEY) && activeKey() !== null;
  const fontsReady = (): boolean => document.fonts.status === 'loaded';

  /** The level scene while it runs (its views exist once `create` ran). */
  const level = (): LevelScene | null => {
    if (!game.scene.isActive(LEVEL_SCENE_KEY)) return null;
    const lv = game.scene.getScene(LEVEL_SCENE_KEY) as LevelScene | null;
    return lv && (lv.eventPlayer as LevelScene['eventPlayer'] | undefined) ? lv : null;
  };

  /** Same layout as the scenes build (`createLayout` over the EXPAND design height, D-015; the level's geometry, K-49). */
  const layout = (): Layout => {
    const lv = level();
    if (lv) return lv.layout;
    const parent = game.scale.parentSize;
    const vp =
      parent.width > 0 && parent.height > 0
        ? { width: parent.width, height: parent.height }
        : { width: game.scale.width, height: game.scale.height };
    return createLayout(TOKENS, designHeight(scaleMode, vp, TOKENS));
  };

  /** Design px → CSS px of the viewport (inverse of Phaser `ScaleManager.transformX/Y`). */
  const toClient = (p: DesignPoint): ClientPoint => {
    const sm = game.scale;
    sm.updateBounds();
    const b = sm.canvasBounds;
    const d = sm.displayScale;
    return { x: round2(b.x - window.scrollX + p.x / d.x), y: round2(b.y - window.scrollY + p.y / d.y) };
  };

  /** A window object (dim, panel) still shows: an open one, or one closing (JUICE #71) whose dim takes touches. */
  const windowShown = (lv: LevelScene): boolean =>
    lv.children.list.some((obj) => {
      const o = obj as Phaser.GameObjects.GameObject & { depth?: number; visible?: boolean; alpha?: number };
      return (o.depth ?? 0) >= DEPTH.windows && o.visible !== false && (o.alpha ?? 1) > 0;
    });

  const interactive = (lv: LevelScene | null): boolean => {
    const session = lv?.gameSession;
    if (!lv || !session || session.outcome !== 'playing') return false;
    if (lv.openWindow !== null || windowShown(lv)) return false;
    const player = lv.eventPlayer;
    return !player.locked && !player.busy;
  };

  const tutorialInfo = (lv: LevelScene): TutorialInfo | null => {
    const step = lv.tutorialController?.current ?? null;
    if (!step) return null;
    const phase = lv.tutorialPresence?.phase ?? 'wait';
    const view = lv.tutorialView;
    const bubble = view.bubbleRect;
    return {
      index: step.index,
      phase: phase === 'done' ? 'hidden' : phase,
      pieces: [...step.pieces],
      textKey: step.data.textKey,
      bubble: bubble ? { x: bubble.x, y: bubble.y, w: bubble.w, h: bubble.h } : null,
      dock: view.bubbleDock,
    };
  };

  const tutorialHand = (lv: LevelScene): HarnessState['tutorialHand'] => {
    const step = lv.tutorialController?.current ?? null;
    const hand = step?.data.hand;
    if (!step || !hand) return null;
    return { kind: hand.kind, hidden: lv.tutorialView.gloveShown === null };
  };

  const rendererName = (): HarnessState['renderer'] => {
    const type = game.renderer?.type;
    if (type === Phaser.WEBGL) return 'webgl';
    if (type === Phaser.CANVAS) return 'canvas';
    if (type === Phaser.HEADLESS) return 'headless';
    return 'unknown';
  };

  const status = (): HarnessStatus => {
    const lv = level();
    const session = lv?.gameSession ?? null;
    return {
      scene: activeKey(),
      ready: bootDone() && fontsReady(),
      levelId: session ? session.state.lvl.id : null,
      outcome: session?.outcome ?? null,
      movesMade: session?.movesMade ?? null,
      logLength: session ? session.log.length : 0,
      window: lv?.openWindow ?? null,
      interactive: interactive(lv),
      gameMs: round2(gameClock),
      loopRunning: game.loop.running,
      docHidden: document.hidden,
    };
  };

  /** Objects of the active scene's display list, containers walked; `visible` = visible with all parents. */
  const objectCount = (): { total: number; visible: number } => {
    const scene = game.scene.getScenes(true)[0];
    let total = 0;
    let visible = 0;
    const visit = (obj: Phaser.GameObjects.GameObject, shown: boolean): void => {
      const o = obj as Phaser.GameObjects.GameObject & { visible?: boolean; alpha?: number };
      const on = shown && o.visible !== false && (o.alpha ?? 1) > 0;
      total += 1;
      if (on) visible += 1;
      if (obj instanceof Phaser.GameObjects.Container) for (const child of obj.list) visit(child, on);
    };
    for (const obj of scene?.children.list ?? []) visit(obj, true);
    return { total, visible };
  };

  const state = (): HarnessState => {
    const lv = level();
    const session = lv?.gameSession ?? null;
    const s = session?.state ?? null;
    const il = appSave().data.inLevel;
    const log = session?.log ?? [];
    return {
      ...status(),
      renderer: rendererName(),
      designHeight: layout().H,
      // unrounded: tools/screens.ts turns the level 1 cell into CSS px with it (TECH §2R.13 "Hücre", 144 / 3 = 48.0 on
      // 360 × 800; two decimals made that 47.5)
      displayScale: 1 / game.scale.displayScale.x,
      movesLeft: session?.movesLeft ?? null,
      log,
      ascii: s ? toAscii(s) : null,
      hash: s ? hashHex(s) : null,
      queue: s ? queueIds(s) : [],
      busy: lv?.eventPlayer.busy ?? false,
      locked: lv?.eventPlayer.locked ?? false,
      tutorial: lv ? tutorialInfo(lv) : null,
      tutorialHand: lv ? tutorialHand(lv) : null,
      contextTip: {
        showing: lv?.contextTips.showing ?? null,
        queued: lv ? [...lv.contextTips.queued] : [],
        seen: Object.entries(appSave().data.seenContextTips)
          .filter(([, on]) => on === true)
          .map(([topic]) => topic),
      },
      lives: { stored: appSave().data.lives.stored, reserved: appSave().data.lives.reserved },
      savedAttempt: il
        ? {
            levelId: il.levelId,
            actions: il.actions.length,
            tutorial: il.tutorial ? { ...il.tutorial } : null,
          }
        : null,
      reducedMotion: lv?.eventPlayer.reduced ?? appSave().data.settings.reduceMotion,
      levelCreates,
      objects: objectCount(),
      cellPx: layout().grid.cellPx,
      pick: { kind: lv?.pick.kind ?? null, spots: lv?.pick.spots.length ?? 0 },
      boosters: { ...appSave().data.boosters.inventory },
    };
  };

  /** Visible texts of the active scene (containers walked; a hidden parent hides its children). */
  const texts = (): string[] => {
    const scene = game.scene.getScenes(true)[0];
    const out: string[] = [];
    const visit = (obj: Phaser.GameObjects.GameObject, shown: boolean): void => {
      const o = obj as Phaser.GameObjects.GameObject & { visible?: boolean; alpha?: number };
      const on = shown && o.visible !== false && (o.alpha ?? 1) > 0;
      if (obj instanceof Phaser.GameObjects.Container) {
        for (const child of obj.list) visit(child, on);
        return;
      }
      if (on && obj instanceof Phaser.GameObjects.Text && obj.text.trim() !== '') out.push(obj.text);
    };
    for (const obj of scene?.children.list ?? []) visit(obj, true);
    return out;
  };

  const running = (): LevelScene => {
    const lv = level();
    if (!lv?.gameSession) throw new Error('harness: no level is running');
    return lv;
  };

  const waitInteractive = async (timeoutMs = DEFAULT_WAIT_MS * 6, id?: number): Promise<HarnessState> => {
    await waitFor(
      () => {
        const lv = level();
        return interactive(lv) && (id === undefined || lv?.gameSession?.state.lvl.id === id);
      },
      timeoutMs,
      id === undefined ? 'an interactive level' : `level ${id} to be interactive`,
    );
    return state();
  };

  const planDrag = (move: DragMove, opts: DragPlanOptions = {}): TouchPlan => {
    const lv = running();
    const s = lv.gameSession?.state;
    if (!s) throw new Error('harness: no level is running');
    const L = layout();
    const plan = planDragDesign(
      s,
      move,
      levelHooks(s.lvl).drag ?? {},
      L.grid,
      {
        holdMs: TOKENS.drag.holdMs,
        fingerOffsetMs: TOKENS.duration.fingerOffset,
        fingerOffsetCells: TOKENS.drag.fingerOffsetCells,
        hitSlopPx: L.touch.hitSlopPx,
      },
      opts,
    );
    return {
      pieceId: plan.pieceId,
      to: plan.to,
      nodes: plan.nodes.length,
      down: toClient(plan.down),
      moves: plan.moves.map((m) => ({ ...toClient(m), atMs: round2(m.atMs) })),
      upAtMs: round2(plan.upAtMs),
      back: plan.back.map(toClient),
    };
  };

  /** Visible text object showing `t(key)` (or its upper-cased form), the top-most one; its centre. */
  const textPoint = (key: string, params?: Readonly<Record<string, string | number>>): ClientPoint | null => {
    const scene = game.scene.getScenes(true)[0];
    if (!scene) return null;
    const wanted = tDynamic(key, params);
    const texts = new Set([wanted, upper(wanted)]);
    let best: { p: DesignPoint; depth: number } | null = null;
    const visit = (obj: Phaser.GameObjects.GameObject, depth: number, visible: boolean): void => {
      const o = obj as Phaser.GameObjects.GameObject & { visible?: boolean; alpha?: number; depth?: number };
      const shown = visible && o.visible !== false && (o.alpha ?? 1) > 0;
      const d = depth >= 0 ? depth : (o.depth ?? 0);
      if (obj instanceof Phaser.GameObjects.Container) {
        for (const child of obj.list) visit(child, d, shown);
        return;
      }
      if (!shown || !(obj instanceof Phaser.GameObjects.Text) || !texts.has(obj.text)) return;
      const r = obj.getBounds();
      if (!best || d >= best.depth) best = { p: { x: r.centerX, y: r.centerY }, depth: d };
    };
    for (const obj of scene.children.list) visit(obj, -1, true);
    const found = best as { p: DesignPoint; depth: number } | null;
    return found ? toClient(found.p) : null;
  };

  const tapPoint = (target: TapTarget): ClientPoint | null => {
    if (target.kind === 'pause') {
      if (!level()) return null;
      const r = layout().top.pause;
      return toClient({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
    }
    if (target.kind === 'trowel') {
      const lv = level();
      return lv ? toClient(lv.trowelPoint) : null;
    }
    if (target.kind === 'close') {
      const p = level()?.windowClosePoint ?? null;
      return p ? toClient(p) : null;
    }
    if (target.kind === 'slot') {
      const p = level()?.slotPoint(target.id) ?? null;
      return p ? toClient(p) : null;
    }
    if (target.kind === 'cancel') {
      const p = level()?.cancelPoint ?? null;
      return p ? toClient(p) : null;
    }
    if (target.kind === 'piece') {
      const p = level()?.piecePoint(target.pieceId) ?? null;
      return p ? toClient(p) : null;
    }
    if (target.kind === 'spot') {
      const r = level()?.pick.spots[target.index] ?? null;
      return r ? toClient({ x: r.x + r.w / 2, y: r.y + r.h / 2 }) : null;
    }
    if (target.kind === 'settings') {
      if (activeKey() !== HOME_SCENE_KEY) return null;
      const p = (game.scene.getScene(HOME_SCENE_KEY) as HomeScene).settingsPoint;
      return p ? toClient(p) : null;
    }
    if (target.kind === 'design') {
      const H = layout().H;
      return toClient({ x: target.x, y: target.y < 0 ? H + target.y : target.y });
    }
    return textPoint(target.key, target.params);
  };

  const api: HarnessApi = {
    version: 1,
    status,
    state,
    async loadLevel(id: number): Promise<HarnessState> {
      await waitFor(bootDone, DEFAULT_WAIT_MS, 'the boot');
      const saved = appSave().data.inLevel;
      if (saved && saved.levelId !== id)
        throw new Error(
          `harness: an attempt of level ${saved.levelId} is saved (K-43: one attempt at a time)`,
        );
      for (const sc of game.scene.getScenes(true)) {
        const key = sc.sys.settings.key;
        if (key !== LEVEL_SCENE_KEY) game.scene.stop(key);
      }
      game.scene.start(LEVEL_SCENE_KEY, { levelId: id } satisfies LevelSceneData);
      // resolves once the level is loaded and baked (a saved attempt of this level resumes on its window, K-43);
      // the first board fall still plays: `waitInteractive` waits for the board
      await waitFor(
        () => level()?.gameSession?.state.lvl.id === id,
        DEFAULT_WAIT_MS * 6,
        `level ${id} to start`,
      );
      return state();
    },
    waitInteractive,
    golden: goldenMoves,
    findDrag(kind: DragKind) {
      const lv = running();
      const s = lv.gameSession?.state;
      if (!s) return null;
      // K-53/2: no tutorial step limits the blocks a drag may take
      return findDragOn(s, levelHooks(s.lvl), kind, null);
    },
    planDrag,
    tapPoint,
    waitGameMs,
    cueCount(id: CueKey): number {
      return level()?.eventPlayer.cueRuns.get(id as CueKind) ?? 0;
    },
    async waitCue(id: CueKey, after: number): Promise<void> {
      await waitFor(
        () => (level()?.eventPlayer.cueRuns.get(id as CueKind) ?? 0) > after,
        DEFAULT_WAIT_MS * 6,
        typeof id === 'number' ? `JUICE cue #${id}` : `cue '${id}'`,
      );
    },
    setReducedMotion(on: boolean): void {
      changeSetting('reduceMotion', on);
    },
    async playInPage(moves: readonly DragMove[], opts: DragPlanOptions = {}): Promise<void> {
      for (const move of moves) {
        await waitInteractive();
        await dispatchGesture(game.canvas, planDrag(move, opts), game.device.input.touch, waitGameMs);
      }
    },
    async introPanel(n: number): Promise<void> {
      await waitFor(() => activeKey() === INTRO_SCENE_KEY, DEFAULT_WAIT_MS, 'the intro');
      (game.scene.getScene(INTRO_SCENE_KEY) as IntroScene).holdPanel(n);
      await waitGameMs(TOKENS.duration.panelEnter + 100);
    },
    async showPalette(): Promise<void> {
      await waitFor(bootDone, DEFAULT_WAIT_MS, 'the boot');
      for (const sc of game.scene.getScenes(false)) {
        const key = sc.sys.settings.key;
        if (key !== PALETTE_SCENE_KEY && (game.scene.isActive(key) || game.scene.isSleeping(key)))
          game.scene.stop(key);
      }
      if (!game.scene.getScene(PALETTE_SCENE_KEY)) game.scene.add(PALETTE_SCENE_KEY, PaletteScene, false);
      game.scene.start(PALETTE_SCENE_KEY);
      await waitFor(() => activeKey() === PALETTE_SCENE_KEY, DEFAULT_WAIT_MS, 'the palette');
      await waitGameMs(200);
    },
    assetMode(mode: 'art' | 'fallback'): void {
      gameAssets(game).setMode(mode);
    },
    async loadLevelData(id: number, data: unknown): Promise<HarnessState> {
      setLevelSource(id, data);
      return api.loadLevel(id);
    },
    async goHome(): Promise<void> {
      await waitFor(bootDone, DEFAULT_WAIT_MS, 'the boot');
      for (const sc of game.scene.getScenes(false)) {
        const key = sc.sys.settings.key;
        if (key !== HOME_SCENE_KEY && game.scene.isActive(key)) game.scene.stop(key);
      }
      if (game.scene.isActive(HOME_SCENE_KEY)) game.scene.stop(HOME_SCENE_KEY);
      game.scene.start(HOME_SCENE_KEY, {});
      await waitFor(() => activeKey() === HOME_SCENE_KEY, DEFAULT_WAIT_MS, 'the home screen');
      await waitGameMs(300);
    },
    texts,
    timings: () => timingSamples(),
    clearTimings: () => clearTimings(),
    textureMB(): number {
      let bytes = 0;
      const tm = game.textures as unknown as { list: Record<string, Phaser.Textures.Texture> };
      for (const [key, tex] of Object.entries(tm.list)) {
        if (key === '__DEFAULT' || key === '__MISSING' || key === '__WHITE' || key === '__NORMAL') continue;
        for (const src of tex.source) bytes += src.width * src.height * 4;
      }
      return Math.round((bytes / 1024 / 1024) * 10) / 10;
    },
    seedSave(seed): void {
      const save = appSave();
      if (save.data.inLevel) throw new Error('harness: seedSave while an attempt is saved');
      save.commit((d) => {
        for (let i = 1; i <= seed.won; i++) d.progress.levels[String(i)] = { won: true, attempts: 1 };
        d.progress.highestLevel = Math.max(d.progress.highestLevel, seed.won);
        d.stars = Math.max(d.stars, seed.won);
        if (!d.town.seenScenes.includes(PROLOGUE_SCENE)) d.town.seenScenes.push(PROLOGUE_SCENE);
        const inv = d.boosters.inventory as Record<string, number>;
        for (const [id, n] of Object.entries(seed.boosters ?? {})) inv[id] = n;
        for (const id of seed.granted ?? []) {
          const b = id as (typeof d.boosters.freeTrialsGranted)[number];
          if (!d.boosters.freeTrialsGranted.includes(b)) d.boosters.freeTrialsGranted.push(b);
        }
      });
    },
    perfStart: (label: string) => sampler.start(label),
    perfStop: () => sampler.stop(),
    perfStats: (label: string) => sampler.stats(label),
    perfReset: () => sampler.reset(),
    setSmoothStep(on: boolean): void {
      game.loop.smoothStep = on;
    },
    async applyBench(levels: readonly number[], minActions: number): Promise<number[]> {
      const loaded: { lvl: CompiledLevel; moves: readonly DragMove[] }[] = [];
      for (const id of levels) {
        const r = await loadLevelById(id);
        if (!r.ok) throw new Error(`harness: applyBench: level ${id} does not load (${r.stage})`);
        loaded.push({ lvl: r.level, moves: goldenMoves(id) });
      }
      const out: number[] = [];
      while (out.length < minActions) {
        for (const { lvl, moves } of loaded) {
          const g = GameSession.start(lvl, { preBoosters: [], streakTier: 0 }, { hooks: levelHooks(lvl) });
          for (const m of moves) {
            const t0 = performance.now();
            g.apply({ kind: 'drag', pieceId: m.pieceId, to: m.to });
            out.push(performance.now() - t0);
          }
        }
      }
      return out;
    },
  };

  window.__harness = api;
  game.events.on(Phaser.Core.Events.POST_RENDER, () => {
    hookLevel();
    if (!window.__ready && bootDone() && fontsReady()) window.__ready = true;
    if (window.__introShown === undefined && activeKey() === INTRO_SCENE_KEY)
      window.__introShown = round2(performance.now());
    if (window.__levelShown === undefined && level()?.gameSession)
      window.__levelShown = round2(performance.now());
    if (window.__levelInteractive === undefined && interactive(level()))
      window.__levelInteractive = round2(performance.now());
  });

  const q = new URLSearchParams(window.location.search);
  const cvd = q.get('cvd');
  if (isCvdKind(cvd)) applyCvd(cvd);
  const rm = q.get('reducedMotion');
  if (rm === '1' || rm === '0') api.setReducedMotion(rm === '1');
  const lvl = Number(q.get('level'));
  if (Number.isInteger(lvl) && lvl > 0) {
    void api
      .loadLevel(lvl)
      .then(() => (q.get('autoplay') === 'golden' ? api.playInPage(goldenMoves(lvl)) : undefined))
      .catch((e: unknown) => console.error(e));
  }
  return api;
}
