/**
 * L-35 `tut_hand_invalid` (docs/GDD.md §14 "`hand.path` anlamı", K-45 item 10, K-53; docs/TECH_DESIGN.md §2R.3,
 * §2R.5 "Öğretici eldiven denetimi"; DL-2R-01). For every `drag` / `hold` hand of a tutorial step:
 *
 * 1. the step's start state is found by playing the canonical solution: step 1 starts at the level start; a step with
 *    `startOn` starts after the first canonical move (after the previous step ended) that produces the `startOn` event;
 *    otherwise a step starts where the previous one ended (its `done`, `count` times, counted from its start). A step
 *    that never starts on the canonical solution is not checked (a note says so).
 * 2. `path[0]` is a cell of a highlighted `piece:` / `debris:` block, and that block is holdable (K-09);
 * 3. consecutive points share a row or a column, and the anchor (point − grip offset) of every integer point between
 *    them is in the block's reachable set R (K-08). The walk follows the drag graph (a unit step to a neighbour node with
 *    that anchor, same mode first), so a horizontal step into a gap enters the rail as the finger would;
 * 4. the last point is a release of K-07 row 2, 6 or 7 (never a cancel); `hold` ends over the site columns (row 6/7);
 * 5. `drag`: the release is the first move of a shortest solution from the step's start state, i.e. its next state s'
 *    has `dist(s') = dist(s) − c`.
 *
 * Move-end `done` / `startOn` events are matched on the events of each canonical move (core `applyMove` with an
 * `ArraySink`), GDD §14.1/3 vocabulary with the `piece`, `at`, `hidden`, `painted`, `flag`, `wind`, `type` filters; a move
 * counts at most once. Drag signals are read from the move itself: `overWall` and `holdOverBuild` = a FREE site
 * release, `gapPass` = a rail placement. `tap` and `boosterUsed` never happen in the solver's drag-only solution.
 */
import { ArraySink, applyMove } from '../../src/core/moves.ts';
import type { GameEvent, Move } from '../../src/core/types.ts';
import { FLAG_BIT, H, pieceFlags } from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import { pieceBoardCells } from '../../src/core/grid.ts';
import { tryBeginDrag } from '../../src/core/movement.ts';
import type { DragSession } from '../../src/core/movement.ts';
import type { DragNode } from '../../src/core/types.ts';
import { hashState } from '../../src/core/hash.ts';
import type { TutCondition } from '../../src/core/level/schema.ts';
import type { LevelData } from '../../src/core/level/schema.ts';
import type { Graph } from './explore.ts';
import { stateAt } from './explore.ts';
import { normalizeState, SOLVER_MOVES } from './expand.ts';
import { INF } from './distance.ts';
import type { CanonicalStep, SolveIssue } from './metrics.ts';

export interface TutorialCheck {
  readonly issues: SolveIssue[];
  readonly notes: string[];
}

interface MoveRecord {
  readonly step: CanonicalStep;
  readonly events: readonly GameEvent[];
  readonly after: GameState;
}

/** Plays the canonical solution on the explored states and keeps every move's events (step 12 off, as the solver). */
function playCanonical(
  g: Graph,
  steps: readonly CanonicalStep[],
  pathStates: readonly number[],
): MoveRecord[] {
  const out: MoveRecord[] = [];
  for (let k = 0; k < steps.length; k++) {
    const st = steps[k];
    const from = pathStates[k];
    if (!st || from === undefined) break;
    const s = stateAt(g, from);
    const sink = new ArraySink();
    const move: Move = {
      kind: 'drag',
      pieceId: st.pieceId,
      to: st.node,
      ...(st.via !== undefined ? { via: st.via } : {}),
    };
    applyMove(s, move, sink, { hooks: g.hooks, noTruckHelp: true, strict: true });
    out.push({ step: st, events: sink.events, after: s });
  }
  return out;
}

const atMatches = (at: readonly [number, number] | undefined, x: number, y: number): boolean =>
  at === undefined || (at[0] === x && at[1] === y);

function anchorOf(cells: readonly { readonly x: number; readonly y: number }[]): [number, number] {
  let x = Infinity;
  let y = Infinity;
  for (const c of cells) {
    x = Math.min(x, c.x);
    y = Math.min(y, c.y);
  }
  return [x, y];
}

/** GDD §14.1/3: one canonical move matches the condition (filters included). */
export function conditionMatches(
  g: Graph,
  cond: TutCondition,
  rec: { readonly step: CanonicalStep; readonly events: readonly GameEvent[]; readonly after: GameState },
): boolean {
  const { events, step, after } = rec;
  const piece = 'piece' in cond ? cond.piece : undefined;
  const flag = 'flag' in cond ? cond.flag : undefined;
  const pieceOk = (id: number): boolean => piece === undefined || g.lvl.tutorialPieceIds.get(piece) === id;
  const flagOk = (id: number): boolean =>
    flag === undefined || (pieceFlags(after, id) & FLAG_BIT[flag]) !== 0;
  switch (cond.event) {
    case 'overWall':
    case 'holdOverBuild':
      return step.node.mode === 0 && step.node.ix >= g.lvl.geo.siteX;
    case 'gapPass':
      return step.kind === 'rail';
    case 'turnEnd':
      return events.some((e) => e.t === 'movesChanged' && e.reason === 'move');
    case 'placementCorrect': {
      const hit = events.find((e) => e.t === 'placementCorrect' && e.step === 3);
      if (!hit || hit.t !== 'placementCorrect' || !pieceOk(hit.pieceId)) return false;
      const a = anchorOf(hit.cells);
      if (!atMatches(cond.at, a[0], a[1])) return false;
      if (cond.hidden === true)
        return events.some((e) => e.t === 'cellsRevealed' && e.step === 3 && e.cells.length > 0);
      return true;
    }
    case 'yardMove': {
      const hit = events.find((e) => e.t === 'pieceMoved' && e.step === 1 && e.to.zone === 'yard');
      if (!hit || hit.t !== 'pieceMoved' || !pieceOk(hit.pieceId)) return false;
      if (!atMatches(cond.at, hit.to.x, hit.to.y)) return false;
      if (cond.painted === true) return events.some((e) => e.t === 'piecePainted' && e.step === 1);
      return true;
    }
    case 'landed': {
      if (events.some((e) => e.t === 'glassBroke')) return false;
      const hit = events.find(
        (e) =>
          e.step === 2 &&
          ((e.t === 'pieceFell' && e.cause === 'release') || (e.t === 'balloonRose' && e.to.zone === 'site')),
      );
      if (!hit || (hit.t !== 'pieceFell' && hit.t !== 'balloonRose') || !flagOk(hit.pieceId)) return false;
      if (cond.wind === true) return events.some((e) => e.t === 'windDrift' && e.pieceId === hit.pieceId);
      return true;
    }
    case 'steered':
      return events.some((e) => e.t === 'steered' && e.step === 2);
    case 'obstacleHit':
      return events.some((e) => {
        if (e.step !== 5 && e.step !== 6) return false;
        if (cond.type === 'crate') return e.t === 'crateDamaged' || e.t === 'crateBroken';
        if (cond.type === 'cement_bag') return e.t === 'bagTorn';
        return e.t === 'chainReleased';
      });
    case 'itemCollected':
      return events.some(
        (e) =>
          (e.step === 5 || e.step === 6) &&
          (cond.type === 'screw' ? e.t === 'screwCollected' : e.t === 'keyCollected'),
      );
    case 'yardFall':
      return events.some((e) => e.t === 'pieceFell' && e.cause === 'yardGravity' && e.step === 6);
    case 'segmentDone':
      return events.some((e) => e.t === 'segmentCompleted' && e.step === 8);
    case 'deliveryDone':
      return events.some(
        (e) => e.t === 'pieceFell' && e.cause === 'delivery' && e.step === 9 && flagOk(e.pieceId),
      );
    case 'carouselTurn':
      return events.some((e) => e.t === 'carouselRotated');
    case 'boosterUsed':
    case 'tap':
      return false;
  }
}

/** First move index ≥ `from` after which `cond` has happened `count` times; −1 when never. */
function findEnd(g: Graph, cond: TutCondition, moves: readonly MoveRecord[], from: number): number {
  const need = cond.count ?? 1;
  let seen = 0;
  for (let j = from; j < moves.length; j++) {
    const rec = moves[j];
    if (rec && conditionMatches(g, cond, rec)) {
      seen++;
      if (seen >= need) return j;
    }
  }
  return -1;
}

/** L-35 on every `drag` / `hold` hand of the level's tutorial. */
export function checkTutorialHands(
  g: Graph,
  level: LevelData,
  steps: readonly CanonicalStep[],
  pathStates: readonly number[],
  dist: Int32Array,
): TutorialCheck {
  const issues: SolveIssue[] = [];
  const notes: string[] = [];
  const tutorial = level.tutorial ?? [];
  if (tutorial.length === 0) return { issues, notes };
  const moves = playCanonical(g, steps, pathStates);
  // position = number of canonical moves made when the step starts (state pathStates[position])
  let position: number | null = 0;
  tutorial.forEach((step, k) => {
    const done = step.done;
    let start: number | null = position;
    if (start !== null && step.startOn) {
      const j = findEnd(g, step.startOn, moves, start);
      start = j < 0 ? null : j + 1;
    }
    if (step.hand && (step.hand.kind === 'drag' || step.hand.kind === 'hold') && step.hand.path) {
      if (start === null)
        notes.push(`tutorial[${k}]: the step never starts on the canonical solution; hand path not checked`);
      else issues.push(...checkHand(g, level, k, start, pathStates, dist));
    }
    if (start === null || !('event' in done)) position = null;
    else {
      const j = findEnd(g, done, moves, start);
      position = j < 0 ? null : j + 1;
    }
  });
  return { issues, notes };
}

function checkHand(
  g: Graph,
  level: LevelData,
  k: number,
  position: number,
  pathStates: readonly number[],
  dist: Int32Array,
): SolveIssue[] {
  const step = level.tutorial?.[k];
  const hand = step?.hand;
  const path = hand?.path ?? [];
  const sIdx = pathStates[position];
  const bad = (where: string, message: string): SolveIssue[] => [
    {
      code: 'tut_hand_invalid',
      rule: 'K-45/10',
      check: 'L-35',
      severity: 'error',
      path: `tutorial[${k}].hand.path${where}`,
      message: `${message} (step starts after canonical move ${position})`,
    },
  ];
  if (!step || !hand || sIdx === undefined || path.length === 0) return [];
  const s = stateAt(g, sIdx);
  const p0 = path[0] ?? [0, 0];
  // (2) path[0] is a cell of a highlighted block, which is holdable
  let pieceId = -1;
  for (const h of step.highlight) {
    if (!h.startsWith('piece:') && !h.startsWith('debris:')) continue;
    const id = g.lvl.tutorialPieceIds.get(h);
    if (id === undefined) continue;
    if (pieceBoardCells(s, id).some((c) => c.x === p0[0] && c.y === p0[1])) {
      pieceId = id;
      break;
    }
  }
  if (pieceId < 0) return bad('[0]', `(${p0[0]},${p0[1]}) is not a cell of a highlighted block`);
  const attempt = tryBeginDrag(s, pieceId, g.hooks.drag);
  if (!attempt.ok) return bad('[0]', `the highlighted block cannot be held now (K-09: ${attempt.reason})`);
  const session = attempt.session;
  const ox = p0[0] - session.start.ix;
  const oy = p0[1] - session.start.iy;
  // (3) straight segments through R, walking the drag graph
  let node: DragNode = session.start;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] ?? [0, 0];
    const b = path[i] ?? [0, 0];
    if (a[0] !== b[0] && a[1] !== b[1])
      return bad(`[${i}]`, `(${a[0]},${a[1]}) → (${b[0]},${b[1]}) is not on one row or column`);
    const dx = Math.sign(b[0] - a[0]);
    const dy = Math.sign(b[1] - a[1]);
    let px = a[0];
    let py = a[1];
    while (px !== b[0] || py !== b[1]) {
      px += dx;
      py += dy;
      const ax = px - ox;
      const ay = py - oy;
      const next = stepTo(session, node, ax, ay);
      if (!next)
        return bad(`[${i}]`, `point (${px},${py}) needs anchor (${ax},${ay}), which is outside R (K-08)`);
      node = next;
    }
  }
  // (4) the release is not a cancel
  const drop = session.classify(node);
  if (drop.kind === 'cancel')
    return bad(`[${path.length - 1}]`, `the last position cancels (K-07 row ${drop.row}, ${drop.reason})`);
  if (hand.kind === 'hold') {
    if (drop.kind === 'yard')
      return bad(`[${path.length - 1}]`, 'a hold ends over the site columns (the shadow shows, K-18)');
    return [];
  }
  // (5) drag: first move of a shortest solution from this state
  const after = stateAt(g, sIdx);
  const res = applyMove(after, { kind: 'drag', pieceId, to: node }, undefined, {
    hooks: g.hooks,
    noTruckHelp: true,
  });
  const cost = SOLVER_MOVES - (after.buf[H.movesLeft] ?? 0);
  normalizeState(after);
  const h = hashState(after);
  const t = g.space.find(h[0] ?? 0, h[1] ?? 0);
  const ds = dist[sIdx] ?? INF;
  const dt = t < 0 ? INF : (dist[t] ?? INF);
  if (res.status !== 'applied' || t < 0 || t === sIdx || dt + cost !== ds)
    return bad(
      `[${path.length - 1}]`,
      `the release (${node.ix},${node.iy}${node.mode ? ` rail ${node.mode - 1}` : ''}) is not the first move of a shortest solution (distance ${ds} → ${dt >= INF ? 'dead' : dt} + ${cost})`,
    );
  return [];
}

/** A unit step of the drag graph to anchor (ax, ay): same mode first, then FREE, then a rail; else any R node there. */
function stepTo(session: DragSession, node: DragNode, ax: number, ay: number): DragNode | null {
  const near = session.neighbours(node).filter((n) => n.ix === ax && n.iy === ay);
  const same = near.find((n) => n.mode === node.mode);
  if (same) return same;
  const free = near.find((n) => n.mode === 0);
  if (free) return free;
  if (near[0]) return near[0];
  const modes = session.reachableNodes().filter((n) => n.ix === ax && n.iy === ay);
  return modes.find((n) => n.mode === 0) ?? modes[0] ?? null;
}
