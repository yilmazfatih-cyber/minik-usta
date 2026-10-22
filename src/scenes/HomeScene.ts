/**
 * Home screen v3 (UX_FLOWS §3 "Ana ekran — ana sayfa v2", §4.1 level-start window, R2-09; ART_REFERENCE §9.2 home,
 * §3 kit; META §10 slice scope; TECH §2R.8). One screen, one primary action: the top bar (ART_REFERENCE §3.4 "kapsül
 * düzeni", DS3-02: two separate 300 × 88 capsules — lives with the count inside the heart, coins + "+" — and the
 * purple settings tool; the star count sits under the progress bar's end star), the area ribbon `town.ch1.title` and
 * the meta progress bar, the Renkli Tepe art with the tree house opening floor by floor (ozalit ghost + full colour,
 * `setCrop` from the bottom), the character group (Tuna's and Usta Dede's full figures, Kepçe; DS3-03 closed by
 * `chr_dede_stand`, r4), the side event bubbles (level chest ring, locked Usta Ligi), the big green L
 * "Bölüm N" button and the bottom navigation (only "Ana Sayfa" open; the other tabs say "Yakında"). From level 3 on
 * "Bölüm N" opens the level-start window (booster slots + "Oyna", K-40).
 *
 * Content comes from the pure meta/home.ts model; geometry from ui/kit/layout.ts; looks from the kit atlas; art from
 * the asset service (SVG raster when loaded, procedural fallback first, 200 ms cross-fade). Text from i18n — keys
 * that are not in tr.json yet (STORY §7.7) go through `tDynamic`, which shows the key until WP-L adds the text.
 *
 * Cut 2 and 3 of TECH §2R.12: the entry / exit transitions are a 150 ms fade (JUICE #99–#102 are Faz 5), no cloud
 * parallax and no chest preview window (Faz 4; the ring stays static). A voided attempt (K-43 item 4, UX §1 (c)) still
 * opens the `resume.void` window first; the "Bölüm 2" pulse after level 1 (UX §2.2 step 11) stays, with a steady gold
 * edge under reduced motion.
 */
import Phaser from 'phaser';
import { scaleMode } from '../config/display.ts';
import type { CompiledLevel } from '../core/level/compile.ts';
import type { PreBooster } from '../core/types.ts';
import { HOME_TABS, formatCountdown, homeModel } from '../meta/home.ts';
import type { Difficulty, HomeModel, HomeTab } from '../meta/home.ts';
import { opensLevelStartWindow } from '../meta/levelStart.ts';
import { ICON_ATLAS_KEY } from '../services/assetCatalog.ts';
import type { AssetService } from '../services/assets.ts';
import { copyFeedback } from '../services/feedback.ts';
import { t, tDynamic, upper } from '../services/i18n.ts';
import type { DeepReadonly, VoidNotice } from '../services/save.ts';
import { createLayout, designHeight } from '../theme/layout.ts';
import type { Layout, Rect } from '../theme/layout.ts';
import { TOKENS } from '../theme/tokens.ts';
import { addBakedGraphics } from '../ui/BakedGraphics.ts';
import { drawHeart } from '../ui/icons.ts';
import { LevelStartWindow } from '../ui/LevelStartWindow.ts';
import { openManualCopy } from '../ui/manualCopy.ts';
import { Popup } from '../ui/Popup.ts';
import { RewardLayer } from '../ui/RewardLayer.ts';
import { hex } from '../ui/text.ts';
import { UI } from '../ui/uiConstants.ts';
import { ArtImage } from '../ui/kit/ArtImage.ts';
import { ensureKitAtlas } from '../ui/kit/atlas.ts';
import { Capsule } from '../ui/kit/Capsule.ts';
import { EventBubble } from '../ui/kit/EventBubble.ts';
import { buttonFeel, lockedFeel } from '../ui/kit/feel.ts';
import { HintBubble, hintBubbleHeight } from '../ui/kit/HintBubble.ts';
import { IconBinder } from '../ui/kit/icons.ts';
import { KitButton } from '../ui/kit/KitButton.ts';
import type { PressVariant } from '../ui/kit/KitButton.ts';
import { BASE_H, homeLayout, lockedTabBalloon } from '../ui/kit/layout.ts';
import type { HomeLayout } from '../ui/kit/layout.ts';
import { NavBar } from '../ui/kit/NavBar.ts';
import { ProgressBar } from '../ui/kit/ProgressBar.ts';
import { Ribbon } from '../ui/kit/Ribbon.ts';
import { addInlineText } from '../ui/kit/InlineText.ts';
import { addKitText, fitWidth, formatCount } from '../ui/kit/text.ts';
import {
  appSave,
  appTrack,
  applySettings,
  changeSetting,
  feedbackText,
  onSettingChanged,
  reducedMotion,
} from './appServices.ts';
import { gameAssets } from './AssetLoaderScene.ts';
import { HOME_SCENE_KEY, LEVEL_SCENE_KEY } from './level/LevelScene.ts';
import type { HomeSceneData, LevelSceneData } from './level/LevelScene.ts';
import { DEPTH } from './level/depth.ts';
import { availableLevels, loadLevelById } from './level/levels.ts';
import { gameAudio, gameHaptics } from './level/sceneServices.ts';
import { shaderWarmup } from './shaderWarmup.ts';

const V3 = TOKENS.kit.v3;
const HL = TOKENS.layout.home;

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

/** UX §3 / §11 Ayarlar "Geri bildirim": cream secondary M button, the window's last item; the copied balloon 1,5 s. */
const FEEDBACK_ROW_PAD = 16;
const FEEDBACK_COPIED_MS = 1500;
/** Lives countdown refresh (UX §3 "29:12"). */
const LIVES_TICK_MS = 1000;
/** "Bölüm N" label size on the L button (ART_REFERENCE §3.1 L 96). */
const PLAY_LABEL_PX = V3.button.L.fontPx;

/** The home screen's open window (harness status). */
export type HomeWindow = 'levelStart' | 'settings' | 'notice' | null;

interface HomeView {
  readonly objects: Phaser.GameObjects.GameObject[];
  readonly lives: Capsule;
  readonly coins: Capsule;
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
  private nextLevelData: CompiledLevel | null = null;
  private layoutNow!: Layout;
  private geo!: HomeLayout;
  private assets!: AssetService;
  private icons!: IconBinder;
  private hint!: HintBubble;
  private view: HomeView | null = null;
  private notice: Popup | null = null;
  private settings: Popup | null = null;
  private levelStart: LevelStartWindow | null = null;
  /** The windows' balloon (above the window; the screen's own hint sits under windows). */
  private windowHint!: HintBubble;
  /** The manual copy box is open (TECH §2R.16: the clipboard refused). */
  private closeManual: (() => void) | null = null;
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
    this.nextLevelData = null;
  }

  create(): void {
    applySettings();
    const save = appSave();
    this.reduced = reducedMotion();
    this.cameras.main.setBackgroundColor(V3.palette.skyTop);
    // the kit atlas bakes behind the entry fade (TECH §2R.7, ≤ 200 ms at 4× CPU)
    ensureKitAtlas(this.game);
    this.assets = gameAssets(this.game);
    this.icons = new IconBinder((id) => this.assets.icon(id));
    this.iconsArt = this.assets.hasArt(ICON_ATLAS_KEY);
    this.hint = new HintBubble(this, D.hint);
    this.windowHint = new HintBubble(this, D.windows + 10);
    this.model = this.computeModel();
    this.layoutNow = this.computeLayout();
    this.build();
    // home art (P2) after the icons (P1); the win art (P3) after it (TECH §2R.6). Idempotent.
    void this.assets.loadGroup('P1').then(() => this.icons.refresh());
    void this.assets.startBackground();
    this.loadNext(this.model.nextLevel);
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
      this.windowHint.hide();
      this.closeManual?.();
      this.clearView();
      this.notice?.destroy();
      this.settings?.destroy();
      this.levelStart?.destroy();
      this.notice = null;
      this.settings = null;
      this.levelStart = null;
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
      if (l.count !== before.count || l.nextInMs !== null) {
        const [count, sub] = livesText(this.model);
        v.lives.setValue(sub ?? '', count);
      }
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

  /**
   * The next level's data: the ZOR / ÇOK ZOR tag needs its difficulty, the level-start window its segments and gaps
   * (the JSON chunk is small and loads lazily, TECH §8.3).
   */
  private loadNext(id: number): void {
    void loadLevelById(id).then((res) => {
      if (!res.ok || !this.scene.isActive() || this.model.nextLevel !== id) return;
      this.nextLevelData = res.level;
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
    objects.push(...this.characters(reducedFn));

    // --- top bar (ART_REFERENCE §9.2: capsules 88, the count inside the heart, green "+", purple settings tool)
    const hud: Phaser.GameObjects.GameObject[] = [];
    const [count, sub] = livesText(m);
    const lives = new Capsule(this, this.icons, {
      w: g.lives.w,
      icon: 'icon_life',
      value: sub ?? '',
      inIcon: count,
    });
    lives.root.setPosition(g.lives.x + V3.capsule.iconOverhangPx, g.lives.y);
    lives.onPress(buttonFeel).onTap(() => lives.bounce(this.reduced));
    const coins = new Capsule(this, this.icons, {
      w: g.coins.w,
      icon: 'icon_coin',
      value: formatCount(m.coins),
      plus: true,
    });
    coins.root.setPosition(g.coins.x + V3.capsule.iconOverhangPx, g.coins.y);
    // META §10: the shop is locked in the slice → the coin capsule and its "+" say "Yakında"
    coins.onPress(buttonFeel).onTap(() => this.comingSoon(coins.anchor(), 'up'));
    const gear = new KitButton(this, {
      color: 'purple',
      w: g.settings.w,
      h: g.settings.h,
      square: true,
      icon: { ...this.icons.frame('icon_settings'), px: 60 },
    });
    gear
      .setPosition(g.settings.x + g.settings.w / 2, g.settings.y + g.settings.h / 2)
      .setReduced(this.reduced);
    gear.onPress(buttonFeel).onTap(() => this.openSettings());
    hud.push(lives.root, coins.root, gear.root);

    // --- area ribbon + meta progress bar; the star count under the bar's end star (ART_REFERENCE §3.4, DS3-02)
    const ribbon = new Ribbon(this, { color: 'gold', text: tDynamic(KEY.area), bodyW: g.ribbon.w });
    ribbon.setPosition(g.ribbon.x + g.ribbon.w / 2, g.ribbon.y);
    const progress = new ProgressBar(
      this,
      this.icons,
      g.progress.w,
      m.progress.value,
      m.progress.max,
      'meta',
      {
        endCount: formatCount(m.stars),
        // META §10: no task window in the slice → a tap on the stars makes the built part glow for 300 ms
        onEndTap: () => {
          buttonFeel('press');
          this.glow(structureRoot, colour);
        },
      },
    );
    progress.setPosition(g.progress.x, g.progress.y);
    hud.push(ribbon.root, progress.root);

    // --- side bubbles: the level chest ring (META §8.2, PL-2R-09) right; the locked Usta Ligi left (META §10)
    const chest = new EventBubble(this, this.icons, {
      box: g.sideRight(0),
      icon: 'icon_chest',
      label: t('common.count', { n: m.chest.value, max: m.chest.max }),
      tone: 'green',
      progress: { value: m.chest.value, max: m.chest.max, done: m.chest.full },
    });
    chest.onTap(() => chest.bounce(this.reduced));
    const league = new EventBubble(this, this.icons, {
      box: g.sideLeft(0),
      icon: 'icon_nav_league',
      label: tDynamic(KEY.comingSoon),
      tone: 'grey',
      locked: true,
    });
    league.onTap(() => {
      league.shakeLock(this.reduced);
      this.comingSoon(league.anchor(), 'down');
    });
    hud.push(chest.root, league.root);

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
        .lineStyle(e, hex(V3.palette.gold), 1)
        .strokeRoundedRect(r.x - e, r.y - e, r.w + 2 * e, r.h + 2 * e, V3.button.L.r + e)
        .setVisible(this.reduced);
      hud.push(edge);
    }
    const button = new KitButton(this, {
      color: 'green',
      w: r.w,
      h: r.h,
      label: t('home.play', { n: m.nextLevel }),
      labelPx: PLAY_LABEL_PX,
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
      coins,
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
   * ART_REFERENCE §9.2 character group: Tuna's full figure (`chr_tuna_stand`, DS-04) in front at the left, Kepçe at
   * her feet, Usta Dede's full figure (`chr_dede_stand`, r4 — DS3-03: the bust with its cut bottom edge is gone) at
   * 0,9 behind at the right; all on the ground line just behind the button's top edge, the button's own area empty.
   */
  private characters(reduced: () => boolean): Phaser.GameObjects.GameObject[] {
    const g = this.geo;
    const out: Phaser.GameObjects.GameObject[] = [];
    const dede = ArtImage.create(this, this.assets, 'chr_dede_stand', g.dede, { reduced });
    out.push(dede.image.setDepth(D.stage + 1));
    const tuna = ArtImage.create(this, this.assets, 'chr_tuna_stand', g.tuna, { reduced });
    out.push(tuna.image.setDepth(D.stage + 2));
    const kepce = ArtImage.create(this, this.assets, 'chr_kepce_bust', g.kepce, { reduced });
    out.push(kepce.image.setDepth(D.stage + 3));
    // contact shadows (ART_REFERENCE §6.1): an ellipse under Tuna's and Kepçe's feet (Dede's figure carries its own)
    const shadows = addBakedGraphics(this).setDepth(D.stage);
    for (const r of [g.tuna, g.kepce]) {
      shadows.fillStyle(0x000000, 0.22).fillEllipse(r.x + r.w / 2, r.y + r.h - 4, r.w * 0.8, r.w * 0.16);
    }
    out.push(shadows);
    return out;
  }

  /** UX §3 tag: red "ZOR" / pink "ÇOK ZOR" pill over the button's top-left corner (no touch). */
  private levelTag(r: Rect, tag: 'hard' | 'superhard'): Phaser.GameObjects.Container {
    const fill = tag === 'hard' ? V3.badge.mid : V3.palette.pink;
    const stroke = tag === 'hard' ? V3.badge.stroke : V3.panel.outline;
    const g = addBakedGraphics(this);
    const rad = r.h / 2;
    g.fillStyle(hex(stroke), 1).fillRoundedRect(0, 0, r.w, r.h + 6, rad);
    g.fillStyle(hex(fill), 1).fillRoundedRect(6, 6, r.w - 12, r.h - 12, rad - 6);
    g.fillStyle(0xffffff, 0.22).fillRoundedRect(16, 10, r.w - 32, (r.h - 20) * 0.4, 10);
    const label = addKitText(
      this,
      r.w / 2,
      r.h / 2,
      upper(t(tag === 'hard' ? 'difficulty.hard' : 'difficulty.superhard')),
      'button',
      40,
      stroke,
    );
    fitWidth(label, r.w - 28);
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
    // DS-06: above the tab only when the balloon clears the "Bölüm N" button (top ≥ button bottom + 8); else it sits
    // inside the bar, over the tab's icon, so the button's text is never covered (`lockedTabBalloon`)
    const p = lockedTabBalloon(this.geo.play, this.geo.nav, at, hintBubbleHeight());
    this.comingSoon(p.at, p.dir);
  }

  /** Centre of the top bar's settings gear in design px (harness: the settings window shots). */
  get settingsPoint(): { readonly x: number; readonly y: number } | null {
    const g = this.view ? this.geo.settings : null;
    return g ? { x: g.x + g.w / 2, y: g.y + g.h / 2 } : null;
  }

  /** The open window (harness status). */
  get openWindow(): HomeWindow {
    if (this.levelStart) return 'levelStart';
    if (this.settings) return 'settings';
    if (this.notice) return 'notice';
    return null;
  }

  /** Centre of the open window's × in design px (harness), or null. */
  get windowClosePoint(): { readonly x: number; readonly y: number } | null {
    return this.levelStart?.closePoint ?? this.settings?.closePoint ?? null;
  }

  /** The level-start window's slot `id` centre (harness). */
  slotPoint(id: string): { x: number; y: number } | null {
    return this.levelStart?.slotPoint(id as PreBooster) ?? null;
  }

  /**
   * UX §6.2 "Dokun ve al" demo for the screen set (harness `showReward`): the layer with the level chest's items; the
   * slice has no trigger of its own (the chest window is Faz 4), nothing is granted here.
   */
  showRewardDemo(): void {
    const v = this.view;
    if (!v) return;
    const layer = new RewardLayer(
      this,
      this.icons,
      { W: this.layoutNow.W, H: this.layoutNow.H },
      {
        title: t('reward.ready'),
        items: [
          { icon: 'icon_coin', count: '200', target: v.coins.iconPoint() },
          { icon: 'icon_hammer', count: t('common.times', { n: 1 }), target: null },
        ],
        reduced: this.reduced,
      },
      D.windows + 20,
    );
    layer.onDone(() => undefined);
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

  /** "Bölüm N": from level 3 on the level-start window (UX §4.1), else the level starts at once (UX §3). */
  private play(): void {
    if (this.starting || this.notice || this.settings || this.levelStart) return;
    const id = this.model.nextLevel;
    if (!opensLevelStartWindow(id)) {
      this.startLevel([]);
      return;
    }
    const lvl = this.nextLevelData;
    if (!lvl || lvl.id !== id) {
      // the level data is still loading (a slow first paint): open as soon as it is there
      void loadLevelById(id).then((res) => {
        if (!res.ok || !this.scene.isActive() || this.levelStart) return;
        this.nextLevelData = res.level;
        this.openLevelStart(res.level);
      });
      return;
    }
    this.openLevelStart(lvl);
  }

  private openLevelStart(lvl: CompiledLevel): void {
    const save = appSave();
    this.levelStart = new LevelStartWindow(
      this,
      this.layoutNow,
      {
        level: lvl,
        inventory: save.data.boosters.inventory,
        lives: this.model.lives,
        areaKey: KEY.area,
        difficultyTag: this.model.difficultyTag,
      },
      { icons: this.icons, assets: this.assets, reduced: () => this.reduced },
      D.windows,
      {
        onPlay: (pre) => this.startLevel(pre),
        onClose: () => this.closeLevelStart(),
        onSlotHint: (slot, at) => {
          lockedFeel();
          const text =
            slot.state === 'locked'
              ? t('common.unlockAt', { n: slot.unlockLevel })
              : slot.state === 'unavailable'
                ? t('booster.noShutter')
                : t('common.notEnoughCoins');
          this.windowHint.show(text, at, 'down', this.reduced);
        },
        onRefill: (at) => {
          lockedFeel();
          this.windowHint.show(tDynamic(KEY.comingSoon), at, 'down', this.reduced);
        },
        button: (_b, v) => press(v),
      },
    );
  }

  private closeLevelStart(): void {
    this.windowHint.hide();
    this.levelStart?.destroy();
    this.levelStart = null;
  }

  private startLevel(preBoosters: readonly PreBooster[]): void {
    if (this.starting) return;
    this.starting = true;
    this.windowHint.hide();
    const id = this.model.nextLevel;
    // JUICE #100 is Faz 5 (cut 2): a 150 ms fade into the game screen's indigo
    const bg = Phaser.Display.Color.HexStringToColor(V3.palette.gameBase);
    this.cameras.main.fadeOut(TOKENS.duration.reducedFade, bg.red, bg.green, bg.blue);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      // TECH §10.4: a sleeping level screen is woken (its pools and HUD are kept), else started; home stops
      this.scene.run(LEVEL_SCENE_KEY, {
        levelId: id,
        preBoosters: [...preBoosters],
      } satisfies LevelSceneData);
      this.scene.stop();
    });
  }

  /** UX §3 "Ayarlar" (Faz 2R; ART_REFERENCE §9.8): the sound / music / haptics rows under `settings.title`. */
  private openSettings(): void {
    if (this.settings || this.notice || this.levelStart) return;
    const s = (): DeepReadonly<{ sound: boolean; music: boolean; haptics: boolean }> =>
      appSave().data.settings;
    const M = V3.button.M;
    const popup: Popup = new Popup(
      this,
      this.layoutNow,
      {
        rows: [
          { kind: 'title', text: tDynamic(KEY.settings) },
          ...TOGGLES.map(([id, key]) => ({ kind: 'toggle' as const, id, label: t(key), on: s()[id] })),
          // UX §3 / §11 (EN-2R-20): "Geri bildirim" is the window's last item, a cream secondary M button
          {
            kind: 'custom' as const,
            h: M.h + 2 * FEEDBACK_ROW_PAD,
            build: (scene: Phaser.Scene) => {
              const b = new KitButton(scene, {
                color: 'cream',
                w: M.w,
                h: M.h,
                label: t('settings.feedback'),
              });
              b.root.setPosition(0, FEEDBACK_ROW_PAD + M.h / 2);
              b.onPress(buttonFeel).onTap(() => void this.sendFeedback(b));
              return [b.root];
            },
          },
        ],
        options: [{ id: 'ok', label: t('common.ok'), tone: 'primary', size: 'L' }],
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
        button: (_b, v) => press(v),
      },
      { on: t('common.on'), off: t('common.off') },
    );
    this.settings = popup;
  }

  private closeSettings(): void {
    this.windowHint.hide();
    this.settings?.destroy();
    this.settings = null;
  }

  /**
   * TECH §2R.16 / EN-2R-20 "Geri bildirim": the device's funnel events as JSON to the clipboard. Copied → the 1,5 s
   * `settings.feedbackCopied` balloon over the button + `sfx_button` + a light haptic; refused → the read-only, selected
   * text box with `settings.feedbackManual` and `common.continue` (UX §3).
   */
  private async sendFeedback(button: KitButton): Promise<void> {
    if (this.closeManual) return;
    const text = feedbackText();
    const result = await copyFeedback(text);
    if (!this.sys.isActive()) return;
    if (result === 'copied') {
      const m = button.root.getWorldTransformMatrix();
      const at = { x: m.tx, y: m.ty - button.h / 2 - 8 };
      this.windowHint.show(t('settings.feedbackCopied'), at, 'down', this.reduced, FEEDBACK_COPIED_MS);
      gameAudio().play('sfx_button');
      gameHaptics().play('light');
      return;
    }
    const doc = globalThis.document;
    if (!doc) return;
    const parent = this.game.canvas.parentElement ?? doc.body;
    this.closeManual = openManualCopy(
      doc,
      parent,
      text,
      { hint: t('settings.feedbackManual'), close: t('common.continue') },
      () => {
        this.closeManual = null;
      },
    );
  }

  /** UX §1 (c): the update window (refund row: life, coins; no blame, no red). */
  private openNotice(notice: DeepReadonly<VoidNotice>): void {
    const refunds = notice.refunds;
    const popup = new Popup(
      this,
      this.layoutNow,
      {
        rows: [
          { kind: 'title', text: t('resume.void.title') },
          { kind: 'text', text: t('resume.void.body', { n: notice.level }), size: 44 },
          {
            kind: 'custom',
            h: 112,
            build: (scene) => refundRow(scene, this.icons, refunds.life, refunds.coins),
          },
          ...(notice.bridge
            ? [{ kind: 'text' as const, text: t('resume.void.bridge'), look: 'plain' as const }]
            : []),
        ],
        options: [{ id: 'ok', label: t('common.ok'), tone: 'primary', size: 'L' }],
      },
      D.windows,
      {
        option: () => {
          appSave().dismissVoidNotice();
          popup.destroy();
          this.notice = null;
        },
        button: (_b, v) => press(v),
      },
    );
    this.notice = popup;
  }
}

/** Lives capsule text: the count (inside the heart) and the countdown or `hud.livesFull` (UX §3). */
function livesText(m: HomeModel): [string, string | null] {
  const l = m.lives;
  const sub = l.full ? tDynamic(KEY.livesFull) : l.nextInMs !== null ? formatCountdown(l.nextInMs) : null;
  return [String(l.count), sub];
}

/** Window buttons: the press sound of JUICE #69 (the v3 button animates itself, #97). */
function press(v: PressVariant): void {
  if (v === 'press') gameAudio().play('sfx_button');
}

/** UX §1 (c) refund row: only the items > 0, icon + amount, in the card text look on the panel body. */
function refundRow(
  scene: Phaser.Scene,
  icons: IconBinder,
  life: number,
  coins: number,
): Phaser.GameObjects.GameObject[] {
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
    const label = addInlineText(scene, icons, it.text, 'counterCream', 44, it.heart ? 'left' : 'center');
    label.root.setPosition(it.heart ? x - 12 : x, 56);
    out.push(label.root);
  });
  return out;
}
