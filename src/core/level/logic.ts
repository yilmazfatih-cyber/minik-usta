/**
 * Level logic checks (docs/TECH_DESIGN.md §8.3 and the Faz 2R delta §2R.3; codes = GDD K-45 Faz 2R, D-005). Pure
 * functions: the game runs the runtime subset at load time, `tools/validate-levels.ts` runs every validate-stage check
 * (K-45 items 1–8 and 10). The solver stage (item 9: L-19, L-27, L-32…L-35, `tools/solve.ts`) and the bot (L-20) live
 * in their own tools.
 *
 * Every finding is an `Issue { code, rule, check, severity, path, message }`; `code` is the K-45 snake_case name,
 * `rule` the K-45 item (or K id), `check` the internal L-xx number. Any `error` means the level must not load.
 *
 * Order (Faz 2R): identity, then the K-49 sizes (L-28). Every later check reads the level geometry (`geoFromLevel`),
 * which only exists when the sizes fit the 8 × 10 frame; a level that does not fit stops after L-28. Checks whose
 * answer is meaningless on a broken base are gated, not skipped silently: cover (L-10, L-30) and debris colours (L-29)
 * need plans of exactly Hs × Ws without `.` and with every `?` resolved; the tiling (L-11) also needs valid shapes
 * (L-04) and an exact cover (L-10, L-30), because D3a on a short or unplaceable supply only repeats those errors.
 */
import { COLOR_CODES } from '../types.ts';
import type { ColorCode, ShapeId } from '../types.ts';
import { DEFAULT_SIZES, MAX_BOARD_ROWS, MAX_COLS, MAX_SITE_COLS, geoFromLevel } from '../geometry.ts';
import type { BoardGeo } from '../geometry.ts';
import { FORBIDDEN_SHAPES, HEAVY_MIN_LEVEL_ID, KIND_FIRST_CHAPTER, shapeById } from '../shapes.ts';
import type { ShapeDef } from '../shapes.ts';
import { LevelSchema } from './schema.ts';
import type { GapData, LevelData, MechanicId, PieceData, TutCondition } from './schema.ts';
import { boardHeight, deriveMechanics, isCargo } from './mechanics.ts';
import { buildPlans, localIndex } from './plan.ts';
import type { SegmentPlan } from './plan.ts';

export type Severity = 'error' | 'warn';

export interface Issue {
  /** K-45 snake_case code, e.g. `gap_touches_top`. */
  readonly code: string;
  /** `K-45/<item>` or the related rule id (`K-25`, `K-24`, `GDD 14.1` …). */
  readonly rule: string;
  /** Internal check number `L-xx`. */
  readonly check: CheckId;
  readonly severity: Severity;
  /** Data path, e.g. `wall.gaps[0]`. */
  readonly path: string;
  readonly message: string;
}

/** Validate-stage checks (TECH §8.3 + §2R.3). L-19, L-20, L-27 and L-32…L-35 are solver / bot stages. */
export const CHECK_IDS = [
  'L-01',
  'L-02',
  'L-03',
  'L-04',
  'L-05',
  'L-06',
  'L-07',
  'L-08',
  'L-09',
  'L-10',
  'L-11',
  'L-12',
  'L-13',
  'L-14',
  'L-15',
  'L-16',
  'L-17',
  'L-18',
  'L-21',
  'L-22',
  'L-23',
  'L-24',
  'L-25',
  'L-26',
  'L-28',
  'L-29',
  'L-30',
  'L-31',
] as const;
export type CheckId = (typeof CHECK_IDS)[number];

/**
 * Checks the game runs when it loads a level (TECH §8.3, < 1 ms): what the engine needs to build a sane board. The
 * schema always runs. L-28 is new and first: `compile` cannot build a geometry outside the frame. L-05 (`plan_size`,
 * `plan_has_window`, `elevator_overflow`) is validate-only during the Faz 2R transition: the geometry clamps H and
 * reads plans of any size safely, and the Faz 2 levels/*.json (shorter plans on the default 2 × 8 site) must stay
 * playable for the other packages until WP-M replaces them; WP-M puts L-05 back here (TECH §2R.3 note).
 */
export const RUNTIME_CHECKS: readonly CheckId[] = [
  'L-02',
  'L-04',
  'L-08',
  'L-09',
  'L-24',
  'L-25',
  'L-26',
  'L-28',
];

export interface LogicContext {
  /** Level number taken from the file name `level_NNN.json` (L-01 `id_mismatch`). */
  readonly fileId?: number;
  /** Union of the mechanic sets of all earlier levels (L-16, L-22). Without it both checks are skipped. */
  readonly previousMechanics?: ReadonlySet<MechanicId>;
  /** `config/economy.json → boosters.<name>.unlockLevel` (L-17 `booster:` / `pre:`). Without it the check is skipped. */
  readonly boosterUnlock?: Readonly<Record<string, number>>;
  /** i18n keys of `src/i18n/tr.json` and `en.json` (L-17 `tut_key_missing`). Without them the check is skipped. */
  readonly i18nKeys?: { readonly tr: ReadonlySet<string>; readonly en: ReadonlySet<string> };
  /** Run only these checks (default: all of CHECK_IDS). */
  readonly only?: readonly CheckId[];
  /** Expansion budget of the L-11 tiling search (default `TILE_BUDGET` = D3a's 20 000). */
  readonly tileBudget?: number;
}

/** First level of each colour (BRIEF §6, GDD K-31; LEVELS §0: R "en erken" 4, first used in Faz 2R level 5). */
export const COLOR_FIRST_LEVEL: Readonly<Record<ColorCode, number>> = {
  W: 1,
  Y: 1,
  G: 2,
  R: 4,
  O: 11,
  C: 11,
  B: 21,
  P: 21,
};
/** Colours per level by story chapter: 1 → 3, 2 → 4, 3–5 → 5 (GDD K-31). */
export const CHAPTER_COLOR_LIMIT: Readonly<Record<number, number>> = { 1: 3, 2: 4, 3: 5, 4: 5, 5: 5 };
/** Sawtooth plan (LEVELS §0). */
export const HARD_LEVELS: ReadonlySet<number> = new Set([10, 15, 25, 35, 45, 49]);
export const SUPERHARD_LEVELS: ReadonlySet<number> = new Set([20, 30, 40, 50]);
/** Highlight name → economy.json booster key (TECH §8.3 L-17). */
export const HIGHLIGHT_BOOSTER_KEY: Readonly<Record<string, string>> = {
  hammer: 'hammer',
  crane: 'crane',
  undo: 'undo',
  brush: 'paintBrush',
  thermos: 'thermos',
  trowel: 'trowelStart',
  shutter: 'openShutter',
};

/** GDD K-49 / K-45/2 product ranges (product-lead), inside the code-lead frame of geometry.ts. */
export const SIZE_RANGES = {
  /** Yard width Wy. */
  yardCols: [3, 6],
  /** Yard height Hy. */
  yardRows: [4, 8],
  /** Site plan height Hs. */
  siteRows: [4, 8],
} as const;
/** Site width Ws: 2–3 in story chapters 1–3 (levels 1–30), 2–4 in chapters 4–5 (K-49). */
export function siteColsRange(chapter: number): readonly [number, number] {
  return chapter <= 3 ? [2, 3] : [2, MAX_SITE_COLS];
}
/** Free yard cells at the start (K-02): `2 ≤ E ≤ ⌊0,4·C⌋`. */
export const YARD_EMPTY_MIN = 2;
export function yardEmptyMax(cells: number): number {
  return Math.floor((2 * cells) / 5);
}
/** Expansion budget of the L-11 tiling search: D3a's `D3A_MAX_EXPANSIONS` (GDD K-30, TECH §2R.4). */
export const TILE_BUDGET = 20_000;

const CHECK_RULE: Readonly<Record<CheckId, string>> = {
  'L-01': 'K-45/1',
  'L-02': 'K-45/2',
  'L-03': 'K-45/2',
  'L-04': 'K-45/5',
  'L-05': 'K-45/4',
  'L-06': 'K-45/4',
  'L-07': 'K-45/4',
  'L-08': 'K-45/4',
  'L-09': 'K-45/3',
  'L-10': 'K-45/8',
  'L-11': 'K-45/8',
  'L-12': 'K-25',
  'L-13': 'K-45/7',
  'L-14': 'K-45/6',
  'L-15': 'K-45/6',
  'L-16': 'K-45/10',
  'L-17': 'GDD 14.1',
  'L-18': 'LEVELS 0',
  'L-21': 'K-45/5',
  'L-22': 'K-45/10',
  'L-23': 'K-45/6',
  'L-24': 'K-24',
  'L-25': 'K-23',
  'L-26': 'Y4',
  'L-28': 'K-45/2',
  'L-29': 'K-45/7',
  'L-30': 'K-45/8',
  'L-31': 'K-45/10',
};

type Push = (check: CheckId, code: string, path: string, message: string, severity?: Severity) => void;

/** Cells of a shape anchored at (x, y). */
export function cellsAt(shape: ShapeDef, x: number, y: number): { x: number; y: number }[] {
  return shape.cells.map((c) => ({ x: x + c.x, y: y + c.y }));
}

/** K-49 sizes of a level as written (missing fields → GDD defaults 6, 8, 2, 8). */
export interface LevelSizes {
  readonly wy: number;
  readonly hy: number;
  readonly ws: number;
  readonly hs: number;
}
export function levelSizes(level: LevelData): LevelSizes {
  return {
    wy: level.yard.cols ?? DEFAULT_SIZES.wy,
    hy: level.yard.rows ?? DEFAULT_SIZES.hy,
    ws: level.site?.cols ?? DEFAULT_SIZES.ws,
    hs: level.site?.rows ?? DEFAULT_SIZES.hs,
  };
}
/** The sizes fit the 8 × 10 frame, so `geoFromLevel` can build the geometry (geometry.ts `makeGeo` limits). */
export function fitsFrame(z: LevelSizes): boolean {
  const inRange = (v: number, lo: number, hi: number): boolean => Number.isInteger(v) && v >= lo && v <= hi;
  return (
    inRange(z.wy, 1, MAX_COLS - 1) &&
    inRange(z.ws, 1, MAX_SITE_COLS) &&
    z.wy + z.ws <= MAX_COLS &&
    inRange(z.hy, 1, MAX_BOARD_ROWS) &&
    inRange(z.hs, 1, MAX_BOARD_ROWS)
  );
}

/**
 * A material block can reach the site over the wall (K-05: box height ≤ (H + 2) − height) or through a gap whose
 * rows hold all of its rows (K-12). Ağır Yük (I5/Q9) never crosses the boundary (Y5, K-44).
 */
export function canReachSite(shape: ShapeDef, level: LevelData): boolean {
  if (isCargo(shape)) return false;
  const open = boardHeight(level) + 2 - level.wall.height;
  return shape.h <= open || level.wall.gaps.some((g) => shape.h <= g.size);
}

function gapRows(g: GapData): [number, number] {
  return g.type === 'slider' ? [g.range[0], g.range[1] + g.size - 1] : [g.y, g.y + g.size - 1];
}

/** Flags of a piece. */
const flagsOf = (p: PieceData): readonly string[] => p.flags ?? [];

/** One block of the level data (batch pieces and debris). */
interface Placed {
  readonly path: string;
  readonly id: ShapeId;
  readonly shape: ShapeDef;
  /** Ağır Yük (I5/Q9): no colour, not material (K-44). */
  readonly cargo: boolean;
  readonly color: ColorCode;
  /** Batch index (0 start yard, k ≥ 1 truck), −1 for debris. */
  readonly batch: number;
  /** Segment the block becomes available for: the batch's `forSegment`, the debris segment. */
  readonly from: number;
  readonly debris: boolean;
  readonly piece?: PieceData;
}

function allPlaced(level: LevelData): Placed[] {
  const out: Placed[] = [];
  level.yard.batches.forEach((b, bi) =>
    b.pieces.forEach((p, i) => {
      const shape = shapeById(p.shape);
      out.push({
        path: `yard.batches[${bi}].pieces[${i}]`,
        id: p.shape,
        shape,
        cargo: isCargo(shape),
        color: p.color,
        batch: bi,
        from: b.forSegment,
        debris: false,
        piece: p,
      });
    }),
  );
  level.build.debris?.forEach((d, i) => {
    const shape = shapeById(d.shape);
    out.push({
      path: `build.debris[${i}]`,
      id: d.shape,
      shape,
      cargo: isCargo(shape),
      color: d.color,
      batch: -1,
      from: d.segment ?? 0,
      debris: true,
    });
  });
  return out;
}

/** Material blocks (K-47 supply): every batch piece and debris except Ağır Yük. */
function materialBlocks(level: LevelData): Placed[] {
  return allPlaced(level).filter((p) => !p.cargo);
}

// ---------------------------------------------------------------------------------------------------------------
// Schema (L-01) and the codes the schema stage maps (L-05 plan_size, L-17 tut_key_missing, L-31 tut_blocking)
// ---------------------------------------------------------------------------------------------------------------

function formatPath(path: readonly PropertyKey[]): string {
  let out = '';
  for (const k of path) {
    if (typeof k === 'number') out += `[${k}]`;
    else out += out === '' ? String(k) : `.${String(k)}`;
  }
  return out === '' ? '(root)' : out;
}

type SchemaError = NonNullable<ReturnType<typeof LevelSchema.safeParse>['error']>;

/** A tutorial step field that would dim or lock the board (K-53/2: no spotlight, no dimming). */
const BLOCKING_FIELD = /^(spot|dim)/i;

function valueAt(json: unknown, path: readonly PropertyKey[]): unknown {
  return path.reduce<unknown>(
    (acc, k) =>
      acc !== null && typeof acc === 'object' ? (acc as Record<PropertyKey, unknown>)[k] : undefined,
    json,
  );
}

/**
 * Maps zod issues to K-45 issues. A plan of the wrong row count or a row of valid characters and the wrong width is
 * `plan_size` (L-05); a tutorial `mode` the schema cannot read and a spotlight / dim field of a step are `tut_blocking`
 * (L-31); a `textKey` outside the GDD §14.1/1 format is `tut_key_missing` (L-17, TECH §2R.2); everything else is
 * `schema_invalid`.
 */
export function issuesFromSchema(error: SchemaError, json: unknown): Issue[] {
  const make = (check: CheckId, code: string, path: string, message: string): Issue => ({
    code,
    rule: CHECK_RULE[check],
    check,
    severity: 'error',
    path,
    message,
  });
  return error.issues.flatMap((iss): Issue[] => {
    const path = formatPath(iss.path);
    const p = iss.path;
    if (p[0] === 'build' && p[1] === 'segments' && p[3] === 'rows') {
      if (p.length === 4 && (iss.code === 'too_small' || iss.code === 'too_big'))
        return [
          make('L-05', 'plan_size', path, `a plan has 1–8 rows (exactly site.rows, K-15): ${iss.message}`),
        ];
      const row = valueAt(json, p);
      if (p.length === 5 && typeof row === 'string' && /^[WYGROCBP.?]*$/.test(row))
        return [
          make('L-05', 'plan_size', path, `plan row "${row}" must have exactly site.cols characters (K-15)`),
        ];
    }
    if (p[0] === 'tutorial' && typeof p[1] === 'number') {
      if (p.length === 3 && p[2] === 'mode')
        return [make('L-31', 'tut_blocking', path, `mode may only be "soft" (K-53/2): ${iss.message}`)];
      if (p.length === 3 && p[2] === 'textKey')
        return [
          make(
            'L-17',
            'tut_key_missing',
            path,
            `textKey ${JSON.stringify(valueAt(json, p))} is not tut.l<n>.<topic>, tut.m.<topic> or tut.ctx.<topic> (GDD 14.1/1)`,
          ),
        ];
      if (p.length === 2 && iss.code === 'unrecognized_keys') {
        const blocking = iss.keys.filter((k) => BLOCKING_FIELD.test(k));
        const other = iss.keys.filter((k) => !BLOCKING_FIELD.test(k));
        return [
          ...blocking.map((k) =>
            make(
              'L-31',
              'tut_blocking',
              `${path}.${k}`,
              `"${k}": a step never dims or locks the board (K-53/2)`,
            ),
          ),
          ...(other.length > 0
            ? [
                make(
                  'L-01',
                  'schema_invalid',
                  path,
                  `unrecognized key(s): ${other.map((k) => `"${k}"`).join(', ')}`,
                ),
              ]
            : []),
        ];
      }
    }
    return [make('L-01', 'schema_invalid', path, iss.message)];
  });
}

/** Parses JSON with the schema and, when it passes, runs the logic checks. */
export function validateLevelJson(
  json: unknown,
  ctx: LogicContext = {},
): { level: LevelData | null; issues: Issue[] } {
  const parsed = LevelSchema.safeParse(json);
  if (!parsed.success) return { level: null, issues: issuesFromSchema(parsed.error, json) };
  return { level: parsed.data, issues: checkLevel(parsed.data, ctx) };
}

// ---------------------------------------------------------------------------------------------------------------
// Logic checks
// ---------------------------------------------------------------------------------------------------------------

/** Runs the logic checks (L-01 data part … L-31) on a schema-valid level. */
export function checkLevel(level: LevelData, ctx: LogicContext = {}): Issue[] {
  const issues: Issue[] = [];
  const enabled = new Set<CheckId>(ctx.only ?? CHECK_IDS);
  const push: Push = (check, code, path, message, severity = 'error') => {
    if (enabled.has(check)) issues.push({ code, rule: CHECK_RULE[check], check, severity, path, message });
  };

  if (enabled.has('L-01')) checkIdentity(level, ctx, push);
  // K-49 first: the geometry of every later check exists only inside the frame.
  if (!checkSizes(level, push)) return issues;
  const geo = geoFromLevel(level);
  const { plans, problems } = buildPlans(level, geo);
  // Gates are computed whatever `only` asks for; `push` drops the issues of disabled checks.
  const plansShaped = checkPlans(level, geo, push);
  const plansUsable = plansShaped && problems.length === 0;
  const shapesOk = checkShapes(level, geo, push);
  const coverOk = plansUsable && checkCover(level, plans, push);

  if (enabled.has('L-02') || enabled.has('L-03')) checkYard(level, geo, push);
  if (enabled.has('L-06') || enabled.has('L-07')) checkColors(level, plans, push);
  if (enabled.has('L-08')) {
    for (const p of problems) push('L-08', 'hidden_invalid', `build.segments[${p.seg}]`, p.message);
  }
  if (enabled.has('L-09')) checkWall(level, geo, push);
  if (enabled.has('L-11') && coverOk && shapesOk)
    checkTiling(level, plans, geo, ctx.tileBudget ?? TILE_BUDGET, push);
  if (enabled.has('L-12')) checkBatches(level, geo, push);
  if (enabled.has('L-13') || enabled.has('L-29')) checkDebris(level, plans, geo, plansUsable, push);
  if (enabled.has('L-14') || enabled.has('L-23')) checkHiddenItems(level, push);
  if (enabled.has('L-15')) checkGoals(level, push);
  if ((enabled.has('L-16') || enabled.has('L-22')) && ctx.previousMechanics)
    checkMechanics(level, ctx.previousMechanics, push);
  if (enabled.has('L-17')) checkTutorial(level, geo, ctx, push);
  if (enabled.has('L-18')) checkSawtooth(level, push);
  if (enabled.has('L-21')) checkFlagCombos(level, push);
  if (enabled.has('L-24')) checkElevatorRange(level, push);
  if (enabled.has('L-25')) checkCarousel(level, push);
  if (enabled.has('L-26')) checkWet(level, push);
  if (enabled.has('L-31')) checkTutorialLoad(level, push);
  return issues;
}

/** L-01: id 1–50, chapter = ceil(id/10), file number; `targets` bands are `[low, high]` with low ≤ high. */
function checkIdentity(level: LevelData, ctx: LogicContext, push: Push): void {
  if (level.id < 1 || level.id > 50) push('L-01', 'id_mismatch', 'id', `id ${level.id} is outside 1–50`);
  if (ctx.fileId !== undefined && ctx.fileId !== level.id)
    push('L-01', 'id_mismatch', 'id', `id ${level.id} does not match the file name (level ${ctx.fileId})`);
  const chapter = Math.ceil(level.id / 10);
  if (level.chapter !== chapter)
    push('L-01', 'chapter_mismatch', 'chapter', `chapter ${level.chapter} ≠ ceil(id / 10) = ${chapter}`);
  for (const [name, band] of Object.entries(level.targets ?? {})) {
    if (band && band[0] > band[1])
      push('L-01', 'schema_invalid', `targets.${name}`, `band [${band[0]}, ${band[1]}] needs low ≤ high`);
  }
}

/**
 * L-28 (K-49, K-45/2): `size_out_of_range` (Wy 3–6, Hy 4–8, Hs 4–8, Ws 2–3 in story chapters 1–3 and 2–4 in 4–5),
 * `board_too_wide` (Wy + Ws > 8). Returns whether the sizes fit the frame (false: the geometry cannot be built and the
 * remaining checks are skipped).
 */
function checkSizes(level: LevelData, push: Push): boolean {
  const z = levelSizes(level);
  const out = (
    path: string,
    name: string,
    v: number,
    [lo, hi]: readonly [number, number],
    why = '',
  ): void => {
    if (v < lo || v > hi)
      push('L-28', 'size_out_of_range', path, `${name} = ${v} is outside ${lo}–${hi}${why} (K-49)`);
  };
  out('yard.cols', 'Wy', z.wy, SIZE_RANGES.yardCols);
  out('yard.rows', 'Hy', z.hy, SIZE_RANGES.yardRows);
  out('site.cols', 'Ws', z.ws, siteColsRange(level.chapter), ` in story chapter ${level.chapter}`);
  out('site.rows', 'Hs', z.hs, SIZE_RANGES.siteRows);
  if (z.wy + z.ws > MAX_COLS)
    push(
      'L-28',
      'board_too_wide',
      'site.cols',
      `Wy + Ws = ${z.wy} + ${z.ws} > ${MAX_COLS} (K-49, 120 px cells)`,
    );
  return fitsFrame(z);
}

/**
 * L-05 (K-15, K-24, K-45/4): every segment is exactly Hs rows of exactly Ws characters (`plan_size`), no `.`
 * (`plan_has_window`, R2-01: the plan covers the site); with an elevator `Hs + b ≤ 8` (`elevator_overflow`). Returns
 * whether every plan is Hs × Ws without `.` (the cover and debris checks need that).
 */
function checkPlans(level: LevelData, geo: BoardGeo, push: Push): boolean {
  let ok = true;
  level.build.segments.forEach((s, i) => {
    const path = `build.segments[${i}].rows`;
    if (s.rows.length !== geo.hs) {
      ok = false;
      push(
        'L-05',
        'plan_size',
        path,
        `${s.rows.length} rows; the site is Hs = ${geo.hs} rows (site.rows, K-15)`,
      );
    }
    s.rows.forEach((row, j) => {
      if (row.length !== geo.ws) {
        ok = false;
        push(
          'L-05',
          'plan_size',
          `${path}[${j}]`,
          `"${row}" has ${row.length} characters; the site is Ws = ${geo.ws} columns (site.cols, K-15)`,
        );
      }
      if (row.includes('.')) {
        ok = false;
        push(
          'L-05',
          'plan_has_window',
          `${path}[${j}]`,
          `"${row}": "." (S2 Plan Boşluğu) is out of the MVP; the plan covers the whole site (K-15, R2-01)`,
        );
      }
    });
  });
  const el = level.build.elevator;
  if (el && geo.hs + el.range[1] > MAX_BOARD_ROWS)
    push(
      'L-05',
      'elevator_overflow',
      'build.elevator',
      `Hs ${geo.hs} + b ${el.range[1]} > ${MAX_BOARD_ROWS} (K-24)`,
    );
  return ok;
}

/**
 * L-02 `overlap` / `out_of_yard`, L-03 `yard_fill_high` / `yard_fill_low` (K-02, K-49). Occupying entities: batch-0
 * pieces (material and Ağır Yük), crates and cement bags; every obstacle lies in the yard (x ≤ Wy − 1, y ≤ Hy − 1).
 */
function checkYard(level: LevelData, geo: BoardGeo, push: Push): void {
  const owner = new Map<number, string>();
  const inYard = (x: number, y: number): boolean => x >= 0 && x < geo.wy && y >= 0 && y < geo.hy;
  const where = `x 0–${geo.wy - 1}, y 0–${geo.hy - 1}`;
  const claim = (x: number, y: number, path: string): void => {
    const key = y * geo.wy + x;
    const prev = owner.get(key);
    if (prev !== undefined) push('L-02', 'overlap', path, `cell (${x},${y}) is already taken by ${prev}`);
    else owner.set(key, path);
  };
  level.yard.batches[0]?.pieces.forEach((p, i) => {
    const path = `yard.batches[0].pieces[${i}]`;
    const cells = cellsAt(shapeById(p.shape), p.x, p.y);
    if (cells.some((c) => !inYard(c.x, c.y))) {
      push('L-02', 'out_of_yard', path, `${p.shape} at (${p.x},${p.y}) leaves the yard (${where})`);
      return;
    }
    for (const c of cells) claim(c.x, c.y, path);
  });
  level.obstacles.forEach((o, i) => {
    const path = `obstacles[${i}]`;
    if (!inYard(o.x, o.y)) {
      push('L-02', 'out_of_yard', path, `${o.type} at (${o.x},${o.y}) is outside the yard (${where})`);
      return;
    }
    if (o.type === 'crate' || o.type === 'cement_bag') claim(o.x, o.y, path);
  });
  const cells = geo.wy * geo.hy;
  const empty = cells - owner.size;
  const max = yardEmptyMax(cells);
  if (empty < YARD_EMPTY_MIN)
    push(
      'L-03',
      'yard_fill_high',
      'yard',
      `E = ${empty} empty cells < ${YARD_EMPTY_MIN} (C = ${cells}, K-02)`,
    );
  else if (empty > max)
    push('L-03', 'yard_fill_low', 'yard', `E = ${empty} empty cells > ⌊0,4·${cells}⌋ = ${max} (K-02)`);
}

/**
 * L-04 (K-44, K-45/5): forbidden orientations; I5/Q9 only in the yard (never debris); kinds per story chapter; Ağır Yük
 * only from level 8; a material block's data orientation at most Ws wide (`piece_too_wide`). Returns whether no error
 * was found.
 */
function checkShapes(level: LevelData, geo: BoardGeo, push: Push): boolean {
  let ok = true;
  const bad = (code: string, path: string, message: string): void => {
    ok = false;
    push('L-04', code, path, message);
  };
  for (const { path, id, shape, cargo, debris } of allPlaced(level)) {
    if (FORBIDDEN_SHAPES.has(id)) bad('shape_forbidden', path, `${id} is forbidden in level data (K-44)`);
    if (debris && cargo)
      bad('shape_forbidden', path, `${shape.kind} (Ağır Yük) may only be used in the yard`);
    const first = KIND_FIRST_CHAPTER[shape.kind];
    if (first > level.chapter)
      bad(
        'shape_locked',
        path,
        `${shape.kind} unlocks in story chapter ${first} (level is chapter ${level.chapter})`,
      );
    if (cargo && level.id < HEAVY_MIN_LEVEL_ID)
      bad('shape_locked', path, `Ağır Yük ${id} is allowed only from level ${HEAVY_MIN_LEVEL_ID}`);
    if (!cargo && shape.w > geo.ws)
      bad(
        'piece_too_wide',
        path,
        `${id} is ${shape.w} wide; a material block is at most Ws = ${geo.ws} wide (the player cannot turn it, K-44)`,
      );
  }
  return ok;
}

/**
 * Colour set (GDD K-31): plan cells (resolved `?`) ∪ every material block (all batches, debris) ∪ paint gate colours.
 * Ağır Yük has no colour (K-44).
 */
export function levelColorSet(
  level: LevelData,
  plans: readonly SegmentPlan[] = buildPlans(level).plans,
): ColorCode[] {
  const set = new Set<ColorCode>();
  for (const plan of plans) for (const c of plan.cells) if (c !== null && c !== '.') set.add(c);
  for (const b of materialBlocks(level)) set.add(b.color);
  for (const g of level.wall.gaps) if (g.type === 'paint') set.add(g.color);
  return COLOR_CODES.filter((c) => set.has(c));
}

function checkColors(level: LevelData, plans: readonly SegmentPlan[], push: Push): void {
  const colors = levelColorSet(level, plans);
  const limit = CHAPTER_COLOR_LIMIT[level.chapter] ?? 5;
  if (colors.length > limit)
    push(
      'L-06',
      'too_many_colors',
      'level',
      `${colors.length} colours (${colors.join(' ')}) > ${limit} for chapter ${level.chapter}`,
    );
  const locked = colors.filter((c) => COLOR_FIRST_LEVEL[c] > level.id);
  if (locked.length > 0)
    push(
      'L-07',
      'color_locked',
      'level',
      locked.map((c) => `${c} unlocks at level ${COLOR_FIRST_LEVEL[c]}`).join('; '),
    );
}

/**
 * L-09 (K-04, K-45/3, OBSTACLES W4/W5/W7/W8). Faz 2R: `0 ≤ height ≤ H`; a wall above the board height has no K-45
 * code of its own and is reported as `size_out_of_range` on `wall.height` (TECH §2R.3 note).
 */
function checkWall(level: LevelData, geo: BoardGeo, push: Push): void {
  const { height, gaps } = level.wall;
  if (height > geo.h)
    push(
      'L-09',
      'size_out_of_range',
      'wall.height',
      `height ${height} > board height H = ${geo.h} (K-04, K-49)`,
    );
  gaps.forEach((g, i) => {
    const path = `wall.gaps[${i}]`;
    if (g.type !== 'slider' && g.y + g.size > height - 1)
      push('L-09', 'gap_touches_top', path, `y + size = ${g.y + g.size} > height − 1 = ${height - 1}`);
    if (g.type === 'shutter' && g.phase >= 2 * g.period)
      push('L-09', 'shutter_phase', path, `phase ${g.phase} must be < 2·period = ${2 * g.period}`);
    if (g.type === 'slider') {
      const [a, b] = g.range;
      if (!(a < b)) push('L-09', 'slider_range', path, `range [${a},${b}] needs a < b`);
      if (g.y < a || g.y > b)
        push('L-09', 'slider_range', path, `start y ${g.y} is outside range [${a},${b}]`);
      if (b + g.size > height - 1)
        push('L-09', 'slider_range', path, `range end ${b} + size ${g.size} > height − 1 = ${height - 1}`);
    }
    if (g.type === 'locked' && !level.obstacles.some((o) => o.type === 'key' && o.id === g.keyId))
      push('L-09', 'key_missing', path, `no key obstacle with id "${g.keyId}"`);
  });
  for (let i = 0; i < gaps.length; i++) {
    for (let j = i + 1; j < gaps.length; j++) {
      const gi = gaps[i];
      const gj = gaps[j];
      if (!gi || !gj) continue;
      const [a0, a1] = gapRows(gi);
      const [b0, b1] = gapRows(gj);
      if (a0 <= b1 && b0 <= a1)
        push('L-09', 'gap_overlap', `wall.gaps[${j}]`, `rows ${b0}–${b1} overlap gap ${i} rows ${a0}–${a1}`);
    }
  }
  if (level.wall.fan && !allPlaced(level).some((p) => !p.debris && !p.cargo && p.shape.w === 1))
    push('L-09', 'fan_unused', 'wall.fan', 'wind fan in a level without 1-wide blocks', 'warn');
}

// ---------------------------------------------------------------------------------------------------------------
// L-30, L-10 full cover (K-47): supply = demand per colour; cumulative demand ≤ cumulative supply
// ---------------------------------------------------------------------------------------------------------------

type ColorCount = Record<ColorCode, number>;
const zeroCount = (): ColorCount => ({ W: 0, Y: 0, G: 0, R: 0, O: 0, C: 0, B: 0, P: 0 });

/** Plan cells per colour (`?` resolved, K-32) of the given segments. */
function demandOf(plans: readonly SegmentPlan[], upTo = plans.length - 1): ColorCount {
  const out = zeroCount();
  plans.forEach((plan, k) => {
    if (k > upTo) return;
    for (const c of plan.cells) if (c !== null && c !== '.') out[c] += 1;
  });
  return out;
}

/** Material cells per colour (K-47 supply: batches and debris, Ağır Yük excluded) available up to segment `upTo`. */
function supplyOf(level: LevelData, upTo = Infinity): ColorCount {
  const out = zeroCount();
  for (const b of materialBlocks(level)) if (b.from <= upTo) out[b.color] += b.shape.cellCount;
  return out;
}

const total = (c: ColorCount): number => COLOR_CODES.reduce((n, k) => n + c[k], 0);

/**
 * L-30 `cover_mismatch` (K-47/1): supply = demand for every colour; with a W6 paint gate only the totals (the solver
 * proves the colours). L-10 `cover_prefix_short` (K-47/2, `segments` without W6): for every segment k and colour c the
 * demand of segments 0…k ≤ the supply of batches 0…k (by `forSegment`) and the debris of segments 0…k. The last
 * prefix is the whole level, so it is left to L-30 (no double report). Returns whether no error was found.
 */
function checkCover(level: LevelData, plans: readonly SegmentPlan[], push: Push): boolean {
  let ok = true;
  const demand = demandOf(plans);
  const supply = supplyOf(level);
  const paint = level.wall.gaps.some((g) => g.type === 'paint');
  if (paint) {
    if (total(supply) !== total(demand)) {
      ok = false;
      push(
        'L-30',
        'cover_mismatch',
        'level',
        `material cells ${total(supply)} ≠ plan cells ${total(demand)} (W6 level: totals, K-47/1)`,
      );
    }
    return ok;
  }
  for (const c of COLOR_CODES) {
    if (supply[c] === demand[c]) continue;
    ok = false;
    push(
      'L-30',
      'cover_mismatch',
      'level',
      `colour ${c}: material cells ${supply[c]} ≠ plan cells ${demand[c]} (K-47/1)`,
    );
  }
  if (level.build.mode !== 'segments') return ok;
  const reported = new Set<ColorCode>();
  for (let k = 0; k < plans.length - 1; k++) {
    const need = demandOf(plans, k);
    const have = supplyOf(level, k);
    for (const c of COLOR_CODES) {
      if (need[c] <= have[c] || reported.has(c)) continue;
      reported.add(c);
      ok = false;
      push(
        'L-10',
        'cover_prefix_short',
        `build.segments[${k}]`,
        `colour ${c}: segments 0–${k} need ${need[c]} cells, batches 0–${k} and their debris bring ${have[c]} (K-47/2)`,
      );
    }
  }
  return ok;
}

// ---------------------------------------------------------------------------------------------------------------
// L-11 `untileable` (K-45/8, CL-2R-09): D3a on the start state — exact bottom-up cover of every segment
// ---------------------------------------------------------------------------------------------------------------

export type TileResult = 'ok' | 'dead' | 'unknown';

interface TileClass {
  readonly shape: ShapeDef;
  /** Own colour first, then the W6 joker colours (paint gates the block's box height fits, TECH §2R.4 step 1). */
  readonly colors: readonly ColorCode[];
  /** First 0-based segment index the class may fill (`availableFrom`; 0 in carousel mode). */
  readonly from: number;
}

/**
 * D3a (GDD K-30, TECH §2R.4) on the level's start state, from the level data: can the material blocks cover every
 * segment exactly, bottom-up? Steps as in §2R.4:
 * 1. Classes (shape, colours, `availableFrom`) with counts; the start profile of every segment is empty (nothing is
 *    correctly placed at the start: debris starts wrong, L-29). Batch blocks are available from their `forSegment`,
 *    debris from its segment. W6 joker: a block whose box height fits a paint gate may take that gate's colour.
 * 2. The lowest column of the active segment (leftmost on a tie) is covered next by a class in its fixed data
 *    orientation, shifted so one of its columns starts there; every block column must start exactly at that column's
 *    height (K-34, which with a full plan also rules out holes) and every cell must have the plan colour.
 * 3. Failed states are memoised by (segment, column profile, class counts).
 * 4. The search is depth first in a fixed order (class index, shift) and stops after `budget` expansions: `unknown`
 *    then, never `dead`.
 * `segments` mode tiles the segments in order; `carousel` tiles them in index order from one shared pool and ignores
 * `availableFrom` (the delivery order depends on the completion order there; a relaxation, so never a false `dead`).
 * Access (walls, gaps, digging) is not considered: that is the solver's (L-19) and D3b's. Ağır Yük is not material.
 * Note for WP-D: the run-time `tileRemaining(s)` of core/deadlock.ts implements the same search on a GameState; once
 * it exists L-11 may call it on the compiled start state instead.
 */
export function tileLevel(
  level: LevelData,
  plans: readonly SegmentPlan[],
  geo: BoardGeo = geoFromLevel(level),
  budget: number = TILE_BUDGET,
): TileResult {
  const carousel = level.build.mode === 'carousel';
  const paint = level.wall.gaps.flatMap((g) => (g.type === 'paint' ? [g] : []));
  const classes: TileClass[] = [];
  const counts: number[] = [];
  const index = new Map<string, number>();
  for (const b of materialBlocks(level)) {
    const shape = shapeById(b.shape.canonical);
    const colors = [...new Set([b.color, ...paint.filter((g) => shape.h <= g.size).map((g) => g.color)])];
    const from = carousel ? 0 : b.from;
    const key = `${shape.index}:${colors.join('')}:${from}`;
    let i = index.get(key);
    if (i === undefined) {
      i = classes.length;
      classes.push({ shape, colors, from });
      counts.push(0);
      index.set(key, i);
    }
    counts[i] = (counts[i] ?? 0) + 1;
  }

  const S = plans.length;
  const { ws, hs } = geo;
  const heights: number[] = Array.from({ length: ws }, () => 0);
  // Numeric memo key when it fits 2^52: segment, profile (base hs + 1), counts (mixed radix count + 1).
  const radix = counts.map((n) => n + 1);
  const space = radix.reduce((p, r) => p * r, S * (hs + 1) ** ws);
  const numeric = space < 2 ** 52;
  const keyOf = (seg: number): number | string => {
    if (!numeric) return `${seg}|${heights.join(',')}|${counts.join(',')}`;
    let k = seg;
    for (const h of heights) k = k * (hs + 1) + h;
    counts.forEach((n, i) => {
      k = k * (radix[i] ?? 1) + n;
    });
    return k;
  };
  const failed = new Set<number | string>();
  let expansions = 0;

  const solve = (seg: number): boolean | 'budget' => {
    if (seg >= S) return true;
    if (heights.every((h) => h === hs)) {
      heights.fill(0);
      const res = solve(seg + 1);
      heights.fill(hs);
      return res;
    }
    const key = keyOf(seg);
    if (failed.has(key)) return false;
    if (++expansions > budget) return 'budget';
    const plan = plans[seg];
    if (!plan) return false;
    let col = 0;
    for (let x = 1; x < ws; x++) if ((heights[x] ?? 0) < (heights[col] ?? 0)) col = x;
    const row = heights[col] ?? 0;
    for (let ti = 0; ti < classes.length; ti++) {
      const t = classes[ti] as TileClass;
      if (!counts[ti] || t.from > seg) continue;
      const s = t.shape;
      for (let k = 0; k < s.w; k++) {
        const ax = col - k;
        const ay = row - (s.colBottom[k] ?? 0);
        if (ax < 0 || ax + s.w > ws || ay < 0) continue;
        let ok = true;
        for (let j = 0; j < s.w && ok; j++) {
          const x = ax + j;
          if (ay + (s.colBottom[j] ?? 0) !== heights[x] || ay + (s.colTop[j] ?? 0) >= hs) ok = false;
        }
        if (!ok) continue;
        const first = s.cells[0];
        const color = first ? plan.cells[localIndex(ax + first.x, ay + first.y, ws)] : null;
        if (!color || color === '.' || !t.colors.includes(color)) continue;
        for (const c of s.cells) if (plan.cells[localIndex(ax + c.x, ay + c.y, ws)] !== color) ok = false;
        if (!ok) continue;
        const saved = heights.slice(ax, ax + s.w);
        for (let j = 0; j < s.w; j++) heights[ax + j] = ay + (s.colTop[j] ?? 0) + 1;
        counts[ti] = (counts[ti] ?? 0) - 1;
        const res = solve(seg);
        counts[ti] = (counts[ti] ?? 0) + 1;
        saved.forEach((h, j) => {
          heights[ax + j] = h;
        });
        if (res !== false) return res;
      }
    }
    failed.add(key);
    return false;
  };

  const res = solve(0);
  return res === 'budget' ? 'unknown' : res ? 'ok' : 'dead';
}

function checkTiling(
  level: LevelData,
  plans: readonly SegmentPlan[],
  geo: BoardGeo,
  budget: number,
  push: Push,
): void {
  // `unknown` (budget spent) produces no code: the solver decides (K-45/8).
  if (tileLevel(level, plans, geo, budget) !== 'dead') return;
  push(
    'L-11',
    'untileable',
    'build.segments',
    'D3a: the material blocks cannot cover the plan exactly bottom-up (K-34) in their data orientation ' +
      '(a batch only from its segment on; K-30, K-47)',
  );
}

// ---------------------------------------------------------------------------------------------------------------
// L-12 … L-31
// ---------------------------------------------------------------------------------------------------------------

/** L-12 (K-25): truck pieces are written with `y = Hy`, every drop column fits the yard (`0 … Wy − w`). */
function checkBatches(level: LevelData, geo: BoardGeo, push: Push): void {
  const S = level.build.segments.length;
  const batches = level.yard.batches;
  if (batches[0]?.forSegment !== 0)
    push('L-12', 'batch_invalid', 'yard.batches[0]', 'batch 0 must be the start batch of segment 0');
  if (batches[0]?.dropColumns)
    push('L-12', 'batch_invalid', 'yard.batches[0].dropColumns', 'dropColumns is unused on batch 0', 'warn');
  batches.forEach((b, k) => {
    const path = `yard.batches[${k}]`;
    if (b.forSegment > S - 1)
      push('L-12', 'batch_invalid', path, `forSegment ${b.forSegment} ≥ segment count ${S}`);
    if (k >= 1 && b.forSegment < 1)
      push(
        'L-12',
        'batch_invalid',
        path,
        'a truck batch (k ≥ 1) is delivered when a segment completes: forSegment ≥ 1',
      );
    if (k === 0) return;
    b.pieces.forEach((p, i) => {
      const w = shapeById(p.shape).w;
      if (p.y !== geo.hy)
        push(
          'L-12',
          'batch_invalid',
          `${path}.pieces[${i}]`,
          `truck piece y must be written as Hy = ${geo.hy} (got ${p.y})`,
        );
      if (p.x > geo.wy - w)
        push(
          'L-12',
          'batch_invalid',
          `${path}.pieces[${i}]`,
          `truck piece x ${p.x} > Wy − w = ${geo.wy - w}`,
        );
      for (const c of b.dropColumns ?? []) {
        if (c > geo.wy - w)
          push(
            'L-12',
            'batch_invalid',
            `${path}.dropColumns`,
            `drop column ${c} does not fit ${p.shape} (w ${w}) in a yard of ${geo.wy} columns`,
          );
      }
    });
  });
}

/**
 * L-13 `debris_misplaced` (K-45/7): debris lies in the site columns (x ≥ Wy) inside its own segment's plan rows, no
 * debris overlap. L-29 `debris_correct_at_start` (S4 Faz 2R): debris starts in a WRONG place — no debris may already be
 * a correct placement by K-16 (every cell on its plan colour and K-34 support, where only debris that is itself
 * correct at the start counts as filled).
 */
function checkDebris(
  level: LevelData,
  plans: readonly SegmentPlan[],
  geo: BoardGeo,
  plansUsable: boolean,
  push: Push,
): void {
  const taken = new Map<string, number>();
  const placed: { i: number; seg: number; color: ColorCode; cells: { x: number; y: number }[] }[] = [];
  const last = geo.siteX + geo.ws - 1;
  level.build.debris?.forEach((d, i) => {
    const path = `build.debris[${i}]`;
    const seg = d.segment ?? 0;
    if (!plans[seg]) {
      push('L-13', 'debris_misplaced', path, `segment ${seg} does not exist`);
      return;
    }
    const cells = cellsAt(shapeById(d.shape), d.x, d.y);
    if (cells.some((c) => c.x < geo.siteX || c.x > last || c.y < 0 || c.y >= geo.hs)) {
      push(
        'L-13',
        'debris_misplaced',
        path,
        `debris must lie in the site (x ${geo.siteX}–${last}) inside segment ${seg}'s plan rows 0–${geo.hs - 1}`,
      );
      return;
    }
    let clash = false;
    for (const c of cells) {
      const key = `${seg}:${c.x},${c.y}`;
      const other = taken.get(key);
      if (other !== undefined) {
        clash = true;
        push('L-13', 'debris_misplaced', path, `overlaps build.debris[${other}] at (${c.x},${c.y})`);
      } else taken.set(key, i);
    }
    if (!clash) placed.push({ i, seg, color: d.color, cells });
  });
  if (!plansUsable) return;
  const filled = plans.map(() => new Set<number>());
  const correct = new Set<number>();
  for (let changed = true; changed;) {
    changed = false;
    for (const p of placed) {
      if (correct.has(p.i)) continue;
      const plan = plans[p.seg];
      const done = filled[p.seg];
      if (!plan || !done) continue;
      const idx = (x: number, y: number): number => localIndex(x - geo.siteX, y, geo.ws);
      if (!p.cells.every((c) => plan.cells[idx(c.x, c.y)] === p.color)) continue;
      const supported = p.cells.every((c) => {
        const bottom = Math.min(...p.cells.filter((o) => o.x === c.x).map((o) => o.y));
        for (let y = 0; y < bottom; y++) if (!done.has(idx(c.x, y))) return false;
        return true;
      });
      if (!supported) continue;
      correct.add(p.i);
      for (const c of p.cells) done.add(idx(c.x, c.y));
      changed = true;
    }
  }
  for (const i of [...correct].sort((a, b) => a - b)) {
    const d = level.build.debris?.[i];
    push(
      'L-29',
      'debris_correct_at_start',
      `build.debris[${i}]`,
      `${d?.shape} ${d?.color} at (${d?.x},${d?.y}) is already a correct placement (K-16): debris starts in a wrong place (S4)`,
    );
  }
}

/** L-14 hidden_item_exposed (+ crate hp), L-23 hidden_item_stacked (K-42, N4, N5). */
function checkHiddenItems(level: LevelData, push: Push): void {
  const covered = new Set<string>();
  level.yard.batches[0]?.pieces.forEach((p) => {
    for (const c of cellsAt(shapeById(p.shape), p.x, p.y)) covered.add(`${c.x},${c.y}`);
  });
  const crates = new Set(level.obstacles.filter((o) => o.type === 'crate').map((o) => `${o.x},${o.y}`));
  const items = new Map<string, number>();
  level.obstacles.forEach((o, i) => {
    const path = `obstacles[${i}]`;
    if (o.type === 'crate' && o.hp === undefined)
      push('L-14', 'schema_invalid', path, 'a crate needs hp 1–3 (OBSTACLES Y1)');
    if (o.type !== 'screw' && o.type !== 'key') return;
    const key = `${o.x},${o.y}`;
    if (!covered.has(key) && !crates.has(key))
      push(
        'L-14',
        'hidden_item_exposed',
        path,
        `${o.type} at (${key}) is not under a block or a crate at start`,
      );
    const prev = items.get(key);
    if (prev !== undefined)
      push('L-23', 'hidden_item_stacked', path, `second hidden item in cell (${key}) (obstacles[${prev}])`);
    else items.set(key, i);
  });
}

/** L-15 (K-41). */
function checkGoals(level: LevelData, push: Push): void {
  const builds = level.goals.filter((g) => g.type === 'build').length;
  if (builds !== 1)
    push('L-15', 'goal_build_missing', 'goals', `exactly one build goal required (found ${builds})`);
  const pieces = level.yard.batches.flatMap((b) => b.pieces);
  const available = {
    crate: level.obstacles.filter((o) => o.type === 'crate').length,
    chain: pieces.filter((p) => flagsOf(p).includes('chained')).length,
    debris: level.build.debris?.length ?? 0,
    screw: level.obstacles.filter((o) => o.type === 'screw').length,
  };
  level.goals.forEach((g, i) => {
    const path = `goals[${i}]`;
    if (g.type === 'clear' && g.count > available[g.target])
      push(
        'L-15',
        'goal_count_too_high',
        path,
        `clear ${g.target} ${g.count} > ${available[g.target]} in the level`,
      );
    if (g.type === 'collect' && g.count > available.screw)
      push('L-15', 'goal_count_too_high', path, `collect screw ${g.count} > ${available.screw} in the level`);
  });
}

/** L-16 teaches_mismatch, L-22 too_many_new_mechanics (K-45/10, OBSTACLES "Veri imzası" Faz 2R). */
function checkMechanics(level: LevelData, previous: ReadonlySet<MechanicId>, push: Push): void {
  const fresh = deriveMechanics(level).filter((m) => !previous.has(m));
  if (fresh.length > 1)
    push(
      'L-22',
      'too_many_new_mechanics',
      'level',
      `${fresh.length} new mechanics (${fresh.join(', ')}); at most 1`,
    );
  if (level.teaches !== undefined) {
    if (fresh.length === 0)
      push(
        'L-16',
        'teaches_mismatch',
        'teaches',
        `teaches ${level.teaches} but the data has no new mechanic`,
      );
    else if (!fresh.includes(level.teaches))
      push(
        'L-16',
        'teaches_mismatch',
        'teaches',
        `teaches ${level.teaches} but the derived new mechanic is ${fresh.join(', ')}`,
      );
  }
}

/** The block a `piece:<i>` / `piece:k<p>_<i>` id names (batch 0, or truck batch p ≥ 1), or undefined. */
function pieceOfRef(level: LevelData, ref: string): PieceData | undefined {
  const truck = /^piece:k(\d+)_(\d+)$/.exec(ref);
  if (truck) {
    const p = Number(truck[1]);
    return p >= 1 ? level.yard.batches[p]?.pieces[Number(truck[2])] : undefined;
  }
  const start = /^piece:(\d+)$/.exec(ref);
  return start ? level.yard.batches[0]?.pieces[Number(start[1])] : undefined;
}

/** Why the event of a `done` / `startOn` condition can never happen in this level (null = possible). */
function conditionImpossible(level: LevelData, geo: BoardGeo, cond: TutCondition): string | null {
  const allPieces = level.yard.batches.flatMap((b) => b.pieces);
  const truckPieces = level.yard.batches.slice(1).flatMap((b) => b.pieces);
  const pieceRef = (event: string, ref: string | undefined): string | null => {
    if (ref === undefined) return null;
    const piece = pieceOfRef(level, ref);
    if (!piece) return `${event} piece ${ref}: no such block`;
    if (event === 'placementCorrect' && isCargo(shapeById(piece.shape)))
      return `${event} piece ${ref} is Ağır Yük: it is never placed (K-44)`;
    return null;
  };
  switch (cond.event) {
    case 'segmentDone':
      return level.build.segments.length >= 2 ? null : 'segmentDone needs ≥ 2 segments';
    case 'deliveryDone':
      if (level.yard.batches.length < 2) return 'deliveryDone needs a truck batch';
      if (cond.flag && !truckPieces.some((p) => flagsOf(p).includes(cond.flag as string)))
        return `deliveryDone flag ${cond.flag} needs a truck block with that flag`;
      return null;
    case 'gapPass':
      return level.wall.gaps.length >= 1 ? null : 'gapPass needs a gap';
    case 'obstacleHit':
      if (cond.type === 'chain')
        return allPieces.some((p) => flagsOf(p).includes('chained'))
          ? null
          : 'obstacleHit chain needs a chained block';
      return level.obstacles.some((o) => o.type === cond.type)
        ? null
        : `obstacleHit ${cond.type} needs a ${cond.type}`;
    case 'itemCollected':
      return level.obstacles.some((o) => o.type === cond.type)
        ? null
        : `itemCollected ${cond.type} needs a ${cond.type}`;
    case 'landed':
      if (cond.flag && !allPieces.some((p) => flagsOf(p).includes(cond.flag as string)))
        return `landed flag ${cond.flag} needs a block with that flag`;
      if (cond.wind && !level.wall.fan) return 'landed wind needs wall.fan';
      return null;
    case 'steered':
      return level.gravity.build === 'low' ? null : 'steered needs gravity.build "low"';
    case 'yardFall':
      return level.gravity.yard ? null : 'yardFall needs gravity.yard';
    case 'carouselTurn':
      return level.build.mode === 'carousel' ? null : 'carouselTurn needs build.mode "carousel"';
    case 'placementCorrect': {
      if (cond.hidden && !level.build.segments.some((s) => s.rows.some((r) => r.includes('?'))))
        return 'placementCorrect hidden needs a `?` cell';
      const last = geo.siteX + geo.ws - 1;
      if (cond.at && (cond.at[0] < geo.siteX || cond.at[0] > last || cond.at[1] > geo.h - 1))
        return `placementCorrect at must be a site anchor (x ${geo.siteX}–${last}, y 0–${geo.h - 1})`;
      return pieceRef(cond.event, cond.piece);
    }
    case 'yardMove':
      if (cond.painted && !level.wall.gaps.some((g) => g.type === 'paint'))
        return 'yardMove painted needs a paint gate';
      if (cond.at && (cond.at[0] > geo.wy - 1 || cond.at[1] > geo.hy - 1))
        return `yardMove at must be a yard anchor (x 0–${geo.wy - 1}, y 0–${geo.hy - 1})`;
      return pieceRef(cond.event, cond.piece);
    default:
      return null;
  }
}

/** Batches k ≥ 1 in delivery order (forSegment ascending, then array order). */
function deliveryOrder(level: LevelData): number[] {
  return level.yard.batches
    .map((b, k) => ({ k, seg: b.forSegment }))
    .filter((b) => b.k >= 1)
    .sort((a, b) => a.seg - b.seg || a.k - b.k)
    .map((b) => b.k);
}

/** `count` of a condition of `event`, else 0. */
const countOf = (cond: TutCondition | undefined, event: TutCondition['event']): number =>
  cond?.event === event ? (cond.count ?? 1) : 0;

/**
 * L-17 (GDD §14.1 with the Faz 2R vocabulary, UX §13.1). Faz 2R: the required-step branches (GDD 14.1/4a) are gone;
 * a truck block (`piece:k<p>_<i>`) may be highlighted once its batch is on the board when the step starts: the step
 * starts on its delivery (`startOn: deliveryDone`, GDD 14.1/5), or at least `forSegment` segments are done by then
 * (`segmentDone` in its `startOn` or in an earlier step's `done`; the delivery runs in the same move, K-35 steps 8–9 —
 * LEVELS Bölüm 5 adım 2).
 */
function checkTutorial(level: LevelData, geo: BoardGeo, ctx: LogicContext, push: Push): void {
  const steps = level.tutorial ?? [];
  const batches = level.yard.batches;
  let segmentsBefore = 0;
  steps.forEach((st, i) => {
    const path = `tutorial[${i}]`;
    const start = st.startOn;
    // A legacy timed `done` only exists in level data built without the schema (LegacyTimedDone): nothing to check.
    const done = 'event' in st.done ? st.done : undefined;
    const segmentsAtStart = segmentsBefore + countOf(start, 'segmentDone');
    segmentsBefore = segmentsAtStart + countOf(done, 'segmentDone');
    if (st.step !== i + 1)
      push(
        'L-17',
        'tut_done_invalid',
        `${path}.step`,
        `steps must be numbered 1, 2, … in order (expected ${i + 1})`,
      );
    if (ctx.i18nKeys) {
      const missing = (['tr', 'en'] as const).filter((lang) => !ctx.i18nKeys?.[lang].has(st.textKey));
      if (missing.length > 0)
        push(
          'L-17',
          'tut_key_missing',
          `${path}.textKey`,
          `${st.textKey} missing in ${missing.join(', ')}.json`,
        );
    }
    st.highlight.forEach((h, hi) => {
      const hpath = `${path}.highlight[${hi}]`;
      const bad = (msg: string): void => push('L-17', 'tut_highlight_invalid', hpath, `${h}: ${msg}`);
      const [kind, arg = ''] = h.split(':') as [string, string | undefined];
      if (kind === 'piece') {
        const batchMatch = /^k(\d+)_(\d+)$/.exec(arg);
        if (!batchMatch) {
          if (Number(arg) >= (batches[0]?.pieces.length ?? 0)) bad('no such batch-0 block');
          return;
        }
        const p = Number(batchMatch[1]);
        const piece = batches[p]?.pieces[Number(batchMatch[2])];
        if (p < 1 || !piece) {
          bad('no such truck block');
          return;
        }
        if (start?.event === 'deliveryDone') {
          const matches = (q: PieceData): boolean => !start.flag || flagsOf(q).includes(start.flag);
          if (!matches(piece)) {
            bad(`the block does not satisfy the startOn filter flag ${start.flag}`);
            return;
          }
          if (level.build.mode === 'segments') {
            const order = deliveryOrder(level).filter((k) => batches[k]?.pieces.some(matches));
            const expected = order[(start.count ?? 1) - 1];
            if (expected !== p) bad(`the startOn delivery is batch ${expected ?? 'none'}, not batch ${p}`);
          }
          return;
        }
        const forSegment = batches[p]?.forSegment ?? Infinity;
        if (forSegment > segmentsAtStart)
          bad(
            `batch ${p} arrives when segment ${forSegment} starts: the step needs startOn deliveryDone, or ` +
              `${forSegment} segmentDone before it starts (GDD 14.1/5)`,
          );
      } else if (kind === 'debris') {
        if (Number(arg) >= (level.build.debris?.length ?? 0)) bad('no such debris');
      } else if (kind === 'cell') {
        const [x = -1, y = -1] = arg.split(',').map(Number);
        if (x > geo.cols - 1 || y > geo.h - 1)
          bad(`cell is not on the board (x 0–${geo.cols - 1}, y 0–${geo.h - 1})`);
      } else if (kind === 'gap') {
        if (Number(arg) >= level.wall.gaps.length) bad('no such gap');
      } else if (kind === 'obstacle') {
        if (Number(arg) >= level.obstacles.length) bad('no such obstacle');
      } else if (kind === 'fan') {
        if (!level.wall.fan) bad('level has no wind fan');
      } else if (kind === 'truck') {
        if (batches.length < 2) bad('level has no truck batch');
      } else if ((kind === 'booster' || kind === 'pre') && ctx.boosterUnlock) {
        const key = HIGHLIGHT_BOOSTER_KEY[arg] ?? arg;
        const unlock = ctx.boosterUnlock[key];
        if (unlock === undefined) bad(`economy.json has no booster ${key}`);
        else if (unlock > level.id) bad(`${key} unlocks at level ${unlock}`);
      }
    });
    checkGloveStart(level, st, path, push);
    for (const [field, cond] of [
      ['done', done],
      ['startOn', st.startOn],
    ] as const) {
      if (!cond) continue;
      const why = conditionImpossible(level, geo, cond);
      if (why) push('L-17', 'tut_done_invalid', `${path}.${field}`, why);
      // LEVELS §5 / GDD §14.1/3 (Faz 2 tur 3, product-lead PL-F2T3-3): a player who releases without resting never
      // sends `holdOverBuild`, so level data ends / starts no step on it (the `hold` glove is only a demonstration)
      if (cond.event === 'holdOverBuild')
        push(
          'L-17',
          'tut_hold_done',
          `${path}.${field}`,
          'holdOverBuild depends on the drag speed: end the step on a move-end event (LEVELS 5)',
          'warn',
        );
    }
  });
}

/**
 * L-17 glove start (LEVELS §5 "Eldiven vurgulu bloktan başlar", GDD §14 "`hand.path` anlamı" (1)): a `drag` / `hold`
 * glove's `path[0]` is a cell of a highlighted `piece:<i>` (batch 0) or `debris:<i>` (segment 0) block at its JSON
 * start — the finger presses the block it moves, not its anchor nor a neighbour. A step whose blocks are all truck
 * blocks or debris of a later segment is not checked here. `tap` is not checked. The full `hand.path` check (start
 * state of the step, reach set `R`, release row, shortest-solution move) is L-35 `tut_hand_invalid` at `levels:solve`.
 */
function checkGloveStart(
  level: LevelData,
  st: NonNullable<LevelData['tutorial']>[number],
  path: string,
  push: Push,
): void {
  const hand = st.hand;
  const first = hand?.path?.[0];
  if (!hand || hand.kind === 'tap' || !first) return;
  const starts: (readonly [number, number])[] = [];
  let checkable = false;
  for (const h of st.highlight) {
    const [kind, arg = ''] = h.split(':') as [string, string | undefined];
    let block: { shape: ShapeId; x: number; y: number } | undefined;
    if (kind === 'piece' && /^\d+$/.test(arg)) block = level.yard.batches[0]?.pieces[Number(arg)];
    else if (kind === 'debris') {
      const d = level.build.debris?.[Number(arg)];
      if (d && (d.segment ?? 0) === 0) block = d;
    }
    if (!block) continue;
    checkable = true;
    const { x, y } = block;
    for (const c of shapeById(block.shape).cells) starts.push([x + c.x, y + c.y]);
  }
  if (!checkable) return;
  const [fx, fy] = first;
  if (!starts.some(([x, y]) => x === fx && y === fy))
    push(
      'L-17',
      'tut_highlight_invalid',
      `${path}.hand.path[0]`,
      `a ${hand.kind} glove starts on a highlighted block's cell (LEVELS 5): (${fx},${fy}) is none of ${starts
        .map(([x, y]) => `(${x},${y})`)
        .join(' ')}`,
    );
}

/** L-31 (K-53/1–2, K-45/10): at most 2 steps (`tut_too_many_steps`); `mode` absent or `'soft'` (`tut_blocking`). */
function checkTutorialLoad(level: LevelData, push: Push): void {
  const steps = level.tutorial ?? [];
  if (steps.length > TUTORIAL_MAX_STEPS)
    push(
      'L-31',
      'tut_too_many_steps',
      'tutorial',
      `${steps.length} steps; a level has at most ${TUTORIAL_MAX_STEPS} (K-53/1)`,
    );
  steps.forEach((st, i) => {
    if (st.mode !== undefined && st.mode !== 'soft')
      push(
        'L-31',
        'tut_blocking',
        `tutorial[${i}].mode`,
        `mode "${st.mode}": every step is soft and never locks input (K-53/2)`,
      );
  });
}

/** K-53/1: tutorial steps per level. */
export const TUTORIAL_MAX_STEPS = 2;

/** L-18 (LEVELS §0 sawtooth). */
function checkSawtooth(level: LevelData, push: Push): void {
  const expected = HARD_LEVELS.has(level.id) ? 'hard' : SUPERHARD_LEVELS.has(level.id) ? 'superhard' : null;
  if (expected && level.difficulty !== expected)
    push('L-18', 'difficulty_sawtooth', 'difficulty', `level ${level.id} should be ${expected}`, 'warn');
  if (!expected && (level.difficulty === 'hard' || level.difficulty === 'superhard'))
    push('L-18', 'difficulty_sawtooth', 'difficulty', `level ${level.id} should be easy or normal`, 'warn');
}

/**
 * L-21 (K-21, OBSTACLES flag table): glass + balloon is forbidden; Ağır Yük cannot be glass, balloon or mortar (it
 * never enters the site). Debris carries no flags (schema); Ağır Yük debris is L-04.
 */
function checkFlagCombos(level: LevelData, push: Push): void {
  for (const { path, cargo, piece } of allPlaced(level)) {
    if (!piece) continue;
    const flags = flagsOf(piece);
    if (flags.includes('glass') && flags.includes('balloon'))
      push('L-21', 'flag_combo_forbidden', path, 'glass + balloon is forbidden');
    if (cargo) {
      const bad = flags.filter((f) => f === 'glass' || f === 'balloon' || f === 'mortar');
      if (bad.length > 0) push('L-21', 'flag_combo_forbidden', path, `Ağır Yük cannot be ${bad.join(', ')}`);
    }
  }
}

/** L-24 (K-24). */
function checkElevatorRange(level: LevelData, push: Push): void {
  const el = level.build.elevator;
  if (!el) return;
  const [a, b] = el.range;
  if (!(a < b)) push('L-24', 'elevator_range', 'build.elevator', `range [${a},${b}] needs a < b`);
  if (el.start < a || el.start > b)
    push('L-24', 'elevator_range', 'build.elevator', `start ${el.start} outside [${a},${b}]`);
}

/** L-25 (K-23). */
function checkCarousel(level: LevelData, push: Push): void {
  const b = level.build;
  if (b.mode === 'carousel' && b.carouselEvery === undefined)
    push('L-25', 'carousel_every_missing', 'build.carouselEvery', 'carousel mode needs carouselEvery');
  if (b.mode === 'segments' && b.carouselEvery !== undefined)
    push(
      'L-25',
      'carousel_every_missing',
      'build.carouselEvery',
      'carouselEvery is unused in segments mode',
      'warn',
    );
}

/** L-26 (Y4): `wet` ⇔ `wetMoves`. */
function checkWet(level: LevelData, push: Push): void {
  level.yard.batches.forEach((b, bi) =>
    b.pieces.forEach((p, i) => {
      const wet = flagsOf(p).includes('wet');
      if (wet !== (p.wetMoves !== undefined))
        push(
          'L-26',
          'wet_moves_missing',
          `yard.batches[${bi}].pieces[${i}]`,
          wet ? 'wet block needs wetMoves' : 'wetMoves without the wet flag',
        );
    }),
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Deprecated (Faz 2 K-27 supply; no Faz 2R check uses it)
// ---------------------------------------------------------------------------------------------------------------

/** A supply block of the Faz 2 whole-block assignment (`materialShortfall`). */
export interface SupplyBlock {
  readonly forSegment: number;
  readonly color: ColorCode;
  readonly cells: number;
  /** Paint gate colours this block can take on its way to the site (OBSTACLES W6). */
  readonly alts: readonly ColorCode[];
}

/** Search nodes of the whole-block assignment before `materialShortfall` settles for what it has proven. */
const MATERIAL_SEARCH_BUDGET = 50_000;

/**
 * @deprecated Faz 2 K-27 / L-10 (`material_short`); Faz 2R uses exact cover (L-30, L-10 `cover_prefix_short`) and the
 * W6 joker of D3a (L-11). Kept for the Faz 2 review tests until WP-M rewrites them.
 *
 * Returns the colours whose demand cannot be met (empty = enough material), in `COLOR_CODES` order.
 *
 * GDD K-27 sums "o renkteki … blokların hücre toplamı" and TECH L-10 counts a paint-gate block for the gate colour
 * too, "her blok bir kez": a block is one colour as a whole, so a 4-cell block that is Y or P (after the gate)
 * supplies 4 Y **or** 4 P, never 2 Y + 2 P. Single-colour blocks are counted directly; blocks with a choice are
 * assigned by a depth-first branch and bound (largest blocks first, own colour before gate colours) that minimises
 * the number of uncovered plan cells; the colours left uncovered by the best assignment are reported. A colour that is
 * short on its own is therefore always reported, and a demand some assignment covers always gives `[]`.
 * Pathological inputs (more than `MATERIAL_SEARCH_BUDGET` nodes) keep the best assignment found only when a shortage
 * is already proven by the per-colour or total supply bound; otherwise nothing is reported, because the check must not
 * refuse a level on an unproven claim (L-11 exact cover and the L-19 solver stay authoritative).
 */
export function materialShortfall(
  demand: Readonly<Partial<Record<ColorCode, number>>>,
  blocks: readonly SupplyBlock[],
): ColorCode[] {
  const rest = new Map<ColorCode, number>();
  for (const c of COLOR_CODES) {
    const d = demand[c] ?? 0;
    if (d > 0) rest.set(c, d);
  }
  const flexible: { readonly cells: number; readonly colors: readonly ColorCode[] }[] = [];
  for (const b of blocks) {
    const colors = [...new Set([b.color, ...b.alts])];
    const d = rest.get(b.color);
    if (colors.length > 1) flexible.push({ cells: b.cells, colors });
    else if (d !== undefined) rest.set(b.color, d - b.cells);
  }
  const open = [...rest].filter(([, d]) => d > 0).map(([c]) => c);
  if (open.length === 0) return [];
  const m = open.length;
  const items = flexible
    .map((b) => ({
      cells: b.cells,
      opts: b.colors.flatMap((c) => (open.includes(c) ? [open.indexOf(c)] : [])),
    }))
    .filter((it) => it.opts.length > 0)
    .sort((a, b) => b.cells - a.cells);
  const n = items.length;
  // Suffix supplies for the lower bound: per open colour and in total, from item i on.
  const suffix = Array.from({ length: n + 1 }, () => Array.from({ length: m + 1 }, () => 0));
  for (let i = n - 1; i >= 0; i--) {
    const it = items[i] as (typeof items)[number];
    const row = suffix[i] as number[];
    const next = suffix[i + 1] as number[];
    for (let k = 0; k <= m; k++) row[k] = next[k] ?? 0;
    for (const k of it.opts) row[k] = (row[k] ?? 0) + it.cells;
    row[m] = (row[m] ?? 0) + it.cells;
  }
  const lowerBound = (i: number, d: readonly number[]): number => {
    const s = suffix[i] as number[];
    let perColor = 0;
    let total = 0;
    d.forEach((v, k) => {
      perColor += Math.max(0, v - (s[k] ?? 0));
      total += v;
    });
    return Math.max(perColor, total - (s[m] ?? 0));
  };
  const start = open.map((c) => rest.get(c) ?? 0);
  const relaxedShort = lowerBound(0, start) > 0;
  let best = start.reduce((s, v) => s + v, 0) + 1;
  let bestRest: readonly number[] = start;
  const seen = new Set<string>();
  let nodes = 0;
  // Exploring a state again cannot beat `best`: `best` only falls, so the first visit already found anything better.
  const search = (i: number, d: readonly number[]): void => {
    const uncovered = d.reduce((s, v) => s + v, 0);
    if (uncovered < best && (uncovered === 0 || i === n)) {
      best = uncovered;
      bestRest = d;
    }
    if (best === 0 || i === n || lowerBound(i, d) >= best || nodes >= MATERIAL_SEARCH_BUDGET) return;
    const key = `${i}|${d.join(',')}`;
    if (seen.has(key)) return;
    seen.add(key);
    nodes++;
    const it = items[i] as (typeof items)[number];
    for (const k of it.opts)
      search(
        i + 1,
        d.map((v, j) => (j === k ? Math.max(0, v - it.cells) : v)),
      );
  };
  search(0, start);
  if (nodes >= MATERIAL_SEARCH_BUDGET && best > 0 && !relaxedShort) return [];
  return open.filter((_, k) => (bestRest[k] ?? 0) > 0);
}
