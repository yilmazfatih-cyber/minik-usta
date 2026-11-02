/**
 * D-099 puzzle-intelligence metrics and gates (docs/GDD.md K-50 items 11–19, K-51 items 6–9, K-52 D-099 budget;
 * docs/LEVELS.md §6.2, §7 U-3; docs/TECH_DESIGN.md §D99). Computed on the complete explored graph (explore.ts) with
 * the distances of distance.ts and the canonical solution of metrics.ts; every metric is exact (no sampling).
 *
 * - Static (start state): `maxCover` (K-50/11), the cover relation "a covers b" (K-50/13: a has a yard cell above b's
 *   top cell in one of b's columns) and `E0` (empty yard cells, K-02 `E`).
 * - Canonical profile (K-50/12–14): `canonShifts`, `parkedBlocks`, `reparks`, `maxDigRun`, `seg(b)` (segment of b's
 *   placement), `depLater` / `depEarlier` / `crossDeps`, `carryShifts`, `parkPeak` (material cells off their start
 *   anchor in the yard, largest over the canonical states) and `parkSlack = E0 / parkPeak` (two decimals; null = no
 *   park).
 * - Decision points (K-50/15): `choices@k` / `bestChoices@k` on EVERY canonical state (K-50/9 rules, budget = JSON
 *   `moves`), `decisionPoints` (choices ≥ 2), `forced` (choices ≥ 2 and best = 1).
 * - Greedy policy G (K-50/16): `dig(s)` = fewest shifts to a state with a correct-placement edge (multi-source BFS over
 *   reversed shift edges); a G edge is every placement edge when the state has one, else a shift with
 *   `dig(t) = dig(s) − 1`. G edges form a DAG. `greedyMin` (Dial over G edges), `greedyExcess = greedyMin − min`,
 *   `greedyTrap` (fewest G moves into a dead state; null = none), `greedyWin` (uniform choice among the distinct G
 *   successors, win within `moves`; exact DP over (state, budget left)).
 * - "Aha" (K-50/17): `ahaMin` = fewest non-G edges over every shortest solution (0-1 DP on the shortest-path DAG);
 *   the canonical aha moves are `hold` (a placement was possible) or `prep` (no placement, `dig` not reduced).
 * - `branch3` (K-50/18): Σ goodPieces@k / Σ pieces@k for k = 0…2 (pieces with a state-changing move; good = one of
 *   its moves keeps a shortest solution).
 * - Space (K-50/19, K-51/7–8): `complete`, `undetectedDead` (dead states entered from a live state that D1/D2/D3a do
 *   not catch), `d1States` (D1 states entered from a live state, K-30).
 */
import { Zone } from '../../src/core/types.ts';
import type { PieceId } from '../../src/core/types.ts';
import { PF, PIECE_STRIDE, yardOcc } from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import { noMoves } from '../../src/core/deadlock.ts';
import { shapeByIndex } from '../../src/core/shapes.ts';
import { isFixedYardLevel } from '../../src/core/level/schema.ts';
import type { LevelData } from '../../src/core/level/schema.ts';
import type { Graph } from './explore.ts';
import { solverStart, stateAt } from './explore.ts';
import { Expander, KIND_RAIL, KIND_SHIFT, KIND_WAIT, infoCost, infoKind } from './expand.ts';
import { INF } from './distance.ts';
import type { DistanceResult, Reverse } from './distance.ts';

/** K-50/17 aha move of the canonical solution. */
export interface AhaMove {
  /** 1-based canonical move number. */
  readonly n: number;
  readonly kind: 'hold' | 'prep';
}

/** D-099 metrics (GDD K-50 items 11–19). */
export interface D099Metrics {
  /** K-50/11: the largest `cover(b)` at the start. Null without a yard material block. */
  readonly maxCover: number | null;
  /** K-50/12. */
  readonly canonShifts: number;
  readonly parkedBlocks: number;
  readonly reparks: number;
  readonly maxDigRun: number;
  /** K-50/13 `seg(b)` by piece ref (`piece:<i>` …): the segment of b's canonical placement. */
  readonly seg: Readonly<Record<string, number>>;
  readonly depLater: number;
  readonly depEarlier: number;
  readonly crossDeps: number;
  readonly carryShifts: number;
  /** K-50/14. */
  readonly E0: number;
  readonly parkPeak: number;
  /** `E0 / parkPeak`, two decimals; null when nothing is parked. */
  readonly parkSlack: number | null;
  /** K-50/15: `choices@k` / `bestChoices@k` for every canonical state k = 0 … L − 1. */
  readonly choicesAll: readonly number[];
  readonly bestChoicesAll: readonly number[];
  readonly decisionPoints: number;
  readonly forced: number;
  /** K-50/16: `dig(start)` (null = ∞). */
  readonly digStart: number | null;
  /** Fewest-cost win with G moves only; null = ∞ (no greedy win). */
  readonly greedyMin: number | null;
  /** `greedyMin − min`; null = ∞. */
  readonly greedyExcess: number | null;
  /** Fewest G moves into a dead state; null = no such path. */
  readonly greedyTrap: number | null;
  /** Probability (0–1, unrounded) that uniform greedy play wins within `moves`. */
  readonly greedyWin: number;
  /** States reachable from the start by G moves. */
  readonly greedyStates: number;
  /** K-50/17. */
  readonly ahaMin: number;
  readonly ahaMoves: readonly AhaMove[];
  /** K-50/18: `pieces@k` / `goodPieces@k` (k = 0…2; fewer entries on a shorter solution) and the ratio. */
  readonly pieces3: readonly number[];
  readonly goodPieces3: readonly number[];
  readonly branch3: number | null;
  /** K-50/19. */
  readonly complete: boolean;
  /** K-51/7 (b). */
  readonly undetectedDead: number;
  /**
   * K-51/8: D1 states (no block can be held, K-30) entered by one drag from a live state (or the start). A D1 state
   * behind another dead state is not counted: that dead state is torn down first (K-51/7 b).
   */
  readonly d1States: number;
}

/** What `d099Metrics` needs from the metrics step. */
export interface D099Input {
  readonly g: Graph;
  readonly rev: Reverse;
  readonly dist: DistanceResult;
  /** Canonical solution: pieces, kinds, segments, costs. */
  readonly steps: readonly {
    readonly kind: string;
    readonly pieceId: PieceId;
    readonly ref: string;
    readonly segment: number;
    readonly cost: number;
  }[];
  /** Graph state of each canonical position (0 = start … the won state). */
  readonly pathStates: readonly number[];
  /** JSON `moves` (K-50/9 b). */
  readonly budget: number;
  /** `cover(b)` by ref (K-50/6). */
  readonly cover: Readonly<Record<string, number>>;
  readonly ref: (id: PieceId) => string;
  /** `deadEntries.states − caught` of the whole space. */
  readonly undetectedDead: number;
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

/** K-50/16 `dig(s)` for every state (INF = no placement reachable by shifts). */
export function digDistances(g: Graph, rev: Reverse): Int32Array {
  const n = g.count;
  const dig = new Int32Array(n).fill(INF);
  const queue = new Int32Array(n);
  let head = 0;
  let tail = 0;
  for (let s = 0; s < n; s++) {
    for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
      if (infoKind(g.edgeInfo[e] ?? 0) <= KIND_RAIL) {
        dig[s] = 0;
        queue[tail++] = s;
        break;
      }
    }
  }
  while (head < tail) {
    const t = queue[head++] ?? 0;
    const dt = dig[t] ?? INF;
    for (let e = rev.start[t] ?? 0; e < (rev.start[t + 1] ?? 0); e++) {
      if (infoKind(rev.info[e] ?? 0) !== KIND_SHIFT) continue;
      const s = rev.from[e] ?? 0;
      if ((dig[s] ?? INF) !== INF) continue;
      dig[s] = dt + 1;
      queue[tail++] = s;
    }
  }
  return dig;
}

/** The G policy (K-50/16) over the graph. */
export class GreedyPolicy {
  readonly g: Graph;
  readonly dig: Int32Array;
  constructor(g: Graph, dig: Int32Array) {
    this.g = g;
    this.dig = dig;
  }
  /** Edge `e` (out of `s`) is G-admissible. */
  isG(s: number, e: number): boolean {
    const g = this.g;
    const kind = infoKind(g.edgeInfo[e] ?? 0);
    const ds = this.dig[s] ?? INF;
    if (ds === 0) return kind <= KIND_RAIL;
    if (kind !== KIND_SHIFT || ds >= INF) return false;
    return (this.dig[g.edgeTo[e] ?? 0] ?? INF) === ds - 1;
  }
}

/** Start state facts: the cover relation and E0. */
function startFacts(g: Graph): { readonly covers: [PieceId, PieceId][]; readonly E0: number } {
  const s = solverStart(g.lvl);
  const lvl = g.lvl;
  const covers: [PieceId, PieceId][] = [];
  for (let b = 0; b < lvl.layout.counts.pieces; b++) {
    const base = lvl.layout.pieces + b * PIECE_STRIDE;
    if ((s.buf[base + PF.zone] ?? 0) !== Zone.yard || lvl.pieces[b]?.cls !== 'material') continue;
    const shape = shapeByIndex(s.buf[base + PF.shape] ?? 0);
    const x0 = s.buf[base + PF.x] ?? 0;
    const y0 = s.buf[base + PF.y] ?? 0;
    const above = new Set<PieceId>();
    for (let c = 0; c < shape.w; c++) {
      for (let y = y0 + (shape.colTop[c] ?? 0) + 1; y < lvl.geo.hy; y++) {
        const v = yardOcc(s, x0 + c, y);
        if (v === 0 || v === b + 1) continue;
        const a = v - 1;
        if (lvl.pieces[a]?.cls === 'material') above.add(a);
      }
    }
    for (const a of [...above].sort((x, y) => x - y)) covers.push([a, b]);
  }
  let E0 = 0;
  for (let y = 0; y < lvl.geo.hy; y++) for (let x = 0; x < lvl.geo.wy; x++) if (yardOcc(s, x, y) === 0) E0++;
  return { covers, E0 };
}

/** Material cells in the yard off their start anchor (K-50/14 park cells). */
function parkCells(s: GameState, start: GameState): number {
  const lvl = s.lvl;
  let cells = 0;
  for (let id = 0; id < lvl.layout.counts.pieces; id++) {
    if (lvl.pieces[id]?.cls !== 'material') continue;
    const base = lvl.layout.pieces + id * PIECE_STRIDE;
    if ((s.buf[base + PF.zone] ?? 0) !== Zone.yard) continue;
    const moved =
      (start.buf[base + PF.zone] ?? 0) !== Zone.yard ||
      (s.buf[base + PF.x] ?? 0) !== (start.buf[base + PF.x] ?? 0) ||
      (s.buf[base + PF.y] ?? 0) !== (start.buf[base + PF.y] ?? 0);
    if (moved) cells += shapeByIndex(s.buf[base + PF.shape] ?? 0).cellCount;
  }
  return cells;
}

export function d099Metrics(input: D099Input): D099Metrics {
  const { g, rev, dist, steps, pathStates, budget } = input;
  const D = dist.dist;
  const n = g.count;
  const won = g.won;

  // --- canonical profile (K-50/12–14)
  const shiftsOf = new Map<PieceId, number>();
  const seg = new Map<PieceId, number>();
  let canonShifts = 0;
  let run = 0;
  let maxDigRun = 0;
  for (const st of steps) {
    if (st.kind === 'shift') {
      canonShifts++;
      run++;
      if (run > maxDigRun) maxDigRun = run;
      shiftsOf.set(st.pieceId, (shiftsOf.get(st.pieceId) ?? 0) + 1);
    } else {
      run = 0;
      if (st.kind === 'overWall' || st.kind === 'rail') seg.set(st.pieceId, st.segment);
    }
  }
  let carryShifts = 0;
  for (const st of steps) {
    if (st.kind !== 'shift') continue;
    const sb = seg.get(st.pieceId);
    if (sb !== undefined && sb > st.segment) carryShifts++;
  }
  const { covers, E0 } = startFacts(g);
  let depLater = 0;
  let depEarlier = 0;
  for (const [a, b] of covers) {
    const sa = seg.get(a);
    const sb = seg.get(b);
    if (sa === undefined || sb === undefined) continue;
    if (sa > sb) depLater++;
    else if (sa < sb) depEarlier++;
  }
  const start = solverStart(g.lvl);
  let parkPeak = 0;
  for (const s of pathStates) parkPeak = Math.max(parkPeak, parkCells(stateAt(g, s), start));
  const coverValues = Object.values(input.cover);

  // --- choices on every canonical state (K-50/15)
  const choicesAll: number[] = [];
  const bestChoicesAll: number[] = [];
  let spent = 0;
  for (let k = 0; k < pathStates.length - 1; k++) {
    const s = pathStates[k] ?? 0;
    const ds = D[s] ?? INF;
    let c = 0;
    let b = 0;
    for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
      const t = g.edgeTo[e] ?? 0;
      const cost = infoCost(g.edgeInfo[e] ?? 0);
      const dt = D[t] ?? INF;
      if (dt >= INF || spent + cost + dt > budget) continue;
      c++;
      if (dt === ds - cost) b++;
    }
    choicesAll.push(c);
    bestChoicesAll.push(b);
    spent += steps[k]?.cost ?? 0;
  }
  const decisionPoints = choicesAll.filter((c) => c >= 2).length;
  const forced = choicesAll.filter((c, k) => c >= 2 && bestChoicesAll[k] === 1).length;

  // --- greedy policy (K-50/16)
  const dig = digDistances(g, rev);
  const G = new GreedyPolicy(g, dig);
  const minCost = D[0] ?? INF;
  // greedyMin: Dial over G edges from the start; greedyTrap: BFS (moves) over G edges to the first dead state
  const gCost = new Int32Array(n).fill(INF);
  const gDepth = new Int32Array(n).fill(-1);
  {
    const buckets: number[][] = [[0]];
    gCost[0] = 0;
    for (let d = 0; d < buckets.length; d++) {
      const bucket = buckets[d] ?? [];
      for (let k = 0; k < bucket.length; k++) {
        const s = bucket[k] ?? 0;
        if (gCost[s] !== d) continue;
        for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
          if (!G.isG(s, e)) continue;
          const t = g.edgeTo[e] ?? 0;
          const nd = d + infoCost(g.edgeInfo[e] ?? 0);
          if (nd < (gCost[t] ?? INF)) {
            gCost[t] = nd;
            while (buckets.length <= nd) buckets.push([]);
            buckets[nd]?.push(t);
          }
        }
      }
      buckets[d] = [];
    }
  }
  let greedyMin = INF;
  let greedyStates = 0;
  for (let s = 0; s < n; s++) {
    if ((gCost[s] ?? INF) >= INF) continue;
    greedyStates++;
    if ((won[s] ?? 0) === 1 && (gCost[s] ?? INF) < greedyMin) greedyMin = gCost[s] ?? INF;
  }
  let greedyTrap: number | null = null;
  {
    const queue = new Int32Array(Math.max(1, greedyStates));
    let head = 0;
    let tail = 0;
    gDepth[0] = 0;
    queue[tail++] = 0;
    while (head < tail && greedyTrap === null) {
      const s = queue[head++] ?? 0;
      if ((D[s] ?? INF) >= INF) {
        greedyTrap = gDepth[s] ?? 0;
        break;
      }
      for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
        if (!G.isG(s, e)) continue;
        const t = g.edgeTo[e] ?? 0;
        if ((gDepth[t] ?? -1) >= 0) continue;
        gDepth[t] = (gDepth[s] ?? 0) + 1;
        queue[tail++] = t;
      }
    }
  }
  // greedyWin: P(s, b) over the G DAG (depth ≤ N + Σ dig, recursion is shallow)
  const memo = new Map<number, number>();
  const winP = (s: number, b: number): number => {
    if ((won[s] ?? 0) === 1) return 1;
    const ds = D[s] ?? INF;
    if (ds >= INF || ds > b) return 0;
    const key = s * 256 + b;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    let sum = 0;
    let cnt = 0;
    for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
      if (!G.isG(s, e)) continue;
      cnt++;
      const c = infoCost(g.edgeInfo[e] ?? 0);
      if (c <= b) sum += winP(g.edgeTo[e] ?? 0, b - c);
    }
    const p = cnt === 0 ? 0 : sum / cnt;
    memo.set(key, p);
    return p;
  };
  const greedyWin = winP(0, Math.min(255, budget));

  // --- aha (K-50/17): 0-1 DP on the shortest-path DAG in non-decreasing dist order
  const aha = new Int32Array(n).fill(INF);
  for (const s of dist.order) {
    if ((won[s] ?? 0) === 1) {
      aha[s] = 0;
      continue;
    }
    const ds = D[s] ?? INF;
    let best = INF;
    for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
      const t = g.edgeTo[e] ?? 0;
      if ((D[t] ?? INF) + infoCost(g.edgeInfo[e] ?? 0) !== ds) continue;
      const v = (aha[t] ?? INF) + (G.isG(s, e) ? 0 : 1);
      if (v < best) best = v;
    }
    aha[s] = best;
  }
  const ahaMoves: AhaMove[] = [];
  steps.forEach((st, k) => {
    if (st.kind !== 'shift') return;
    const s = pathStates[k] ?? 0;
    const t = pathStates[k + 1] ?? 0;
    const ds = dig[s] ?? INF;
    if (ds === 0) ahaMoves.push({ n: k + 1, kind: 'hold' });
    else if ((dig[t] ?? INF) !== ds - 1) ahaMoves.push({ n: k + 1, kind: 'prep' });
  });

  // --- branch3 (K-50/18): per piece on the first three canonical states
  const pieces3: number[] = [];
  const goodPieces3: number[] = [];
  const x = new Expander(g.lvl, g.hooks);
  for (let k = 0; k < 3 && k < pathStates.length - 1; k++) {
    const s = pathStates[k] ?? 0;
    const ds = D[s] ?? INF;
    const cur = stateAt(g, s);
    const all = new Set<PieceId>();
    const good = new Set<PieceId>();
    x.expand(cur, g.space.hashLo(s), g.space.hashHi(s), (lo, hi, info) => {
      if (infoKind(info) === KIND_WAIT) return;
      const id = x.lastPiece;
      all.add(id);
      const t = g.space.find(lo, hi);
      if (t >= 0 && (D[t] ?? INF) + infoCost(info) === ds) good.add(id);
    });
    pieces3.push(all.size);
    goodPieces3.push(good.size);
  }
  const sumP = pieces3.reduce((a, b) => a + b, 0);
  const sumG = goodPieces3.reduce((a, b) => a + b, 0);

  // --- D1 states (K-51/8): entered by one drag from a live state (or the start). Only a state without edges can be
  // D1; a D1 state behind an earlier dead state is never seen in play when that dead state is caught (Söküm)
  const d1 = new Set<number>();
  const isD1 = (t: number): boolean =>
    (won[t] ?? 0) === 0 &&
    (g.edgeStart[t + 1] ?? 0) === (g.edgeStart[t] ?? 0) &&
    noMoves(stateAt(g, t), g.hooks.drag);
  if (isD1(0)) d1.add(0);
  for (let s = 0; s < n; s++) {
    if ((D[s] ?? INF) >= INF) continue;
    for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
      const t = g.edgeTo[e] ?? 0;
      if (!d1.has(t) && (D[t] ?? INF) >= INF && isD1(t)) d1.add(t);
    }
  }
  const d1States = d1.size;

  const seqRecord: Record<string, number> = {};
  for (const [id, k] of [...seg.entries()].sort((a, b) => a[0] - b[0])) seqRecord[input.ref(id)] = k;
  return {
    maxCover: coverValues.length === 0 ? null : Math.max(...coverValues),
    canonShifts,
    parkedBlocks: shiftsOf.size,
    reparks: [...shiftsOf.values()].filter((v) => v >= 2).length,
    maxDigRun,
    seg: seqRecord,
    depLater,
    depEarlier,
    crossDeps: depLater + depEarlier,
    carryShifts,
    E0,
    parkPeak,
    parkSlack: parkPeak === 0 ? null : round2(E0 / parkPeak),
    choicesAll,
    bestChoicesAll,
    decisionPoints,
    forced,
    digStart: (dig[0] ?? INF) >= INF ? null : (dig[0] ?? 0),
    greedyMin: greedyMin >= INF ? null : greedyMin,
    greedyExcess: greedyMin >= INF || minCost >= INF ? null : greedyMin - minCost,
    greedyTrap,
    greedyWin,
    greedyStates,
    ahaMin: (aha[0] ?? INF) >= INF ? 0 : (aha[0] ?? 0),
    ahaMoves,
    pieces3,
    goodPieces3,
    branch3: sumP === 0 ? null : round2(sumG / sumP),
    complete: g.complete,
    undetectedDead: input.undetectedDead,
    d1States,
  };
}

// --- K-52 D-099 move budget ----------------------------------------------------------------------------------------

export type Difficulty = LevelData['difficulty'];

/** GDD K-52 D-099 table: the difficulty share P. */
export const D099_P: Readonly<Record<Difficulty, number>> = { easy: 4, normal: 2, hard: 1, superhard: 1 };
const EASIER: Readonly<Record<Difficulty, Difficulty>> = {
  easy: 'easy',
  normal: 'easy',
  hard: 'normal',
  superhard: 'hard',
};

/** `aMax` of K-52 D-099: Kolay/Normal max(2, ⌈0.15·min⌉), Zor/Çok Zor max(1, ⌈0.10·min⌉). */
export function d099AMax(min: number, difficulty: Difficulty): number {
  return difficulty === 'easy' || difficulty === 'normal'
    ? Math.max(2, Math.ceil((15 * min) / 100))
    : Math.max(1, Math.ceil((10 * min) / 100));
}

/** K-52 D-099 band: `min + P ≤ moves ≤ min + P + aMax`; an intro level takes P one row easier, `aMax` its own row. */
export function d099Band(
  min: number,
  difficulty: Difficulty,
  intro: boolean,
): { readonly P: number; readonly aMax: number; readonly lo: number; readonly hi: number } {
  const P = D099_P[intro ? EASIER[difficulty] : difficulty];
  const aMax = d099AMax(min, difficulty);
  return { P, aMax, lo: min + P, hi: min + P + aMax };
}

// --- K-51 items 6–9 gates ------------------------------------------------------------------------------------------

export interface D099Issue {
  readonly code: string;
  readonly rule: string;
  readonly check: string;
  readonly severity: 'error' | 'warn';
  readonly path: string;
  readonly message: string;
}

/** GDD K-51 items 6–9 and K-45 item 11 on a solved `schemaVersion` 2 level (no issue on a v1 level). */
export function d099Checks(level: LevelData, m: D099Metrics): D099Issue[] {
  if (!isFixedYardLevel(level)) return [];
  const out: D099Issue[] = [];
  const add = (
    code: string,
    rule: string,
    check: string,
    severity: 'error' | 'warn',
    path: string,
    msg: string,
  ): void => {
    out.push({ code, rule, check, severity, path, message: msg });
  };
  if (m.undetectedDead > 0)
    add(
      'undetected_dead',
      'K-51/7',
      'L-37',
      'error',
      '(level)',
      `${m.undetectedDead} dead state(s) entered from a live state by one drag are not caught by D1/D2/D3a: no Söküm would come (dead-table gate, D-090)`,
    );
  if (m.d1States > 0)
    add(
      'd1_reachable',
      'K-51/8',
      'L-37',
      'error',
      'yard',
      `${m.d1States} reachable state(s) where no block can be held (K-30 D1)`,
    );
  const easy = level.difficulty === 'easy' || level.difficulty === 'normal';
  if (easy && m.greedyTrap !== null)
    add(
      'greedy_trap_in_easy',
      'K-51/6',
      'L-38',
      'error',
      'yard',
      `greedy play reaches a dead state after ${m.greedyTrap} move(s) (Kolay/Normal: no greedy trap)`,
    );
  if (level.id >= 3) {
    const S = level.build.segments.length;
    if (S >= 2 && m.crossDeps < 1)
      add(
        'puzzle_no_cross',
        'K-51/9',
        'L-39',
        'warn',
        'yard',
        `crossDeps 0 on a ${S}-segment level: the floors do not depend on each other in the yard`,
      );
    const intro = level.teaches !== undefined;
    const hard = level.difficulty === 'hard' || level.difficulty === 'superhard';
    if (((level.difficulty === 'normal' && !intro) || hard) && m.ahaMin < 1 && m.greedyWin > 0.7)
      add(
        'puzzle_greedy_easy',
        'K-51/9',
        'L-39',
        'warn',
        'yard',
        `ahaMin ${m.ahaMin} and greedyWin ${m.greedyWin.toFixed(2)} > 0.70: greedy play finishes the level safely`,
      );
    if (
      hard &&
      m.greedyMin !== null &&
      m.greedyMin <= level.moves &&
      m.greedyTrap === null &&
      m.greedyWin > 0.25
    )
      add(
        'puzzle_greedy_wins',
        'K-51/9',
        'L-39',
        'warn',
        'yard',
        `greedyMin ${m.greedyMin} ≤ moves ${level.moves}, no greedy trap and greedyWin ${m.greedyWin.toFixed(2)} > 0.25`,
      );
  }
  return out;
}
