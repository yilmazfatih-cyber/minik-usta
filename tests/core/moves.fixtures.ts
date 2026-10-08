/**
 * Shared helpers of the move pipeline tests (moves, site, delivery, goals, combo, session). Not a test file.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';
import { ArraySink, applyMove } from '../../src/core/moves.ts';
import type { ApplyOptions, MoveResult } from '../../src/core/moves.ts';
import { loadLevel } from '../../src/core/level/compile.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import { FREE, railMode } from '../../src/core/movement.ts';
import { stateInvariantErrors } from '../../src/core/grid.ts';
import type { GameState } from '../../src/core/state.ts';
import type {
  DragNode,
  GameEvent,
  GameEventType,
  Move,
  PieceId,
  SessionAction,
} from '../../src/core/types.ts';

export const N = (ix: number, iy: number): DragNode => ({ ix, iy, mode: FREE });
export const RAIL = (gap: number, ix: number, iy: number): DragNode => ({ ix, iy, mode: railMode(gap) });

/** A drag move to a FREE node (or a rail node when `gap` is given). */
export function dragTo(pieceId: PieceId, ix: number, iy: number, gap?: number): Move {
  return { kind: 'drag', pieceId, to: gap === undefined ? N(ix, iy) : RAIL(gap, ix, iy) };
}

export interface Ran {
  readonly res: MoveResult;
  readonly ev: GameEvent[];
}

/** `applyMove` with an ArraySink; strict by default (an invalid record throws). */
export function run(s: GameState, move: Move, opts: ApplyOptions = {}): Ran {
  const sink = new ArraySink();
  const res = applyMove(s, move, sink, { strict: true, ...opts });
  return { res, ev: sink.events };
}

/** Event types in order. */
export function types(ev: readonly GameEvent[]): GameEventType[] {
  return ev.map((e) => e.t);
}

/** The first event of type `t` (narrowed); throws when there is none. */
export function find<T extends GameEventType>(ev: readonly GameEvent[], t: T): Extract<GameEvent, { t: T }> {
  const e = ev.find((x) => x.t === t);
  if (!e) throw new Error(`no ${t} event in [${types(ev).join(', ')}]`);
  return e as Extract<GameEvent, { t: T }>;
}

export function expectConsistent(s: GameState): void {
  expect(stateInvariantErrors(s)).toEqual([]);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** `levels/level_NNN.json`, loaded like the game does (schema + runtime checks). */
export function levelFile(id: number): CompiledLevel {
  const json: unknown = JSON.parse(
    readFileSync(join(ROOT, 'levels', `level_${String(id).padStart(3, '0')}.json`), 'utf8'),
  );
  const loaded = loadLevel(json);
  if (!loaded.ok) throw new Error(`level ${id} does not load: ${JSON.stringify(loaded.issues)}`);
  return loaded.level;
}

/**
 * The canonical solutions of the Faz 2R levels 1–10 (LEVELS §2 "Kanonik çözüm" = solver, GDD K-50 item 4) as drag
 * moves, read from the golden files (tests/golden/level_NNN.hand.json, TECH §2R.10): one transcription for the golden
 * replays and the pipeline tests. A move is a release node: a site placement (FREE node above the column, or a rail
 * node through a gap) or a yard shift (FREE yard node, K-10). Piece ids: batch 0 in table order, then truck batches
 * (`k1_i`; level 5: 4 = k1_0 … 7 = k1_3).
 */
export function handMoves(id: number): Move[] {
  const file = join(ROOT, 'tests', 'golden', `level_${String(id).padStart(3, '0')}.hand.json`);
  const { log } = JSON.parse(readFileSync(file, 'utf8')) as { log: SessionAction[] };
  return log.filter((a): a is Move => a.kind !== 'start' && a.kind !== 'undo');
}

/** One step of a golden (tests/golden/level_NNN.hand.json `steps`). */
export interface HandStep {
  readonly piece: string;
  readonly ref: string;
  readonly shape: string;
  readonly color: string;
  readonly from: readonly [number, number];
  readonly kind: 'overWall' | 'rail' | 'shift';
  readonly gap?: number;
  readonly to: readonly [number, number];
  readonly segmentCompleted?: number;
  readonly delivered?: readonly (readonly [string, number, number])[];
  readonly queue?: readonly string[];
}

/** The described steps of the golden of level `id` (same order as `handMoves(id)`). */
export function handSteps(id: number): HandStep[] {
  const file = join(ROOT, 'tests', 'golden', `level_${String(id).padStart(3, '0')}.hand.json`);
  return (JSON.parse(readFileSync(file, 'utf8')) as { steps: HandStep[] }).steps;
}

/** Faz 2R vertical slice levels with a golden (EN-2R-17). */
export const LEVELS_1_10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export type SliceLevel = (typeof LEVELS_1_10)[number];

export const HAND: Readonly<Record<SliceLevel, readonly Move[]>> = {
  1: handMoves(1),
  2: handMoves(2),
  3: handMoves(3),
  4: handMoves(4),
  5: handMoves(5),
  6: handMoves(6),
  7: handMoves(7),
  8: handMoves(8),
  9: handMoves(9),
  10: handMoves(10),
};

/**
 * `handMoves(id)` with every over-the-wall placement released in the crane area (row H) above its landing column, as a
 * finger drop: the block falls to the same landing (K-11, `pieceFell{release}` rows > 0). The canonical log releases
 * at the landing node itself (the lowest reachable node of the column, TECH §2R.5), which falls 0 rows. Shifts and
 * rail placements are unchanged; the state after every move is the canonical one.
 */
export function craneMoves(id: number): Move[] {
  const steps = handSteps(id);
  const h = levelFile(id).geo.h;
  return handMoves(id).map((m, i) =>
    steps[i]?.kind === 'overWall' && m.kind === 'drag' ? { ...m, to: N(m.to.ix, h) } : m,
  );
}
