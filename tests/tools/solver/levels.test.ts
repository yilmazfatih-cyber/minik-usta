/**
 * The solver on the real levels 1–9 (levels/level_NNN.json, WP-M; level 10 in level10.test.ts so the two largest
 * spaces, 8 and 10, run in parallel test files). Official metrics = solver (LEVELS §0); they must equal the
 * product-lead's LEVELS §2 numbers (levels.expected.ts).
 */
import { describe, expect, it } from 'vitest';
import { LevelSchema } from '../../../src/core/level/schema.ts';
import { solveLevelData } from '../../../tools/solver/solveLevel.ts';
import { describeLevel, levelJsonFile } from './levels.assert.ts';

describe('K-50 level 3 (GDD K-50 example)', () => {
  it('K-50 level 3 choices 6 9 10 best 3 1 1', () => {
    const r = solveLevelData(LevelSchema.parse(levelJsonFile(3)), {}, { variants: false });
    expect(r.metrics?.choices).toEqual([6, 9, 10]);
    expect(r.metrics?.bestChoices).toEqual([3, 1, 1]);
    expect(r.metrics?.firstNeedCover).toBe(1);
    expect(r.metrics?.F0).toEqual(['piece:0', 'piece:1']);
  });
});

for (const n of [1, 2, 3, 4, 5, 6, 7, 9]) describeLevel(n, 30_000);
describeLevel(8, 120_000);
