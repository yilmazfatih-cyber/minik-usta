/**
 * "Hamleler bitti!" preview (ui/losePreview.ts; UX_FLOWS §7 window 1, ART_REFERENCE §9.7; GDD K-29, K-48).
 */
import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/core/session.ts';
import { shapeById } from '../../src/core/shapes.ts';
import { remainingBlocks } from '../../src/ui/remaining.ts';
import { previewRow, remainingPreviewPieces } from '../../src/ui/losePreview.ts';
import { handMoves, levelFile } from '../core/moves.fixtures.ts';

describe('K-29 out-of-moves window 1 preview (UX 7, ART_REFERENCE 9.7)', () => {
  it('K-29 / K-48 the preview lists exactly the material blocks still to place, one less per correct placement', () => {
    const lvl = levelFile(1);
    const g = GameSession.start(lvl);
    const counts = [remainingPreviewPieces(g.state).length];
    for (const m of handMoves(1)) {
      g.commit(m);
      counts.push(remainingPreviewPieces(g.state).length);
    }
    expect(counts).toEqual([5, 4, 3, 2, 1, 0]);
    // the same set the "Kalan: n blok" line counts (TECH §2R.2 blocksLeft)
    const g2 = GameSession.start(lvl);
    g2.commit(handMoves(1)[0]!);
    expect(remainingPreviewPieces(g2.state)).toHaveLength(remainingBlocks(g2.state));
    for (const p of remainingPreviewPieces(g2.state)) {
      expect(shapeById(p.shape).w).toBeGreaterThan(0);
      expect(p.color).toMatch(/^[A-Z]$/);
      expect(Number.isInteger(p.flags)).toBe(true);
    }
  });

  it('ART_REFERENCE 9.7 preview row: blocks at the max cell when they fit, shrunk together when they do not, at most 6 shown', () => {
    const one = previewRow([{ shape: 'D2_90', color: 'R', flags: 0 }], 784, 44, 24, 6);
    expect(one.cell).toBe(44);
    expect(one.items).toEqual([{ cx: 0, w: shapeById('D2_90').w * 44, h: shapeById('D2_90').h * 44 }]);
    expect(one.hidden).toBe(0);
    // eight wide blocks: six shown, the cell shrinks so the row fits the card
    const many = Array.from({ length: 8 }, () => ({ shape: 'I4_90', color: 'B', flags: 0 }) as const);
    const row = previewRow(many, 784, 44, 24, 6);
    expect(row.items).toHaveLength(6);
    expect(row.hidden).toBe(2);
    const w = shapeById('I4_90').w;
    expect(row.cell).toBeCloseTo((784 - 5 * 24) / (6 * w), 6);
    expect(row.cell).toBeLessThan(44);
    const first = row.items[0]!;
    const last = row.items[5]!;
    expect(first.cx - first.w / 2).toBeCloseTo(-392, 6);
    expect(last.cx + last.w / 2).toBeCloseTo(392, 6);
    // never below the readable floor
    const tiny = previewRow(many, 100, 44, 24, 6);
    expect(tiny.cell).toBe(24);
  });

  it('ART_REFERENCE 9.7 preview row: the tallest block fits the card band over the count line (a vertical I4 in 184 → cell 46)', () => {
    const tall = previewRow([{ shape: 'I4_0', color: 'G', flags: 0 }], 784, 56, 24, 6, 184);
    expect(shapeById('I4_0').h).toBe(4);
    expect(tall.cell).toBe(46);
    expect(tall.items[0]?.h).toBe(184);
    const short = previewRow([{ shape: 'O4_0', color: 'G', flags: 0 }], 784, 56, 24, 6, 184);
    expect(short.cell).toBe(56);
  });
});
