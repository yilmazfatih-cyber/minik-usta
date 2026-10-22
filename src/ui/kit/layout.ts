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
  /**
   * Top bar (ART_REFERENCE §3.4 "kapsül düzeni", DS3-02): two separate 300 × 88 capsules — lives at x 160, coins at
   * x 500 (gap 40) — and the Ø 104 settings tool at x 936. The stars are no capsule: the count sits under the progress
   * bar's end star (`ProgressBar` `endCount`). x 160 leaves the Faz 4 avatar square its place (§9.2, MVP hidden).
   */
  readonly lives: Rect;
  readonly coins: Rect;
  readonly settings: Rect;
  /** Area ribbon body: centre x, top y, body width, height (`kit.ribbon.heightPx`). */
  readonly ribbon: Rect;
  /** Meta progress bar (ART_REFERENCE §3.8, h 84). */
  readonly progress: Rect;
  /** Side event bubble k (0 = top) on the right / left edge (ART_REFERENCE §9.2: Ø 176 + the 56 px label strip). */
  sideRight(k: number): Rect;
  sideLeft(k: number): Rect;
  /** Structure box (`structureMaxW × structureMaxH`, centred on `structureCenterX`, bottom on the base line). */
  readonly structure: Rect;
  /**
   * Character group (ART_REFERENCE §9.2 "karakter grubu"): Tuna full figure in front at the left, Kepçe at her feet,
   * Usta Dede's bust behind at the right; every box bottom on `characterBaseY` (24 px behind the button's top edge),
   * the button's own area stays empty.
   */
  readonly character: Rect;
  readonly tuna: Rect;
  readonly kepce: Rect;
  readonly dede: Rect;
  readonly play: Rect;
  /** Difficulty tag: over the button's top-left corner, sticking out 24 px to the left and 24 px into the button. */
  readonly tag: Rect;
  /** `home.moreSoon` band (blue ribbon, 80 px) above the button; one tag height higher when a tag shows. */
  moreSoon(withTag: boolean): Rect;
  /** Bottom navigation bar (from its top edge to the screen bottom) and its tab cells (5 × `navTabW`). */
  readonly nav: Rect;
  readonly navTabs: readonly Rect[];
}

/** DS-06: the "Yakında" balloon keeps this gap between its top and the "Bölüm N" button's bottom. */
export const BALLOON_BUTTON_GAP_PX = 8;
/** DS-06: inside the nav bar the balloon hangs from this far under the tab point, its tail up at the tab icon. */
export const NAV_BALLOON_DROP_PX = 96;

export interface BalloonPlacement {
  readonly at: { readonly x: number; readonly y: number };
  readonly dir: 'down' | 'up';
}

/**
 * DS-06: where a locked tab's "Yakında" balloon (height `balloonH`, tail included) opens. Above the tab (`dir: 'down'`,
 * tail tip at the tab point = the cell's top edge) only when its top clears the play button's bottom edge by
 * `BALLOON_BUTTON_GAP_PX`; else it drops into the nav bar (`dir: 'up'`: the tail tip `NAV_BALLOON_DROP_PX` under the
 * tab point, inside the icon, the body over the tab's label) so the button's text is never covered. The drop is clamped
 * so the balloon ends at the bar's bottom edge at the latest (HintBubble clamps x only; with the UX §3 tokens the bar
 * is 176 px and the balloon 122 px, so the clamp is what keeps it on screen).
 */
export function lockedTabBalloon(
  play: Rect,
  nav: Rect,
  tab: { readonly x: number; readonly y: number },
  balloonH: number,
): BalloonPlacement {
  const fits = tab.y - balloonH >= play.y + play.h + BALLOON_BUTTON_GAP_PX;
  if (fits) return { at: tab, dir: 'down' };
  const y = Math.min(tab.y + NAV_BALLOON_DROP_PX, nav.y + nav.h - balloonH);
  return { at: { x: tab.x, y }, dir: 'up' };
}

/** Tag overhang (UX §3 "düğmenin sol üstüne 24 px taşar"). */
export const TAG_OVERHANG_PX = 24;
/** `home.moreSoon` band height and gap above the button (UX §3 "küçük şerit 480 × 80"). */
export const MORE_SOON_H = 80;
export const MORE_SOON_W = 480;
const MORE_SOON_GAP = 28;

/** ART_REFERENCE §9.2: event bubble label strip height + gap, and the vertical step between side bubbles. */
export const SIDE_LABEL_H = 56;
const SIDE_LABEL_GAP = 8;
const SIDE_STEP_GAP = 40;
/** Meta progress bar top (under the area ribbon; ART_REFERENCE §9.2 keeps the v2 column). */
const PROGRESS_Y = 300;
/**
 * ART_REFERENCE §3.4 "kapsül düzeni" (07/ref-03): capsule 300 × 88, lives x 160, coins x 500, settings 104 at x 936.
 * Code constants until design-lead adds them to `kit.v3.screen.home` (tokens.json is design-lead's; REVIEW_LOG).
 */
export const TOP_BAR = Object.freeze({ capsuleW: 300, livesX: 160, coinsX: 500, settingsX: 936 });
/** ART_REFERENCE §9.2: Usta Dede's full figure (`chr_dede_stand`, r4) at 0,9 of Tuna's figure, feet on her ground line. */
export const DEDE_SCALE = 0.9;
/** The characters' feet sit this far below the button's top edge (behind it). */
const CHARACTER_BEHIND_PX = 24;

export function homeLayout(tokens: Tokens, H: number): HomeLayout {
  const L = tokens.layout.home;
  const V = tokens.kit.v3.screen.home;
  const W = tokens.meta.designWidth;
  const shift = Math.max(0, H - BASE_H) * L.expandShare;
  const artY = shift;
  const play: Rect = {
    x: (W - V.playW) / 2,
    y: H - V.playBottomPx - V.playH,
    w: V.playW,
    h: V.playH,
  };
  const navTop = H - L.navBottomPx - V.navH;
  const tag: Rect = {
    x: play.x - TAG_OVERHANG_PX,
    y: play.y - L.levelTagH + TAG_OVERHANG_PX,
    w: L.levelTagW,
    h: L.levelTagH,
  };
  const tabs: Rect[] = [];
  const tabsW = L.navTabW * 5;
  for (let k = 0; k < 5; k++)
    tabs.push({ x: (W - tabsW) / 2 + k * L.navTabW, y: navTop, w: L.navTabW, h: V.navH });
  const capH = V.capsuleH;
  const capY = L.topBarY;
  const side = V.eventBubblePx;
  const sideStep = side + SIDE_LABEL_GAP + SIDE_LABEL_H + SIDE_STEP_GAP;
  const sideBox = (x: number, k: number): Rect => ({
    x,
    y: L.sideFirstY + k * sideStep,
    w: side,
    h: side + SIDE_LABEL_GAP + SIDE_LABEL_H,
  });
  // character group (ART_REFERENCE §9.2): Tuna 300 × 480 figure at 1,1, Kepçe 300 × 206 at 0,85, Dede's 300 × 480
  // figure at 0,9 of Tuna behind at the right (DS3-03 permanent: `chr_dede_stand`, its contact shadow in the file)
  const baseY = play.y + CHARACTER_BEHIND_PX;
  const tunaH = 528;
  const tunaW = Math.round((tunaH * 300) / 480);
  const tuna: Rect = { x: V.characterGroupX + 20, y: baseY - tunaH, w: tunaW, h: tunaH };
  const kepceW = 255;
  const kepceH = Math.round((kepceW * 206) / 300);
  const kepce: Rect = { x: tuna.x + tunaW - 70, y: baseY + 6 - kepceH, w: kepceW, h: kepceH };
  const dedeH = Math.round(tunaH * DEDE_SCALE);
  const dedeW = Math.round((dedeH * 300) / 480);
  const dede: Rect = { x: W - V.characterGroupX - dedeW - 10, y: baseY - dedeH, w: dedeW, h: dedeH };
  const character: Rect = {
    x: V.characterGroupX,
    y: baseY - V.characterGroupH,
    w: V.characterGroupW,
    h: V.characterGroupH,
  };
  return {
    W,
    H,
    shift,
    artY,
    skyBand: { x: 0, y: 0, w: W, h: artY },
    groundBand: { x: 0, y: artY + BASE_H, w: W, h: Math.max(0, H - artY - BASE_H) },
    lives: { x: TOP_BAR.livesX, y: capY, w: TOP_BAR.capsuleW, h: capH },
    coins: { x: TOP_BAR.coinsX, y: capY, w: TOP_BAR.capsuleW, h: capH },
    settings: {
      x: TOP_BAR.settingsX,
      y: capY + (capH - V.settingsPx) / 2,
      w: V.settingsPx,
      h: V.settingsPx,
    },
    ribbon: {
      x: W / 2 - L.areaRibbonW / 2,
      y: L.areaRibbonY,
      w: L.areaRibbonW,
      h: tokens.kit.ribbon.heightPx,
    },
    progress: { x: L.progressX, y: PROGRESS_Y, w: L.progressW, h: tokens.kit.v3.progress.metaH },
    sideRight: (k) => sideBox(W - L.sideLeftX - side, k),
    sideLeft: (k) => sideBox(L.sideLeftX, k),
    structure: {
      x: L.structureCenterX - L.structureMaxW / 2,
      y: L.structureBaseY + shift - L.structureMaxH,
      w: L.structureMaxW,
      h: L.structureMaxH,
    },
    character,
    tuna,
    kepce,
    dede,
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
  const capH = tokens.kit.v3.capsule.homeH;
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
