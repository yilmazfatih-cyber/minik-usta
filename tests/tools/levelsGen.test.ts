/**
 * `npm run levels:gen` (docs/LEVELS.md §7 U-5, docs/TECH_DESIGN.md §D99.5): deterministic D-099 generator. A small
 * one-floor plan (3×4 yard, 2×4 site, `O4` and `D2`) keeps every full solve under a few hundred states.
 */
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dropLayout, generate, planShapes, tilings } from '../../tools/gen/generate.ts';
import type { GenPlan, GenTargets } from '../../tools/gen/generate.ts';
import { main } from '../../tools/levels-gen.ts';
import { validateLevelJson } from '../../src/core/level/logic.ts';
import { solveLevelJson } from '../../tools/solver/solveLevel.ts';
import { shapeById } from '../../src/core/shapes.ts';

const PLAN: GenPlan = {
  id: 3,
  name: { tr: 'Deneme', en: 'Trial' },
  difficulty: 'easy',
  yard: { cols: 3, rows: 4 },
  site: { cols: 2, rows: 4 },
  wall: { height: 4, gaps: [] },
  segments: [{ name: { tr: 'Kat', en: 'Floor' }, rows: ['WW', 'WW', 'YY', 'YY'] }],
  shapes: ['O4', 'D2'],
};
const TARGETS: GenTargets = { min: [5, 6], firstNeedDepth: [1, 2], minShifts: [1, 2] };

describe('U-5 levels:gen (D-099 deterministic generator)', () => {
  it('U-5 tiling: every exact cover of the plan with the plan shapes (a 2×2 region: O4, two D2_0 or two D2_90)', () => {
    const shapes = planShapes(PLAN);
    expect(shapes.map((s) => s.id)).toEqual(['D2_0', 'D2_90', 'O4_0']);
    const all = tilings(PLAN.segments[0]?.rows ?? [], shapes);
    expect(all).toHaveLength(9);
    for (const t of all) {
      expect(t.reduce((n, p) => n + p.shape.cellCount, 0)).toBe(8);
      expect(new Set(t.map((p) => p.color))).toEqual(new Set(['W', 'Y']));
    }
  });

  it('U-5 drop layout: every block rests on the floor or on another block (no hanging start)', () => {
    const items = [
      { shape: shapeById('O4_0'), color: 'Y' as const, order: 0 },
      { shape: shapeById('D2_0'), color: 'W' as const, order: 2 },
      { shape: shapeById('D2_90'), color: 'W' as const, order: 1 },
    ];
    const d = dropLayout(PLAN, items, [0, 2, 1]);
    expect(d?.map((p) => [p.shape.id, p.x, p.y])).toEqual([
      ['O4_0', 0, 0],
      ['D2_0', 2, 0],
      ['D2_90', 1, 2],
    ]);
    // a block never passes through another one on its way down: the vertical D2 cannot reach the floor of column 2
    expect(
      dropLayout(
        PLAN,
        [items[0], items[2], items[1]].filter((x) => x !== undefined),
        [0, 1, 2],
      ),
    ).toBeNull();
    // a column that is full rejects the layout
    expect(dropLayout(PLAN, [...items, ...items], [0, 0, 0, 0, 0, 0])).toBeNull();
  });

  it('U-5 deterministic: the same plan, targets and seed give bit-identical candidates; another seed may differ', () => {
    const a = generate(PLAN, TARGETS, { seed: 11, iterations: 40 });
    const b = generate(PLAN, TARGETS, { seed: 11, iterations: 40 });
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    expect(a.candidates.length).toBeGreaterThan(0);
  });

  it('U-5 approaches the targets: the best candidate is inside every band, error-free, schemaVersion 2 with one batch and moves = min + P', () => {
    const res = generate(PLAN, TARGETS, { seed: 11, iterations: 60 });
    const best = res.candidates[0];
    expect(best).toBeDefined();
    if (!best) return;
    expect(best.score).toBeLessThanOrEqual(res.startScore);
    expect(best.score).toBe(0);
    expect(res.trace.every((v, i) => i === 0 || v <= (res.trace[i - 1] ?? Infinity))).toBe(true);
    const json = best.level;
    expect(json.schemaVersion).toBe(2);
    expect(json.yard.batches).toHaveLength(1);
    expect(json.targets).toEqual(TARGETS);
    expect(validateLevelJson(json, { fileId: 3 }).issues.filter((i) => i.severity === 'error')).toEqual([]);
    const solved = solveLevelJson(json, { fileId: 3 }, { variants: false });
    expect(solved.issues.filter((i) => i.severity === 'error')).toEqual([]);
    const m = solved.metrics;
    expect(m?.min).toBeGreaterThanOrEqual(5);
    expect(json.moves).toBe((m?.min ?? 0) + 4); // Kolay: P 4, a = 0 (K-52 D-099)
    expect(m?.firstNeedDepth).toBeGreaterThanOrEqual(1);
    expect(best.ascii).toContain('size 3x4|2x4');
  });

  it('U-5 CLI writes candidate_<rank>.json and report.md; the same run writes the same files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'levels-gen-'));
    try {
      writeFileSync(join(dir, 'plan.json'), JSON.stringify(PLAN));
      writeFileSync(join(dir, 'targets.json'), JSON.stringify(TARGETS));
      const args = (out: string): string[] => [
        '--plan',
        join(dir, 'plan.json'),
        '--targets',
        join(dir, 'targets.json'),
        '--seed',
        '11',
        '--iterations',
        '60',
        '--out',
        join(dir, out),
      ];
      expect(main(args('a'))).toBe(0);
      expect(main(args('b'))).toBe(0);
      const files = readdirSync(join(dir, 'a')).sort();
      expect(files).toContain('report.md');
      expect(files).toContain('candidate_1.json');
      for (const f of files)
        expect(readFileSync(join(dir, 'b', f), 'utf8'), f).toBe(readFileSync(join(dir, 'a', f), 'utf8'));
      expect(main(['--plan', join(dir, 'plan.json')])).toBe(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
