/**
 * Screen layout from `tokens.layout.*` (docs/TECH_DESIGN.md §2.2 "Ekran eşlemesi", §10.1 "Çapa sözleşmesi";
 * UX_FLOWS §0.1, §5.1; D-011, D-015, R-04, R-06).
 *
 * The design width is fixed at `meta.designWidth` (1080). The design height `H` is 1920 in FIT and 1920…2400 in
 * EXPAND. The anchor group of an element comes from its TOKEN GROUP, never from its y value:
 * - `layout.grid.*`  x values and cell sizes, independent of H;
 * - `layout.top.*`   y measured from the top, used as is;
 * - `layout.bottom.*` `*BottomPx` = distance from the element's BOTTOM edge to the screen bottom → `y = H − bottomPx − h`;
 * - `layout.board.*` y values are for H = 1920 and shift by `(H − 1920) × board.expandShare` (crane area, board,
 *   status strip, "Yapı tamam!" ribbon; ribbon x/w/h/tilt/notch do not depend on H);
 * - `layout.popup.*` anchored to the bottom: panel bottom `y = H − panelBottomPx`, options stacked bottom → top,
 *   never vertically centred;
 * - `touch.*` tap target sizes, independent of H and of the screen width (UX §0.1 decision (b): 128 px everywhere).
 * In FIT, H = 1920 and every formula is the identity, so the same code serves both modes.
 *
 * TECH §10.1 names this `Layout.recompute(H)`: here a layout is an immutable value, so a resize (Phaser
 * `scale.on('resize')`) simply calls `createLayout(tokens, H, geo)` again. Pure: no Phaser, no DOM.
 *
 * Faz 2R (TECH §2R.1, UX §5.8, GDD K-49, DL-2R-14): the board group follows the LEVEL geometry `geo`
 * (`CompiledLevel.geo`; the default 6×8 | 2×8 board when omitted). The cell `c` is chosen once per level
 * (`adaptiveCellPx`, 120…`layout.adaptive.cellMaxPx`), the board is centred horizontally and its bottom edge stays on
 * `board.boardBottomY` (thumb zone), so fewer rows leave room above it. Board-local sizes scale with `k = c / 120`
 * (wall strip, block hit slop); HUD, kit and windows do not.
 */
import { CRANE_ROWS, DEFAULT_GEO } from '../core/geometry.ts';
import type { BoardGeo } from '../core/geometry.ts';
import type { Tokens } from './tokens.ts';

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export type ScaleMode = 'fit' | 'expand';

export interface Viewport {
  /** CSS px of the game container (inside the safe area, TECH §10.1). */
  readonly width: number;
  readonly height: number;
}

/** Booster slots on the level screen (UX §5.1: hammer, crane, brush, undo). */
export const BOOSTER_SLOTS = 4;
/** Bottom navigation tabs on the home screen (UX §3: shop, league, home, team, album). */
export const NAV_TABS = 5;

export const rectBottom = (r: Rect): number => r.y + r.h;
export const rectRight = (r: Rect): number => r.x + r.w;

/** Vertical union of rects. */
export function boundsOf(rects: readonly Rect[]): Rect {
  if (rects.length === 0) throw new RangeError('boundsOf: no rects');
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  return { x, y, w: Math.max(...rects.map(rectRight)) - x, h: Math.max(...rects.map(rectBottom)) - y };
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < rectRight(b) && b.x < rectRight(a) && a.y < rectBottom(b) && b.y < rectBottom(a);
}

/**
 * UX §0.3 "Görsel + pay": every side shorter than `minPx` is padded equally on both sides up to `minPx`
 * (`touch.minTargetPx`). Sides already long enough are unchanged.
 */
export function hitArea(r: Rect, minPx: number): Rect {
  const padX = Math.max(0, (minPx - r.w) / 2);
  const padY = Math.max(0, (minPx - r.h) / 2);
  return { x: r.x - padX, y: r.y - padY, w: r.w + 2 * padX, h: r.h + 2 * padY };
}

/**
 * Design height for a viewport (R-06). FIT: always `meta.scale.fitHeight`. EXPAND: the width stays
 * `meta.designWidth` and the height follows the viewport aspect, clamped to `[expandMinHeight, expandMaxHeight]`
 * (Phaser `Scale.EXPAND`; taller viewports letterbox the rest, wider ones pillarbox).
 */
export function designHeight(mode: ScaleMode, viewport: Viewport, tokens: Tokens): number {
  const s = tokens.meta.scale;
  if (mode === 'fit') return s.fitHeight;
  const natural = Math.round((tokens.meta.designWidth * viewport.height) / viewport.width);
  return Math.min(s.expandMaxHeight, Math.max(s.expandMinHeight, natural));
}

/** How the design canvas maps onto the viewport (CSS px). */
export interface ViewportFit {
  readonly H: number;
  /** CSS px per design px. */
  readonly scale: number;
  /** Letterbox (top + bottom) and pillarbox (left + right) bands in CSS px. */
  readonly letterboxPx: number;
  readonly pillarboxPx: number;
}

export function fitViewport(mode: ScaleMode, viewport: Viewport, tokens: Tokens): ViewportFit {
  const H = designHeight(mode, viewport, tokens);
  const W = tokens.meta.designWidth;
  const scale = Math.min(viewport.width / W, viewport.height / H);
  return { H, scale, letterboxPx: viewport.height - H * scale, pillarboxPx: viewport.width - W * scale };
}

/**
 * Board geometry (TECH §2.2 "Ekran eşlemesi", §2R.1; UX §5.8); all y values already shifted for H. Global coordinates
 * of the level geometry: x 0 … wy−1 yard, wy … cols−1 site; y 0 … h−1 board, h … h+1 crane area.
 */
export interface BoardGeometry {
  /** The level geometry this board is laid out for (K-49). */
  readonly geo: BoardGeo;
  readonly cellPx: number;
  /** Cell scale `k = cellPx / layout.grid.cellPx` (TECH §2R.1): wall strip, hit slop and block bakes scale with it. */
  readonly k: number;
  readonly wallW: number;
  /** Left edge of yard column 0, of the wall strip and of the first site column. */
  readonly yardX: number;
  readonly wallX: number;
  readonly buildX: number;
  /** Right edge of the last site column. */
  readonly siteRight: number;
  /** Shifted y of the crane area top, the board top (row h − 1), the yard top (row hy − 1) and the board bottom. */
  readonly craneTopY: number;
  readonly boardTopY: number;
  readonly yardTopY: number;
  readonly boardBottomY: number;
  /** Left edge of global column x (x < wy yard, x ≥ wy site). */
  colLeft(x: number): number;
  /** Top edge of global row y (y 0 … h−1 board, h … h+1 crane area). */
  rowTop(y: number): number;
  cellRect(x: number, y: number): Rect;
  /**
   * Screen x of the left edge of a dragged piece with CONTINUOUS anchor `ax` and box width `w`:
   * `yardX + ax·cellPx + s·wallW`, `s = clamp((ax − (wy − w)) / w, 0, 1)` — 0 while the box is fully in the yard,
   * 1 when fully in the site; a straddling box slides symmetrically over the wall (TECH §2.2, §2R.1).
   */
  pieceX(ax: number, w: number): number;
  /** Screen y of the top edge of a piece box with continuous anchor row `ay` and box height `h`. */
  pieceY(ay: number, h: number): number;
  pieceRect(ax: number, ay: number, w: number, h: number): Rect;
  /** Inverse of `pieceX` (monotonic, piecewise linear). */
  anchorXAt(screenX: number, w: number): number;
  /** Inverse of `pieceY`. */
  anchorYAt(screenY: number, h: number): number;
  /** Global cell under a screen point; null over the wall strip or outside the cols × rows grid. */
  cellAt(px: number, py: number): { readonly x: number; readonly y: number } | null;
  /** Wall strip rows `[0, height)`; the zero-width boundary is drawn as this strip (R-03). */
  wallRect(height: number): Rect;
  /** Opening of a gap with rows `[y, y + size)` on the wall strip. */
  gapRect(y: number, size: number): Rect;
}

/** TECH §2R.1 adaptive cell: horizontal budget = design width − 2 × this (≥ 30 px margin + frame / scaffold). */
export const ADAPTIVE_SIDE_RESERVE_PX = 60;
/** TECH §2R.1: the cell is a multiple of 12 px (a whole number of CSS px at 360 px width: 12 / 3 = 4). */
export const ADAPTIVE_CELL_STEP_PX = 12;

/**
 * DL-2R-14 / TECH §2R.1 cell size of a level, chosen once and device independent (FIT budget):
 * `c = max(120, min(cellMaxPx, ⌊960 / cols / 12⌋·12, ⌊1200 / (h + 2) / 12⌋·12))` with 960 = 1080 − 2·60 and
 * 1200 = `board.boardBottomY` − `top.groupBottomY` − `board.minGapTopPx`. Without `layout.adaptive.cellMaxPx` every
 * level gets 120 (R2-02 "hücre 120 px korunur").
 */
export function adaptiveCellPx(tokens: Tokens, geo: BoardGeo): number {
  const L = tokens.layout;
  const base = L.grid.cellPx;
  const max = L.adaptive.cellMaxPx ?? base;
  const step = ADAPTIVE_CELL_STEP_PX;
  const budgetW = tokens.meta.designWidth - 2 * ADAPTIVE_SIDE_RESERVE_PX;
  const budgetH = L.board.boardBottomY - L.top.groupBottomY - L.board.minGapTopPx;
  const byW = Math.floor(budgetW / geo.cols / step) * step;
  const byH = Math.floor(budgetH / (geo.h + CRANE_ROWS) / step) * step;
  return Math.max(base, Math.min(max, byW, byH));
}

/** The board group of a level (UX §5.8 rules 1–5): its geometry and its rects. */
export interface BoardLayout {
  readonly grid: BoardGeometry;
  /** Crane area, rows h, h+1 over the full board width (K-05). */
  readonly crane: Rect;
  /** Rows 0 … h−1 over the full board width (yard + wall + site). */
  readonly board: Rect;
  /** Yard rows 0 … hy−1 (the wooden "material crate"). */
  readonly yard: Rect;
  /** Yard air rows hy … h−1 over the yard columns (empty when hy = h; K-05, UX §5.8). */
  readonly yardAir: Rect;
  /** Site columns, rows 0 … h−1. */
  readonly site: Rect;
  /** Status strip (streak beads, truck chip), board group (UX §5.1). */
  readonly status: Rect;
  /** "Yapı tamam!" ribbon (UX §5.1, §5.8 rule 5): over wall + site, in the middle of the board. */
  readonly siteRibbon: Rect & { readonly tiltDeg: number; readonly notchPx: number };
}

/** UX §5.8 rules 1–5 for level geometry `geo` at design height H (pure; `createLayout` embeds it). */
export function boardLayout(tokens: Tokens, geo: BoardGeo, H: number): BoardLayout {
  const L = tokens.layout;
  const g = L.grid;
  const b = L.board;
  const W = tokens.meta.designWidth;
  const boardShift = (H - tokens.meta.designHeight) * b.expandShare;
  const by = (y: number): number => y + boardShift;

  const c = adaptiveCellPx(tokens, geo);
  const k = c / g.cellPx;
  const wallW = g.wallW * k;
  const boardW = geo.cols * c + wallW;
  const yardX = Math.round((W - boardW) / 2);
  const wallX = yardX + geo.wy * c;
  const buildX = wallX + wallW;
  const siteRight = buildX + geo.ws * c;
  const gridRows = geo.rows;

  const boardBottomY = by(b.boardBottomY);
  const boardTopY = boardBottomY - geo.h * c;
  const yardTopY = boardBottomY - geo.hy * c;
  const craneTopY = boardTopY - CRANE_ROWS * c;

  const colLeft = (x: number): number => (x < geo.wy ? yardX + x * c : buildX + (x - geo.wy) * c);
  const rowTop = (y: number): number => boardBottomY - (y + 1) * c;
  const wallStart = (w: number): number => geo.wy - w;
  const pieceX = (ax: number, w: number): number => {
    const sFrac = Math.min(1, Math.max(0, (ax - wallStart(w)) / w));
    return yardX + ax * c + sFrac * wallW;
  };
  const pieceY = (ay: number, h: number): number => boardBottomY - (ay + h) * c;

  const grid: BoardGeometry = {
    geo,
    cellPx: c,
    k,
    wallW,
    yardX,
    wallX,
    buildX,
    siteRight,
    craneTopY,
    boardTopY,
    yardTopY,
    boardBottomY,
    colLeft,
    rowTop,
    cellRect: (x, y) => ({ x: colLeft(x), y: rowTop(y), w: c, h: c }),
    pieceX,
    pieceY,
    pieceRect: (ax, ay, w, h) => ({ x: pieceX(ax, w), y: pieceY(ay, h), w: w * c, h: h * c }),
    anchorXAt: (screenX, w) => {
      const start = wallStart(w);
      const x0 = yardX + start * c; // s = 0 up to here
      const x1 = yardX + geo.wy * c + wallW; // s = 1 from here (ax = wy)
      if (screenX <= x0) return (screenX - yardX) / c;
      if (screenX >= x1) return (screenX - yardX - wallW) / c;
      return start + (screenX - x0) / (c + wallW / w);
    },
    anchorYAt: (screenY, h) => (boardBottomY - screenY) / c - h,
    cellAt: (px, py) => {
      // Row y owns [rowTop(y), rowTop(y) + c) like the x mapping owns [colLeft, colLeft + c): count rows from the
      // grid top so the top-edge pixel belongs to the cell and `py = boardBottomY` is already below row 0.
      const fromTop = Math.floor((py - (boardBottomY - gridRows * c)) / c);
      const y = gridRows - 1 - fromTop;
      if (y < 0 || y >= gridRows) return null;
      if (px >= yardX && px < wallX) return { x: Math.floor((px - yardX) / c), y };
      if (px >= buildX && px < siteRight) return { x: geo.wy + Math.floor((px - buildX) / c), y };
      return null;
    },
    wallRect: (height) => ({ x: wallX, y: boardBottomY - height * c, w: wallW, h: height * c }),
    gapRect: (y, size) => ({ x: wallX, y: boardBottomY - (y + size) * c, w: wallW, h: size * c }),
  };

  // UX §5.8 rule 5: width max(306, wall + site), over wall + site (left-aligned on the wall when the token width is
  // the wider one, as on the default board), vertically in the middle of the board
  const ribbonW = Math.max(b.siteRibbonW, wallW + geo.ws * c);
  const ribbonX = wallX + Math.max(0, (wallW + geo.ws * c - ribbonW) / 2);
  return {
    grid,
    crane: { x: yardX, y: craneTopY, w: boardW, h: boardTopY - craneTopY },
    board: { x: yardX, y: boardTopY, w: boardW, h: boardBottomY - boardTopY },
    yard: { x: yardX, y: yardTopY, w: geo.wy * c, h: geo.hy * c },
    yardAir: { x: yardX, y: boardTopY, w: geo.wy * c, h: yardTopY - boardTopY },
    site: { x: buildX, y: boardTopY, w: geo.ws * c, h: geo.h * c },
    status: { x: yardX, y: by(b.statusY), w: boardW, h: b.statusH },
    siteRibbon: {
      x: ribbonX,
      y: boardTopY + (geo.h * c) / 2 - b.siteRibbonH / 2,
      w: ribbonW,
      h: b.siteRibbonH,
      tiltDeg: b.siteRibbonTiltDeg,
      notchPx: b.siteRibbonNotchPx,
    },
  };
}

export interface Layout {
  readonly H: number;
  readonly W: number;
  /** `(H − 1920) × board.expandShare`; 0 in FIT. */
  readonly boardShift: number;
  readonly grid: BoardGeometry;
  readonly top: {
    readonly pause: Rect;
    readonly panorama: Rect;
    readonly goals: Rect;
    readonly moves: Rect;
    /** Home screen top bar band (full width). */
    readonly topBar: Rect;
    readonly groupBottomY: number;
  };
  /** The board group of the level geometry (UX §5.8; `boardLayout`). */
  readonly board: Omit<BoardLayout, 'grid'>;
  readonly bottom: {
    readonly character: Rect;
    /** `BOOSTER_SLOTS` slots, left → right. */
    readonly boosters: readonly Rect[];
    /** Home screen. */
    readonly nav: Rect;
    readonly navTabs: readonly Rect[];
    readonly playButton: Rect;
    /** Top edge of the level screen bottom group: `H − bottom.groupTopFromBottomPx`. */
    readonly groupTopY: number;
  };
  readonly popup: {
    /** `H − popup.panelBottomPx`. */
    readonly panelBottomY: number;
    /** Bottom edge of the lowest option: panel bottom − `optionsBottomInsetPx`. */
    readonly optionsBottomY: number;
    /**
     * `n` equal options (`optionW × optionH`, gap `optionGap`), stacked bottom → top from `optionsBottomY` and
     * returned top → bottom (index 0 = topmost = first in reading order). Horizontally centred.
     */
    options(n: number): readonly Rect[];
  };
  /**
   * Touch targets (UX §0.1 decision (b) of 2026-10-06, UX §0.3; TECH §10.1), read from `tokens.touch`. They depend
   * neither on H nor on the screen width: the design width is always the full screen width, so 128 px is 44.4 pt at
   * 375 pt, 46.2 pt at 390 pt and 42.7 dp at 360 dp (accepted). The frequent targets of the UX §0.1 closed list are
   * sized ≥ 144 px (48 dp at 360) by their own tokens; that invariant is a test, not a token.
   */
  readonly touch: {
    /** `touch.minTargetPx`: the smallest side of any tap target (visual + pad). */
    readonly minTargetPx: number;
    /** `touch.hitSlopPx` × k: invisible pad around a block cell on every side (120 → 180; TECH §2R.1). */
    readonly hitSlopPx: number;
    /** UX §0.3 "Görsel + pay": `hitArea(r, minTargetPx)`. */
    hit(r: Rect): Rect;
    /** A block cell (or piece box) grown by `hitSlopPx` on every side (UX §0.1, TECH §10.3). */
    blockHit(r: Rect): Rect;
  };
}

/**
 * Builds the layout for design height `H` (FIT: 1920; EXPAND: 1920…2400) and level geometry `geo` (default 6×8 | 2×8).
 */
export function createLayout(tokens: Tokens, H: number, geo: BoardGeo = DEFAULT_GEO): Layout {
  const s = tokens.meta.scale;
  if (!(H >= s.fitHeight && H <= s.expandMaxHeight)) {
    throw new RangeError(`createLayout: H ${H} outside [${s.fitHeight}, ${s.expandMaxHeight}]`);
  }
  const W = tokens.meta.designWidth;
  const { top: t, board: b, bottom: bt, popup: p } = tokens.layout;
  const touch = tokens.touch;
  const base = tokens.meta.designHeight;
  const boardShift = (H - base) * b.expandShare;
  const fromBottom = (bottomPx: number, h: number): number => H - bottomPx - h;
  const { grid, ...board } = boardLayout(tokens, geo, H);
  const slop = touch.hitSlopPx * grid.k;

  const boosters = Array.from({ length: BOOSTER_SLOTS }, (_, i) => ({
    x: bt.boosterX + i * (bt.boosterSize + bt.boosterGap),
    y: fromBottom(bt.boosterBottomPx, bt.boosterSize),
    w: bt.boosterSize,
    h: bt.boosterSize,
  }));
  const nav = { x: 0, y: fromBottom(bt.navBottomPx, bt.navH), w: W, h: bt.navH };
  const tabW = W / NAV_TABS;
  const navTabs = Array.from({ length: NAV_TABS }, (_, i) => ({ x: i * tabW, y: nav.y, w: tabW, h: nav.h }));

  const panelBottomY = H - p.panelBottomPx;
  const optionsBottomY = panelBottomY - p.optionsBottomInsetPx;

  const layout: Layout = {
    H,
    W,
    boardShift,
    grid,
    top: {
      pause: { x: t.pauseX, y: t.pauseY, w: t.pauseSize, h: t.pauseSize },
      panorama: { x: t.panoramaX, y: t.panoramaY, w: t.panoramaW, h: t.panoramaH },
      goals: { x: t.goalsX, y: t.goalsY, w: t.goalsW, h: t.goalsH },
      moves: { x: t.movesX, y: t.movesY, w: t.movesW, h: t.movesH },
      topBar: { x: 0, y: t.topBarY, w: W, h: t.topBarH },
      groupBottomY: t.groupBottomY,
    },
    board,
    bottom: {
      character: {
        x: bt.characterX,
        y: fromBottom(bt.characterBottomPx, bt.characterH),
        w: bt.characterW,
        h: bt.characterH,
      },
      boosters,
      nav,
      navTabs,
      playButton: {
        x: (W - bt.playButtonW) / 2,
        y: fromBottom(bt.playButtonBottomPx, bt.playButtonH),
        w: bt.playButtonW,
        h: bt.playButtonH,
      },
      groupTopY: H - bt.groupTopFromBottomPx,
    },
    popup: {
      panelBottomY,
      optionsBottomY,
      options: (n) => {
        if (!Number.isInteger(n) || n < 1) throw new RangeError(`popup.options: bad count ${n}`);
        const x = (W - p.optionW) / 2;
        const top = optionsBottomY - n * p.optionH - (n - 1) * p.optionGap;
        return Array.from({ length: n }, (_, i) => ({
          x,
          y: top + i * (p.optionH + p.optionGap),
          w: p.optionW,
          h: p.optionH,
        }));
      },
    },
    touch: {
      minTargetPx: touch.minTargetPx,
      hitSlopPx: slop,
      hit: (r) => hitArea(r, touch.minTargetPx),
      blockHit: (r) => ({ x: r.x - slop, y: r.y - slop, w: r.w + 2 * slop, h: r.h + 2 * slop }),
    },
  };
  return deepFreeze(layout);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}
