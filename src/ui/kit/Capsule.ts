/**
 * Counter capsule v3 (ART_REFERENCE §3.4 `kit.v3.capsule`; UX §3 "Can / Altın / Yıldız kapsülü", §6.1 reward
 * capsules, §9.4 HUD chips): the dark hollow pill (`ui_capsule` 88 high on the home screen, `ui_capsule_hud` 60 in the
 * HUD, 3-sliced to `w`), an icon that sticks out `iconOverhangPx` past the left end (in front, with its own shadow),
 * the number in the cream counter look (home 44 / HUD 40; HUD counters may be lavender) and, on the coin capsule, the
 * green Ø 56 "+" overhanging the right end by 8 px. The lives capsule writes the count INSIDE the heart (white 36 +
 * `heartBottom` contour) and the countdown / "Dolu" as the capsule text. One tap target (height padded to
 * `touch.minTargetPx`; the capsule and its "+" lead to the same place, UX §3).
 */
import Phaser from 'phaser';
import { hitArea } from '../../theme/layout.ts';
import { TOKENS } from '../../theme/tokens.ts';
import { KIT } from '../../theme/textures.ts';
import { capsuleV3Height } from '../../theme/draw/kitV3.ts';
import type { CapsuleV3Variant } from '../../theme/draw/kitV3.ts';
import { kitRef, kitSlice } from './atlas.ts';
import type { IconBinder } from './icons.ts';
import { addKitText, centreOnGlyphs, fitWidth, kitTextStyle } from './text.ts';
import type { TextRole } from './text.ts';

const CP = TOKENS.kit.v3.capsule;
const PL = TOKENS.kit.v3.plus;

export interface CapsuleSpec {
  readonly w: number;
  readonly icon: string;
  readonly value: string;
  readonly plus?: boolean;
  /** `home` (88, cream 44) or `hud` (60, lavender 40). */
  readonly variant?: CapsuleV3Variant;
  /** Number drawn inside the icon (the lives heart, ART_REFERENCE §3.4) instead of the capsule text. */
  readonly inIcon?: string | null;
  /** Text colour role of the capsule text (default: cream on home, lavender in the HUD). */
  readonly role?: Extract<TextRole, 'counterCream' | 'counterLavender'>;
}

/** Number inside the heart (ART_REFERENCE §3.4 "beyaz 36 px, #B80E12 kontur 0,08 em"). */
const IN_ICON_PX = 36;

export class Capsule {
  readonly root: Phaser.GameObjects.Container;
  readonly icon: Phaser.GameObjects.Image;
  private readonly scene: Phaser.Scene;
  private readonly w: number;
  private readonly h: number;
  private readonly variant: CapsuleV3Variant;
  private readonly iconPx: number;
  private readonly fontPx: number;
  private readonly role: TextRole;
  private readonly value: Phaser.GameObjects.Text;
  private readonly inIcon: Phaser.GameObjects.Text | null;
  private readonly plus: Phaser.GameObjects.Image | null;
  private readonly plusPressed: Phaser.GameObjects.Image | null;
  private tapFn: (() => void) | null = null;
  private pressFn: ((v: 'press' | 'release') => void) | null = null;
  private pressed = false;

  constructor(scene: Phaser.Scene, icons: IconBinder, spec: CapsuleSpec) {
    this.scene = scene;
    this.w = spec.w;
    const variant = spec.variant ?? 'home';
    this.variant = variant;
    const h = capsuleV3Height(variant, TOKENS);
    this.h = h;
    this.iconPx = variant === 'home' ? CP.homeIconPx : CP.hudIconPx;
    this.fontPx = variant === 'home' ? CP.homeFontPx : CP.hudFontPx;
    this.role = spec.role ?? (variant === 'home' ? 'counterCream' : 'counterLavender');
    const name = variant === 'home' ? KIT.capsule : KIT.capsuleHud;
    const pill = kitRef(scene.game, name);
    const s = kitSlice(name);
    const body = scene.add
      .nineslice(0, 0, pill.key, pill.frame, spec.w, 0, s?.left ?? 56, s?.right ?? 56, 0, 0)
      .setOrigin(0, 0);
    const parts: Phaser.GameObjects.GameObject[] = [body];
    let plus: Phaser.GameObjects.Image | null = null;
    let plusPressed: Phaser.GameObjects.Image | null = null;
    if (spec.plus) {
      const d = PL.diameterPx;
      const cx = spec.w - d / 2 + PL.overhangPx;
      for (const n of [KIT.plus, KIT.plusPressed]) {
        const r = kitRef(scene.game, n);
        const img = scene.add.image(cx, h / 2, r.key, r.frame).setOrigin(0.5, d / 2 / r.h);
        parts.push(img);
        if (n === KIT.plus) plus = img;
        else plusPressed = img.setVisible(false);
      }
    }
    this.plus = plus;
    this.plusPressed = plusPressed;
    const ix = -CP.iconOverhangPx + this.iconPx / 2;
    // the icon's own soft shadow (a darker copy 4 px lower)
    const shadow = icons
      .add(scene, ix, h / 2 + 4, spec.icon, this.iconPx)
      .setTint(0x000000)
      .setAlpha(0.3);
    this.icon = icons.add(scene, ix, h / 2, spec.icon, this.iconPx);
    this.value = addKitText(scene, 0, h / 2, spec.value, this.role, this.fontPx);
    parts.push(this.value, shadow, this.icon);
    this.inIcon = spec.inIcon !== undefined && spec.inIcon !== null ? this.makeInIcon(ix, h / 2) : null;
    if (this.inIcon) parts.push(this.inIcon);
    this.root = scene.add.container(0, 0, parts);
    this.setValue(spec.value, spec.inIcon ?? null);
    const hit = hitArea(
      { x: -CP.iconOverhangPx, y: 0, w: spec.w + CP.iconOverhangPx + (spec.plus ? PL.overhangPx : 0), h },
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

  private makeInIcon(x: number, y: number): Phaser.GameObjects.Text {
    const t = this.scene.add
      .text(x, y + 2, '', kitTextStyle('counterCream', IN_ICON_PX, TOKENS.kit.v3.palette.heartBottom))
      .setOrigin(0.5, 0.5);
    centreOnGlyphs(t);
    return t;
  }

  /** Room for the number: from the icon's right edge to the "+" (or the pill's end). */
  private textBox(): { cx: number; w: number } {
    const left = -CP.iconOverhangPx + this.iconPx + 6;
    const right = this.plus ? this.w - PL.diameterPx / 2 - 10 : this.w - this.h / 3;
    return { cx: (left + right) / 2, w: Math.max(40, right - left) };
  }

  /** Capsule text (and the number inside the icon, when the capsule has one). */
  setValue(value: string, inIcon: string | null = null): this {
    const box = this.textBox();
    this.value.setText(value).setPosition(box.cx, this.h / 2);
    fitWidth(this.value, box.w);
    if (this.inIcon && inIcon !== null) {
      this.inIcon.setText(inIcon);
      fitWidth(this.inIcon, this.iconPx * 0.7);
    }
    return this;
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
    return { x: this.root.x + x, y: this.root.y + this.h };
  }

  /** Centre of the icon in the root's parent space (reward flights, JUICE #74). */
  iconPoint(): { x: number; y: number } {
    return { x: this.root.x + this.icon.x, y: this.root.y + this.icon.y };
  }

  get height(): number {
    return this.h;
  }

  get kind(): CapsuleV3Variant {
    return this.variant;
  }

  destroy(): void {
    this.root.destroy(true);
  }
}
