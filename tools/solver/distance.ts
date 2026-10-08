/**
 * Distances over the explored graph (docs/TECH_DESIGN.md §2R.5 `distance.ts`; GDD K-50 items 2, 3, 5, 8):
 *
 * - `dist(s)`: the cheapest move cost from s to a won state (K-07 costs 1–3; Dial's bucket queue over reversed edges);
 *   INF = dead (K-50 item 7, "çıkmaz").
 * - `shiftsToWin(s)`: the fewest shift moves from s to a win, placements free (0-1 BFS over reversed edges; K-50
 *   item 3 `minShifts` = its start value).
 * - `shiftsFromStart(s)`: the fewest shift moves from the start to s (forward 0-1 BFS; K-50 item 8 scope K).
 * - `firstNeedDepth`: BFS from the start over shift edges only; the depth of the first state with a placement edge.
 * - `distanceFromStart(s)`: the cheapest move cost from the start to s (forward Dial; K-51 item 5 `D(k)`).
 * Wrong placements (`wait`, timed levels only) cost moves but are not shifts.
 */
import type { Graph } from './explore.ts';
import { infoCost, isPlacementInfo, isShiftInfo } from './expand.ts';

export const INF = 0x3fffffff;

export interface Reverse {
  /** Edges INTO state t are `start[t] … start[t + 1] − 1`. */
  readonly start: Int32Array;
  readonly from: Int32Array;
  readonly info: Uint8Array;
}

export function reverseEdges(g: Graph): Reverse {
  const n = g.count;
  const m = g.edgeTo.length;
  const start = new Int32Array(n + 1);
  for (let e = 0; e < m; e++) {
    const t = (g.edgeTo[e] ?? 0) + 1;
    start[t] = (start[t] ?? 0) + 1;
  }
  for (let i = 0; i < n; i++) start[i + 1] = (start[i + 1] ?? 0) + (start[i] ?? 0);
  const fill = start.slice(0, n);
  const from = new Int32Array(m);
  const info = new Uint8Array(m);
  for (let s = 0; s < n; s++) {
    for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
      const t = g.edgeTo[e] ?? 0;
      const p = fill[t] ?? 0;
      fill[t] = p + 1;
      from[p] = s;
      info[p] = g.edgeInfo[e] ?? 0;
    }
  }
  return { start, from, info };
}

export interface DistanceResult {
  /** Cost to win; INF when dead. */
  readonly dist: Int32Array;
  /** Live states in non-decreasing `dist` order (won states first). */
  readonly order: Int32Array;
}

/** K-50 item 2: Dial's algorithm from every won state over the reversed edges (costs 1–3). */
export function distanceToWin(g: Graph, rev: Reverse): DistanceResult {
  const n = g.count;
  const dist = new Int32Array(n).fill(INF);
  const done = new Uint8Array(n);
  const order: number[] = [];
  const buckets: number[][] = [[]];
  for (let s = 0; s < n; s++) {
    if ((g.won[s] ?? 0) === 1) {
      dist[s] = 0;
      buckets[0]?.push(s);
    }
  }
  for (let d = 0; d < buckets.length; d++) {
    const bucket = buckets[d] ?? [];
    for (let k = 0; k < bucket.length; k++) {
      const t = bucket[k] ?? 0;
      if (done[t] || dist[t] !== d) continue;
      done[t] = 1;
      order.push(t);
      for (let e = rev.start[t] ?? 0; e < (rev.start[t + 1] ?? 0); e++) {
        const s = rev.from[e] ?? 0;
        const nd = d + infoCost(rev.info[e] ?? 0);
        if (nd < (dist[s] ?? INF)) {
          dist[s] = nd;
          while (buckets.length <= nd) buckets.push([]);
          buckets[nd]?.push(s);
        }
      }
    }
    buckets[d] = [];
  }
  return { dist, order: Int32Array.from(order) };
}

/**
 * Cheapest move cost from the start to every state (Dial's bucket queue over the forward edges, K-07 costs 1–3);
 * INF when unreachable. GDD K-51 item 5 `D(k)` (delivery fairness).
 */
export function distanceFromStart(g: Graph): Int32Array {
  const n = g.count;
  const dist = new Int32Array(n).fill(INF);
  const done = new Uint8Array(n);
  const buckets: number[][] = [[0]];
  dist[0] = 0;
  for (let d = 0; d < buckets.length; d++) {
    const bucket = buckets[d] ?? [];
    for (let k = 0; k < bucket.length; k++) {
      const s = bucket[k] ?? 0;
      if (done[s] || dist[s] !== d) continue;
      done[s] = 1;
      for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
        const t = g.edgeTo[e] ?? 0;
        const nd = d + infoCost(g.edgeInfo[e] ?? 0);
        if (nd < (dist[t] ?? INF)) {
          dist[t] = nd;
          while (buckets.length <= nd) buckets.push([]);
          buckets[nd]?.push(t);
        }
      }
    }
    buckets[d] = [];
  }
  return dist;
}

/** Shift weight of an edge for K-50 item 3 / 8: shift 1, placement and wait 0. */
const shiftWeight = (info: number): number => (isShiftInfo(info) ? 1 : 0);

/** K-50 item 3: fewest shifts from each state to a win (0-1 BFS over reversed edges). INF when dead. */
export function shiftsToWin(g: Graph, rev: Reverse): Int32Array {
  const n = g.count;
  const d = new Int32Array(n).fill(INF);
  const deque = new Deque(n);
  for (let s = 0; s < n; s++) {
    if ((g.won[s] ?? 0) === 1) {
      d[s] = 0;
      deque.pushBack(s);
    }
  }
  while (!deque.empty()) {
    const t = deque.popFront();
    const dt = d[t] ?? INF;
    for (let e = rev.start[t] ?? 0; e < (rev.start[t + 1] ?? 0); e++) {
      const s = rev.from[e] ?? 0;
      const w = shiftWeight(rev.info[e] ?? 0);
      if (dt + w < (d[s] ?? INF)) {
        d[s] = dt + w;
        if (w === 0) deque.pushFront(s);
        else deque.pushBack(s);
      }
    }
  }
  return d;
}

/** K-50 item 8: fewest shifts from the start to each state (forward 0-1 BFS). INF when unreachable. */
export function shiftsFromStart(g: Graph): Int32Array {
  const n = g.count;
  const d = new Int32Array(n).fill(INF);
  const deque = new Deque(n);
  d[0] = 0;
  deque.pushBack(0);
  while (!deque.empty()) {
    const s = deque.popFront();
    const ds = d[s] ?? INF;
    for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
      const t = g.edgeTo[e] ?? 0;
      const w = shiftWeight(g.edgeInfo[e] ?? 0);
      if (ds + w < (d[t] ?? INF)) {
        d[t] = ds + w;
        if (w === 0) deque.pushFront(t);
        else deque.pushBack(t);
      }
    }
  }
  return d;
}

/** The state has a correct-placement edge (K-50 item 5). */
export function hasPlacementEdge(g: Graph, s: number): boolean {
  for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++)
    if (isPlacementInfo(g.edgeInfo[e] ?? 0)) return true;
  return false;
}

/**
 * K-50 item 5 `firstNeedDepth`: BFS from the start over shift edges only; the depth of the first state from which a
 * correct placement is possible. Null when no such state exists (then the level is unsolvable).
 */
export function firstNeedDepth(g: Graph): number | null {
  const n = g.count;
  const depth = new Int32Array(n).fill(-1);
  const queue = new Int32Array(n);
  let head = 0;
  let tail = 0;
  depth[0] = 0;
  queue[tail++] = 0;
  while (head < tail) {
    const s = queue[head++] ?? 0;
    if (hasPlacementEdge(g, s)) return depth[s] ?? 0;
    for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
      if (!isShiftInfo(g.edgeInfo[e] ?? 0)) continue;
      const t = g.edgeTo[e] ?? 0;
      if ((depth[t] ?? 0) >= 0) continue;
      depth[t] = (depth[s] ?? 0) + 1;
      queue[tail++] = t;
    }
  }
  return null;
}

/** Fixed-capacity ring deque of state indices (each state is pushed at most twice per improvement round). */
class Deque {
  private buf: Int32Array;
  private head = 0;
  private size = 0;
  constructor(capacity: number) {
    this.buf = new Int32Array(Math.max(16, capacity * 2));
  }
  empty(): boolean {
    return this.size === 0;
  }
  private grow(): void {
    const next = new Int32Array(this.buf.length * 2);
    for (let i = 0; i < this.size; i++) next[i] = this.buf[(this.head + i) % this.buf.length] ?? 0;
    this.buf = next;
    this.head = 0;
  }
  pushBack(v: number): void {
    if (this.size === this.buf.length) this.grow();
    this.buf[(this.head + this.size) % this.buf.length] = v;
    this.size++;
  }
  pushFront(v: number): void {
    if (this.size === this.buf.length) this.grow();
    this.head = (this.head - 1 + this.buf.length) % this.buf.length;
    this.buf[this.head] = v;
    this.size++;
  }
  popFront(): number {
    const v = this.buf[this.head] ?? 0;
    this.head = (this.head + 1) % this.buf.length;
    this.size--;
    return v;
  }
}
