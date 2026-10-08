import { describe, expect, it } from 'vitest';
import { TOKENS } from '../../src/theme/tokens.ts';
import { createLayout } from '../../src/theme/layout.ts';
import { computeFall } from '../../src/core/gravity.ts';
import type { FallResult } from '../../src/core/gravity.ts';
import { GameSession } from '../../src/core/session.ts';
import { shapeById, shapeByIndex } from '../../src/core/shapes.ts';
import { COLOR_CODES } from '../../src/core/types.ts';
import type { DropClass } from '../../src/core/movement.ts';
import {
  badgeCell,
  badgeCentre,
  cancelPreview,
  shadowLook,
  showsShadow,
} from '../../src/scenes/level/shadowLook.ts';
import { N, RAIL, levelFile } from '../core/moves.fixtures.ts';
import { compiledLevel } from '../fixtures/builders.ts';

/**
 * Level 1 (easy, 4×4 | 2×5, H 5): `a` = D2_0 Y (piece 0), `b` = D2_0 W (piece 1); column 4 of the plan is Y Y at
 * rows 0–1 (LEVELS §2 Bölüm 1). Released in the crane area above column 4: `a` lands right, `b` on the wrong colour.
 */
function level1Falls(): { ok: FallResult; color: FallResult } {
  const { state: s } = GameSession.start(levelFile(1));
  return { ok: computeFall(s, 0, N(4, 5)), color: computeFall(s, 1, N(4, 5)) };
}

/**
 * A W D2_90 parked on the rail at (6, 3) — right colour, nothing under it (K-34). Builder board: the Faz 2R levels 1–10
 * have their gaps at row 0, where the rail is the floor.
 */
function railSupportFall(): FallResult {
  const lvl = compiledLevel({
    wall: { height: 6, gaps: [{ type: 'static', y: 3, size: 2 }] },
    plan: ['WW', 'RR', 'RR', 'RR'],
    pieces: [
      ['D2_90', 'W', 4, 3],
      ['O4_0', 'R', 0, 0],
      ['D2_90', 'R', 2, 0],
    ],
  });
  const { state: s } = GameSession.start(lvl);
  const w = COLOR_CODES.indexOf('W');
  const piece = lvl.pieces.find((p) => shapeByIndex(p.shapeIndex).id === 'D2_90' && p.colorIndex === w);
  if (!piece) throw new Error('no W D2_90 piece');
  return computeFall(s, piece.id, RAIL(0, 6, 3));
}

describe('fall shadow look (K-18, K-34 hook 2, UX 5.4, D-014)', () => {
  it('K-18 easy correct landing: solid valid outline, ✓ badge, no pulse, ghost body at the landing', () => {
    const look = shadowLook(level1Falls().ok, 'easy');
    expect(look).toMatchObject({ outline: 'valid', badge: 'ok', pulse: false, body: true, supportCells: [] });
  });

  it('K-18 easy wrong colour: dashed invalid outline, ! badge, 2 Hz pulse', () => {
    const fall = level1Falls().color;
    expect(fall.verdict.reasons[0]).toBe('color');
    expect(shadowLook(fall, 'normal')).toMatchObject({ outline: 'invalid', badge: 'warn', pulse: true });
  });

  it('K-34 hook 2 support is the primary reason: ↓ badge and the missing-support cells hatched; rail = no body', () => {
    const fall = railSupportFall();
    expect(fall.mode).toBe('rail');
    expect(fall.verdict.reasons).toEqual(['support']);
    const look = shadowLook(fall, 'easy');
    expect(look).toMatchObject({ outline: 'invalid', badge: 'support', pulse: true, body: false });
    expect(look.supportCells).toEqual(fall.verdict.missingSupport);
    expect(look.supportCells.length).toBeGreaterThan(0);
  });

  it('K-18 hard / superhard: neutral outline only — no badge, no pulse, no support hatch (UX 5.4)', () => {
    for (const d of ['hard', 'superhard'] as const) {
      expect(shadowLook(railSupportFall(), d)).toMatchObject({
        outline: 'neutral',
        badge: null,
        pulse: false,
        supportCells: [],
      });
      expect(shadowLook(level1Falls().color, d).outline).toBe('neutral');
    }
  });

  it('E-20 a landing on an unrevealed ? cell is neutral at every difficulty and never leaks the colour', () => {
    const hidden = { ...level1Falls().color, touchesHidden: true };
    expect(shadowLook(hidden, 'easy')).toMatchObject({ outline: 'neutral', badge: null, pulse: false });
    const hiddenOk = { ...level1Falls().ok, touchesHidden: true };
    expect(shadowLook(hiddenOk, 'easy').key).toBe(shadowLook(hidden, 'easy').key);
  });

  it('K-18 physics information (S3 glass crack) shows at every difficulty', () => {
    const breaking: FallResult = { ...level1Falls().ok, effect: { kind: 'break', penalty: 1 } };
    expect(shadowLook(breaking, 'superhard').badge).toBe('glass');
    expect(shadowLook(breaking, 'easy').badge).toBe('glass');
  });

  it('JUICE 7 the look key changes exactly when the shown state changes', () => {
    const f = level1Falls();
    expect(shadowLook(f.ok, 'easy').key).toBe(shadowLook(f.ok, 'easy').key);
    expect(shadowLook(f.ok, 'easy').key).not.toBe(shadowLook(f.color, 'easy').key);
  });
});

describe('cancel preview and badge placement (UX 5.3, K-07)', () => {
  const drop = (d: DropClass): DropClass => d;
  it('K-07 rows 3, 4, 5 preview a cancel; row 1 (start cells) and rows 6–7 do not', () => {
    expect(cancelPreview(drop({ kind: 'cancel', reason: 'craneOverYard', row: 3 }))).toBe(true);
    expect(cancelPreview(drop({ kind: 'cancel', reason: 'straddle', row: 4 }))).toBe(true);
    expect(cancelPreview(drop({ kind: 'cancel', reason: 'siteClosed', row: 5 }))).toBe(true);
    expect(cancelPreview(drop({ kind: 'cancel', reason: 'sameSpot', row: 1 }))).toBe(false);
    expect(cancelPreview(drop({ kind: 'siteFree', row: 6 }))).toBe(false);
    expect(showsShadow(drop({ kind: 'siteFree', row: 6 }))).toBe(true);
    expect(showsShadow(drop({ kind: 'siteRail', row: 7, gap: 0 }))).toBe(true);
    expect(showsShadow(drop({ kind: 'yard', row: 2 }))).toBe(false);
    expect(showsShadow(drop({ kind: 'cancel', reason: 'siteClosed', row: 5 }))).toBe(false);
  });

  it('UX 5.4 the badge sits inside the top-right cell of the shape', () => {
    const L = shapeById('L4_0');
    const cell = badgeCell(L);
    expect(L.cells.some((c) => c.x === cell.x && c.y === cell.y)).toBe(true);
    expect(cell.y).toBe(L.h - 1);
    const layout = createLayout(TOKENS, 1920);
    const d = TOKENS.a11y.ghostBadgePx;
    const p = badgeCentre(layout, L, 6, 0, d);
    const r = layout.grid.cellRect(6 + cell.x, cell.y);
    expect(p.x + d / 2).toBeCloseTo(r.x + r.w, 6);
    expect(p.y - d / 2).toBeCloseTo(r.y, 6);
  });
});
