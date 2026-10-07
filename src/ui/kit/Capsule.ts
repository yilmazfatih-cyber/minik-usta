/**
 * Counter capsule of the home top bar and the win rewards (ART §14.5 `kit.capsule`; UX §3 "Can / Altın / Yıldız
 * kapsülü", §6.1 "ödül kapsülleri"): the dark translucent pill (`ui_capsule`, 3-sliced to `w`), a `iconPx` icon that
 * sticks out `iconOverhangPx` past the left end (in front), the number in the "Sayaç" look (`fontPx`), an optional
 * second line (`font.size.caption`: the lives countdown or `hud.livesFull`) and, on the coin capsule, the green Ø
 * `plusPx` "+" inside the right end. The whole capsule is one tap target (height padded to `touch.minTargetPx`; the
 * capsule and its "+" lead to the same place, UX §3).
 */
import Phaser from 'phaser';
import { hitArea } from '../../theme/layout.ts';
import { TOKENS } from '../../theme/tokens.ts';
import { KIT } from '../../theme/textures.ts';
import { kitRef, kitSlice } from './atlas.ts';
import type { IconBinder } from './icons.ts';
import { addKitText, centreOnGlyphs, fitWidth, kitTextStyle } from './text.ts';

const CP = TOKENS.kit.capsule;

export interface CapsuleSpec {
  readonly w: number;
  readonly icon: string;
  readonly value: string;
  readonly sub?: string | null;
  readonly plus?: boolean;
}

export class Capsule {
  readonly root: Phaser.GameObjects.Container;
  readonly icon: Phaser.GameObjects.Image;
  private readonly scene: Phaser.Scene;
  private readonly w: number;
  private readonly value: Phaser.GameObjects.Text;
  private sub: Phaser.GameObjects.Text | null = null;
  private readonly plus: Phaser.GameObjects.Image | null;
  private readonly plusPressed: Phaser.GameObjects.Image | null;
  private tapFn: (() => void) | null = null;
  private pressFn: ((v: 'press' | 'release') => void) | null = null;
  private pressed = false;

  constructor(scene: Phaser.Scene, icons: IconBinder, spec: CapsuleSpec) {
    this.scene = scene;
    this.w = spec.w;
    const h = CP.heightPx;
    const pill = kitRef(scene.game, KIT.capsule);
    const s = kitSlice(KIT.capsule);
    const body = scene.add
      .nineslice(0, 0, pill.key, pill.frame, spec.w, 0, s?.left ?? 56, s?.right ?? 56, 0, 0)
      .setOrigin(0, 0);
    const parts: Phaser.GameObjects.GameObject[] = [body];
    let plus: Phaser.GameObjects.Image | null = null;
    let plusPressed: Phaser.GameObjects.Image | null = null;
    if (spec.plus) {
      const d = CP.plusPx;
      const cx = spec.w - h / 2;
      for (const name of [KIT.plus, KIT.plusPressed]) {
        const r = kitRef(scene.game, name);
        const img = scene.add.image(cx, h / 2, r.key, r.frame).setOrigin(0.5, d / 2 / r.h);
        parts.push(img);
        if (name === KIT.plus) plus = img;
        else plusPressed = img.setVisible(false);
      }
    }
    this.plus = plus;
    this.plusPressed = plusPressed;
    const iconPx = CP.iconPx;
    this.icon = icons.add(scene, -CP.iconOverhangPx + iconPx / 2, h / 2, spec.icon, iconPx);
    this.value = addKitText(scene, 0, h / 2, spec.value, 'counter', CP.fontPx);
    parts.push(this.value, this.icon);
    this.root = scene.add.container(0, 0, parts);
    this.setValue(spec.value, spec.sub ?? null);
    const hit = hitArea(
      { x: -CP.iconOverhangPx, y: 0, w: spec.w + CP.iconOverhangPx, h },
      TOKENS.touch.minTargetPx,
    );
    this.root.setInteractive(
      new Phaser.Geom.Rectangle(hit.x, hit.y, hit.w, hit.h),
      Phaser.Geom.Rectangle.Contains,
    );
    this.root.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.pressed = true;
      this.plus?.setVisible(false);
      this.plusPressed?.setVisible(true);
      this.pressFn?.('press');
    });
    const release = (tap: boolean): void => {
      if (!this.pressed) return;
      this.pressed = false;
      this.plus?.setVisible(true);
      this.plusPressed?.setVisible(false);
      this.pressFn?.('release');
      if (tap) this.tapFn?.();
    };
    this.root.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, (p: Phaser.Input.Pointer) =>
      release(!p.wasCanceled),
    );
    this.root.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => release(false));
  }

  /** Room for the number: from the icon's right edge to the "+" (or the pill's end). */
  private textBox(): { cx: number; w: number } {
    const left = -CP.iconOverhangPx + CP.iconPx;
    const right = this.plus ? this.w - CP.heightPx / 2 - CP.plusPx / 2 - 6 : this.w - CP.heightPx / 4;
    return { cx: (left + right) / 2, w: Math.max(40, right - left) };
  }

  /** Number (and the optional second line: countdown / "Dolu"). */
  setValue(value: string, sub: string | null = null): this {
    const h = CP.heightPx;
    const box = this.textBox();
    this.value.setText(value);
    if (sub) {
      if (!this.sub) {
        this.sub = addKitText(this.scene, 0, 0, sub, 'counter', TOKENS.font.size.caption);
        this.root.add(this.sub);
      }
      this.sub.setText(sub).setPosition(box.cx, h / 2 + 22);
      this.restyle(Math.round(CP.fontPx * 0.84));
      this.value.setPosition(box.cx, h / 2 - 14);
      fitWidth(this.sub, box.w);
    } else {
      this.sub?.destroy();
      this.sub = null;
      this.restyle(CP.fontPx);
      this.value.setPosition(box.cx, h / 2);
    }
    fitWidth(this.value, box.w);
    return this;
  }

  private restyle(px: number): void {
    if (this.value.style.fontSize === `${px}px`) return;
    this.value.setStyle(kitTextStyle('counter', px));
    centreOnGlyphs(this.value);
  }

  onTap(fn: () => void): this {
    this.tapFn = fn;
    return this;
  }

  onPress(fn: (v: 'press' | 'release') => void): this {
    this.pressFn = fn;
    return this;
  }

  /** Short bounce (a tap without a window, UX §3). */
  bounce(reduced: boolean): void {
    if (reduced) return;
    this.scene.tweens.add({
      targets: this.icon,
      scale: { from: this.icon.scale * 1.15, to: this.icon.scale },
      duration: TOKENS.duration.bump,
      ease: 'Back.easeOut',
    });
  }

  /** Centre of the "+" (or of the capsule) in the root's parent space (hint bubble anchor). */
  anchor(): { x: number; y: number } {
    const x = this.plus ? this.plus.x : this.w / 2;
    return { x: this.root.x + x, y: this.root.y + CP.heightPx };
  }

  destroy(): void {
    this.root.destroy(true);
  }
}
