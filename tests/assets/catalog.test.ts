/**
 * v2 art catalogue, static SVG checks and the runtime asset service (ASSET_LIST §16.1–§16.3; TECH_DESIGN §2R.6,
 * §2R.12 WP-J): the catalogue equals the ASSET §16.3 table, every acceptance rule of §16.2 that a machine can check
 * rejects a bad SVG, and `AssetService` always hands out a working texture (fallback first, art when it arrives).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type Phaser from 'phaser';
import { describe, expect, it } from 'vitest';
import tokens from '../../src/theme/tokens.json' with { type: 'json' };
import { TOKENS } from '../../src/theme/tokens.ts';
import {
  ASSET_BY_ID,
  ASSET_CATALOG,
  ICON_ATLAS_KEY,
  checkSvg,
  emptyManifest,
  iconAtlasSize,
  iconSlot,
  idOfSvgPath,
  inPalette,
  paletteOf,
  parseManifest,
} from '../../src/services/assetCatalog.ts';
import type { AssetDef, Manifest } from '../../src/services/assetCatalog.ts';
import { AssetService, artKey, fallbackKey, groupItems } from '../../src/services/assets.ts';
import type { LoadItem, LoaderPort } from '../../src/services/assets.ts';
import { ICONS_FALLBACK_KEY } from '../../src/theme/textures.ts';
import { createRecorder } from '../theme/recordingContext.ts';

const ROOT = join(import.meta.dirname, '..', '..');
const ctx = {
  palette: paletteOf(tokens),
  characterColors: TOKENS.color.character as unknown as Record<string, Record<string, string>>,
};

const def = (id: string): AssetDef => {
  const d = ASSET_BY_ID.get(id);
  if (!d) throw new Error(id);
  return d;
};

/** A valid icon SVG in palette colours. */
const iconSvg = (
  body = '<circle cx="64" cy="64" r="40" fill="#FFC21A" stroke="#3B2A1A" stroke-width="8"/>',
): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">${body}</svg>`;
const check = (id: string, svg: string): string[] => checkSvg(def(id), svg, Buffer.byteLength(svg), ctx);

describe('catalogue = ASSET 16.3 table', () => {
  const doc = readFileSync(join(ROOT, 'docs', 'ASSET_LIST.md'), 'utf8');
  const section = doc.slice(doc.indexOf('### 16.3'), doc.indexOf('### 16.4'));

  it('ASSET 16.3 rows 1–10: id, viewBox and raster size match the table', () => {
    const rows = [...section.matchAll(/^\| (\d+) \| `(\w+)\/(\w+)` \| 0 0 (\d+) (\d+) \| (\d+)×(\d+)/gm)];
    expect(rows.length).toBe(10);
    for (const r of rows) {
      const d = def(r[3] ?? '');
      expect([d.category, d.viewBox.w, d.viewBox.h, d.raster.w, d.raster.h], r[3]).toEqual([
        r[2],
        Number(r[4]),
        Number(r[5]),
        Number(r[6]),
        Number(r[7]),
      ]);
    }
  });

  it('ASSET 16.3 icons: the 16 of rows 11–26 + icon_piggy, icon_kettlebell, icon_nextfloor; nav_home / nav_album optional', () => {
    const list = /icon\/icon_<ad>` \(([^)]+)\)/.exec(section)?.[1] ?? '';
    const named = list.split(',').map((s) => `icon_${s.trim()}`);
    expect(named).toHaveLength(16);
    const icons = ASSET_CATALOG.filter((a) => a.inAtlas);
    for (const n of [...named, 'icon_piggy', 'icon_kettlebell', 'icon_nextfloor']) {
      expect(
        icons.map((a) => a.id),
        n,
      ).toContain(n);
      expect(def(n).optional, n).toBeUndefined();
    }
    expect(icons.filter((a) => a.optional).map((a) => a.id)).toEqual(['icon_nav_home', 'icon_nav_album']);
    for (const n of ['icon_brush', 'icon_undo', 'icon_thermos']) expect(def(n).phase).toBe('3');
  });

  it('TECH 2R.6 load groups: P1 icons, chr_tuna_bust, chr_dede_bust, bg_level_site_edge (+ ASSET 16.5 glove); P2 home; P3 win', () => {
    const g = (grp: string) => ASSET_CATALOG.filter((a) => a.group === grp && !a.inAtlas).map((a) => a.id);
    expect(g('P1').sort()).toEqual([
      'bg_level_site_edge',
      'chr_dede_bust',
      'chr_tuna_bust',
      'ui_tutorial_glove',
    ]);
    expect(g('P2').sort()).toEqual(['bg_home_town', 'chr_kepce_bust', 'logo_emblem', 'town_ch1_treehouse']);
    expect(g('P3').sort()).toEqual(['bg_win_plaza', 'chr_gribeton_bust', 'chr_tuna_cheer']);
    expect(ASSET_CATALOG.filter((a) => a.category === 'icon').every((a) => a.group === 'P1')).toBe(true);
  });

  it('ASSET 16.2 size limits: bg 60 KB, town 40 KB, chr 20 KB, logo 15 KB, icon 6 KB', () => {
    expect(def('bg_home_town').maxBytes).toBe(61440);
    expect(def('town_ch1_treehouse').maxBytes).toBe(40960);
    expect(def('chr_tuna_bust').maxBytes).toBe(20480);
    expect(def('logo_emblem').maxBytes).toBe(15360);
    expect(def('icon_coin').maxBytes).toBe(6144);
  });

  it('TECH 2R.6 icon atlas: 4 columns of 128 px; 19 icons → 512 × 640 (20 slots)', () => {
    expect(iconAtlasSize(19)).toEqual({ w: 512, h: 640 });
    expect(iconSlot(5)).toEqual({ x: 128, y: 128 });
  });

  it('TECH 2R.6 SVG path → id: public/art/<category>/<id>.svg', () => {
    expect(idOfSvgPath('public/art/chr/chr_tuna_bust.svg')).toEqual({ category: 'chr', id: 'chr_tuna_bust' });
    expect(idOfSvgPath('public/art/chr_tuna_bust.svg')).toBeNull();
  });
});

describe('static SVG checks (ASSET 16.2 acceptance 1–2; TECH 2R.6 step 1)', () => {
  it('ASSET 16.2 a clean palette SVG passes', () => {
    expect(check('icon_coin', iconSvg())).toEqual([]);
  });

  for (const [what, body] of [
    ['<text>', '<text x="0" y="10" fill="#FFFFFF">1</text>'],
    ['<image>', '<image href="#a" width="8" height="8"/>'],
    ['<foreignObject>', '<foreignObject width="8" height="8"></foreignObject>'],
    ['<script>', '<script>alert(1)</script>'],
    ['<filter>', '<defs><filter id="f"><feGaussianBlur stdDeviation="2"/></filter></defs>'],
    ['<mask>', '<defs><mask id="m"><rect width="8" height="8" fill="#FFFFFF"/></mask></defs>'],
  ] as const) {
    it(`ASSET 16.2 forbidden element ${what} is rejected`, () => {
      expect(check('icon_coin', iconSvg(body)).join(' ')).toMatch(/forbidden element/);
    });
  }

  it('ASSET 16.2 filter / mask attributes, external href / url(), @import and event handlers are rejected', () => {
    expect(
      check('icon_coin', iconSvg('<rect width="8" height="8" fill="#FFFFFF" filter="url(#f)"/>')).join(),
    ).toMatch(/filter/);
    expect(check('icon_coin', iconSvg('<use href="https://x.test/a.svg#b"/>')).join()).toMatch(
      /external href/,
    );
    expect(check('icon_coin', iconSvg('<use href="#b"/>'))).toEqual([]);
    expect(check('icon_coin', iconSvg('<style>@import url(a.css);</style>')).join()).toMatch(/@import/);
    expect(
      check('icon_coin', iconSvg('<rect width="8" height="8" fill="#FFFFFF" onclick="x()"/>')).join(),
    ).toMatch(/event handler/);
  });

  it('ASSET 16.2 root viewBox must be the catalogue one and width / height = viewBox', () => {
    const bad = iconSvg().replace('viewBox="0 0 128 128"', 'viewBox="0 0 100 100"');
    expect(check('icon_coin', bad).join()).toMatch(/viewBox/);
    const size = iconSvg().replace('width="128"', 'width="64"');
    expect(check('icon_coin', size).join()).toMatch(/width\/height/);
  });

  it('ASSET 16.2 byte limit (icon 6 KB)', () => {
    const big = iconSvg(`<g>${'<rect width="8" height="8" fill="#FFFFFF"/>'.repeat(200)}</g>`);
    expect(check('icon_coin', big).join()).toMatch(/size/);
  });

  it('ASSET 16.2 path coordinates with more than 1 decimal are rejected', () => {
    expect(check('icon_coin', iconSvg('<path d="M10.5 20 L30 40.25Z" fill="#FFFFFF"/>')).join()).toMatch(
      /decimal/,
    );
    expect(check('icon_coin', iconSvg('<path d="M10.5 20 L30 40.2Z" fill="#FFFFFF"/>'))).toEqual([]);
  });

  it('ASSET 16.2 palette: token colours and their volume tones (·0.68 + white·0.32, ×0.92, ×0.68) ±2 pass, others fail', () => {
    const pal = paletteOf(tokens);
    expect(inPalette('#E8B48A', pal)).toBe(true); // tuna skin (token)
    expect(inPalette('#EFCCAF', pal)).toBe(true); // its light tone
    expect(inPalette('#D5A67F', pal)).toBe(true); // × 0.92
    expect(inPalette('#9E7A5E', pal)).toBe(true); // × 0.68
    expect(inPalette('#E9B58C', pal)).toBe(true); // ±2
    expect(inPalette('#123456', pal)).toBe(false);
    expect(inPalette('white', pal)).toBe(true);
    expect(check('icon_coin', iconSvg('<rect width="8" height="8" fill="#123456"/>')).join()).toMatch(
      /palette.*#123456/,
    );
    expect(check('icon_coin', iconSvg('<stop offset="0" stop-color="#FF00FF"/>')).join()).toMatch(/#FF00FF/);
  });

  it('ASSET 16.3 character signature colours must appear verbatim (Tuna: helmet, vest, gloves)', () => {
    const t = TOKENS.color.character.tuna;
    const svg = (fills: string[]): string =>
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 320" width="256" height="320">${fills
        .map((f) => `<rect width="8" height="8" fill="${f}"/>`)
        .join('')}</svg>`;
    expect(check('chr_tuna_bust', svg([t['helmet'] ?? '', t['vest'] ?? '', t['gloves'] ?? '']))).toEqual([]);
    expect(check('chr_tuna_bust', svg([t['helmet'] ?? '', t['vest'] ?? ''])).join()).toMatch(
      /signature.*gloves/,
    );
  });
});

// ---------------------------------------------------------------------------------------------------------------
// AssetService with a fake texture manager and loader (no Phaser runtime)

interface FakeTex {
  frames: Set<string>;
}

function fakeTextures() {
  const map = new Map<string, FakeTex>();
  const created: string[] = [];
  const removed: string[] = [];
  const textures = {
    exists: (k: string) => map.has(k),
    remove: (k: string) => {
      removed.push(k);
      map.delete(k);
    },
    get: (k: string) => ({
      has: (f: string) => map.get(k)?.frames.has(f) ?? false,
      getSourceImage: () => ({ width: 256, height: 320 }),
    }),
    createCanvas: (key: string, width: number, height: number) => {
      const rec = createRecorder();
      const tex = {
        key,
        width,
        height,
        frames: new Set<string>(),
        context: rec.ctx,
        add: (n: string) => tex.frames.add(n),
        refresh: () => tex,
      };
      map.set(key, tex);
      created.push(key);
      return tex;
    },
  };
  return {
    textures: textures as unknown as Phaser.Textures.TextureManager,
    created,
    removed,
    addArt: (key: string, frames: string[] = []) => map.set(key, { frames: new Set(frames) }),
  };
}

function manifestWith(): Manifest {
  const m = emptyManifest();
  m.assets['chr_tuna_bust'] = {
    file: 'chr_tuna_bust.webp',
    w: 300,
    h: 375,
    bytes: 10,
    srcSha1: 'a',
    group: 'P1',
    status: 'ok',
  };
  m.assets['bg_home_town'] = {
    file: 'bg_home_town.webp',
    w: 540,
    h: 960,
    bytes: 10,
    srcSha1: 'b',
    group: 'P2',
    status: 'ok',
  };
  m.assets['bg_win_plaza'] = {
    w: 540,
    h: 960,
    bytes: 0,
    srcSha1: 'c',
    group: 'P3',
    status: 'rejected',
    errors: ['x'],
  };
  m.assets['icon_coin'] = {
    atlas: ICON_ATLAS_KEY,
    w: 128,
    h: 128,
    bytes: 0,
    srcSha1: 'd',
    group: 'P1',
    status: 'ok',
  };
  m.atlases[ICON_ATLAS_KEY] = {
    file: 'icons_v2.webp',
    json: 'icons_v2.json',
    w: 512,
    h: 128,
    bytes: 10,
    jsonBytes: 10,
    group: 'P1',
    frames: ['icon_coin'],
  };
  return parseManifest(m);
}

function service(manifest: unknown, fail: readonly string[] = []) {
  const tx = fakeTextures();
  const loads: LoadItem[][] = [];
  const port: LoaderPort = {
    fetchJson: async () => {
      if (manifest === null) throw new Error('404');
      return manifest;
    },
    loadItems: async (items) => {
      loads.push([...items]);
      const ok: string[] = [];
      for (const it of items) {
        if (fail.includes(it.key)) continue;
        tx.addArt(it.key, it.kind === 'atlas' ? ['icon_coin'] : []);
        ok.push(it.key);
      }
      return { ok, failed: items.map((i) => i.key).filter((k) => fail.includes(k)) };
    },
  };
  const svc = new AssetService({ textures: tx.textures, tokens: TOKENS, loader: async () => port });
  return { svc, tx, loads };
}

describe('AssetService (TECH 2R.6 "Çalışma anı")', () => {
  it('TECH 2R.6 groupItems: P1 = its ok images + the icon atlas; rejected and other groups are skipped', () => {
    const m = manifestWith();
    expect(groupItems(m, 'P1')).toEqual([
      { kind: 'image', key: 'art:chr_tuna_bust', url: 'assets/v2/chr_tuna_bust.webp' },
      {
        kind: 'atlas',
        key: 'art:icons_v2',
        url: 'assets/v2/icons_v2.webp',
        jsonUrl: 'assets/v2/icons_v2.json',
      },
    ]);
    expect(groupItems(m, 'P3')).toEqual([]);
  });

  it('TECH 2R.6 before loading, texture() returns the procedural fallback (baked once); after P1 the raster', async () => {
    const { svc, tx } = service(manifestWith());
    expect(svc.texture('chr_tuna_bust')).toEqual({ key: fallbackKey('chr_tuna_bust'), art: false });
    svc.texture('chr_tuna_bust');
    expect(tx.created.filter((k) => k === fallbackKey('chr_tuna_bust'))).toHaveLength(1);
    const seen: unknown[] = [];
    svc.onChange('chr_tuna_bust', (r) => seen.push(r));
    await svc.loadGroup('P1');
    expect(svc.texture('chr_tuna_bust')).toEqual({ key: artKey('chr_tuna_bust'), art: true });
    expect(seen).toEqual([{ key: artKey('chr_tuna_bust'), art: true }]);
  });

  it('TECH 2R.6 a missing or invalid manifest falls back for everything, without throwing', async () => {
    const { svc, loads } = service(null);
    await svc.startBackground();
    expect(loads).toEqual([]);
    expect(svc.texture('bg_home_town')?.art).toBe(false);
    const bad = service({ version: 1 });
    await bad.svc.startBackground();
    expect(bad.svc.texture('chr_dede_bust')?.art).toBe(false);
  });

  it('TECH 2R.6 a file that fails to load keeps its fallback; the others load', async () => {
    const { svc } = service(manifestWith(), ['art:chr_tuna_bust']);
    await svc.loadGroup('P1');
    expect(svc.texture('chr_tuna_bust')?.art).toBe(false);
    expect(svc.icon('icon_coin')).toEqual({ key: artKey(ICON_ATLAS_KEY), frame: 'icon_coin', art: true });
  });

  it('TECH 2R.6 startBackground loads P1 → P2 → P3 once, in order', async () => {
    const { svc, loads } = service(manifestWith());
    await Promise.all([svc.startBackground(), svc.startBackground()]);
    expect(loads.map((l) => l.map((i) => i.key))).toEqual([
      ['art:chr_tuna_bust', 'art:icons_v2'],
      ['art:bg_home_town'],
    ]);
  });

  it('TECH 2R.6 icon(): icons_v2 frame when the icon passed, else the procedural icons_fallback atlas', async () => {
    const { svc, tx } = service(manifestWith());
    expect(svc.icon('icon_coin')).toEqual({ key: ICONS_FALLBACK_KEY, frame: 'icon_coin', art: false });
    expect(tx.created).toContain(ICONS_FALLBACK_KEY);
    await svc.loadGroup('P1');
    expect(svc.icon('icon_coin').art).toBe(true);
    expect(svc.icon('icon_lock')).toEqual({ key: ICONS_FALLBACK_KEY, frame: 'icon_lock', art: false });
  });

  it('TECH 2R.11 harness assetMode fallback: loaded art is ignored and listeners hear the switch', async () => {
    const { svc } = service(manifestWith());
    await svc.loadGroup('P1');
    const seen: boolean[] = [];
    svc.onChange('chr_tuna_bust', (r) => seen.push(r.art));
    svc.setMode('fallback');
    expect(svc.texture('chr_tuna_bust')?.art).toBe(false);
    svc.setMode('art');
    expect(seen).toEqual([false, true]);
  });

  it('TECH 2R.6 bg_level_site_edge has no fallback (null); portrait() falls back to the procedural Ø 128 portrait', () => {
    const { svc } = service(manifestWith());
    expect(svc.texture('bg_level_site_edge')).toBeNull();
    expect(svc.portrait()).toEqual({ key: 'ui_portrait_dede_fb', art: false });
  });

  it('TECH 2R.6 release() frees the art textures (scene shutdown) and texture() falls back again', async () => {
    const { svc, tx } = service(manifestWith());
    await svc.loadGroup('P1');
    svc.release(['chr_tuna_bust']);
    expect(tx.removed).toContain(artKey('chr_tuna_bust'));
    expect(svc.texture('chr_tuna_bust')?.art).toBe(false);
  });
});
