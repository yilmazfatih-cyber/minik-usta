/**
 * Procedural textures (docs/TECH_DESIGN.md §10.2, D-060, R-05).
 *
 * (a) Boot atlas `atlas` (≤ 2048 × 2048, once at boot): plan cells (8 colours, each also in its build-front variant
 *     `plan_<c>_front`), `?` cell, build-front contour, missing-support hatch, ghost badges, blueprint floor / deep /
 *     corner, yard floor, scaffold, ceiling beam, W1 rail, crane line and a white pixel.
 * (b) Level bake `level-<id>` (≤ 2048 × 1024 pages, at level start): one frame per (shape × colour × flag set) of the
 *     level's pieces, per shape the blurred silhouettes and fall-shadow ghosts, per plan height the blueprint grid
 *     overlay, per plan its `.` overlay, and the wall.
 * Colour-blind mode is a bake parameter (switching re-bakes both).
 *
 * Faz 2R (TECH §2R.7): `variant: 'v1' | 'v2'` during the transition. v2 bakes the candy blocks of ART §3A (same frame
 * names, same box), per shape the holdable stud gloss `blk_gloss_<shape>` and the lift glow `blk_glow_<shape>`, v2
 * silhouettes and ghosts on the v2 outline, the Heavy Load (`cargo_q9`, `cargo_i5`), and the pegboard yard floor in
 * the boot atlas. (c) Kit atlas `kit` (≤ 2048 × 1024 pages, once at boot): UI kit v2 + fx frames (`kitAtlasFrames`;
 * 9-slice insets in `KIT_SLICES`). (d) Fallback frames of the SVG art (icons, characters, scenes, structure) are
 * baked on demand by services/assets.ts from the specs here. When the tests move to v2, the v1 drawers go.
 *
 * Everything here is pure planning + Canvas2D drawing except `uploadAtlas`, the ONLY function that touches Phaser:
 * `textures.createCanvas` → draw every frame on its `CanvasTexture.context` → `add` the frames → ONE `refresh()` per
 * page (one GPU upload). `DynamicTexture` / `RenderTexture` are not used (Phaser 4 needs `render()` per draw).
 */
import type Phaser from 'phaser';
import { PLAN_DOT } from '../core/level/compile.ts';
import type { CompiledLevel } from '../core/level/compile.ts';
import { shapeByIndex } from '../core/shapes.ts';
import { FLAG_BIT } from '../core/state.ts';
import { COLOR_CODES } from '../core/types.ts';
import type { ColorCode, ShapeId } from '../core/types.ts';
import type { Tokens } from './tokens.ts';
import { ART } from './draw/art.ts';
import { BADGE_KINDS, badgeSize, drawGhostBadge } from './draw/badge.ts';
import type { BadgeKind } from './draw/badge.ts';
import {
  BAKED_FLAGS,
  GHOST_STYLES,
  blockSize,
  drawBlock,
  drawGhost,
  drawSilhouette,
  ghostPad,
  ghostSize,
  silhouettePad,
  silhouetteSize,
} from './draw/block.ts';
import type { BakedFlag, BlockSpec, GhostStyle, SilhouetteKind } from './draw/block.ts';
import {
  drawCeilingBeam,
  drawCraneLine,
  drawScaffoldClamp,
  drawScaffoldLedger,
  drawScaffoldPole,
  drawWhitePixel,
  drawYardFloor,
  scaffoldClampSize,
  yardFloorSize,
} from './draw/board.ts';
import { DEFAULT_MODE } from './draw/color.ts';
import type { DrawMode } from './draw/color.ts';
import { drawInFrame } from './draw/context.ts';
import type { DrawContext } from './draw/context.ts';
import {
  blueprintCornerSize,
  blueprintGridSize,
  cellSize,
  drawBlueprintCorner,
  drawBlueprintDeep,
  drawBlueprintFloor,
  drawBlueprintGrid,
  drawBuildFront,
  drawHiddenCell,
  drawPlanCell,
  drawFallPath,
  drawPlanDots,
  drawSupportHatch,
  drawWrongHatch,
  fallPathSize,
} from './draw/plan.ts';
import { drawGapRail, drawWall, gapRailSize, wallFrameOffset, wallSize } from './draw/wall.ts';
import {
  CARGO_KINDS,
  blockV2Size,
  cargoSize,
  drawBlockGlossV2,
  drawBlockV2,
  drawBlocksLeftIcon,
  drawCargo,
  drawGhostV2,
  drawLiftGlowV2,
  drawSilhouetteV2,
  ghostV2Size,
  liftGlowPad,
  liftGlowSize,
  silhouetteV2Size,
} from './draw/blockV2.ts';
import type { CargoKind } from './draw/blockV2.ts';
import {
  KIT_BUTTON_COLORS,
  KIT_BUTTON_HEIGHTS,
  KIT_RIBBON_COLORS,
  badgeFrameSize,
  bubbleFrameSize,
  bubbleSlices,
  bubbleTailSize,
  buttonFrameSize,
  buttonSlices,
  capsuleSlices,
  drawBadge,
  drawBubble,
  drawBubbleTail,
  drawButton,
  drawButtonShine,
  drawCapsule,
  drawHighlight,
  drawInset,
  drawNavBar,
  drawNavTab,
  drawNextFloorBadge,
  drawPanel,
  drawPortraitRing,
  drawProgressFill,
  drawProgressTrack,
  drawRibbon,
  drawRoundButton,
  highlightPad,
  highlightSlices,
  insetSlices,
  kitButtonFrameName,
  kitButtonSourceW,
  panelFrameSize,
  panelSlices,
  progressFillHeight,
  progressFillSlices,
  progressSlices,
  ribbonFrameSize,
  ribbonSlices,
  roundButtonFrameSize,
  shineSize,
} from './draw/kit.ts';
import type { ButtonState, KitButtonColor, Slices, TailDir } from './draw/kit.ts';
import {
  FX,
  FX_SIZE,
  drawConfetti,
  drawDust,
  drawGoldParticle,
  drawRing,
  drawSmallStar,
  drawSparkle,
  drawSunburst,
} from './draw/fx.ts';
import {
  STRUCTURE_SIZE,
  drawLogoEmblemFallback,
  drawStructureFallback,
  drawTownFallback,
  drawWinPlazaFallback,
  drawYardFloorV2,
  drawYardFrameV2,
  drawYardPreviewCell,
  yardFloorV2Size,
  yardFrameSize,
  yardFrameSlices,
} from './draw/scene.ts';
import {
  CHARACTER_IDS,
  CHARACTER_VIEWBOX,
  drawCharacter,
  drawDedePortrait,
  drawGlove,
} from './draw/characters.ts';
import type { CharacterId } from './draw/characters.ts';
import { ICON_NAMES, ICON_PX, drawKitIcon, iconFrameName } from './draw/kitIcons.ts';

/** A frame to bake. `anchorX/Y` = where the logical top-left (cell, block box, wall strip) sits inside the frame. */
export interface FrameSpec {
  readonly name: string;
  readonly w: number;
  readonly h: number;
  readonly anchorX: number;
  readonly anchorY: number;
  /** Extra names for the same pixels (e.g. crane silhouette = lifted silhouette when both blurs are equal). */
  readonly aliases: readonly string[];
  draw(ctx: DrawContext): void;
}

export interface PlacedFrame extends FrameSpec {
  readonly x: number;
  readonly y: number;
}

export interface AtlasPage {
  readonly width: number;
  readonly height: number;
  readonly frames: readonly PlacedFrame[];
}

export interface PageLimits {
  readonly maxWidth: number;
  readonly maxHeight: number;
  /** Transparent px around every frame (no bleeding under linear filtering). */
  readonly gutter: number;
}

/** TECH §10.2 (a): boot atlas page 2048 × 2048. */
export const BOOT_PAGE: PageLimits = Object.freeze({ maxWidth: 2048, maxHeight: 2048, gutter: 2 });
/** TECH §10.2 (b): level pages 2048 × 1024, more pages when needed. */
export const LEVEL_PAGE: PageLimits = Object.freeze({ maxWidth: 2048, maxHeight: 1024, gutter: 2 });

/** TECH §10.2: when the device's max texture size is below 2048, pages are split to that size. */
export function limitPage(limits: PageLimits, maxTextureSize: number): PageLimits {
  return {
    maxWidth: Math.min(limits.maxWidth, maxTextureSize),
    maxHeight: Math.min(limits.maxHeight, maxTextureSize),
    gutter: limits.gutter,
  };
}

const nextPow2 = (v: number): number => 2 ** Math.ceil(Math.log2(Math.max(1, v)));

interface SkylineSegment {
  x: number;
  y: number;
  w: number;
}

/** Skyline bottom-left packer for one page (y grows downward, so "bottom-left" = lowest y, then lowest x). */
class SkylinePage {
  readonly frames: PlacedFrame[] = [];
  usedW = 0;
  usedH = 0;
  private readonly sky: SkylineSegment[];
  private readonly limits: PageLimits;

  constructor(limits: PageLimits) {
    this.limits = limits;
    this.sky = [{ x: 0, y: 0, w: limits.maxWidth }];
  }

  /** Places a `w × h` cell (gutter included); false when it does not fit. */
  tryPlace(f: FrameSpec, w: number, h: number): boolean {
    let best: { i: number; x: number; y: number } | null = null;
    for (let i = 0; i < this.sky.length; i++) {
      const x = (this.sky[i] as SkylineSegment).x;
      if (x + w > this.limits.maxWidth) break;
      let y = 0;
      let covered = 0;
      for (let j = i; covered < w; j++) {
        const seg = this.sky[j] as SkylineSegment;
        y = Math.max(y, seg.y);
        covered += seg.x + seg.w - Math.max(x, seg.x);
      }
      if (y + h > this.limits.maxHeight) continue;
      if (best === null || y < best.y) best = { i, x, y };
    }
    if (best === null) return false;
    const g = this.limits.gutter;
    this.frames.push({ ...f, x: best.x + g, y: best.y + g });
    this.usedW = Math.max(this.usedW, best.x + w);
    this.usedH = Math.max(this.usedH, best.y + h);
    this.sky.splice(best.i, 0, { x: best.x, y: best.y + h, w });
    for (let j = best.i + 1; j < this.sky.length;) {
      const prev = this.sky[j - 1] as SkylineSegment;
      const seg = this.sky[j] as SkylineSegment;
      const overlap = prev.x + prev.w - seg.x;
      if (overlap <= 0) break;
      seg.x += overlap;
      seg.w -= overlap;
      if (seg.w > 0) break;
      this.sky.splice(j, 1);
    }
    for (let j = 1; j < this.sky.length;) {
      const prev = this.sky[j - 1] as SkylineSegment;
      const seg = this.sky[j] as SkylineSegment;
      if (prev.y === seg.y) {
        prev.w += seg.w;
        this.sky.splice(j, 1);
      } else j++;
    }
    return true;
  }
}

/**
 * Deterministic packing (skyline, bottom-left): frames sorted by height, width (descending) then name; each frame goes
 * to the first page where it fits, a new page otherwise. Page sizes shrink to the next power of two that holds the
 * content. Every frame keeps `gutter` transparent px on each side.
 */
export function packFrames(frames: readonly FrameSpec[], limits: PageLimits): AtlasPage[] {
  const g = limits.gutter;
  const names = new Set<string>();
  for (const f of frames) {
    for (const n of [f.name, ...f.aliases]) {
      if (names.has(n)) throw new Error(`packFrames: duplicate frame name ${n}`);
      names.add(n);
    }
    if (f.w + 2 * g > limits.maxWidth || f.h + 2 * g > limits.maxHeight) {
      throw new RangeError(`packFrames: frame ${f.name} (${f.w}×${f.h}) exceeds the page`);
    }
  }
  const sorted = [...frames].sort(
    (a, b) => b.h - a.h || b.w - a.w || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
  );
  const pages: SkylinePage[] = [];
  for (const f of sorted) {
    const w = f.w + 2 * g;
    const h = f.h + 2 * g;
    if (pages.some((p) => p.tryPlace(f, w, h))) continue;
    const page = new SkylinePage(limits);
    page.tryPlace(f, w, h);
    pages.push(page);
  }
  return pages.map((p) => ({
    width: Math.min(limits.maxWidth, nextPow2(p.usedW)),
    height: Math.min(limits.maxHeight, nextPow2(p.usedH)),
    frames: p.frames,
  }));
}

/** Clears the page and draws every frame clipped to its rectangle. */
export function renderPage(ctx: DrawContext, page: AtlasPage): void {
  ctx.clearRect(0, 0, page.width, page.height);
  for (const f of page.frames) drawInFrame(ctx, f.x, f.y, f, () => f.draw(ctx));
}

// ---------------------------------------------------------------------------------------------------------------
// Frame names (the scene looks frames up by these names through the TextureIndex).

/** Names follow TECH §10.2–10.3 and ASSET_LIST §3 (`board_*`, `plan_*`, `plan_<c>_front`, `board_blueprint_deep`). */
export const FRAME = Object.freeze({
  hidden: 'plan_hidden',
  front: 'plan_front',
  supportHatch: 'plan_support_hatch',
  /** UX §5.4 45° hatch on the cells of the shadow's primary reason (`debris`, `outside`, `window`, `color`). */
  wrongHatch: 'ghost_hatch45',
  /** UX §5.4 fall path: dashed vertical strip, cropped by the scene. */
  fallPath: 'ghost_path',
  blueprintFloor: 'board_blueprint',
  blueprintDeep: 'board_blueprint_deep',
  blueprintCorner: 'board_blueprint_corner',
  yardFloor: 'board_yard_floor',
  scaffoldPole: 'board_scaffold_pole',
  scaffoldLedger: 'board_scaffold_ledger',
  scaffoldClamp: 'board_scaffold_clamp',
  ceilingBeam: 'board_ceiling_beam',
  gapRail: 'gap_rail',
  craneLine: 'crane_line',
  whitePixel: 'px_white',
  wall: 'wall',
});

export const planFrameName = (color: ColorCode): string => `plan_${color}`;
/** Build-front variant of a plan cell (+`plan.frontLighten` fill, symbol unchanged); `plan_front` goes on top. */
export const planFrontFrameName = (color: ColorCode): string => `plan_${color}_front`;
export const badgeFrameName = (kind: BadgeKind): string => `ghost_badge_${kind}`;
/** `blk_<shape>_<colour>[_<flag>…]` (ASSET §2); flags in BAKED_FLAGS order. */
export function blockFrameName(shape: ShapeId, color: ColorCode, flags: readonly BakedFlag[] = []): string {
  const sorted = BAKED_FLAGS.filter((f) => flags.includes(f));
  return ['blk', shape, color, ...sorted].join('_');
}
/** `blk_sil_<shape>_<contact|lifted|crane>` (ASSET §2). Shape ids never read `sil`, so no clash with block frames. */
export const silhouetteFrameName = (shape: ShapeId, kind: SilhouetteKind): string =>
  `blk_sil_${shape}_${kind}`;
export const ghostFrameName = (shape: ShapeId, style: GhostStyle): string => `ghost_${shape}_${style}`;
/** Blueprint grid overlay for a plan of height `rows`. */
export const gridFrameName = (rows: number): string => `grid_h${rows}`;
/** `.` overlay of segment `seg`. */
export const dotsFrameName = (seg: number): string => `dots_s${seg}`;

const frame = (
  name: string,
  size: { readonly w: number; readonly h: number },
  draw: (ctx: DrawContext) => void,
  extra: Partial<Pick<FrameSpec, 'anchorX' | 'anchorY' | 'aliases'>> = {},
): FrameSpec => ({
  name,
  w: size.w,
  h: size.h,
  anchorX: extra.anchorX ?? 0,
  anchorY: extra.anchorY ?? 0,
  aliases: extra.aliases ?? [],
  draw,
});

/**
 * Length of the frames that are uniform along one axis (scaffold pole: vertical; ledger, ceiling beam: horizontal).
 * The scene stretches them with `setDisplaySize` (pole = site height), which keeps the boot atlas small.
 */
export const STRETCH_PX = 16;

/** W1 rail length: through the wall opening and across the site (`wallW + buildCols·cellPx`); its sleepers do not stretch. */
export const gapRailLength = (tokens: Tokens): number =>
  tokens.layout.grid.wallW + tokens.layout.grid.buildCols * tokens.layout.grid.cellPx;

/**
 * Length of the baked fall-path strip: the board height (8 rows, 960 px — inside a 1024 px page, TECH §10.2 small
 * devices). A longer gap (block in the crane rows over an empty column) shows the strip's last 960 px, ending on the
 * shadow.
 */
export const FALL_PATH_LENGTH = (tokens: Tokens): number =>
  tokens.layout.grid.rows * tokens.layout.grid.cellPx;

/** Seed of the blueprint paper speckle: fixed, so every bake is identical (ART §4 "tohumlu gürültü, sabit"). */
export const BLUEPRINT_SEED = 0x6d75; // "mu"

/** Bake variant during the Faz 2R transition (TECH §2R.7): v1 = ART §3, v2 = ART §3A / §2.4 DL-2R-18. */
export type TextureVariant = 'v1' | 'v2';

/** `ui_yard_preview` (UX §5.3): v2 dotted drop preview of one yard cell. */
export const YARD_PREVIEW_FRAME = 'ui_yard_preview';

/** TECH §10.2 (a): boot atlas frames (`variant` v2: pegboard yard floor + the yard drop preview). */
export function bootAtlasFrames(
  tokens: Tokens,
  mode: DrawMode = DEFAULT_MODE,
  variant: TextureVariant = 'v1',
): FrameSpec[] {
  const g = tokens.layout.grid;
  const c = g.cellPx;
  const cell = cellSize(tokens);
  const siteW = g.buildCols * c;
  const boardW = g.buildX + siteW - g.yardX;
  return [
    ...COLOR_CODES.map((color) =>
      frame(planFrameName(color), cell, (ctx) => drawPlanCell(ctx, { color, mode }, tokens)),
    ),
    ...COLOR_CODES.map((color) =>
      frame(planFrontFrameName(color), cell, (ctx) =>
        drawPlanCell(ctx, { color, mode, front: true }, tokens),
      ),
    ),
    frame(FRAME.hidden, cell, (ctx) => drawHiddenCell(ctx, tokens)),
    frame(FRAME.front, cell, (ctx) => drawBuildFront(ctx, tokens)),
    frame(FRAME.supportHatch, cell, (ctx) => drawSupportHatch(ctx, { mode }, tokens)),
    frame(FRAME.wrongHatch, cell, (ctx) => drawWrongHatch(ctx, { mode }, tokens)),
    frame(FRAME.fallPath, fallPathSize({ length: FALL_PATH_LENGTH(tokens) }), (ctx) =>
      drawFallPath(ctx, { length: FALL_PATH_LENGTH(tokens) }),
    ),
    ...BADGE_KINDS.map((kind) =>
      frame(badgeFrameName(kind), badgeSize({ kind, mode }, tokens), (ctx) =>
        drawGhostBadge(ctx, { kind, mode }, tokens),
      ),
    ),
    frame(FRAME.blueprintFloor, { w: siteW, h: siteW }, (ctx) =>
      drawBlueprintFloor(ctx, { w: siteW, h: siteW, seed: BLUEPRINT_SEED }, tokens),
    ),
    frame(FRAME.blueprintDeep, cell, (ctx) => drawBlueprintDeep(ctx, cell, tokens)),
    frame(FRAME.blueprintCorner, blueprintCornerSize(tokens), (ctx) => drawBlueprintCorner(ctx, tokens)),
    variant === 'v2'
      ? frame(FRAME.yardFloor, yardFloorV2Size(tokens), (ctx) => drawYardFloorV2(ctx, tokens))
      : frame(FRAME.yardFloor, yardFloorSize(tokens), (ctx) => drawYardFloor(ctx, tokens)),
    ...(variant === 'v2'
      ? [frame(YARD_PREVIEW_FRAME, cellSize(tokens), (ctx) => drawYardPreviewCell(ctx, tokens))]
      : []),
    frame(FRAME.scaffoldPole, { w: ART.scaffoldPolePx, h: STRETCH_PX }, (ctx) =>
      drawScaffoldPole(ctx, { length: STRETCH_PX }, tokens),
    ),
    frame(FRAME.scaffoldLedger, { w: STRETCH_PX, h: ART.scaffoldLedgerPx }, (ctx) =>
      drawScaffoldLedger(ctx, { length: STRETCH_PX }, tokens),
    ),
    frame(FRAME.scaffoldClamp, scaffoldClampSize(), (ctx) => drawScaffoldClamp(ctx, tokens)),
    frame(FRAME.ceilingBeam, { w: STRETCH_PX, h: tokens.plan.ceilingBeamPx }, (ctx) =>
      drawCeilingBeam(ctx, { length: STRETCH_PX }, tokens),
    ),
    frame(FRAME.gapRail, gapRailSize({ length: gapRailLength(tokens) }), (ctx) =>
      drawGapRail(ctx, { length: gapRailLength(tokens) }, tokens),
    ),
    frame(FRAME.craneLine, { w: boardW, h: ART.craneLinePx }, (ctx) =>
      drawCraneLine(ctx, { length: boardW }, tokens),
    ),
    frame(FRAME.whitePixel, { w: 4, h: 4 }, (ctx) => drawWhitePixel(ctx, { w: 4, h: 4 })),
  ];
}

/** Baked flags of a compiled piece's flag bits (state FLAG_BIT). */
export function bakedFlagsOf(bits: number): BakedFlag[] {
  return BAKED_FLAGS.filter((f) => (bits & FLAG_BIT[f]) !== 0);
}

/** Options of the v2 level bake. */
export interface BakeOptions {
  readonly variant?: TextureVariant;
  /** Cell scale k = c / 120 (TECH §2R.1); v2 only. */
  readonly k?: number;
}

/** Frames of one block combination (also used for on-demand bakes: paint booster / paint gate colours, K-38, W6). */
export function blockFrame(spec: BlockSpec, tokens: Tokens, opts: BakeOptions = {}): FrameSpec {
  if (opts.variant === 'v2') {
    const k = opts.k ?? 1;
    return frame(
      blockFrameName(spec.shape, spec.color, spec.flags ?? []),
      blockV2Size(spec.shape, tokens, k),
      (ctx) =>
        drawBlockV2(
          ctx,
          {
            shape: spec.shape,
            color: spec.color,
            flags: spec.flags ?? [],
            mode: spec.mode ?? DEFAULT_MODE,
            k,
          },
          tokens,
        ),
    );
  }
  return frame(
    blockFrameName(spec.shape, spec.color, spec.flags ?? []),
    blockSize(spec.shape, tokens),
    (ctx) => drawBlock(ctx, spec, tokens),
  );
}

/** `blk_gloss_<shape>`: colourless stud gloss over holdable pieces only (ART §3A.5 6e–6f, DL-2R-17). */
export const glossFrameName = (shape: ShapeId): string => `blk_gloss_${shape}`;
/** `blk_glow_<shape>`: white lift glow ring, tinted with the colour's glow tone (ART §3A.2, JUICE #91). */
export const glowFrameName = (shape: ShapeId): string => `blk_glow_${shape}`;
/** `cargo_q9`, `cargo_i5` (ART §6, ASSET §16.5). */
export const cargoFrameName = (kind: CargoKind): string => `cargo_${kind.toLowerCase()}`;

/** v2 frames of one shape: silhouettes, ghosts, holdable gloss and lift glow (all anchored on the block box). */
export function shapeFramesV2(
  shape: ShapeId,
  tokens: Tokens,
  mode: DrawMode = DEFAULT_MODE,
  k = 1,
): FrameSpec[] {
  const out: FrameSpec[] = [];
  const sameBlur = tokens.shadow.crane.blur === tokens.shadow.lifted.blur;
  const kinds: SilhouetteKind[] = sameBlur ? ['contact', 'lifted'] : ['contact', 'lifted', 'crane'];
  for (const kind of kinds) {
    const pad = silhouettePad(kind, tokens);
    out.push(
      frame(
        silhouetteFrameName(shape, kind),
        silhouetteV2Size({ shape, kind, k }, tokens),
        (ctx) => drawSilhouetteV2(ctx, { shape, kind, k }, tokens),
        {
          anchorX: pad,
          anchorY: pad,
          aliases: kind === 'lifted' && sameBlur ? [silhouetteFrameName(shape, 'crane')] : [],
        },
      ),
    );
  }
  const pad = ghostPad(tokens, mode);
  for (const style of GHOST_STYLES) {
    out.push(
      frame(
        ghostFrameName(shape, style),
        ghostV2Size({ shape, mode, k }, tokens),
        (ctx) => drawGhostV2(ctx, { shape, style, mode, k }, tokens),
        { anchorX: pad, anchorY: pad },
      ),
    );
  }
  out.push(
    frame(glossFrameName(shape), blockV2Size(shape, tokens, k), (ctx) =>
      drawBlockGlossV2(ctx, { shape, k }, tokens),
    ),
  );
  const gp = liftGlowPad(tokens, k);
  out.push(
    frame(
      glowFrameName(shape),
      liftGlowSize({ shape, k }, tokens),
      (ctx) => drawLiftGlowV2(ctx, { shape, k }, tokens),
      {
        anchorX: gp,
        anchorY: gp,
      },
    ),
  );
  return out;
}

/** Heavy Load kind of a shape id, or null (K-44: I5 / Q9 pieces are cargo, ART §6). */
export function cargoKindOf(shape: ShapeId): CargoKind | null {
  const kind = shape.slice(0, shape.indexOf('_'));
  return (CARGO_KINDS as readonly string[]).includes(kind) ? (kind as CargoKind) : null;
}

export function cargoFrame(kind: CargoKind, tokens: Tokens, k = 1): FrameSpec {
  return frame(cargoFrameName(kind), cargoSize(kind, tokens, k), (ctx) =>
    drawCargo(ctx, { kind, k }, tokens),
  );
}

/** Silhouette and ghost frames of one shape (anchored at the block box). */
export function shapeFrames(shape: ShapeId, tokens: Tokens, mode: DrawMode = DEFAULT_MODE): FrameSpec[] {
  const out: FrameSpec[] = [];
  const sameBlur = tokens.shadow.crane.blur === tokens.shadow.lifted.blur;
  const kinds: SilhouetteKind[] = sameBlur ? ['contact', 'lifted'] : ['contact', 'lifted', 'crane'];
  for (const kind of kinds) {
    const pad = silhouettePad(kind, tokens);
    out.push(
      frame(
        silhouetteFrameName(shape, kind),
        silhouetteSize({ shape, kind }, tokens),
        (ctx) => drawSilhouette(ctx, { shape, kind }, tokens),
        {
          anchorX: pad,
          anchorY: pad,
          aliases: kind === 'lifted' && sameBlur ? [silhouetteFrameName(shape, 'crane')] : [],
        },
      ),
    );
  }
  const pad = ghostPad(tokens, mode);
  for (const style of GHOST_STYLES) {
    out.push(
      frame(
        ghostFrameName(shape, style),
        ghostSize({ shape, style, mode }, tokens),
        (ctx) => drawGhost(ctx, { shape, style, mode }, tokens),
        { anchorX: pad, anchorY: pad },
      ),
    );
  }
  return out;
}

/**
 * TECH §10.2 (b): level frames. Pieces of every batch (truck batches included, known from the level data) and debris;
 * D2 help slots are coloured at runtime and baked on demand with `blockFrame`. Shapes are the canonical ids the core
 * stores (K-44), so `O4_90` pieces share the `O4_0` frame.
 */
export function levelFrames(
  level: CompiledLevel,
  tokens: Tokens,
  mode: DrawMode = DEFAULT_MODE,
  opts: BakeOptions = {},
): FrameSpec[] {
  const v2 = opts.variant === 'v2';
  const k = opts.k ?? 1;
  const combos = new Map<string, BlockSpec>();
  const shapes = new Set<ShapeId>();
  const cargo = new Set<CargoKind>();
  for (const p of level.pieces) {
    if (p.origin === 'help') continue;
    const shape = shapeByIndex(p.shapeIndex).id;
    const heavy = v2 ? cargoKindOf(shape) : null;
    if (heavy) {
      // ART §6: the Heavy Load is one colourless piece with its own frame (no block, no gloss)
      cargo.add(heavy);
      shapes.add(shape);
      continue;
    }
    const color = COLOR_CODES[p.colorIndex];
    if (color === undefined) throw new RangeError(`levelFrames: bad colour index ${p.colorIndex}`);
    const flags = bakedFlagsOf(p.flags);
    combos.set(blockFrameName(shape, color, flags), { shape, color, flags, mode });
    shapes.add(shape);
  }
  const out: FrameSpec[] = [];
  for (const spec of combos.values()) out.push(blockFrame(spec, tokens, opts));
  for (const shape of shapes)
    out.push(...(v2 ? shapeFramesV2(shape, tokens, mode, k) : shapeFrames(shape, tokens, mode)));
  for (const kind of cargo) out.push(cargoFrame(kind, tokens, k));

  const cols = tokens.layout.grid.buildCols;
  const heights = new Set(level.segments.map((s) => s.height));
  for (const rows of heights) {
    out.push(
      frame(gridFrameName(rows), blueprintGridSize({ rows, cols }, tokens), (ctx) =>
        drawBlueprintGrid(ctx, { rows, cols }, tokens),
      ),
    );
  }
  for (const seg of level.segments) {
    const dots: { x: number; y: number }[] = [];
    seg.planColors.forEach((v, i) => {
      if (v === PLAN_DOT) dots.push({ x: i % cols, y: Math.floor(i / cols) });
    });
    if (dots.length === 0) continue;
    const spec = { rows: seg.height, cols, dots };
    out.push(
      frame(dotsFrameName(seg.index), blueprintGridSize(spec, tokens), (ctx) =>
        drawPlanDots(ctx, spec, tokens),
      ),
    );
  }

  const wall = {
    height: level.wallHeight,
    gaps: level.gaps.map((g) => ({ y: g.y, size: g.size, type: g.type })),
  };
  const size = wallSize(wall, tokens);
  if (size.w > 0) {
    const off = wallFrameOffset(tokens);
    out.push(
      frame(FRAME.wall, size, (ctx) => drawWall(ctx, wall, tokens), { anchorX: -off.x, anchorY: -off.y }),
    );
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// (c) Kit atlas (ART §14, §15; TECH §2R.7): baked once at boot, behind the intro panels

/** TECH §2R.7: kit atlas pages ≤ 2048 × 1024. */
export const KIT_PAGE: PageLimits = Object.freeze({ maxWidth: 2048, maxHeight: 1024, gutter: 2 });
export const KIT_ATLAS_KEY = 'kit';

/** Fixed kit frame names (variable-width items are 9-/3-sliced: insets in `KIT_SLICES`). */
export const KIT = Object.freeze({
  close: 'ui_close',
  closePressed: 'ui_close_pressed',
  plus: 'ui_plus',
  plusPressed: 'ui_plus_pressed',
  shine: 'ui_button_shine',
  panel: 'ui_panel',
  panelHud: 'ui_panel_hud',
  inset: 'ui_panel_inset',
  badge: 'ui_badge',
  badgeLocked: 'ui_badge_locked',
  truckSubBadge: 'ui_truck_subbadge',
  capsule: 'ui_capsule',
  progressTrack: 'ui_progress_track',
  progressFill: 'ui_progress_fill',
  navBar: 'ui_nav_bar',
  navTab: 'ui_nav_tab_selected',
  bubble: 'ui_tutorial_bubble',
  highlight: 'ui_highlight',
  portraitRing: 'ui_portrait_ring',
  nextFloor: 'ui_badge_nextfloor',
  blocksLeft: 'ui_blocks_left_icon',
  blocksLeftCompact: 'ui_blocks_left_icon_72',
  yardFrame: 'yard_frame',
});

export const ribbonFrameName = (color: (typeof KIT_RIBBON_COLORS)[number]): string => `ui_ribbon_${color}`;
export const bubbleTailFrameName = (dir: TailDir): string => `ui_tutorial_bubble_tail_${dir}`;

/** Source sizes of the sliced kit frames (the scene stretches them with NineSlice). */
const KIT_SRC = Object.freeze({
  panel: { w: 192, h: 192 },
  panelHud: { w: 112, h: 112 },
  inset: { w: 96, h: 96 },
  ribbonBodyW: 480,
  capsuleW: 128,
  progressW: 112,
  progressFillW: 72,
  navBarW: 8,
  bubble: { w: 160, h: 140 },
  highlight: 160,
});

/** Close (×) and plus (+) diameters (R2-12 red round ×; `kit.capsule.plusPx` green +). */
export const KIT_CLOSE_PX = 112;
/** The "Bölüm N" button the shine band is sized for (UX §3, `layout.home.playButtonW/H`). */
const shineFor = (tokens: Tokens): { buttonW: number; h: number } => ({
  buttonW: tokens.layout.home.playButtonW,
  h: tokens.layout.home.playButtonH,
});

/** 9-/3-slice insets per sliced kit frame name (`top = bottom = 0` → 3-slice; the frame height is final). */
export function kitSlices(tokens: Tokens): ReadonlyMap<string, Slices> {
  const m = new Map<string, Slices>();
  for (const color of KIT_BUTTON_COLORS) {
    for (const h of KIT_BUTTON_HEIGHTS) {
      for (const state of kitButtonStates(color)) {
        m.set(kitButtonFrameName(color, h, state), buttonSlices({ color, w: 0, h }, tokens));
      }
    }
  }
  m.set(KIT.panel, panelSlices('frame', tokens));
  m.set(KIT.panelHud, panelSlices('hud', tokens));
  m.set(KIT.inset, insetSlices());
  for (const c of KIT_RIBBON_COLORS) m.set(ribbonFrameName(c), ribbonSlices(tokens));
  m.set(KIT.capsule, capsuleSlices(tokens));
  m.set(KIT.progressTrack, progressSlices(tokens));
  m.set(KIT.progressFill, progressFillSlices(tokens));
  m.set(KIT.bubble, bubbleSlices(tokens));
  m.set(KIT.highlight, highlightSlices(tokens));
  m.set(KIT.yardFrame, yardFrameSlices(tokens));
  return m;
}

/** Which button states a colour bakes: grey is the pasif/locked colour (normal + disabled), the rest normal + pressed. */
export function kitButtonStates(color: KitButtonColor): readonly ButtonState[] {
  return color === 'grey' ? ['normal', 'disabled'] : ['normal', 'pressed'];
}

/** One kit button frame (on-demand bakes of other heights use the same naming). */
export function kitButtonFrame(
  color: KitButtonColor,
  h: number,
  state: ButtonState,
  tokens: Tokens,
): FrameSpec {
  const w = kitButtonSourceW(h, tokens);
  return frame(kitButtonFrameName(color, h, state), buttonFrameSize({ color, w, h }, tokens), (ctx) =>
    drawButton(ctx, { color, w, h, state }, tokens),
  );
}

/** TECH §2R.7 kit atlas: buttons (6 colours × KIT_BUTTON_HEIGHTS), round ×/+, shine, panels, ribbons, badges,
 * capsule, progress, navigation, bubble + tails, highlight, portrait ring, HUD badges, blocks-left icons, yard frame,
 * the tutorial glove and the fx frames. */
export function kitAtlasFrames(tokens: Tokens): FrameSpec[] {
  const out: FrameSpec[] = [];
  for (const color of KIT_BUTTON_COLORS) {
    for (const h of KIT_BUTTON_HEIGHTS)
      for (const st of kitButtonStates(color)) out.push(kitButtonFrame(color, h, st, tokens));
  }
  for (const [name, color, d, glyph, state] of [
    [KIT.close, 'red', KIT_CLOSE_PX, 'close', 'normal'],
    [KIT.closePressed, 'red', KIT_CLOSE_PX, 'close', 'pressed'],
    [KIT.plus, 'green', tokens.kit.capsule.plusPx, 'plus', 'normal'],
    [KIT.plusPressed, 'green', tokens.kit.capsule.plusPx, 'plus', 'pressed'],
  ] as const) {
    out.push(
      frame(name, roundButtonFrameSize({ color, d, glyph }, tokens), (ctx) =>
        drawRoundButton(ctx, { color, d, glyph, state }, tokens),
      ),
    );
  }
  out.push(
    frame(KIT.shine, shineSize(shineFor(tokens), tokens), (ctx) =>
      drawButtonShine(ctx, shineFor(tokens), tokens),
    ),
  );
  out.push(
    frame(KIT.panel, panelFrameSize({ ...KIT_SRC.panel, variant: 'frame' }, tokens), (ctx) =>
      drawPanel(ctx, { ...KIT_SRC.panel, variant: 'frame' }, tokens),
    ),
    frame(KIT.panelHud, panelFrameSize({ ...KIT_SRC.panelHud, variant: 'hud' }, tokens), (ctx) =>
      drawPanel(ctx, { ...KIT_SRC.panelHud, variant: 'hud' }, tokens),
    ),
    frame(KIT.inset, KIT_SRC.inset, (ctx) => drawInset(ctx, KIT_SRC.inset, tokens)),
  );
  for (const color of KIT_RIBBON_COLORS) {
    out.push(
      frame(ribbonFrameName(color), ribbonFrameSize({ bodyW: KIT_SRC.ribbonBodyW }, tokens), (ctx) =>
        drawRibbon(ctx, { color, bodyW: KIT_SRC.ribbonBodyW }, tokens),
      ),
    );
  }
  const badgePx = tokens.kit.badge.diameterPx;
  const subPx = tokens.layout.hud.truckSubBadgePx;
  out.push(
    frame(KIT.badge, badgeFrameSize(badgePx), (ctx) =>
      drawBadge(ctx, { variant: 'red', sizePx: badgePx }, tokens),
    ),
    frame(KIT.badgeLocked, badgeFrameSize(badgePx), (ctx) =>
      drawBadge(ctx, { variant: 'locked', sizePx: badgePx }, tokens),
    ),
    frame(KIT.truckSubBadge, badgeFrameSize(subPx), (ctx) =>
      drawBadge(ctx, { variant: 'red', sizePx: subPx }, tokens),
    ),
    frame(KIT.capsule, { w: KIT_SRC.capsuleW, h: tokens.kit.capsule.heightPx }, (ctx) =>
      drawCapsule(ctx, { w: KIT_SRC.capsuleW }, tokens),
    ),
    frame(KIT.progressTrack, { w: KIT_SRC.progressW, h: tokens.kit.progress.heightPx }, (ctx) =>
      drawProgressTrack(ctx, { w: KIT_SRC.progressW }, tokens),
    ),
    frame(KIT.progressFill, { w: KIT_SRC.progressFillW, h: progressFillHeight(tokens) }, (ctx) =>
      drawProgressFill(ctx, { w: KIT_SRC.progressFillW }, tokens),
    ),
    frame(KIT.navBar, { w: KIT_SRC.navBarW, h: tokens.layout.home.navH }, (ctx) =>
      drawNavBar(ctx, { w: KIT_SRC.navBarW, h: tokens.layout.home.navH }, tokens),
    ),
    frame(KIT.navTab, { w: 200, h: 212 }, (ctx) => drawNavTab(ctx, { w: 200, h: 212 }, tokens)),
    frame(KIT.bubble, bubbleFrameSize(KIT_SRC.bubble, tokens), (ctx) =>
      drawBubble(ctx, KIT_SRC.bubble, tokens),
    ),
  );
  for (const dir of ['left', 'down', 'up'] as const) {
    out.push(
      frame(bubbleTailFrameName(dir), bubbleTailSize(dir, tokens), (ctx) =>
        drawBubbleTail(ctx, { dir }, tokens),
      ),
    );
  }
  const hl = KIT_SRC.highlight;
  const portrait = tokens.tutorial.portraitPx;
  const nf = tokens.layout.hud.nextFloorBadgePx;
  const blIcon = tokens.layout.hud.goalChipIconPx;
  const blCompact = tokens.layout.hud.goalChipIconCompactPx;
  out.push(
    frame(KIT.highlight, { w: hl, h: hl }, (ctx) => drawHighlight(ctx, { w: hl, h: hl }, tokens)),
    frame(KIT.portraitRing, { w: portrait, h: portrait }, (ctx) =>
      drawPortraitRing(ctx, { d: portrait }, tokens),
    ),
    frame(KIT.nextFloor, { w: nf, h: nf }, (ctx) => drawNextFloorBadge(ctx, { d: nf }, tokens)),
    frame(KIT.blocksLeft, { w: blIcon, h: blIcon }, (ctx) => drawBlocksLeftIcon(ctx, blIcon, tokens)),
    frame(KIT.blocksLeftCompact, { w: blCompact, h: blCompact }, (ctx) =>
      drawBlocksLeftIcon(ctx, blCompact, tokens),
    ),
    frame(KIT.yardFrame, yardFrameSize(tokens), (ctx) => drawYardFrameV2(ctx, yardFrameSize(tokens), tokens)),
    frame(FX.sparkle, FX_SIZE.sparkle, (ctx) => drawSparkle(ctx)),
    frame(FX.star, FX_SIZE.star, (ctx) => drawSmallStar(ctx, tokens)),
    frame(FX.ring, FX_SIZE.ring, (ctx) => drawRing(ctx)),
    frame(FX.sunburst, FX_SIZE.sunburst, (ctx) => drawSunburst(ctx, tokens)),
    frame(FX.dust, FX_SIZE.dust, (ctx) => drawDust(ctx)),
    frame(FX.gold, FX_SIZE.gold, (ctx) => drawGoldParticle(ctx, tokens)),
    frame(FX.confetti, FX_SIZE.confetti, (ctx) => drawConfetti(ctx)),
  );
  return out;
}

/** Highlight frame inset: the target box starts `highlightPad` inside the 9-sliced highlight frame. */
export const highlightInset = (tokens: Tokens): number => highlightPad(tokens);

// ---------------------------------------------------------------------------------------------------------------
// (d) Procedural fallbacks of the SVG art (ASSET §16.3 "Prosedürel yedek"; baked on demand by services/assets.ts)

/** `icons_fallback`: the 21 procedural icons, 128 px each, frame names `icon_<name>` like `icons_v2`. */
export const ICONS_FALLBACK_KEY = 'icons_fallback';
export const ICON_PAGE: PageLimits = Object.freeze({ maxWidth: 1024, maxHeight: 1024, gutter: 2 });

export function iconFallbackFrames(tokens: Tokens): FrameSpec[] {
  return ICON_NAMES.map((name) =>
    frame(iconFrameName(name), { w: ICON_PX, h: ICON_PX }, (ctx) => drawKitIcon(ctx, name, tokens)),
  );
}

/** A single-image fallback: texture size + drawer. */
export interface FallbackArt {
  readonly w: number;
  readonly h: number;
  draw(ctx: DrawContext): void;
}

/**
 * Fallback of one ASSET §16.3 image key at its raster size, or null when the art has no procedural version
 * (`bg_level_site_edge`: the scene simply has no edge silhouettes, ART §7.1).
 */
export function fallbackArt(
  key: string,
  raster: { readonly w: number; readonly h: number },
  tokens: Tokens,
): FallbackArt | null {
  const { w, h } = raster;
  if ((CHARACTER_IDS as readonly string[]).includes(key)) {
    const id = key as CharacterId;
    return { w, h, draw: (ctx) => drawCharacter(ctx, id, { w, h }, tokens) };
  }
  switch (key) {
    case 'bg_home_town':
      return { w, h, draw: (ctx) => drawTownFallback(ctx, { w, h }, tokens) };
    case 'bg_win_plaza':
      return { w, h, draw: (ctx) => drawWinPlazaFallback(ctx, { w, h }, tokens) };
    case 'town_ch1_treehouse':
    case 'town_ch1_treehouse_ghost': {
      const ghost = key.endsWith('_ghost');
      return {
        w,
        h,
        draw: (ctx) => {
          ctx.save();
          ctx.scale(w / STRUCTURE_SIZE.w, h / STRUCTURE_SIZE.h);
          drawStructureFallback(ctx, ghost ? 'ghost' : 'color', tokens);
          ctx.restore();
        },
      };
    }
    case 'ui_tutorial_glove':
      return {
        w,
        h,
        draw: (ctx) => {
          ctx.save();
          ctx.scale(w / tokens.tutorial.gloveW, h / tokens.tutorial.gloveH);
          drawGlove(ctx, tokens);
          ctx.restore();
        },
      };
    case 'logo_emblem':
      return {
        w,
        h,
        draw: (ctx) => {
          ctx.save();
          ctx.scale(w / 360, h / 360);
          drawLogoEmblemFallback(ctx, tokens);
          ctx.restore();
        },
      };
    default:
      return null;
  }
}

/** Usta Dede's round portrait (ART §14.8) when `chr_dede_bust` is not loaded. */
export const PORTRAIT_KEY = 'ui_portrait_dede';
export function dedePortraitFallback(tokens: Tokens): FallbackArt {
  const d = tokens.tutorial.portraitPx;
  return { w: d, h: d, draw: (ctx) => drawDedePortrait(ctx, d, tokens) };
}

/** viewBox of the characters (re-exported for the asset catalogue tests). */
export { CHARACTER_VIEWBOX };

// ---------------------------------------------------------------------------------------------------------------
// Upload (Phaser)

/**
 * The part of a Phaser `CanvasTexture` the uploads use (structural: Phaser's class satisfies it, tests pass fakes and
 * engine-free services can hold it without importing Phaser).
 */
export interface CanvasTextureLike {
  readonly context: CanvasRenderingContext2D;
  readonly width: number;
  readonly height: number;
  add(name: string, sourceIndex: number, x: number, y: number, width: number, height: number): unknown;
  refresh(): unknown;
}

/** The part of Phaser's `TextureManager` the uploads use. */
export interface TextureHost {
  exists(key: string): boolean;
  remove(key: string): unknown;
  createCanvas(key: string, width: number, height: number): CanvasTextureLike | null;
}

/** Compile-time proof that Phaser's manager fits `TextureHost` (a type error here means the Phaser API moved). */
type FitsHost<T extends TextureHost> = T;
export type PhaserTextureHost = FitsHost<Phaser.Textures.TextureManager>;

/** Where a named frame lives after upload. Place an image at the logical top-left with origin (anchorX/w, anchorY/h). */
export interface FrameRef {
  readonly key: string;
  readonly frame: string;
  readonly w: number;
  readonly h: number;
  readonly anchorX: number;
  readonly anchorY: number;
}

export interface UploadedAtlas {
  /** Phaser texture keys, one per page (`key`, then `key#1`, `key#2` …). */
  readonly keys: readonly string[];
  readonly index: ReadonlyMap<string, FrameRef>;
  /** Re-uploads every page from its kept canvas (Phaser `RESTORE_WEBGL`, TECH §10.2). */
  refresh(): void;
}

export const pageKey = (key: string, page: number): string => (page === 0 ? key : `${key}#${page}`);

/**
 * The only Phaser-facing function of the theme layer: one `CanvasTexture` per page, frames drawn with Canvas2D,
 * frames (and aliases) registered, one `refresh()` per page. An existing texture with the same key is replaced
 * (colour-blind re-bake, level restart).
 */
export function uploadAtlas(textures: TextureHost, key: string, pages: readonly AtlasPage[]): UploadedAtlas {
  const index = new Map<string, FrameRef>();
  const uploaded: CanvasTextureLike[] = [];
  const keys = pages.map((page, i) => {
    const k = pageKey(key, i);
    if (textures.exists(k)) textures.remove(k);
    const tex = textures.createCanvas(k, page.width, page.height);
    if (!tex) throw new Error(`uploadAtlas: could not create canvas texture ${k}`);
    renderPage(tex.context, page);
    for (const f of page.frames) {
      for (const name of [f.name, ...f.aliases]) {
        tex.add(name, 0, f.x, f.y, f.w, f.h);
        index.set(name, { key: k, frame: name, w: f.w, h: f.h, anchorX: f.anchorX, anchorY: f.anchorY });
      }
    }
    tex.refresh();
    uploaded.push(tex);
    return k;
  });
  return {
    keys,
    index,
    refresh: () => {
      for (const tex of uploaded) tex.refresh();
    },
  };
}

/** Looks a frame up; a missing frame is a programming error (boot / bake did not include it). */
export function frameRef(index: ReadonlyMap<string, FrameRef>, name: string): FrameRef {
  const ref = index.get(name);
  if (!ref) throw new Error(`texture frame ${name} was not baked`);
  return ref;
}

/** TECH §2R.7: bakes the kit atlas (`kit`, `kit#1` …) once; `maxTextureSize` = the renderer's limit. */
export function bakeKitAtlas(textures: TextureHost, tokens: Tokens, maxTextureSize = 4096): UploadedAtlas {
  return uploadAtlas(
    textures,
    KIT_ATLAS_KEY,
    packFrames(kitAtlasFrames(tokens), limitPage(KIT_PAGE, maxTextureSize)),
  );
}

/**
 * Bakes one fallback image into its own `CanvasTexture` `key` (replacing an existing one) with a single upload. Returns
 * the texture so the caller can `refresh()` it after a WebGL context restore.
 */
export function uploadCanvasArt(textures: TextureHost, key: string, art: FallbackArt): CanvasTextureLike {
  if (textures.exists(key)) textures.remove(key);
  const tex = textures.createCanvas(key, Math.ceil(art.w), Math.ceil(art.h));
  if (!tex) throw new Error(`uploadCanvasArt: could not create canvas texture ${key}`);
  tex.context.clearRect(0, 0, tex.width, tex.height);
  tex.context.save();
  art.draw(tex.context);
  tex.context.restore();
  tex.refresh();
  return tex;
}
