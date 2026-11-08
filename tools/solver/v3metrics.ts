/**
 * Levels v3 measures (docs/GDD.md §16 ÖNERİ K-64; LEVELS §8.6 gates, §8.10 U-v3-3). Computed from a solution (the
 * canonical one of a complete exploration, or the best one of the large-level search, tools/solver/large.ts) and, for
 * `shapeDecisions`, from the explored graph.
 *
 * - `liftRatio` (gate ≥ 0.60 on every level): correct placements whose block had its lowest cell below the wall top
 *   (`y < height`) at the start of the move / all correct placements. A block that slides in from a yard row at or above
 *   the wall top was never lifted.
 * - `visibleAtStart` (tracked): start-yard blocks the player sees = single blocks + pallets (a pallet counts once).
 * - `shapeDecisions` (gate ≥ 2 on Normal / Hard): canonical states with at least two correct placements where some
 *   correct placement is off the optimum and its block has the same cell colours as an optimal candidate but another
 *   shape or orientation (a two-tone twin, an overhang) — the decision is about the shape, not the colour. Needs the
 *   complete graph (null otherwise).
 * - `stackParks` (tracked): shifts of pallet layers in the solution; `unwrapAt` / `bonusAt` (tracked): the move number
 *   that places the scissors / the first bonus block, over the solution length.
 * - `traitDelta` (gate on the trait intro levels) needs the "ignore the trait" bot mode (U-v3-3); it is not computed
 *   yet (null) — see TECH_DESIGN §V3.4.
 */
import { Zone } from '../../src/core/types.ts';
import type { PieceId } from '../../src/core/types.ts';
import { FLAG_BIT, PF, PIECE_STRIDE, createInitialState } from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import { isCovered } from '../../src/core/grid.ts';
import { infoCost, isPlacementInfo } from './expand.ts';
import type { Graph } from './explore.ts';
import { stateAt } from './explore.ts';
import { INF } from './distance.ts';

/** The part of a solution step the v3 measures read (a `CanonicalStep` has it). */
export interface V3Step {
  readonly kind: string;
  readonly pieceId: PieceId;
  /** Start anchor (board coordinates); the anchor row is the block's lowest row. */
  readonly from: readonly [number, number];
}

export interface V3Metrics {
  /** K-64 item 1; null without a placement. Two decimals. */
  readonly liftRatio: number | null;
  readonly lifted: number;
  readonly placements: number;
  /** K-64 item 4. */
  readonly visibleAtStart: number;
  /** K-64 item 2; null when the graph is not complete (large-level search). */
  readonly shapeDecisions: number | null;
  /** U-v3-3 tracked measures. */
  readonly stackParks: number;
  readonly unwrapAt: number | null;
  readonly bonusAt: number | null;
  /** K-64 item 3: not computed yet (needs the bot's "ignore the trait" mode). */
  readonly traitDelta: null;
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

/** Start-yard blocks the player sees: every yard block that is not a covered pallet layer. */
export function visibleAtStart(lvl: CompiledLevel): number {
  const s = createInitialState(lvl);
  let n = 0;
  for (const p of lvl.pieces) if (p.startZone === Zone.yard && !isCovered(s, p.id)) n++;
  return n;
}

/** The v3 measures of a solution; `graph` (complete exploration, canonical path) adds `shapeDecisions`. */
export function v3Metrics(
  lvl: CompiledLevel,
  steps: readonly V3Step[],
  graph?: { readonly g: Graph; readonly dist: Int32Array; readonly pathStates: readonly number[] },
): V3Metrics {
  let lifted = 0;
  let placements = 0;
  let stackParks = 0;
  let unwrapAt: number | null = null;
  let bonusAt: number | null = null;
  steps.forEach((st, i) => {
    const p = lvl.pieces[st.pieceId];
    if (st.kind === 'shift') {
      if (p && p.stackId >= 0) stackParks++;
      return;
    }
    if (st.kind !== 'overWall' && st.kind !== 'rail') return;
    placements++;
    if (st.from[1] < lvl.wallHeight) lifted++;
    if (p && (p.flags & FLAG_BIT.scissors) !== 0 && unwrapAt === null) unwrapAt = i + 1;
    if (p && (p.flags & FLAG_BIT.bonus) !== 0 && bonusAt === null) bonusAt = i + 1;
  });
  const len = steps.length;
  return {
    liftRatio: placements === 0 ? null : round2(lifted / placements),
    lifted,
    placements,
    visibleAtStart: visibleAtStart(lvl),
    shapeDecisions: graph ? shapeDecisions(graph.g, graph.dist, graph.pathStates) : null,
    stackParks,
    unwrapAt: unwrapAt === null || len === 0 ? null : round2(unwrapAt / len),
    bonusAt: bonusAt === null || len === 0 ? null : round2(bonusAt / len),
    traitDelta: null,
  };
}

/** The block that became locked on the site between two states (−1 when none). */
function placedPiece(a: GameState, b: GameState): PieceId {
  const { lvl } = a;
  for (let id = 0; id < lvl.layout.counts.pieces; id++) {
    const base = lvl.layout.pieces + id * PIECE_STRIDE;
    const was = ((a.buf[base + PF.flags] ?? 0) & FLAG_BIT.locked) !== 0;
    const now = ((b.buf[base + PF.flags] ?? 0) & FLAG_BIT.locked) !== 0;
    if (!was && now && (b.buf[base + PF.zone] ?? 0) === Zone.site) return id;
  }
  return -1;
}

/** Sorted cell colours of a block ("WY" for a two-tone W–Y, "WW" for a W domino). */
function colorKey(s: GameState, id: PieceId): string {
  const p = s.lvl.pieces[id];
  if (!p) return '';
  const color = s.buf[s.lvl.layout.pieces + id * PIECE_STRIDE + PF.color] ?? 0;
  const cells = p.cellColors ?? [];
  const n = cells.length > 0 ? cells.length : 0;
  return n > 0 ? [...cells].sort().join(',') : `${color}`;
}

/** K-64 item 2 (see the module comment). */
function shapeDecisions(g: Graph, dist: Int32Array, pathStates: readonly number[]): number {
  let count = 0;
  for (const s of pathStates) {
    if ((g.won[s] ?? 0) === 1) continue;
    const ds = dist[s] ?? INF;
    if (ds >= INF) continue;
    const from = stateAt(g, s);
    const optimal: { id: PieceId; shape: number; tone: number; key: string }[] = [];
    const other: { id: PieceId; shape: number; tone: number; key: string }[] = [];
    for (let e = g.edgeStart[s] ?? 0; e < (g.edgeStart[s + 1] ?? 0); e++) {
      const info = g.edgeInfo[e] ?? 0;
      if (!isPlacementInfo(info)) continue;
      const t = g.edgeTo[e] ?? 0;
      const to = stateAt(g, t);
      const id = placedPiece(from, to);
      if (id < 0) continue;
      const cand = {
        id,
        shape: from.buf[from.lvl.layout.pieces + id * PIECE_STRIDE + PF.shape] ?? 0,
        tone: g.lvl.pieces[id]?.toneCode ?? 0,
        key: colorKey(from, id),
      };
      if ((dist[t] ?? INF) === ds - infoCost(info)) optimal.push(cand);
      else other.push(cand);
    }
    if (optimal.length + other.length < 2) continue;
    const shapeOnly = other.some((o) =>
      optimal.some((b) => b.key === o.key && (b.shape !== o.shape || b.tone !== o.tone)),
    );
    if (shapeOnly) count++;
  }
  return count;
}
