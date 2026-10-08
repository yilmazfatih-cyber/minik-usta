/**
 * Tutorial view (docs/TECH_DESIGN.md §2R.9 part 3; UX_FLOWS §13.1 "Öğretici dili v2 — hafif ve geçici"; ART §14.8;
 * GDD K-53). It draws what the scene gives it: an active tutorial step with its `TutorialPresence` look, or a
 * contextual `tut.ctx.*` line. There is NO dark layer, NO spotlight hole and NOTHING that takes a touch: no zone, no
 * `setInteractive` — every touch reaches the board, the HUD and the menus (K-53/2).
 *
 * - Highlight: around every highlighted thing the kit `ui_highlight` frame (8 px white α 0,95 contour + 18 px glow,
 *   `tutorial.highlightPadPx` pad), pulsing 1,0 ↔ 1,04 every `highlightPulseMs` (`Sine.easeInOut`); steady with reduced
 *   motion. A highlight whose target is not on screen is skipped. The rects follow their targets every frame (a
 *   highlighted block that is dragged or moved).
 * - Bubble: Ø `portraitPx` Usta Dede portrait (`services/assets` `portrait()`, the baked round crop) + the white kit
 *   bubble (≤ `bubbleMaxW`, ≥ `bubbleMinH`) joined by a 24 px tail; the text is `font.size.body` "Panel metni". Docked
 *   at the top (under the HUD) or the bottom (under the status strip) by `placeBubble` (UX §13.1 "Seçim"), placed when
 *   the content opens and on a resize. Appears 0,8 → 1,0 in `appearMs` (`Back.easeOut`; reduced motion: a 150 ms
 *   fade), leaves in `hideMs`, α `dragFadeAlpha` while a block is held. Bubbles are built per text and kept (TECH §10.7
 *   item 6): the level's step texts at level start (`prepare`), so a step that opens mid-drag only shows a ready one.
 * - Glove: `ui_tutorial_glove` (art or the procedural fallback; the fingertip is the touch point), 160 ms fade-in, a
 *   `handLoopMs` loop — `drag`: along the rounded fingertip path, `hold`: the path then pressed at its end, `tap`:
 *   pressed 0,9× with a ring at the target — with the dotted trail (12 px, 22 px apart, white α 0,85). Reduced motion:
 *   the glove rests at the start of its path, the whole trail is drawn. It plays only when the scene says so
 *   (DL-2R-20 `glovePlays`).
 * - Panorama arrow (UX §13.2 level 5 row): with `panorama` lit and a next segment, a 64 × 40 arrow from the active
 *   segment to the next one slides 16 px right every 1,2 s.
 * Drawing order (UX §13.1): board → highlight → bubble → glove → the dragged block and its shadow (`overTutorial`) →
 * windows.
 */
import type Phaser from 'phaser';
import type { CompiledLevel } from '../../core/level/compile.ts';
import type { TutorialStepData } from '../../core/level/schema.ts';
import type { GameState } from '../../core/state.ts';
import { tDynamic } from '../../services/i18n.ts';
import type { I18nParams } from '../../services/i18n.ts';
import type { TextureRef } from '../../services/assets.ts';
import { gloveTip } from '../../theme/draw/characters.ts';
import { bubbleTailSize, highlightPad, highlightSlices } from '../../theme/draw/kit.ts';
import type { Layout, Rect } from '../../theme/layout.ts';
import { KIT, bubbleTailFrameName } from '../../theme/textures.ts';
import { TOKENS } from '../../theme/tokens.ts';
import { addBakedGraphics } from '../../ui/BakedGraphics.ts';
import { drawPanoramaArrow } from '../../ui/icons.ts';
import { kitRef, kitSlice } from '../../ui/kit/atlas.ts';
import { kitTextStyle } from '../../ui/kit/text.ts';
import { DEPTH } from './depth.ts';
import { fingerPoints, pathAt, roundedPath, trailDots } from './tutorial/glove.ts';
import type { Point } from './tutorial/glove.ts';
import { boundsOf, highlightAll, placeBubble } from './tutorial/highlights.ts';
import type { DockPlace, HudRects } from './tutorial/highlights.ts';
import type { PresenceLook } from './tutorial/TutorialPresence.ts';
import { VIEW } from './viewConstants.ts';

const TT = TOKENS.tutorial;
const BB = TOKENS.kit.bubble;
/** UX §13.1: glove fade-in, reduced-motion bubble fade, tap ring growth. */
const GLOVE_IN_MS = 160;
const REDUCED_FADE_MS = 150;
const RING_START_PX = 30;
const RING_MAX = 1.8;
/** UX §13.1 `hold`: pressed at the end of the path. */
const HOLD_MS = 600;
/** Highlight frames made at construction (a step opening mid-drag creates none). */
const HIGHLIGHT_POOL = 6;

export interface TutorialViewHost {
  layout(): Layout;
  state(): GameState | null;
  level(): CompiledLevel | null;
  hud(): HudRects;
  /** The dragged block and its current drag node (null while nothing is dragged). */
  dragging(): { readonly pieceId: number; readonly ix: number; readonly iy: number } | null;
  /** Panorama columns of the active segment and the next one (null: fewer than 2 segments or no next one). */
  panoramaArrow(): { readonly from: Rect; readonly to: Rect } | null;
  /** Glove and portrait textures (art or fallback). */
  glove(): TextureRef | null;
  portrait(): TextureRef;
}

/** What the view shows: a tutorial step, a contextual line, or nothing. `key` changes when the content changes. */
export type ViewContent =
  | {
      readonly kind: 'step';
      readonly key: string;
      readonly textKey: string;
      readonly highlight: readonly string[];
      readonly hand: TutorialStepData['hand'] | undefined;
      /** DL-2R-20 play condition of the glove on the state of now. */
      readonly glove: boolean;
    }
  | {
      readonly kind: 'tip';
      readonly key: string;
      readonly textKey: string;
      readonly params?: I18nParams;
      readonly highlight: readonly string[];
    }
  | null;

interface BubbleParts {
  readonly text: string;
  readonly root: Phaser.GameObjects.Container;
  readonly portrait: Phaser.GameObjects.Image;
  readonly tailLeft: Phaser.GameObjects.Image;
  readonly tailUp: Phaser.GameObjects.Image;
  /** Portrait + gap + box. */
  readonly w: number;
  readonly h: number;
  /** Box left edge inside the root. */
  readonly boxX: number;
}

const backOut = (u: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};

export class TutorialView {
  private readonly scene: Phaser.Scene;
  private readonly host: TutorialViewHost;
  private readonly highlights: Phaser.GameObjects.NineSlice[] = [];
  private readonly arrow: Phaser.GameObjects.Graphics;
  private readonly dots: Phaser.GameObjects.Graphics;
  private readonly ring: Phaser.GameObjects.Graphics;
  private readonly gloveImg: Phaser.GameObjects.Image;
  private readonly bubbles = new Map<string, BubbleParts>();
  private preparedKeys: readonly string[] = [];
  private content: ViewContent = null;
  private bubble: BubbleParts | null = null;
  private place: DockPlace | null = null;
  private reduced = false;
  /** Visibility edges of the look (animation time): shown since / hidden since. */
  private bubbleOn = false;
  private bubbleEdge = 0;
  private bubbleAlphaAtEdge = 0;
  private gloveOn = false;
  private gloveEdge = 0;
  private gloveAlphaAtEdge = 0;
  private highlightOn = false;
  private highlightEdge = 0;
  /** Glove path (fingertip points, rounded) and kind of the content on screen. */
  private path: Point[] = [];
  private handKind: 'tap' | 'drag' | 'hold' | null = null;
  private rects: Rect[] = [];
  private arrowAt: { x: number; y: number } | null = null;

  constructor(scene: Phaser.Scene, host: TutorialViewHost) {
    this.scene = scene;
    this.host = host;
    const d = DEPTH.tutorial;
    for (let i = 0; i < HIGHLIGHT_POOL; i++) this.highlights.push(this.makeHighlight());
    this.arrow = addBakedGraphics(scene)
      .setDepth(d + 1)
      .setVisible(false);
    drawPanoramaArrow(this.arrow, VIEW.panoramaArrowW, VIEW.panoramaArrowH, VIEW.panoramaArrowStrokePx);
    this.dots = scene.add
      .graphics()
      .setDepth(d + 3)
      .setVisible(false);
    this.ring = scene.add
      .graphics()
      .setDepth(d + 3)
      .setVisible(false);
    const tip = gloveTip(TOKENS);
    this.gloveImg = scene.add
      .image(0, 0, '__WHITE')
      .setOrigin(tip.x / TT.gloveW, tip.y / TT.gloveH)
      .setDepth(d + 4)
      .setVisible(false);
    this.applyGloveTexture();
  }

  // --- public ---------------------------------------------------------------------------------------------------------

  /** Builds the bubbles of `keys` now (level start: the level's step lines) and drops the other ready ones. */
  prepare(keys: readonly string[]): void {
    this.preparedKeys = [...keys];
    const texts = new Set(keys.map((k) => tDynamic(k)));
    for (const [text, parts] of this.bubbles) {
      if (texts.has(text)) continue;
      if (parts === this.bubble) this.bubble = null;
      parts.root.destroy(true);
      this.bubbles.delete(text);
    }
    for (const text of texts) this.bubbleFor(text);
  }

  /** New content (null hides). The bubble is placed now; the look comes with `update`. */
  show(content: ViewContent, now: number): void {
    this.content = content;
    this.place = null;
    this.bubble?.root.setVisible(false);
    this.bubble = null;
    this.bubbleOn = false;
    this.gloveOn = false;
    this.highlightOn = false;
    this.bubbleAlphaAtEdge = 0;
    this.gloveAlphaAtEdge = 0;
    this.bubbleEdge = now;
    this.gloveEdge = now;
    this.highlightEdge = now;
    this.rebuild();
  }

  /** The glove's play condition changed (a move end, DL-2R-20) for the same content. */
  setGlove(on: boolean): void {
    const c = this.content;
    if (c?.kind !== 'step' || c.glove === on) return;
    this.content = { ...c, glove: on };
    this.rebuildGlove();
  }

  relayout(): void {
    if (this.preparedKeys.length > 0) this.prepare(this.preparedKeys);
    this.place = null;
    this.rebuild();
  }

  setReduced(on: boolean): void {
    this.reduced = on;
    this.rebuildGlove();
  }

  /** The glove / portrait art arrived (or the asset mode changed). */
  refreshArt(): void {
    this.applyGloveTexture();
    const p = this.host.portrait();
    for (const parts of this.bubbles.values()) parts.portrait.setTexture(p.key, p.frame);
  }

  /** Per frame: the look of the content (`TutorialPresence`, or a contextual line's), fades, pulse, glove loop. */
  update(now: number, look: PresenceLook): void {
    const c = this.content;
    if (!c) return;
    this.edge('bubble', look.bubble, now);
    this.edge('glove', look.glove && c.kind === 'step' && c.glove && this.handKind !== null, now);
    if (look.highlight !== this.highlightOn) {
      this.highlightOn = look.highlight;
      this.highlightEdge = now;
    }
    this.drawHighlights(now);
    this.drawBubble(now, look.faded);
    this.drawGlove(now);
    this.drawArrow(now);
  }

  /** The bubble's rect when shown (harness, screens). */
  get bubbleRect(): Rect | null {
    const b = this.bubble;
    return b && b.root.visible && this.place ? this.place.rect : null;
  }

  /** The dock the bubble on screen took (harness, screens). */
  get bubbleDock(): DockPlace['dock'] | null {
    return this.bubbleRect ? (this.place?.dock ?? null) : null;
  }

  /** Glove on screen (harness): its kind, or null. */
  get gloveShown(): 'tap' | 'drag' | 'hold' | null {
    return this.gloveImg.visible ? this.handKind : null;
  }

  /** Highlight rects on screen now (harness, screens). */
  get highlightRects(): readonly Rect[] {
    return this.highlightOn ? this.rects : [];
  }

  /** The panorama arrow's rest position, null when hidden (tests, harness). */
  get panoramaArrowAt(): { readonly x: number; readonly y: number } | null {
    return this.arrowAt;
  }

  destroy(): void {
    for (const h of this.highlights) h.destroy();
    this.highlights.length = 0;
    for (const o of [this.arrow, this.dots, this.ring, this.gloveImg]) o.destroy();
    for (const v of this.bubbles.values()) v.root.destroy(true);
    this.bubbles.clear();
    this.bubble = null;
  }

  // --- building ---------------------------------------------------------------------------------------------------------

  private makeHighlight(): Phaser.GameObjects.NineSlice {
    const ref = kitRef(this.scene.game, KIT.highlight);
    const sl = highlightSlices(TOKENS);
    return this.scene.add
      .nineslice(
        0,
        0,
        ref.key,
        ref.frame,
        2 * sl.left + 2,
        2 * sl.top + 2,
        sl.left,
        sl.right,
        sl.top,
        sl.bottom,
      )
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.tutorial)
      .setVisible(false);
  }

  private applyGloveTexture(): void {
    const ref = this.host.glove();
    if (!ref) return;
    this.gloveImg.setTexture(ref.key, ref.frame).setDisplaySize(TT.gloveW, TT.gloveH);
  }

  /** The bubble of `text` (built once per text; ART §14.8). */
  private bubbleFor(text: string): BubbleParts {
    const ready = this.bubbles.get(text);
    if (ready) return ready;
    const s = this.scene;
    const pad = BB.padXPx + BB.strokePx;
    const label = s.add.text(0, 0, text, {
      ...kitTextStyle('panel', TOKENS.font.size.body),
      align: 'left',
      wordWrap: { width: TT.bubbleMaxW - 2 * pad, useAdvancedWrap: true },
    });
    const boxW = Math.min(TT.bubbleMaxW, Math.ceil(label.width) + 2 * pad);
    const boxH = Math.max(TT.bubbleMinH, Math.ceil(label.height) + 2 * (BB.padYPx + BB.strokePx));
    const tail = bubbleTailSize('left', TOKENS);
    const boxX = TT.portraitPx + TT.portraitGapPx + BB.tailPx;
    const h = Math.max(TT.portraitPx, boxH);
    const boxY = (h - boxH) / 2;
    const ref = kitRef(s.game, KIT.bubble);
    const sl = kitSlice(KIT.bubble);
    const body = s.add
      .nineslice(
        boxX,
        boxY,
        ref.key,
        ref.frame,
        boxW,
        boxH + BB.shadowYPx,
        sl?.left,
        sl?.right,
        sl?.top,
        sl?.bottom,
      )
      .setOrigin(0, 0);
    const tl = kitRef(s.game, bubbleTailFrameName('left'));
    const tailLeft = s.add
      .image(boxX + BB.strokePx, boxY + boxH / 2, tl.key, tl.frame)
      .setOrigin(1, 0.5)
      .setDisplaySize(tail.w, tail.h);
    const tu = kitRef(s.game, bubbleTailFrameName('up'));
    const up = bubbleTailSize('up', TOKENS);
    const tailUp = s.add
      .image(boxX + BB.radiusPx + up.w / 2, boxY + BB.strokePx, tu.key, tu.frame)
      .setOrigin(0.5, 1)
      .setDisplaySize(up.w, up.h)
      .setVisible(false);
    label.setPosition(boxX + pad, boxY + (boxH - label.height) / 2);
    const p = this.host.portrait();
    const portrait = s.add
      .image(TT.portraitPx / 2, h / 2, p.key, p.frame)
      .setDisplaySize(TT.portraitPx, TT.portraitPx);
    const root = s.add
      .container(0, 0, [body, tailLeft, tailUp, label, portrait])
      .setDepth(DEPTH.tutorial + 2)
      .setVisible(false);
    const parts: BubbleParts = { text, root, portrait, tailLeft, tailUp, w: boxX + boxW, h, boxX };
    this.bubbles.set(text, parts);
    return parts;
  }

  private contentRects(): Rect[] {
    const c = this.content;
    const s = this.host.state();
    const level = this.host.level();
    if (!c || !s || !level) return [];
    return highlightAll(c.highlight, {
      layout: this.host.layout(),
      state: s,
      level,
      hud: this.host.hud(),
      dragging: this.host.dragging(),
    });
  }

  private rebuild(): void {
    for (const h of this.highlights) h.setVisible(false);
    this.arrow.setVisible(false);
    this.arrowAt = null;
    const c = this.content;
    this.rects = this.contentRects();
    this.rebuildGlove();
    if (!c) return;
    const layout = this.host.layout();
    const text = tDynamic(c.textKey, c.kind === 'tip' ? c.params : undefined);
    const bubble = this.bubbleFor(text);
    this.bubble = bubble;
    const tip = gloveTip(TOKENS);
    const pathBox = boundsOf(this.path.map((p) => ({ x: p.x, y: p.y, w: 0, h: 0 })));
    const handBox =
      pathBox && this.handKind !== null
        ? { x: pathBox.x - tip.x, y: pathBox.y - tip.y, w: pathBox.w + TT.gloveW, h: pathBox.h + TT.gloveH }
        : null;
    this.place ??= placeBubble(
      { layout, w: bubble.w, h: bubble.h, ids: c.highlight, lit: this.rects, handBox },
      TOKENS.layout.marginPx,
      TT.dockGapPx,
    );
    bubble.root.setPosition(this.place.rect.x, this.place.rect.y);
    bubble.tailUp.setVisible(this.place.tailUp);
    bubble.tailLeft.setVisible(!this.place.tailUp);
    // UX §13.2 level 5: the panorama arrow from the active segment to the next one
    const pair = c.highlight.includes('panorama') ? this.host.panoramaArrow() : null;
    if (pair) {
      const y = (pair.from.y + pair.from.h / 2 + pair.to.y + pair.to.h / 2) / 2;
      const x = (pair.from.x + pair.from.w + pair.to.x) / 2 - VIEW.panoramaArrowSlidePx / 2;
      this.arrowAt = { x, y };
      this.arrow.setPosition(x, y);
    }
  }

  /** Glove path + trail of the content (drawn once per content; the loop only moves the image). */
  private rebuildGlove(): void {
    const c = this.content;
    this.path = [];
    this.handKind = null;
    this.dots.clear().setVisible(false);
    this.ring.setVisible(false);
    if (c?.kind !== 'step' || !c.hand || !c.glove) return;
    const hand = c.hand;
    if (hand.kind === 'tap') {
      const r = this.rects[0];
      if (!r) return;
      this.path = [{ x: r.x + r.w / 2, y: r.y + r.h / 2 }];
      this.handKind = 'tap';
      return;
    }
    const pts = fingerPoints(this.host.layout(), hand.path ?? []);
    if (pts.length === 0) return;
    this.path = roundedPath(pts);
    this.handKind = hand.kind;
    const d = this.dots;
    d.fillStyle(0xffffff, TT.trailAlpha);
    for (const p of trailDots(this.path)) d.fillCircle(p.x, p.y, TT.trailDotPx / 2);
  }

  // --- per frame --------------------------------------------------------------------------------------------------------

  private edge(which: 'bubble' | 'glove', on: boolean, now: number): void {
    if (which === 'bubble') {
      if (on === this.bubbleOn) return;
      this.bubbleAlphaAtEdge = this.bubbleAlpha(now);
      this.bubbleOn = on;
      this.bubbleEdge = now;
    } else {
      if (on === this.gloveOn) return;
      this.gloveAlphaAtEdge = this.gloveAlpha(now);
      this.gloveOn = on;
      this.gloveEdge = now;
    }
  }

  private bubbleAlpha(now: number): number {
    const t = now - this.bubbleEdge;
    if (this.bubbleOn) return Math.min(1, t / (this.reduced ? REDUCED_FADE_MS : TT.appearMs));
    return Math.max(0, this.bubbleAlphaAtEdge * (1 - t / TT.hideMs));
  }

  private gloveAlpha(now: number): number {
    const t = now - this.gloveEdge;
    if (this.gloveOn) return Math.min(1, t / GLOVE_IN_MS);
    return Math.max(0, this.gloveAlphaAtEdge * (1 - t / TT.hideMs));
  }

  private drawBubble(now: number, faded: boolean): void {
    const b = this.bubble;
    const place = this.place;
    if (!b || !place) return;
    const a = this.bubbleAlpha(now);
    if (a <= 0) {
      b.root.setVisible(false);
      return;
    }
    let scale = 1;
    if (this.bubbleOn && !this.reduced) {
      const u = Math.min(1, (now - this.bubbleEdge) / TT.appearMs);
      scale = 0.8 + 0.2 * backOut(u);
    }
    // grow from the portrait's centre (left middle of the bubble)
    const cy = b.h / 2;
    b.root
      .setVisible(true)
      .setAlpha(a * (faded ? TT.dragFadeAlpha : 1))
      .setScale(scale)
      .setPosition(place.rect.x + (TT.portraitPx / 2) * (1 - scale), place.rect.y + cy * (1 - scale));
  }

  private drawHighlights(now: number): void {
    const c = this.content;
    const rects = c && c.highlight.length > 0 ? this.contentRects() : [];
    this.rects = rects;
    const fade = this.highlightOn ? 1 : Math.max(0, 1 - (now - this.highlightEdge) / TT.hideMs);
    const pulse = this.reduced
      ? 1
      : 1 +
        (TT.highlightPulseScale - 1) *
          (0.5 - 0.5 * Math.cos((2 * Math.PI * (now % TT.highlightPulseMs)) / TT.highlightPulseMs));
    const pad = highlightPad(TOKENS);
    rects.forEach((r, i) => {
      let h = this.highlights[i];
      if (!h) {
        h = this.makeHighlight();
        this.highlights.push(h);
      }
      const w = Math.round(r.w + 2 * pad);
      const hh = Math.round(r.h + 2 * pad);
      if (h.width !== w || h.height !== hh) h.setSize(w, hh);
      h.setPosition(r.x + r.w / 2, r.y + r.h / 2)
        .setScale(pulse)
        .setAlpha(fade)
        .setVisible(fade > 0);
    });
    for (let i = rects.length; i < this.highlights.length; i++) this.highlights[i]?.setVisible(false);
  }

  private drawArrow(now: number): void {
    const at = this.arrowAt;
    if (!at || !this.highlightOn) {
      this.arrow.setVisible(false);
      return;
    }
    const period = VIEW.panoramaArrowPeriodMs;
    const slide = this.reduced ? 0 : (VIEW.panoramaArrowSlidePx * (now % period)) / period;
    this.arrow.setPosition(at.x + slide, at.y).setVisible(true);
  }

  private drawGlove(now: number): void {
    const g = this.gloveImg;
    const kind = this.handKind;
    const a = this.gloveAlpha(now);
    if (!kind || this.path.length === 0 || a <= 0) {
      g.setVisible(false);
      this.dots.setVisible(false);
      this.ring.setVisible(false);
      return;
    }
    g.setVisible(true).setAlpha(a);
    this.dots.setVisible(kind !== 'tap').setAlpha(a);
    const start = this.path[0] as Point;
    if (this.reduced) {
      // JUICE §0 rule 8 / UX §13.1: the glove rests at the start of its path, the trail is the path
      g.setPosition(start.x, start.y).setScale(kind === 'tap' ? TT.glovePressScale : 1);
      this.ring.setVisible(false);
      return;
    }
    const loop = TT.handLoopMs;
    const pause = TT.handPauseMs;
    const move = loop - pause;
    const t = (now - this.gloveEdge) % loop;
    if (kind === 'tap') {
      g.setPosition(start.x, start.y);
      const press = t < pause ? Math.sin((Math.PI * t) / pause) : 0;
      g.setScale(1 - (1 - TT.glovePressScale) * press);
      const u = Math.min(1, t / move);
      this.ring
        .clear()
        .lineStyle(TT.highlightStrokePx / 2, 0xffffff, 1)
        .strokeCircle(start.x, start.y, RING_START_PX * (1 + (RING_MAX - 1) * u))
        .setAlpha((1 - u) * a)
        .setVisible(true);
      return;
    }
    const holdMs = kind === 'hold' ? HOLD_MS : 0;
    const travel = Math.max(1, move - holdMs);
    const p = pathAt(this.path, Math.min(1, t / travel));
    g.setPosition(p.x, p.y).setScale(t < move ? TT.glovePressScale : 1);
    g.setAlpha(a * (t < move ? 1 : 1 - (t - move) / pause));
  }
}
