/**
 * Chunky button v3 (ART_REFERENCE §3.1, §2.3, §4 "button"; JUICE #97 on top of #69). The look is the baked kit frame
 * (`ui3_button_<colour>_h<h>`, 3-sliced to any width; the pressed frame is a second NineSlice), the label is a Phaser
 * Text in the §4 button look (white, 0,06 em contour + 0,04 em shadow in the colour's `textStroke`), optionally an icon
 * on the plate, a leading "▶" (rewarded ad, UX §7) and a right column (PriceLabel: coins line over the real-money
 * line, or one small line — the out-of-moves options, UX §0.3).
 *
 * Press (#97): the plate content sinks `pressedDropPx` (8 px; the pressed frame shows the short lip), scale
 * `pressedScale` in `duration.buttonPress`; release: back up, 1.04 → 1.0 in `duration.buttonRelease`
 * (Back.easeOut). Reduced motion: only the thickness changes. The hit area is at least `touch.minTargetPx`
 * (UX §0.3 "Görsel + pay"). It is a juice `ButtonTarget` too (`setLip` maps the v1 lip of #69 onto the v3 press).
 * `square`: the HUD booster square anatomy (ART_REFERENCE §9.4).
 */
import Phaser from 'phaser';
import { hitArea } from '../../theme/layout.ts';
import { TOKENS } from '../../theme/tokens.ts';
import { buttonV3Metrics, buttonV3PlateRect } from '../../theme/draw/kitV3.ts';
import type { KitV3ButtonColor } from '../../theme/draw/kitV3.ts';
import { addBakedGraphics } from '../BakedGraphics.ts';
import { drawPlay } from '../icons.ts';
import { kitButtonRef } from './atlas.ts';
import type { IconBinder } from './icons.ts';
import { addInlineText } from './InlineText.ts';
import { addKitText, fitWidth } from './text.ts';

export interface KitButtonSpec {
  readonly color: KitV3ButtonColor;
  readonly w: number;
  readonly h: number;
  readonly label?: string;
  /** Label size (default: the size preset's `fontPx` — L 96, M 56, S 44). */
  readonly labelPx?: number;
  /** An icon on the plate (texture key + frame), drawn `px` wide; with a label it sits left of the text. */
  readonly icon?: { readonly key: string; readonly frame?: string; readonly px: number } | null;
  readonly disabled?: boolean;
  /** ART_REFERENCE §9.4 booster square anatomy (thin bands). */
  readonly square?: boolean;
  /** Leading "▶" (rewarded ad option, UX §7). */
  readonly play?: boolean;
  /** PriceLabel column (UX §0.3): coins line + real-money line; `{coin}` icons need `icons`. */
  readonly price?: { readonly line1: string; readonly line2: string } | null;
  /** One small right-hand line (ad: `lose.adToday` / `ads.none` / `ads.tomorrow`). */
  readonly sub?: string | null;
  /** Icon source of inline `{coin}` runs in the label / price lines. */
  readonly icons?: IconBinder | null;
}

const KB = TOKENS.kit.v3.button;
/** JUICE #97: the plate content sinks `pressedDropPx`. */
export const PRESS_SINK_PX = KB.pressedDropPx;
/** Release overshoot (JUICE #97 "1,04 → 1,0"). */
const RELEASE_PEAK = 1.04;
/** Side padding of a label with a right column (px). */
const SIDE_PAD = 40;
/** Right column text sizes (UX §0.3 PriceLabel: coins 44, real money 34). */
const PRICE_PX = 44;
const SUB_PX = 34;

export type PressVariant = 'press' | 'release';

export class KitButton {
  readonly root: Phaser.GameObjects.Container;
  readonly w: number;
  readonly h: number;
  private readonly scene: Phaser.Scene;
  private readonly normal: Phaser.GameObjects.NineSlice;
  private readonly pressedLook: Phaser.GameObjects.NineSlice | null;
  private readonly content: Phaser.GameObjects.Container;
  private readonly label: Phaser.GameObjects.Text | null;
  private readonly icon: Phaser.GameObjects.Image | null;
  private enabledNow = true;
  private pressed = false;
  private reduced = false;
  private tween: Phaser.Tweens.Tween | null = null;
  private tapFn: (() => void) | null = null;
  private pressFn: ((v: PressVariant) => void) | null = null;

  constructor(scene: Phaser.Scene, spec: KitButtonSpec) {
    this.scene = scene;
    const { w, h } = spec;
    this.w = w;
    this.h = h;
    const square = spec.square ?? false;
    const color: KitV3ButtonColor = spec.disabled ? 'grey' : spec.color;
    const n = kitButtonRef(scene.game, color, h, spec.disabled ? 'disabled' : 'normal', square);
    this.normal = this.slice(n.ref, n.slices, w);
    const parts: Phaser.GameObjects.GameObject[] = [this.normal];
    if (!spec.disabled) {
      const p = kitButtonRef(scene.game, color, h, 'pressed', square);
      this.pressedLook = this.slice(p.ref, p.slices, w).setVisible(false);
      parts.push(this.pressedLook);
    } else this.pressedLook = null;
    const plate = buttonV3PlateRect({ color, w, h, square }, TOKENS);
    const m = buttonV3Metrics(h, TOKENS, square);
    // label centre = plate centre + 2 (ART_REFERENCE §3.1 row 8)
    const cy = -h / 2 + plate.y + plate.h / 2 + 2;
    const q = TOKENS.kit.v3.buttonColor[color];
    const contentParts: Phaser.GameObjects.GameObject[] = [];
    const price = spec.price ?? null;
    const sub = spec.sub ?? null;
    const hasRight = price !== null || sub !== null;
    const left = -w / 2 + plate.x + SIDE_PAD;
    let labelX = hasRight ? left : 0;
    if (spec.play) {
      const play = addBakedGraphics(scene);
      drawPlay(play, 44, q.text);
      play.setPosition(labelX + 22, cy);
      contentParts.push(play);
      labelX += 56;
    }
    let rightW = 0;
    if (price || sub) {
      const right = w / 2 - plate.x - SIDE_PAD;
      if (price) {
        const l1 = this.inline(price.line1, PRICE_PX, q, spec.icons ?? null);
        l1.root.setPosition(right, cy - 20);
        const l2 = this.inline(price.line2, SUB_PX, q, spec.icons ?? null);
        l2.root.setPosition(right, cy + 26);
        contentParts.push(l1.root, l2.root);
        rightW = Math.max(l1.width, l2.width);
      } else if (sub) {
        const l2 = this.inline(sub, SUB_PX, q, spec.icons ?? null);
        l2.root.setPosition(right, cy + 26);
        contentParts.push(l2.root);
        rightW = l2.width;
      }
    }
    let icon: Phaser.GameObjects.Image | null = null;
    if (spec.icon) {
      icon = scene.add.image(0, cy - 2, spec.icon.key, spec.icon.frame);
      icon.setDisplaySize(spec.icon.px, spec.icon.px);
      contentParts.push(icon);
    }
    this.icon = icon;
    let label: Phaser.GameObjects.Text | null = null;
    if (spec.label) {
      const px = spec.labelPx ?? m.fontPx;
      const labelText = spec.icons && spec.label.includes('{') ? null : spec.label;
      if (labelText !== null) {
        label = addKitText(scene, 0, cy, labelText, 'button', px, q.textStroke, q.text);
        if (hasRight) label.setOrigin(0, label.originY).setX(labelX);
        const room = hasRight
          ? w / 2 - plate.x - SIDE_PAD - rightW - SIDE_PAD / 2 - labelX
          : plate.w - 2 * SIDE_PAD - (icon ? spec.icon!.px + 12 : 0);
        fitWidth(label, Math.max(40, room));
        if (icon && !hasRight) {
          // icon + label side by side, the pair centred on the plate
          const total = spec.icon!.px + 12 + label.width * label.scaleX;
          icon.setX(-total / 2 + spec.icon!.px / 2);
          label.setX(total / 2 - (label.width * label.scaleX) / 2);
        }
        if (spec.disabled) label.setAlpha(0.8);
        contentParts.push(label);
      } else {
        const inl = this.inline(
          spec.label,
          spec.labelPx ?? m.fontPx,
          q,
          spec.icons ?? null,
          hasRight ? 'left' : 'center',
        );
        inl.root.setPosition(labelX, cy);
        contentParts.push(inl.root);
      }
    }
    this.label = label;
    this.content = scene.add.container(0, 0, contentParts);
    parts.push(this.content);
    this.root = scene.add.container(0, 0, parts);
    const hit = hitArea({ x: -w / 2, y: -h / 2, w, h }, TOKENS.touch.minTargetPx);
    this.root.setSize(hit.w, hit.h);
    this.root.setInteractive();
    this.enabledNow = !spec.disabled;
    this.root.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      if (!this.enabledNow) {
        this.pressFn?.('press');
        return;
      }
      this.pressed = true;
      this.setPressed(true);
      this.pressFn?.('press');
    });
    this.root.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      if (!this.pressed) return;
      this.pressed = false;
      this.setPressed(false);
      this.pressFn?.('release');
      // a system-cancelled touch (touchcancel) releases the press but is no tap
      if (!pointer.wasCanceled) this.tapFn?.();
    });
    this.root.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      if (!this.pressed) return;
      this.pressed = false;
      this.setPressed(false);
      this.pressFn?.('release');
    });
  }

  /** One line with inline `{coin}` icons in the button look (right column / inline labels). */
  private inline(
    text: string,
    px: number,
    q: { readonly text: string; readonly textStroke: string },
    icons: IconBinder | null,
    align: 'left' | 'center' | 'right' = 'right',
  ): { root: Phaser.GameObjects.Container; width: number } {
    if (icons) return addInlineText(this.scene, icons, text, 'button', px, align, q.textStroke, q.text);
    const t = addKitText(this.scene, 0, 0, text, 'button', px, q.textStroke, q.text);
    t.setOrigin(align === 'left' ? 0 : align === 'right' ? 1 : 0.5, t.originY);
    return { root: this.scene.add.container(0, 0, [t]), width: t.width };
  }

  private slice(
    ref: { key: string; frame: string; anchorX: number; anchorY: number },
    s: { left: number; right: number; top: number; bottom: number },
    w: number,
  ): Phaser.GameObjects.NineSlice {
    const ns = this.scene.add.nineslice(0, 0, ref.key, ref.frame, w, 0, s.left, s.right, s.top, s.bottom);
    // the frame is the button plus its drop shadow below: put the button body's centre on the origin
    ns.setOrigin(0.5, this.h / 2 / ns.height);
    return ns;
  }

  get enabled(): boolean {
    return this.enabledNow;
  }

  /** Text object of the label (harness tap lookup, tests). */
  get labelText(): Phaser.GameObjects.Text | null {
    return this.label;
  }

  get iconImage(): Phaser.GameObjects.Image | null {
    return this.icon;
  }

  setEnabled(on: boolean): this {
    this.enabledNow = on;
    return this;
  }

  /** JUICE §0 rule 8: reduced motion keeps only the thickness change. */
  setReduced(on: boolean): this {
    this.reduced = on;
    return this;
  }

  onTap(fn: () => void): this {
    this.tapFn = fn;
    return this;
  }

  /** Press / release hook (sound, haptic); a disabled button reports its press too (2 px shake, UX §3). */
  onPress(fn: (v: PressVariant) => void): this {
    this.pressFn = fn;
    return this;
  }

  setPosition(x: number, y: number): this {
    this.root.setPosition(x, y);
    return this;
  }

  setDepth(d: number): this {
    this.root.setDepth(d);
    return this;
  }

  setVisible(on: boolean): this {
    this.root.setVisible(on);
    return this;
  }

  /** #97: pressed frame + sunk content (+ scale unless reduced). */
  setPressed(on: boolean): void {
    this.normal.setVisible(!on || !this.pressedLook);
    this.pressedLook?.setVisible(on);
    this.content.y = on ? PRESS_SINK_PX : 0;
    this.tween?.stop();
    this.tween = null;
    if (this.reduced) {
      this.root.setScale(1);
      return;
    }
    const D = TOKENS.duration;
    if (on) {
      this.tween = this.scene.tweens.add({
        targets: this.root,
        scale: KB.pressedScale,
        duration: D.buttonPress,
        ease: 'Quad.easeOut',
      });
      return;
    }
    this.root.setScale(RELEASE_PEAK);
    this.tween = this.scene.tweens.add({
      targets: this.root,
      scale: 1,
      duration: D.buttonRelease,
      ease: 'Back.easeOut',
    });
  }

  /** `ButtonTarget.setLip` of JUICE #69: v1 lip px (`shadow.buttonLipPx` … `buttonPressedLipPx`) → the v3 press. */
  setLip(px: number): void {
    const v1 = TOKENS.shadow;
    const k = Math.min(1, Math.max(0, (v1.buttonLipPx - px) / (v1.buttonLipPx - v1.buttonPressedLipPx)));
    const on = k > 0.5;
    this.normal.setVisible(!on || !this.pressedLook);
    this.pressedLook?.setVisible(on);
    this.content.y = k * PRESS_SINK_PX;
  }

  // Tweenable (juice ButtonTarget)
  get x(): number {
    return this.root.x;
  }
  set x(v: number) {
    this.root.x = v;
  }
  get y(): number {
    return this.root.y;
  }
  set y(v: number) {
    this.root.y = v;
  }
  get scaleX(): number {
    return this.root.scaleX;
  }
  set scaleX(v: number) {
    this.root.scaleX = v;
  }
  get scaleY(): number {
    return this.root.scaleY;
  }
  set scaleY(v: number) {
    this.root.scaleY = v;
  }
  get alpha(): number {
    return this.root.alpha;
  }
  set alpha(v: number) {
    this.root.alpha = v;
  }

  destroy(): void {
    this.tween?.stop();
    this.root.destroy(true);
  }
}
