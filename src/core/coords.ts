/**
 * Grid geometry and the wall boundary (docs/GDD.md §0, K-01…K-05, K-49; TECH_DESIGN §2.2 edge model, §2R.1).
 *
 * Internal coordinates are the global ones (no conversion) in the 8 × 10 MAXIMUM FRAME (geometry.ts): cell and drag
 * node codes never depend on the level. What a cell is comes from the level geometry `geo` (`s.lvl.geo`): x 0 … wy−1
 * yard, x wy … wy+ws−1 site, y 0 … h−1 board, y h … h+1 crane area. The wall is the ZERO-WIDTH boundary between
 * x = wy−1 and x = wy: it has no cells. A row of the boundary is described by bit `y` of a `geo.rows`-bit row mask.
 *
 * Every region function takes `geo` first. The pre-2R constants below describe the DEFAULT 6×8 | 2×8 board only; they
 * are a transition layer for the scene code (WP-G moves it to `geo`) and ESLint forbids importing them elsewhere
 * (`no-restricted-imports`, eslint.config.js, TECH §2R.1 acceptance).
 */
import { DEFAULT_GEO, MAX_COLS, MAX_ROWS } from './geometry.ts';
import type { BoardGeo } from './geometry.ts';
import type { Anchor, CellIndex, DragNode } from './types.ts';

// --- deprecated default-board constants (TECH §2R.1 mapping table; do not import outside coords.ts) ------------------

/** @deprecated `MAX_COLS` (encoding) / `geo.cols` (validity). */
export const GRID_COLS = MAX_COLS;
/** @deprecated `MAX_ROWS` (encoding) / `geo.rows` (validity). */
export const GRID_ROWS = MAX_ROWS;
/** @deprecated encoding only: `MAX_COLS * MAX_ROWS`. */
export const GRID_CELLS = GRID_COLS * GRID_ROWS;
/** @deprecated `geo.h` (board height H). */
export const BOARD_ROWS = DEFAULT_GEO.h;
/** @deprecated `geo.craneRow` (K-05). */
export const CRANE_ROW = DEFAULT_GEO.craneRow;
/** @deprecated `geo.wy`. */
export const YARD_COLS = DEFAULT_GEO.wy;
/** @deprecated `geo.siteX`. */
export const SITE_X = DEFAULT_GEO.siteX;
/** @deprecated `geo.ws`. */
export const SITE_COLS = DEFAULT_GEO.ws;
/** @deprecated `geo.boundaryX`; the boundary lies between `boundaryX` and `siteX`. */
export const BOUNDARY_X = DEFAULT_GEO.boundaryX;
/** @deprecated `geo.wy * geo.hy` (yard cell count C, K-02). */
export const YARD_CELLS = DEFAULT_GEO.wy * DEFAULT_GEO.hy;
/** @deprecated `geo.segCells` (= ws · hs). */
export const SEGMENT_CELLS = DEFAULT_GEO.segCells;
/** @deprecated `geo.rowMaskAll`. */
export const ROW_MASK_ALL = DEFAULT_GEO.rowMaskAll;

// --- frame encoding (level independent) ------------------------------------------------------------------------------

/** Frame cell index `y * 8 + x` (TECH §2.1; the same for every geometry). */
export function cellIndex(x: number, y: number): CellIndex {
  return y * MAX_COLS + x;
}
export function cellX(cell: CellIndex): number {
  return cell % MAX_COLS;
}
export function cellY(cell: CellIndex): number {
  return Math.floor(cell / MAX_COLS);
}

/** Integer code of a drag node: `(mode * 10 + iy) * 8 + ix` (TECH §2.1, §2R.0 item 2: the frame code, every geometry). */
export function dragNodeCode(node: DragNode): number {
  return (node.mode * MAX_ROWS + node.iy) * MAX_COLS + node.ix;
}
export function dragNodeFromCode(code: number): DragNode {
  const ix = code % MAX_COLS;
  const rest = Math.floor(code / MAX_COLS);
  return { ix, iy: rest % MAX_ROWS, mode: Math.floor(rest / MAX_ROWS) };
}

// --- regions (K-01…K-05, K-49) -----------------------------------------------------------------------------------------

/** Board + crane area: K-01, no cell may have y > h + 1, x < 0 or x > wy + ws − 1. */
export function inGrid(geo: BoardGeo, x: number, y: number): boolean {
  return x >= 0 && x < geo.cols && y >= 0 && y < geo.rows;
}
/** Inside the (wy + ws) × h board. */
export function onBoard(geo: BoardGeo, x: number, y: number): boolean {
  return x >= 0 && x < geo.cols && y >= 0 && y < geo.h;
}
/** Yard (K-02): x 0 … wy−1, y 0 … hy−1. */
export function isYardCell(geo: BoardGeo, x: number, y: number): boolean {
  return x >= 0 && x < geo.wy && y >= 0 && y < geo.hy;
}
/** Yard air (§0, Faz 2R): x ≤ wy−1 and hy ≤ y ≤ h−1 (exists only when hy < h). Passed while dragging, never a drop. */
export function isYardAir(geo: BoardGeo, x: number, y: number): boolean {
  return x >= 0 && x < geo.wy && y >= geo.hy && y < geo.h;
}
/** A board cell of the site columns (K-03): x wy … wy+ws−1, y 0 … h−1 (platform, plan area and site air). */
export function isSiteCell(geo: BoardGeo, x: number, y: number): boolean {
  return x >= geo.siteX && x < geo.cols && y >= 0 && y < geo.h;
}
/** Site air (K-03): a site-column board cell with y ≥ hs + e (`elev` = elevator offset, K-24). */
export function isSiteAir(geo: BoardGeo, x: number, y: number, elev = 0): boolean {
  return isSiteCell(geo, x, y) && y >= geo.hs + elev;
}
/** Crane area (K-05): rows h and h + 1 over every column. */
export function isCraneCell(geo: BoardGeo, x: number, y: number): boolean {
  return x >= 0 && x < geo.cols && y >= geo.craneRow && y < geo.rows;
}
/** Which side of the boundary a column is on. */
export function sideOf(geo: BoardGeo, x: number): 'yard' | 'site' {
  return x <= geo.boundaryX ? 'yard' : 'site';
}

/** A box `[ix, ix + w)` straddles the boundary when it has columns on both sides (K-07 row 4, E-06, E-28). */
export function straddlesBoundary(geo: BoardGeo, ix: number, w: number): boolean {
  return ix <= geo.boundaryX && ix + w > geo.siteX;
}

/** Row mask of rows `[y, y + size)`, clipped to the level's frame rows `0 … rows − 1`. */
export function rowRangeMask(geo: BoardGeo, y: number, size: number): number {
  if (size <= 0) return 0;
  const lo = Math.max(0, y);
  const hi = Math.min(geo.rows, y + size);
  if (hi <= lo) return 0;
  return (((1 << (hi - lo)) - 1) << lo) & geo.rowMaskAll;
}

/**
 * `openFree` (TECH §2.2): rows where a FREE-mode cell may cross the boundary = every row `y ≥ height`
 * (air above the wall + crane area, K-05: crane rows h, h + 1 are always open).
 */
export function openFreeMask(geo: BoardGeo, wallHeight: number): number {
  return rowRangeMask(geo, wallHeight, geo.rows - wallHeight);
}

/** `openRail[g]` (TECH §2.2): the rows of gap `g` when it is open, otherwise 0. */
export function openRailMask(geo: BoardGeo, gapY: number, gapSize: number, open: boolean): number {
  return open ? rowRangeMask(geo, gapY, gapSize) : 0;
}

/**
 * Closed boundary rows (GDD K-04): `y < height` and not inside an OPEN gap. Crane rows are never closed.
 * `openGapRows` = OR of the open gaps' row masks.
 */
export function closedBoundaryMask(geo: BoardGeo, wallHeight: number, openGapRows: number): number {
  return rowRangeMask(geo, 0, Math.min(wallHeight, geo.h)) & ~openGapRows & geo.rowMaskAll;
}

/**
 * Crossing test for one horizontal step (TECH §2.2): every cell that changes side does so in its own row, and that
 * row must be in the `open` mask of the current mode. `crossRows` is the row mask (already shifted by the anchor row)
 * of the cells that change side. True when the step is allowed by the boundary. Pure bit logic (no geometry).
 */
export function boundaryAllows(crossRows: number, open: number): boolean {
  return (crossRows & ~open) === 0;
}

/**
 * The 4-neighbours of a cell inside the same region (GDD §0: neighbourhood never crosses the wall boundary;
 * x = wy−1 and x = wy are never neighbours whatever the wall height or gaps, E-46): yard cells see yard cells
 * (x ≤ wy−1, y ≤ hy−1), site-column cells see site-column board cells. Order: left, right, down, up.
 */
export function neighbors4(geo: BoardGeo, x: number, y: number): readonly Anchor[] {
  const yard = isYardCell(geo, x, y);
  if (!yard && !isSiteCell(geo, x, y)) return [];
  const inRegion = yard
    ? (nx: number, ny: number): boolean => isYardCell(geo, nx, ny)
    : (nx: number, ny: number): boolean => isSiteCell(geo, nx, ny);
  const out: Anchor[] = [];
  const candidates: readonly (readonly [number, number])[] = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];
  for (const [nx, ny] of candidates) if (inRegion(nx, ny)) out.push({ ix: nx, iy: ny });
  return out;
}
