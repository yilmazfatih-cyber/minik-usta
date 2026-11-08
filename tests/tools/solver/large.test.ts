/**
 * Levels v3 solver scale (docs/TECH_DESIGN.md §V3.3; LEVELS §8.10 U-v3-2; GDD §16 ÖNERİ K-64): the large-level search
 * (beam + widening, best found, core replay), the v3 measures and the solve-stage integration. Fixture:
 * tests/fixtures/levels-v3/large_22.json = the first start layout of `plan_large_22.json`, seed 1 (6 × 8 yard, 2 × 8 site,
 * 3 floors, 22 blocks: 2 pallets, 3 two-tone, 2 wrapped + scissors).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { validateLevelJson } from '../../../src/core/level/logic.ts';
import { compile } from '../../../src/core/level/compile.ts';
import type { LevelInput } from '../../../src/core/level/schema.ts';
import { lowerBoundOf, solveLarge } from '../../../tools/solver/large.ts';
import { astarMin } from '../../../tools/solver/astar.ts';
import { solveLevelData, solveLevelJson } from '../../../tools/solver/solveLevel.ts';
import { v3Metrics, visibleAtStart } from '../../../tools/solver/v3metrics.ts';
import { startLevel } from '../../../tools/gen/generate.ts';
import type { GenPlan } from '../../../tools/gen/generate.ts';
import { levelJson } from '../../fixtures/builders.ts';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'levels-v3');
const read = (name: string): unknown => JSON.parse(readFileSync(join(DIR, name), 'utf8'));
const LARGE = read('large_22.json') as LevelInput;
const PLAN = read('plan_large_22.json') as GenPlan;
const compiled = (json: unknown) => {
  const v = validateLevelJson(json);
  if (!v.level) throw new Error(JSON.stringify(v.issues));
  return { lvl: compile(v.level), level: v.level, issues: v.issues };
};

describe('U-v3-2 large-level search (6 × 8 yard, 22 blocks)', () => {
  it('K-64 U-v3-2 the fixture is the deterministic start layout of the plan: 6 × 8 yard, N 22, pallets, schemaVersion 3, no validator error', () => {
    expect(startLevel(PLAN, 1)).toEqual(LARGE);
    const { lvl, issues } = compiled(LARGE);
    expect(issues.filter((i) => i.severity === 'error')).toEqual([]);
    expect([lvl.geo.wy, lvl.geo.hy, lvl.materialCount, lvl.hasStacks]).toEqual([6, 8, 22, true]);
    expect(visibleAtStart(lvl)).toBe(20); // 2 two-layer pallets count once each
  });

  it('K-64 U-v3-2 finds a solution that replays on the core, inside 60 s, marked best found (not proven) above the lower bound', () => {
    const { lvl } = compiled(LARGE);
    const r = solveLarge(lvl, { widths: [128, 512], maxMs: 60_000 });
    expect(r.status).toBe('solved');
    expect(r.replayOk).toBe(true);
    expect(r.ms).toBeLessThan(60_000);
    expect(r.lowerBound).toBe(22);
    expect(r.best).not.toBeNull();
    expect(r.best ?? 0).toBeGreaterThanOrEqual(r.lowerBound);
    expect(r.best ?? 99).toBeLessThanOrEqual(26);
    expect(r.optimal).toBe(r.best === r.lowerBound);
    expect(r.steps.filter((st) => st.kind === 'overWall' || st.kind === 'rail')).toHaveLength(22);
    const m = v3Metrics(lvl, r.steps);
    expect(m.placements).toBe(22);
    expect(m.liftRatio).not.toBeNull();
  }, 90_000);

  it('K-50 U-v3-2 deterministic: the same level and widths give the same solution', () => {
    const { lvl } = compiled(LARGE);
    const a = solveLarge(lvl, { widths: [32, 128], maxMs: 60_000 });
    const b = solveLarge(lvl, { widths: [32, 128], maxMs: 60_000 });
    expect(b.steps.map((s) => s.move)).toEqual(a.steps.map((s) => s.move));
    expect([b.best, b.states]).toEqual([a.best, a.states]);
    const c = solveLarge(lvl, { widths: [32, 128], maxMs: Infinity, maxExpanded: 50 });
    expect(c.runs.length).toBeLessThanOrEqual(2);
  }, 90_000);

  it('K-50 U-v3-2 on a small level the beam reaches the A* minimum and proves it at the lower bound', () => {
    const { lvl } = compiled(
      levelJson({
        id: 1,
        schemaVersion: 2,
        plan: ['WW', 'WW'],
        pieces: [
          ['D2_90', 'W', 0, 0],
          ['D2_90', 'W', 2, 0],
        ],
      }),
    );
    const a = astarMin(lvl);
    const r = solveLarge(lvl);
    expect(r.best).toBe(a.min);
    expect(r.optimal).toBe(true);
    expect(lowerBoundOf(lvl)).toBe(2);
  });

  it('K-64 U-v3-2 levels:solve: an incomplete v3 exploration runs the large search, keeps the D-090 gate and marks "en iyi bulunan"', () => {
    const { level } = compiled(LARGE);
    const r = solveLevelData(level, {}, { maxStates: 3_000, variants: false, largeMs: 8_000 });
    expect(r.status).toBe('unknown');
    expect(r.issues.map((i) => i.code)).toContain('scan_incomplete');
    expect(r.large).not.toBeNull();
    expect(r.notes.some((n) => n.includes('large-level search'))).toBe(true);
    if (r.large?.status === 'solved') {
      expect(r.large.replayOk).toBe(true);
      expect(r.notes.some((n) => n.includes(r.large?.optimal ? 'proven' : 'en iyi bulunan'))).toBe(true);
      expect(r.v3?.placements).toBe(22);
    }
    const off = solveLevelJson(LARGE, {}, { maxStates: 3_000, variants: false, large: false });
    expect(off.large).toBeNull();
  }, 90_000);
});

describe('K-64 v3 measures on a complete solve', () => {
  const v3Json = (height: number, difficulty: 'easy' | 'normal'): LevelInput => {
    const base = levelJson({
      id: 5,
      difficulty,
      schemaVersion: 3,
      moves: 8,
      wall: { height },
      plan: ['WY', 'YW', 'WY', 'YW'],
      // a 3 × 4 yard (E 4): the twins are stacked in the build order, the first needed on top
      pieces: [
        ['D2_90', 'Y', 0, 3],
        ['D2_90', 'W', 0, 2],
        ['D2_90', 'Y', 0, 1],
        ['D2_90', 'W', 0, 0],
      ],
      traits: { 0: { colors: 'YW' }, 1: { colors: 'WY' }, 2: { colors: 'YW' }, 3: { colors: 'WY' } },
    });
    return { ...base, yard: { ...base.yard, cols: 3, rows: 4 }, site: { cols: 2, rows: 4 } };
  };

  it('K-64 liftRatio: every block starts below the wall top (height 4) → 1.00; with a wall of 0 nothing is lifted → lift_low', () => {
    const high = solveLevelJson(v3Json(4, 'easy'), {}, { variants: false });
    expect(high.status).toBe('solved');
    expect(high.v3).toMatchObject({ liftRatio: 1, lifted: 4, placements: 4, visibleAtStart: 4 });
    // only the D-099 puzzle gates of this tiny board fire (no shift needed); none of the v3 codes
    expect(
      high.issues.map((i) => i.code).filter((c) => c.startsWith('lift') || c.startsWith('shape')),
    ).toEqual([]);
    expect(high.issues.map((i) => i.code)).not.toContain('lift_low');
    const flat = solveLevelJson(v3Json(0, 'easy'), {}, { variants: false });
    expect(flat.v3?.liftRatio).toBe(0);
    expect(flat.issues.find((i) => i.code === 'lift_low')?.severity).toBe('error');
  });

  it('K-64 shapeDecisions is measured on a complete solve; below 2 it is an error on Normal (not on Easy)', () => {
    const easy = solveLevelJson(v3Json(4, 'easy'), {}, { variants: false });
    expect(typeof easy.v3?.shapeDecisions).toBe('number');
    expect(easy.issues.map((i) => i.code)).not.toContain('shape_decisions_low');
    const normal = solveLevelJson(v3Json(4, 'normal'), {}, { variants: false });
    if ((normal.v3?.shapeDecisions ?? 0) < 2)
      expect(normal.issues.map((i) => i.code)).toContain('shape_decisions_low');
    expect(normal.v3?.traitDelta).toBeNull(); // the "ignore the trait" bot mode is not built yet (U-v3-3)
  });
});
