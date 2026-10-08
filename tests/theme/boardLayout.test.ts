/**
 * WP-G variable board layout (docs/TECH_DESIGN.md §2R.1 "Yerleşim", "Uyarlanır hücre boyu"; UX_FLOWS §5.8; GDD K-49;
 * DL-2R-14). Pure: `boardLayout` / `createLayout(tokens, H, geo)` and the block hit test on every geometry of the set G.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_GEO, makeGeo } from '../../src/core/geometry.ts';
import type { BoardGeo } from '../../src/core/geometry.ts';
import { pieceBoardCells } from '../../src/core/grid.ts';
import { pieceZone } from '../../src/core/state.ts';
import { Zone } from '../../src/core/types.ts';
import { pieceAtPoint } from '../../src/scenes/level/hitTest.ts';
import { VIEW } from '../../src/scenes/level/viewConstants.ts';
import {
  ADAPTIVE_CELL_STEP_PX,
  adaptiveCellPx,
  boardLayout,
  createLayout,
  designHeight,
  rectBottom,
  rectRight,
} from '../../src/theme/layout.ts';
import type { Layout } from '../../src/theme/layout.ts';
import { TOKENS } from '../../src/theme/tokens.ts';
import type { Tokens } from '../../src/theme/tokens.ts';
import { panoramaGeometry } from '../../src/ui/Panorama.ts';
import { initialState } from '../fixtures/builders.ts';

const geo = (wy: number, hy: number, ws: number, hs: number): BoardGeo =>
  makeGeo({ wy, hy, ws, hs, eMax: 0 });
/** DL-2R-14 token once design-lead writes it (`layout.adaptive.cellMaxPx` 144). */
const T144: Tokens = {
  ...TOKENS,
  layout: { ...TOKENS.layout, adaptive: { ...TOKENS.layout.adaptive, cellMaxPx: 144 } },
} as Tokens;

/** LEVELS §2 sizes of levels 1–10 (UX §5.8 example table). */
const LEVEL_SIZES = {
  1: geo(4, 4, 2, 5),
  2: geo(4, 4, 2, 5),
  3: geo(4, 4, 2, 5),
  4: geo(4, 4, 2, 6),
  5: geo(4, 4, 2, 5),
  6: geo(4, 5, 2, 7),
  7: geo(4, 5, 2, 5),
  8: geo(6, 5, 2, 6),
  9: geo(4, 4, 2, 6),
  10: geo(6, 5, 2, 6),
} as const satisfies Readonly<Record<number, BoardGeo>>;

/** The geometry set G of TECH §2R.1 (+ WP-A's 6×5 | 2×7). */
const G: readonly BoardGeo[] = [
  geo(4, 4, 2, 5),
  geo(4, 4, 2, 6),
  geo(4, 5, 2, 5),
  geo(4, 5, 2, 7),
  geo(6, 5, 2, 6),
  geo(6, 5, 2, 7),
  geo(6, 8, 2, 8),
  geo(5, 7, 3, 7),
  geo(4, 6, 4, 6),
];
const label = (g: BoardGeo): string => `${g.wy}x${g.hy}|${g.ws}x${g.hs}`;

/** UX §5.8 example table (FIT, `boardBottomY` 1488, c = 120). */
const TABLE = [
  {
    name: 'B1, B2, B3, B5',
    g: LEVEL_SIZES[1],
    wall: 4,
    x: [780, 150, 630, 690],
    yardTop: 1008,
    boardTop: 888,
    craneTop: 648,
    air: 1,
    notch: 3,
    pano: 19,
    scene: 360,
  },
  {
    name: 'B4, B9',
    g: LEVEL_SIZES[4],
    wall: 4,
    x: [780, 150, 630, 690],
    yardTop: 1008,
    boardTop: 768,
    craneTop: 528,
    air: 2,
    notch: 4,
    pano: 16,
    scene: 240,
  },
  {
    name: 'B6',
    g: LEVEL_SIZES[6],
    wall: 7,
    x: [780, 150, 630, 690],
    yardTop: 888,
    boardTop: 648,
    craneTop: 408,
    air: 2,
    notch: 2,
    pano: 14,
    scene: 120,
  },
  {
    name: 'B7',
    g: LEVEL_SIZES[7],
    wall: 5,
    x: [780, 150, 630, 690],
    yardTop: 888,
    boardTop: 888,
    craneTop: 648,
    air: 0,
    notch: 2,
    pano: 19,
    scene: 360,
  },
  {
    name: 'B8',
    g: LEVEL_SIZES[8],
    wall: 5,
    x: [1020, 30, 750, 810],
    yardTop: 888,
    boardTop: 768,
    craneTop: 528,
    air: 1,
    notch: 3,
    pano: 16,
    scene: 240,
  },
  {
    name: 'B10',
    g: LEVEL_SIZES[10],
    wall: 6,
    x: [1020, 30, 750, 810],
    yardTop: 888,
    boardTop: 768,
    craneTop: 528,
    air: 1,
    notch: 2,
    pano: 16,
    scene: 240,
  },
  {
    name: 'default (Faz 3)',
    g: DEFAULT_GEO,
    wall: 8,
    x: [1020, 30, 750, 810],
    yardTop: 528,
    boardTop: 528,
    craneTop: 288,
    air: 0,
    notch: 2,
    pano: 12,
    scene: 0,
  },
] as const;

const panoStyle = {
  padPx: VIEW.panoramaPadPx,
  gapCells: VIEW.panoramaGapCells,
  maxCellPx: VIEW.panoramaMaxCellPx,
  minCellPx: VIEW.panoramaMinCellPx,
};

describe('UX 5.8 variable board layout (K-49, TECH 2R.1)', () => {
  for (const row of TABLE) {
    it(`UX 5.8 table ${row.name} (${label(row.g)} H${row.g.h}): x, y, yard air, notch, panorama cell, scene above`, () => {
      const L = createLayout(TOKENS, 1920, row.g);
      const g = L.grid;
      expect(g.cellPx).toBe(120);
      expect([L.board.board.w, g.yardX, g.wallX, g.buildX]).toEqual(row.x);
      expect([g.yardTopY, g.boardTopY, g.craneTopY]).toEqual([row.yardTop, row.boardTop, row.craneTop]);
      expect(L.board.yard).toEqual({ x: g.yardX, y: row.yardTop, w: row.g.wy * 120, h: row.g.hy * 120 });
      expect(L.board.yardAir.h / 120).toBe(row.air);
      expect(L.board.crane).toEqual({ x: g.yardX, y: row.craneTop, w: row.x[0], h: 240 });
      expect(row.g.h + 2 - row.wall).toBe(row.notch);
      expect(g.wallRect(row.wall).h).toBe(row.wall * 120);
      // panorama: one Ws-wide strip per segment, cell min(24, ⌊98 / Hs⌋) ≥ 12
      const seg = {
        rows: Array.from({ length: row.g.hs }, () => Array.from({ length: row.g.ws }, () => 'R')),
      };
      const pg = panoramaGeometry(L.top.panorama, [seg as never], panoStyle);
      expect(pg.cell).toBe(row.pano);
      expect(pg.colW).toBe(row.g.ws * row.pano);
      expect((8 - row.g.h) * 120).toBe(row.scene);
      expect(g.craneTopY - L.top.groupBottomY).toBeGreaterThanOrEqual(TOKENS.layout.board.minGapTopPx);
    });
  }

  it('UX 5.8 EXPAND moves every board y by (H − 1920) × 0,5: +208 at 390 × 844, +240 at 360 × 800', () => {
    for (const [vp, shift] of [
      [{ width: 390, height: 844 }, 208],
      [{ width: 360, height: 800 }, 240],
    ] as const) {
      const H = designHeight('expand', vp, TOKENS);
      for (const row of TABLE) {
        const g = createLayout(TOKENS, H, row.g).grid;
        // 390 × 844: H = 2337 → 208,5 (UX writes 208)
        expect(Math.abs(g.boardTopY - row.boardTop - shift), row.name).toBeLessThanOrEqual(0.5);
        expect(Math.abs(g.craneTopY - row.craneTop - shift), row.name).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it('UX 5.8 rule 5 the "Yapı tamam!" ribbon: max(306, 60 + Ws·c) wide over wall + site, in the middle of the board', () => {
    const def = createLayout(TOKENS, 1920).board.siteRibbon;
    expect([def.x, def.y, def.w, def.h]).toEqual([750, 960, 306, 96]); // the default board keeps the token rect
    const b1 = createLayout(TOKENS, 1920, LEVEL_SIZES[1] as BoardGeo);
    expect(b1.board.siteRibbon.w).toBe(306);
    expect(b1.board.siteRibbon.x).toBe(b1.grid.wallX);
    expect(b1.board.siteRibbon.y + 48).toBe(b1.grid.boardTopY + (5 * 120) / 2);
    const wide = createLayout(TOKENS, 1920, geo(4, 6, 4, 6));
    expect(wide.board.siteRibbon.w).toBe(60 + 4 * 120);
    expect(wide.board.siteRibbon.x).toBe(wide.grid.wallX);
  });
});

describe('UX 5.8 adaptive cell size (DL-2R-14, TECH 2R.1)', () => {
  it('UX 5.8 cell size B1–B10: 120 without layout.adaptive.cellMaxPx (R2-02 "hücre 120 px korunur")', () => {
    expect(TOKENS.layout.adaptive.cellMaxPx ?? null).toBeNull();
    for (const g of Object.values(LEVEL_SIZES)) expect(adaptiveCellPx(TOKENS, g), label(g)).toBe(120);
    expect(adaptiveCellPx(TOKENS, DEFAULT_GEO)).toBe(120);
  });

  it('UX 5.8 cell size B1–B10 with cellMaxPx 144: B1–B5, B7, B9 → 144; B6 → 132; B8, B10, default → 120', () => {
    const want: Readonly<Record<number, number>> = {
      1: 144,
      2: 144,
      3: 144,
      4: 144,
      5: 144,
      6: 132,
      7: 144,
      8: 120,
      9: 144,
      10: 120,
    };
    for (const [id, g] of Object.entries(LEVEL_SIZES))
      expect(adaptiveCellPx(T144, g), `B${id}`).toBe(want[Number(id)]);

    expect(adaptiveCellPx(T144, DEFAULT_GEO)).toBe(120);
    // TECH §2R.1 example: B1 boardW = 6 × 144 + 72 = 936, 72 px on both sides; k = 1,2 scales the wall and the slop
    const L = createLayout(T144, 1920, LEVEL_SIZES[1] as BoardGeo);
    expect(L.board.board.w).toBe(936);
    expect([L.grid.yardX, 1080 - rectRight(L.board.board)]).toEqual([72, 72]);
    expect(L.grid.k).toBeCloseTo(1.2, 9);
    expect(L.grid.wallW).toBeCloseTo(72, 9);
    expect(L.touch.hitSlopPx).toBeCloseTo(TOKENS.touch.hitSlopPx * 1.2, 9);
    for (const g of G) expect(adaptiveCellPx(T144, g) % ADAPTIVE_CELL_STEP_PX, label(g)).toBe(0);
  });

  it('UX 5.8 360 × 800: a B1 block cell is ≥ 48 CSS px with cellMaxPx 144 (40 CSS px at 120)', () => {
    const vp = { width: 360, height: 800 };
    const H = designHeight('expand', vp, TOKENS);
    const css = (t: Tokens): number =>
      (createLayout(t, H, LEVEL_SIZES[1] as BoardGeo).grid.cellPx * vp.width) / 1080;
    expect(css(T144)).toBeGreaterThanOrEqual(48);
    expect(css(TOKENS)).toBe(40);
  });
});

describe('UX 5.8 board fits FIT and EXPAND for every K-49 geometry', () => {
  const profiles: readonly [string, number][] = [
    ['FIT', 1920],
    ['390×844', designHeight('expand', { width: 390, height: 844 }, TOKENS)],
    ['360×800', designHeight('expand', { width: 360, height: 800 }, TOKENS)],
    ['tallest', TOKENS.meta.scale.expandMaxHeight],
  ];
  const check = (L: Layout, name: string): void => {
    const g = L.grid;
    const margin = TOKENS.layout.adaptive.minSideMarginPx;
    expect(g.yardX, name).toBeGreaterThanOrEqual(margin);
    expect(L.W - g.siteRight, name).toBeGreaterThanOrEqual(margin);
    expect(g.craneTopY - L.top.groupBottomY, name).toBeGreaterThanOrEqual(TOKENS.layout.board.minGapTopPx);
    expect(rectBottom(L.board.board), name).toBe(g.boardBottomY);
    expect(L.board.status.y, name).toBeGreaterThanOrEqual(g.boardBottomY);
    expect(rectBottom(L.board.status), name).toBeLessThanOrEqual(L.bottom.groupTopY);
    expect(L.board.crane.w, name).toBe(L.board.board.w);
    expect(L.board.status.x, name).toBe(g.yardX);
  };
  for (const g of G) {
    it(`UX 5.8 ${label(g)} H${g.h}: inside the side margins, under the HUD, above the status strip (c 120 and 144)`, () => {
      for (const [pname, H] of profiles) {
        check(createLayout(TOKENS, H, g), `${pname} c120`);
        check(createLayout(T144, H, g), `${pname} c${adaptiveCellPx(T144, g)}`);
      }
    });
  }
});

describe('K-49 hit test round trip on every geometry (TECH 10.3, UX 5.8)', () => {
  for (const g of G) {
    it(`K-49 ${label(g)}: cellAt(cellRect) is the cell; anchorXAt inverts pieceX; regions have no foreign cells`, () => {
      for (const t of [TOKENS, T144]) {
        const L = boardLayout(t, g, 1920).grid;
        for (let y = 0; y < g.rows; y++) {
          for (let x = 0; x < g.cols; x++) {
            const r = L.cellRect(x, y);
            expect(L.cellAt(r.x + r.w / 2, r.y + r.h / 2)).toEqual({ x, y });
            expect(L.cellAt(r.x, r.y)).toEqual({ x, y });
            expect(L.cellAt(r.x + r.w - 0.01, r.y + r.h - 0.01)).toEqual({ x, y });
          }
        }
        expect(L.cellAt(L.wallX + L.wallW / 2, L.rowTop(0) + 1)).toBeNull();
        expect(L.cellAt(L.yardX - 1, L.rowTop(0) + 1)).toBeNull();
        expect(L.cellAt(L.siteRight + 1, L.rowTop(0) + 1)).toBeNull();
        expect(L.cellAt(L.yardX + 1, L.craneTopY - 1)).toBeNull();
        for (const w of [1, 2, 3]) {
          for (let ax = 0; ax <= g.cols - w; ax += 0.25) {
            expect(L.anchorXAt(L.pieceX(ax, w), w)).toBeCloseTo(ax, 9);
          }
        }
        expect(L.anchorYAt(L.pieceY(2.5, 2), 2)).toBeCloseTo(2.5, 9);
      }
    });
  }

  it('K-49 a block on a 4×4 | 2×5 and a 6×5 | 2×7 board is picked at every cell centre (hitTest on s.lvl.geo)', () => {
    for (const [g, pieces] of [
      [
        geo(4, 4, 2, 5),
        [
          ['O4_0', 'R', 0, 0],
          ['D2_0', 'Y', 3, 0],
        ],
      ],
      [
        geo(6, 5, 2, 7),
        [
          ['O4_0', 'R', 4, 3],
          ['I3_0', 'Y', 5, 0],
        ],
      ],
    ] as const) {
      const s = initialState({
        yard: { cols: g.wy, rows: g.hy },
        site: { cols: g.ws, rows: g.hs },
        wall: { height: g.h },
        plan: Array.from({ length: g.hs }, () => 'R'.repeat(g.ws)),
        pieces: pieces.map((p) => [...p] as never),
      });
      expect(s.lvl.geo.h).toBe(g.h);
      const L = createLayout(TOKENS, 1920, s.lvl.geo);
      for (let id = 0; id < s.lvl.layout.counts.pieces; id++) {
        if (pieceZone(s, id) !== Zone.yard) continue;
        for (const c of pieceBoardCells(s, id)) {
          const r = L.grid.cellRect(c.x, c.y);
          expect(pieceAtPoint(s, L.grid, r.x + r.w / 2, r.y + r.h / 2, L.touch.hitSlopPx), label(g)).toBe(id);
        }
      }
    }
  });
});
