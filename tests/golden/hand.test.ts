/**
 * Golden replays of the Faz 2R levels 1–10 (docs/TECH_DESIGN.md §2R.10, §9.5; WP-M): `level_NNN.hand.json` is the
 * solver's canonical solution (GDD K-50 item 4, LEVELS §2 "Kanonik çözüm") described move by move — block, start
 * anchor, kind (over the wall, rail through a gap, yard shift), landing anchor, completed segment, truck blocks, queue —
 * with the board geometry, the final ASCII board and the `eventLogHash`; `level_NNN.solver.json` is the solver's own
 * golden (canonical log + hash). Both are written only by `npm run levels:solve -- --update-golden`.
 *
 * Every golden is played through `GameSession` (strict, step 12 on, as the game) and each step is checked against the
 * events. The independent check against the LEVELS §2 text (letters, anchors, kinds) is
 * tests/review/data.review.test.ts "review golden Bölüm n against the LEVELS §2 canonical solution".
 *
 * Triage when a golden fails (messages name the level, step and LEVELS letter):
 * - transcription red → the golden disagrees with the level JSON (ref, shape, colour, budget, geometry): the level
 *   changed — rerun `levels:solve -- --update-golden` and compare the new canonical solution with LEVELS §2;
 * - a start cell, landing cell, kind or verdict wrong while the transcription is green → core rule question (GDD wins);
 * - only `eventLogHash` changed → an intended event-log change: check the new log, then regenerate consciously.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as z from 'zod/mini';
import { GameSession, RULES_VERSION, levelHash } from '../../src/core/session.ts';
import { ArraySink, eventLogHash } from '../../src/core/moves.ts';
import { toAscii } from '../../src/core/ascii.ts';
import { stateInvariantErrors } from '../../src/core/grid.ts';
import { H, hdr, pieceX, pieceY, pieceZone, queueIds } from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import { LevelSchema } from '../../src/core/level/schema.ts';
import { COLOR_CODES, Zone } from '../../src/core/types.ts';
import type { GameEvent, GameEventType, Move, PieceId, SessionAction } from '../../src/core/types.ts';
import { SessionActionSchema, asSessionActions } from '../../src/services/save.ts';
import { levelFile } from '../core/moves.fixtures.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const GOLDEN_DIR = dirname(fileURLToPath(import.meta.url));
/** Faz 2R vertical slice (EN-2R-17): levels 1–10. */
const GOLDEN_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
/** K-46: at least 60 % of the solution's correct site placements come over the wall. */
const YAO_MIN = 0.6;

const XY = z.tuple([z.int(), z.int()]);
const StepSchema = z.object({
  /** LEVELS §2 letter (messages only). */
  piece: z.string(),
  /** `piece:<i>` / `piece:k<batch>_<i>` (GDD §14 reference). */
  ref: z.string(),
  shape: z.string(),
  /** Colour code; `-` for Ağır Yük. */
  color: z.enum([...COLOR_CODES, '-']),
  /** Yard anchor before the move. */
  from: XY,
  kind: z.enum(['overWall', 'rail', 'shift']),
  gap: z.optional(z.int()),
  /** Site anchor of a correct placement, new yard anchor of a shift. */
  to: XY,
  segmentCompleted: z.optional(z.int()),
  /** Truck pieces that land in this move's step 9, in FIFO order: `[ref, x, y]`. */
  delivered: z.optional(z.array(z.tuple([z.string(), z.int(), z.int()]))),
  /** Queue after the move ("Kamyonda: N"), FIFO order. */
  queue: z.optional(z.array(z.string())),
});
const GoldenSchema = z.object({
  level: z.int(),
  source: z.string(),
  levelHash: z.string().check(z.regex(/^[0-9a-f]{16}$/)),
  rulesVersion: z.int(),
  geo: z.object({ yard: XY, site: XY, H: z.int(), wall: z.int() }),
  /** JSON `moves` (LEVELS "Hamle"). */
  budget: z.int(),
  /** Solver `min` (K-50). */
  minMoves: z.int(),
  movesLeft: z.int(),
  yao: z.object({ overWall: z.int(), rail: z.int() }),
  steps: z.array(StepSchema),
  log: z.array(SessionActionSchema),
  eventLogHash: z.string().check(z.regex(/^[0-9a-f]{16}$/)),
  finalAscii: z.array(z.string()),
});
type Golden = z.output<typeof GoldenSchema>;
type GoldenStep = Golden['steps'][number];

const pad = (n: number): string => String(n).padStart(3, '0');

/** The hand golden of level `n` (schema-checked) and its log as session actions. */
function loadGolden(n: number): { golden: Golden; log: SessionAction[] } {
  const file = join(GOLDEN_DIR, `level_${pad(n)}.hand.json`);
  const parsed = GoldenSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')));
  if (!parsed.success) throw new Error(`${file}: ${JSON.stringify(parsed.error.issues)}`);
  return { golden: parsed.data, log: asSessionActions(parsed.data.log) };
}

const SolverGoldenSchema = z.object({
  level: z.int(),
  levelHash: z.string(),
  rulesVersion: z.int(),
  solverVersion: z.int(),
  min: z.int(),
  yao: z.object({ overWall: z.int(), rail: z.int() }),
  log: z.array(SessionActionSchema),
  eventLogHash: z.string(),
});

function idOf(lvl: CompiledLevel, ref: string): PieceId {
  const id = lvl.tutorialPieceIds.get(ref);
  if (id === undefined) throw new Error(`level ${lvl.id}: no piece ${ref}`);
  return id;
}

function ofType<T extends GameEventType>(ev: readonly GameEvent[], t: T): Extract<GameEvent, { t: T }>[] {
  return ev.filter((e): e is Extract<GameEvent, { t: T }> => e.t === t);
}

/** Bottom-left of the cells' bounding box = the piece anchor. */
function anchorOf(cells: readonly { readonly x: number; readonly y: number }[]): [number, number] {
  return [Math.min(...cells.map((c) => c.x)), Math.min(...cells.map((c) => c.y))];
}

function yardSpot(s: GameState, id: PieceId): [number, number, number] {
  return [pieceZone(s, id), pieceX(s, id), pieceY(s, id)];
}

/** Events that mean "not the documented solution": none may appear in a golden replay. */
const FORBIDDEN: readonly GameEventType[] = [
  'moveCancelled',
  'placementWrong',
  'pieceBounced',
  'mortarStuck',
  'glassBroke',
  'pieceReturned',
  'outOfMoves',
  'deadlockDetected',
  'truckHelp',
  'teardown',
];

interface Played {
  readonly session: GameSession;
  readonly events: GameEvent[];
}

/** Plays the golden log move by move and checks every step. */
function playGolden(lvl: CompiledLevel, golden: Golden, log: readonly SessionAction[]): Played {
  const sink = new ArraySink();
  const session = GameSession.start(lvl, {}, { strict: true }, sink);
  const moves = log.slice(1) as Move[];
  moves.forEach((move, i) => {
    const step = golden.steps[i] as GoldenStep;
    const where = `L${golden.level} step ${i + 1} (${step.piece})`;
    if (move.kind !== 'drag') throw new Error(`${where}: canonical solutions are drag moves only`);
    const s = session.state;
    expect(yardSpot(s, move.pieceId), `${where}: start cell`).toEqual([Zone.yard, ...step.from]);

    const first = sink.events.length;
    const res = session.commit(move, sink);
    const ev = sink.events.slice(first);
    const last = i === moves.length - 1;
    expect(res, `${where}: result`).toEqual({
      status: 'applied',
      reason: null,
      won: last,
      outOfMoves: false,
    });
    expect(
      ev.filter((e) => FORBIDDEN.includes(e.t)),
      `${where}: no cancel / wrong placement / Söküm`,
    ).toEqual([]);

    const moved = ofType(ev, 'pieceMoved').filter((e) => e.pieceId === move.pieceId);
    const entry = step.kind === 'shift' ? 'yard' : step.kind === 'rail' ? 'gap' : 'overWall';
    expect(
      moved.map((e) => [e.entry, e.gap]),
      `${where}: entry`,
    ).toEqual([[entry, step.kind === 'rail' ? step.gap : undefined]]);
    const correct = ofType(ev, 'placementCorrect');
    if (step.kind === 'shift') {
      expect(correct, `${where}: a shift places nothing (K-10)`).toEqual([]);
      expect(yardSpot(s, move.pieceId), `${where}: shift target`).toEqual([Zone.yard, ...step.to]);
    } else {
      expect(correct.length, `${where}: one correct placement`).toBe(1);
      const placed = correct[0] as Extract<GameEvent, { t: 'placementCorrect' }>;
      expect(placed.pieceId, `${where}: placed piece`).toBe(move.pieceId);
      expect(anchorOf(placed.cells), `${where}: landing cell`).toEqual(step.to);
      expect(placed.overWall, `${where}: over the wall (K-46)`).toBe(step.kind === 'overWall');
    }

    expect(
      ofType(ev, 'segmentCompleted').map((e) => e.seg),
      `${where}: segment completion (K-22)`,
    ).toEqual(step.segmentCompleted === undefined ? [] : [step.segmentCompleted]);

    const delivered = step.delivered ?? [];
    const arrived = ofType(ev, 'deliveryArrived').flatMap((e) => e.pieces);
    expect(arrived, `${where}: FIFO delivery order (K-25, K-26)`).toEqual(
      delivered.map(([ref]) => idOf(lvl, ref)),
    );
    for (const [ref, x, y] of delivered)
      expect(yardSpot(s, idOf(lvl, ref)), `${where}: ${ref} delivered`).toEqual([Zone.yard, x, y]);
    expect(queueIds(s), `${where}: truck queue (K-26)`).toEqual(
      (step.queue ?? []).map((ref) => idOf(lvl, ref)),
    );
    expect(stateInvariantErrors(s), `${where}: state invariants`).toEqual([]);
  });
  return { session, events: sink.events };
}

describe.each(GOLDEN_LEVELS)('golden level %i: canonical solution (LEVELS §2, solver)', (n) => {
  const lvl = levelFile(n);
  const { golden, log } = loadGolden(n);
  const json: unknown = JSON.parse(readFileSync(join(ROOT, 'levels', `level_${pad(n)}.json`), 'utf8'));

  it(`golden level ${n} transcription: piece refs, shapes, colours, geometry, budget and level hash match the level data`, () => {
    expect(golden.level).toBe(n);
    expect(golden.levelHash, 'levelHash of levels/level_NNN.json (K-43/4)').toBe(
      levelHash(LevelSchema.parse(json)),
    );
    expect(golden.rulesVersion).toBe(RULES_VERSION);
    expect(golden.geo).toEqual({
      yard: [lvl.geo.wy, lvl.geo.hy],
      site: [lvl.geo.ws, lvl.geo.hs],
      H: lvl.geo.h,
      wall: lvl.wallHeight,
    });
    expect(lvl.moves, 'LEVELS "Hamle"').toBe(golden.budget);
    expect(golden.movesLeft).toBe(golden.budget - golden.minMoves);
    expect(log[0]).toEqual({ kind: 'start', preBoosters: [], streakTier: 0 });
    expect(log.slice(1).every((a) => a.kind === 'drag')).toBe(true);
    expect(golden.steps.length).toBe(golden.minMoves);
    expect(log.length).toBe(golden.minMoves + 1);
    // K-47 / K-48: every material block is placed exactly once; a shift moves a block inside the yard
    const placed = golden.steps.filter((st) => st.kind !== 'shift').map((st) => st.ref);
    expect(new Set(placed).size, 'each block placed once').toBe(placed.length);
    expect(placed.length, 'N = material blocks').toBe(lvl.materialCount);
    expect(golden.yao.overWall + golden.yao.rail).toBe(placed.length);
    golden.steps.forEach((step, i) => {
      const where = `L${n} step ${i + 1} (${step.piece})`;
      const id = idOf(lvl, step.ref);
      const action = log[i + 1];
      expect(action?.kind === 'drag' ? action.pieceId : null, `${where}: pieceId`).toBe(id);
      const piece = lvl.pieces[id];
      const color = piece?.cls === 'cargo' ? '-' : COLOR_CODES[piece?.colorIndex ?? -1];
      expect([piece?.dataShape, color], `${where}: shape, colour`).toEqual([step.shape, step.color]);
    });
  });

  it(`K-50 K-46 level ${n}: the hand golden is the solver golden (canonical log, min, YAO, eventLogHash)`, () => {
    const solver = SolverGoldenSchema.parse(
      JSON.parse(readFileSync(join(GOLDEN_DIR, `level_${pad(n)}.solver.json`), 'utf8')),
    );
    expect(solver.level).toBe(n);
    expect(solver.levelHash).toBe(golden.levelHash);
    expect(solver.rulesVersion).toBe(RULES_VERSION);
    expect(asSessionActions(solver.log)).toEqual(log);
    expect(solver.min).toBe(golden.minMoves);
    expect(solver.yao).toEqual(golden.yao);
    expect(solver.eventLogHash).toBe(golden.eventLogHash);
  });

  it(`K-28 K-46 K-48 level ${n}: the canonical solution wins in the minimum with the documented YAO, no wrong placement`, () => {
    const { session, events } = playGolden(lvl, golden, log);
    expect(session.outcome).toBe('won');
    expect(session.movesMade).toBe(golden.minMoves);
    expect(session.movesLeft).toBe(golden.movesLeft);
    expect(ofType(events, 'levelWon').map((e) => e.movesLeft)).toEqual([golden.movesLeft]);
    expect(hdr(session.state, H.wrongCount)).toBe(0);
    const yao = session.yao();
    expect({ overWall: yao.overWall, rail: yao.rail }).toEqual(golden.yao);
    expect(yao.yao).toBe(golden.yao.overWall / (golden.yao.overWall + golden.yao.rail));
    expect(yao.yao ?? 0).toBeGreaterThanOrEqual(YAO_MIN);
    expect(toAscii(session.state)).toBe(golden.finalAscii.join('\n'));
    expect(
      eventLogHash(events),
      `L${n} eventLogHash changed (everything else green): check the log, then rerun levels:solve -- --update-golden`,
    ).toBe(golden.eventLogHash);
  });

  it(`K-43 level ${n}: the golden log replays bit for bit (replay = live state, same log)`, () => {
    const { session } = playGolden(lvl, golden, log);
    const replayed = GameSession.replay(lvl, log);
    expect(replayed.resumed).toBe(true);
    expect(replayed.outcome).toBe('won');
    expect(replayed.state.buf).toEqual(session.state.buf);
    expect(session.log).toEqual(log);
    expect(replayed.log).toEqual(log);
  });
});
