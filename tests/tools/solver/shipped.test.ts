/** The solver on the shipped D-099 levels 1–4, 6, 7, 9, 10 (levels 5 and 8, the two largest spaces, run in shipped.heavy.test.ts). */
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
});

for (const n of [1, 2, 3, 4, 6, 7, 9, 10]) describeShipped(n, 60_000);
