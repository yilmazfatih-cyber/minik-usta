/**
 * Full exploration (docs/TECH_DESIGN.md §2R.5 "Tam keşif"): breadth-first from the start state over the exact moves of
 * expand.ts, every state expanded once (Zobrist identity, K-50 item 9a: identical blocks swapped are one state), edges
 * stored as a CSR (`edgeStart`, `edgeTo`, `edgeInfo`).
 *
 * - One edge per (state, next state) pair (K-50 item 9a); when several moves reach the same next state the edge keeps
 *   the smallest kind (over the wall < rail < shift < wait) and then the smallest cost (TECH §2R.5).
 * - Won states (K-48) are not expanded (no move after the win).
 * - Limits: `maxStates` (default 3 000 000) and `maxMs` (default 120 000). The time limit is a safety net only; a run
 *   that hits a limit is `complete: false` and every metric that needs the whole space is reported as unknown.
 * - D3a gate (TECH §2R.4 "Maliyet ve performans kapısı"): every new state entered by a correct placement or a delivery
 *   (any move that went through `applyMove`) runs the core `tileRemaining`; the largest expansion count is
 *   `d3aMaxExpansions`.
 */
import { createInitialState } from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import { isLevelWon } from '../../src/core/moves.ts';
import type { MoveHooks } from '../../src/core/moves.ts';
import { levelHooks } from '../../src/core/obstacles/registry.ts';
import { hashState } from '../../src/core/hash.ts';
import { D3A_STATS, isFullCover, tileRemaining } from '../../src/core/deadlock.ts';
import { Expander, infoCost, infoKind, normalizeState } from './expand.ts';
import { ByteList, IntList, StateSpace } from './space.ts';

export const DEFAULT_MAX_STATES = 3_000_000;
export const DEFAULT_MAX_MS = 120_000;

export interface ExploreOptions {
  readonly maxStates?: number;
  readonly maxMs?: number;
  /** Run D3a on states entered by a placement or a delivery (default true). */
  readonly d3a?: boolean;
  /** Rule hooks (default: the level's registry hooks, as the game). */
  readonly hooks?: MoveHooks;
  /** Clock for the time limit (default `performance.now`). */
  readonly clock?: () => number;
}

export interface ExploreStats {
  readonly states: number;
  readonly expanded: number;
  readonly edges: number;
  readonly ms: number;
  readonly bytes: number;
  readonly dragSessions: number;
  readonly applyMoves: number;
  readonly fastYardMoves: number;
  readonly d3aRuns: number;
  readonly d3aMaxExpansions: number;
  readonly d3aUnknown: number;
}

export interface Graph {
  readonly lvl: CompiledLevel;
  readonly hooks: MoveHooks;
  readonly space: StateSpace;
  readonly count: number;
  /** Every state was expanded (no limit hit). */
  readonly complete: boolean;
  readonly limit: 'maxStates' | 'maxMs' | null;
  /** 1 = won (K-48). */
  readonly won: Uint8Array;
  /** CSR: edges of state i are `edgeStart[i] … edgeStart[i + 1] − 1`. */
  readonly edgeStart: Int32Array;
  readonly edgeTo: Int32Array;
  readonly edgeInfo: Uint8Array;
  readonly unsupported: readonly string[];
  readonly stats: ExploreStats;
}

/** The normalised start state of the level (K-25 batch 0, debris, timers at their start). */
export function solverStart(lvl: CompiledLevel): GameState {
  const s = createInitialState(lvl);
  normalizeState(s);
  return s;
}

/** Edge order of K-50 item 4 / TECH §2R.5: smaller kind, then smaller cost. */
function betterInfo(a: number, b: number): boolean {
  const ka = infoKind(a);
  const kb = infoKind(b);
  return ka < kb || (ka === kb && infoCost(a) < infoCost(b));
}

export function explore(lvl: CompiledLevel, opts: ExploreOptions = {}): Graph {
  const hooks = opts.hooks ?? levelHooks(lvl);
  const maxStates = opts.maxStates ?? DEFAULT_MAX_STATES;
  const maxMs = opts.maxMs ?? DEFAULT_MAX_MS;
  const clock = opts.clock ?? (() => performance.now());
  const runD3a = (opts.d3a ?? true) && isFullCover(lvl);
  const t0 = clock();

  const start = solverStart(lvl);
  const h = hashState(start);
  const space = new StateSpace(start.buf);
  space.add(h[0] ?? 0, h[1] ?? 0, start.buf);
  const won = new ByteList(1 << 12);
  won.push(isLevelWon(start) ? 1 : 0);
  const edgeStart = new IntList(1 << 12);
  edgeStart.push(0);
  const edgeTo = new IntList(1 << 14);
  const edgeInfo = new ByteList(1 << 14);
  let stamp = new Int32Array(1 << 12).fill(-1);
  let edgePos = new Int32Array(1 << 12);

  const x = new Expander(lvl, hooks);
  const cur: GameState = { lvl, buf: new Int32Array(lvl.layout.size) };
  let i = 0;
  let limit: Graph['limit'] = null;
  let d3aRuns = 0;
  let d3aMax = 0;
  let d3aUnknown = 0;

  const onSuccessor = (lo: number, hi: number, info: number): void => {
    let t = space.find(lo, hi);
    if (t < 0) {
      const succ = x.materialize();
      t = space.add(lo, hi, succ.buf);
      const isWon = isLevelWon(succ);
      won.push(isWon ? 1 : 0);
      if (runD3a && x.lastSlow && !isWon) {
        const r = tileRemaining(succ);
        d3aRuns++;
        if (D3A_STATS.expansions > d3aMax) d3aMax = D3A_STATS.expansions;
        if (r === 'unknown') d3aUnknown++;
      }
      if (t >= stamp.length) {
        const ns = new Int32Array(stamp.length * 2).fill(-1);
        ns.set(stamp);
        stamp = ns;
        const np = new Int32Array(edgePos.length * 2);
        np.set(edgePos);
        edgePos = np;
      }
    }
    if (t === i) return;
    if (stamp[t] === i) {
      const p = edgePos[t] ?? 0;
      if (betterInfo(info, edgeInfo.data[p] ?? 0)) edgeInfo.data[p] = info;
      return;
    }
    stamp[t] = i;
    edgePos[t] = edgeTo.length;
    edgeTo.push(t);
    edgeInfo.push(info);
  };

  for (i = 0; i < space.count; i++) {
    if (space.count >= maxStates) {
      limit = 'maxStates';
      break;
    }
    if ((i & 63) === 0 && clock() - t0 > maxMs) {
      limit = 'maxMs';
      break;
    }
    if ((won.data[i] ?? 0) === 0) {
      space.load(i, cur.buf);
      x.expand(cur, space.hashLo(i), space.hashHi(i), onSuccessor);
    }
    edgeStart.push(edgeTo.length);
  }
  const expanded = i;
  while (edgeStart.length < space.count + 1) edgeStart.push(edgeTo.length);

  const ms = clock() - t0;
  const g: Graph = {
    lvl,
    hooks,
    space,
    count: space.count,
    complete: limit === null,
    limit,
    won: won.toArray(),
    edgeStart: edgeStart.toArray(),
    edgeTo: edgeTo.toArray(),
    edgeInfo: edgeInfo.toArray(),
    unsupported: x.unsupported,
    stats: {
      states: space.count,
      expanded,
      edges: edgeTo.length,
      ms: Math.round(ms),
      bytes: space.bytes() + edgeTo.length * 5 + space.count * 9,
      dragSessions: x.stats.sessions,
      applyMoves: x.stats.applyMoves,
      fastYardMoves: x.stats.fastMoves,
      d3aRuns,
      d3aMaxExpansions: d3aMax,
      d3aUnknown,
    },
  };
  return g;
}

/** Rebuilds explored state `idx` (a fresh GameState). */
export function stateAt(g: Graph, idx: number): GameState {
  const s: GameState = { lvl: g.lvl, buf: new Int32Array(g.lvl.layout.size) };
  g.space.load(idx, s.buf);
  return s;
}
