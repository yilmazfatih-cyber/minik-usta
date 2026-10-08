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
import { replayCanonical } from './verify.ts';
import type { ReplayCheck } from './verify.ts';
import { VARIANTS, applyVariant, variantApplies, variantBandOk } from './variants.ts';
import type { VariantName } from './variants.ts';

/**
 * Bump when the solver's results can change for the same level and rules (cache key with `levelHash` and
 * `RULES_VERSION`, TECH §2R.5).
 */
export const SOLVER_VERSION = 2;

export interface SolveOptions {
  readonly maxStates?: number;
  readonly maxMs?: number;
  /** D3a on states entered by a placement or a delivery (`d3aMaxExpansions`; default true). */
  readonly d3a?: boolean;
  /** Also solve the applicable variants for LEVEL_REPORT (default true). */
  readonly variants?: boolean;
  /** Solve this variant instead of the level (`--variant`). */
  readonly variant?: VariantName;
}

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
  readonly stats: SolveStats | null;
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
  const g = explore(lvl, {
    ...(opts.maxStates !== undefined ? { maxStates: opts.maxStates } : {}),
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
  let replay: ReplayCheck | null = null;
  const isVariant = opts.variant !== undefined;

  if (!g.complete) {
    status = 'unknown';
    out.push(
      issue(
        'solve_unknown',
        'K-45/9',
        'tool',
        'error',
        '(level)',
        `exploration stopped at ${g.count} states (${g.limit}): min, the canonical solution and every K-50 metric are unknown (the A* fallback is Faz 3)`,
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
      band = movesBand(metrics.min, level.difficulty, level.teaches !== undefined);
      out.push(...puzzleChecks({ level, lvl, metrics, canonical: steps, complete: g.complete }));
      if (metrics.deadRate > 0)
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
      out.push(...wholeSpaceGate(metrics), ...deliveryChecks(metrics));
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
    stats: { ...g.stats, complete: g.complete, limit: g.limit, totalMs: Math.round(performance.now() - t0) },
  };
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
