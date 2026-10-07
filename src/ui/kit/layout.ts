/**
 * Geometry of the home v2 and win v2 screens (UX_FLOWS §3 and §6.1 wireframes, `tokens.layout.home` / `layout.win`;
 * TECH §2R.8). Pure: no Phaser, so the anchor contract is unit-tested ("UX 3 home layout …", "UX 6.1 …").
 *
 * Anchors (UX §0.1, TECH §10.1): the top bar, area ribbon, progress bar and side icons are top-anchored; the "Bölüm N"
 * button, the bottom navigation and the win "Devam" are bottom-anchored (`*BottomPx`); the middle group (structure,
 * characters; win ribbon, card, Tuna, rows, capsules) moves down by `(H − 1920) × expandShare`.
 *
 * Backgrounds: the 1080 × 1920 art moves with the middle group (`artY` = the same shift), so the structure keeps its
 * place on the art's grass at every height (UX §3: base 124 px under the grass line). The surplus splits into a band
 * above the art (`skyBand`, the art's top colour) and one below it (`groundBand`, under the navigation bar). A
 * bottom-anchored art would put the grass line 0.5 × surplus under the structure base (≈ 85 px of air at 390 × 844;
 * WP-F note), so it is not used.
 */
import type { Rect } from '../../theme/layout.ts';
import type { Tokens } from '../../theme/tokens.ts';
import type { WinRewards } from '../rewards.ts';

/** Height the wireframes and the art are drawn for (UX §0.1). */
export const BASE_H = 1920;

export interface HomeLayout {
  readonly W: number;
  readonly H: number;
  /** Middle group shift `(H − 1920) × layout.home.expandShare`. */
  readonly shift: number;
  /** Top of the 1080 × 1920 background art. */
  readonly artY: number;
  readonly skyBand: Rect;
  readonly groundBand: Rect;
  readonly lives: Rect;
  readonly coins: Rect;
  readonly stars: Rect;
  readonly settings: Rect;
  /** Area ribbon body: centre x, top y, body width, height (`kit.ribbon.heightPx`). */
  readonly ribbon: Rect;
  readonly progress: Rect;
  /** Side icon slot k (0 = top) on the right / left edge (UX §3 "Kenar ikonları"). */
  sideRight(k: number): Rect;
  sideLeft(k: number): Rect;
  /** Structure box (`structureMaxW × structureMaxH`, centred on `structureCenterX`, bottom on the base line). */
  readonly structure: Rect;
  /** Character corner (Tuna + Kepçe), bottom on `characterBaseY`. */
  readonly character: Rect;
  readonly play: Rect;
  /** Difficulty tag: over the button's top-left corner, sticking out 24 px to the left and 24 px into the button. */
  readonly tag: Rect;
  /** `home.moreSoon` band (blue ribbon, 80 px) above the button; one tag height higher when a tag shows. */
  moreSoon(withTag: boolean): Rect;
  /** Bottom navigation bar (from its top edge to the screen bottom) and its tab cells (5 × `navTabW`). */
  readonly nav: Rect;
  readonly navTabs: readonly Rect[];
}

/**
 * The character corner keeps its FIT distance to the "Bölüm N" button at every height (share 1 of the surplus, the
 * structure keeps 0.5): on a tall phone Tuna and Kepçe stand on the foreground lawn in front of the structure instead
 * of leaving ≈ 450 px of empty grass above the button (390 × 844 review, 2026-10-07; design-lead to confirm, REVIEW_LOG).
 */
export const CHARACTER_EXPAND_SHARE = 1;

/** Tag overhang (UX §3 "düğmenin sol üstüne 24 px taşar"). */
export const TAG_OVERHANG_PX = 24;
/** `home.moreSoon` band height and gap above the button (UX §3 "küçük şerit 480 × 80"). */
export const MORE_SOON_H = 80;
export const MORE_SOON_W = 480;
const MORE_SOON_GAP = 28;

export function homeLayout(tokens: Tokens, H: number): HomeLayout {
  const L = tokens.layout.home;
  const W = tokens.meta.designWidth;
  const shift = Math.max(0, H - BASE_H) * L.expandShare;
  const artY = shift;
  const play: Rect = {
    x: (W - L.playButtonW) / 2,
    y: H - L.playButtonBottomPx - L.playButtonH,
    w: L.playButtonW,
    h: L.playButtonH,
  };
  const navTop = H - L.navBottomPx - L.navH;
  const tag: Rect = {
    x: play.x - TAG_OVERHANG_PX,
    y: play.y - L.levelTagH + TAG_OVERHANG_PX,
    w: L.levelTagW,
    h: L.levelTagH,
  };
  const tabs: Rect[] = [];
  const tabsW = L.navTabW * 5;
  for (let k = 0; k < 5; k++)
    tabs.push({ x: (W - tabsW) / 2 + k * L.navTabW, y: navTop, w: L.navTabW, h: L.navH });
  return {
    W,
    H,
    shift,
    artY,
    skyBand: { x: 0, y: 0, w: W, h: artY },
    groundBand: { x: 0, y: artY + BASE_H, w: W, h: Math.max(0, H - artY - BASE_H) },
    lives: { x: L.livesX, y: L.topBarY, w: L.livesW, h: L.topBarH },
    coins: { x: L.coinsX, y: L.topBarY, w: L.coinsW, h: L.topBarH },
    stars: { x: L.starsX, y: L.topBarY, w: L.starsW, h: L.topBarH },
    settings: { x: L.settingsX, y: L.settingsY, w: L.settingsSize, h: L.settingsSize },
    ribbon: {
      x: W / 2 - L.areaRibbonW / 2,
      y: L.areaRibbonY,
      w: L.areaRibbonW,
      h: tokens.kit.ribbon.heightPx,
    },
    progress: { x: L.progressX, y: L.progressY, w: L.progressW, h: tokens.kit.progress.heightPx },
    sideRight: (k) => ({ x: L.sideRightX, y: L.sideFirstY + k * L.sideStepY, w: L.sideSize, h: L.sideSize }),
    sideLeft: (k) => ({ x: L.sideLeftX, y: L.sideFirstY + k * L.sideStepY, w: L.sideSize, h: L.sideSize }),
    structure: {
      x: L.structureCenterX - L.structureMaxW / 2,
      y: L.structureBaseY + shift - L.structureMaxH,
      w: L.structureMaxW,
      h: L.structureMaxH,
    },
    character: {
      x: L.characterX,
      y: L.characterBaseY + (H - BASE_H) * CHARACTER_EXPAND_SHARE - L.characterH,
      w: L.characterW,
      h: L.characterH,
    },
    play,
    tag,
    moreSoon: (withTag) => ({
      x: (W - MORE_SOON_W) / 2,
      y: (withTag ? tag.y : play.y) - MORE_SOON_GAP - MORE_SOON_H,
      w: MORE_SOON_W,
      h: MORE_SOON_H,
    }),
    nav: { x: 0, y: navTop, w: W, h: H - navTop },
    navTabs: tabs,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Win v2 (UX §6.1)

export interface WinRows {
  /** Bonus İnşaat row (moves left turned into coins; not in the loop). */
  readonly bonus: boolean;
  /** Leftover Golden Trowel row (n ≥ 1; not in the loop). */
  readonly trowel: boolean;
  /** ★ capsule (first win; not in the loop). */
  readonly star: boolean;
}

/** Which rows and capsules a reward set shows (UX §6.1 / §6 "Döngü": the loop replay has no star, bonus or trowel). */
export function winRows(rewards: WinRewards): WinRows {
  return { bonus: rewards.bonusMoves > 0, trowel: rewards.trowels > 0, star: rewards.stars > 0 };
}

export interface WinLayout {
  readonly W: number;
  readonly H: number;
  readonly shift: number;
  readonly artY: number;
  readonly skyBand: Rect;
  readonly groundBand: Rect;
  /** Gold ribbon body (centre x = W / 2). */
  readonly ribbon: Rect;
  readonly card: Rect;
  readonly character: Rect;
  readonly bonus: Rect | null;
  readonly trowel: Rect | null;
  readonly starCapsule: Rect | null;
  readonly coinCapsule: Rect;
  readonly button: Rect;
}

export function winLayout(tokens: Tokens, H: number, rows: WinRows): WinLayout {
  const L = tokens.layout.win;
  const W = tokens.meta.designWidth;
  const shift = Math.max(0, H - BASE_H) * L.expandShare;
  const capH = tokens.kit.capsule.heightPx;
  const rowX = (W - L.bonusW) / 2;
  const capY = L.rewardsY + shift + (rows.trowel ? L.rewardsShiftPx : 0);
  const pairW = 2 * L.rewardCapsuleW + L.rewardGapPx;
  const pairX = (W - pairW) / 2;
  return {
    W,
    H,
    shift,
    artY: shift,
    skyBand: { x: 0, y: 0, w: W, h: shift },
    groundBand: { x: 0, y: shift + BASE_H, w: W, h: Math.max(0, H - shift - BASE_H) },
    ribbon: {
      x: (W - L.ribbonW) / 2,
      y: L.ribbonY + shift,
      w: L.ribbonW,
      h: tokens.kit.ribbon.heightPx,
    },
    card: { x: (W - L.cardSize) / 2, y: L.cardY + shift, w: L.cardSize, h: L.cardSize },
    character: { x: L.characterX, y: L.characterY + shift, w: L.characterW, h: L.characterH },
    bonus: rows.bonus ? { x: rowX, y: L.bonusY + shift, w: L.bonusW, h: L.bonusH } : null,
    trowel: rows.trowel ? { x: rowX, y: L.trowelRowY + shift, w: L.bonusW, h: L.trowelRowH } : null,
    starCapsule: rows.star ? { x: pairX, y: capY, w: L.rewardCapsuleW, h: capH } : null,
    // UX §6.1 "Döngü": the coin capsule alone sits in the middle (x 390, i.e. centred)
    coinCapsule: rows.star
      ? { x: pairX + L.rewardCapsuleW + L.rewardGapPx, y: capY, w: L.rewardCapsuleW, h: capH }
      : { x: (W - L.rewardCapsuleW) / 2, y: capY, w: L.rewardCapsuleW, h: capH },
    button: { x: (W - L.buttonW) / 2, y: H - L.buttonBottomPx - L.buttonH, w: L.buttonW, h: L.buttonH },
  };
}
