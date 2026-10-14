/**
 * `npm run screens` (= `vite build --mode harness && node tools/screens.ts`): the Faz 2R screen set for the design-lead
 * review (docs/TECH_DESIGN.md §2R.11, §12.2; CLAUDE.md "Bitti tanımı": 390 × 844 and 360 × 800; review inbox
 * `design-lead-2R-screens-1.md` DS-01, DS-14, DS-20).
 *
 * Every scenario starts in a fresh browser context on the harness build served by `vite preview --mode harness`, with
 * reduced motion on (still frames, JUICE §0 rule 8; one tutorial shot runs with full motion for the DS-15 ghost) and a
 * seeded save where it needs one (prologue seen, levels won so far, META §4 boosters). It reaches its screens only
 * through the game's own input path: taps and drags are CDP touch gestures (tools/lib/harnessClient.ts) planned by
 * `window.__harness` from core queries; nothing writes the game state. Fixture boards (the Söküm dead end) go through
 * `__harness.loadLevelData` — the same schema + logic check as a bundled level.
 *
 * Shots (artifacts/screens/2r/<profile>/<name>.png):
 * - home: `home-v2-first`, `home-v2`, `home-v2-fallback`, `home-v2-locked-tap`, `home-settings`, `home-feedback-copied`,
 *   `home-feedback-manual` (UX §3, §11; WP-O);
 * - level starts `level-01` … `level-10` (every board size of the slice; `-fallback` for 1 and 8);
 * - tutorial: `tutorial-shown`, `tutorial-hidden`, `tutorial-l03-step1`, `tutorial-l01-ghost-motion` (UX §13.1, DS-15);
 * - win: `win-v2`, `win-v2-loop` (META §10 replay: base coins only, no star);
 * - boosters: `flow-hammer-pick` (× on the slot, DS-13), `flow-hammer-hit`, `flow-hammer-after`, `booster-no-target`,
 *   `flow-crane-pick`, `flow-crane-spots`, `flow-crane-after`, `flow-trowel-pick` (× in the strip);
 * - Söküm: `teardown-line` (+600 ms of #107, DS-14) and `teardown-after`;
 * - level 2 windows: `pause`, `exit-m0`, `lose-1-offer` (`lose.blocksLeft`), `lose-2-life`, `resume-strip`.
 * The short views 390 × 763 and 360 × 740 (`SHORT_PROFILES`) get the level 1–5 starts (tutorial bubble placement).
 *
 * Gates (exit 1): a scenario error, a console error, a visible text that is a raw i18n key
 * (`^[a-z]+(\.[A-Za-z0-9_]+)+$`) or the debug label `DBG` (DS-01, DS-20), and on 360 × 800 a level 1 cell under 48 CSS
 * px (TECH §2R.13 "Hücre"). Options: `--profile <name>`, `--only <shot-prefix>[,…]`, `--cvd
 * protanopia,deuteranopia,tritanopia|all` (Machado 2009 filter on `#game`, into `<profile>-<cvd>/`).
 */
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Browser } from '@playwright/test';
import economy from '../config/economy.json' with { type: 'json' };
import { craneSelectable } from '../src/core/boosters.ts';
import { trowelsOf } from '../src/core/combo.ts';
import { loadLevel as compileLevel } from '../src/core/level/compile.ts';
import type { CompiledLevel } from '../src/core/level/compile.ts';
import { levelHooks } from '../src/core/obstacles/registry.ts';
import { GameSession } from '../src/core/session.ts';
import { createInitialState } from '../src/core/state.ts';
import type { DragMove, DragPlanOptions } from '../src/harness/api.ts';
import { DEBUG_ROOT_ID, LABEL } from '../src/debug/labels.ts';
import { CVD_KINDS, isCvdKind } from '../src/harness/cvd.ts';
import type { CvdKind } from '../src/harness/cvd.ts';
import {
  PROFILES,
  SHORT_PROFILES,
  findDrag,
  golden,
  launchBrowser,
  loadLevel,
  openGame,
  playMove,
  playMoves,
  state,
  status,
  tap,
  waitInteractive,
  waitLog,
  waitReady,
  waitWindow,
} from './lib/harnessClient.ts';
import type { GamePage, Profile } from './lib/harnessClient.ts';
import { startHarnessServer } from './lib/harnessServer.ts';
import { ROOT } from './lib/levels.ts';

const OUT = join(ROOT, 'artifacts', 'screens', '2r');
/** Fewer, coarser moves than the 60 Hz perf gesture: the headless frame pace is slow (SwiftShader). */
const SHOT_DRAG: DragPlanOptions = { speedCellsPerSec: 8, frameMs: 100, endHoldMs: 250 };
/** Game time (ms) before a shot: the first board fall and the reduced window entries (`duration.reducedFade`). */
const SETTLE_MS = 500;
/** Home / win art arrives in the background (P1 → P2 → P3) and cross-fades in 200 ms. */
const ART_MS = 2500;
const MAX_SPEND_MOVES = 40;
/** DS-01: a visible text that is an i18n key (the key shown instead of its text), and the debug toggle (DS-20). */
const RAW_KEY = /^[a-z]+(\.[A-Za-z0-9_]+)+$/;
const DEBUG_LABEL = LABEL.toggle;
/** TECH §2R.13 "Hücre": the level 1 block on 360 × 800, CSS px. */
const GATE_CELL_CSS = 48;
/** Söküm fixture id (outside the slice ids; `loadLevelData`). */
const TEARDOWN_LEVEL_ID = 90;
/** JUICE #107 Söküm cue; the shot is 600 ms into it (DS-14). */
const CUE_TEARDOWN = 107;

type Shoot = (name: string) => Promise<void>;

interface Scenario {
  readonly id: string;
  readonly shots: readonly string[];
  /** Seeded save (levels won before; META §4 inventory); null = first launch. */
  readonly seed?: Seed | null;
  readonly reducedMotion?: boolean;
  readonly permissions?: readonly string[];
  readonly run: (gp: GamePage, shoot: Shoot, notes: string[]) => Promise<void>;
}

interface Seed {
  readonly won: number;
  readonly boosters?: Readonly<Record<string, number>>;
  readonly granted?: readonly ('hammer' | 'crane' | 'undo' | 'paintBrush')[];
}

// --- level data (Node side, core reads only) ----------------------------------------------------------------------------

const levelJson = (n: number): Record<string, unknown> =>
  JSON.parse(
    readFileSync(join(ROOT, 'levels', `level_${String(n).padStart(3, '0')}.json`), 'utf8'),
  ) as Record<string, unknown>;

function compiled(data: unknown): CompiledLevel {
  const r = compileLevel(data);
  if (!r.ok) throw new Error(`screens: level does not load: ${JSON.stringify(r.issues)}`);
  return r.level;
}

/** The first Ağır Yük of a level (K-36 hammer target). */
function cargoId(n: number): number {
  const lvl = compiled(levelJson(n));
  const id = [...Array(lvl.layout.counts.pieces).keys()].find((i) => lvl.pieces[i]?.cls === 'cargo');
  if (id === undefined) throw new Error(`screens: level ${n} has no Ağır Yük`);
  return id;
}

/** The first block the crane may lift at level start (K-37). */
function craneId(n: number): number {
  const lvl = compiled(levelJson(n));
  const s = createInitialState(lvl);
  const hooks = levelHooks(lvl);
  const id = [...Array(lvl.layout.counts.pieces).keys()].find((i) => craneSelectable(s, i, hooks));
  if (id === undefined) throw new Error(`screens: level ${n} has no crane target`);
  return id;
}

/** How many golden moves of level `n` earn the first Golden Trowel (K-33), from the hand golden. */
function movesToTrowel(n: number, moves: readonly DragMove[]): number {
  const lvl = compiled(levelJson(n));
  const g = GameSession.start(lvl, { preBoosters: [], streakTier: 0 }, { hooks: levelHooks(lvl) });
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i] as DragMove;
    g.apply({ kind: 'drag', pieceId: m.pieceId, to: m.to });
    if (trowelsOf(g.state) > 0) return i + 1;
  }
  throw new Error(`screens: the golden of level ${n} earns no trowel`);
}

/**
 * GDD K-30 "döşeme çıkmazı" on a slice board (tests/core/deadlock.test.ts TILING): plan bottom → top YW, YW, WW, WW;
 * D2_0 Y, D2_0 W, O4 W. The Y at site column 0 rows 0–1, then the W at rows 2–3 is correct by K-16 and the O4 W fits
 * nowhere: the move ends in a Söküm (D3a, JUICE #107).
 */
function teardownFixture(): { data: Record<string, unknown>; moves: DragMove[] } {
  const d = levelJson(1);
  const build = d['build'] as { segments: { name: unknown }[] };
  const data = {
    ...d,
    id: TEARDOWN_LEVEL_ID,
    moves: 9,
    wall: { height: 2, gaps: [] },
    site: { cols: 2, rows: 4 },
    build: {
      mode: 'segments',
      segments: [{ name: build.segments[0]?.name, rows: ['WW', 'WW', 'YW', 'YW'] }],
    },
    yard: {
      cols: 4,
      rows: 4,
      batches: [
        {
          forSegment: 0,
          pieces: [
            { shape: 'D2_0', color: 'Y', x: 0, y: 0 },
            { shape: 'D2_0', color: 'W', x: 1, y: 0 },
            { shape: 'O4_0', color: 'W', x: 2, y: 0 },
          ],
        },
      ],
    },
  } as Record<string, unknown>;
  delete data['tutorial'];
  delete data['targets'];
  const moves: DragMove[] = [
    { pieceId: 0, to: { ix: 4, iy: 0, mode: 0 } },
    { pieceId: 1, to: { ix: 4, iy: 2, mode: 0 } },
  ];
  // the dead end really is one on the core (no board of the tool's own)
  const g = GameSession.start(compiled(data), { preBoosters: [], streakTier: 0 });
  const last = moves.map((m) => g.apply({ kind: 'drag', pieceId: m.pieceId, to: m.to })).at(-1);
  if (last?.teardown?.cause !== 'tiling') throw new Error('screens: the Söküm fixture does not tear down');
  return { data, moves };
}

// --- page helpers ---------------------------------------------------------------------------------------------------------

async function settle(gp: GamePage, ms = SETTLE_MS): Promise<void> {
  await gp.page.evaluate((t) => window.__harness!.waitGameMs(t), ms);
}

/**
 * A short balloon (`HintBubble`, 1,2–1,5 s of game time) is on screen: the shot follows at once (a full-page shot of
 * the 3× canvas takes seconds of wall time, during which the game clock runs on).
 */
async function waitText(gp: GamePage, key: string, timeoutMs = 20_000): Promise<void> {
  await gp.page.waitForFunction((k) => window.__harness!.tapPoint({ kind: 'text', key: k }) !== null, key, {
    timeout: timeoutMs,
    polling: 50,
  });
  await settle(gp, 160); // the 150 ms reduced fade-in
}

async function waitHome(gp: GamePage): Promise<void> {
  await gp.page.waitForFunction(() => window.__harness!.status().scene === 'Home', null, { timeout: 60_000 });
  await settle(gp, ART_MS);
}

async function startLevel(gp: GamePage, n: number): Promise<void> {
  await loadLevel(gp.page, n);
  await waitInteractive(gp.page, n, 300_000);
  await settle(gp);
}

async function pickKind(gp: GamePage): Promise<string | null> {
  return (await state(gp.page)).pick.kind;
}

async function waitTutorial(gp: GamePage, phase: 'shown' | 'hidden', timeoutMs = 60_000): Promise<void> {
  await gp.page.waitForFunction((p) => window.__harness!.state().tutorial?.phase === p, phase, {
    timeout: timeoutMs,
    polling: 100,
  });
}

/** Pause → shot → "Bölümden çık" → shot of the exit confirm → "Çık" (m = 0: a free exit). */
async function exitConfirm(gp: GamePage, shoot: Shoot, name: string, pauseShot?: string): Promise<void> {
  await waitInteractive(gp.page);
  await tap(gp, { kind: 'pause' });
  await waitWindow(gp.page, 'pause');
  await settle(gp, 300);
  if (pauseShot) await shoot(pauseShot);
  await tap(gp, { kind: 'text', key: 'pause.exit' });
  await waitWindow(gp.page, 'exit');
  await settle(gp);
  await shoot(name);
  await tap(gp, { kind: 'text', key: 'exit.leave' });
}

const levelName = (n: number): string => `level-${String(n).padStart(2, '0')}`;

// --- scenarios ------------------------------------------------------------------------------------------------------------

const LEVEL_STARTS: readonly Scenario[] = Array.from({ length: 10 }, (_, i) => i + 1).map((n) => ({
  id: `level${n}`,
  shots: [levelName(n), ...(n === 1 || n === 8 ? [`${levelName(n)}-fallback`] : [])],
  seed: { won: n - 1 },
  run: async (gp, shoot, notes) => {
    await startLevel(gp, n);
    await shoot(levelName(n));
    const s = await state(gp.page);
    notes.push(`${levelName(n)} cell ${s.cellPx} px = ${(s.cellPx * s.displayScale).toFixed(1)} CSS px`);
    if (n === 1 || n === 8) {
      await gp.page.evaluate(() => window.__harness!.assetMode('fallback'));
      await settle(gp, 400);
      await shoot(`${levelName(n)}-fallback`);
    }
  },
}));

const SHORT_STARTS: readonly Scenario[] = LEVEL_STARTS.slice(0, 5).map((sc) => ({
  ...sc,
  shots: [sc.shots[0] as string],
  run: async (gp, shoot) => {
    const n = Number(sc.id.slice('level'.length));
    await startLevel(gp, n);
    await shoot(levelName(n));
  },
}));

const SCENARIOS: readonly Scenario[] = [
  {
    id: 'home-first',
    shots: ['home-v2-first'],
    seed: { won: 0 },
    run: async (gp, shoot) => {
      await waitHome(gp);
      await shoot('home-v2-first');
    },
  },
  {
    id: 'home',
    shots: ['home-v2', 'home-v2-locked-tap', 'home-settings', 'home-feedback-copied', 'home-v2-fallback'],
    seed: { won: 4 },
    permissions: ['clipboard-read', 'clipboard-write'],
    run: async (gp, shoot, notes) => {
      await waitHome(gp);
      await shoot('home-v2');
      await tap(gp, { kind: 'text', key: 'nav.league' });
      await waitText(gp, 'common.comingSoon');
      await shoot('home-v2-locked-tap');
      await settle(gp, 1500); // the "Yakında" balloon leaves
      await tap(gp, { kind: 'settings' });
      await settle(gp, 400);
      await shoot('home-settings');
      await tap(gp, { kind: 'text', key: 'settings.feedback' });
      await waitText(gp, 'settings.feedbackCopied');
      await shoot('home-feedback-copied');
      const copied = await gp.page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
      if (!copied.startsWith('{"v":1,'))
        throw new Error('home-feedback-copied: the clipboard holds no export');
      notes.push(`feedback export ${copied.length} chars`);
      await tap(gp, { kind: 'text', key: 'common.ok' });
      await gp.page.evaluate(() => window.__harness!.assetMode('fallback'));
      await settle(gp, 600);
      await shoot('home-v2-fallback');
    },
  },
  {
    id: 'home-manual',
    shots: ['home-feedback-manual'],
    seed: { won: 4 },
    run: async (gp, shoot) => {
      await waitHome(gp);
      // no clipboard permission: the copy is refused → the read-only, selected text box (TECH §2R.16)
      await gp.page.evaluate(() => {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: () => Promise.reject(new Error('NotAllowedError')) },
        });
      });
      await tap(gp, { kind: 'settings' });
      await settle(gp, 400);
      await tap(gp, { kind: 'text', key: 'settings.feedback' });
      await gp.page.waitForSelector('[role="dialog"] textarea', { timeout: 10_000 });
      await shoot('home-feedback-manual');
      await gp.page.click('[role="dialog"] button');
      await gp.page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 10_000 });
    },
  },
  ...LEVEL_STARTS,
  {
    id: 'tutorial',
    shots: ['tutorial-shown', 'tutorial-hidden'],
    seed: { won: 0 },
    run: async (gp, shoot) => {
      await loadLevel(gp.page, 1);
      await waitInteractive(gp.page, 1, 300_000);
      await waitTutorial(gp, 'shown');
      await settle(gp, 400);
      await shoot('tutorial-shown');
      // K-53 / UX §13.1: a touch on the empty scene fades the step; it stays hidden until the player is idle
      await tap(gp, { kind: 'design', x: 40, y: -40 });
      await waitTutorial(gp, 'hidden');
      await settle(gp, 400);
      await shoot('tutorial-hidden');
    },
  },
  {
    id: 'tutorial-l03',
    shots: ['tutorial-l03-step1'],
    seed: { won: 2 },
    run: async (gp, shoot) => {
      await loadLevel(gp.page, 3);
      await waitInteractive(gp.page, 3, 300_000);
      await waitTutorial(gp, 'shown');
      await settle(gp, 400);
      await shoot('tutorial-l03-step1');
    },
  },
  {
    id: 'tutorial-motion',
    shots: ['tutorial-l01-ghost-motion'],
    seed: { won: 0 },
    reducedMotion: false,
    run: async (gp, shoot) => {
      await loadLevel(gp.page, 1);
      await waitInteractive(gp.page, 1, 300_000);
      await waitTutorial(gp, 'shown');
      await settle(gp, 1200); // the glove and the block ghost on their way (DS-15)
      await shoot('tutorial-l01-ghost-motion');
    },
  },
  {
    id: 'win',
    shots: ['win-v2'],
    seed: { won: 0 },
    run: async (gp, shoot) => {
      await startLevel(gp, 1);
      await playMoves(gp, await golden(gp.page, 1), SHOT_DRAG);
      await waitWindow(gp.page, 'win', 300_000);
      await settle(gp, ART_MS);
      await shoot('win-v2');
    },
  },
  {
    id: 'win-loop',
    shots: ['win-v2-loop'],
    seed: { won: 10 },
    run: async (gp, shoot) => {
      // META §10: after level 10 the button replays 1–10; a replay win pays the base coins only (no star, no tutorial)
      await startLevel(gp, 1);
      await playMoves(gp, await golden(gp.page, 1), SHOT_DRAG);
      await waitWindow(gp.page, 'win', 300_000);
      await settle(gp, ART_MS);
      await shoot('win-v2-loop');
    },
  },
  {
    id: 'hammer',
    shots: ['flow-hammer-pick', 'flow-hammer-hit', 'flow-hammer-after'],
    seed: { won: 7 },
    run: async (gp, shoot, notes) => {
      await startLevel(gp, 8);
      const inv = (await state(gp.page)).boosters;
      notes.push(`level 8 inventory ${JSON.stringify(inv)}`);
      if ((inv['hammer'] ?? 0) !== economy.boosters.hammer.freeTrials)
        throw new Error(`META 4: level 8 should grant ${economy.boosters.hammer.freeTrials} hammers`);
      await tap(gp, { kind: 'slot', id: 'hammer' });
      await settle(gp, 300);
      if ((await pickKind(gp)) !== 'hammer') throw new Error('the hammer pick did not open');
      await shoot('flow-hammer-pick');
      await tap(gp, { kind: 'cancel' }); // DS-13: the × on the slot cancels
      await settle(gp, 300);
      if ((await pickKind(gp)) !== null) throw new Error('the × did not cancel the hammer pick');
      await tap(gp, { kind: 'slot', id: 'hammer' });
      await settle(gp, 300);
      const before = (await status(gp.page)).logLength;
      await tap(gp, { kind: 'piece', pieceId: cargoId(8) });
      await waitLog(gp.page, before, 20_000);
      await settle(gp, 60);
      await shoot('flow-hammer-hit');
      await waitInteractive(gp.page, 8);
      await settle(gp);
      await shoot('flow-hammer-after');
      const left = (await state(gp.page)).boosters['hammer'];
      if (left !== economy.boosters.hammer.freeTrials - 1)
        throw new Error(`UX 5.2 step 3: hammer count ${left}`);
    },
  },
  {
    id: 'no-target',
    shots: ['booster-no-target'],
    seed: { won: 8, boosters: { hammer: 3 }, granted: ['hammer'] },
    run: async (gp, shoot) => {
      // E-61 / K-54: level 9 has nothing to break — grey slot, a tap shakes it and shows booster.hammer.noTarget
      await startLevel(gp, 9);
      await tap(gp, { kind: 'slot', id: 'hammer' });
      await waitText(gp, 'booster.hammer.noTarget');
      await shoot('booster-no-target');
    },
  },
  {
    id: 'crane',
    shots: ['flow-crane-pick', 'flow-crane-spots', 'flow-crane-after'],
    seed: { won: 9, boosters: { hammer: 3 }, granted: ['hammer'] },
    run: async (gp, shoot) => {
      await startLevel(gp, 10);
      await tap(gp, { kind: 'slot', id: 'crane' });
      await settle(gp, 300);
      if ((await pickKind(gp)) !== 'crane') throw new Error('the crane pick did not open');
      await shoot('flow-crane-pick');
      await tap(gp, { kind: 'piece', pieceId: craneId(10) });
      await settle(gp, 300);
      if ((await state(gp.page)).pick.spots === 0) throw new Error('the crane shows no spot');
      await shoot('flow-crane-spots');
      const before = (await status(gp.page)).logLength;
      await tap(gp, { kind: 'spot', index: 0 });
      await waitLog(gp.page, before, 20_000);
      await waitInteractive(gp.page, 10);
      await settle(gp);
      await shoot('flow-crane-after');
    },
  },
  {
    id: 'trowel',
    shots: ['flow-trowel-pick'],
    seed: { won: 4 },
    run: async (gp, shoot) => {
      await startLevel(gp, 5);
      const moves = await golden(gp.page, 5);
      await playMoves(gp, moves.slice(0, movesToTrowel(5, moves)), SHOT_DRAG);
      await waitInteractive(gp.page, 5, 300_000);
      await settle(gp, 800);
      await tap(gp, { kind: 'trowel' });
      await settle(gp, 400);
      if ((await pickKind(gp)) !== 'trowel') throw new Error('the trowel pick did not open');
      await shoot('flow-trowel-pick');
      await tap(gp, { kind: 'cancel' });
      await settle(gp, 300);
      if ((await pickKind(gp)) !== null) throw new Error('the strip × did not cancel the trowel pick');
    },
  },
  {
    id: 'teardown',
    shots: ['teardown-line', 'teardown-after'],
    seed: { won: 1 },
    run: async (gp, shoot) => {
      const fx = teardownFixture();
      await gp.page.evaluate(([id, data]) => window.__harness!.loadLevelData(id, data), [
        TEARDOWN_LEVEL_ID,
        fx.data,
      ] as const);
      await waitInteractive(gp.page, TEARDOWN_LEVEL_ID, 300_000);
      await playMoves(gp, fx.moves.slice(0, 1), SHOT_DRAG);
      await waitInteractive(gp.page, TEARDOWN_LEVEL_ID);
      const runs = await gp.page.evaluate((c) => window.__harness!.cueCount(c), CUE_TEARDOWN);
      await playMove(gp, fx.moves[1] as DragMove, SHOT_DRAG);
      await gp.page.evaluate(([c, n]) => window.__harness!.waitCue(c, n), [CUE_TEARDOWN, runs] as const);
      await settle(gp, 600); // DS-14: the line is still on screen 600 ms into the Söküm
      await shoot('teardown-line');
      if ((await state(gp.page)).contextTip.showing !== 'teardown')
        throw new Error('tut.ctx.teardown is not shown');
      await waitInteractive(gp.page, TEARDOWN_LEVEL_ID);
      await settle(gp, 300);
      await shoot('teardown-after');
    },
  },
  {
    id: 'level2',
    shots: ['pause', 'exit-m0'],
    seed: { won: 1 },
    run: async (gp, shoot) => {
      await startLevel(gp, 2);
      await exitConfirm(gp, shoot, 'exit-m0', 'pause');
      await waitHome(gp);
    },
  },
  {
    id: 'lose',
    shots: ['lose-1-offer', 'lose-2-life'],
    seed: { won: 1 },
    run: async (gp, shoot) => {
      await startLevel(gp, 2);
      // K-29: spend every move until the out-of-moves window opens (a yard move, else a wrong placement that bounces)
      for (let i = 0; i < MAX_SPEND_MOVES; i++) {
        await gp.page.waitForFunction(
          () => {
            const s = window.__harness!.status();
            return s.interactive || s.window !== null;
          },
          null,
          { timeout: 120_000, polling: 50 },
        );
        if ((await status(gp.page)).window === 'offer') break;
        const move = (await findDrag(gp.page, 'yard')) ?? (await findDrag(gp.page, 'wrong'));
        if (!move) throw new Error('lose-1-offer: no move that spends a move without placing');
        await playMove(gp, move, SHOT_DRAG);
      }
      await waitWindow(gp.page, 'offer');
      await settle(gp, 800);
      await shoot('lose-1-offer');
      await tap(gp, { kind: 'text', key: 'lose.decline' });
      await waitWindow(gp.page, 'loss');
      await settle(gp, 800);
      await shoot('lose-2-life');
    },
  },
  {
    id: 'resume',
    shots: ['resume-strip'],
    seed: { won: 1 },
    run: async (gp, shoot) => {
      await startLevel(gp, 2);
      await playMoves(gp, (await golden(gp.page, 2)).slice(0, 1), SHOT_DRAG);
      await waitInteractive(gp.page);
      // K-43: the attempt was written at the commit; a reload resumes it on the Pause window with the strip (#87)
      await gp.page.reload();
      await waitReady(gp.page);
      await waitWindow(gp.page, 'pause');
      await settle(gp, 800);
      await shoot('resume-strip');
    },
  },
];

// --- runner ---------------------------------------------------------------------------------------------------------------

interface Result {
  readonly profile: string;
  readonly scenario: string;
  readonly shots: string[];
  readonly ms: number;
  readonly error: string | null;
  readonly consoleErrors: readonly string[];
  readonly textIssues: readonly string[];
  readonly notes: readonly string[];
}

function arg(name: string): string | null {
  const i = process.argv.indexOf(name);
  return i >= 0 ? (process.argv[i + 1] ?? null) : null;
}

async function runScenario(
  browser: Browser,
  url: string,
  profile: Profile,
  sc: Scenario,
  cvd: CvdKind | null,
): Promise<Result> {
  const t0 = Date.now();
  const shots: string[] = [];
  const notes: string[] = [];
  const textIssues: string[] = [];
  const outName = cvd ? `${profile.name}-${cvd}` : profile.name;
  const dir = join(OUT, outName);
  mkdirSync(dir, { recursive: true });
  rmSync(join(dir, `_failed-${sc.id}.png`), { force: true });
  let gp: GamePage | null = null;
  try {
    gp = await openGame(browser, {
      url,
      profile,
      reducedMotion: sc.reducedMotion ?? true,
      ...(cvd ? { query: `&cvd=${cvd}` } : {}),
      ...(sc.permissions ? { permissions: sc.permissions } : {}),
    });
    const page = gp.page;
    if (sc.seed) {
      // the meta save of the scenario (prologue seen, levels won, META §4 boosters), then a fresh home screen
      await page.evaluate((seed) => window.__harness!.seedSave(seed), sc.seed);
      await page.evaluate(() => window.__harness!.goHome());
    }
    await sc.run(
      gp,
      async (name) => {
        await page.screenshot({ path: join(dir, `${name}.png`) });
        shots.push(name);
        // DS-01 / DS-20: no raw i18n key and no debug label on screen (the Phaser texts), and no debug panel in
        // the DOM (it is a `import.meta.env.DEV` import; the harness build is a build, so it must be absent)
        for (const text of await page.evaluate(() => window.__harness!.texts())) {
          const line = text.trim();
          if (RAW_KEY.test(line) || line.startsWith(DEBUG_LABEL)) textIssues.push(`${name}: "${line}"`);
        }
        if (await page.evaluate((id) => document.getElementById(id) !== null, DEBUG_ROOT_ID))
          textIssues.push(`${name}: debug panel #${DEBUG_ROOT_ID} in the DOM (DS-20)`);
      },
      notes,
    );
    return {
      profile: outName,
      scenario: sc.id,
      shots,
      ms: Date.now() - t0,
      error: null,
      consoleErrors: gp.errors,
      textIssues,
      notes,
    };
  } catch (e) {
    const error = e instanceof Error ? (e.message.split('\n')[0] ?? String(e)) : String(e);
    if (gp) await gp.page.screenshot({ path: join(dir, `_failed-${sc.id}.png`) }).catch(() => undefined);
    return {
      profile: outName,
      scenario: sc.id,
      shots,
      ms: Date.now() - t0,
      error,
      consoleErrors: gp?.errors ?? [],
      textIssues,
      notes,
    };
  } finally {
    await gp?.close();
  }
}

/** The TECH §2R.13 cell gate: level 1 on 360 × 800 (from its scenario's note). */
function cellGate(results: readonly Result[]): string | null {
  const r = results.find((x) => x.profile === '360x800' && x.scenario === 'level1');
  const note = r?.notes.find((n) => n.startsWith('level-01 cell'));
  const css = note ? Number(/= ([\d.]+) CSS px/.exec(note)?.[1]) : null;
  if (css === null) return null;
  return css >= GATE_CELL_CSS ? null : `360x800 level 1 cell ${css} CSS px < ${GATE_CELL_CSS}`;
}

async function main(): Promise<number> {
  const profileName = arg('--profile');
  const only = arg('--only')?.split(',') ?? null;
  const profiles = [...PROFILES, ...SHORT_PROFILES].filter((p) => !profileName || p.name === profileName);
  if (profiles.length === 0) throw new Error(`unknown profile ${profileName}`);
  const wanted = (s: Scenario): boolean => !only || s.shots.some((n) => only.some((o) => n.startsWith(o)));
  const scenariosOf = (p: Profile): readonly Scenario[] =>
    SHORT_PROFILES.includes(p) ? SHORT_STARTS.filter(wanted) : SCENARIOS.filter(wanted);
  const cvdArg = arg('--cvd');
  const cvds: (CvdKind | null)[] =
    cvdArg === null ? [null] : cvdArg === 'all' ? [...CVD_KINDS] : cvdArg.split(',').filter(isCvdKind);
  if (cvdArg !== null && cvds.length === 0)
    throw new Error(`unknown --cvd ${cvdArg} (${CVD_KINDS.join(', ')}, all)`);
  // a full run of a profile replaces its folder (stale shots of an older set never stay next to the new ones)
  if (!only)
    for (const p of profiles)
      for (const cvd of cvds)
        rmSync(join(OUT, cvd ? `${p.name}-${cvd}` : p.name), { recursive: true, force: true });
  const server = await startHarnessServer();
  const browser = await launchBrowser();
  const results: Result[] = [];
  try {
    for (const cvd of cvds) {
      for (const profile of profiles) {
        for (const sc of scenariosOf(profile)) {
          const r = await runScenario(browser, server.url, profile, sc, cvd);
          results.push(r);
          const bad = r.error !== null || r.consoleErrors.length > 0 || r.textIssues.length > 0;
          process.stdout.write(
            `${bad ? 'FAIL' : 'ok  '} ${r.profile.padEnd(8)} ${sc.id.padEnd(15)} ${(r.ms / 1000).toFixed(1).padStart(6)} s  ${r.shots.join(', ')}${r.error ? `  — ${r.error}` : ''}\n`,
          );
          for (const c of r.consoleErrors) process.stdout.write(`     console error: ${c}\n`);
          for (const t of r.textIssues) process.stdout.write(`     raw text on screen: ${t}\n`);
          for (const n of r.notes) process.stdout.write(`     ${n}\n`);
        }
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  const shots = results.reduce((n, r) => n + r.shots.length, 0);
  const failed = results.filter(
    (r) => r.error !== null || r.consoleErrors.length > 0 || r.textIssues.length > 0,
  );
  const cell = cellGate(results);
  if (cell) process.stdout.write(`FAIL cell gate: ${cell}\n`);
  process.stdout.write(
    `screens: ${shots} shots in ${OUT}/<profile>/, ${failed.length} scenario(s) with errors\n`,
  );
  return failed.length === 0 && cell === null ? 0 : 1;
}

process.exitCode = await main();
