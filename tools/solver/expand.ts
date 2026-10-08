/**
 * Exact move generation of the solver (docs/TECH_DESIGN.md §2R.5 "Hamle üretimi"; GDD K-50 items 1, 9). No pruning: for
 * every holdable block ONE core drag BFS (`tryBeginDrag`, K-08, K-09) gives the reachable release nodes R, and every
 * node is sorted by the core's K-07 release table (`DragSession.classify`):
 *
 * 1. yard (K-07 row 2, K-10): a shift move ("kaydırma"), every node of R (hanging positions included: K-50 item 9c);
 * 2. site FREE (row 6): the landing of a FREE release depends only on the column unless a fall rule (W8 wind, S8
 *    balloon, S3 glass) or G-L applies, so one representative per column (its lowest release) is tried; with fall rules
 *    every node is tried;
 * 3. site RAIL (row 7): every node;
 * 4. W6 paint gates: every release again with `via` = a paint gate whose rail is on the reach.
 * A site release is a solution move only when it is a correct placement (K-16 + K-34, `computeFall` verdict, no S3
 * break). Wrong placements change nothing but the counter, so they are generated only where the board can change
 * (timed mechanics or a placement rule such as Y8): kind `wait`. Cancels (rows 1, 3, 4, 5) are never moves.
 *
 * Every move runs through the core (`applyMove` with `noTruckHelp`: K-35 step 12 off, K-30 / TECH §9.1) — except the
 * fast yard path: on a level without neighbour effects (Y1–Y3 hooks), yard gravity (Y6), bags, balloons, hidden items,
 * timers, move-cost or yard-release rules, and with an empty truck queue, a yard → yard move only moves the block
 * (`movePiece`, the core's own step 1) and the hash changes by two Zobrist terms. The test "K-50 fast yard path equals
 * applyMove" pins buffer and hash equality on random moves.
 *
 * States are normalised after every move: the counter is `SOLVER_MOVES` (K-50: no move limit), streak, trowels and
 * statistics counters are 0, and on a level without step-10 timers `m` is 0 (no rule reads it there). None of these
 * fields is hashed (core/hash.ts), so normalising only makes equal states equal byte for byte.
 */
import { COLOR_CODES, Zone } from '../../src/core/types.ts';
import type { Anchor, DragNode, Move, PieceId } from '../../src/core/types.ts';
import { FLAG_BIT, H, PF, PIECE_STRIDE } from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import { NULL_SINK, applyMove } from '../../src/core/moves.ts';
import type { MoveHooks } from '../../src/core/moves.ts';
import { FREE, isSiteClosed, railMode, tryBeginDrag } from '../../src/core/movement.ts';
import type { DragSession } from '../../src/core/movement.ts';
import { computeFall } from '../../src/core/gravity.ts';
import { movePiece, yardPlace } from '../../src/core/placement.ts';
import { hashState, piecePosition } from '../../src/core/hash.ts';
import { fmix32 } from '../../src/core/rng.ts';
import { shapeByIndex } from '../../src/core/shapes.ts';
import { collisionMasks, visibleSegment } from '../../src/core/grid.ts';
import { MAX_COLS, MAX_ROWS } from '../../src/core/geometry.ts';
import { GAP_STRIDE, GF } from '../../src/core/state.ts';

/** Edge kinds, in the K-50 item 4 order: over the wall < rail < shift; `wait` = a board-changing wrong placement. */
export const KIND_OVERWALL = 0;
export const KIND_RAIL = 1;
export const KIND_SHIFT = 2;
export const KIND_WAIT = 3;
export type EdgeKind = 0 | 1 | 2 | 3;
export const KIND_NAMES = ['overWall', 'rail', 'shift', 'wait'] as const;

/** Edge info byte: kind (bits 0–1) · W6 paint gate passed (bit 2) · move cost 1–3 (bits 3–4, K-07). */
export function edgeInfo(kind: EdgeKind, cost: number, paint: boolean): number {
  return kind | (paint ? 4 : 0) | (Math.min(3, Math.max(1, cost)) << 3);
}
export const infoKind = (info: number): EdgeKind => (info & 3) as EdgeKind;
export const infoCost = (info: number): number => (info >> 3) & 3;
export const infoPaint = (info: number): boolean => (info & 4) !== 0;
/** A correct placement (K-50 item 1 "yerleşim hamlesi"). */
export const isPlacementInfo = (info: number): boolean => (info & 3) <= KIND_RAIL;
/** A shift (K-50 item 1 "kaydırma hamlesi", K-07 row 2). */
export const isShiftInfo = (info: number): boolean => (info & 3) === KIND_SHIFT;

const FAST_INFO = edgeInfo(KIND_SHIFT, 1, false);
const DX = [-1, 1, 0, 0];
/** Drop classes of a reach entry (K-07 rows): 0 cancel, 1 yard (row 2), 2 site FREE (row 6), 3 site RAIL (row 7). */
const DROP_CANCEL = 0;
const DROP_YARD = 1;
const DROP_FREE = 2;
const DROP_RAIL = 3;
/** Node codes per mode (the 8 × 10 frame, = movement.ts `NODES_PER_MODE`). */
const NODES = MAX_COLS * MAX_ROWS;
/** Reach-cache entries kept at most (memory bound; the cache is cleared beyond it). */
const REACH_CACHE_LIMIT = 1_500_000;

/**
 * The reachable set R of one drag BFS and the K-07 drop class of every node (core `DragSession`), in node-code order.
 * `start` = the FREE start code of the session that built it (its class is stored as `yard`, see `Expander.reachOf`).
 */
interface Reach {
  readonly start: number;
  readonly codes: Int16Array;
  readonly drops: Uint8Array;
  /** Exact environment bytes of a cached entry (null when not cached). */
  readonly env: Uint8Array | null;
}
const DY = [0, 0, -1, 1];

/** Counter value of every explored state (K-50: the metrics are computed without a move limit). */
export const SOLVER_MOVES = 1_000_000;

/** The level runs step-10 timers (W4, W5, S5, S6, Y4, K-40): `m` matters and is kept. */
export function isTimed(lvl: CompiledLevel): boolean {
  return lvl.step10.length > 0;
}

/** Normalises the counters no rule of this level reads (see the module comment). */
export function normalizeState(s: GameState): void {
  const b = s.buf;
  b[H.movesLeft] = SOLVER_MOVES;
  if (!isTimed(s.lvl)) b[H.turn] = 0;
  b[H.combo] = 0;
  b[H.trowels] = 0;
  b[H.wrongCount] = 0;
  b[H.overWallCount] = 0;
  b[H.railCount] = 0;
  b[H.movesSpent] = 0;
}

/** Called once per generated move: the successor's hash, the edge info; details on the expander (`last*`). */
export type SuccessorCallback = (lo: number, hi: number, info: number) => void;

// --- Zobrist terms of one piece position (same mixing as core/hash.ts; equality pinned by the fast-path test) -----

const MUL0 = 0x9e3779b1;
const MUL1 = 0x85ebca77;

function pieceClassBits(buf: Int32Array, base: number): number {
  return (
    ((buf[base + PF.shape] ?? 0) & 63) |
    (((buf[base + PF.color] ?? 0) & 7) << 6) |
    (((buf[base + PF.flags] ?? 0) & 255) << 9) |
    (((buf[base + PF.counter] ?? 0) & 255) << 17)
  );
}

/** Which rule hooks or level features make a yard move more than "move the block". */
export function fastYardBlockers(lvl: CompiledLevel, hooks: MoveHooks): string[] {
  const out: string[] = [];
  if (hooks.onNeighborMoved) out.push('neighbour effects');
  if (hooks.afterNeighbors) out.push('afterNeighbors');
  if (hooks.onYardRelease) out.push('yard release rule');
  if (hooks.moveCost) out.push('move cost rule');
  if (hooks.onCellUncovered || lvl.hiddenItems.length > 0) out.push('hidden items');
  if (hooks.onPassGap) out.push('pass-gap rule');
  if (lvl.gravity.yard) out.push('yard gravity');
  if (lvl.obstacles.some((o) => o.type === 'cement_bag')) out.push('cement bags');
  if (lvl.pieces.some((p) => (p.flags & FLAG_BIT.balloon) !== 0)) out.push('balloons');
  if (isTimed(lvl)) out.push('timers');
  return out;
}

/**
 * Generates the successors of one state. One instance per exploration (it owns a scratch state); not re-entrant: the
 * callback must not call `expand` again, but may call `materialize()` for the successor it was called with.
 */
export class Expander {
  readonly lvl: CompiledLevel;
  readonly hooks: MoveHooks;
  /** Level-level condition of the fast yard path (the queue condition is per state). */
  readonly fastYardLevel: boolean;
  /** Every FREE site release is tried (fall rules or G-L); otherwise the lowest release per column. */
  readonly exhaustiveFree: boolean;
  /** Wrong placements can change the board (timers, placement rule): generated as `wait` edges. */
  readonly waitMoves: boolean;
  readonly paintGates: readonly number[];
  /** Rules the generator does not model (reported): G-L steering inputs. */
  readonly unsupported: readonly string[];

  // --- details of the last successor (read in the callback; numbers, so the hot path allocates nothing) ---
  lastPiece: PieceId = -1;
  /** Release node of the last move. */
  lastIx = 0;
  lastIy = 0;
  lastMode = FREE;
  lastVia: number | undefined = undefined;
  /** Start anchor (board coordinates; site pieces: plan row + elevator offset). */
  lastFromX = 0;
  lastFromY = 0;
  /** Landing anchor (board coordinates). */
  lastToX = 0;
  lastToY = 0;
  /** The successor came through `applyMove` (a placement, a delivery, a slow yard move): D3a may change. */
  lastSlow = false;

  readonly stats = { sessions: 0, applyMoves: 0, fastMoves: 0, reachHits: 0 };

  private readonly tmp: GameState;
  private readonly hashOut = new Uint32Array(2);
  /** Mutable probe node of the R scan (never stored). */
  private readonly probe: { ix: number; iy: number; mode: number } = { ix: 0, iy: 0, mode: FREE };
  private cur: GameState | null = null;
  private pendingFast = false;
  private materialized = false;
  /**
   * Reach cache (null = off): (shape, collision rows without the block, gap states, site closed) → the components of R
   * met so far. A drag graph's edges are two-way, so every start inside one component has the same R; only K-07 row 1
   * (the start itself) moves with the start (see `reachOf`).
   */
  private readonly reachCache: Map<number, Reach[]> | null;
  private reachEntries = 0;
  private readonly masks = new Uint8Array(MAX_ROWS);
  /** Environment bytes of the reach-cache key (exact copy kept in the entry; the number key is only a hash). */
  private readonly env: Uint8Array;

  constructor(lvl: CompiledLevel, hooks: MoveHooks, opts: { readonly reachCache?: boolean } = {}) {
    this.lvl = lvl;
    this.hooks = hooks;
    this.fastYardLevel = fastYardBlockers(lvl, hooks).length === 0;
    this.exhaustiveFree =
      hooks.fall?.modifyFall !== undefined || hooks.fall?.onLanded !== undefined || lvl.gravity.steerable;
    this.waitMoves = isTimed(lvl) || hooks.placement !== undefined;
    this.paintGates = lvl.gaps.filter((g) => g.type === 'paint').map((g) => g.index);
    this.unsupported = lvl.gravity.steerable ? ['G-L steer inputs (K-19) are not generated'] : [];
    this.tmp = { lvl, buf: new Int32Array(lvl.layout.size) };
    const d = hooks.drag;
    const cacheable =
      opts.reachCache !== false &&
      d?.canPick === undefined &&
      d?.canPassGap === undefined &&
      d?.siteClosed === undefined &&
      this.paintGates.length === 0;
    this.reachCache = cacheable ? new Map() : null;
    this.env = new Uint8Array(2 + lvl.geo.rows + lvl.gaps.length);
  }

  /**
   * Every move of state `s` (hash `lo`, `hi`), in a fixed order: piece id, then the release node code (FREE, RAIL(0) …;
   * y; x), then the paint-gate variants. Duplicate successors are reported as they come (the caller merges them).
   */
  expand(s: GameState, lo: number, hi: number, cb: SuccessorCallback): void {
    this.cur = s;
    const buf = s.buf;
    const { lvl } = this;
    const P = lvl.layout.counts.pieces;
    const seg = visibleSegment(s);
    const fastState = this.fastYardLevel && (buf[H.queueLen] ?? 0) === 0;
    const z = lvl.zobrist;
    for (let id = 0; id < P; id++) {
      const base = lvl.layout.pieces + id * PIECE_STRIDE;
      const zone = buf[base + PF.zone] ?? 0;
      if (zone === Zone.site) {
        if ((buf[base + PF.seg] ?? 0) !== seg || ((buf[base + PF.flags] ?? 0) & FLAG_BIT.locked) !== 0)
          continue;
      } else if (zone !== Zone.yard) continue;
      else if (!this.mayMove(buf, base)) continue;
      const got = this.reachOf(s, id, zone);
      if (!got) continue;
      const { reach, session } = got;
      const fx = buf[base + PF.x] ?? 0;
      const fy = (buf[base + PF.y] ?? 0) + (zone === Zone.site ? (buf[H.elev] ?? 0) : 0);
      this.lastPiece = id;
      this.lastVia = undefined;
      this.lastFromX = fx;
      this.lastFromY = fy;
      const lowest: number[] = [];
      const cls = pieceClassBits(buf, base);
      const oldPos = zone === Zone.yard ? piecePosition(lvl.geo.siteX, Zone.yard, fx, fy, -1) : -1;
      const oldLo = oldPos >= 0 ? fmix32(Math.imul(cls, MUL0) ^ (z.pos0[oldPos] ?? 0)) : 0;
      const oldHi = oldPos >= 0 ? fmix32(Math.imul(cls, MUL1) ^ (z.pos1[oldPos] ?? 0)) : 0;
      // R in node-code order (FREE, RAIL(0) …; y; x), the drop class from the core session (K-07)
      const probe = this.probe;
      const startCode = fy * MAX_COLS + fx;
      const codes = reach.codes;
      for (let k = 0; k < codes.length; k++) {
        const code = codes[k] ?? 0;
        if (code === startCode) continue; // K-07 row 1: the start itself cancels
        const drop = code === reach.start ? DROP_YARD : (reach.drops[k] ?? DROP_CANCEL);
        if (drop === DROP_CANCEL) continue;
        const mode = Math.floor(code / NODES);
        const rest = code - mode * NODES;
        const ix = rest % MAX_COLS;
        const iy = (rest - ix) / MAX_COLS;
        probe.ix = ix;
        probe.iy = iy;
        probe.mode = mode;
        if (drop === DROP_YARD) {
          if (fastState && zone === Zone.yard) {
            const pos = piecePosition(lvl.geo.siteX, Zone.yard, ix, iy, -1);
            const nlo = (lo ^ oldLo ^ fmix32(Math.imul(cls, MUL0) ^ (z.pos0[pos] ?? 0))) >>> 0;
            const nhi = (hi ^ oldHi ^ fmix32(Math.imul(cls, MUL1) ^ (z.pos1[pos] ?? 0))) >>> 0;
            this.pendingFast = true;
            this.materialized = false;
            this.lastIx = ix;
            this.lastIy = iy;
            this.lastMode = mode;
            this.lastToX = ix;
            this.lastToY = iy;
            this.lastSlow = false;
            this.stats.fastMoves++;
            cb(nlo, nhi, FAST_INFO);
          } else {
            this.slowMove(id, probe, undefined, KIND_SHIFT, null, lo, hi, cb);
          }
        } else if (drop === DROP_FREE) {
          if (this.exhaustiveFree) this.siteRelease(id, probe, undefined, lo, hi, cb);
          else {
            const prev = lowest[ix];
            if (prev === undefined || iy < prev) lowest[ix] = iy;
          }
        } else {
          this.siteRelease(id, probe, undefined, lo, hi, cb);
        }
      }
      if (!this.exhaustiveFree) {
        for (let ix = 0; ix < lowest.length; ix++) {
          const iy = lowest[ix];
          if (iy !== undefined) this.siteRelease(id, { ix, iy, mode: FREE }, undefined, lo, hi, cb);
        }
      }
      if (this.paintGates.length > 0 && session)
        this.paintVariants(session, id, session.reachableNodes(), lo, hi, cb);
    }
    this.cur = null;
  }

  /** The successor state of the last callback (scratch: valid until the next move is generated). */
  materialize(): GameState {
    const tmp = this.tmp;
    if (this.pendingFast && !this.materialized) {
      const cur = this.cur;
      if (!cur) throw new Error('materialize: no expansion in progress');
      tmp.buf.set(cur.buf);
      movePiece(tmp, this.lastPiece, yardPlace({ ix: this.lastIx, iy: this.lastIy }));
      normalizeState(tmp);
      this.materialized = true;
    }
    return tmp;
  }

  /** The move record of the last successor (a fresh object). */
  lastMove(): Extract<Move, { kind: 'drag' }> {
    return {
      kind: 'drag',
      pieceId: this.lastPiece,
      to: { ix: this.lastIx, iy: this.lastIy, mode: this.lastMode },
      ...(this.lastVia !== undefined ? { via: this.lastVia } : {}),
    };
  }

  /** Colour code of the last moved piece in the expanded state. */
  lastColor(): string {
    const cur = this.cur;
    if (!cur) return '?';
    const c = cur.buf[this.lvl.layout.pieces + this.lastPiece * PIECE_STRIDE + PF.color] ?? -1;
    return c >= 0 ? (COLOR_CODES[c] ?? '?') : '-';
  }

  // --- internals -------------------------------------------------------------------------------------------------------

  /**
   * R of piece `id` and its K-07 drop classes. Without the cache (or for a site block): the core session itself. With
   * the cache, a yard block whose start lies in a cached component of the same environment reuses it: R is the same
   * (two-way edges), the drop class of every node is the same except K-07 row 1 — the current start cancels (the caller
   * skips it) and the start of the session that built the entry is a yard position (row 2: a yard block's start has
   * every cell at x ≤ wy − 1, y ≤ hy − 1). Test: "K-50 reach cache equals a fresh core drag session".
   */
  private reachOf(
    s: GameState,
    id: PieceId,
    zone: number,
  ): { readonly reach: Reach; readonly session: DragSession | null } | null {
    const cache = this.reachCache;
    let key = 0;
    let env: Uint8Array | null = null;
    if (cache && zone === Zone.yard) {
      const buf = s.buf;
      const base = this.lvl.layout.pieces + id * PIECE_STRIDE;
      const startCode = (buf[base + PF.y] ?? 0) * MAX_COLS + (buf[base + PF.x] ?? 0);
      // environment bytes: shape, site closed, collision rows without the block, gap open / y
      env = this.env;
      const rows = this.lvl.geo.rows;
      const masks = collisionMasks(s, id, this.masks);
      env[0] = buf[base + PF.shape] ?? 0;
      env[1] = isSiteClosed(s) ? 1 : 0;
      for (let y = 0; y < rows; y++) env[2 + y] = masks[y] ?? 0;
      const gaps = this.lvl.layout.gaps;
      for (let g = 0; g < this.lvl.gaps.length; g++)
        env[2 + rows + g] =
          ((buf[gaps + g * GAP_STRIDE + GF.open] ?? 0) & 1) | ((buf[gaps + g * GAP_STRIDE + GF.y] ?? 0) << 1);
      key = envKey(env);
      const list = cache.get(key);
      if (list) {
        for (const r of list) {
          if (sameBytes(r.env, env) && indexOf(r.codes, startCode) >= 0) {
            this.stats.reachHits++;
            return { reach: r, session: null };
          }
        }
      }
    }
    const attempt = tryBeginDrag(s, id, this.hooks.drag);
    if (!attempt.ok) return null;
    this.stats.sessions++;
    const session = attempt.session;
    const reach = reachFromSession(
      session,
      this.lvl.geo.cols,
      this.lvl.geo.rows,
      1 + this.lvl.gaps.length,
      env,
    );
    if (cache && env) {
      if (this.reachEntries >= REACH_CACHE_LIMIT) {
        cache.clear();
        this.reachEntries = 0;
      }
      const list = cache.get(key);
      if (list) list.push(reach);
      else cache.set(key, [reach]);
      this.reachEntries++;
    }
    return { reach, session };
  }

  /**
   * Necessary condition of K-09 (a) for a yard block, from the occupancy only (no BFS): some unit translation keeps
   * every new cell inside the frame (cargo: inside the yard, K-44) and every new yard cell empty. A translation into
   * the site columns is left to the core (open sky, boundary rows). False ⇒ the core's `tryBeginDrag` would answer
   * `immovable` too, so the drag BFS is skipped; true ⇒ the core decides.
   */
  private mayMove(buf: Int32Array, base: number): boolean {
    const { geo, layout } = this.lvl;
    const shape = shapeByIndex(buf[base + PF.shape] ?? 0);
    const cargo = shape.kind === 'I5' || shape.kind === 'Q9';
    const maxX = cargo ? geo.wy : geo.cols;
    const maxY = cargo ? geo.hy : geo.rows;
    const x0 = buf[base + PF.x] ?? 0;
    const y0 = buf[base + PF.y] ?? 0;
    const self = (base - layout.pieces) / PIECE_STRIDE + 1;
    const occ = layout.yardOcc;
    const wy = geo.wy;
    dirs: for (let d = 0; d < 4; d++) {
      const dx = DX[d] ?? 0;
      const dy = DY[d] ?? 0;
      for (const c of shape.cells) {
        const x = x0 + c.x + dx;
        const y = y0 + c.y + dy;
        if (x < 0 || y < 0 || x >= maxX || y >= maxY) continue dirs;
        if (x >= wy) continue; // site column: the core decides
        const v = buf[occ + y * wy + x] ?? 0;
        if (v !== 0 && v !== self) continue dirs;
      }
      return true;
    }
    return false;
  }

  /** A FREE / RAIL site release: correct → placement edge; wrong → `wait` edge where the board can change. */
  private siteRelease(
    id: PieceId,
    node: DragNode,
    via: number | undefined,
    lo: number,
    hi: number,
    cb: SuccessorCallback,
  ): void {
    const cur = this.cur;
    if (!cur) return;
    if (via === undefined) {
      const fall = computeFall(cur, id, node, { rules: this.hooks.fall });
      const correct = fall.verdict.ok && fall.effect.kind === 'none';
      if (!correct && !this.waitMoves) return;
      const kind = !correct ? KIND_WAIT : node.mode === FREE ? KIND_OVERWALL : KIND_RAIL;
      this.slowMove(id, node, via, kind, fall.landing, lo, hi, cb);
      return;
    }
    // painted on the way: the verdict depends on the new colour, the core decides
    this.slowMove(id, node, via, node.mode === FREE ? KIND_OVERWALL : KIND_RAIL, null, lo, hi, cb);
  }

  /** W6: the same releases with `via` = each paint gate whose rail is on the reach. */
  private paintVariants(
    session: DragSession,
    id: PieceId,
    nodes: readonly DragNode[],
    lo: number,
    hi: number,
    cb: SuccessorCallback,
  ): void {
    for (const g of this.paintGates) {
      const mode = railMode(g);
      if (!nodes.some((n) => n.mode === mode)) continue;
      const lowest: number[] = [];
      for (const node of nodes) {
        const drop = session.classify(node);
        if (drop.kind === 'yard') this.slowMove(id, node, g, KIND_SHIFT, null, lo, hi, cb);
        else if (drop.kind === 'siteRail' || (drop.kind === 'siteFree' && this.exhaustiveFree))
          this.siteRelease(id, node, g, lo, hi, cb);
        else if (drop.kind === 'siteFree') {
          const prev = lowest[node.ix];
          if (prev === undefined || node.iy < prev) lowest[node.ix] = node.iy;
        }
      }
      for (let ix = 0; ix < lowest.length; ix++) {
        const iy = lowest[ix];
        if (iy !== undefined) this.siteRelease(id, { ix, iy, mode: FREE }, g, lo, hi, cb);
      }
    }
  }

  /**
   * Runs the drag through `applyMove` on the scratch state. `kind` is the expected kind: a site release must end
   * locked to be a placement (else it is a `wait`, generated only when the board can change).
   */
  private slowMove(
    id: PieceId,
    node: DragNode,
    via: number | undefined,
    kind: EdgeKind,
    landing: Anchor | null,
    lo: number,
    hi: number,
    cb: SuccessorCallback,
  ): void {
    const cur = this.cur;
    if (!cur) return;
    const tmp = this.tmp;
    tmp.buf.set(cur.buf);
    const move: Move =
      via === undefined
        ? { kind: 'drag', pieceId: id, to: node }
        : { kind: 'drag', pieceId: id, to: node, via };
    this.stats.applyMoves++;
    const res = applyMove(tmp, move, NULL_SINK, { hooks: this.hooks, noTruckHelp: true });
    if (res.status !== 'applied') return;
    let k = kind;
    if (k === KIND_OVERWALL || k === KIND_RAIL) {
      const locked =
        ((tmp.buf[this.lvl.layout.pieces + id * PIECE_STRIDE + PF.flags] ?? 0) & FLAG_BIT.locked) !== 0;
      if (!locked) {
        if (!this.waitMoves) return;
        k = KIND_WAIT;
      }
    }
    const cost = SOLVER_MOVES - (tmp.buf[H.movesLeft] ?? 0);
    normalizeState(tmp);
    const h = hashState(tmp, this.hashOut);
    const nlo = h[0] ?? 0;
    const nhi = h[1] ?? 0;
    if (nlo === lo && nhi === hi) return; // the board did not change (a wrong placement that bounced back)
    this.pendingFast = false;
    this.materialized = true;
    this.lastIx = node.ix;
    this.lastIy = node.iy;
    this.lastMode = node.mode;
    this.lastVia = via;
    const to = landing ?? landingOf(tmp, id);
    this.lastToX = to.ix;
    this.lastToY = to.iy;
    this.lastSlow = true;
    cb(nlo, nhi, edgeInfo(k, cost, via !== undefined));
    this.lastVia = undefined;
  }
}

/** Board anchor of piece `id` after the move (yard: global; site: plan row + elevator offset). */
function landingOf(s: GameState, id: PieceId): Anchor {
  const base = s.lvl.layout.pieces + id * PIECE_STRIDE;
  const zone = s.buf[base + PF.zone] ?? 0;
  const x = s.buf[base + PF.x] ?? 0;
  const y = (s.buf[base + PF.y] ?? 0) + (zone === Zone.site ? (s.buf[H.elev] ?? 0) : 0);
  return { ix: x, iy: y };
}

/** `shapeByIndex` of piece `id` in `s` (kind and rotation for the K-50 item 4 order). */
export function pieceShapeOf(s: GameState, id: PieceId): ReturnType<typeof shapeByIndex> {
  return shapeByIndex(s.buf[s.lvl.layout.pieces + id * PIECE_STRIDE + PF.shape] ?? 0);
}

/** R and the K-07 drop classes of a core drag session, in node-code order (the session's start is stored as `yard`). */
function reachFromSession(
  session: DragSession,
  cols: number,
  rows: number,
  modes: number,
  env: Uint8Array | null,
): Reach {
  const codes: number[] = [];
  const drops: number[] = [];
  const probe = { ix: 0, iy: 0, mode: FREE };
  const start = session.start.iy * MAX_COLS + session.start.ix;
  for (let mode = 0; mode < modes; mode++) {
    for (let iy = 0; iy < rows; iy++) {
      for (let ix = 0; ix < cols; ix++) {
        probe.ix = ix;
        probe.iy = iy;
        probe.mode = mode;
        if (!session.isReachable(probe)) continue;
        const code = mode * NODES + iy * MAX_COLS + ix;
        const drop = session.classify(probe);
        codes.push(code);
        drops.push(
          code === start
            ? DROP_YARD
            : drop.kind === 'yard'
              ? DROP_YARD
              : drop.kind === 'siteFree'
                ? DROP_FREE
                : drop.kind === 'siteRail'
                  ? DROP_RAIL
                  : DROP_CANCEL,
        );
      }
    }
  }
  return {
    start,
    codes: Int16Array.from(codes),
    drops: Uint8Array.from(drops),
    env: env ? env.slice() : null,
  };
}

/**
 * 30-bit FNV-1a key of the environment bytes (a small integer, the fast Map key); entries keep the bytes, so a key
 * collision only lengthens the entry list, never mixes environments.
 */
function envKey(env: Uint8Array): number {
  let a = 0x811c9dc5;
  for (let i = 0; i < env.length; i++) a = Math.imul(a ^ (env[i] ?? 0), 0x01000193);
  return (a ^ (a >>> 15)) & 0x3fffffff;
}

function sameBytes(a: Uint8Array | null, b: Uint8Array): boolean {
  if (!a || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** Binary search in a sorted code list; −1 when absent. */
function indexOf(codes: Int16Array, code: number): number {
  let a = 0;
  let b = codes.length - 1;
  while (a <= b) {
    const m = (a + b) >> 1;
    const v = codes[m] ?? 0;
    if (v === code) return m;
    if (v < code) a = m + 1;
    else b = m - 1;
  }
  return -1;
}
