/**
 * The solver on level 10 (levels/level_010.json, 559 797 states; its own test file so it runs in parallel with level
 * 8). LEVELS §2.11: the final level 10 has no truck queue in its canonical solution (no L-34 warning, the old
 * `tools/levels-allow.json` entry is gone) and no dead state anywhere in its space.
 */
import { expect, it } from 'vitest';
import { describeLevel } from './levels.assert.ts';
import { loadAllowList } from '../../../tools/lib/levelsAllow.ts';

describeLevel(10, 120_000, (report) => {
  it('K-45/9 L-34 level 10: no truck block waits in the canonical solution (E-54 queue removed, LEVELS §2.0 3f)', () => {
    expect(report().issues.map((i) => i.code)).not.toContain('batch_queued');
    expect(report().steps.every((st) => st.queueAfter === 0)).toBe(true);
    expect(loadAllowList().get(10)).toBeUndefined();
  });

  it('K-51 item 5 level 10: the truck of segment 2 is reached in 8 moves by 2 states, both 7 moves from a win', () => {
    expect(report().metrics?.delivery).toEqual([
      { forSegment: 1, D: 8, states: 2, distMin: 7, distMax: 7, g: 0, f: 0 },
    ]);
  });
});
