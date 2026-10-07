/**
 * K-49 variable board size (docs/GDD.md K-49, §0, K-01…K-05, K-07, K-08, K-17, K-25, K-44; docs/TECH_DESIGN.md §2R.1,
 * WP-A). The geometry set G of TECH §2R.1 (the five sizes of Bölüm 1–10, the default board, an S9 3-wide site and a
 * 4-wide site) plus 6×5 | 2×7 from the WP-A brief runs the parametric invariants: regions, boundary masks, no overlap, conserved cells, encode/decode,
 * replay = live session, ASCII round trip and the edge model ≡ cell-by-cell model. Then the Faz 2R examples E-56, E-57
 * and the Ağır Yük (cargo) drag rule with its `blockedCargo` signal.
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GEO,
  MAX_COLS,
  MAX_ROWS,
  MAX_SEGMENTS,
  geoFromLevel,
  geoLabel,
  hasDefaultBoard,
  makeGeo,
} from '../../src/core/geometry.ts';
import type { BoardGeo } from '../../src/core/geometry.ts';
import {
  closedBoundaryMask,
  inGrid,
  isCraneCell,
  isSiteAir,
  isSiteCell,
  isYardAir,
  isYardCell,
  neighbors4,
  onBoard,
  openFreeMask,
  sideOf,
  straddlesBoundary,
} from '../../src/core/coords.ts';
import { FREE, isCargoShape, tryBeginDrag } from '../../src/core/movement.ts';
import type { DragSession, DropClass } from '../../src/core/movement.ts';
import { ArraySink, applyMove, eventLogHash } from '../../src/core/moves.ts';
import { GameSession } from '../../src/core/session.ts';
import { occupyPiece, stateInvariantErrors } from '../../src/core/grid.ts';
import { deliverQueue, deliveryLanding } from '../../src/core/delivery.ts';
import { dropIntoYard, movePiece, returnTarget, yardDropRow } from '../../src/core/placement.ts';
import { POS_QUEUE, POS_SITE, hashHex, piecePosition } from '../../src/core/hash.ts';
import { AIR_CHAR, fromAscii, parseAscii, toAscii } from '../../src/core/ascii.ts';
import {
  H,
  PF,
  SITE_TROWEL,
  computeLayout,
  createInitialState,
  decodeState,
  encodeState,
  hasFlag,
  hdr,
  pieceShape,
  pieceX,
  pieceY,
  pieceZone,
  setHdr,
  setPieceField,
  setFlag,
  setSiteOcc,
  setYardOcc,
  siteOcc,
  yardOcc,
} from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import { compile } from '../../src/core/level/compile.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import type { LevelData, LevelInput } from '../../src/core/level/schema.ts';
import { SHAPES, shapeById, shapeByIndex } from '../../src/core/shapes.ts';
import type { ShapeDef } from '../../src/core/shapes.ts';
import { mulberry32 } from '../../src/core/rng.ts';
import type { Rng } from '../../src/core/rng.ts';
import { Zone } from '../../src/core/types.ts';
import type { ColorCode, DragNode, ShapeId } from '../../src/core/types.ts';
import { initialState, level } from '../fixtures/builders.ts';
import type { LevelSpec, PieceSpec } from '../fixtures/builders.ts';

// --- the geometry set G (TECH §2R.1) -------------------------------------------------------------------------------------

interface GeoCase {
  readonly wy: number;
  readonly hy: number;
  readonly ws: number;
  readonly hs: number;
}

const G: readonly GeoCase[] = [
  { wy: 4, hy: 4, ws: 2, hs: 5 },
  { wy: 4, hy: 4, ws: 2, hs: 6 },
  { wy: 4, hy: 5, ws: 2, hs: 5 },
  { wy: 4, hy: 5, ws: 2, hs: 7 },
  { wy: 6, hy: 5, ws: 2, hs: 6 },
  { wy: 6, hy: 5, ws: 2, hs: 7 }, // WP-A brief: 6×5 | 2×7 (H 7, yard air y 5–6 over a full-width yard)
  { wy: 6, hy: 8, ws: 2, hs: 8 },
  { wy: 5, hy: 7, ws: 3, hs: 7 },
  { wy: 4, hy: 6, ws: 4, hs: 6 },
];

const label = (g: GeoCase): string => `${g.wy}x${g.hy}|${g.ws}x${g.hs}`;
const geoOf = (g: GeoCase, eMax = 0): BoardGeo => makeGeo({ ...g, eMax });
const sizes = (g: GeoCase): Pick<LevelSpec, 'yard' | 'site'> => ({
  yard: { cols: g.wy, rows: g.hy },
  site: { cols: g.ws, rows: g.hs },
});

const F = (ix: number, iy: number): DragNode => ({ ix, iy, mode: FREE });
const key = (n: DragNode): string => `${n.mode}:${n.ix},${n.iy}`;
const CANONICAL = SHAPES.filter((s) => s.index === s.canonicalIndex);

function grab(s: GameState, id: number): DragSession {
  const a = tryBeginDrag(s, id);
  if (!a.ok) throw new Error(`piece ${id} is not pickable: ${a.reason}`);
  return a.session;
}

function cellsOf(shape: ShapeDef, n: { ix: number; iy: number }): [number, number][] {
  return shape.cells.map((c) => [n.ix + c.x, n.iy + c.y]);
}

/** One plan of `hs` rows × `ws` colours (top → bottom). */
function planRows(g: GeoCase, rng: Rng): string[] {
  const colors: ColorCode[] = ['W', 'Y'];
  return Array.from({ length: g.hs }, () =>
    Array.from({ length: g.ws }, () => colors[rng.nextInt(2)] ?? 'W').join(''),
  );
}

/** Random non-overlapping yard pieces (B1, D2, O4, C3) filling about `fill` of the Wy × Hy yard. */
function yardPieces(g: GeoCase, rng: Rng, fill: number): PieceSpec[] {
  const used = new Set<string>();
  const out: PieceSpec[] = [];
  const shapes: ShapeId[] = ['B1_0', 'D2_0', 'D2_90', 'O4_0', 'C3_0', 'C3_180'];
  for (let tries = 0; tries < 400 && used.size < fill * g.wy * g.hy; tries++) {
    const shape = shapeById(shapes[rng.nextInt(shapes.length)] ?? 'B1_0');
    if (shape.w > g.wy || shape.h > g.hy) continue;
    const x = rng.nextInt(g.wy - shape.w + 1);
    const y = rng.nextInt(g.hy - shape.h + 1);
    const cells = cellsOf(shape, { ix: x, iy: y }).map(([cx, cy]) => `${cx},${cy}`);
    if (cells.some((c) => used.has(c))) continue;
    cells.forEach((c) => used.add(c));
    out.push([shape.id, rng.next() < 0.5 ? 'W' : 'Y', x, y]);
  }
  return out;
}

/** A random schema-valid level of geometry `g` (one segment, an optional static gap, yard gravity on or off). */
function randomLevel(g: GeoCase, rng: Rng, id: number): CompiledLevel {
  const h = Math.max(g.hy, g.hs);
  const height = rng.nextInt(h + 1);
  const gaps: LevelInput['wall']['gaps'] =
    height >= 3 && rng.next() < 0.5
      ? [{ type: 'static', y: rng.nextInt(height - 2), size: 1 + rng.nextInt(2) }]
      : [];
  const gap = gaps[0];
  if (gap && gap.y + gap.size > height - 1) gaps.length = 0;
  return compile(
    level({
      id,
      moves: 60,
      ...sizes(g),
      plan: planRows(g, rng),
      pieces: yardPieces(g, rng, 0.55 + rng.next() * 0.3),
      wall: { height, gaps },
      gravity: { yard: rng.next() < 0.5 },
    }),
  );
}

/** Σ cells of the pieces that are still in play (yard, site, queue, pending). */
function cellsInPlay(s: GameState): number {
  let n = 0;
  for (let id = 0; id < s.lvl.layout.counts.pieces; id++) {
    const z = pieceZone(s, id);
    if (z === Zone.yard || z === Zone.site || z === Zone.queue || z === Zone.pending)
      n += shapeByIndex(pieceShape(s, id)).cellCount;
  }
  return n;
}

// --- geometry.ts ---------------------------------------------------------------------------------------------------------

describe('K-49 board geometry (core/geometry.ts)', () => {
  it('K-49 DEFAULT_GEO is the pre-2R board: yard 6 × 8, site 2 × 8, H 8, crane rows 8–9, boundary 5 | 6', () => {
    const g = DEFAULT_GEO;
    expect([g.wy, g.hy, g.ws, g.hs, g.eMax, g.h, g.rows, g.cols]).toEqual([6, 8, 2, 8, 0, 8, 10, 8]);
    expect([g.siteX, g.boundaryX, g.craneRow, g.segCells]).toEqual([6, 5, 8, 16]);
    expect([g.yardBits, g.siteBits, g.rowMaskAll]).toEqual([0b00111111, 0b11000000, 0b1111111111]);
    expect([MAX_COLS, MAX_ROWS]).toEqual([8, 10]);
    expect(Object.isFrozen(g)).toBe(true);
    expect(hasDefaultBoard(g)).toBe(true);
    expect(geoLabel(g)).toBe('6x8|2x8 H8');
  });

  it('K-49 H = max(Hy, Hs + eMax): Bölüm 1 4×4 | 2×5 → H 5, crane y 5–6; Bölüm 4 4×4 | 2×6 → H 6, boundary 3 | 4, site x 4–5, yard air y 4–5', () => {
    const b1 = makeGeo({ wy: 4, hy: 4, ws: 2, hs: 5, eMax: 0 });
    expect([b1.h, b1.rows, b1.craneRow, b1.cols]).toEqual([5, 7, 5, 6]);
    const b4 = makeGeo({ wy: 4, hy: 4, ws: 2, hs: 6, eMax: 0 });
    expect([b4.h, b4.craneRow, b4.boundaryX, b4.siteX]).toEqual([6, 6, 3, 4]);
    expect([4, 5].map((y) => isYardAir(b4, 0, y))).toEqual([true, true]);
    expect([isYardAir(b4, 0, 3), isYardAir(b4, 0, 6), isYardAir(b4, 4, 4)]).toEqual([false, false, false]);
    expect([isSiteCell(b4, 4, 0), isSiteCell(b4, 5, 5), isSiteCell(b4, 6, 0)]).toEqual([true, true, false]);
    expect([isCraneCell(b4, 0, 6), isCraneCell(b4, 5, 7), isCraneCell(b4, 0, 8)]).toEqual([
      true,
      true,
      false,
    ]);
    // the elevator range top raises H (K-24): Hs 5 + b 2 = 7 > Hy 4
    expect(makeGeo({ wy: 4, hy: 4, ws: 2, hs: 5, eMax: 2 }).h).toBe(7);
    expect(makeGeo({ wy: 4, hy: 8, ws: 2, hs: 5, eMax: 2 }).h).toBe(8);
  });

  it('K-49 makeGeo rejects boards outside the 8 × 10 frame (Wy + Ws ≤ 8, Ws ≤ 4, Hy and Hs ≤ 8, positive sizes)', () => {
    const bad: Parameters<typeof makeGeo>[0][] = [
      { wy: 6, hy: 8, ws: 3, hs: 8, eMax: 0 }, // board_too_wide
      { wy: 3, hy: 8, ws: 5, hs: 8, eMax: 0 },
      { wy: 4, hy: 9, ws: 2, hs: 8, eMax: 0 },
      { wy: 4, hy: 8, ws: 2, hs: 9, eMax: 0 },
      { wy: 0, hy: 4, ws: 2, hs: 4, eMax: 0 },
      { wy: 4, hy: 4, ws: 0, hs: 4, eMax: 0 },
      { wy: 4.5, hy: 4, ws: 2, hs: 4, eMax: 0 },
    ];
    for (const p of bad) expect(() => makeGeo(p), JSON.stringify(p)).toThrow(RangeError);
    expect(() => makeGeo({ wy: 4, hy: 4, ws: 4, hs: 8, eMax: 0 })).not.toThrow();
  });

  it('K-49 geoFromLevel reads yard.cols/rows, site.cols/rows and the elevator top b; missing fields → 6, 8, 2, 8', () => {
    const one: PieceSpec[] = [['B1_0', 'W', 0, 0]];
    expect(geoFromLevel(level({ pieces: one }))).toBe(DEFAULT_GEO);
    const sized = geoFromLevel(
      level({ ...sizes({ wy: 4, hy: 5, ws: 2, hs: 7 }), plan: ['WW'], pieces: one }),
    );
    expect([sized.wy, sized.hy, sized.ws, sized.hs, sized.h]).toEqual([4, 5, 2, 7, 7]);
    const el = geoFromLevel(
      level({
        ...sizes({ wy: 4, hy: 4, ws: 2, hs: 5 }),
        plan: ['WW'],
        pieces: one,
        elevator: { range: [0, 2], start: 0, dir: 1 },
      }),
    );
    expect([el.eMax, el.h, el.rows]).toEqual([2, 7, 9]);
  });

  it('K-49 pre-2R data: an elevator over the default 8-row site keeps H at 8 (the frame clamps; plan rows above H do not exist)', () => {
    const g = geoFromLevel(
      level({
        plan: ['WW', 'YY'],
        pieces: [['B1_0', 'W', 0, 0]],
        elevator: { range: [0, 2], start: 0, dir: 1 },
      }),
    );
    expect([g.wy, g.hy, g.ws, g.hs, g.eMax, g.h, g.rows]).toEqual([6, 8, 2, 8, 2, 8, 10]);
    expect(hasDefaultBoard(g)).toBe(true);
  });
});

// --- regions and boundary masks -----------------------------------------------------------------------------------------

describe('K-49 regions and the wall boundary in every geometry of G', () => {
  it('K-01 K-02 K-03 K-05 K-49 yard, yard air, site columns and the crane area partition the board + crane frame; site air needs y ≥ Hs + e', () => {
    for (const c of G) {
      const g = geoOf(c);
      for (let y = -1; y <= MAX_ROWS; y++) {
        for (let x = -1; x <= MAX_COLS; x++) {
          const where = `${label(c)} (${x},${y})`;
          const inside = x >= 0 && x < c.wy + c.ws && y >= 0 && y < g.h + 2;
          expect(inGrid(g, x, y), where).toBe(inside);
          expect(onBoard(g, x, y), where).toBe(inside && y < g.h);
          const parts = [isYardCell(g, x, y), isYardAir(g, x, y), isSiteCell(g, x, y), isCraneCell(g, x, y)];
          expect(parts.filter(Boolean).length, where).toBe(inside ? 1 : 0);
          expect(isYardCell(g, x, y), where).toBe(x >= 0 && x < c.wy && y >= 0 && y < c.hy);
          expect(isSiteAir(g, x, y), where).toBe(isSiteCell(g, x, y) && y >= c.hs);
          if (inside) expect(sideOf(g, x), where).toBe(x <= c.wy - 1 ? 'yard' : 'site');
        }
      }
      // the elevator offset e lifts the plan: site air starts at Hs + e
      const e = g.h - c.hs;
      if (e > 0) expect(isSiteAir(g, g.siteX, c.hs, e), label(c)).toBe(false);
    }
  });

  it('E-46 K-49 the boundary x = Wy−1 | Wy never joins two neighbours, whatever the geometry', () => {
    for (const c of G) {
      const g = geoOf(c);
      for (let y = 0; y < g.h; y++) {
        for (let x = 0; x < g.cols; x++) {
          for (const n of neighbors4(g, x, y)) {
            expect(sideOf(g, n.ix), `${label(c)} (${x},${y}) → (${n.ix},${n.iy})`).toBe(sideOf(g, x));
            expect(Math.abs(n.ix - x) + Math.abs(n.iy - y)).toBe(1);
          }
        }
        if (y < c.hy) expect(neighbors4(g, g.boundaryX, y).some((n) => n.ix === g.siteX)).toBe(false);
        expect(neighbors4(g, g.siteX, y).some((n) => n.ix === g.boundaryX)).toBe(false);
      }
      // yard cells see yard cells only (no yard air), site cells see board cells of the site columns
      expect(neighbors4(g, 0, c.hy - 1).some((n) => n.iy >= c.hy)).toBe(false);
      expect(neighbors4(g, 0, g.craneRow)).toEqual([]);
    }
  });

  it('K-04 K-05 K-49 closed rows y < height (no open gap), FREE crossing rows y ≥ height up to H + 1; a box straddles iff it has columns on both sides', () => {
    for (const c of G) {
      const g = geoOf(c);
      const rowsOf = (mask: number): number[] => [...Array(MAX_ROWS).keys()].filter((y) => (mask >> y) & 1);
      for (let height = 0; height <= g.h; height++) {
        expect(rowsOf(openFreeMask(g, height)), `${label(c)} height ${height}`).toEqual(
          [...Array(g.rows - height).keys()].map((i) => height + i),
        );
        expect(rowsOf(closedBoundaryMask(g, height, 0))).toEqual([...Array(height).keys()]);
      }
      for (let ix = 0; ix < g.cols; ix++)
        for (let w = 1; ix + w <= g.cols; w++)
          expect(straddlesBoundary(g, ix, w)).toBe(ix <= g.boundaryX && ix + w - 1 >= g.siteX);
    }
  });
});

// --- state, compile, hash, ASCII ----------------------------------------------------------------------------------------

describe('K-49 state arrays, compile, hash and ASCII follow the geometry', () => {
  it('K-49 compile stores CompiledLevel.geo; layout = yardOcc wy × rows, siteOcc S × ws × hs, filled/wrongOcc S × ws; plan index sy·ws + sx', () => {
    const lvl = compile(
      level({
        ...sizes({ wy: 5, hy: 7, ws: 3, hs: 7 }),
        plan: [
          ['WWW', 'WWW', 'WWW', 'WWW', 'WWW', 'YYY', 'GWY'],
          ['WWW', 'WWW', 'WWW', 'WWW', 'WWW', 'WWW', 'WWW'],
        ],
        pieces: [['B1_0', 'W', 0, 0]],
      }),
    );
    expect(lvl.geo).toEqual(makeGeo({ wy: 5, hy: 7, ws: 3, hs: 7, eMax: 0 }));
    const L = lvl.layout;
    expect(L.siteOcc - L.yardOcc).toBe(5 * 9);
    expect(L.filled - L.siteOcc).toBe(2 * 3 * 7);
    expect(L.wrongOcc - L.filled).toBe(2 * 3);
    expect(L.pieces - L.wrongOcc).toBe(2 * 3);
    const seg0 = lvl.segments[0];
    // bottom row "GWY": sx 0 G, 1 W, 2 Y; row 1 "YYY"
    expect([...(seg0?.planColors.slice(0, 6) ?? [])]).toEqual([2, 0, 1, 1, 1, 1]);
    expect(seg0?.planColors.length).toBe(21);
    expect(seg0?.planMask).toEqual([0b1111111, 0b1111111, 0b1111111]);
    // the truck y is written as Hy and ignored (K-25); the help slots wait above the wall top
    expect(computeLayout(L.counts, lvl.geo)).toEqual(L);
  });

  it('K-49 the default board keeps the pre-2R buffer layout word for word (yardOcc 6 × 10, siteOcc S × 16, filled S × 2)', () => {
    const lvl = compile(level({ plan: [['WW'], ['YY']], pieces: [['B1_0', 'W', 0, 0]] }));
    const L = lvl.layout;
    expect([L.yardOcc, L.siteOcc, L.filled, L.wrongOcc, L.pieces]).toEqual([18, 78, 110, 114, 118]);
  });

  it('K-49 Zobrist positions stay in the 8 × 10 frame for every geometry: yard y·8 + x, site 80 + seg·32 + sy·4 + sx, queue from 240', () => {
    expect([POS_SITE, POS_QUEUE]).toEqual([80, 240]);
    for (const c of G) {
      const g = geoOf(c);
      const seen = new Set<number>();
      for (let y = 0; y < c.hy; y++)
        for (let x = 0; x < c.wy; x++) seen.add(piecePosition(g.siteX, Zone.yard, x, y, -1));
      for (let seg = 0; seg < MAX_SEGMENTS; seg++)
        for (let sy = 0; sy < c.hs; sy++)
          for (let sx = 0; sx < c.ws; sx++) {
            const p = piecePosition(g.siteX, Zone.site, g.siteX + sx, sy, seg);
            expect(p, label(c)).toBeGreaterThanOrEqual(POS_SITE);
            expect(p, label(c)).toBeLessThan(POS_QUEUE);
            seen.add(p);
          }
      expect(seen.size, label(c)).toBe(c.wy * c.hy + MAX_SEGMENTS * c.ws * c.hs);
    }
    expect(piecePosition(6, Zone.site, 7, 3, 1)).toBe(80 + 32 + 12 + 1);
  });

  it('K-49 ASCII: a non-default board prints `size Wy×Hy|Ws×Hs H`, rows H + 1 … 0 and `·` for yard and site air; ids text round-trips in every geometry', () => {
    const s = initialState({
      id: 1,
      ...sizes({ wy: 4, hy: 4, ws: 2, hs: 5 }),
      wall: { height: 3 },
      plan: ['WW', 'YY', 'WW', 'YW', 'YW'],
      pieces: [
        ['D2_0', 'Y', 0, 2],
        ['O4_0', 'W', 2, 0],
      ],
    });
    expect(toAscii(s).split('\n')).toEqual([
      'L1 turn 0 moves 20 seg 1/1 elev 0',
      'size 4x4|2x5 H5',
      ' y  0 1 2 3 | W | 4 5',
      ' 6  . . . . | : | . .',
      ' 5  . . . . | : | . .',
      ` 4  ${AIR_CHAR} ${AIR_CHAR} ${AIR_CHAR} ${AIR_CHAR} | : | . .`,
      ' 3  y . . . | : | . .',
      ' 2  y . . . | # | . .',
      ' 1  . . w w | # | . .',
      ' 0  . . w w | # | . .',
      'plan seg0 (top→bottom): WW YY WW YW YW',
    ]);
    expect(parseAscii(toAscii(s)).size).toEqual({ wy: 4, hy: 4, ws: 2, hs: 5, h: 5 });
    // the default board: no size line (pre-2R fixtures read unchanged)
    expect(toAscii(initialState({ pieces: [['B1_0', 'W', 0, 0]] })).split('\n')[1]).toBe(
      ' y  0 1 2 3 4 5 | W | 6 7',
    );

    const rng = mulberry32(49_2026);
    for (const c of G) {
      const lvl = randomLevel(c, rng, 3);
      const t = createInitialState(lvl);
      const text = toAscii(t, { ids: true });
      expect(text.split('\n')[1]?.startsWith('size ') ?? false, label(c)).toBe(!hasDefaultBoard(lvl.geo));
      expect(Array.from(fromAscii(lvl, text).buf), label(c)).toEqual(Array.from(t.buf));
      if (!hasDefaultBoard(lvl.geo))
        expect(
          () => fromAscii(compile(level({ id: 3, plan: ['WW'], pieces: [['B1_0', 'W', 0, 0]] })), text),
          label(c),
        ).toThrow(/board/);
    }
  });

  it('K-49 site air prints `·` above Hs + e; the platform `_` below e (elevator, 4×4 | 2×5, b = 2 → H 7)', () => {
    const s = initialState({
      id: 6,
      ...sizes({ wy: 4, hy: 4, ws: 2, hs: 5 }),
      plan: ['WW', 'YY', 'WW', 'YW', 'YW'],
      elevator: { range: [0, 2], start: 1, dir: 1 },
      pieces: [['B1_0', 'W', 0, 0]],
    });
    const rows = toAscii(s).split('\n');
    expect(rows[1]).toBe('size 4x4|2x5 H7');
    const site = (y: number): string => rows.find((r) => r.startsWith(` ${y}  `))?.slice(-3) ?? '';
    expect([site(0), site(1), site(5), site(6), site(7), site(8)]).toEqual([
      '_ _',
      '. .',
      '. .',
      `${AIR_CHAR} ${AIR_CHAR}`,
      '. .',
      '. .',
    ]);
  });
});

// --- invariants under random play -------------------------------------------------------------------------------------

describe('K-49 invariants under random play in every geometry of G', () => {
  it('K-49 no overlap, cells conserved, encode/decode round trip, hash of the copy, replay = live session (9 geometries × 6 levels × up to 40 moves)', () => {
    const rng = mulberry32(20261007);
    let moves = 0;
    let wrong = 0;
    for (const c of G) {
      for (let n = 0; n < 6; n++) {
        const lvl = randomLevel(c, rng, 2);
        const sink = new ArraySink();
        const live = GameSession.start(lvl, {}, {}, sink);
        const applied = [...sink.events]; // events of the start action and of every applied move
        const total = cellsInPlay(live.state);
        for (let step = 0; step < 40 && live.outcome === 'playing'; step++) {
          const s = live.state;
          const pickable: number[] = [];
          for (let id = 0; id < lvl.layout.counts.pieces; id++) if (tryBeginDrag(s, id).ok) pickable.push(id);
          if (pickable.length === 0) break;
          const id = pickable[rng.nextInt(pickable.length)] ?? 0;
          const d = grab(s, id);
          const targets = d.reachableNodes().filter((t) => !d.startNodes.some((st) => key(st) === key(t)));
          const to = targets[rng.nextInt(targets.length)] ?? d.start;
          sink.clear();
          const res = live.commit({ kind: 'drag', pieceId: id, to }, sink);
          if (res.status === 'applied') {
            moves++;
            applied.push(...sink.events); // cancelled releases are not logged (K-07): their events never replay
          }
          if (sink.events.some((e) => e.t === 'pieceBounced')) wrong++;
          const where = `${label(c)} level ${n} step ${step}`;
          expect(stateInvariantErrors(s), where).toEqual([]);
          expect(cellsInPlay(s), where).toBe(total);
          const copy = decodeState(lvl, encodeState(s));
          expect(Array.from(copy.buf), where).toEqual(Array.from(s.buf));
          expect(hashHex(copy), where).toBe(hashHex(s));
          for (let id2 = 0; id2 < lvl.layout.counts.pieces; id2++) {
            if (pieceZone(s, id2) !== Zone.yard) continue;
            for (const [x, y] of cellsOf(shapeByIndex(pieceShape(s, id2)), {
              ix: pieceX(s, id2),
              iy: pieceY(s, id2),
            }))
              expect(isYardCell(lvl.geo, x, y), `${where} piece ${id2}`).toBe(true);
          }
        }
        const replaySink = new ArraySink();
        const replayed = GameSession.replay(lvl, live.log, {}, replaySink);
        expect(Array.from(replayed.state.buf), label(c)).toEqual(Array.from(live.state.buf));
        expect(eventLogHash(replaySink.events)).toBe(eventLogHash(applied));
      }
    }
    expect(moves).toBeGreaterThan(600);
    expect(wrong).toBeGreaterThan(20);
  });
});

// --- edge model ≡ cell-by-cell model, every geometry --------------------------------------------------------------------

interface ModelGap {
  readonly lo: number;
  readonly hi: number;
  readonly open: boolean;
}
interface Model {
  readonly g: BoardGeo;
  readonly shape: ShapeDef;
  readonly height: number;
  readonly gaps: readonly ModelGap[];
  readonly blocked: (x: number, y: number) => boolean;
  readonly starts: Set<string>;
}

const R = (gap: number, ix: number, iy: number): DragNode => ({ ix, iy, mode: gap + 1 });

/** Literal GDD K-04, K-05, K-08 (Faz 2R cargo), K-11, K-12, K-13 node rules over explicit cells, any geometry. */
function modelValid(m: Model, n: DragNode): boolean {
  if (m.starts.has(key(n))) return true;
  const { g } = m;
  const cells = cellsOf(m.shape, n);
  for (const [x, y] of cells) {
    if (x < 0 || x >= g.wy + g.ws || y < 0 || y >= g.h + 2) return false;
    if (isCargoShape(m.shape) && (x > g.wy - 1 || y > g.hy - 1)) return false;
    if (m.blocked(x, y)) return false;
  }
  const site = cells.filter(([x]) => x >= g.wy);
  if (n.mode === FREE) {
    for (let y = 0; y < g.h + 2; y++) {
      const row = cells.filter((c) => c[1] === y);
      if (row.some((c) => c[0] <= g.wy - 1) && row.some((c) => c[0] >= g.wy) && y < m.height) return false;
    }
    for (let col = g.wy; col < g.wy + g.ws; col++) {
      const ys = site.filter((c) => c[0] === col).map((c) => c[1]);
      if (ys.length === 0) continue;
      for (let y = Math.min(...ys); y < g.h + 2; y++) if (m.blocked(col, y)) return false;
    }
    return true;
  }
  const gap = m.gaps[n.mode - 1];
  if (!gap || !gap.open || site.length === 0) return false;
  return cells.every(([, y]) => y >= gap.lo && y < gap.hi);
}

function modelRowOpen(m: Model, y: number, mode: number): boolean {
  if (mode === FREE) return y >= m.height;
  const gap = m.gaps[mode - 1];
  return gap !== undefined && gap.open && y >= gap.lo && y < gap.hi;
}

function modelStep(m: Model, from: DragNode, to: DragNode): boolean {
  if (from.iy !== to.iy) return true;
  const dx = to.ix - from.ix;
  const mode = from.mode !== FREE ? from.mode : to.mode;
  const last = m.g.wy - 1;
  for (const [x, y] of cellsOf(m.shape, from)) {
    if (x <= last !== x + dx <= last && !modelRowOpen(m, y, mode)) return false;
  }
  return true;
}

function modelNeighbours(m: Model, n: DragNode): DragNode[] {
  const out: DragNode[] = [];
  const add = (t: DragNode): void => {
    if (modelValid(m, t) && modelStep(m, n, t)) out.push(t);
  };
  const fullyYard = (ix: number): boolean => ix + m.shape.w - 1 <= m.g.wy - 1;
  if (n.mode === FREE) {
    add(F(n.ix - 1, n.iy));
    add(F(n.ix + 1, n.iy));
    if (fullyYard(n.ix)) m.gaps.forEach((_, gi) => add(R(gi, n.ix + 1, n.iy)));
    add(F(n.ix, n.iy - 1));
    add(F(n.ix, n.iy + 1));
  } else {
    add(fullyYard(n.ix - 1) ? F(n.ix - 1, n.iy) : { ix: n.ix - 1, iy: n.iy, mode: n.mode });
    add({ ix: n.ix + 1, iy: n.iy, mode: n.mode });
  }
  return out;
}

function modelBfs(m: Model, starts: readonly DragNode[]): Map<string, number> {
  const dist = new Map<string, number>();
  const queue: DragNode[] = [];
  for (const st of starts) {
    dist.set(key(st), 0);
    queue.push(st);
  }
  for (let i = 0; i < queue.length; i++) {
    const u = queue[i] as DragNode;
    const du = dist.get(key(u)) ?? 0;
    for (const v of modelNeighbours(m, u)) {
      if (dist.has(key(v))) continue;
      dist.set(key(v), du + 1);
      queue.push(v);
    }
  }
  return dist;
}

/** Literal GDD K-07 table (Faz 2R: row 3 = all cells x ≤ Wy − 1 and one cell y ≥ Hy). */
function modelClassify(m: Model, starts: readonly DragNode[], n: DragNode): string {
  const cells = cellsOf(m.shape, n);
  if (starts.some((st) => key(st) === key(n))) return 'sameSpot';
  const yardSide = cells.every(([x]) => x <= m.g.wy - 1);
  const siteSide = cells.every(([x]) => x >= m.g.wy);
  if (n.mode === FREE && yardSide) return cells.every(([, y]) => y <= m.g.hy - 1) ? 'yard' : 'craneOverYard';
  if (!yardSide && !siteSide) return 'straddle';
  return n.mode === FREE ? 'siteFree' : 'siteRail';
}

const dropName = (d: DropClass): string => (d.kind === 'cancel' ? d.reason : d.kind);

describe('K-49 edge model ≡ cell-by-cell model in every geometry of G', () => {
  it('K-04 K-05 K-07 K-08 K-11 K-12 K-13 K-44 K-49 R, BFS distances, edges and release classes equal the cell model (9 geometries × 90 boards)', () => {
    const rng = mulberry32(49_49);
    let compared = 0;
    for (const c of G) {
      for (let trial = 0; trial < 90; trial++) {
        const h = Math.max(c.hy, c.hs);
        const height = rng.nextInt(h + 1);
        const gaps: LevelInput['wall']['gaps'] = [];
        if (height >= 2) {
          const y = rng.nextInt(height - 1);
          const size = 1 + rng.nextInt(Math.min(2, height - 1 - y));
          gaps.push(
            rng.next() < 0.75 ? { type: 'static', y, size } : { type: 'locked', y, size, keyId: 'k' },
          );
        }
        const lvl = compile(
          level({
            id: 9,
            ...sizes(c),
            plan: planRows(c, rng),
            wall: { height, gaps },
            pieces: [['B1_0', 'W', 0, 0]],
            debris: [['B1_0', 'W', c.wy, 0]],
          }),
        );
        const g = lvl.geo;
        const s = createInitialState(lvl);
        s.buf.fill(0, lvl.layout.yardOcc, lvl.layout.pieces);
        const elev = g.h > c.hs && rng.next() < 0.4 ? 1 + rng.nextInt(g.h - c.hs) : 0;
        setHdr(s, H.elev, elev);
        const onSite = rng.next() < 0.3;
        const id = onSite ? 1 : 0;
        setPieceField(s, 1 - id, PF.zone, Zone.gone);
        const pool = onSite
          ? CANONICAL.filter((sh) => sh.w <= c.ws && !isCargoShape(sh) && sh.h <= c.hs)
          : CANONICAL.filter((sh) => sh.w <= c.wy && sh.h <= c.hy);
        const shape = pool[rng.nextInt(pool.length)] as ShapeDef;
        setPieceField(s, id, PF.shape, shape.index);
        if (onSite) {
          setPieceField(s, id, PF.zone, Zone.site);
          setPieceField(s, id, PF.x, g.siteX + rng.nextInt(c.ws - shape.w + 1));
          setPieceField(s, id, PF.y, rng.nextInt(c.hs - shape.h + 1));
          setPieceField(s, id, PF.seg, 0);
          if (rng.next() < 0.3) setFlag(s, id, 'debris', false);
        } else {
          setPieceField(s, id, PF.zone, Zone.yard);
          setPieceField(s, id, PF.x, rng.nextInt(c.wy - shape.w + 1));
          setPieceField(s, id, PF.y, rng.nextInt(c.hy - shape.h + 1));
        }
        occupyPiece(s, id);
        const yardDensity = rng.next() * 0.8;
        const siteDensity = rng.next() * 0.5;
        for (let y = 0; y < c.hy; y++)
          for (let x = 0; x < c.wy; x++)
            if (yardOcc(s, x, y) === 0 && rng.next() < yardDensity) setYardOcc(s, x, y, -1);
        for (let sy = 0; sy < c.hs; sy++)
          for (let sx = 0; sx < c.ws; sx++)
            if (siteOcc(s, 0, sx, sy) === 0 && rng.next() < siteDensity)
              setSiteOcc(s, 0, sx, sy, SITE_TROWEL);

        const m: Model = {
          g,
          shape,
          height,
          gaps: lvl.gaps.map((gp) => ({ lo: gp.y, hi: gp.y + gp.size, open: gp.type !== 'locked' })),
          blocked: (x, y) => {
            if (x <= g.wy - 1) {
              const v = yardOcc(s, x, y);
              return v !== 0 && v !== id + 1;
            }
            if (y < elev) return true;
            if (y >= g.h || y - elev >= c.hs) return false; // crane area, site air
            const v = siteOcc(s, 0, x - g.siteX, y - elev);
            return v !== 0 && v !== id + 1;
          },
          starts: new Set<string>(),
        };
        const anchor = F(pieceX(s, id), pieceY(s, id) + (onSite ? elev : 0));
        const starts = [anchor];
        if (onSite && hasFlag(s, id, 'debris'))
          m.gaps.forEach((_, gi) => {
            if (modelValid(m, R(gi, anchor.ix, anchor.iy))) starts.push(R(gi, anchor.ix, anchor.iy));
          });
        starts.forEach((st) => m.starts.add(key(st)));
        const want = modelBfs(m, starts);
        const moves = [...want.keys()].some((k) => !k.endsWith(`:${anchor.ix},${anchor.iy}`));
        const attempt = tryBeginDrag(s, id);
        const where = `${label(c)} trial ${trial} ${shape.id}`;
        if (!moves) {
          expect(attempt, where).toEqual({ ok: false, reason: 'immovable' });
          continue;
        }
        if (!attempt.ok) throw new Error(`${where}: expected a session, got ${attempt.reason}`);
        const d = attempt.session;
        const got = new Map(d.reachableNodes().map((n) => [key(n), d.distanceFromStart(n)]));
        expect([...got.entries()].sort(), `${where} R`).toEqual([...want.entries()].sort());
        for (const n of d.reachableNodes()) {
          expect(d.neighbours(n).map(key).sort(), `${where} edges of ${key(n)}`).toEqual(
            modelNeighbours(m, n).map(key).sort(),
          );
          expect(dropName(d.classify(n)), `${where} class of ${key(n)}`).toBe(modelClassify(m, starts, n));
        }
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(400);
  });
});

// --- E-56: yard air ------------------------------------------------------------------------------------------------------

describe('K-05 K-07 K-49 yard air (Faz 2R)', () => {
  /** Bölüm 1 size (Wy 4, Hy 4, Ws 2, Hs 5 → H 5): `a` = D2_0 Y at (0,2), the rest of column 0 full below it. */
  function bolum1(): GameState {
    return initialState({
      id: 1,
      moves: 11,
      ...sizes({ wy: 4, hy: 4, ws: 2, hs: 5 }),
      wall: { height: 3 },
      plan: ['WW', 'YY', 'WW', 'YW', 'YW'],
      pieces: [
        ['D2_0', 'Y', 0, 2],
        ['D2_0', 'W', 0, 0],
        ['D2_90', 'W', 1, 0],
      ],
    });
  }

  it('K-49 yard air drop cancels (E-56): `a` released at anchor (0,4) (yard air + crane area) or (0,3) (cell (0,4) y ≥ Hy) is K-07 row 3; no move spent, the block stays at (0,2)', () => {
    const s = bolum1();
    const d = grab(s, 0);
    expect(d.isReachable(F(0, 4))).toBe(true); // yard air is passed while dragging (K-05)
    expect(d.isReachable(F(0, 5))).toBe(true); // crane area y = H, H + 1
    expect(d.isReachable(F(0, 6))).toBe(false); // K-01: a cell at y = H + 2 does not exist
    for (const at of [F(0, 4), F(0, 3)])
      expect(d.classify(at), key(at)).toMatchObject({ kind: 'cancel', reason: 'craneOverYard', row: 3 });
    expect(d.classify(F(2, 2))).toMatchObject({ kind: 'yard', row: 2 });

    const before = Array.from(s.buf);
    const sink = new ArraySink();
    const res = applyMove(s, { kind: 'drag', pieceId: 0, to: F(0, 4) }, sink);
    expect(res).toMatchObject({ status: 'cancelled', reason: 'craneOverYard' });
    expect(Array.from(s.buf)).toEqual(before);
    expect(hdr(s, H.movesLeft)).toBe(11);
    expect([pieceX(s, 0), pieceY(s, 0), pieceZone(s, 0)]).toEqual([0, 2, Zone.yard]);
    expect(applyMove(s, { kind: 'drag', pieceId: 0, to: F(0, 3) })).toMatchObject({ status: 'cancelled' });
  });

  it('K-05 K-49 over the wall on a short board: crane rows H, H + 1 are open, a 2-tall block crosses a wall of height H; release over the site falls (K-11)', () => {
    const tall = initialState({
      id: 1,
      ...sizes({ wy: 4, hy: 4, ws: 2, hs: 5 }),
      wall: { height: 5 },
      plan: ['WW', 'YY', 'WW', 'YW', 'YW'],
      pieces: [['D2_0', 'Y', 0, 2]],
    });
    const d = grab(tall, 0);
    expect(d.canCrossWall).toBe(true);
    expect(d.isReachable(F(4, 5))).toBe(true);
    expect(d.classify(F(4, 5))).toMatchObject({ kind: 'siteFree', row: 6 });
    // a 3-tall block cannot clear a wall of height H: (H + 2) − height = 2 (K-05)
    const i3 = grab(
      initialState({
        id: 11,
        ...sizes({ wy: 4, hy: 4, ws: 2, hs: 5 }),
        wall: { height: 5 },
        plan: ['WW'],
        pieces: [['I3_0', 'Y', 0, 0]],
      }),
      0,
    );
    expect(i3.reachableNodes().some((n) => n.ix >= 4)).toBe(false);
  });
});

// --- E-57: drops over the yard ----------------------------------------------------------------------------------------

describe('K-17 K-25 K-49 drops over the yard start at (H + 2) − h and land only inside the yard (Faz 2R)', () => {
  /** Bölüm 5 size class (Hy 4, H 5): column 0 full at y 0–2, a truck D2_0 for segment 1 at x = 0. */
  function truckBoard(col1Full: number): GameState {
    const pieces: PieceSpec[] = [
      ['I3_0', 'W', 0, 0],
      ['D2_0', 'W', 2, 0],
      ['D2_0', 'W', 3, 0],
    ];
    if (col1Full > 0) pieces.push([col1Full === 1 ? 'B1_0' : col1Full === 2 ? 'D2_0' : 'I3_0', 'W', 1, 0]);
    return initialState({
      id: 5,
      ...sizes({ wy: 4, hy: 4, ws: 2, hs: 5 }),
      plan: [
        ['WW', 'WW', 'WW', 'WW', 'WW'],
        ['YY', 'YY', 'YY', 'YY', 'YY'],
      ],
      pieces,
      batches: [{ forSegment: 1, pieces: [['D2_0', 'Y', 0, 4]] }],
    });
  }
  const truckId = (s: GameState): number => s.lvl.batches[1]?.pieceIds[0] ?? -1;

  it('K-49 yard air truck candidate rejected (E-57): D2_0 dropped in column 0 from y = 5 would rest at (0,3) with (0,4) in yard air → next K-25 column; none fits → stays queued (K-26)', () => {
    const s = truckBoard(1);
    const id = truckId(s);
    const shape = shapeById('D2_0');
    expect(yardDropRow(s.lvl.geo, shape)).toBe(5);
    expect(dropIntoYard(s, shape, 0)).toBe(-1); // (0,3)–(0,4): (0,4) y ≥ Hy
    expect(dropIntoYard(s, shape, 1)).toBe(1);
    movePiece(s, id, { zone: 'queue', x: 0, y: 4, seg: -1 });
    expect(deliveryLanding(s, id)).toEqual({ ix: 1, iy: 1 });
    const res = deliverQueue(s);
    expect(res.delivered).toEqual([{ pieceId: id, from: { ix: 1, iy: 5 }, to: { ix: 1, iy: 1 }, rows: 4 }]);
    expect(stateInvariantErrors(s)).toEqual([]);

    // every column full above y 1: no candidate keeps both cells at y ≤ 3 → the block stays in the truck
    const full = truckBoard(3);
    setYardOcc(full, 2, 2, -1);
    setYardOcc(full, 3, 2, -1);
    const fid = truckId(full);
    movePiece(full, fid, { zone: 'queue', x: 0, y: 4, seg: -1 });
    expect(deliveryLanding(full, fid)).toBeNull();
    expect(deliverQueue(full)).toEqual({ delivered: [], queued: 1 });
  });

  it('K-17 K-49 bounce-back step 2 uses the same drop: start row (H + 2) − h, columns 0 … Wy − w nearest the start, a landing needs y ≤ Hy − 1', () => {
    const s = truckBoard(2);
    // columns 3 and 2 hold 3 rows: a D2_0 would rest at y 3–4, (·,4) is yard air → rejected
    setYardOcc(s, 2, 2, -1);
    setYardOcc(s, 3, 2, -1);
    const id = 3; // the col-1 D2_0 at (1,0), bounced from a site start x = Wy: candidates 3, 2, 1, 0
    const t = returnTarget(s, id, { start: { zone: 'site', x: 4, y: 0, seg: 0 }, skipStart: true });
    expect(t.step).toBe(2);
    expect(t.dropFrom).toEqual({ ix: 1, iy: 5 });
    expect([t.to.x, t.to.y]).toEqual([1, 0]); // itself excluded: its own column 1 is free again
    // nothing fits: step 3, the end of the truck queue, first truck column clamped to Wy − w
    setYardOcc(s, 1, 2, -1);
    setYardOcc(s, 0, 3, -1);
    const q = returnTarget(s, id, { start: { zone: 'site', x: 4, y: 0, seg: 0 }, skipStart: true });
    expect(q).toEqual({ step: 3, to: { zone: 'queue', x: 3, y: 4, seg: -1 }, dropFrom: null });
  });
});

// --- K-44 Ağır Yük -------------------------------------------------------------------------------------------------------

describe('K-08 K-44 Ağır Yük stays in the yard (Faz 2R)', () => {
  it('K-44 cargo never leaves the yard while dragged: every node of R keeps all cells at x ≤ Wy − 1, y ≤ Hy − 1, FREE only (Q9 and I5, every geometry, open wall, a gap)', () => {
    for (const c of G) {
      for (const shapeId of ['Q9_0', 'I5_0', 'I5_180'] as const) {
        const shape = shapeById(shapeId);
        if (shape.w > c.wy || shape.h > c.hy) continue;
        const s = initialState({
          id: 8,
          ...sizes(c),
          wall: { height: 2, gaps: [{ type: 'static', y: 0, size: 1 }] },
          plan: [Array.from({ length: c.ws }, () => 'W').join('')],
          pieces: [[shapeId, 'W', 0, 0]],
        });
        const d = grab(s, 0);
        expect(d.cargo, `${label(c)} ${shapeId}`).toBe(true);
        expect(d.canCrossWall || d.canEnterRail, `${label(c)} ${shapeId}`).toBe(false);
        for (const n of d.reachableNodes()) {
          expect(n.mode, `${label(c)} ${shapeId} ${key(n)}`).toBe(FREE);
          for (const [x, y] of cellsOf(shape, n))
            expect(isYardCell(s.lvl.geo, x, y), `${label(c)} ${shapeId} ${key(n)}`).toBe(true);
          if (key(n) !== key(d.start)) expect(d.classify(n)).toMatchObject({ kind: 'yard', row: 2 });
        }
        // all of the empty yard is reachable: (Wy − w + 1) × (Hy − h + 1) anchors
        expect(d.reachableCount).toBe((c.wy - shape.w + 1) * (c.hy - shape.h + 1));
      }
    }
  });

  it('K-44 cargo is I5 and Q9 in every orientation, nothing else (the pre-2R "w ≥ 3 is heavy" branch is gone)', () => {
    for (const sh of SHAPES) expect(isCargoShape(sh), sh.id).toBe(sh.kind === 'I5' || sh.kind === 'Q9');
    const wide = grab(
      initialState({
        id: 11,
        ...sizes({ wy: 5, hy: 7, ws: 3, hs: 7 }),
        plan: ['WWW'],
        pieces: [['L4_90', 'W', 0, 0]],
      }),
      0,
    );
    expect(wide.cargo).toBe(false);
    expect(wide.reachableNodes().some((n) => n.ix >= 5 && wide.classify(n).kind === 'siteFree')).toBe(true);
  });

  it('K-44 blockedCargo once per hold: the first follow with p.x ≥ Wy or p.y ≥ Hy signals, later ones do not; a new hold signals again; material blocks never', () => {
    const c = { wy: 4, hy: 5, ws: 2, hs: 5 };
    const s = initialState({ id: 8, ...sizes(c), plan: ['WW'], pieces: [['Q9_0', 'W', 0, 0]] });
    const d = grab(s, 0);
    expect(d.follow(0.6, 0.4).blockedCargo).toBe(false); // inside the yard
    expect(d.follow(0.9, 1.8).blockedCargo).toBe(false);
    const out = d.follow(4, 1);
    expect(out.blockedCargo).toBe(true); // p.x ≥ Wy
    expect(d.isReachable(out.node) && out.node.ix + 3 <= 4).toBe(true); // the block itself stays in the yard
    expect(d.follow(5.5, 1).blockedCargo).toBe(false); // at most once per hold
    expect(d.follow(0.5, 0.5).blockedCargo).toBe(false);
    expect(d.follow(0.5, 6).blockedCargo).toBe(false);
    const up = grab(s, 0);
    expect(up.follow(1, 4.9).blockedCargo).toBe(false);
    expect(up.follow(1, 5).blockedCargo).toBe(true); // p.y ≥ Hy
    // a material block that leaves the yard gets no cargo signal
    const b1 = grab(initialState({ id: 8, ...sizes(c), plan: ['WW'], pieces: [['B1_0', 'W', 0, 0]] }), 0);
    expect(b1.cargo).toBe(false);
    for (const [px, py] of [
      [4, 1],
      [5, 6],
      [0, 6],
    ] as const)
      expect(b1.follow(px, py).blockedCargo).toBe(false);
  });

  it('K-44 cargo drag through the pipeline: a slide is a yard move (1 move), the drop never reaches the site', () => {
    const s = initialState({
      id: 8,
      moves: 10,
      ...sizes({ wy: 6, hy: 5, ws: 2, hs: 6 }),
      plan: ['WW'],
      pieces: [['Q9_0', 'W', 0, 0]],
    });
    const res = applyMove(s, { kind: 'drag', pieceId: 0, to: F(3, 2) });
    expect(res.status).toBe('applied');
    expect([pieceX(s, 0), pieceY(s, 0), pieceZone(s, 0), hdr(s, H.movesLeft)]).toEqual([3, 2, Zone.yard, 9]);
    // (3,3) puts the top row at y 5 = Hy: not a node of R → the record is cancelled as invalid, nothing changes
    const before = Array.from(s.buf);
    expect(applyMove(s, { kind: 'drag', pieceId: 0, to: F(3, 3) })).toMatchObject({ status: 'cancelled' });
    expect(Array.from(s.buf)).toEqual(before);
  });
});

// --- typing helpers kept honest ----------------------------------------------------------------------------------------

describe('K-49 helpers', () => {
  it('K-49 level fixtures with sizes compile through the current schema (sizes attached when the schema lacks them)', () => {
    const data: LevelData = level({
      ...sizes({ wy: 4, hy: 6, ws: 4, hs: 6 }),
      plan: ['WWYY'],
      pieces: [['B1_0', 'W', 0, 0]],
    });
    const lvl = compile(data);
    expect([lvl.geo.wy, lvl.geo.ws, lvl.geo.h]).toEqual([4, 4, 6]);
    expect(lvl.segments[0]?.planColors.length).toBe(24);
  });
});
