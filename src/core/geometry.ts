/**
 * Board geometry of one level (docs/GDD.md K-49, §0; docs/TECH_DESIGN.md §2R.0 item 2, §2R.1). Pure, no state.
 *
 * Every encoding (drag node code, Zobrist position table, collision row masks) stays in the MAXIMUM FRAME of
 * `MAX_COLS × MAX_ROWS` = 8 × 10 cells: node code `(mode·10 + iy)·8 + ix` and yard hash position `y·8 + x` never change
 * with the level. What a cell MEANS (yard, site, wall boundary, yard air, site air, crane area) comes from the level's
 * `BoardGeo` (`CompiledLevel.geo`, read as `s.lvl.geo`). K-49 limits (`Wy + Ws ≤ 8`, `H ≤ 8`) fit the frame.
 *
 * Regions (global coordinates, x = 0 left, y = 0 bottom):
 * - yard `x 0 … wy−1, y 0 … hy−1`; yard air `x ≤ wy−1, hy ≤ y ≤ h−1` (only when hy < h);
 * - site columns `x wy … wy+ws−1`; plan row `sy` is board row `sy + e` (elevator offset, K-24); site air `y ≥ hs + e`;
 * - wall boundary between `x = wy−1` and `x = wy` (zero width, R-03);
 * - crane area rows `h` and `h + 1` over every column (K-05).
 */

/** Maximum frame width: K-49 `Wy + Ws ≤ 8`. Every column bit mask fits in 8 bits. */
export const MAX_COLS = 8;
/** Maximum frame height: K-49 `H ≤ 8` plus the 2 crane-area rows. */
export const MAX_ROWS = 10;
/** Crane area rows above the board (K-05). */
export const CRANE_ROWS = 2;
/** Highest board height H (K-49); the crane area takes the remaining frame rows. */
export const MAX_BOARD_ROWS = MAX_ROWS - CRANE_ROWS;
/** Widest site the encodings support (K-49 code-lead limit: Ws 1–4; `ws · hs ≤ 32` bit masks per segment). */
export const MAX_SITE_COLS = 4;
/** Zobrist / mask slots of one site segment in the maximum frame: `MAX_SITE_COLS × MAX_BOARD_ROWS` (§2R.1 hash). */
export const SEGMENT_SLOTS = MAX_SITE_COLS * MAX_BOARD_ROWS;
/** Most segments of a plan (GDD K-22: 1 ≤ S ≤ 5); sizes the frame's site position range in the hash. */
export const MAX_SEGMENTS = 5;

/** Level size parameters (GDD K-49): yard `Wy × Hy`, site `Ws × Hs`, elevator range top `b` (0 without elevator). */
export interface GeoParams {
  readonly wy: number;
  readonly hy: number;
  readonly ws: number;
  readonly hs: number;
  readonly eMax: number;
}

/** The geometry of one level. Frozen; shared by every state of the level (`CompiledLevel.geo`). */
export interface BoardGeo {
  /** Yard width Wy and height Hy (K-02, K-49). */
  readonly wy: number;
  readonly hy: number;
  /** Site width Ws and plan height Hs (K-03, K-15, K-49). */
  readonly ws: number;
  readonly hs: number;
  /** Top `b` of the elevator range (K-24); 0 without elevator. */
  readonly eMax: number;
  /** Board height H = max(hy, hs + eMax) (K-49), at most MAX_BOARD_ROWS (see `makeGeo`). */
  readonly h: number;
  /** h + 2: board rows plus the crane area (K-05). */
  readonly rows: number;
  /** wy + ws. */
  readonly cols: number;
  /** = wy: first site column. */
  readonly siteX: number;
  /** = wy − 1: last yard column; the wall boundary lies between `boundaryX` and `siteX`. */
  readonly boundaryX: number;
  /** = h: first crane-area row (K-05). */
  readonly craneRow: number;
  /** Column bits of the yard in a frame row mask: (1 << wy) − 1. */
  readonly yardBits: number;
  /** Column bits of the site in a frame row mask: ((1 << ws) − 1) << wy. */
  readonly siteBits: number;
  /** Row bits of every frame row of this level: (1 << rows) − 1. */
  readonly rowMaskAll: number;
  /** ws · hs: cells (and local plan indices `sy · ws + sx`) of one segment. */
  readonly segCells: number;
}

function assertInt(name: string, v: number, lo: number, hi: number): void {
  if (!Number.isInteger(v) || v < lo || v > hi)
    throw new RangeError(`makeGeo: ${name} = ${v} is outside ${lo}…${hi} (K-49 frame)`);
}

/**
 * Builds a level geometry. Throws when the sizes do not fit the maximum frame (wy ≥ 1, ws 1–4, wy + ws ≤ 8, hy and hs
 * 1–8, eMax 0–3); the validator's K-49 ranges (`size_out_of_range`, `board_too_wide`) are narrower.
 *
 * H is clamped to MAX_BOARD_ROWS: a valid level never needs the clamp (`elevator_overflow` asks `hs + b ≤ 8`), but
 * pre-2R data without `site.rows` (default Hs 8) and an elevator would exceed the frame; with the clamp, plan rows that
 * the elevator pushes above row H − 1 simply do not exist, which is exactly the pre-2R model (fixtures keep working).
 */
export function makeGeo(p: GeoParams): BoardGeo {
  assertInt('wy', p.wy, 1, MAX_COLS - 1);
  assertInt('ws', p.ws, 1, MAX_SITE_COLS);
  assertInt('wy + ws', p.wy + p.ws, 2, MAX_COLS);
  assertInt('hy', p.hy, 1, MAX_BOARD_ROWS);
  assertInt('hs', p.hs, 1, MAX_BOARD_ROWS);
  assertInt('eMax', p.eMax, 0, MAX_BOARD_ROWS - 1);
  const h = Math.min(MAX_BOARD_ROWS, Math.max(p.hy, p.hs + p.eMax));
  const rows = h + CRANE_ROWS;
  return Object.freeze({
    wy: p.wy,
    hy: p.hy,
    ws: p.ws,
    hs: p.hs,
    eMax: p.eMax,
    h,
    rows,
    cols: p.wy + p.ws,
    siteX: p.wy,
    boundaryX: p.wy - 1,
    craneRow: h,
    yardBits: (1 << p.wy) - 1,
    siteBits: ((1 << p.ws) - 1) << p.wy,
    rowMaskAll: (1 << rows) - 1,
    segCells: p.ws * p.hs,
  });
}

/** GDD K-49 defaults: yard 6 × 8, site 2 × 8, no elevator → H 8, rows 10 (the pre-2R constants). */
export const DEFAULT_SIZES: Readonly<GeoParams> = Object.freeze({ wy: 6, hy: 8, ws: 2, hs: 8, eMax: 0 });
export const DEFAULT_GEO: BoardGeo = makeGeo(DEFAULT_SIZES);

/** Level data fields the geometry reads (structural: works with and without the 2R schema size fields). */
export interface GeoSource {
  readonly yard: object;
  readonly site?: object;
  readonly build: { readonly elevator?: { readonly range: readonly [number, number] } | undefined };
}

interface SizeFields {
  readonly cols?: number;
  readonly rows?: number;
}

/**
 * K-49 geometry of a level: `yard.cols`, `yard.rows`, `site.cols`, `site.rows` (missing → 6, 8, 2, 8) and the
 * elevator range top `b` (K-24). Pure; compile stores the result as `CompiledLevel.geo`.
 */
export function geoFromLevel(level: GeoSource): BoardGeo {
  const yard = level.yard as SizeFields;
  const site = (level.site ?? {}) as SizeFields;
  const el = level.build.elevator;
  const p: GeoParams = {
    wy: yard.cols ?? DEFAULT_SIZES.wy,
    hy: yard.rows ?? DEFAULT_SIZES.hy,
    ws: site.cols ?? DEFAULT_SIZES.ws,
    hs: site.rows ?? DEFAULT_SIZES.hs,
    eMax: el ? Math.max(0, el.range[1]) : 0,
  };
  return isDefaultSizes(p) ? DEFAULT_GEO : makeGeo(p);
}

function isDefaultSizes(p: GeoParams): boolean {
  return (
    p.wy === DEFAULT_SIZES.wy &&
    p.hy === DEFAULT_SIZES.hy &&
    p.ws === DEFAULT_SIZES.ws &&
    p.hs === DEFAULT_SIZES.hs &&
    p.eMax === DEFAULT_SIZES.eMax
  );
}

/** Same yard, site and board height as the default 6×8 | 2×8 board (Appendix A: no `size` header line). */
export function hasDefaultBoard(geo: BoardGeo): boolean {
  return (
    geo.wy === DEFAULT_GEO.wy &&
    geo.hy === DEFAULT_GEO.hy &&
    geo.ws === DEFAULT_GEO.ws &&
    geo.hs === DEFAULT_GEO.hs &&
    geo.h === DEFAULT_GEO.h
  );
}

/** `4x4|2x5 H5`: the Appendix A size label (debug, test names, the ASCII `size` header line). */
export function geoLabel(geo: BoardGeo): string {
  return `${geo.wy}x${geo.hy}|${geo.ws}x${geo.hs} H${geo.h}`;
}
