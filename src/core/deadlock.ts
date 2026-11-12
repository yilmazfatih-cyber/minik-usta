/**
 * Deadlock check and truck help — K-35 step 12 (docs/GDD.md K-30, K-29, K-35, K-55 item 8; TECH_DESIGN §2R.4, §D99).
 * Pure: no clock, no DOM, no randomness.
 *
 * - D1 `noMoves`: no block can be held by K-09 (a)–(d) (the counter condition (e) is ignored), or — v3 widening (GDD §16
 *   "K-30 değişikliği", `RULES_VERSION` 4) — blocks can be held but none has a release other than a cancel (K-07 rows
 *   1, 3, 4, 5: back to its start, over the yard in the crane area, straddling, closed site). Help: rules lift chains
 *   and wetness (`onTruckHelp`); still D1 → Söküm with cause `access` (`RULES_VERSION` 3, D-099: the yard is never
 *   re-laid; the Faz 2R seeded reshuffle was removed — every `RULES_VERSION` ≤ 2 attempt is voided on load, K-43 item 4).
 * - D2 `color`: per colour, remaining supply ≠ remaining demand (K-47). Skipped on W6 levels (CL-2R-04).
 * - D3a `tiling` (`tileRemaining`): exact cover of the remaining plan cells by the remaining material blocks, bottom-up
 *   per column (K-34), segments in order, batch availability, W6 joker; access ignored. Budget = expansions
 *   (`D3A_MAX_EXPANSIONS`), never time: an exhausted budget is `unknown`, never dead.
 * - D3b `access`: the solver's dead-state table (`DeadTable`). The table export / loader is cut 1 (Faz 3); the lookup
 *   is here and the game passes `null` until then.
 * - Söküm (teardown): D2 / D3 → the buffer goes back to the action's start (`preAction`), the counter and `movesSpent`
 *   keep their post-action values, the streak `c = 0`; `teardown` is the action's last event.
 *
 * Levels whose data is not a full cover (K-47 broken: old Faz 2 data, hand-made test boards) get D1 only: D2 / D3 are
 * defined for full-cover data, the validator never loads anything else (L-30 `cover_mismatch`). D1's Söküm runs on
 * every level (it only needs the action's start buffer).
 *
 * D3a algorithm note (TECH §2R.4 item 2, implementation): §2R.4 picks the lowest column and only tries blocks covering
 * its next cell. That misses tilings where the block over that cell must wait for a neighbour column (C3 overhang over
 * a B1). This search branches on EVERY block that sits on the current column heights (K-34: each column bottom on its
 * column height); any order of a K-34 build reaches the same state, and the numeric memo of dead states (segment,
 * profile, class counts) merges the orders, so every state is expanded once. Complete and deterministic.
 */
import { COLOR_CODES, Zone } from './types.ts';
import type { Anchor, GameEventBody, PieceId, TeardownCause, TeardownMove, TeardownPlace } from './types.ts';
import {
  FLAG_BIT,
  H,
  PF,
  PIECE_STRIDE,
  filledMask,
  hdr,
  pieceCellColor,
  pieceColor,
  pieceFlags,
  pieceSeg,
  pieceShape,
  pieceX,
  pieceY,
  pieceZone,
  setHdr,
  siteOcc,
  yardOcc,
} from './state.ts';
import type { GameState } from './state.ts';
import { shapeByIndex } from './shapes.ts';
import type { ShapeDef } from './shapes.ts';
import { PLAN_DOT } from './level/compile.ts';
import type { CompiledLevel } from './level/compile.ts';
import { isPalletLayer, tryBeginDrag } from './movement.ts';
import type { DragRules } from './movement.ts';
import { computeFall } from './gravity.ts';
import type { FallRules } from './gravity.ts';
import { visibleSegment } from './grid.ts';
import { isRemainingSupply, remainingDemandByColor, remainingSupplyByColor } from './goals.ts';
import { hashState } from './hash.ts';
import type { MoveHooks, RuleContext } from './moves.ts';

export type { TeardownCause };

/** ANALYTICS v6 `deadlock_teardown.cause` of a teardown cause (TECH §2R.16). */
export const ANALYTICS_CAUSE = { color: 'color_balance', tiling: 'tiling', access: 'access' } as const;

/** GDD K-30 D3a: the expansion budget (the single policy number, TECH §2R.0 item 6). */
export const D3A_MAX_EXPANSIONS = 20_000;

/** D3a result: a tiling exists / none exists / the budget ran out (never counted as dead). */
export type TileResult = 'ok' | 'dead' | 'unknown';

// --- level-level facts ---------------------------------------------------------------------------------------------

const FULL_COVER = new WeakMap<CompiledLevel, boolean>();

/** W6 paint gates make colour supply ≠ demand by design (K-47 item 1): D2 is skipped (CL-2R-04), D3a uses jokers. */
export function hasPaintGates(lvl: CompiledLevel): boolean {
  return lvl.gaps.some((g) => g.type === 'paint');
}

/**
 * The level data is a full cover (K-47 item 1): per colour supply = demand, on W6 levels the cell totals. D2 / D3 run
 * only then (see the module comment).
 */
export function isFullCover(lvl: CompiledLevel): boolean {
  let v = FULL_COVER.get(lvl);
  if (v === undefined) {
    const sum = (a: readonly number[]): number => a.reduce((x, y) => x + y, 0);
    v = hasPaintGates(lvl)
      ? sum(lvl.supply) === sum(lvl.demand)
      : lvl.supply.every((n, c) => n === (lvl.demand[c] ?? 0));
    FULL_COVER.set(lvl, v);
  }
  return v;
}

// --- D1 ------------------------------------------------------------------------------------------------------------

/**
 * Cheap sufficient test of K-09 (a)–(d) plus a non-cancel release (v3 D1 widening) for a yard block (µs, no BFS):
 * unlocked, allowed by the rules, not a pallet layer and free to move one cell up inside the yard (every column's top
 * cell has an empty yard cell above it). A vertical step inside the yard columns never crosses the wall boundary or the
 * site's open sky, so that node is valid, and for an ordinary block a node fully in the yard is a yard release (K-07
 * row 2), never a cancel. A pallet layer — the last one too — releases on the site only (K-58 item 9 c: its yard nodes
 * cancel with `palletSiteOnly`), so it always takes the BFS of `hasRelease` (D-106, `RULES_VERSION` 6).
 */
export function quickHoldable(s: GameState, id: PieceId, rules?: DragRules): boolean {
  if (pieceZone(s, id) !== Zone.yard || (pieceFlags(s, id) & FLAG_BIT.locked) !== 0) return false;
  if (s.lvl.hasStacks && isPalletLayer(s, id)) return false;
  if (rules?.canPick && !rules.canPick(s, id)) return false;
  const shape = shapeByIndex(pieceShape(s, id));
  const x0 = pieceX(s, id);
  const y0 = pieceY(s, id);
  if (y0 + shape.h + 1 > s.lvl.geo.hy) return false;
  for (let c = 0; c < shape.w; c++) {
    const v = yardOcc(s, x0 + c, y0 + (shape.colTop[c] ?? 0) + 1);
    if (v !== 0 && v !== id + 1) return false;
  }
  return true;
}

/**
 * K-09 (a)–(d) for one piece AND (v3 D1 widening, GDD §16 "K-30 değişikliği") some reachable node is a real release —
 * not a K-07 cancel (start, crane area over the yard, straddle, closed site); (e) the counter is ignored (D1).
 */
export function holdableIgnoringMoves(s: GameState, id: PieceId, rules?: DragRules): boolean {
  if (quickHoldable(s, id, rules)) return true;
  const left = hdr(s, H.movesLeft);
  if (left > 0) return hasRelease(s, id, rules);
  setHdr(s, H.movesLeft, 1);
  try {
    return hasRelease(s, id, rules);
  } finally {
    setHdr(s, H.movesLeft, left);
  }
}

/** The block can be held and some node of R is a non-cancel release (K-07 rows 2, 6, 7). */
function hasRelease(s: GameState, id: PieceId, rules?: DragRules): boolean {
  const attempt = tryBeginDrag(s, id, rules);
  if (!attempt.ok) return false;
  const session = attempt.session;
  for (const n of session.reachableNodes()) if (session.classify(n).kind !== 'cancel') return true;
  return false;
}

/** D1 (K-30): no block on the board can be held by K-09 (a)–(d). */
export function noMoves(s: GameState, rules?: DragRules): boolean {
  const P = s.lvl.layout.counts.pieces;
  const seg = visibleSegment(s);
  for (let id = 0; id < P; id++) {
    const zone = pieceZone(s, id);
    if (zone === Zone.yard || (zone === Zone.site && pieceSeg(s, id) === seg)) {
      if (holdableIgnoringMoves(s, id, rules)) return false;
    }
  }
  return true;
}

/**
 * One drag move gives a correct placement now (K-34 hook 5 reach, TECH §2R.15 summary): the holdable yard block has a
 * reachable site release whose landing is correct (K-16 + K-34) and does not break (S3). The counter must be > 0.
 */
export function hasReachableCorrect(s: GameState, id: PieceId, drag?: DragRules, fall?: FallRules): boolean {
  const attempt = tryBeginDrag(s, id, drag);
  if (!attempt.ok) return false;
  const session = attempt.session;
  const siteX = s.lvl.geo.siteX;
  // without fall rules (no wind, no balloon, no glass) every FREE release of a column lands the same: test the lowest
  const lowest = new Map<number, number>();
  const nodes = session.reachableNodes();
  for (const n of nodes) {
    if (n.ix < siteX) continue;
    const drop = session.classify(n);
    if (drop.kind === 'siteRail') {
      const f = computeFall(s, id, n, { rules: fall });
      if (f.verdict.ok && f.effect.kind === 'none') return true;
    } else if (drop.kind === 'siteFree') {
      if (fall) {
        const f = computeFall(s, id, n, { rules: fall });
        if (f.verdict.ok && f.effect.kind === 'none') return true;
      } else {
        const prev = lowest.get(n.ix);
        if (prev === undefined || n.iy < prev) lowest.set(n.ix, n.iy);
      }
    }
  }
  for (const [ix, iy] of lowest) {
    const f = computeFall(s, id, { ix, iy, mode: 0 });
    if (f.verdict.ok) return true;
  }
  return false;
}

// --- correct spots (K-16 + K-34 without access): K-33 P, K-34 hook 5 `neededNow`, K-37 (b) -------------------------

/**
 * Column heights of segment `seg` (K-34): correctly filled rows from the bottom, empty `.` cells counted as filled.
 * `out[sx]` = local column `sx`.
 */
export function columnHeights(
  s: GameState,
  seg: number,
  out: Int8Array = new Int8Array(s.lvl.geo.ws),
): Int8Array {
  const { ws, hs } = s.lvl.geo;
  const plan = s.lvl.segments[seg];
  for (let sx = 0; sx < ws; sx++) {
    const filled = filledMask(s, seg, sx);
    const dot = plan?.dotMask[sx] ?? 0;
    let h = 0;
    while (h < hs && (((filled | dot) >> h) & 1) === 1) h++;
    out[sx] = h;
  }
  return out;
}

/**
 * Every anchor (board coordinates, visible segment) where a block of `shape` and colour `color` is a correct placement
 * now (K-16 + K-34) on empty cells, access, wall and gaps ignored: each covered column's bottom cell on the column
 * height, every cell a plan cell of the block's colour (`?` resolved). `exclude` = a piece whose own cells count as
 * empty (a debris / stuck block lifted by the crane). Left to right. Empty when every segment is complete.
 */
export function correctSpots(
  s: GameState,
  shape: ShapeDef,
  color: number,
  exclude: PieceId = -1,
  cellColors: readonly number[] | null = null,
): Anchor[] {
  const out: Anchor[] = [];
  const { lvl } = s;
  if (color < 0 || hdr(s, H.deliveryCursor) >= lvl.segments.length) return out;
  const { ws, hs, siteX } = lvl.geo;
  const seg = visibleSegment(s);
  const plan = lvl.segments[seg];
  if (!plan || shape.w > ws) return out;
  const h = columnHeights(s, seg);
  const elev = hdr(s, H.elev);
  const self = exclude + 1;
  for (let x0 = 0; x0 + shape.w <= ws; x0++) {
    const y0 = (h[x0] ?? 0) - (shape.colBottom[0] ?? 0);
    let ok = y0 >= 0;
    for (let j = 0; j < shape.w && ok; j++) {
      if (y0 + (shape.colBottom[j] ?? 0) !== (h[x0 + j] ?? 0) || y0 + (shape.colTop[j] ?? 0) >= hs)
        ok = false;
    }
    for (let i = 0; i < shape.cells.length && ok; i++) {
      const c = shape.cells[i];
      if (!c) continue;
      const sx = x0 + c.x;
      const sy = y0 + c.y;
      // v3 Y9 (K-57): a two-tone block needs each cell's own colour
      const want = cellColors ? (cellColors[i] ?? color) : color;
      if ((plan.planColors[sy * ws + sx] ?? -2) !== want) ok = false;
      else {
        const v = siteOcc(s, seg, sx, sy);
        if (v !== 0 && v !== self) ok = false;
      }
    }
    if (ok) out.push({ ix: siteX + x0, iy: y0 + elev });
  }
  return out;
}

/**
 * GDD K-34 hook 5 `neededNow`: yard material blocks that are not locked and have at least one correct spot on the
 * active (front) segment, access ignored (K-50 item 5 now). Queued blocks never count. Piece id order.
 */
export function neededNow(s: GameState): PieceId[] {
  const out: PieceId[] = [];
  const P = s.lvl.layout.counts.pieces;
  for (let id = 0; id < P; id++) {
    if (pieceZone(s, id) !== Zone.yard || s.lvl.pieces[id]?.cls !== 'material') continue;
    if ((pieceFlags(s, id) & FLAG_BIT.locked) !== 0) continue;
    const cc = s.lvl.pieces[id]?.cellColors ?? null;
    if (correctSpots(s, shapeByIndex(pieceShape(s, id)), pieceColor(s, id), -1, cc).length > 0) out.push(id);
  }
  return out;
}

// --- D2 ------------------------------------------------------------------------------------------------------------

/** D2 (K-30): the first colour index whose remaining supply ≠ remaining demand; −1 when balanced. */
export function colorImbalance(s: GameState): number {
  const sup = remainingSupplyByColor(s);
  const dem = remainingDemandByColor(s);
  for (let c = 0; c < COLOR_CODES.length; c++) if ((sup[c] ?? 0) !== (dem[c] ?? 0)) return c;
  return -1;
}

// --- D3a -----------------------------------------------------------------------------------------------------------

const MEMO_SLOTS = 4096;
const MEMO_MASK = MEMO_SLOTS - 1;
/** Inserts stop at 3/4 load: the memo only prunes, so a full table costs time, never correctness. */
const MEMO_LIMIT = (MEMO_SLOTS * 3) >> 2;
const memoLo = new Int32Array(MEMO_SLOTS);
const memoHi = new Int32Array(MEMO_SLOTS);
const memoGen = new Int32Array(MEMO_SLOTS);
let memoGeneration = 0;
let memoUsed = 0;
const TWO32 = 4294967296;
const EXACT_LIMIT = 2 ** 52;

class BudgetExhausted extends Error {}
const BUDGET = new BudgetExhausted('d3a budget');

/** Counters of the last `tileRemaining` call (bench, `levels:solve` `d3aMaxExpansions`). */
export const D3A_STATS = { expansions: 0 };

interface TileClass {
  readonly shape: ShapeDef;
  readonly colorMask: number;
  /** v3 Y9 (K-57): colour bit per shape cell of a two-tone class (no W6 joker: a paint gate does not paint it); null = `colorMask` for every cell. */
  readonly cellMasks: readonly number[] | null;
  /** Segment index from which the class may be used (batch availability). */
  readonly from: number;
  count: number;
}

/**
 * `tileRemaining(state, budget)` — GDD K-30 D3a (TECH §2R.4): can the remaining material blocks exactly cover every
 * remaining plan cell, building each column bottom-up (K-34), segments in order (`segments`; `carousel`: every
 * incomplete segment, same pool), undelivered batch k only on segments ≥ its `forSegment`, W6 jokers? Access ignored.
 */
export function tileRemaining(s: GameState, budget: number = D3A_MAX_EXPANSIONS): TileResult {
  const { lvl } = s;
  const { ws, hs, segCells } = lvl.geo;
  D3A_STATS.expansions = 0;

  // segments to fill
  const segs: number[] = [];
  if (lvl.mode === 'carousel') {
    for (let k = 0; k < lvl.segments.length; k++) if (!segmentFull(s, k)) segs.push(k);
  } else {
    for (let k = hdr(s, H.activeSeg); k < lvl.segments.length; k++) if (!segmentFull(s, k)) segs.push(k);
  }

  // plan colour bits and start profiles
  const planBit = new Int32Array(Math.max(1, lvl.segments.length * segCells));
  const dotBit = new Int32Array(Math.max(1, lvl.segments.length * segCells));
  // per segment and column: rows up to the top plan cell (a short pre-2R plan leaves outside cells above it)
  const limit = new Int8Array(Math.max(1, lvl.segments.length * ws));
  let cells = 0;
  lvl.segments.forEach((plan, k) => {
    for (let i = 0; i < segCells; i++) {
      const c = plan.planColors[i] ?? -2;
      if (c >= 0) planBit[k * segCells + i] = 1 << c;
      else if (c === PLAN_DOT) dotBit[k * segCells + i] = 1;
      if (c >= 0 || c === PLAN_DOT) {
        const x = i % ws;
        limit[k * ws + x] = Math.max(limit[k * ws + x] ?? 0, Math.floor(i / ws) + 1);
      }
    }
  });
  const startProfile: Int8Array[] = [];
  for (const k of segs) {
    const prof = new Int8Array(ws);
    for (let sx = 0; sx < ws; sx++) {
      const filled = filledMask(s, k, sx);
      let h = 0;
      while (h < hs && (((filled >> h) & 1) === 1 || dotBit[k * segCells + h * ws + sx] === 1)) h++;
      prof[sx] = h;
      for (let y = h; y < hs; y++) {
        const i = k * segCells + y * ws + sx;
        if ((planBit[i] ?? 0) !== 0 && ((filled >> y) & 1) === 0) cells++;
      }
    }
    startProfile.push(prof);
  }

  // classes (shape, colour set, availability) of the remaining material blocks
  const jokers = paintJokers(lvl);
  const byKey = new Map<string, TileClass>();
  let supplyCells = 0;
  const P = lvl.layout.counts.pieces;
  for (let id = 0; id < P; id++) {
    if (!isRemainingSupply(s, id)) continue;
    const shape = shapeByIndex(pieceShape(s, id));
    const color = pieceColor(s, id);
    const cc = lvl.pieces[id]?.cellColors ?? null;
    let mask = color >= 0 ? 1 << color : 0;
    if (!cc) for (const j of jokers) if (shape.h <= j.size) mask |= 1 << j.color;
    const cellMasks = cc ? shape.cells.map((_, i) => 1 << pieceCellColor(s, id, i)) : null;
    const from = lvl.mode === 'segments' && pieceZone(s, id) === Zone.pending ? batchFrom(lvl, id) : 0;
    const key = `${shape.index}:${mask}:${from}:${cellMasks ? cellMasks.join('.') : ''}`;
    const cls = byKey.get(key);
    if (cls) cls.count += 1;
    else byKey.set(key, { shape, colorMask: mask, cellMasks, from, count: 1 });
    supplyCells += shape.cellCount;
  }
  if (supplyCells !== cells) return 'dead';
  if (cells === 0) return 'ok';
  const classes = [...byKey.values()].sort(
    (a, b) =>
      a.shape.index - b.shape.index ||
      a.colorMask - b.colorMask ||
      a.from - b.from ||
      (a.cellMasks ?? []).join('.').localeCompare((b.cellMasks ?? []).join('.')),
  );

  // numeric memo key radices
  const radixH = hs + 1;
  let profRadix = 1;
  for (let i = 0; i < ws; i++) profRadix *= radixH;
  const countRadix: number[] = classes.map((c) => c.count + 1);
  let total = (segs.length + 1) * profRadix;
  for (const r of countRadix) total *= r;
  const exact = total < EXACT_LIMIT;

  memoGeneration = (memoGeneration + 1) | 0;
  if (memoGeneration === 0) {
    memoGen.fill(0);
    memoGeneration = 1;
  }
  memoUsed = 0;

  const prof = new Int8Array(ws);
  let segPos = 0;
  let expansions = 0;

  const keyOf = (): readonly [number, number] => {
    if (exact) {
      let k = segPos;
      for (let i = 0; i < ws; i++) k = k * radixH + (prof[i] ?? 0);
      for (let i = 0; i < classes.length; i++) k = k * (countRadix[i] ?? 1) + (classes[i]?.count ?? 0);
      return [(k % TWO32) | 0, Math.floor(k / TWO32) | 0];
    }
    let a = 0x9e3779b9 ^ segPos;
    let b = 0x85ebca6b ^ segPos;
    const mix = (v: number): void => {
      a = Math.imul(a ^ v, 0x01000193);
      b = Math.imul(b ^ (v + 0x6b), 0x5bd1e995);
    };
    for (let i = 0; i < ws; i++) mix(prof[i] ?? 0);
    for (const c of classes) mix(c.count);
    return [a | 0, b | 0];
  };
  const slotOf = (lo: number, hi: number): number =>
    (Math.imul(lo ^ Math.imul(hi, 0x27d4eb2d), 0x9e3779b1) >>> 20) & MEMO_MASK;
  const memoHas = (lo: number, hi: number): boolean => {
    for (let i = slotOf(lo, hi), n = 0; n < MEMO_SLOTS; i = (i + 1) & MEMO_MASK, n++) {
      if (memoGen[i] !== memoGeneration) return false;
      if (memoLo[i] === lo && memoHi[i] === hi) return true;
    }
    return false;
  };
  const memoAdd = (lo: number, hi: number): void => {
    if (memoUsed >= MEMO_LIMIT) return;
    for (let i = slotOf(lo, hi), n = 0; n < MEMO_SLOTS; i = (i + 1) & MEMO_MASK, n++) {
      if (memoGen[i] !== memoGeneration) {
        memoGen[i] = memoGeneration;
        memoLo[i] = lo;
        memoHi[i] = hi;
        memoUsed++;
        return;
      }
    }
  };

  const seg = (): number => segs[segPos] ?? -1;
  /** Raises column `x` over empty `.` cells (K-34: an empty dot counts as filled). */
  const skipDots = (x: number): void => {
    const base = seg() * segCells;
    let h = prof[x] ?? 0;
    while (h < hs && dotBit[base + h * ws + x] === 1) h++;
    prof[x] = h;
  };
  const segmentDone = (): boolean => {
    const base = seg() * ws;
    for (let x = 0; x < ws; x++) if ((prof[x] ?? 0) < (limit[base + x] ?? 0)) return false;
    return true;
  };

  const solve = (): boolean => {
    if (++expansions > budget) throw BUDGET;
    if (segmentDone()) {
      if (segPos + 1 >= segs.length) return classes.every((c) => c.count === 0);
      const saved = prof.slice();
      segPos++;
      prof.set(startProfile[segPos] ?? saved);
      const ok = solve();
      segPos--;
      prof.set(saved);
      return ok;
    }
    const [lo, hi] = keyOf();
    if (memoHas(lo, hi)) return false;
    const k = seg();
    const base = k * segCells;
    for (const cls of classes) {
      if (cls.count === 0 || cls.from > k) continue;
      const sh = cls.shape;
      for (let x0 = 0; x0 + sh.w <= ws; x0++) {
        const y0 = (prof[x0] ?? 0) - (sh.colBottom[0] ?? 0);
        let fits = true;
        for (let j = 0; j < sh.w && fits; j++) {
          if (y0 + (sh.colBottom[j] ?? 0) !== (prof[x0 + j] ?? 0)) fits = false;
          else if (y0 + (sh.colTop[j] ?? 0) >= hs) fits = false;
        }
        if (!fits) continue;
        for (let ci = 0; ci < sh.cells.length; ci++) {
          const c = sh.cells[ci] as (typeof sh.cells)[number];
          const want = cls.cellMasks ? (cls.cellMasks[ci] ?? 0) : cls.colorMask;
          if (((planBit[base + (y0 + c.y) * ws + x0 + c.x] ?? 0) & want) === 0) {
            fits = false;
            break;
          }
        }
        if (!fits) continue;
        const saved = prof.slice(x0, x0 + sh.w);
        for (let j = 0; j < sh.w; j++) {
          prof[x0 + j] = y0 + (sh.colTop[j] ?? 0) + 1;
          skipDots(x0 + j);
        }
        cls.count--;
        const ok = solve();
        cls.count++;
        prof.set(saved, x0);
        if (ok) return true;
      }
    }
    memoAdd(lo, hi);
    return false;
  };

  if (segs.length === 0) return classes.length === 0 ? 'ok' : 'dead';
  prof.set(startProfile[0] ?? prof);
  try {
    return solve() ? 'ok' : 'dead';
  } catch (e) {
    if (e === BUDGET) return 'unknown';
    throw e;
  } finally {
    D3A_STATS.expansions = Math.min(expansions, budget);
  }
}

function segmentFull(s: GameState, k: number): boolean {
  const plan = s.lvl.segments[k];
  if (!plan) return true;
  for (let sx = 0; sx < s.lvl.geo.ws; sx++) {
    const need = plan.planMask[sx] ?? 0;
    if ((filledMask(s, k, sx) & need) !== need) return false;
  }
  return true;
}

function batchFrom(lvl: CompiledLevel, id: PieceId): number {
  const p = lvl.pieces[id];
  return p && p.batch >= 1 ? (lvl.batches[p.batch]?.forSegment ?? p.batch) : 0;
}

/** W6 joker colours: a block whose box height ≤ a paint gate's size may take that gate's colour (K-30 D3a). */
function paintJokers(lvl: CompiledLevel): { readonly size: number; readonly color: number }[] {
  const out: { size: number; color: number }[] = [];
  for (const g of lvl.gaps) {
    if (g.type !== 'paint' || g.color === null) continue;
    out.push({ size: g.size, color: COLOR_CODES.indexOf(g.color) });
  }
  return out;
}

// --- D3b -----------------------------------------------------------------------------------------------------------

/** The solver's dead-state table of a level (TECH §2R.4 D3b; export and loader: Faz 3, cut 1). */
export interface DeadTable {
  /** The solver explored the whole space. */
  readonly complete: boolean;
  /** `lo` / `hi` = the state's 64-bit Zobrist lanes (`hashState` [0] / [1]). */
  has(lo: number, hi: number): boolean;
}

/** `src/generated/deadlock/level_NNN.json` (TECH §2R.4). */
export interface DeadTableJson {
  readonly levelHash: string;
  readonly rulesVersion: number;
  readonly solverVersion?: number;
  readonly complete: boolean;
  /** Sorted 64-bit values (`hi · 2³² + lo`, unsigned), each as 16 hex digits (hi first). */
  readonly entries: readonly string[];
}

/**
 * A table for the level (binary search, ≤ 0.05 ms), or null when it does not belong to this level data / rules version
 * (GDD K-30: an unknown table is ignored; the caller warns in development).
 */
export function deadTableFromJson(
  json: DeadTableJson,
  expect: { readonly levelHash: string; readonly rulesVersion: number },
): DeadTable | null {
  if (json.levelHash !== expect.levelHash || json.rulesVersion !== expect.rulesVersion) return null;
  const n = json.entries.length;
  const his = new Uint32Array(n);
  const los = new Uint32Array(n);
  json.entries.forEach((e, i) => {
    his[i] = Number.parseInt(e.slice(0, 8), 16) >>> 0;
    los[i] = Number.parseInt(e.slice(8, 16), 16) >>> 0;
  });
  return Object.freeze({
    complete: json.complete,
    has(lo: number, hi: number): boolean {
      const l = lo >>> 0;
      const h = hi >>> 0;
      let a = 0;
      let b = n - 1;
      while (a <= b) {
        const m = (a + b) >> 1;
        const mh = his[m] ?? 0;
        const ml = los[m] ?? 0;
        if (mh === h && ml === l) return true;
        if (mh < h || (mh === h && ml < l)) a = m + 1;
        else b = m - 1;
      }
      return false;
    },
  });
}

// --- detection -----------------------------------------------------------------------------------------------------

export interface DeadlockContext {
  /** D3b table; null = none (Faz 2R, cut 1). */
  readonly table: DeadTable | null;
  /** Run D3a (the action placed, delivered, used a booster or a trowel). Default true. */
  readonly tiling?: boolean;
}

/** D2 → D3a → D3b (K-30): the first cause that holds, or null. Full-cover levels only (else null). */
export function detectDeadlock(s: GameState, ctx: DeadlockContext): TeardownCause | null {
  if (!isFullCover(s.lvl)) return null;
  if (!hasPaintGates(s.lvl) && colorImbalance(s) >= 0) return 'color';
  if (ctx.tiling !== false && tileRemaining(s) === 'dead') return 'tiling';
  if (ctx.table) {
    const h = hashState(s);
    if (ctx.table.has(h[0] ?? 0, h[1] ?? 0)) return 'access';
  }
  return null;
}

/** K-33 / K-37 / K-38 pre-check (CL-2R-05): the result state of a booster target is not a D3a dead end. */
export function precheckOk(s: GameState): boolean {
  return !isFullCover(s.lvl) || tileRemaining(s) !== 'dead';
}

// --- K-35 step 12 ------------------------------------------------------------------------------------------------

export interface Step12Options {
  /**
   * The buffer before the action (Söküm target). For an accepted +5 offer: the start buffer of the last action before
   * the window (K-29, D1 Söküm); null = no Söküm possible (step 12 off, or no earlier action).
   */
  readonly preAction: Int32Array | null;
  /** Run D3a: the action placed correctly, delivered, used a booster or the Golden Trowel. */
  readonly tiling: boolean;
  /** The counter is 0: D1 does not run (K-30, E-58). */
  readonly counterZero: boolean;
  /** D3b table; null in Faz 2R (cut 1). */
  readonly table: DeadTable | null;
  /** An accepted +5 offer (K-29, E-42): D1 once, nothing else. */
  readonly afterOffer?: boolean;
}

/**
 * K-35 step 12 (GDD K-30): counter > 0 → D1 (lift chains / wetness, still D1 → Söküm `access`) → D2 → D3a → D3b;
 * counter 0 → D2 → D3; after a +5 offer → D1 once (its Söküm goes back to the start of the last action, K-29). D1 / D2
 * / D3 → Söküm (`teardown`, the action's last event); after a Söküm nothing else runs (the restored state passed its
 * own step 12). Returns the Söküm cause or null.
 */
export function runStep12(ctx: RuleContext, hooks: MoveHooks, o: Step12Options): TeardownCause | null {
  const s = ctx.s;
  let helped = false;
  if (!o.counterZero) {
    const d1 = d1Help(ctx, hooks);
    if (d1 === 'stuck') {
      if (o.preAction === null) return null;
      ctx.emit(teardown(s, o.preAction, 'access'));
      return 'access';
    }
    helped = d1 === 'freed';
  }
  // after an offer there is no new action: the state passed D2 / D3 at the end of the action before the window
  if (o.afterOffer) return null;
  const cause = detectDeadlock(s, { table: o.table, tiling: o.tiling || helped });
  if (cause === null || o.preAction === null) return null;
  ctx.emit(teardown(s, o.preAction, cause));
  return cause;
}

/**
 * D1 (K-30, `RULES_VERSION` 3): `none` = some block is holdable; otherwise `deadlockDetected{noMoves}` and the rules
 * lift chains / wetness (`truckHelp{unchain}`): `freed` when a block became holdable, `stuck` when the state is still D1
 * (the caller tears the action down, cause `access`; no reshuffle, K-55 item 8).
 */
function d1Help(ctx: RuleContext, hooks: MoveHooks): 'none' | 'freed' | 'stuck' {
  const s = ctx.s;
  if (!noMoves(s, hooks.drag)) return 'none';
  ctx.emit({ t: 'deadlockDetected', reason: 'noMoves' });
  if (hooks.onTruckHelp) {
    const pre = s.buf.slice();
    const events: GameEventBody[] = [];
    const sub: RuleContext = { ...ctx, emit: (e) => events.push(e) };
    if (hooks.onTruckHelp(sub) === true) {
      for (const e of events) ctx.emit(e);
      ctx.emit({ t: 'truckHelp', kind: 'unchain' });
    } else s.buf.set(pre);
  }
  return noMoves(s, hooks.drag) ? 'stuck' : 'freed';
}

// --- Söküm ---------------------------------------------------------------------------------------------------------

/**
 * K-30 Söküm: back to `preAction` in one step; the counter and `movesSpent` keep their post-action values, `c = 0`.
 * Returns the `teardown` event body (the caller emits it last).
 */
export function teardown(
  s: GameState,
  preAction: Int32Array,
  cause: TeardownCause,
): Extract<GameEventBody, { t: 'teardown' }> {
  const post = s.buf.slice();
  const movesLeft = hdr(s, H.movesLeft);
  const spent = hdr(s, H.movesSpent);
  s.buf.set(preAction);
  setHdr(s, H.movesLeft, movesLeft);
  setHdr(s, H.movesSpent, spent);
  setHdr(s, H.combo, 0);
  return { t: 'teardown', toTurn: hdr(s, H.turn), pieces: teardownMoves(s, post), cause };
}

/** Blocks whose place, shape or colour differ between `post` and the restored state; site-locked ones first. */
function teardownMoves(s: GameState, post: Int32Array): TeardownMove[] {
  const P = s.lvl.layout.counts.pieces;
  const postState: GameState = { lvl: s.lvl, buf: post };
  const moves: { readonly m: TeardownMove; readonly locked: boolean }[] = [];
  const fields = [PF.zone, PF.x, PF.y, PF.seg, PF.shape, PF.color] as const;
  for (let id = 0; id < P; id++) {
    const base = s.lvl.layout.pieces + id * PIECE_STRIDE;
    if (fields.every((f) => post[base + f] === s.buf[base + f])) continue;
    moves.push({
      m: { pieceId: id, from: placeOf(postState, id), to: placeOf(s, id) },
      locked: pieceZone(postState, id) === Zone.site && (pieceFlags(postState, id) & FLAG_BIT.locked) !== 0,
    });
  }
  return moves
    .sort((a, b) => Number(b.locked) - Number(a.locked) || a.m.pieceId - b.m.pieceId)
    .map((x) => x.m);
}

function placeOf(s: GameState, id: PieceId): TeardownPlace {
  const zone = pieceZone(s, id);
  if (zone === Zone.yard) return { zone: 'yard', x: pieceX(s, id), y: pieceY(s, id) };
  if (zone === Zone.site)
    return { zone: 'site', x: pieceX(s, id), y: pieceY(s, id) + hdr(s, H.elev), seg: pieceSeg(s, id) };
  return zone === Zone.queue ? 'queue' : zone === Zone.pending ? 'pending' : 'gone';
}
