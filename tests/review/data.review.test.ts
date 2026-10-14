/**
 * Independent rule review, rounds 1–3 (reviewer, not the author). Round 3 (last section) checks the K-05 box-height
 * rule the round-2 movement fix touched from the validator side (L-10 supply / `canReachSite` ↔ drag engine site nodes
 * for every shape × wall height × gap, LEVELS solution steps), runs TECH L-11 against an independent bottom-up
 * exact-cover oracle (K-11, K-12, K-16, K-34, K-05, Y5) on seeded random levels plus a K-34 order example and a W6
 * paint route, and adds debris (K-27 supply, K-31 colours, `.` cells), the K-32 worked examples, the K-02 39/48
 * boundary, debris shape locks and the LEVELS §0 tables / §2 block roles. Round 2 adds the section before it:
 * the whole-block material check that the round-1 fix touched (TECH L-10 / GDD K-27: cumulative per segment, carousel
 * total only, paint gate fit, heavy blocks, two gate colours, resolved `?` demand, an independent per-colour oracle on
 * mutated levels 1–5) and gaps of round 1 (K-45/9 GDD example, `?` rules, batch 0, L-17 carousel/filter rules, schema
 * limits of K-45/2, K-45/3, K-45/6, heavy debris).
 *
 * WP-M (Faz 2R, 2026-10-08): the suites were re-derived for the Faz 2R rules and data — full cover K-47 (`cover_mismatch`,
 * `cover_prefix_short`, debris is supply, Ağır Yük is not), K-49 sizes, K-02 band `2 ≤ E ≤ ⌊0,4·C⌋`, Ağır Yük = I5/Q9
 * with `piece_too_wide`, `plan_size` / no `.`, the light tutorial (no required step, no `timeoutMs`), the Faz 2R
 * signature table — and the LEVELS §2 ↔ JSON reviews read the Faz 2R records of levels 1–10 (block table, start
 * blockout, header rows, truck batch, tutorial list, canonical solution ↔ solver golden ↔ core replay; end of file).
 * Tests of rules that left the GDD (window cells, the access-search L-11, reachability as supply, per-gate paint fit)
 * were removed with a note at their place.
 *
 * Round 1: level data rules against docs/GDD.md K-01, K-31, K-44,
 * K-45 (items 1–7 and 9 = TECH_DESIGN §8.3 checks L-01…L-18, L-21…L-26, incl. L-09 and L-17), the level files
 * levels/level_001…005.json against docs/LEVELS.md §0/§2 (the Markdown is read and parsed at test time) and the golden
 * replays against the LEVELS §2 solution text. Every expectation comes from the GDD / OBSTACLES / TECH / LEVELS text and
 * worked examples, not from the implementation. Only public APIs are used: core/shapes, core/coords,
 * core/level/{logic, compile, mechanics}, core/session (+ moves, movement, state helpers), the fixture builders and
 * tools/lib/levels (i18n keys, economy unlock levels).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DEFAULT_GEO } from '../../src/core/geometry.ts';
import { inGrid, isCraneCell, isSiteCell, isYardCell, onBoard } from '../../src/core/coords.ts';
import { SHAPES, shapeById } from '../../src/core/shapes.ts';
import {
  canReachSite,
  checkLevel,
  levelColorSet,
  materialShortfall,
  validateLevelJson,
} from '../../src/core/level/logic.ts';
import type { CheckId, Issue, LogicContext } from '../../src/core/level/logic.ts';
import { compile, loadLevel } from '../../src/core/level/compile.ts';
import { deriveMechanics, isCargo } from '../../src/core/level/mechanics.ts';
import type { LevelInput, MechanicId } from '../../src/core/level/schema.ts';
import { GameSession } from '../../src/core/session.ts';
import { ArraySink, applyMove } from '../../src/core/moves.ts';
import { tryBeginDrag } from '../../src/core/movement.ts';
import { cloneState, createInitialState, pieceX, pieceY, pieceZone, queueIds } from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import { pieceBoardCells } from '../../src/core/grid.ts';
import { COLOR_CODES, SHAPE_KINDS, Zone } from '../../src/core/types.ts';
import type { ColorCode, GameEvent, Move, PieceId, ShapeId, ShapeKind } from '../../src/core/types.ts';
import { level, levelJson } from '../fixtures/builders.ts';
import type { LevelSpec, PieceSpec } from '../fixtures/builders.ts';
import { loadBoosterUnlock, loadI18nKeys } from '../../tools/lib/levels.ts';

// --- helpers -----------------------------------------------------------------------------------------------------------

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const pad = (n: number): string => String(n).padStart(3, '0');

function readLevelJson(n: number): LevelInput {
  return JSON.parse(readFileSync(join(ROOT, 'levels', `level_${pad(n)}.json`), 'utf8')) as LevelInput;
}

const codes = (list: readonly Issue[]): string[] => [...new Set(list.map((i) => i.code))].sort();
const errorCodes = (list: readonly Issue[]): string[] => codes(list.filter((i) => i.severity === 'error'));

/** Logic checks `only` on a schema-valid builder level. */
function run(spec: LevelSpec, only: readonly CheckId[], ctx: LogicContext = {}): Issue[] {
  return checkLevel(level(spec), { ...ctx, only });
}
/** Schema + logic checks on raw JSON. */
function runJson(json: unknown, only?: readonly CheckId[], ctx: LogicContext = {}): Issue[] {
  return validateLevelJson(json, only ? { ...ctx, only } : ctx).issues;
}

function batchOf(json: LevelInput, k: number): LevelInput['yard']['batches'][number] {
  const b = json.yard.batches[k];
  if (!b) throw new Error(`no batch ${k}`);
  return b;
}

type Step = NonNullable<LevelInput['tutorial']>[number];
function withTutorial(n: number, steps: readonly Step[]): LevelInput {
  return { ...readLevelJson(n), tutorial: [...steps] };
}
const soft = (highlight: string[], done: Step['done'], extra: Partial<Step> = {}): Step => ({
  step: 1,
  mode: 'soft',
  highlight,
  textKey: 'tut.m.lift',
  done,
  ...extra,
});

/** B1 W bricks on the first `n` yard cells (row-major from (0,0)), skipping `skip`. */
function bricks(n: number, skip: readonly string[] = []): PieceSpec[] {
  const out: PieceSpec[] = [];
  for (let y = 0; y < 8 && out.length < n; y++)
    for (let x = 0; x < 6 && out.length < n; x++)
      if (!skip.includes(`${x},${y}`)) out.push(['B1_0', 'W', x, y]);
  return out;
}

/** B1 W bricks on the first `n` cells (row-major from (0,0)) of a yard `cols` wide. */
function bricksIn(cols: number, n: number): PieceSpec[] {
  const out: PieceSpec[] = [];
  for (let y = 0; out.length < n; y++)
    for (let x = 0; x < cols && out.length < n; x++) out.push(['B1_0', 'W', x, y]);
  return out;
}

const cellKey = (x: number, y: number): string => `${x},${y}`;
function cellsOf(shape: ShapeId, x: number, y: number): string[] {
  return shapeById(shape)
    .cells.map((c) => cellKey(x + c.x, y + c.y))
    .sort();
}

// --- LEVELS.md (docs/LEVELS.md §0–§2, Faz 2R); the parser of the §2 records is at the end of the file ------------------

const LEVELS_MD = readFileSync(join(ROOT, 'docs', 'LEVELS.md'), 'utf8');

/** Faz 2R vertical slice (EN-2R-17): levels/level_001…010.json. */
const LEVEL_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

// =====================================================================================================================
// K-01 board, K-44 shapes
// =====================================================================================================================

describe('review K-01 board and K-44 shapes', () => {
  it('K-01 GDD example: D2_0 anchored at (3,8) is (3,8),(3,9); anchored at (3,9) it reaches (3,10), which does not exist', () => {
    expect(cellsOf('D2_0', 3, 8)).toEqual(['3,8', '3,9']);
    const ok = shapeById('D2_0').cells.map((c) => [3 + c.x, 8 + c.y] as const);
    expect(ok.every(([x, y]) => inGrid(DEFAULT_GEO, x, y))).toBe(true);
    const bad = shapeById('D2_0').cells.map((c) => [3 + c.x, 9 + c.y] as const);
    expect(bad).toContainEqual([3, 10]);
    expect(bad.every(([x, y]) => inGrid(DEFAULT_GEO, x, y))).toBe(false);
  });

  it('K-01 the 8 × 8 board plus crane rows y 8–9; nothing at x < 0, x > 7 or y > 9', () => {
    for (const [x, y, grid, board, crane] of [
      [0, 0, true, true, false],
      [7, 7, true, true, false],
      [7, 8, true, false, true],
      [0, 9, true, false, true],
      [3, 10, false, false, false],
      [-1, 0, false, false, false],
      [8, 0, false, false, false],
      [0, -1, false, false, false],
    ] as const) {
      expect(
        [inGrid(DEFAULT_GEO, x, y), onBoard(DEFAULT_GEO, x, y), isCraneCell(DEFAULT_GEO, x, y)],
        `(${x},${y})`,
      ).toEqual([grid, board, crane]);
    }
    // yard x 0–5 (K-02), site x 6–7 (K-03), both only on board rows
    expect([
      isYardCell(DEFAULT_GEO, 5, 7),
      isYardCell(DEFAULT_GEO, 6, 0),
      isYardCell(DEFAULT_GEO, 5, 8),
    ]).toEqual([true, false, false]);
    expect([
      isSiteCell(DEFAULT_GEO, 6, 0),
      isSiteCell(DEFAULT_GEO, 7, 7),
      isSiteCell(DEFAULT_GEO, 5, 0),
      isSiteCell(DEFAULT_GEO, 6, 8),
    ]).toEqual([true, true, false, false]);
  });

  it('K-44 GDD example: C3_90 cells (0,0)(0,1)(1,1), view "XX / X." (top row full, bottom row left only)', () => {
    const c = shapeById('C3_90');
    expect(c.cells.map((p) => cellKey(p.x, p.y)).sort()).toEqual(['0,0', '0,1', '1,1']);
    const view = [...c.rows]
      .reverse()
      .map((mask) => [0, 1].map((x) => ((mask >> x) & 1 ? 'X' : '.')).join(''));
    expect(view).toEqual(['XX', 'X.']);
  });

  it('K-44 every orientation is the clockwise 90° turn of BRIEF §5 0° cells, normalised to the bottom-left; heavy = w ≥ 3 or I5/Q9', () => {
    // BRIEF §5 table, typed here independently of src/core/shapes.ts.
    const BRIEF: Record<ShapeKind, [number, number][]> = {
      B1: [[0, 0]],
      D2: [
        [0, 0],
        [0, 1],
      ],
      I3: [
        [0, 0],
        [0, 1],
        [0, 2],
      ],
      I4: [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
      ],
      O4: [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      C3: [
        [0, 0],
        [1, 0],
        [0, 1],
      ],
      L4: [
        [0, 0],
        [1, 0],
        [0, 1],
        [0, 2],
      ],
      J4: [
        [0, 0],
        [1, 0],
        [1, 1],
        [1, 2],
      ],
      T4: [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 1],
      ],
      S4: [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 2],
      ],
      Z4: [
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 2],
      ],
      I5: [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
      ],
      Q9: [0, 1, 2].flatMap((y) => [0, 1, 2].map((x) => [x, y] as [number, number])),
    };
    const norm = (cells: [number, number][]): string[] => {
      const mx = Math.min(...cells.map((c) => c[0]));
      const my = Math.min(...cells.map((c) => c[1]));
      return cells.map(([x, y]) => cellKey(x - mx, y - my)).sort();
    };
    const cw = (cells: [number, number][]): [number, number][] => cells.map(([x, y]) => [y, -x]);
    for (const kind of SHAPE_KINDS) {
      let cells = BRIEF[kind];
      const seen: string[] = [];
      for (const deg of [0, 90, 180, 270] as const) {
        if (deg > 0) cells = cw(cells);
        const id = `${kind}_${deg}` as ShapeId;
        const s = shapeById(id);
        const mine = norm(cells);
        expect(s.cells.map((c) => cellKey(c.x, c.y)).sort(), id).toEqual(mine);
        const w = Math.max(...mine.map((k) => Number(k.split(',')[0]))) + 1;
        expect([s.w, s.heavy], `${id} width / heavy`).toEqual([w, w >= 3 || kind === 'I5' || kind === 'Q9']);
        // canonical = first orientation (0, 90, 180, 270) with the same cell set
        const firstSame = seen.indexOf(mine.join(';'));
        expect(s.canonical, `${id} canonical`).toBe(
          firstSame < 0 ? id : (`${kind}_${[0, 90, 180, 270][firstSame] ?? 0}` as ShapeId),
        );
        seen.push(mine.join(';'));
      }
    }
    expect(SHAPES.length).toBe(52);
  });

  // Faz 2R (WP-M): I3_270 is a 3-wide material orientation (K-44 `piece_too_wide` on Ws = 2), so the alias board is
  // 5 × 8 | 3 × 8 (Wy + Ws ≤ 8, K-49); Q9_270 is Ağır Yük (any orientation, no width rule)
  it('K-44 symmetric aliases are accepted in level data and compile to the canonical shape (O4_90, D2_180, D2_270, I3_270, Q9_270)', () => {
    const spec: LevelSpec = {
      id: 11,
      yard: { cols: 5 },
      site: { cols: 3 },
      plan: ['WWW'],
      pieces: [
        ['O4_90', 'W', 0, 0],
        ['D2_180', 'W', 2, 0],
        ['D2_270', 'W', 3, 0],
        ['I3_270', 'W', 0, 2],
        ['Q9_270', 'W', 2, 3],
      ],
    };
    expect(run(spec, ['L-02', 'L-04', 'L-21'])).toEqual([]);
    const lvl = compile(level(spec));
    const expected: [ShapeId, ShapeId][] = [
      ['O4_90', 'O4_0'],
      ['D2_180', 'D2_0'],
      ['D2_270', 'D2_90'],
      ['I3_270', 'I3_90'],
      ['Q9_270', 'Q9_0'],
    ];
    expected.forEach(([data, canon], i) => {
      const p = lvl.pieces[i];
      expect([p?.dataShape, p?.shapeIndex], data).toEqual([data, shapeById(canon).index]);
    });
  });
});

// =====================================================================================================================
// K-44 / K-45/5 shape lock, forbidden shapes, flag combinations
// =====================================================================================================================

describe('review K-44 K-45/5 shapes and flags in level data', () => {
  it('K-44 GDD example: I3_0 in level 5 is shape_locked (also when it only arrives by truck)', () => {
    const json = readLevelJson(5);
    batchOf(json, 1).pieces.push({ shape: 'I3_0', color: 'R', x: 0, y: 8 });
    const hit = runJson(json).filter((i) => i.code === 'shape_locked');
    expect(hit.map((i) => [i.rule, i.path])).toEqual([['K-45/5', 'yard.batches[1].pieces[4]']]);
  });

  it('K-44 kinds unlock by story chapter: I3 L4 J4 at 11 (not 10), T4 S4 Z4 at 21 (not 20), I4 at 31 (not 30)', () => {
    const vertical: [ShapeId[], number][] = [
      [['I3_0', 'L4_0', 'J4_0'], 11],
      [['T4_0', 'S4_0', 'Z4_0'], 21],
      [['I4_0'], 31],
    ];
    for (const [ids, first] of vertical) {
      const pieces: PieceSpec[] = ids.map((id, i) => [id, 'W', i * 2, 0]);
      expect(
        codes(run({ id: first - 1, plan: ['WW'], pieces }, ['L-04'])),
        `${ids.join()} @${first - 1}`,
      ).toEqual(['shape_locked']);
      expect(run({ id: first - 1, plan: ['WW'], pieces }, ['L-04']).length).toBe(ids.length);
      expect(run({ id: first, plan: ['WW'], pieces }, ['L-04']), `${ids.join()} @${first}`).toEqual([]);
    }
  });

  // Faz 2R K-44: "ağır" = Ağır Yük (I5/Q9) only; the old w ≥ 3 rule became `piece_too_wide` (material width ≤ Ws)
  it('K-44 Ağır Yük only from level 8: I5_0/Q9_0 locked at 7, valid at 8 and 41; GDD example L4_90 on Ws = 2 is piece_too_wide, on Ws = 3 valid (11); I3_0 at 9 is shape_locked (kind)', () => {
    const heavy: PieceSpec[] = [
      ['I5_0', 'W', 0, 0],
      ['Q9_0', 'W', 0, 1],
    ];
    expect(run({ id: 7, plan: ['WW'], pieces: heavy }, ['L-04']).map((i) => i.code)).toEqual([
      'shape_locked',
      'shape_locked',
    ]);
    expect(run({ id: 8, plan: ['WW'], pieces: heavy }, ['L-04'])).toEqual([]);
    expect(run({ id: 41, plan: ['WW'], pieces: heavy }, ['L-04'])).toEqual([]);
    const l4 = run({ id: 11, plan: ['WW'], pieces: [['L4_90', 'W', 0, 0]] }, ['L-04']);
    expect(l4.map((i) => [i.code, i.rule, i.path])).toEqual([
      ['piece_too_wide', 'K-45/5', 'yard.batches[0].pieces[0]'],
    ]);
    expect(
      run({ id: 11, site: { cols: 3 }, plan: ['WWW'], pieces: [['L4_90', 'W', 0, 0]] }, ['L-04']),
    ).toEqual([]);
    expect(codes(run({ id: 9, plan: ['WW'], pieces: [['I3_0', 'W', 0, 0]] }, ['L-04']))).toEqual([
      'shape_locked',
    ]);
  });

  it('K-44 I5_90 and I5_270 are forbidden in level data at every level; I5_0 and I5_180 are not', () => {
    for (const id of [8, 41]) {
      const issues = run(
        {
          id,
          plan: ['WW'],
          pieces: [
            ['I5_0', 'W', 0, 0],
            ['I5_180', 'W', 0, 1],
            ['I5_90', 'W', 5, 2],
            ['I5_270', 'W', 4, 2],
          ],
        },
        ['L-04'],
      );
      expect(
        issues.map((i) => [i.code, i.path]),
        `level ${id}`,
      ).toEqual([
        ['shape_forbidden', 'yard.batches[0].pieces[2]'],
        ['shape_forbidden', 'yard.batches[0].pieces[3]'],
      ]);
    }
  });

  it('K-44 I5 and Q9 only in the yard: a truck Q9 (delivered to the yard) is valid, Q9/I5 debris is shape_forbidden', () => {
    const truck: LevelSpec = {
      id: 8,
      plan: [['WW'], ['WW']],
      pieces: [['D2_90', 'W', 0, 0]],
      batches: [{ forSegment: 1, pieces: [['Q9_0', 'W', 3, 8]] }],
    };
    expect(run(truck, ['L-04'])).toEqual([]);
    const debris = run(
      {
        id: 41,
        plan: ['WW', 'WW', 'WW'],
        pieces: [['D2_90', 'W', 0, 0]],
        debris: [
          ['Q9_0', 'G', 6, 0],
          ['I5_0', 'G', 6, 0],
        ],
      },
      ['L-04'],
    );
    expect(debris.map((i) => [i.code, i.path])).toEqual([
      ['shape_forbidden', 'build.debris[0]'],
      ['shape_forbidden', 'build.debris[1]'],
    ]);
  });

  // Faz 2R: the "ağır şekil" column of the OBSTACLES flag table is Ağır Yük (I5/Q9); a 3-wide material block is no
  // longer heavy (its width is L-04 `piece_too_wide`, not a flag rule)
  it('K-45/5 flag combinations follow the OBSTACLES table (✓ chained/wet on Ağır Yük, glass+mortar …; ✗ glass+balloon, Ağır Yük glass/balloon/mortar)', () => {
    const allowed: PieceSpec[] = [
      ['D2_90', 'W', 0, 0, ['glass', 'mortar']],
      ['D2_90', 'W', 2, 0, ['glass', 'chained']],
      ['D2_90', 'W', 4, 0, ['glass', 'wet'], 2],
      ['D2_90', 'W', 0, 1, ['balloon', 'mortar']],
      ['D2_90', 'W', 2, 1, ['balloon', 'chained']],
      ['D2_90', 'W', 4, 1, ['mortar', 'chained']],
      ['D2_90', 'W', 0, 2, ['chained', 'wet'], 3],
      ['Q9_0', 'W', 0, 3, ['chained']],
      ['I5_0', 'W', 0, 6, ['wet'], 1],
      ['I3_90', 'W', 3, 3, ['glass']],
    ];
    expect(run({ id: 41, plan: ['WW'], pieces: allowed }, ['L-21', 'L-26'])).toEqual([]);
    const forbidden: PieceSpec[] = [
      ['D2_90', 'W', 0, 0, ['glass', 'balloon']],
      ['Q9_0', 'W', 0, 1, ['glass']],
      ['I5_0', 'W', 0, 4, ['balloon']],
      ['Q9_0', 'W', 3, 1, ['mortar']],
    ];
    // debris carries no flags at all (K-21 table: debris × every flag ✗) — the schema refuses the field
    const debrisJson = levelJson({
      id: 41,
      plan: ['WW'],
      pieces: [['B1_0', 'W', 0, 0]],
      debris: [['B1_0', 'R', 6, 0]],
    });
    const d0 = debrisJson.build.debris?.[0];
    if (d0) Object.assign(d0, { flags: ['glass'] });
    expect(codes(runJson(debrisJson))).toEqual(['schema_invalid']);
    const issues = run({ id: 41, plan: ['WW'], pieces: forbidden }, ['L-21']);
    expect(issues.map((i) => [i.code, i.rule, i.path])).toEqual(
      [0, 1, 2, 3].map((k) => ['flag_combo_forbidden', 'K-45/5', `yard.batches[0].pieces[${k}]`]),
    );
  });
});

// =====================================================================================================================
// K-31 colour set (L-06, L-07)
// =====================================================================================================================

describe('review K-31 colour set and unlocks', () => {
  it('K-31 GDD example: level 12 (story chapter 2) with W, Y, O, C, R in the plan is 5 > 4 colours → too_many_colors', () => {
    const issues = run({ id: 12, plan: ['WY', 'OC', 'RR'], pieces: [['D2_90', 'R', 0, 0]] }, [
      'L-06',
      'L-07',
    ]);
    expect(issues.map((i) => [i.code, i.rule, i.severity])).toEqual([['too_many_colors', 'K-45/4', 'error']]);
  });

  it('K-31 GDD example on level_005.json (limit 3): plan R/W/Y and blocks R/W/Y are valid; one G block in the yard makes 4 colours → too_many_colors (and the full cover breaks → cover_mismatch)', () => {
    const json = readLevelJson(5);
    expect(runJson(json)).toEqual([]);
    const parsed = validateLevelJson(json).level;
    if (!parsed) throw new Error('level 5 schema');
    expect([...levelColorSet(parsed)].sort()).toEqual(['R', 'W', 'Y']);
    batchOf(json, 0).pieces.push({ shape: 'B1_0', color: 'G', x: 2, y: 2 });
    expect(codes(runJson(json))).toEqual(['cover_mismatch', 'too_many_colors']);
  });

  it('K-31 GDD example: in level 22 the paint gate colour P joins the set (B, P, Y, R → 4 ≤ 5, nothing locked)', () => {
    const spec: LevelSpec = {
      id: 22,
      wall: { height: 6, gaps: [{ type: 'paint', y: 1, size: 2, color: 'P' }] },
      plan: ['BB', 'YR'],
      pieces: [
        ['D2_90', 'B', 0, 0],
        ['B1_0', 'Y', 2, 0],
        ['B1_0', 'R', 3, 0],
      ],
    };
    expect(levelColorSet(level(spec))).toEqual(['Y', 'R', 'B', 'P']);
    expect(run(spec, ['L-06', 'L-07'])).toEqual([]);
  });

  it('K-31 colours unlock at their first level (W,Y 1; G 2; R 4; O,C 11; B,P 21) for every source: decoy, truck block, debris, paint gate', () => {
    const lockedAt = (spec: LevelSpec): string[] => run(spec, ['L-07']).map((i) => i.code);
    // G decoy in level 1, fine in level 2
    const gDecoy = (id: number): LevelSpec => ({
      id,
      plan: ['WW', 'YY'],
      pieces: [
        ['D2_90', 'W', 0, 0],
        ['D2_90', 'Y', 2, 0],
        ['B1_0', 'G', 4, 0],
      ],
    });
    expect(lockedAt(gDecoy(1))).toEqual(['color_locked']);
    expect(lockedAt(gDecoy(2))).toEqual([]);
    // R only in a truck batch: locked in level 3, fine in level 4
    const rTruck = (id: number): LevelSpec => ({
      id,
      plan: [['WW'], ['YY']],
      pieces: [['D2_90', 'W', 0, 0]],
      batches: [
        {
          forSegment: 1,
          pieces: [
            ['D2_90', 'Y', 0, 8],
            ['B1_0', 'R', 2, 8],
          ],
        },
      ],
    });
    expect(lockedAt(rTruck(3))).toEqual(['color_locked']);
    expect(lockedAt(rTruck(4))).toEqual([]);
    // C only as debris: locked in level 10, fine in 11
    const cDebris = (id: number): LevelSpec => ({
      id,
      plan: ['WW', 'YY'],
      pieces: [
        ['D2_90', 'W', 0, 0],
        ['D2_90', 'Y', 2, 0],
      ],
      debris: [['B1_0', 'C', 6, 0]],
    });
    expect(lockedAt(cDebris(10))).toEqual(['color_locked']);
    expect(lockedAt(cDebris(11))).toEqual([]);
    // B only as a paint gate colour: locked in level 20, fine in 21
    const bGate = (id: number): LevelSpec => ({
      id,
      wall: { height: 6, gaps: [{ type: 'paint', y: 1, size: 2, color: 'B' }] },
      plan: ['WW'],
      pieces: [['D2_90', 'W', 0, 0]],
    });
    expect(lockedAt(bGate(20))).toEqual(['color_locked']);
    expect(lockedAt(bGate(21))).toEqual([]);
  });

  it('K-31 colour limit per story chapter: 4 colours fail in level 10 and pass in 11; 6 colours fail in 21 and 41, 5 pass', () => {
    const tooMany = (id: number, plan: string[]): string[] =>
      run({ id, plan, pieces: [['B1_0', 'W', 0, 0]] }, ['L-06']).map((i) => i.code);
    expect(tooMany(10, ['WY', 'GR'])).toEqual(['too_many_colors']);
    expect(tooMany(11, ['WY', 'GR'])).toEqual([]);
    expect(tooMany(21, ['WY', 'GR', 'OO'])).toEqual([]);
    expect(tooMany(21, ['WY', 'GR', 'OC'])).toEqual(['too_many_colors']);
    expect(tooMany(41, ['WY', 'GR', 'OC'])).toEqual(['too_many_colors']);
  });

  it('K-31 resolved `?` colours count, `.` is not a colour: repeat `?` takes the colour p rows below', () => {
    const spec: LevelSpec = {
      id: 27,
      plan: ['?.', 'RW', 'YW'],
      hidden: [{ kind: 'repeat', period: 2 }],
      pieces: [['B1_0', 'W', 0, 0]],
    };
    // (6,2) = `?` → (6,0) = Y (period 2); the set is W, Y, R from the plan and W from the block.
    expect(levelColorSet(level(spec))).toEqual(['W', 'Y', 'R']);
    const seg = compile(level(spec)).segments[0];
    expect(seg?.planColors[2 * 2 + 0]).toBe(COLOR_CODES.indexOf('Y'));
  });
});

// =====================================================================================================================
// K-45 items 1–7: L-01 … L-15, L-23
// =====================================================================================================================

describe('review K-45/1 identity, seed', () => {
  it('K-45/1 id 1–50 and chapter = ceil(id/10) at the boundaries (10 → 1, 11 → 2, 41 → 5, 50 → 5, 51 out of range)', () => {
    const l01 = (id: number, chapter: number): string[] =>
      run({ id, chapter, plan: ['WW'], pieces: [['B1_0', 'W', 0, 0]] }, ['L-01']).map((i) => i.code);
    expect(l01(10, 1)).toEqual([]);
    expect(l01(10, 2)).toEqual(['chapter_mismatch']);
    expect(l01(11, 2)).toEqual([]);
    expect(l01(11, 1)).toEqual(['chapter_mismatch']);
    expect(l01(41, 5)).toEqual([]);
    expect(l01(50, 5)).toEqual([]);
    expect(l01(51, 5)).toContain('id_mismatch');
  });

  it('K-45/1 seed missing → id × 1000 + id (GDD example 4004), written seed kept; level files 1–5 use the same values', () => {
    const json = readLevelJson(4);
    delete json.seed;
    const loaded = loadLevel(json);
    expect(loaded.ok && loaded.level.seed).toBe(4004);
    expect(compile(level({ id: 37, plan: ['WW'], pieces: [['B1_0', 'W', 0, 0]] })).seed).toBe(37037);
    expect(compile(level({ id: 37, seed: 0, plan: ['WW'], pieces: [['B1_0', 'W', 0, 0]] })).seed).toBe(0);
    for (const n of LEVEL_IDS) expect(readLevelJson(n).seed ?? n * 1000 + n, `level ${n}`).toBe(n * 1000 + n);
  });
});

describe('review K-45/2 yard fill and overlap', () => {
  it('K-45/2 K-02 GDD example (Faz 2R band 2 ≤ E ≤ ⌊0,4·C⌋): level 3 C 16 F 10 → E 6 valid, E 7 yard_fill_low, E 1 yard_fill_high; default 6 × 8 E ∈ [2, 19]', () => {
    const small = (n: number): string[] =>
      run({ id: 3, yard: { cols: 4, rows: 4 }, plan: ['WW'], pieces: bricksIn(4, n) }, ['L-03']).map(
        (i) => i.code,
      );
    expect(small(10)).toEqual([]); // E = 6 = ⌊6,4⌋
    expect(small(9)).toEqual(['yard_fill_low']); // E = 7
    expect(small(14)).toEqual([]); // E = 2
    expect(small(15)).toEqual(['yard_fill_high']); // E = 1
    expect(runJson(readLevelJson(3), ['L-03'])).toEqual([]);
    const fill = (n: number): string[] =>
      run({ id: 1, plan: ['WW'], pieces: bricks(n) }, ['L-03']).map((i) => i.code);
    expect(fill(46)).toEqual([]); // E = 2
    expect(fill(47)).toEqual(['yard_fill_high']);
    expect(fill(48)).toEqual(['yard_fill_high']);
    expect(fill(29)).toEqual([]); // E = 19
    expect(fill(28)).toEqual(['yard_fill_low']);
  });

  it('K-45/2 crates and cement bags fill yard cells, screws and keys do not (K-02: F = material + Ağır Yük + crate + bag)', () => {
    const obstacles: LevelInput['obstacles'] = [
      { type: 'crate', x: 1, y: 6, hp: 1 },
      { type: 'cement_bag', x: 2, y: 6 },
    ];
    // 27 bricks + crate + bag = 29 → E = 19 → valid
    expect(run({ id: 18, plan: ['WW'], pieces: bricks(27), obstacles }, ['L-03'])).toEqual([]);
    // 28 bricks + screw + key (both under bricks) = 28 → E = 20 → low
    const hidden: LevelInput['obstacles'] = [
      { type: 'screw', x: 0, y: 0 },
      { type: 'key', x: 1, y: 0, id: 'a' },
    ];
    expect(
      run({ id: 26, plan: ['WW'], pieces: bricks(28), obstacles: hidden }, ['L-03']).map((i) => i.code),
    ).toEqual(['yard_fill_low']);
    // Ağır Yük fills its 9 cells: 20 bricks + Q9 = 29 → valid
    expect(
      run({ id: 8, plan: ['WW'], pieces: [...bricks(20), ['Q9_0', 'W', 0, 5]] }, ['L-03']).map((i) => i.code),
    ).toEqual([]);
  });

  it('K-45/2 batch-0 cells must be x ≤ 5 and y ≤ 7: a block reaching the crane rows or the site is out_of_yard', () => {
    const spec: LevelSpec = {
      id: 1,
      plan: ['WW'],
      pieces: [
        ['D2_0', 'W', 0, 7],
        ['D2_90', 'W', 5, 0],
        ['B1_0', 'W', 6, 0],
        ['D2_0', 'W', 5, 6],
      ],
    };
    expect(run(spec, ['L-02']).map((i) => [i.code, i.path])).toEqual([
      ['out_of_yard', 'yard.batches[0].pieces[0]'],
      ['out_of_yard', 'yard.batches[0].pieces[1]'],
      ['out_of_yard', 'yard.batches[0].pieces[2]'],
    ]);
  });

  it('K-45/2 blocks, crates and bags must not overlap; a screw or key under a crate is not an overlap', () => {
    const overlaps = run(
      {
        id: 18,
        plan: ['WW'],
        pieces: [['O4_0', 'W', 0, 0]],
        obstacles: [
          { type: 'crate', x: 1, y: 1, hp: 2 },
          { type: 'crate', x: 3, y: 3, hp: 1 },
          { type: 'cement_bag', x: 3, y: 3 },
        ],
      },
      ['L-02'],
    );
    expect(overlaps.map((i) => [i.code, i.path])).toEqual([
      ['overlap', 'obstacles[0]'],
      ['overlap', 'obstacles[2]'],
    ]);
    const hidden = run(
      {
        id: 26,
        plan: ['WW'],
        pieces: [['B1_0', 'W', 0, 0]],
        obstacles: [
          { type: 'crate', x: 3, y: 3, hp: 1 },
          { type: 'screw', x: 3, y: 3 },
          { type: 'key', x: 0, y: 0, id: 'a' },
        ],
      },
      ['L-02', 'L-14', 'L-23'],
    );
    expect(hidden).toEqual([]);
  });
});

describe('review K-45/3 wall and gaps (L-09)', () => {
  it('K-45/3 K-04 GDD examples: height 6 gap y=2 size 2 valid, y=4 size 2 gap_touches_top; level 9 gap y=3 size 1 valid, y=5 touches top', () => {
    const wall = (height: number, y: number, size: number): string[] =>
      run(
        {
          id: 9,
          wall: { height, gaps: [{ type: 'static', y, size }] },
          plan: ['WW'],
          pieces: [['B1_0', 'W', 0, 0]],
        },
        ['L-09'],
      ).map((i) => i.code);
    expect(wall(6, 2, 2)).toEqual([]);
    expect(wall(6, 4, 2)).toEqual(['gap_touches_top']);
    expect(wall(6, 3, 1)).toEqual([]);
    expect(wall(6, 5, 1)).toEqual(['gap_touches_top']);
    // boundary: y + size = height − 1 is valid (level 4: height 6, y 3, size 2)
    expect(wall(6, 3, 2)).toEqual([]);
    // a "gap" above the wall top is no gap
    expect(wall(3, 4, 1)).toEqual(['gap_touches_top']);
    expect(wall(0, 0, 1)).toEqual(['gap_touches_top']);
  });

  it('K-45/3 the K-04 top rule holds for every gap type (shutter, paint, locked)', () => {
    const gaps: LevelInput['wall']['gaps'] = [
      { type: 'shutter', y: 0, size: 2, period: 2 },
      { type: 'paint', y: 2, size: 2, color: 'W' },
      { type: 'locked', y: 4, size: 1, keyId: 'a' },
    ];
    const issues = run(
      {
        id: 30,
        wall: { height: 5, gaps },
        plan: ['WW'],
        pieces: [['B1_0', 'W', 0, 0]],
        obstacles: [{ type: 'key', x: 0, y: 0, id: 'a' }],
      },
      ['L-09'],
    );
    // height 5: y + size ≤ 4 → shutter 2 ok, paint 4 ok, locked 5 > 4
    expect(issues.map((i) => [i.code, i.path])).toEqual([['gap_touches_top', 'wall.gaps[2]']]);
  });

  it('K-45/3 OBSTACLES W5 examples: range [3,3] y 3 → slider_range; height 8 slider [1,3] size 2 + static y 4 size 1 → gap_overlap; static y 5 → no overlap', () => {
    const slider = (height: number, gaps: LevelInput['wall']['gaps']): (string | undefined)[][] =>
      run({ id: 16, wall: { height, gaps }, plan: ['WW'], pieces: [['B1_0', 'W', 0, 0]] }, ['L-09']).map(
        (i) => [i.code, i.path],
      );
    expect(slider(8, [{ type: 'slider', y: 3, size: 1, range: [3, 3], dir: 1 }])).toEqual([
      ['slider_range', 'wall.gaps[0]'],
    ]);
    expect(
      slider(8, [
        { type: 'slider', y: 1, size: 2, range: [1, 3] },
        { type: 'static', y: 4, size: 1 },
      ]),
    ).toEqual([['gap_overlap', 'wall.gaps[1]']]);
    expect(
      slider(8, [
        { type: 'slider', y: 1, size: 2, range: [1, 3] },
        { type: 'static', y: 5, size: 1 },
      ]),
    ).toEqual([]);
  });

  it('K-45/3 slider: start y inside [a, b] and b + size ≤ height − 1; two sliders overlap over their whole ranges', () => {
    const codesOf = (height: number, gaps: LevelInput['wall']['gaps']): string[] =>
      run({ id: 16, wall: { height, gaps }, plan: ['WW'], pieces: [['B1_0', 'W', 0, 0]] }, ['L-09']).map(
        (i) => i.code,
      );
    expect(codesOf(6, [{ type: 'slider', y: 0, size: 1, range: [1, 3] }])).toEqual(['slider_range']);
    expect(codesOf(6, [{ type: 'slider', y: 4, size: 1, range: [1, 3] }])).toEqual(['slider_range']);
    expect(codesOf(6, [{ type: 'slider', y: 1, size: 2, range: [1, 3] }])).toEqual([]); // 3 + 2 = 5 ≤ 5
    expect(codesOf(6, [{ type: 'slider', y: 1, size: 2, range: [1, 4] }])).toEqual(['slider_range']); // 6 > 5
    // OBSTACLES W5: the range may start at row 0 (0 ≤ a)
    expect(codesOf(6, [{ type: 'slider', y: 0, size: 1, range: [0, 2] }])).toEqual([]);
    // two sliders: rows 0–1 and 2–3 do not overlap; rows 0–2 and 2–3 do
    expect(
      codesOf(8, [
        { type: 'slider', y: 0, size: 1, range: [0, 1] },
        { type: 'slider', y: 3, size: 1, range: [2, 3] },
      ]),
    ).toEqual([]);
    expect(
      codesOf(8, [
        { type: 'slider', y: 0, size: 1, range: [0, 2] },
        { type: 'slider', y: 3, size: 1, range: [2, 3] },
      ]),
    ).toEqual(['gap_overlap']);
    // static gaps on adjacent rows touch but do not overlap
    expect(
      codesOf(8, [
        { type: 'static', y: 1, size: 2 },
        { type: 'static', y: 3, size: 2 },
      ]),
    ).toEqual([]);
    expect(
      codesOf(8, [
        { type: 'static', y: 1, size: 2 },
        { type: 'static', y: 2, size: 2 },
      ]),
    ).toEqual(['gap_overlap']);
  });

  it('K-45/3 shutter 0 ≤ phase < 2·period (W4: period 2 → phase 0…3; phase 2 starts closed and is valid)', () => {
    const phase = (period: number, ph: number): string[] =>
      run(
        {
          id: 13,
          wall: { height: 6, gaps: [{ type: 'shutter', y: 1, size: 2, period, phase: ph }] },
          plan: ['WW'],
          pieces: [['B1_0', 'W', 0, 0]],
        },
        ['L-09'],
      ).map((i) => i.code);
    expect(phase(2, 2)).toEqual([]);
    expect(phase(2, 3)).toEqual([]);
    expect(phase(2, 4)).toEqual(['shutter_phase']);
    expect(phase(1, 1)).toEqual([]);
    expect(phase(1, 2)).toEqual(['shutter_phase']);
  });

  it('K-45/3 a wind fan in a level without any 1-wide block is fan_unused (warn); a 1-wide truck block is enough', () => {
    const fan = (batches: LevelSpec['batches']): [string, string][] =>
      run(
        {
          id: 32,
          wall: { height: 4, fan: 'right' },
          plan: [['WW'], ['WW']],
          pieces: [['O4_0', 'W', 0, 0]],
          batches,
        },
        ['L-09'],
      ).map((i) => [i.code, i.severity]);
    expect(fan([])).toEqual([['fan_unused', 'warn']]);
    expect(fan([{ forSegment: 1, pieces: [['D2_0', 'W', 0, 8]] }])).toEqual([]);
    expect(fan([{ forSegment: 1, pieces: [['D2_90', 'W', 0, 8]] }])).toEqual([['fan_unused', 'warn']]);
  });

  it('K-45/3 a locked gate needs a key obstacle with the same id (a screw with that id or a key with another id is key_missing)', () => {
    const lockedWith = (obstacles: LevelInput['obstacles']): string[] =>
      run(
        {
          id: 26,
          wall: { height: 6, gaps: [{ type: 'locked', y: 1, size: 2, keyId: 'gold' }] },
          plan: ['WW'],
          pieces: [['O4_0', 'W', 0, 0]],
          obstacles,
        },
        ['L-09'],
      ).map((i) => i.code);
    expect(lockedWith([{ type: 'key', x: 0, y: 0, id: 'gold' }])).toEqual([]);
    expect(lockedWith([{ type: 'key', x: 0, y: 0, id: 'silver' }])).toEqual(['key_missing']);
    expect(lockedWith([{ type: 'screw', x: 0, y: 0, id: 'gold' }])).toEqual(['key_missing']);
    expect(lockedWith([])).toEqual(['key_missing']);
  });
});

describe('review K-45/4 plan rows, elevator, hidden cells (L-05, L-08)', () => {
  it('K-45/4 Faz 2R plan_size: a plan row of 1 character on a 2-column site is plan_size (not schema_invalid), so is a segment with fewer than Hs rows; an unknown letter is schema_invalid', () => {
    const json: LevelInput = {
      ...levelJson({ id: 1, plan: ['WW', 'WW', 'WW', 'WW'], pieces: [['B1_0', 'W', 0, 0]] }),
      site: { cols: 2, rows: 4 },
    };
    const seg = json.build.segments[0];
    if (!seg) throw new Error('no segment');
    expect(runJson(json, ['L-05'])).toEqual([]);
    seg.rows = ['W', 'WW', 'WW', 'WW'];
    expect(runJson(json, ['L-05']).map((i) => [i.code, i.rule, i.path])).toEqual([
      ['plan_size', 'K-45/4', 'build.segments[0].rows[0]'],
    ]);
    seg.rows = ['WW', 'WW', 'WW'];
    expect(runJson(json, ['L-05']).map((i) => [i.code, i.path])).toEqual([
      ['plan_size', 'build.segments[0].rows'],
    ]);
    seg.rows = ['WX', 'WW', 'WW', 'WW'];
    expect(codes(runJson(json, ['L-05']))).toEqual(['schema_invalid']);
  });

  it('K-45/4 K-24 elevator (Faz 2R): Hs + b ≤ 8 (Hs 6: b 2 valid, b 3 elevator_overflow)', () => {
    const six = ['WW', 'WW', 'WW', 'WW', 'WW', 'WW'];
    const el = (b: number): Issue[] =>
      run(
        {
          id: 37,
          site: { cols: 2, rows: 6 },
          plan: [six, six],
          pieces: [['B1_0', 'W', 0, 0]],
          elevator: { range: [0, b], start: 0, dir: 1 },
        },
        ['L-05'],
      );
    expect(el(2)).toEqual([]);
    expect(codes(el(3))).toEqual(['elevator_overflow']);
    expect(el(3).every((i) => i.rule === 'K-45/4')).toBe(true);
  });

  it('K-45/4 K-32 repeat: no `?` in the bottom p rows; a `?` that resolves to `.` is invalid ("`.` gizli olamaz"); chains resolve', () => {
    const hidden = (rows: string[], period: number): string[] =>
      run({ id: 27, plan: rows, hidden: [{ kind: 'repeat', period }], pieces: [['B1_0', 'W', 0, 0]] }, [
        'L-08',
      ]).map((i) => i.code);
    expect(hidden(['??', '??', 'WY'], 1)).toEqual([]); // chain: r2 → r1 → r0
    expect(hidden(['??', 'WY'], 2)).toEqual(['hidden_invalid', 'hidden_invalid']); // r1 < p = 2
    expect(hidden(['?W', '.W'], 1)).toEqual(['hidden_invalid']); // resolves to `.`
    const chain = compile(
      level({
        id: 27,
        plan: ['??', '??', 'WY'],
        hidden: [{ kind: 'repeat', period: 1 }],
        pieces: [['B1_0', 'W', 0, 0]],
      }),
    ).segments[0];
    // local index sy * 2 + sx: (sx 0, sy 2) = W, (sx 1, sy 2) = Y
    expect([chain?.planColors[4], chain?.planColors[5]]).toEqual([
      COLOR_CODES.indexOf('W'),
      COLOR_CODES.indexOf('Y'),
    ]);
  });

  it('K-45/4 K-32 mirrorOf: earlier segment, same height, no `?` in the target; columns swap (c → 1 − c)', () => {
    const mirror = (plans: string[][], segment: number): string[] =>
      run(
        {
          id: 29,
          plan: plans,
          hidden: plans.map((_, i) =>
            i === plans.length - 1 ? { kind: 'mirrorOf' as const, segment } : undefined,
          ),
          pieces: [['B1_0', 'W', 0, 0]],
        },
        ['L-08'],
      ).map((i) => i.code);
    expect(mirror([['WY'], ['?R']], 0)).toEqual([]);
    expect(mirror([['WY'], ['?R']], 1)).not.toEqual([]); // itself
    expect(mirror([['WY', 'WW'], ['?R']], 0)).not.toEqual([]); // height 2 ≠ 1
    // target with `?`: segment 0 uses repeat, segment 1 mirrors it
    const withHiddenTarget = run(
      {
        id: 29,
        plan: [
          ['?Y', 'WY'],
          ['?R', 'RR'],
        ],
        hidden: [
          { kind: 'repeat', period: 1 },
          { kind: 'mirrorOf', segment: 0 },
        ],
        pieces: [['B1_0', 'W', 0, 0]],
      },
      ['L-08'],
    );
    expect(codes(withHiddenTarget)).toEqual(['hidden_invalid']);
    // mirrorOf a later segment
    const later = run(
      {
        id: 29,
        plan: [['?R'], ['WY']],
        hidden: [{ kind: 'mirrorOf', segment: 1 }, undefined],
        pieces: [['B1_0', 'W', 0, 0]],
      },
      ['L-08'],
    );
    expect(codes(later)).toEqual(['hidden_invalid']);
    // resolution: (c, r) takes (1 − c, r) of the target → seg 1 (6,0) `?` = seg 0 (7,0) = Y
    const seg1 = compile(
      level({
        id: 29,
        plan: [['WY'], ['?R']],
        hidden: [undefined, { kind: 'mirrorOf', segment: 0 }],
        pieces: [['B1_0', 'W', 0, 0]],
      }),
    ).segments[1];
    expect(seg1?.planColors[0]).toBe(COLOR_CODES.indexOf('Y'));
  });
});

describe('review K-45/6 hidden items and goals (L-14, L-15, L-23)', () => {
  it('K-45/6 hidden items start covered by a batch-0 block or a crate; a cement bag or a truck-only block does not cover', () => {
    const exposed = (spec: Partial<LevelSpec>): string[] =>
      run({ id: 26, plan: [['WW'], ['WW']], pieces: [['O4_0', 'W', 0, 0]], ...spec }, ['L-14']).map(
        (i) => i.code,
      );
    expect(exposed({ obstacles: [{ type: 'screw', x: 1, y: 1 }] })).toEqual([]);
    expect(
      exposed({
        obstacles: [
          { type: 'crate', x: 4, y: 4, hp: 3 },
          { type: 'key', x: 4, y: 4, id: 'a' },
        ],
      }),
    ).toEqual([]);
    expect(
      exposed({
        obstacles: [
          { type: 'cement_bag', x: 4, y: 4 },
          { type: 'screw', x: 4, y: 4 },
        ],
      }),
    ).toEqual(['hidden_item_exposed']);
    expect(
      exposed({
        batches: [{ forSegment: 1, pieces: [['O4_0', 'W', 4, 8]] }],
        obstacles: [{ type: 'screw', x: 4, y: 0 }],
      }),
    ).toEqual(['hidden_item_exposed']);
  });

  it('K-45/6 at most one hidden item per cell (screw + key → hidden_item_stacked)', () => {
    const issues = run(
      {
        id: 26,
        plan: ['WW'],
        pieces: [['O4_0', 'W', 0, 0]],
        obstacles: [
          { type: 'screw', x: 1, y: 1 },
          { type: 'key', x: 1, y: 1, id: 'a' },
          { type: 'screw', x: 0, y: 0 },
        ],
      },
      ['L-23'],
    );
    expect(issues.map((i) => [i.code, i.rule, i.path])).toEqual([
      ['hidden_item_stacked', 'K-45/6', 'obstacles[1]'],
    ]);
  });

  it('K-45/6 K-41 goals: exactly one build; clear/collect counts ≤ objects (chained truck blocks and debris count)', () => {
    const goals = (g: LevelSpec['goals'], extra: Partial<LevelSpec> = {}): string[] =>
      run(
        {
          id: 24,
          plan: [['WW'], ['WW']],
          pieces: [['O4_0', 'W', 0, 0]],
          obstacles: [{ type: 'screw', x: 0, y: 0 }],
          batches: [{ forSegment: 1, pieces: [['D2_90', 'W', 0, 8, ['chained']]] }],
          debris: [['B1_0', 'R', 6, 0]],
          goals: g,
          ...extra,
        },
        ['L-15'],
      ).map((i) => i.code);
    expect(goals([{ type: 'build' }, { type: 'collect', item: 'screw', count: 1 }])).toEqual([]);
    expect(goals([{ type: 'build' }, { type: 'collect', item: 'screw', count: 2 }])).toEqual([
      'goal_count_too_high',
    ]);
    expect(goals([{ type: 'build' }, { type: 'clear', target: 'chain', count: 1 }])).toEqual([]);
    expect(goals([{ type: 'build' }, { type: 'clear', target: 'chain', count: 2 }])).toEqual([
      'goal_count_too_high',
    ]);
    expect(goals([{ type: 'build' }, { type: 'clear', target: 'debris', count: 1 }])).toEqual([]);
    expect(goals([{ type: 'build' }, { type: 'clear', target: 'debris', count: 2 }])).toEqual([
      'goal_count_too_high',
    ]);
    expect(goals([{ type: 'build' }, { type: 'clear', target: 'crate', count: 1 }])).toEqual([
      'goal_count_too_high',
    ]);
    expect(goals([{ type: 'build' }, { type: 'build' }])).toEqual(['goal_build_missing']);
    expect(goals([{ type: 'collect', item: 'screw', count: 1 }])).toEqual(['goal_build_missing']);
  });
});

describe('review K-45/7 debris (L-13)', () => {
  const base = (debris: LevelSpec['debris'], plan: LevelSpec['plan'] = ['WW', 'WW', 'WW']): string[] =>
    run({ id: 17, plan, pieces: [['O4_0', 'W', 0, 0]], debris }, ['L-13']).map((i) => i.code);

  it('K-45/7 every debris cell lies in x 6–7: a horizontal D2 anchored at x 7 reaches x 8 → debris_misplaced', () => {
    expect(base([['D2_90', 'R', 6, 0]])).toEqual([]);
    expect(base([['D2_90', 'R', 7, 0]])).toEqual(['debris_misplaced']);
    expect(base([['D2_0', 'R', 7, 1]])).toEqual([]);
  });

  // Faz 2R (OBSTACLES S4, K-45/7): every plan covers the whole Hs × Ws site, so "its own segment's plan area" = Hs rows
  it('K-45/7 debris stays inside the plan area of its own segment (Hs rows; segment default 0 and must exist); support is not required', () => {
    const three = ['WW', 'WW', 'WW'];
    const sized = (debris: LevelSpec['debris']): string[] =>
      run(
        { id: 17, site: { cols: 2, rows: 3 }, plan: [three, three], pieces: [['O4_0', 'W', 0, 0]], debris },
        ['L-13'],
      ).map((i) => i.code);
    expect(sized([['B1_0', 'R', 6, 2]])).toEqual([]); // floating at row 2 of segment 0 (OBSTACLES S4)
    expect(sized([['B1_0', 'R', 6, 2, 1]])).toEqual([]);
    expect(sized([['D2_0', 'R', 6, 2]])).toEqual(['debris_misplaced']); // rows 2–3, Hs 3
    expect(sized([['B1_0', 'R', 6, 0, 2]])).toEqual(['debris_misplaced']); // no segment 2
  });

  it('K-45/7 debris pieces of one segment must not overlap; the same cell in two different segments is no overlap', () => {
    const plans = [['WW'], ['WW']];
    expect(
      base(
        [
          ['D2_90', 'R', 6, 0],
          ['B1_0', 'G', 7, 0],
        ],
        plans,
      ),
    ).toEqual(['debris_misplaced']);
    expect(
      base(
        [
          ['D2_90', 'R', 6, 0],
          ['B1_0', 'G', 7, 0, 1],
        ],
        plans,
      ),
    ).toEqual([]);
  });
});

// =====================================================================================================================
// K-27 material (L-10), K-25 batches (L-12)
// =====================================================================================================================

describe('review K-27 material and K-25 truck batches', () => {
  it('K-27 GDD example (Faz 2R, K-47): level 5 segment 2 has R 4, W 2, Y 4 and batch 1 brings O4 Y, D2_0 R × 2, D2_90 W → valid; a C3 W added to the batch is cover_mismatch (no decoys)', () => {
    const json = readLevelJson(5);
    expect(runJson(json, ['L-10', 'L-30'])).toEqual([]);
    expect(batchOf(json, 1).pieces.map((p) => [p.shape, p.color])).toEqual([
      ['O4_0', 'Y'],
      ['D2_0', 'R'],
      ['D2_0', 'R'],
      ['D2_90', 'W'],
    ]);
    batchOf(json, 1).pieces.push({ shape: 'C3_0', color: 'W', x: 0, y: 4 });
    expect(runJson(json, ['L-10', 'L-30']).map((i) => [i.code, i.rule])).toEqual([
      ['cover_mismatch', 'K-45/8'],
    ]);
  });

  it('K-27 K-47 Ağır Yük is not supply: a Q9 "W" next to one O4 W cannot cover 8 W cells (cover_mismatch); two O4 W can', () => {
    const supply = (pieces: PieceSpec[]): string[] =>
      run({ id: 8, site: { cols: 2, rows: 4 }, plan: ['WW', 'WW', 'WW', 'WW'], pieces }, [
        'L-10',
        'L-30',
      ]).map((i) => i.code);
    expect(
      supply([
        ['Q9_0', 'W', 0, 0],
        ['O4_0', 'W', 3, 0],
      ]),
    ).toEqual(['cover_mismatch']);
    expect(
      supply([
        ['Q9_0', 'W', 0, 0],
        ['O4_0', 'W', 3, 0],
        ['O4_0', 'W', 3, 2],
      ]),
    ).toEqual([]);
  });

  // Faz 2R: K-47 counts every material block (cargo excluded) whatever its way to the site; reachability is the solver's
  // (K-45/9 `unsolvable` / `unused_block`), not L-10's — the Faz 2 "only blocks that can reach the site are supply" test
  // left with `material_short`. canReachSite itself is still checked against the drag engine further below.

  it("K-47 item 1 with a W6 paint gate the cover equality is on the total cell count (the per-colour balance is the solver's); without the gate the same data is cover_mismatch", () => {
    const spec = (gaps: NonNullable<LevelSpec['wall']>['gaps']): LevelSpec => ({
      id: 22,
      site: { cols: 2, rows: 4 },
      wall: { height: 6, gaps },
      plan: ['PP', 'PP', 'YY', 'YY'],
      pieces: [
        ['O4_0', 'Y', 0, 0],
        ['O4_0', 'Y', 2, 0],
      ],
    });
    const paint = [{ type: 'paint' as const, y: 1, size: 2, color: 'P' as const }];
    expect(run(spec(paint), ['L-10', 'L-30'])).toEqual([]);
    expect(codes(run(spec([]), ['L-10', 'L-30']))).toEqual(['cover_mismatch']);
    // the material condition still counts every block once, for one colour: 4 cells as Y or as P, never 2 + 2
    const block = { forSegment: 0, color: 'Y' as const, cells: 4, alts: ['P' as const] };
    expect(materialShortfall({ Y: 2, P: 2 }, [block]).length).toBeGreaterThan(0);
  });

  it('K-25 truck blocks: y written as 8, 0 ≤ x ≤ 6 − w, forSegment 1…S−1, dropColumns fit the block', () => {
    const truck = (
      pieces: PieceSpec[],
      extra: { forSegment?: number; dropColumns?: number[] } = {},
    ): string[] =>
      run(
        {
          id: 5,
          plan: [['WW'], ['WW'], ['WW']],
          pieces: [['D2_90', 'W', 0, 0]],
          batches: [
            {
              forSegment: extra.forSegment ?? 1,
              pieces,
              ...(extra.dropColumns ? { dropColumns: extra.dropColumns } : {}),
            },
          ],
        },
        ['L-12'],
      ).map((i) => i.code);
    expect(truck([['O4_0', 'W', 4, 8]])).toEqual([]);
    expect(truck([['O4_0', 'W', 5, 8]])).toEqual(['batch_invalid']);
    expect(truck([['B1_0', 'W', 5, 8]])).toEqual([]);
    expect(truck([['B1_0', 'W', 6, 8]])).toEqual(['batch_invalid']);
    expect(truck([['B1_0', 'W', 0, 8]], { forSegment: 2 })).toEqual([]);
    expect(truck([['B1_0', 'W', 0, 8]], { forSegment: 3 })).toEqual(['batch_invalid']);
    expect(truck([['B1_0', 'W', 0, 8]], { forSegment: 0 })).toEqual(['batch_invalid']);
    expect(truck([['D2_90', 'W', 0, 8]], { dropColumns: [4, 0] })).toEqual([]);
    expect(truck([['D2_90', 'W', 0, 8]], { dropColumns: [5] })).toEqual(['batch_invalid']);
    // y of a truck block is written as 8 (GDD §14)
    const json = levelJson({
      id: 5,
      plan: [['WW'], ['WW']],
      pieces: [['D2_90', 'W', 0, 0]],
      batches: [{ forSegment: 1, pieces: [['B1_0', 'W', 0, 8]] }],
    });
    const p = batchOf(json, 1).pieces[0];
    if (p) p.y = 7;
    expect(runJson(json, ['L-12']).map((i) => i.code)).toEqual(['batch_invalid']);
  });
});

// =====================================================================================================================
// K-45/9 mechanics (L-16, L-22)
// =====================================================================================================================

describe('review K-45/9 mechanics derived from data', () => {
  it('K-45/10 levels 1–10 derive {}, {}, {}, {W1}, {S1}, {W2}, {S1, W2}, {Y5}, {W1, W3}, {S1, W2, Y5}; the one new mechanic of 4, 5, 6, 8, 9 equals `teaches`, the others have none (OBSTACLES "Veri imzası" Faz 2R)', () => {
    const previous = new Set<MechanicId>();
    const expected: Record<number, [MechanicId[], MechanicId | undefined]> = {
      1: [[], undefined],
      2: [[], undefined],
      3: [[], undefined],
      4: [['W1'], 'W1'],
      5: [['S1'], 'S1'],
      6: [['W2'], 'W2'], // wall height 7 = H 7
      7: [['S1', 'W2'], undefined], // two segments, wall 5 = H 5
      8: [['Y5'], 'Y5'],
      9: [['W1', 'W3'], 'W3'], // a static size-1 gap
      10: [['S1', 'W2', 'Y5'], undefined],
    };
    for (const n of LEVEL_IDS) {
      const res = validateLevelJson(readLevelJson(n), {
        only: ['L-16', 'L-22'],
        previousMechanics: new Set(previous),
      });
      expect(res.issues, `level ${n}`).toEqual([]);
      const lvl = res.level;
      if (!lvl) throw new Error(`level ${n} fails the schema`);
      const [derived, teaches] = expected[n] ?? [[], undefined];
      expect([...deriveMechanics(lvl)].sort(), `level ${n} derived set`).toEqual(derived);
      expect(lvl.teaches, `level ${n} teaches`).toBe(teaches);
      const fresh = derived.filter((m) => !previous.has(m));
      expect(fresh, `level ${n} new mechanics`).toEqual(teaches ? [teaches] : []);
      for (const m of derived) previous.add(m);
    }
  });

  it('K-45/9 teaches is only valid for the one new mechanic: an already seen mechanic, or a level without a new one, is teaches_mismatch', () => {
    const seen = new Set<MechanicId>(['W1', 'S2', 'S1']);
    const lvl = (teaches: MechanicId, wall: LevelSpec['wall']): string[] =>
      run({ id: 6, teaches, wall, plan: ['WW'], pieces: [['B1_0', 'W', 0, 0]] }, ['L-16', 'L-22'], {
        previousMechanics: seen,
      }).map((i) => i.code);
    expect(lvl('W1', { height: 6, gaps: [{ type: 'static', y: 1, size: 2 }] })).toEqual(['teaches_mismatch']);
    expect(lvl('W2', { height: 8 })).toEqual([]);
    expect(lvl('W1', { height: 8 })).toEqual(['teaches_mismatch']);
    // level 9: a size-1 gap is W3 (any type, N2)
    const nine = run(
      {
        id: 9,
        teaches: 'W3',
        wall: { height: 6, gaps: [{ type: 'static', y: 3, size: 1 }] },
        plan: ['WW'],
        pieces: [['B1_0', 'W', 0, 0]],
      },
      ['L-16', 'L-22'],
      { previousMechanics: new Set<MechanicId>(['W1', 'S2', 'S1', 'W2', 'Y5']) },
    );
    expect(nine).toEqual([]);
  });
});

// =====================================================================================================================
// GDD §14.1 tutorial data (L-17)
// =====================================================================================================================

describe('review GDD 14.1 tutorial data (L-17)', () => {
  const l17 = (json: unknown): string[] => runJson(json, ['L-17']).map((i) => i.code);

  it('GDD 14.1 highlights must exist in the level: piece:<i> < batch-0 size, cell on the board (x < Wy + Ws, y < H), gap/obstacle/debris index, truck, fan', () => {
    const one = (h: string, n = 1): string[] => l17(withTutorial(n, [soft([h], { event: 'turnEnd' })]));
    expect(one('piece:4')).toEqual([]); // level 1 has 5 blocks
    expect(one('piece:5')).toEqual(['tut_highlight_invalid']);
    expect(one('cell:5,4')).toEqual([]); // 4 × 4 | 2 × 5: x 0–5, y 0–4
    expect(one('cell:4,5')).toEqual(['tut_highlight_invalid']); // crane row is not the board
    expect(one('cell:6,0')).toEqual(['tut_highlight_invalid']);
    expect(one('gap:0')).toEqual(['tut_highlight_invalid']);
    expect(one('gap:0', 4)).toEqual([]);
    expect(one('truck')).toEqual(['tut_highlight_invalid']);
    expect(one('truck', 5)).toEqual([]);
    expect(one('fan')).toEqual(['tut_highlight_invalid']);
    expect(one('obstacle:0')).toEqual(['tut_highlight_invalid']);
    expect(one('debris:0')).toEqual(['tut_highlight_invalid']);
    expect(one('piece:k1_0', 5)).toEqual(['tut_highlight_invalid']); // truck block: startOn deliveryDone or segmentDone first
  });

  it('GDD 14.1 done and startOn events that can never happen in level 1 are tut_done_invalid', () => {
    const impossible: Step['done'][] = [
      { event: 'segmentDone' },
      { event: 'deliveryDone' },
      { event: 'gapPass' },
      { event: 'carouselTurn' },
      { event: 'yardFall' },
      { event: 'steered' },
      { event: 'landed', flag: 'glass' },
      { event: 'landed', wind: true },
      { event: 'obstacleHit', type: 'crate' },
      { event: 'obstacleHit', type: 'chain' },
      { event: 'itemCollected', type: 'key' },
      { event: 'placementCorrect', hidden: true },
      { event: 'yardMove', painted: true },
    ];
    for (const done of impossible) {
      expect(l17(withTutorial(1, [soft(['build'], done)])), JSON.stringify(done)).toEqual([
        'tut_done_invalid',
      ]);
      if ('event' in done)
        expect(
          l17(withTutorial(1, [soft(['build'], { event: 'turnEnd' }, { startOn: done })])),
          `startOn ${JSON.stringify(done)}`,
        ).toEqual(['tut_done_invalid']);
    }
    const possible: Step['done'][] = [
      { event: 'overWall' },
      { event: 'turnEnd' },
      { event: 'landed' },
      { event: 'placementCorrect' },
      { event: 'yardMove' },
      { event: 'tap' },
      { event: 'boosterUsed' },
      { event: 'holdOverBuild', minMs: 500 },
    ];
    for (const done of possible)
      expect(l17(withTutorial(1, [soft(['build'], done)])), JSON.stringify(done)).toEqual(
        // possible, but drag-speed dependent: a warning since Faz 2 tur 3 (LEVELS 5, L-17 `tut_hold_done`)
        'event' in done && done.event === 'holdOverBuild' ? ['tut_hold_done'] : [],
      );
    expect(l17(withTutorial(5, [soft(['build'], { event: 'segmentDone' })]))).toEqual([]);
    expect(l17(withTutorial(5, [soft(['build'], { event: 'deliveryDone' })]))).toEqual([]);
    expect(l17(withTutorial(4, [soft(['build'], { event: 'gapPass' })]))).toEqual([]);
    expect(l17(withTutorial(9, [soft(['build'], { event: 'gapPass' })]))).toEqual([]);
  });

  it('GDD 14.1/3 done.at must be in the event zone: yardMove a yard anchor (x ≤ Wy − 1, y ≤ Hy − 1), placementCorrect a site anchor (x Wy … Wy + Ws − 1, y ≤ H − 1); level 1 is 4 × 4 | 2 × 5', () => {
    const at = (event: 'yardMove' | 'placementCorrect', x: number, y: number): string[] =>
      l17(withTutorial(1, [soft(['build'], { event, at: [x, y] })]));
    expect(at('yardMove', 3, 3)).toEqual([]);
    expect(at('yardMove', 4, 0)).toEqual(['tut_done_invalid']);
    expect(at('yardMove', 0, 4)).toEqual(['tut_done_invalid']); // yard air row
    expect(at('placementCorrect', 4, 0)).toEqual([]);
    expect(at('placementCorrect', 5, 4)).toEqual([]);
    expect(at('placementCorrect', 3, 0)).toEqual(['tut_done_invalid']);
    expect(at('placementCorrect', 4, 5)).toEqual(['tut_done_invalid']); // crane row
  });

  // Faz 2R K-53: the required step and its GDD 14.1/4a highlight rules are gone (TECH §2R.3 "Silinenler"); a step is
  // always soft and a `mode` other than "soft" is `tut_blocking` (L-31)
  it('K-53 GDD 14.1/4a (removed in Faz 2R): a step with mode "required" is tut_blocking; a soft step may light cells and end on turnEnd', () => {
    const blocking = runJson(
      withTutorial(1, [soft(['piece:0'], { event: 'placementCorrect' }, { mode: 'required' })]),
      ['L-31'],
    );
    expect(blocking.map((i) => [i.code, i.rule])).toEqual([['tut_blocking', 'K-45/10']]);
    expect(l17(withTutorial(1, [soft(['cell:4,0', 'build'], { event: 'turnEnd' })]))).toEqual([]);
    const debrisLevel = (done: Step['done']): string[] =>
      l17({
        ...levelJson({
          id: 17,
          plan: ['WW', 'WW'],
          pieces: [['O4_0', 'W', 0, 0]],
          debris: [['B1_0', 'R', 6, 0]],
        }),
        tutorial: [soft(['debris:0'], done)],
      });
    expect(debrisLevel({ event: 'yardMove' })).toEqual([]);
    expect(debrisLevel({ event: 'placementCorrect' })).toEqual([]);
  });

  it('GDD 14.1/5 piece:k<p>_<i> is the startOn delivery block: p follows the delivery order (forSegment ascending), not the array order; count picks the n-th', () => {
    // batch 1 is delivered for segment 2, batch 2 for segment 1 → batch 2 arrives first.
    const make = (highlight: string, count?: number): unknown => ({
      ...levelJson({
        id: 35,
        plan: [['WW'], ['WW'], ['WW']],
        pieces: [['D2_90', 'W', 0, 0]],
        batches: [
          { forSegment: 2, pieces: [['D2_90', 'W', 0, 8, ['mortar']]] },
          { forSegment: 1, pieces: [['D2_90', 'W', 0, 8, ['mortar']]] },
        ],
      }),
      tutorial: [
        soft(
          [highlight],
          { event: 'turnEnd' },
          {
            startOn: { event: 'deliveryDone', flag: 'mortar', ...(count ? { count } : {}) },
          },
        ),
      ],
    });
    expect(l17(make('piece:k2_0'))).toEqual([]);
    expect(l17(make('piece:k1_0'))).toEqual(['tut_highlight_invalid']);
    expect(l17(make('piece:k1_0', 2))).toEqual([]);
    expect(l17(make('piece:k2_0', 2))).toEqual(['tut_highlight_invalid']);
  });

  it('GDD 14.1 booster:/pre: highlights need the item unlocked in this level (economy.json unlockLevel; brush → paintBrush, trowel → trowelStart, shutter → openShutter)', () => {
    const unlock = loadBoosterUnlock(ROOT);
    if (!unlock) throw new Error('config/economy.json missing');
    const names: [string, string][] = [
      ['booster:hammer', 'hammer'],
      ['booster:crane', 'crane'],
      ['booster:undo', 'undo'],
      ['booster:brush', 'paintBrush'],
      ['pre:thermos', 'thermos'],
      ['pre:trowel', 'trowelStart'],
      ['pre:shutter', 'openShutter'],
    ];
    for (const [h, key] of names) {
      const at = unlock[key];
      if (at === undefined) throw new Error(`economy.json has no boosters.${key}.unlockLevel`);
      const check = (id: number): string[] =>
        run(
          { id, plan: ['WW'], pieces: [['B1_0', 'W', 0, 0]], tutorial: [soft([h], { event: 'tap' })] },
          ['L-17'],
          { boosterUnlock: unlock },
        ).map((i) => i.code);
      expect(check(at), `${h} at ${at}`).toEqual([]);
      if (at > 1) expect(check(at - 1), `${h} at ${at - 1}`).toEqual(['tut_highlight_invalid']);
    }
  });

  it('GDD 14.1 textKey must exist in both tr.json and en.json (tut_key_missing names the missing language)', () => {
    const json = withTutorial(1, [soft(['build'], { event: 'turnEnd' }, { textKey: 'tut.m.onlyTr' })]);
    const issues = runJson(json, ['L-17'], {
      i18nKeys: { tr: new Set(['tut.m.onlyTr']), en: new Set<string>() },
    });
    expect(issues.map((i) => i.code)).toEqual(['tut_key_missing']);
    expect(issues[0]?.message).toContain('en');
    const real = loadI18nKeys(ROOT);
    if (!real) throw new Error('i18n files missing');
    for (const n of LEVEL_IDS)
      for (const st of readLevelJson(n).tutorial ?? [])
        expect([real.tr.has(st.textKey), real.en.has(st.textKey)], `level ${n} ${st.textKey}`).toEqual([
          true,
          true,
        ]);
  });

  it('GDD 14.1 steps are numbered 1, 2, … in order', () => {
    const steps = [soft(['build'], { event: 'turnEnd' }), soft(['build'], { event: 'turnEnd' }, { step: 3 })];
    expect(l17(withTutorial(1, steps)).length).toBe(1);
    steps[1] = soft(['build'], { event: 'turnEnd' }, { step: 2 });
    expect(l17(withTutorial(1, steps))).toEqual([]);
  });
});

// =====================================================================================================================
// L-18, L-24, L-25, L-26
// =====================================================================================================================

describe('review LEVELS §0 sawtooth (L-18), K-24 (L-24), K-23 (L-25), Y4 (L-26)', () => {
  it('LEVELS 0 difficulty sawtooth: hard = 10 15 25 35 45 49, superhard = 20 30 40 50 (warn), others easy or normal', () => {
    const saw = (id: number, difficulty: LevelInput['difficulty']): Issue[] =>
      run({ id, difficulty, plan: ['WW'], pieces: [['B1_0', 'W', 0, 0]] }, ['L-18']);
    expect(saw(15, 'hard')).toEqual([]);
    expect(saw(49, 'hard')).toEqual([]);
    expect(saw(50, 'superhard')).toEqual([]);
    expect(saw(5, 'normal')).toEqual([]);
    expect(saw(1, 'easy')).toEqual([]);
    for (const [id, d] of [
      [15, 'easy'],
      [20, 'hard'],
      [21, 'hard'],
      [11, 'superhard'],
      [40, 'normal'],
    ] as const) {
      expect(
        saw(id, d).map((i) => [i.code, i.severity]),
        `${id} ${d}`,
      ).toEqual([['difficulty_sawtooth', 'warn']]);
    }
  });

  it('K-24 elevator range 0 ≤ a < b ≤ 3 and a ≤ start ≤ b (start at a bound facing out is valid data)', () => {
    const elev = (range: [number, number], start: number, dir: 1 | -1 = 1): string[] =>
      codes(
        run({ id: 37, plan: ['WW'], pieces: [['B1_0', 'W', 0, 0]], elevator: { range, start, dir } }, [
          'L-24',
        ]),
      );
    expect(elev([0, 2], 2, 1)).toEqual([]); // GDD K-24 example
    expect(elev([0, 3], 0, -1)).toEqual([]);
    expect(elev([2, 2], 2)).toEqual(['elevator_range']);
    expect(elev([3, 1], 2)).toEqual(['elevator_range']);
    expect(elev([1, 3], 0)).toEqual(['elevator_range']);
  });

  it('K-23 carousel ⇔ carouselEvery: missing in carousel mode is an error, written in segments mode a warning', () => {
    const car = (mode: 'segments' | 'carousel', every?: number): [string, string][] =>
      run(
        {
          id: 31,
          mode,
          ...(every ? { carouselEvery: every } : {}),
          plan: [['WW'], ['WW']],
          pieces: [['B1_0', 'W', 0, 0]],
        },
        ['L-25'],
      ).map((i) => [i.code, i.severity]);
    expect(car('carousel', 3)).toEqual([]);
    expect(car('carousel')).toEqual([['carousel_every_missing', 'error']]);
    expect(car('segments', 3)).toEqual([['carousel_every_missing', 'warn']]);
    expect(car('segments')).toEqual([]);
  });

  it('Y4 wet ⇔ wetMoves on every block, truck batches included', () => {
    const wet = (p: PieceSpec, inTruck = false): string[] =>
      run(
        {
          id: 28,
          plan: [['WW'], ['WW']],
          pieces: inTruck ? [['B1_0', 'W', 0, 0]] : [p],
          batches: inTruck ? [{ forSegment: 1, pieces: [p] }] : [],
        },
        ['L-26'],
      ).map((i) => i.code);
    expect(wet(['D2_90', 'W', 0, 0, ['wet'], 3])).toEqual([]);
    expect(wet(['D2_90', 'W', 0, 0, ['wet']])).toEqual(['wet_moves_missing']);
    expect(wet(['D2_90', 'W', 0, 0, [], 3])).toEqual(['wet_moves_missing']);
    expect(wet(['D2_90', 'W', 0, 8, ['wet']], true)).toEqual(['wet_moves_missing']);
  });
});

// =====================================================================================================================
// levels/level_001…005.json against docs/LEVELS.md §0, §2
// =====================================================================================================================

describe('review K-03 plan rows of the level data', () => {
  it('K-03 GDD example (Faz 2R, level 1 plan `["WW","YY","WW","YW","YW"]`): rows top → bottom, (4,0) Y (5,0) W, (4,1) Y (5,1) W, (4,2)…(5,2) W, (4,3)…(5,3) Y, (4,4)…(5,4) W; the plan covers the whole 2 × 5 site', () => {
    const loaded = loadLevel(readLevelJson(1));
    if (!loaded.ok) throw new Error('level 1 does not load');
    const seg = loaded.level.segments[0];
    const at = (sx: number, sy: number): number | undefined => seg?.planColors[sy * 2 + sx];
    const W = COLOR_CODES.indexOf('W');
    const Y = COLOR_CODES.indexOf('Y');
    const want = [
      [Y, W],
      [Y, W],
      [W, W],
      [Y, Y],
      [W, W],
    ];
    want.forEach((row, sy) =>
      row.forEach((c, sx) => expect(at(sx, sy), `(${loaded.level.geo.siteX + sx},${sy})`).toBe(c)),
    );
    expect([loaded.level.geo.siteX, loaded.level.geo.ws, loaded.level.geo.hs]).toEqual([4, 2, 5]);
    expect(seg?.height).toBe(5);
    expect(seg?.planColors.length).toBe(10);
  });
});

describe('review K-45 levels 1–10 through the whole validator', () => {
  it('K-45 levels 1–10 pass every validate check (L-01…L-18, L-21…L-31) in sequence (mechanic history, real tr/en keys and economy unlocks): no error, no warning', () => {
    const i18nKeys = loadI18nKeys(ROOT);
    const boosterUnlock = loadBoosterUnlock(ROOT);
    expect(i18nKeys).not.toBeNull();
    expect(boosterUnlock).not.toBeNull();
    const previous = new Set<MechanicId>();
    for (const n of LEVEL_IDS) {
      const res = validateLevelJson(readLevelJson(n), {
        fileId: n,
        previousMechanics: new Set(previous),
        ...(i18nKeys ? { i18nKeys } : {}),
        ...(boosterUnlock ? { boosterUnlock } : {}),
      });
      expect(res.issues, `level ${n}`).toEqual([]);
      if (res.level) for (const m of deriveMechanics(res.level)) previous.add(m);
      // the game load path accepts it too
      expect(loadLevel(readLevelJson(n)).ok, `level ${n} loadLevel`).toBe(true);
    }
  });

  it('K-45/9 npm run levels:validate on levels/ exits 0; --level 4 still uses levels 1–3 as mechanic history (only W1 is new)', () => {
    const cli = (...args: string[]): { code: number | null; out: string } => {
      const r = spawnSync(process.execPath, [join(ROOT, 'tools', 'validate-levels.ts'), ...args], {
        cwd: ROOT,
        encoding: 'utf8',
      });
      return { code: r.status, out: `${r.stdout}${r.stderr}` };
    };
    const all = cli();
    expect(all.code, all.out).toBe(0);
    for (const line of [
      'level_001.json  OK\n',
      'level_002.json  OK\n',
      'level_003.json  OK\n',
      'level_004.json  OK  mechanics: W1\n',
      'level_005.json  OK  mechanics: S1\n',
      'level_006.json  OK  mechanics: W2\n',
      'level_008.json  OK  mechanics: Y5\n',
      'level_009.json  OK  mechanics: W1 W3\n',
    ])
      expect(all.out).toContain(line);
    expect(all.out).toContain('10 file(s), 0 error(s), 0 warning(s)');
    const four = cli('--level', '4');
    expect(four.code, four.out).toBe(0);
    expect(four.out).toContain('level_004.json  OK  mechanics: W1\n');
    expect(four.out).toContain('1 file(s), 0 error(s)');
  });

  it('K-45/1 a level file name number must equal its id (L-01 id_mismatch otherwise)', () => {
    const json = readLevelJson(2);
    expect(errorCodes(runJson(json, ['L-01'], { fileId: 3 }))).toEqual(['id_mismatch']);
    expect(runJson(json, ['L-01'], { fileId: 2 })).toEqual([]);
  });
});

// =====================================================================================================================
// Round 2 — TECH L-10 / GDD K-27 whole-block material check (the round-1 fix) and gaps of round 1
// =====================================================================================================================

/** `[code, path]` of the L-10 issues of a builder level. */
const l10 = (spec: LevelSpec, only: readonly CheckId[] = ['L-10']): [string, string][] =>
  run(spec, only).map((i) => [i.code, i.path]);

/**
 * Independent count of GDD K-47 (TECH L-30 / L-10) for levels without paint gates: per-colour totals of the plan cells
 * of every segment against the cells of every material block (Ağır Yük I5/Q9 excluded, debris included) → `mismatch`;
 * in `segments` mode, for every colour, the first prefix k < S − 1 whose plan cells exceed the blocks of batches with
 * forSegment ≤ k and the debris of segments ≤ k → `prefix` (data paths, each colour once, TECH §2R.3 note 4).
 */
function coverOracle(json: LevelInput): { mismatch: boolean; prefix: string[] } {
  const cargo = (id: ShapeId): boolean => ['I5', 'Q9'].includes(shapeById(id).kind);
  const segs = json.build.segments;
  const demand = (k: number): Map<string, number> => {
    const m = new Map<string, number>();
    for (const sg of segs.slice(0, k + 1))
      for (const row of sg.rows) for (const ch of row) m.set(ch, (m.get(ch) ?? 0) + 1);
    return m;
  };
  const supply = (k: number): Map<string, number> => {
    const m = new Map<string, number>();
    const add = (shape: ShapeId, color: string | undefined): void => {
      if (cargo(shape) || color === undefined) return;
      m.set(color, (m.get(color) ?? 0) + shapeById(shape).cells.length);
    };
    for (const b of json.yard.batches) if (b.forSegment <= k) for (const p of b.pieces) add(p.shape, p.color);
    for (const d of json.build.debris ?? []) if ((d.segment ?? 0) <= k) add(d.shape, d.color);
    return m;
  };
  const last = segs.length - 1;
  const need = demand(last);
  const have = supply(last);
  const colours = new Set([...need.keys(), ...have.keys()]);
  const mismatch = [...colours].some((c) => (need.get(c) ?? 0) !== (have.get(c) ?? 0));
  const prefix = new Set<string>();
  if (json.build.mode === 'segments')
    for (const c of colours)
      for (let k = 0; k < last; k++)
        if ((demand(k).get(c) ?? 0) > (supply(k).get(c) ?? 0)) {
          prefix.add(`build.segments[${k}]`);
          break;
        }
  return { mismatch, prefix: [...prefix].sort() };
}

describe('review round 2: K-27 material (TECH L-10) after the whole-block fix', () => {
  it('K-47 item 2 (TECH L-10 cover_prefix_short) is cumulative per segment: a truck batch for segment 1 cannot pay for segment 0; carousel checks only the totals', () => {
    // segment 0 needs 8 W and batch 0 brings 4 W; batch 1 (segment 1) brings the other 4 W and the 8 Y of segment 1
    const four = (c: string): string[] => [`${c}${c}`, `${c}${c}`, `${c}${c}`, `${c}${c}`];
    const spec = (mode: 'segments' | 'carousel', early: boolean): LevelSpec => ({
      id: mode === 'segments' ? 5 : 31,
      mode,
      ...(mode === 'carousel' ? { carouselEvery: 3 } : {}),
      site: { cols: 2, rows: 4 },
      plan: [four('W'), four('Y')],
      pieces: early
        ? [
            ['O4_0', 'W', 0, 0],
            ['O4_0', 'W', 2, 0],
          ]
        : [['O4_0', 'W', 0, 0]],
      batches: [
        {
          forSegment: 1,
          pieces: [
            ...(early ? [] : ([['O4_0', 'W', 4, 8]] as PieceSpec[])),
            ['O4_0', 'Y', 0, 8],
            ['O4_0', 'Y', 2, 8],
          ],
        },
      ],
    });
    expect(l10(spec('segments', false), ['L-10', 'L-30'])).toEqual([
      ['cover_prefix_short', 'build.segments[0]'],
    ]);
    expect(run(spec('segments', false), ['L-10'])[0]?.rule).toBe('K-45/8');
    expect(l10(spec('carousel', false), ['L-10', 'L-30'])).toEqual([]);
    expect(l10(spec('segments', true), ['L-10', 'L-30'])).toEqual([]);
  });

  it('K-47 item 2 the shortage shows at the first segment whose cumulative demand exceeds the supply (only k < S − 1; the last prefix is the L-30 total); a truck for that segment fixes it', () => {
    // W 8 | W 8 | Y 8; batch 0: 8 W. late: batch 1 brings the Y, batch 2 the second 8 W → prefix 1 needs 16 W, has 8
    const four = (c: string): string[] => [`${c}${c}`, `${c}${c}`, `${c}${c}`, `${c}${c}`];
    const two = (c: ColorCode): PieceSpec[] => [
      ['O4_0', c, 0, 8],
      ['O4_0', c, 2, 8],
    ];
    const spec = (late: boolean): LevelSpec => ({
      id: 5,
      site: { cols: 2, rows: 4 },
      plan: [four('W'), four('W'), four('Y')],
      pieces: [
        ['O4_0', 'W', 0, 0],
        ['O4_0', 'W', 2, 0],
      ],
      batches: late
        ? [
            { forSegment: 1, pieces: two('Y') },
            { forSegment: 2, pieces: two('W') },
          ]
        : [
            { forSegment: 1, pieces: two('W') },
            { forSegment: 2, pieces: two('Y') },
          ],
    });
    expect(run(spec(true), ['L-10', 'L-30']).map((i) => [i.code, i.rule, i.severity, i.path])).toEqual([
      ['cover_prefix_short', 'K-45/8', 'error', 'build.segments[1]'],
    ]);
    expect(l10(spec(false), ['L-10', 'L-30'])).toEqual([]);
  });

  // Faz 2R K-47 item 1: with a W6 paint gate the validator checks the total cell count only (which block fits which gate
  // is the solver's colour balance; "K-47 item 1 with a W6 paint gate …" above). The Faz 2 per-gate fit (D2_0 needs
  // size ≥ 2), "heavy never supply for a gate", the two-gate "her blok bir kez" and "only way is the paint gate" L-10
  // tests left with `material_short`; Ağır Yük is covered by "K-27 K-47 Ağır Yük is not supply".

  it('K-47 K-32 resolved `?` cells are demand in their resolved colour: GDD repeat p = 2 `["??","??","YW","WY"]` needs 4 W and 4 Y', () => {
    const hidden = (pieces: PieceSpec[]): [string, string][] =>
      l10(
        {
          id: 27,
          site: { cols: 2, rows: 4 },
          plan: ['??', '??', 'YW', 'WY'],
          hidden: [{ kind: 'repeat', period: 2 }],
          pieces,
        },
        ['L-10', 'L-30'],
      );
    const w4: PieceSpec[] = [
      ['D2_90', 'W', 0, 0],
      ['D2_90', 'W', 2, 0],
    ];
    expect(hidden([...w4, ['D2_90', 'Y', 0, 1], ['B1_0', 'Y', 2, 1]])).toEqual([['cover_mismatch', 'level']]);
    expect(hidden([...w4, ['D2_90', 'Y', 0, 1], ['D2_90', 'Y', 2, 1]])).toEqual([]);
  });

  // Faz 2R: `.` cells are refused (L-05 plan_has_window, S2 out of the MVP) and L-11 is D3a on the start state without
  // an access search (TECH §2R.3 note 5), so the Faz 2 "a cell above a window needs an aligned gap" L-11 test left.

  it.each(LEVEL_IDS)(
    'K-47 TECH L-10 + L-30 level %i: the verdict equals an independent count for the level as written, every one-block removal, every block moved to the next batch and every plan-cell recolouring',
    (n) => {
      const base = readLevelJson(n);
      expect(base.build.mode).toBe('segments');
      expect(base.wall.gaps.every((g) => g.type !== 'paint')).toBe(true);
      const variants: [string, LevelInput][] = [['as written', base]];
      base.yard.batches.forEach((b, bi) =>
        b.pieces.forEach((p, pi) => {
          const v = structuredClone(base);
          v.yard.batches[bi]?.pieces.splice(pi, 1);
          variants.push([`without batches[${bi}].pieces[${pi}] ${p.shape} ${p.color ?? '-'}`, v]);
          const next = base.yard.batches[bi + 1];
          if (next && b.pieces.length > 1) {
            const w = structuredClone(base);
            const [moved] = w.yard.batches[bi]?.pieces.splice(pi, 1) ?? [];
            if (moved) w.yard.batches[bi + 1]?.pieces.push({ ...moved, y: base.yard.rows ?? 8 });
            variants.push([`batches[${bi}].pieces[${pi}] moved to batch ${bi + 1}`, w]);
          }
        }),
      );
      base.build.segments.forEach((sg, si) =>
        sg.rows.forEach((row, ri) =>
          [...row].forEach((ch, ci) => {
            for (const c of ['W', 'Y', 'G', 'R'] as const) {
              if (ch === c) continue;
              const v = structuredClone(base);
              const seg = v.build.segments[si];
              if (!seg) continue;
              seg.rows[ri] = `${row.slice(0, ci)}${c}${row.slice(ci + 1)}`;
              variants.push([`segment ${si} row ${ri} col ${ci} → ${c}`, v]);
            }
          }),
        ),
      );
      let broken = 0;
      for (const [what, v] of variants) {
        const want = coverOracle(v);
        const issues = runJson(v, ['L-10', 'L-30']);
        const where = `level ${n} ${what}`;
        expect(
          issues.every((i) => i.code === 'cover_mismatch' || i.code === 'cover_prefix_short'),
          where,
        ).toBe(true);
        expect(
          issues.some((i) => i.code === 'cover_mismatch'),
          `${where}: totals`,
        ).toBe(want.mismatch);
        expect(
          [...new Set(issues.filter((i) => i.code === 'cover_prefix_short').map((i) => i.path))].sort(),
          `${where}: prefixes`,
        ).toEqual(want.prefix);
        if (want.mismatch || want.prefix.length > 0) broken++;
      }
      expect(coverOracle(base)).toEqual({ mismatch: false, prefix: [] });
      expect(broken).toBeGreaterThan(variants.length / 2);
    },
  );
});

describe('review round 2: gaps of round 1 (K-45/9, K-32, K-25, GDD 14.1/5, K-45/5, schema limits)', () => {
  const l17 = (json: unknown): string[] => runJson(json, ['L-17']).map((i) => i.code);

  it('K-45/10 GDD example (Faz 2R): a size-1 gap in level 4 makes the derived new mechanics {W1, W3} → too_many_new_mechanics', () => {
    const history = new Set<MechanicId>();
    for (const n of [1, 2, 3]) {
      const lvl = validateLevelJson(readLevelJson(n)).level;
      if (!lvl) throw new Error(`level ${n} fails the schema`);
      for (const m of deriveMechanics(lvl)) history.add(m);
    }
    expect([...history]).toEqual([]);
    const json = readLevelJson(4);
    const gap = json.wall.gaps[0];
    if (!gap) throw new Error('level 4 has no gap');
    gap.size = 1;
    const res = validateLevelJson(json, { only: ['L-22'], previousMechanics: history });
    expect(res.issues.map((i) => [i.code, i.rule])).toEqual([['too_many_new_mechanics', 'K-45/10']]);
    if (!res.level) throw new Error('schema');
    expect(
      deriveMechanics(res.level)
        .filter((m) => !history.has(m))
        .sort(),
    ).toEqual(['W1', 'W3']);
    // the smaller gap itself is fine under K-04 (y 0 + size 1 ≤ height 4 − 1)
    expect(runJson(json, ['L-09'])).toEqual([]);
  });

  it('K-32 a `?` needs a hidden rule in its segment, and a mirrorOf `?` that lands on a `.` is invalid ("`.` hücresi hiçbir zaman gizli değildir")', () => {
    expect(codes(run({ id: 27, plan: ['?W', 'WW'], pieces: [['B1_0', 'W', 0, 0]] }, ['L-08']))).toEqual([
      'hidden_invalid',
    ]);
    const mirror = (target: string): string[] =>
      codes(
        run(
          {
            id: 29,
            plan: [[target], ['?R']],
            hidden: [undefined, { kind: 'mirrorOf', segment: 0 }],
            pieces: [['B1_0', 'W', 0, 0]],
          },
          ['L-08'],
        ),
      );
    // segment 1 (6,0) `?` takes segment 0 (7,0): `.` → invalid, Y → valid
    expect(mirror('W.')).toEqual(['hidden_invalid']);
    expect(mirror('WY')).toEqual([]);
  });

  it('K-25 TECH L-12 batch 0 is the start batch of segment 0 ("parti 0 dilim 0 için var"): forSegment 1 on batch 0 is batch_invalid', () => {
    const json = levelJson({
      id: 5,
      plan: [['WW'], ['WW']],
      pieces: [['D2_90', 'W', 0, 0]],
      batches: [{ forSegment: 1, pieces: [['D2_90', 'W', 0, 8]] }],
    });
    expect(runJson(json, ['L-12'])).toEqual([]);
    batchOf(json, 0).forSegment = 1;
    expect(runJson(json, ['L-12']).map((i) => [i.code, i.path])).toEqual([
      ['batch_invalid', 'yard.batches[0]'],
    ]);
  });

  it('GDD 14.1/5 TECH L-17 carousel: for piece:k<p>_<i> only the startOn filter is checked (delivery order depends on the player); a block without the flag stays invalid', () => {
    const make = (highlight: string, mode: 'segments' | 'carousel'): unknown => ({
      ...levelJson({
        id: 35,
        mode,
        ...(mode === 'carousel' ? { carouselEvery: 3 } : {}),
        plan: [['WW'], ['WW'], ['WW']],
        pieces: [['D2_90', 'W', 0, 0]],
        batches: [
          { forSegment: 1, pieces: [['D2_90', 'W', 0, 8, ['mortar']]] },
          {
            forSegment: 2,
            pieces: [
              ['D2_90', 'W', 0, 8, ['mortar']],
              ['B1_0', 'W', 2, 8],
            ],
          },
        ],
      }),
      tutorial: [
        soft([highlight], { event: 'turnEnd' }, { startOn: { event: 'deliveryDone', flag: 'mortar' } }),
      ],
    });
    expect(l17(make('piece:k1_0', 'carousel'))).toEqual([]);
    expect(l17(make('piece:k2_0', 'carousel'))).toEqual([]);
    expect(l17(make('piece:k2_1', 'carousel'))).toEqual(['tut_highlight_invalid']);
    // segments mode keeps the order rule: the first mortar delivery is batch 1
    expect(l17(make('piece:k1_0', 'segments'))).toEqual([]);
    expect(l17(make('piece:k2_0', 'segments'))).toEqual(['tut_highlight_invalid']);
  });

  it('GDD 14.1 TECH L-17 deliveryDone.flag needs a truck (k ≥ 1) block with that flag: a flagged batch-0 block is not enough (done and startOn)', () => {
    const make = (truckFlag: boolean, done: Step['done'], startOn?: Step['startOn']): unknown => ({
      ...levelJson({
        id: 35,
        plan: [['WW'], ['WW']],
        pieces: [['D2_90', 'W', 0, 0, truckFlag ? [] : ['mortar']]],
        batches: [{ forSegment: 1, pieces: [['D2_90', 'W', 0, 8, truckFlag ? ['mortar'] : []]] }],
      }),
      tutorial: [soft(['truck'], done, startOn ? { startOn } : {})],
    });
    const flagged = { event: 'deliveryDone', flag: 'mortar' } as const;
    expect(l17(make(false, flagged))).toEqual(['tut_done_invalid']);
    expect(l17(make(false, { event: 'turnEnd' }, flagged))).toEqual(['tut_done_invalid']);
    expect(l17(make(false, { event: 'deliveryDone' }))).toEqual([]);
    expect(l17(make(true, flagged))).toEqual([]);
    expect(l17(make(true, { event: 'turnEnd' }, flagged))).toEqual([]);
  });

  it('GDD 14.1 TECH L-17 piece:k<p>_<i> needs 1 ≤ p < batch count and i < that batch size (level 5: k1_3 valid; k1_4 and k2_0 invalid)', () => {
    const one = (h: string): string[] =>
      l17(withTutorial(5, [soft([h], { event: 'turnEnd' }, { startOn: { event: 'deliveryDone' } })]));
    expect(batchOf(readLevelJson(5), 1).pieces.length).toBe(4);
    expect(one('piece:k1_0')).toEqual([]);
    expect(one('piece:k1_3')).toEqual([]);
    expect(one('piece:k1_4')).toEqual(['tut_highlight_invalid']);
    expect(one('piece:k2_0')).toEqual(['tut_highlight_invalid']);
  });

  // Faz 2R: "ağır şekil" = Ağır Yük (I5/Q9), which never is debris (K-44: only in the yard → shape_forbidden); a 3-wide
  // material debris is `piece_too_wide` on a 2-column site (K-44) and leaves x 6–7 (K-45/7) — no flag rule any more
  it('K-45/5 OBSTACLES flag table "debris × ağır şekil ✗ (moloz ≤ 2 geniş)" in Faz 2R: Q9/I5 debris is shape_forbidden, 3-wide debris piece_too_wide and debris_misplaced, 2-wide debris valid', () => {
    const debris = (shape: ShapeId, only: readonly CheckId[]): string[] =>
      codes(
        run(
          { id: 41, plan: ['WW', 'WW', 'WW'], pieces: [['B1_0', 'W', 0, 0]], debris: [[shape, 'R', 6, 0]] },
          only,
        ),
      );
    expect(debris('Q9_0', ['L-04'])).toEqual(['shape_forbidden']);
    expect(debris('I5_0', ['L-04'])).toEqual(['shape_forbidden']);
    expect(debris('I3_90', ['L-04'])).toEqual(['piece_too_wide']);
    expect(debris('I3_90', ['L-21'])).toEqual([]);
    expect(debris('D2_90', ['L-04', 'L-21'])).toEqual([]);
    expect(debris('O4_0', ['L-04', 'L-21', 'L-13'])).toEqual([]);
    expect(debris('I3_90', ['L-13'])).toEqual(['debris_misplaced']);
  });

  it('K-45/3 wall limits are schema errors: height 9, paint gate without colour, shutter period 0, slider range start −1, locked gate without keyId', () => {
    const base = (): LevelInput =>
      levelJson({
        id: 30,
        wall: { height: 6 },
        plan: ['WW'],
        pieces: [['B1_0', 'W', 0, 0]],
        obstacles: [{ type: 'key', x: 0, y: 0, id: 'a' }],
      });
    const schemaOnly = (json: LevelInput): string[] => codes(runJson(json, []));
    expect(schemaOnly(base())).toEqual([]);
    const tall = base();
    tall.wall.height = 9;
    expect(schemaOnly(tall)).toEqual(['schema_invalid']);
    const top = base();
    top.wall.height = 8;
    expect(schemaOnly(top)).toEqual([]);
    const badGaps: unknown[] = [
      { type: 'paint', y: 1, size: 2 },
      { type: 'shutter', y: 1, size: 2, period: 0 },
      { type: 'slider', y: 1, size: 1, range: [-1, 2] },
      { type: 'locked', y: 1, size: 1 },
    ];
    for (const g of badGaps) {
      const json = base();
      Object.assign(json.wall, { gaps: [g] });
      expect(schemaOnly(json), JSON.stringify(g)).toEqual(['schema_invalid']);
    }
    const okGaps: LevelInput['wall']['gaps'] = [
      { type: 'paint', y: 1, size: 2, color: 'W' },
      { type: 'shutter', y: 1, size: 2, period: 1 },
      { type: 'slider', y: 1, size: 1, range: [0, 2] },
      { type: 'locked', y: 1, size: 1, keyId: 'a' },
    ];
    for (const g of okGaps) {
      const json = base();
      json.wall.gaps = [g];
      expect(schemaOnly(json), JSON.stringify(g)).toEqual([]);
    }
  });

  it('K-45/2 K-45/6 obstacles lie in the yard (x 0–5, y 0–7) and a crate has hp 1–3 (OBSTACLES Y1): x 6, y 8, hp 0, hp 4 and a missing hp are refused', () => {
    const withObstacle = (o: Record<string, unknown>): string[] => {
      const json = levelJson({ id: 11, plan: ['WW'], pieces: [['B1_0', 'W', 0, 0]] });
      Object.assign(json, { obstacles: [o] });
      return errorCodes(runJson(json, ['L-14']));
    };
    expect(withObstacle({ type: 'crate', x: 5, y: 7, hp: 3 })).toEqual([]);
    expect(withObstacle({ type: 'crate', x: 0, y: 0, hp: 1 })).toEqual([]);
    for (const bad of [
      { type: 'crate', x: 6, y: 0, hp: 1 },
      { type: 'crate', x: 0, y: 8, hp: 1 },
      { type: 'crate', x: 0, y: 0, hp: 0 },
      { type: 'crate', x: 0, y: 0, hp: 4 },
      { type: 'crate', x: 0, y: 0 },
    ])
      expect(withObstacle(bad), JSON.stringify(bad)).toEqual(['schema_invalid']);
  });

  it('K-45/10 OBSTACLES "Veri imzası" (Faz 2R): every one of the 27 signatures derives exactly its mechanic from a minimal level (W2 = height H, Y5 = I5/Q9, S9 = site.cols ≥ 3; S2 is out of the table)', () => {
    const base: LevelSpec = { id: 41, wall: { height: 4 }, plan: ['WW'], pieces: [['B1_0', 'W', 0, 0]] };
    const derive = (extra: Partial<LevelSpec>): string[] =>
      deriveMechanics(level({ ...base, ...extra })).sort();
    expect(derive({})).toEqual([]);
    const gap = (g: LevelInput['wall']['gaps'][number]): Partial<LevelSpec> => ({
      wall: { height: 4, gaps: [g] },
    });
    const two: Partial<LevelSpec> = { plan: [['WW'], ['WW']] };
    const cases: [string, Partial<LevelSpec>, string[]][] = [
      ['W1', gap({ type: 'static', y: 0, size: 2 }), ['W1']],
      ['W2', { wall: { height: 8 } }, ['W2']], // default board: H = 8
      [
        'W2 small board',
        { yard: { cols: 4, rows: 4 }, site: { cols: 2, rows: 5 }, wall: { height: 5 } },
        ['W2'],
      ],
      ['not W2', { yard: { cols: 4, rows: 4 }, site: { cols: 2, rows: 5 }, wall: { height: 4 } }, []],
      ['W3 static', gap({ type: 'static', y: 0, size: 1 }), ['W1', 'W3']],
      ['W3 shutter', gap({ type: 'shutter', y: 0, size: 1, period: 2 }), ['W3', 'W4']],
      ['W4', gap({ type: 'shutter', y: 0, size: 2, period: 2 }), ['W4']],
      ['W5', gap({ type: 'slider', y: 0, size: 1, range: [0, 1] }), ['W3', 'W5']],
      [
        'W5 size 2',
        { wall: { height: 6, gaps: [{ type: 'slider', y: 0, size: 2, range: [0, 1] }] } },
        ['W5'],
      ],
      ['W6', gap({ type: 'paint', y: 0, size: 2, color: 'W' }), ['W6']],
      [
        'W7',
        {
          ...gap({ type: 'locked', y: 0, size: 2, keyId: 'a' }),
          obstacles: [{ type: 'key', x: 0, y: 0, id: 'a' }],
        },
        ['W7'],
      ],
      ['W8', { wall: { height: 4, fan: 'left' } }, ['W8']],
      ['Y1', { obstacles: [{ type: 'crate', x: 3, y: 3, hp: 1 }] }, ['Y1']],
      ['Y2', { obstacles: [{ type: 'cement_bag', x: 3, y: 3 }] }, ['Y2']],
      ['Y3 batch 0', { pieces: [['B1_0', 'W', 0, 0, ['chained']]] }, ['Y3']],
      [
        'Y3 truck',
        { ...two, batches: [{ forSegment: 1, pieces: [['B1_0', 'W', 0, 8, ['chained']]] }] },
        ['S1', 'Y3'],
      ],
      ['Y4', { pieces: [['B1_0', 'W', 0, 0, ['wet'], 2]] }, ['Y4']],
      ['Y5 Q9', { pieces: [['Q9_0', 'W', 0, 0]] }, ['Y5']],
      ['Y5 I5', { pieces: [['I5_0', 'W', 0, 0]] }, ['Y5']],
      ['not Y5: a 3-wide material block', { pieces: [['I3_90', 'W', 0, 0]] }, []],
      ['Y6', { gravity: { yard: true } }, ['Y6']],
      ['Y7', { obstacles: [{ type: 'screw', x: 0, y: 0 }] }, ['Y7']],
      ['Y8', { pieces: [['B1_0', 'W', 0, 0, ['mortar']]] }, ['Y8']],
      ['S1', two, ['S1']],
      ['S2 (MVP dışı)', { plan: ['W.'] }, []],
      ['S3', { pieces: [['B1_0', 'W', 0, 0, ['glass']]] }, ['S3']],
      ['S4', { plan: ['WW', 'WW'], debris: [['B1_0', 'R', 6, 0]] }, ['S4']],
      ['S5', { ...two, mode: 'carousel', carouselEvery: 3 }, ['S5']],
      ['S6', { elevator: { range: [0, 1], start: 0, dir: 1 } }, ['S6']],
      ['S7-R', { plan: ['??', 'WY'], hidden: [{ kind: 'repeat', period: 1 }] }, ['S7-R']],
      [
        'S7-M',
        { plan: [['WY'], ['?R']], hidden: [undefined, { kind: 'mirrorOf', segment: 0 }] },
        ['S1', 'S7-M'],
      ],
      ['S8', { pieces: [['B1_0', 'W', 0, 0, ['balloon']]] }, ['S8']],
      ['S9', { yard: { cols: 5 }, site: { cols: 3 }, plan: ['WWW'] }, ['S9']],
      ['G-H', { gravity: { build: 'high' } }, ['G-H']],
      ['G-L', { gravity: { build: 'low' } }, ['G-L']],
    ];
    const covered = new Set<string>();
    for (const [name, extra, want] of cases) {
      expect(derive(extra), name).toEqual([...want].sort());
      for (const m of want) covered.add(m);
    }
    expect(covered.size).toBe(27);
    expect(covered.has('S2')).toBe(false);
  });
});

// =====================================================================================================================
// Round 3 — the K-05 box-height rule the round-2 movement fix touched, seen from the validator (L-10 / L-11 reach),
// an independent L-11 oracle, W6 paint routes, debris, K-32 examples and the LEVELS §0 / §2 claims about levels 1–5
// =====================================================================================================================

/** Box height of a shape from its cells (BRIEF §5 cells were checked against shapes.ts in round 1). */
const boxH = (id: ShapeId): number => Math.max(...shapeById(id).cells.map((c) => c.y)) + 1;
/** OBSTACLES Y5 / GDD K-44 (Faz 2R): Ağır Yük = kind I5 / Q9 in any orientation. */
const isHeavyByText = (id: ShapeId): boolean => {
  const s = shapeById(id);
  return s.kind === 'I5' || s.kind === 'Q9';
};

/**
 * GDD K-05 ("dikey hücre dizisi `10 − height` satırı aşamaz"), K-12 ("bloğun bütün satırları geçidin satır aralığında")
 * and OBSTACLES Y5 ("Duvar sınırını geçemez (ne serbest ne ray kipinde)"): over the wall / through some gap.
 */
function reachByText(
  id: ShapeId,
  height: number,
  gapSizes: readonly number[],
): { free: boolean; rail: boolean } {
  if (isHeavyByText(id)) return { free: false, rail: false };
  const h = boxH(id);
  return { free: h <= 10 - height, rail: gapSizes.some((size) => h <= size) };
}

describe('review round 3: K-05 box-height rule (round-2 movement fix) seen from the validator', () => {
  it('K-05 K-12 Y5 every shape × wall height 0–8 × gap size: canReachSite and the drag engine (site nodes) agree with the K-05 / K-12 text (Faz 2R: Ağır Yük never crosses; a material orientation wider than Ws = 2 cannot be in the data)', () => {
    let free = 0;
    let railOnly = 0;
    let never = 0;
    for (const s of SHAPES) {
      if (s.id === 'I5_90' || s.id === 'I5_270') continue; // forbidden in level data (K-44)
      if (!isHeavyByText(s.id) && s.w > 2) continue; // piece_too_wide on the 2-column site (K-44)
      for (let height = 0; height <= 8; height++) {
        // one static gap at row 0 of every legal size (K-04: y + size ≤ height − 1), or none
        const options: number[][] = [[]];
        for (let size = 1; size <= height - 1; size++) options.push([size]);
        for (const sizes of options) {
          const lvl = level({
            id: 41,
            wall: { height, gaps: sizes.map((size) => ({ type: 'static' as const, y: 0, size })) },
            plan: ['WW'],
            pieces: [[s.id, 'W', 0, 0]],
          });
          const where = `${s.id} height ${height} gap ${sizes.join() || '—'}`;
          const want = reachByText(s.id, height, sizes);
          const compiled = compile(lvl);
          const id = compiled.tutorialPieceIds.get('piece:0');
          if (id === undefined) throw new Error('piece:0 missing');
          const attempt = tryBeginDrag(createInitialState(compiled), id);
          if (!attempt.ok)
            throw new Error(`${where}: a lone block in an empty yard is not pickable (${attempt.reason})`);
          const kinds = new Set(
            attempt.session.reachableNodes().map((n) => attempt.session.classify(n).kind),
          );
          expect({ free: kinds.has('siteFree'), rail: kinds.has('siteRail') }, `${where}: engine`).toEqual(
            want,
          );
          const reach = want.free || want.rail;
          expect(canReachSite(s, lvl), `${where}: canReachSite`).toBe(reach);
          if (want.free) free++;
          else if (want.rail) railOnly++;
          else never++;
        }
      }
    }
    // the sweep really exercises all three outcomes
    expect(Math.min(free, railOnly, never)).toBeGreaterThan(50);
    // GDD K-05 example: height 8 I3_0 never crosses; height 7 it does (cells 7, 8, 9 ≥ 7)
    expect(reachByText('I3_0', 8, [])).toEqual({ free: false, rail: false });
    expect(reachByText('I3_0', 7, [])).toEqual({ free: true, rail: false });
  });
});

describe('review round 3: K-47 / K-30 D3a tiling (TECH L-11, Faz 2R)', () => {
  // Faz 2R: L-11 is the K-30 D3a tiling search on the start state (no access search, no `.`); its independent oracle is
  // tests/core/deadlock.test.ts "K-30 D3a equals an independent oracle … on 400 seeded plans", and L-11 = `tileLevel` on
  // the level data is tests/level/validator.test.ts. The Faz 2 bottom-up access oracle (W1 rails, windows) left with it.

  it('K-30 D3a W6 joker (TECH L-11, §2R.4 step 1): a Y block whose box height fits the P paint gate may become P, so the level tiles; a gate too small for it is untileable; without a gate the colours do not cover (cover_mismatch)', () => {
    const spec = (gaps: NonNullable<LevelSpec['wall']>['gaps']): LevelSpec => ({
      id: 22,
      site: { cols: 2, rows: 4 },
      wall: { height: 6, gaps },
      plan: ['PP', 'PP', 'WW', 'WW'],
      pieces: [
        ['O4_0', 'W', 0, 0],
        ['O4_0', 'Y', 2, 0],
      ],
    });
    const gate = (size: number) => [{ type: 'paint' as const, y: 1, size, color: 'P' as const }];
    expect(run(spec(gate(2)), ['L-09', 'L-10', 'L-11', 'L-30'])).toEqual([]);
    expect(codes(run(spec(gate(1)), ['L-10', 'L-11', 'L-30']))).toEqual(['untileable']);
    expect(codes(run(spec([]), ['L-10', 'L-11', 'L-30']))).toEqual(['cover_mismatch']);
  });
});

// --- debris, K-32 examples, K-02 / K-44 boundaries -------------------------------------------------------------------

describe('review round 3: debris, K-32 worked examples, boundaries', () => {
  it('K-47 debris is supply (OBSTACLES S4 Faz 2R): plan from the bottom RR, WW, WW, WW with a W debris D2_90 on the R row — the R yard block + the debris + an O4 W cover it exactly and it tiles; without the debris W is short', () => {
    const base: LevelSpec = {
      id: 17,
      site: { cols: 2, rows: 4 },
      plan: ['WW', 'WW', 'WW', 'RR'],
      pieces: [
        ['D2_90', 'R', 0, 0],
        ['O4_0', 'W', 2, 0],
      ],
      debris: [['D2_90', 'W', 6, 0]],
    };
    expect(run(base, ['L-10', 'L-11', 'L-29', 'L-30'])).toEqual([]);
    const noDebris = { ...base, debris: [] };
    expect(codes(run(noDebris, ['L-10', 'L-30']))).toEqual(['cover_mismatch']);
    // the debris may not start correct (L-29): on a bottom W row it would be (colour and K-34 support hold)
    expect(codes(run({ ...base, plan: ['RR', 'WW', 'WW', 'WW'] }, ['L-29']))).toEqual([
      'debris_correct_at_start',
    ]);
  });

  it('K-31 debris colours join the colour set: level 5 (limit 3) with plan W/Y/G and one R debris has 4 colours → too_many_colors', () => {
    const spec = (debrisColor: ColorCode): LevelSpec => ({
      id: 5,
      plan: ['WY', 'GG'],
      pieces: [['B1_0', 'W', 0, 0]],
      debris: [['B1_0', debrisColor, 6, 1]],
    });
    expect(levelColorSet(level(spec('R')))).toEqual(['W', 'Y', 'G', 'R']);
    expect(codes(run(spec('R'), ['L-06']))).toEqual(['too_many_colors']);
    expect(run(spec('G'), ['L-06'])).toEqual([]);
  });

  // Faz 2R: `.` cells are refused (S2 out of the MVP, L-05 plan_has_window; GDD E-24 / E-43 only if S2 returns), so the
  // "debris on a `.` plan cell" test left.

  it('K-32 GDD examples: repeat p=2 `["??","??","YW","WY"]` resolves y2 = y0 = `WY`, y3 = y1 = `YW`; mirrorOf 0 of y0 `RW` is `WR`', () => {
    const W = COLOR_CODES.indexOf('W');
    const Y = COLOR_CODES.indexOf('Y');
    const R = COLOR_CODES.indexOf('R');
    const rep = compile(
      level({
        id: 27,
        plan: ['??', '??', 'YW', 'WY'],
        hidden: [{ kind: 'repeat', period: 2 }],
        pieces: [['B1_0', 'W', 0, 0]],
      }),
    ).segments[0];
    const row = (sy: number): (number | undefined)[] => [0, 1].map((sx) => rep?.planColors[sy * 2 + sx]);
    expect([row(0), row(1), row(2), row(3)]).toEqual([
      [W, Y],
      [Y, W],
      [W, Y],
      [Y, W],
    ]);
    const mir = compile(
      level({
        id: 29,
        plan: [['RW'], ['??']],
        hidden: [undefined, { kind: 'mirrorOf', segment: 0 }],
        pieces: [['B1_0', 'W', 0, 0]],
      }),
    ).segments[1];
    expect([mir?.planColors[0], mir?.planColors[1]]).toEqual([W, R]);
    // both are valid data (K-45/4)
    expect(
      run(
        {
          id: 29,
          plan: [['RW'], ['??']],
          hidden: [undefined, { kind: 'mirrorOf', segment: 0 }],
          pieces: [['B1_0', 'W', 0, 0]],
        },
        ['L-08'],
      ),
    ).toEqual([]);
  });

  it('K-32 a repeat chain that ends on `.` is invalid ("`.` hücresi hiçbir zaman gizli değildir"): `?W / ?W / .W` with p = 1', () => {
    const issues = run(
      {
        id: 27,
        plan: ['?W', '?W', '.W'],
        hidden: [{ kind: 'repeat', period: 1 }],
        pieces: [['B1_0', 'W', 0, 0]],
      },
      ['L-08'],
    );
    expect(codes(issues)).toEqual(['hidden_invalid']);
    expect(
      run(
        {
          id: 27,
          plan: ['?W', '?W', 'YW'],
          hidden: [{ kind: 'repeat', period: 1 }],
          pieces: [['B1_0', 'W', 0, 0]],
        },
        ['L-08'],
      ),
    ).toEqual([]);
  });

  it('K-02 the Faz 2R bound on the default 6 × 8 yard is exactly E ≤ ⌊0,4 · 48⌋ = 19: 29 bricks or 28 bricks + 1 crate (or bag) are valid, 28 bricks + 1 screw are not', () => {
    const fill = (spec: Partial<LevelSpec>): string[] =>
      run({ id: 26, plan: ['WW'], pieces: bricks(29), ...spec }, ['L-03']).map((i) => i.code);
    expect(fill({})).toEqual([]);
    expect(fill({ pieces: bricks(28), obstacles: [{ type: 'crate', x: 5, y: 7, hp: 1 }] })).toEqual([]);
    expect(fill({ pieces: bricks(28), obstacles: [{ type: 'cement_bag', x: 5, y: 7 }] })).toEqual([]);
    expect(fill({ pieces: bricks(28), obstacles: [{ type: 'screw', x: 0, y: 0 }] })).toEqual([
      'yard_fill_low',
    ]);
  });

  it('K-44 kinds per story chapter hold for debris too: I3_0 debris in level 10 is shape_locked (build.debris[0]), in level 11 valid', () => {
    const debris = (id: number): [string, string][] =>
      run(
        {
          id,
          plan: ['WW', 'WW', 'WW'],
          pieces: [['B1_0', 'W', 0, 0]],
          debris: [['I3_0', 'R', 6, 0]],
        },
        ['L-04'],
      ).map((i) => [i.code, i.path]);
    expect(debris(10)).toEqual([['shape_locked', 'build.debris[0]']]);
    expect(debris(11)).toEqual([]);
  });
});

// --- LEVELS §0 tables and §2 block roles against the validator, the data and the engine -----------------------------

// =====================================================================================================================
// WP-M (Faz 2R, TECH §2R.10, §2R.12): docs/LEVELS.md §0–§2 ↔ levels/level_001…010.json, the canonical solution text ↔
// the solver goldens (tests/golden/level_NNN.hand.json) and the core. The Markdown is parsed at test time; every
// expectation comes from the LEVELS text, the JSON is the thing under review.
// =====================================================================================================================

interface DocBlock {
  readonly letter: string;
  readonly shape: ShapeId;
  /** null for Ağır Yük ("— (Ağır Yük, `color` yazılmaz)"). */
  readonly color: ColorCode | null;
  readonly x: number;
  readonly y: number;
  readonly role: string;
}
interface DocStep {
  readonly text: string;
  readonly letter: string;
  readonly shape: ShapeId;
  readonly color: ColorCode | null;
  readonly from: readonly [number, number];
  /** Landing anchor: site anchor of a correct placement, new yard anchor of a shift. */
  readonly to: readonly [number, number];
  readonly kind: 'overWall' | 'rail' | 'shift';
}
interface DocTutorialStep {
  readonly startOn?: Record<string, unknown>;
  readonly highlight: readonly string[];
  readonly hand?: { readonly kind: string; readonly path?: readonly (readonly number[])[] };
  readonly textKey: string;
  readonly done: Record<string, unknown>;
}
interface DocRecord {
  readonly n: number;
  readonly fields: ReadonlyMap<string, string>;
  readonly blocks: readonly DocBlock[];
  /** The first blockout (start board): y → tokens (Wy yard, wall, Ws site). */
  readonly blockout: ReadonlyMap<number, readonly string[]>;
  readonly trucks: readonly {
    readonly ref: string;
    readonly shape: ShapeId;
    readonly color: ColorCode;
    readonly x: number;
  }[];
  readonly solution: readonly DocStep[];
  readonly tutorial: readonly DocTutorialStep[];
}

/** Numbered items under the first line starting with `header`, continuation lines joined with single spaces. */
function numberedList(lines: readonly string[], header: string): string[] {
  let i = lines.findIndex((l) => l.startsWith(header));
  if (i < 0) return [];
  i++;
  while (i < lines.length && (lines[i] ?? '').trim() === '') i++;
  const items: string[] = [];
  for (; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (line.trim() === '') break;
    if (/^\d+\. /.test(line)) items.push(line.trim());
    else if (items.length > 0) items[items.length - 1] = `${items[items.length - 1] ?? ''} ${line.trim()}`;
    else break;
  }
  return items.map((s) => s.replace(/\s+/g, ' '));
}

/** Drops every (balanced) parenthesised note: LEVELS steps explain themselves in brackets. */
function withoutNotes(text: string): string {
  let out = '';
  let depth = 0;
  for (const ch of text) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (depth === 0) out += ch;
  }
  return out.replace(/\s+/g, ' ').trim();
}

/** A LEVELS object literal (`{ event: yardMove, count: 1, piece: 'piece:4', at: [2, 3] }`) as data. */
function docObject(text: string): Record<string, unknown> {
  const json = text
    .replace(/'([^']*)'/g, '"$1"')
    .replace(/([{,]\s*)([A-Za-z]\w*)\s*:/g, '$1"$2":')
    .replace(/:\s*([A-Za-z]\w*)(?=\s*[,}])/g, ': "$1"');
  return JSON.parse(json) as Record<string, unknown>;
}

function match(re: RegExp, text: string, what: string): RegExpExecArray {
  const m = re.exec(text);
  if (!m) throw new Error(`${what}: "${text}" does not match ${re}`);
  return m;
}

function docRecord(n: number): DocRecord {
  const start = LEVELS_MD.indexOf(`### Bölüm ${n} — `);
  if (start < 0) throw new Error(`LEVELS.md has no "### Bölüm ${n} — " section`);
  const end = LEVELS_MD.indexOf('\n### ', start + 1);
  const section = LEVELS_MD.slice(start, end < 0 ? undefined : end);
  const lines = section.split('\n');
  const fields = new Map<string, string>();
  const blocks: DocBlock[] = [];
  for (const line of lines) {
    const b = /^\| `([^`]+)` \| `([A-Z]\d_\d+)` \| ([A-Z]|—[^|]*) \| \((\d+),(\d+)\) \| (.*) \|$/.exec(line);
    if (b) {
      blocks.push({
        letter: b[1] ?? '',
        shape: b[2] as ShapeId,
        color: /^[A-Z]$/.test(b[3] ?? '') ? (b[3] as ColorCode) : null,
        x: Number(b[4]),
        y: Number(b[5]),
        role: b[6] ?? '',
      });
      continue;
    }
    const f = /^\| ([^`|][^|]*?) \| (.*) \|$/.exec(line);
    if (f && f[1] !== 'Alan' && f[1] !== 'Kimlik' && !(f[1] ?? '').startsWith('---'))
      fields.set(f[1] ?? '', f[2] ?? '');
  }
  // first ``` block = the start board
  const blockout = new Map<number, string[]>();
  const fence = lines.findIndex((l) => l.startsWith('```'));
  for (let i = fence + 1; fence >= 0 && i < lines.length && !(lines[i] ?? '').startsWith('```'); i++) {
    const row = /^\s+y=(\d):\s+(.*)$/.exec(lines[i] ?? '');
    if (row) blockout.set(Number(row[1]), (row[2] ?? '').replace(/←.*$/, '').trim().split(/\s+/));
  }
  const flat = section.replace(/\s+/g, ' ');
  const truckText = /Kamyon partisi 1 \([^)]*\): (.*?)\. /.exec(flat)?.[1] ?? '';
  const trucks = [...truckText.matchAll(/`(k\d+_\d+)` `([A-Z]\d_\d+)` ([A-Z]) x=(\d+)/g)].map((m) => ({
    ref: m[1] ?? '',
    shape: m[2] as ShapeId,
    color: m[3] as ColorCode,
    x: Number(m[4]),
  }));
  const solution = numberedList(lines, 'Kanonik çözüm').map((text): DocStep => {
    const m = match(
      /^\d+\. `([^`]+)` \(([A-Z]\d_\d+)(?: ([A-Z]))?(?: Ağır Yük)?\) \((\d+),(\d+)\) → (.*?) — (.*)$/,
      text,
      `LEVELS Bölüm ${n} solution`,
    );
    const to = [...(m[6] ?? '').matchAll(/\((\d+),(\d+)\)/g)].at(-1);
    const how = m[7] ?? '';
    return {
      text,
      letter: m[1] ?? '',
      shape: m[2] as ShapeId,
      color: m[3] ? (m[3] as ColorCode) : null,
      from: [Number(m[4]), Number(m[5])],
      to: [Number(to?.[1]), Number(to?.[2])],
      kind: how.startsWith('**kaydırma**') ? 'shift' : how.startsWith('**ray**') ? 'rail' : 'overWall',
    };
  });
  const tutorial = numberedList(lines, 'Öğretici').map((item): DocTutorialStep => {
    const parts = withoutNotes(item.replace(/^\d+\. /, '')).split(' · ');
    let startOn: Record<string, unknown> | undefined;
    if ((parts[0] ?? '').startsWith('`startOn:')) {
      startOn = docObject(match(/`startOn: (\{.*\})`/, parts.shift() ?? '', `Bölüm ${n} startOn`)[1] ?? '');
    }
    const highlight = [...(parts[0] ?? '').matchAll(/`([^`]+)`/g)].map((x) => x[1] ?? '');
    const handText = parts[1] ?? '';
    const drag = /^(drag|hold) `(\[.*\])`/.exec(handText);
    const hand = drag
      ? { kind: drag[1] ?? '', path: JSON.parse(drag[2] ?? '[]') as number[][] }
      : /^tap\b/.test(handText)
        ? { kind: 'tap' }
        : undefined;
    const textKey = match(/`(tut\.[^`]+)`/, parts[2] ?? '', `Bölüm ${n} textKey`)[1] ?? '';
    const done = docObject(match(/`(\{[^`]*\})`/, parts.slice(3).join(' · '), `Bölüm ${n} done`)[1] ?? '');
    return { ...(startOn ? { startOn } : {}), highlight, ...(hand ? { hand } : {}), textKey, done };
  });
  return { n, fields, blocks, blockout, trucks, solution, tutorial };
}

/** The value of the field row whose name starts with `name` ("Boyut (K-49)", "Hamle (K-52)"). */
function docField(doc: DocRecord, name: string): string {
  for (const [k, v] of doc.fields) if (k === name || k.startsWith(`${name} `)) return v;
  throw new Error(`LEVELS Bölüm ${doc.n}: no "${name}" row`);
}

const DIFFICULTY: Readonly<Record<string, LevelInput['difficulty']>> = {
  Kolay: 'easy',
  Normal: 'normal',
  Zor: 'hard',
  'Çok Zor': 'superhard',
};

/** The `piece:` reference of a LEVELS letter (`a` = `piece:0` …, `k1_0` = `piece:k1_0`). */
function refOfLetter(doc: DocRecord, letter: string): string {
  const i = doc.blocks.findIndex((b) => b.letter === letter);
  if (i >= 0) return `piece:${i}`;
  if (/^k\d+_\d+$/.test(letter)) return `piece:${letter}`;
  throw new Error(`LEVELS Bölüm ${doc.n}: unknown block ${letter}`);
}

/** Anchor (min x, min y of its board cells) of a block. */
function anchorOf(s: GameState, id: PieceId): [number, number] | null {
  const cells = pieceBoardCells(s, id);
  if (cells.length === 0) return null;
  return [Math.min(...cells.map((c) => c.x)), Math.min(...cells.map((c) => c.y))];
}

/** A drag release that does what the LEVELS step says: its kind, landing at its anchor (first such node). */
function releaseFor(s: GameState, id: PieceId, step: DocStep): Move | null {
  const a = tryBeginDrag(s, id);
  if (!a.ok) return null;
  const want = step.kind === 'shift' ? 'yard' : step.kind === 'rail' ? 'siteRail' : 'siteFree';
  for (const node of a.session.reachableNodes()) {
    if (a.session.classify(node).kind !== want) continue;
    const move: Move = { kind: 'drag', pieceId: id, to: node };
    const copy = cloneState(s);
    const sink = new ArraySink();
    const res = applyMove(copy, move, sink);
    const at = anchorOf(copy, id);
    const placed =
      step.kind === 'shift' || sink.events.some((e) => e.t === 'placementCorrect' && e.pieceId === id);
    if (res.status === 'applied' && placed && at && at[0] === step.to[0] && at[1] === step.to[1]) return move;
  }
  return null;
}

interface HandGolden {
  readonly minMoves: number;
  readonly budget: number;
  readonly yao: { readonly overWall: number; readonly rail: number };
  readonly steps: readonly {
    readonly piece: string;
    readonly shape: string;
    readonly color: string;
    readonly from: readonly number[];
    readonly kind: string;
    readonly to: readonly number[];
  }[];
}
const goldenOf = (n: number): HandGolden =>
  JSON.parse(readFileSync(join(ROOT, 'tests', 'golden', `level_${pad(n)}.hand.json`), 'utf8')) as HandGolden;

describe.each(LEVEL_IDS)('review LEVELS §2 Bölüm %i ↔ levels JSON (Faz 2R)', (n) => {
  const doc = docRecord(n);
  const json = readLevelJson(n);
  const batch0 = batchOf(json, 0).pieces;
  const loaded = loadLevel(json);
  if (!loaded.ok) throw new Error(`level ${n} does not load`);
  const lvl = loaded.level;
  const geo = lvl.geo;

  it(`K-45/2 level ${n}: the LEVELS block table is the batch-0 array (order, shape, colour or Ağır Yük, anchor)`, () => {
    expect(doc.blocks.length).toBeGreaterThan(0);
    expect(batch0.map((p) => [p.shape, isCargo(shapeById(p.shape)) ? null : p.color, p.x, p.y])).toEqual(
      doc.blocks.map((b) => [b.shape, b.color, b.x, b.y]),
    );
    // LEVELS §0 "Ağır Yük … `color` yazılmaz"
    for (const p of batch0)
      if (isCargo(shapeById(p.shape))) expect(p.color, `${p.shape} colour`).toBeUndefined();
    expect(batch0.every((p) => p.flags === undefined)).toBe(true);
  });

  it(`K-49 K-02 level ${n}: "Boyut" and "Saha" rows are the JSON sizes and the yard fill (C, F, E)`, () => {
    const size = match(
      /`yard \{ cols (\d+), rows (\d+) \}`, `site \{ cols (\d+), rows (\d+) \}` → H = (\d+)/,
      docField(doc, 'Boyut'),
      'Boyut',
    );
    expect([json.yard.cols, json.yard.rows, json.site?.cols, json.site?.rows, geo.h]).toEqual(
      size.slice(1, 6).map(Number),
    );
    const fill = match(/C = (\d+), F = (\d+).*E = (\d+)/, docField(doc, 'Saha'), 'Saha');
    const F = batch0.reduce((t, p) => t + shapeById(p.shape).cells.length, 0);
    expect([geo.wy * geo.hy, F, geo.wy * geo.hy - F]).toEqual(fill.slice(1, 4).map(Number));
  });

  it(`K-04 K-15 level ${n}: the start blockout is the batch-0 yard (letters, Q = Ağır Yük, · = air), the wall column (# closed, = gap, : open) and the first segment plan`, () => {
    const cellOf = new Map<string, string>();
    doc.blocks.forEach((b) => {
      for (const c of cellsOf(b.shape, b.x, b.y)) cellOf.set(c, b.color === null ? 'Q' : b.letter);
    });
    const rows = json.build.segments[0]?.rows ?? [];
    expect([...doc.blockout.keys()].sort((a, b) => a - b)).toEqual(
      Array.from({ length: geo.h + 2 }, (_, y) => y),
    );
    for (let y = 0; y < geo.h + 2; y++) {
      const t = doc.blockout.get(y) ?? [];
      expect(t.length, `y=${y} tokens`).toBe(geo.wy + 1 + geo.ws);
      for (let x = 0; x < geo.wy; x++)
        expect(t[x], `yard (${x},${y})`).toBe(y >= geo.hy ? '·' : (cellOf.get(cellKey(x, y)) ?? '.'));
      const inGap = json.wall.gaps.some((g) => g.y <= y && y < g.y + g.size);
      expect(t[geo.wy], `wall y=${y}`).toBe(y < json.wall.height ? (inGap ? '=' : '#') : ':');
      for (let sx = 0; sx < geo.ws; sx++)
        expect(t[geo.wy + 1 + sx], `site (${geo.wy + sx},${y})`).toBe(
          y >= geo.hs ? '·' : (rows[rows.length - 1 - y]?.[sx] ?? '?'),
        );
    }
  });

  it(`K-45/1 level ${n}: header rows (wall, gravity, segments, colours, shapes, difficulty, moves, teaches) match the JSON`, () => {
    const wall = docField(doc, 'Duvar');
    expect(Number(match(/`height (\d+)`/, wall, 'Duvar')[1])).toBe(json.wall.height);
    const gaps = [...wall.matchAll(/geçit `(\{[^`]*\})`/g)].map((m) => docObject(m[1] ?? ''));
    expect(json.wall.gaps).toEqual(gaps);
    if (gaps.length === 0) expect(wall).toContain('geçit yok');
    const grav = match(/build `(\w+)`, yard `(\w+)`/, docField(doc, 'Yerçekimi'), 'Yerçekimi');
    expect(json.gravity).toEqual({ build: grav[1], yard: grav[2] === 'true' });
    const segs = [...docField(doc, 'Dilimler').matchAll(/(\d+)\. (.+?) \(EN: (.+?)\) `(\[.*?\])`/g)].map(
      (m) => ({
        name: { tr: m[2], en: m[3] },
        rows: JSON.parse(m[4] ?? '[]') as string[],
      }),
    );
    expect(json.build).toEqual({ mode: 'segments', segments: segs });
    const cs = match(/^(.*?) \((\d+)\) \/ (.*)$/, docField(doc, 'Renkler / şekiller'), 'Renkler / şekiller');
    const docColors = (cs[1] ?? '').split(', ').sort();
    expect(docColors.length).toBe(Number(cs[2]));
    const parsed = validateLevelJson(json).level;
    if (!parsed) throw new Error('schema');
    expect([...levelColorSet(parsed)].sort()).toEqual(docColors);
    const kinds = [
      ...new Set(json.yard.batches.flatMap((b) => b.pieces.map((p) => shapeById(p.shape).kind))),
    ].sort();
    expect(kinds).toEqual([...new Set((cs[3] ?? '').match(/[A-Z]\d/g) ?? [])].sort());
    const word =
      match(
        /^(Çok Zor|Kolay|Normal|Zor)\b/,
        docField(doc, 'Zorluk / hedef kazanma').replace(/\*\*/g, ''),
        'Zorluk',
      )[1] ?? '';
    expect(json.difficulty).toBe(DIFFICULTY[word]);
    expect(Number(match(/\*\*(\d+)\*\*/, docField(doc, 'Hamle'), 'Hamle')[1])).toBe(json.moves);
    expect(json.teaches).toBe(/`teaches: "([^"]+)"`/.exec(docField(doc, 'Öğretilen'))?.[1]);
    expect(json.goals).toEqual([{ type: 'build' }]);
    expect(json.obstacles).toEqual([]);
    expect(json.chapter).toBe(1);
    expect(json.name.tr.length).toBeGreaterThan(0);
  });

  it(`K-25 level ${n}: truck batch 1 equals LEVELS "Kamyon partisi 1" (array order, shape, colour, x; y written as Hy)`, () => {
    const trucks = json.yard.batches.slice(1);
    expect(trucks.length).toBe(doc.trucks.length > 0 ? 1 : 0);
    expect(json.build.segments.length).toBe(trucks.length + 1);
    if (doc.trucks.length === 0) return;
    expect(trucks[0]?.forSegment).toBe(1);
    expect(doc.trucks.map((t) => t.ref)).toEqual(doc.trucks.map((_, i) => `k1_${i}`));
    expect(trucks[0]?.pieces.map((p) => [p.shape, p.color, p.x, p.y])).toEqual(
      doc.trucks.map((t) => [t.shape, t.color, t.x, json.yard.rows]),
    );
  });

  it(`GDD 14.1 K-53 level ${n}: tutorial[] equals the LEVELS step list (startOn, highlight, hand kind + path, textKey, done; count 1 when not written)`, () => {
    const one = (o: Record<string, unknown> | undefined): Record<string, unknown> | undefined =>
      o ? { count: 1, ...o } : undefined;
    const steps = json.tutorial ?? [];
    expect(steps.length).toBe(doc.tutorial.length);
    doc.tutorial.forEach((d, i) => {
      const st = steps[i];
      const where = `level ${n} step ${i + 1}`;
      expect(st?.step, where).toBe(i + 1);
      expect(st?.mode ?? 'soft', where).toBe('soft');
      expect(st?.highlight, where).toEqual(d.highlight);
      expect(st?.hand, where).toEqual(d.hand);
      expect(st?.textKey, where).toBe(d.textKey);
      expect(one(st?.done as Record<string, unknown>), where).toEqual(one(d.done));
      expect(one(st?.startOn as Record<string, unknown> | undefined), where).toEqual(one(d.startOn));
    });
  });

  it(`K-50 K-46 level ${n}: the LEVELS canonical solution is the solver golden (letter, shape, colour, from, kind, to), its length is "min" and its YAO the "Ölçütler" one`, () => {
    const golden = goldenOf(n);
    expect(golden.steps.map((s) => [s.piece, s.shape, s.color, [...s.from], s.kind, [...s.to]])).toEqual(
      doc.solution.map((s) => [s.letter, s.shape, s.color ?? '-', [...s.from], s.kind, [...s.to]]),
    );
    const metrics = docField(doc, 'Ölçütler');
    const min = Number(match(/\bmin (\d+)/, metrics, 'Ölçütler min')[1]);
    expect([doc.solution.length, golden.minMoves]).toEqual([min, min]);
    const yao = match(/YAO (\d+)\/(\d+)/, metrics, 'Ölçütler YAO');
    const placed = doc.solution.filter((s) => s.kind !== 'shift');
    expect([placed.filter((s) => s.kind === 'overWall').length, placed.length]).toEqual([
      Number(yao[1]),
      Number(yao[2]),
    ]);
    expect([golden.yao.overWall, golden.yao.overWall + golden.yao.rail]).toEqual([
      Number(yao[1]),
      Number(yao[2]),
    ]);
    expect(Number(match(/\bN (\d+)/, metrics, 'Ölçütler N')[1])).toBe(placed.length);
    expect(golden.budget).toBe(json.moves);
  });

  it(`K-05 K-12 K-16 K-48 level ${n}: the LEVELS solution text replays move by move on the core (start anchor, kind, landing, correct placement; over the wall box height ≤ (H + 2) − height, rail rows inside a gap) and wins`, () => {
    const session = GameSession.start(lvl, {}, { strict: true });
    const open = geo.h + 2 - json.wall.height;
    doc.solution.forEach((step, i) => {
      const where = `L${n} step ${i + 1}: ${step.text}`;
      const id = lvl.tutorialPieceIds.get(refOfLetter(doc, step.letter));
      if (id === undefined) throw new Error(`${where}: no block`);
      const p = lvl.pieces[id];
      expect([p?.dataShape, step.color === null ? null : COLOR_CODES[p?.colorIndex ?? -1]], where).toEqual([
        step.shape,
        step.color,
      ]);
      const s = session.state;
      expect([pieceZone(s, id), pieceX(s, id), pieceY(s, id)], `${where} — start`).toEqual([
        Zone.yard,
        ...step.from,
      ]);
      const h = Math.max(...shapeById(step.shape).cells.map((c) => c.y)) + 1;
      if (step.kind === 'overWall') expect(h, `${where} — K-05`).toBeLessThanOrEqual(open);
      if (step.kind === 'rail')
        expect(
          json.wall.gaps.some((g) => g.y <= step.to[1] && step.to[1] + h - 1 <= g.y + g.size - 1),
          `${where} — K-12`,
        ).toBe(true);
      const move = releaseFor(s, id, step);
      expect(move, `${where} — a release with this kind and landing`).not.toBeNull();
      if (!move) return;
      const sink = new ArraySink();
      const res = session.commit(move, sink);
      expect([res.status, session.outcome], where).toEqual([
        'applied',
        i === doc.solution.length - 1 ? 'won' : 'playing',
      ]);
      expect(
        sink.events.some((e: GameEvent) => e.t === 'placementWrong'),
        where,
      ).toBe(false);
    });
    expect(queueIds(session.state)).toEqual([]);
  });
});

describe('review LEVELS §0–§1 tables (Faz 2R)', () => {
  it('K-45/1 LEVELS §1 table: difficulty and moves of levels 1–10 equal the JSON ("(tanıtım)" = teaches is set)', () => {
    const rows = new Map<number, [string, number]>();
    const curve = LEVELS_MD.slice(LEVELS_MD.indexOf('## 1. Zorluk eğrisi'), LEVELS_MD.indexOf('## 2. '));
    for (const line of curve.split('\n')) {
      const m = /^\| (\d+) \| ([^|]+?) \| (\d+) \| [^|]+ \| (\d+) \| ([^|]+?) \| (\d+) \|/.exec(line);
      if (!m) continue;
      rows.set(Number(m[1]), [m[2] ?? '', Number(m[3])]);
      rows.set(Number(m[4]), [m[5] ?? '', Number(m[6])]);
    }
    expect(rows.size).toBe(50);
    for (const n of LEVEL_IDS) {
      const [label, moves] = rows.get(n) ?? ['', 0];
      const word = label
        .replace(/\*\*/g, '')
        .replace(/\s*\((nefes|tanıtım)\)$/, '')
        .trim();
      const json = readLevelJson(n);
      expect([json.difficulty, json.moves], `level ${n}`).toEqual([DIFFICULTY[word], moves]);
      expect(label.includes('(tanıtım)'), `level ${n} tanıtım`).toBe(json.teaches !== undefined);
    }
  });

  it('K-45/10 LEVELS §0 "JSON eşlemesi" teaches list (4 → W1, 5 → S1, 6 → W2, 8 → Y5, 9 → W3) is exactly the derived new mechanic of each level 1–10', () => {
    const list =
      match(
        /`teaches` yalnızca veri imzası olan\s+mekanik için yazılır \(OBSTACLES "Veri imzası": ([^)]*)\)/,
        LEVELS_MD,
        'teaches list',
      )[1] ?? '';
    const listed = new Map(
      [...list.matchAll(/(\d+) → ([A-Z][\w-]*)/g)].map((m) => [Number(m[1]), m[2] ?? '']),
    );
    expect([...listed.keys()]).toEqual([4, 5, 6, 8, 9]);
    const history = new Set<MechanicId>();
    for (const n of LEVEL_IDS) {
      const res = validateLevelJson(readLevelJson(n));
      if (!res.level) throw new Error(`level ${n} fails the schema`);
      const fresh = deriveMechanics(res.level).filter((m) => !history.has(m));
      expect([fresh, res.level.teaches], `level ${n}`).toEqual(
        listed.has(n) ? [[listed.get(n)], listed.get(n)] : [[], undefined],
      );
      for (const m of deriveMechanics(res.level)) history.add(m);
    }
  });

  it('K-31 K-44 LEVELS §0 unlock table (colour pool and first level, colours per level, shapes) is what the validator enforces at every chapter boundary', () => {
    const lines = LEVELS_MD.split('\n').filter((l) => /^\| \d [^|]+ \| \d+–\d+ \|/.test(l));
    expect(lines.length).toBe(5);
    // LEVELS §0: "R'nin ilk kullanımı Faz 2R'de Bölüm 5'tir (brif: 4; … `color_locked` R için id ≥ 4 ister)"
    const r = match(/R'nin ilk kullanımı Faz 2R'de\s+Bölüm (\d+)'tir \(brif: (\d+)/, LEVELS_MD, 'R note');
    const unlockAt = (c: ColorCode, at: number): number =>
      c === 'R' && at === Number(r[1]) ? Number(r[2]) : at;
    let kinds: ShapeKind[] = [];
    for (const line of lines) {
      const cols = line.split('|').map((c) => c.trim());
      const chapter = Number(/^(\d)/.exec(cols[1] ?? '')?.[1]);
      const [first, last] = (cols[2] ?? '').split('–').map(Number) as [number, number];
      expect([first, last], `chapter ${chapter} range`).toEqual([chapter * 10 - 9, chapter * 10]);
      for (const m of (cols[3] ?? '').matchAll(/([A-Z](?:, [A-Z])*) \((\d+)\)/g)) {
        const at = Number(m[2]);
        for (const c of (m[1] ?? '').split(', ') as ColorCode[]) {
          const spec = (id: number): LevelSpec => ({ id, plan: [`${c}${c}`], pieces: [['B1_0', c, 0, 0]] });
          expect(run(spec(at), ['L-07']), `${c} at ${at}`).toEqual([]);
          const open = unlockAt(c, at);
          expect(run(spec(open), ['L-07']), `${c} at ${open}`).toEqual([]);
          if (open > 1)
            expect(codes(run(spec(open - 1), ['L-07'])), `${c} at ${open - 1}`).toEqual(['color_locked']);
        }
      }
      const limit = Number(cols[4]);
      const palette: ColorCode[] = ['W', 'Y', 'G', 'R', 'O', 'C', 'B', 'P'];
      const plan = (k: number): string[] => {
        const cs = palette.slice(0, k);
        const rows: string[] = [];
        for (let i = 0; i < cs.length; i += 2) rows.push(`${cs[i] ?? 'W'}${cs[i + 1] ?? cs[i] ?? 'W'}`);
        return rows;
      };
      for (const id of [first, last]) {
        expect(
          run({ id, plan: plan(limit), pieces: [['B1_0', 'W', 0, 0]] }, ['L-06']),
          `${id}: ${limit}`,
        ).toEqual([]);
        expect(
          codes(run({ id, plan: plan(limit + 1), pieces: [['B1_0', 'W', 0, 0]] }, ['L-06'])),
          `${id}: ${limit + 1}`,
        ).toEqual(['too_many_colors']);
      }
      // shapes: "B1, D2, O4, C3; 8'den itibaren Ağır Yük I5, Q9" / "+ I3, L4, J4" / "hepsi"; a ≤ 2-wide orientation
      // of each kind (K-44 piece_too_wide on the default 2-column site)
      const shapeText = (cols[5] ?? '').split(';')[0] ?? '';
      const fresh =
        shapeText === 'hepsi' ? [] : (shapeText.match(/[A-Z]\d/g) ?? []).map((k) => k as ShapeKind);
      for (const kind of fresh) {
        const narrow = SHAPES.find((sh) => sh.kind === kind && sh.w <= 2);
        if (!narrow) throw new Error(`${kind}: no ≤ 2-wide orientation`);
        const piece = (id: number): LevelSpec => ({ id, plan: ['WW'], pieces: [[narrow.id, 'W', 0, 0]] });
        expect(run(piece(first), ['L-04']), `${narrow.id} at ${first}`).toEqual([]);
        if (first > 1)
          expect(codes(run(piece(first - 1), ['L-04'])), `${narrow.id} at ${first - 1}`).toEqual([
            'shape_locked',
          ]);
      }
      kinds = [...kinds, ...fresh];
    }
    expect([...kinds].sort()).toEqual(
      SHAPE_KINDS.filter((k) => k !== 'I5' && k !== 'Q9')
        .slice()
        .sort(),
    );
  });
});
