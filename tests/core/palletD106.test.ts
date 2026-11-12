/**
 * D-106 (docs/DECISIONS.md, GDD K-58 item 10, `RULES_VERSION` 6): a held pallet layer does not collide with the
 * remaining layers of its own pallet — it rises out of the stack whatever its shape — while every other block, the wall
 * and the frame still collide, and the pallet stays solid for every other block. `pallet_stuck` is retired. Every test
 * name carries "K-58 item 10".
 */
import { describe, expect, it } from 'vitest';
import { compile } from '../../src/core/level/compile.ts';
import { validateLevelJson } from '../../src/core/level/logic.ts';
import type { LevelInput } from '../../src/core/level/schema.ts';
import { RULES_VERSION } from '../../src/core/session.ts';
import { createInitialState, pieceZone, yardOcc } from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import { Zone } from '../../src/core/types.ts';
import type { ShapeId } from '../../src/core/types.ts';
import { collisionMasks, isCovered, stateInvariantErrors } from '../../src/core/grid.ts';
import { beginDrag, tryBeginDrag } from '../../src/core/movement.ts';
import { levelHooks } from '../../src/core/obstacles/registry.ts';
import { craneRejection } from '../../src/core/boosters.ts';
import { noMoves, quickHoldable } from '../../src/core/deadlock.ts';
import { levelJson } from '../fixtures/builders.ts';
import type { LevelSpec, PieceSpec } from '../fixtures/builders.ts';
import { dragTo, find, run, types } from './moves.fixtures.ts';

function json(spec: LevelSpec): LevelInput {
  const base = levelJson({ ...spec, schemaVersion: 3 });
  return {
    ...base,
    yard: { ...base.yard, ...(spec.yard ?? {}) },
    ...(spec.site ? { site: { cols: spec.site.cols ?? 3, rows: spec.site.rows ?? 4 } } : {}),
  } as LevelInput;
}
/** A v3 level parsed and compiled without logic checks (small rule boards). */
function v3(spec: LevelSpec): GameState {
  const res = validateLevelJson(json(spec), { only: [] });
  if (!res.level) throw new Error(JSON.stringify(res.issues));
  return createInitialState(compile(res.level));
}
const codes = (spec: LevelSpec): string[] => validateLevelJson(json(spec)).issues.map((i) => i.code);

/** `layers` identical W layers of `shape` anchored at (0, 0) = piece ids 0 … layers − 1 (top = layers − 1). */
function palletPieces(shape: ShapeId, layers: number): PieceSpec[] {
  return Array.from({ length: layers }, (): PieceSpec => [shape, 'W', 0, 0]);
}
function palletTraits(layers: number, first = 0): LevelSpec['traits'] {
  return Object.fromEntries(
    Array.from({ length: layers }, (_, z) => [first + z, { stack: { id: 0, z } }]),
  ) as LevelSpec['traits'];
}

/**
 * The top layer of a ×3 pallet of `shape` at (0, 0) of a 6 × 4 yard, wall height 2, 3 × 5 site; `plan` is chosen so the
 * shape at site anchor (6, 0) is a correct placement (K-16, K-34; `.` under a T overhang). The plans are no full cover
 * (15 or 14 cells against 9 or 12), so D2 / D3a stay off (K-47) and a placement is never torn down by the tiling check.
 */
const PLAN = ['WWW', 'WWW', 'WWW', 'WWW', 'WWW'] as const;
const CASES: readonly { readonly shape: ShapeId; readonly plan: readonly string[] }[] = [
  { shape: 'C3_0', plan: PLAN },
  { shape: 'L4_0', plan: PLAN },
  { shape: 'T4_0', plan: ['WWW', 'WWW', 'WWW', 'WWW', 'W.W'] },
  { shape: 'J4_0', plan: PLAN },
  { shape: 'O4_0', plan: PLAN },
];
function palletLevel(shape: ShapeId, plan: readonly string[], extra: readonly PieceSpec[] = []): LevelSpec {
  return {
    id: 8,
    yard: { cols: 6, rows: 4 },
    site: { cols: 3, rows: 5 },
    wall: { height: 2 },
    plan,
    pieces: [...palletPieces(shape, 3), ...extra],
    traits: palletTraits(3),
  };
}

describe('K-58 item 10 D-106 a held pallet layer rises out of its own stack', () => {
  it('K-58 item 10 RULES_VERSION 6 (D-106 changes the drag R of a pallet layer and the replay of saved logs)', () => {
    expect(RULES_VERSION).toBe(6);
  });

  for (const { shape, plan } of CASES) {
    it(`K-58 item 10 ${shape} pallet x3: the top layer is held, rises through its own footprint and is placed on the site`, () => {
      const s = v3(palletLevel(shape, plan));
      expect(stateInvariantErrors(s)).toEqual([]);
      expect([isCovered(s, 0), isCovered(s, 1), isCovered(s, 2)]).toEqual([true, true, false]);
      // the held top layer's collision rows do not contain its own pallet's cells (the layers below)
      const masks = collisionMasks(s, 2);
      expect(masks[0] ?? 0, 'row 0').toBe(0);
      const attempt = tryBeginDrag(s, 2);
      expect(attempt.ok ? 'ok' : attempt.reason).toBe('ok');
      const d = beginDrag(s, 2);
      // one row up: the new cells overlap the pallet's own footprint (D-106: no collision with its own layers)
      expect(d?.isReachable({ ix: 0, iy: 1, mode: 0 })).toBe(true);
      // the start is still the K-07 row 1 cancel and the yard releases still cancel (K-58 item 9 c)
      expect(d?.classify({ ix: 0, iy: 0, mode: 0 })).toMatchObject({ kind: 'cancel', reason: 'sameSpot' });
      expect(d?.classify({ ix: 0, iy: 1, mode: 0 })).toMatchObject({
        kind: 'cancel',
        reason: 'palletSiteOnly',
      });
      expect(d?.reachableNodes().some((n) => n.ix >= 6 && d.classify(n).kind === 'siteFree')).toBe(true);
      const { ev } = run(s, dragTo(2, 6, 3));
      expect(types(ev)).not.toContain('teardown');
      expect(find(ev, 'placementCorrect').pieceId).toBe(2);
      expect(find(ev, 'placementCorrect').overWall).toBe(true);
      expect(pieceZone(s, 2)).toBe(Zone.site);
      // the next layer is the top now and owns the pallet's cells; it can be held too
      expect(yardOcc(s, 0, 0)).toBe(2);
      expect(isCovered(s, 1)).toBe(false);
      expect(isCovered(s, 0)).toBe(true);
      expect(tryBeginDrag(s, 1).ok).toBe(true);
      expect(stateInvariantErrors(s)).toEqual([]);
    });
  }

  it('K-58 item 10 the crane still lifts the top layer of a C3_0 pallet to a correct site spot only (K-58 item 9 e)', () => {
    const s = v3(palletLevel('C3_0', PLAN));
    const hooks = levelHooks(s.lvl);
    expect(
      craneRejection(s, { kind: 'crane', pieceId: 2, to: { zone: 'site', x: 6, y: 0 }, rotation: 0 }, hooks),
    ).toBeNull();
    expect(
      craneRejection(s, { kind: 'crane', pieceId: 2, to: { zone: 'yard', x: 3, y: 0 }, rotation: 0 }, hooks),
    ).toBe('palletSiteOnly');
    // a covered layer is no target (K-66 item 1)
    expect(
      craneRejection(s, { kind: 'crane', pieceId: 1, to: { zone: 'site', x: 6, y: 0 }, rotation: 0 }, hooks),
    ).toBe('noTarget');
  });
});

describe('K-58 item 10 D-106 every other collision still holds', () => {
  // C3_0 pallet x3 at (0, 0): cells (0,0) (1,0) (0,1). A B1 G at (1,1) caps the up and the right shift; the yard frame
  // closes the left and the down shift.
  const capped = palletLevel('C3_0', PLAN, [['B1_0', 'G', 1, 1]]);

  it('K-58 item 10 a held layer still collides with another block: capped by a B1 it cannot move (immovable)', () => {
    const s = v3(capped);
    const attempt = tryBeginDrag(s, 2);
    expect(attempt.ok ? 'ok' : attempt.reason).toBe('immovable');
    // the covered layers stay covered whatever the top can do
    expect(tryBeginDrag(s, 1).ok ? 'ok' : 'covered').toBe('covered');
  });

  it('K-58 item 10 the pallet stays solid for every other block: the B1 cannot step onto the pallet cells', () => {
    const s = v3(capped);
    const d = beginDrag(s, 3);
    expect(d).not.toBeNull();
    expect(d?.isReachable({ ix: 1, iy: 0, mode: 0 })).toBe(false); // (1,0) is a pallet cell
    expect(d?.isReachable({ ix: 0, iy: 1, mode: 0 })).toBe(false); // (0,1) is a pallet cell
    expect(d?.isReachable({ ix: 2, iy: 1, mode: 0 })).toBe(true);
    // once the B1 parks elsewhere the layer rises (the cap was another block, never its own pallet)
    expect(run(s, dragTo(3, 4, 0)).res.status).toBe('applied');
    expect(beginDrag(s, 2)?.isReachable({ ix: 0, iy: 1, mode: 0 })).toBe(true);
  });

  it('K-58 item 10 the wall and the frame still collide: a layer under a wall higher than the board has only cancels', () => {
    const s = v3({ ...palletLevel('C3_0', PLAN), wall: { height: 6 } });
    const d = beginDrag(s, 2);
    expect(d).not.toBeNull();
    expect(d?.reachableNodes().every((n) => n.ix + 1 <= s.lvl.geo.boundaryX)).toBe(true);
    expect(d?.reachableNodes().every((n) => d.classify(n).kind === 'cancel')).toBe(true);
  });

  it('K-58 item 10 the D2_90 example of K-58 item 4: the top layer now slides sideways over its own cells when the side is free', () => {
    // D2_90 pallet x2 at (0,0)-(1,0), nothing beside it: one cell right overlaps the own footprint at (1,0)
    const s = v3({
      id: 8,
      yard: { cols: 6, rows: 4 },
      site: { cols: 3, rows: 4 },
      plan: ['WWW', 'WWW', 'WWW', 'WWW'],
      pieces: palletPieces('D2_90', 2),
      traits: palletTraits(2),
    });
    const d = beginDrag(s, 1);
    expect(d?.isReachable({ ix: 1, iy: 0, mode: 0 })).toBe(true);
    expect(d?.classify({ ix: 1, iy: 0, mode: 0 })).toMatchObject({
      kind: 'cancel',
      reason: 'palletSiteOnly',
    });
  });
});

describe('K-58 item 10 D-106 K-30 D1 tests a pallet layer by its real site releases', () => {
  // one pallet layer left (the last layer of a pallet), a wall no block can cross: it can move in the yard, but every
  // yard release of a pallet layer cancels (K-58 item 9 c), so nothing can be released → D1
  const lastLayer = (height: number): LevelSpec => ({
    id: 8,
    yard: { cols: 6, rows: 4 },
    site: { cols: 3, rows: 4 },
    wall: { height },
    plan: ['WWW', 'WWW', 'WWW', 'WWW'],
    pieces: [['C3_0', 'W', 0, 0]],
    traits: { 0: { stack: { id: 0, z: 0 } } },
  });

  it('K-58 item 10 K-30 the last pallet layer behind an uncrossable wall is no move (the quick test defers to the BFS)', () => {
    const s = v3(lastLayer(6));
    const hooks = levelHooks(s.lvl);
    expect(quickHoldable(s, 0, hooks.drag)).toBe(false);
    expect(beginDrag(s, 0, hooks.drag)).not.toBeNull(); // it can be held …
    expect(noMoves(s, hooks.drag)).toBe(true); // … but has no release other than a cancel
  });

  it('K-58 item 10 K-30 the same layer with a crossable wall is a move (a site release exists)', () => {
    const s = v3(lastLayer(2));
    expect(noMoves(s, levelHooks(s.lvl).drag)).toBe(false);
  });
});

describe('K-58 item 10 pallet_stuck is retired (D-106)', () => {
  for (const shape of ['C3_0', 'O4_0', 'L4_0', 'J4_0', 'T4_0', 'D2_90'] as const) {
    it(`K-58 item 10 pallet_stuck is retired: a ${shape} pallet x2 is not reported`, () => {
      const spec: LevelSpec = {
        id: 8,
        yard: { cols: 6, rows: 4 },
        site: { cols: 3, rows: 4 },
        plan: ['GGG', 'GGG', 'WWW', 'WWW'],
        pieces: [...palletPieces(shape, 2), ['D2_90', 'G', 3, 0], ['D2_90', 'G', 3, 2]],
        traits: palletTraits(2),
      };
      expect(codes(spec)).not.toContain('pallet_stuck');
    });
  }
});
