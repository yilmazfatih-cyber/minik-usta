import { describe, expect, it } from 'vitest';
import {
  boosterTargets,
  craneSiteSpots,
  hammerTargetKind,
  hammerTargets,
  hasPaintTarget,
  paintPartners,
  trowelSpots,
  undoBlock,
} from '../../src/core/boosters.ts';
import { levelHooks } from '../../src/core/obstacles/registry.ts';
import { remainingSupplyByColor } from '../../src/core/goals.ts';
import { measureYao } from '../../src/core/moves.ts';
import type { MoveHooks } from '../../src/core/moves.ts';
import type { PlacementRules } from '../../src/core/placement.ts';
import { GameSession } from '../../src/core/session.ts';
import { slotState, purchaseOffered } from '../../src/core/summary.ts';
import {
  H,
  goalValue,
  hasFlag,
  hdr,
  pieceColor,
  pieceShape,
  pieceX,
  pieceY,
  pieceZone,
} from '../../src/core/state.ts';
import { shapeByIndex } from '../../src/core/shapes.ts';
import { Zone } from '../../src/core/types.ts';
import type { Move } from '../../src/core/types.ts';
import { compiledLevel, initialState } from '../fixtures/builders.ts';
import type { LevelSpec } from '../fixtures/builders.ts';
import { dragTo, expectConsistent, find, run, types } from './moves.fixtures.ts';

/** LEVELS Bölüm 8 (Faz 2R draft): yard 6 × 5, site 2 × 6; `f` Q9 Ağır Yük over the first needed `a` (O4 R). */
const B8: LevelSpec = {
  id: 8,
  difficulty: 'normal',
  yard: { cols: 6, rows: 5 },
  site: { cols: 2, rows: 6 },
  wall: { height: 5 },
  plan: ['WW', 'YY', 'YW', 'YW', 'RR', 'RR'],
  pieces: [
    ['O4_0', 'R', 0, 0],
    ['D2_0', 'W', 2, 0],
    ['D2_0', 'Y', 3, 0],
    ['D2_90', 'Y', 4, 2],
    ['D2_90', 'W', 4, 3],
    ['Q9_0', 'W', 0, 2],
  ],
};

/** GDD K-30 tiling example board (site 2 × 4, plan bottom → top YW YW WW WW). */
const TILING: LevelSpec = {
  wall: { height: 2 },
  site: { cols: 2, rows: 4 },
  plan: ['WW', 'WW', 'YW', 'YW'],
  pieces: [
    ['D2_0', 'Y', 0, 0],
    ['D2_0', 'W', 1, 0],
    ['O4_0', 'W', 2, 0],
  ],
};

const HAMMER = (pieceId: number): Move => ({ kind: 'hammer', target: { pieceId } });

describe('K-36 Hammer (Faz 2R: never a material block)', () => {
  it('K-36 GDD example (Bölüm 8): the Q9 Ağır Yük is smashed (gone), the O4 R is uncovered; no move, m or streak; K-54 the slot then has no target', () => {
    const s = initialState(B8);
    const hooks = levelHooks(s.lvl);
    expect(hammerTargets(s, hooks)).toEqual([{ pieceId: 5 }]);
    expect(hammerTargetKind(s, { pieceId: 5 }, hooks)).toBe('cargo');
    const r = run(s, HAMMER(5));
    expect(r.res.status).toBe('applied');
    expect(types(r.ev)).toEqual(['boosterApplied', 'cargoSmashed']);
    expect(find(r.ev, 'boosterApplied')).toMatchObject({
      step: 1,
      booster: 'hammer',
      detail: { target: 'cargo', pieceId: 5 },
    });
    expect(pieceZone(s, 5)).toBe(Zone.gone);
    expect([hdr(s, H.turn), hdr(s, H.movesLeft), hdr(s, H.movesSpent), hdr(s, H.combo)]).toEqual([
      0, 20, 0, 0,
    ]);
    expect(hammerTargets(s, hooks)).toEqual([]);
    expect(boosterTargets(s, hooks, false).hammer).toBe(false);
    expect(slotState({ unlocked: true, hasTarget: false, count: 2 })).toBe('noTarget');
    expectConsistent(s);
  });

  it('E-51 the hammer on a material yard block (the O4 R, the D2_0 W) does nothing and is not spent (K-47)', () => {
    const s = initialState(B8);
    const before = s.buf.slice();
    for (const id of [0, 1]) {
      const r = run(s, HAMMER(id));
      expect(r.res).toEqual({ status: 'rejected', reason: 'noTarget', won: false, outOfMoves: false });
      expect(r.ev).toEqual([
        { seq: 0, step: 0, t: 'boosterRejected', booster: 'hammer', reason: 'noTarget' },
      ]);
    }
    expect(s.buf).toEqual(before);
  });

  it('K-36 a site debris goes down to the yard by K-17 step 2 (first column nearest the wall) and counts clear: debris; a stuck mortar block is freed the same way', () => {
    const s = initialState({
      wall: { height: 2 },
      site: { cols: 2, rows: 2 },
      plan: ['WW', 'RR'],
      pieces: [['D2_90', 'R', 0, 0]],
      debris: [['D2_90', 'W', 6, 0]],
      goals: [{ type: 'build' }, { type: 'clear', target: 'debris', count: 1 }],
    });
    const hooks = levelHooks(s.lvl);
    expect(hammerTargetKind(s, { pieceId: 1 }, hooks)).toBe('siteDebris');
    const r = run(s, HAMMER(1));
    expect(find(r.ev, 'pieceReturned')).toMatchObject({ step: 1, pieceId: 1, to: { zone: 'yard', x: 4 } });
    expect(find(r.ev, 'goalProgress')).toMatchObject({ step: 7, goal: 1, value: 1 });
    expect([pieceZone(s, 1), pieceX(s, 1), hasFlag(s, 1, 'debris')]).toEqual([Zone.yard, 4, false]);
    expectConsistent(s);

    // Y8-like sticking rule (the real plugin is Faz 3): a mortar block sticks on a wrong placement
    const MORTAR: PlacementRules = {
      onPlacement: (st, id) => ({ kind: hasFlag(st, id, 'mortar') ? 'stick' : 'default' }),
    };
    const m = initialState({
      wall: { height: 2 },
      site: { cols: 2, rows: 1 },
      plan: ['WW'],
      pieces: [
        ['B1_0', 'Y', 0, 0, ['mortar']],
        ['D2_90', 'W', 2, 0],
      ],
    });
    run(m, dragTo(0, 6, 8), { hooks: { placement: MORTAR } });
    expect(hasFlag(m, 0, 'stuck')).toBe(true);
    expect(hammerTargetKind(m, { pieceId: 0 }, {})).toBe('stuckMortar');
    run(m, HAMMER(0));
    expect([pieceZone(m, 0), hasFlag(m, 0, 'stuck')]).toEqual([Zone.yard, false]);
    expectConsistent(m);
  });
});

describe('K-37 Crane', () => {
  it('K-37 (b) a buried block flies to its correct site spot and locks: no streak, no YAO, no move (Bölüm 10 shape)', () => {
    const s = initialState({
      wall: { height: 2 },
      site: { cols: 2, rows: 4 },
      plan: ['GG', 'GG', 'RR', 'RR'],
      pieces: [
        ['O4_0', 'R', 0, 0],
        ['O4_0', 'G', 2, 0],
        ['Q9_0', 'W', 2, 2],
      ],
    });
    run(s, dragTo(0, 6, 8));
    const c = hdr(s, H.combo);
    expect(craneSiteSpots(s, 1)).toEqual([{ rotation: 0, at: { ix: 6, iy: 2 } }]);
    const r = run(s, { kind: 'crane', pieceId: 1, to: { zone: 'site', x: 6, y: 2 }, rotation: 0 });
    expect(r.res.won).toBe(true); // K-48: only the Ağır Yük stays
    expect(find(r.ev, 'pieceLifted')).toMatchObject({
      by: 'crane',
      from: { zone: 'yard', x: 2, y: 0 },
      to: { zone: 'site', x: 6, y: 2 },
    });
    expect(types(r.ev)).not.toContain('placementCorrect');
    expect([hdr(s, H.combo), measureYao(s).overWall, hdr(s, H.turn)]).toEqual([c, 1, 1]);
  });

  it('K-37 a site target may turn the block clockwise (C3_0 → C3_270), width ≤ Ws; a yard target never turns it; the Ağır Yük never goes to the site', () => {
    const s = initialState({
      wall: { height: 2 },
      site: { cols: 2, rows: 2 },
      plan: ['WW', 'WW'],
      pieces: [
        ['C3_0', 'W', 0, 0],
        ['B1_0', 'W', 3, 0],
        ['I5_0', 'W', 0, 4],
      ],
    });
    expect(craneSiteSpots(s, 0)).toEqual([
      { rotation: 0, at: { ix: 6, iy: 0 } },
      { rotation: 270, at: { ix: 6, iy: 0 } },
    ]);
    expect(
      run(s, { kind: 'crane', pieceId: 0, to: { zone: 'yard', x: 3, y: 2 }, rotation: 90 }).res.reason,
    ).toBe('badRotation');
    expect(
      run(s, { kind: 'crane', pieceId: 2, to: { zone: 'site', x: 6, y: 0 }, rotation: 0 }).res.reason,
    ).toBe('noTarget');
    expect(
      run(s, { kind: 'crane', pieceId: 2, to: { zone: 'yard', x: 0, y: 3 }, rotation: 0 }).res.status,
    ).toBe('applied');
    const r = run(s, { kind: 'crane', pieceId: 0, to: { zone: 'site', x: 6, y: 0 }, rotation: 270 });
    expect(r.res.status).toBe('applied');
    expect(shapeByIndex(pieceShape(s, 0)).id).toBe('C3_270');
    expect(find(r.ev, 'pieceLifted').shape).toBe('C3_270');
    expect(run(s, dragTo(1, 6, 8)).res.won).toBe(true);
    expectConsistent(s);
  });

  it('K-37 a block wider than Ws after the turn is refused (I3_90 on a 2-wide site)', () => {
    const s = initialState({
      wall: { height: 2 },
      site: { cols: 2, rows: 3 },
      plan: ['WW', 'WW', 'YW'],
      pieces: [
        ['I3_0', 'W', 0, 0],
        ['D2_0', 'W', 1, 0],
        ['B1_0', 'Y', 2, 0],
      ],
    });
    run(s, dragTo(2, 6, 8));
    expect(craneSiteSpots(s, 0)).toEqual([{ rotation: 0, at: { ix: 7, iy: 0 } }]); // I3_90 (w 3) never listed
    expect(
      run(s, { kind: 'crane', pieceId: 0, to: { zone: 'site', x: 6, y: 1 }, rotation: 90 }).res.reason,
    ).toBe('badRotation');
  });

  it('E-60 crane target rejected by the D3a precheck: of the two correct spots of the D2_0 W, the dead one is refused and nothing is spent; a yard target cannot turn it', () => {
    const s = initialState(TILING);
    run(s, dragTo(0, 6, 8));
    expect(craneSiteSpots(s, 1)).toEqual([
      { rotation: 0, at: { ix: 6, iy: 2 } },
      { rotation: 0, at: { ix: 7, iy: 0 } },
    ]);
    const before = s.buf.slice();
    const dead = run(s, { kind: 'crane', pieceId: 1, to: { zone: 'site', x: 6, y: 2 }, rotation: 0 });
    expect(dead.res).toEqual({ status: 'rejected', reason: 'precheck', won: false, outOfMoves: false });
    expect(s.buf).toEqual(before);
    expect(
      run(s, { kind: 'crane', pieceId: 1, to: { zone: 'yard', x: 3, y: 3 }, rotation: 90 }).res.reason,
    ).toBe('badRotation');
    expect(
      run(s, { kind: 'crane', pieceId: 1, to: { zone: 'site', x: 7, y: 0 }, rotation: 0 }).res.status,
    ).toBe('applied');
    expect(hasFlag(s, 1, 'locked')).toBe(true);
  });
});

describe('K-38 Paint brush (colour swap)', () => {
  it('E-52 a 2-cell W block with O4 Y: cell counts differ → nothing, not spent; O4 W with O4 Y → colours swap, supply per colour unchanged (K-47)', () => {
    const s = initialState({
      wall: { height: 2 },
      site: { cols: 2, rows: 5 },
      plan: ['WW', 'YY', 'YY', 'WW', 'WW'],
      pieces: [
        ['O4_0', 'Y', 0, 0],
        ['O4_0', 'W', 2, 0],
        ['D2_90', 'W', 4, 0],
      ],
    });
    const supply = remainingSupplyByColor(s);
    const before = s.buf.slice();
    expect(run(s, { kind: 'paint', a: 2, b: 0 }).res.reason).toBe('noTarget');
    expect(s.buf).toEqual(before);
    expect(paintPartners(s, 0)).toEqual([1]);
    const r = run(s, { kind: 'paint', a: 1, b: 0 });
    expect(r.res.status).toBe('applied');
    expect(find(r.ev, 'colorsSwapped')).toMatchObject({ step: 1, a: 1, b: 0, aColor: 'Y', bColor: 'W' });
    expect([pieceColor(s, 0), pieceColor(s, 1)]).toEqual([0, 1]); // W, Y
    expect([pieceX(s, 0), pieceY(s, 0), pieceShape(s, 0)]).toEqual([0, 0, before[s.lvl.layout.pieces] ?? 0]);
    expect(remainingSupplyByColor(s)).toEqual(supply);
    expect([hdr(s, H.turn), hdr(s, H.movesLeft)]).toEqual([0, 20]);
  });

  it('K-38 pre-check: a swap whose result cannot be tiled is refused (D2_0 Y ↔ D2_90 W leaves a vertical Y need for a horizontal block)', () => {
    // plan bottom → top: Y W / Y W / W W; blocks D2_0 Y, D2_0 W, D2_90 W
    const s = initialState({
      wall: { height: 2 },
      site: { cols: 2, rows: 3 },
      plan: ['WW', 'YW', 'YW'],
      pieces: [
        ['D2_0', 'Y', 0, 0],
        ['D2_0', 'W', 1, 0],
        ['D2_90', 'W', 2, 0],
      ],
    });
    expect(run(s, { kind: 'paint', a: 0, b: 2 }).res.reason).toBe('precheck');
    expect(run(s, { kind: 'paint', a: 0, b: 1 }).res.status).toBe('applied');
    expect(hasPaintTarget(s)).toBe(true);
  });
});

describe('K-54 slot targets (K-36…K-39) and K-39 Undo', () => {
  it('K-54 slot state order locked noTarget empty ready (first that holds)', () => {
    expect(slotState({ unlocked: false, hasTarget: false, count: 0 })).toBe('locked');
    expect(slotState({ unlocked: false, hasTarget: true, count: 3 })).toBe('locked');
    expect(slotState({ unlocked: true, hasTarget: false, count: 3 })).toBe('noTarget');
    expect(slotState({ unlocked: true, hasTarget: true, count: 0 })).toBe('empty');
    expect(slotState({ unlocked: true, hasTarget: true, count: 1 })).toBe('ready');
  });

  it('K-54 no purchase offer for booster without target: only an empty (unlocked, targeted, 0) slot shows "+" and the window', () => {
    expect(purchaseOffered('noTarget')).toBe(false);
    expect(purchaseOffered('locked')).toBe(false);
    expect(purchaseOffered('ready')).toBe(false);
    expect(purchaseOffered('empty')).toBe(true);
  });

  it('K-54 targets on Bölüm 8 at the start: hammer (Ağır Yük), crane, trowel (the O4 R has P), paint brush (D2_0 W ↔ D2_0 Y); Undo needs a drag', () => {
    const s = initialState(B8);
    const t = boosterTargets(s, levelHooks(s.lvl), false);
    expect(t).toEqual({ hammer: true, crane: true, undo: false, paintBrush: true, trowel: true });
    expect(trowelSpots(s, 0)).toEqual([{ ix: 6, iy: 0 }]);
    expect(undoBlock({ outcome: 'playing', lastDragUndoable: false })).toBe('noDragMove');
    const game = GameSession.start(compiledLevel(B8));
    expect(game.summary().boosterTargets.undo).toBe(false);
    game.commit(dragTo(3, 4, 0));
    expect(game.summary().boosterTargets.undo).toBe(true);
  });

  it('K-39 Undo after a Söküm-free drag restores m, movesSpent and the streak; after a booster there is nothing to undo', () => {
    const game = GameSession.start(compiledLevel(B8));
    game.commit(dragTo(3, 4, 0)); // d to the low pocket (yard move)
    expect([game.movesMade, game.movesSpent]).toEqual([1, 1]);
    expect(game.undo()).toBe(true);
    expect([game.movesMade, game.movesSpent, game.movesLeft]).toEqual([0, 0, 20]);
    game.commit(dragTo(3, 4, 0));
    game.commit(HAMMER(5));
    expect(game.undoBlock()).toBe('noDragMove');
  });

  it('K-36 hook ownership: a chained block is a hammer target through the Y3 rule (the chain goes, the block stays)', () => {
    const s = initialState({
      wall: { height: 2 },
      site: { cols: 2, rows: 1 },
      plan: ['WW'],
      pieces: [
        ['B1_0', 'W', 0, 0, ['chained']],
        ['B1_0', 'W', 1, 0],
      ],
      goals: [{ type: 'build' }, { type: 'clear', target: 'chain', count: 1 }],
    });
    const hooks: MoveHooks = levelHooks(s.lvl);
    expect(hammerTargetKind(s, { pieceId: 0 }, hooks)).toBe('chain');
    expect(hammerTargetKind(s, { pieceId: 1 }, hooks)).toBeNull();
    const r = run(s, HAMMER(0));
    expect(types(r.ev)).toEqual(['boosterApplied', 'chainReleased', 'goalProgress']);
    expect(find(r.ev, 'boosterApplied').detail).toMatchObject({ target: 'chain' });
    expect([hasFlag(s, 0, 'chained'), pieceZone(s, 0), goalValue(s, 1)]).toEqual([false, Zone.yard, 1]);
  });
});
