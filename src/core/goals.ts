/**
 * Goal counters and the full-cover accounting (docs/GDD.md K-41, K-28, K-47, K-48; TECH_DESIGN §2.4 `goals` section,
 * §6.2 steps 7–8, §7.2 S4, §2R.2).
 *
 * One counter per `lvl.goals[i]` (the state's goal section, same order):
 * - `build`: completed segments, target S (UX goal panel "2/4"). It changes when a segment completes (K-35 step 8), so
 *   its `goalProgress` event carries step 8; the other goals are reported in step 7.
 * - `clear` / `collect`: counted where the effect happens — crate destroyed, chain removed (Y3 rule), screw collected
 *   (obstacle rules) and debris leaving its start spot (core, `countDebrisLeftSite`, K-41 Faz 2R: each debris at most
 *   once, the first time it lands in the yard / queue or is placed correctly elsewhere; then it is a plain block).
 * A counter never passes its target: the goal stays "done" and the surplus is not counted (K-41).
 *
 * K-47 / K-48: material = every piece but Ağır Yük; remaining supply / demand per colour, `blocksLeft` (UX §5.9) and
 * the win test `levelGoalsMet` (segments + extra goals + no material in the yard, queue or undelivered batches).
 */
import { COLOR_CODES, Zone } from './types.ts';
import type { PieceId } from './types.ts';
import {
  FLAG_BIT,
  H,
  filledMask,
  goalValue,
  hdr,
  pieceColor,
  pieceFlags,
  pieceShape,
  pieceZone,
  setFlag,
  setGoalValue,
} from './state.ts';
import type { GameState } from './state.ts';
import { shapeByIndex } from './shapes.ts';
import type { CompiledLevel } from './level/compile.ts';
import type { GoalData } from './level/schema.ts';

/** Countable targets of `clear` / `collect` goals (GDD K-41). */
export type GoalCountKind = 'crate' | 'chain' | 'debris' | 'screw';
export type GoalKind = 'build' | GoalCountKind;

/** What a goal counts. */
export function goalKind(goal: GoalData): GoalKind {
  if (goal.type === 'build') return 'build';
  if (goal.type === 'clear') return goal.target;
  return goal.item;
}

/** Target of goal `i`: S for `build`, `count` otherwise. */
export function goalTarget(lvl: CompiledLevel, i: number): number {
  const goal = lvl.goals[i];
  if (!goal) return 0;
  return goal.type === 'build' ? lvl.segments.length : goal.count;
}

/** Goal `i` reached its target. */
export function goalDone(s: GameState, i: number): boolean {
  return goalValue(s, i) >= goalTarget(s.lvl, i);
}

/**
 * Adds `n` to every goal counting `kind` (capped at its target, K-41). Returns the indices whose value changed.
 * Called by obstacle rules (crate, chain, screw) and by `countDebrisLeftSite`.
 */
export function addGoalCount(s: GameState, kind: GoalCountKind, n = 1): number[] {
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`addGoalCount: bad amount ${n}`);
  const changed: number[] = [];
  s.lvl.goals.forEach((goal, i) => {
    if (goalKind(goal) !== kind) return;
    const before = goalValue(s, i);
    const after = Math.min(goalTarget(s.lvl, i), before + n);
    if (after !== before) {
      setGoalValue(s, i, after);
      changed.push(i);
    }
  });
  return changed;
}

/** Writes the completed segment count into every `build` goal (K-35 step 8). Returns the indices that changed. */
export function setBuildProgress(s: GameState, completed: number): number[] {
  const changed: number[] = [];
  s.lvl.goals.forEach((goal, i) => {
    if (goal.type !== 'build') return;
    const value = Math.min(goalTarget(s.lvl, i), completed);
    if (goalValue(s, i) !== value) {
      setGoalValue(s, i, value);
      changed.push(i);
    }
  });
  return changed;
}

/**
 * K-41 `clear: debris`, OBSTACLES S4 (Faz 2R): a debris block counts once, the first time it leaves its start spot on
 * the site — a yard placement (drag, FREE or rail, K-12 exception; crane), a CORRECT placement elsewhere on the site
 * (drag, crane, Golden Trowel) or the hammer (K-36: down to the yard or the truck queue). At that moment its `debris`
 * flag goes and it is an ordinary material block. A wrong placement bounces it back to its start (K-17 step 1): no
 * count, the flag stays. `startZone` = the piece's zone at action start. Returns true when it counted now.
 */
export function countDebrisLeftSite(s: GameState, pieceId: PieceId, startZone: number): boolean {
  if (startZone !== Zone.site) return false;
  const flags = pieceFlags(s, pieceId);
  if ((flags & FLAG_BIT.debris) === 0) return false;
  if (pieceZone(s, pieceId) === Zone.site && (flags & FLAG_BIT.locked) === 0) return false;
  setFlag(s, pieceId, 'debris', false);
  addGoalCount(s, 'debris', 1);
  return true;
}

/** Every goal other than `build` reached its target (K-28, E-27). */
export function extraGoalsMet(s: GameState): boolean {
  return s.lvl.goals.every((goal, i) => goal.type === 'build' || goalDone(s, i));
}

/** Every segment is complete: `deliveryCursor` counts completed segments (K-22, K-23, K-28). */
export function allSegmentsComplete(s: GameState): boolean {
  return hdr(s, H.deliveryCursor) >= s.lvl.segments.length;
}

// --- K-47 / K-48: full cover ---------------------------------------------------------------------------------------

/** K-44 / K-47: a material block (every piece but Ağır Yük; debris included). */
export function isMaterial(s: GameState, id: PieceId): boolean {
  return s.lvl.pieces[id]?.cls === 'material';
}

/**
 * K-47 "kalan arz": a material block that is not locked — in the yard, the truck queue, an undelivered batch, or
 * unlocked on the site (debris, stuck mortar).
 */
export function isRemainingSupply(s: GameState, id: PieceId): boolean {
  if (!isMaterial(s, id)) return false;
  const zone = pieceZone(s, id);
  if (zone === Zone.yard || zone === Zone.queue || zone === Zone.pending) return true;
  return zone === Zone.site && (pieceFlags(s, id) & FLAG_BIT.locked) === 0;
}

/** K-47: remaining supply cells per colour index (length 8). */
export function remainingSupplyByColor(s: GameState): number[] {
  const out = COLOR_CODES.map(() => 0);
  const P = s.lvl.layout.counts.pieces;
  for (let id = 0; id < P; id++) {
    if (!isRemainingSupply(s, id)) continue;
    const c = pieceColor(s, id);
    if (c >= 0 && c < out.length) out[c] = (out[c] ?? 0) + shapeByIndex(pieceShape(s, id)).cellCount;
  }
  return out;
}

/** K-47: remaining demand cells per colour index (plan cells of every segment not correctly filled; `?` resolved). */
export function remainingDemandByColor(s: GameState): number[] {
  const out = COLOR_CODES.map(() => 0);
  const { ws, hs } = s.lvl.geo;
  s.lvl.segments.forEach((plan, seg) => {
    for (let sx = 0; sx < ws; sx++) {
      const filled = filledMask(s, seg, sx);
      for (let sy = 0; sy < hs; sy++) {
        const c = plan.planColors[sy * ws + sx] ?? -1;
        if (c >= 0 && ((filled >> sy) & 1) === 0) out[c] = (out[c] ?? 0) + 1;
      }
    }
  });
  return out;
}

/**
 * UX §5.9 item 1, K-47, K-48 (PL-2R-06): blocks left = N − correctly placed (locked) material blocks. A held block is
 * not counted apart; a Söküm or an Undo raises it by itself; 0 ⇔ every segment is complete (K-47 item 5).
 */
export function blocksLeft(s: GameState): number {
  let placed = 0;
  const P = s.lvl.layout.counts.pieces;
  for (let id = 0; id < P; id++) {
    if (!isMaterial(s, id) || pieceZone(s, id) !== Zone.site) continue;
    if ((pieceFlags(s, id) & FLAG_BIT.locked) !== 0) placed += 1;
  }
  return s.lvl.materialCount - placed;
}

/** K-48 (3): a material block is still in the yard, the truck queue or an undelivered batch. */
export function materialLeft(s: GameState): boolean {
  const P = s.lvl.layout.counts.pieces;
  for (let id = 0; id < P; id++) {
    if (!isMaterial(s, id)) continue;
    const zone = pieceZone(s, id);
    if (zone === Zone.yard || zone === Zone.queue || zone === Zone.pending) return true;
  }
  return false;
}

/**
 * K-48 (K-28): every segment complete, every extra goal met and no material block left in the yard, the truck queue or
 * an undelivered batch (Ağır Yük, crates and bags may stay). A held block is not core state (TECH §2R.2).
 */
export function levelGoalsMet(s: GameState): boolean {
  return allSegmentsComplete(s) && extraGoalsMet(s) && !materialLeft(s);
}

/** Goal values in `lvl.goals` order (snapshot at move start, compared in step 7). */
export function goalSnapshot(s: GameState): number[] {
  return s.lvl.goals.map((_, i) => goalValue(s, i));
}

/** Indices of the non-`build` goals whose value differs from `before` (K-35 step 7 `goalProgress`). */
export function changedCountGoals(s: GameState, before: readonly number[]): number[] {
  const out: number[] = [];
  s.lvl.goals.forEach((goal, i) => {
    if (goal.type !== 'build' && goalValue(s, i) !== (before[i] ?? 0)) out.push(i);
  });
  return out;
}

/** Goal panel row (UX goal panel: `value/target`, ✓ when done). */
export interface GoalView {
  readonly index: number;
  readonly kind: GoalKind;
  readonly value: number;
  readonly target: number;
  readonly done: boolean;
}

export function goalViews(s: GameState): GoalView[] {
  return s.lvl.goals.map((goal, i) => ({
    index: i,
    kind: goalKind(goal),
    value: goalValue(s, i),
    target: goalTarget(s.lvl, i),
    done: goalDone(s, i),
  }));
}
