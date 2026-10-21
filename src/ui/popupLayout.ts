/**
 * Window geometry without Phaser (ui/Popup.ts draws it; tests read it): the v3 option sizes (ART_REFERENCE §3.1 L / M
 * and the UX §7 full 920 × 152 option row) and the option stack — bottom → top from the panel's bottom inset, the
 * primary action lowest (UX §0.2; TECH §10.1 popup anchor contract).
 */
import type { Layout, Rect } from '../theme/layout.ts';
import { TOKENS } from '../theme/tokens.ts';

const V3 = TOKENS.kit.v3;

export type OptionSize = 'L' | 'M' | 'row';

/** v3 option sizes (ART_REFERENCE §3.1 L / M; UX §7 row). */
export const OPTION_SIZE: Readonly<Record<OptionSize, { readonly w: number; readonly h: number }>> = {
  L: { w: V3.button.L.w, h: V3.button.L.h },
  M: { w: V3.button.M.w, h: V3.button.M.h },
  row: { w: TOKENS.layout.popup.optionW, h: TOKENS.layout.popup.optionH },
};

/** Gap between stacked options (ART_REFERENCE §9.5: 1300 → 1332). */
export const OPTION_GAP = 32;

/** Rects of the options, index 0 = topmost (reading order), stacked bottom → top from `bottomY` (pure). */
export function optionRects(
  W: number,
  bottomY: number,
  options: readonly { readonly size?: OptionSize }[],
): readonly Rect[] {
  const out: Rect[] = [];
  let y = bottomY;
  for (let i = options.length - 1; i >= 0; i--) {
    const s = OPTION_SIZE[options[i]?.size ?? 'row'];
    y -= s.h;
    out.unshift({ x: (W - s.w) / 2, y, w: s.w, h: s.h });
    y -= OPTION_GAP;
  }
  return out;
}

/** Equal-pair rects of the v2 window (kept for the layout tests: two 440 × 152 at the lowest option slot). */
export function pairRects(layout: Layout): readonly Rect[] {
  const p = TOKENS.layout.popup;
  const y = layout.popup.optionsBottomY - p.optionH;
  const pairW = 440;
  const gap = 40;
  const x0 = (layout.W - 2 * pairW - gap) / 2;
  return [
    { x: x0, y, w: pairW, h: p.optionH },
    { x: x0 + pairW + gap, y, w: pairW, h: p.optionH },
  ];
}
