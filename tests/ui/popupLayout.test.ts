/**
 * Window v3 option stack (ui/popupLayout.ts; ART_REFERENCE §3.1 L / M, §9.5; UX §0.2 primary lowest; TECH §10.1
 * popup anchor contract).
 */
import { describe, expect, it } from 'vitest';
import { createLayout } from '../../src/theme/layout.ts';
import { TOKENS } from '../../src/theme/tokens.ts';
import { OPTION_GAP, OPTION_SIZE, optionRects, pairRects } from '../../src/ui/popupLayout.ts';

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
