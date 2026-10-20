/**
 * Area progress bar v3 (ART_REFERENCE §3.8 `kit.v3.progress`; UX §3 "İlerleme çubuğu", Faz 2R: won slice levels / 10):
 * the meta bar — orange contour, dark blue track (`ui_progress_track`, 3-sliced), green fill (`ui_progress_fill`,
 * 3-sliced to the value, round right end, white gloss) inside the contour pad, one tick per slice boundary, "n/max"
 * (`common.count`) in the cream counter look (44 px, `textStroke`) in the middle and the `endIconPx` star half outside
 * the right end. `compact`: the 48 px gold variant. The fill moves at once (JUICE #101 is Faz 5).
 */
import type Phaser from 'phaser';
import { t } from '../../services/i18n.ts';
import { TOKENS } from '../../theme/tokens.ts';
import { KIT } from '../../theme/textures.ts';
import { progressV3FillHeight, progressV3Height, progressV3Pad } from '../../theme/draw/kitV3.ts';
import type { ProgressV3Variant } from '../../theme/draw/kitV3.ts';
import { addBakedGraphics } from '../BakedGraphics.ts';
import { hex } from '../text.ts';
import { kitRef, kitSlice } from './atlas.ts';
import type { IconBinder } from './icons.ts';
import { addKitText } from './text.ts';

const PG = TOKENS.kit.v3.progress;

export class ProgressBar {
  readonly root: Phaser.GameObjects.Container;
  readonly star: Phaser.GameObjects.Image;
  private readonly fill: Phaser.GameObjects.NineSlice;
  private readonly label: Phaser.GameObjects.Text;
  private readonly w: number;
  private readonly pad: number;
  private readonly minFill: number;

  constructor(
    scene: Phaser.Scene,
    icons: IconBinder,
    w: number,
    value: number,
    max: number,
    variant: ProgressV3Variant = 'meta',
  ) {
    this.w = w;
    const h = progressV3Height(variant, TOKENS);
    const pad = progressV3Pad(variant, TOKENS);
    this.pad = pad;
    const trackName = variant === 'meta' ? KIT.progressTrack : KIT.progressTrackCompact;
    const fillName = variant === 'meta' ? KIT.progressFill : KIT.progressFillCompact;
    const tr = kitRef(scene.game, trackName);
    const ts = kitSlice(trackName);
    const track = scene.add
      .nineslice(0, 0, tr.key, tr.frame, w, 0, ts?.left ?? 28, ts?.right ?? 28, 0, 0)
      .setOrigin(0, 0);
    const fr = kitRef(scene.game, fillName);
    const fs = kitSlice(fillName);
    this.minFill = (fs?.left ?? 20) + (fs?.right ?? 20);
    this.fill = scene.add
      .nineslice(pad, pad, fr.key, fr.frame, this.minFill, 0, fs?.left ?? 20, fs?.right ?? 20, 0, 0)
      .setOrigin(0, 0);
    const ticks = addBakedGraphics(scene);
    const inner = w - 2 * pad;
    const fh = progressV3FillHeight(variant, TOKENS);
    ticks.fillStyle(hex(TOKENS.kit.v3.palette.navy), 0.35);
    for (let i = 1; i < max; i++) {
      const x = pad + (inner * i) / max;
      ticks.fillRect(Math.round(x - 1.5), pad, 3, fh);
    }
    const fontPx = variant === 'meta' ? PG.fontPx : TOKENS.font.size.small;
    this.label = addKitText(scene, w / 2, h / 2, '', 'counterCream', fontPx, PG.textStroke, PG.text);
    const starPx = variant === 'meta' ? PG.endIconPx : 80;
    this.star = icons.add(scene, w, h / 2, 'icon_star', starPx);
    this.root = scene.add.container(0, 0, [track, this.fill, ticks, this.label, this.star]);
    this.setValue(value, max);
  }

  setValue(value: number, max: number): this {
    const inner = this.w - 2 * this.pad;
    const k = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
    this.fill.setVisible(k > 0);
    if (k > 0) this.fill.setSize(Math.max(this.minFill, Math.round(inner * k)), this.fill.height);
    this.label.setText(t('common.count', { n: value, max }));
    return this;
  }

  setPosition(x: number, y: number): this {
    this.root.setPosition(x, y);
    return this;
  }

  destroy(): void {
    this.root.destroy(true);
  }
}
