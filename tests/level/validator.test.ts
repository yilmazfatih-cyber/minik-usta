/**
 * Level validator, validate stage (TECH §8.3 + Faz 2R §2R.3; GDD K-45 items 1–8 and 10, K-02, K-44, K-47, K-49,
 * K-53). One invalid fixture per code in tests/level/fixtures/invalid (each is otherwise clean, so the case lists its
 * exact code set); the valid fixtures pass every check with the history their `teaches` needs.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CHECK_IDS,
  RUNTIME_CHECKS,
  TILE_BUDGET,
  canReachSite,
  checkLevel,
  levelColorSet,
  tileLevel,
  validateLevelJson,
} from '../../src/core/level/logic.ts';
import type { CheckId, Issue, LogicContext } from '../../src/core/level/logic.ts';
import { buildPlans } from '../../src/core/level/plan.ts';
import { LevelSchema } from '../../src/core/level/schema.ts';
import type { LevelData, LevelInput, MechanicId } from '../../src/core/level/schema.ts';
import { loadLevel } from '../../src/core/level/compile.ts';
import { isCargo } from '../../src/core/level/mechanics.ts';
import { isCargoShape } from '../../src/core/movement.ts';
import { SHAPES, shapeById } from '../../src/core/shapes.ts';
import { fixturePath, level, loadFixture } from '../fixtures/builders.ts';
import type { LevelSpec } from '../fixtures/builders.ts';

const ROOT = join(import.meta.dirname, '..', '..');

interface Case {
  /** Test name: rule id + code + short description. */
  readonly name: string;
  /** File in tests/level/fixtures/invalid/. */
  readonly file: string;
  readonly code: string;
  readonly rule: string;
  readonly severity?: 'error' | 'warn';
  readonly ctx?: LogicContext;
}

const I18N = { tr: new Set(['tut.m.dig', 'tut.m.free']), en: new Set(['tut.m.dig', 'tut.m.free']) };
const prev = (...ids: MechanicId[]): ReadonlySet<MechanicId> => new Set(ids);

const CASES: readonly Case[] = [
  // K-45/1 schema and identity
  {
    name: 'K-45/1 schema_invalid unknown key',
    file: 'schema_invalid',
    code: 'schema_invalid',
    rule: 'K-45/1',
  },
  {
    name: 'K-45/1 K-44 schema_invalid a material block without color',
    file: 'schema_invalid_color_missing',
    code: 'schema_invalid',
    rule: 'K-45/1',
  },
  {
    name: 'K-45/1 K-53/3 schema_invalid timeoutMs is no done condition (CL-2R-10)',
    file: 'schema_invalid_timeoutms',
    code: 'schema_invalid',
    rule: 'K-45/1',
  },
  {
    name: 'K-45/1 chapter_mismatch chapter ≠ ceil(id/10)',
    file: 'chapter_mismatch',
    code: 'chapter_mismatch',
    rule: 'K-45/1',
  },
  // K-45/2 sizes and yard
  {
    name: 'K-45/2 K-49 size_out_of_range Ws 1 (Ws 2–3 in story chapters 1–3)',
    file: 'size_out_of_range',
    code: 'size_out_of_range',
    rule: 'K-45/2',
  },
  {
    name: 'K-45/2 K-49 board_too_wide Wy 6 + Ws 3 > 8',
    file: 'board_too_wide',
    code: 'board_too_wide',
    rule: 'K-45/2',
  },
  { name: 'K-45/2 overlap two blocks on one cell', file: 'overlap', code: 'overlap', rule: 'K-45/2' },
  {
    name: 'K-45/2 out_of_yard a block crosses x = Wy − 1',
    file: 'out_of_yard',
    code: 'out_of_yard',
    rule: 'K-45/2',
  },
  {
    name: 'K-45/2 out_of_yard an obstacle outside Wy × Hy',
    file: 'out_of_yard_obstacle',
    code: 'out_of_yard',
    rule: 'K-45/2',
  },
  {
    name: 'K-45/2 K-02 yard_fill_low E = 12 > ⌊0,4·24⌋',
    file: 'yard_fill_low',
    code: 'yard_fill_low',
    rule: 'K-45/2',
  },
  {
    name: 'K-45/2 K-02 yard_fill_high E = 1 < 2',
    file: 'yard_fill_high',
    code: 'yard_fill_high',
    rule: 'K-45/2',
  },
  // K-45/3 wall
  {
    name: 'K-45/3 gap_touches_top y + size > height − 1',
    file: 'gap_touches_top',
    code: 'gap_touches_top',
    rule: 'K-45/3',
  },
  {
    name: 'K-45/3 gap_overlap across slider range',
    file: 'gap_overlap_slider_range',
    code: 'gap_overlap',
    rule: 'K-45/3',
  },
  {
    name: 'K-45/3 shutter_phase phase ≥ 2·period',
    file: 'shutter_phase',
    code: 'shutter_phase',
    rule: 'K-45/3',
  },
  { name: 'K-45/3 slider_range a == b', file: 'slider_range_a_eq_b', code: 'slider_range', rule: 'K-45/3' },
  {
    name: 'K-45/3 key_missing locked gap without key',
    file: 'key_missing',
    code: 'key_missing',
    rule: 'K-45/3',
  },
  {
    name: 'K-45/3 fan_unused warns without 1-wide blocks',
    file: 'fan_unused',
    code: 'fan_unused',
    rule: 'K-45/3',
    severity: 'warn',
  },
  {
    name: 'K-45/3 K-04 a wall above the board height H is size_out_of_range on wall.height',
    file: 'wall_height_over_h',
    code: 'size_out_of_range',
    rule: 'K-45/3',
  },
  // K-45/4 plan
  {
    name: 'K-45/4 K-15 plan_size rows ≠ site.rows',
    file: 'plan_size_rows',
    code: 'plan_size',
    rule: 'K-45/4',
  },
  {
    name: 'K-45/4 K-15 plan_size a row of 3 characters on a 2-column site',
    file: 'plan_size_width',
    code: 'plan_size',
    rule: 'K-45/4',
  },
  {
    name: 'K-45/4 K-15 plan_size a row of 5 characters (schema stage, not schema_invalid)',
    file: 'plan_size_schema',
    code: 'plan_size',
    rule: 'K-45/4',
  },
  {
    name: 'K-45/4 K-15 plan_has_window a `.` cell (R2-01)',
    file: 'plan_has_window',
    code: 'plan_has_window',
    rule: 'K-45/4',
  },
  {
    name: 'K-45/4 K-24 elevator_overflow Hs + b > 8',
    file: 'elevator_overflow',
    code: 'elevator_overflow',
    rule: 'K-45/4',
  },
  {
    name: 'K-45/4 too_many_colors 4 colours in story chapter 1',
    file: 'too_many_colors',
    code: 'too_many_colors',
    rule: 'K-45/4',
  },
  {
    name: 'K-45/4 color_locked R before level 4',
    file: 'color_locked',
    code: 'color_locked',
    rule: 'K-45/4',
  },
  {
    name: 'K-45/4 hidden_invalid ? without hidden rule',
    file: 'hidden_invalid',
    code: 'hidden_invalid',
    rule: 'K-45/4',
  },
  // K-45/5 shapes
  {
    name: 'K-45/5 shape_forbidden I5_90 (K-44)',
    file: 'shape_forbidden',
    code: 'shape_forbidden',
    rule: 'K-45/5',
  },
  {
    name: 'K-45/5 K-44 shape_locked I3 in story chapter 1',
    file: 'shape_locked_i3_chapter1',
    code: 'shape_locked',
    rule: 'K-45/5',
  },
  {
    name: 'K-45/5 K-44 shape_locked Ağır Yük Q9 in level 7',
    file: 'shape_locked_q9_level7',
    code: 'shape_locked',
    rule: 'K-45/5',
  },
  {
    name: 'K-45/5 K-44 piece_too_wide a 3-wide I3_90 on a 2-column site',
    file: 'piece_too_wide',
    code: 'piece_too_wide',
    rule: 'K-45/5',
  },
  {
    name: 'K-45/5 K-21 flag_combo_forbidden glass + balloon',
    file: 'flag_combo_forbidden',
    code: 'flag_combo_forbidden',
    rule: 'K-45/5',
  },
  {
    name: 'K-45/5 K-44 flag_combo_forbidden Ağır Yük cannot be glass',
    file: 'flag_combo_cargo_glass',
    code: 'flag_combo_forbidden',
    rule: 'K-45/5',
  },
  // K-45/6 hidden items and goals
  {
    name: 'K-45/6 hidden_item_exposed screw not covered',
    file: 'hidden_item_exposed',
    code: 'hidden_item_exposed',
    rule: 'K-45/6',
  },
  {
    name: 'K-45/6 hidden_item_stacked two screws in one cell',
    file: 'hidden_item_stacked',
    code: 'hidden_item_stacked',
    rule: 'K-45/6',
  },
  {
    name: 'K-45/6 goal_count_too_high clear crate 2 with 1 crate',
    file: 'goal_count_too_high',
    code: 'goal_count_too_high',
    rule: 'K-45/6',
  },
  {
    name: 'K-45/6 goal_build_missing',
    file: 'goal_build_missing',
    code: 'goal_build_missing',
    rule: 'K-45/6',
  },
  // K-45/7 debris
  {
    name: 'K-45/7 debris_misplaced debris in the yard (x < Wy)',
    file: 'debris_misplaced',
    code: 'debris_misplaced',
    rule: 'K-45/7',
  },
  {
    name: 'K-45/7 S4 debris_correct_at_start debris already on its colour with support',
    file: 'debris_correct_at_start',
    code: 'debris_correct_at_start',
    rule: 'K-45/7',
  },
  // K-45/8 full cover
  {
    name: 'K-45/8 K-47 cover_mismatch supply ≠ demand per colour',
    file: 'cover_mismatch',
    code: 'cover_mismatch',
    rule: 'K-45/8',
  },
  {
    name: 'K-45/8 K-47 cover_prefix_short segment 0 needs a colour that only batch 1 brings',
    file: 'cover_prefix_short',
    code: 'cover_prefix_short',
    rule: 'K-45/8',
  },
  {
    name: 'K-45/8 K-30 untileable D3a finds no exact bottom-up cover',
    file: 'untileable',
    code: 'untileable',
    rule: 'K-45/8',
  },
  // K-25 batches
  {
    name: 'K-25 batch_invalid truck y must be Hy',
    file: 'batch_invalid',
    code: 'batch_invalid',
    rule: 'K-25',
  },
  // K-45/10 mechanics and tutorial
  {
    name: 'K-45/10 teaches_mismatch teaches must equal the derived new mechanic',
    file: 'teaches_mismatch',
    code: 'teaches_mismatch',
    rule: 'K-45/10',
    ctx: { previousMechanics: prev() },
  },
  {
    name: 'K-45/10 too_many_new_mechanics a size-1 static gap is W1 + W3',
    file: 'too_many_new_mechanics_size1_gap_level4',
    code: 'too_many_new_mechanics',
    rule: 'K-45/10',
    ctx: { previousMechanics: prev() },
  },
  {
    name: 'K-45/10 K-53/1 tut_too_many_steps 3 steps',
    file: 'tut_too_many_steps',
    code: 'tut_too_many_steps',
    rule: 'K-45/10',
  },
  {
    name: 'K-45/10 K-53/2 tut_blocking mode "required"',
    file: 'tut_blocking_mode',
    code: 'tut_blocking',
    rule: 'K-45/10',
  },
  {
    name: 'K-45/10 K-53/2 tut_blocking a spotlight field',
    file: 'tut_blocking_spot',
    code: 'tut_blocking',
    rule: 'K-45/10',
  },
  {
    name: 'GDD 14.1 tut_key_missing text key not in tr/en',
    file: 'tut_key_missing',
    code: 'tut_key_missing',
    rule: 'GDD 14.1',
    ctx: { i18nKeys: I18N },
  },
  {
    name: 'GDD 14.1/1 tut_key_missing textKey outside tut.l<n> | tut.m | tut.ctx (schema stage)',
    file: 'tut_key_format',
    code: 'tut_key_missing',
    rule: 'GDD 14.1',
  },
  {
    name: 'GDD 14.1/5 tut_highlight_invalid a truck block before its batch is delivered',
    file: 'tut_highlight_batch_piece_without_startOn',
    code: 'tut_highlight_invalid',
    rule: 'GDD 14.1',
  },
  {
    name: 'GDD 14.1/5 tut_highlight_invalid startOn mortar delivery highlights a block without mortar',
    file: 'tut_highlight_startOn_flag_mismatch',
    code: 'tut_highlight_invalid',
    rule: 'GDD 14.1',
  },
  {
    name: 'GDD 14 tut_highlight_invalid debris index out of range',
    file: 'tut_highlight_debris_out_of_range',
    code: 'tut_highlight_invalid',
    rule: 'GDD 14.1',
  },
  {
    name: 'GDD 14 K-49 tut_highlight_invalid cell:7,0 is off a 6-column board',
    file: 'tut_highlight_cell_off_board',
    code: 'tut_highlight_invalid',
    rule: 'GDD 14.1',
  },
  {
    name: 'GDD 14.1 tut_done_invalid obstacleHit crate without crate',
    file: 'tut_done_obstaclehit_without_crate',
    code: 'tut_done_invalid',
    rule: 'GDD 14.1',
  },
  {
    name: 'GDD 14.1 tut_done_invalid steered without low gravity',
    file: 'tut_done_steered_without_low_gravity',
    code: 'tut_done_invalid',
    rule: 'GDD 14.1',
  },
  {
    name: 'GDD 14.1 tut_done_invalid startOn deliveryDone flag without such block',
    file: 'tut_done_startOn_flag_without_block',
    code: 'tut_done_invalid',
    rule: 'GDD 14.1',
  },
  {
    name: 'GDD 14.1/3 tut_done_invalid piece filter names no block',
    file: 'tut_done_piece_unknown',
    code: 'tut_done_invalid',
    rule: 'GDD 14.1',
  },
  {
    name: 'GDD 14.1/3 K-44 tut_done_invalid placementCorrect of an Ağır Yük',
    file: 'tut_done_piece_cargo_placement',
    code: 'tut_done_invalid',
    rule: 'GDD 14.1',
  },
  // others
  {
    name: 'LEVELS 0 difficulty_sawtooth warns for level 10 not hard',
    file: 'difficulty_sawtooth',
    code: 'difficulty_sawtooth',
    rule: 'LEVELS 0',
    severity: 'warn',
  },
  { name: 'K-24 elevator_range a ≥ b', file: 'elevator_range', code: 'elevator_range', rule: 'K-24' },
  {
    name: 'K-23 carousel_every_missing',
    file: 'carousel_every_missing',
    code: 'carousel_every_missing',
    rule: 'K-23',
  },
  { name: 'Y4 wet_moves_missing', file: 'wet_moves_missing', code: 'wet_moves_missing', rule: 'Y4' },
];

const codes = (issues: readonly Issue[]): string[] => [...new Set(issues.map((i) => i.code))].sort();

describe('K-45 invalid fixtures (tests/level/fixtures/invalid, Faz 2R)', () => {
  for (const c of CASES) {
    it(c.name, () => {
      const { issues } = validateLevelJson(loadFixture('invalid', c.file), c.ctx ?? {});
      const hit = issues.filter((i) => i.code === c.code);
      expect(hit.length, JSON.stringify(issues)).toBeGreaterThan(0);
      for (const i of hit) {
        expect(i.rule).toBe(c.rule);
        expect(i.severity).toBe(c.severity ?? 'error');
      }
      expect(codes(issues)).toEqual([c.code]);
    });
  }

  it('K-45 every invalid fixture file has a case', () => {
    const files = readdirSync(fixturePath('invalid')).map((f) => f.replace(/\.json$/, ''));
    expect(files.sort()).toEqual(CASES.map((c) => c.file).sort());
  });

  it('K-45 every Faz 2R validate code of TECH §2R.3 has an invalid fixture (L-35 tut_hand_invalid is levels:solve)', () => {
    const faz2r = [
      'yard_fill_high',
      'yard_fill_low',
      'shape_forbidden',
      'shape_locked',
      'piece_too_wide',
      'plan_size',
      'plan_has_window',
      'elevator_overflow',
      'cover_prefix_short',
      'untileable',
      'debris_misplaced',
      'too_many_new_mechanics',
      'teaches_mismatch',
      'size_out_of_range',
      'board_too_wide',
      'debris_correct_at_start',
      'cover_mismatch',
      'tut_too_many_steps',
      'tut_blocking',
    ];
    const covered = new Set(CASES.map((c) => c.code));
    expect(faz2r.filter((code) => !covered.has(code))).toEqual([]);
  });

  it('K-45 every issue carries code, rule, check and path', () => {
    for (const c of CASES) {
      for (const i of validateLevelJson(loadFixture('invalid', c.file), c.ctx ?? {}).issues) {
        expect(CHECK_IDS).toContain(i.check);
        expect(i.code).toMatch(/^[a-z_]+$/);
        expect(i.path.length).toBeGreaterThan(0);
        expect(i.message.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('K-45 valid fixtures (tests/level/fixtures/valid, Faz 2R)', () => {
  const VALID: readonly [string, readonly MechanicId[]][] = [
    ['base', []],
    ['cargo_level8', ['W1', 'S1', 'W2']],
    ['debris', ['W1', 'S1', 'W2', 'Y5', 'W3', 'Y1', 'S9']],
    ['segments_truck', ['W1']],
    ['paint_gate_totals', ['W1', 'S1', 'W2', 'Y5', 'W3', 'S4']],
    ['screw_under_block', ['W1', 'S1', 'W2', 'Y5', 'W3']],
    ['wide_site_s9', ['W1', 'S1', 'W2', 'Y5', 'W3']],
    ['startOn_first_mortar_batch', ['W1', 'S1', 'W2', 'Y5', 'W3']],
  ];
  for (const [name, history] of VALID) {
    it(`K-45 valid fixture ${name} passes every validate check`, () => {
      const { level: parsed, issues } = validateLevelJson(loadFixture('valid', name), {
        previousMechanics: prev(...history),
        i18nKeys: undefined,
      });
      expect(parsed).not.toBeNull();
      expect(issues).toEqual([]);
    });
  }

  it('K-45/1 id_mismatch when the file name number differs', () => {
    const { issues } = validateLevelJson(loadFixture('valid', 'base'), { fileId: 5 });
    expect(codes(issues)).toEqual(['id_mismatch']);
    expect(issues[0]?.rule).toBe('K-45/1');
  });

  it('K-45/1 id_mismatch when id is outside 1–50', () => {
    const json = { ...(loadFixture('valid', 'base') as object), id: 51, chapter: 5 };
    expect(validateLevelJson(json).issues.map((i) => i.code)).toContain('id_mismatch');
  });

  it('K-45/1 seed is optional (compile default, no issue)', () => {
    const json = { ...(loadFixture('valid', 'base') as Record<string, unknown>) };
    delete json.seed;
    expect(validateLevelJson(json).issues).toEqual([]);
  });

  it('K-45/1 targets bands need low ≤ high (schema_invalid on the band)', () => {
    const json = {
      ...(loadFixture('valid', 'base') as Record<string, unknown>),
      targets: { minShifts: [3, 2] },
    };
    const { issues } = validateLevelJson(json);
    expect(issues.map((i) => [i.code, i.path])).toEqual([['schema_invalid', 'targets.minShifts']]);
  });
});

/** A sized builder level (default site 2 × 6, yard 4 × 4) for single checks. */
const sized = (spec: LevelSpec): LevelData =>
  level({
    yard: { cols: 4, rows: 4 },
    site: { cols: 2, rows: 6 },
    plan: ['WW', 'YY', 'GG', 'GG', 'YW', 'YW'],
    ...spec,
  });
const only = (lvl: LevelData, ...checks: CheckId[]): string[] =>
  checkLevel(lvl, { only: checks }).map((i) => i.code);
type Gaps = NonNullable<NonNullable<LevelSpec['wall']>['gaps']>;

describe('K-45 Faz 2R logic details', () => {
  it('K-02 K-45/2 the yard band is 2 ≤ E ≤ ⌊0,4·C⌋, inclusive (C = 16: E 2…6 pass, 1 high, 7 low)', () => {
    const cells = (n: number): LevelSpec['pieces'] =>
      Array.from({ length: n }, (_, i) => ['B1_0', 'W', i % 4, Math.floor(i / 4)] as const);
    const run = (filled: number): string[] => only(sized({ pieces: cells(filled) }), 'L-03');
    expect(run(9)).toEqual(['yard_fill_low']); // E = 7
    expect(run(10)).toEqual([]); // E = 6 = ⌊6,4⌋ (GDD K-02 example Bölüm 3)
    expect(run(14)).toEqual([]); // E = 2
    expect(run(15)).toEqual(['yard_fill_high']); // E = 1
  });

  it('K-02 crates and cement bags fill yard cells, Ağır Yük too; screws and keys do not', () => {
    const pieces: LevelSpec['pieces'] = Array.from({ length: 8 }, (_, i) => [
      'B1_0',
      'W',
      i % 4,
      Math.floor(i / 4),
    ]);
    const lvl = (obstacles: LevelSpec['obstacles']): LevelData => sized({ pieces, obstacles });
    expect(only(lvl([]), 'L-03')).toEqual(['yard_fill_low']); // E = 8
    expect(
      only(
        lvl([
          { type: 'crate', x: 0, y: 2, hp: 1 },
          { type: 'cement_bag', x: 1, y: 2 },
        ]),
        'L-03',
      ),
    ).toEqual([]);
    expect(
      only(
        lvl([
          { type: 'screw', x: 0, y: 0 },
          { type: 'key', x: 1, y: 0, id: 'k' },
        ]),
        'L-03',
      ),
    ).toEqual(['yard_fill_low']);
    const cargo = level({
      id: 8,
      yard: { cols: 6, rows: 4 },
      site: { cols: 2, rows: 6 },
      plan: ['WW', 'WW', 'WW', 'WW', 'WW', 'WW'],
      pieces: [
        ['Q9_0', 'W', 0, 0],
        ['O4_0', 'W', 3, 0],
        ['O4_0', 'W', 3, 2],
        ['D2_0', 'W', 5, 0],
        ['D2_0', 'W', 5, 2],
      ],
    });
    expect(only(cargo, 'L-03')).toEqual([]); // F = 9 + 12, E = 3
  });

  it('K-49 K-45/2 size ranges: Wy 3–6, Hy 4–8, Hs 4–8, Ws 2–3 in story chapters 1–3 and 2–4 in 4–5', () => {
    const sizes = (id: number, yard: [number, number], site: [number, number]): string[] =>
      checkLevel(
        level({
          id,
          yard: { cols: yard[0], rows: yard[1] },
          site: { cols: site[0], rows: site[1] },
          pieces: [['B1_0', 'W', 0, 0]],
        }),
        {
          only: ['L-28'],
        },
      ).map((i) => `${i.code}@${i.path}`);
    expect(sizes(1, [4, 4], [2, 5])).toEqual([]);
    expect(sizes(1, [3, 8], [3, 4])).toEqual([]);
    expect(sizes(1, [2, 4], [2, 5])).toEqual(['size_out_of_range@yard.cols']);
    expect(sizes(1, [4, 3], [2, 5])).toEqual(['size_out_of_range@yard.rows']);
    expect(sizes(1, [4, 4], [2, 3])).toEqual(['size_out_of_range@site.rows']);
    expect(sizes(30, [4, 4], [4, 5])).toEqual(['size_out_of_range@site.cols']);
    expect(sizes(31, [4, 4], [4, 5])).toEqual([]);
    expect(sizes(41, [5, 4], [4, 5])).toEqual(['board_too_wide@site.cols']);
    // K-49 example: Wy = 6, Ws = 3 → board_too_wide
    expect(sizes(12, [6, 5], [3, 5])).toEqual(['board_too_wide@site.cols']);
  });

  it('K-49 a level outside the 8 × 10 frame stops after L-28: no geometry, no other check', () => {
    const json = { ...(loadFixture('valid', 'base') as LevelInput) };
    const wide = { ...json, yard: { ...json.yard, cols: 7 }, site: { cols: 3, rows: 6 } };
    expect(codes(validateLevelJson(wide).issues)).toEqual(['board_too_wide', 'size_out_of_range']);
    const tall = { ...json, site: { cols: 2, rows: 9 } };
    expect(validateLevelJson(tall).issues.map((i) => `${i.code}@${i.path}`)).toEqual([
      'size_out_of_range@site.rows',
    ]);
  });

  it('K-45/4 K-15 GDD example ["YY","W."] on Hs 5: plan_has_window and plan_size; no cover verdict on a broken plan', () => {
    const json = loadFixture('valid', 'base') as LevelInput;
    const bad = {
      ...json,
      site: { cols: 2, rows: 5 },
      build: { ...json.build, segments: [{ name: { tr: 'A', en: 'A' }, rows: ['YY', 'W.'] }] },
    };
    expect(codes(validateLevelJson(bad).issues)).toEqual(['plan_has_window', 'plan_size']);
  });

  it('K-47/1 Ağır Yük is no supply and has no colour: colour set and cover ignore a colour written on it', () => {
    const json = loadFixture('valid', 'cargo_level8') as LevelInput;
    const q9 = json.yard.batches[0]?.pieces[5];
    if (q9) q9.color = 'R';
    const { level: parsed, issues } = validateLevelJson(json);
    expect(issues).toEqual([]);
    if (!parsed) throw new Error('schema');
    expect(levelColorSet(parsed)).toEqual(['W', 'Y', 'G']);
  });

  it('K-47/1 W6: only the totals have to match (the paint gate turns Y into P); one cell more is cover_mismatch', () => {
    expect(validateLevelJson(loadFixture('valid', 'paint_gate_totals')).issues).toEqual([]);
    const json = loadFixture('valid', 'paint_gate_totals') as LevelInput;
    json.yard.batches[0]?.pieces.push({ shape: 'B1_0', color: 'P', x: 2, y: 2 });
    const { issues } = validateLevelJson(json);
    expect(issues.map((i) => i.code)).toEqual(['cover_mismatch']);
    expect(issues[0]?.message).toContain('13 ≠ plan cells 12');
  });

  it('K-47/2 the last prefix is the whole level: a total shortage is cover_mismatch, not cover_prefix_short', () => {
    const json = loadFixture('valid', 'segments_truck') as LevelInput;
    json.yard.batches[1] = { forSegment: 1, pieces: [{ shape: 'D2_0', color: 'W', x: 0, y: 4 }] };
    expect(codes(validateLevelJson(json).issues)).toEqual(['cover_mismatch']);
  });

  it('K-47/2 cover_prefix_short is skipped in carousel mode and with a W6 gate', () => {
    const json = loadFixture('invalid', 'cover_prefix_short') as LevelInput;
    const carousel = { ...json, build: { ...json.build, mode: 'carousel' as const, carouselEvery: 3 } };
    expect(codes(validateLevelJson(carousel).issues)).toEqual([]);
  });

  it('K-30 D3a respects batch availability: a truck block never fills an earlier segment (carousel ignores it)', () => {
    const json = loadFixture('invalid', 'cover_prefix_short');
    const parsed = LevelSchema.parse(json) as LevelData;
    const { plans } = buildPlans(parsed);
    expect(tileLevel(parsed, plans)).toBe('dead');
    const carousel = { ...parsed, build: { ...parsed.build, mode: 'carousel' as const, carouselEvery: 3 } };
    expect(tileLevel(carousel, buildPlans(carousel).plans)).toBe('ok');
  });

  it('K-30 D3a paint joker: a block that fits a paint gate may take its colour', () => {
    const parsed = LevelSchema.parse(loadFixture('valid', 'paint_gate_totals')) as LevelData;
    expect(tileLevel(parsed, buildPlans(parsed).plans)).toBe('ok');
    const noGate = { ...parsed, wall: { ...parsed.wall, gaps: [] } };
    expect(tileLevel(noGate, buildPlans(noGate).plans)).toBe('dead');
    // the joker needs the box height to fit the gate: a 1-row gate paints the 1-high D2_90 only (still enough here)
    const low = {
      ...parsed,
      wall: { ...parsed.wall, gaps: [{ type: 'paint' as const, y: 0, size: 1, color: 'P' as const }] },
    };
    expect(tileLevel(low, buildPlans(low).plans)).toBe('ok');
  });

  it('K-30 D3a budget exhaustion is unknown, not dead, and L-11 then reports nothing (K-45/8)', () => {
    const parsed = LevelSchema.parse(loadFixture('invalid', 'untileable')) as LevelData;
    const { plans } = buildPlans(parsed);
    expect(tileLevel(parsed, plans)).toBe('dead');
    expect(tileLevel(parsed, plans, undefined, 0)).toBe('unknown');
    expect(checkLevel(parsed, { only: ['L-11'], tileBudget: 0 })).toEqual([]);
    expect(TILE_BUDGET).toBe(20_000);
  });

  it('K-30 D3a solves the LEVELS levels 1–10 drafts within 200 expansions each (TECH §2R.4)', () => {
    for (let n = 1; n <= 10; n++) {
      const parsed = LevelSchema.parse(
        loadFixture('levels-2r', `level_${String(n).padStart(3, '0')}`),
      ) as LevelData;
      expect(tileLevel(parsed, buildPlans(parsed).plans, undefined, 200), `level ${n}`).toBe('ok');
    }
  });

  it('K-30 D3a: every shape has contiguous columns (the profile update relies on it)', () => {
    for (const s of SHAPES) {
      for (let c = 0; c < s.w; c++) {
        const rows = s.cells.filter((p) => p.x === c).map((p) => p.y);
        expect(rows.length, s.id).toBe((s.colTop[c] ?? 0) - (s.colBottom[c] ?? 0) + 1);
      }
    }
  });

  it('K-44 isCargo (level modules) equals movement.ts isCargoShape on every shape: I5 and Q9 only', () => {
    for (const s of SHAPES) expect(isCargo(s), s.id).toBe(isCargoShape(s));
    expect(SHAPES.filter((s) => isCargo(s)).map((s) => s.kind)).toEqual([
      'I5',
      'I5',
      'I5',
      'I5',
      'Q9',
      'Q9',
      'Q9',
      'Q9',
    ]);
  });

  it('K-44 K-05 K-12 canReachSite: over the wall by (H + 2) − height, or a gap; never Ağır Yük; a w ≥ 3 block is material', () => {
    const lvl = (height: number, gaps: Gaps = []): LevelData =>
      sized({ id: 12, wall: { height, gaps }, pieces: [['B1_0', 'W', 0, 0]] });
    // H = 6: height 6 leaves 2 open rows
    expect(canReachSite(shapeById('D2_0'), lvl(6))).toBe(true);
    expect(canReachSite(shapeById('I3_0'), lvl(6))).toBe(false);
    expect(canReachSite(shapeById('I3_0'), lvl(5))).toBe(true);
    expect(canReachSite(shapeById('I3_0'), lvl(6, [{ type: 'static', y: 0, size: 3 }]))).toBe(true);
    expect(canReachSite(shapeById('I3_90'), lvl(6))).toBe(true);
    expect(canReachSite(shapeById('Q9_0'), lvl(0))).toBe(false);
    expect(canReachSite(shapeById('I5_0'), lvl(0))).toBe(false);
  });

  it('K-45/7 S4 debris_correct_at_start follows K-16 with K-34 support: a W debris on a W cell above empty cells is wrong', () => {
    const debris = (spec: LevelSpec['debris']): string[] =>
      only(sized({ id: 17, chapter: 2, pieces: [['B1_0', 'W', 0, 0]], debris: spec }), 'L-29');
    expect(debris([['B1_0', 'W', 5, 5]])).toEqual([]); // top W cell, nothing below: no support
    expect(debris([['D2_0', 'W', 5, 0]])).toEqual(['debris_correct_at_start']);
    expect(debris([['D2_0', 'Y', 5, 0]])).toEqual([]); // wrong colour
    // the lower debris is correct; the upper one stays wrong: rows 2–3 under it are not filled (K-34)
    expect(
      debris([
        ['D2_0', 'Y', 4, 0],
        ['D2_90', 'Y', 4, 4],
      ]),
    ).toEqual(['debris_correct_at_start']);
    expect(
      checkLevel(
        sized({
          id: 17,
          chapter: 2,
          pieces: [['B1_0', 'W', 0, 0]],
          // stacked: (5,1) is supported by the correct debris (5,0) below it
          debris: [
            ['D2_0', 'Y', 4, 0],
            ['B1_0', 'W', 5, 0],
            ['B1_0', 'W', 5, 1],
          ],
        }),
        {
          only: ['L-29'],
        },
      ).map((i) => i.path),
    ).toEqual(['build.debris[0]', 'build.debris[1]', 'build.debris[2]']);
  });

  it('K-45 runtime subset (Faz 2R transition): L-02, L-04, L-08, L-09, L-24, L-25, L-26, L-28; L-05 is validate-only until WP-M', () => {
    expect(RUNTIME_CHECKS).toEqual(['L-02', 'L-04', 'L-08', 'L-09', 'L-24', 'L-25', 'L-26', 'L-28']);
    const run = (file: string): string[] =>
      validateLevelJson(loadFixture('invalid', file), { only: RUNTIME_CHECKS }).issues.map((i) => i.code);
    expect(run('yard_fill_low')).toEqual([]);
    expect(run('plan_size_rows')).toEqual([]);
    expect(run('gap_touches_top')).toEqual(['gap_touches_top']);
    expect(run('board_too_wide')).toEqual(['board_too_wide']);
    expect(run('piece_too_wide')).toEqual(['piece_too_wide']);
    const wide = loadLevel(loadFixture('invalid', 'board_too_wide'));
    expect(wide.ok).toBe(false);
    expect(loadLevel(loadFixture('valid', 'base')).ok).toBe(true);
  });

  it('K-45/1 crate without hp is schema_invalid', () => {
    const lvl = sized({ id: 11, pieces: [['B1_0', 'W', 0, 0]], obstacles: [{ type: 'crate', x: 1, y: 0 }] });
    expect(only(lvl, 'L-14')).toEqual(['schema_invalid']);
  });
});

describe('GDD 14.1 L-17 tutorial checks (Faz 2R)', () => {
  it('GDD 14.1 tutorial booster and pre highlights need the unlock level (economy.json)', () => {
    const lvl = sized({
      id: 9,
      pieces: [['B1_0', 'W', 0, 0]],
      tutorial: [
        { step: 1, highlight: ['booster:hammer'], textKey: 'tut.l9.a', done: { event: 'tap' } },
        { step: 2, highlight: ['pre:thermos'], textKey: 'tut.l9.b', done: { event: 'tap' } },
      ],
    });
    const issues = checkLevel(lvl, { only: ['L-17'], boosterUnlock: { hammer: 8, thermos: 12 } });
    expect(issues.map((i) => i.path)).toEqual(['tutorial[1].highlight[0]']);
    expect(issues[0]?.code).toBe('tut_highlight_invalid');
  });

  it('L-17 a drag / hold glove starts on a cell of a highlighted block at its start (LEVELS 5; GDD 14 hand.path (1))', () => {
    const glove = (path: [number, number][], kind: 'drag' | 'hold' | 'tap' = 'hold') =>
      sized({
        id: 2,
        pieces: [
          ['C3_180', 'Y', 0, 2],
          ['B1_0', 'G', 2, 0],
        ],
        tutorial: [
          {
            step: 1,
            highlight: ['piece:0', 'build'],
            hand: { kind, path },
            textKey: 'tut.m.shadow',
            done: { event: 'placementCorrect', count: 1 },
          },
        ],
      });
    // C3_180 anchored (0,2) covers (1,2), (0,3), (1,3): (0,2) is the anchor, not a block cell (LEVELS Bölüm 2 adım 2)
    const bad = checkLevel(
      glove([
        [0, 2],
        [0, 4],
        [5, 4],
      ]),
      { only: ['L-17'] },
    );
    expect(bad.map((i) => [i.code, i.path])).toEqual([['tut_highlight_invalid', 'tutorial[0].hand.path[0]']]);
    expect(
      checkLevel(
        glove([
          [1, 3],
          [1, 5],
          [5, 5],
        ]),
        { only: ['L-17'] },
      ),
    ).toEqual([]);
    expect(checkLevel(glove([[0, 2]], 'tap'), { only: ['L-17'] })).toEqual([]); // a tap may press any cell
  });

  it('L-17 tut_hold_done: a holdOverBuild done / startOn is a warning (LEVELS 5)', () => {
    const lvl = sized({
      id: 2,
      pieces: [['B1_0', 'W', 0, 0]],
      tutorial: [
        {
          step: 1,
          highlight: ['build'],
          textKey: 'tut.m.shadow',
          done: { event: 'holdOverBuild', count: 1, minMs: 500 },
        },
        {
          step: 2,
          highlight: ['build'],
          textKey: 'tut.m.free',
          startOn: { event: 'holdOverBuild', count: 1, minMs: 500 },
          done: { event: 'placementCorrect', count: 1 },
        },
      ],
    });
    expect(checkLevel(lvl, { only: ['L-17'] }).map((i) => [i.code, i.path, i.severity])).toEqual([
      ['tut_hold_done', 'tutorial[0].done', 'warn'],
      ['tut_hold_done', 'tutorial[1].startOn', 'warn'],
    ]);
  });

  it('GDD 14.1 tutorial steps are numbered 1, 2, … and done.at regions follow the level geometry (K-49)', () => {
    const at = (event: 'yardMove' | 'placementCorrect', x: number, y: number, step = 1): string[] =>
      only(
        sized({
          id: 7,
          pieces: [['B1_0', 'W', 0, 0]],
          tutorial: [{ step, highlight: ['build'], textKey: 'tut.m.free', done: { event, at: [x, y] } }],
        }),
        'L-17',
      );
    expect(at('yardMove', 3, 3)).toEqual([]);
    expect(at('yardMove', 4, 0)).toEqual(['tut_done_invalid']); // x = Wy is the site
    expect(at('yardMove', 0, 4)).toEqual(['tut_done_invalid']); // y = Hy is yard air
    expect(at('placementCorrect', 4, 5)).toEqual([]);
    expect(at('placementCorrect', 3, 0)).toEqual(['tut_done_invalid']);
    expect(at('placementCorrect', 4, 6)).toEqual(['tut_done_invalid']); // y = H
    expect(at('yardMove', 3, 3, 2)).toEqual(['tut_done_invalid']); // numbered 2 as the first step
  });

  it('GDD 14.1/5 a truck block may be highlighted once its batch is on the board: startOn deliveryDone, or after its segmentDone (LEVELS Bölüm 5 adım 2)', () => {
    expect(validateLevelJson(loadFixture('valid', 'segments_truck'), { only: ['L-17'] }).issues).toEqual([]);
    const json = loadFixture('valid', 'segments_truck') as LevelInput;
    const steps = (tutorial: LevelInput['tutorial']): string[] =>
      validateLevelJson({ ...json, tutorial }, { only: ['L-17'] }).issues.map((i) => i.code);
    // the step itself starts on the segmentDone (Bölüm 7/10 style)
    expect(
      steps([
        {
          step: 1,
          highlight: ['piece:k1_0'],
          textKey: 'tut.m.truck',
          startOn: { event: 'segmentDone' },
          done: { event: 'tap' },
        },
      ]),
    ).toEqual([]);
    // an earlier step's done that is not a segmentDone does not deliver the batch
    expect(
      steps([
        { step: 1, highlight: ['panorama'], textKey: 'tut.m.segments', done: { event: 'placementCorrect' } },
        { step: 2, highlight: ['piece:k1_0'], textKey: 'tut.m.truck', done: { event: 'tap' } },
      ]),
    ).toEqual(['tut_highlight_invalid']);
  });

  it('K-53/1 K-45/10 two steps are allowed, the third is tut_too_many_steps', () => {
    const json = loadFixture('valid', 'base') as LevelInput;
    expect((json.tutorial ?? []).length).toBe(2);
    expect(validateLevelJson(json, { only: ['L-31'] }).issues).toEqual([]);
    const four = { ...json, tutorial: [...(json.tutorial ?? []), ...(json.tutorial ?? [])] };
    expect(validateLevelJson(four, { only: ['L-31'] }).issues.map((i) => i.message)).toEqual([
      '4 steps; a level has at most 2 (K-53/1)',
    ]);
  });

  it('L-17 every Faz 2 level 1–5 glove starts on its highlighted block; none ends a step on holdOverBuild', () => {
    // Faz 2 levels/*.json: WP-M replaces them with the Faz 2R levels; the check itself is unchanged.
    for (const id of [1, 2, 3, 4, 5]) {
      const data = JSON.parse(
        readFileSync(join(ROOT, 'levels', `level_${String(id).padStart(3, '0')}.json`), 'utf8'),
      ) as LevelData;
      const issues = checkLevel(data, { only: ['L-17'] });
      expect(
        issues.filter((i) => i.path.endsWith('hand.path[0]')),
        `level ${id}`,
      ).toEqual([]);
      expect(
        issues.filter((i) => i.code === 'tut_hold_done'),
        `level ${id}`,
      ).toEqual([]);
    }
  });
});
