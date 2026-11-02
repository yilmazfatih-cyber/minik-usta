/** The solver on the shipped D-099 levels 5 and 8 (745 442 and 446 663 states; own file so they run in parallel). */
import { describe, expect, it } from 'vitest';
import { SHIPPED } from './shipped.expected.ts';
import { describeShipped } from './shipped.assert.ts';

describe('K-50 shipped level expectations (the two largest spaces)', () => {
  it('K-50 levels 5 and 8 are Normal levels; level 5 is a non-intro level and carries the open puzzle_greedy_easy warning (P4B-02)', () => {
    expect(SHIPPED[5]?.difficulty).toBe('normal');
    expect(SHIPPED[8]?.difficulty).toBe('normal');
    expect(SHIPPED[5]?.warnings).toEqual(['puzzle_greedy_easy']);
    expect(SHIPPED[8]?.warnings).toEqual([]);
  });
});

describeShipped(5, 180_000);
describeShipped(8, 180_000);
