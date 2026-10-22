/**
 * "Dokun ve al" reward layer (UX_FLOWS §6.2; ART_REFERENCE §8 "Dokun ve al dizisi", §9.6; JUICE #74 flight; STORY
 * §7.8 `reward.tap` / `reward.ready`): the flat dark overlay (#05030D α 0,85, 200 ms) → the gold title (`titleGold`,
 * ≤ 2 lines, y 0,22 H) → the reward objects (240 px alone; 200 px at 540 ∓ 200 for two, DS3-04; 120 ms apart) popping
 * 0 → 1,15 → 1,0, each over a radial glow (`ui_glow_radial` tinted #FFE7A3, α 0,55 → 0 over 1,6 × the object, ADD —
 * the glows of two objects do not meet) → the counts (`bigNumber` 72, 40 px under the object) → "Dokun ve al"
 * (`plain` 72, y 1540 FIT) after 400 ms, pulsing 1,0 ↔ 1,04 every 1,2 s. The whole screen is the tap target: a tap
 * flies the objects to their capsules (`targets`, 600 ms arc) and fades the layer; without a tap it closes itself
 * after 6 s (the reward is already granted — the caller writes it before opening the layer). Reduced motion: the
 * overlay at its final alpha at once, 150 ms fades, no pop, steady glow, no pulse. Values: `check.v3Addenda.rewardLayer`
 * (`V3_ADDENDA`) over `kit.v3.screen.reward`.
 *
 * In the Faz 2R slice nothing opens it yet (the level chest window and the daily gift are Faz 4, UX §3.1); the
 * Playwright harness opens it for the screen set (`__harness.showReward`).
 */
import Phaser from 'phaser';
import { t } from '../services/i18n.ts';
import { TOKENS, V3_ADDENDA } from '../theme/tokens.ts';
import { KIT } from '../theme/textures.ts';
import { hex } from './text.ts';
import { kitRef } from './kit/atlas.ts';
import type { IconBinder } from './kit/icons.ts';
import { addKitText, addTitleGold } from './kit/text.ts';

const V3 = TOKENS.kit.v3;
const RW = V3.screen.reward;
const FX = V3.effects;
/** ART_REFERENCE v1.1 §9.6 (DS3-04): glow, two-object geometry, flat overlay, tap line. */
const RL = V3_ADDENDA.rewardLayer;

export interface RewardItem {
  /** Icon id (`icon_coin`, `icon_hammer` …). */
  readonly icon: string;
  /** Count line (`common.coins` "{coin}200" → "200"; `common.times` "×1"). */
  readonly count: string;
  /** Where the object flies on the tap (design px), null = it fades in place. */
  readonly target?: { readonly x: number; readonly y: number } | null;
}

export interface RewardLayerSpec {
  readonly title: string;
  readonly items: readonly RewardItem[];
  readonly reduced: boolean;
}

/** Several objects: 200 px each, centres `twoItemOffsetPx` apart from the middle (DS3-04: 540 ∓ 200 for two). */
const MULTI_PX = RL.itemPx;
const MULTI_STEP = 2 * RL.twoItemOffsetPx;
const MULTI_STAGGER_MS = 120;
/** Count line: `bigNumber` 72, its centre 40 px under the object's bottom edge plus half its own height. */
const COUNT_GAP_PX = 40;
/** Auto-close without a tap (UX §6.2). */
const AUTO_CLOSE_MS = 6000;
const FLY_MS = 600;

export class RewardLayer {
  readonly root: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly dim: Phaser.GameObjects.Rectangle;
  private readonly objects: Phaser.GameObjects.Image[] = [];
  private readonly glows: Phaser.GameObjects.Image[] = [];
  private readonly counts: Phaser.GameObjects.Text[] = [];
  private readonly tap: Phaser.GameObjects.Text;
  private readonly items: readonly RewardItem[];
  private readonly reduced: boolean;
  private timer: Phaser.Time.TimerEvent | null = null;
  private closing = false;
  private doneFn: (() => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    icons: IconBinder,
    size: { readonly W: number; readonly H: number },
    spec: RewardLayerSpec,
    depth: number,
  ) {
    this.scene = scene;
    this.items = spec.items;
    this.reduced = spec.reduced;
    const { W, H } = size;
    const surplus = H - TOKENS.meta.designHeight;
    const shift = surplus * 0.5;
    const parts: Phaser.GameObjects.GameObject[] = [];
    // the flat overlay (reduced motion: at its alpha from the first frame)
    this.dim = scene.add
      .rectangle(0, 0, W, H, hex(RL.overlay), 1)
      .setOrigin(0, 0)
      .setAlpha(spec.reduced ? RL.overlayAlpha : 0)
      .setInteractive();
    parts.push(this.dim);
    const title = addTitleGold(scene, W / 2, RW.titleY + shift, spec.title, V3.text.titleGold.fontPx);
    title.fit(W - 120);
    parts.push(title.root);
    const n = spec.items.length;
    const px = n > 1 ? MULTI_PX : RW.itemPx;
    const glowRef = kitRef(scene.game, KIT.glow);
    spec.items.forEach((it, i) => {
      const cx = W / 2 + (i - (n - 1) / 2) * MULTI_STEP;
      const cy = RW.itemY + shift;
      // ART_REFERENCE §8 "Parlama": radial #FFE7A3 α 0,55 → 0, radius 1,6 × the object's, additive
      const glowD = px * RL.glowRadiusRatio * 2;
      const glow = scene.add
        .image(cx, cy, glowRef.key, glowRef.frame)
        .setDisplaySize(glowD, glowD)
        .setTint(hex(RL.glow))
        .setAlpha(RL.glowAlpha)
        .setBlendMode(Phaser.BlendModes.ADD);
      const obj = icons.add(scene, cx, cy, it.icon, px);
      const count = addKitText(
        scene,
        cx,
        cy + px / 2 + COUNT_GAP_PX + RW.countFontPx / 2,
        it.count,
        'bigNumber',
        RW.countFontPx,
      );
      this.glows.push(glow);
      this.objects.push(obj);
      this.counts.push(count);
      parts.push(glow, obj, count);
    });
    this.tap = addKitText(scene, W / 2, RL.tapTextY + surplus, t('reward.tap'), 'plain', RL.tapTextPx);
    parts.push(this.tap);
    this.root = scene.add.container(0, 0, parts).setDepth(depth);
    this.enter();
    this.dim.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!p.wasCanceled) this.collect();
    });
    this.timer = scene.time.delayedCall(AUTO_CLOSE_MS, () => this.collect());
  }

  /** Called once the layer has left (the objects reached their capsules or faded). */
  onDone(fn: () => void): this {
    this.doneFn = fn;
    return this;
  }

  private enter(): void {
    const tw = this.scene.tweens;
    const fade = this.reduced ? TOKENS.duration.reducedFade : FX.overlayMs;
    if (!this.reduced) tw.add({ targets: this.dim, alpha: RL.overlayAlpha, duration: fade });
    this.objects.forEach((obj, i) => {
      const glow = this.glows[i];
      const count = this.counts[i];
      const delay = i * MULTI_STAGGER_MS;
      if (this.reduced) {
        // the glow keeps its own alpha (steady); object and count fade in
        for (const o of [obj, count]) o?.setAlpha(0);
        tw.add({ targets: [obj, count], alpha: 1, duration: TOKENS.duration.reducedFade, delay });
        return;
      }
      const s = obj.scale;
      obj.setScale(0);
      glow?.setAlpha(0);
      count?.setAlpha(0);
      tw.add({ targets: obj, scale: s * 1.15, duration: FX.popMs * 0.7, delay, ease: 'Back.easeOut' });
      tw.add({ targets: obj, scale: s, duration: FX.popMs * 0.3, delay: delay + FX.popMs * 0.7 });
      if (glow) tw.add({ targets: glow, alpha: RL.glowAlpha, duration: FX.popMs, delay });
      if (count) tw.add({ targets: count, alpha: 1, duration: 200, delay: delay + FX.popMs });
    });
    this.tap.setAlpha(0);
    tw.add({ targets: this.tap, alpha: 1, duration: 200, delay: FX.tapTextDelayMs });
    if (!this.reduced) {
      tw.add({
        targets: this.tap,
        scale: FX.tapPulseScale,
        duration: FX.tapPulseMs / 2,
        delay: FX.tapTextDelayMs,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /** The tap (or the timeout): objects fly to their capsules (JUICE #74 arc), the layer fades. */
  private collect(): void {
    if (this.closing) return;
    this.closing = true;
    this.timer?.remove(false);
    this.timer = null;
    const tw = this.scene.tweens;
    const fade = this.reduced ? TOKENS.duration.reducedFade : FX.overlayMs;
    let flights = 0;
    this.objects.forEach((obj, i) => {
      const target = this.items[i]?.target ?? null;
      if (!target || this.reduced) {
        tw.add({ targets: [obj, this.glows[i], this.counts[i]], alpha: 0, duration: fade });
        return;
      }
      flights += 1;
      const x0 = obj.x;
      const y0 = obj.y;
      const s0 = obj.scale;
      tw.add({ targets: [this.glows[i], this.counts[i]], alpha: 0, duration: fade });
      tw.addCounter({
        from: 0,
        to: 1,
        duration: FLY_MS,
        ease: 'Quad.easeIn',
        onUpdate: (tween) => {
          const u = tween.getValue() ?? 0;
          obj.x = x0 + (target.x - x0) * u;
          obj.y = y0 + (target.y - y0) * u - FX.coinArcPx * 4 * u * (1 - u);
          obj.setScale(s0 * (1 - 0.7 * u));
        },
        onComplete: () => {
          obj.setVisible(false);
          flights -= 1;
          if (flights === 0) this.leave();
        },
      });
    });
    tw.add({ targets: [this.dim, this.tap], alpha: 0, duration: fade });
    if (flights === 0) this.scene.time.delayedCall(fade, () => this.leave());
  }

  private leave(): void {
    this.doneFn?.();
    this.destroy();
  }

  destroy(): void {
    this.timer?.remove(false);
    this.timer = null;
    this.root.destroy(true);
  }
}
