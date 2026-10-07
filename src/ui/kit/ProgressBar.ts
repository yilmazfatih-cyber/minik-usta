/**
 * Area progress bar (ART §14.6 `kit.progress`; UX §3 "İlerleme çubuğu", Faz 2R: won slice levels / 10, 10 slices):
 * the dark track with its light well (`ui_progress_track`, 3-sliced), the gold fill (`ui_progress_fill`, 3-sliced to
 * the value) inside the 6 px pad, one tick per slice boundary (3 px `ui.ink` α `tickAlpha`), the `endIconPx` star
 * half outside the right end and "n/max" (`common.count`) in the "Sayaç" look at 38 px. The fill moves at once
 * (JUICE #101 is Faz 5, TECH §2R.12 cut 2).
 */
import type Phaser from 'phaser';
import { t } from '../../services/i18n.ts';
import { TOKENS } from '../../theme/tokens.ts';
import { KIT } from '../../theme/textures.ts';
import { PROGRESS_PAD, progressFillHeight } from '../../theme/draw/kit.ts';
import { addBakedGraphics } from '../BakedGraphics.ts';
import { hex } from '../text.ts';
import { kitRef, kitSlice } from './atlas.ts';
import type { IconBinder } from './icons.ts';
import { addKitText } from './text.ts';

const PG = TOKENS.kit.progress;
/** UX §3 / ART §14.6: the count is 38 px (`font.size.small`, the bright-title minimum). */
const COUNT_PX = TOKENS.font.size.small;

export class ProgressBar {
  readonly root: Phaser.GameObjects.Container;
  readonly star: Phaser.GameObjects.Image;
  private readonly fill: Phaser.GameObjects.NineSlice;
  private readonly label: Phaser.GameObjects.Text;
  private readonly w: number;
  private readonly minFill: number;

  constructor(scene: Phaser.Scene, icons: IconBinder, w: number, value: number, max: number) {
    this.w = w;
    const h = PG.heightPx;
    const tr = kitRef(scene.game, KIT.progressTrack);
    const ts = kitSlice(KIT.progressTrack);
    const track = scene.add
      .nineslice(0, 0, tr.key, tr.frame, w, 0, ts?.left ?? 28, ts?.right ?? 28, 0, 0)
      .setOrigin(0, 0);
    const fr = kitRef(scene.game, KIT.progressFill);
    const fs = kitSlice(KIT.progressFill);
    this.minFill = (fs?.left ?? 20) + (fs?.right ?? 20);
    this.fill = scene.add
      .nineslice(
        PROGRESS_PAD,
        PROGRESS_PAD,
        fr.key,
        fr.frame,
        this.minFill,
        0,
        fs?.left ?? 20,
        fs?.right ?? 20,
        0,
        0,
      )
      .setOrigin(0, 0);
    const ticks = addBakedGraphics(scene);
    const inner = w - 2 * PROGRESS_PAD;
    const fh = progressFillHeight(TOKENS);
    ticks.fillStyle(hex(TOKENS.color.ui.ink), PG.tickAlpha);
    for (let i = 1; i < max; i++) {
      const x = PROGRESS_PAD + (inner * i) / max;
      ticks.fillRect(Math.round(x - 1.5), PROGRESS_PAD, 3, fh);
    }
    this.label = addKitText(scene, w / 2, h / 2, '', 'counter', COUNT_PX);
    this.star = icons.add(scene, w, h / 2, 'icon_star', PG.endIconPx);
    this.root = scene.add.container(0, 0, [track, this.fill, ticks, this.label, this.star]);
    this.setValue(value, max);
  }

  setValue(value: number, max: number): this {
    const inner = this.w - 2 * PROGRESS_PAD;
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
