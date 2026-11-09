/**
 * Levels v3c solver support (GDD K-49 D-103 wide site, K-58 item 9 D-104; TECH §V3.7): the solver plays 3-column sites
 * with 3-wide material and P5, and generates only site moves for a pallet layer.
 */
import { describe, expect, it } from 'vitest';
import { validateLevelJson } from '../../../src/core/level/logic.ts';
import { compile } from '../../../src/core/level/compile.ts';
import type { LevelInput } from '../../../src/core/level/schema.ts';
import { levelHooks } from '../../../src/core/obstacles/registry.ts';
import { hashState } from '../../../src/core/hash.ts';
import { astarMin } from '../../../tools/solver/astar.ts';
import { solveLarge } from '../../../tools/solver/large.ts';
import { Expander, KIND_SHIFT, infoKind } from '../../../tools/solver/expand.ts';
import { solverStart } from '../../../tools/solver/explore.ts';
import { levelJson } from '../../fixtures/builders.ts';
import type { LevelSpec } from '../../fixtures/builders.ts';

function lvlOf(spec: LevelSpec, site: { cols: number; rows: number }): ReturnType<typeof compile> {
  const base = levelJson({ ...spec, schemaVersion: 3 });
  const json = { ...base, yard: { ...base.yard, ...(spec.yard ?? {}) }, site } as LevelInput;
  const v = validateLevelJson(json, { only: [] });
  if (!v.level) throw new Error(JSON.stringify(v.issues));
  return compile(v.level);
}

describe('K-49 K-58 v3c solver on 3-column sites', () => {
  it('K-49 K-56 A* and the large search solve a 3-column plan with L4_270, P5 and I3_90 over a height-4 wall', () => {
    const lvl = lvlOf(
      {
        id: 8,
        yard: { cols: 6, rows: 4 },
        wall: { height: 4 },
        plan: ['YYY', 'WRW', 'RRR', 'WRW', 'GGG'],
        pieces: [
          ['I3_90', 'Y', 3, 0],
          ['P5_0', 'R', 0, 0],
          ['B1_0', 'W', 3, 1],
          ['B1_0', 'W', 4, 1],
          ['B1_0', 'W', 5, 1],
          ['B1_0', 'W', 3, 2],
          ['I3_90', 'G', 3, 3],
        ],
      },
      { cols: 3, rows: 5 },
    );
    expect(lvl.geo.cols).toBe(9);
    const a = astarMin(lvl);
    expect(a.min).toBe(7);
    const r = solveLarge(lvl);
    expect([r.status, r.best, r.replayOk]).toEqual(['solved', 7, true]);
  });

  it('K-58 item 9 the expander gives a pallet top layer site moves only (no yard shift), an ordinary block both', () => {
    const lvl = lvlOf(
      {
        id: 7,
        yard: { cols: 4, rows: 4 },
        wall: { height: 2 },
        plan: ['GG', 'WW', 'WW', 'WW'],
        pieces: [
          ['D2_90', 'W', 0, 0],
          ['D2_90', 'W', 0, 0],
          ['D2_90', 'W', 0, 0],
          ['D2_90', 'G', 2, 0],
        ],
        traits: {
          0: { stack: { id: 0, z: 0 } },
          1: { stack: { id: 0, z: 1 } },
          2: { stack: { id: 0, z: 2 } },
        },
      },
      { cols: 2, rows: 4 },
    );
    const x = new Expander(lvl, levelHooks(lvl));
    const s = solverStart(lvl);
    const h = hashState(s);
    const kinds: number[] = [];
    x.expand(s, h[0] ?? 0, h[1] ?? 0, (_lo, _hi, info) => kinds.push(infoKind(info)));
    const shifts = kinds.filter((k) => k === KIND_SHIFT).length;
    expect(kinds.length).toBeGreaterThan(0);
    // only the G block shifts in the yard; the top W layer only lands on the site (bottom row W: one correct move)
    expect(shifts).toBeGreaterThan(0);
    expect(kinds.length - shifts).toBeGreaterThanOrEqual(1);
    expect(astarMin(lvl).min).toBe(4);
  });
});
