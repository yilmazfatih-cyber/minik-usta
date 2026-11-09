/** The solver on the shipped levels 1–10 (levels 1–2: complete scan; 3–10: large-level search + random-walk gate, CL-V3-01). */
import { describe, expect, it } from 'vitest';
import { SHIPPED } from './shipped.expected.ts';
import { describeShipped } from './shipped.assert.ts';

describe('K-50 K-52 shipped level expectations', () => {
  it('K-50 the expectation table names levels 1–10 once and every moves value lies in its own K-52 D-099 band', () => {
    expect(Object.keys(SHIPPED).map(Number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const e of Object.values(SHIPPED)) {
      expect(e.moves, `level ${e.level}`).toBeGreaterThanOrEqual(e.band[0]);
      expect(e.moves, `level ${e.level}`).toBeLessThanOrEqual(e.band[1]);
    }
  });

  it('K-45 CL-V3-01 the block count climbs (a one-block dip is allowed): level 1 has 6–8 blocks, level 10 has at least 16, the ten levels hold at least 110', () => {
    const blocks = Object.values(SHIPPED).map((e) => e.blocks);
    expect(blocks[0]).toBeGreaterThanOrEqual(6);
    expect(blocks[0]).toBeLessThanOrEqual(8);
    expect(blocks[9]).toBeGreaterThanOrEqual(16);
    expect(blocks.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(110);
    for (let i = 2; i < 10; i++)
      expect(blocks[i] ?? 0, `level ${i + 1}`).toBeGreaterThanOrEqual((blocks[i - 1] ?? 99) - 1);
  });

  it('K-50 CL-V3-03 the play proxy: no Normal / Hard level lets a placement-first player win more than 70 % within moves + N / 2, and at least one of levels 7–10 is at most 50 %', () => {
    for (const e of Object.values(SHIPPED).filter((x) => x.scan === 'large' && x.difficulty !== 'easy'))
      expect(e.policyLoose ?? 0, `level ${e.level}`).toBeLessThanOrEqual(0.7);
    const late = [7, 8, 9, 10].map((n) => SHIPPED[n]?.policyLoose ?? 1);
    expect(Math.min(...late)).toBeLessThanOrEqual(0.5);
  });
});

for (const n of [1, 2, 3, 4, 5, 6]) describeShipped(n, 240_000);
