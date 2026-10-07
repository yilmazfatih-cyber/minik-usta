/**
 * Win screen v2 (UX_FLOWS §6.1 "Kazanma v2 sunumu", §6 rules; ART §7.3, §14, §15; JUICE #95, #97; STORY §7.6
 * `win.*`; TECH §2R.8). A full-screen celebration layer instead of text over the board: the `bg_win_plaza` art with a
 * turning sunburst, the gold "KAZANDIN!" ribbon, the wood-framed card with the tree house as it stands after this win
 * (built part in colour, the rest as ozalit ghost) and the big star of the win, Tuna's cheer pose overlapping the
 * card's left edge, the Bonus İnşaat row and the leftover Golden Trowel row (panel wells), the reward capsules
 * (★ +1, coins) and the single primary action "Devam" (green, bottom-anchored).
 *
 * Rows follow the rewards (ui/rewards.ts or meta/home.ts `sliceWinRewards`): Bonus row when moves turned into coins,
 * trowel row when n ≥ 1, star capsule when a star was earned. The META §10 loop replay (no star, base coins only)
 * therefore shows only the coin capsule in the middle (UX §6.1 "Döngü").
 *
 * Timing: JUICE #55 has played on the board when this opens (LevelScene → LevelWindows.openWin). The layer fades in
 * (200 ms, #95 stage 1), the card pops through the window's #70 (`target.panel`), the sunburst turns
 * (`kit.sunburst.turnsPerSecond`), Tuna comes up 40 px (#95); the ribbon, rows and capsules fade in 150 ms (cut 2 of
 * TECH §2R.12: #96, #105, #106 are Faz 5) and "Devam" appears 0.9 → 1.0. Reduced motion: no turning, 150 ms fades.
 * Layout: ui/kit/layout.ts `winLayout` (EXPAND: everything but the button moves down by (H − 1920) × 0.5).
 */
import Phaser from 'phaser';
import { t, upper } from '../services/i18n.ts';
import type { Layout } from '../theme/layout.ts';
import { TOKENS } from '../theme/tokens.ts';
import { FX } from '../theme/draw/fx.ts';
import { KIT } from '../theme/textures.ts';
import { addBakedGraphics } from './BakedGraphics.ts';
import type { OptionButton } from './OptionButton.ts';
import type { WinRewards } from './rewards.ts';
import { hex } from './text.ts';
import { ArtImage } from './kit/ArtImage.ts';
import { kitRef, kitSlice } from './kit/atlas.ts';
import { Capsule } from './kit/Capsule.ts';
import { buttonFeel } from './kit/feel.ts';
import { winContext } from './kit/gameContext.ts';
import type { WinContext } from './kit/gameContext.ts';
import { IconBinder } from './kit/icons.ts';
import { addInlineText } from './kit/InlineText.ts';
import { KitButton } from './kit/KitButton.ts';
import { BASE_H, winLayout, winRows } from './kit/layout.ts';
import type { WinLayout } from './kit/layout.ts';
import { Ribbon } from './kit/Ribbon.ts';
import { formatCount } from './kit/text.ts';

/** Entry timeline (ms after the open) of the v2 layer; the card is #70's. */
export const WIN_ENTRY = Object.freeze({
  layer: 0,
  ribbon: 120,
  tuna: 200,
  rows: 360,
  rowStep: 70,
  capsules: 520,
  button: 640,
});

/** UX §6.1: Tuna comes up 40 px (#95); "Devam" 0.9 → 1.0. */
const TUNA_RISE_PX = 40;
const BUTTON_FROM = 0.9;
/** Label of the 176 px primary button: the same 80 px "Parlak başlık" as "Bölüm N" (UX §3). */
const PRIMARY_LABEL_PX = 80;
/** Row text size (64 px wells, UX §6.1). */
const ROW_TEXT_PX = 40;
/** Big star of the card (ART §15 "ortadaki büyük yıldız"; #96 burst is Faz 5). */
const CARD_STAR_PX = 168;
/** Sunburst display size over the plaza (its 512 px frame is soft and scales up). */
const SUNBURST_PX = 1500;
/**
 * The plaza is already light: the `kit.sunburst.rayColor` rays are added (ADD) at `rayAlpha` + 0.1 so they read on it
 * (ART §15 "Işın"; at plain α 0.35 they vanish into the art's own glow).
 */
const SUNBURST_ALPHA = Math.min(1, TOKENS.kit.sunburst.rayAlpha + 0.1);

export interface WinScreenOptions {
  /** Asset service, reduced motion and the tree house reveal; default from the running game (ui/kit/gameContext). */
  readonly context?: Partial<WinContext>;
}

export class WinScreen {
  /** The card: JUICE #70 pops it, #71 closes it (`target.panel`). */
  readonly panel: Phaser.GameObjects.Container;
  readonly button: KitButton;
  readonly geo: WinLayout;
  private readonly scene: Phaser.Scene;
  private readonly blocker: Phaser.GameObjects.Zone;
  private readonly layer: Phaser.GameObjects.Container;
  private readonly front: Phaser.GameObjects.Container;
  private readonly sunburst: Phaser.GameObjects.Image;
  private readonly tuna: Phaser.GameObjects.Image;
  private readonly icons: IconBinder;
  private readonly reduced: boolean;
  private readonly onUpdate: (time: number, delta: number) => void;
  private iconsArt = false;

  /**
   * `_onPress` is the Phase 2 hook of LevelWindows (#69 on an OptionButton); the v2 button plays #97 itself and its
   * sound through ui/kit/feel, so the hook is not called.
   */
  constructor(
    scene: Phaser.Scene,
    layout: Layout,
    rewards: WinRewards,
    depth: number,
    onContinue: () => void,
    _onPress?: (b: OptionButton, v: 'press' | 'release') => void,
    opts: WinScreenOptions = {},
  ) {
    this.scene = scene;
    const ctx = { ...winContext(scene.game), ...opts.context };
    this.reduced = ctx.reduced;
    const assets = ctx.assets;
    this.icons = new IconBinder((id) => assets.icon(id));
    this.iconsArt = assets.hasArt('icons_v2');
    const rows = winRows(rewards);
    const g = winLayout(TOKENS, layout.H, rows);
    this.geo = g;
    const reducedFn = (): boolean => this.reduced;

    this.blocker = scene.add.zone(0, 0, g.W, g.H).setOrigin(0, 0).setDepth(depth).setInteractive();

    // --- layer: plaza art (its edge rows fill the EXPAND surplus), sunburst
    const layerParts: Phaser.GameObjects.GameObject[] = [];
    const bg = ArtImage.create(
      scene,
      assets,
      'bg_win_plaza',
      { x: 0, y: g.artY, w: g.W, h: BASE_H },
      {
        reduced: reducedFn,
        extend: { top: g.skyBand.h, bottom: g.groundBand.h },
      },
    );
    layerParts.push(...bg.edges, bg.image);
    const sb = kitRef(scene.game, FX.sunburst);
    const cardCx = g.card.x + g.card.w / 2;
    const cardCy = g.card.y + g.card.h / 2;
    this.sunburst = scene.add
      .image(cardCx, cardCy, sb.key, sb.frame)
      .setDisplaySize(SUNBURST_PX, SUNBURST_PX)
      .setTint(hex(TOKENS.kit.sunburst.rayColor))
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(SUNBURST_ALPHA);
    layerParts.push(this.sunburst);
    this.layer = scene.add.container(0, 0, layerParts).setDepth(depth);

    // --- card (#70 target): wood panel + tree house after this win + the star
    this.panel = this.card(scene, assets, g, rewards.stars > 0, ctx.structureRatio, reducedFn);
    this.panel.setDepth(depth + 1);

    // --- front: Tuna, ribbon, rows, capsules
    const front: Phaser.GameObjects.GameObject[] = [];
    const c = g.character;
    const tuna = ArtImage.create(
      scene,
      assets,
      'chr_tuna_cheer',
      { x: c.x, y: c.y, w: c.w, h: c.h },
      {
        reduced: reducedFn,
      },
    );
    const ribbon = new Ribbon(scene, { color: 'gold', text: upper(t('win.title')), bodyW: g.ribbon.w });
    ribbon.setPosition(g.ribbon.x + g.ribbon.w / 2, g.ribbon.y);
    front.push(ribbon.root);
    const rowObjs: Phaser.GameObjects.Container[] = [];
    if (g.bonus) {
      rowObjs.push(
        this.row(
          scene,
          g.bonus,
          t('win.bonus', { n: rewards.bonusMoves }),
          t('common.coins', { n: rewards.bonusCoins }),
        ),
      );
    }
    if (g.trowel) {
      rowObjs.push(
        this.row(
          scene,
          g.trowel,
          t('win.trowel', { n: rewards.trowels }),
          t('common.coins', { n: rewards.trowelCoins }),
        ),
      );
    }
    front.push(...rowObjs);
    const caps: Phaser.GameObjects.Container[] = [];
    if (g.starCapsule) {
      const s = new Capsule(scene, this.icons, {
        w: g.starCapsule.w - TOKENS.kit.capsule.iconOverhangPx,
        icon: 'icon_star',
        value: t('common.plus', { n: rewards.stars }),
      });
      s.root.setPosition(g.starCapsule.x + TOKENS.kit.capsule.iconOverhangPx, g.starCapsule.y);
      s.root.disableInteractive();
      caps.push(s.root);
    }
    const coin = new Capsule(scene, this.icons, {
      w: g.coinCapsule.w - TOKENS.kit.capsule.iconOverhangPx,
      icon: 'icon_coin',
      value: `+${formatCount(rewards.totalCoins)}`,
    });
    coin.root.setPosition(g.coinCapsule.x + TOKENS.kit.capsule.iconOverhangPx, g.coinCapsule.y);
    coin.root.disableInteractive();
    caps.push(coin.root);
    front.push(...caps);
    this.front = scene.add.container(0, 0, front).setDepth(depth + 2);
    this.tuna = tuna.image.setDepth(depth + 2);

    // --- "Devam"
    const b = g.button;
    this.button = new KitButton(scene, {
      color: 'green',
      w: b.w,
      h: b.h,
      label: upper(t('common.continue')),
      labelPx: PRIMARY_LABEL_PX,
    });
    this.button
      .setPosition(b.x + b.w / 2, b.y + b.h / 2)
      .setDepth(depth + 3)
      .setReduced(this.reduced);
    this.button.onPress(buttonFeel).onTap(onContinue);

    this.enter(ribbon.root, tuna.image, rowObjs, caps);
    this.onUpdate = (_time, delta) => this.tick(delta, assets.hasArt('icons_v2'));
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate);
    // the art of this layer (P3) is the last background group (TECH §2R.6)
    void assets.loadGroup('P3');
  }

  /** UX §6.1 card: ART §14.2 framed panel, the tree house fitted inside, the earned star at its lower right. */
  private card(
    scene: Phaser.Scene,
    assets: WinContext['assets'],
    g: WinLayout,
    star: boolean,
    ratio: number,
    reduced: () => boolean,
  ): Phaser.GameObjects.Container {
    const r = g.card;
    const pr = kitRef(scene.game, KIT.panel);
    const ps = kitSlice(KIT.panel);
    const shadowY = TOKENS.kit.panel.shadowYPx;
    const panel = scene.add
      .nineslice(0, 0, pr.key, pr.frame, r.w, r.h + shadowY, ps?.left, ps?.right, ps?.top, ps?.bottom)
      .setOrigin(0.5, r.h / 2 / (r.h + shadowY));
    const parts: Phaser.GameObjects.GameObject[] = [panel];
    // inner well behind the structure (a calm cream with a soft inset)
    const ir = kitRef(scene.game, KIT.inset);
    const is = kitSlice(KIT.inset);
    const pad = TOKENS.kit.panel.outlinePx + TOKENS.kit.panel.framePx + TOKENS.kit.panel.innerLinePx + 18;
    parts.push(
      scene.add
        .nineslice(
          0,
          0,
          ir.key,
          ir.frame,
          r.w - 2 * pad,
          r.h - 2 * pad,
          is?.left,
          is?.right,
          is?.top,
          is?.bottom,
        )
        .setOrigin(0.5, 0.5),
    );
    // tree house (760 × 820) fitted to the well
    const sw = 760;
    const sh = 820;
    const k = Math.min((r.w - 2 * pad - 24) / sw, (r.h - 2 * pad - 24) / sh);
    const box = { x: (-sw * k) / 2, y: (-sh * k) / 2 + 6, w: sw * k, h: sh * k };
    const ghost = ArtImage.create(scene, assets, 'town_ch1_treehouse_ghost', box, {
      reduced,
      crop: () =>
        ratio >= 1 ? { x: 0, y: 0, w: 0, h: 0 } : { x: 0, y: 0, w: box.w, h: box.h * (1 - ratio) },
    });
    parts.push(ghost.image);
    const colour = ArtImage.create(scene, assets, 'town_ch1_treehouse', box, {
      reduced,
      crop: () => ({ x: 0, y: box.h * (1 - ratio), w: box.w, h: box.h * ratio }),
    });
    parts.push(colour.image);
    if (star) {
      const s = this.icons.add(scene, r.w / 2 - 70, r.h / 2 - 70, 'icon_star', CARD_STAR_PX);
      parts.push(s);
    }
    return scene.add.container(r.x + r.w / 2, r.y + r.h / 2, parts);
  }

  /** UX §6.1 row: panel well (`ui_panel_inset`) with the label left and the coins (inline coin icon) right. */
  private row(
    scene: Phaser.Scene,
    r: { x: number; y: number; w: number; h: number },
    left: string,
    right: string,
  ): Phaser.GameObjects.Container {
    const ir = kitRef(scene.game, KIT.inset);
    const is = kitSlice(KIT.inset);
    const well = scene.add
      .nineslice(0, 0, ir.key, ir.frame, r.w, r.h, is?.left, is?.right, is?.top, is?.bottom)
      .setOrigin(0, 0);
    const edge = addBakedGraphics(scene);
    edge.lineStyle(4, hex(TOKENS.kit.panel.outline), 1).strokeRoundedRect(0, 0, r.w, r.h, 24);
    const l = addInlineText(scene, this.icons, left, 'panel', ROW_TEXT_PX, 'left');
    l.root.setPosition(28, r.h / 2);
    const rt = addInlineText(scene, this.icons, right, 'panel', ROW_TEXT_PX, 'right');
    rt.root.setPosition(r.w - 28, r.h / 2);
    return scene.add.container(r.x, r.y, [well, edge, l.root, rt.root]);
  }

  /** The entry (see the header): layer, ribbon, Tuna, rows, capsules, button. */
  private enter(
    ribbon: Phaser.GameObjects.Container,
    tuna: Phaser.GameObjects.Image,
    rows: readonly Phaser.GameObjects.Container[],
    caps: readonly Phaser.GameObjects.Container[],
  ): void {
    const tw = this.scene.tweens;
    const fade = TOKENS.duration.reducedFade;
    const E = WIN_ENTRY;
    this.layer.setAlpha(0);
    tw.add({ targets: this.layer, alpha: 1, duration: 200, delay: E.layer });
    const fadeIn = (o: { setAlpha(a: number): unknown }, delay: number): void => {
      o.setAlpha(0);
      tw.add({ targets: o, alpha: 1, duration: fade, delay });
    };
    fadeIn(ribbon, E.ribbon);
    if (this.reduced) fadeIn(tuna, E.tuna);
    else {
      const y = tuna.y;
      tuna.setAlpha(0).setY(y + TUNA_RISE_PX);
      tw.add({ targets: tuna, alpha: 1, y, duration: 350, delay: E.tuna, ease: 'Back.easeOut' });
    }
    rows.forEach((r, i) => fadeIn(r, E.rows + i * E.rowStep));
    caps.forEach((c) => fadeIn(c, E.capsules));
    const btn = this.button.root;
    btn.setAlpha(0);
    if (!this.reduced) btn.setScale(BUTTON_FROM);
    tw.add({ targets: btn, alpha: 1, scale: 1, duration: 220, delay: E.button, ease: 'Back.easeOut' });
  }

  private tick(delta: number, iconsArt: boolean): void {
    if (iconsArt !== this.iconsArt) {
      this.iconsArt = iconsArt;
      this.icons.refresh();
    }
    if (this.reduced) return;
    this.sunburst.rotation += (delta / 1000) * TOKENS.kit.sunburst.turnsPerSecond * Math.PI * 2;
  }

  /** WindowTarget of JUICE #70 / #71 (no dim: the layer is opaque). */
  get target(): { dim: null; panel: Phaser.GameObjects.Container; options: readonly KitButton[] } {
    return { dim: null, panel: this.panel, options: [this.button] };
  }

  destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdate);
    this.icons.clear();
    this.layer.destroy(true);
    this.panel.destroy(true);
    this.front.destroy(true);
    this.tuna.destroy();
    this.button.destroy();
    this.blocker.destroy();
  }
}
