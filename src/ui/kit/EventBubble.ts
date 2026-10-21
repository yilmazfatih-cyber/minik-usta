/**
 * Side event bubble v3 (ART_REFERENCE §9.2 "etkinlik baloncukları": Ø 176 disc + 160 × 56 label strip under it, Ø 56
 * red count badge at the upper left, the small gold lock on a locked one; UX §3 "Kenar ikonları" — in the Faz 2R slice
 * the level chest ring (META §8.2) and the locked Usta Ligi bubble). The disc: dark contour, indigo radial face with a
 * lighter rim, the icon; progress (`value / max`) as gold ring segments around the disc. Static: no timers in the
 * slice (cut 3). One tap target of the whole box.
 */
import Phaser from 'phaser';
import { hitArea } from '../../theme/layout.ts';
import type { Rect } from '../../theme/layout.ts';
import { TOKENS } from '../../theme/tokens.ts';
import { KIT } from '../../theme/textures.ts';
import { addBakedGraphics } from '../BakedGraphics.ts';
import { drawOk } from '../icons.ts';
import { hex } from '../text.ts';
import { kitRef } from './atlas.ts';
import type { IconBinder } from './icons.ts';
import { addKitText, fitWidth } from './text.ts';

export interface EventBubbleSpec {
  /** Box: the disc (`w` wide) and the label strip under it (`h` − disc). */
  readonly box: Rect;
  readonly icon: string;
  /** Label strip text (`common.count` "4/10", or `common.comingSoon`). */
  readonly label: string;
  /** Label strip tone: green (progress / open), orange (event) or grey (locked). */
  readonly tone: 'green' | 'orange' | 'grey';
  /** Gold progress ring segments (level chest); null = no ring. */
  readonly progress?: { readonly value: number; readonly max: number; readonly done: boolean } | null;
  readonly locked?: boolean;
  /** Ø 56 red count badge at the upper left (null = none). */
  readonly badge?: string | null;
}

const V = TOKENS.kit.v3;
const SH = V.screen.home;
const TONE: Readonly<Record<EventBubbleSpec['tone'], string>> = {
  green: '#288338',
  orange: '#AD3E0D',
  grey: V.buttonColor.grey.lip,
};
/** Progress ring (ART §14 chest ring 8 px; gold segments, 5° gaps). */
const RING_PX = 10;
const SEG_GAP_DEG = 5;

export class EventBubble {
  readonly root: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly icon: Phaser.GameObjects.Image;
  private readonly lock: Phaser.GameObjects.Image | null;
  private tapFn: (() => void) | null = null;

  constructor(scene: Phaser.Scene, icons: IconBinder, spec: EventBubbleSpec) {
    this.scene = scene;
    const d = spec.box.w;
    const R = d / 2;
    const g = addBakedGraphics(scene);
    // disc: shadow, dark contour, radial-ish face (two discs), rim light
    g.fillStyle(0x000000, 0.3).fillCircle(0, 8, R);
    g.fillStyle(hex(V.panel.outline), 1).fillCircle(0, 0, R);
    g.fillStyle(hex(V.nav.raisedBottom), 1).fillCircle(0, 0, R - 6);
    g.fillStyle(hex(V.nav.raisedTop), 1).fillCircle(-R * 0.1, -R * 0.12, R - 16);
    g.fillStyle(0xffffff, 0.12).fillEllipse(-R * 0.15, -R * 0.5, R * 0.9, R * 0.35);
    const p = spec.progress ?? null;
    if (p) {
      const n = Math.max(1, p.max);
      const filled = p.done ? n : Math.min(n, p.value);
      const rr = R - 6 - RING_PX / 2;
      for (let i = 0; i < n; i++) {
        const a0 = Phaser.Math.DegToRad(-90 + (i * 360) / n + SEG_GAP_DEG / 2);
        const a1 = Phaser.Math.DegToRad(-90 + ((i + 1) * 360) / n - SEG_GAP_DEG / 2);
        g.lineStyle(
          RING_PX,
          i < filled ? hex(V.palette.gold) : hex(V.palette.gameBase),
          i < filled ? 1 : 0.6,
        );
        g.beginPath();
        g.arc(0, 0, rr, a0, a1, false);
        g.strokePath();
      }
    }
    // label strip under the disc
    const lw = SH.eventLabelW;
    const lh = SH.eventLabelH;
    const ly = R + 8;
    const tone = hex(TONE[spec.tone]);
    g.fillStyle(0x000000, 0.3).fillRoundedRect(-lw / 2, ly + 6, lw, lh, lh / 2);
    g.fillStyle(hex(V.panel.outline), 1).fillRoundedRect(-lw / 2, ly, lw, lh, lh / 2);
    g.fillStyle(tone, 1).fillRoundedRect(-lw / 2 + 4, ly + 4, lw - 8, lh - 8, lh / 2 - 4);
    const parts: Phaser.GameObjects.GameObject[] = [g];
    this.icon = icons.add(scene, 0, -4, spec.icon, Math.round(d * 0.58));
    if (spec.locked) this.icon.setAlpha(V.nav.lockedAlpha);
    parts.push(this.icon);
    const label = addKitText(scene, 0, ly + lh / 2, spec.label, 'button', 34, V.panel.outline, '#FFFFFF');
    fitWidth(label, lw - 24);
    parts.push(label);
    if (p?.done) {
      const ok = addBakedGraphics(scene);
      drawOk(ok, 44);
      ok.setPosition(R * 0.62, R * 0.62);
      parts.push(ok);
    }
    let lock: Phaser.GameObjects.Image | null = null;
    if (spec.locked) {
      const lr = kitRef(scene.game, KIT.lockSmall);
      const lpx = V.nav.lockPx;
      lock = scene.add.image(R * 0.62, R * 0.55, lr.key, lr.frame).setDisplaySize(lpx, (lpx * lr.h) / lr.w);
      parts.push(lock);
    }
    if (spec.badge) {
      const br = kitRef(scene.game, KIT.badgeSmall);
      const bpx = SH.eventBadgePx;
      const bx = -R * 0.72;
      const by = -R * 0.72;
      parts.push(scene.add.image(bx, by, br.key, br.frame).setOrigin(0.5, bpx / 2 / br.h));
      parts.push(addKitText(scene, bx, by, spec.badge, 'button', V.badge.smallFontPx, V.badge.textStroke));
    }
    this.lock = lock;
    this.root = scene.add.container(spec.box.x + R, spec.box.y + R, parts);
    const hit = hitArea({ x: -R, y: -R, w: d, h: spec.box.h }, TOKENS.touch.minTargetPx);
    this.root.setInteractive(
      new Phaser.Geom.Rectangle(hit.x, hit.y, hit.w, hit.h),
      Phaser.Geom.Rectangle.Contains,
    );
    this.root.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, (pt: Phaser.Input.Pointer) => {
      if (!pt.wasCanceled) this.tapFn?.();
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

  /** JUICE #73: the lock shakes (locked bubble); reduced motion: none. */
  shakeLock(reduced: boolean): void {
    const lock = this.lock;
    if (!lock || reduced) return;
    this.scene.tweens.killTweensOf(lock);
    lock.setAngle(0);
    this.scene.tweens.add({
      targets: lock,
      angle: { from: -14, to: 14 },
      duration: TOKENS.duration.lockedShake / 6,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: () => lock.setAngle(0),
    });
  }

  /** Point under the bubble (hint balloon anchor, design px of the parent). */
  anchor(): { x: number; y: number } {
    return { x: this.root.x, y: this.root.y - this.icon.displayHeight / 2 - 12 };
  }

  destroy(): void {
    this.root.destroy(true);
  }
}
