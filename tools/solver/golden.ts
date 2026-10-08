/**
 * Hand-solution goldens of the Faz 2R levels (docs/TECH_DESIGN.md §2R.10, §9.5; WP-M): `tests/golden/level_NNN.hand.json`
 * from the solver's canonical solution (K-50 item 4), which LEVELS §2 "Kanonik çözüm" lists move by move. The canonical
 * log is played once more through `GameSession` (strict, step 12 on, as the game) and every move is described the way
 * LEVELS writes it: the block (letter, ref, shape, colour), its start anchor, the move kind (over the wall, rail through
 * gap g, or a yard shift), the landing anchor (site placements: the anchor of the correct cells; shifts: the new yard
 * anchor), the completed segment, the truck blocks of step 9 and the queue. The file also carries the board geometry
 * (`geo`), the final ASCII board (Appendix A) and the `eventLogHash` of the whole attempt.
 *
 * Written only by `levels:solve --update-golden` (levels/ only). tests/golden/hand.test.ts replays it; the independent
 * check is tests/review/data.review.test.ts, which reads LEVELS §2 and compares it with these files.
 */
import { GameSession } from '../../src/core/session.ts';
import { ArraySink, eventLogHash } from '../../src/core/moves.ts';
import { toAscii } from '../../src/core/ascii.ts';
import { pieceX, pieceY, queueIds } from '../../src/core/state.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import { COLOR_CODES } from '../../src/core/types.ts';
import type { At, GameEvent, GameEventType, Move, PieceId, SessionAction } from '../../src/core/types.ts';
import { pieceRef } from './metrics.ts';
import { refLabel } from './report.ts';
import type { SolveReport } from './solveLevel.ts';

export type HandStepKind = 'overWall' | 'rail' | 'shift';

export interface HandStep {
  /** LEVELS letter (`a`, `k1_0`). */
  readonly piece: string;
  /** `piece:<i>` / `piece:k<batch>_<i>` (GDD §14 reference, `CompiledLevel.tutorialPieceIds`). */
  readonly ref: string;
  readonly shape: string;
  /** Colour code, `-` for Ağır Yük (I5/Q9 cargo). */
  readonly color: string;
  /** Yard anchor before the move. */
  readonly from: readonly [number, number];
  readonly kind: HandStepKind;
  /** Gap index of a rail placement (K-12). */
  readonly gap?: number;
  /** Landing anchor: site anchor of a correct placement, new yard anchor of a shift. */
  readonly to: readonly [number, number];
  readonly segmentCompleted?: number;
  /** Truck blocks that land in this move's step 9, FIFO order: `[ref, x, y]`. */
  readonly delivered?: readonly (readonly [string, number, number])[];
  /** Truck queue after the move, FIFO order (only when not empty). */
  readonly queue?: readonly string[];
}

export interface HandGolden {
  readonly level: number;
  readonly source: string;
  readonly levelHash: string;
  readonly rulesVersion: number;
  readonly geo: {
    readonly yard: readonly [number, number];
    readonly site: readonly [number, number];
    readonly H: number;
    readonly wall: number;
  };
  /** JSON `moves` (LEVELS "Hamle"). */
  readonly budget: number;
  /** Solver `min` (K-50). */
  readonly minMoves: number;
  readonly movesLeft: number;
  readonly yao: { readonly overWall: number; readonly rail: number };
  readonly steps: readonly HandStep[];
  readonly log: readonly SessionAction[];
  readonly eventLogHash: string;
  readonly finalAscii: readonly string[];
}

function ofType<T extends GameEventType>(ev: readonly GameEvent[], t: T): Extract<GameEvent, { t: T }>[] {
  return ev.filter((e): e is Extract<GameEvent, { t: T }> => e.t === t);
}

/** Bottom-left of the cells' bounding box = the piece anchor. */
function anchorOf(cells: readonly At[]): [number, number] {
  return [Math.min(...cells.map((c) => c.x)), Math.min(...cells.map((c) => c.y))];
}

function atOf(a: At | string): [number, number] {
  if (typeof a === 'string') throw new Error(`hand golden: a yard anchor was expected, got "${a}"`);
  return [a.x, a.y];
}

/** The hand golden of a solved level (`r.canonical` replayed on `lvl`, the level of `r`). */
export function handGolden(r: SolveReport, lvl: CompiledLevel): HandGolden {
  if (r.status !== 'solved' || !r.metrics || !r.replay?.ok)
    throw new Error(`level ${r.level}: no replayed canonical solution (status ${r.status})`);
  const sink = new ArraySink();
  const session = GameSession.start(lvl, {}, { strict: true }, sink);
  const steps: HandStep[] = [];
  const moves = r.canonical.slice(1) as Move[];
  const ref = (id: PieceId): string => pieceRef(lvl, id);
  moves.forEach((move, i) => {
    if (move.kind !== 'drag') throw new Error(`level ${r.level}: canonical move ${i + 1} is not a drag`);
    const first = sink.events.length;
    const res = session.commit(move, sink);
    if (res.status !== 'applied') throw new Error(`level ${r.level}: canonical move ${i + 1} ${res.status}`);
    const ev = sink.events.slice(first);
    const moved = ofType(ev, 'pieceMoved').find((e) => e.pieceId === move.pieceId);
    if (!moved) throw new Error(`level ${r.level}: move ${i + 1} has no pieceMoved`);
    const p = lvl.pieces[move.pieceId];
    const placed = ofType(ev, 'placementCorrect').find((e) => e.pieceId === move.pieceId);
    const kind: HandStepKind = placed ? (moved.entry === 'gap' ? 'rail' : 'overWall') : 'shift';
    const seg = ofType(ev, 'segmentCompleted').map((e) => e.seg);
    const delivered = ofType(ev, 'deliveryArrived').flatMap((e) => e.pieces);
    const queue = queueIds(session.state);
    steps.push({
      piece: refLabel(ref(move.pieceId)),
      ref: ref(move.pieceId),
      shape: p?.dataShape ?? '?',
      color: p?.cls === 'cargo' ? '-' : (COLOR_CODES[p?.colorIndex ?? -1] ?? '?'),
      from: atOf(moved.from),
      kind,
      ...(kind === 'rail' && moved.gap !== undefined ? { gap: moved.gap } : {}),
      to: placed ? anchorOf(placed.cells) : atOf(moved.to),
      ...(seg.length > 0 ? { segmentCompleted: seg[0] } : {}),
      ...(delivered.length > 0
        ? {
            delivered: delivered.map(
              (id) => [ref(id), pieceX(session.state, id), pieceY(session.state, id)] as const,
            ),
          }
        : {}),
      ...(queue.length > 0 ? { queue: queue.map(ref) } : {}),
    });
  });
  if (session.outcome !== 'won') throw new Error(`level ${r.level}: the canonical replay ends ${session.outcome}`);
  const yao = session.yao();
  const hash = eventLogHash(sink.events);
  if (hash !== r.replay.eventLogHash)
    throw new Error(`level ${r.level}: eventLogHash ${hash} differs from the solver replay ${r.replay.eventLogHash}`);
  const g = lvl.geo;
  return {
    level: r.level,
    source: `docs/LEVELS.md §2 Bölüm ${r.level} — Kanonik çözüm (solver, GDD K-50 madde 4)`,
    levelHash: r.levelHash,
    rulesVersion: r.rulesVersion,
    geo: { yard: [g.wy, g.hy], site: [g.ws, g.hs], H: g.h, wall: lvl.wallHeight },
    budget: lvl.moves,
    minMoves: r.metrics.min,
    movesLeft: session.movesLeft,
    yao: { overWall: yao.overWall, rail: yao.rail },
    steps,
    log: session.log,
    eventLogHash: hash,
    finalAscii: toAscii(session.state).split('\n'),
  };
}
