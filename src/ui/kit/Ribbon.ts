/**
 * Title ribbon (ART §14.3 `kit.ribbon`; UX §3 area name, §6.1 "KAZANDIN!", the `home.moreSoon` band): the baked
 * `ui_ribbon_<colour>` 3-sliced to the body width (tails stay), the text in the "Parlak başlık" look at
 * `textRatio · heightPx` (58 px) with the ribbon's stroke colour. The root sits on the body's top centre; `scale`
 * shrinks the whole ribbon (the 80 px band = 104 × 0.77).
 */
import type Phaser from 'phaser';
import { TOKENS } from '../../theme/tokens.ts';
import { ribbonFrameName } from '../../theme/textures.ts';
import { ribbonBodyRect, ribbonFrameSize } from '../../theme/draw/kit.ts';
import type { KitRibbonColor } from '../../theme/draw/kit.ts';
import { kitRef, kitSlice } from './atlas.ts';
import { addKitText, fitWidth } from './text.ts';

const RB = TOKENS.kit.ribbon;
/** ART §14.3 body width limits (text + 2 × 64, between 480 and 820). */
export const RIBBON_MIN_W = 480;
export const RIBBON_MAX_W = 820;
const RIBBON_TEXT_PAD = 64;

export interface RibbonSpec {
  readonly color: KitRibbonColor;
  readonly text: string;
  /** Body width; default = text + 2 × 64 clamped to [480, 820]. */
  readonly bodyW?: number;
  readonly scale?: number;
}

export class Ribbon {
  readonly root: Phaser.GameObjects.Container;
  readonly label: Phaser.GameObjects.Text;
  readonly bodyW: number;

  constructor(scene: Phaser.Scene, spec: RibbonSpec) {
    const name = ribbonFrameName(spec.color);
    const ref = kitRef(scene.game, name);
    const sl = kitSlice(name);
    const px = Math.round(RB.textRatio * RB.heightPx);
    const label = addKitText(scene, 0, 0, spec.text, 'brightTitle', px, RB[spec.color].stroke);
    const natural = label.width + 2 * RIBBON_TEXT_PAD;
    const bodyW = spec.bodyW ?? Math.min(RIBBON_MAX_W, Math.max(RIBBON_MIN_W, natural));
    this.bodyW = bodyW;
    const frame = ribbonFrameSize({ bodyW }, TOKENS);
    const body = ribbonBodyRect({ bodyW }, TOKENS);
    const img = scene.add
      .nineslice(0, 0, ref.key, ref.frame, frame.w, 0, sl?.left ?? 100, sl?.right ?? 100, 0, 0)
      .setOrigin(0, 0)
      .setPosition(-body.x - bodyW / 2, 0);
    label.setPosition(0, body.h / 2 + 1);
    fitWidth(label, bodyW - 2 * 36);
    this.label = label;
    this.root = scene.add.container(0, 0, [img, label]);
    if (spec.scale !== undefined) this.root.setScale(spec.scale);
  }

  setPosition(x: number, y: number): this {
    this.root.setPosition(x, y);
    return this;
  }

  setDepth(d: number): this {
    this.root.setDepth(d);
    return this;
  }

  destroy(): void {
    this.root.destroy(true);
  }
}
