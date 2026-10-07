import { describe, expect, it } from 'vitest';
import { Y3_chain } from '../../src/core/obstacles/Y3_chain.ts';
import { activeRuleIds, infoKeysFor, levelHooks } from '../../src/core/obstacles/registry.ts';
import { tryBeginDrag } from '../../src/core/movement.ts';
import { goalValue, hasFlag, pieceY } from '../../src/core/state.ts';
import { compiledLevel, initialState } from '../fixtures/builders.ts';
import type { LevelSpec } from '../fixtures/builders.ts';
import { dragTo, expectConsistent, find, run, types } from '../core/moves.fixtures.ts';
import { i18nText } from './obstacles.fixtures.ts';

/** A chained B1 W at (0,0); its only neighbour is the B1 W at (1,0); a free D2_0 W at (4,0). Plan 2 × 2 W. */
const LONELY: LevelSpec = {
  wall: { height: 2 },
  site: { cols: 2, rows: 2 },
  plan: ['WW', 'WW'],
  pieces: [
    ['B1_0', 'W', 0, 0, ['chained']],
    ['B1_0', 'W', 1, 0],
    ['D2_0', 'W', 4, 0],
  ],
  goals: [{ type: 'build' }, { type: 'clear', target: 'chain', count: 1 }],
};

describe('Y3 Zincir — chain (OBSTACLES Y3, GDD K-09 (c), K-35 step 5, K-36, K-41, E-13, E-53)', () => {
  it('Y3 applies to levels with a chained block; it owns the `chained` flag and names its info card obs.y3.desc', () => {
    const lvl = compiledLevel(LONELY);
    expect(Y3_chain.appliesTo(lvl)).toBe(true);
    expect(activeRuleIds(lvl)).toEqual(['Y3']);
    expect(infoKeysFor(lvl)).toEqual(['obs.y3.desc']);
    // the card text (OBSTACLES Y3) is WP-L's: src/i18n gets obs.y3.desc with the Faz 3 chain levels
    expect(['tr', 'en'].map((l) => typeof i18nText(l as 'tr' | 'en', 'obs.y3.desc'))).toHaveLength(2);
    expect(Object.keys(levelHooks(lvl)).sort()).toEqual([
      'afterNeighbors',
      'drag',
      'hammer',
      'onNeighborMoved',
      'onTruckHelp',
    ]);
  });

  it('Y3 K-09 (c) a chained block cannot be held; E-13 a neighbour move frees it in step 5 and counts clear: chain', () => {
    const s = initialState(LONELY);
    const hooks = levelHooks(s.lvl);
    expect(tryBeginDrag(s, 0, hooks.drag)).toMatchObject({ ok: false, reason: 'rule' });
    const r = run(s, dragTo(1, 6, 8)); // the neighbour leaves (1,0)
    expect(find(r.ev, 'chainReleased')).toMatchObject({ step: 5, pieceId: 0 });
    expect(find(r.ev, 'goalProgress')).toMatchObject({ step: 7, goal: 1, value: 1 });
    expect(hasFlag(s, 0, 'chained')).toBe(false);
    expect(tryBeginDrag(s, 0, hooks.drag).ok).toBe(true);
    expectConsistent(s);
  });

  it('E-53 a chain with no block, Ağır Yük, crate or bag left around it is released at the end of step 5 (no neighbour effect needed)', () => {
    // the free D2_0 is not a neighbour: its move does not touch (0,0); the chained block has its B1 neighbour …
    const s = initialState({
      ...LONELY,
      pieces: [
        ['B1_0', 'W', 0, 0, ['chained']],
        ['D2_0', 'W', 0, 1],
        ['B1_0', 'W', 4, 0],
      ],
    });
    const first = run(s, dragTo(2, 6, 8)); // far away: (0,0) keeps its neighbour (0,1)
    expect(types(first.ev)).not.toContain('chainReleased');
    // … the D2_0 above leaves: a neighbour move (step 5 effect) frees it
    const second = run(s, dragTo(1, 7, 8));
    expect(find(second.ev, 'chainReleased')).toMatchObject({ step: 5, pieceId: 0 });

    // a chained block that loses its last neighbour through the hammer (Ağır Yük smashed, mini pipeline has no step-5
    // effect): the next drag's step 5 releases it (E-53)
    const t = initialState({
      ...LONELY,
      pieces: [
        ['B1_0', 'W', 0, 0, ['chained']],
        ['I5_0', 'W', 1, 0],
        ['D2_0', 'W', 0, 2],
        ['B1_0', 'W', 5, 7],
      ],
    });
    run(t, { kind: 'hammer', target: { pieceId: 1 } });
    expect(hasFlag(t, 0, 'chained')).toBe(true);
    const next = run(t, dragTo(3, 6, 8)); // far from (0,0); (0,1) is empty, (1,0) is empty now
    expect(find(next.ev, 'chainReleased')).toMatchObject({ step: 5, pieceId: 0 });
    expect(goalValue(t, 1)).toBe(1);
  });

  it('Y3 chained blocks still fall with yard gravity (Y6) after the release check', () => {
    const s = initialState({
      ...LONELY,
      gravity: { yard: true },
      pieces: [
        ['B1_0', 'W', 0, 1, ['chained']],
        ['B1_0', 'W', 0, 0],
        ['D2_0', 'W', 1, 1],
      ],
    });
    run(s, dragTo(1, 6, 8)); // the block under it leaves: the chain goes (neighbour), the block falls
    expect([hasFlag(s, 0, 'chained'), pieceY(s, 0)]).toEqual([false, 0]);
  });
});
