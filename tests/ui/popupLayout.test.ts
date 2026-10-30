/**
 * Window v3 option stack (ui/popupLayout.ts; ART_REFERENCE §3.1 L / M, §9.5; UX §0.2 primary lowest; TECH §10.1
 * popup anchor contract).
 */
import { describe, expect, it } from 'vitest';
import { createLayout } from '../../src/theme/layout.ts';
import { TOKENS } from '../../src/theme/tokens.ts';
import {
  OPTION_GAP,
  OPTION_SIZE,
  WINDOW_RHYTHM,
  contentInset,
  optionRects,
  pairRects,
  windowGeometry,
} from '../../src/ui/popupLayout.ts';

describe('window v3 option stack (ART_REFERENCE 3.1, 9.5; UX 0.2)', () => {
  it('ART_REFERENCE 3.1 sizes: L 560 × 212, M 360 × 136, the UX §7 row 920 × 152', () => {
    expect(OPTION_SIZE.L).toEqual({ w: 560, h: 212 });
    expect(OPTION_SIZE.M).toEqual({ w: 360, h: 136 });
    expect(OPTION_SIZE.row).toEqual({ w: TOKENS.layout.popup.optionW, h: TOKENS.layout.popup.optionH });
  });

  it('UX 0.2 / ART_REFERENCE 9.5 pause: "Bölümden çık" M above "Devam" L; the lowest option ends on the given bottom', () => {
    const rects = optionRects(1080, 1544, [{ size: 'M' }, { size: 'L' }]);
    expect(rects).toEqual([
      { x: 360, y: 1544 - 212 - OPTION_GAP - 136, w: 360, h: 136 },
      { x: 260, y: 1332, w: 560, h: 212 },
    ]);
  });

  it('UX 7 three equal options stack bottom → top 920 × 152 with the gap, centred', () => {
    const rects = optionRects(1080, 1560, [{}, {}, {}]);
    expect(rects.map((r) => r.y)).toEqual([
      1560 - 3 * 152 - 2 * OPTION_GAP,
      1560 - 2 * 152 - OPTION_GAP,
      1560 - 152,
    ]);
    expect(rects.every((r) => r.x === 80 && r.w === 920)).toBe(true);
  });

  it('TECH 10.1 the v2 equal pair stays at the lowest option slot (layout tests)', () => {
    const L = createLayout(TOKENS, 1920);
    const [a, b] = pairRects(L);
    expect(a && b && a.y + a.h).toBe(L.popup.optionsBottomY);
  });
});

describe('window v3 panel rhythm (ART_REFERENCE 3.7, 9.5, 9.7, 9.8; TECH 10.1 anchor)', () => {
  const H = 1920;
  const bottom = H - TOKENS.layout.popup.panelBottomPx; // 1624
  const pause = TOKENS.kit.v3.screen.pause;
  const lose = TOKENS.kit.v3.screen.lose;

  it('ART_REFERENCE 9.5 pause: the 760 × 340 plate + M + L make the 1000 × 900 panel at y 724–1624, plate 796–1136, exit 1164, Devam 1332–1544', () => {
    const plateH = 2 * 20 + 3 * pause.rowH; // 340
    const g = windowGeometry(1080, bottom, pause.panelW, plateH, [{ size: 'M' }, { size: 'L' }]);
    expect(g.rect).toEqual({ x: 40, y: 724, w: 1000, h: pause.panelH });
    expect(g.contentTop).toBe(796);
    expect(g.contentTop + plateH).toBe(1136);
    expect(g.options).toEqual([
      { x: 360, y: 1164, w: 360, h: 136 },
      { x: 260, y: 1332, w: 560, h: 212 },
    ]);
    expect(WINDOW_RHYTHM).toEqual({ topPadPx: 72, contentGapPx: 28, optionsBottomInsetPx: 80 });
  });

  it('ART_REFERENCE 9.7 lose: preview card 300 + "Teklif 1/3" + three 920 × 152 options → a 1000-wide panel within 5 % of 1120, anchored on 1624', () => {
    const counter = 42; // the 34 px lavender line
    const contentH = lose.previewH + 24 + counter;
    const g = windowGeometry(1080, bottom, lose.panelW, contentH, [{}, {}, {}]);
    expect(g.rect.x).toBe(40);
    expect(g.rect.y + g.rect.h).toBe(bottom);
    expect(Math.abs(g.rect.h - lose.panelH) / lose.panelH).toBeLessThanOrEqual(0.05);
    expect(g.options.map((r) => r.w)).toEqual([920, 920, 920]);
    expect(g.options[2]?.y).toBe(bottom - 80 - 152);
  });

  it('ART_REFERENCE 9.5 exit confirm: the 920 panel keeps an 820 card (inset 50); the 1000 panel an 880 plate (inset 60)', () => {
    expect(contentInset(pause.confirmPanelW)).toBe(50);
    expect(pause.confirmPanelW - 2 * contentInset(pause.confirmPanelW)).toBe(820);
    expect(contentInset(1000)).toBe(60);
    const g = windowGeometry(1080, bottom, pause.confirmPanelW, 160, [{ size: 'M' }, { size: 'L' }]);
    expect(g.rect).toMatchObject({ x: 80, w: 920 });
    // the §9.5 "560" for this panel cannot hold a mounted title, a 160 card, "Çık" M and "Kal" L stacked: the panel
    // grows with its content (ART_REFERENCE §3.7) — 720 here
    expect(g.rect.h).toBe(72 + 160 + 28 + 136 + OPTION_GAP + 212 + 80);
  });

  it('ART_REFERENCE 9.3 level-start rhythm (104 / 56) keeps the plate off "Oyna" for the badges riding its bottom edge', () => {
    const g = windowGeometry(1080, bottom, 1000, 480, [{ size: 'L' }], {
      ...WINDOW_RHYTHM,
      topPadPx: 104,
      contentGapPx: 56,
    });
    expect(g.options[0]?.y).toBe(1332);
    expect(g.contentTop + 480 + 56).toBe(1332);
    expect(g.rect.y).toBe(g.contentTop - 104);
  });

  it('TECH 10.1 a window without options still anchors on the bottom edge with the bottom inset', () => {
    const g = windowGeometry(1080, bottom, 1000, 200, []);
    expect(g.rect.y + g.rect.h).toBe(bottom);
    expect(g.contentTop + 200).toBe(bottom - 80);
  });
});
