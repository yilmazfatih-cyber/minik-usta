/**
 * Solver tool gates of the Faz 2R solver round (WP-M; GDD K-51 items 2 and 5, TECH §2R.4 cut 1, §2R.5):
 * - K-51 item 2 "Bütün uzay kapısı": with no D3b table, a dead state entered from a live one by ANY drag move (shifts
 *   with their step-9 delivery included) that D1/D2/D3a do not catch is an error (`dead_table_missing`). The GDD
 *   example is the queued draft of level 10 (338 dead states behind truck deliveries, trapCount 0, deadRate 0).
 * - K-51 item 5 "Teslimat adaleti": for every truck batch k ≥ 1, g(k) = D(k) + min dist(T(k)) − min = 0 and
 *   f(k) = max dist(T(k)) − min dist(T(k)) = 0, else `delivery_foresight` (warn). Checked on hand-made graphs (the
 *   definitions) and on the real levels in levels.assert.ts.
 */
import { describe, expect, it } from 'vitest';
import { LevelSchema } from '../../../src/core/level/schema.ts';
import type { CompiledLevel } from '../../../src/core/level/compile.ts';
import { H, HEADER_SIZE } from '../../../src/core/state.ts';
import { deliveryChecks, solveLevelData, wholeSpaceGate } from '../../../tools/solver/solveLevel.ts';
import { deliveryFairness } from '../../../tools/solver/metrics.ts';
import type { PuzzleMetrics } from '../../../tools/solver/metrics.ts';
import { distanceFromStart, distanceToWin, reverseEdges } from '../../../tools/solver/distance.ts';
import { KIND_OVERWALL, KIND_SHIFT, edgeInfo } from '../../../tools/solver/expand.ts';
import type { Graph } from '../../../tools/solver/explore.ts';
import { loadFixture } from '../../fixtures/builders.ts';

/** A hand-made explored graph: `edges` = [from, to, shift?], every move costs 1; `cursor[i]` = completed segments. */
function fakeGraph(
  count: number,
  edges: readonly (readonly [number, number, boolean?])[],
  won: readonly number[],
  cursor: readonly number[],
): Graph {
  const sorted = [...edges].sort((a, b) => a[0] - b[0]);
  const edgeStart = new Int32Array(count + 1);
  for (const [from] of sorted) edgeStart[from + 1] = (edgeStart[from + 1] ?? 0) + 1;
  for (let i = 0; i < count; i++) edgeStart[i + 1] = (edgeStart[i + 1] ?? 0) + (edgeStart[i] ?? 0);
  const lvl = {
    batches: [{ index: 1, forSegment: 1, dropColumns: [], pieceIds: [] }],
    layout: { size: HEADER_SIZE },
  };
  const space = {
    load(i: number, buf: Int32Array): void {
      buf.fill(0);
      buf[H.deliveryCursor] = cursor[i] ?? 0;
    },
  };
  return {
    lvl: lvl as unknown as CompiledLevel,
    space,
    count,
    complete: true,
    limit: null,
    won: Uint8Array.from({ length: count }, (_, i) => (won.includes(i) ? 1 : 0)),
    edgeStart,
    edgeTo: Int32Array.from(sorted.map((e) => e[1])),
    edgeInfo: Uint8Array.from(sorted.map((e) => edgeInfo(e[2] ? KIND_SHIFT : KIND_OVERWALL, 1, false))),
    unsupported: [],
  } as unknown as Graph;
}

function fairness(g: Graph) {
  const dist = distanceToWin(g, reverseEdges(g));
  return deliveryFairness(g, dist, dist.dist[0] ?? -1);
}

describe('K-51 item 5 delivery fairness (delivery_foresight)', () => {
  it('K-51 item 5 a luck gap: two delivery states at D = 2, one 1 and one 2 moves from a win → g 0, f 1', () => {
    // 0 → 1 → 3 (delivered) → 5 won; 0 → 2 → 4 (delivered) → 6 → 5
    const g = fakeGraph(
      7,
      [
        [0, 1, true],
        [0, 2, true],
        [1, 3],
        [2, 4],
        [3, 5],
        [4, 6],
        [6, 5],
      ],
      [5],
      [0, 0, 0, 1, 1, 1, 1],
    );
    expect(Array.from(distanceFromStart(g))).toEqual([0, 1, 1, 2, 2, 3, 3]);
    expect(fairness(g)).toEqual([{ forSegment: 1, D: 2, states: 2, distMin: 1, distMax: 2, g: 0, f: 1 }]);
  });

  it('K-51 item 5 a foresight gain (GDD example shape): the fastest delivery is not on a shortest solution → g 1, f 0', () => {
    // 0 → 1 (delivered at D = 1, then 3 more moves: 1 → 4 → 6 → 5); 0 → 2 → 3 (delivered at 2, then 3 → 5): min 3
    const g = fakeGraph(
      7,
      [
        [0, 1],
        [1, 4, true],
        [4, 6, true],
        [6, 5],
        [0, 2, true],
        [2, 3],
        [3, 5],
      ],
      [5],
      [0, 1, 0, 1, 1, 1, 1],
    );
    expect(fairness(g)).toEqual([{ forSegment: 1, D: 1, states: 1, distMin: 3, distMax: 3, g: 1, f: 0 }]);
  });

  it('K-51 item 5 a dead delivery state makes f unknown (∞) and warns; g = 0 and f = 0 is silent', () => {
    const base: Pick<PuzzleMetrics, 'delivery'> = {
      delivery: [{ forSegment: 1, D: 5, states: 1, distMin: 6, distMax: 6, g: 0, f: 0 }],
    };
    expect(deliveryChecks(base as PuzzleMetrics)).toEqual([]);
    const dead = deliveryChecks({
      delivery: [{ forSegment: 1, D: 5, states: 2, distMin: 6, distMax: null, g: 0, f: null }],
    } as unknown as PuzzleMetrics);
    expect(dead).toHaveLength(1);
    expect(dead[0]).toMatchObject({ code: 'delivery_foresight', rule: 'K-51/5', severity: 'warn' });
    expect(dead[0]?.message).toContain('f = ∞');
    const gain = deliveryChecks({
      delivery: [{ forSegment: 1, D: 8, states: 2, distMin: 8, distMax: 9, g: 1, f: 1 }],
    } as unknown as PuzzleMetrics);
    expect(gain[0]?.message).toContain('g = 1, luck gap f = 1');
  });
});

describe('K-51 item 2 whole-space gate (dead_table_missing)', () => {
  it('K-51 item 2 dead states caught by D1/D2/D3a pass; one uncaught dead state is an error', () => {
    const m = (states: number, caught: number) =>
      ({
        deadEntries: { edges: states * 2, shiftEdges: states, states, caught },
      }) as unknown as PuzzleMetrics;
    expect(wholeSpaceGate(m(0, 0))).toEqual([]);
    expect(wholeSpaceGate(m(4, 4))).toEqual([]);
    const bad = wholeSpaceGate(m(5, 3));
    expect(bad).toHaveLength(1);
    expect(bad[0]).toMatchObject({
      code: 'dead_table_missing',
      rule: 'K-51/2',
      severity: 'error',
      check: 'tool',
    });
    expect(bad[0]?.message).toMatch(/2 dead state\(s\)/);
  });

  it('K-51 item 2 GDD example: the queued draft of level 10 has trapCount 0 and deadRate 0 but 338 uncaught dead states → error', () => {
    const r = solveLevelData(
      LevelSchema.parse(loadFixture('solver', 'level_010_queued_draft')),
      { fileId: 10 },
      { variants: false },
    );
    expect(r.metrics?.trapCount).toBe(0);
    expect(r.metrics?.deadRate).toBe(0);
    expect(r.metrics?.deadEntries).toMatchObject({ states: 338, caught: 0, edges: 1618, shiftEdges: 1618 });
    const gate = r.issues.filter((i) => i.code === 'dead_table_missing');
    expect(gate.map((i) => [i.rule, i.severity])).toEqual([['K-51/2', 'error']]);
    expect(gate[0]?.message).toMatch(/338 dead state/);
  }, 120_000);
});
