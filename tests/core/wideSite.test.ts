/**
 * Levels v3c core rules (docs/GDD.md K-49 D-103 wide site, K-56 D-103 annex, K-58 item 9 D-104 pallet layers on the site
 * only, K-17 pallet exception, K-60 items 6–7 / K-62 D-105 bonus reward, K-63 D-103 annex `plan_trap`; LEVELS §8.13.8
 * U-v3c-1…6). Every test name carries its rule id.
 */
import { describe, expect, it } from 'vitest';
import { compile } from '../../src/core/level/compile.ts';
import { planTrapScan, validateLevelJson } from '../../src/core/level/logic.ts';
import { buildPlans } from '../../src/core/level/plan.ts';
import type { LevelInput } from '../../src/core/level/schema.ts';
import { GameSession, RULES_VERSION } from '../../src/core/session.ts';
import { H, createInitialState, hdr, pieceX, pieceY, pieceZone, yardOcc } from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import { Zone } from '../../src/core/types.ts';
import { isCovered, stateInvariantErrors } from '../../src/core/grid.ts';
import { beginDrag, isPalletLayer } from '../../src/core/movement.ts';
import { nearestColumnsFirst } from '../../src/core/placement.ts';
import { levelHooks } from '../../src/core/obstacles/registry.ts';
import { craneRejection } from '../../src/core/boosters.ts';
import { tileRemaining } from '../../src/core/deadlock.ts';
import { fromAscii, toAscii } from '../../src/core/ascii.ts';
import { hashHex, hashState } from '../../src/core/hash.ts';
import { makeGeo } from '../../src/core/geometry.ts';
import { shapeById } from '../../src/core/shapes.ts';
import { levelJson } from '../fixtures/builders.ts';
import type { LevelSpec } from '../fixtures/builders.ts';
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
function codes(spec: LevelSpec): string[] {
  return validateLevelJson(json(spec)).issues.map((i) => i.code);
}

const WIDE_YARD = { cols: 6, rows: 4 } as const;
const WIDE_SITE = { cols: 3, rows: 5 } as const;

describe('K-49 D-103 wide site (3 columns, 9-column board)', () => {
  it('K-44 K-49 3-wide material crosses the wall: L4_270 W flies over a height-5 wall onto a 3-column site', () => {
    const s = v3({
      id: 6,
      yard: WIDE_YARD,
      site: WIDE_SITE,
      wall: { height: 5 },
      plan: ['GGG', 'GGG', 'GGG', 'YYW', 'WWW'],
      pieces: [['L4_270', 'W', 0, 0]],
    });
    expect([s.lvl.geo.cols, s.lvl.geo.siteX, s.lvl.geo.h]).toEqual([9, 6, 5]);
    const d = beginDrag(s, 0);
    expect(d?.reachableNodes().some((n) => n.ix >= 6)).toBe(true);
    const { ev } = run(s, dragTo(0, 6, 5));
    expect(find(ev, 'placementCorrect').overWall).toBe(true);
    expect(find(ev, 'placementCorrect').cells.map((c) => `${c.x},${c.y}`)).toEqual([
      '6,0',
      '7,0',
      '8,0',
      '8,1',
    ]);
    expect(stateInvariantErrors(s)).toEqual([]);
  });

  it('K-49 K-56 the GDD T4_90 example: correct on heights (2, 1, 2); on (1, 1, 1) it lands on the middle column and fails support', () => {
    const spec: LevelSpec = {
      id: 6,
      yard: WIDE_YARD,
      site: WIDE_SITE,
      wall: { height: 4 },
      plan: ['GGG', 'GGG', 'YYY', 'WYW', 'WWW'],
      pieces: [
        ['I3_90', 'W', 0, 0],
        ['B1_0', 'W', 3, 0],
        ['B1_0', 'W', 4, 0],
        ['T4_90', 'Y', 3, 2],
      ],
    };
    const s = v3(spec);
    run(s, dragTo(0, 6, 6));
    run(s, dragTo(1, 6, 6));
    run(s, dragTo(2, 8, 6));
    const { ev } = run(s, dragTo(3, 6, 5));
    expect(find(ev, 'placementCorrect').cells.map((c) => `${c.x},${c.y}`)).toEqual([
      '7,1',
      '6,2',
      '7,2',
      '8,2',
    ]);
    const t = v3(spec);
    run(t, dragTo(0, 6, 6));
    const wrong = run(t, dragTo(3, 6, 5));
    expect(find(wrong.ev, 'placementWrong').reasons).toEqual(['support']);
    expect(find(wrong.ev, 'pieceBounced').to).toEqual({ zone: 'yard', x: 3, y: 2 }); // K-17 step 1: its start
  });

  it('K-17 K-56 bounce-back columns of a 3-wide block: xs = 0 … Wy − 3, nearest the wall first for a site start', () => {
    const g = makeGeo({ wy: 6, hy: 8, ws: 3, hs: 5, eMax: 0 });
    expect(nearestColumnsFirst(g, 8, 3)).toEqual([3, 2, 1, 0]);
    expect(nearestColumnsFirst(g, 1, 3)).toEqual([1, 2, 0, 3]);
  });

  it('K-49 K-56 P5 (plus) on a 9-column board: ASCII round trip, hash stable, D3a tiles the 3-wide plan', () => {
    const s = v3({
      id: 6,
      yard: WIDE_YARD,
      site: { cols: 3, rows: 4 },
      wall: { height: 1 },
      plan: ['YYY', 'WRW', 'RRR', 'WRW'],
      pieces: [
        ['P5_0', 'R', 0, 0],
        ['B1_0', 'W', 3, 0],
        ['B1_0', 'W', 4, 0],
        ['B1_0', 'W', 5, 0],
        ['B1_0', 'W', 3, 1],
        ['I3_90', 'Y', 3, 2],
      ],
    });
    const text = toAscii(s, { ids: true });
    expect(toAscii(fromAscii(s.lvl, text), { ids: true })).toBe(text);
    expect(hashHex(fromAscii(s.lvl, text))).toBe(hashHex(s));
    expect(hashState(s)).toHaveLength(2);
    expect(tileRemaining(s)).toBe('ok');
    expect(shapeById('P5_270').canonical).toBe('P5_0');
  });

  it('K-49 item 2 and K-56 D-103 annex: levels 1–5 stay 2 columns; on Ws = 3 S4, Z4 and P5 are free of the kind lock, T4 / I3 keep theirs', () => {
    const one = (id: number, ws: number, shape: Parameters<typeof shapeById>[0]): string[] =>
      codes({
        id,
        yard: WIDE_YARD,
        site: { cols: ws, rows: 4 },
        plan: ws === 3 ? ['WWW', 'WWW', 'WWW', 'WWW'] : ['WW', 'WW', 'WW', 'WW'],
        pieces: [[shape, 'W', 0, 0]],
      });
    expect(one(3, 3, 'B1_0')).toContain('size_out_of_range');
    expect(one(6, 3, 'P5_0')).not.toContain('shape_locked');
    expect(one(6, 3, 'S4_90')).not.toContain('shape_locked');
    expect(one(6, 3, 'Z4_0')).not.toContain('shape_locked');
    expect(one(6, 2, 'S4_0')).toContain('shape_locked');
    expect(one(6, 2, 'P5_0')).toContain('piece_too_wide');
    expect(one(7, 3, 'I3_90')).toContain('shape_locked'); // I3 opens at level 8
    expect(one(6, 3, 'L4_90')).not.toContain('piece_too_wide');
  });

  it('K-49 RULES_VERSION 5 (D-103…D-105 change the replay of saved logs)', () => {
    expect(RULES_VERSION).toBe(5);
  });
});

describe('K-58 item 9 D-104 pallet layers go to the site only (K-17 exception)', () => {
  const pallet: LevelSpec = {
    id: 7,
    yard: { cols: 4, rows: 4 },
    site: { cols: 2, rows: 4 },
    wall: { height: 2 },
    plan: ['GG', 'WW', 'WW', 'WW'],
    pieces: [
      ['D2_90', 'W', 0, 0],
      ['D2_90', 'W', 0, 0],
      ['D2_90', 'W', 0, 0],
      ['D2_90', 'G', 2, 0],
    ],
    traits: { 0: { stack: { id: 0, z: 0 } }, 1: { stack: { id: 0, z: 1 } }, 2: { stack: { id: 0, z: 2 } } },
  };

  it('K-58 item 9 (c) a release in the yard, the yard air or the crane area over the yard cancels with palletSiteOnly, cost 0', () => {
    const s = v3(pallet);
    expect(isPalletLayer(s, 2)).toBe(true);
    expect(isPalletLayer(s, 3)).toBe(false);
    const d = beginDrag(s, 2);
    expect(d?.palletLayer).toBe(true);
    // no yard drop at all for a layer: every node over the yard is a cancel
    for (const n of d?.reachableNodes() ?? [])
      if (n.ix + 1 <= s.lvl.geo.boundaryX) expect(d?.classify(n).kind, `${n.ix},${n.iy}`).toBe('cancel');
    const left = hdr(s, H.movesLeft);
    for (const [x, y] of [
      [2, 2],
      [0, 5],
    ] as const) {
      const { res, ev } = run(s, dragTo(2, x, y));
      expect(res.status).toBe('cancelled');
      expect(types(ev)).toEqual(['moveCancelled']);
      expect(find(ev, 'moveCancelled').reason).toBe('palletSiteOnly');
    }
    expect(hdr(s, H.movesLeft)).toBe(left);
    expect([isCovered(s, 0), isCovered(s, 1), isCovered(s, 2)]).toEqual([true, true, false]);
    // an ordinary block still parks in the yard
    expect(run(s, dragTo(3, 2, 2)).res.status).toBe('applied');
  });

  it('K-58 item 9 (b) K-17 a wrong site drop costs 1, resets the streak and bounces the layer back onto its own pallet as the top layer', () => {
    const s = v3({ ...pallet, plan: ['WW', 'WW', 'GG', 'WW'] });
    run(s, dragTo(2, 4, 4)); // correct: bottom row W
    expect(hdr(s, H.combo)).toBe(1);
    const left = hdr(s, H.movesLeft);
    const { ev } = run(s, dragTo(1, 4, 4)); // lands on row 1 (G): wrong colour
    expect(find(ev, 'placementWrong').reasons).toEqual(['color']);
    const bounced = find(ev, 'pieceBounced');
    expect(bounced.to).toEqual({ zone: 'yard', x: 0, y: 0 });
    expect(bounced.viaDrop).toBe(false);
    expect(hdr(s, H.movesLeft)).toBe(left - 1);
    expect(hdr(s, H.combo)).toBe(0);
    expect([pieceZone(s, 1), pieceX(s, 1), pieceY(s, 1)]).toEqual([Zone.yard, 0, 0]);
    expect(isCovered(s, 0)).toBe(true);
    expect(isCovered(s, 1)).toBe(false);
    expect(yardOcc(s, 0, 0)).toBe(2); // layer 1 owns the pallet cells again
    expect(stateInvariantErrors(s)).toEqual([]);
  });

  it('K-58 item 9 (a) (h) correct drops empty the pallet; the last layer frees its footprint; Undo puts it back', () => {
    const session = GameSession.start(compile(validateLevelJson(json(pallet), { only: [] }).level!));
    session.commit(dragTo(2, 4, 4));
    session.commit(dragTo(1, 4, 4));
    expect(yardOcc(session.state, 0, 0)).toBe(1);
    session.commit(dragTo(0, 4, 4));
    expect([yardOcc(session.state, 0, 0), yardOcc(session.state, 1, 0)]).toEqual([0, 0]);
    expect(session.undo()).toBe(true);
    expect(yardOcc(session.state, 0, 0)).toBe(1);
    expect(isPalletLayer(session.state, 0)).toBe(true);
  });

  it('K-58 item 9 (e) the crane has no yard target for a pallet layer; a correct site target is allowed', () => {
    const s = v3(pallet);
    const hooks = levelHooks(s.lvl);
    expect(
      craneRejection(s, { kind: 'crane', pieceId: 2, to: { zone: 'yard', x: 2, y: 2 }, rotation: 0 }, hooks),
    ).toBe('palletSiteOnly');
    expect(
      craneRejection(s, { kind: 'crane', pieceId: 2, to: { zone: 'site', x: 4, y: 0 }, rotation: 90 }, hooks),
    ).toBeNull();
    expect(
      craneRejection(s, { kind: 'crane', pieceId: 3, to: { zone: 'yard', x: 2, y: 2 }, rotation: 90 }, hooks),
    ).toBeNull();
  });

  it('K-58 item 9 (f) a pallet layer cannot be slippery, mortar or glass (flag_combo_forbidden)', () => {
    for (const flag of ['slippery', 'mortar', 'glass'] as const) {
      const spec: LevelSpec = {
        ...pallet,
        pieces: [
          ['D2_90', 'W', 0, 0, [flag]],
          ['D2_90', 'W', 0, 0],
          ['D2_90', 'W', 0, 0],
          ['D2_90', 'G', 2, 0],
        ],
      };
      expect(codes(spec), flag).toContain('flag_combo_forbidden');
    }
  });
});

describe('K-60 K-62 D-105 bonus block is a reward moment', () => {
  const spec: LevelSpec = {
    id: 7,
    yard: { cols: 4, rows: 4 },
    site: { cols: 2, rows: 4 },
    moves: 3,
    plan: ['GG', 'GG', 'WW', 'WW'],
    pieces: [
      ['D2_90', 'W', 0, 0, ['bonus']],
      ['D2_90', 'W', 2, 0],
    ],
    traits: { 0: { bonusMoves: 2 } },
  };

  it('K-60 item 7 K-62 a correct bonus placement emits movesChanged{reason: bonus, delta, pieceId} after the cost', () => {
    const s = v3(spec);
    const { ev } = run(s, dragTo(0, 4, 4));
    const changes = ev.filter((e) => e.t === 'movesChanged');
    expect(changes.map((e) => [e.reason, e.delta, e.movesLeft])).toEqual([
      ['move', -1, 2],
      ['bonus', 2, 4],
    ]);
    expect(changes[1]?.pieceId).toBe(0);
    expect(hdr(s, H.movesLeft)).toBe(4);
  });

  it('K-60 item 7 K-62 the crane placement of a bonus block pays the bonus too; a wrong drop pays nothing', () => {
    const s = v3(spec);
    const crane = run(s, { kind: 'crane', pieceId: 0, to: { zone: 'site', x: 4, y: 0 }, rotation: 90 });
    const bonus = crane.ev.find((e) => e.t === 'movesChanged' && e.reason === 'bonus');
    expect(bonus).toMatchObject({ delta: 2, pieceId: 0, movesLeft: 5 });
    const t = v3({ ...spec, plan: ['WW', 'WW', 'GG', 'GG'] });
    const wrong = run(t, dragTo(0, 4, 4));
    expect(wrong.ev.filter((e) => e.t === 'movesChanged').map((e) => e.reason)).toEqual(['move']);
  });

  it('K-62 bonus_late is retired: a bonus block placed last raises no budget code', () => {
    expect(codes(spec)).not.toContain('bonus_late');
  });
});

describe('K-63 D-103 annex plan-level trap scan (plan_trap)', () => {
  const trap: LevelSpec = {
    id: 6,
    yard: { cols: 6, rows: 4 },
    site: { cols: 3, rows: 4 },
    wall: { height: 2 },
    plan: ['YYY', 'YYY', 'WWW', 'WWW'],
    pieces: [
      ['L4_270', 'W', 0, 0],
      ['D2_90', 'W', 3, 0],
      ['I3_90', 'Y', 0, 2],
      ['I3_90', 'Y', 3, 1],
    ],
  };
  const fixed: LevelSpec = {
    ...trap,
    plan: ['YYY', 'YYY', 'YWW', 'WWW'],
    traits: { 1: { colors: 'YW' } },
    pieces: [
      ['L4_270', 'W', 0, 0],
      ['D2_90', 'Y', 3, 0],
      ['I3_90', 'Y', 0, 2],
      ['I3_90', 'Y', 3, 1],
    ],
  };
  const scan = (spec: LevelSpec): ReturnType<typeof planTrapScan> => {
    const level = validateLevelJson(json(spec), { only: [] }).level!;
    return planTrapScan(level, buildPlans(level).plans);
  };

  it('K-63 GDD example: D2_90 W first leaves cells only J4_270 / L4_90 could tile → 2 traps; the two-tone fix has 0', () => {
    const t = scan(trap);
    expect([t.status, t.tileable, t.traps]).toEqual(['done', true, 2]);
    expect(t.example).toMatchObject({ seg: 0, shape: 'D2_90', y: 0 });
    const f = scan(fixed);
    expect([f.status, f.tileable, f.traps]).toEqual(['done', true, 0]);
  });

  it('K-63 plan_trap is an error in levels 1–10 and on Easy / Normal, a warning on Hard later; tile_family_mix is not raised on Ws = 3', () => {
    const sev = (spec: LevelSpec): string[] =>
      validateLevelJson(json(spec))
        .issues.filter((i) => i.code === 'plan_trap')
        .map((i) => i.severity);
    expect(sev(trap)).toEqual(['error']);
    expect(sev({ ...trap, id: 12, difficulty: 'hard' })).toEqual(['warn']);
    expect(sev({ ...trap, id: 12, difficulty: 'normal' })).toEqual(['error']);
    expect(sev(fixed)).toEqual([]);
    expect(codes(trap)).not.toContain('tile_family_mix');
  });
});
