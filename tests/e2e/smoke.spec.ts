/**
 * Scene smoke test (docs/TECH_DESIGN.md §12.4 "Sahne duman testi", §2R.11; GDD K-28, K-30, K-43, K-53, K-54; META §4)
 * on the harness build, with the Faz 2R levels (levels/level_001…010.json), through the real input path: CDP touch
 * gestures → Phaser input → DragController → core. Run with `npx playwright test -c tests/e2e/playwright.config.ts`.
 *
 * - load: the first launch boots into the 3-panel intro;
 * - level 1 played by its hand golden wins with exactly the golden's action log and moves left;
 * - level 2 reloaded mid-level resumes the same attempt (same log, board hash and ASCII) on the Pause window;
 * - UX §12 exit confirm: "Kal" and × go back to the Pause window (K-43 item 2: no life lost);
 * - a system-cancelled touch (`touchcancel`) commits no move (K-07);
 * - level 1 won → "Devam" → home → "BÖLÜM 2": the level scene is woken, not created again (TECH §10.4);
 * - K-43 + K-53: a reload keeps the tutorial step on screen (level 1 step 2);
 * - UX §13.1: the pause button works during a tutorial step; the drag glove plays with its block ghost (DS-15);
 * - META §4 / K-54 / UX §5.2 (DS-13): level 8 grants the 3 hammer trials, the slot's × and the system back cancel the
 *   pick, a hammer on the Ağır Yük spends one;
 * - UX §13.2: opening the trowel pick closes and marks `tut.ctx.goldtrowel`; the strip's × cancels;
 * - K-30: a dead-end fixture board tears down (`tut.ctx.teardown`) and the level plays on.
 * No console error and no uncaught page error in any of them.
 */
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { trowelsOf } from '../../src/core/combo.ts';
import { loadLevel as compileLevel } from '../../src/core/level/compile.ts';
import { levelHooks } from '../../src/core/obstacles/registry.ts';
import { GameSession } from '../../src/core/session.ts';
import type { DragMove } from '../../src/harness/api.ts';
import {
  attachGame,
  golden,
  loadLevel,
  planDrag,
  playMove,
  playMoves,
  state,
  status,
  tap,
  waitInteractive,
  waitReady,
  waitWindow,
} from '../../tools/lib/harnessClient.ts';

const ROOT = new URL('../../', import.meta.url);
const json = (path: string): Record<string, unknown> =>
  JSON.parse(readFileSync(new URL(path, ROOT), 'utf8')) as Record<string, unknown>;
const levelJson = (n: number) => json(`levels/level_${String(n).padStart(3, '0')}.json`);
const handJson = (n: number) => json(`tests/golden/level_${String(n).padStart(3, '0')}.hand.json`);

function compiled(data: unknown) {
  const r = compileLevel(data);
  if (!r.ok) throw new Error(JSON.stringify(r.issues));
  return r.level;
}

/** The step a resume must give back (K-53/5); its presence (phase, bubble) starts again by design. */
const stepOf = (t: { index: number; pieces: readonly number[]; textKey: string } | null) =>
  t && { index: t.index, pieces: t.pieces, textKey: t.textKey };

async function open(page: Page): Promise<void> {
  await page.goto('/?harness=1&reducedMotion=1');
  await waitReady(page);
}

const gameMs = (page: Page, ms: number) => page.evaluate((t) => window.__harness!.waitGameMs(t), ms);

test.describe('scene smoke (TECH 12.4, Faz 2R)', () => {
  test('load: the first launch boots into the intro without errors', async ({ page, context }) => {
    const gp = await attachGame(page, context);
    await open(page);
    const s = await state(page);
    expect(s.scene).toBe('Intro');
    expect(s.renderer).toBe('webgl');
    expect(gp.errors).toEqual([]);
  });

  test('K-28 level 1: the hand golden played by touch wins with the golden log and moves left', async ({
    page,
    context,
  }) => {
    const gp = await attachGame(page, context);
    await open(page);
    await loadLevel(page, 1);
    await waitInteractive(page, 1);
    const title = (key: string) =>
      page.evaluate((k) => window.__harness!.tapPoint({ kind: 'text', key: k }), key);
    expect(await title('win.title')).toBeNull();
    const moves = await golden(page, 1);
    await playMoves(gp, moves);
    await waitWindow(page, 'win', 120_000);
    expect(await title('win.title')).not.toBeNull();
    const s = await state(page);
    expect(s.outcome).toBe('won');
    expect(s.log.slice(1)).toEqual(moves.map((m) => ({ kind: 'drag', pieceId: m.pieceId, to: m.to })));
    expect(s.movesLeft).toBe(handJson(1)['movesLeft']);
    expect(s.savedAttempt).toBeNull();
    expect(gp.errors).toEqual([]);
  });

  test('K-43 level 2: a reload mid-level resumes the same attempt, then the golden wins', async ({
    page,
    context,
  }) => {
    const gp = await attachGame(page, context);
    await open(page);
    await loadLevel(page, 2);
    const moves = await golden(page, 2);
    await playMoves(gp, moves.slice(0, 2));
    await waitInteractive(page);
    const before = await state(page);
    expect(before.savedAttempt).toMatchObject({ levelId: 2, actions: 3 });
    await page.reload();
    await waitReady(page);
    await waitWindow(page, 'pause', 30_000);
    const after = await state(page);
    expect([after.scene, after.levelId]).toEqual(['Level', 2]);
    expect(after.log).toEqual(before.log);
    expect(after.hash).toBe(before.hash);
    expect(after.ascii).toBe(before.ascii);
    await tap(gp, { kind: 'text', key: 'common.continue' });
    await waitInteractive(page);
    await playMoves(gp, moves.slice(2));
    await waitWindow(page, 'win', 120_000);
    expect((await state(page)).outcome).toBe('won');
    expect(gp.errors).toEqual([]);
  });

  test('UX 12 exit confirm: "Kal" and × return to the Pause window, then the level plays on (no life lost)', async ({
    page,
    context,
  }) => {
    const gp = await attachGame(page, context);
    await open(page);
    await loadLevel(page, 2);
    const moves = await golden(page, 2);
    await playMoves(gp, moves.slice(0, 1));
    await waitInteractive(page);
    const lives = (await state(page)).lives;
    for (const stay of [{ kind: 'text', key: 'exit.stay' } as const, { kind: 'close' } as const]) {
      await tap(gp, { kind: 'pause' });
      await waitWindow(page, 'pause', 30_000);
      await tap(gp, { kind: 'text', key: 'pause.exit' });
      await waitWindow(page, 'exit', 30_000);
      await tap(gp, stay);
      await waitWindow(page, 'pause', 30_000);
      await tap(gp, { kind: 'text', key: 'common.continue' });
      await waitInteractive(page);
    }
    const s = await state(page);
    expect([s.outcome, s.logLength]).toEqual(['playing', 2]);
    expect(s.lives).toEqual(lives);
    expect(gp.errors).toEqual([]);
  });

  test('K-07 a system-cancelled touch (touchcancel) mid-drag commits no move', async ({ page, context }) => {
    const gp = await attachGame(page, context);
    await open(page);
    await loadLevel(page, 2);
    const first = (await golden(page, 2))[0];
    if (!first) throw new Error('level 2 golden is empty');
    await waitInteractive(page);
    const before = await state(page);
    await gp.touch.gesture(await planDrag(page, first), false);
    await gp.cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await waitInteractive(page);
    const after = await status(page);
    expect([after.logLength, after.movesMade]).toEqual([before.logLength, 0]);
    expect((await state(page)).hash).toBe(before.hash);
    await playMoves(gp, [first]);
    expect((await status(page)).logLength).toBe(before.logLength + 1);
    expect(gp.errors).toEqual([]);
  });

  test('TECH 10.4 level 1 won → "Devam" → home → "BÖLÜM 2": the level scene is woken, not created again', async ({
    page,
    context,
  }) => {
    const gp = await attachGame(page, context);
    await open(page);
    await loadLevel(page, 1);
    await playMoves(gp, await golden(page, 1));
    await waitWindow(page, 'win', 120_000);
    const creates = (await state(page)).levelCreates;
    await tap(gp, { kind: 'text', key: 'common.continue' });
    await page.waitForFunction(() => window.__harness!.status().scene === 'Home', null, { timeout: 60_000 });
    await tap(gp, { kind: 'text', key: 'home.play', params: { n: 2 } });
    await waitInteractive(page, 2);
    const s = await state(page);
    expect([s.levelId, s.levelCreates, s.window]).toEqual([2, creates, null]);
    expect(gp.errors).toEqual([]);
  });

  test('K-43 + K-53 a reload keeps the tutorial step on screen (level 1: step 2 after the first correct placement)', async ({
    page,
    context,
  }) => {
    const gp = await attachGame(page, context);
    await open(page);
    await loadLevel(page, 1);
    await waitInteractive(page, 1);
    expect((await state(page)).tutorial).toMatchObject({ index: 0, textKey: 'tut.m.lift' });
    const moves = await golden(page, 1);
    await playMoves(gp, moves.slice(0, 1));
    await waitInteractive(page);
    const before = await state(page);
    expect(before.tutorial).toMatchObject({ index: 1, textKey: 'tut.m.useall' });
    await page.reload();
    await waitReady(page);
    await waitWindow(page, 'pause', 30_000);
    await tap(gp, { kind: 'text', key: 'common.continue' });
    await waitInteractive(page);
    const after = await state(page);
    expect(after.log).toEqual(before.log);
    expect(stepOf(after.tutorial)).toEqual(stepOf(before.tutorial));
    await playMoves(gp, moves.slice(1));
    await waitWindow(page, 'win', 120_000);
    expect(gp.errors).toEqual([]);
  });

  test('UX 13.1 level 1 step 1: the drag glove plays (with its block ghost, DS-15) and the pause button still opens Pause', async ({
    page,
    context,
  }) => {
    const gp = await attachGame(page, context);
    await open(page);
    await loadLevel(page, 1);
    await waitInteractive(page, 1);
    await page.waitForFunction(() => window.__harness!.state().tutorial?.phase === 'shown', null, {
      timeout: 60_000,
    });
    expect((await state(page)).tutorialHand).toEqual({ kind: 'drag', hidden: false });
    await tap(gp, { kind: 'pause' });
    await waitWindow(page, 'pause', 30_000);
    await tap(gp, { kind: 'text', key: 'common.continue' });
    await waitInteractive(page);
    const s = await state(page);
    expect(s.window).toBeNull();
    expect(s.tutorial).toMatchObject({ index: 0 });
    expect(gp.errors).toEqual([]);
  });

  test('META 4 / K-54 / UX 5.2 level 8: 3 hammer trials, the slot × and the system back cancel the pick, a hit spends one', async ({
    page,
    context,
  }) => {
    const gp = await attachGame(page, context);
    await open(page);
    await loadLevel(page, 8);
    await waitInteractive(page, 8);
    expect((await state(page)).boosters).toMatchObject({ hammer: 3 });
    const pick = async () => (await state(page)).pick.kind;
    await tap(gp, { kind: 'slot', id: 'hammer' });
    await gameMs(page, 200);
    expect(await pick()).toBe('hammer');
    await tap(gp, { kind: 'cancel' }); // DS-13: the red × on the selected slot
    await gameMs(page, 200);
    expect(await pick()).toBeNull();
    await tap(gp, { kind: 'slot', id: 'hammer' });
    await gameMs(page, 200);
    expect(await pick()).toBe('hammer');
    await page.evaluate(() => history.back()); // DS-13: the system back (popstate) cancels the pick, no Pause
    await gameMs(page, 300);
    expect([await pick(), (await status(page)).window]).toEqual([null, null]);
    const lvl = compiled(levelJson(8));
    const cargo =
      [...Array(lvl.layout.counts.pieces).keys()].find((i) => lvl.pieces[i]?.cls === 'cargo') ?? -1;
    await tap(gp, { kind: 'slot', id: 'hammer' });
    await gameMs(page, 200);
    const before = (await status(page)).logLength;
    await tap(gp, { kind: 'piece', pieceId: cargo });
    await page.waitForFunction((n) => window.__harness!.status().logLength > n, before, { timeout: 20_000 });
    await waitInteractive(page, 8);
    const s = await state(page);
    expect(s.log.at(-1)).toMatchObject({ kind: 'hammer', target: { pieceId: cargo } });
    expect(s.boosters).toMatchObject({ hammer: 2 }); // UX 5.2 step 3: count − 1, in the same write
    expect(s.savedAttempt?.actions).toBe(s.log.length);
    expect(gp.errors).toEqual([]);
  });

  test('UX 13.2 opening the trowel pick closes and marks tut.ctx.goldtrowel (level 5); the strip × cancels', async ({
    page,
    context,
  }) => {
    const gp = await attachGame(page, context);
    await open(page);
    await loadLevel(page, 5);
    const moves = await golden(page, 5);
    // the golden move that earns the first Golden Trowel (K-33), on the core
    const lvl = compiled(levelJson(5));
    const g = GameSession.start(lvl, { preBoosters: [], streakTier: 0 }, { hooks: levelHooks(lvl) });
    let k = -1;
    for (let i = 0; i < moves.length && k < 0; i++) {
      const m = moves[i] as DragMove;
      g.apply({ kind: 'drag', pieceId: m.pieceId, to: m.to });
      if (trowelsOf(g.state) > 0) k = i;
    }
    expect(k).toBeGreaterThanOrEqual(0);
    await playMoves(gp, moves.slice(0, k + 1));
    await waitInteractive(page, 5);
    const before = (await state(page)).contextTip;
    expect(before.showing === 'goldtrowel' || before.queued.includes('goldtrowel')).toBe(true);
    await tap(gp, { kind: 'trowel' });
    await page.waitForFunction(
      () => window.__harness!.tapPoint({ kind: 'text', key: 'booster.hint.trowel' }) !== null,
      null,
      { timeout: 30_000 },
    );
    await gameMs(page, 100);
    const open1 = (await state(page)).contextTip;
    expect(open1.showing).toBeNull();
    expect(open1.queued).not.toContain('goldtrowel');
    expect(open1.seen).toContain('goldtrowel');
    await tap(gp, { kind: 'cancel' }); // DS-13: the × drawn in place of the strip's trowel icon
    await gameMs(page, 1000);
    const s = await state(page);
    expect(s.pick.kind).toBeNull();
    expect(s.contextTip.showing).not.toBe('goldtrowel');
    expect(gp.errors).toEqual([]);
  });

  test('K-30 a dead-end fixture board tears down: tut.ctx.teardown shows and the level plays on', async ({
    page,
    context,
  }) => {
    const gp = await attachGame(page, context);
    await open(page);
    const d = levelJson(1);
    const build = d['build'] as { segments: { name: unknown }[] };
    const data = {
      ...d,
      id: 90,
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
      tutorial: undefined,
      targets: undefined,
    };
    await page.evaluate((x) => window.__harness!.loadLevelData(90, JSON.parse(x)), JSON.stringify(data));
    await waitInteractive(page, 90);
    const moves: DragMove[] = [
      { pieceId: 0, to: { ix: 4, iy: 0, mode: 0 } },
      { pieceId: 1, to: { ix: 4, iy: 2, mode: 0 } },
    ];
    await playMoves(gp, moves.slice(0, 1));
    await waitInteractive(page, 90);
    await playMove(gp, moves[1] as DragMove);
    await page.waitForFunction(() => window.__harness!.state().contextTip.showing === 'teardown', null, {
      timeout: 30_000,
    });
    await waitInteractive(page, 90);
    const s = await state(page);
    expect(s.outcome).toBe('playing');
    expect(s.movesMade).toBe(1); // the Söküm took back the last move's board, never its move
    expect(gp.errors).toEqual([]);
  });
});
