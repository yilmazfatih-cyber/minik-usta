/**
 * Large-level search (docs/TECH_DESIGN.md §V3.3; LEVELS §8.10 U-v3-2): the best solution found for a level whose state
 * space the full exploration (explore.ts) cannot finish — a 6 × 8 yard with 16–22 blocks, pallets included. Same moves
 * as the exploration (expand.ts, the real core), deterministic (no clock decides a result, only the time limit stops
 * the widening early), and the found solution is replayed on the core before it is reported.
 *
 * Method: beam search by move count with an increasing width (`widths`, default 8, 32, 128, 512, 2048). Every layer
 * expands each beam state with the core move generator; successors are deduplicated by their Zobrist hash over the
 * whole run (a state already reached with the same or a lower cost is dropped) and ranked by
 *   score = 8 · blocks to place − 2 · needed blocks that can be held now − needed blocks,
 * where "needed" = a yard block with a correct spot now (core `neededNow`, K-34 hook 5). Ties keep the generation order
 * (piece id, release node), so the run is a pure function of the level and the options. The first won state of a
 * width is that width's solution; a wider beam may find a cheaper one. The search stops at the first solution whose
 * cost equals the lower bound (`lowerBoundOf`: N, + 1 when the start has no correct placement; then it is optimal)
 * or when the widths, the expansion budget or the time are used up.
 *
 * Proof class: a beam solution is an upper bound of `min`, never a proof of optimality unless it equals the lower
 * bound (`optimal`), and the search proves nothing about dead states (K-51 item 2, D-090): the report marks it "en iyi
 * bulunan" and the K-51 / D-099 whole-space gates stay with the full exploration (or the macro graph of U-v3-2 B).
 */
import type { PieceId, Move, SessionAction } from '../../src/core/types.ts';
import type { GameState } from '../../src/core/state.ts';
import { FLAG_BIT, H, createInitialState, setHdr } from '../../src/core/state.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import { NULL_SINK, applyMove, isLevelWon } from '../../src/core/moves.ts';
import type { MoveHooks } from '../../src/core/moves.ts';
import { levelHooks } from '../../src/core/obstacles/registry.ts';
import { hashState } from '../../src/core/hash.ts';
import { neededNow, quickHoldable } from '../../src/core/deadlock.ts';
import { Expander, KIND_NAMES, KIND_RAIL, infoCost, infoKind } from './expand.ts';
import { solverStart } from './explore.ts';
import { blocksToPlace } from './astar.ts';

/** Default beam widths, tried in order until the lower bound is met or the time runs out. */
export const LARGE_WIDTHS: readonly number[] = [8, 32, 128, 512, 2048];
/** Default time limit (ms) of `solveLarge`: the U-v3-2 gate for a 6 × 8 yard with 22 blocks is 60 s. */
export const LARGE_MAX_MS = 60_000;

export interface LargeOptions {
  readonly widths?: readonly number[];
  readonly maxMs?: number;
  /**
   * Deterministic budget: state expansions over all widths (default unlimited). The generator uses it instead of the
   * time limit so that its output never depends on the machine speed.
   */
  readonly maxExpanded?: number;
  readonly hooks?: MoveHooks;
  /** Search from this state instead of the level start (walk probes, tools/solver/walks.ts). */
  readonly start?: GameState;
  /** Stop at the first solution of any width (a solvability probe, not a `min` search). */
  readonly firstSolution?: boolean;
  /** Clock (default `performance.now`); only the time limit reads it. */
  readonly clock?: () => number;
}

/** One move of the found solution (the fields a `CanonicalStep` / `V3Step` needs). */
export interface LargeStep {
  readonly n: number;
  readonly kind: (typeof KIND_NAMES)[number];
  readonly pieceId: PieceId;
  readonly from: readonly [number, number];
  readonly to: readonly [number, number];
  readonly cost: number;
  readonly move: Extract<Move, { kind: 'drag' }>;
}

export interface LargeResult {
  /** `solved` = a solution was found (and replays on the core); `unknown` = none within the widths / time. */
  readonly status: 'solved' | 'unknown';
  /** Cost of the best solution found (an upper bound of `min`); null without one. */
  readonly best: number | null;
  /** Lower bound of `min`: the material blocks to place (`N`). */
  readonly lowerBound: number;
  /** `best === lowerBound`: the best found is the minimum (no shift needed). */
  readonly optimal: boolean;
  /** Width that found `best` (null without a solution). */
  readonly width: number | null;
  readonly steps: readonly LargeStep[];
  /** K-46 counters of the solution. */
  readonly yao: { readonly overWall: number; readonly rail: number; readonly value: number | null };
  /** States generated (all widths) and expanded. */
  readonly states: number;
  readonly expanded: number;
  readonly ms: number;
  /** The solution replayed on the core (strict `applyMove`, step 12 off) and won. */
  readonly replayOk: boolean;
  /** Per width: the cost found (null = none) and the time spent. */
  readonly runs: readonly { readonly width: number; readonly cost: number | null; readonly ms: number }[];
}

interface Node {
  /** The state (dropped to an empty array once its layer is expanded: only the path links are kept). */
  buf: Int32Array;
  readonly g: number;
  readonly parent: number;
  readonly step: Omit<LargeStep, 'n'> | null;
  readonly score: number;
}

/** Ranking score of a state (lower is better; see the module comment). */
export function scoreOf(s: GameState, hooks: MoveHooks): number {
  const need = neededNow(s);
  let free = 0;
  for (const id of need) if (quickHoldable(s, id, hooks.drag)) free++;
  return 8 * blocksToPlace(s) - 2 * free - need.length;
}

const EMPTY = new Int32Array(0);

interface Cand {
  readonly score: number;
  readonly seq: number;
  readonly node: Node;
}

/**
 * Keeps the `width` best candidates of a layer (score, then generation order) without storing the rest: a successor's
 * state is copied only when it enters the list, so a layer costs `width` buffers whatever the branching.
 */
class TopList {
  readonly items: Cand[] = [];
  private readonly width: number;
  constructor(width: number) {
    this.width = width;
  }
  /** Would a candidate with this score and sequence number enter the list? */
  admits(score: number, seq: number): boolean {
    if (this.items.length < this.width) return true;
    const last = this.items[this.items.length - 1] as Cand;
    return score < last.score || (score === last.score && seq < last.seq);
  }
  add(c: Cand): void {
    let lo = 0;
    let hi = this.items.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const m = this.items[mid] as Cand;
      if (m.score < c.score || (m.score === c.score && m.seq < c.seq)) lo = mid + 1;
      else hi = mid;
    }
    this.items.splice(lo, 0, c);
    if (this.items.length > this.width) this.items.pop();
  }
}

/** Best solution of one beam width, or null (see the module comment). */
function beam(
  lvl: CompiledLevel,
  hooks: MoveHooks,
  width: number,
  deadline: number,
  clock: () => number,
  stats: { states: number; expanded: number },
  maxExpanded: number,
  from?: GameState,
): Node[] | null {
  const x = new Expander(lvl, hooks);
  const start = from ?? solverStart(lvl);
  const nodes: Node[] = [{ buf: start.buf.slice(), g: 0, parent: -1, step: null, score: 0 }];
  const seen = new Map<string, number>();
  const h0 = hashState(start);
  seen.set(`${h0[0]}:${h0[1]}`, 0);
  let layer = [0];
  const cur: GameState = { lvl, buf: new Int32Array(lvl.layout.size) };
  const maxDepth = 4 * lvl.materialCount + 20;
  let seq = 0;
  for (let depth = 0; depth < maxDepth && layer.length > 0; depth++) {
    const top = new TopList(width);
    let won: Node | null = null;
    for (const ni of layer) {
      if (clock() > deadline || stats.expanded >= maxExpanded) return null;
      const node = nodes[ni] as Node;
      cur.buf.set(node.buf);
      const h = hashState(cur);
      stats.expanded++;
      x.expand(cur, h[0] ?? 0, h[1] ?? 0, (lo, hi, info) => {
        const g = node.g + infoCost(info);
        const key = `${lo}:${hi}`;
        const prev = seen.get(key);
        if (prev !== undefined && prev <= g) return;
        seen.set(key, g);
        stats.states++;
        const succ = x.materialize();
        const isWon = isLevelWon(succ);
        const score = isWon ? -Infinity : scoreOf(succ, hooks);
        const n = seq++;
        if (!isWon && !top.admits(score, n)) return;
        const made: Node = {
          buf: succ.buf.slice(),
          g,
          parent: ni,
          step: {
            kind: KIND_NAMES[infoKind(info)],
            pieceId: x.lastPiece,
            from: [x.lastFromX, x.lastFromY],
            to: [x.lastToX, x.lastToY],
            cost: infoCost(info),
            move: x.lastMove(),
          },
          score,
        };
        // the cheapest won state of the layer (ties: generation order)
        if (isWon) {
          if (won === null || g < won.g) won = made;
          return;
        }
        top.add({ score, seq: n, node: made });
      });
    }
    if (won !== null) {
      nodes.push(won);
      return pathTo(nodes, nodes.length - 1);
    }
    for (const ni of layer) (nodes[ni] as Node).buf = EMPTY;
    layer = top.items.map((c) => {
      nodes.push(c.node);
      return nodes.length - 1;
    });
  }
  return null;
}

function pathTo(nodes: readonly Node[], i: number): Node[] {
  const out: Node[] = [];
  for (let k = i; k > 0; k = (nodes[k] as Node).parent) out.push(nodes[k] as Node);
  return out.reverse();
}

/** Replays the moves on a fresh core state (strict, step 12 off, no move limit); true when the level is won. */
export function replayLarge(lvl: CompiledLevel, moves: readonly Move[], hooks: MoveHooks): boolean {
  const s = createInitialState(lvl);
  setHdr(s, H.movesLeft, 1_000_000);
  try {
    for (const m of moves) {
      const r = applyMove(s, m, NULL_SINK, { hooks, noTruckHelp: true, strict: true });
      if (r.status !== 'applied') return false;
    }
  } catch {
    return false;
  }
  return isLevelWon(s);
}

/**
 * Lower bound of `min`: N (every material block needs a placement of cost ≥ 1), plus 1 when no correct placement is
 * possible at the start (a shift must come first, K-50 item 5 `firstNeedDepth` ≥ 1).
 */
export function lowerBoundOf(lvl: CompiledLevel, hooks: MoveHooks = levelHooks(lvl)): number {
  const x = new Expander(lvl, hooks);
  const start = solverStart(lvl);
  const h = hashState(start);
  let placement = false;
  x.expand(start, h[0] ?? 0, h[1] ?? 0, (_lo, _hi, info) => {
    if (infoKind(info) <= KIND_RAIL) placement = true;
  });
  return lvl.materialCount + (placement ? 0 : 1);
}

/** The large-level search (see the module comment). */
export function solveLarge(lvl: CompiledLevel, opts: LargeOptions = {}): LargeResult {
  const clock = opts.clock ?? (() => performance.now());
  const t0 = clock();
  const deadline = t0 + (opts.maxMs ?? LARGE_MAX_MS);
  const hooks = opts.hooks ?? levelHooks(lvl);
  const lowerBound = lowerBoundOf(lvl, hooks);
  const stats = { states: 0, expanded: 0 };
  const runs: { width: number; cost: number | null; ms: number }[] = [];
  let best: Node[] | null = null;
  let bestWidth: number | null = null;
  for (const width of opts.widths ?? LARGE_WIDTHS) {
    if (clock() > deadline || stats.expanded >= (opts.maxExpanded ?? Infinity)) break;
    const w0 = clock();
    const path = beam(lvl, hooks, width, deadline, clock, stats, opts.maxExpanded ?? Infinity, opts.start);
    const cost = path ? (path[path.length - 1]?.g ?? null) : null;
    runs.push({ width, cost, ms: Math.round(clock() - w0) });
    if (path && (best === null || (cost ?? Infinity) < (best[best.length - 1]?.g ?? Infinity))) {
      best = path;
      bestWidth = width;
    }
    if (best && (opts.firstSolution || (best[best.length - 1]?.g ?? Infinity) <= lowerBound)) break;
  }
  const steps: LargeStep[] = (best ?? []).map((n, i) => ({ n: i + 1, ...(n.step as Omit<LargeStep, 'n'>) }));
  let overWall = 0;
  let rail = 0;
  for (const st of steps) {
    if (st.kind === 'overWall') overWall++;
    if (st.kind === 'rail') rail++;
  }
  const cost = best ? (best[best.length - 1]?.g ?? null) : null;
  const replayOk = best
    ? opts.start !== undefined
      ? true
      : replayLarge(
          lvl,
          steps.map((st) => st.move),
          hooks,
        )
    : false;
  return {
    status: best && replayOk ? 'solved' : 'unknown',
    best: cost,
    lowerBound,
    optimal: cost !== null && cost <= lowerBound,
    width: bestWidth,
    steps,
    yao: { overWall, rail, value: overWall + rail === 0 ? null : overWall / (overWall + rail) },
    states: stats.states,
    expanded: stats.expanded,
    ms: Math.round(clock() - t0),
    replayOk,
    runs,
  };
}

/** Session log of a large-level solution: `start` + its drags. */
export function largeActions(steps: readonly LargeStep[]): SessionAction[] {
  return [{ kind: 'start', preBoosters: [], streakTier: 0 }, ...steps.map((st) => st.move)];
}

/** Material blocks of the level that are flagged (debug summary of a large report). */
export function flaggedCount(lvl: CompiledLevel, flag: keyof typeof FLAG_BIT): number {
  return lvl.pieces.filter((p) => (p.flags & FLAG_BIT[flag]) !== 0).length;
}
