/**
 * A* for `min` only (docs/TECH_DESIGN.md §2R.5 "Büyük uzay yedeği"; used today by the LEVEL_REPORT variants, whose
 * spaces are larger than the level's own: removing the Ağır Yük frees 9 yard cells). Same moves as the exploration
 * (expand.ts, the real core).
 *
 * Heuristic: `h(s)` = material blocks not locked yet (yard, truck queue, undelivered batches, unlocked on the site).
 * Every such block needs one more correct placement of cost ≥ 1, and only a placement lowers h (by exactly 1): h is
 * admissible and consistent, so the first won state popped has the minimum cost (K-50 item 2).
 */
import { Zone } from '../../src/core/types.ts';
import { FLAG_BIT, PF, PIECE_STRIDE } from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import { isLevelWon } from '../../src/core/moves.ts';
import type { MoveHooks } from '../../src/core/moves.ts';
import { levelHooks } from '../../src/core/obstacles/registry.ts';
import { hashState } from '../../src/core/hash.ts';
import { Expander, infoCost } from './expand.ts';
import { DEFAULT_MAX_MS, DEFAULT_MAX_STATES, solverStart } from './explore.ts';
import { IntList, StateSpace } from './space.ts';

export interface AstarResult {
  /** Minimum cost to a win; null when unsolvable or unknown (`complete: false`). */
  readonly min: number | null;
  /** The search ended by itself (a win popped or the open list emptied). */
  readonly complete: boolean;
  readonly states: number;
  readonly ms: number;
}

/** Material blocks still to place (the heuristic). */
export function blocksToPlace(s: GameState): number {
  const { lvl, buf } = s;
  let n = 0;
  for (const p of lvl.pieces) {
    if (p.cls !== 'material') continue;
    const base = lvl.layout.pieces + p.id * PIECE_STRIDE;
    const zone = buf[base + PF.zone] ?? 0;
    if (zone === Zone.gone) continue;
    if (zone === Zone.site && ((buf[base + PF.flags] ?? 0) & FLAG_BIT.locked) !== 0) continue;
    n++;
  }
  return n;
}

function swapAt(a: Int32Array, i: number, j: number): void {
  const t = a[i] ?? 0;
  a[i] = a[j] ?? 0;
  a[j] = t;
}

/** Binary min-heap of (f, −g, state) packed in parallel arrays. */
class Heap {
  private f = new IntList(1024);
  private g = new IntList(1024);
  private s = new IntList(1024);
  get size(): number {
    return this.s.length;
  }
  private less(i: number, j: number): boolean {
    const fi = this.f.data[i] ?? 0;
    const fj = this.f.data[j] ?? 0;
    return fi < fj || (fi === fj && (this.g.data[i] ?? 0) > (this.g.data[j] ?? 0));
  }
  private swap(i: number, j: number): void {
    swapAt(this.f.data, i, j);
    swapAt(this.g.data, i, j);
    swapAt(this.s.data, i, j);
  }
  push(f: number, g: number, s: number): void {
    this.f.push(f);
    this.g.push(g);
    this.s.push(s);
    let i = this.s.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.less(i, p)) break;
      this.swap(i, p);
      i = p;
    }
  }
  /** Pops the top; returns [g, state]. */
  pop(): [number, number] {
    const g = this.g.data[0] ?? 0;
    const s = this.s.data[0] ?? 0;
    const last = this.s.length - 1;
    this.swap(0, last);
    this.f.length = last;
    this.g.length = last;
    this.s.length = last;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < last && this.less(l, m)) m = l;
      if (r < last && this.less(r, m)) m = r;
      if (m === i) break;
      this.swap(i, m);
      i = m;
    }
    return [g, s];
  }
}

export function astarMin(
  lvl: CompiledLevel,
  opts: { readonly maxStates?: number; readonly maxMs?: number; readonly hooks?: MoveHooks } = {},
): AstarResult {
  const t0 = performance.now();
  const hooks = opts.hooks ?? levelHooks(lvl);
  const maxStates = opts.maxStates ?? DEFAULT_MAX_STATES;
  const maxMs = opts.maxMs ?? DEFAULT_MAX_MS;
  const start = solverStart(lvl);
  const h0 = hashState(start);
  const space = new StateSpace(start.buf);
  space.add(h0[0] ?? 0, h0[1] ?? 0, start.buf);
  const best = new IntList(1 << 12);
  best.push(0);
  const closed = new IntList(1 << 12);
  closed.push(0);
  const heap = new Heap();
  heap.push(blocksToPlace(start), 0, 0);
  const x = new Expander(lvl, hooks);
  const cur: GameState = { lvl, buf: new Int32Array(lvl.layout.size) };
  let popped = 0;
  let g = 0;
  const onSuccessor = (lo: number, hi: number, info: number): void => {
    const ng = g + infoCost(info);
    let t = space.find(lo, hi);
    if (t < 0) {
      const succ = x.materialize();
      t = space.add(lo, hi, succ.buf);
      best.push(ng);
      closed.push(0);
      heap.push(ng + blocksToPlace(succ), ng, t);
      return;
    }
    if (ng < (best.data[t] ?? 0) && (closed.data[t] ?? 0) === 0) {
      best.data[t] = ng;
      space.load(t, scratch.buf);
      heap.push(ng + blocksToPlace(scratch), ng, t);
    }
  };
  const scratch: GameState = { lvl, buf: new Int32Array(lvl.layout.size) };
  while (heap.size > 0) {
    if (space.count >= maxStates || ((popped & 255) === 0 && performance.now() - t0 > maxMs))
      return { min: null, complete: false, states: space.count, ms: Math.round(performance.now() - t0) };
    const [pg, s] = heap.pop();
    popped++;
    if ((closed.data[s] ?? 0) === 1 || pg > (best.data[s] ?? 0)) continue;
    closed.data[s] = 1;
    space.load(s, cur.buf);
    if (isLevelWon(cur))
      return { min: pg, complete: true, states: space.count, ms: Math.round(performance.now() - t0) };
    g = pg;
    x.expand(cur, space.hashLo(s), space.hashHi(s), onSuccessor);
  }
  return { min: null, complete: true, states: space.count, ms: Math.round(performance.now() - t0) };
}
