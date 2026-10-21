import { describe, expect, it } from 'vitest';
import { TOKENS } from '../../src/theme/tokens.ts';
import { createLayout } from '../../src/theme/layout.ts';
import { panoramaView } from '../../src/core/panorama.ts';
import { GameSession } from '../../src/core/session.ts';
import {
  panoramaArrowPair,
  panoramaArrowPose,
  panoramaGeometry,
  panoramaSlot,
} from '../../src/ui/Panorama.ts';
import { VIEW } from '../../src/scenes/level/viewConstants.ts';
import { LEVELS_1_10, handMoves, levelFile } from '../core/moves.fixtures.ts';

const style = {
  padPx: VIEW.panoramaPadPx,
  gapCells: VIEW.panoramaGapCells,
  maxCellPx: VIEW.panoramaMaxCellPx,
  minCellPx: VIEW.panoramaMinCellPx,
};

describe('panorama strip geometry (K-06, UX 5.1)', () => {
  it('UX 5.1 (Faz 2 tur 2) the cell size follows the tallest segment: min(24, ⌊(well − 2·pad) / rows⌋), at least 12 px (v3 well 136)', () => {
    const rect = createLayout(TOKENS, 1920).top.panorama;
    const H = TOKENS.kit.v3.screen.hud.movesH;
    expect(rect.h).toBe(H);
    const cells: number[] = [];
    for (const id of LEVELS_1_10) {
      const segs = panoramaView(GameSession.start(levelFile(id)).state);
      const rows = Math.max(...segs.map((s) => s.rows.length));
      const want = Math.max(12, Math.min(24, Math.floor((H - 2 * VIEW.panoramaPadPx) / rows)));
      expect([id, panoramaGeometry(rect, segs, style).cell]).toEqual([id, want]);
      cells.push(want);
    }
    // Faz 2R levels 1–10: Hs 5–7 rows (K-49), so the cell is between the 7-row and the 5-row size
    const size = (rows: number): number => Math.min(24, Math.floor((H - 2 * VIEW.panoramaPadPx) / rows));
    expect(Math.min(...cells)).toBe(size(7));
    expect(Math.max(...cells)).toBe(size(5));
    // an 8-row plan stays ≥ 12 px
    const tall = [
      { index: 0, status: 'active' as const, rows: Array.from({ length: 8 }, () => ['Y', 'Y'] as const) },
    ];
    expect(panoramaGeometry(rect, tall, style).cell).toBe(Math.max(12, size(8)));
  });

  it('K-06 every segment column fits in layout.top.panorama, centred, on one base', () => {
    const rect = createLayout(TOKENS, 2337).top.panorama; // top group: no EXPAND shift
    const segs = panoramaView(GameSession.start(levelFile(5)).state);
    expect(segs.map((s) => s.status)).toEqual(['active', 'future']);
    const geo = panoramaGeometry(rect, segs, style);
    const right = geo.x0 + (segs.length - 1) * geo.step + geo.colW;
    expect(geo.x0).toBeGreaterThanOrEqual(rect.x);
    expect(right).toBeLessThanOrEqual(rect.x + rect.w);
    expect(geo.x0 - rect.x).toBeCloseTo(rect.x + rect.w - right, 6);
    // the tallest segment is vertically centred
    const rows = Math.max(...segs.map((s) => s.rows.length));
    const top = geo.bottom - rows * geo.cell;
    expect(top - rect.y).toBeCloseTo(rect.y + rect.h - geo.bottom, 6);
    expect(geo.bottom).toBeLessThanOrEqual(rect.y + rect.h - VIEW.panoramaPadPx);
    for (const s of segs) expect(geo.bottom - s.rows.length * geo.cell).toBeGreaterThanOrEqual(rect.y);
  });
});

describe('UX 13.2 tutorial panorama arrow (Bölüm 2 adım 1 up, Bölüm 5 adım 1 right)', () => {
  const rect = createLayout(TOKENS, 1920).top.panorama;

  it('UX 13.2 Bölüm 2 (one segment): the arrow points up inside the active strip, from its bottom row to its top row, and slides 16 px up', () => {
    const segs = panoramaView(GameSession.start(levelFile(2)).state);
    expect(segs.map((s) => s.status)).toEqual(['active']);
    const pair = panoramaArrowPair(rect, segs, style);
    const slot = panoramaSlot(rect, segs, 0, style);
    if (!pair || !slot) throw new Error('no arrow');
    const row = slot.h / 5; // 2 × 5 plan
    expect(pair.dir).toBe('up');
    expect(pair.from).toEqual({ x: slot.x, y: slot.y + slot.h - row, w: slot.w, h: row });
    expect(pair.to).toEqual({ x: slot.x, y: slot.y, w: slot.w, h: row });
    const rest = panoramaArrowPose(pair, 0, VIEW.panoramaArrowSlidePx);
    const end = panoramaArrowPose(pair, VIEW.panoramaArrowSlidePx, VIEW.panoramaArrowSlidePx);
    expect(rest.rotation).toBeCloseTo(-Math.PI / 2, 9);
    expect(rest.x).toBeCloseTo(slot.x + slot.w / 2, 9);
    expect(end.x).toBe(rest.x);
    expect(rest.y - end.y).toBe(VIEW.panoramaArrowSlidePx);
    // the turned 40 × 64 arrow and its slide stay inside the strip box
    expect(rest.y + VIEW.panoramaArrowW / 2).toBeLessThanOrEqual(rect.y + rect.h);
    expect(end.y - VIEW.panoramaArrowW / 2).toBeGreaterThanOrEqual(rect.y);
  });

  it('UX 13.2 Bölüm 5 (two segments): the arrow points right from the active strip to the next one and slides 16 px right; none once the last segment is active', () => {
    const game = GameSession.start(levelFile(5));
    const segs = panoramaView(game.state);
    const pair = panoramaArrowPair(rect, segs, style);
    const a = panoramaSlot(rect, segs, 0, style);
    const b = panoramaSlot(rect, segs, 1, style);
    if (!pair || !a || !b) throw new Error('no arrow');
    expect([pair.dir, pair.from, pair.to]).toEqual(['right', a, b]);
    const rest = panoramaArrowPose(pair, 0, VIEW.panoramaArrowSlidePx);
    const end = panoramaArrowPose(pair, VIEW.panoramaArrowSlidePx, VIEW.panoramaArrowSlidePx);
    expect([rest.rotation, end.x - rest.x, end.y - rest.y]).toEqual([0, VIEW.panoramaArrowSlidePx, 0]);
    expect(rest.x + VIEW.panoramaArrowSlidePx / 2).toBeCloseTo((a.x + a.w + b.x) / 2, 9);
    // after the first segment the active one is the last: no arrow (LEVELS Bölüm 5 adım 1 ends there)
    for (const m of handMoves(5).slice(0, 5)) game.commit(m);
    const later = panoramaView(game.state);
    expect(later.map((s) => s.status)).toEqual(['done', 'active']);
    expect(panoramaArrowPair(rect, later, style)).toBeNull();
  });
});
