/**
 * Levels v3 block traits and shapes (docs/GDD.md §16 ÖNERİ K-56…K-66, "K-30 değişikliği" D1 widening; OBSTACLES
 * "Bölümler v3 blok özellikleri" Y9–Y13; LEVELS §8.10 U-v3-0/1). The rules are ÖNERİ: their headings are not `### K-xx`
 * yet, so `test:rules` does not require them; every rule still has a named test here (code-lead package E1).
 */
import { describe, expect, it } from 'vitest';
import { compile } from '../../src/core/level/compile.ts';
import { validateLevelJson } from '../../src/core/level/logic.ts';
import type { LevelInput } from '../../src/core/level/schema.ts';
import { GameSession, RULES_VERSION } from '../../src/core/session.ts';
import { H, createInitialState, hasFlag, hdr, pieceY, pieceZone, yardOcc } from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import { Zone } from '../../src/core/types.ts';
import type { GameEvent } from '../../src/core/types.ts';
import { stateInvariantErrors, isCovered } from '../../src/core/grid.ts';
import { beginDrag, tryBeginDrag } from '../../src/core/movement.ts';
import { levelHooks } from '../../src/core/obstacles/registry.ts';
import {
  craneRejection,
  craneSelectable,
  hammerTargetKind,
  paintSelectable,
  trowelSelectable,
} from '../../src/core/boosters.ts';
import { noMoves, tileRemaining } from '../../src/core/deadlock.ts';
import { pieceClassExtra } from '../../src/core/hash.ts';
import { remainingSupplyByColor } from '../../src/core/goals.ts';
import { KIND_FIRST_LEVEL_V3, shapeById } from '../../src/core/shapes.ts';
import { fromAscii, shapeAscii, toAscii } from '../../src/core/ascii.ts';
import { levelJson } from '../fixtures/builders.ts';
import type { LevelSpec } from '../fixtures/builders.ts';
import { dragTo, find, run, types } from './moves.fixtures.ts';

/** A v3 level (schemaVersion 3) from a builder spec, parsed and compiled (no logic checks: small rule boards). */
function v3(spec: LevelSpec): GameState {
  const json = { ...levelJson({ ...spec, schemaVersion: 3 }), ...sized(spec) } as LevelInput;
  const res = validateLevelJson(json, { only: [] });
  if (!res.level) throw new Error(JSON.stringify(res.issues));
  return createInitialState(compile(res.level));
}
function sized(spec: LevelSpec): Partial<LevelInput> {
  const json = levelJson(spec);
  return {
    yard: { ...json.yard, ...(spec.yard ?? {}) },
    ...(spec.site ? { site: { cols: spec.site.cols ?? 2, rows: spec.site.rows ?? 4 } } : {}),
  };
}
/** Validator codes of a v3 level spec (every validate-stage check). */
function codes(spec: LevelSpec): string[] {
  const json = { ...levelJson({ ...spec, schemaVersion: 3 }), ...sized(spec) } as LevelInput;
  return validateLevelJson(json).issues.map((i) => i.code);
}
const YARD = { cols: 4, rows: 4 } as const;
const SITE = { cols: 2, rows: 4 } as const;

describe('K-56 shape set v3 (GDD §16; LEVELS §8.2)', () => {
  it('K-56 the 2-wide orientations have the contract cells (bottom-left origin)', () => {
    const cells = (id: Parameters<typeof shapeById>[0]): string =>
      shapeById(id)
        .cells.map((c) => `${c.x},${c.y}`)
        .join(' ');
    expect(cells('D2_0')).toBe('0,0 0,1');
    expect(cells('D2_90')).toBe('0,0 1,0');
    expect(cells('C3_0')).toBe('0,0 1,0 0,1');
    expect(cells('C3_90')).toBe('0,0 0,1 1,1');
    expect(cells('C3_180')).toBe('1,0 0,1 1,1');
    expect(cells('C3_270')).toBe('0,0 1,0 1,1');
    expect(cells('L4_0')).toBe('0,0 1,0 0,1 0,2');
    expect(cells('L4_180')).toBe('1,0 1,1 0,2 1,2');
    expect(cells('J4_0')).toBe('0,0 1,0 1,1 1,2');
    expect(cells('J4_180')).toBe('0,0 0,1 0,2 1,2');
    expect(cells('T4_0')).toBe('0,0 0,1 1,1 0,2');
    expect(cells('T4_180')).toBe('1,0 0,1 1,1 1,2');
    expect(cells('I3_0')).toBe('0,0 0,1 0,2');
  });

  it('K-56 ASCII drawing of a shape (top → bottom), with two-tone colours', () => {
    expect(shapeAscii('L4_180')).toBe('XX / .X / .X');
    expect(shapeAscii('T4_0')).toBe('X. / XX / X.');
    expect(shapeAscii('D2_90', 'WY')).toBe('WY');
    expect(shapeAscii('C3_0', 'GGW')).toBe('W. / GG');
  });

  it('K-56 v3 unlocks by level: L4/J4 2, T4 6, I3 8, S4/Z4 11, I4 21; shape_locked by level id in a schemaVersion 3 file', () => {
    expect(KIND_FIRST_LEVEL_V3).toMatchObject({ L4: 2, J4: 2, T4: 6, I3: 8, S4: 11, Z4: 11, I4: 21 });
    const spec = (id: number): LevelSpec => ({
      id,
      yard: YARD,
      site: SITE,
      wall: { height: 1 },
      plan: ['WW', 'W.', 'W.', 'WW'].map((r) => r.replace('.', 'W')),
      pieces: [
        ['T4_0', 'W', 0, 0],
        ['T4_180', 'W', 2, 0],
      ],
    });
    expect(codes(spec(5))).toContain('shape_locked');
    expect(codes(spec(6))).not.toContain('shape_locked');
  });

  it('K-56 piece_unreachable: a 3-tall shape over a wall that leaves only 2 rows (H + 2 − height < 3) and no gap', () => {
    const spec = (height: number): LevelSpec => ({
      id: 8,
      yard: YARD,
      site: SITE,
      wall: { height },
      plan: ['WW', 'WW', 'WW', 'WW'],
      pieces: [
        ['I3_0', 'W', 0, 0],
        ['I3_0', 'W', 1, 0],
        ['D2_0', 'W', 2, 0],
      ],
    });
    expect(codes(spec(4))).toContain('piece_unreachable'); // H 4 + 2 − 4 = 2 < 3
    expect(codes(spec(3))).not.toContain('piece_unreachable');
  });
});

describe('K-57 two-tone block (Y9)', () => {
  const twoTone = (plan: string[]): LevelSpec => ({
    id: 5,
    yard: YARD,
    site: SITE,
    plan,
    pieces: [
      ['D2_90', 'W', 0, 0],
      ['D2_90', 'Y', 2, 0],
    ],
    traits: { 0: { colors: 'WY' }, 1: { colors: 'YW' } },
  });

  it('K-57 every cell must land on its own colour; the wrong twin bounces with reason color; the right order wins', () => {
    const s = v3(twoTone(['YW', 'WY']));
    const wrong = run(s, dragTo(1, 4, 3)); // "YW" onto the bottom row "WY"
    expect(find(wrong.ev, 'placementWrong').reasons).toEqual(['color']);
    expect(pieceZone(s, 1)).toBe(Zone.yard);
    expect(run(s, dragTo(0, 4, 3)).ev.some((e) => e.t === 'placementCorrect')).toBe(true);
    const last = run(s, dragTo(1, 4, 3));
    expect(find(last.ev, 'placementCorrect').pieceId).toBe(1);
    expect(last.res.won).toBe(true);
    expect(stateInvariantErrors(s)).toEqual([]);
  });

  it('K-57 K-47 supply counts cell colours; D3a (run time) and L-11 (validator) tile per cell', () => {
    const s = v3(twoTone(['YW', 'WY']));
    expect(s.lvl.supply.slice(0, 2)).toEqual([2, 2]);
    expect(remainingSupplyByColor(s).slice(0, 2)).toEqual([2, 2]);
    expect(tileRemaining(s)).toBe('ok');
    const dead = v3(twoTone(['WY', 'WY'])); // cover is balanced (W 2, Y 2) but "YW" fits no row
    expect(tileRemaining(dead)).toBe('dead');
    // L-11 on full-size data: the same twins under a 4-row plan whose only "YW" row is above "WY" rows
    const full: LevelSpec = {
      ...twoTone(['YW', 'WY', 'WY', 'WY']),
      pieces: [
        ['D2_90', 'W', 0, 0],
        ['D2_90', 'W', 2, 0],
        ['D2_90', 'W', 0, 1],
        ['D2_90', 'Y', 2, 1],
      ],
      traits: { 0: { colors: 'WY' }, 1: { colors: 'WY' }, 2: { colors: 'WY' }, 3: { colors: 'YW' } },
    };
    expect(codes(full)).not.toContain('untileable');
    expect(codes({ ...full, plan: ['WY', 'YW', 'WY', 'WY'] })).not.toContain('untileable');
    // one "YW" block for four "WY" rows: colours balance per cell (W 4, Y 4), the tiling does not
    expect(codes({ ...full, plan: ['WY', 'WY', 'WY', 'WY'] })).not.toContain('cover_mismatch');
    expect(codes({ ...full, plan: ['WY', 'WY', 'WY', 'WY'] })).toContain('untileable');
    // two "YW" twins for a plan with one "YW" row: colours balance (W 4, Y 4) but no tiling exists
    const twins = {
      ...full,
      pieces: full.pieces?.map((p, i) => (i === 2 ? (['D2_90', 'Y', 0, 1] as const) : p)),
      traits: { ...full.traits, 2: { colors: 'YW' } },
    };
    expect(codes(twins)).not.toContain('cover_mismatch');
    expect(codes(twins)).toContain('untileable');
  });

  it('K-57 colors_invalid: wrong length, one colour, or `color` not the first cell colour', () => {
    const base = twoTone(['YW', 'WY', 'YW', 'WY']);
    expect(codes({ ...base, traits: { 0: { colors: 'WYW' }, 1: { colors: 'YW' } } })).toContain(
      'colors_invalid',
    );
    expect(codes({ ...base, traits: { 0: { colors: 'WW' }, 1: { colors: 'YW' } } })).toContain(
      'colors_invalid',
    );
    expect(codes({ ...base, traits: { 0: { colors: 'YW' }, 1: { colors: 'YW' } } })).toContain(
      'colors_invalid',
    );
  });

  it('K-57 K-66 the brush cannot pick a two-tone block; the crane does not turn it', () => {
    const s = v3(twoTone(['YW', 'WY']));
    const hooks = levelHooks(s.lvl);
    expect(paintSelectable(s, 0)).toBe(false);
    expect(craneSelectable(s, 0, hooks)).toBe(true);
    // D2_90 "WY" turned to D2_0 (rotation 0) would need a rotated colour table: refused; its own orientation is fine
    expect(
      craneRejection(s, { kind: 'crane', pieceId: 0, to: { zone: 'site', x: 4, y: 0 }, rotation: 0 }, hooks),
    ).toBe('badRotation');
    expect(
      craneRejection(s, { kind: 'crane', pieceId: 0, to: { zone: 'site', x: 4, y: 0 }, rotation: 90 }, hooks),
    ).toBeNull();
    expect(
      craneRejection(s, { kind: 'crane', pieceId: 1, to: { zone: 'site', x: 4, y: 0 }, rotation: 90 }, hooks),
    ).toBe('notCorrect');
  });

  it('K-57 ASCII prints each two-tone cell in its own colour', () => {
    const s = v3(twoTone(['YW', 'WY']));
    expect(toAscii(s)).toContain(' 0  w y y w');
  });
});

describe('K-58 pallet (Y10)', () => {
  const pallet = (extra: Partial<LevelSpec> = {}): LevelSpec => ({
    id: 3,
    yard: YARD,
    site: SITE,
    plan: ['GG', 'GG', 'WW', 'WW'],
    pieces: [
      ['D2_90', 'W', 0, 0],
      ['D2_90', 'W', 0, 0],
      ['D2_90', 'G', 2, 0],
      ['D2_90', 'G', 2, 1],
    ],
    traits: { 0: { stack: { id: 0, z: 0 } }, 1: { stack: { id: 0, z: 1 } } },
    ...extra,
  });

  it('K-58 only the top layer can be held (covered, no move); the pallet cells stay full; a lifted layer never returns', () => {
    const s = v3(pallet());
    expect(stateInvariantErrors(s)).toEqual([]);
    expect(isCovered(s, 0)).toBe(true);
    expect(yardOcc(s, 0, 0)).toBe(2); // the top layer (id 1) owns the cells
    const attempt = tryBeginDrag(s, 0);
    expect(attempt.ok ? 'ok' : attempt.reason).toBe('covered');
    // the held top layer: D-106 (K-58 item 10) frees its own pallet's cells for it, but the G block at (2,0) still
    // blocks the slide right (every other block collides; tests/core/palletD106.test.ts)
    const session = beginDrag(s, 1);
    expect(session?.isReachable({ ix: 0, iy: 1, mode: 0 })).toBe(true);
    expect(session?.isReachable({ ix: 1, iy: 0, mode: 0 })).toBe(false);
    expect(session?.classify({ ix: 0, iy: 0, mode: 0 })).toMatchObject({
      kind: 'cancel',
      reason: 'sameSpot',
    });
    const placed = run(s, dragTo(1, 4, 3));
    expect(find(placed.ev, 'placementCorrect').pieceId).toBe(1);
    expect(yardOcc(s, 0, 0)).toBe(1); // the layer below took the cells
    expect(isCovered(s, 0)).toBe(false);
    expect(tryBeginDrag(s, 0).ok).toBe(true);
    expect(stateInvariantErrors(s)).toEqual([]);
  });

  it('K-58 item 6 Undo puts the layer back on its pallet (core buffer); the pallet layers never cancel in the hash', () => {
    const session = GameSession.start(compile(validateLevelJson(json(pallet()), { only: [] }).level!));
    const before = toAscii(session.state, { ids: true });
    session.commit(dragTo(1, 4, 3));
    expect(isCovered(session.state, 0)).toBe(false);
    expect(session.undo()).toBe(true);
    expect(isCovered(session.state, 0)).toBe(true);
    expect(toAscii(session.state, { ids: true })).toBe(before);
    const s = session.state;
    expect(pieceClassExtra(s.lvl, 0, Zone.yard, 0, 0)).not.toBe(pieceClassExtra(s.lvl, 1, Zone.yard, 0, 0));
    expect(pieceClassExtra(s.lvl, 1, Zone.yard, 2, 2)).toBe(0); // away from its pallet: an ordinary block
  });

  it('K-58 ASCII round trip of a pallet (ids mode `traits:` line)', () => {
    const s = v3(pallet());
    const text = toAscii(s, { ids: true });
    expect(text).toContain('traits: pallet:0,1@(0,0)');
    expect(toAscii(fromAscii(s.lvl, text), { ids: true })).toBe(text);
    expect(toAscii(s)).toContain('traits: pallet@(0,0)x2');
  });

  it('K-58 K-02 footprint: the validator claims a pallet once (no overlap); stack_invalid on gaps in z or a moved layer', () => {
    expect(codes(pallet())).not.toContain('overlap');
    expect(
      codes(pallet({ traits: { 0: { stack: { id: 0, z: 0 } }, 1: { stack: { id: 0, z: 2 } } } })),
    ).toContain('stack_invalid');
    const moved = pallet({
      pieces: [
        ['D2_90', 'W', 0, 0],
        ['D2_90', 'W', 0, 1],
        ['D2_90', 'G', 2, 0],
        ['D2_90', 'G', 2, 1],
      ],
    });
    expect(codes(moved)).toContain('stack_invalid');
  });

  it('K-58 item 8 retired (D-104): pallet_capacity is never raised; item 9 g pallet_not_grounded in story 1', () => {
    const crowded: LevelSpec = {
      id: 3,
      yard: { cols: 3, rows: 4 },
      site: SITE,
      plan: ['WW', 'WW', 'WW', 'GG'],
      pieces: [
        ['D2_90', 'W', 0, 0],
        ['D2_90', 'W', 0, 0],
        ['D2_90', 'W', 0, 0],
        ['D2_90', 'G', 0, 1],
        ['B1_0', 'W', 0, 2],
        ['B1_0', 'W', 1, 2],
        ['B1_0', 'W', 2, 0],
        ['B1_0', 'W', 2, 1],
      ],
      traits: { 0: { stack: { id: 0, z: 0 } }, 1: { stack: { id: 0, z: 1 } }, 2: { stack: { id: 0, z: 2 } } },
    };
    const issueCodes = (spec: LevelSpec): string[] => validateLevelJson(json(spec)).issues.map((i) => i.code);
    // C 12, footprint F 8, E 4 < 2 + 2 × (3 − 1) = 6 was an Easy error before D-104
    expect(issueCodes(crowded)).not.toContain('pallet_capacity');
    expect(issueCodes(crowded)).not.toContain('pallet_not_grounded');
    // the same pallet lifted one row (a G block under it): not on the ground in story 1
    const lifted: LevelSpec = {
      ...crowded,
      pieces: [
        ['D2_90', 'W', 0, 1],
        ['D2_90', 'W', 0, 1],
        ['D2_90', 'W', 0, 1],
        ['D2_90', 'G', 0, 0],
        ['B1_0', 'W', 0, 2],
        ['B1_0', 'W', 1, 2],
        ['B1_0', 'W', 2, 0],
        ['B1_0', 'W', 2, 1],
      ],
    };
    const hit = validateLevelJson(json(lifted)).issues.filter((i) => i.code === 'pallet_not_grounded');
    expect(hit.map((i) => [i.severity, i.check])).toEqual([['error', 'L-41']]);
    expect(issueCodes({ ...lifted, id: 11, chapter: 2 })).not.toContain('pallet_not_grounded');
  });
});

/** Level JSON of a v3 spec (schemaVersion 3, sizes written in). */
function json(spec: LevelSpec): LevelInput {
  return { ...levelJson({ ...spec, schemaVersion: 3 }), ...sized(spec) } as LevelInput;
}

describe('K-59 wrapped block and scissors (Y11)', () => {
  /** Plan bottom → top: WW WW GG YY; the scissors block is the G one, the Y block is wrapped. */
  const wrap = (extra: Partial<LevelSpec> = {}): LevelSpec => ({
    id: 7,
    yard: YARD,
    site: SITE,
    plan: ['YY', 'GG', 'WW', 'WW'],
    pieces: [
      ['D2_90', 'W', 0, 0],
      ['D2_90', 'W', 0, 1],
      ['D2_90', 'G', 2, 0, ['scissors']],
      ['D2_90', 'Y', 2, 2, ['wrapped']],
    ],
    ...extra,
  });

  it('K-59 a wrapped block cannot be held (K-09 c); a wrong placement of the scissors keeps every wrap (V3-3)', () => {
    const s = v3(wrap());
    const attempt = tryBeginDrag(s, 3, levelHooks(s.lvl).drag);
    expect(attempt.ok ? 'ok' : attempt.reason).toBe('rule');
    const wrong = run(s, dragTo(2, 4, 3)); // G onto the empty bottom row W
    expect(find(wrong.ev, 'placementWrong').reasons).toEqual(['color']);
    expect(hasFlag(s, 3, 'wrapped')).toBe(true);
    expect(types(wrong.ev)).not.toContain('unwrapped');
  });

  it('K-59 K-35 the correct placement of the scissors removes every wrap in step 5; Undo brings them back (V3-9)', () => {
    const session = GameSession.start(compile(validateLevelJson(json(wrap()), { only: [] }).level!));
    expect(session.commit(dragTo(1, 4, 3)).status).toBe('applied');
    expect(session.commit(dragTo(0, 4, 3)).status).toBe('applied');
    const ev: GameEvent[] = [];
    session.commit(dragTo(2, 4, 3), { push: (e) => ev.push(e) });
    const un = find(ev, 'unwrapped');
    expect(un).toMatchObject({ by: 'scissors', pieceId: 2, pieces: [3], step: 5 });
    expect(hasFlag(session.state, 3, 'wrapped')).toBe(false);
    expect(hasFlag(session.state, 2, 'scissors')).toBe(false);
    expect(tryBeginDrag(session.state, 3, session.hooks.drag).ok).toBe(true);
    expect(session.undo()).toBe(true);
    expect(hasFlag(session.state, 3, 'wrapped')).toBe(true);
    expect(hasFlag(session.state, 2, 'scissors')).toBe(true);
    session.commit(dragTo(2, 4, 3));
    expect(session.commit(dragTo(3, 4, 3)).won).toBe(true);
  });

  it('K-59 K-36 the hammer cuts one wrap (kind wrap), the block stays; the hammer never targets a scissors block', () => {
    const s = v3(wrap());
    const hooks = levelHooks(s.lvl);
    expect(hammerTargetKind(s, { pieceId: 3 }, hooks)).toBe('wrap');
    expect(hammerTargetKind(s, { pieceId: 2 }, hooks)).toBeNull();
    const hit = run(s, { kind: 'hammer', target: { pieceId: 3 } });
    expect(find(hit.ev, 'unwrapped')).toMatchObject({ by: 'hammer', pieces: [3] });
    expect(pieceZone(s, 3)).toBe(Zone.yard);
    expect(hasFlag(s, 3, 'wrapped')).toBe(false);
  });

  it('K-59 validator: scissors_missing, scissors_many, wrapped + scissors, scissors_trivial (warn), scissors_blocked', () => {
    const own = (c: string[]): string[] =>
      c.filter((x) => x.startsWith('scissors') || x === 'flag_combo_forbidden');
    expect(own(codes(wrap()))).toEqual([]); // the scissors G lies under the wrapped Y: one dig, fair
    const P = wrap().pieces ?? [];
    expect(
      codes(wrap({ pieces: [P[0], P[1], ['D2_90', 'G', 2, 0], P[3]] as LevelSpec['pieces'] })),
    ).toContain('scissors_missing');
    expect(
      codes(wrap({ pieces: [['D2_90', 'W', 0, 0, ['scissors']], P[1], P[2], P[3]] as LevelSpec['pieces'] })),
    ).toContain('scissors_many');
    expect(
      codes(
        wrap({
          pieces: [
            P[0],
            P[1],
            ['D2_90', 'G', 2, 0, ['scissors', 'wrapped']],
            ['D2_90', 'Y', 2, 2],
          ] as LevelSpec['pieces'],
        }),
      ),
    ).toContain('flag_combo_forbidden');
    // the scissors G needs the wrapped W row below it first (K-34) → the level has no fair start (V3-14)
    const blocked = wrap({
      pieces: [P[0], ['D2_90', 'W', 0, 1, ['wrapped']], P[2], ['D2_90', 'Y', 2, 2]] as LevelSpec['pieces'],
    });
    expect(codes(blocked)).toContain('scissors_blocked');
    // nothing above the scissors block: no order decision (warn)
    const trivial = wrap({
      pieces: [P[0], P[1], P[2], ['D2_90', 'Y', 0, 2, ['wrapped']]] as LevelSpec['pieces'],
    });
    const issue = validateLevelJson(json(trivial)).issues.find((i) => i.code === 'scissors_trivial');
    expect(issue?.severity).toBe('warn');
  });
});

describe('K-60 bonus block (Y12) and K-62 move budget', () => {
  const bonus = (plan: string[], moves: number): LevelSpec => ({
    id: 9,
    yard: YARD,
    site: SITE,
    moves,
    plan,
    pieces: [
      ['D2_90', 'W', 0, 0, ['bonus']],
      ['D2_90', 'W', 2, 0],
    ],
  });

  it('K-60 K-35 a correct placement adds bonusMoves in step 4 after the cost: a last move that hits 0 goes on (V3-5)', () => {
    const s = v3(bonus(['WW', 'WW'], 1));
    const r = run(s, dragTo(0, 4, 3));
    const changes = r.ev.filter(
      (e): e is Extract<GameEvent, { t: 'movesChanged' }> => e.t === 'movesChanged',
    );
    expect(changes.map((e) => [e.reason, e.delta, e.movesLeft, e.step])).toEqual([
      ['move', -1, 0, 4],
      ['bonus', 2, 2, 4],
    ]);
    expect(r.res.outOfMoves).toBe(false);
    expect(hdr(s, H.movesLeft)).toBe(2);
    expect(hasFlag(s, 0, 'bonus')).toBe(false);
  });

  it('K-60 a wrong placement gives nothing: the counter reaches 0 → out of moves', () => {
    const s = v3({
      ...bonus(['YY', 'WW'], 1),
      pieces: [
        ['D2_90', 'Y', 0, 0, ['bonus']],
        ['D2_90', 'W', 2, 0],
      ],
    });
    const r = run(s, dragTo(0, 4, 3));
    expect(types(r.ev)).toContain('placementWrong');
    expect(r.res.outOfMoves).toBe(true);
    expect(hasFlag(s, 0, 'bonus')).toBe(true);
  });

  it('K-60 bonusMoves 1–3 (default 2); bonus_many above 2; bonus + wet is flag_combo_forbidden (K-65 item 4)', () => {
    const s = v3({ ...bonus(['WW', 'WW'], 5), traits: { 0: { bonusMoves: 3 } } });
    run(s, dragTo(0, 4, 3));
    expect(hdr(s, H.movesLeft)).toBe(7);
    const many: LevelSpec = {
      ...bonus(['WW', 'WW', 'WW', 'WW'], 9),
      pieces: [
        ['D2_90', 'W', 0, 0, ['bonus']],
        ['D2_90', 'W', 2, 0, ['bonus']],
        ['D2_90', 'W', 0, 1, ['bonus']],
        ['D2_90', 'W', 2, 1],
      ],
    };
    expect(codes(many)).toContain('bonus_many');
    expect(
      codes({ ...bonus(['WW', 'WW', 'WW', 'WW'], 9), pieces: [['D2_90', 'W', 0, 0, ['bonus', 'wet'], 3]] }),
    ).toContain('flag_combo_forbidden');
    expect(codes({ ...bonus(['WW', 'WW', 'WW', 'WW'], 9), traits: { 1: { bonusMoves: 2 } } })).toContain(
      'bonus_invalid',
    );
  });

  it('K-60 K-33 a Golden Trowel placement of a bonus block also pays the bonus (mini pipeline step 4)', () => {
    const s = v3(bonus(['WW', 'WW'], 3));
    s.buf[H.trowels] = 1;
    const r = run(s, { kind: 'goldTrowel', pieceId: 0, x: 4, y: 0 });
    expect(find(r.ev, 'movesChanged')).toMatchObject({ reason: 'bonus', delta: 2, step: 4 });
    expect(hdr(s, H.movesLeft)).toBe(5);
  });

  it('K-62 story 1: k = 0, the bonus does not enter the move budget (the validator band is the v2 one)', () => {
    // the core only adds moves; the budget rule lives in the solver (movesBand reads min, difficulty, teaches)
    const s = v3(bonus(['WW', 'WW'], 4));
    expect(s.lvl.pieces[0]?.bonusMoves).toBe(2);
    expect(s.lvl.moves).toBe(4);
  });
});

describe('K-61 slippery block (Y13)', () => {
  const slip = (flags: readonly 'slippery'[]): LevelSpec => ({
    id: 13,
    yard: YARD,
    site: SITE,
    plan: ['GG', 'WW', 'WW', 'WW'],
    pieces: [
      ['D2_90', 'W', 0, 0, flags],
      ['D2_90', 'W', 2, 1],
      ['D2_90', 'W', 2, 0],
      ['D2_90', 'G', 0, 1],
    ],
  });

  it('K-61 K-35 a slippery block parked over a gap falls in step 6 even without yard gravity; a plain block stays', () => {
    const s = v3({
      ...slip(['slippery']),
      pieces: [
        ['D2_90', 'W', 0, 0, ['slippery']],
        ['D2_90', 'W', 2, 1],
      ],
    });
    expect(s.lvl.gravity.yard).toBe(false);
    const r = run(s, dragTo(0, 2, 3)); // (2,2)–(3,2) empty, (2,1)–(3,1) full
    expect(find(r.ev, 'pieceFell')).toMatchObject({ pieceId: 0, cause: 'yardGravity', step: 6, rows: 1 });
    expect(pieceY(s, 0)).toBe(2);
    const plain = v3({
      ...slip([]),
      pieces: [
        ['D2_90', 'W', 0, 0],
        ['D2_90', 'W', 2, 1],
      ],
    });
    run(plain, dragTo(0, 2, 3));
    expect(pieceY(plain, 0)).toBe(3);
    expect(stateInvariantErrors(s)).toEqual([]);
  });
});

describe('K-63 tiling families, K-65 story-1 readability, K-66 boosters, K-30 D1 widening', () => {
  it('K-63 tile_family_mix: one colour with two "bottom row full" kinds (C3_0 and D2_90) warns on Easy / Normal', () => {
    const spec: LevelSpec = {
      id: 4,
      difficulty: 'easy',
      yard: YARD,
      site: SITE,
      plan: ['WW', 'WW', 'GW', 'GG'],
      pieces: [
        ['C3_0', 'G', 0, 0],
        ['D2_90', 'W', 2, 0],
        ['D2_90', 'W', 2, 1],
        ['B1_0', 'W', 0, 2],
      ],
    };
    expect(codes(spec)).not.toContain('tile_family_mix');
    const mixed = {
      ...spec,
      plan: ['WW', 'GG', 'GW', 'GG'],
      pieces: [
        ...(spec.pieces ?? []).slice(0, 2),
        ['D2_90', 'G', 2, 1] as const,
        ['B1_0', 'W', 0, 2] as const,
      ],
    };
    const issue = validateLevelJson(json(mixed)).issues.find((i) => i.code === 'tile_family_mix');
    expect(issue?.severity).toBe('warn');
    expect(codes({ ...mixed, difficulty: 'hard' })).not.toContain('tile_family_mix');
  });

  it('K-65 story 1: stack_mixed, colors_low_contrast (W–R), trait_overlay_many (warn); story 2 accepts them', () => {
    const base: LevelSpec = {
      id: 9,
      yard: YARD,
      site: SITE,
      plan: ['WW', 'WW', 'YW', 'YW'],
      pieces: [
        ['D2_90', 'W', 0, 0],
        ['D2_90', 'W', 0, 0],
        ['D2_90', 'Y', 2, 0],
        ['D2_90', 'Y', 2, 1],
      ],
      traits: {
        0: { stack: { id: 0, z: 0 } },
        1: { stack: { id: 0, z: 1 } },
        2: { colors: 'YW' },
        3: { colors: 'YW' },
      },
    };
    expect(
      codes(base).filter((c) => c.startsWith('stack') || c.startsWith('colors') || c.startsWith('trait')),
    ).toEqual([]);
    const mixed = {
      ...base,
      pieces: [
        base.pieces?.[0],
        ['D2_90', 'W', 0, 0, ['bonus']],
        base.pieces?.[2],
        base.pieces?.[3],
      ] as LevelSpec['pieces'],
    };
    expect(codes(mixed)).toEqual(expect.arrayContaining(['stack_mixed', 'trait_overlay_many']));
    const red: LevelSpec = {
      ...base,
      plan: ['WW', 'WW', 'RW', 'RW'],
      pieces: [
        base.pieces?.[0],
        base.pieces?.[1],
        ['D2_90', 'R', 2, 0],
        ['D2_90', 'R', 2, 1],
      ] as LevelSpec['pieces'],
      traits: { ...base.traits, 2: { colors: 'RW' }, 3: { colors: 'RW' } },
    };
    expect(codes(red)).toContain('colors_low_contrast');
    expect(codes({ ...red, id: 11 })).not.toContain('colors_low_contrast');
    expect(codes({ ...mixed, id: 11 })).not.toContain('stack_mixed');
  });

  it('K-66 crane, Golden Trowel and hammer: a covered pallet layer and a wrapped block are no target; the brush skips a covered layer', () => {
    const s = v3({
      id: 7,
      yard: YARD,
      site: SITE,
      plan: ['YY', 'GG', 'WW', 'WW'],
      pieces: [
        ['D2_90', 'W', 0, 0],
        ['D2_90', 'W', 0, 0],
        ['D2_90', 'G', 2, 1, ['scissors']],
        ['D2_90', 'Y', 2, 2, ['wrapped']],
      ],
      traits: { 0: { stack: { id: 0, z: 0 } }, 1: { stack: { id: 0, z: 1 } } },
    });
    const hooks = levelHooks(s.lvl);
    expect(craneSelectable(s, 0, hooks)).toBe(false); // covered
    expect(craneSelectable(s, 1, hooks)).toBe(true); // top
    expect(craneSelectable(s, 3, hooks)).toBe(false); // wrapped
    expect(trowelSelectable(s, 0, hooks)).toBe(false);
    expect(trowelSelectable(s, 3, hooks)).toBe(false);
    expect(hammerTargetKind(s, { pieceId: 0 }, hooks)).toBeNull();
    expect(hammerTargetKind(s, { pieceId: 1 }, hooks)).toBeNull();
    expect(paintSelectable(s, 0)).toBe(false);
    expect(paintSelectable(s, 1)).toBe(true);
    expect(paintSelectable(s, 3)).toBe(true); // a wrapped block may be painted (colour visible, K-66 item 2)
    // K-58 item 9 (e), D-104: the crane has no yard target for a pallet layer (site only)
    expect(
      craneRejection(s, { kind: 'crane', pieceId: 1, to: { zone: 'yard', x: 1, y: 0 }, rotation: 90 }, hooks),
    ).toBe('palletSiteOnly');
    expect(
      craneRejection(s, { kind: 'crane', pieceId: 1, to: { zone: 'yard', x: 0, y: 1 }, rotation: 0 }, hooks),
    ).toBe('palletSiteOnly');
  });

  it('K-30 v3 D1 widening: blocks that can be held but whose only releases are cancels count as D1 (noMoves)', () => {
    // a full 3 × 4 yard under a wall above the crane rows: a block can only rise into the crane area (K-07 row 3 cancel)
    const spec: LevelSpec = {
      id: 3,
      yard: { cols: 3, rows: 4 },
      site: SITE,
      wall: { height: 6 },
      plan: ['WW', 'WW', 'WW', 'WW'],
      pieces: [
        ['I3_0', 'W', 0, 0],
        ['I3_0', 'W', 1, 0],
        ['I3_0', 'W', 2, 0],
        ['D2_90', 'W', 0, 3],
        ['B1_0', 'W', 2, 3],
      ],
    };
    const s = v3(spec);
    const hooks = levelHooks(s.lvl);
    const top = beginDrag(s, 3, hooks.drag);
    expect(top).not.toBeNull(); // K-09 (a): it can be held …
    expect(top?.reachableNodes().every((n) => top.classify(n).kind === 'cancel')).toBe(true); // … but never released
    expect(noMoves(s, hooks.drag)).toBe(true);
    expect(RULES_VERSION).toBeGreaterThanOrEqual(5);
    // one empty yard cell: the B1 can step into it → a real release, no D1
    const room = v3({ ...spec, pieces: spec.pieces?.slice(0, 4) });
    expect(noMoves(room, levelHooks(room.lvl).drag)).toBe(false);
  });
});
