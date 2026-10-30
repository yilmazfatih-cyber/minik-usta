/**
 * Window geometry without Phaser (ui/Popup.ts draws it; tests read it): the v3 option sizes (ART_REFERENCE §3.1 L / M
 * and the UX §7 full 920 × 152 option row), the option stack — bottom → top from the panel's bottom inset, the
 * primary action lowest (UX §0.2; TECH §10.1 popup anchor contract) — and the panel rectangle that grows upward from
 * the anchored bottom edge with its content (ART_REFERENCE §3.7 "içerik yükseldikçe panel yukarı uzar").
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

/**
 * Vertical rhythm of the window (ART_REFERENCE §9.5 pause: panel 724–1624, plate 796–1136, "Bölümden çık" 1164, "Devam"
 * 1332–1544): the lowest option ends `optionsBottomInsetPx` above the panel's bottom edge, the content ends
 * `contentGapPx` above the topmost option, the panel's top edge is `topPadPx` above the content. The level-start
 * window (§9.3: plate 100 under the top edge, the squares' badges riding the plate's bottom edge) passes its own.
 */
export interface WindowRhythm {
  readonly topPadPx: number;
  readonly contentGapPx: number;
  readonly optionsBottomInsetPx: number;
}

export const WINDOW_RHYTHM: WindowRhythm = Object.freeze({
  topPadPx: 72,
  contentGapPx: 28,
  optionsBottomInsetPx: 80,
});

/**
 * Content inset from the panel's side edges: the 880 plate / card in the 1000 window (ART_REFERENCE §9.3, §9.8), the
 * 820 card in the 920 exit confirm (§9.5).
 */
export function contentInset(panelW: number): number {
  return panelW >= V3.panel.w ? 60 : 50;
}

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

export interface WindowGeometry {
  /** Panel rectangle (design px). */
  readonly rect: Rect;
  /** Option rects in reading order (see `optionRects`). */
  readonly options: readonly Rect[];
  /** Top of the content area (design px). */
  readonly contentTop: number;
}

/**
 * The window of a content block `contentH` high over `options`, anchored on `panelBottomY` (= `H − panelBottomPx`):
 * the options stack bottom → top, the content sits above them, the panel's top edge above the content. The height
 * is capped at `kit.v3.panel.maxH` + 200 (the rows then overlap the title band — a content bug, not a layout).
 */
export function windowGeometry(
  W: number,
  panelBottomY: number,
  panelW: number,
  contentH: number,
  options: readonly { readonly size?: OptionSize }[],
  rhythm: WindowRhythm = WINDOW_RHYTHM,
): WindowGeometry {
  const rects = optionRects(W, panelBottomY - rhythm.optionsBottomInsetPx, options);
  const optionsTop =
    rects.length > 0 ? Math.min(...rects.map((r) => r.y)) : panelBottomY - rhythm.optionsBottomInsetPx;
  // the content-to-options gap only between content and options; a window without options ends its content on
  // the bottom inset, one without content starts its options under the top pad
  const gap = contentH > 0 && rects.length > 0 ? rhythm.contentGapPx : 0;
  const contentTop = optionsTop - gap - contentH;
  const top = contentTop - rhythm.topPadPx;
  const h = Math.min(V3.panel.maxH + 200, panelBottomY - top);
  return {
    rect: { x: (W - panelW) / 2, y: panelBottomY - h, w: panelW, h },
    options: rects,
    contentTop,
  };
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
