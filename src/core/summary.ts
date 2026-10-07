/**
 * Presentation hooks of the core (docs/TECH_DESIGN.md §2R.15; GDD K-09, K-26, K-34 hook 5, K-48, K-54; UX §5.2, §5.3,
 * §5.9; DL-2R-15). Pure, read-only queries over the state after an action: they never change it and never enter the
 * event log or the replay. `GameSession.apply` hands one `TurnSummary` with every action package (core/session.ts).
 *
 * - `holdable`: K-09 (a)–(e) blocks (glow texture vs `notHoldableTint`, UX §5.3; the tutorial glove).
 * - `queue`: the truck queue in FIFO order with shape and colour (K-26; truck chip preview, DL-2R-22).
 * - `pendingBatches` / `pendingBlocks`: undelivered batches and their material blocks (UX §5.9 "+n" badge).
 * - `blocksLeft`: N − correctly placed material blocks (K-48, UX §5.9 item 1).
 * - `neededNow` (K-34 hook 5) and `unlockedNeeded` (one frame later, easy / normal only, `ReachCache`).
 * - `carryIds`: yard material blocks bigger than what their colour still needs on the active segment (UX §5.9 item 3).
 * - `trowelPieces` (K-33 `P` non-empty, UX §5.2) and `boosterTargets` (K-54 item 2), `slotState` (K-54 order).
 */
import { COLOR_CODES, Zone } from './types.ts';
import type { ColorCode, PieceId, ShapeId } from './types.ts';
import {
  FLAG_BIT,
  H,
  filledMask,
  hdr,
  pieceColor,
  pieceFlags,
  pieceSeg,
  pieceShape,
  pieceZone,
  queueIds,
} from './state.ts';
import type { GameState } from './state.ts';
import { shapeByIndex } from './shapes.ts';
import { tryBeginDrag } from './movement.ts';
import { visibleSegment } from './grid.ts';
import { blocksLeft, isMaterial } from './goals.ts';
import { hasReachableCorrect, neededNow, quickHoldable } from './deadlock.ts';
import { boosterTargets, trowelPieces } from './boosters.ts';
import type { BoosterSlot } from './boosters.ts';
import type { MoveHooks } from './moves.ts';

export type { BoosterSlot };

/** One truck queue entry (K-26), FIFO order. */
export interface QueueEntry {
  readonly pieceId: PieceId;
  readonly shape: ShapeId;
  readonly color: ColorCode;
}

/** The state after an action (and its Söküm, if any), for the scene (TECH §2R.15). */
export interface TurnSummary {
  /** K-09 (a)–(e) holdable blocks, id order (UX §5.3, ART §3A.2). */
  readonly holdable: readonly PieceId[];
  /** K-26 truck queue, FIFO order (DL-2R-22 preview). */
  readonly queue: readonly QueueEntry[];
  /** Undelivered truck batches (UX §5.9). */
  readonly pendingBatches: number;
  /** Material blocks of the undelivered batches (UX §5.9 item 2 "+n"). */
  readonly pendingBlocks: number;
  /** N − correctly placed material blocks (K-48, §2R.2). */
  readonly blocksLeft: number;
  /** K-34 hook 5 (access, wall and gaps ignored). */
  readonly neededNow: readonly PieceId[];
  /** UX §5.9 item 3 "next floor" badge. */
  readonly carryIds: readonly PieceId[];
  /** K-33 / UX §5.2: yard blocks with a non-empty `P` (pre-check excluded). */
  readonly trowelPieces: readonly PieceId[];
  /** K-54 item 2. */
  readonly boosterTargets: Readonly<Record<BoosterSlot, boolean>>;
}

export interface SummaryOptions {
  /** Level rule hooks (`levelHooks(lvl)`): K-09 (c) `canPick`, hammer owners. */
  readonly hooks: MoveHooks;
  /** K-39: the session can undo its last action now. */
  readonly undoable: boolean;
}

/** K-09 (a)–(e): every block on the board (yard, visible segment) that can be held now, id order. */
export function holdableIds(s: GameState, hooks: MoveHooks = {}): PieceId[] {
  const out: PieceId[] = [];
  if (hdr(s, H.movesLeft) <= 0) return out; // K-09 (e)
  const P = s.lvl.layout.counts.pieces;
  const seg = visibleSegment(s);
  for (let id = 0; id < P; id++) {
    const zone = pieceZone(s, id);
    if (zone !== Zone.yard && !(zone === Zone.site && pieceSeg(s, id) === seg)) continue;
    if (quickHoldable(s, id, hooks.drag) || tryBeginDrag(s, id, hooks.drag).ok) out.push(id);
  }
  return out;
}

/** K-26: the queue with shape and colour, oldest first. */
export function queueEntries(s: GameState): QueueEntry[] {
  return queueIds(s).map((id) => ({
    pieceId: id,
    shape: shapeByIndex(pieceShape(s, id)).id,
    color: COLOR_CODES[pieceColor(s, id)] ?? 'W',
  }));
}

/** Undelivered batches and their material blocks (zone `pending`). */
export function pendingCounts(s: GameState): { readonly batches: number; readonly blocks: number } {
  let batches = 0;
  let blocks = 0;
  for (const b of s.lvl.batches) {
    if (b.index < 1) continue;
    const waiting = b.pieceIds.filter((id) => pieceZone(s, id) === Zone.pending);
    if (waiting.length > 0) batches += 1;
    blocks += waiting.filter((id) => isMaterial(s, id)).length;
  }
  return { batches, blocks };
}

/**
 * UX §5.9 item 3 (`carryIds`): yard material blocks whose cell count is larger than the cells of their colour still
 * open on the active segment ("for the next floor"; every difficulty).
 */
export function carryIds(s: GameState): PieceId[] {
  const out: PieceId[] = [];
  const seg = visibleSegment(s);
  const plan = s.lvl.segments[seg];
  if (!plan) return out;
  const { ws, hs } = s.lvl.geo;
  const open = COLOR_CODES.map(() => 0);
  for (let sx = 0; sx < ws; sx++) {
    const filled = filledMask(s, seg, sx);
    for (let sy = 0; sy < hs; sy++) {
      const c = plan.planColors[sy * ws + sx] ?? -1;
      if (c >= 0 && ((filled >> sy) & 1) === 0) open[c] = (open[c] ?? 0) + 1;
    }
  }
  const P = s.lvl.layout.counts.pieces;
  for (let id = 0; id < P; id++) {
    if (pieceZone(s, id) !== Zone.yard || !isMaterial(s, id)) continue;
    if ((pieceFlags(s, id) & FLAG_BIT.locked) !== 0) continue;
    const c = pieceColor(s, id);
    if (shapeByIndex(pieceShape(s, id)).cellCount > (open[c] ?? 0)) out.push(id);
  }
  return out;
}

/** The whole summary (≤ 20 blocks × one BFS each; µs to < 1 ms). */
export function turnSummary(s: GameState, opts: SummaryOptions): TurnSummary {
  const pending = pendingCounts(s);
  return Object.freeze({
    holdable: Object.freeze(holdableIds(s, opts.hooks)),
    queue: Object.freeze(queueEntries(s)),
    pendingBatches: pending.batches,
    pendingBlocks: pending.blocks,
    blocksLeft: blocksLeft(s),
    neededNow: Object.freeze(neededNow(s)),
    carryIds: Object.freeze(carryIds(s)),
    trowelPieces: Object.freeze(trowelPieces(s, opts.hooks)),
    boosterTargets: boosterTargets(s, opts.hooks, opts.undoable),
  });
}

// --- K-34 hook 5: unlockedNeeded --------------------------------------------------------------------------------------

/**
 * "Before" of `unlockedNeeded`: per needed block of the previous state, whether its reach `R` held a release giving a
 * correct placement. The scene keeps one per attempt and calls `unlockedNeeded` after every action package (and once
 * at level start: that first call only fills the cache).
 */
export class ReachCache {
  #primed = false;
  #reach = new Map<PieceId, boolean>();

  get primed(): boolean {
    return this.#primed;
  }

  /** Last known reach flag of `id`; undefined when it was not needed then. */
  reachable(id: PieceId): boolean | undefined {
    return this.#reach.get(id);
  }

  /** @internal */
  store(next: Map<PieceId, boolean>): void {
    this.#reach = next;
    this.#primed = true;
  }

  /** Forget everything (new attempt, Undo / Söküm packages may call it; the next call then only primes). */
  reset(): void {
    this.#reach = new Map();
    this.#primed = false;
  }
}

/**
 * GDD K-34 hook 5: blocks of `neededNow` (of `s`) whose `R` now holds a release with a correct landing and did not
 * before the action. "Before" comes from `cache` (a block not needed before had no correct spot at all, so no correct
 * release). Easy and normal levels only (hard / superhard: always empty, nothing computed). One BFS per needed block;
 * the scene calls it in the frame after it starts playing the package. `prev` = the previous package's summary.
 */
export function unlockedNeeded(
  prev: TurnSummary | null,
  s: GameState,
  cache: ReachCache,
  hooks: MoveHooks = {},
): readonly PieceId[] {
  const diff = s.lvl.difficulty;
  if (diff === 'hard' || diff === 'superhard') return [];
  const needed = neededNow(s);
  const next = new Map<PieceId, boolean>();
  for (const id of needed) next.set(id, hasReachableCorrect(s, id, hooks.drag, hooks.fall));
  const primed = cache.primed;
  const out: PieceId[] = [];
  if (primed) {
    for (const id of needed) {
      if (next.get(id) !== true) continue;
      const before = cache.reachable(id) ?? (prev?.neededNow.includes(id) === true ? undefined : false);
      if (before === false) out.push(id);
    }
  }
  cache.store(next);
  return Object.freeze(out);
}

// --- K-54 slot state ----------------------------------------------------------------------------------------------

/** K-54 slot states, in priority order. */
export const SLOT_STATES = ['locked', 'noTarget', 'empty', 'ready'] as const;
export type SlotState = (typeof SLOT_STATES)[number];

export interface SlotInput {
  /** META §4: the booster is unlocked. */
  readonly unlocked: boolean;
  /** `TurnSummary.boosterTargets[slot]`. */
  readonly hasTarget: boolean;
  /** Inventory count. */
  readonly count: number;
}

/** K-54: locked > noTarget > empty > ready; the first that holds. */
export function slotState(input: SlotInput): SlotState {
  if (!input.unlocked) return 'locked';
  if (!input.hasTarget) return 'noTarget';
  if (input.count <= 0) return 'empty';
  return 'ready';
}

/** K-54 / BUSINESS E12: the "+" and the purchase window (and `offer_shown`) exist only for an `empty` slot. */
export function purchaseOffered(state: SlotState): boolean {
  return state === 'empty';
}
