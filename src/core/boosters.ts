/**
 * In-level boosters: preconditions, effects and target predicates (docs/GDD.md §10, K-33, K-36…K-39, K-54; TECH_DESIGN
 * §2R.2, §2R.15 item 7). Pure state helpers: the events and the K-35 mini pipeline belong to core/moves.ts.
 *
 * Faz 2R (full cover, K-47): no booster creates or destroys a material block.
 * - Hammer (K-36): smashes an Ağır Yük (gone), lifts the stuck mortar or moves a site debris down to the yard (K-17 step
 *   2, else the queue end); crates, bags and chains go to their obstacle rules (`MoveHooks.hammer`). Never a material
 *   block in the yard, a locked or a queued block.
 * - Crane (K-37): a yard block (material or cargo; chained / wet ones are refused by the rules' `canPick`), a site
 *   debris or a stuck mortar block, to (a) an empty yard spot in its own orientation or (b) a correct site spot
 *   (material only; it may turn clockwise there, width ≤ Ws). It locks without streak or YAO.
 * - Paint brush (K-38): swaps the colours of two yard material blocks with equal cell counts and different colours.
 * - Golden Trowel (K-33): a yard material block (not locked / chained / wet) flies to a spot of its `P` set
 *   (`correctSpots`) and locks; no streak, no YAO.
 * - Pre-check (CL-2R-05): crane, paint brush and trowel targets whose result state is a D3a dead end are invalid
 *   (nothing happens, nothing is spent). It never changes the slot state (K-54).
 * - Undo (K-39): a session action (core/session.ts); `undoBlock` is its precondition.
 */
import { COLOR_CODES, Zone } from './types.ts';
import type { Anchor, At, HammerTarget, HammerTargetKind, Move, PieceId, Rotation } from './types.ts';
import {
  FLAG_BIT,
  H,
  OF,
  PF,
  STATE_FLAG,
  cloneState,
  hdr,
  obstacleField,
  pieceColor,
  pieceFlags,
  pieceSeg,
  pieceShape,
  pieceX,
  pieceY,
  pieceZone,
  setHdr,
  setPieceField,
  yardOcc,
} from './state.ts';
import type { GameState } from './state.ts';
import { shapeById, shapeByIndex } from './shapes.ts';
import type { ShapeDef } from './shapes.ts';
import { isCargoShape } from './movement.ts';
import { visibleSegment } from './grid.ts';
import {
  lockPiece,
  movePiece,
  piecePlace,
  placeAt,
  returnTarget,
  sitePlace,
  yardPlace,
} from './placement.ts';
import type { ReturnTarget, RevealedCell } from './placement.ts';
import { correctSpots, precheckOk } from './deadlock.ts';
import type { EntityRef, MoveHooks, RuleContext } from './moves.ts';

/** Session outcome as seen by booster preconditions (core/session.ts `SessionOutcome`). */
export type BoosterOutcome = 'playing' | 'outOfMoves' | 'won' | 'lost' | 'exited';

// --- K-39 Undo -----------------------------------------------------------------------------------------------------

/** Why Undo is not available. */
export type UndoBlock = 'levelOver' | 'lossWindow' | 'noDragMove';

export interface UndoView {
  readonly outcome: BoosterOutcome;
  /** A pre-move snapshot of the last committed action exists: it was a drag and was not undone yet. */
  readonly lastDragUndoable: boolean;
}

/** `canUseUndo` (TECH §6.4): null when Undo may be used now, else the reason (the UI greys the slot). */
export function undoBlock(view: UndoView): UndoBlock | null {
  if (view.outcome === 'outOfMoves') return 'lossWindow';
  if (view.outcome !== 'playing') return 'levelOver';
  if (!view.lastDragUndoable) return 'noDragMove';
  return null;
}

// --- shared --------------------------------------------------------------------------------------------------------

/** Why a booster target is refused (nothing happens, the booster is not spent; GDD §10). */
export type BoosterReject =
  | 'levelOver'
  | 'noTarget'
  | 'sameSpot'
  | 'badRotation'
  | 'notEmpty'
  | 'notCorrect'
  | 'precheck'
  | 'noTrowel'
  | 'legacyTrowel';

function won(s: GameState): boolean {
  return (hdr(s, H.flags) & STATE_FLAG.won) !== 0;
}

function validId(s: GameState, id: number): boolean {
  return Number.isInteger(id) && id >= 0 && id < s.lvl.layout.counts.pieces;
}

function isMaterialPiece(s: GameState, id: PieceId): boolean {
  return s.lvl.pieces[id]?.cls === 'material';
}

function locked(s: GameState, id: PieceId): boolean {
  return (pieceFlags(s, id) & FLAG_BIT.locked) !== 0;
}

/** The rules allow picking the block (K-09 (c): Y3 chain, Y4 wet). */
function rulesAllow(s: GameState, id: PieceId, hooks: MoveHooks): boolean {
  return hooks.drag?.canPick ? hooks.drag.canPick(s, id) : true;
}

/** An unlocked site block of the visible segment that is a wrong object: debris (S4) or stuck mortar (Y8). */
function isSiteWrongObject(s: GameState, id: PieceId): boolean {
  if (pieceZone(s, id) !== Zone.site || locked(s, id) || pieceSeg(s, id) !== visibleSegment(s)) return false;
  return (pieceFlags(s, id) & (FLAG_BIT.debris | FLAG_BIT.stuck)) !== 0;
}

/** The orientation `kind_rotation` of a piece's kind (canonical shape). */
function turned(shape: ShapeDef, rotation: Rotation): ShapeDef {
  return shapeByIndex(shapeById(`${shape.kind}_${rotation}`).canonicalIndex);
}

// --- K-36 Hammer ---------------------------------------------------------------------------------------------------

/**
 * K-36 target kind of `target`, or null when it is not a hammer target now: an Ağır Yük in the yard, a site debris or a
 * stuck mortar block of the visible segment, or an entity a rule accepts (`hooks.hammer.canHit`: crate, bag, chain).
 */
export function hammerTargetKind(
  s: GameState,
  target: HammerTarget,
  hooks: MoveHooks,
): HammerTargetKind | null {
  if ('obstacle' in target) {
    const o = s.lvl.obstacles[target.obstacle];
    if (!o) return null;
    const entity: EntityRef = { kind: 'obstacle', index: target.obstacle };
    if (!hooks.hammer?.canHit(s, entity)) return null;
    return o.type === 'crate' ? 'crate' : o.type === 'cement_bag' ? 'cementBag' : null;
  }
  const id = target.pieceId;
  if (!validId(s, id)) return null;
  const zone = pieceZone(s, id);
  if (zone === Zone.yard && isCargoShape(shapeByIndex(pieceShape(s, id)))) return 'cargo';
  if (isSiteWrongObject(s, id))
    return (pieceFlags(s, id) & FLAG_BIT.debris) !== 0 ? 'siteDebris' : 'stuckMortar';
  if (zone === Zone.yard && hooks.hammer?.canHit(s, { kind: 'piece', id })) return 'chain';
  return null;
}

/** K-36 / K-54 hammer target set (piece targets in id order, then obstacles in index order). */
export function hammerTargets(s: GameState, hooks: MoveHooks): HammerTarget[] {
  const out: HammerTarget[] = [];
  if (won(s)) return out;
  const P = s.lvl.layout.counts.pieces;
  for (let id = 0; id < P; id++)
    if (hammerTargetKind(s, { pieceId: id }, hooks) !== null) out.push({ pieceId: id });
  s.lvl.obstacles.forEach((o) => {
    if ((o.type === 'crate' || o.type === 'cement_bag') && obstacleField(s, o.index, OF.hp) > 0) {
      if (hammerTargetKind(s, { obstacle: o.index }, hooks) !== null) out.push({ obstacle: o.index });
    }
  });
  return out;
}

/** What a hammer hit did (step 1 of the mini pipeline). */
export type HammerEffect =
  | { readonly kind: 'cargo'; readonly pieceId: PieceId; readonly at: At }
  | {
      readonly kind: 'siteDebris' | 'stuckMortar';
      readonly pieceId: PieceId;
      readonly from: At;
      readonly target: ReturnTarget;
    }
  | { readonly kind: 'crate' | 'cementBag' | 'chain'; readonly entity: EntityRef };

/** Applies a hammer hit to a valid target (check `hammerTargetKind` first; throws otherwise). */
export function applyHammer(ctx: RuleContext, target: HammerTarget, hooks: MoveHooks): HammerEffect {
  const s = ctx.s;
  const kind = hammerTargetKind(s, target, hooks);
  if (kind === null) throw new RangeError('applyHammer: not a hammer target');
  if ('obstacle' in target) {
    const entity: EntityRef = { kind: 'obstacle', index: target.obstacle };
    hooks.hammer?.hit(ctx, entity);
    return { kind: kind === 'crate' ? 'crate' : 'cementBag', entity };
  }
  const id = target.pieceId;
  if (kind === 'cargo') {
    const at: At = { zone: 'yard', x: pieceX(s, id), y: pieceY(s, id) };
    movePiece(s, id, { zone: 'gone', x: at.x, y: at.y, seg: -1 });
    return { kind, pieceId: id, at };
  }
  if (kind === 'siteDebris' || kind === 'stuckMortar') {
    const from = placeAt(s, piecePlace(s, id)) ?? { zone: 'site', x: pieceX(s, id), y: pieceY(s, id) };
    const ret = returnTarget(s, id, { skipStart: true });
    movePiece(s, id, ret.to);
    return { kind, pieceId: id, from, target: ret };
  }
  const entity: EntityRef = { kind: 'piece', id };
  hooks.hammer?.hit(ctx, entity);
  return { kind: 'chain', entity };
}

// --- K-37 Crane ----------------------------------------------------------------------------------------------------

/** K-37: the crane may lift this block (yard block allowed by the rules, or a site debris / stuck mortar block). */
export function craneSelectable(s: GameState, id: PieceId, hooks: MoveHooks): boolean {
  if (!validId(s, id) || won(s)) return false;
  const zone = pieceZone(s, id);
  if (zone === Zone.yard) return !locked(s, id) && rulesAllow(s, id, hooks);
  return isSiteWrongObject(s, id);
}

type CraneMove = Extract<Move, { kind: 'crane' }>;

/** K-37 (a): every cell of `shape` at `(x, y)` inside the yard and empty (the piece itself excluded). */
function yardSpotFree(s: GameState, shape: ShapeDef, x: number, y: number, self: PieceId): boolean {
  const { wy, hy } = s.lvl.geo;
  if (x < 0 || y < 0 || x + shape.w > wy || y + shape.h > hy) return false;
  for (const c of shape.cells) {
    const v = yardOcc(s, x + c.x, y + c.y);
    if (v !== 0 && v !== self + 1) return false;
  }
  return true;
}

/** K-37 (b): the site spots of a material block in every orientation of width ≤ Ws (rotation clockwise from 0). */
export function craneSiteSpots(
  s: GameState,
  id: PieceId,
): { readonly rotation: Rotation; readonly at: Anchor }[] {
  const out: { rotation: Rotation; at: Anchor }[] = [];
  if (!validId(s, id) || !isMaterialPiece(s, id)) return out;
  const shape = shapeByIndex(pieceShape(s, id));
  if (isCargoShape(shape)) return out;
  const seen = new Set<number>();
  for (const rotation of [0, 90, 180, 270] as const) {
    const t = turned(shape, rotation);
    if (seen.has(t.index)) continue;
    seen.add(t.index);
    for (const at of correctSpots(s, t, pieceColor(s, id), id)) out.push({ rotation, at });
  }
  return out;
}

/** Precondition of a crane move (target validity only, no pre-check): null when allowed. */
function craneTargetBlock(s: GameState, move: CraneMove, hooks: MoveHooks): BoosterReject | null {
  if (won(s)) return 'levelOver';
  const id = move.pieceId;
  if (!craneSelectable(s, id, hooks)) return 'noTarget';
  const shape = shapeByIndex(pieceShape(s, id));
  if (!(move.rotation === 0 || move.rotation === 90 || move.rotation === 180 || move.rotation === 270))
    return 'badRotation';
  const t = turned(shape, move.rotation);
  const { x, y } = move.to;
  if (!Number.isInteger(x) || !Number.isInteger(y)) return 'noTarget';
  if (move.to.zone === 'yard') {
    if (t.index !== shape.index) return 'badRotation';
    if (pieceZone(s, id) === Zone.yard && pieceX(s, id) === x && pieceY(s, id) === y) return 'sameSpot';
    return yardSpotFree(s, shape, x, y, id) ? null : 'notEmpty';
  }
  if (!isMaterialPiece(s, id) || isCargoShape(shape)) return 'noTarget';
  if (t.w > s.lvl.geo.ws) return 'badRotation';
  const ok = correctSpots(s, t, pieceColor(s, id), id).some((a) => a.ix === x && a.iy === y);
  return ok ? null : 'notCorrect';
}

/**
 * K-37 precondition (TECH §6.4 `canUse*`) including the D3a pre-check (E-60): null when the move may be applied.
 */
export function craneRejection(s: GameState, move: CraneMove, hooks: MoveHooks): BoosterReject | null {
  const block = craneTargetBlock(s, move, hooks);
  if (block !== null) return block;
  const copy = cloneState(s);
  applyCraneEffect(copy, move);
  return precheckOk(copy) ? null : 'precheck';
}

/** What a crane move did. */
export interface CraneEffect {
  readonly from: At;
  readonly to: At;
  readonly shape: ShapeDef;
  readonly toSite: boolean;
  readonly revealed: readonly RevealedCell[];
}

/** Applies a crane move whose target `craneTargetBlock` accepts (no check here). */
export function applyCraneEffect(s: GameState, move: CraneMove): CraneEffect {
  const id = move.pieceId;
  const from = placeAt(s, piecePlace(s, id)) ?? { zone: 'yard', x: pieceX(s, id), y: pieceY(s, id) };
  const t = turned(shapeByIndex(pieceShape(s, id)), move.rotation);
  const anchor: Anchor = { ix: move.to.x, iy: move.to.y };
  if (move.to.zone === 'yard') {
    movePiece(s, id, yardPlace(anchor));
    return { from, to: { zone: 'yard', x: anchor.ix, y: anchor.iy }, shape: t, toSite: false, revealed: [] };
  }
  // the old cells leave with the old shape, the new cells come with the turned one
  movePiece(s, id, { zone: 'gone', x: 0, y: 0, seg: -1 });
  setPieceField(s, id, PF.shape, t.index);
  const place = sitePlace(s, anchor);
  movePiece(s, id, place);
  const revealed = lockPiece(s, id);
  return {
    from,
    to: { zone: 'site', x: anchor.ix, y: anchor.iy, seg: place.seg },
    shape: t,
    toSite: true,
    revealed,
  };
}

/** K-54: the crane has a target now ((a) or (b) for some selectable block; the pre-check is not part of it). */
export function hasCraneTarget(s: GameState, hooks: MoveHooks): boolean {
  if (won(s)) return false;
  const P = s.lvl.layout.counts.pieces;
  const { wy, hy } = s.lvl.geo;
  for (let id = 0; id < P; id++) {
    if (!craneSelectable(s, id, hooks)) continue;
    if (craneSiteSpots(s, id).length > 0) return true;
    const shape = shapeByIndex(pieceShape(s, id));
    const inYard = pieceZone(s, id) === Zone.yard;
    for (let y = 0; y + shape.h <= hy; y++) {
      for (let x = 0; x + shape.w <= wy; x++) {
        if (inYard && x === pieceX(s, id) && y === pieceY(s, id)) continue;
        if (yardSpotFree(s, shape, x, y, id)) return true;
      }
    }
  }
  return false;
}

// --- K-38 Paint brush ----------------------------------------------------------------------------------------------

/** K-38: block A / B of a swap: a yard material block that is not locked (buried, chained or wet allowed). */
export function paintSelectable(s: GameState, id: PieceId): boolean {
  return validId(s, id) && pieceZone(s, id) === Zone.yard && isMaterialPiece(s, id) && !locked(s, id);
}

/** K-38: `b` may be swapped with `a` (equal cell counts, different colours). */
export function paintPairOk(s: GameState, a: PieceId, b: PieceId): boolean {
  if (a === b || !paintSelectable(s, a) || !paintSelectable(s, b)) return false;
  if (pieceColor(s, a) === pieceColor(s, b)) return false;
  return shapeByIndex(pieceShape(s, a)).cellCount === shapeByIndex(pieceShape(s, b)).cellCount;
}

/** K-38 B candidates for A (UI highlight), id order. */
export function paintPartners(s: GameState, a: PieceId): PieceId[] {
  const out: PieceId[] = [];
  const P = s.lvl.layout.counts.pieces;
  for (let b = 0; b < P; b++) if (paintPairOk(s, a, b)) out.push(b);
  return out;
}

/** K-54: some pair can be swapped now. */
export function hasPaintTarget(s: GameState): boolean {
  if (won(s)) return false;
  const P = s.lvl.layout.counts.pieces;
  for (let a = 0; a < P; a++) for (let b = a + 1; b < P; b++) if (paintPairOk(s, a, b)) return true;
  return false;
}

/** K-38 precondition with the D3a pre-check: null when the swap may be applied. */
export function paintRejection(s: GameState, a: PieceId, b: PieceId): BoosterReject | null {
  if (won(s)) return 'levelOver';
  if (!paintPairOk(s, a, b)) return 'noTarget';
  const copy = cloneState(s);
  swapColors(copy, a, b);
  return precheckOk(copy) ? null : 'precheck';
}

/** Swaps the colours of `a` and `b` (shape, place and flags stay). */
export function swapColors(s: GameState, a: PieceId, b: PieceId): void {
  const ca = pieceColor(s, a);
  setPieceField(s, a, PF.color, pieceColor(s, b));
  setPieceField(s, b, PF.color, ca);
}

/** Colour code of a colour index (W for an unknown index). */
export function colorCodeOf(index: number): (typeof COLOR_CODES)[number] {
  return COLOR_CODES[index] ?? 'W';
}

// --- K-33 Golden Trowel --------------------------------------------------------------------------------------------

/** K-33: the trowel may take this block (yard material, not locked, chained or wet). */
export function trowelSelectable(s: GameState, id: PieceId, hooks: MoveHooks): boolean {
  return (
    validId(s, id) &&
    pieceZone(s, id) === Zone.yard &&
    isMaterialPiece(s, id) &&
    !locked(s, id) &&
    rulesAllow(s, id, hooks)
  );
}

/**
 * K-33 `P`: the block's correct spots on the active segment (access, wall and gaps ignored; K-16 + K-34 on empty cells).
 * With `precheck` the spots whose result is a D3a dead end are left out (they are not highlighted).
 */
export function trowelSpots(s: GameState, id: PieceId, opts: { readonly precheck?: boolean } = {}): Anchor[] {
  if (!validId(s, id) || pieceZone(s, id) !== Zone.yard || !isMaterialPiece(s, id)) return [];
  const spots = correctSpots(s, shapeByIndex(pieceShape(s, id)), pieceColor(s, id));
  if (opts.precheck !== true) return spots;
  return spots.filter((at) => {
    const copy = cloneState(s);
    applyTrowelEffect(copy, id, at);
    return precheckOk(copy);
  });
}

/** K-54 / UX §5.2: yard blocks the trowel may take now (non-empty `P`, pre-check excluded), id order. */
export function trowelPieces(s: GameState, hooks: MoveHooks): PieceId[] {
  const out: PieceId[] = [];
  if (won(s)) return out;
  const P = s.lvl.layout.counts.pieces;
  for (let id = 0; id < P; id++)
    if (trowelSelectable(s, id, hooks) && trowelSpots(s, id).length > 0) out.push(id);
  return out;
}

type GoldTrowelMove = Extract<Move, { kind: 'goldTrowel' }>;

/** K-33 precondition with the pre-check (E-50: an empty `P` refuses and spends nothing). */
export function goldTrowelRejection(
  s: GameState,
  move: GoldTrowelMove,
  hooks: MoveHooks,
): BoosterReject | null {
  if (won(s)) return 'levelOver';
  if (hdr(s, H.trowels) <= 0) return 'noTrowel';
  if (!trowelSelectable(s, move.pieceId, hooks)) return 'noTarget';
  const spots = trowelSpots(s, move.pieceId);
  if (spots.length === 0) return 'noTarget';
  if (!spots.some((a) => a.ix === move.x && a.iy === move.y)) return 'notCorrect';
  const copy = cloneState(s);
  applyTrowelEffect(copy, move.pieceId, { ix: move.x, iy: move.y });
  return precheckOk(copy) ? null : 'precheck';
}

/** What a Golden Trowel use did. */
export interface TrowelEffect {
  readonly from: At;
  readonly to: At;
  readonly revealed: readonly RevealedCell[];
  readonly trowels: number;
}

/** K-33 effect: the block flies to `at` on the visible segment and locks; one trowel is spent. No check here. */
export function applyTrowelEffect(s: GameState, id: PieceId, at: Anchor): TrowelEffect {
  const from: At = { zone: 'yard', x: pieceX(s, id), y: pieceY(s, id) };
  const place = sitePlace(s, at);
  movePiece(s, id, place);
  const revealed = lockPiece(s, id);
  setHdr(s, H.trowels, Math.max(0, hdr(s, H.trowels) - 1));
  return {
    from,
    to: { zone: 'site', x: at.ix, y: at.iy, seg: place.seg },
    revealed,
    trowels: hdr(s, H.trowels),
  };
}

// --- K-54 ----------------------------------------------------------------------------------------------------------

/** In-level booster slots of K-54 (+ the trowel strip text, UX §5.2). */
export type BoosterSlot = 'hammer' | 'crane' | 'undo' | 'paintBrush' | 'trowel';

/** K-54 item 2 target predicates (the D3a pre-check is not part of them). `undoable` comes from the session. */
export function boosterTargets(
  s: GameState,
  hooks: MoveHooks,
  undoable: boolean,
): Readonly<Record<BoosterSlot, boolean>> {
  return Object.freeze({
    hammer: hammerTargets(s, hooks).length > 0,
    crane: hasCraneTarget(s, hooks),
    undo: undoable,
    paintBrush: hasPaintTarget(s),
    trowel: trowelPieces(s, hooks).length > 0,
  });
}
