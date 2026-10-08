import { describe, expect, it } from 'vitest';
import { W1_staticGap } from '../../src/core/obstacles/W1_staticGap.ts';
import { activeRuleIds, infoKeysFor, levelHooks } from '../../src/core/obstacles/registry.ts';
import { measureYao } from '../../src/core/moves.ts';
import { tryBeginDrag, railMode } from '../../src/core/movement.ts';
import type { DragSession } from '../../src/core/movement.ts';
import { GF, H, createInitialState, gapField, hdr, pieceX, pieceY, pieceZone } from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import { validateLevelJson } from '../../src/core/level/logic.ts';
import { wallChar } from '../../src/core/ascii.ts';
import { Zone } from '../../src/core/types.ts';
import type { PieceId } from '../../src/core/types.ts';
import { compiledLevel, initialState, levelJson } from '../fixtures/builders.ts';
import type { LevelSpec } from '../fixtures/builders.ts';
import { HAND, N, RAIL, dragTo, find, levelFile, run, types } from '../core/moves.fixtures.ts';
import { i18nText } from './obstacles.fixtures.ts';

/** Session of a pick with the level's registry hooks (what the scene does); throws when the block cannot be held. */
function session(s: GameState, id: PieceId): DragSession {
  const a = tryBeginDrag(s, id, levelHooks(s.lvl).drag);
  if (!a.ok) throw new Error(`piece ${id} cannot be picked (${a.reason})`);
  return a.session;
}

/** Wall 4, static gap row 2; plan (bottom → top) `..`, `..`, `RR`: only the gap reaches row 2 without falling. */
const LINTEL: LevelSpec = {
  wall: { height: 4, gaps: [{ type: 'static', y: 2, size: 1 }] },
  plan: ['RR', '..', '..'],
  pieces: [['D2_90', 'R', 4, 2]],
};

describe('W1 Sabit Geçit — static gap (OBSTACLES W1, GDD K-04, K-12)', () => {
  it('W1 applies to levels with a static gap (levels 4 and 9) and carries the obs.w1.desc card in TR and EN', () => {
    expect(W1_staticGap.appliesTo(levelFile(4))).toBe(true);
    expect(W1_staticGap.appliesTo(levelFile(9))).toBe(true); // W3 = a static gap of size 1
    expect(W1_staticGap.appliesTo(levelFile(3))).toBe(false); // wall without gaps
    expect(W1_staticGap.appliesTo(levelFile(5))).toBe(false);
    expect(W1_staticGap.owns?.gapType).toBe('static');
    expect(activeRuleIds(levelFile(4))).toEqual(['W1']);
    expect(infoKeysFor(levelFile(4))).toEqual(['obs.w1.desc']);
    for (const locale of ['tr', 'en'] as const) expect(i18nText(locale, 'obs.w1.desc')).toMatch(/\S/);
  });

  it('W1 K-04 the static gap is open from the level start and never closes (level 4 canonical solution)', () => {
    const s = createInitialState(levelFile(4)); // wall 4, gap y 0 size 2
    const rows = (): string[] => [0, 1].map((y) => wallChar(s, y));
    expect(gapField(s, 0, GF.open)).toBe(1);
    expect(rows()).toEqual(['=', '=']);
    expect([2, 3].map((y) => wallChar(s, y))).toEqual(['#', '#']);
    for (const m of HAND[4]) {
      expect(run(s, m).res.status).toBe('applied');
      expect(gapField(s, 0, GF.open)).toBe(1);
      expect(rows()).toEqual(['=', '=']);
    }
  });

  it('W1 K-12 level 4 move 3: the buried O4 slides through the gap onto the rail and is placed without falling', () => {
    const s = createInitialState(levelFile(4));
    run(s, HAND[4][0] ?? dragTo(0, 0, 0)); // e: shift
    run(s, HAND[4][1] ?? dragTo(0, 0, 0)); // c: shift, the corridor opens
    const r = run(s, dragTo(0, 4, 0, 0));
    expect(find(r.ev, 'pieceMoved')).toMatchObject({
      pieceId: 0,
      entry: 'gap',
      gap: 0,
      to: { zone: 'site', x: 4, y: 0 },
    });
    expect(types(r.ev)).not.toContain('pieceFell');
    expect(find(r.ev, 'placementCorrect')).toMatchObject({ pieceId: 0, overWall: false });
    expect([pieceZone(s, 0), pieceX(s, 0), pieceY(s, 0)]).toEqual([Zone.site, 4, 0]);
  });

  it('W1 K-12 a rail block released over empty cells is held by the scaffold; over the wall it would fall (K-11)', () => {
    const rail = initialState(LINTEL);
    const held = run(rail, dragTo(0, 6, 2, 0));
    expect(types(held.ev)).not.toContain('pieceFell');
    expect(find(held.ev, 'placementCorrect').cells).toEqual([
      { zone: 'site', x: 6, y: 2, seg: 0 },
      { zone: 'site', x: 7, y: 2, seg: 0 },
    ]);
    expect(held.res.won).toBe(true); // the two `.` rows stay empty (S2)

    const free = initialState(LINTEL);
    const fell = run(free, dragTo(0, 6, 8));
    expect(find(fell.ev, 'pieceFell')).toMatchObject({ to: { x: 6, y: 0 }, rows: 8 });
    expect(find(fell.ev, 'pieceBounced')).toMatchObject({
      reason: 'window',
      to: { zone: 'yard', x: 4, y: 2 },
    });
  });

  it('W1 K-12 only a block whose rows all lie in the gap rows can enter the rail', () => {
    const s = initialState({
      wall: { height: 6, gaps: [{ type: 'static', y: 2, size: 1 }] },
      plan: ['WW', 'WW'],
      pieces: [
        ['D2_0', 'W', 0, 4], // vertical: two rows, the gap is row 2 only
        ['D2_90', 'W', 2, 0], // horizontal: climbs to row 2 in the yard, then enters
      ],
    });
    const hasRail = (id: PieceId): boolean =>
      session(s, id)
        .reachableNodes()
        .some((n) => n.mode === railMode(0));
    expect(hasRail(0)).toBe(false);
    expect(hasRail(1)).toBe(true);
    expect(
      session(s, 1)
        .reachableNodes()
        .filter((n) => n.mode === railMode(0))
        .every((n) => n.iy === 2),
    ).toBe(true);
  });

  it('W1 K-12 the rail is entered rightwards from a position fully in the yard and left back into the yard', () => {
    const s = initialState(LINTEL);
    const drag = session(s, 0);
    expect(drag.current).toEqual(N(4, 2));
    expect(drag.pathTo(RAIL(0, 6, 2))).toEqual([RAIL(0, 5, 2), RAIL(0, 6, 2)]);
    // RAIL: horizontal only; the way out is a step left onto a node fully in the yard (FREE again)
    expect(drag.neighbours(RAIL(0, 6, 2)).every((n) => n.iy === 2)).toBe(true);
    expect(drag.neighbours(RAIL(0, 5, 2))).toContainEqual(N(4, 2));
    // no rail entry from the site side: a FREE node over the site never steps into the rail
    expect(drag.neighbours(N(6, 4)).some((n) => n.mode !== 0)).toBe(false);
  });

  it('W1 K-07 a block released while straddling the gap is cancelled and burns no move', () => {
    const s = initialState(LINTEL);
    const before = hdr(s, H.movesLeft);
    expect(session(s, 0).classify(RAIL(0, 5, 2))).toMatchObject({ kind: 'cancel', reason: 'straddle' });
    const r = run(s, dragTo(0, 5, 2, 0));
    expect(r.res).toMatchObject({ status: 'cancelled', reason: 'straddle' });
    expect(hdr(s, H.movesLeft)).toBe(before);
    expect([pieceX(s, 0), pieceY(s, 0)]).toEqual([4, 2]);
  });

  it('W1 K-46 correct rail placements count as through the gap, not over the wall (level 4: YAO 4/5, level 9: 3/4)', () => {
    const four = createInitialState(levelFile(4));
    for (const m of HAND[4]) run(four, m);
    expect(measureYao(four)).toEqual({ overWall: 4, rail: 1, yao: 4 / 5 });
    const nine = createInitialState(levelFile(9));
    for (const m of HAND[9]) run(nine, m);
    expect(measureYao(nine)).toEqual({ overWall: 3, rail: 1, yao: 3 / 4 });
  });

  it('W1 K-45 a gap must leave a closed wall row above it: y + size ≤ height − 1 (gap_touches_top)', () => {
    const withGap = (size: number): LevelSpec => ({
      ...LINTEL,
      wall: { height: 4, gaps: [{ type: 'static', y: 2, size }] },
    });
    const bad = validateLevelJson(levelJson(withGap(2)));
    expect(bad.issues.map((i) => i.code)).toContain('gap_touches_top');
    const ok = validateLevelJson(levelJson(withGap(1)));
    expect(ok.issues.map((i) => i.code)).not.toContain('gap_touches_top');
    expect(compiledLevel(LINTEL).gaps[0]).toMatchObject({ type: 'static', y: 2, size: 1 });
  });
});
