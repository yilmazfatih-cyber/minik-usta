/**
 * The puzzle-intelligence SPECIFICATION of levels 1–10 (docs/LEVELS.md §6.6 "Tablo B", §6.2 for `choices0`; P4B-02): the bands the
 * D-099 level curve is designed for, as data. The JSON `targets` of a level are product-lead's measured bands (L-33
 * `metric_out_of_band` compares the solver with them); they were written around the measured values, so that gate cannot see a level
 * that is easier than the specification. This module compares both the measured value and the `targets` band with the specification
 * and reports every metric that is outside it (`targets_diverge_from_spec`, a note, never an error): the gap between the curve that
 * was asked for and the curve that ships stays visible in the levels:solve output and in docs/LEVEL_REPORT.md.
 *
 * `tests/level/specBands.test.ts` parses Tablo B from LEVELS.md and keeps this table equal to it.
 */
import type { LevelData } from '../../src/core/level/schema.ts';
import { isFixedYardLevel } from '../../src/core/level/schema.ts';
import { bandValue } from './metrics.ts';
import type { BandKey, PuzzleMetrics } from './metrics.ts';

/** `[low, high]`; an open end is 99 (counts), 1 (rates) or 9.99 (`parkSlack`). */
export type SpecBand = readonly [number, number];
export type SpecRow = Partial<Record<BandKey, SpecBand>>;

/** LEVELS §6.2 `choices@0` lower bound per difficulty (Kolay ≥ 3, Normal ≥ 4, Zor and Çok Zor ≥ 5). */
export const CHOICES0_MIN: Readonly<Record<LevelData['difficulty'], number>> = {
  easy: 3,
  normal: 4,
  hard: 5,
  superhard: 5,
};

/** LEVELS §6.6 Tablo B by level number (`parkSlack` "— ya da ≥ 2,0" of level 2 is left out: "no park" is never out of band). */
export const SPEC_BANDS: Readonly<Record<number, SpecRow>> = {
  1: {
    min: [8, 9],
    minShifts: [0, 0],
    firstNeedDepth: [0, 0],
    maxCover: [0, 1],
    depLater: [0, 0],
    crossDeps: [1, 99],
    forced: [0, 2],
    greedyExcess: [0, 0],
    greedyWin: [0.95, 1],
    ahaMin: [0, 0],
    branch3: [0.4, 1],
  },
  2: {
    min: [6, 8],
    minShifts: [0, 1],
    firstNeedDepth: [0, 0],
    maxCover: [0, 1],
    depLater: [0, 0],
    crossDeps: [1, 99],
    forced: [0, 2],
    greedyExcess: [0, 0],
    greedyWin: [0.9, 1],
    ahaMin: [0, 0],
    branch3: [0.35, 1],
  },
  3: {
    min: [9, 11],
    minShifts: [2, 3],
    firstNeedDepth: [1, 1],
    maxCover: [1, 2],
    depLater: [1, 2],
    crossDeps: [2, 99],
    parkSlack: [1.5, 9.99],
    forced: [1, 3],
    greedyExcess: [0, 0],
    greedyWin: [0.85, 1],
    ahaMin: [0, 0],
    branch3: [0.25, 0.45],
  },
  4: {
    min: [10, 12],
    minShifts: [2, 3],
    firstNeedDepth: [1, 2],
    maxCover: [2, 2],
    depLater: [1, 2],
    crossDeps: [2, 99],
    parkSlack: [1, 9.99],
    forced: [1, 3],
    greedyExcess: [0, 0],
    greedyWin: [0.75, 1],
    ahaMin: [0, 0],
    branch3: [0.2, 0.4],
  },
  5: {
    min: [12, 14],
    minShifts: [3, 4],
    firstNeedDepth: [1, 2],
    maxCover: [2, 3],
    depLater: [2, 3],
    crossDeps: [3, 99],
    parkSlack: [1, 2],
    forced: [2, 4],
    greedyExcess: [1, 2],
    greedyWin: [0.4, 0.7],
    ahaMin: [1, 1],
    branch3: [0.15, 0.35],
  },
  6: {
    min: [11, 13],
    minShifts: [3, 3],
    firstNeedDepth: [2, 2],
    maxCover: [2, 3],
    depLater: [1, 2],
    crossDeps: [2, 99],
    parkSlack: [1, 1.5],
    forced: [2, 4],
    greedyExcess: [0, 1],
    greedyWin: [0.5, 0.85],
    ahaMin: [0, 1],
    branch3: [0.2, 0.4],
  },
  7: {
    min: [14, 16],
    minShifts: [4, 5],
    firstNeedDepth: [2, 2],
    maxCover: [2, 3],
    depLater: [2, 3],
    crossDeps: [3, 99],
    parkSlack: [0.8, 1.5],
    forced: [3, 5],
    greedyExcess: [1, 3],
    greedyWin: [0.3, 0.6],
    ahaMin: [1, 2],
    branch3: [0.15, 0.3],
  },
  8: {
    min: [11, 13],
    minShifts: [3, 4],
    firstNeedDepth: [2, 3],
    maxCover: [2, 2],
    depLater: [1, 2],
    crossDeps: [2, 99],
    parkSlack: [1, 2],
    forced: [2, 4],
    greedyExcess: [0, 1],
    greedyWin: [0.4, 0.8],
    ahaMin: [0, 1],
    branch3: [0.15, 0.35],
  },
  9: {
    min: [11, 13],
    minShifts: [3, 4],
    firstNeedDepth: [1, 2],
    maxCover: [2, 2],
    depLater: [1, 2],
    crossDeps: [2, 99],
    parkSlack: [1, 9.99],
    forced: [2, 4],
    greedyExcess: [0, 1],
    greedyWin: [0.5, 0.85],
    ahaMin: [0, 1],
    branch3: [0.2, 0.4],
  },
  10: {
    min: [22, 26],
    minShifts: [7, 9],
    firstNeedDepth: [2, 3],
    maxCover: [3, 4],
    depLater: [3, 5],
    crossDeps: [5, 99],
    parkSlack: [0.6, 1.2],
    forced: [5, 8],
    greedyExcess: [2, 99],
    greedyWin: [0.05, 0.25],
    ahaMin: [2, 99],
    branch3: [0, 0.2],
  },
};

/** One metric outside the specification: the measured value, the specification and the level's own `targets` band. */
export interface SpecGap {
  readonly metric: BandKey;
  /** The solver value (`null` = none, `Infinity` is written as `null` in JSON, shown as ∞ by the text output). */
  readonly actual: number | null;
  readonly spec: SpecBand;
  readonly targets: SpecBand | null;
  /** The measured value is outside `spec`. */
  readonly actualOut: boolean;
  /** The `targets` band is not inside `spec`. */
  readonly targetsOut: boolean;
}

/** The specification row of a level (D-099 levels 1–10 only: `schemaVersion` 2), with `choices0` from LEVELS §6.2. */
export function specRow(level: LevelData): SpecRow | null {
  if (!isFixedYardLevel(level)) return null;
  const row = SPEC_BANDS[level.id];
  if (!row) return null;
  return { ...row, choices0: [CHOICES0_MIN[level.difficulty], 99] };
}

const inside = (v: number, b: SpecBand): boolean => v >= b[0] && v <= b[1];

/** Every metric of `m` (or `targets` band of the level) outside the specification (P4B-02). Empty = the level meets its curve. */
export function specGaps(level: LevelData, m: PuzzleMetrics): SpecGap[] {
  const row = specRow(level);
  if (!row) return [];
  const out: SpecGap[] = [];
  for (const k of Object.keys(row) as BandKey[]) {
    const spec = row[k];
    if (!spec) continue;
    const v = bandValue(m, k);
    if (v === undefined && k === 'parkSlack') continue; // no park: never out of band (LEVELS §7 U-1)
    const t = level.targets?.[k] as SpecBand | undefined;
    const actualOut =
      v === undefined ? false : v === null ? true : v === Infinity ? spec[1] < 99 : !inside(v, spec);
    const targetsOut = t !== undefined && (t[0] < spec[0] || t[1] > spec[1]);
    if (actualOut || targetsOut)
      out.push({
        metric: k,
        actual: v === undefined || v === Infinity ? null : v,
        spec,
        targets: t ?? null,
        actualOut,
        targetsOut,
      });
  }
  return out;
}

const band = (b: SpecBand): string => `[${b[0]}, ${b[1] >= 99 ? '∞' : b[1]}]`;

/** The `targets_diverge_from_spec` note of a level (null = none). */
export function specNote(gaps: readonly SpecGap[]): string | null {
  if (gaps.length === 0) return null;
  const parts = gaps.map((g) => {
    const bits = [`${g.metric} ${g.actual === null ? '∞/none' : g.actual} vs spec ${band(g.spec)}`];
    if (g.targetsOut && g.targets) bits.push(`targets ${band(g.targets)}`);
    return bits.join(', ');
  });
  return `targets_diverge_from_spec (${gaps.length}): ${parts.join(' · ')}`;
}
