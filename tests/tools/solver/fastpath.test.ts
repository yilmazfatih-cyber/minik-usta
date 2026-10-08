/**
 * Fast yard path and state store (TECH §2R.5 "Hızlı saha yolu", `space.ts`): on random walks through Faz 2R draft levels
 * and the default board, every fast yard move must equal the core `applyMove` bit for bit (after the solver's
 * normalisation of the unhashed counters) and its incremental hash must equal `hashState`.
 */
import { describe, expect, it } from 'vitest';
import { LevelSchema } from '../../../src/core/level/schema.ts';
import { compile } from '../../../src/core/level/compile.ts';
import type { CompiledLevel } from '../../../src/core/level/compile.ts';
import { applyMove } from '../../../src/core/moves.ts';
import { hashState } from '../../../src/core/hash.ts';
import { H } from '../../../src/core/state.ts';
import type { GameState } from '../../../src/core/state.ts';
import { Expander, normalizeState } from '../../../tools/solver/expand.ts';
import { solverStart } from '../../../tools/solver/explore.ts';
import { StateSpace } from '../../../tools/solver/space.ts';
import { levelHooks } from '../../../src/core/obstacles/registry.ts';
import { compiledLevel, loadFixture } from '../../fixtures/builders.ts';
import { MICRO } from './micro.ts';

const draft = (n: number): CompiledLevel =>
  compile(LevelSchema.parse(loadFixture('levels-2r', `level_${String(n).padStart(3, '0')}`)));

/** Small deterministic LCG (test-local; the core RNG is not needed here). */
function lcg(seed: number): () => number {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

describe('K-50 solver move generation', () => {
  it('K-50 fast yard path equals applyMove (10 000 random yard moves, buffers and Zobrist hashes)', () => {
    const levels: CompiledLevel[] = [
      draft(1),
      draft(5),
      draft(7),
      draft(8),
      draft(10),
      compiledLevel(MICRO.dig),
      compiledLevel({
        pieces: [
          ['O4_0', 'W', 0, 0],
          ['D2_0', 'W', 2, 0],
          ['D2_90', 'Y', 3, 0],
          ['O4_0', 'Y', 0, 2],
        ],
        plan: ['YY', 'YY', 'YY', 'WW', 'WW', 'WW', 'WW', 'WW'].slice(0, 6),
      }),
    ];
    let compared = 0;
    let walk = 0;
    while (compared < 10_000) {
      const lvl = levels[walk % levels.length] as CompiledLevel;
      const rnd = lcg(walk * 7919 + 1);
      const x = new Expander(lvl, levelHooks(lvl));
      let cur: GameState = solverStart(lvl);
      for (let step = 0; step < 40 && compared < 10_000; step++) {
        const h = hashState(cur);
        const lo = h[0] ?? 0;
        const hi = h[1] ?? 0;
        const next: Int32Array[] = [];
        x.expand(cur, lo, hi, (nlo, nhi) => {
          const succ = x.materialize();
          next.push(succ.buf.slice());
          if (x.lastSlow) return;
          // the same move through the full core pipeline
          const ref: GameState = { lvl, buf: cur.buf.slice() };
          const res = applyMove(ref, x.lastMove(), undefined, { noTruckHelp: true, strict: true });
          expect(res.status).toBe('applied');
          expect(moveCost(ref)).toBe(1);
          normalizeState(ref);
          expect(Array.from(succ.buf)).toEqual(Array.from(ref.buf));
          const want = hashState(ref);
          expect([nlo, nhi]).toEqual([want[0], want[1]]);
          compared++;
        });
        if (next.length === 0) break;
        const pick = next[Math.floor(rnd() * next.length)] as Int32Array;
        cur = { lvl, buf: pick };
      }
      walk++;
    }
    expect(compared).toBeGreaterThanOrEqual(10_000);
  }, 60_000);

  it('K-50 reach cache equals a fresh core drag session (same moves, same order, on random walks)', () => {
    const levels: CompiledLevel[] = [
      draft(3),
      draft(4),
      draft(7),
      draft(9),
      draft(10),
      compiledLevel(MICRO.gap),
    ];
    let states = 0;
    levels.forEach((lvl, li) => {
      const hooks = levelHooks(lvl);
      const cached = new Expander(lvl, hooks);
      const fresh = new Expander(lvl, hooks, { reachCache: false });
      const rnd = lcg(li + 99);
      for (let walk = 0; walk < 6; walk++) {
        let cur: GameState = solverStart(lvl);
        for (let step = 0; step < 30; step++) {
          const h = hashState(cur);
          const list = (x: Expander): string[] => {
            const out: string[] = [];
            x.expand(cur, h[0] ?? 0, h[1] ?? 0, (lo, hi, info) => {
              out.push(`${lo}:${hi}:${info}:${x.lastPiece}:${x.lastIx},${x.lastIy},${x.lastMode}`);
            });
            return out;
          };
          const a = list(cached);
          expect(a).toEqual(list(fresh));
          states++;
          const next: Int32Array[] = [];
          cached.expand(cur, h[0] ?? 0, h[1] ?? 0, () => next.push(cached.materialize().buf.slice()));
          if (next.length === 0) break;
          cur = { lvl, buf: next[Math.floor(rnd() * next.length)] as Int32Array };
        }
      }
      expect(cached.stats.reachHits, `level ${li}: the cache is used`).toBeGreaterThan(0);
    });
    expect(states).toBeGreaterThan(500);
  }, 60_000);

  it('K-50 the state store gives every buffer back bit for bit (XOR varint records, rehash on growth)', () => {
    const lvl = draft(5);
    const start = solverStart(lvl);
    const space = new StateSpace(start.buf, 4);
    const bufs: Int32Array[] = [];
    const rnd = lcg(42);
    for (let i = 0; i < 3000; i++) {
      const b = start.buf.slice();
      for (let k = 0; k < 6; k++) b[Math.floor(rnd() * b.length)] = Math.floor(rnd() * 2 ** 32) | 0;
      if (i % 7 === 0) b[3] = -5;
      bufs.push(b);
      expect(space.find(i + 1, i * 3)).toBe(-1);
      space.add(i + 1, i * 3, b);
    }
    const out = new Int32Array(start.buf.length);
    bufs.forEach((b, i) => {
      expect(space.find(i + 1, i * 3)).toBe(i);
      space.load(i, out);
      expect(Array.from(out)).toEqual(Array.from(b));
    });
  });
});

/** Cost of the last applied move from the counter (the solver counter starts at SOLVER_MOVES). */
function moveCost(s: GameState): number {
  return 1_000_000 - (s.buf[H.movesLeft] ?? 0);
}
