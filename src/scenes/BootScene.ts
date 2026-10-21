/**
 * Boot / loading screen v3 (UX_FLOWS §1.1; ART_REFERENCE §9.1, §7.4; TECH §10.2 (a), §11.1; STORY §7.8
 * `loading.text`): the `load*` sky with 18 slowly turning white rays and three cloud layers, the logo (emblem art +
 * the game name as 3D letters — one colour per letter from the block palette, a dark extrusion and the #4F1E9C
 * contour), eight flying v3 bricks on a ring around it, the character group (Tuna cheering in the middle, Kepçe at the
 * left, Usta Dede behind at the right), "Yükleniyor" (`plain` 64) with the 400 × 12 progress bar and the version.
 * Behind it the boot atlas is baked once, the save is opened (recovery, K-43 launch decision) and the route chosen:
 * resume a saved attempt on the level screen, the 3-panel intro on first launch (then Level 1 directly), else home.
 *
 * Progress bar steps: font 0,3 → boot atlas 0,7 → route 1,0; the screen stays at least `duration.splashMin`. The
 * middle group (logo, bricks, characters) shifts by half the EXPAND surplus; the text and the bar stay bottom-anchored.
 * A Playwright run may hold the screen (`window.__holdBoot`, a plain page flag the screens tool sets before load).
 */
import Phaser from 'phaser';
import { DESIGN_WIDTH, scaleMode } from '../config/display.ts';
import { RULES_VERSION, levelHash } from '../core/session.ts';
import { COLOR_CODES } from '../core/types.ts';
import type { ColorCode, ShapeId } from '../core/types.ts';
import { t } from '../services/i18n.ts';
import type { LevelIdentity } from '../services/save.ts';
import { designHeight } from '../theme/layout.ts';
import { TOKENS } from '../theme/tokens.ts';
import { drawLoadingSkyV3 } from '../theme/draw/kitV3.ts';
import { blockFrame, packFrames, uploadAtlas, uploadCanvasArt } from '../theme/textures.ts';
import { hex } from '../ui/text.ts';
import { ArtImage } from '../ui/kit/ArtImage.ts';
import { addKitText, kitTextStyle } from '../ui/kit/text.ts';
import { appSave, appTrack, applySettings, reducedMotion } from './appServices.ts';
import { gameAssets } from './AssetLoaderScene.ts';
import { ensureBootAtlas } from './atlas.ts';
import { launchRoute, voidedLast } from './flow/launch.ts';
import { INTRO_SCENE_KEY } from './IntroScene.ts';
import { HOME_SCENE_KEY, LEVEL_SCENE_KEY } from './level/LevelScene.ts';
import type { HomeSceneData, LevelSceneData } from './level/LevelScene.ts';
import { loadLevelById } from './level/levels.ts';
import { gameAudio } from './level/sceneServices.ts';

/** TECH §10.2: Text objects are created only after the game font is loaded (or failed), at most this long. */
const FONT_WAIT_MS = 1500;
const V3 = TOKENS.kit.v3;
const LD = V3.screen.loading;
/** Sky bake width (the gradient and the clouds scale cleanly). */
const SKY_BAKE_W = 270;
const SKY_KEY = 'boot_sky_v3';
const BRICK_ATLAS_KEY = 'boot_bricks_v3';
/** The eight bricks (ART_REFERENCE §9.1): ring angle (°), size share of `brickMaxPx`, tilt (°), shape, colour. */
const BRICKS: readonly (readonly [number, number, number, ShapeId, ColorCode])[] = [
  [20, 1, 18, 'D2_0', 'R'],
  [70, 0.62, -24, 'B1_0', 'G'],
  [110, 0.8, 10, 'I3_90', 'B'],
  [160, 0.55, -30, 'D2_90', 'Y'],
  [200, 0.9, 26, 'C3_0', 'P'],
  [250, 0.6, -12, 'B1_0', 'O'],
  [290, 0.75, 30, 'D2_0', 'C'],
  [340, 0.5, -18, 'I3_0', 'W'],
];
/** Logo letters: dark contour, extrusion (8, 12) in the letter tone × 0,6 (ART_REFERENCE §9.1 "3B harf"). */
const LOGO_STROKE = '#4F1E9C';
const LOGO_FONT_PX = 132;
const EMBLEM_PX = 300;
/** Bob of the bricks (3 s, ± 8 px) and the rays' turn (`scene.loadRayTurnsPerSecond`). */
const BOB_MS = 3000;
const BOB_PX = 8;

export class BootScene extends Phaser.Scene {
  private rays: Phaser.GameObjects.Graphics | null = null;
  private bricks: { img: Phaser.GameObjects.Image; y: number; phase: number }[] = [];
  private bar: Phaser.GameObjects.Graphics | null = null;
  private barRect = { x: 0, y: 0, w: 0, h: 0 };
  private reduced = false;
  private shownAt = 0;

  constructor() {
    super('Boot');
  }

  create(): void {
    this.reduced = reducedMotion();
    this.cameras.main.setBackgroundColor(V3.palette.loadTop);
    this.shownAt = this.time.now;
    this.buildScene();
    // Let the sky frame render, then wait for the font, bake and route (the bake blocks the main thread ≈ tens of ms).
    this.time.delayedCall(0, () => void this.boot());
  }

  update(time: number): void {
    if (this.reduced) return;
    const turns = V3.scene.loadRayTurnsPerSecond;
    if (this.rays) this.rays.rotation = ((time / 1000) * turns * Math.PI * 2) % (Math.PI * 2);
    for (const b of this.bricks) b.img.y = b.y + BOB_PX * Math.sin((2 * Math.PI * time) / BOB_MS + b.phase);
  }

  /** The screen's geometry: the middle group shifts by half the EXPAND surplus, text and bar are bottom-anchored. */
  private geometry(): { H: number; shift: number; textY: number; barY: number; versionY: number } {
    const parent = this.scale.parentSize;
    const vp =
      parent.width > 0 && parent.height > 0
        ? { width: parent.width, height: parent.height }
        : { width: this.scale.width, height: this.scale.height };
    const H = designHeight(scaleMode, vp, TOKENS);
    const surplus = H - TOKENS.meta.designHeight;
    return {
      H,
      shift: surplus * 0.5,
      textY: LD.textY + surplus,
      barY: LD.barY + surplus,
      versionY: 1840 + surplus,
    };
  }

  private buildScene(): void {
    const W = DESIGN_WIDTH;
    const { H, shift, textY, barY, versionY } = this.geometry();
    // sky + clouds (baked small, stretched)
    if (!this.textures.exists(SKY_KEY)) {
      const h = Math.round((SKY_BAKE_W * H) / W);
      uploadCanvasArt(this.textures, SKY_KEY, {
        w: SKY_BAKE_W,
        h,
        draw: (ctx) => drawLoadingSkyV3(ctx, { w: SKY_BAKE_W, h }, TOKENS),
      });
    }
    this.add.image(0, 0, SKY_KEY).setOrigin(0, 0).setDisplaySize(W, H);
    // rays from the logo centre (ART_REFERENCE §7.4: 18 rays, 10° wide, white α 0,10)
    const rays = this.add.graphics().setPosition(LD.logoCx, LD.logoCy + shift);
    const n = V3.scene.loadRays;
    const R = Math.hypot(W, H);
    rays.fillStyle(0xffffff, V3.scene.loadRayAlpha);
    for (let i = 0; i < n; i++) {
      const a0 = (i * 2 * Math.PI) / n;
      const a1 = a0 + Math.PI / n;
      rays.beginPath();
      rays.moveTo(0, 0);
      rays.lineTo(R * Math.cos(a0), R * Math.sin(a0));
      rays.lineTo(R * Math.cos(a1), R * Math.sin(a1));
      rays.closePath();
      rays.fillPath();
    }
    this.rays = rays;
    // sparkles (12 four-point stars)
    const sp = this.add.graphics();
    for (let i = 0; i < 12; i++) {
      const x = 90 + ((i * 331) % 900);
      const y = 120 + ((i * 457) % 1300) + shift * 0.5;
      const s = 10 + ((i * 7) % 3) * 8;
      sp.fillStyle(0xffffff, 0.75);
      sp.fillTriangle(x - s, y, x, y - s / 4, x + s, y);
      sp.fillTriangle(x - s, y, x, y + s / 4, x + s, y);
      sp.fillTriangle(x, y - s, x - s / 4, y, x, y + s);
      sp.fillTriangle(x, y - s, x + s / 4, y, x, y + s);
    }
    // bricks on a ring around the logo (v3 blocks baked once at k 0,6)
    this.bakeBricks();
    const ringR = (LD.ringMinPx + LD.ringMaxPx) / 2;
    BRICKS.forEach(([deg, share, tilt, shape, color], i) => {
      const a = (deg * Math.PI) / 180;
      const far = share < 0.7;
      const x = LD.logoCx + ringR * Math.cos(a);
      const y = LD.logoCy + shift + ringR * 0.72 * Math.sin(a);
      const img = this.add.image(x, y, BRICK_ATLAS_KEY, `blk_${shape}_${color}`);
      const px = LD.brickMinPx + (LD.brickMaxPx - LD.brickMinPx) * share;
      const k = px / Math.max(img.width, img.height);
      img
        .setScale(k * (far ? 0.7 : 1))
        .setAngle(tilt)
        .setAlpha(far ? 0.85 : 1);
      this.bricks.push({ img, y, phase: i * 0.8 });
    });
    // characters (ART_REFERENCE §9.1 group 840 × 720 centred on (540, 1060))
    const assets = gameAssets(this.game);
    const gcx = LD.groupCx;
    const gcy = LD.groupCy + shift;
    const reduced = (): boolean => this.reduced;
    const dedeH = 400 * 0.9;
    const dedeW = (dedeH * 256) / 320;
    ArtImage.create(
      this,
      assets,
      'chr_dede_bust',
      { x: gcx + 120, y: gcy + 300 - dedeH, w: dedeW, h: dedeH },
      { reduced },
    );
    const tunaH = 540;
    const tunaW = (tunaH * 300) / 400;
    ArtImage.create(
      this,
      assets,
      'chr_tuna_cheer',
      { x: gcx - tunaW / 2 - 20, y: gcy + 340 - tunaH, w: tunaW, h: tunaH },
      { reduced },
    );
    const kepceW = 300 * 0.8;
    const kepceH = (kepceW * 206) / 300;
    ArtImage.create(
      this,
      assets,
      'chr_kepce_bust',
      { x: gcx - 400, y: gcy + 340 - kepceH, w: kepceW, h: kepceH },
      { reduced },
    );
    // logo: emblem + 3D letters
    this.logo(LD.logoCx, LD.logoCy + shift, assets, reduced);
    // text, bar, version (texts appear after the font wait; the bar first)
    this.bar = this.add.graphics();
    this.barRect = { x: (W - LD.barW) / 2, y: barY - LD.barH / 2, w: LD.barW, h: LD.barH };
    this.setProgress(0.1);
    this.texts = { textY, versionY };
  }

  private texts: { textY: number; versionY: number } | null = null;

  /** `loading.text` and the version (after the font wait, TECH §10.2 "Font"). */
  private addTexts(): void {
    const tx = this.texts;
    if (!tx) return;
    addKitText(this, DESIGN_WIDTH / 2, tx.textY, t('loading.text'), 'plain', V3.text.plain.fontPx);
    addKitText(
      this,
      DESIGN_WIDTH / 2,
      tx.versionY,
      t('app.version', { version: APP_VERSION }),
      'plain',
      34,
    ).setAlpha(0.85);
  }

  /** ART_REFERENCE §9.1 logo: the emblem at the left, the game name as 3D letters at the right (640 × 360 box). */
  private logo(cx: number, cy: number, assets: ReturnType<typeof gameAssets>, reduced: () => boolean): void {
    const left = cx - LD.logoW / 2;
    ArtImage.create(
      this,
      assets,
      'logo_emblem',
      { x: left, y: cy - EMBLEM_PX / 2, w: EMBLEM_PX, h: EMBLEM_PX },
      { reduced },
    );
    this.logoText = { x: left + EMBLEM_PX + 24, cy, w: LD.logoW - EMBLEM_PX - 24 };
  }

  private logoText: { x: number; cy: number; w: number } | null = null;

  /** The name's letters (after the font wait): one Text per letter, colour by index, extrusion + contour. */
  private addLogoLetters(): void {
    const lt = this.logoText;
    if (!lt) return;
    const words = t('app.title').split(' ');
    const colors = COLOR_CODES.filter((c) => c !== 'W').map((c) => TOKENS.color.block[c]);
    const lineH = LOGO_FONT_PX * 0.98;
    const totalH = words.length * lineH;
    let ci = 0;
    words.forEach((word, wi) => {
      const y = lt.cy - totalH / 2 + lineH * (wi + 0.5);
      const letters = [...word].map((ch) => {
        const color = colors[ci % colors.length] ?? '#FFFFFF';
        ci += 1;
        const tone = Phaser.Display.Color.HexStringToColor(color).darken(40).rgba;
        return this.add
          .text(0, y, ch, {
            ...kitTextStyle('button', LOGO_FONT_PX, LOGO_STROKE, undefined, color),
            shadow: { offsetX: 7, offsetY: 11, color: tone, blur: 0, stroke: true, fill: true },
          })
          .setOrigin(0, 0.5);
      });
      const total = letters.reduce((s, l) => s + l.width * 0.84, 0);
      const k = Math.min(1, lt.w / total);
      let x = lt.x + (lt.w - total * k) / 2;
      for (const l of letters) {
        l.setScale(k).setX(x);
        x += l.width * 0.84 * k;
      }
    });
  }

  /** The 8 bricks of the ring, baked once (v3 blocks at k 0,6, no symbols needed: the frames carry their own). */
  private bakeBricks(): void {
    if (this.textures.exists(BRICK_ATLAS_KEY)) return;
    const seen = new Set<string>();
    const frames = BRICKS.flatMap(([, , , shape, color]) => {
      const key = `blk_${shape}_${color}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [blockFrame({ shape, color }, TOKENS, { variant: 'v2', k: 0.6 })];
    });
    uploadAtlas(
      this.textures,
      BRICK_ATLAS_KEY,
      packFrames(frames, { maxWidth: 1024, maxHeight: 1024, gutter: 2 }),
    );
  }

  /** Progress bar 400 × 12 (UX §1.1: track `#0A1F4A` α 0,4, fill white α 0,9). */
  private setProgress(k: number): void {
    const g = this.bar;
    if (!g) return;
    const r = this.barRect;
    g.clear();
    g.fillStyle(hex('#0A1F4A'), 0.4).fillRoundedRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4, r.h / 2 + 2);
    g.fillStyle(hex(V3.palette.loadMid), 0.9).fillRoundedRect(r.x, r.y, r.w, r.h, r.h / 2);
    g.fillStyle(0xffffff, 0.95).fillRoundedRect(r.x, r.y, Math.max(r.h, r.w * Math.min(1, k)), r.h, r.h / 2);
  }

  private async boot(): Promise<void> {
    // the save's language (and the other settings) before the first text; opening the save is synchronous and small
    const save = appSave();
    applySettings();
    // ART §8 / D-046: no Text before the Baloo 2 weights are loaded (a fallback rasterisation would stay)
    await waitForFont();
    this.addLogoLetters();
    this.addTexts();
    this.setProgress(0.3);
    // the title frame renders before the bake blocks the main thread
    await new Promise<void>((resolve) => this.time.delayedCall(0, resolve));
    ensureBootAtlas(this.game);
    this.setProgress(0.7);
    // the audio context is created here, on the loading screen, not in the first drag's touch handler (TECH §10.7)
    gameAudio().prepare();
    appTrack({ name: 'app_open' });
    const il = save.data.inLevel;
    // K-43 item 4: the saved attempt is checked against this build's level data and rules version
    let identity: LevelIdentity | null = null;
    if (il) {
      const res = await loadLevelById(il.levelId);
      identity = res.ok ? { levelHash: levelHash(res.level.data), rulesVersion: RULES_VERSION } : null;
    }
    const decision = save.resumeOnLaunch(() => identity);
    const route = launchRoute(save.data, decision);
    this.setProgress(1);
    // UX §1: the loading screen stays at least `splashMin`; a screens run may hold it (`window.__holdBoot`)
    const minLeft = TOKENS.duration.splashMin - (this.time.now - this.shownAt);
    if (minLeft > 0) await new Promise<void>((resolve) => this.time.delayedCall(minLeft, resolve));
    while ((globalThis as { __holdBoot?: boolean }).__holdBoot === true)
      await new Promise<void>((resolve) => this.time.delayedCall(100, resolve));
    if (route.kind === 'level') {
      const data: LevelSceneData = {
        levelId: route.levelId,
        resume: { actions: route.resume, window: route.window },
      };
      this.scene.start(LEVEL_SCENE_KEY, data);
    } else if (route.kind === 'intro') this.scene.start(INTRO_SCENE_KEY);
    else {
      // UX §1 (c): after a voided attempt the level button restarts the same level (review Faz 2 tur 2 #17)
      const last = voidedLast(save.data);
      this.scene.start(HOME_SCENE_KEY, (last ? { last } : {}) satisfies HomeSceneData);
    }
  }
}

/** Build version shown on the loading screen (`app.version`; package.json's `version` is 0.0.0 until release). */
const APP_VERSION = '0.1.0';

/**
 * `document.fonts.load` for the two weights the HUD uses (TECH §10.2 "Font": `800 120px` display, `600 44px` body) of the
 * self-hosted subset (`public/fonts/baloo2-latin-tr.woff2`, preloaded by index.html, `font-display: block`), capped by
 * `FONT_WAIT_MS` so a missing file never blocks the game (the fallback stack then draws).
 */
async function waitForFont(): Promise<void> {
  const fonts = (globalThis as { document?: Document }).document?.fonts;
  if (!fonts) return;
  const family = `"${TOKENS.font.family}"`;
  const load = Promise.all([
    fonts.load(`${TOKENS.font.weight.display} ${TOKENS.font.size.display}px ${family}`),
    fonts.load(`${TOKENS.font.weight.body} ${TOKENS.font.size.body}px ${family}`),
  ]).then(
    () => undefined,
    () => undefined,
  );
  await Promise.race([load, new Promise<void>((resolve) => setTimeout(resolve, FONT_WAIT_MS))]);
}
