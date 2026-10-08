/**
 * The board ground and the build site (docs/TECH_DESIGN.md §2.2 "Ekran eşlemesi", §2R.1, §10.2–§10.3; ART_DIRECTION
 * §2.4, §4–§5, §7.1; UX_FLOWS §5.1, §5.8). Every measure comes from the layout (`layout.grid`, `layout.board`: the
 * LEVEL geometry `geo`, EXPAND-shifted, cell `c` and scale `k`), every look from baked frames (theme/textures.ts, the
 * kit atlas); nothing here decides a rule.
 *
 * Static part (rebuilt on a level change or a resize), UX §5.8 region table:
 * - sky (`board.craneSky` α `alpha.craneSky`): the crane area (rows h, h+1) over the whole board, the yard air (rows
 *   hy … h−1 over the yard columns) and the wall air (rows height … h−1 over the wall strip) — one "air" language;
 *   the dashed crane line on the board top;
 * - the yard ("malzeme sandığı"): pegboard cells (`board_yard_floor` v2) over wy × hy and the wooden `yard_frame`
 *   9-slice only around them (`adaptive.yardFramePx`, kit atlas);
 * - the site: blueprint floor up to the plan, `board_blueprint_deep` above it (site air), scaffold poles up to H and
 *   40 px into the crane area, a ledger every 2 rows;
 * - the wall (K-04): the baked strip of its height (the zero-width boundary, R-03) with its W1 openings and rails.
 * Site part (refreshed after every move): the plan of the segment shown (K-22) — colour cells (`plan_<c>`), unrevealed
 * `?` cells (`plan_hidden`), cells outside the plan (`board_blueprint_deep`), the blueprint grid and `.` overlays, the
 * build front (core `buildFront`, K-34 hook 1) and the ceiling beam on the plan top (S8; every level, ART §4).
 *
 * JUICE hooks (EventPlayer): the front images for the #83 crossfade, the site images for the #18 segment slide, the
 * scaffold for its #18 fade, the support hatch (#84), rail glow (#22), rail clamps (#23), the board dim (#57) and the
 * yard rect for #94. They only expose display objects; timing lives in the EventPlayer.
 */
import type Phaser from 'phaser';
import { visibleSegment } from '../../core/grid.ts';
import { PLAN_DOT, PLAN_OUTSIDE } from '../../core/level/compile.ts';
import type { CompiledLevel } from '../../core/level/compile.ts';
import { buildFront } from '../../core/placement.ts';
import { GF, H, SITE_TROWEL, gapField, hdr, revealedMask, siteOcc } from '../../core/state.ts';
import type { GameState } from '../../core/state.ts';
import { COLOR_CODES } from '../../core/types.ts';
import type { At } from '../../core/types.ts';
import type { Layout, Rect } from '../../theme/layout.ts';
import { ART } from '../../theme/draw/art.ts';
import {
  FRAME,
  KIT,
  dotsFrameName,
  gridFrameName,
  planFrameName,
  planFrontFrameName,
} from '../../theme/textures.ts';
import type { FrameRef } from '../../theme/textures.ts';
import { TOKENS } from '../../theme/tokens.ts';
import { BOOT_ATLAS_KEY, trowelCellFrameName } from '../atlas.ts';
import type { Frames } from '../atlas.ts';
import { DEPTH } from './depth.ts';
import { hexColor, setFrameAt, setFrameCentred, setRect } from './frameImage.ts';

/** Kit atlas lookup (ui/kit/atlas.ts `kitRef`, `kitSlice`); absent in tests without a game. */
export interface BoardKit {
  ref(name: string): FrameRef;
  slice(name: string): { left: number; right: number; top: number; bottom: number } | null;
}

/** UX §5.8: the scaffold poles reach this far into the crane area. */
export const SCAFFOLD_OVERHANG_PX = 40;

/** ART §5 W1 rails: over the plan cells, the blueprint grid and the `.` overlay; under the build front (review Faz 2 tur 2 #2). */
export const RAIL_DEPTH = DEPTH.planOverlay + 2;
/** JUICE #22 rail glow and its light spot: right above the rails. */
export const RAIL_GLOW_DEPTH = RAIL_DEPTH + 1;

/** UX §5.2 "seçilemeyenler %50 soluklaşır". */
export const PICK_DIM_ALPHA = 0.5;

/** Rails of one static gap (W1), for the #22 light flow. */
export interface RailSet {
  readonly gap: number;
  /** Top and bottom rail strips (design px). */
  readonly rails: readonly Rect[];
}

export class BoardView {
  private readonly scene: Phaser.Scene;
  private readonly staticImgs: Phaser.GameObjects.Image[] = [];
  private readonly scaffoldImgs: Phaser.GameObjects.Image[] = [];
  private siteImgs: Phaser.GameObjects.Image[] = [];
  private outgoing: Phaser.GameObjects.Image[] = [];
  private readonly freeImgs: Phaser.GameObjects.Image[] = [];
  private readonly frontImgs: Phaser.GameObjects.Image[] = [];
  private readonly trowelImgs = new Map<string, Phaser.GameObjects.Image>();
  /** Plan-cell images by board cell `x,y` (cell, front fill, front contour) and the `.` overlay (UX §5.2 pick dim). */
  private readonly planImgs = new Map<string, Phaser.GameObjects.Image[]>();
  private dotsImg: Phaser.GameObjects.Image | null = null;
  /** Cells the Golden Trowel pick mode keeps lit (null: no pick mode). */
  private pickLit: ReadonlySet<string> | null = null;
  private readonly hatchImgs: Phaser.GameObjects.Image[] = [];
  private readonly glowImgs: Phaser.GameObjects.Image[] = [];
  private readonly clampImgs: Phaser.GameObjects.Image[] = [];
  private dimImg: Phaser.GameObjects.Image | null = null;
  private rails: RailSet[] = [];
  private lvl: CompiledLevel | null = null;
  private frames: Frames | null = null;
  private readonly kit: BoardKit | null;
  private yardFrameObj: Phaser.GameObjects.NineSlice | null = null;
  private yardRectNow: Rect = { x: 0, y: 0, w: 0, h: 0 };

  constructor(scene: Phaser.Scene, kit: BoardKit | null = null) {
    this.scene = scene;
    this.kit = kit;
  }

  /** Builds the board of `lvl` for `layout` and shows the site of `s`. */
  setLevel(lvl: CompiledLevel, frames: Frames, layout: Layout, s: GameState): void {
    this.lvl = lvl;
    this.frames = frames;
    this.buildStatic(layout, s);
    this.refreshSite(layout, s);
  }

  /** New layout (EXPAND resize, D-015): everything is placed again. */
  relayout(layout: Layout, s: GameState): void {
    if (!this.lvl) return;
    this.buildStatic(layout, s);
    this.refreshSite(layout, s);
  }

  /** Removes every board image (level change). */
  clear(): void {
    for (const img of this.staticImgs) img.destroy();
    this.staticImgs.length = 0;
    this.yardFrameObj?.destroy();
    this.yardFrameObj = null;
    this.scaffoldImgs.length = 0;
    this.releaseOutgoing();
    this.releaseSite();
    for (const img of [...this.hatchImgs, ...this.glowImgs, ...this.clampImgs]) img.setVisible(false);
    this.dimImg?.setVisible(false);
    this.rails = [];
    this.lvl = null;
    this.frames = null;
  }

  // --- static ground --------------------------------------------------------------------------------------------------

  private buildStatic(layout: Layout, s: GameState): void {
    const lvl = this.lvl;
    const f = this.frames;
    if (!lvl || !f) return;
    for (const img of this.staticImgs) img.destroy();
    this.staticImgs.length = 0;
    this.scaffoldImgs.length = 0;
    this.yardFrameObj?.destroy();
    this.yardFrameObj = null;
    const g = layout.grid;
    const geo = g.geo;
    const c = g.cellPx;
    const k = g.k;
    const board = TOKENS.color.board;
    const siteW = geo.ws * c;
    const px = f.ref(FRAME.whitePixel);
    const add = (depth: number): Phaser.GameObjects.Image => {
      const img = this.scene.add.image(0, 0, BOOT_ATLAS_KEY, FRAME.whitePixel).setDepth(depth);
      this.staticImgs.push(img);
      return img;
    };
    const scaffold = (depth: number): Phaser.GameObjects.Image => {
      const img = add(depth);
      this.scaffoldImgs.push(img);
      return img;
    };
    const sky = (r: Rect): void => {
      if (r.w <= 0 || r.h <= 0) return;
      setRect(
        add(DEPTH.boardGround),
        px,
        r.x,
        r.y,
        r.w,
        r.h,
        hexColor(board.craneSky),
        TOKENS.alpha.craneSky,
      );
    };

    // UX §5.8: one "air" band — crane area over the whole board, yard air over the yard, wall air over the wall strip
    const crane = layout.board.crane;
    sky(crane);
    sky(layout.board.yardAir);
    const wallH = Math.min(lvl.wallHeight, geo.h);
    sky({ x: g.wallX, y: g.boardTopY, w: g.wallW, h: (geo.h - wallH) * c });
    // the dashed crane line on the board top (baked as wide as the default board; cropped to this one)
    const line = f.ref(FRAME.craneLine);
    const lineImg = add(DEPTH.boardGround + 2);
    setFrameAt(lineImg, line, g.yardX, g.boardTopY - line.h / 2);
    if (crane.w < line.w) lineImg.setCrop(0, 0, crane.w, line.h);

    // the yard: pegboard cells over wy × hy (ART §2.4) and the wooden frame around them only (UX §5.8)
    const tile = f.ref(FRAME.yardFloor);
    for (let y = 0; y < geo.hy; y++) {
      for (let x = 0; x < geo.wy; x++) {
        const r = g.cellRect(x, y);
        const img = add(DEPTH.boardGround);
        setFrameAt(img, tile, r.x, r.y);
        img.setDisplaySize(c, c);
      }
    }
    const yard = layout.board.yard;
    this.yardRectNow = yard;
    const kit = this.kit;
    const fr = TOKENS.layout.adaptive.yardFramePx;
    if (kit) {
      const ref = kit.ref(KIT.yardFrame);
      const sl = kit.slice(KIT.yardFrame);
      const ns = this.scene.add
        .nineslice(
          yard.x - fr,
          yard.y - fr,
          ref.key,
          ref.frame,
          yard.w + 2 * fr,
          yard.h + 2 * fr,
          sl?.left ?? 0,
          sl?.right ?? 0,
          sl?.top ?? 0,
          sl?.bottom ?? 0,
        )
        .setOrigin(0, 0)
        .setDepth(DEPTH.boardGround + 1);
      this.yardFrameObj = ns;
    }

    // the site: blueprint floor (240 × 240 tiles at k = 1) from the bottom up to the board top, cropped at the top
    const floor = f.ref(FRAME.blueprintFloor);
    const tw = floor.w * k;
    const th = floor.h * k;
    for (let bottom = g.boardBottomY; bottom > g.boardTopY + 0.5; bottom -= th) {
      const top = Math.max(g.boardTopY, bottom - th);
      for (let x = g.buildX; x < g.siteRight - 0.5; x += tw) {
        const w = Math.min(tw, g.siteRight - x);
        const img = add(DEPTH.boardGround);
        setFrameAt(img, floor, x, top);
        img.setScale(k);
        const cropTop = (th - (bottom - top)) / k;
        if (cropTop > 0 || w < tw) img.setCrop(0, cropTop, w / k, floor.h - cropTop);
        img.setY(top - cropTop * k);
      }
    }
    const corner = f.ref(FRAME.blueprintCorner);
    setFrameAt(add(DEPTH.boardGround + 1), corner, g.buildX, g.boardBottomY - corner.h);

    // scaffold (ART §4): poles on both site edges up to H and 40 px into the crane area, a ledger every 2 rows, clamps
    const pole = f.ref(FRAME.scaffoldPole);
    const ledger = f.ref(FRAME.scaffoldLedger);
    const clamp = f.ref(FRAME.scaffoldClamp);
    const poleXs = [g.buildX, g.siteRight];
    const poleTop = g.boardTopY - SCAFFOLD_OVERHANG_PX;
    for (const x of poleXs) {
      const img = scaffold(DEPTH.boardGround + 1);
      setFrameAt(img, pole, x - ART.scaffoldPolePx / 2, poleTop);
      img.setDisplaySize(ART.scaffoldPolePx, g.boardBottomY - poleTop);
    }
    for (let r = 2; r < geo.h; r += 2) {
      const y = g.boardBottomY - r * c;
      const img = scaffold(DEPTH.boardGround + 1);
      setFrameAt(img, ledger, g.buildX, y - ART.scaffoldLedgerPx / 2);
      img.setDisplaySize(siteW, ART.scaffoldLedgerPx);
      for (const x of poleXs) setFrameCentred(scaffold(DEPTH.boardGround + 2), clamp, x, y);
    }

    // wall (K-04): the baked strip with its openings; W1 rails on the top and bottom boundary of each static gap
    if (lvl.wallHeight > 0 && f.has(FRAME.wall)) {
      const r = g.wallRect(wallH);
      const img = add(DEPTH.boardGround + 3);
      setFrameAt(img, f.ref(FRAME.wall), r.x, r.y);
      if (k !== 1) img.setScale(k);
    }
    // ART §5 (Faz 2 tur 2): the rails lie over the plan cells and the blueprint grid, under the build front and the
    // blocks (`RAIL_DEPTH`), in dark steel — not on the ground layer under the plan, where they matched the scaffold
    const rail = f.ref(FRAME.gapRail);
    this.rails = [];
    lvl.gaps.forEach((gap, i) => {
      if (gap.type !== 'static') return;
      const r = g.gapRect(gapField(s, i, GF.y), gap.size);
      const rects: Rect[] = [];
      for (const y of [r.y, r.y + r.h]) {
        const img = add(RAIL_DEPTH);
        setFrameAt(img, rail, g.wallX, y - rail.h / 2);
        img.setDisplaySize(g.wallW + siteW, rail.h);
        rects.push({ x: g.wallX, y: y - ART.gapRailPx / 2, w: g.wallW + siteW, h: ART.gapRailPx });
      }
      this.rails.push({ gap: i, rails: rects });
    });
  }

  /** The yard rect of the last build (JUICE #94 sweep, UX §5.9 item 5). */
  get yardRect(): Rect {
    return this.yardRectNow;
  }

  /** The yard frame (JUICE #94: it flashes once). */
  get yardFrame(): Phaser.GameObjects.NineSlice | null {
    return this.yardFrameObj;
  }

  // --- site --------------------------------------------------------------------------------------------------------------

  private takeImg(depth: number): Phaser.GameObjects.Image {
    const img = this.freeImgs.pop() ?? this.scene.add.image(0, 0, BOOT_ATLAS_KEY, FRAME.whitePixel);
    img.setVisible(true).setDepth(depth).setAlpha(1).clearTint().setScale(1).setAngle(0);
    img.setCrop();
    this.siteImgs.push(img);
    return img;
  }

  private releaseImgs(imgs: readonly Phaser.GameObjects.Image[]): void {
    for (const img of imgs) {
      img.setVisible(false).setTexture(BOOT_ATLAS_KEY, FRAME.whitePixel).setCrop();
      this.freeImgs.push(img);
    }
  }

  private releaseSite(): void {
    this.releaseImgs(this.siteImgs);
    this.siteImgs = [];
    this.frontImgs.length = 0;
    this.trowelImgs.clear();
    this.planImgs.clear();
    this.dotsImg = null;
  }

  /**
   * UX §5.2 Golden Trowel pick mode (review Faz 2 tur 2 #5): every plan cell of the segment shown that is not in
   * `eligible` (and the `.` overlay) at 50 % (`alpha.disabled`-like, information: also with reduced motion); `null`
   * lights everything again.
   */
  setPickDim(eligible: readonly At[] | null): void {
    this.pickLit = eligible ? new Set(eligible.map((c) => `${c.x},${c.y}`)) : null;
    this.applyPickDim();
  }

  /** Alpha of the plan-cell images now (tests, harness): `x,y` → alpha of its cell image. */
  get planAlphas(): ReadonlyMap<string, number> {
    const out = new Map<string, number>();
    for (const [k, imgs] of this.planImgs) out.set(k, imgs[0]?.alpha ?? 1);
    if (this.dotsImg) out.set('.', this.dotsImg.alpha);
    return out;
  }

  private applyPickDim(): void {
    const lit = this.pickLit;
    for (const [k, imgs] of this.planImgs) {
      const a = lit === null || lit.has(k) ? 1 : PICK_DIM_ALPHA;
      for (const img of imgs) img.setAlpha(a);
    }
    this.dotsImg?.setAlpha(lit === null ? 1 : PICK_DIM_ALPHA);
  }

  /** Redraws the plan of the segment shown, its build front and ceiling beam (after a move, a shift, a resize). */
  refreshSite(layout: Layout, s: GameState): void {
    const lvl = this.lvl;
    const f = this.frames;
    this.releaseSite();
    if (!lvl || !f) return;
    const seg = visibleSegment(s);
    const plan = lvl.segments[seg];
    if (!plan) return;
    const g = layout.grid;
    const geo = g.geo;
    const c = g.cellPx;
    const k = g.k;
    const siteW = geo.ws * c;
    const elev = hdr(s, H.elev);
    const revealed = revealedMask(s, seg);
    const front = new Set(buildFront(s).map((a) => `${a.x},${a.y}`));
    const deep = f.ref(FRAME.blueprintDeep);
    const frontContour = f.ref(FRAME.front);
    const place = (img: Phaser.GameObjects.Image, ref: FrameRef, r: Rect): void => {
      setFrameAt(img, ref, r.x, r.y);
      if (k !== 1) img.setDisplaySize(c, c);
    };

    // board rows of the site: plan row sy = y − e; rows outside the plan (above Hs + e: site air, K-16 `outside`) and
    // cells the plan leaves out are `board_blueprint_deep` (UX §5.8)
    for (let y = elev; y < geo.h; y++) {
      const sy = y - elev;
      for (let sx = 0; sx < geo.ws; sx++) {
        const x = geo.siteX + sx;
        const local = sy * geo.ws + sx;
        const v = sy < geo.hs ? (plan.planColors[local] ?? PLAN_OUTSIDE) : PLAN_OUTSIDE;
        const cell = g.cellRect(x, y);
        if (v === PLAN_OUTSIDE) {
          place(this.takeImg(DEPTH.planCells), deep, cell);
          continue;
        }
        if (v === PLAN_DOT) continue;
        const color = COLOR_CODES[v];
        if (color === undefined) continue;
        const hidden = ((plan.hiddenMask >> local) & 1) === 1 && ((revealed >> local) & 1) === 0;
        const isFront = front.has(`${x},${y}`);
        const cellImg = this.takeImg(DEPTH.planCells);
        place(cellImg, f.ref(hidden ? FRAME.hidden : planFrameName(color)), cell);
        const imgs = [cellImg];
        if (isFront) {
          // K-34 hook 1: the front look over the plain cell (the #83 crossfade fades these two in)
          if (!hidden) {
            const fill = this.takeImg(DEPTH.planCells + 1);
            place(fill, f.ref(planFrontFrameName(color)), cell);
            this.frontImgs.push(fill);
            imgs.push(fill);
          }
          const contour = this.takeImg(DEPTH.buildFront);
          place(contour, frontContour, cell);
          this.frontImgs.push(contour);
          imgs.push(contour);
        }
        this.planImgs.set(`${x},${y}`, imgs);
        if (siteOcc(s, seg, sx, sy) === SITE_TROWEL) {
          const name = trowelCellFrameName(color);
          if (f.has(name)) {
            const img = this.takeImg(DEPTH.placedBlocks);
            setFrameCentred(img, f.ref(name), cell.x + c / 2, cell.y + c / 2);
            this.trowelImgs.set(`${x},${y}`, img);
          }
        }
      }
    }

    // overlays over the plan cells, under the blocks (ART §4 layer order)
    const planRows = Math.min(plan.height, geo.h - elev);
    const planTop = g.rowTop(planRows - 1 + elev);
    const grid = gridFrameName(plan.height);
    if (f.has(grid)) {
      const img = this.takeImg(DEPTH.planOverlay);
      setFrameAt(img, f.ref(grid), g.buildX, g.rowTop(plan.height - 1 + elev));
      if (k !== 1) img.setScale(k);
      if (planRows < plan.height)
        img.setCrop(0, ((plan.height - planRows) * c) / k, img.frame.realWidth, 1e6);
    }
    const dots = dotsFrameName(seg);
    if (f.has(dots)) {
      this.dotsImg = this.takeImg(DEPTH.planOverlay + 1);
      setFrameAt(this.dotsImg, f.ref(dots), g.buildX, g.rowTop(plan.height - 1 + elev));
      if (k !== 1) this.dotsImg.setScale(k);
    }

    // ceiling beam on the plan top (S8 balloon ceiling; drawn in every level, ART §4) with a clamp at each end
    const beamPx = TOKENS.plan.ceilingBeamPx;
    const beam = this.takeImg(DEPTH.ceilingBeam);
    setFrameAt(beam, f.ref(FRAME.ceilingBeam), g.buildX, planTop - beamPx / 2);
    beam.setDisplaySize(siteW, beamPx);
    const clamp = f.ref(FRAME.scaffoldClamp);
    setFrameCentred(this.takeImg(DEPTH.ceilingBeam + 1), clamp, g.buildX, planTop);
    setFrameCentred(this.takeImg(DEPTH.ceilingBeam + 1), clamp, g.buildX + siteW, planTop);
    if (this.pickLit) this.applyPickDim();
  }

  // --- JUICE hooks -------------------------------------------------------------------------------------------------------

  /** #83: images of the build-front look (fill + contour) drawn by the last `refreshSite`. */
  get frontImages(): readonly Phaser.GameObjects.Image[] {
    return this.frontImgs;
  }

  /** #17: the trowel block of board cell `(x, y)`, if the last refresh drew one. */
  trowelImage(x: number, y: number): Phaser.GameObjects.Image | null {
    return this.trowelImgs.get(`${x},${y}`) ?? null;
  }

  /** #18 / #55: every image of the site shown. */
  get siteImages(): readonly Phaser.GameObjects.Image[] {
    return this.siteImgs;
  }

  /** #18: the current site images become the outgoing group (kept on screen until `releaseOutgoing`). */
  detachSite(): Phaser.GameObjects.Image[] {
    this.releaseOutgoing();
    this.outgoing = this.siteImgs;
    this.siteImgs = [];
    this.frontImgs.length = 0;
    this.trowelImgs.clear();
    this.planImgs.clear();
    this.dotsImg = null;
    return this.outgoing;
  }

  releaseOutgoing(): void {
    this.releaseImgs(this.outgoing);
    this.outgoing = [];
  }

  /** #18: scaffold alpha (`alpha.segmentDoneScaffold` after a segment, 1 for the next one). */
  setScaffoldAlpha(alpha: number): void {
    for (const img of this.scaffoldImgs) img.setAlpha(alpha);
  }

  /** #84: hatch images on `cells` (shown at alpha 0; the caller drives the alpha). */
  supportHatch(layout: Layout, cells: readonly At[]): Phaser.GameObjects.Image[] {
    const f = this.frames;
    if (!f) return [];
    const ref = f.ref(FRAME.supportHatch);
    while (this.hatchImgs.length < cells.length)
      this.hatchImgs.push(this.scene.add.image(0, 0, BOOT_ATLAS_KEY, FRAME.whitePixel).setVisible(false));
    const out: Phaser.GameObjects.Image[] = [];
    cells.forEach((cell, i) => {
      const img = this.hatchImgs[i];
      if (!img) return;
      const r = layout.grid.cellRect(cell.x, cell.y);
      setFrameAt(img, ref, r.x, r.y);
      img
        .setDepth(DEPTH.fallShadow + 1)
        .setAlpha(0)
        .setVisible(true);
      out.push(img);
    });
    for (let i = cells.length; i < this.hatchImgs.length; i++) this.hatchImgs[i]?.setVisible(false);
    return out;
  }

  /** #22: rails of static gap `gap` (empty when the gap has none). */
  railsOf(gap: number): readonly Rect[] {
    return this.rails.find((r) => r.gap === gap)?.rails ?? [];
  }

  /** #22: `n` glow strips (white, ADD), placed by the caller. */
  glowImages(n: number): Phaser.GameObjects.Image[] {
    const f = this.frames;
    if (!f) return [];
    while (this.glowImgs.length < n)
      this.glowImgs.push(this.scene.add.image(0, 0, BOOT_ATLAS_KEY, FRAME.whitePixel).setVisible(false));
    return this.glowImgs.slice(0, n);
  }

  /** #23: two clamp images (`board_scaffold_clamp`, orange) on both sides of a rail-parked block box. */
  clampImages(box: Rect): Phaser.GameObjects.Image[] {
    const f = this.frames;
    if (!f) return [];
    const ref = f.ref(FRAME.scaffoldClamp);
    while (this.clampImgs.length < 2)
      this.clampImgs.push(this.scene.add.image(0, 0, BOOT_ATLAS_KEY, FRAME.whitePixel).setVisible(false));
    const out = this.clampImgs.slice(0, 2);
    const y = box.y + box.h / 2;
    out.forEach((img, i) => {
      setFrameCentred(img, ref, i === 0 ? box.x : box.x + box.w, y);
      img.setDepth(DEPTH.effects).setVisible(true).setScale(1).setAlpha(1);
    });
    return out;
  }

  /** #57: a dark layer over the board (alpha driven by the caller). */
  dimLayer(layout: Layout): Phaser.GameObjects.Image | null {
    const f = this.frames;
    if (!f) return null;
    if (!this.dimImg) this.dimImg = this.scene.add.image(0, 0, BOOT_ATLAS_KEY, FRAME.whitePixel);
    const r = layout.board.board;
    const crane = layout.board.crane;
    setRect(
      this.dimImg,
      f.ref(FRAME.whitePixel),
      r.x,
      crane.y,
      r.w,
      r.y + r.h - crane.y,
      hexColor(TOKENS.color.ui.overlay),
      0,
    );
    this.dimImg.setDepth(DEPTH.effects - 1).setVisible(true);
    return this.dimImg;
  }

  hideDim(): void {
    this.dimImg?.setVisible(false);
  }
}
