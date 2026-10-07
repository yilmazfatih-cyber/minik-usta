/**
 * Round side icon with a progress ring (UX §3 "Kenar ikonları": the level chest, META §8.2; ART §14 kit colours): a
 * dark ring track with `max` gold segments (`kit.progress` fill colours, 8 px = `layout.home.chestRingPx`), the
 * cream kit disc with its contour and gloss, the icon, and "n/max" under it in the "Sayaç" look (34 px). Full → every
 * segment gold and a green ✓ badge (the slice's "açılmış (✓)" state). Static: the ring does not animate (cut 3).
 */
import Phaser from 'phaser';
import { hitArea } from '../../theme/layout.ts';
import { TOKENS } from '../../theme/tokens.ts';
import { addBakedGraphics } from '../BakedGraphics.ts';
import { drawOk } from '../icons.ts';
import { hex } from '../text.ts';
import type { IconBinder } from './icons.ts';
import { addKitText } from './text.ts';

export interface RingIconSpec {
  /** Outer diameter (`layout.home.sideSize`). */
  readonly size: number;
  readonly icon: string;
  readonly value: number;
  readonly max: number;
  readonly done: boolean;
  readonly label: string;
}

const CREAM = TOKENS.kit.buttonColor.cream;
const PG = TOKENS.kit.progress;
/** Gap between ring segments (degrees). */
const SEG_GAP_DEG = 5;

export class RingIcon {
  readonly root: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly icon: Phaser.GameObjects.Image;
  private tapFn: (() => void) | null = null;

  constructor(scene: Phaser.Scene, icons: IconBinder, spec: RingIconSpec) {
    this.scene = scene;
    const R = spec.size / 2;
    const ring = TOKENS.layout.home.chestRingPx;
    const g = addBakedGraphics(scene);
    // drop shadow, dark ring track
    g.fillStyle(0x000000, 0.22).fillCircle(0, 8, R);
    g.fillStyle(hex(TOKENS.color.ui.ink), 1).fillCircle(0, 0, R);
    // segments (clockwise from the top)
    const n = Math.max(1, spec.max);
    const filled = spec.done ? n : Math.min(n, spec.value);
    const rr = R - ring / 2 - 3;
    for (let i = 0; i < n; i++) {
      const a0 = Phaser.Math.DegToRad(-90 + (i * 360) / n + SEG_GAP_DEG / 2);
      const a1 = Phaser.Math.DegToRad(-90 + ((i + 1) * 360) / n - SEG_GAP_DEG / 2);
      g.lineStyle(ring, i < filled ? hex(PG.fillBottom) : hex(TOKENS.color.ui.inkSoft), 1);
      g.beginPath();
      g.arc(0, 0, rr, a0, a1, false);
      g.strokePath();
    }
    // cream disc: contour, lip, face, gloss
    const inner = R - ring - 8;
    g.fillStyle(hex(CREAM.stroke), 1).fillCircle(0, 0, inner);
    g.fillStyle(hex(CREAM.lip), 1).fillCircle(0, 0, inner - 4);
    g.fillStyle(hex(CREAM.base), 1).fillCircle(0, -4, inner - 8);
    g.fillStyle(0xffffff, 0.55).fillEllipse(0, -inner * 0.5, inner * 1.1, inner * 0.42);
    const parts: Phaser.GameObjects.GameObject[] = [g];
    this.icon = icons.add(scene, 0, -4, spec.icon, Math.round(inner * 1.45));
    parts.push(this.icon);
    if (spec.done) {
      const ok = addBakedGraphics(scene);
      drawOk(ok, 44);
      ok.setPosition(R * 0.62, R * 0.62);
      parts.push(ok);
    }
    const label = addKitText(scene, 0, R + 26, spec.label, 'counter', TOKENS.font.size.caption);
    parts.push(label);
    this.root = scene.add.container(0, 0, parts);
    const hit = hitArea({ x: -R, y: -R, w: spec.size, h: spec.size }, TOKENS.touch.minTargetPx);
    this.root.setInteractive(
      new Phaser.Geom.Rectangle(hit.x, hit.y, hit.w, hit.h),
      Phaser.Geom.Rectangle.Contains,
    );
    this.root.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, (p: Phaser.Input.Pointer) => {
      if (!p.wasCanceled) this.tapFn?.();
    });
  }

  onTap(fn: () => void): this {
    this.tapFn = fn;
    return this;
  }

  /** A short hop of the icon (no window in the slice: the chest preview is Faz 4). */
  bounce(reduced: boolean): void {
    if (reduced) return;
    const s = this.icon.scale;
    this.scene.tweens.add({
      targets: this.icon,
      scale: { from: s * 1.15, to: s },
      duration: TOKENS.duration.bump * 2,
      ease: 'Back.easeOut',
    });
  }

  destroy(): void {
    this.root.destroy(true);
  }
}
