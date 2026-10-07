/**
 * K-30 step 12 cost (docs/TECH_DESIGN.md §2R.4 "Maliyet ve performans kapısı", §2R.13). Run:
 * `npx vitest bench --run tests/core/deadlock.bench.ts`.
 *
 * - D3a on a Bölüm 1–10 sized board (2 × 4 site, ≤ 9 blocks): the GDD tiling example, live and dead.
 * - D3a at the budget: a 4 × 8 site of single bricks with one 2-cell Y block for the 1-cell Y need — dead only after
 *   the full search, so the call stops at `D3A_MAX_EXPANSIONS` (20 000) and returns `unknown`. Time per call / 20 000
 *   = the cost of one expansion (gate ≤ 0.4 µs desktop → 20 000 expansions ≤ 8 ms desktop, ≤ 32 ms at 4× CPU).
 * - The whole step 12 after a correct placement (D2 + D3a through `applyMove`).
 * The 4× CPU numbers come from `npm run perf` (WP-K gate: p99 ≤ 2 ms, worst ≤ 8 ms); this file measures desktop.
 */
import { test } from 'vitest';
import { D3A_MAX_EXPANSIONS, D3A_STATS, tileRemaining } from '../../src/core/deadlock.ts';
import { applyMove, NULL_SINK } from '../../src/core/moves.ts';
import { cloneState } from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import { initialState } from '../fixtures/builders.ts';
import type { PieceSpec } from '../fixtures/builders.ts';
import { dragTo } from './moves.fixtures.ts';

function gddBoard(): GameState {
  return initialState({
    wall: { height: 2 },
    site: { cols: 2, rows: 4 },
    plan: ['WW', 'WW', 'YW', 'YW'],
    pieces: [
      ['D2_0', 'Y', 0, 0],
      ['D2_0', 'W', 1, 0],
      ['O4_0', 'W', 2, 0],
    ],
  });
}

/** 4 × 8 site, 31 W cells + 1 Y cell; 30 B1 W + a D2_90 Y (cells match, tiling impossible). */
function budgetBoard(): GameState {
  const pieces: PieceSpec[] = [];
  for (let i = 0; i < 30; i++) pieces.push(['B1_0', 'W', i % 4, Math.floor(i / 4)]);
  pieces.push(['D2_90', 'Y', 2, 7]);
  const plan = ['WWWY', 'WWWW', 'WWWW', 'WWWW', 'WWWW', 'WWWW', 'WWWW', 'WWWW'];
  return initialState({
    yard: { cols: 4, rows: 8 },
    site: { cols: 4, rows: 8 },
    wall: { height: 2 },
    plan,
    pieces,
  });
}

test('TECH §2R.4 step 12 cost: D3a live / dead / at the 20 000 budget, and a whole step 12', async ({
  bench,
}) => {
  const live = gddBoard();
  applyMove(live, dragTo(0, 6, 8), NULL_SINK, { noTruckHelp: true });
  const dead = cloneState(live);
  applyMove(dead, dragTo(1, 6, 8), NULL_SINK, { noTruckHelp: true });
  const budget = budgetBoard();
  tileRemaining(live);
  const liveExp = D3A_STATS.expansions;
  tileRemaining(dead);
  const deadExp = D3A_STATS.expansions;
  const r = tileRemaining(budget);
  const budgetExp = D3A_STATS.expansions;
  const step12 = gddBoard();
  await bench.compare(
    bench(`D3a GDD board, tileable (${liveExp} expansions)`, () => {
      tileRemaining(live);
    }),
    bench(`D3a GDD board, dead end (${deadExp} expansions)`, () => {
      tileRemaining(dead);
    }),
    bench(`D3a 4 × 8 at the budget → ${r} (${budgetExp} / ${D3A_MAX_EXPANSIONS} expansions)`, () => {
      tileRemaining(budget);
    }),
    bench('applyMove: a correct placement with step 12 (D1 + D2 + D3a)', () => {
      const s = cloneState(step12);
      applyMove(s, dragTo(0, 6, 8), NULL_SINK);
    }),
    bench('applyMove: the same placement without step 12 (noTruckHelp)', () => {
      const s = cloneState(step12);
      applyMove(s, dragTo(0, 6, 8), NULL_SINK, { noTruckHelp: true });
    }),
  );
});
