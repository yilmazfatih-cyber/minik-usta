/**
 * The puzzle-intelligence specification as data (tools/solver/spec.ts, P4B-02): the table equals LEVELS §6.6 "Tablo B", the
 * `targets_diverge_from_spec` note names every metric whose measured value or `targets` band is outside it, and a level that
 * meets its curve produces none.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LevelSchema } from '../../../src/core/level/schema.ts';
import type { BandKey, PuzzleMetrics } from '../../../tools/solver/metrics.ts';
import { CHOICES0_MIN, SPEC_BANDS, specGaps, specNote, specRow } from '../../../tools/solver/spec.ts';
import { level } from '../../fixtures/builders.ts';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const LEVELS_MD = readFileSync(join(ROOT, 'docs', 'LEVELS.md'), 'utf8');

/** Tablo B column index (after the leading '|') → metric. */
const COLUMNS: Readonly<Record<number, { key: BandKey; open: number }>> = {
  2: { key: 'min', open: 99 },
  4: { key: 'minShifts', open: 99 },
  5: { key: 'firstNeedDepth', open: 99 },
  6: { key: 'maxCover', open: 99 },
  7: { key: 'depLater', open: 99 },
  8: { key: 'crossDeps', open: 99 },
  9: { key: 'parkSlack', open: 9.99 },
  10: { key: 'forced', open: 99 },
  13: { key: 'greedyExcess', open: 99 },
  14: { key: 'greedyWin', open: 1 },
  15: { key: 'ahaMin', open: 99 },
  16: { key: 'branch3', open: 1 },
};

/** `8–9` → [8, 9]; `≤ 1` → [0, 1]; `≥ 0,95` → [0.95, open]; `1,00` → [1, 1]; `—` and `— ya da …` → null. */
function parseCell(cell: string, open: number): [number, number] | null {
  const c = cell.replace(/\*/g, '').replace(/,/g, '.').trim();
  if (c.startsWith('—')) return null;
  const range = /^([\d.]+)–([\d.]+)$/.exec(c);
  if (range) return [Number(range[1]), Number(range[2])];
  const atMost = /^≤ ([\d.]+)/.exec(c);
  if (atMost) return [0, Number(atMost[1])];
  const atLeast = /^≥ ([\d.]+)/.exec(c);
  if (atLeast) return [Number(atLeast[1]), open];
  if (/^[\d.]+$/.test(c)) return [Number(c), Number(c)];
  throw new Error(`Tablo B cell not understood: "${cell}"`);
}

function tableB(): Map<number, Partial<Record<BandKey, [number, number]>>> {
  const start = LEVELS_MD.indexOf('**Tablo B');
  const end = LEVELS_MD.indexOf('\n\n', LEVELS_MD.indexOf('| 10 |', start));
  const out = new Map<number, Partial<Record<BandKey, [number, number]>>>();
  for (const line of LEVELS_MD.slice(start, end).split('\n')) {
    const m = /^\| (\d+) \|/.exec(line);
    if (!m) continue;
    const cells = line.split('|').map((c) => c.trim());
    const row: Partial<Record<BandKey, [number, number]>> = {};
    for (const [i, { key, open }] of Object.entries(COLUMNS)) {
      const band = parseCell(cells[Number(i)] ?? '', open);
      if (band) row[key] = band;
    }
    out.set(Number(m[1]), row);
  }
  return out;
}

describe('K-50 puzzle-intelligence specification (LEVELS §6.6 Tablo B as data)', () => {
  it('K-50 tools/solver/spec.ts SPEC_BANDS equals Tablo B of docs/LEVELS.md for levels 1–10 (every numeric column)', () => {
    const doc = tableB();
    expect([...doc.keys()]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const [n, row] of doc) expect(SPEC_BANDS[n], `level ${n}`).toEqual(row);
  });

  it('K-50 choices@0 lower bounds per difficulty are LEVELS §6.2 (Kolay 3, Normal 4, Zor and Çok Zor 5)', () => {
    expect(CHOICES0_MIN).toEqual({ easy: 3, normal: 4, hard: 5, superhard: 5 });
    const lvl = (id: number, difficulty: 'easy' | 'normal' | 'hard') =>
      level({ id, schemaVersion: 2, difficulty, pieces: [['B1_0', 'W', 0, 0]] });
    expect(specRow(lvl(2, 'easy'))?.choices0).toEqual([3, 99]);
    expect(specRow(lvl(5, 'normal'))?.choices0).toEqual([4, 99]);
    expect(specRow(lvl(10, 'hard'))?.choices0).toEqual([5, 99]);
  });

  it('K-50 a Faz 2R (schemaVersion 1) level or a level beyond 10 has no specification row', () => {
    const v1 = level({ id: 5, pieces: [['B1_0', 'W', 0, 0]] });
    const v2late = level({ id: 11, schemaVersion: 2, pieces: [['B1_0', 'W', 0, 0]] });
    expect(specRow(v1)).toBeNull();
    expect(specRow(v2late)).toBeNull();
  });

  it('K-50 specGaps names a measured value and a `targets` band outside Tablo B; a level on its curve has none (P4B-02)', () => {
    const base = {
      id: 5,
      schemaVersion: 2 as const,
      difficulty: 'normal' as const,
      pieces: [['B1_0', 'W', 0, 0]] as const,
    };
    const d099 = {
      maxCover: 3,
      depLater: 3,
      crossDeps: 7,
      parkSlack: 1,
      forced: 3,
      greedyExcess: 1,
      greedyWin: 0.5,
      ahaMin: 1,
      branch3: 0.27,
    };
    const metrics = (over: Partial<typeof d099>, extra: Record<string, unknown> = {}): PuzzleMetrics =>
      ({
        min: 13,
        minShifts: 3,
        firstNeedDepth: 2,
        choices: [7, 6, 5],
        deadRate: 0,
        d099: { ...d099, ...over },
        ...extra,
      }) as unknown as PuzzleMetrics;
    // on its curve: no gap
    expect(specGaps(level({ ...base }), metrics({}))).toEqual([]);
    expect(specNote([])).toBeNull();
    // greedy play wins (greedyWin 1.00) although the curve asks 0.40–0.70; the JSON targets band [0.5, 1] is wider than the spec
    const lvl = level({ ...base });
    const withTargets = { ...lvl, targets: { greedyWin: [0.5, 1] as [number, number] } };
    const gaps = specGaps(withTargets, metrics({ greedyWin: 1 }));
    expect(gaps).toEqual([
      {
        metric: 'greedyWin',
        actual: 1,
        spec: [0.4, 0.7],
        targets: [0.5, 1],
        actualOut: true,
        targetsOut: true,
      },
    ]);
    expect(specNote(gaps)).toBe(
      'targets_diverge_from_spec (1): greedyWin 1 vs spec [0.4, 0.7], targets [0.5, 1]',
    );
    // a `targets` band narrower than the spec is fine; an in-spec value with a wide band still diverges (the band is the problem)
    const wide = { ...lvl, targets: { forced: [2, 9] as [number, number] } };
    expect(specGaps(wide, metrics({ forced: 3 })).map((g) => [g.metric, g.actualOut, g.targetsOut])).toEqual([
      ['forced', false, true],
    ]);
  });

  it('K-50 LevelSchema accepts the shipped `targets` shape that specGaps reads', () => {
    const lvl = LevelSchema.parse(JSON.parse(readFileSync(join(ROOT, 'levels', 'level_005.json'), 'utf8')));
    expect(lvl.targets?.greedyWin).toBeDefined();
    expect(Object.keys(SPEC_BANDS[5] ?? {})).toContain('greedyWin');
  });
});
