/**
 * One level through the solve stage (docs/TECH_DESIGN.md §2R.5; GDD K-45 item 9, K-46, K-50…K-53): parse + validate,
 * compile, full exploration, K-50 metrics, the canonical solution and its replay on the real core, the solve-stage
 * checks (L-19, L-27, L-32…L-35), the K-52 move band and the LEVEL_REPORT variants. Pure apart from the clock used for
 * the safety time limit; the CLI (tools/solve.ts) and the worker call it.
 */
import { validateLevelJson } from '../../src/core/level/logic.ts';
import type { LevelData } from '../../src/core/level/schema.ts';
import { compile } from '../../src/core/level/compile.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import { RULES_VERSION, levelHash } from '../../src/core/session.ts';
import { geoLabel } from '../../src/core/geometry.ts';
import type { SessionAction } from '../../src/core/types.ts';
import { explore } from './explore.ts';
import type { ExploreStats } from './explore.ts';
import { astarMin } from './astar.ts';
import { fastYardBlockers } from './expand.ts';
import { canonicalActions, computeMetrics, movesBand, puzzleChecks } from './metrics.ts';
import type { CanonicalStep, MovesBand, PuzzleMetrics, SolveIssue } from './metrics.ts';
import { checkTutorialHands } from './tutorial.ts';
import { d099Checks } from './puzzle.ts';
import { specGaps, specNote } from './spec.ts';
import type { SpecGap } from './spec.ts';
import { isFixedYardLevel } from '../../src/core/level/schema.ts';
import { replayCanonical } from './verify.ts';
import type { ReplayCheck } from './verify.ts';
import { VARIANTS, applyVariant, variantApplies, variantBandOk } from './variants.ts';
import { largeActions, solveLarge } from './large.ts';
import { POLICY_GAMES_DEFAULT, policyWinRates, randomWalks, WALKS_DEFAULT } from './walks.ts';
import type { PolicyRate, WalkResult } from './walks.ts';
import { v3Metrics } from './v3metrics.ts';
import type { V3Metrics } from './v3metrics.ts';
import { schemaVersionOf } from '../../src/core/level/schema.ts';
import type { VariantName } from './variants.ts';

/**
 * Bump when the solver's results can change for the same level and rules (cache key with `levelHash` and
 * `RULES_VERSION`, TECH §2R.5). 4 = levels v3 (K-64 measures, v3 gates, large-level search, TECH §V3). 7 = CL-V3C-13:
 * the play proxies run `policyGames` plays (default 400), tight and loose on the same plays, with Wilson 95 % intervals.
 * 8 = CL-V3C2-03 (P-Fl-1): the lookahead proxy sees two dig steps (`lookDepth` 2; LEVELS 8.16.5).
 */
export const SOLVER_VERSION = 8;

export interface SolveOptions {
  readonly maxStates?: number;
  readonly maxMs?: number;
  /** D3a on states entered by a placement or a delivery (`d3aMaxExpansions`; default true). */
  readonly d3a?: boolean;
  /** Also solve the applicable variants for LEVEL_REPORT (default true). */
  readonly variants?: boolean;
  /** Solve this variant instead of the level (`--variant`). */
  readonly variant?: VariantName;
  /**
   * v3 (U-v3-2): when the exploration is incomplete, run the large-level search for the best found solution (default
   * true for a `schemaVersion` 3 level). It never replaces the whole-space gates (D-090).
   */
  readonly large?: boolean;
  /** Time limit of the large-level search (default `LARGE_MAX_MS` = 60 000). */
  readonly largeMs?: number;
  /** Random walks of the large-level dead-state gate (default `WALKS_DEFAULT` = 10 000; CL-V3-01). */
  readonly walks?: number;
  /** Walk ends the beam probes (default 200; the tests use fewer). */
  readonly walkSample?: number;
  /** Plays of each play proxy (`--games`; default `POLICY_GAMES_DEFAULT` = 400, CL-V3C-13; the tests use fewer). */
  readonly policyGames?: number;
}

/** What the report keeps of a large-level search (tools/solver/large.ts). */
export interface LargeSummary {
  readonly status: 'solved' | 'unknown';
  /** Best found cost: an upper bound of `min` ("en iyi bulunan"). */
  readonly best: number | null;
  readonly lowerBound: number;
  /** Proven minimum (best = lower bound); otherwise "optimal değil, en iyi bulunan". */
  readonly optimal: boolean;
  readonly width: number | null;
  readonly yao: { readonly overWall: number; readonly rail: number; readonly value: number | null };
  readonly states: number;
  readonly ms: number;
  readonly replayOk: boolean;
  readonly runs: readonly { readonly width: number; readonly cost: number | null; readonly ms: number }[];
  /** `start` + the found drags. */
  readonly actions: readonly SessionAction[];
  /** CL-V3-01 option B: the random-walk dead-state gate that replaces the whole-space scan (null when not run). */
  readonly walks?: WalkResult | null;
  /**
   * CL-V3-03 proxy for `greedyWin` / `ahaMin` (they need the whole graph): win rate of a "take a correct placement you
   * see" player within `moves` (tight) and within `moves` + N / 2 (loose); null when not run.
   */
  readonly policy?: {
    readonly tight: number;
    readonly loose: number;
    /** CL-V3C-01 / CL-V3C2-03: lookahead (2 dig steps), eps 0.1, within `moves` (bonus applied as in the game, CL-V3C-02). */
    readonly look: number | null;
    /** CL-V3C-13: plays per proxy; tight and loose come from the same plays (loose ≥ tight). */
    readonly games: number;
    /** CL-V3C-13: Wilson 95 % intervals (reported only; the band gate reads the point estimate). */
    readonly ci: {
      readonly tight: readonly [number, number];
      readonly loose: readonly [number, number];
      readonly look: readonly [number, number] | null;
    };
  } | null;
}

/** A level with at least this many material blocks skips the whole-space scan (it stops working at 8–10, B2). */
export const LARGE_MIN_BLOCKS = 9;

export type SolveStatus = 'solved' | 'unsolvable' | 'unknown' | 'invalid';

export interface VariantResult {
  readonly name: VariantName;
  readonly status: Exclude<SolveStatus, 'invalid'>;
  readonly min: number | null;
  /** LEVELS band: no-gaps min − min ≥ 1, min − hammer-start min ≥ 2 (null when the level's min is unknown). */
  readonly bandOk: boolean | null;
  readonly states: number;
  readonly ms: number;
}

export interface SolveStats extends ExploreStats {
  readonly complete: boolean;
  readonly limit: string | null;
  /** Exploration + metrics + replay + variants. */
  readonly totalMs: number;
}

export interface SolveReport {
  readonly level: number;
  readonly file: string | null;
  readonly levelHash: string;
  readonly rulesVersion: number;
  readonly solverVersion: number;
  readonly variant: VariantName | null;
  /** GDD §14 `schemaVersion` of the level (2 = K-55 fixed yard); null when the file did not validate. */
  readonly schemaVersion: 1 | 2 | null;
  readonly status: SolveStatus;
  readonly geometry: string | null;
  readonly difficulty: string | null;
  readonly teaches: string | null;
  readonly moves: number | null;
  readonly metrics: PuzzleMetrics | null;
  /** K-52 band for `min` (null without a solution). */
  readonly band: MovesBand | null;
  /** `start` + drags (TECH §11.1 `inLevel.actions`); empty without a solution. */
  readonly canonical: readonly SessionAction[];
  readonly steps: readonly CanonicalStep[];
  readonly replay: ReplayCheck | null;
  readonly variants: readonly VariantResult[];
  readonly issues: readonly SolveIssue[];
  readonly notes: readonly string[];
  /** P4B-02: metrics (measured value or `targets` band) outside the LEVELS §6.6 Tablo B specification; `[]` for older cached reports. */
  readonly specGaps?: readonly SpecGap[];
  readonly stats: SolveStats | null;
  /** v3 measures (GDD §16 K-64) of the canonical / best found solution; null otherwise (older cached reports: absent). */
  readonly v3?: V3Metrics | null;
  /** Large-level search (U-v3-2) of an incomplete exploration; null when not run. */
  readonly large?: LargeSummary | null;
}

export interface SolveContext {
  /** Level number from the file name (L-01 `id_mismatch`). */
  readonly fileId?: number;
  readonly file?: string;
}

function issue(
  code: string,
  rule: string,
  check: string,
  severity: 'error' | 'warn',
  path: string,
  message: string,
): SolveIssue {
  return { code, rule, check, severity, path, message };
}

/** Parses and validates the JSON (validate stage without mechanic history / i18n), then solves it. */
export function solveLevelJson(json: unknown, ctx: SolveContext = {}, opts: SolveOptions = {}): SolveReport {
  const t0 = performance.now();
  const { level, issues } = validateLevelJson(json, ctx.fileId !== undefined ? { fileId: ctx.fileId } : {});
  const errors = issues.filter((i) => i.severity === 'error');
  if (!level || errors.length > 0) {
    const id =
      typeof (json as { id?: unknown })?.id === 'number' ? (json as { id: number }).id : (ctx.fileId ?? 0);
    return {
      level: id,
      file: ctx.file ?? null,
      levelHash: levelHash(json),
      rulesVersion: RULES_VERSION,
      solverVersion: SOLVER_VERSION,
      variant: opts.variant ?? null,
      schemaVersion: null,
      status: 'invalid',
      geometry: null,
      difficulty: null,
      teaches: null,
      moves: null,
      metrics: null,
      band: null,
      canonical: [],
      steps: [],
      replay: null,
      variants: [],
      issues: [
        issue(
          'level_invalid',
          'K-45',
          'tool',
          'error',
          '(file)',
          `the validate stage fails (${[...new Set(errors.map((e) => e.code))].join(', ')}); run levels:validate`,
        ),
      ],
      notes: [],
      stats: { ...EMPTY_STATS, totalMs: Math.round(performance.now() - t0) },
    };
  }
  return solveLevelData(level, ctx, opts, t0);
}

const EMPTY_STATS: Omit<SolveStats, 'totalMs'> = {
  states: 0,
  expanded: 0,
  edges: 0,
  ms: 0,
  bytes: 0,
  dragSessions: 0,
  applyMoves: 0,
  fastYardMoves: 0,
  d3aRuns: 0,
  d3aMaxExpansions: 0,
  d3aUnknown: 0,
  complete: false,
  limit: null,
};

/** Solves parsed level data (tests use it directly; the logic checks are the caller's). */
export function solveLevelData(
  data: LevelData,
  ctx: SolveContext = {},
  opts: SolveOptions = {},
  t0: number = performance.now(),
): SolveReport {
  const hash = levelHash(data);
  const level = opts.variant ? applyVariant(data, opts.variant) : data;
  const lvl = compile(level);
  const bigLevel = lvl.materialCount >= LARGE_MIN_BLOCKS && (opts.large ?? schemaVersionOf(level) === 3);
  const g = explore(lvl, {
    ...(bigLevel ? { maxStates: 2_000 } : opts.maxStates !== undefined ? { maxStates: opts.maxStates } : {}),
    ...(opts.maxMs !== undefined ? { maxMs: opts.maxMs } : {}),
    ...(opts.d3a !== undefined ? { d3a: opts.d3a } : {}),
  });
  const notes: string[] = [...g.unsupported];
  const blockers = fastYardBlockers(lvl, g.hooks);
  if (blockers.length > 0) notes.push(`fast yard path off (${blockers.join(', ')})`);
  const out: SolveIssue[] = [];
  let status: SolveStatus;
  let metrics: PuzzleMetrics | null = null;
  let steps: readonly CanonicalStep[] = [];
  let band: MovesBand | null = null;
  let specGapList: readonly SpecGap[] = [];
  let replay: ReplayCheck | null = null;
  const isVariant = opts.variant !== undefined;

  const fixedYard = isFixedYardLevel(level);
  const v3Level = schemaVersionOf(level) === 3;
  let v3: V3Metrics | null = null;
  let large: LargeSummary | null = null;
  if (!g.complete) {
    status = 'unknown';
    if (opts.large ?? v3Level) {
      // deterministic budget (CL-V3-01): widths up to 512 and an expansion cap decide the result, never the machine speed;
      // the time limit is only a safety net far above what a level needs
      const r = solveLarge(lvl, {
        widths: [8, 32, 128, 512],
        maxExpanded: 150_000,
        maxMs: opts.largeMs ?? 300_000,
      });
      large = {
        status: r.status,
        best: r.best,
        lowerBound: r.lowerBound,
        optimal: r.optimal,
        width: r.width,
        yao: r.yao,
        states: r.states,
        ms: r.ms,
        replayOk: r.replayOk,
        runs: r.runs,
        actions: r.status === 'solved' ? largeActions(r.steps) : [],
      };
      if (r.status === 'solved') {
        v3 = v3Metrics(lvl, r.steps);
        notes.push(
          `large-level search (U-v3-2): best found ${r.best} (lower bound ${r.lowerBound})${r.optimal ? ' = min (proven at the lower bound)' : ' — not proven optimal, en iyi bulunan'}; width ${r.width}, ${r.states} states, ${r.ms} ms, replay ok`,
        );
        // CL-V3-01 option B: solvable (the found solution replays on the core) + the random-walk dead-state gate
        const w = randomWalks(lvl, {
          walks: opts.walks ?? WALKS_DEFAULT,
          seed: level.id,
          ...(opts.walkSample !== undefined ? { sample: opts.walkSample } : {}),
        });
        const loose = level.moves + Math.round(lvl.materialCount / 2);
        const games = opts.policyGames ?? POLICY_GAMES_DEFAULT;
        // CL-V3C-13: tight and loose on the same plays (a larger budget never wins less)
        const [tightR, looseR] = policyWinRates(lvl, [level.moves, loose], { plays: games, seed: level.id });
        // only a level with a `targets.policyWin` band is measured (the sampled lookahead takes 2-40 s per level)
        const lookR: PolicyRate | null =
          level.targets?.policyWin === undefined
            ? null
            : (policyWinRates(lvl, [level.moves], {
                plays: games,
                seed: level.id,
                lookahead: true,
                eps: 0.1,
              })[0] ?? null);
        const ciText = (r: PolicyRate | null | undefined): string =>
          r ? `${r.rate} (95 % CI ${r.ci[0]}-${r.ci[1]}, ${r.wins}/${r.games})` : '-';
        const policy = {
          tight: tightR?.rate ?? 0,
          loose: looseR?.rate ?? 0,
          look: lookR?.rate ?? null,
          games,
          ci: {
            tight: tightR?.ci ?? ([0, 0] as const),
            loose: looseR?.ci ?? ([0, 0] as const),
            look: lookR?.ci ?? null,
          },
        };
        large = { ...large, walks: w, policy };
        if (level.difficulty !== 'easy' && policy.loose > 0.7)
          out.push(
            issue(
              'puzzle_greedy_easy',
              'K-51/9',
              'L-39',
              'warn',
              'yard',
              `policy win ${policy.loose} > 0.70 within moves + N/2: a player who always takes a visible correct placement finishes inside the budget (proxy for greedyWin, CL-V3-03)`,
            ),
          );
        const pBand = level.targets?.policyWin;
        if (pBand && policy.look !== null && (policy.look < pBand[0] || policy.look > pBand[1]))
          out.push(
            issue(
              'metric_out_of_band',
              'K-51/3',
              'L-33',
              'warn',
              'targets.policyWin',
              `policyWin = ${policy.look} is outside [${pBand[0]}, ${pBand[1]}] (lookahead player (2 dig steps), eps 0.1, within ${level.moves} moves, ${games} plays, 95 % CI ${policy.ci.look?.[0] ?? '-'}-${policy.ci.look?.[1] ?? '-'}; the point estimate decides; CL-V3C-01, CL-V3C-13)`,
            ),
          );
        if (policy.look !== null)
          notes.push(
            `lookahead proxy (CL-V3C-01, CL-V3C2-03): lookahead with 2 dig steps, eps 0.1, wins ${ciText(lookR)} within ${level.moves} moves (bonus applied like the game)`,
          );
        notes.push(
          `play proxy (CL-V3-03; not ahaMin): placement-first player wins ${ciText(tightR)} within ${level.moves} moves, ${ciText(looseR)} within ${loose} (same plays)`,
        );
        const best = r.best ?? 0;
        const ctl = (code: string, rule: string, check: string, path: string, message: string): void => {
          out.push(issue(code, rule, check, 'error', path, message));
        };
        const sess = replayCanonical(lvl, large.actions, null);
        if (!sess.ok)
          ctl(
            'solver_replay_mismatch',
            'K-43',
            'tool',
            '(level)',
            `the found solution does not replay: ${sess.message}`,
          );
        else replay = sess;
        band = movesBand(best, level.difficulty, level.teaches !== undefined, fixedYard);
        if (level.moves < Math.max(best, band.lo) || level.moves > band.hi)
          ctl(
            'moves_budget',
            'K-52',
            'L-19',
            'moves',
            `moves ${level.moves} is outside [${Math.max(best, band.lo)}, ${band.hi}] (best found ${best} + P ${band.T} + a, 0 ≤ a ≤ ${band.A}; ${band.row} row)`,
          );
        if (r.yao.value !== null && r.yao.value < 0.6)
          ctl(
            'yao_low',
            'K-46',
            'L-19',
            'build',
            `YAO ${r.yao.overWall}/${r.yao.overWall + r.yao.rail} < 0.60`,
          );
        const n = lvl.materialCount;
        if (level.id >= 3 && r.lowerBound <= n)
          ctl(
            'puzzle_first_reachable',
            'K-51/1',
            'L-32',
            'yard',
            'a correct placement is possible at the start (id ≥ 3 needs a dig first)',
          );
        if (level.id >= 3 && best <= n)
          ctl(
            'puzzle_no_shift',
            'K-51/1',
            'L-32',
            'yard',
            `best found ${best} = N ${n}: id ≥ 3 needs ≥ 1 shift`,
          );
        if (!w.ok)
          ctl(
            'undetected_dead',
            'K-51/2',
            'L-27',
            'yard',
            `an estimated ${(w.rate * 100).toFixed(2)} % of ${w.walks} random walks end in an undetected dead end (${w.undetected} of ${w.probed} probed ends, ${w.unresolved} unresolved) > 1 %`,
          );
        notes.push(
          `dead-state gate (CL-V3-01 B, estimate not proof; D-090 whole-space scan not run): ${w.walks} random walks: won ${w.won}, rescued by D1/D2/D3a ${w.rescued}, unresolved ${w.unresolved} (probed ${w.probed}: solvable ${w.stillSolvable}, undetected dead ${w.undetected}) → estimated ${(w.rate * 100).toFixed(2)} %`,
        );
        out.push(...v3Checks(level, v3));
        status = 'solved';
      } else notes.push(`large-level search (U-v3-2): no solution within ${r.ms} ms (${r.states} states)`);
    }
    if (status !== 'solved') {
      // K-51 item 7 (a), D-099: the dead-table gate needs a complete scan; a v2 level without one is not shipped
      if (fixedYard)
        out.push(
          issue(
            'scan_incomplete',
            'K-51/7',
            'L-37',
            'error',
            '(level)',
            `schemaVersion 2: the state space was not scanned to the end (${g.count} states, ${g.limit}); shrink the yard or N (LEVELS §6.3)`,
          ),
        );
      out.push(
        issue(
          'solve_unknown',
          'K-45/9',
          'tool',
          'error',
          '(level)',
          `exploration stopped at ${g.count} states (${g.limit}): min, the canonical solution and every K-50 metric are unknown`,
        ),
        issue(
          'trap_scan_incomplete',
          'K-51/2',
          'L-27',
          'warn',
          'yard',
          'the scope K was not scanned to the end',
        ),
      );
    }
  } else {
    const res = computeMetrics(g, level.moves);
    if (!res.metrics) {
      status = 'unsolvable';
      out.push(
        issue(
          'unsolvable',
          'K-45/9',
          'L-19',
          'error',
          '(level)',
          `no drag sequence wins (${g.count} states explored, no truck help, no boosters)`,
        ),
      );
    } else {
      status = 'solved';
      metrics = res.metrics;
      steps = res.canonical;
      band = movesBand(metrics.min, level.difficulty, level.teaches !== undefined, fixedYard);
      out.push(...puzzleChecks({ level, lvl, metrics, canonical: steps, complete: g.complete }));
      // v1 (Faz 2R) tool gates; a v2 level replaces both with `undetected_dead` (K-51 item 7 b): a trap that D2/D3a
      // catch is a Söküm, allowed on Zor/Çok Zor (trap_warn), forbidden on Kolay/Normal (trap_in_easy)
      if (!fixedYard && metrics.deadRate > 0)
        out.push(
          issue(
            'dead_table_missing',
            'K-30',
            'tool',
            'error',
            '(level)',
            `deadRate ${metrics.deadRate.toFixed(3)} > 0 but the D3b table export is cut 1 (Faz 3): a level without a table must have deadRate 0 (TECH §2R.4)`,
          ),
        );
      const de = metrics.deadEntries;
      if (de.states > 0)
        notes.push(
          `whole space: ${de.edges} move(s) from a live state lead into ${de.states} dead state(s) (${de.shiftEdges} of them shifts whose delivery buries a block, not K-50 ✓-traps); D1/D2/D3a catch ${de.caught} state(s), ${de.states - de.caught} would need the D3b table (cut 1, Faz 3)`,
        );
      if (v3Level) {
        v3 = v3Metrics(lvl, steps, { g, dist: res.dist.dist, pathStates: res.pathStates });
        out.push(...v3Checks(level, v3));
      }
      if (fixedYard) {
        out.push(...d099Checks(level, metrics.d099));
        specGapList = specGaps(level, metrics);
        const sn = specNote(specGapList);
        if (sn !== null) notes.push(sn);
      } else out.push(...wholeSpaceGate(metrics), ...deliveryChecks(metrics));
      const penaltyFree = steps.every((st) => st.cost === 1 && st.kind !== 'wait');
      if (penaltyFree && !metrics.minIsNPlusShifts)
        notes.push(`K-50 item 2: min ${metrics.min} ≠ N ${metrics.N} + minShifts ${metrics.minShifts}`);
      if (!isVariant) {
        const tut = checkTutorialHands(g, level, steps, res.pathStates, res.dist.dist);
        out.push(...tut.issues);
        notes.push(...tut.notes);
        if (metrics.min <= level.moves) {
          replay = replayCanonical(
            lvl,
            canonicalActions(steps),
            res.pathStates.slice(1).map((s) => [g.space.hashLo(s), g.space.hashHi(s)] as const),
          );
          if (!replay.ok)
            out.push(
              issue(
                'solver_replay_mismatch',
                'K-43',
                'tool',
                'error',
                '(level)',
                `the canonical solution does not replay on the core: ${replay.message}`,
              ),
            );
        } else notes.push(`replay skipped: min ${metrics.min} > moves ${level.moves}`);
      }
    }
  }

  const variants: VariantResult[] = [];
  if (!isVariant && opts.variants !== false) {
    for (const v of VARIANTS) {
      if (!variantApplies(level, v)) continue;
      variants.push(solveVariantMin(level, v, metrics?.min ?? null, opts));
    }
  }

  return {
    level: level.id,
    file: ctx.file ?? null,
    levelHash: hash,
    rulesVersion: RULES_VERSION,
    solverVersion: SOLVER_VERSION,
    variant: opts.variant ?? null,
    schemaVersion: fixedYard ? 2 : 1,
    status,
    geometry: geoLabel(lvl.geo),
    difficulty: level.difficulty,
    teaches: level.teaches ?? null,
    moves: level.moves,
    metrics,
    band,
    canonical: metrics ? canonicalActions(steps) : [],
    steps,
    replay,
    variants,
    issues: out,
    notes,
    specGaps: specGapList,
    stats: { ...g.stats, complete: g.complete, limit: g.limit, totalMs: Math.round(performance.now() - t0) },
    v3,
    large,
  };
}

/**
 * v3 solve-stage gates (GDD §16 ÖNERİ K-64; LEVELS §8.6): `lift_low` (error: `liftRatio` < 0.60 on every v3 level),
 * `shape_decisions_low` (error from story 2, warn in story 1 — CL-V3-02, pending the product-lead's B3 decision: `shapeDecisions` < 2 on Normal / Hard / Çok Zor). `traitDelta` needs the bot's
 * "ignore the trait" mode (U-v3-3) and is not measured yet: a note, never a pass.
 */
export function v3Checks(level: LevelData, m: V3Metrics): SolveIssue[] {
  const out: SolveIssue[] = [];
  if (m.liftRatio !== null && m.liftRatio < 0.6)
    out.push(
      issue(
        'lift_low',
        'K-64/1',
        'L-42',
        'error',
        'yard',
        `liftRatio ${m.liftRatio} (${m.lifted}/${m.placements}) < 0.60: too many blocks slide in from above the wall top (LEVELS §8.1 Karar 9)`,
      ),
    );
  if (level.difficulty !== 'easy' && m.shapeDecisions !== null && m.shapeDecisions < 2)
    out.push(
      issue(
        'shape_decisions_low',
        'K-64/2',
        'L-42',
        level.chapter <= 1 ? 'warn' : 'error',
        'yard',
        `shapeDecisions ${m.shapeDecisions} < 2 on a ${level.difficulty} level: add a two-tone twin or an overhang shape (LEVELS §8.6)`,
      ),
    );
  return out;
}

/**
 * GDD K-51 item 2 "Bütün uzay kapısı" (tool gate, error; TECH §2R.4 cut 1): with no D3b table (every Faz 2R level), no
 * dead state may be entered from a live one by any drag move (placement, rail or shift, step-9 delivery included)
 * unless D1/D2/D3a catch it (K-30): the player would be stuck with no Söküm until the budget runs out. Reported with the
 * `dead_table_missing` code (the K-50 `deadRate > 0` gate is its scope-K special case).
 */
export function wholeSpaceGate(m: PuzzleMetrics): SolveIssue[] {
  const uncaught = m.deadEntries.states - m.deadEntries.caught;
  if (uncaught <= 0) return [];
  return [
    issue(
      'dead_table_missing',
      'K-51/2',
      'tool',
      'error',
      '(level)',
      `whole space: ${uncaught} dead state(s) entered from a live state are not caught by D1/D2/D3a (${m.deadEntries.edges} move(s), ${m.deadEntries.shiftEdges} of them shifts); without the D3b table (cut 1, Faz 3) no Söküm would come (GDD K-51 item 2)`,
    ),
  ];
}

/** GDD K-51 item 5 "Teslimat adaleti": every truck batch k ≥ 1 needs g(k) = 0 and f(k) = 0 (`delivery_foresight`, warn). */
export function deliveryChecks(m: PuzzleMetrics): SolveIssue[] {
  const out: SolveIssue[] = [];
  for (const d of m.delivery) {
    if (d.g === 0 && d.f === 0) continue;
    out.push(
      issue(
        'delivery_foresight',
        'K-51/5',
        'tool',
        'warn',
        'yard.batches',
        `batch for segment ${d.forSegment}: D ${d.D}, ${d.states} delivery state(s) at D, their distance to a win ${d.distMin ?? 'dead'}…${d.distMax ?? 'dead'} → foresight gain g = ${d.g ?? '∞'}, luck gap f = ${d.f ?? '∞'} (both must be 0)`,
      ),
    );
  }
  return out;
}

/** `min` of a variant only (A*, astar.ts). */
function solveVariantMin(
  level: LevelData,
  v: VariantName,
  min: number | null,
  opts: SolveOptions,
): VariantResult {
  const lvl: CompiledLevel = compile(applyVariant(level, v));
  const r = astarMin(lvl, {
    ...(opts.maxStates !== undefined ? { maxStates: opts.maxStates } : {}),
    ...(opts.maxMs !== undefined ? { maxMs: opts.maxMs } : {}),
  });
  const status: VariantResult['status'] = !r.complete ? 'unknown' : r.min === null ? 'unsolvable' : 'solved';
  return {
    name: v,
    status,
    min: r.min,
    bandOk: min === null || status === 'unknown' ? null : variantBandOk(v, min, r.min),
    states: r.states,
    ms: r.ms,
  };
}
