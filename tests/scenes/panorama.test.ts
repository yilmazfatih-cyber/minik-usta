import { describe, expect, it } from 'vitest';
import { TOKENS } from '../../src/theme/tokens.ts';
import { createLayout } from '../../src/theme/layout.ts';
import { panoramaView } from '../../src/core/panorama.ts';
import { GameSession } from '../../src/core/session.ts';
import { panoramaGeometry } from '../../src/ui/Panorama.ts';
import { VIEW } from '../../src/scenes/level/viewConstants.ts';
import { LEVELS_1_10, levelFile } from '../core/moves.fixtures.ts';

const style = {
  padPx: VIEW.panoramaPadPx,
  gapCells: VIEW.panoramaGapCells,
  maxCellPx: VIEW.panoramaMaxCellPx,
  minCellPx: VIEW.panoramaMinCellPx,
};

describe('panorama strip geometry (K-06, UX 5.1)', () => {
  it('UX 5.1 (Faz 2 tur 2) the cell size follows the tallest segment: min(24, ⌊(110 − 2·pad) / rows⌋), at least 12 px', () => {
    const rect = createLayout(TOKENS, 1920).top.panorama;
    expect(rect.h).toBe(110);
    const cells: number[] = [];
    for (const id of LEVELS_1_10) {
      const segs = panoramaView(GameSession.start(levelFile(id)).state);
      const rows = Math.max(...segs.map((s) => s.rows.length));
      const want = Math.max(12, Math.min(24, Math.floor((110 - 2 * VIEW.panoramaPadPx) / rows)));
      expect([id, panoramaGeometry(rect, segs, style).cell]).toEqual([id, want]);
      cells.push(want);
    }
    // Faz 2R levels 1–10: Hs 5–7 rows (K-49), so the cell is between the 7-row and the 5-row size
    const size = (rows: number): number => Math.floor((110 - 2 * VIEW.panoramaPadPx) / rows);
    expect(Math.min(...cells)).toBe(size(7));
    expect(Math.max(...cells)).toBe(size(5));
    // an 8-row plan keeps the old 12 px
    const tall = [
      { index: 0, status: 'active' as const, rows: Array.from({ length: 8 }, () => ['Y', 'Y'] as const) },
    ];
    expect(panoramaGeometry(rect, tall, style).cell).toBe(12);
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
