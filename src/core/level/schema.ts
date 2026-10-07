/**
 * Level schema (docs/TECH_DESIGN.md §8.2 and the Faz 2R delta §2R.2; GDD §14, §14.1, K-45, K-49, K-53; D-053, D-055).
 * The game and the tools use THIS schema. Written with `zod/mini` (bundle size, §8.1). Value presence rules (carousel ⇔
 * carouselEvery, wet ⇔ wetMoves, elevator range …) and every rule that needs the level geometry (K-49 sizes, plan size,
 * tutorial step count, `mode` …) live in logic.ts, so they get their own K-45 code instead of `schema_invalid`.
 */
import * as z from 'zod/mini';
import { SHAPE_KINDS } from '../types.ts';
import type { ColorCode } from '../types.ts';

/**
 * OBSTACLES "Veri imzası" (Faz 2R): 27 mechanic ids in table order (S7-R and S7-M separate; S2 Plan Boşluğu is out of the
 * MVP and not in the table, CL-2R-12; S9 Geniş Şantiye is new). Detection: mechanics.ts.
 */
export const MECHANIC_IDS = [
  'W1',
  'W2',
  'W3',
  'W4',
  'W5',
  'W6',
  'W7',
  'W8',
  'Y1',
  'Y2',
  'Y3',
  'Y4',
  'Y5',
  'Y6',
  'Y7',
  'Y8',
  'S1',
  'S3',
  'S4',
  'S5',
  'S6',
  'S7-R',
  'S7-M',
  'S8',
  'G-H',
  'G-L',
  'S9',
] as const;
/**
 * @deprecated Faz 2R transition (TECH §2R.12): S2 left the signature table (R2-01, `plan_has_window`). The id stays in
 * the type for the S2 obstacle plugin (until WP-C removes it) and in the `teaches` enum so the Faz 2 level 4 still
 * loads in the game until WP-M replaces it; no level derives it, so `teaches: "S2"` is always L-16 `teaches_mismatch`.
 */
export const LEGACY_MECHANIC_IDS = ['S2'] as const;
export type LegacyMechanicId = (typeof LEGACY_MECHANIC_IDS)[number];
/** A mechanic id of the signature table (plus the transitional legacy id). */
export type MechanicId = (typeof MECHANIC_IDS)[number] | LegacyMechanicId;

/** GDD §14.1/3 closed `done` vocabulary (16 events). Each one is a separate union member below. */
export const TUT_EVENTS = [
  'overWall',
  'gapPass',
  'holdOverBuild',
  'turnEnd',
  'placementCorrect',
  'yardMove',
  'landed',
  'steered',
  'obstacleHit',
  'itemCollected',
  'yardFall',
  'segmentDone',
  'deliveryDone',
  'carouselTurn',
  'tap',
  'boosterUsed',
] as const;
export type TutEvent = (typeof TUT_EVENTS)[number];

/** UX_FLOWS §13.1 highlight vocabulary, one regex alternative per entry (TECH §8.2). */
export const HIGHLIGHT_PATTERNS = [
  'piece:(\\d{1,2}|k[1-9]_\\d{1,2})',
  'cell:[0-7],[0-9]',
  'gap:[0-2]',
  'obstacle:\\d{1,2}',
  'debris:\\d{1,2}',
  'booster:(hammer|crane|brush|undo)',
  'pre:(thermos|trowel|shutter)',
  'wall',
  'crane',
  'build',
  'front',
  'panorama',
  'goals',
  // Faz 2R (UX §13.1, CL-2R-21): the blocks-left chip alone; `goals` is the whole panel.
  'blocks',
  'moves',
  'truck',
  'streak',
  'fan',
] as const;

const Color = z.enum(['W', 'Y', 'G', 'R', 'O', 'C', 'B', 'P']);
const ShapeIdSchema = z.templateLiteral([
  z.enum(SHAPE_KINDS),
  '_',
  z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
]);
const Int = (min: number, max: number) => z.int().check(z.minimum(min), z.maximum(max));
const I18nText = z.strictObject({
  tr: z.string().check(z.minLength(1)),
  en: z.string().check(z.minLength(1)),
});
const Flag = z.enum(['glass', 'mortar', 'balloon', 'chained', 'wet']);

/**
 * K-49 size field. The schema only bounds it loosely; the K-49 ranges and the frame (`Wy + Ws ≤ 8`) are logic checks
 * (L-28 `size_out_of_range`, `board_too_wide`) so a wrong size gets its own code.
 */
const Size = Int(1, 16);

/** GDD K-44 (Faz 2R): Ağır Yük shapes. Their `color` is optional and ignored (no colour, not material). */
const CARGO_SHAPE = /^(I5|Q9)_/;
/**
 * Colour of a parsed Ağır Yük piece written without `color` (K-44: "verideki `color` yok sayılır"). Only a placeholder
 * that keeps `PieceData.color` a `ColorCode`: no rule reads the colour of a cargo piece (colour set, cover, D3a and
 * the core class all skip I5/Q9), and the renderer draws cargo by shape.
 */
export const CARGO_PLACEHOLDER_COLOR: ColorCode = 'W';

const PiecePlacementInput = z
  .strictObject({
    shape: ShapeIdSchema,
    /** Required for material blocks; optional and ignored for I5/Q9 (Ağır Yük, K-44). */
    color: z.optional(Color),
    x: Int(0, 7),
    /** Batch k ≥ 1: written as Hy (`yard.rows`, default 8) and ignored (K-25). */
    y: Int(0, 9),
    flags: z.optional(z.array(Flag)),
    /** OBSTACLES Y4; `wet` ⇔ `wetMoves` (L-26). */
    wetMoves: z.optional(Int(1, 5)),
  })
  .check(
    z.superRefine((p, ctx) => {
      if (p.color === undefined && !CARGO_SHAPE.test(p.shape))
        ctx.addIssue({
          code: 'custom',
          message: `${p.shape} is a material block: color is required (only I5/Q9 Ağır Yük has no colour, K-44)`,
          path: ['color'],
          input: p,
        });
    }),
  );
type PieceInput = z.output<typeof PiecePlacementInput>;
const PiecePlacement = z.pipe(
  PiecePlacementInput,
  z.transform((p: PieceInput): Omit<PieceInput, 'color'> & { color: ColorCode } => ({
    ...p,
    color: p.color ?? CARGO_PLACEHOLDER_COLOR,
  })),
);

/**
 * Debris (OBSTACLES S4, Faz 2R): a material block in the wrong place of its segment's site area; no flags (K-21),
 * colour required, `segment` omitted = 0 (K-45/7, P-5). `x` is a board column, `y` a plan row; the site region check is
 * L-13 (`debris_misplaced`, x ≥ Wy).
 */
const DebrisPlacement = z.strictObject({
  shape: ShapeIdSchema,
  color: Color,
  x: Int(0, 7),
  y: Int(0, 7),
  segment: z.optional(Int(0, 4)),
});

/** GDD §14 direction format (elevator and slider). */
const Dir = z.union([z.literal(1), z.literal(-1)]);
const GapBase = { y: Int(0, 7), size: Int(1, 7) };
const Gap = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('static'), ...GapBase }),
  /** `phase` default 0 = starts open (GDD S-24); `< 2·period` (L-09). */
  z.strictObject({
    type: z.literal('shutter'),
    ...GapBase,
    period: Int(1, 4),
    phase: z._default(Int(0, 7), 0),
  }),
  /** `dir` default 1 (GDD §14, OBSTACLES W5). */
  z.strictObject({
    type: z.literal('slider'),
    ...GapBase,
    range: z.tuple([Int(0, 7), Int(0, 7)]),
    dir: z._default(Dir, 1),
  }),
  z.strictObject({ type: z.literal('paint'), ...GapBase, color: Color }),
  z.strictObject({ type: z.literal('locked'), ...GapBase, keyId: z.string().check(z.minLength(1)) }),
]);

const HiddenRule = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('repeat'), period: Int(1, 4) }),
  z.strictObject({ kind: z.literal('mirrorOf'), segment: Int(0, 4) }),
]);

export const HIGHLIGHT_REGEX = new RegExp('^(' + HIGHLIGHT_PATTERNS.join('|') + ')$');
const Highlight = z.string().check(z.regex(HIGHLIGHT_REGEX));

/** `piece` filter of `yardMove` / `placementCorrect` (GDD §14.1/3, DL-2R-02): a block highlight id. */
export const PIECE_REF_REGEX = /^piece:(\d{1,2}|k[1-9]_\d{1,2})$/;

const Count = z.optional(Int(1, 9));
/** Anchor in global coordinates; region check (yard / site of this level's geometry) in L-17. */
const AtCell = z.optional(z.tuple([Int(0, 7), Int(0, 7)]));
const PieceRef = z.optional(z.string().check(z.regex(PIECE_REF_REGEX)));
const FlagFilter = z.optional(z.enum(['glass', 'balloon', 'mortar']));
const Yes = z.optional(z.literal(true));

/**
 * GDD §14.1/3 closed `done` vocabulary. Filters and parameters may only be written on the event GDD allows
 * (strictObject → elsewhere `schema_invalid`). Faz 2R (K-53, CL-2R-10): `done` and `startOn` are events only;
 * `{ timeoutMs }` is no longer valid (`schema_invalid`).
 */
export const TutCond = z.discriminatedUnion('event', [
  // drag signals
  z.strictObject({ event: z.literal('overWall'), count: Count }),
  z.strictObject({ event: z.literal('gapPass'), count: Count }),
  z.strictObject({ event: z.literal('holdOverBuild'), count: Count, minMs: Int(100, 5000) }),
  // move-end events (K-35)
  z.strictObject({ event: z.literal('turnEnd'), count: Count }),
  z.strictObject({
    event: z.literal('placementCorrect'),
    count: Count,
    at: AtCell,
    piece: PieceRef,
    hidden: Yes,
  }),
  z.strictObject({ event: z.literal('yardMove'), count: Count, at: AtCell, piece: PieceRef, painted: Yes }),
  z.strictObject({ event: z.literal('landed'), count: Count, flag: FlagFilter, wind: Yes }),
  z.strictObject({ event: z.literal('steered'), count: Count }),
  z.strictObject({
    event: z.literal('obstacleHit'),
    count: Count,
    type: z.enum(['crate', 'cement_bag', 'chain']),
  }),
  z.strictObject({ event: z.literal('itemCollected'), count: Count, type: z.enum(['screw', 'key']) }),
  z.strictObject({ event: z.literal('yardFall'), count: Count }),
  z.strictObject({ event: z.literal('segmentDone'), count: Count }),
  z.strictObject({ event: z.literal('deliveryDone'), count: Count, flag: FlagFilter }),
  z.strictObject({ event: z.literal('carouselTurn'), count: Count }),
  // other
  z.strictObject({ event: z.literal('tap'), count: Count }),
  z.strictObject({ event: z.literal('boosterUsed'), count: Count }),
]);

/** Plan row characters (K-15, K-32); `.` passes the schema so L-05 can name it (`plan_has_window`). */
const PLAN_ROW = /^[WYGROCBP.?]{1,4}$/;
const Segment = z.strictObject({
  name: I18nText,
  /** Top → bottom; exactly `site.rows` rows of exactly `site.cols` characters (L-05 `plan_size`, K-15). */
  rows: z.array(z.string().check(z.regex(PLAN_ROW))).check(z.minLength(1), z.maxLength(8)),
  hidden: z.optional(HiddenRule),
});

const Goal = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('build') }),
  z.strictObject({
    type: z.literal('clear'),
    target: z.enum(['crate', 'chain', 'debris']),
    count: Int(1, 99),
  }),
  z.strictObject({ type: z.literal('collect'), item: z.literal('screw'), count: Int(1, 99) }),
]);

/**
 * `textKey` (GDD §14.1/1, Faz 2R): `tut.l<n>.<topic>`, mechanic based `tut.m.<topic>` (STORY §6A) or a reused context
 * line `tut.ctx.<topic>`. A key outside this format is `tut_key_missing` (TECH §2R.2).
 */
export const TUT_TEXT_KEY_REGEX = /^tut\.(l\d{1,2}|m|ctx)\.[a-z][A-Za-z0-9]*$/;

/**
 * One tutorial step (K-53, Faz 2R). `mode` is optional and may only be `'soft'`; it is a plain string here so any
 * other value is reported by L-31 as `tut_blocking` (a spotlight / dim field is mapped to the same code from the schema
 * error, logic.ts `issuesFromSchema`). At most 2 steps per level (L-31 `tut_too_many_steps`).
 */
const TutorialStep = z.strictObject({
  step: Int(1, 20),
  mode: z.optional(z.string()),
  highlight: z.array(Highlight),
  hand: z.optional(
    z.strictObject({
      kind: z.enum(['tap', 'drag', 'hold']),
      /** Held cells in board coordinates (GDD §14 "`hand.path` anlamı"); full check L-35 at `levels:solve`. */
      path: z.optional(z.array(z.tuple([Int(0, 7), Int(0, 9)]))),
    }),
  ),
  textKey: z.string().check(z.regex(TUT_TEXT_KEY_REGEX)),
  /** GDD §14.1/5: same format as `done`. */
  startOn: z.optional(TutCond),
  done: TutCond,
});

/** A target band `[low, high]` of a K-50 metric (LEVELS §0, P-2R-4; `low ≤ high` is checked by L-01). */
const Band = z.tuple([Int(0, 99), Int(0, 99)]);
const Rate = z.number().check(z.minimum(0), z.maximum(1));

/**
 * `targets` (TECH §2R.2, LEVELS §0): machine-readable copy of the LEVELS §2 target bands; the game does not read it,
 * `levels:solve` compares the K-50 metrics with it (`metric_out_of_band`, L-33).
 */
const Targets = z.strictObject({
  minShifts: z.optional(Band),
  firstNeedDepth: z.optional(Band),
  choices0: z.optional(Band),
  deadRate: z.optional(z.tuple([Rate, Rate])),
});

export const LevelSchema = z.strictObject({
  schemaVersion: z.optional(z.literal(1)),
  id: Int(1, 999),
  chapter: Int(1, 5),
  name: I18nText,
  difficulty: z.enum(['easy', 'normal', 'hard', 'superhard']),
  moves: Int(1, 99),
  teaches: z.optional(z.enum([...MECHANIC_IDS, ...LEGACY_MECHANIC_IDS])),
  /** K-45/1: missing → compile uses `id × 1000 + id`. */
  seed: z.optional(z.int()),
  goals: z.array(Goal).check(z.minLength(1), z.maxLength(3)),
  gravity: z.strictObject({ build: z.enum(['low', 'normal', 'high']), yard: z.boolean() }),
  wall: z.strictObject({
    /** `0 ≤ height ≤ H` (K-04, K-45/3; the H bound is L-09). */
    height: Int(0, 8),
    gaps: z.array(Gap).check(z.maxLength(3)),
    fan: z.optional(z.strictObject({ dir: z.enum(['left', 'right']) })),
  }),
  /** K-49 site size `Ws × Hs` (optional; default `{ cols: 2, rows: 8 }`). */
  site: z.optional(z.strictObject({ cols: Size, rows: Size })),
  build: z.strictObject({
    /** BRIEF's 'elevator' mode moved to its own field (P-6, S-16). */
    mode: z.enum(['segments', 'carousel']),
    /** K-23; mode 'carousel' ⇔ present (L-25). */
    carouselEvery: z.optional(Int(2, 6)),
    /** K-24: 0 ≤ a < b ≤ 3, a ≤ start ≤ b (L-24); start and dir required (GDD §14); `Hs + b ≤ 8` (L-05). */
    elevator: z.optional(
      z.strictObject({ range: z.tuple([Int(0, 3), Int(0, 3)]), start: Int(0, 3), dir: Dir }),
    ),
    /** K-22: 1 ≤ S ≤ 5. */
    segments: z.array(Segment).check(z.minLength(1), z.maxLength(5)),
    debris: z.optional(z.array(DebrisPlacement)),
  }),
  yard: z.strictObject({
    /** K-49 yard size `Wy × Hy` (optional; default 6 × 8). */
    cols: z.optional(Size),
    rows: z.optional(Size),
    batches: z
      .array(
        z.strictObject({
          forSegment: Int(0, 5),
          dropColumns: z.optional(z.array(Int(0, 5))),
          pieces: z.array(PiecePlacement).check(z.minLength(1)),
        }),
      )
      .check(z.minLength(1)),
  }),
  obstacles: z.array(
    z.strictObject({
      type: z.enum(['crate', 'cement_bag', 'screw', 'key']),
      x: Int(0, 5),
      y: Int(0, 7),
      hp: z.optional(Int(1, 3)),
      id: z.optional(z.string()),
    }),
  ),
  tutorial: z.optional(z.array(TutorialStep)),
  /** K-50 target bands for `levels:solve` (optional; the game ignores it). */
  targets: z.optional(Targets),
});

type ParsedLevel = z.output<typeof LevelSchema>;
type InputLevel = z.input<typeof LevelSchema>;
type InputStep = NonNullable<InputLevel['tutorial']>[number];
export type TutCondition = z.output<typeof TutCond>;
/** A parsed Faz 2R tutorial step. */
export type TutorialStep2R = NonNullable<ParsedLevel['tutorial']>[number];
/**
 * @deprecated Faz 2R transition (TECH §2R.9, WP-H): the pre-2R timed step `{ timeoutMs }`. The schema no longer accepts
 * or produces it (`schema_invalid`, CL-2R-10); it stays in the level TYPES so the tutorial scene code and its tests,
 * which compile level data directly, keep compiling until WP-H removes the timed-step branch.
 */
export interface LegacyTimedDone {
  readonly timeoutMs: number;
}
/** The tutorial step as the scene reads it (every parsed step is one; see `LegacyTimedDone`). */
export type TutorialStepData = Omit<TutorialStep2R, 'done'> & {
  readonly done: TutCondition | LegacyTimedDone;
};
/** Parsed level (defaults applied: shutter `phase`, slider `dir`; cargo colour placeholder). */
export type LevelData = Omit<ParsedLevel, 'tutorial'> & { tutorial?: TutorialStepData[] | undefined };
/** Level as written in JSON (tutorial steps widened like `LevelData`, see `LegacyTimedDone`). */
export type LevelInput = Omit<InputLevel, 'tutorial'> & {
  tutorial?: (Omit<InputStep, 'done'> & { done: InputStep['done'] | LegacyTimedDone })[] | undefined;
};
export type GapData = LevelData['wall']['gaps'][number];
export type PieceData = LevelData['yard']['batches'][number]['pieces'][number];
export type DebrisData = NonNullable<LevelData['build']['debris']>[number];
export type ObstacleData = LevelData['obstacles'][number];
export type GoalData = LevelData['goals'][number];
export type SegmentData = LevelData['build']['segments'][number];
export type TargetsData = NonNullable<LevelData['targets']>;
