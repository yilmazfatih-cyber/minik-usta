/**
 * Background loader of the v2 art (docs/TECH_DESIGN.md §2R.6 "Çalışma anı"): a scene that never renders, added on
 * demand by `gameAssets(game)`, whose own Phaser loader fetches the rasters of one group at a time for
 * services/assets.ts (`LoaderPort`). Running the loader in its own scene keeps the level and home scenes' loaders
 * idle, so the FTUE critical path (font + intro, P0) never waits for art.
 */
import Phaser from 'phaser';
import { ART_FADE_MS, AssetService } from '../services/assets.ts';
import type { LoadItem, LoadResult, LoaderPort } from '../services/assets.ts';
import { TOKENS } from '../theme/tokens.ts';

export const ASSET_LOADER_KEY = 'AssetLoader';

export class AssetLoaderScene extends Phaser.Scene implements LoaderPort {
  private readonly readyPromise: Promise<void>;
  private markReady: () => void = () => undefined;

  constructor() {
    super({ key: ASSET_LOADER_KEY, active: false, visible: false });
    this.readyPromise = new Promise<void>((resolve) => {
      this.markReady = resolve;
    });
  }

  create(): void {
    this.markReady();
  }

  /** Resolves once the scene has booted (its loader exists). */
  ready(): Promise<void> {
    return this.readyPromise;
  }

  loadItems(items: readonly LoadItem[]): Promise<LoadResult> {
    return new Promise<LoadResult>((resolve) => {
      const ok: string[] = [];
      const failed: string[] = [];
      const loader = this.load;
      const onFile = (key: string): void => void ok.push(key);
      const onError = (file: Phaser.Loader.File): void => void failed.push(file.key);
      loader.on(Phaser.Loader.Events.FILE_COMPLETE, onFile);
      loader.on(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
      loader.once(Phaser.Loader.Events.COMPLETE, () => {
        loader.off(Phaser.Loader.Events.FILE_COMPLETE, onFile);
        loader.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
        // an atlas completes as two files (image + json) under one key; report each key once
        resolve({ ok: [...new Set(ok)].filter((k) => !failed.includes(k)), failed: [...new Set(failed)] });
      });
      for (const it of items) {
        if (it.kind === 'image') loader.image(it.key, it.url);
        else loader.atlas(it.key, it.url, it.jsonUrl);
      }
      loader.start();
    });
  }

  async fetchJson(url: string): Promise<unknown> {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return (await res.json()) as unknown;
  }
}

const services = new WeakMap<Phaser.Game, AssetService>();

/** Adds the loader scene once and resolves when it is ready. */
async function loaderOf(game: Phaser.Game): Promise<AssetLoaderScene> {
  let scene = game.scene.getScene(ASSET_LOADER_KEY) as unknown as AssetLoaderScene | null;
  if (!scene) scene = game.scene.add(ASSET_LOADER_KEY, AssetLoaderScene, true) as unknown as AssetLoaderScene;
  await scene.ready();
  return scene;
}

/**
 * The game's asset service (one per game). Scenes call `gameAssets(this.game).texture(id)` / `.icon(id)` /
 * `.attach(image, id)`; the level scene calls `.startBackground()` once level 1 is interactive (TECH §2R.6 P1).
 */
export function gameAssets(game: Phaser.Game): AssetService {
  let s = services.get(game);
  if (!s) {
    s = new AssetService({ textures: game.textures, tokens: TOKENS, loader: () => loaderOf(game) });
    services.set(game, s);
  }
  return s;
}

/**
 * Shows art `id` on `image` now (SVG raster or procedural fallback) and cross-fades later art in over `ART_FADE_MS`
 * (UX §3 "Yükleniyor": a temporary copy on top fades in, then the image takes the texture; no mask). Reduced motion
 * swaps instantly. The subscription ends with the image.
 */
export function attachArt(
  assets: AssetService,
  image: Phaser.GameObjects.Image,
  id: string,
  opts: { readonly reducedMotion?: boolean } = {},
): void {
  const ref = assets.texture(id);
  if (ref) image.setTexture(ref.key, ref.frame);
  const off = assets.onChange(id, (next) => {
    if (!image.scene || !image.active) return;
    if (opts.reducedMotion || !next.art) {
      image.setTexture(next.key, next.frame);
      return;
    }
    const scene = image.scene;
    const top = scene.add
      .image(image.x, image.y, next.key, next.frame)
      .setOrigin(image.originX, image.originY)
      .setDisplaySize(image.displayWidth, image.displayHeight)
      .setDepth(image.depth)
      .setScrollFactor(image.scrollFactorX, image.scrollFactorY)
      .setAlpha(0);
    const parent = image.parentContainer;
    if (parent) parent.addAt(top, parent.getIndex(image) + 1);
    scene.tweens.add({
      targets: top,
      alpha: image.alpha,
      duration: ART_FADE_MS,
      onComplete: () => {
        if (image.active) image.setTexture(next.key, next.frame);
        top.destroy();
      },
    });
  });
  image.once(Phaser.GameObjects.Events.DESTROY, off);
}
