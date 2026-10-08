/**
 * Micro levels (3×4 yard, ≤ 4 blocks) and an independent brute-force solver for the solver tests (TECH §2R.5 "K-50
 * metrics match brute force on micro levels").
 *
 * The brute force shares only the rule engine with the solver (core `beginDrag`, `applyMove`): it tries EVERY reachable
 * release node with `applyMove` on a copy (no fast path, no per-column representative, no pre-check), identifies states
 * by a canonical text key (sorted block descriptors; no Zobrist), stores the graph as plain arrays and computes every
 * metric by fixed-point relaxation. `treeMin` is a pure tree search (iterative deepening, no transposition table).
 */
import { COLOR_CODES, Zone } from '../../../src/core/types.ts';
import type { DragNode, PieceId } from '../../../src/core/types.ts';
import {
  H,
  PF,
  PIECE_STRIDE,
  cloneState,
  createInitialState,
  filledMask,
  queueIds,
} from '../../../src/core/state.ts';
import type { GameState } from '../../../src/core/state.ts';
import type { CompiledLevel } from '../../../src/core/level/compile.ts';
import { ArraySink, applyMove, isLevelWon } from '../../../src/core/moves.ts';
import { beginDrag } from '../../../src/core/movement.ts';
import { levelHooks } from '../../../src/core/obstacles/registry.ts';
import type { LevelSpec } from '../../fixtures/builders.ts';

const BIG = 1_000_000;

/** Every micro level: name → builder spec. 3×4 yard, 2×4 site, wall 4 (H 4), full cover. */
export const MICRO: Readonly<Record<string, LevelSpec>> = {
  // two vertical caps over the first block: a dig of 2
  dig: {
    id: 3,
    yard: { cols: 3, rows: 4 },
    site: { cols: 2, rows: 4 },
    wall: { height: 4 },
    plan: ['YY', 'YY', 'WW', 'WW'],
    pieces: [
      ['O4_0', 'W', 0, 0],
      ['D2_0', 'Y', 0, 2],
      ['D2_0', 'Y', 1, 2],
    ],
  },
  // a gap at rows 0–1: the buried first block slides through it on the rail (K-12)
  gap: {
    id: 4,
    yard: { cols: 3, rows: 4 },
    site: { cols: 2, rows: 4 },
    wall: { height: 4, gaps: [{ type: 'static', y: 0, size: 2 }] },
    plan: ['YY', 'YY', 'WW', 'WW'],
    pieces: [
      ['O4_0', 'W', 0, 0],
      ['D2_90', 'Y', 0, 2],
      ['D2_90', 'Y', 0, 3],
    ],
  },
  // a ✓-trap: the vertical W fits the bottom W rows too, then the O4 W has no place (LEVELS §2.0 item 4)
  trap: {
    id: 5,
    yard: { cols: 3, rows: 4 },
    site: { cols: 2, rows: 4 },
    wall: { height: 4 },
    plan: ['WY', 'WY', 'WW', 'WW'],
    pieces: [
      ['O4_0', 'W', 0, 0],
      ['D2_0', 'W', 2, 0],
      ['D2_0', 'Y', 2, 2],
    ],
  },
  // two segments, a truck batch that buries the blocks needed first (K-22, K-25), a carried dig in segment 2
  truck: {
    id: 6,
    yard: { cols: 3, rows: 4 },
    site: { cols: 2, rows: 4 },
    wall: { height: 4 },
    plan: [
      ['WW', 'WW', 'WW', 'WW'],
      ['GG', 'GG', 'YY', 'YY'],
    ],
    pieces: [
      ['O4_0', 'W', 0, 0],
      ['O4_0', 'W', 0, 2],
    ],
    batches: [
      {
        forSegment: 1,
        pieces: [
          ['D2_0', 'Y', 0, 0],
          ['D2_0', 'Y', 1, 0],
          ['O4_0', 'G', 0, 0],
        ],
      },
    ],
  },
};

/** Canonical text of a state: blocks as (shape, colour, flags, zone, x, y, seg) sorted, the queue in order, header. */
export function stateKey(s: GameState): string {
  const { lvl, buf } = s;
  const blocks: string[] = [];
  for (let id = 0; id < lvl.layout.counts.pieces; id++) {
    const b = lvl.layout.pieces + id * PIECE_STRIDE;
    const zone = buf[b + PF.zone] ?? 0;
    if (zone !== Zone.yard && zone !== Zone.site) continue;
    blocks.push(
      [
        buf[b + PF.shape],
        buf[b + PF.color],
        buf[b + PF.flags],
        zone,
        buf[b + PF.x],
        buf[b + PF.y],
        buf[b + PF.seg],
      ].join(','),
    );
  }
  blocks.sort();
  const queue = queueIds(s).map((id) => {
    const b = lvl.layout.pieces + id * PIECE_STRIDE;
    return `${buf[b + PF.shape]},${buf[b + PF.color]}`;
  });
  const masks: number[] = [];
  for (let seg = 0; seg < lvl.segments.length; seg++)
    for (let sx = 0; sx < lvl.geo.ws; sx++) masks.push(filledMask(s, seg, sx));
  return `${blocks.join('|')}#${queue.join('|')}#${buf[H.activeSeg]},${buf[H.deliveryCursor]}#${masks.join(',')}`;
}

export interface BruteEdge {
  readonly to: number;
  readonly kind: 'placement' | 'shift' | 'wait';
  readonly overWall: boolean;
  readonly cost: number;
}

export interface BruteGraph {
  readonly keys: string[];
  readonly won: boolean[];
  readonly edges: BruteEdge[][];
}

/** Every drag move of `s` that changes the state: [next state, edge without `to`]. */
function moves(
  s: GameState,
): { next: GameState; kind: BruteEdge['kind']; overWall: boolean; cost: number }[] {
  const out: { next: GameState; kind: BruteEdge['kind']; overWall: boolean; cost: number }[] = [];
  const hooks = levelHooks(s.lvl);
  for (let id: PieceId = 0; id < s.lvl.layout.counts.pieces; id++) {
    const session = beginDrag(s, id, hooks.drag);
    if (!session) continue;
    for (const node of session.reachableNodes()) {
      if (session.classify(node).kind === 'cancel') continue;
      const next = cloneState(s);
      const sink = new ArraySink();
      const res = applyMove(next, { kind: 'drag', pieceId: id, to: node as DragNode }, sink, {
        noTruckHelp: true,
      });
      if (res.status !== 'applied') continue;
      const cost = BIG - (next.buf[H.movesLeft] ?? 0);
      next.buf[H.movesLeft] = BIG;
      const placed = sink.events.find((e) => e.t === 'placementCorrect');
      const toYard = sink.events.some((e) => e.t === 'pieceMoved' && e.to.zone === 'yard');
      out.push({
        next,
        kind: placed ? 'placement' : toYard ? 'shift' : 'wait',
        overWall: placed?.t === 'placementCorrect' ? placed.overWall : false,
        cost,
      });
    }
  }
  return out;
}

export function bruteExplore(lvl: CompiledLevel): BruteGraph {
  const start = createInitialState(lvl);
  start.buf[H.movesLeft] = BIG;
  const keys = [stateKey(start)];
  const index = new Map<string, number>([[keys[0] ?? '', 0]]);
  const states = [start];
  const won = [isLevelWon(start)];
  const edges: BruteEdge[][] = [];
  for (let i = 0; i < states.length; i++) {
    const s = states[i] as GameState;
    const list: BruteEdge[] = [];
    edges.push(list);
    if (won[i]) continue;
    const key = keys[i];
    for (const m of moves(s)) {
      const k = stateKey(m.next);
      if (k === key) continue;
      let to = index.get(k);
      if (to === undefined) {
        to = states.length;
        index.set(k, to);
        keys.push(k);
        states.push(m.next);
        won.push(isLevelWon(m.next));
      }
      const prev = list.find((e) => e.to === to);
      const rank = (e: { kind: string; overWall: boolean }): number =>
        e.kind === 'placement' ? (e.overWall ? 0 : 1) : e.kind === 'shift' ? 2 : 3;
      if (!prev) list.push({ to, kind: m.kind, overWall: m.overWall, cost: m.cost });
      else if (rank(m) < rank(prev))
        list[list.indexOf(prev)] = { to, kind: m.kind, overWall: m.overWall, cost: m.cost };
    }
  }
  return { keys, won, edges };
}

const INF = 1e9;

/** Fixed point of d(s) = min over edges (w(e) + d(t)), d(won) = 0. */
function relax(g: BruteGraph, w: (e: BruteEdge) => number): number[] {
  const d: number[] = g.won.map((x) => (x ? 0 : INF));
  for (let changed = true; changed;) {
    changed = false;
    g.edges.forEach((list, s) => {
      for (const e of list) {
        const v = w(e) + (d[e.to] ?? INF);
        if (v < (d[s] ?? INF)) {
          d[s] = v;
          changed = true;
        }
      }
    });
  }
  return d;
}

export interface BruteMetrics {
  readonly states: number;
  readonly min: number | null;
  readonly minShifts: number | null;
  readonly firstNeedDepth: number | null;
  readonly trapCount: number;
  readonly deadRate: number;
  readonly choices0: number;
  readonly bestChoices0: number;
  /** Most over-the-wall placements over every shortest solution (K-46). */
  readonly maxOverWall: number | null;
}

export function bruteMetrics(g: BruteGraph, budget: number): BruteMetrics {
  const dist = relax(g, (e) => e.cost);
  const toWin = relax(g, (e) => (e.kind === 'shift' ? 1 : 0));
  // forward shifts from the start
  const from: number[] = g.keys.map(() => INF);
  from[0] = 0;
  for (let changed = true; changed;) {
    changed = false;
    g.edges.forEach((list, s) => {
      for (const e of list) {
        const v = (from[s] ?? INF) + (e.kind === 'shift' ? 1 : 0);
        if (v < (from[e.to] ?? INF)) {
          from[e.to] = v;
          changed = true;
        }
      }
    });
  }
  const min = (dist[0] ?? INF) >= INF ? null : (dist[0] ?? 0);
  const minShifts = (toWin[0] ?? INF) >= INF ? null : (toWin[0] ?? 0);
  // firstNeedDepth: BFS over shift edges
  let firstNeedDepth: number | null = null;
  const depth = new Map<number, number>([[0, 0]]);
  const queue = [0];
  for (let h = 0; h < queue.length; h++) {
    const s = queue[h] ?? 0;
    const list = g.edges[s] ?? [];
    if (list.some((e) => e.kind === 'placement')) {
      firstNeedDepth = depth.get(s) ?? 0;
      break;
    }
    for (const e of list)
      if (e.kind === 'shift' && !depth.has(e.to)) {
        depth.set(e.to, (depth.get(s) ?? 0) + 1);
        queue.push(e.to);
      }
  }
  // scope K, traps
  let trapCount = 0;
  let placements = 0;
  const limit = (minShifts ?? 0) + 1;
  g.edges.forEach((list, s) => {
    if ((from[s] ?? INF) > limit || (dist[s] ?? INF) >= INF) return;
    for (const e of list) {
      if (e.kind !== 'placement') continue;
      placements++;
      if ((dist[e.to] ?? INF) >= INF) trapCount++;
    }
  });
  // choices@0
  let choices0 = 0;
  let bestChoices0 = 0;
  for (const e of g.edges[0] ?? []) {
    const dt = dist[e.to] ?? INF;
    if (dt >= INF || e.cost + dt > budget) continue;
    choices0++;
    if (dt === (dist[0] ?? 0) - e.cost) bestChoices0++;
  }
  // K-46: most over-the-wall placements over shortest solutions (memoised DFS on the shortest-path DAG)
  const memo = new Map<number, number>();
  const best = (s: number): number => {
    if (g.won[s]) return 0;
    const m = memo.get(s);
    if (m !== undefined) return m;
    let b = -INF;
    for (const e of g.edges[s] ?? []) {
      if ((dist[e.to] ?? INF) + e.cost !== dist[s]) continue;
      b = Math.max(b, (e.overWall ? 1 : 0) + best(e.to));
    }
    memo.set(s, b);
    return b;
  };
  return {
    states: g.keys.length,
    min,
    minShifts,
    firstNeedDepth,
    trapCount,
    deadRate: placements === 0 ? 0 : trapCount / placements,
    choices0,
    bestChoices0,
    maxOverWall: min === null ? null : best(0),
  };
}

/** Pure tree search: is a win reachable within `depth` moves? (no memo; only for tiny levels). */
function winnable(s: GameState, depth: number): boolean {
  if (isLevelWon(s)) return true;
  if (depth === 0) return false;
  for (const m of moves(s)) if (winnable(m.next, depth - 1)) return true;
  return false;
}

/** `min` by iterative deepening over the raw move tree (unit move costs); null above `maxDepth`. */
export function treeMin(lvl: CompiledLevel, maxDepth: number): number | null {
  const start = createInitialState(lvl);
  start.buf[H.movesLeft] = BIG;
  for (let d = 0; d <= maxDepth; d++) if (winnable(start, d)) return d;
  return null;
}

/** Colour letters of the colour indices (debug messages). */
export const colorLetter = (c: number): string => COLOR_CODES[c] ?? '-';
