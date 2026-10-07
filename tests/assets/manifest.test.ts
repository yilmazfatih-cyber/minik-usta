/**
 * The staleness and budget gates of the v2 art (TECH_DESIGN §2R.6 step 5, §2R.13; WP-J), Chromium-free: every SVG
 * under public/art matches the manifest `npm run assets` wrote (sha1), every output exists with its recorded size,
 * nothing stale stays in public/assets/v2, the budgets hold, and every SVG marked ok passes the static checks.
 * Red here means: an SVG changed and its raster is old → run `npm run assets`.
 */
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BUDGET, MANIFEST_FILE, emptyManifest } from '../../src/services/assetCatalog.ts';
import {
  ROOT,
  budgetOf,
  budgetProblems,
  defOf,
  iconAtlasJson,
  readManifest,
  readSvgSources,
  sha1,
  stalenessProblems,
  staticProblems,
} from '../../tools/assets.ts';

const OUT = join(ROOT, 'public', 'assets', 'v2');

describe('v2 art staleness gate (TECH 2R.6 step 5)', () => {
  const sources = readSvgSources();
  const m = readManifest();

  it('TECH 2R.6 the manifest exists whenever public/art has SVGs', () => {
    if (sources.length > 0) expect(m, `${MANIFEST_FILE} missing: run "npm run assets"`).not.toBeNull();
  });

  it('TECH 2R.6 every SVG matches its manifest sha1 and every output file exists with its recorded size (else: npm run assets)', () => {
    if (!m) return;
    expect(stalenessProblems(sources, m.manifest), 'run "npm run assets"').toEqual([]);
  });

  it('TECH 2R.6 public/assets/v2 holds only files the manifest lists (no stale outputs)', () => {
    if (!m) return;
    const listed = new Set([MANIFEST_FILE]);
    for (const e of Object.values(m.manifest.assets)) if (e.file) listed.add(e.file);
    for (const a of Object.values(m.manifest.atlases)) listed.add(a.file).add(a.json);
    expect(readdirSync(OUT).filter((f) => !listed.has(f))).toEqual([]);
  });

  it('TECH 2R.13 budgets: v2 download ≤ 900 KB, texture memory ≤ 64 MB', () => {
    if (!m) return;
    const b = budgetOf(m.manifest, m.bytes);
    expect(budgetProblems(b)).toEqual([]);
    expect(b.download).toBeLessThanOrEqual(BUDGET.downloadBytes);
  });

  it('ASSET 16.2 every SVG the manifest marks ok passes the static checks; rejected ones carry their errors', () => {
    if (!m) return;
    for (const src of sources) {
      const def = defOf(src);
      if (!def) continue;
      const e = m.manifest.assets[def.id];
      if (e?.status === 'ok') expect(staticProblems(src), src.path).toEqual([]);
      if (e?.status === 'rejected') expect(e.errors?.length ?? 0, src.path).toBeGreaterThan(0);
    }
  });

  it('TECH 2R.6 the icon atlas JSON lists exactly the manifest frames at their slots', () => {
    const atlas = m?.manifest.atlases['icons_v2'];
    if (!atlas) return;
    const json = JSON.parse(readFileSync(join(OUT, atlas.json), 'utf8')) as {
      frames: Record<string, unknown>;
    };
    expect(Object.keys(json.frames).sort()).toEqual([...atlas.frames].sort());
  });
});

describe('staleness logic on a scratch tree (TECH 2R.6)', () => {
  function tree(svg: string): { root: string; out: string } {
    const root = mkdtempSync(join(tmpdir(), 'mu-assets-'));
    mkdirSync(join(root, 'public', 'art', 'icon'), { recursive: true });
    mkdirSync(join(root, 'public', 'assets', 'v2'), { recursive: true });
    writeFileSync(join(root, 'public', 'art', 'icon', 'icon_coin.svg'), svg);
    return { root, out: join(root, 'public', 'assets', 'v2') };
  }

  it('TECH 2R.6 a changed SVG, a missing output and a vanished SVG are each reported', () => {
    const { root, out } = tree('<svg/>');
    const sources = readSvgSources(root);
    expect(sources.map((s) => [s.path, s.id, s.sha1])).toEqual([
      ['public/art/icon/icon_coin.svg', 'icon_coin', sha1('<svg/>')],
    ]);
    const m = emptyManifest();
    m.atlases['icons_v2'] = {
      file: 'icons_v2.webp',
      json: 'icons_v2.json',
      w: 512,
      h: 128,
      bytes: 3,
      jsonBytes: 2,
      group: 'P1',
      frames: ['icon_coin'],
    };
    m.assets['icon_coin'] = {
      atlas: 'icons_v2',
      w: 128,
      h: 128,
      bytes: 0,
      srcSha1: 'old',
      group: 'P1',
      status: 'ok',
    };
    m.assets['icon_star'] = {
      atlas: 'icons_v2',
      w: 128,
      h: 128,
      bytes: 0,
      srcSha1: 'x',
      group: 'P1',
      status: 'ok',
    };
    writeFileSync(join(out, 'icons_v2.webp'), 'abc');
    const p = stalenessProblems(sources, m, out);
    expect(p.join('\n')).toMatch(/icon_coin\.svg: changed/);
    expect(p.join('\n')).toMatch(/icon_star: in the manifest but its SVG is gone/);
    expect(p.join('\n')).toMatch(/icons_v2\.json: missing output/);
    m.assets['icon_coin'] = {
      ...m.assets['icon_coin'],
      srcSha1: sha1('<svg/>'),
    } as (typeof m.assets)[string];
    delete m.assets['icon_star'];
    writeFileSync(join(out, 'icons_v2.json'), '{}');
    expect(stalenessProblems(sources, m, out)).toEqual([]);
  });

  it('TECH 2R.6 an SVG outside the catalogue is "unknown" and must be listed as such in the manifest', () => {
    const { root, out } = tree('<svg/>');
    writeFileSync(join(root, 'public', 'art', 'icon', 'icon_mystery.svg'), '<svg/>');
    const sources = readSvgSources(root);
    const mystery = sources.find((s) => s.id === 'icon_mystery');
    expect(mystery && defOf(mystery)).toBeNull();
    expect(mystery && staticProblems(mystery).join()).toMatch(/unknown asset/);
    const m = emptyManifest();
    m.assets['icon_coin'] = {
      w: 128,
      h: 128,
      bytes: 0,
      srcSha1: sha1('<svg/>'),
      group: 'P1',
      status: 'rejected',
      errors: ['x'],
    };
    expect(stalenessProblems(sources, m, out).join()).toMatch(/icon_mystery\.svg: not in the manifest/);
    m.unknown.push({ path: 'public/art/icon/icon_mystery.svg', srcSha1: sha1('<svg/>') });
    expect(stalenessProblems(sources, m, out)).toEqual([]);
  });

  it('TECH 2R.13 budget problems name the exceeded budget', () => {
    expect(budgetProblems({ download: BUDGET.downloadBytes + 1, texture: 0 }).join()).toMatch(/download/);
    expect(budgetProblems({ download: 0, texture: BUDGET.textureBytes + 1 }).join()).toMatch(/texture/);
  });

  it('TECH 2R.6 icon atlas JSON is a Phaser JSON Hash with 128 px frames in 4 columns', () => {
    const json = iconAtlasJson(
      ['icon_coin', 'icon_life', 'icon_star', 'icon_moves', 'icon_lock'],
      'icons_v2.webp',
    ) as {
      frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
      meta: { size: { w: number; h: number } };
    };
    expect(json.frames['icon_lock']?.frame).toEqual({ x: 0, y: 128, w: 128, h: 128 });
    expect(json.meta.size).toEqual({ w: 512, h: 256 });
  });
});
