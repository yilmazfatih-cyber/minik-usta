/**
 * Runtime of the v2 art (docs/TECH_DESIGN.md §2R.6 "Çalışma anı"; UX §3 "Yükleniyor"; ASSET_LIST §16.1): loads the
 * rasters `npm run assets` wrote to `public/assets/v2` in groups P1 → P2 → P3 through a background loader scene
 * (scenes/AssetLoaderScene.ts) and hands out texture references that ALWAYS work:
 *   `texture(id)` → the SVG raster if loaded, otherwise its procedural fallback (baked on first request from
 *   theme/textures.ts `fallbackArt`), or null when the art has none (`bg_level_site_edge`);
 *   `icon('icon_coin')` → a frame of `icons_v2` if loaded and present, otherwise of the procedural `icons_fallback`;
 *   `portrait()` → Usta Dede's Ø 128 portrait, baked once (arc + clip, no runtime mask; CL-2R-26).
 * Art arriving later is announced through `onChange`; scenes/AssetLoaderScene.ts `attachArt` cross-fades it in
 * (200 ms). The FTUE path never waits for art: P1 starts only when a scene calls `startBackground()` (after level 1
 * is interactive).
 *
 * Engine-free (ESLint: services import no Phaser): textures come in as the structural `AssetTextures`, the loader as
 * `LoaderPort`, so this module runs under vitest.
 */
import {
  ASSET_BY_ID,
  ASSET_CATALOG,
  ASSET_GROUPS,
  ICON_ATLAS_KEY,
  MANIFEST_FILE,
  OUT_URL,
  parseManifest,
} from './assetCatalog.ts';
import type { AssetGroup, Manifest } from './assetCatalog.ts';
import {
  ICONS_FALLBACK_KEY,
  ICON_PAGE,
  PORTRAIT_KEY,
  dedePortraitFallback,
  fallbackArt,
  iconFallbackFrames,
  packFrames,
  uploadAtlas,
  uploadCanvasArt,
} from '../theme/textures.ts';
import type { FallbackArt, TextureHost } from '../theme/textures.ts';
import type { Tokens } from '../theme/tokens.ts';

/** `art` = SVG rasters when loaded (default); `fallback` = procedural only (harness `assetMode`, TECH §2R.11). */
export type AssetMode = 'art' | 'fallback';

export interface TextureRef {
  readonly key: string;
  readonly frame?: string;
  /** True when this is the SVG raster, false for the procedural fallback. */
  readonly art: boolean;
}

/** One file for the loader scene. */
export type LoadItem =
  | { readonly kind: 'image'; readonly key: string; readonly url: string }
  | { readonly kind: 'atlas'; readonly key: string; readonly url: string; readonly jsonUrl: string };

export interface LoadResult {
  readonly ok: readonly string[];
  readonly failed: readonly string[];
}

/** What the service needs from Phaser's loader (implemented by AssetLoaderScene). */
export interface LoaderPort {
  loadItems(items: readonly LoadItem[]): Promise<LoadResult>;
  fetchJson(url: string): Promise<unknown>;
}

/** What the service reads from Phaser's `TextureManager` (structural; `game.textures` satisfies it). */
export interface AssetTextures extends TextureHost {
  get(key: string): { has(frame: string): boolean; getSourceImage(): unknown };
}

/** Phaser texture key of a loaded SVG raster. */
export const artKey = (id: string): string => `art:${id}`;
/** Phaser texture key of a baked procedural fallback. */
export const fallbackKey = (id: string): string => `fb:${id}`;

/** Cross-fade when art replaces a fallback (UX §3 "Yükleniyor": 200 ms). */
export const ART_FADE_MS = 200;

/** URL of a file in `public/assets/v2`, relative to the page (vite `base: './'`). */
export const assetUrl = (file: string, base = OUT_URL): string => `${base}/${file}`;

/**
 * The files of one load group (pure; tested): every `ok` image of the group with its ghost, plus the icon atlas in
 * P1. Entries the manifest rejected or lacks are not loaded (their fallback stays).
 */
export function groupItems(manifest: Manifest, group: AssetGroup, base = OUT_URL): LoadItem[] {
  const items: LoadItem[] = [];
  for (const [key, e] of Object.entries(manifest.assets)) {
    if (e.status !== 'ok' || !e.file || e.group !== group) continue;
    items.push({ kind: 'image', key: artKey(key), url: assetUrl(e.file, base) });
  }
  for (const [key, a] of Object.entries(manifest.atlases)) {
    if (a.group !== group) continue;
    items.push({
      kind: 'atlas',
      key: artKey(key),
      url: assetUrl(a.file, base),
      jsonUrl: assetUrl(a.json, base),
    });
  }
  return items.sort((x, y) => (x.key < y.key ? -1 : x.key > y.key ? 1 : 0));
}

/** Raster size of an id (catalogue; the ghost shares its structure's size). */
function rasterOf(id: string): { w: number; h: number } | null {
  const base = id.endsWith('_ghost') ? id.slice(0, -'_ghost'.length) : id;
  return ASSET_BY_ID.get(base)?.raster ?? null;
}

type Listener = (ref: TextureRef) => void;

export class AssetService {
  private readonly textures: AssetTextures;
  private readonly tokens: Tokens;
  private readonly port: () => Promise<LoaderPort>;
  private readonly base: string;
  private manifest: Manifest | null = null;
  private manifestLoad: Promise<Manifest | null> | null = null;
  private readonly loaded = new Set<string>();
  private readonly failed = new Set<string>();
  private readonly baked = new Set<string>();
  private readonly listeners = new Map<string, Set<Listener>>();
  private readonly groups = new Map<AssetGroup, Promise<void>>();
  private queue: Promise<unknown> = Promise.resolve();
  private mode: AssetMode = 'art';
  private background: Promise<void> | null = null;

  constructor(opts: {
    readonly textures: AssetTextures;
    readonly tokens: Tokens;
    readonly loader: () => Promise<LoaderPort>;
    readonly base?: string;
  }) {
    this.textures = opts.textures;
    this.tokens = opts.tokens;
    this.port = opts.loader;
    this.base = opts.base ?? OUT_URL;
  }

  /** `art` (default) or `fallback` (harness: shoot the procedural look even when art is loaded). */
  setMode(mode: AssetMode): void {
    if (mode === this.mode) return;
    this.mode = mode;
    for (const id of this.listeners.keys()) this.emit(id);
  }

  getMode(): AssetMode {
    return this.mode;
  }

  /** True when the SVG raster of `id` is loaded and used (mode `art`). */
  hasArt(id: string): boolean {
    return this.mode === 'art' && this.loaded.has(artKey(id)) && this.textures.exists(artKey(id));
  }

  /** The manifest (fetched once; null when missing or invalid: everything falls back). */
  async loadManifest(): Promise<Manifest | null> {
    if (this.manifest) return this.manifest;
    this.manifestLoad ??= (async () => {
      try {
        const port = await this.port();
        this.manifest = parseManifest(await port.fetchJson(assetUrl(MANIFEST_FILE, this.base)));
      } catch {
        this.manifest = null;
      }
      return this.manifest;
    })();
    return this.manifestLoad;
  }

  /** Loads one group (once; later calls return the same promise). Failures keep the fallback. */
  loadGroup(group: AssetGroup): Promise<void> {
    let p = this.groups.get(group);
    if (!p) {
      p = this.enqueue(async () => {
        const manifest = await this.loadManifest();
        if (!manifest) return;
        const items = groupItems(manifest, group, this.base).filter((it) => !this.loaded.has(it.key));
        if (items.length === 0) return;
        const res = await (await this.port()).loadItems(items);
        for (const k of res.failed) this.failed.add(k);
        for (const k of res.ok) {
          this.loaded.add(k);
          this.emit(k.slice('art:'.length));
        }
        if (res.ok.includes(artKey('chr_dede_bust'))) this.bakePortrait();
      });
      this.groups.set(group, p);
    }
    return p;
  }

  /** TECH §2R.6: P1 → P2 → P3 in the background (call once level 1 is interactive). */
  startBackground(): Promise<void> {
    this.background ??= (async () => {
      for (const g of ASSET_GROUPS) await this.loadGroup(g);
    })();
    return this.background;
  }

  /** Texture of an image id (`bg_home_town`, `town_ch1_treehouse`, `…_ghost`, `chr_*`, `logo_emblem`). */
  texture(id: string): TextureRef | null {
    if (this.hasArt(id)) return { key: artKey(id), art: true };
    return this.fallbackRef(id);
  }

  /** Frame of an icon (`icon_coin` …): `icons_v2` when loaded and the icon passed, else `icons_fallback`. */
  icon(id: string): TextureRef {
    const atlas = artKey(ICON_ATLAS_KEY);
    if (this.hasArt(ICON_ATLAS_KEY) && this.textures.get(atlas).has(id))
      return { key: atlas, frame: id, art: true };
    if (!this.baked.has(ICONS_FALLBACK_KEY)) {
      uploadAtlas(this.textures, ICONS_FALLBACK_KEY, packFrames(iconFallbackFrames(this.tokens), ICON_PAGE));
      this.baked.add(ICONS_FALLBACK_KEY);
    }
    return { key: ICONS_FALLBACK_KEY, frame: id, art: false };
  }

  /** Usta Dede's round portrait (ART §14.8): from the bust raster when loaded, else procedural. */
  portrait(): TextureRef {
    const fromArt = this.hasArt('chr_dede_bust');
    const key = fromArt ? PORTRAIT_KEY : `${PORTRAIT_KEY}_fb`;
    if (!this.textures.exists(key)) {
      if (fromArt) this.bakePortrait();
      else uploadCanvasArt(this.textures, key, dedePortraitFallback(this.tokens));
    }
    return { key, art: fromArt };
  }

  /** Calls `cb` whenever the reference of `id` changes (art arrives, mode switch). Returns an unsubscribe. */
  onChange(id: string, cb: Listener): () => void {
    let set = this.listeners.get(id);
    if (!set) {
      set = new Set();
      this.listeners.set(id, set);
    }
    set.add(cb);
    return () => set.delete(cb);
  }

  /** Frees the art textures of `ids` (scene shutdown, TECH §2R.6); the next `texture()` falls back or reloads. */
  release(ids: readonly string[]): void {
    for (const id of ids) {
      const key = artKey(id);
      if (this.textures.exists(key)) this.textures.remove(key);
      this.loaded.delete(key);
    }
    for (const g of ASSET_GROUPS) this.groups.delete(g);
  }

  /** Loaded art ids (harness / debug). */
  loadedIds(): string[] {
    return [...this.loaded].map((k) => k.slice('art:'.length)).sort();
  }

  private fallbackRef(id: string): TextureRef | null {
    const key = fallbackKey(id);
    if (!this.baked.has(key) || !this.textures.exists(key)) {
      const raster = rasterOf(id);
      const art: FallbackArt | null = raster ? fallbackArt(id, raster, this.tokens) : null;
      if (!art) return null;
      uploadCanvasArt(this.textures, key, art);
      this.baked.add(key);
    }
    return { key, art: false };
  }

  private bakePortrait(): void {
    const src = artKey('chr_dede_bust');
    if (!this.textures.exists(src)) return;
    const d = this.tokens.tutorial.portraitPx;
    const image = this.textures.get(src).getSourceImage() as CanvasImageSource & {
      width: number;
      height: number;
    };
    uploadCanvasArt(this.textures, PORTRAIT_KEY, {
      w: d,
      h: d,
      draw: (ctx) => {
        const c = ctx as CanvasRenderingContext2D;
        const r = d / 2;
        c.save();
        c.beginPath();
        c.arc(r, r, r - 3, 0, Math.PI * 2);
        c.fillStyle = this.tokens.kit.buttonColor.cream.base;
        c.fill();
        c.clip();
        // the bust's head (centre 128, 134 of the 256 × 320 viewBox) fills the disc: ≈ 190 units across
        const s = (d / 190) * (256 / image.width);
        c.drawImage(image, r - 128 * (d / 190), r - 128 * (d / 190), image.width * s, image.height * s);
        c.restore();
        c.beginPath();
        c.arc(r, r, r - 3, 0, Math.PI * 2);
        c.lineWidth = 6;
        c.strokeStyle = this.tokens.color.ui.ink;
        c.stroke();
      },
    });
    this.emit('portrait');
  }

  private emit(id: string): void {
    const set = this.listeners.get(id);
    if (!set) return;
    const ref = id === 'portrait' ? this.portrait() : id === ICON_ATLAS_KEY ? null : this.texture(id);
    if (!ref) return;
    for (const cb of [...set]) cb(ref);
  }

  private enqueue(job: () => Promise<void>): Promise<void> {
    const next = this.queue.then(job, job);
    this.queue = next.catch(() => undefined);
    return next;
  }
}

/** Every catalogue id that has a load group (harness: wait for all). */
export const ALL_ART_IDS: readonly string[] = ASSET_CATALOG.map((a) => a.id);
