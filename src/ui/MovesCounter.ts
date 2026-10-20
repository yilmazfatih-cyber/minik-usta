/**
 * Moves counter v3 (ART_REFERENCE §9.4 "hamle plakası" 300 × 136: navy top band with "HAMLE" in cream 34 and two gold
 * lines, cream plate with the number in the `bigNumber` look 96; UX_FLOWS §5.1 `layout.top.moves`; JUICE #50, #51,
 * #53). A dumb view: the EventPlayer drives every animation through the setters (`rollTo`, `setDanger`, `setBump` …);
 * the number shown is the one the EventPlayer last set, which trails the core state until the move's cues reach
 * step 4 (JUICE §0 rule 10). The plate is the baked `ui_moves_plate` frame (no per-frame Graphics, TECH §10.6); the
 * low-moves warning paints the digit red and pulses (#51). Without the kit (tests) a plain Graphics plate stays.
 */
import type Phaser from 'phaser';
import { t, upper } from '../services/i18n.ts';
import type { Rect } from '../theme/layout.ts';
import { TOKENS } from '../theme/tokens.ts';
import { hex } from './text.ts';
import { addBakedGraphics } from './BakedGraphics.ts';
import { KIT } from '../theme/textures.ts';
import type { GoalsKit } from './GoalsPanel.ts';
import { addKitText, kitTextStyle } from './kit/text.ts';

const HV = TOKENS.kit.v3.screen.hud;
const PAL = TOKENS.kit.v3.palette;
/** UX §5.9 item 7 / ART_REFERENCE §2.4: the warning digit colour. */
const DANGER = TOKENS.kit.v3.badge.top;
/** "HAMLE" band label (ART_REFERENCE §9.4: krem 34). */
const LABEL_PX = 34;

export class MovesCounter {
  private readonly root: Phaser.GameObjects.Container;
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly danger: Phaser.GameObjects.Graphics;
  private readonly cur: Phaser.GameObjects.Text;
  private readonly next: Phaser.GameObjects.Text;
  private readonly label: Phaser.GameObjects.Text;
  private rect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private valueY = 0;
  private value = 0;
  private dangerOn = false;
  private pulseOn = false;
  private pulseStart = 0;
  private bump = 1;
  private readonly scene: Phaser.Scene;
  private readonly kit: Pick<GoalsKit, 'ref' | 'slice'> | null;
  private plate: Phaser.GameObjects.Image | null = null;

  constructor(scene: Phaser.Scene, depth: number, kit: Pick<GoalsKit, 'ref' | 'slice'> | null = null) {
    this.scene = scene;
    this.kit = kit;
    this.panel = addBakedGraphics(scene);
    this.danger = addBakedGraphics(scene).setVisible(false);
    this.cur = addKitText(scene, 0, 0, '', 'bigNumber', HV.movesFontPx);
    this.next = addKitText(scene, 0, 0, '', 'bigNumber', HV.movesFontPx).setVisible(false);
    this.label = addKitText(scene, 0, 0, upper(t('hud.moves')), 'counterCream', LABEL_PX);
    this.root = scene.add
      .container(0, 0, [this.panel, this.danger, this.cur, this.next, this.label])
      .setDepth(depth);
  }

  layout(rect: Rect): void {
    this.rect = rect;
    const w = rect.w;
    const h = rect.h;
    this.root.setPosition(rect.x + w / 2, rect.y + h / 2);
    const g = this.panel.clear();
    const kit = this.kit;
    if (kit) {
      this.plate?.destroy();
      const ref = kit.ref(KIT.movesPlate);
      this.plate = this.scene.add
        .image(0, 0, ref.key, ref.frame)
        .setOrigin(0.5, HV.movesH / 2 / ref.h)
        .setDisplaySize(w, (ref.h * w) / ref.w);
      this.root.addAt(this.plate, 0);
    } else {
      g.fillStyle(hex(PAL.navy), 1).fillRoundedRect(-w / 2, -h / 2, w, h, 24);
      g.fillStyle(hex(HV.movesCream), 1).fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 20);
      g.fillStyle(hex(HV.movesBand), 1).fillRect(-w / 2 + 4, -h / 2 + 4, w - 8, HV.movesBandH);
    }
    this.danger.clear();
    this.danger.lineStyle(6, hex(DANGER), 1).strokeRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 22);
    // the number in the middle of the cream plate under the band; the label in the band
    const band = HV.movesBandH;
    this.valueY = -h / 2 + 4 + band + (h - 8 - band) / 2 + 2;
    this.cur.setPosition(0, this.valueY);
    this.next.setPosition(0, this.valueY);
    this.label.setPosition(0, -h / 2 + 4 + band / 2 - 2);
  }

  /** New language: the `hud.moves` label. */
  relabel(): void {
    this.label.setText(upper(t('hud.moves')));
  }

  /** Shows `n` at once (level start, reduced motion, re-sync). */
  set(n: number): void {
    this.value = n;
    this.cur.setText(String(n)).setPosition(0, this.valueY).setAlpha(1);
    this.next.setVisible(false);
  }

  get shown(): number {
    return this.value;
  }

  /** JUICE #50 roll toward `n`: `k` 0 → 1 (old digit up and out, new one in from below by `px`). */
  rollTo(n: number, k: number, px: number): void {
    if (k >= 1) {
      this.set(n);
      return;
    }
    if (!this.next.visible || this.next.text !== String(n)) this.next.setText(String(n)).setVisible(true);
    this.cur.setPosition(0, this.valueY - k * px).setAlpha(1 - k);
    this.next.setPosition(0, this.valueY + (1 - k) * px).setAlpha(k);
  }

  /** JUICE #51: red digit + red edge (kept in reduced motion); `pulse` = the 1,0 ↔ 1,06 loop. */
  setDanger(on: boolean, pulse: boolean, now: number): void {
    if (on !== this.dangerOn) {
      this.dangerOn = on;
      const style = on
        ? kitTextStyle('bigNumber', HV.movesFontPx, TOKENS.kit.v3.badge.stroke, undefined, DANGER)
        : kitTextStyle('bigNumber', HV.movesFontPx);
      this.cur.setStyle(style);
      this.next.setStyle(style);
      this.danger.setVisible(on);
    }
    if (pulse && !this.pulseOn) this.pulseStart = now;
    this.pulseOn = on && pulse;
  }

  /** Reduced motion switched (JUICE §0 rule 8): the #51 loop stops (or starts again) at once, the red stays. */
  setPulse(pulse: boolean, now: number): void {
    const on = this.dangerOn && pulse;
    if (on && !this.pulseOn) this.pulseStart = now;
    this.pulseOn = on;
  }

  /** Extra scale from a bump (#51 strong pulse, #53 1,2). */
  setBump(scale: number): void {
    this.bump = scale;
  }

  /** Per frame: loop pulse × bump. `period` = `duration.lastMovesPulse`, `peak` = 1,06. */
  update(now: number, period: number, peak: number): void {
    let s = this.bump;
    if (this.pulseOn)
      s *= 1 + (peak - 1) * 0.5 * (1 - Math.cos((2 * Math.PI * (now - this.pulseStart)) / period));
    this.root.setScale(s);
  }

  /** Centre of the number (chips and coins fly to / from here). */
  point(): { x: number; y: number } {
    return { x: this.rect.x + this.rect.w / 2, y: this.rect.y + this.rect.h / 2 + this.valueY };
  }

  setVisible(on: boolean): void {
    this.root.setVisible(on);
  }

  destroy(): void {
    this.root.destroy(true);
  }
}
