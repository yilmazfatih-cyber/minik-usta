/**
 * Typed loader for the design tokens (docs/TECH_DESIGN.md §10.2; D-003, R-04).
 *
 * `tokens.json` belongs to design-lead and is READ ONLY for code. This module validates it once with `zod/mini` and
 * exposes the parsed, deeply frozen object as `TOKENS`. A missing or malformed key throws at module load (a boot error
 * in development, TECH §10.2). The schema lists only paths that exist in tokens.json; `_doc` keys and the whole
 * `check.*` group are stripped (`check.*` is read by tests/theme/tokens.test.ts only, never by code).
 */
import * as z from 'zod/mini';
import rawTokens from './tokens.json' with { type: 'json' };
import { COLOR_CODES } from '../core/types.ts';

export const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

const num = z.number();
const hex = z.string().check(z.regex(HEX_RE, 'expected #RRGGBB'));
const str = z.string();
const numList = z.array(num);

/** `{ [k]: schema }` for a fixed key list (typed, so every listed key is required and typed). */
function shapeOf<const K extends string, S extends z.ZodMiniType>(
  keys: readonly K[],
  schema: S,
): { [P in K]: S } {
  const out = {} as { [P in K]: S };
  for (const k of keys) out[k] = schema;
  return out;
}
const nums = <const K extends string>(keys: readonly K[]) => z.object(shapeOf(keys, num));
const hexes = <const K extends string>(keys: readonly K[]) => z.object(shapeOf(keys, hex));

const colorRecord = z.record(z.enum(COLOR_CODES), hex);

const ShadowSpec = z.object({ x: num, y: num, blur: num, color: hex, alpha: num });

const FONT_ROLES = ['display', 'h1', 'h2', 'button', 'body', 'small', 'caption'] as const;
const CHAPTERS = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'] as const;
const CHAPTER_COLORS = ['skyTop', 'skyBottom', 'cloud', 'far', 'mid', 'near'] as const;

const DURATION_KEYS = [
  'pick',
  'fingerOffset',
  'blockedShake',
  'bump',
  'craneEnter',
  'wallPass',
  'ghostSwitch',
  'cancel',
  'setYard',
  'land',
  'placeOk',
  'placeBad',
  'mortarStick',
  'streakPip',
  'combo',
  'goldTrowel',
  'segment',
  'scaffoldFade',
  'truck',
  'queue',
  'bounceToQueue',
  'reshuffle',
  'truckHelpUnchain',
  'truckHelpDeliver',
  'gapRail',
  'clamp',
  'gapSqueeze',
  'shutter',
  'tick',
  'slider',
  'paintGate',
  'unlock',
  'crateHit',
  'crateBreak',
  'bagTear',
  'chainBreak',
  'wetDry',
  'keyPickup',
  'screwCollect',
  'debris',
  'glassBreak',
  'balloonSettle',
  'steer',
  'carousel',
  'elevator',
  'reveal',
  'movesTick',
  'lastMovesPulse',
  'offer',
  'movesAdd',
  'goalDone',
  'siteClosedRibbon',
  'goalNudge',
  'win',
  'winGlow',
  'winRibbon',
  'winConfetti',
  'bonusPerMove',
  'bonusMax',
  'outOfMoves',
  'lifeLost',
  'starFly',
  'boosterSelect',
  'hammer',
  'craneBooster',
  'brush',
  'undo',
  'thermos',
  'trowelStart',
  'openShutter',
  'streakBonus',
  'buttonPress',
  'buttonRelease',
  'popupOpen',
  'popupClose',
  'tab',
  'lockedShake',
  'lockedHint',
  'coinFly',
  'townBuild',
  'bridgeStep',
  'bridgeFall',
  'rankMove',
  'splashLogo',
  'splashMin',
  'panelEnter',
  'ftuePanelAuto',
  'reducedFade',
  'loadingShowDelay',
  'hint',
  'supportFlash',
  'frontShift',
  'resumeToast',
  'chestLidOpen',
  'chestItemStagger',
  'dailyClaim',
  'ceilingSettle',
  // Faz 2R (JUICE §8, UX §3, §6.1, §13.1)
  'homeEnter',
  'homeToLevel',
  'progressFill',
  'structureReveal',
  'yardClear',
  'starBurst',
  'shineSweep',
  'shineEvery',
  'ribbonDrop',
  'rewardCount',
  'sparkle',
  'placeSheen',
  'liftGlow',
  'navLockedHint',
  'teardown',
  'teardownStagger',
  'teardownSettle',
  'holdableFade',
  'truckPreviewSlide',
  // 2026-10-08 screen review (DS-14 Söküm line, UX §5.2 TrowelPicker target pulse)
  'teardownLine',
  'targetPulse',
] as const;

/** ZzFX 1.4.0 `buildSamples` parameter list (≤ 21 values, tokens `audio._doc`). */
const ZzfxParams = z.array(num).check(z.maxLength(21));
const SFX_KEYS = [
  'sfx_pick',
  'sfx_blocked',
  'sfx_bump',
  'sfx_whoosh',
  'sfx_ghost_ok',
  'sfx_cancel',
  'sfx_set_yard',
  'sfx_fall',
  'sfx_land',
  'sfx_place_ok',
  'sfx_place_bad',
  'sfx_bounce',
  'sfx_queue',
  'sfx_offer',
  'sfx_coin',
  'sfx_life_lost',
  'sfx_button',
  'sfx_popup',
  'sfx_close',
  'sfx_tick',
  'sfx_streak_pip',
  'sfx_trowel',
  'sfx_clamp',
  'sfx_teardown',
] as const;

/**
 * tokens.json keys deliberately not typed (tests/theme/tokens.test.ts skips them). Empty since the 2026-10-08 screen
 * review: `sfx_teardown` got its ASSET §13 row and is typed.
 */
export const PENDING_TOKEN_KEYS: readonly string[] = [];

/**
 * tokens.json keys the code no longer reads and the schema no longer types (`meta._docRetire`, 2026-10-08): the order is
 * code-lead drops them from the schema first, then design-lead deletes them from tokens.json (deleting a key the schema
 * still requires is a boot error). tests/theme/tokens.test.ts skips them while they are still in the file.
 */
export const RETIRED_TOKEN_KEYS: readonly string[] = [
  'alpha.tutorialOverlay',
  'alpha.tutorialSoftOverlay',
  'duration.tutorialHandLoop',
  'duration.tutorialHandPause',
  'duration.spotlightPulse',
];
const SEQ_KEYS = [
  'sfx_segment',
  'sfx_combo',
  'sfx_truck_horn',
  'sfx_lastmoves',
  'sfx_moves_add',
  'sfx_goal_done',
  'sfx_out_of_moves',
  'sfx_chest',
  'music_win',
  'sfx_gap_rail',
  'sfx_locked',
  'sfx_hammer',
] as const;
/** `[startMs, params]` steps mixed into one buffer (TECH §11.6). */
const SeqSteps = z.array(z.tuple([num, ZzfxParams]));

// ---------------------------------------------------------------------------------------------------------------
// Faz 2R visual language v2 (ART §3A, §7.1, §14, §15; UX §3, §5.8, §5.9, §6.1, §13.1; TECH §2R.7)

/** ART §3A / §3A.5 candy block v2 (`blockV2.*`). */
const BlockV2 = z.object({
  ...shapeOf(
    [
      'insetPx',
      'cornerRadiusRatio',
      'innerCornerRadiusRatio',
      'outlinePx',
      'lipPx',
      'pillowInsetRatio',
      'pillowOpenInsetRatio',
      'pillowRadiusRatio',
      'lightMix',
      'gradientStop',
      'bottomFactor',
      'darkFactor',
      'outlineFactor',
      'grooveFactor',
      'glowMix',
      'innerShadeRatio',
      'innerShadeAlpha',
      'glossRotDeg',
      'glossAlpha',
      'glossDotAlpha',
      'symbolSizeRatio',
      'symbolCenterYRatio',
      'symbolWhiteAlpha',
      'embossDarkOffsetPx',
      'embossDarkAlpha',
      'embossLightOffsetPx',
      'embossLightAlpha',
      'placedSheenAlpha',
      'liftGlowPx',
      'liftGlowAlpha',
      'studDiameterRatio',
      'studMarginPx',
      'studSidePx',
      'studRimPx',
      'studRimAlpha',
      'studGlossWidthPx',
      'studGlossAlpha',
      'studDotAlpha',
      'studSymbolMaxRatio',
    ] as const,
    num,
  ),
  /** `[cx, cy, rx, ry]` as ratios of the pillow w / h. */
  glossEllipse: z.tuple([num, num, num, num]),
  /** `[cx, cy, r]`: centre as pillow ratios, r as a ratio of the cell. */
  glossDot: z.tuple([num, num, num]),
  studEnabled: z.boolean(),
  /** `[radius ratio of d, start°, end°]`. */
  studGlossArc: z.tuple([num, num, num]),
  /** `[radius ratio of d, angle°, r px]`. */
  studDot: z.tuple([num, num, num]),
  notHoldableTint: hex,
});

/** Colour quadruple of a kit button (ART §2.6). */
const ButtonQuad = hexes(['top', 'base', 'lip', 'stroke']);
/** Colour quadruple of a ribbon (ART §14.3). */
const RibbonQuad = hexes(['top', 'base', 'dark', 'stroke']);
export const KIT_BUTTON_COLORS = ['green', 'orange', 'blue', 'cream', 'red', 'grey'] as const;
export const KIT_RIBBON_COLORS = ['orange', 'gold', 'blue'] as const;

/**
 * ART_REFERENCE v1 (R2-13, 2026-10-14): the `kit.v3` group measured from the owner's reference screens — the visual
 * v3 kit (theme/draw/kitV3.ts), the v3 text styles (ui/kit/text.ts), the v3 screen layouts (theme/layout.ts,
 * ui/kit/layout.ts) and the loading / level-start / reward screens read it. Typed key by key (a missing key is a boot
 * error that names the path, TECH §10.2); `_doc*` keys are stripped like everywhere else.
 */
const KitV3 = z.object({
  palette: z.object({
    ...shapeOf(['overlayAlpha'] as const, num),
    ...shapeOf(
      [
        'gameBase',
        'gameGlow',
        'metaBase',
        'metaBottom',
        'headerTop',
        'headerBottom',
        'headerEdge',
        'headerShadow',
        'skyTop',
        'skyMid',
        'skyLow',
        'skyHorizon',
        'loadTop',
        'loadMid',
        'loadLight',
        'loadCloud',
        'overlay',
        'woodBase',
        'woodDark',
        'cream',
        'creamSoft',
        'navy',
        'blueTop',
        'blueBase',
        'gold',
        'goldLight',
        'goldDark',
        'goldStroke',
        'cyan',
        'cyanDeep',
        'pink',
        'checkGreen',
        'checkStroke',
        'heartTop',
        'heartBottom',
      ] as const,
      hex,
    ),
  }),
  buttonColor: z.object({
    green: hexes([
      'bevel',
      'bevelLine',
      'faceTop',
      'faceMid',
      'faceBottom',
      'lip',
      'stroke',
      'text',
      'textStroke',
    ] as const),
    greenSoft: hexes([
      'bevel',
      'bevelLine',
      'faceTop',
      'faceMid',
      'faceBottom',
      'lip',
      'stroke',
      'text',
      'textStroke',
    ] as const),
    orange: hexes([
      'bevel',
      'bevelLine',
      'faceTop',
      'faceMid',
      'faceBottom',
      'lip',
      'stroke',
      'text',
      'textStroke',
    ] as const),
    blue: hexes([
      'bevel',
      'bevelLine',
      'faceTop',
      'faceMid',
      'faceBottom',
      'lip',
      'stroke',
      'text',
      'textStroke',
    ] as const),
    purple: hexes([
      'bevel',
      'bevelLine',
      'faceTop',
      'faceMid',
      'faceBottom',
      'lip',
      'stroke',
      'text',
      'textStroke',
    ] as const),
    cream: hexes([
      'bevel',
      'bevelLine',
      'faceTop',
      'faceMid',
      'faceBottom',
      'lip',
      'stroke',
      'text',
      'textStroke',
    ] as const),
    grey: hexes([
      'bevel',
      'bevelLine',
      'faceTop',
      'faceMid',
      'faceBottom',
      'lip',
      'stroke',
      'text',
      'textStroke',
    ] as const),
  }),
  button: z.object({
    ...shapeOf(
      [
        'pressedDropPx',
        'pressedLipRatio',
        'pressedScale',
        'shadowYPx',
        'shadowAlpha',
        'shadowBlurPx',
        'textStrokeEm',
        'textStrokeMinPx',
        'textShadowEm',
        'glossAlpha',
      ] as const,
      num,
    ),
    L: nums([
      'w',
      'h',
      'r',
      'strokePx',
      'plateInsetPx',
      'bevelPx',
      'bevelLinePx',
      'lipPx',
      'fontPx',
    ] as const),
    M: nums([
      'w',
      'h',
      'r',
      'strokePx',
      'plateInsetPx',
      'bevelPx',
      'bevelLinePx',
      'lipPx',
      'fontPx',
    ] as const),
    S: nums([
      'w',
      'h',
      'r',
      'strokePx',
      'plateInsetPx',
      'bevelPx',
      'bevelLinePx',
      'lipPx',
      'fontPx',
    ] as const),
  }),
  close: z.object({
    ...shapeOf(
      [
        'diameterPx',
        'hitPx',
        'offsetXPx',
        'offsetYPx',
        'ringPx',
        'lipDropPx',
        'glossRingPx',
        'glyphStrokePx',
        'glyphArmW',
        'glyphArmL',
        'shadowYPx',
        'shadowAlpha',
      ] as const,
      num,
    ),
    ...shapeOf(['ring', 'lip', 'face', 'faceDeep', 'glossRing', 'glyph', 'glyphStroke'] as const, hex),
  }),
  plus: z.object({
    ...shapeOf(['diameterPx', 'overhangPx', 'strokePx', 'barW', 'barT'] as const, num),
    ...shapeOf(['stroke', 'lip', 'faceTop', 'faceBottom'] as const, hex),
  }),
  capsule: z.object({
    ...shapeOf(
      [
        'homeH',
        'hudH',
        'fillAlpha',
        'innerRingAlpha',
        'innerRingPx',
        'topLineAlpha',
        'homeIconPx',
        'hudIconPx',
        'iconOverhangPx',
        'homeFontPx',
        'hudFontPx',
        'timerW',
        'timerH',
        'timerFontPx',
      ] as const,
      num,
    ),
    ...shapeOf(['fill', 'hudFill', 'innerRing', 'lavender', 'cream'] as const, hex),
  }),
  badge: z.object({
    ...shapeOf(
      [
        'sizePx',
        'hudSizePx',
        'smallPx',
        'radiusPx',
        'strokePx',
        'lipPx',
        'bevelAlpha',
        'bevelPx',
        'fontPx',
        'smallFontPx',
      ] as const,
      num,
    ),
    ...shapeOf(['stroke', 'lip', 'top', 'mid', 'bottom', 'textStroke'] as const, hex),
  }),
  header: z.object({
    ...shapeOf(
      [
        'mountedFontPx',
        'mountedCenterOffsetPx',
        'mountedShadowBandPx',
        'bandH',
        'goldLinePx',
        'goldLineInsetPx',
        'tailPx',
        'bandFontPx',
        'ticketW',
        'ticketH',
        'ticketLipPx',
        'ticketFontPx',
      ] as const,
      num,
    ),
    ...shapeOf(
      [
        'bandTop',
        'bandBottom',
        'goldLine1',
        'goldLine2',
        'tailDark',
        'bandText',
        'bandTextStroke',
        'ticketGold',
        'ticketLip',
        'ticketPlateTop',
        'ticketPlateBottom',
        'ticketPlateStroke',
      ] as const,
      hex,
    ),
  }),
  panel: z.object({
    ...shapeOf(
      [
        'w',
        'h',
        'maxH',
        'marginX',
        'radiusPx',
        'shadowYPx',
        'shadowAlpha',
        'shadowBlurPx',
        'outlinePx',
        'rimPx',
        'groovePx',
        'bevelPx',
        'lipPx',
        'lipDarkPx',
        'plateStrokePx',
        'plateTopLinePx',
        'plateBottomBandPx',
        'plateInsetPx',
        'plateRadiusPx',
        'creamEdgePx',
        'creamInnerShadowPx',
      ] as const,
      num,
    ),
    ...shapeOf(
      [
        'outline',
        'rim',
        'groove',
        'bevel',
        'bodyTop',
        'bodyBottom',
        'lip',
        'lipDark',
        'plate',
        'plateStroke',
        'plateTopLine',
        'plateBottomBand',
        'cream',
        'creamEdge',
        'creamRayLight',
        'creamRayDark',
        'creamInnerShadow',
      ] as const,
      hex,
    ),
  }),
  progress: z.object({
    ...shapeOf(
      [
        'metaH',
        'compactH',
        'strokePx',
        'fillEdgePx',
        'fillGlossAlpha',
        'fillGlossPx',
        'fontPx',
        'endIconPx',
        'railW',
        'railStrokePx',
        'railFillW',
      ] as const,
      num,
    ),
    ...shapeOf(
      [
        'stroke',
        'fillEdge',
        'track',
        'fillTop',
        'fillBottom',
        'text',
        'textStroke',
        'railTrack',
        'railStroke',
        'railFillA',
        'railFillB',
      ] as const,
      hex,
    ),
  }),
  nav: z.object({
    ...shapeOf(
      [
        'barH',
        'edgeDarkPx',
        'edgeLightPx',
        'dividerPx',
        'tabW',
        'raisedW',
        'raisedH',
        'raisePx',
        'raisedRadiusPx',
        'raisedStrokePx',
        'raisedInnerLinePx',
        'iconPx',
        'iconSelectedPx',
        'labelPx',
        'lockedAlpha',
        'lockPx',
        'slideMs',
        'shadowPx',
        'shadowAlpha',
      ] as const,
      num,
    ),
    ...shapeOf(
      [
        'barTop',
        'barBottom',
        'safeArea',
        'edgeDark',
        'edgeLight',
        'divider',
        'raisedStroke',
        'raisedInnerLine',
        'raisedTop',
        'raisedBottom',
        'labelStroke',
      ] as const,
      hex,
    ),
  }),
  leaderRow: z.object({
    ...shapeOf(
      [
        'w',
        'h',
        'gapPx',
        'radiusPx',
        'strokePx',
        'strokeBottomPx',
        'topRimPx',
        'rankW',
        'rankFontPx',
        'avatarPx',
        'avatarRadiusPx',
        'avatarStrokePx',
        'nameX',
        'nameFontPx',
        'rewardIconPx',
        'selfStrokePx',
      ] as const,
      num,
    ),
    ...shapeOf(
      [
        'body',
        'stroke',
        'topRim',
        'gold',
        'goldRibbon',
        'silver',
        'bronze',
        'avatarStroke',
        'avatarInner',
        'name',
        'selfBody',
        'selfStroke',
      ] as const,
      hex,
    ),
  }),
  statCard: z.object({
    ...shapeOf(
      [
        'w',
        'h',
        'gapPx',
        'radiusPx',
        'strokePx',
        'bevelPx',
        'iconPx',
        'iconOverlapPx',
        'labelFontPx',
        'labelY',
        'valueFontPx',
        'valueY',
      ] as const,
      num,
    ),
    ...shapeOf(['body', 'stroke', 'bevel', 'label', 'value'] as const, hex),
  }),
  rewardPill: z.object({
    ...shapeOf(['w', 'h', 'strokePx', 'fontPx', 'overlapRatio', 'countFontPx'] as const, num),
    ...shapeOf(['top', 'bottom', 'stroke', 'countStroke'] as const, hex),
  }),
  lock: z.object({
    ...shapeOf(
      [
        'bigW',
        'bigH',
        'smallW',
        'smallH',
        'strokePx',
        'shacklePx',
        'shackleWidthRatio',
        'keyholeRatio',
        'glossAlpha',
        'shadowAlpha',
        'lockedCardAlpha',
      ] as const,
      num,
    ),
    ...shapeOf(
      ['bodyTop', 'bodyMid', 'bodyBottom', 'stroke', 'shackle', 'shackleInner', 'keyhole'] as const,
      hex,
    ),
  }),
  bubble: z.object({
    ...shapeOf(
      [
        'maxW',
        'minH',
        'radiusPx',
        'strokeInnerPx',
        'strokeOuterPx',
        'strokeOuterBottomPx',
        'shadowYPx',
        'shadowAlpha',
        'fontPx',
        'padXPx',
        'padYPx',
        'highlightAlpha',
        'highlightGlowAlpha',
        'handStrokePx',
        'handShadowAlpha',
      ] as const,
      num,
    ),
    ...shapeOf(
      [
        'fill',
        'strokeInner',
        'strokeOuter',
        'text',
        'highlight',
        'handSkinTop',
        'handSkinMid',
        'handSkinBottom',
        'handStroke',
        'handCuffBand',
      ] as const,
      hex,
    ),
  }),
  text: z.object({
    ...shapeOf(['highlight', 'highlightWarm'] as const, hex),
    titleTwoRing: z.object({
      ...shapeOf(['ring1Em', 'ring2Em', 'shadowEm', 'fontPx', 'fontSmallPx'] as const, num),
      ...shapeOf(['fill', 'ring1', 'ring2', 'shadow'] as const, hex),
    }),
    titleGold: z.object({
      ...shapeOf(['strokeEm', 'shadowAlpha', 'shadowEm', 'fontPx'] as const, num),
      ...shapeOf(['top', 'mid', 'bottom', 'stroke', 'shadow'] as const, hex),
    }),
    button: nums(['strokeEm', 'strokeMinPx', 'shadowEm'] as const),
    counterCream: z.object({
      ...shapeOf(['strokeEm', 'fontPx'] as const, num),
      ...shapeOf(['fill', 'stroke'] as const, hex),
    }),
    counterLavender: z.object({
      ...shapeOf(['shadowPx', 'fontPx'] as const, num),
      ...shapeOf(['fill', 'shadow'] as const, hex),
    }),
    bigNumber: z.object({
      ...shapeOf(['strokeEm', 'shadowEm', 'fontPx', 'fontSmallPx'] as const, num),
      ...shapeOf(['fill', 'stroke'] as const, hex),
    }),
    label: z.object({
      ...shapeOf(['fontPx'] as const, num),
      ...shapeOf(['fill'] as const, hex),
    }),
    cardText: z.object({
      ...shapeOf(['fontPx'] as const, num),
      ...shapeOf(['fill'] as const, hex),
    }),
    rowText: z.object({
      ...shapeOf(['fontPx'] as const, num),
      ...shapeOf(['fill'] as const, hex),
    }),
    plain: z.object({
      ...shapeOf(['strokeEm', 'shadowEm', 'fontPx', 'fontLargePx'] as const, num),
      ...shapeOf(['fill', 'stroke'] as const, hex),
    }),
  }),
  block: nums([
    'outlinePx',
    'outlineFactor',
    'bevelHeightRatio',
    'bevelLighten',
    'lipPx',
    'darkFactor',
    'glossAlpha',
    'glossRxRatio',
    'insetPx',
    'studHighlightPx',
    'studHighlightLighten',
    'studHighlightAlpha',
    'studShadePx',
    'studShadeFactor',
    'refCellPx',
    'refStudRatio',
    'refBevelPx',
    'refWallPx',
  ] as const),
  board: z.object({
    ...shapeOf(
      [
        'framePx',
        'frameMinPx',
        'edgePx',
        'edgeBottomPx',
        'innerLinePx',
        'radiusOuterPx',
        'radiusInnerPx',
      ] as const,
      num,
    ),
    ...shapeOf(['frameTop', 'frameBottom', 'edge', 'innerLine', 'floorDark'] as const, hex),
    floorDarkEnabled: z.boolean(),
  }),
  scene: z.object({
    ...shapeOf(
      [
        'glowCx',
        'glowCy',
        'glowR',
        'vignette',
        'gridAlpha',
        'metaDoodleAlpha',
        'loadRays',
        'loadRayAlpha',
        'loadRayTurnsPerSecond',
        'loadCloudStart',
      ] as const,
      num,
    ),
    ...shapeOf(['gameBase', 'gameGlow'] as const, hex),
  }),
  effects: z.object({
    ...shapeOf(
      [
        'glowAlpha',
        'glowRadiusRatio',
        'popMs',
        'sparkleMinPx',
        'sparkleMaxPx',
        'sparkleHaloAlpha',
        'overlayMs',
        'tapTextDelayMs',
        'tapPulseMs',
        'tapPulseScale',
        'coinCount',
        'coinArcPx',
        'coinMs',
        'coinStaggerMs',
        'selectGlowPx',
        'rayLightFactor',
        'rayDarkFactor',
      ] as const,
      num,
    ),
    ...shapeOf(['glowColor', 'selectGlow'] as const, hex),
  }),
  character: nums([
    'headBodyRatio',
    'eyeHeightRatio',
    'eyeSpacingRatio',
    'irisRatio',
    'pupilRatio',
    'catchBigRatio',
    'catchSmallRatio',
    'browWidthRatio',
    'mouthWidthRatio',
    'specularAlpha',
    'specularWidthRatio',
    'rimPx',
    'rimAlpha',
    'aoFactor',
    'aoAlpha',
    'contactAlpha',
    'contactWidthRatio',
    'contactHeightRatio',
    'edgeDarkFactor',
    'gradStop0',
    'gradStop2',
    'gradStop3',
    'maxSvgKb',
  ] as const),
  screen: z.object({
    loading: z.object({
      ...shapeOf(
        [
          'logoCx',
          'logoCy',
          'logoW',
          'logoH',
          'brickCount',
          'brickMinPx',
          'brickMaxPx',
          'ringMinPx',
          'ringMaxPx',
          'groupCx',
          'groupCy',
          'groupW',
          'groupH',
          'textY',
          'barW',
          'barH',
          'barY',
        ] as const,
        num,
      ),
      // ART_REFERENCE §9.1 v1.1 boot pack (moved here from `check.v3Addenda`, 2026-10-22): the loading screen's P0
      // ids (catalogue order), the emblem on the letter block, the title lines; `scale` / `maxKb` / `dir` are the §9.1
      // build-time PNG recipe (the game ships the committed rasters within `maxKb`, TECH §2R.6)
      bootPack: z.object({
        ...shapeOf(
          [
            'scale',
            'maxKb',
            'emblemPx',
            'emblemOffsetX',
            'emblemOffsetY',
            'titleLineH',
            'titleBlockH',
          ] as const,
          num,
        ),
        dir: str,
        ids: z.array(str),
      }),
    }),
    home: nums([
      'capsuleH',
      'settingsPx',
      'eventBubblePx',
      'eventLabelW',
      'eventLabelH',
      'eventBadgePx',
      'eventTimerW',
      'eventTimerH',
      'characterGroupX',
      'characterGroupY',
      'characterGroupW',
      'characterGroupH',
      'playW',
      'playH',
      'playBottomPx',
      'navH',
    ] as const),
    levelStart: nums([
      'panelW',
      'panelH',
      'titleY',
      'closeX',
      'closeY',
      'plateY',
      'plateH',
      'goalRowY',
      'goalRowH',
      'goalThumbPx',
      'streakRowY',
      'streakRowH',
      'labelY',
      'labelFontPx',
      'boosterPx',
      'boosterGapPx',
      'boosterY',
      'playY',
      'playW',
      'playH',
      'difficultyW',
      'difficultyH',
    ] as const),
    hud: z.object({
      ...shapeOf(
        [
          'row1Y',
          'row1H',
          'levelCapsuleW',
          'streakCapsuleW',
          'row2Y',
          'toolPx',
          'toolLeftX',
          'toolRightX',
          'movesW',
          'movesH',
          'movesBandH',
          'movesFontPx',
          'chipsY',
          'chipsH',
          'boosterPx',
          'boosterGapPx',
          'boosterX',
          'boosterBottomPx',
          'boosterBadgePx',
          'cornerW',
          'cornerH',
        ] as const,
        num,
      ),
      ...shapeOf(['movesBand', 'movesCream'] as const, hex),
    }),
    pause: z.object({
      ...shapeOf(
        [
          'panelW',
          'panelH',
          'titleFontPx',
          'rowW',
          'rowH',
          'toggleW',
          'toggleH',
          'knobPx',
          'exitBtnW',
          'exitBtnH',
          'confirmPanelW',
          'confirmPanelH',
        ] as const,
        num,
      ),
      ...shapeOf(['toggleOn', 'toggleOff'] as const, hex),
    }),
    reward: nums(['titleY', 'itemPx', 'itemY', 'countY', 'countFontPx', 'tapY', 'tapFontPx'] as const),
    lose: nums([
      'panelW',
      'panelH',
      'titleFontPx',
      'previewW',
      'previewH',
      'optionW',
      'optionH',
      'optionLipPx',
      'optionStrokePx',
    ] as const),
    settings: z.object({
      ...shapeOf(['panelW', 'panelH', 'rowW', 'rowH', 'rowRadiusPx', 'rowStrokePx'] as const, num),
      ...shapeOf(['rowFill', 'rowStroke'] as const, hex),
    }),
    tutorial: nums(['bubbleX', 'bubbleY', 'portraitX'] as const),
  }),
});
export type KitV3 = z.output<typeof KitV3>;
export type KitV3ButtonColor = keyof KitV3['buttonColor'];
export const KIT_V3_BUTTON_COLORS = [
  'green',
  'greenSoft',
  'orange',
  'blue',
  'purple',
  'cream',
  'grey',
] as const;
export type KitV3ButtonSize = 'L' | 'M' | 'S';

const Kit = z.object({
  button: nums([
    'strokePx',
    'lipPx',
    'pressedLipPx',
    'radiusMaxPx',
    'radiusHeightRatio',
    'faceGradientStop',
    'glossInsetXPx',
    'glossInsetYPx',
    'glossHeightRatio',
    'glossAlphaTop',
    'glossAlphaBottom',
    'dropShadowYPx',
    'dropShadowAlpha',
    'pressedScale',
    'textStrokeEm',
    'textShadowEm',
    'disabledGlossAlpha',
    'shineWidthRatio',
    'shineAlpha',
    'shineAngleDeg',
  ]),
  buttonColor: z.object(shapeOf(KIT_BUTTON_COLORS, ButtonQuad)),
  panel: z.object({
    ...shapeOf(
      ['outline', 'frameTop', 'frameBottom', 'frameInner', 'body', 'inset', 'innerShadow'] as const,
      hex,
    ),
    ...shapeOf(
      [
        'outlinePx',
        'framePx',
        'innerLinePx',
        'radiusPx',
        'shadowYPx',
        'shadowAlpha',
        'innerShadowPx',
        'innerShadowAlpha',
        'padPx',
      ] as const,
      num,
    ),
  }),
  ribbon: z.object({
    ...shapeOf(
      [
        'heightPx',
        'tailPx',
        'notchPx',
        'tailDropPx',
        'radiusPx',
        'strokePx',
        'glossAlpha',
        'textRatio',
      ] as const,
      num,
    ),
    ...shapeOf(KIT_RIBBON_COLORS, RibbonQuad),
  }),
  badge: z.object({
    ...shapeOf(['diameterPx', 'ringPx', 'fontPx', 'cornerPx'] as const, num),
    ...shapeOf(['ring', 'top', 'bottom', 'stroke'] as const, hex),
    shape: z.enum(['roundedSquare', 'circle']),
  }),
  capsule: z.object({
    ...shapeOf(
      [
        'heightPx',
        'fillAlpha',
        'innerStrokeAlpha',
        'innerStrokePx',
        'iconPx',
        'iconOverhangPx',
        'plusPx',
        'fontPx',
        'gapPx',
      ] as const,
      num,
    ),
    ...shapeOf(['fill', 'innerStroke', 'textStroke'] as const, hex),
  }),
  progress: z.object({
    ...shapeOf(['heightPx', 'trackInnerAlpha', 'tickAlpha', 'endIconPx'] as const, num),
    ...shapeOf(['track', 'fillTop', 'fillBottom'] as const, hex),
  }),
  nav: z.object({
    ...shapeOf(
      [
        'barTop',
        'barBottom',
        'edge',
        'selectedTop',
        'selectedBottom',
        'selectedStroke',
        'label',
        'labelLocked',
      ] as const,
      hex,
    ),
    ...shapeOf(
      ['edgePx', 'raisePx', 'lockedAlpha', 'labelPx', 'iconPx', 'iconSelectedPx', 'lockPx'] as const,
      num,
    ),
  }),
  bubble: z.object({
    ...shapeOf(['fill', 'stroke'] as const, hex),
    ...shapeOf(
      ['strokePx', 'radiusPx', 'shadowYPx', 'shadowAlpha', 'padXPx', 'padYPx', 'tailPx'] as const,
      num,
    ),
  }),
  sunburst: z.object({
    ...shapeOf(['rayColor', 'innerColor', 'outerColor'] as const, hex),
    ...shapeOf(['rays', 'rayAlpha', 'turnsPerSecond'] as const, num),
    /** ART §15.4: blend of the rays over the plaza; `rayAlpha` is the final α (no code offset). */
    blend: z.enum(['add', 'normal']),
  }),
  /** ART_REFERENCE v1 measurements (R2-13); see `KitV3`. */
  v3: KitV3,
});

/** UX §13.1 light tutorial (`tutorial.*`, R2-10, K-53). */
const Tutorial = nums([
  'startDelayMs',
  'appearMs',
  'hideMs',
  'visibleMs',
  'idleReshowMs',
  'nextStepDelayMs',
  'maxStepsPerLevel',
  'maxWordsPerBubble',
  'reshowsWithBubble',
  'dragFadeAlpha',
  'handLoopMs',
  'handPauseMs',
  'gloveW',
  'gloveH',
  'glovePressScale',
  'trailDotPx',
  'trailGapPx',
  'trailAlpha',
  'highlightStrokePx',
  'highlightGlowPx',
  'highlightPadPx',
  'highlightPulseScale',
  'highlightPulseMs',
  'bubbleMaxW',
  'bubbleMinH',
  'portraitPx',
  'portraitGapPx',
  'dockGapPx',
  'ghostAlpha',
  'ghostLiftMs',
]);

/** UX §5.8 variable board (`layout.adaptive.*`, K-49). `cellMaxPx` is optional: 120 when absent (TECH §2R.1). */
const LayoutAdaptive = z.object({
  ...shapeOf(
    [
      'maxTotalCols',
      'minRows',
      'maxRows',
      'minSiteCols',
      'maxSiteCols',
      'yardFramePx',
      'yardFrameRadiusPx',
      'siteScaffoldPx',
      'craneRows',
      'minSideMarginPx',
      'yardHolePx',
    ] as const,
    num,
  ),
  cellMaxPx: z.optional(num),
});

/** UX §3 home v2 (`layout.home.*`). */
const LayoutHome = z.object({
  ...shapeOf(
    [
      'livesX',
      'livesW',
      'coinsX',
      'coinsW',
      'starsX',
      'starsW',
      'topBarY',
      'topBarH',
      'settingsX',
      'settingsY',
      'settingsSize',
      'areaRibbonY',
      'areaRibbonW',
      'progressX',
      'progressY',
      'progressW',
      'sideLeftX',
      'sideRightX',
      'sideFirstY',
      'sideStepY',
      'sideSize',
      'structureCenterX',
      'structureBaseY',
      'structureMaxW',
      'structureMaxH',
      'taskBubbleSize',
      'characterX',
      'characterBaseY',
      'characterW',
      'characterH',
      'playButtonW',
      'playButtonH',
      'playButtonBottomPx',
      'levelTagW',
      'levelTagH',
      'navBottomPx',
      'navH',
      'navTabW',
      'expandShare',
      'characterExpandShare',
      'chestRingPx',
    ] as const,
    num,
  ),
  /** ART §7.2 structure crop stops (fraction of the structure height revealed from the bottom). */
  ch1CropStops: numList,
});

/** UX §5.9 game HUD v2 (`layout.hud.*`). */
const LayoutHud = nums([
  'goalChipIconPx',
  'goalChipGapPx',
  'blocksLeftFontPx',
  'blocksLeftLabelPx',
  'bottomBandAlpha',
  'goalChipMax',
  'goalChipIconCompactPx',
  'goalChipGapCompactPx',
  'goalSecondRowH',
  'truckSubBadgePx',
  'nextFloorBadgePx',
  'truckPreviewScale',
]);

/** UX §6.1 win v2 (`layout.win.*`). */
const LayoutWin = nums([
  'ribbonY',
  'ribbonW',
  'cardY',
  'cardSize',
  'characterX',
  'characterY',
  'characterW',
  'characterH',
  'bonusY',
  'bonusW',
  'bonusH',
  'trowelRowY',
  'trowelRowH',
  'rewardsShiftPx',
  'rewardsY',
  'rewardCapsuleW',
  'rewardGapPx',
  'buttonW',
  'buttonH',
  'buttonBottomPx',
  'expandShare',
]);

export const TokensSchema = z.object({
  meta: z.object({
    version: num,
    owner: str,
    doc: str,
    designWidth: num,
    designHeight: num,
    designHeightMax: num,
    scale: nums(['fitHeight', 'expandMinHeight', 'expandMaxHeight']),
    visualLanguage: str,
  }),
  color: z.object({
    block: colorRecord,
    planInk: colorRecord,
    ui: hexes([
      'panel',
      'panelInset',
      'panelEdge',
      'panelShadow',
      'ink',
      'inkSoft',
      'inkOnDark',
      'primary',
      'primaryTop',
      'primaryLip',
      'primaryStroke',
      'secondary',
      'secondaryTop',
      'secondaryLip',
      'secondaryStroke',
      'neutral',
      'neutralTop',
      'neutralLip',
      'neutralStroke',
      'danger',
      'dangerTop',
      'dangerLip',
      'dangerStroke',
      'disabled',
      'disabledLip',
      'tagHard',
      'tagSuperHard',
      'gold',
      'goldDark',
      'star',
      'starOutline',
      'heart',
      'hazardYellow',
      'hazardBlack',
      'overlay',
      'badge',
      'badgeLocked',
      'botBadge',
      'promoteLine',
      'demoteLine',
    ]),
    ghost: hexes(['valid', 'invalid', 'neutral', 'support']),
    board: hexes([
      'yardFloor',
      'yardFloorAlt',
      'yardGrid',
      'yardFrame',
      'blueprint',
      'blueprintDeep',
      'blueprintLine',
      'planUnderlay',
      'planEmptyHatch',
      'wall',
      'wallLight',
      'wallDark',
      'wallOutline',
      'scaffold',
      'scaffoldClamp',
      'craneSky',
      'craneLine',
      'rail',
      'narrowJaw',
      'shutterSlat',
      'shutterSlatLight',
      'sliderPlate',
      'lockBar',
      'buildFront',
      // UX §5.8 yard frame wood gradient (2026-10-08; contour = kit.panel.outline)
      'yardFrameTop',
      'yardFrameBottom',
    ]),
    obstacle: hexes([
      'crate',
      'crateLine',
      'crateOutline',
      'crateStrap',
      'cementBag',
      'cementBagOutline',
      'chain',
      'chainOutline',
      'wet',
      'mortar',
      'mortarOutline',
      'debris',
      'debrisCrack',
      'screw',
      'screwSlot',
      'key',
      'balloon',
      'cargoSteel',
      'cargoDark',
      'cargoBuckle',
    ]),
    /** ART §7.1 indigo game scene (R2-12). */
    scene: hexes(['gameTop', 'gameBottom', 'gameLine', 'gameSilhouette']),
    chapter: z.object(shapeOf(CHAPTERS, hexes(CHAPTER_COLORS))),
    character: z.object({
      outline: hex,
      tuna: z.record(str, hex),
      dede: z.record(str, hex),
      kepce: z.record(str, hex),
      gribeton: z.record(str, hex),
      ayse: z.record(str, hex),
      selin: z.record(str, hex),
      riza: z.record(str, hex),
      kurdele: z.record(str, hex),
    }),
  }),
  alpha: nums([
    'overlay',
    'symbolWhite',
    'planFill',
    'planInkLight',
    'planEmptyHatch',
    'planEmptyStroke',
    'blueprintLine',
    'blueprintLineMajor',
    'craneSky',
    'craneLine',
    'gloss',
    'seam',
    'ghostFill',
    'ghostNeutralStroke',
    'ghostGlow',
    'glassBody',
    'wetLayer',
    'segmentDoneScaffold',
    'panoramaFuture',
    'buildFrontGlow',
    'supportHatch',
    'debrisLayer',
    'yardPreview',
    'sceneGridMinor',
    'sceneGridMajor',
    'sceneSilhouette',
  ]),
  block: z.object({
    ...shapeOf(
      [
        'insetRatio',
        'cornerRadiusRatio',
        'bevelTopRatio',
        'bevelTopLighten',
        'bevelLeftRatio',
        'bevelLeftLighten',
        'shadeBottomRatio',
        'shadeBottomFactor',
        'shadeRightRatio',
        'shadeRightFactor',
        'outlinePx',
        'outlineFactor',
        'seamPx',
        'seamFactor',
        'symbolSizeRatio',
        'symbolLightThresholdLstar',
        'symbolDarkFactor',
        'innerCornerRadiusRatio',
      ] as const,
      num,
    ),
    /** `[x, y, w, h]` as cell ratios (ART §3 layer 4). */
    glossRect: z.tuple([num, num, num, num]),
  }),
  blockV2: BlockV2,
  plan: z.object({
    ...shapeOf(
      [
        'insetPx',
        'cornerRadiusRatio',
        'strokePx',
        'strokeFactor',
        'hatchSpacingPx',
        'hatchWidthPx',
        'hiddenTagPx',
        'frontStrokePx',
        'frontLighten',
        'supportHatchSpacingPx',
        'supportHatchWidthPx',
        'ceilingBeamPx',
      ] as const,
      num,
    ),
    /** `[dash, gap]` px. */
    dash: z.tuple([num, num]),
  }),
  layout: z.object({
    marginPx: num,
    grid: nums(['cellPx', 'yardX', 'yardCols', 'wallX', 'wallW', 'buildX', 'buildCols', 'rows', 'craneRows']),
    top: nums([
      'pauseX',
      'pauseY',
      'pauseSize',
      'panoramaX',
      'panoramaY',
      'panoramaW',
      'panoramaH',
      'goalsX',
      'goalsY',
      'goalsW',
      'goalsH',
      'movesX',
      'movesY',
      'movesW',
      'movesH',
      'topBarY',
      'topBarH',
      'groupBottomY',
    ]),
    board: nums([
      'craneTopY',
      'boardTopY',
      'boardBottomY',
      'statusY',
      'statusH',
      'statusBottomY',
      'minGapTopPx',
      'expandShare',
      'siteRibbonX',
      'siteRibbonY',
      'siteRibbonW',
      'siteRibbonH',
      'siteRibbonTiltDeg',
      'siteRibbonNotchPx',
    ]),
    bottom: nums([
      'characterX',
      'characterBottomPx',
      'characterW',
      'characterH',
      'boosterX',
      'boosterBottomPx',
      'boosterSize',
      'boosterGap',
      'navBottomPx',
      'navH',
      'playButtonW',
      'playButtonH',
      'playButtonBottomPx',
      'groupTopFromBottomPx',
    ]),
    popup: nums(['optionW', 'optionH', 'optionGap', 'optionsBottomInsetPx', 'panelBottomPx']),
    adaptive: LayoutAdaptive,
    home: LayoutHome,
    hud: LayoutHud,
    win: LayoutWin,
  }),
  touch: nums(['minTargetPx', 'hitSlopPx']),
  drag: nums([
    'startThresholdPx',
    'holdMs',
    'liftScale',
    'fingerOffsetCells',
    'tiltMaxDeg',
    'trailMinSpeedCells',
    'tetherDelayMs',
    'tetherMinCells',
    'leanDeg',
    'bumpPx',
    'steerSwipeMinPx',
  ]),
  radius: nums(['button', 'panel', 'chip', 'badge', 'toggle', 'panelArt']),
  kit: Kit,
  shadow: z.object({
    buttonLipPx: num,
    buttonPressedLipPx: num,
    panelLipPx: num,
    textOffsetY: num,
    contact: ShadowSpec,
    lifted: ShadowSpec,
    panel: ShadowSpec,
    crane: ShadowSpec,
  }),
  stroke: nums([
    'iconPx',
    'iconSmallPx',
    'ghostPx',
    'ghostInvalidPx',
    'ghostNeutralPx',
    'ghostGlowPx',
    'textEm',
    'yardPreviewPx',
  ]),
  font: z.object({
    family: str,
    fallback: z.array(str),
    size: nums(FONT_ROLES),
    weight: nums(FONT_ROLES),
    lineHeight: nums(FONT_ROLES),
  }),
  duration: nums(DURATION_KEYS),
  text: nums(['typewriterCps']),
  tutorial: Tutorial,
  hud: nums(['heavyRingWarnAt', 'heavyRingHapticBeforeEndMs', 'steerChipPx']),
  easing: z.object(
    shapeOf(
      ['pop', 'move', 'moveIn', 'slide', 'settle', 'burst', 'bounce', 'elastic', 'fallIn', 'linear'],
      str,
    ),
  ),
  physics: nums([
    'fallNormalAccel',
    'fallNormalMax',
    'fallLowSpeed',
    'fallHighAccel',
    'fallHighMax',
    'yardFallAccel',
    'yardFallMax',
    'yardCascadeStaggerMs',
    'balloonRiseSpeed',
    'truckDropStaggerMs',
  ]),
  particles: nums([
    'maxOnScreen',
    'maxPerBurst',
    'reducedFactor',
    'land',
    'placeOk',
    'combo',
    'segment',
    'win',
    'winWaves',
    'glass',
    'crateBreak',
    'bagTear',
    'screw',
    'key',
    'sparkle',
    'starBurst',
    'yardClear',
    'progressFill',
    'structureReveal',
  ]),
  haptic: z.object({
    light: num,
    medium: num,
    heavy: num,
    doubleLight: numList,
    success: numList,
    win: numList,
  }),
  audio: z.object({
    comboRootHz: num,
    comboSemitones: numList,
    sameSoundCooldownMs: num,
    maxVoices: num,
    musicDuckDb: num,
    sampleRateHz: num,
    prerenderBudgetMsPerFrame: num,
    sfx: z.object(shapeOf(SFX_KEYS, ZzfxParams)),
    seq: z.object(shapeOf(SEQ_KEYS, SeqSteps)),
  }),
  a11y: nums([
    'colorBlindSymbolScale',
    'colorBlindPlanFill',
    'colorBlindGhostBadgePx',
    'colorBlindGhostStrokeAddPx',
    'colorBlindSupportHatchPx',
    'colorBlindPaintSymbolScale',
    'colorBlindContrastBoost',
    'ghostBadgePx',
    'reducedScaleMax',
  ]),
});

/** Runtime tokens (no `check.*`, no `_doc`). */
export type Tokens = z.output<typeof TokensSchema>;

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

/** Validates raw token data; throws a readable error listing every missing or malformed path. */
export function parseTokens(raw: unknown): Tokens {
  const result = TokensSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `src/theme/tokens.json is invalid (TECH_DESIGN §10.2):\n${z.prettifyError(result.error)}`,
    );
  }
  return deepFreeze(result.data);
}

/** The validated design tokens. Throws at module load when tokens.json misses a required key. */
export const TOKENS: Tokens = parseTokens(rawTokens);

/**
 * ART_REFERENCE v1.1 addenda (`check.v3Addenda`, design-lead 2026-10-21: capsule badge §3.4, direction arrow §3.14,
 * avatar square §9.2, town area window §9.10, reward layer §9.6). design-lead parked them under `check.*` so the TECH
 * 2R.7 "every kit.v3 key is typed" test stayed green until the components existed; the components exist now (visual
 * v3 round 2), so the group is typed here with its own schema and read from `check.v3Addenda`. When design-lead moves
 * the values to their `kit.v3.<group>` targets (`_doc`), only `addendaRaw` below changes. The boot pack (§9.1) moved
 * to `kit.v3.screen.loading.bootPack` (code-lead, 2026-10-22). The main `TOKENS` object still carries no `check.*` key.
 */
const V3Addenda = z.object({
  capsuleBadge: nums(['diameterPx', 'fontPx', 'offsetXPx', 'offsetYPx', 'pulseScale', 'pulseMs']),
  arrow: z.object({
    ...shapeOf(
      [
        'w',
        'h',
        'shaftW',
        'headH',
        'strokePx',
        'glossAlpha',
        'glossPx',
        'shadowYPx',
        'shadowAlpha',
        'gapPx',
        'bobPx',
        'bobMs',
        'maxCount',
      ] as const,
      num,
    ),
    ...shapeOf(['top', 'mid', 'bottom', 'stroke'] as const, hex),
  }),
  avatarSquare: z.object({
    ...shapeOf(['sizePx', 'radiusPx', 'strokePx', 'innerLinePx'] as const, num),
    ...shapeOf(['faceTop', 'faceBottom', 'stroke', 'innerLine'] as const, hex),
    mvpVisible: z.boolean(),
  }),
  townAreaWindow: z.object({
    ...shapeOf(
      [
        'panelH',
        'progressCardW',
        'progressCardH',
        'progressBarW',
        'progressBarH',
        'chestPx',
        'dividerAlpha',
        'rowW',
        'rowH',
        'rowRadiusPx',
        'rowIconPx',
        'rowFontPx',
        'buildButtonW',
        'buildButtonH',
        'doneCheckPx',
        'doneRowAlpha',
        'cardStrokePx',
      ] as const,
      num,
    ),
    ...shapeOf(['cardFill', 'cardStroke', 'divider', 'shortageText'] as const, hex),
  }),
  rewardLayer: z.object({
    ...shapeOf(
      [
        'glowAlpha',
        'glowRadiusRatio',
        'itemPx',
        'twoItemOffsetPx',
        'overlayAlpha',
        'tapTextY',
        'tapTextPx',
      ] as const,
      num,
    ),
    ...shapeOf(['glow', 'overlay'] as const, hex),
  }),
});

export type V3Addenda = z.output<typeof V3Addenda>;

/** Where the addenda live in tokens.json today (`check.v3Addenda`; the `_doc` there names the `kit.v3.*` targets). */
const addendaRaw = (rawTokens as unknown as { check?: { v3Addenda?: unknown } }).check?.v3Addenda;

export function parseV3Addenda(raw: unknown): V3Addenda {
  const result = V3Addenda.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `src/theme/tokens.json check.v3Addenda is invalid (ART_REFERENCE v1.1):\n${z.prettifyError(result.error)}`,
    );
  }
  return deepFreeze(result.data);
}

/** The typed ART_REFERENCE v1.1 addenda (see `V3Addenda`). */
export const V3_ADDENDA: V3Addenda = parseV3Addenda(addendaRaw);

// ---------------------------------------------------------------------------------------------------------------
// SVG v3 tone table (ART_REFERENCE §6.2, ART §17; `check.svgTonesV3`)

/**
 * The derived tones the `public/art` SVGs use beyond the base palette (design-lead 2026-10-20: hi = c·0,65 +
 * white·0,35, lo = ×0,78, deep = ×0,62, edge = ×0,45, plus fixed reference colours), grouped by subject (`block`,
 * `tuna`, `scene`, …; the groups are design-lead's, hence a record). The game never reads them; `services/assetCatalog`
 * `paletteOf` widens the SVG palette check with every colour of the tokens tree, so this schema is the gate that keeps
 * the table `#RRGGBB`-only — a malformed tone fails at module load with its path instead of silently shrinking the
 * palette. tests/assets/svgTonesV3.test.ts pins design-lead's invariant that every listed tone occurs in an SVG.
 */
const SvgTonesV3 = z.record(str, z.record(str, hex));
export type SvgTonesV3 = z.output<typeof SvgTonesV3>;

/**
 * The `check.*` subgroups the schema validates at module load (`V3_ADDENDA`, `SVG_TONES_V3`) — the PENDING path of
 * TECH §2R.7 for values design-lead parked under `check.*` until their `kit.v3.<group>` targets exist. Every other
 * `check.*` table is read by tests/theme/tokens.test.ts only; `TOKENS` itself never carries `check.*`.
 */
export const CHECK_TYPED_GROUPS = ['v3Addenda', 'svgTonesV3'] as const;

/** Drops `_doc*` keys (two levels), which a record schema — unlike `z.object` — would otherwise type as values. */
function withoutDocs(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const isGroup = (v: unknown): v is object => v !== null && typeof v === 'object' && !Array.isArray(v);
  return Object.fromEntries(
    Object.entries(raw)
      .filter(([k]) => !k.startsWith('_doc'))
      .map(([k, v]) => [
        k,
        isGroup(v) ? Object.fromEntries(Object.entries(v).filter(([kk]) => !kk.startsWith('_doc'))) : v,
      ]),
  );
}

export function parseSvgTonesV3(raw: unknown): SvgTonesV3 {
  const result = SvgTonesV3.safeParse(withoutDocs(raw));
  if (!result.success) {
    throw new Error(
      `src/theme/tokens.json check.svgTonesV3 is invalid (ART_REFERENCE §6.2):\n${z.prettifyError(result.error)}`,
    );
  }
  return deepFreeze(result.data);
}

const svgTonesRaw = (rawTokens as unknown as { check?: { svgTonesV3?: unknown } }).check?.svgTonesV3;

/** The typed SVG v3 tone table: group → tone name → `#RRGGBB` (see `SvgTonesV3`). */
export const SVG_TONES_V3: SvgTonesV3 = parseSvgTonesV3(svgTonesRaw);
