/**
 * Candy button v2 (ART §14.1, §2.6; UX §0.3 "Hacimli düğme (v2)"; JUICE #97 on top of #69). The look is the baked kit
 * frame (`ui_button_<colour>_h<h>`, 3-sliced to any width; the pressed frame is a second NineSlice), the label is a
 * Phaser Text in the "Parlak başlık" look in the colour's stroke (cream: "Panel metni"), optionally an icon on the face.
 *
 * Press (#97): the face sinks `lipPx − pressedLipPx` (10 px, the pressed frame), the content follows, scale
 * `pressedScale` in `duration.buttonPress`; release: back up, 1.04 → 1.0 in `duration.buttonRelease` (Back.easeOut).
 * Reduced motion: only the thickness changes. The hit area is at least `touch.minTargetPx` (UX §0.3 "Görsel + pay").
 * It is a juice `ButtonTarget` too (`setLip` maps the v1 lip of #69 onto the v2 press).
 */
import Phaser from 'phaser';
import { hitArea } from '../../theme/layout.ts';
import { TOKENS } from '../../theme/tokens.ts';
import { buttonFaceRect } from '../../theme/draw/kit.ts';
import type { KitButtonColor } from '../../theme/draw/kit.ts';
import { kitButtonRef } from './atlas.ts';
import { addKitText, fitWidth } from './text.ts';

export interface KitButtonSpec {
  readonly color: KitButtonColor;
  readonly w: number;
  readonly h: number;
  readonly label?: string;
  /** Label size (default `font.size.button` 56 px; "Bölüm N" uses 80). */
  readonly labelPx?: number;
  /** An icon on the face (texture key + frame), drawn `iconPx` wide. */
  readonly icon?: { readonly key: string; readonly frame?: string; readonly px: number } | null;
  /** Label left of the icon instead of centred (icon + label rows). */
  readonly disabled?: boolean;
}

const KB = TOKENS.kit.button;
/** JUICE #97: the face sinks by the lip difference (14 → 4 px). */
export const PRESS_SINK_PX = KB.lipPx - KB.pressedLipPx;
/** Release overshoot (JUICE #97 "1,04 → 1,0"). */
const RELEASE_PEAK = 1.04;

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
    const color: KitButtonColor = spec.disabled ? 'grey' : spec.color;
    const n = kitButtonRef(scene.game, color, h, spec.disabled ? 'disabled' : 'normal');
    this.normal = this.slice(n.ref, n.slices, w);
    const parts: Phaser.GameObjects.GameObject[] = [this.normal];
    if (!spec.disabled) {
      const p = kitButtonRef(scene.game, color, h, 'pressed');
      this.pressedLook = this.slice(p.ref, p.slices, w).setVisible(false);
      parts.push(this.pressedLook);
    } else this.pressedLook = null;
    const face = buttonFaceRect({ color, w, h }, TOKENS);
    // label centre = face centre + textOffsetY (ART §14.1 row 6 "yüzün ortası + 4 px")
    const cy = -h / 2 + face.y + face.h / 2 + TOKENS.shadow.textOffsetY;
    const q = TOKENS.kit.buttonColor[color];
    const contentParts: Phaser.GameObjects.GameObject[] = [];
    let icon: Phaser.GameObjects.Image | null = null;
    if (spec.icon) {
      icon = scene.add.image(0, cy - TOKENS.shadow.textOffsetY, spec.icon.key, spec.icon.frame);
      icon.setDisplaySize(spec.icon.px, spec.icon.px);
      contentParts.push(icon);
    }
    this.icon = icon;
    let label: Phaser.GameObjects.Text | null = null;
    if (spec.label) {
      const px = spec.labelPx ?? TOKENS.font.size.button;
      label =
        color === 'cream'
          ? addKitText(scene, 0, cy, spec.label, 'panel', px)
          : addKitText(scene, 0, cy, spec.label, 'brightTitle', px, q.stroke);
      fitWidth(label, face.w - 2 * KB.glossInsetXPx - 24);
      if (spec.disabled) label.setAlpha(0.8);
      contentParts.push(label);
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

  /** `ButtonTarget.setLip` of JUICE #69: v1 lip px (`shadow.buttonLipPx` … `buttonPressedLipPx`) → the v2 press. */
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
