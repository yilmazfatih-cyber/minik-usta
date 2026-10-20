/**
 * Pause button v3 (ART_REFERENCE §9.4 "Duraklat 136 × 136 `purple`"; UX_FLOWS §5.1 "Duraklat": `layout.top.pause`,
 * top-right). The purple HUD tool square of the kit (`ui3_button_purple_h136sq`, pressed frame on press) with two
 * rounded lavender bars; a tap opens the Pause window. It is a `ButtonTarget` for JUICE #69 (`setLip`: the v1 lip
 * maps onto the v3 press — the content sinks `pressedDropPx`).
 */
import type Phaser from 'phaser';
import type { Rect } from '../theme/layout.ts';
import { TOKENS } from '../theme/tokens.ts';
import { buttonV3PlateRect } from '../theme/draw/kitV3.ts';
import { hex } from './text.ts';
import { UI } from './uiConstants.ts';
import { addBakedGraphics } from './BakedGraphics.ts';
import { kitButtonRef } from './kit/atlas.ts';

const KB = TOKENS.kit.v3.button;
const PURPLE = TOKENS.kit.v3.buttonColor.purple;

/** The button's touch area for `rect`: a centred square of at least `touch.minTargetPx` (UX §0.3). */
export function pauseHitRect(rect: Rect): Rect {
  const side = Math.max(TOKENS.touch.minTargetPx, Math.max(rect.w, rect.h));
  return { x: rect.x + rect.w / 2 - side / 2, y: rect.y + rect.h / 2 - side / 2, w: side, h: side };
}

export class PauseButton {
  readonly root: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly face: Phaser.GameObjects.Container;
  private readonly bars: Phaser.GameObjects.Graphics;
  private normal: Phaser.GameObjects.NineSlice | null = null;
  private pressedLook: Phaser.GameObjects.NineSlice | null = null;
  private pressed = false;
  private tapFn: (() => void) | null = null;
  private pressFn: ((variant: 'press' | 'release') => void) | null = null;

  constructor(scene: Phaser.Scene, depth: number) {
    this.scene = scene;
    this.bars = addBakedGraphics(scene);
    this.face = scene.add.container(0, 0, [this.bars]);
    this.root = scene.add.container(0, 0, [this.face]).setDepth(depth);
    this.root.on('pointerdown', () => {
      this.pressed = true;
      this.setLip(TOKENS.shadow.buttonPressedLipPx);
      this.pressFn?.('press');
    });
    this.root.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.pressed) return;
      this.pressed = false;
      this.setLip(TOKENS.shadow.buttonLipPx);
      this.pressFn?.('release');
      if (!pointer.wasCanceled) this.tapFn?.();
    });
    this.root.on('pointerout', () => {
      if (!this.pressed) return;
      this.pressed = false;
      this.setLip(TOKENS.shadow.buttonLipPx);
      this.pressFn?.('release');
    });
  }

  layout(rect: Rect): void {
    const { w, h } = rect;
    this.normal?.destroy();
    this.pressedLook?.destroy();
    const n = kitButtonRef(this.scene.game, 'purple', h, 'normal', true);
    const p = kitButtonRef(this.scene.game, 'purple', h, 'pressed', true);
    const slice = (ref: typeof n): Phaser.GameObjects.NineSlice => {
      const ns = this.scene.add.nineslice(
        0,
        0,
        ref.ref.key,
        ref.ref.frame,
        w,
        0,
        ref.slices.left,
        ref.slices.right,
        ref.slices.top,
        ref.slices.bottom,
      );
      ns.setOrigin(0.5, h / 2 / ns.height);
      return ns;
    };
    this.normal = slice(n);
    this.pressedLook = slice(p).setVisible(false);
    this.root.addAt(this.pressedLook, 0);
    this.root.addAt(this.normal, 0);
    const plate = buttonV3PlateRect({ color: 'purple', w, h, square: true }, TOKENS);
    const cy = -h / 2 + plate.y + plate.h / 2;
    const bw = UI.pauseBarW;
    const bh = UI.pauseBarH;
    const gap = UI.pauseBarGap;
    this.bars
      .clear()
      .fillStyle(hex(PURPLE.lip), 1)
      .fillRoundedRect(-gap / 2 - bw, cy - bh / 2 + 4, bw, bh, bw / 2)
      .fillRoundedRect(gap / 2, cy - bh / 2 + 4, bw, bh, bw / 2)
      .fillStyle(hex(PURPLE.text), 1)
      .fillRoundedRect(-gap / 2 - bw, cy - bh / 2, bw, bh, bw / 2)
      .fillRoundedRect(gap / 2, cy - bh / 2, bw, bh, bw / 2);
    this.root.setPosition(rect.x + w / 2, rect.y + h / 2);
    const hit = pauseHitRect(rect);
    this.root.setSize(hit.w, hit.h);
    if (!this.root.input) this.root.setInteractive();
  }

  onTap(fn: () => void): this {
    this.tapFn = fn;
    return this;
  }

  onPress(fn: (variant: 'press' | 'release') => void): this {
    this.pressFn = fn;
    return this;
  }

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

  /** JUICE #69 lip (v1 px) → the v3 press: the pressed frame and the sunk bars. */
  setLip(px: number): void {
    const v1 = TOKENS.shadow;
    const k = Math.min(1, Math.max(0, (v1.buttonLipPx - px) / (v1.buttonLipPx - v1.buttonPressedLipPx)));
    const on = k > 0.5;
    this.normal?.setVisible(!on);
    this.pressedLook?.setVisible(on);
    this.face.y = k * KB.pressedDropPx;
  }

  setVisible(on: boolean): void {
    this.root.setVisible(on);
  }

  destroy(): void {
    this.root.destroy(true);
  }
}
