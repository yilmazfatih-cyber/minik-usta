/**
 * The canonical solution is always replayed on the real core from the start (docs/TECH_DESIGN.md §2R.5
 * "Belirlenimcilik", §9.1): `GameSession.replay` (strict), K-35 step 12 ON as in the game. The replay must apply every
 * move, reach the solver's state after each one (Zobrist equality), win on the last one, and never trigger a wrong
 * placement, a cancel, the out-of-moves window, a deadlock check result or a Söküm (a D3a false "dead" on the path would
 * show here). The event log of the replay gives the golden `eventLogHash` (TECH §6.3, §9.5).
 */
import { GameSession, ReplayError } from '../../src/core/session.ts';
import { ArraySink, eventLogHash } from '../../src/core/moves.ts';
import { hashState } from '../../src/core/hash.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import type { GameEvent, SessionAction } from '../../src/core/types.ts';

export interface ReplayCheck {
  readonly ok: boolean;
  /** First failure, null when ok. */
  readonly message: string | null;
  readonly eventLogHash: string | null;
  readonly events: number;
}

const FORBIDDEN: ReadonlySet<GameEvent['t']> = new Set<GameEvent['t']>([
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
]);

/**
 * Replays `log` (`start` + drags) and compares the state after action i with `expected[i − 1]` (`[lo, hi]` hash lanes).
 * The level's own budget is used: run it only when `min ≤ moves`.
 */
export function replayCanonical(
  lvl: CompiledLevel,
  log: readonly SessionAction[],
  expected: readonly (readonly [number, number])[],
): ReplayCheck {
  const sink = new ArraySink();
  const r: { failure: string | null } = { failure: null };
  try {
    const session = GameSession.replay(lvl, log, { strict: true }, sink, (i, _action, sess) => {
      if (i === 0 || r.failure) return;
      const h = hashState(sess.state);
      const want = expected[i - 1];
      if (!want || h[0] !== want[0] || h[1] !== want[1])
        r.failure = `move ${i}: the replayed state differs from the solver's state (Zobrist)`;
    });
    if (!r.failure && session.outcome !== 'won') r.failure = `the replay ends ${session.outcome}, not won`;
  } catch (e) {
    r.failure =
      e instanceof ReplayError ? e.message : `replay threw: ${e instanceof Error ? e.message : String(e)}`;
  }
  const bad = sink.events.find((e) => FORBIDDEN.has(e.t));
  if (!r.failure && bad) r.failure = `the replay produced a forbidden event ${bad.t} (step ${bad.step})`;
  const failure = r.failure;
  return {
    ok: failure === null,
    message: failure,
    eventLogHash: failure === null ? eventLogHash(sink.events) : null,
    events: sink.events.length,
  };
}
