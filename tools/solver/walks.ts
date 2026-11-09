/**
 * Random-walk dead-state gate for levels the whole-space scan cannot finish (CL-V3-01 option B; LEVELS §8.10 U-v3-2;
 * GDD K-51 item 2 replaced, for such a level only, by an estimate). Whole-space proof of "no undetected dead table"
 * (D-090) needs the complete state graph, which stops working at about 9 blocks. For a larger level the gate is:
 *
 *   - the large-level search found a solution that replays on the core (solvable; tools/solver/large.ts), and
 *   - `walks` seeded random plays (placements are 12 times as likely as yard shifts, so a walk makes progress) end
 *     either won, or in a state the runtime rescues (D1 no moves, D2 colour balance, D3a tiling: a Söküm), or
 *     unresolved. A uniform sample of the unresolved ends is probed with the beam search; an end the probe cannot win
 *     from is counted as an UNDETECTED DEAD end (the player would be stuck with moves left and no Söküm). The gate: the
 *     estimated share of such walks, `undetected / probed × unresolved / walks` ≤ `UNDETECTED_MAX` (1 %).
 *
 * Deterministic: one mulberry32 stream per level, no clock decides a result. It is an estimate, not a proof; the report
 * says so (D-090 stays open for such a level, and the K-51 item 2 whole-space statement is replaced by this rate).
 */
import { mulberry32 } from '../../src/core/rng.ts';
import type { GameState } from '../../src/core/state.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import { isLevelWon } from '../../src/core/moves.ts';
import { levelHooks } from '../../src/core/obstacles/registry.ts';
import { hashState } from '../../src/core/hash.ts';
import { detectDeadlock, noMoves } from '../../src/core/deadlock.ts';
import { Expander, infoCost, infoKind, KIND_RAIL } from './expand.ts';
import { solverStart } from './explore.ts';
import { scoreOf, solveLarge } from './large.ts';

/** A correct placement is this many times as likely as a yard shift in a walk (a walk should usually finish). */
const PLACEMENT_WEIGHT = 12;
/** Share of the moves of a walk played by the heuristic (the rest is weighted random). */
const CAREFUL = 0.8;

/** Gate: at most this share of the walks may end in an undetected dead end. */
export const UNDETECTED_MAX = 0.01;
/** Default walks of the gate (the owner-facing number; tests use fewer). */
export const WALKS_DEFAULT = 10_000;

export interface WalkOptions {
  readonly walks?: number;
  readonly seed?: number;
  /** Walk ends that are probed with the beam search (a uniform sample of the unresolved ones; default 200). */
  readonly sample?: number;
  /** Collect the buffers of the undetected ends (diagnosis only). */
  readonly keepFailed?: Int32Array[];
}

export interface WalkResult {
  readonly walks: number;
  readonly won: number;
  /** Ended in a state the runtime rescues (D1 / D2 / D3a). */
  readonly rescued: number;
  /** Ended unwon and undetected: the walks the beam probe was needed for (`won + rescued + unresolved = walks`). */
  readonly unresolved: number;
  /** Probed (a uniform sample of `unresolved`), and of those: the beam found a win / found none. */
  readonly probed: number;
  readonly stillSolvable: number;
  readonly undetected: number;
  /** Estimated share of walks that end in an undetected dead end: `undetected / probed × unresolved / walks`. */
  readonly rate: number;
  readonly ok: boolean;
}

/**
 * Three probe tiers per sampled end state: a quick beam (widths 16 / 64, 3 000 expansions), then — only when that finds no
 * win — width 256 (30 000 expansions), then width 512 (100 000 expansions; a measured 7–10 s). On level 10 every end the
 * two quick tiers gave up on was solved by the third one. "No win found" counts as dead (the pessimistic reading: the
 * rate is an upper estimate of the undetected dead ends, not a proof).
 */
function probeSolvable(lvl: CompiledLevel, buf: Int32Array): boolean {
  const start = { lvl, buf: buf.slice() };
  const quick = solveLarge(lvl, { widths: [16, 64], maxExpanded: 3_000, start, firstSolution: true });
  if (quick.status === 'solved') return true;
  const strong = solveLarge(lvl, { widths: [256], maxExpanded: 30_000, start, firstSolution: true });
  if (strong.status === 'solved') return true;
  const last = solveLarge(lvl, { widths: [512], maxExpanded: 100_000, start, firstSolution: true });
  return last.status === 'solved';
}

export function randomWalks(lvl: CompiledLevel, opts: WalkOptions = {}): WalkResult {
  const walks = opts.walks ?? WALKS_DEFAULT;
  const sampleSize = opts.sample ?? 200;
  const hooks = levelHooks(lvl);
  const x = new Expander(lvl, hooks);
  const rng = mulberry32((opts.seed ?? 1) * 7919 + lvl.materialCount);
  const cap = 6 * lvl.materialCount + 10;
  let won = 0;
  let rescued = 0;
  let unresolved = 0;
  const sample: Int32Array[] = [];
  const cur: GameState = { lvl, buf: new Int32Array(lvl.layout.size) };
  const pick = new Int32Array(lvl.layout.size);
  for (let w = 0; w < walks; w++) {
    cur.buf.set(solverStart(lvl).buf);
    let steps = 0;
    let stuck = false;
    while (!isLevelWon(cur) && steps < cap) {
      let total = 0;
      let have = false;
      const h = hashState(cur);
      // a careful player (CAREFUL share of the moves): the successor the search heuristic likes best (fewest blocks left to
      // place, most needed blocks holdable); otherwise a weighted random move. Careful walks mostly finish, so the
      // unresolved ends are the ends of players who erred, not of uniform noise.
      const careful = rng.next() < CAREFUL;
      let bestScore = Infinity;
      let ties = 0;
      x.expand(cur, h[0] ?? 0, h[1] ?? 0, (_lo, _hi, info) => {
        if (careful) {
          const succ = x.materialize();
          const sc = isLevelWon(succ) ? -Infinity : scoreOf(succ, hooks);
          if (sc < bestScore) {
            bestScore = sc;
            ties = 1;
            pick.set(succ.buf);
            have = true;
          } else if (sc === bestScore && rng.nextInt(++ties) === 0) pick.set(succ.buf);
          return;
        }
        const weight = infoKind(info) <= KIND_RAIL ? PLACEMENT_WEIGHT : 1;
        total += weight;
        if (rng.next() * total < weight) {
          pick.set(x.materialize().buf);
          have = true;
        }
      });
      if (!have) {
        stuck = true;
        break;
      }
      cur.buf.set(pick);
      steps++;
    }
    if (isLevelWon(cur)) {
      won++;
      continue;
    }
    if ((stuck && noMoves(cur, hooks.drag)) || detectDeadlock(cur, { table: null }) !== null) {
      rescued++;
      continue;
    }
    unresolved++;
    // reservoir sample (deterministic: the same rng stream)
    if (sample.length < sampleSize) sample.push(cur.buf.slice());
    else {
      const j = rng.nextInt(unresolved);
      if (j < sampleSize) sample[j] = cur.buf.slice();
    }
  }
  let stillSolvable = 0;
  let undetected = 0;
  for (const buf of sample) {
    if (probeSolvable(lvl, buf)) stillSolvable++;
    else {
      undetected++;
      opts.keepFailed?.push(buf);
    }
  }
  const rate = walks === 0 || sample.length === 0 ? 0 : (undetected / sample.length) * (unresolved / walks);
  return {
    walks,
    won,
    rescued,
    unresolved,
    probed: sample.length,
    stillSolvable,
    undetected,
    rate: Math.round(rate * 10_000) / 10_000,
    ok: rate <= UNDETECTED_MAX,
  };
}

export interface PolicyOptions {
  readonly plays?: number;
  readonly seed?: number;
  /** Share of moves chosen uniformly among all moves instead of by the policy (a careless player; default 0). */
  readonly eps?: number;
}

/**
 * Win rate within `budget` of a "take any correct placement you can see" player (CL-V3-03 proxy for `greedyWin` /
 * `ahaMin`, which need the whole graph): at each state a uniformly random correct placement if one exists, else a
 * uniformly random yard shift; with probability `eps` a uniformly random move. A level the policy always wins has no
 * decision to make; one it never wins is a wall. Deterministic (seeded).
 */
export function policyWinRate(lvl: CompiledLevel, budget: number, opts: PolicyOptions = {}): number {
  const plays = opts.plays ?? 400;
  const eps = opts.eps ?? 0;
  const hooks = levelHooks(lvl);
  const x = new Expander(lvl, hooks);
  const rng = mulberry32((opts.seed ?? 1) * 104729 + lvl.materialCount);
  const cur: GameState = { lvl, buf: new Int32Array(lvl.layout.size) };
  const bufA = new Int32Array(lvl.layout.size);
  const bufB = new Int32Array(lvl.layout.size);
  const bufC = new Int32Array(lvl.layout.size);
  let wins = 0;
  for (let p = 0; p < plays; p++) {
    cur.buf.set(solverStart(lvl).buf);
    let spent = 0;
    while (!isLevelWon(cur) && spent < budget) {
      let nPlace = 0;
      let nOther = 0;
      let nAll = 0;
      let costA = 0;
      let costB = 0;
      let costC = 0;
      const h = hashState(cur);
      x.expand(cur, h[0] ?? 0, h[1] ?? 0, (_lo, _hi, info) => {
        const place = infoKind(info) <= KIND_RAIL;
        nAll++;
        if (rng.nextInt(nAll) === 0) {
          bufC.set(x.materialize().buf);
          costC = infoCost(info);
        }
        if (place) {
          nPlace++;
          if (rng.nextInt(nPlace) === 0) {
            bufA.set(x.materialize().buf);
            costA = infoCost(info);
          }
        } else {
          nOther++;
          if (rng.nextInt(nOther) === 0) {
            bufB.set(x.materialize().buf);
            costB = infoCost(info);
          }
        }
      });
      if (nAll === 0) break;
      if (eps > 0 && rng.next() < eps) {
        cur.buf.set(bufC);
        spent += costC;
      } else if (nPlace > 0) {
        cur.buf.set(bufA);
        spent += costA;
      } else {
        cur.buf.set(bufB);
        spent += costB;
      }
    }
    if (isLevelWon(cur) && spent <= budget) wins++;
  }
  return plays === 0 ? 0 : Math.round((wins / plays) * 100) / 100;
}
