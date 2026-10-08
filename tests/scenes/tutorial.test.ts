/**
 * Faz 2R light tutorial (docs/GDD.md K-53, §14.1; TECH_DESIGN §2R.9; UX_FLOWS §13.1–§13.2): `TutorialController`
 * (which step is active, when it ends), `TutorialPresence` (what it shows, fake clock), the contextual lines and their
 * queue rule, the bubble dock, the glove's play condition (DL-2R-20) and the K-43 resume of the tutorial position.
 *
 * Levels: the LEVELS §2 drafts of Bölüm 1–10 in the Faz 2R format (tests/level/fixtures/levels-2r; product-lead writes
 * the real levels/*.json in WP-M). Their canonical solutions (LEVELS §2 "Kanonik çözüm", `letter from→to` anchors) are
 * copied below for the levels these tests walk.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pieceBoardCells } from '../../src/core/grid.ts';
import { loadLevel } from '../../src/core/level/compile.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import { validateLevelJson } from '../../src/core/level/logic.ts';
import type { LevelInput } from '../../src/core/level/schema.ts';
import { ArraySink, applyMove } from '../../src/core/moves.ts';
import { tryBeginDrag } from '../../src/core/movement.ts';
import { levelHooks } from '../../src/core/obstacles/registry.ts';
import { GameSession } from '../../src/core/session.ts';
import { cloneState } from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import type { DragNode, GameEvent, Move, PieceId, SessionAction } from '../../src/core/types.ts';
import { createLayout, designHeight, rectsOverlap } from '../../src/theme/layout.ts';
import type { Layout } from '../../src/theme/layout.ts';
import { TOKENS } from '../../src/theme/tokens.ts';
import {
  CTX_TOPICS,
  ContextTips,
  TEARDOWN_LINE_MS,
  ctxFromMove,
} from '../../src/scenes/level/tutorial/contextTips.ts';
import type { CtxGate, CtxTopic } from '../../src/scenes/level/tutorial/contextTips.ts';
import {
  CORNER_RADIUS_PX,
  fingerPoints,
  glovePlays,
  pathAt,
  roundedPath,
  trailDots,
} from '../../src/scenes/level/tutorial/glove.ts';
import {
  bottomDockValid,
  dockHardAreas,
  dockRect,
  highlightAll,
  highlightRects,
  padRect,
  placeBubble,
} from '../../src/scenes/level/tutorial/highlights.ts';
import {
  TutorialController,
  TutorialResume,
  createTutorial,
  highlightedPieces,
} from '../../src/scenes/level/tutorial/TutorialController.ts';
import type {
  SavedTutorialPosition,
  TutorialHost,
} from '../../src/scenes/level/tutorial/TutorialController.ts';
import {
  PRESENCE_TIMINGS,
  presenceLook,
  presenceReport,
  presenceStart,
  presenceStep,
} from '../../src/scenes/level/tutorial/TutorialPresence.ts';
import type { PresenceInputKind, PresenceState } from '../../src/scenes/level/tutorial/TutorialPresence.ts';
import { moveMatches } from '../../src/scenes/level/tutorial/tutorialEvents.ts';
import { loadBoosterUnlock } from '../../tools/lib/levels.ts';
import { loadFixture } from '../fixtures/builders.ts';

const ROOT = join(import.meta.dirname, '..', '..');
const T = TOKENS.tutorial;

// --- levels ----------------------------------------------------------------------------------------------------------

const draftJson = (n: number): LevelInput =>
  loadFixture('levels-2r', `level_${String(n).padStart(3, '0')}`) as LevelInput;

function draft(n: number, tutorial?: unknown): CompiledLevel {
  const json = tutorial === undefined ? draftJson(n) : { ...draftJson(n), tutorial };
  const res = loadLevel(json);
  if (!res.ok) throw new Error(`draft ${n}: ${JSON.stringify(res.issues)}`);
  return res.level;
}

/** LEVELS §2 canonical solutions (`letter from→to`, block anchors; `k<p>_<i>` = a batch block). */
const CANONICAL: Readonly<Record<number, readonly string[]>> = {
  1: ['b 1,2→5,0', 'a 0,2→4,0', 'c 0,1→4,2', 'd 2,1→4,3', 'e 0,0→4,4'],
  2: ['a 2,2→4,0', 'b 0,0→4,2', 'c 0,2→4,3'],
  3: ['c 0,2→1,2', 'a 0,0→4,0', 'b 1,0→5,0', 'c 1,2→4,2', 'd 2,0→4,4'],
  6: ['c 0,3→2,3', 'b 0,2→2,2', 'a 0,0→4,0', 'b 2,2→4,2', 'c 2,3→4,3', 'd 2,0→4,5', 'e 2,1→4,6'],
  7: [
    'b 1,3→2,2',
    'd 0,2→2,4',
    'a 0,0→4,0',
    'b 2,2→4,2',
    'c 3,2→5,2',
    'd 2,4→4,4',
    'k1_1 0,0→2,4',
    'e 2,0→4,0',
    'k1_0 2,2→5,2',
    'k1_2 3,2→4,2',
    'k1_1 2,4→4,4',
  ],
};

/** The block of a canonical letter (`a` = `piece:0`, `k1_1` = `piece:k1_1`). */
function pieceOf(lvl: CompiledLevel, letter: string): PieceId {
  const ref = /^k\d_\d+$/.test(letter) ? `piece:${letter}` : `piece:${letter.charCodeAt(0) - 97}`;
  const id = lvl.tutorialPieceIds.get(ref);
  if (id === undefined) throw new Error(`no ${ref}`);
  return id;
}

/** Anchor (min x, min y of its board cells) of a block. */
function anchorOf(s: GameState, id: PieceId): [number, number] | null {
  const cells = pieceBoardCells(s, id);
  if (cells.length === 0) return null;
  return [Math.min(...cells.map((c) => c.x)), Math.min(...cells.map((c) => c.y))];
}

/** The drag move that brings block `id` to anchor (tx, ty): a release node of R whose result rests there. */
function moveTo(s: GameState, lvl: CompiledLevel, id: PieceId, tx: number, ty: number): Move {
  const hooks = levelHooks(lvl);
  const a = tryBeginDrag(s, id, hooks.drag ?? {});
  if (!a.ok) throw new Error(`block ${id} cannot be held: ${a.reason}`);
  const nodes = a.session
    .reachableNodes()
    .filter((n) => n.ix === tx)
    .sort((p, q) => Number(q.iy === ty) - Number(p.iy === ty) || p.mode - q.mode || q.iy - p.iy);
  for (const node of nodes) {
    const move: Move = { kind: 'drag', pieceId: id, to: node };
    const copy = cloneState(s);
    const res = applyMove(copy, move, undefined, { hooks });
    const at = anchorOf(copy, id);
    if (res.status === 'applied' && at && at[0] === tx && at[1] === ty) return move;
  }
  throw new Error(`no release brings block ${id} to (${tx},${ty})`);
}

function canonical(lvl: CompiledLevel, game: GameSession, spec: string): Move {
  const m = /^(\S+) (\d+),(\d+)→(\d+),(\d+)$/.exec(spec);
  if (!m) throw new Error(spec);
  return moveTo(game.state, lvl, pieceOf(lvl, m[1] as string), Number(m[4]), Number(m[5]));
}

// --- a run: session + controller driven like LevelScene ----------------------------------------------------------------

interface Run {
  readonly lvl: CompiledLevel;
  readonly game: GameSession;
  readonly tut: TutorialController;
  readonly ended: number[];
  readonly marked: string[];
  now: number;
  /** Lift + drag signals (from the move's result) + commit + move end after the cues. */
  play(move: Move): GameEvent[];
  step(): number | null;
}

function run(lvl: CompiledLevel, host: Partial<TutorialHost> = {}): Run {
  const game = GameSession.start(lvl, {}, { hooks: levelHooks(lvl) });
  const ended: number[] = [];
  const marked: string[] = [];
  const tut = new TutorialController(lvl, {
    state: () => game.state,
    markContextTip: (t) => marked.push(t),
    stepEnded: (step) => ended.push(step),
    ...host,
  });
  const r: Run = {
    lvl,
    game,
    tut,
    ended,
    marked,
    now: 0,
    play(move) {
      r.now += 100;
      if (move.kind === 'drag') {
        tut.dragStarted(move.pieceId);
        if (move.to.mode !== 0) tut.dragSignal('gapPass', r.now);
        else if (move.to.ix >= lvl.geo.siteX) tut.dragSignal('overWall', r.now);
      }
      const sink = new ArraySink();
      const res = game.commit(move, sink);
      expect(res.status).toBe('applied');
      r.now += 1000;
      tut.moveEnded(sink.events, r.now);
      return sink.events;
    },
    step: () => tut.current?.data.step ?? null,
  };
  tut.start(0);
  return r;
}

/** Plays canonical moves `from` … `to − 1` of level `n`. */
function playCanonical(r: Run, n: number, from = 0, to = Infinity): void {
  (CANONICAL[n] ?? []).slice(from, to).forEach((spec) => r.play(canonical(r.lvl, r.game, spec)));
}

const layoutFor = (lvl: CompiledLevel, width: number, height: number): Layout =>
  createLayout(TOKENS, designHeight('expand', { width, height }, TOKENS), lvl.geo);
const FIT = (lvl: CompiledLevel): Layout => createLayout(TOKENS, 1920, lvl.geo);

const DRAFTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// --- controller ----------------------------------------------------------------------------------------------------------

describe('K-53 TutorialController on the Faz 2R drafts (GDD 14.1)', () => {
  it('K-53 step done ignores other piece: level 3 step 1 (`piece:2` = c) — d moved in the yard keeps it, c to (1,2) ends it', () => {
    const lvl = draft(3);
    const r = run(lvl);
    expect(r.step()).toBe(1);
    expect(r.tut.current?.data.done).toEqual({ event: 'yardMove', count: 1, piece: 'piece:2' });
    // GDD K-53 example: d (D2_90 Y at (2,0)) slides to (2,1) — a yardMove, but the `piece` filter does not hold
    const d = pieceOf(lvl, 'd');
    const ev = r.play(moveTo(r.game.state, lvl, d, 2, 1));
    expect(moveMatches({ event: 'yardMove' }, ev, r.game.state)).toBe(true);
    expect(moveMatches({ event: 'yardMove', piece: 'piece:2' }, ev, r.game.state)).toBe(false);
    expect([r.step(), r.ended]).toEqual([1, []]);
    // c (O4_0 at (0,2)) to (1,2): the step ends, step 2 (`tut.m.free`) starts
    r.play(moveTo(r.game.state, lvl, pieceOf(lvl, 'c'), 1, 2));
    expect(r.ended).toEqual([1]);
    expect(r.tut.current?.data.textKey).toBe('tut.m.free');
  });

  it('GDD 14.1 level 3 along the canonical solution: dig → free, each step ends on its event, none is left at the win', () => {
    const r = run(draft(3));
    const steps: (number | null)[] = [r.step()];
    for (const spec of CANONICAL[3] ?? []) {
      r.play(canonical(r.lvl, r.game, spec));
      steps.push(r.step());
    }
    expect(r.game.outcome).toBe('won');
    expect(steps).toEqual([1, 2, null, null, null, null]);
    expect(r.ended).toEqual([1, 2]);
    expect(r.tut.finished).toBe(true);
  });

  it('GDD 14.1/3 count only counts events after the step started: level 1 step 2 needs its own correct placement', () => {
    const r = run(draft(1));
    expect(r.step()).toBe(1);
    playCanonical(r, 1, 0, 1); // b ✓: step 1 (placementCorrect ×1) ends, step 2 (placementCorrect ×1) starts at 0
    expect([r.step(), r.tut.position()]).toEqual([2, { index: 1, shown: true, count: 0 }]);
    playCanonical(r, 1, 1, 2);
    expect(r.ended).toEqual([1, 2]);
  });

  it('GDD 14.1/3 done.at counts only at its anchor: level 6 step 1 (yardMove at (2,3)) — a park elsewhere keeps it', () => {
    const lvl = draft(6);
    const r = run(lvl);
    const c = pieceOf(lvl, 'c');
    const a = tryBeginDrag(r.game.state, c, levelHooks(lvl).drag ?? {});
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    const other = a.session
      .reachableNodes()
      .find((n) => a.session.classify(n).kind === 'yard' && !(n.ix === 2 && n.iy === 3));
    expect(other).toBeDefined();
    r.play({ kind: 'drag', pieceId: c, to: other as DragNode });
    expect([r.step(), r.ended]).toEqual([1, []]);
  });

  it('GDD 14.1/5 startOn waits for its event: level 7 step 2 starts at the first segmentDone, then ends on a correct placement', () => {
    const r = run(draft(7));
    const trace: string[] = [];
    const where = (): string =>
      r.tut.finished ? 'finished' : r.tut.current ? `active:${r.step()}` : r.tut.waiting ? 'waiting' : 'idle';
    trace.push(where());
    for (const spec of CANONICAL[7] ?? []) {
      const ev = r.play(canonical(r.lvl, r.game, spec));
      trace.push(`${where()}${ev.some((e) => e.t === 'segmentCompleted') ? '+seg' : ''}`);
    }
    expect(r.game.outcome).toBe('won');
    const firstWait = trace.indexOf('waiting');
    const segAt = trace.findIndex((t) => t.endsWith('+seg'));
    expect(firstWait).toBeGreaterThan(0); // step 1 ended on the first ✓
    expect(trace.slice(firstWait, segAt).every((t) => t === 'waiting')).toBe(true);
    expect(trace[segAt]).toBe('active:2+seg');
    expect(r.ended).toEqual([1, 2]);
  });

  it('GDD 14.1/5 a startOn that never comes hides that step and every later one', () => {
    const lvl = draft(1, [
      { step: 1, highlight: ['goals'], textKey: 'tut.m.useall', done: { event: 'placementCorrect' } },
      {
        step: 2,
        highlight: ['goals'],
        textKey: 'tut.m.lift',
        startOn: { event: 'segmentDone', count: 2 },
        done: { event: 'placementCorrect' },
      },
    ]);
    const r = run(lvl);
    playCanonical(r, 1);
    expect(r.game.outcome).toBe('won');
    expect([r.ended, r.tut.waiting?.step ?? null]).toEqual([[1], 2]);
    r.tut.stop();
    expect(r.tut.finished).toBe(true);
  });

  it('GDD 14.1/3 overWall counts at the first crossing even when the drag is then cancelled (level 6 step 2)', () => {
    const r = run(draft(6));
    r.tut.restore({ index: 1, shown: true, count: 0 }, 0);
    expect(r.step()).toBe(2);
    r.tut.dragStarted(0);
    r.tut.dragSignal('overWall', 10); // the block crossed the wall line, then the drag was cancelled
    expect(r.ended).toEqual([2]);
    expect(r.tut.finished).toBe(true);
  });

  it('GDD 14.1/3 holdOverBuild needs minMs held in one drag; a move-end event counts once per move', () => {
    const lvl = draft(2, [
      {
        step: 1,
        highlight: ['build'],
        textKey: 'tut.m.shadow',
        done: { event: 'holdOverBuild', count: 1, minMs: 500 },
      },
      {
        step: 2,
        highlight: ['build'],
        textKey: 'tut.m.pattern',
        done: { event: 'placementCorrect', count: 2 },
      },
    ]);
    const r = run(lvl);
    expect(r.tut.holdMinMs()).toBe(500);
    r.tut.dragStarted(0);
    r.tut.dragSignal('holdOverBuild', 10, 499);
    expect(r.step()).toBe(1);
    r.tut.dragSignal('holdOverBuild', 20, 500);
    expect([r.step(), r.tut.holdMinMs()]).toEqual([2, null]);
    // one move with a correct placement counts 1 of 2 (and hides the presence through `progressed`)
    const progressed: number[] = [];
    const r2 = run(lvl, { progressed: (st) => progressed.push(st) });
    r2.tut.restore({ index: 1, shown: true, count: 0 }, 0);
    playCanonical(r2, 2, 0, 1);
    expect([r2.step(), r2.tut.position()?.count, progressed]).toEqual([2, 1, [2]]);
    playCanonical(r2, 2, 1, 2);
    expect(r2.ended).toEqual([2]);
  });

  it('GDD 14.1/2 a tut.ctx step marks seenContextTips the moment it starts', () => {
    const lvl = draft(1, [
      { step: 1, highlight: ['front'], textKey: 'tut.ctx.support', done: { event: 'placementCorrect' } },
    ]);
    const r = run(lvl);
    expect(r.marked).toEqual(['support']);
  });

  it('UX 13.1 piece highlights resolve through CompiledLevel.tutorialPieceIds (batch blocks k<p>_<i> too)', () => {
    const lvl = draft(5);
    const step2 = lvl.data.tutorial?.[1];
    expect(step2?.highlight[0]).toBe('piece:k1_0');
    const ids = highlightedPieces(lvl, step2?.highlight ?? []);
    expect(ids.length).toBe(5);
    expect(new Set(ids).size).toBe(5);
  });

  it('K-53 tutorial never blocks input: no pick gate, no input blocker, a legacy "required" step plays as soft', () => {
    // the controller has no gate and the drag host has no tutorial hook (K-53/2)
    const r = run(draft(3));
    expect('allowsPick' in r.tut).toBe(false);
    const drag = readFileSync(join(ROOT, 'src/scenes/level/DragController.ts'), 'utf8');
    expect(drag).not.toMatch(/mayPick|allowsPick|tutorial\//);
    // the view takes no touch: no zone, nothing interactive (UX 13.1 "Hiçbiri dokunuş almaz")
    const view = readFileSync(join(ROOT, 'src/scenes/level/TutorialView.ts'), 'utf8');
    expect(view).not.toMatch(/\.setInteractive\(|\.zone\(/);
    // the Faz 2 spotlight, blocker and guarantee modules are gone
    for (const gone of ['TutorialOverlay.ts', 'spotPieces.ts', 'tutorial/guarantee.ts'])
      expect(() => readFileSync(join(ROOT, 'src/scenes/level', gone)), gone).toThrow();
    // old data with mode "required" (the validator calls it tut_blocking) is played as a soft step: any block moves
    const legacy = draft(3, [
      { ...draftJson(3).tutorial?.[0], mode: 'required' },
      draftJson(3).tutorial?.[1],
    ]);
    const l = run(legacy);
    l.play(moveTo(l.game.state, legacy, pieceOf(legacy, 'd'), 2, 1)); // a block the step does not highlight
    expect(l.step()).toBe(1);
  });

  it('K-53 no tutorial on replay: a level the save marks won gets no controller (K-53/6), an unwon one does', () => {
    const lvl = draft(1);
    const host: TutorialHost = { state: () => null, markContextTip: () => {}, stepEnded: () => {} };
    expect(createTutorial(lvl, host, { won: true })).toBeNull();
    expect(createTutorial(lvl, host, { won: false })).toBeInstanceOf(TutorialController);
    expect(createTutorial(draft(1, []), host, { won: false })).toBeNull();
    // the scene reads the save's `progress.levels[id].won`
    const scene = readFileSync(join(ROOT, 'src/scenes/level/LevelScene.ts'), 'utf8');
    expect(scene).toMatch(/progress\.levels\[String\(lvl\.data\.id\)\]\?\.won === true/);
  });

  it('K-53 at most two steps: a third step is tut_too_many_steps, mode "required" is tut_blocking; every draft has ≤ 2 soft steps', () => {
    const base = draftJson(1);
    const steps = base.tutorial ?? [];
    const codes = (json: unknown): string[] =>
      validateLevelJson(json, { fileId: 1, boosterUnlock: loadBoosterUnlock() ?? undefined }).issues.map(
        (i) => i.code,
      );
    expect(codes({ ...base, tutorial: [...steps, { ...steps[1], step: 3 }] })).toContain(
      'tut_too_many_steps',
    );
    expect(codes({ ...base, tutorial: [{ ...steps[0], mode: 'required' }, steps[1]] })).toContain(
      'tut_blocking',
    );
    for (const n of DRAFTS) {
      const t = draftJson(n).tutorial ?? [];
      expect(t.length, `level ${n}`).toBeLessThanOrEqual(T.maxStepsPerLevel);
      for (const st of t) expect(st.mode ?? 'soft').toBe('soft');
    }
  });
});

// --- presence -----------------------------------------------------------------------------------------------------------

/** Feeds inputs in order (each `[t, kind]`), returns every state. */
function feed(s: PresenceState, inputs: readonly (readonly [number, PresenceInputKind])[]): PresenceState[] {
  const out: PresenceState[] = [];
  let cur = s;
  for (const [t, kind] of inputs) {
    cur = presenceStep(cur, { t, kind });
    out.push(cur);
  }
  return out;
}
const last = (xs: readonly PresenceState[]): PresenceState => xs[xs.length - 1] as PresenceState;

describe('K-53 TutorialPresence (UX 13.1 "Zamanlama", tokens.tutorial, fake clock)', () => {
  it('K-53 presence hides after visibleMs and reshows after idleReshowMs', () => {
    expect([T.startDelayMs, T.visibleMs, T.idleReshowMs]).toEqual([600, 4000, 4000]);
    let p = presenceStart(0, T.startDelayMs);
    expect(p.phase).toBe('wait');
    p = last(feed(p, [[599, 'tick']]));
    expect(p.phase).toBe('wait');
    p = last(feed(p, [[600, 'tick']]));
    expect([p.phase, p.shows, p.firstShownAt]).toEqual(['shown', 1, 600]);
    expect(presenceLook(p)).toEqual({ highlight: true, bubble: true, faded: false, glove: true });
    p = last(feed(p, [[600 + T.visibleMs - 1, 'tick']]));
    expect(p.phase).toBe('shown');
    p = last(feed(p, [[600 + T.visibleMs, 'tick']]));
    expect(p.phase).toBe('hidden');
    expect(presenceLook(p)).toEqual({ highlight: false, bubble: false, faded: false, glove: false });
    const hiddenAt = 600 + T.visibleMs;
    p = last(feed(p, [[hiddenAt + T.idleReshowMs - 1, 'tick']]));
    expect(p.phase).toBe('hidden');
    p = last(feed(p, [[hiddenAt + T.idleReshowMs, 'tick']]));
    expect([p.phase, p.shows]).toEqual(['shown', 2]);
  });

  it('UX 13.1 a touch drops the glove and fades the bubble; its lift hides the step; every touch restarts the idle count', () => {
    let p = last(feed(presenceStart(0, 600), [[600, 'tick']]));
    p = last(feed(p, [[1000, 'touchDown']]));
    expect(presenceLook(p)).toEqual({ highlight: true, bubble: true, faded: true, glove: false });
    p = last(feed(p, [[5000, 'tick']])); // visibleMs passed while held: it stays until the lift
    expect(p.phase).toBe('shown');
    p = last(feed(p, [[5200, 'touchUp']]));
    expect(p.phase).toBe('hidden');
    p = last(
      feed(p, [
        [8000, 'touchDown'],
        [8100, 'touchUp'],
        [8100 + T.idleReshowMs - 1, 'tick'],
      ]),
    );
    expect(p.phase).toBe('hidden'); // the touch at 8000 restarted the count
    p = last(feed(p, [[8100 + T.idleReshowMs, 'tick']]));
    expect(p.phase).toBe('shown');
    // a counted event of the step that does not end it (count > 1) hides it too (K-53/3 "doğru eylemden sonra")
    expect(last(feed(p, [[20_000, 'correctAction']])).phase).toBe('hidden');
  });

  it('K-53 hidden tutorial step still completes on done event (and hiding never ends it)', () => {
    const lvl = draft(3);
    let p = last(
      feed(presenceStart(0, 600), [
        [600, 'tick'],
        [600 + T.visibleMs, 'tick'],
      ]),
    );
    const r = run(lvl, {
      stepEnded: (step, now) => {
        r.ended.push(step);
        p = presenceStep(p, { t: now, kind: 'stepDone' });
      },
    });
    expect([p.phase, r.step()]).toEqual(['hidden', 1]);
    // hidden for a long time: the step is still active (K-53/3: only `done` ends it)
    p = last(feed(p, [[60_000, 'touchDown']]));
    expect(r.step()).toBe(1);
    r.play(moveTo(r.game.state, lvl, pieceOf(lvl, 'c'), 1, 2));
    expect(r.ended).toEqual([1]);
    expect(p.phase).toBe('done');
    expect(presenceLook(p).bubble).toBe(false);
  });

  it('UX 13.1 after reshowsWithBubble re-shows the bubble stays away; the glove and the highlight still come back', () => {
    expect(T.reshowsWithBubble).toBe(3);
    let p = presenceStart(0, 0);
    let t = 0;
    const shows: boolean[] = [];
    for (let k = 0; k < 6; k++) {
      p = presenceStep(p, { t, kind: 'tick' });
      expect(p.phase).toBe('shown');
      shows.push(presenceLook(p).bubble);
      expect(presenceLook(p).glove).toBe(true);
      t += T.visibleMs;
      p = presenceStep(p, { t, kind: 'tick' }); // hidden
      t += T.idleReshowMs;
    }
    expect(shows).toEqual([true, true, true, true, false, false]);
    expect(p.shows).toBe(6);
  });

  it('UX 13.1 a window stops the timers (nothing on screen) and the step goes on from where it was', () => {
    let p = last(feed(presenceStart(0, 600), [[600, 'tick']]));
    p = last(
      feed(p, [
        [1600, 'windowOpen'],
        [50_000, 'tick'],
      ]),
    );
    expect([p.phase, presenceLook(p).bubble]).toEqual(['shown', false]);
    p = last(
      feed(p, [
        [51_000, 'windowClose'],
        [51_000 + T.visibleMs - 1001, 'tick'],
      ]),
    );
    expect(p.phase).toBe('shown'); // 1000 ms of its 4000 had run before the window
    p = last(feed(p, [[51_000 + T.visibleMs - 1000, 'tick']]));
    expect(p.phase).toBe('hidden');
    // nested pauses (a window over a Söküm line): only the last close resumes
    p = last(
      feed(p, [
        [60_000, 'windowOpen'],
        [60_100, 'windowOpen'],
        [60_200, 'windowClose'],
        [99_000, 'tick'],
      ]),
    );
    expect(p.phase).toBe('hidden');
    p = last(feed(p, [[99_000, 'windowClose']]));
    expect(p.pauses).toBe(0);
  });

  it('ANALYTICS tutorial_step: shows (≥ 1) and msToDone from the first show to done', () => {
    let p = last(
      feed(presenceStart(1000, 600), [
        [1600, 'tick'],
        [5600, 'tick'],
        [9600, 'tick'],
        [9800, 'stepDone'],
      ]),
    );
    expect(presenceReport(p, 9800)).toEqual({ shows: 2, msToDone: 8200 });
    // done before the first show: one show, 0 ms (the step ended while it waited)
    p = last(feed(presenceStart(0, 600), [[300, 'stepDone']]));
    expect(presenceReport(p, 300)).toEqual({ shows: 1, msToDone: 0 });
    expect(PRESENCE_TIMINGS.visibleMs).toBe(T.visibleMs);
  });
});

// --- contextual lines -------------------------------------------------------------------------------------------------

const FREE_GATE: CtxGate = { stepActive: false, blocked: false };
const STEP_GATE: CtxGate = { stepActive: true, blocked: false };

function tipHost(seen0: readonly CtxTopic[] = []): { seen: Set<CtxTopic>; tips: ContextTips } {
  const seen = new Set<CtxTopic>(seen0);
  return { seen, tips: new ContextTips({ seen: (t) => seen.has(t), markSeen: (t) => void seen.add(t) }) };
}

describe('K-53/4 contextual lines tut.ctx.* (UX 13.1, 13.2; GDD 14.1/2, K-34 hook 4)', () => {
  const ev = (body: Record<string, unknown>, step = 3): GameEvent =>
    ({ seq: 0, step, ...body }) as unknown as GameEvent;

  it('K-53 teardown line skips the queue: it shows at once during an active step, on every Söküm, for 1,2 s, never marked seen', () => {
    const { seen, tips } = tipHost();
    tips.trigger('support', 3);
    tips.update(0, STEP_GATE, T.visibleMs);
    expect([tips.showing, tips.queued]).toEqual([null, ['support']]); // a step is active: support waits
    tips.teardown(100, ['pid:2']);
    expect([tips.showing, tips.highlight]).toEqual(['teardown', ['pid:2']]);
    tips.update(100 + TEARDOWN_LINE_MS - 1, STEP_GATE, T.visibleMs);
    expect(tips.showing).toBe('teardown');
    tips.update(100 + TEARDOWN_LINE_MS, STEP_GATE, T.visibleMs);
    expect([tips.showing, tips.queued]).toEqual([null, ['support']]); // the waiting line still waits
    expect(seen.has('teardown')).toBe(false);
    tips.teardown(5000); // the next Söküm shows it again
    expect(tips.showing).toBe('teardown');
    tips.trigger('teardown'); // never queued through the normal path
    expect(tips.queued).toEqual(['support']);
    expect(TEARDOWN_LINE_MS).toBe(1200);
    // the scene pauses the active step's presence while a line has the bubble (K-53/4 "Gizli'ye geçer, sonra sürer")
    const scene = readFileSync(join(ROOT, 'src/scenes/level/LevelScene.ts'), 'utf8');
    expect(scene).toMatch(
      /const pause = step !== null && \(this\.windows\.open !== null \|\| this\.tips\.showing !== null\);/,
    );
    expect(scene).toMatch(/this\.tips\.teardown\(\s*this\.animNow,/);
  });

  it('K-53/4 a line during an active step waits and shows nextStepDelayMs after the step ends; at most one waits', () => {
    const { seen, tips } = tipHost();
    tips.trigger('support', 3);
    tips.trigger('bounce.color', 3); // a second one replaces the waiting one (unmarked)
    expect(tips.queued).toEqual(['bounce.color']);
    tips.update(0, STEP_GATE, T.visibleMs);
    expect(tips.showing).toBeNull();
    tips.stepEnded(1000, T.nextStepDelayMs); // the step ended; the next step is active at once
    tips.update(1000 + T.nextStepDelayMs - 1, STEP_GATE, T.visibleMs);
    expect(tips.showing).toBeNull();
    tips.update(1000 + T.nextStepDelayMs, STEP_GATE, T.visibleMs);
    expect(tips.showing).toBe('bounce.color');
    expect([seen.has('bounce.color'), seen.has('support')]).toEqual([true, false]);
    // the next line waits again while the (next) step is active
    tips.trigger('lastmoves', 5);
    tips.update(1400 + T.visibleMs, STEP_GATE, T.visibleMs);
    expect([tips.showing, tips.queued]).toEqual([null, ['lastmoves']]);
    tips.update(1400 + T.visibleMs + 10, FREE_GATE, T.visibleMs);
    expect(tips.showing).toBe('lastmoves');
    // no new bubble over a window or mid-drag
    const b = tipHost();
    b.tips.trigger('queue', 1);
    b.tips.update(0, { stepActive: false, blocked: true }, T.visibleMs);
    expect(b.tips.showing).toBeNull();
  });

  it('K-53/4 one move with several lines: the first one in display priority waits (triggerFirst)', () => {
    const { tips } = tipHost(['streak']);
    tips.triggerFirst(['streak', 'goldtrowel', 'lastmoves'], 4, () => []);
    expect(tips.queued).toEqual(['goldtrowel']);
  });

  it('K-34 the first support bounce triggers tut.ctx.support; colour / window / off-plan bounces their own line', () => {
    expect(
      ctxFromMove(
        [ev({ t: 'pieceBounced', pieceId: 1, reason: 'support', missingSupport: [], viaDrop: true })],
        9,
        3,
        5,
      ),
    ).toEqual(['support']);
    expect(
      ctxFromMove(
        [ev({ t: 'placementWrong', pieceId: 1, reasons: ['window', 'color'], missingSupport: [] })],
        9,
        3,
        5,
      ),
    ).toEqual(['bounce.window']);
    expect(
      ctxFromMove(
        [ev({ t: 'placementWrong', pieceId: 1, reasons: ['outside'], missingSupport: [] })],
        9,
        3,
        5,
      ),
    ).toEqual(['bounce.offplan']);
  });

  it('UX 13.2 streak 3/4, golden trowel, last moves, the truck queue; K-30 D1 truck help lines (R2-05: no material line)', () => {
    const topics = ctxFromMove(
      [
        ev({ t: 'comboChanged', combo: 3 }),
        ev({ t: 'trowelEarned', trowels: 1 }),
        ev({ t: 'movesChanged', movesLeft: 5, delta: -1, reason: 'move' }, 4),
        ev({ t: 'deliveryQueued', queued: 2 }, 9),
      ],
      6,
      3,
      5,
    );
    expect(topics).toEqual(['streak', 'goldtrowel', 'lastmoves', 'queue']);
    expect(ctxFromMove([ev({ t: 'truckHelp', kind: 'unchain' }, 12)], 9, 3, 5)).toEqual(['truckhelp.free']);
    expect(ctxFromMove([ev({ t: 'truckHelp', kind: 'reshuffle', moves: [] }, 12)], 9, 3, 5)).toEqual([
      'reshuffle',
    ]);
    expect(CTX_TOPICS).not.toContain('truckhelp.material');
    expect(CTX_TOPICS).toContain('teardown');
  });

  it('GDD 14.1/2 a line shows once per account, one at a time, 4 s (tutorial.visibleMs)', () => {
    const { seen, tips } = tipHost(['queue']);
    tips.trigger('queue');
    tips.trigger('support');
    tips.update(10, FREE_GATE, T.visibleMs);
    expect(tips.showing).toBe('support');
    expect(seen.has('support')).toBe(true);
    tips.trigger('support'); // on screen: nothing more
    tips.trigger('lastmoves');
    tips.update(10 + T.visibleMs - 1, FREE_GATE, T.visibleMs);
    expect(tips.showing).toBe('support');
    tips.update(10 + T.visibleMs, FREE_GATE, T.visibleMs);
    expect(tips.showing).toBe('lastmoves');
  });

  it('UX 13.2 a waiting line whose trigger no longer holds is dropped unmarked; the next occurrence brings it back', () => {
    const { seen, tips } = tipHost();
    let serialNow = 3;
    const valid = (_t: CtxTopic, serial: number): boolean => serial === serialNow;
    tips.trigger('support', 3);
    tips.update(0, STEP_GATE, T.visibleMs, valid);
    serialNow = 4; // another move was committed after the bounce
    tips.update(10, FREE_GATE, T.visibleMs, valid);
    expect([tips.showing, tips.queued, seen.size]).toEqual([null, [], 0]);
    tips.trigger('support', 4);
    tips.update(20, FREE_GATE, T.visibleMs, valid);
    expect(tips.showing).toBe('support');
  });

  it('UX 13.2 opening the trowel pick closes and marks tut.ctx.goldtrowel (on screen or waiting)', () => {
    const a = tipHost();
    a.tips.trigger('goldtrowel', 4, ['streak', 'front']);
    a.tips.update(0, FREE_GATE, T.visibleMs);
    expect(a.tips.showing).toBe('goldtrowel');
    a.tips.retire('goldtrowel');
    expect([a.tips.showing, a.tips.highlight, a.seen.has('goldtrowel')]).toEqual([null, [], true]);
    const b = tipHost();
    b.tips.trigger('goldtrowel', 4);
    b.tips.retire('goldtrowel');
    expect([b.tips.queued, b.seen.has('goldtrowel')]).toEqual([[], true]);
  });
});

// --- highlights, dock, glove --------------------------------------------------------------------------------------------

/** UX §13.1: a 6-word line at 44 px is 2 lines = 150 px; portrait 128 + 12 + tail 24 + box ≤ 640. */
const BUBBLE = { w: T.portraitPx + T.portraitGapPx + TOKENS.kit.bubble.tailPx + T.bubbleMaxW, h: 150 };

describe('UX 13.1 highlights, the Usta Dede bubble dock and the glove (K-53, DL-2R-20)', () => {
  it('UX 13.1 Kabul: on 1080×1920 and 390×844 every step bubble of the drafts 1–10 is clear (0 px) of the yard and site cells, the status strip and the HUD', () => {
    const problems: string[] = [];
    let checked = 0;
    for (const n of DRAFTS) {
      const lvl = draft(n);
      const s = GameSession.start(lvl).state;
      for (const layout of [FIT(lvl), layoutFor(lvl, 390, 844)]) {
        for (const st of lvl.data.tutorial ?? []) {
          const lit = highlightAll(st.highlight, {
            layout,
            state: s,
            level: lvl,
            hud: { truck: null, streak: null },
          });
          const place = placeBubble(
            { layout, w: BUBBLE.w, h: BUBBLE.h, ids: st.highlight, lit, handBox: null },
            TOKENS.layout.marginPx,
            T.dockGapPx,
          );
          checked += 1;
          for (const area of [layout.board.yard, layout.board.site, layout.board.status])
            if (rectsOverlap(place.rect, area))
              problems.push(`L${n} step ${st.step} H ${layout.H}: ${place.dock}`);
          if (place.rect.y < layout.top.groupBottomY) problems.push(`L${n} step ${st.step}: over the HUD`);
        }
      }
    }
    expect(checked).toBe(38);
    expect(problems).toEqual([]);
  });

  it('UX 13.1 docks: top = groupBottomY + 16 (280) at x 24; the bottom dock exists only when it ends 16 px over the bottom group (none at FIT)', () => {
    const lvl = draft(1);
    const fit = FIT(lvl);
    expect(dockRect(fit, 'top', 100, 150, TOKENS.layout.marginPx, T.dockGapPx)).toEqual({
      x: 24,
      y: 280,
      w: 100,
      h: 150,
    });
    expect(bottomDockValid(fit, 150, T.dockGapPx)).toBe(false);
    const phone = layoutFor(lvl, 390, 844);
    expect(bottomDockValid(phone, 150, T.dockGapPx)).toBe(true);
    const bottom = dockRect(phone, 'bottom', 100, 150, TOKENS.layout.marginPx, T.dockGapPx);
    expect(bottom.y).toBe(phone.board.status.y + phone.board.status.h + 16);
    // the top dock is taken when it is free; a highlight under it sends the bubble to the bottom dock (soft condition)
    const q = { layout: phone, w: BUBBLE.w, h: BUBBLE.h, ids: ['crane'], handBox: null };
    expect(placeBubble({ ...q, lit: [] }, 24, 16).dock).toBe('top');
    const top = dockRect(phone, 'top', BUBBLE.w, BUBBLE.h, 24, 16);
    expect(placeBubble({ ...q, lit: [top] }, 24, 16).dock).toBe('bottom');
    // FIT has no bottom dock: the top one even then
    expect(
      placeBubble({ ...q, layout: fit, lit: [dockRect(fit, 'top', BUBBLE.w, BUBBLE.h, 24, 16)] }, 24, 16)
        .dock,
    ).toBe('top');
    // hard areas: yard, site, status strip, HUD
    expect(dockHardAreas(phone)).toHaveLength(4);
  });

  it('UX 13.1 a HUD highlight (panorama, goals, blocks, moves) takes the top dock and the tail points up', () => {
    const lvl = draft(1);
    const layout = layoutFor(lvl, 390, 844);
    for (const id of ['panorama', 'goals', 'blocks', 'moves']) {
      const p = placeBubble({ layout, w: BUBBLE.w, h: BUBBLE.h, ids: [id], lit: [], handBox: null }, 24, 16);
      expect([p.dock, p.tailUp], id).toEqual(['top', true]);
    }
    expect(placeBubble({ layout, w: 10, h: 10, ids: ['crane'], lit: [], handBox: null }, 24, 16).tailUp).toBe(
      false,
    );
  });

  it('UX 13.1 highlight ids: `blocks` = the blocks-left chip, `booster:<id>` = its slot, `truck` skipped while the chip is hidden', () => {
    const lvl = draft(8);
    const s = GameSession.start(lvl).state;
    const layout = FIT(lvl);
    const chip = { x: 10, y: 20, w: 30, h: 40 };
    const slot = { x: 100, y: 1700, w: 176, h: 176 };
    const hud = {
      truck: null,
      streak: null,
      blocks: chip,
      booster: (id: string) => (id === 'hammer' ? slot : null),
    };
    expect(highlightRects('blocks', { layout, state: s, level: lvl, hud })).toEqual([chip]);
    expect(highlightRects('booster:hammer', { layout, state: s, level: lvl, hud })).toEqual([slot]);
    expect(highlightRects('booster:brush', { layout, state: s, level: lvl, hud })).toEqual([]);
    expect(highlightRects('truck', { layout, state: s, level: lvl, hud })).toEqual([]);
    expect(highlightRects('goals', { layout, state: s, level: lvl, hud })).toEqual([layout.top.goals]);
    expect(padRect(chip, 4)).toEqual({ x: 6, y: 16, w: 38, h: 48 });
  });

  it('UX 13.1 DL-2R-20 the glove plays only when path[0] holds a highlighted block that can be held and the path stays in R without a cancel', () => {
    const lvl = draft(3);
    const hooks = levelHooks(lvl);
    const r = run(lvl);
    const step = r.tut.current;
    if (!step) throw new Error('step 1');
    expect(glovePlays(r.game.state, step.data, step.pieces, hooks.drag)).toBe(true);
    // the player moved c elsewhere first: path[0] (0,3) no longer holds it → no glove (highlight and bubble stay)
    const moved = cloneState(r.game.state);
    applyMove(moved, moveTo(moved, lvl, pieceOf(lvl, 'c'), 2, 2), undefined, { hooks });
    expect(glovePlays(moved, step.data, step.pieces, hooks.drag)).toBe(false);
    // a path leaving R, or ending in a cancel, plays no glove
    const outside = {
      ...step.data,
      hand: {
        kind: 'drag' as const,
        path: [
          [0, 3],
          [0, 0],
        ] as [number, number][],
      },
    };
    expect(glovePlays(r.game.state, outside, step.pieces, hooks.drag)).toBe(false);
    const diagonal = {
      ...step.data,
      hand: {
        kind: 'drag' as const,
        path: [
          [0, 3],
          [1, 2],
        ] as [number, number][],
      },
    };
    expect(glovePlays(r.game.state, diagonal, step.pieces, hooks.drag)).toBe(false);
    // no hand: no glove; a tap glove needs only its target
    expect(glovePlays(r.game.state, { ...step.data, hand: undefined }, step.pieces)).toBe(false);
    expect(glovePlays(r.game.state, { ...step.data, hand: { kind: 'tap' } }, [])).toBe(true);
    // every drag / hold glove of the drafts plays where its step starts on the canonical solution (level 1, 2, 3, 6)
    for (const n of [1, 2, 3, 6]) {
      const lv = draft(n);
      const rr = run(lv);
      const seen = new Set<number>();
      const check = (): void => {
        const c = rr.tut.current;
        if (!c || seen.has(c.index) || !c.data.hand || c.data.hand.kind === 'tap') return;
        seen.add(c.index);
        expect(
          glovePlays(rr.game.state, c.data, c.pieces, levelHooks(lv).drag),
          `L${n} step ${c.data.step}`,
        ).toBe(true);
      };
      check();
      for (const spec of CANONICAL[n] ?? []) {
        rr.play(canonical(lv, rr.game, spec));
        check();
      }
      expect(seen.size, `level ${n}`).toBeGreaterThan(0);
    }
  });

  it('UX 13.1 the fingertip path: path[0] at the touched cell centre, later points drag.fingerOffsetCells rows lower; 24 px rounded corners; 22 px trail dots', () => {
    const lvl = draft(1);
    const layout = FIT(lvl);
    const path = (lvl.data.tutorial?.[0]?.hand?.path ?? []) as [number, number][];
    expect(path).toEqual([
      [0, 3],
      [0, 5],
      [4, 5],
    ]);
    const pts = fingerPoints(layout, path);
    const c0 = layout.grid.cellRect(0, 3);
    expect(pts[0]).toEqual({ x: c0.x + c0.w / 2, y: c0.y + c0.h / 2 });
    const c1 = layout.grid.cellRect(0, 5);
    expect(pts[1]?.y).toBeCloseTo(c1.y + c1.h / 2 + TOKENS.drag.fingerOffsetCells * layout.grid.cellPx, 6);
    const round = roundedPath(pts);
    expect(round[0]).toEqual(pts[0]);
    expect(round[round.length - 1]).toEqual(pts[2]);
    // the corner is cut: no rounded point is the sharp corner, every arc point is within the radius of it
    const corner = pts[1] as { x: number; y: number };
    const arc = round.slice(1, -1);
    expect(arc.length).toBeGreaterThan(2);
    for (const p of arc) {
      expect(Math.hypot(p.x - corner.x, p.y - corner.y)).toBeLessThanOrEqual(
        CORNER_RADIUS_PX * Math.SQRT2 + 1e-6,
      );
      expect(p.x === corner.x && p.y === corner.y).toBe(false);
    }
    expect(pathAt(round, 0)).toEqual(pts[0]);
    const dots = trailDots(round);
    for (let i = 1; i < dots.length; i++) {
      const a = dots[i - 1] as { x: number; y: number };
      const b = dots[i] as { x: number; y: number };
      expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThanOrEqual(T.trailGapPx + 1e-6);
    }
  });
});

// --- K-43 resume -------------------------------------------------------------------------------------------------------

/**
 * LevelScene's tutorial bookkeeping on a fake save: the position is saved whenever it changes with the log entries
 * whose move end it includes; a commit logs the action at once, its move end reaches the controller after the cues.
 */
class SceneTut {
  readonly lvl: CompiledLevel;
  readonly tut: TutorialController;
  readonly sent: number[] = [];
  saved: SavedTutorialPosition | null = null;
  private readonly live: GameSession;
  private replaying: GameSession | null = null;
  private tail = false;
  private tutActions = 0;
  private pending = 0;
  now = 0;

  private constructor(
    lvl: CompiledLevel,
    log: readonly SessionAction[] | null,
    saved: SavedTutorialPosition | null,
  ) {
    this.lvl = lvl;
    const hooks = levelHooks(lvl);
    this.tut = new TutorialController(lvl, {
      state: () => (this.replaying ?? this.live).state,
      markContextTip: () => {},
      stepEnded: (step) => {
        if (this.replaying === null || this.tail) this.sent.push(step);
      },
    });
    if (log === null) {
      this.live = GameSession.start(lvl, {}, { hooks });
      this.tut.start(0);
      this.tutActions = this.live.log.length;
    } else {
      this.saved = saved;
      const resume = new TutorialResume(this.tut, saved, log.length);
      const sink = new ArraySink();
      let mark = 0;
      this.live = GameSession.replay(lvl, log, { hooks }, sink, (index, action, at) => {
        this.replaying = at;
        this.tail = resume.isTail(index);
        const events = sink.events.slice(mark);
        mark = sink.events.length;
        resume.action(index, action, events, this.now);
      });
      this.replaying = null;
      this.tail = false;
      this.tutActions = log.length;
    }
    this.save();
  }

  static fresh(lvl: CompiledLevel): SceneTut {
    return new SceneTut(lvl, null, null);
  }

  resume(): SceneTut {
    return new SceneTut(this.lvl, this.live.log, this.saved);
  }

  /** A resume from an old save without the tutorial position (the log replay rebuilds it). */
  resumeFromLog(): SceneTut {
    return new SceneTut(this.lvl, this.live.log, null);
  }

  get game(): GameSession {
    return this.live;
  }

  private save(): void {
    if (this.live.outcome !== 'playing') return;
    const pos = this.tut.position();
    if (pos) this.saved = { ...pos, actions: this.tutActions };
  }

  commit(move: Move): GameEvent[] {
    if (move.kind === 'drag') this.tut.dragStarted(move.pieceId);
    const sink = new ArraySink();
    expect(this.live.commit(move, sink).status).toBe('applied');
    this.pending = this.live.log.length;
    return sink.events;
  }

  planEnded(events: readonly GameEvent[]): void {
    this.tut.moveEnded(events, (this.now += 1000));
    this.tutActions = Math.max(this.tutActions, this.pending);
    this.save();
  }

  play(move: Move): void {
    this.planEnded(this.commit(move));
  }

  view(): { at: string; pos: unknown } {
    const c = this.tut.current;
    const w = this.tut.waiting;
    const at = this.tut.finished
      ? 'finished'
      : c
        ? `active:${c.data.step}`
        : w
          ? `waiting:${w.step}`
          : 'idle';
    return { at, pos: this.tut.position() };
  }
}

describe('K-43 resume of the tutorial (K-53/5: inLevel.tutorial unchanged)', () => {
  it('K-43 resume keeps the tutorial step: levels 1, 3 and 7 at every point of the canonical solution, from the saved position and from the log', () => {
    for (const n of [1, 3, 7]) {
      const lvl = draft(n);
      const specs = CANONICAL[n] ?? [];
      for (let k = 0; k < specs.length; k++) {
        const s = SceneTut.fresh(lvl);
        for (const spec of specs.slice(0, k)) s.play(canonical(lvl, s.game, spec));
        const back = s.resume();
        expect(back.view(), `L${n} after ${k} (saved position)`).toEqual(s.view());
        expect(s.resumeFromLog().view(), `L${n} after ${k} (log only)`).toEqual(s.view());
      }
    }
  });

  it('K-43 ANALYTICS tutorial_step: a step the killed run ended while its cues played is sent once on resume (level 3 c)', () => {
    const lvl = draft(3);
    const whole = SceneTut.fresh(lvl);
    for (const spec of CANONICAL[3] ?? []) whole.play(canonical(lvl, whole.game, spec));
    expect(whole.game.outcome).toBe('won');
    expect(whole.sent).toEqual([1, 2]);

    const [first, ...rest] = CANONICAL[3] ?? [];
    const killed = SceneTut.fresh(lvl);
    killed.commit(canonical(lvl, killed.game, first as string)); // c to (1,2) is logged; the app dies in its cues
    expect(killed.saved).toEqual({ index: 0, shown: true, count: 0, actions: 1 });
    const back = killed.resume();
    expect(back.view().at).toBe('active:2'); // c's move end was read on resume …
    for (const spec of rest) back.play(canonical(lvl, back.game, spec));
    expect(back.game.outcome).toBe('won');
    expect([...killed.sent, ...back.sent]).toEqual(whole.sent); // … and its tutorial_step 1 went out once
  });
});
