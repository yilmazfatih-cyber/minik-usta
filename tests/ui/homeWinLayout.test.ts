/**
 * Home v2 and win v2 geometry (UX_FLOWS §3 and §6.1 wireframes; `layout.home`, `layout.win`; UX §0.1 anchors, §0.2
 * thumb zone, §0.3 touch sizes) at FIT (H 1920) and the two phone profiles (EXPAND, D-015).
 */
import { describe, expect, it } from 'vitest';
import { designHeight, rectsOverlap } from '../../src/theme/layout.ts';
import type { Rect } from '../../src/theme/layout.ts';
import { TOKENS } from '../../src/theme/tokens.ts';
import { BASE_H, homeLayout, winLayout, winRows } from '../../src/ui/kit/layout.ts';
import { winRewards } from '../../src/ui/rewards.ts';

const HS = [
  1920,
  designHeight('expand', { width: 390, height: 844 }, TOKENS),
  designHeight('expand', { width: 360, height: 800 }, TOKENS),
  TOKENS.meta.scale.expandMaxHeight,
];
const bottom = (r: Rect): number => r.y + r.h;
const HL = TOKENS.layout.home;
const WL = TOKENS.layout.win;

describe('UX 3 home layout', () => {
  it('UX 3 home layout at H 1920 matches the wireframe numbers', () => {
    const g = homeLayout(TOKENS, 1920);
    expect(g.lives).toEqual({ x: 24, y: 40, w: 290, h: 96 });
    expect(g.coins).toEqual({ x: 338, y: 40, w: 330, h: 96 });
    expect(g.stars).toEqual({ x: 692, y: 40, w: 220, h: 96 });
    expect(g.settings).toEqual({ x: 936, y: 36, w: 120, h: 120 });
    expect(g.ribbon).toMatchObject({ y: 176, w: 560 });
    expect(g.ribbon.x + g.ribbon.w / 2).toBe(540);
    expect(g.progress).toEqual({ x: 240, y: 312, w: 600, h: 48 });
    expect(g.play).toEqual({ x: 180, y: 1480, w: 720, h: 176 });
    expect(g.nav.y).toBe(1720);
    expect(g.navTabs.map((r) => r.x)).toEqual([0, 216, 432, 648, 864]);
    expect(bottom(g.structure)).toBe(1180);
    expect(g.structure.x + g.structure.w / 2).toBe(540);
    expect(g.sideRight(0)).toEqual({ x: 904, y: 420, w: 152, h: 152 });
    expect(g.character).toEqual({ x: 60, y: 880, w: 300, h: 360 });
    expect(g.skyBand.h).toBe(0);
    expect(g.groundBand.h).toBe(0);
  });

  for (const H of HS) {
    it(`UX 3 home layout at H ${H}: anchors, thumb zone and the grass under the structure`, () => {
      const g = homeLayout(TOKENS, H);
      const shift = (H - BASE_H) * HL.expandShare;
      // top group fixed, bottom group bottom-anchored, middle group shifted
      expect(g.lives.y).toBe(HL.topBarY);
      expect(H - bottom(g.play)).toBe(HL.playButtonBottomPx);
      expect(H - (g.nav.y + HL.navH)).toBe(HL.navBottomPx);
      expect(bottom(g.structure)).toBeCloseTo(HL.structureBaseY + shift);
      // UX §0.2: the primary action is in the comfortable zone (y ≥ 1400 at FIT; bottom 27 % at any H)
      expect(g.play.y).toBeGreaterThanOrEqual(H - 0.27 * BASE_H - 1);
      // UX §3 EXPAND note: at least 300 px of grass between the structure and the button
      expect(g.play.y - bottom(g.structure)).toBeGreaterThanOrEqual(300);
      // the art moves with the structure: its base keeps 124 px under the art's 1056 px grass line
      expect(bottom(g.structure) - g.artY).toBe(HL.structureBaseY);
      expect(g.skyBand.h + BASE_H + g.groundBand.h).toBeCloseTo(H);
      // the ground band hides under the navigation bar (its top + the raised tab never shows grass gaps)
      expect(g.groundBand.y).toBeGreaterThanOrEqual(g.play.y);
      // nothing of the top bar touches the ribbon, the ribbon not the progress bar
      expect(rectsOverlap(g.lives, g.ribbon)).toBe(false);
      expect(rectsOverlap(g.ribbon, g.progress)).toBe(false);
      expect(rectsOverlap(g.play, g.nav)).toBe(false);
      // UX §0.1: the button and the tabs are frequent targets (≥ 144), the top bar items ≥ 96 + pad
      expect(g.play.h).toBeGreaterThanOrEqual(144);
      for (const tab of g.navTabs) expect(Math.min(tab.w, tab.h)).toBeGreaterThanOrEqual(144);
      expect(g.navTabs.reduce((s, r) => s + r.w, 0)).toBe(1080);
    });
  }

  it('UX 3 home layout: the tag overhangs the button by 24 px, the more-soon band clears it', () => {
    const g = homeLayout(TOKENS, 2337);
    expect(g.tag.x).toBe(g.play.x - 24);
    expect(bottom(g.tag)).toBe(g.play.y + 24);
    const band = g.moreSoon(true);
    expect(bottom(band)).toBeLessThan(g.tag.y);
    expect(bottom(g.moreSoon(false))).toBeLessThan(g.play.y);
    expect(band.x + band.w / 2).toBe(540);
  });
});

describe('UX 6.1 win v2 layout', () => {
  const full = { bonus: true, trowel: true, star: true };

  it('UX 6.1 win layout at H 1920 matches the wireframe numbers', () => {
    const g = winLayout(TOKENS, 1920, full);
    expect(g.ribbon).toMatchObject({ x: 160, y: 300, w: 760 });
    expect(g.card).toEqual({ x: 240, y: 440, w: 600, h: 600 });
    expect(g.character).toEqual({ x: 0, y: 640, w: 300, h: 400 });
    expect(g.bonus).toEqual({ x: 160, y: 1080, w: 760, h: 64 });
    expect(g.trowel).toEqual({ x: 160, y: 1160, w: 760, h: 64 });
    // with the trowel row the capsules move down 80 px (1180 → 1260)
    expect(g.starCapsule).toEqual({ x: 220, y: 1260, w: 300, h: 96 });
    expect(g.coinCapsule).toEqual({ x: 560, y: 1260, w: 300, h: 96 });
    expect(g.button).toEqual({ x: 220, y: 1600, w: 640, h: 176 });
    // Tuna covers the card's left edge by 60 px
    expect(g.character.x + g.character.w - g.card.x).toBe(60);
  });

  it('UX 6.1 without the trowel row the capsules stay at 1180; the loop shows the coin capsule alone, centred', () => {
    const noTrowel = winLayout(TOKENS, 1920, { bonus: true, trowel: false, star: true });
    expect(noTrowel.trowel).toBeNull();
    expect(noTrowel.coinCapsule.y).toBe(WL.rewardsY);
    const loop = winLayout(TOKENS, 1920, { bonus: false, trowel: false, star: false });
    expect(loop.bonus).toBeNull();
    expect(loop.starCapsule).toBeNull();
    expect(loop.coinCapsule).toEqual({ x: 390, y: 1180, w: 300, h: 96 });
  });

  for (const H of HS) {
    it(`UX 6.1 win layout at H ${H}: middle group shifts by half the surplus, the button stays bottom-anchored`, () => {
      const g = winLayout(TOKENS, H, full);
      const shift = (H - BASE_H) * WL.expandShare;
      expect(g.ribbon.y).toBeCloseTo(WL.ribbonY + shift);
      expect(g.card.y).toBeCloseTo(WL.cardY + shift);
      expect(H - bottom(g.button)).toBe(WL.buttonBottomPx);
      const lowest = Math.max(bottom(g.coinCapsule), bottom(g.starCapsule as Rect));
      expect(lowest).toBeLessThan(g.button.y);
      expect(bottom(g.card)).toBeLessThanOrEqual((g.bonus as Rect).y);
      expect(bottom(g.ribbon)).toBeLessThanOrEqual(g.card.y + 1);
      expect(g.button.h).toBeGreaterThanOrEqual(144);
    });
  }

  it('UX 6.1 rows follow the rewards: Bonus İnşaat, leftover trowels, the star', () => {
    expect(winRows(winRewards({ difficulty: 'normal', movesLeft: 3, trowels: 0 }))).toEqual({
      bonus: true,
      trowel: false,
      star: true,
    });
    expect(winRows(winRewards({ difficulty: 'easy', movesLeft: 0, trowels: 2 }))).toEqual({
      bonus: false,
      trowel: true,
      star: true,
    });
    const replay = {
      baseCoins: 20,
      bonusMoves: 0,
      bonusCoins: 0,
      trowels: 0,
      trowelCoins: 0,
      stars: 0,
      totalCoins: 20,
    };
    expect(winRows(replay)).toEqual({ bonus: false, trowel: false, star: false });
  });
});
