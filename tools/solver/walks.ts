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
import { Expander, infoKind, KIND_RAIL } from './expand.ts';
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

/** Shifts a lookahead player compares per move (a uniform sample; a full scan of Bolum 10 took 218 s). */
export const LOOK_CANDIDATES = 24;
/** Follow-up shifts a two-step lookahead compares per candidate (a uniform sample). */
export const LOOK2_SHIFTS = 12;
/** Plays of a policy proxy at the gate (CL-V3C-13: 200 plays gave a 95 % half-width of up to 7 points; `--games`). */
export const POLICY_GAMES_DEFAULT = 400;

export interface PolicyOptions {
  readonly plays?: number;
  readonly seed?: number;
  /** Share of moves chosen uniformly among all moves instead of by the policy (a careless player; default 0). */
  readonly eps?: number;
  /**
   * One-step lookahead (CL-V3C-01): with no correct placement in sight, take the yard shift that opens the most correct
   * placements (ties: uniformly random) instead of a random shift. A player who sees one move ahead.
   */
  readonly lookahead?: boolean;
  /**
   * Dig steps the lookahead player sees (CL-V3C2-03, P-Fl-1; LEVELS 8.16.5): 1 = the shift that opens the most correct
   * placements; 2 (default with `lookahead`) = when none of the candidate shifts opens a placement, each candidate is scored
   * by the most placements any of `LOOK2_SHIFTS` follow-up shifts opens (a player who sees through two lids stacked on a
   * dig; one step is blind to that). Ignored without `lookahead`.
   */
  readonly lookDepth?: 1 | 2;
}

/** A win rate of `games` plays with its Wilson 95 % score interval (CL-V3C-13). */
export interface PolicyRate {
  /** Point estimate, 2 decimals (the band gate reads this). */
  readonly rate: number;
  readonly wins: number;
  readonly games: number;
  /** Wilson 95 % interval, 2 decimals (reported only; it never decides a gate). */
  readonly ci: readonly [number, number];
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

/**
 * Wilson score interval of `wins` successes in `n` trials (z = 1.96 → 95 %): `[0, 0]` for `n = 0`. Unlike the normal
 * approximation it stays inside [0, 1] and is not empty at 0 or `n` wins. Exact (not rounded).
 */
export function wilsonInterval(wins: number, n: number, z = 1.96): [number, number] {
  if (n <= 0) return [0, 0];
  const p = wins / n;
  const z2 = z * z;
  const den = 1 + z2 / n;
  const mid = (p + z2 / (2 * n)) / den;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / den;
  return [Math.max(0, mid - half), Math.min(1, mid + half)];
}

function rateOf(wins: number, games: number): PolicyRate {
  const [lo, hi] = wilsonInterval(wins, games);
  return { rate: games === 0 ? 0 : round2(wins / games), wins, games, ci: [round2(lo), round2(hi)] };
}

/**
 * Win rate within `budget` of a "take any correct placement you can see" player (CL-V3-03 proxy for `greedyWin` /
 * `ahaMin`, which need the whole graph): at each state a uniformly random correct placement if one exists, else a
 * yard shift (random, or with `lookahead` the one that opens the most placements); with probability `eps` a uniformly
 * random move. A level the policy always wins has no decision to make; one it never wins is a wall. The spent moves are
 * the true counter difference, so a Y12 bonus placed correctly pays its moves back (K-62, CL-V3C-02: "play proxies apply
 * the bonus like the real game"). Deterministic (seeded). The point estimate of `policyWinRates` for one budget.
 */
export function policyWinRate(lvl: CompiledLevel, budget: number, opts: PolicyOptions = {}): number {
  return policyWinRates(lvl, [budget], opts)[0]?.rate ?? 0;
}

/**
 * `policyWinRate` for several budgets on the SAME plays (CL-V3C-13): every play runs to the largest budget, and it wins
 * within budget `b` when it is won without the counter reaching `b` first (the game's loss rule, K-07 (e): the loop
 * stops once `spent ≥ b`; a bonus may lower `spent` again only inside the larger budgets) and its final `spent ≤ b`.
 * So a larger budget never has a lower rate — measured separately the two seeded streams drift apart after the first
 * loss, and 200 plays put Bolum 6 at 0.25 within `moves` and 0.24 within `moves + N/2`. One result per budget, in
 * order, with its Wilson 95 % interval.
 */
export function policyWinRates(
  lvl: CompiledLevel,
  budgets: readonly number[],
  opts: PolicyOptions = {},
): PolicyRate[] {
  const plays = opts.plays ?? POLICY_GAMES_DEFAULT;
  const eps = opts.eps ?? 0;
  const look = opts.lookahead === true;
  const deep2 = look && (opts.lookDepth ?? 2) === 2;
  const maxBudget = budgets.reduce((a, b) => Math.max(a, b), 0);
  const hooks = levelHooks(lvl);
  const x = new Expander(lvl, hooks);
  const peek = look ? new Expander(lvl, hooks) : null;
  const dig = deep2 ? new Expander(lvl, hooks) : null;
  const followBuf: Int32Array[] = [];
  const rng = mulberry32((opts.seed ?? 1) * 104729 + lvl.materialCount);
  const cur: GameState = { lvl, buf: new Int32Array(lvl.layout.size) };
  const bufA = new Int32Array(lvl.layout.size);
  const bufB = new Int32Array(lvl.layout.size);
  const bufC = new Int32Array(lvl.layout.size);
  /** Correct placements available in a state (the lookahead score of a shift). */
  const placementsIn = (s: GameState): number => {
    let n = 0;
    const hh = hashState(s);
    peek?.expand(s, hh[0] ?? 0, hh[1] ?? 0, (_lo, _hi, info) => {
      if (infoKind(info) <= KIND_RAIL) n++;
    });
    return n;
  };
  /** Second dig step: the most placements any of `LOOK2_SHIFTS` shifts from `s` opens (uniform reservoir of the shifts). */
  const bestFollowUp = (s: GameState, pick: (n: number) => number): number => {
    let nShift = 0;
    const hh = hashState(s);
    dig?.expand(s, hh[0] ?? 0, hh[1] ?? 0, (_lo, _hi, info) => {
      if (infoKind(info) <= KIND_RAIL) return;
      nShift++;
      const slot = nShift <= LOOK2_SHIFTS ? nShift - 1 : pick(nShift);
      if (slot < LOOK2_SHIFTS)
        (followBuf[slot] ??= new Int32Array(lvl.layout.size)).set(dig.materialize().buf);
    });
    let best = 0;
    const follow: GameState = { lvl, buf: new Int32Array(lvl.layout.size) };
    for (let k = 0; k < Math.min(nShift, LOOK2_SHIFTS); k++) {
      const fb = followBuf[k];
      if (!fb) continue;
      follow.buf.set(fb);
      best = Math.max(best, placementsIn(follow));
    }
    return best;
  };
  const candBuf: Int32Array[] = [];
  const candCost: number[] = [];
  const scratch: GameState = { lvl, buf: new Int32Array(lvl.layout.size) };
  const wins = budgets.map(() => 0);
  /** Per budget: the play is still inside it (the counter never reached it before a move). */
  const open = budgets.map(() => true);
  for (let p = 0; p < plays; p++) {
    cur.buf.set(solverStart(lvl).buf);
    let spent = 0;
    open.fill(true);
    for (;;) {
      if (isLevelWon(cur)) break;
      for (let b = 0; b < budgets.length; b++) if (spent >= (budgets[b] ?? 0)) open[b] = false;
      if (spent >= maxBudget) break;
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
          costC = x.lastRawCost;
        }
        if (place) {
          nPlace++;
          if (rng.nextInt(nPlace) === 0) {
            bufA.set(x.materialize().buf);
            costA = x.lastRawCost;
          }
        } else if (look) {
          // reservoir of `LOOK_CANDIDATES` shifts (uniform): only those are scored, which keeps the proxy affordable
          nOther++;
          const slot = nOther <= LOOK_CANDIDATES ? nOther - 1 : rng.nextInt(nOther);
          if (slot < LOOK_CANDIDATES) {
            (candBuf[slot] ??= new Int32Array(lvl.layout.size)).set(x.materialize().buf);
            candCost[slot] = x.lastRawCost;
          }
        } else {
          nOther++;
          if (rng.nextInt(nOther) === 0) {
            bufB.set(x.materialize().buf);
            costB = x.lastRawCost;
          }
        }
      });
      if (nAll === 0) break;
      if (look && nPlace === 0 && nOther > 0) {
        // score the sampled shifts by the placements they open; keep the best (ties uniformly)
        let bestOpen = -1;
        let ties = 0;
        const nCand = Math.min(nOther, LOOK_CANDIDATES);
        const opens: number[] = [];
        let anyOpen = false;
        for (let k = 0; k < nCand; k++) {
          const cb = candBuf[k];
          if (!cb) continue;
          scratch.buf.set(cb);
          const o = placementsIn(scratch);
          opens[k] = o;
          if (o > 0) anyOpen = true;
        }
        // nothing opens a placement in one step: look one dig step further (a second shift)
        const second = deep2 && !anyOpen;
        for (let k = 0; k < nCand; k++) {
          const cb = candBuf[k];
          if (!cb) continue;
          let opened = opens[k] ?? 0;
          if (second) {
            scratch.buf.set(cb);
            opened = bestFollowUp(scratch, (n) => rng.nextInt(n));
          }
          if (opened > bestOpen) {
            bestOpen = opened;
            ties = 1;
            bufB.set(cb);
            costB = candCost[k] ?? 1;
          } else if (opened === bestOpen && rng.nextInt(++ties) === 0) {
            bufB.set(cb);
            costB = candCost[k] ?? 1;
          }
        }
      }
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
    if (isLevelWon(cur))
      for (let b = 0; b < budgets.length; b++)
        if (open[b] && spent <= (budgets[b] ?? 0)) wins[b] = (wins[b] ?? 0) + 1;
  }
  return wins.map((w) => rateOf(w, plays));
}
