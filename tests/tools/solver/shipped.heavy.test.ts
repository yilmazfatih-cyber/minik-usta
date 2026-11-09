/** The solver on the shipped levels 7–10 (the largest searches; own file so they run in parallel with shipped.test.ts). */
import { describe, expect, it } from 'vitest';
import { SHIPPED } from './shipped.expected.ts';
import { describeShipped } from './shipped.assert.ts';

describe('K-50 shipped level expectations (the four largest searches)', () => {
  it('K-50 levels 7–10 are large-scan levels with at least 13 blocks', () => {
    for (const n of [7, 8, 9, 10]) {
      expect(SHIPPED[n]?.scan, `level ${n}`).toBe('large');
      expect(SHIPPED[n]?.blocks ?? 0, `level ${n}`).toBeGreaterThanOrEqual(13);
    }
  });
});

for (const n of [7, 8, 9, 10]) describeShipped(n, 400_000);
