/**
 * Home screen v2 (UX_FLOWS §3 "Ana ekran — ana sayfa v2", R2-09; META §10 slice scope; ART §7.2, §14; TECH §2R.8).
 * One screen, one primary action: the top bar (lives, coins + "+", stars, settings), the area ribbon `town.ch1.title`
 * and its progress bar, the Renkli Tepe art with the tree house opening floor by floor (ozalit ghost + full colour,
 * `setCrop` from the bottom), Tuna and Kepçe, the level chest ring, the big green "Bölüm N" button and the bottom
 * navigation (only "Ana Sayfa" open; the other tabs say "Yakında").
 *
 * Content comes from the pure meta/home.ts model; geometry from ui/kit/layout.ts; looks from the kit atlas; art from
 * the asset service (SVG raster when loaded, procedural fallback first, 200 ms cross-fade). Text from i18n — keys
 * that are not in tr.json yet (STORY §7.7: `nav.*`, `town.ch1.title`, `hud.livesFull`, `settings.title`,
 * `common.comingSoon`) go through `tDynamic`, which shows the key until WP-L adds the text.
 *
 * Cut 2 and 3 of TECH §2R.12: the entry / exit transitions are a 150 ms fade (JUICE #99–#102 are Faz 5), no "Bölüm N"
 * shine sweep (#98), no cloud parallax and no chest preview window (Faz 4; the ring stays static). A voided attempt
 * (K-43 item 4, UX §1 (c)) still opens the `resume.void` window first; the "Bölüm 2" pulse after level 1 (UX §2.2
 * step 11) stays, with a steady gold edge under reduced motion.
 */
import Phaser from 'phaser';
import { scaleMode } from '../config/display.ts';
import { HOME_TABS, formatCountdown, homeModel } from '../meta/home.ts';
import type { Difficulty, HomeModel, HomeTab } from '../meta/home.ts';
import { ICON_ATLAS_KEY } from '../services/assetCatalog.ts';
import type { AssetService } from '../services/assets.ts';
import { t, tDynamic, upper } from '../services/i18n.ts';
import type { DeepReadonly, VoidNotice } from '../services/save.ts';
import { createLayout, designHeight } from '../theme/layout.ts';
import type { Layout, Rect } from '../theme/layout.ts';
import { TOKENS } from '../theme/tokens.ts';
import { addBakedGraphics } from '../ui/BakedGraphics.ts';
import { drawHeart } from '../ui/icons.ts';
import { InlineLabel } from '../ui/InlineLabel.ts';
import type { OptionButton } from '../ui/OptionButton.ts';
import { Popup } from '../ui/Popup.ts';
import { hex } from '../ui/text.ts';
import { UI } from '../ui/uiConstants.ts';
import { ArtImage } from '../ui/kit/ArtImage.ts';
import { ensureKitAtlas } from '../ui/kit/atlas.ts';
import { Capsule } from '../ui/kit/Capsule.ts';
import { buttonFeel, lockedFeel } from '../ui/kit/feel.ts';
import { HintBubble } from '../ui/kit/HintBubble.ts';
import { IconBinder } from '../ui/kit/icons.ts';
import { KitButton } from '../ui/kit/KitButton.ts';
import { BASE_H, homeLayout } from '../ui/kit/layout.ts';
import type { HomeLayout } from '../ui/kit/layout.ts';
import { NavBar } from '../ui/kit/NavBar.ts';
import { ProgressBar } from '../ui/kit/ProgressBar.ts';
import { Ribbon } from '../ui/kit/Ribbon.ts';
import { RingIcon } from '../ui/kit/RingIcon.ts';
import { drawHedge } from '../ui/kit/scenery.ts';
import { addKitText, formatCount } from '../ui/kit/text.ts';
import {
  appSave,
  appTrack,
  applySettings,
  changeSetting,
  onSettingChanged,
  reducedMotion,
} from './appServices.ts';
import { gameAssets } from './AssetLoaderScene.ts';
import { HOME_SCENE_KEY, LEVEL_SCENE_KEY } from './level/LevelScene.ts';
import type { HomeSceneData, LevelSceneData } from './level/LevelScene.ts';
import { DEPTH } from './level/depth.ts';
import { availableLevels, loadLevelById } from './level/levels.ts';
import { gameAudio } from './level/sceneServices.ts';
import { shaderWarmup } from './shaderWarmup.ts';

const C = TOKENS.color.ui;
const HL = TOKENS.layout.home;
const CH1 = TOKENS.color.chapter.ch1;

/** Depth bands of the home screen (bottom → top). */
const D = Object.freeze({
  backdrop: 0,
  stage: 10,
  hud: DEPTH.hud,
  hint: DEPTH.tutorial,
  windows: DEPTH.windows,
});

/** UX §3 bottom tabs → icon ids and STORY §7.7 label keys. */
const TAB_ICON: Readonly<Record<HomeTab, string>> = {
  shop: 'icon_nav_shop',
  league: 'icon_nav_league',
  home: 'icon_nav_home',
  team: 'icon_nav_team',
  album: 'icon_nav_album',
};

/** STORY §7.7 / §7.5 keys this screen needs that tr.json may not have yet (shown as the key until WP-L adds them). */
const KEY = Object.freeze({
  area: 'town.ch1.title',
  livesFull: 'hud.livesFull',
  settings: 'settings.title',
  comingSoon: 'common.comingSoon',
  tab: (id: HomeTab) => `nav.${id}`,
});

/** Settings window rows (UX §3 "Ayarlar": the Pause window's sound / music / haptics). */
const TOGGLES = [
  ['sound', 'settings.sound'],
  ['music', 'settings.music'],
  ['haptics', 'settings.haptics'],
] as const;

/** Kepçe's share of the character corner (UX §3: 70 %). */
const KEPCE_SCALE = 0.7;
/** Character corner dressing: hedge height, how far it sits below / around the bust, Kepçe's overlap with it. */
const HEDGE_H = 80;
const HEDGE_DROP_PX = 28;
const HEDGE_INSET_PX = 20;
const KEPCE_OVERLAP_PX = 30;
/** Lives countdown refresh (UX §3 "29:12"). */
const LIVES_TICK_MS = 1000;

interface HomeView {
  readonly objects: Phaser.GameObjects.GameObject[];
  readonly lives: Capsule;
  readonly button: KitButton;
  readonly structureRoot: Phaser.GameObjects.Container;
  readonly colour: ArtImage;
  readonly ghost: ArtImage;
  readonly nav: NavBar;
  readonly edge: Phaser.GameObjects.Graphics | null;
  readonly tagRoot: Phaser.GameObjects.Container | null;
}

export class HomeScene extends Phaser.Scene {
  private data0: HomeSceneData = {};
  private model!: HomeModel;
  private nextDifficulty: Difficulty | null = null;
  private layoutNow!: Layout;
  private geo!: HomeLayout;
  private assets!: AssetService;
  private icons!: IconBinder;
  private hint!: HintBubble;
  private view: HomeView | null = null;
  private notice: Popup | null = null;
  private settings: Popup | null = null;
  private reduced = false;
  private starting = false;
  private iconsArt = false;
  private livesAt = 0;

  constructor() {
    super(HOME_SCENE_KEY);
  }

  init(data: HomeSceneData): void {
    this.data0 = data ?? {};
    this.starting = false;
    this.nextDifficulty = null;
  }

  create(): void {
    applySettings();
    const save = appSave();
    this.reduced = reducedMotion();
    this.cameras.main.setBackgroundColor(CH1.skyTop);
    // the kit atlas bakes behind the entry fade (TECH §2R.7, ≤ 200 ms at 4× CPU)
    ensureKitAtlas(this.game);
    this.assets = gameAssets(this.game);
    this.icons = new IconBinder((id) => this.assets.icon(id));
    this.iconsArt = this.assets.hasArt(ICON_ATLAS_KEY);
    this.hint = new HintBubble(this, D.hint);
    this.model = this.computeModel();
    this.layoutNow = this.computeLayout();
    this.build();
    // home art (P2) after the icons (P1); the win art (P3) after it (TECH §2R.6). Idempotent.
    void this.assets.loadGroup('P1').then(() => this.icons.refresh());
    void this.assets.startBackground();
    this.loadDifficulty(this.model.nextLevel);
    // JUICE #99 is Faz 5 (cut 2): a 150 ms fade
    this.cameras.main.fadeIn(TOKENS.duration.reducedFade);
    const onResize = (): void => {
      this.layoutNow = this.computeLayout();
      this.build();
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, onResize);
    const offSettings = onSettingChanged((key) => {
      if (key === 'lang') this.scene.restart(this.data0);
      else if (key === 'reduceMotion') this.setReduced(reducedMotion());
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offSettings();
      this.scale.off(Phaser.Scale.Events.RESIZE, onResize);
      this.hint.hide();
      this.clearView();
      this.notice?.destroy();
      this.settings?.destroy();
      this.notice = null;
      this.settings = null;
      this.icons.clear();
      // the home art stays resident (≈ 4.5 MB of the 64 MB budget): releasing it would show the fallback and a
      // cross-fade on every return from a level (TECH §2R.8 note)
    });
    const notice = save.data.voidNotice;
    if (notice) this.openNotice(notice);
  }

  update(time: number): void {
    // the idle home screen fills the sound bank (TECH §10.6) and warms the shaders
    gameAudio().pump();
    shaderWarmup(this.game).step();
    const art = this.assets.hasArt(ICON_ATLAS_KEY);
    if (art !== this.iconsArt) {
      this.iconsArt = art;
      this.icons.refresh();
    }
    const v = this.view;
    if (!v) return;
    if (this.model.lives.nextInMs !== null && time - this.livesAt >= LIVES_TICK_MS) {
      this.livesAt = time;
      const before = this.model.lives;
      this.model = this.computeModel();
      const l = this.model.lives;
      if (l.count !== before.count || l.nextInMs !== null) v.lives.setValue(...livesText(this.model));
    }
    if (!this.model.pulse || this.reduced) return;
    const period = TOKENS.duration.lastMovesPulse;
    const k = 0.5 - 0.5 * Math.cos((2 * Math.PI * (time % period)) / period);
    v.button.root.setScale(1 + (UI.homePulsePeak - 1) * k);
  }

  private computeModel(): HomeModel {
    return homeModel(
      {
        save: appSave().data,
        now: Date.now(),
        last: this.data0.last ?? null,
        available: availableLevels(),
        nextDifficulty: this.nextDifficulty,
      },
      HL.ch1CropStops,
    );
  }

  private computeLayout(): Layout {
    const parent = this.scale.parentSize;
    const vp =
      parent.width > 0 && parent.height > 0
        ? { width: parent.width, height: parent.height }
        : { width: this.scale.width, height: this.scale.height };
    const L = createLayout(TOKENS, designHeight(scaleMode, vp, TOKENS));
    this.geo = homeLayout(TOKENS, L.H);
    return L;
  }

  /** The ZOR / ÇOK ZOR tag needs the level's difficulty (its JSON chunk is small and loads lazily, TECH §8.3). */
  private loadDifficulty(id: number): void {
    void loadLevelById(id).then((res) => {
      if (!res.ok || !this.scene.isActive() || this.model.nextLevel !== id) return;
      this.nextDifficulty = res.level.difficulty;
      this.model = this.computeModel();
      if (this.model.difficultyTag) this.build();
    });
  }

  private clearView(): void {
    const v = this.view;
    if (!v) return;
    for (const o of v.objects) o.destroy();
    this.view = null;
  }

  private build(): void {
    this.clearView();
    this.hint.hide();
    const g = this.geo;
    const m = this.model;
    const objects: Phaser.GameObjects.GameObject[] = [];
    const reducedFn = (): boolean => this.reduced;

    // --- backdrop: bg_home_town moves with the middle group; the surplus above / below it repeats its edge rows
    const backdrop = this.add.container(0, 0).setDepth(D.backdrop);
    const bg = ArtImage.create(
      this,
      this.assets,
      'bg_home_town',
      { x: 0, y: g.artY, w: g.W, h: BASE_H },
      {
        reduced: reducedFn,
        extend: { top: g.skyBand.h, bottom: g.groundBand.h },
      },
    );
    backdrop.add([...bg.edges, bg.image]);
    objects.push(backdrop);

    // --- stage: tree base (when catalogued), ozalit ghost (unbuilt part), full colour (built part), characters
    const s = g.structure;
    const structureRoot = this.add.container(s.x + s.w / 2, s.y + s.h).setDepth(D.stage);
    const box = { x: -s.w / 2, y: -s.h, w: s.w, h: s.h };
    const ratio = m.structureRatio;
    const tree = ArtImage.create(this, this.assets, 'town_ch1_tree', box, { reduced: reducedFn });
    structureRoot.add(tree.image);
    const ghost = ArtImage.create(this, this.assets, 'town_ch1_treehouse_ghost', box, {
      reduced: reducedFn,
      crop: () => (ratio >= 1 ? { x: 0, y: 0, w: 0, h: 0 } : { x: 0, y: 0, w: s.w, h: s.h * (1 - ratio) }),
    });
    structureRoot.add(ghost.image);
    const colour = ArtImage.create(this, this.assets, 'town_ch1_treehouse', box, {
      reduced: reducedFn,
      crop: () => ({ x: 0, y: s.h * (1 - ratio), w: s.w, h: s.h * ratio }),
    });
    structureRoot.add(colour.image);
    // UX §3: a tap makes the structure hop 1.0 → 1.03 (no function)
    const hop = this.add
      .zone(-s.w / 2 + 120, -s.h + 140, s.w - 240, s.h - 160)
      .setOrigin(0, 0)
      .setInteractive();
    hop.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => this.hop(structureRoot));
    structureRoot.add(hop);
    objects.push(structureRoot);
    objects.push(...this.characters(g.character, reducedFn));

    // --- top bar
    const hud: Phaser.GameObjects.GameObject[] = [];
    const lives = new Capsule(this, this.icons, { w: g.lives.w, icon: 'icon_life', value: '' });
    lives.setValue(...livesText(m));
    lives.root.setPosition(g.lives.x, g.lives.y);
    lives.onPress(buttonFeel).onTap(() => lives.bounce(this.reduced));
    const coins = new Capsule(this, this.icons, {
      w: g.coins.w,
      icon: 'icon_coin',
      value: formatCount(m.coins),
      plus: true,
    });
    coins.root.setPosition(g.coins.x, g.coins.y);
    // META §10: the shop is locked in the slice → the coin capsule and its "+" say "Yakında"
    coins.onPress(buttonFeel).onTap(() => this.comingSoon(coins.anchor(), 'up'));
    const stars = new Capsule(this, this.icons, {
      w: g.stars.w,
      icon: 'icon_star',
      value: formatCount(m.stars),
    });
    stars.root.setPosition(g.stars.x, g.stars.y);
    // META §10: no task window in the slice → the structure glows for 300 ms
    stars.onPress(buttonFeel).onTap(() => this.glow(structureRoot, colour));
    const gear = new KitButton(this, {
      color: 'blue',
      w: g.settings.w,
      h: g.settings.h,
      icon: { ...this.icons.frame('icon_settings'), px: 88 },
    });
    gear
      .setPosition(g.settings.x + g.settings.w / 2, g.settings.y + g.settings.h / 2)
      .setReduced(this.reduced);
    gear.onPress(buttonFeel).onTap(() => this.openSettings());
    hud.push(lives.root, coins.root, stars.root, gear.root);

    // --- area ribbon + progress bar
    const ribbon = new Ribbon(this, { color: 'orange', text: tDynamic(KEY.area), bodyW: g.ribbon.w });
    ribbon.setPosition(g.ribbon.x + g.ribbon.w / 2, g.ribbon.y);
    const progress = new ProgressBar(this, this.icons, g.progress.w, m.progress.value, m.progress.max);
    progress.setPosition(g.progress.x, g.progress.y);
    hud.push(ribbon.root, progress.root);

    // --- side icon: the level chest ring is always shown (META §8.2, PL-2R-09); the preview window is Faz 4 (cut 3)
    const side = g.sideRight(0);
    const chest = new RingIcon(this, this.icons, {
      size: side.w,
      icon: 'icon_chest',
      value: m.chest.value,
      max: m.chest.max,
      done: m.chest.full,
      label: t('common.count', { n: m.chest.value, max: m.chest.max }),
    });
    chest.root.setPosition(side.x + side.w / 2, side.y + side.h / 2);
    chest.onTap(() => chest.bounce(this.reduced));
    hud.push(chest.root);

    // --- content end band, difficulty tag, "Bölüm N"
    let tagRoot: Phaser.GameObjects.Container | null = null;
    if (m.difficultyTag) {
      tagRoot = this.levelTag(g.tag, m.difficultyTag);
      hud.push(tagRoot);
    }
    if (m.contentEnd) {
      const band = g.moreSoon(tagRoot !== null);
      const k = band.h / TOKENS.kit.ribbon.heightPx;
      const more = new Ribbon(this, { color: 'blue', text: t('home.moreSoon'), bodyW: band.w / k, scale: k });
      more.setPosition(band.x + band.w / 2, band.y);
      hud.push(more.root);
    }
    const r = g.play;
    let edge: Phaser.GameObjects.Graphics | null = null;
    if (m.pulse) {
      const e = UI.homeEdgePx;
      edge = addBakedGraphics(this)
        .lineStyle(e, hex(C.gold), 1)
        .strokeRoundedRect(r.x - e, r.y - e, r.w + 2 * e, r.h + 2 * e, TOKENS.kit.button.radiusMaxPx + e)
        .setVisible(this.reduced);
      hud.push(edge);
    }
    const button = new KitButton(this, {
      color: 'green',
      w: r.w,
      h: r.h,
      label: upper(t('home.play', { n: m.nextLevel })),
      labelPx: 80,
    });
    button.setPosition(r.x + r.w / 2, r.y + r.h / 2).setReduced(this.reduced);
    button.onPress(buttonFeel).onTap(() => this.play());
    hud.push(button.root);

    // --- bottom navigation
    const nav = new NavBar(
      this,
      this.icons,
      g.nav,
      g.navTabs,
      HOME_TABS.map((id) => ({
        id,
        icon: TAB_ICON[id],
        label: tDynamic(KEY.tab(id)),
        locked: m.tabs.find((x) => x.id === id)?.locked ?? true,
        selected: id === 'home',
      })),
    );
    nav.onTap((id, locked, at) => this.tabTapped(nav, id as HomeTab, locked, at));
    hud.push(nav.root);

    for (const o of hud) (o as Phaser.GameObjects.Container).setDepth(D.hud);
    objects.push(...hud);
    this.view = {
      objects,
      lives,
      button,
      structureRoot,
      colour,
      ghost,
      nav,
      edge,
      tagRoot,
    };
    this.notice?.setVisible(true);
  }

  /**
   * UX §3 character corner: Tuna (bust, the corner's height) and Kepçe at 70 % in front of her right side, so her
   * thumbs-up stays visible; a hedge (ui/kit/scenery) in front of the bust's straight lower edge grounds both.
   */
  private characters(c: Rect, reduced: () => boolean): Phaser.GameObjects.GameObject[] {
    const out: Phaser.GameObjects.GameObject[] = [];
    const base = c.y + c.h;
    const tunaH = c.h;
    const tunaW = (tunaH * 300) / 375;
    const tunaX = c.x - HEDGE_INSET_PX;
    const tuna = ArtImage.create(
      this,
      this.assets,
      'chr_tuna_bust',
      { x: tunaX, y: base - tunaH, w: tunaW, h: tunaH },
      {
        reduced,
      },
    );
    out.push(tuna.image.setDepth(D.stage + 1));
    const hedge = addBakedGraphics(this).setDepth(D.stage + 2);
    drawHedge(hedge, tunaX - HEDGE_INSET_PX, base + HEDGE_DROP_PX, tunaW + 2 * HEDGE_INSET_PX, HEDGE_H);
    out.push(hedge);
    const kw = c.w * KEPCE_SCALE;
    const kh = (kw * 206) / 300;
    const kepce = ArtImage.create(
      this,
      this.assets,
      'chr_kepce_bust',
      { x: tunaX + tunaW - KEPCE_OVERLAP_PX, y: base + HEDGE_DROP_PX + 6 - kh, w: kw, h: kh },
      { reduced },
    );
    out.push(kepce.image.setDepth(D.stage + 3));
    return out;
  }

  /** UX §3 tag: red "ZOR" / purple "ÇOK ZOR" sticker over the button's top-left corner (no touch). */
  private levelTag(r: Rect, tag: 'hard' | 'superhard'): Phaser.GameObjects.Container {
    const fill = tag === 'hard' ? C.tagHard : C.tagSuperHard;
    const stroke = TOKENS.kit.buttonColor.red.stroke;
    const g = addBakedGraphics(this);
    const rad = 24;
    g.fillStyle(hex(stroke), 1).fillRoundedRect(0, 0, r.w, r.h + 6, rad);
    g.fillStyle(hex(fill), 1).fillRoundedRect(6, 6, r.w - 12, r.h - 12, rad - 6);
    g.fillStyle(0xffffff, 0.25).fillRoundedRect(16, 10, r.w - 32, (r.h - 20) * 0.4, 10);
    const label = addKitText(
      this,
      r.w / 2,
      r.h / 2,
      upper(t(tag === 'hard' ? 'difficulty.hard' : 'difficulty.superhard')),
      'brightTitle',
      44,
      stroke,
    );
    const root = this.add.container(r.x, r.y, [g, label]);
    root.setAngle(-4);
    return root;
  }

  /** UX §3: the structure hops 1.0 → 1.03 on a tap (about its base). */
  private hop(root: Phaser.GameObjects.Container): void {
    if (this.reduced) return;
    this.tweens.killTweensOf(root);
    root.setScale(1);
    this.tweens.add({
      targets: root,
      scale: 1.03,
      duration: TOKENS.duration.bump,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  /** META §10: a tap on the star capsule gives the built part a 300 ms glow (white ADD flash; reduced: none). */
  private glow(root: Phaser.GameObjects.Container, colour: ArtImage): void {
    if (this.reduced || !colour.image.visible) return;
    const src = colour.image;
    const flash = this.add
      .image(src.x, src.y, src.texture.key, src.frame.name)
      .setOrigin(0, 0)
      .setDisplaySize(src.displayWidth, src.displayHeight)
      .setTint(0xffffff)
      .setTintMode(Phaser.TintModes.FILL)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0);
    colour.fitOther(flash);
    root.add(flash);
    this.tweens.add({
      targets: flash,
      alpha: 0.6,
      duration: 150,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => flash.destroy(),
    });
  }

  private comingSoon(at: { x: number; y: number }, dir: 'down' | 'up'): void {
    lockedFeel();
    this.hint.show(tDynamic(KEY.comingSoon), at, dir, this.reduced);
  }

  private tabTapped(nav: NavBar, id: HomeTab, locked: boolean, at: { x: number; y: number }): void {
    appTrack({ name: 'nav_tap', tab: id, locked });
    if (!locked) return;
    nav.shakeLock(id, this.reduced);
    this.comingSoon(at, 'down');
  }

  /** JUICE §0 rule 8: the pulse stops (steady gold edge) or starts again; buttons keep only the thickness change. */
  private setReduced(on: boolean): void {
    this.reduced = on;
    const v = this.view;
    if (!v) return;
    v.edge?.setVisible(on);
    v.button.setReduced(on);
    if (on) v.button.root.setScale(1);
  }

  private play(): void {
    if (this.starting || this.notice || this.settings) return;
    this.starting = true;
    const id = this.model.nextLevel;
    // JUICE #100 is Faz 5 (cut 2): a 150 ms fade into the game screen's indigo
    const bg = Phaser.Display.Color.HexStringToColor(TOKENS.color.scene.gameTop);
    this.cameras.main.fadeOut(TOKENS.duration.reducedFade, bg.red, bg.green, bg.blue);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      // TECH §10.4: a sleeping level screen is woken (its pools and HUD are kept), else started; home stops
      this.scene.run(LEVEL_SCENE_KEY, { levelId: id } satisfies LevelSceneData);
      this.scene.stop();
    });
  }

  /** UX §3 "Ayarlar" (Faz 2R): the Pause window's sound / music / haptics rows under `settings.title`. */
  private openSettings(): void {
    if (this.settings || this.notice) return;
    const s = (): DeepReadonly<{ sound: boolean; music: boolean; haptics: boolean }> =>
      appSave().data.settings;
    const popup: Popup = new Popup(
      this,
      this.layoutNow,
      {
        rows: [
          { kind: 'title', text: upper(tDynamic(KEY.settings)) },
          ...TOGGLES.map(([id, key]) => ({ kind: 'toggle' as const, id, label: t(key), on: s()[id] })),
        ],
        options: [{ id: 'ok', label: upper(t('common.ok')), tone: 'primary' }],
        close: true,
      },
      D.windows,
      {
        option: () => this.closeSettings(),
        close: () => this.closeSettings(),
        toggle: (id) => {
          const key = id as (typeof TOGGLES)[number][0];
          changeSetting(key, !s()[key]);
          popup.setToggle(id, s()[key]);
        },
        button: (b, v) => pressV1(b, v),
      },
      { on: t('common.on'), off: t('common.off') },
    );
    this.settings = popup;
  }

  private closeSettings(): void {
    this.settings?.destroy();
    this.settings = null;
  }

  /** UX §1 (c): the update window (refund row: life, coins; no blame, no red). */
  private openNotice(notice: DeepReadonly<VoidNotice>): void {
    const refunds = notice.refunds;
    const popup = new Popup(
      this,
      this.layoutNow,
      {
        rows: [
          { kind: 'title', text: upper(t('resume.void.title')) },
          { kind: 'text', text: t('resume.void.body', { n: notice.level }) },
          {
            kind: 'custom',
            h: 112,
            build: (scene) => refundRow(scene, refunds.life, refunds.coins),
          },
          ...(notice.bridge
            ? [
                {
                  kind: 'text' as const,
                  text: t('resume.void.bridge'),
                  role: 'caption' as const,
                  color: C.inkSoft,
                },
              ]
            : []),
        ],
        options: [{ id: 'ok', label: upper(t('common.ok')), tone: 'primary' }],
      },
      D.windows,
      {
        option: () => {
          appSave().dismissVoidNotice();
          popup.destroy();
          this.notice = null;
        },
        button: (b, v) => pressV1(b, v),
      },
    );
    this.notice = popup;
  }
}

/** Lives capsule text: the count and the countdown or `hud.livesFull` (UX §3). */
function livesText(m: HomeModel): [string, string | null] {
  const l = m.lives;
  const sub = l.full ? tDynamic(KEY.livesFull) : l.nextInMs !== null ? formatCountdown(l.nextInMs) : null;
  return [String(l.count), sub];
}

/** v1 window buttons (Popup): the lip press of JUICE #69 without the level's EventPlayer. */
function pressV1(b: OptionButton, v: 'press' | 'release'): void {
  if (v === 'press') {
    b.setLip(TOKENS.shadow.buttonPressedLipPx);
    gameAudio().play('sfx_button');
  } else b.setLip(TOKENS.shadow.buttonLipPx);
}

/** UX §1 (c) refund row: only the items > 0, icon + amount. */
function refundRow(scene: Phaser.Scene, life: number, coins: number): Phaser.GameObjects.GameObject[] {
  const out: Phaser.GameObjects.GameObject[] = [];
  const items: { heart: boolean; text: string }[] = [];
  if (life > 0) items.push({ heart: true, text: t('common.times', { n: life }) });
  if (coins > 0) items.push({ heart: false, text: t('common.coins', { n: coins }) });
  const step = 280;
  items.forEach((it, i) => {
    const x = (i - (items.length - 1) / 2) * step;
    if (it.heart) {
      const g = scene.add.graphics().setPosition(x - 60, 56);
      drawHeart(g, 72);
      out.push(g);
    }
    const label = new InlineLabel(scene, 'h2', C.ink, it.heart ? 'left' : 'center')
      .setText(it.text)
      .setPosition(it.heart ? x - 12 : x, 56);
    out.push(label.root);
  });
  return out;
}
