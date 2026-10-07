/**
 * `npm run assets` — the v2 art pipeline (docs/TECH_DESIGN.md §2R.6; ASSET_LIST §16; R2-08: no paid tool, no AI, no new
 * dependency). design-lead writes SVG by hand under `public/art/<category>/<id>.svg`; this tool
 *   1. checks every SVG (static text checks of src/services/assetCatalog.ts `checkSvg` + a DOMParser pass in the
 *      preinstalled Chromium: forbidden elements, external href, parse errors),
 *   2. rasterises the passing ones at their ASSET §16.3 size in Chromium Canvas2D (`<img>` → `decode()` →
 *      `drawImage` → `toBlob('image/webp', 0.80)`), plus the structure's blueprint ghost (ART §7.2),
 *   3. packs the passing icons into `icons_v2.webp` + a Phaser JSON Hash (`icons_v2.json`),
 *   4. writes `public/assets/v2/manifest.json` (`srcSha1` per SVG → the staleness gate) and removes stale outputs,
 *   5. checks the budgets (download ≤ 900 KB, texture estimate ≤ 64 MB).
 * Exit 1 when an SVG is rejected, unknown, or a budget is exceeded (the rejected art falls back to the procedural one
 * in the game; the outputs of the others are still written).
 *
 * `--check` (part of `npm run build`, no Chromium): the outputs are up to date with the SVGs (sha1), every output file
 * exists with its recorded size, and the budgets hold. The raster outputs are committed, so CI and GitHub Pages never
 * need Chromium (TECH §2R.6 "Raster çıktıları depoya girdiği için …").
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import tokens from '../src/theme/tokens.json' with { type: 'json' };
import {
  ASSET_BY_ID,
  ASSET_CATALOG,
  BUDGET,
  ICON_ATLAS_KEY,
  ICON_SIZE,
  MANIFEST_FILE,
  MANIFEST_VERSION,
  OUT_DIR,
  checkSvg,
  emptyManifest,
  iconAtlasSize,
  iconSlot,
  idOfSvgPath,
  paletteOf,
  parseManifest,
  textureBytes,
} from '../src/services/assetCatalog.ts';
import type { AssetDef, Manifest, ManifestEntry } from '../src/services/assetCatalog.ts';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, OUT_DIR);
const CHROMIUM_PATH = '/opt/pw-browsers/chromium';
/** TECH §2R.6 step 2: WebP quality. */
export const WEBP_QUALITY = 0.8;

export interface SvgSource {
  /** Repo-relative path with `/`. */
  readonly path: string;
  readonly category: string;
  readonly id: string;
  readonly text: string;
  readonly bytes: number;
  readonly sha1: string;
}

export const sha1 = (buf: Buffer | string): string => createHash('sha1').update(buf).digest('hex');

/** Every `*.svg` under `public/art`, sorted by path. */
export function readSvgSources(root = ROOT): SvgSource[] {
  const dir = join(root, 'public', 'art');
  const out: SvgSource[] = [];
  if (!existsSync(dir)) return out;
  const walk = (d: string): void => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith('.svg')) {
        const buf = readFileSync(p);
        const rel = relative(root, p).replace(/\\/g, '/');
        const parsed = idOfSvgPath(rel);
        out.push({
          path: rel,
          category: parsed?.category ?? '',
          id: parsed?.id ?? name.replace(/\.svg$/, ''),
          text: buf.toString('utf8'),
          bytes: buf.length,
          sha1: sha1(buf),
        });
      }
    }
  };
  walk(dir);
  return out;
}

const checkContext = () => ({
  palette: paletteOf(tokens),
  characterColors: (tokens as unknown as { color: { character: Record<string, Record<string, string>> } })
    .color.character,
});

/** The catalogue entry of a source, or null (unknown id or wrong folder). */
export function defOf(src: SvgSource): AssetDef | null {
  const def = ASSET_BY_ID.get(src.id);
  return def && def.category === src.category ? def : null;
}

/** Static (Chromium-free) problems of one source. */
export function staticProblems(src: SvgSource): string[] {
  const def = defOf(src);
  if (!def) return [`unknown asset: ${src.path} is not an ASSET §16.3 id in its folder`];
  return checkSvg(def, src.text, src.bytes, checkContext());
}

/**
 * The staleness gate (TECH §2R.6 step 5): what is out of date between the SVG sources, the manifest and the output
 * files. Empty = up to date. Used by `--check`, `npm run build` and tests/assets/manifest.test.ts.
 */
export function stalenessProblems(sources: readonly SvgSource[], manifest: Manifest, outDir = OUT): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const src of sources) {
    const def = defOf(src);
    if (!def) {
      const u = manifest.unknown.find((x) => x.path === src.path);
      if (!u || u.srcSha1 !== src.sha1) problems.push(`${src.path}: not in the manifest`);
      continue;
    }
    seen.add(def.id);
    const e = manifest.assets[def.id];
    if (!e) problems.push(`${src.path}: not in the manifest`);
    else if (e.srcSha1 !== src.sha1) problems.push(`${src.path}: changed since the last raster (sha1)`);
  }
  for (const [id, e] of Object.entries(manifest.assets)) {
    if (e.srcSha1 !== undefined && !seen.has(id)) problems.push(`${id}: in the manifest but its SVG is gone`);
  }
  for (const u of manifest.unknown) {
    if (!sources.some((s) => s.path === u.path))
      problems.push(`${u.path}: in the manifest but the file is gone`);
  }
  const files: { file: string; bytes: number }[] = [];
  for (const e of Object.values(manifest.assets))
    if (e.status === 'ok' && e.file) files.push({ file: e.file, bytes: e.bytes });
  for (const a of Object.values(manifest.atlases)) {
    files.push({ file: a.file, bytes: a.bytes }, { file: a.json, bytes: a.jsonBytes });
  }
  for (const f of files) {
    const p = join(outDir, f.file);
    if (!existsSync(p)) problems.push(`${OUT_DIR}/${f.file}: missing output`);
    else if (statSync(p).size !== f.bytes)
      problems.push(`${OUT_DIR}/${f.file}: size differs from the manifest`);
  }
  return problems;
}

/** Download bytes (outputs + manifest) and texture estimate of a manifest (TECH §2R.13 budgets). */
export function budgetOf(manifest: Manifest, manifestBytes: number): { download: number; texture: number } {
  let download = manifestBytes;
  let texture = 0;
  for (const e of Object.values(manifest.assets)) {
    if (e.status !== 'ok' || !e.file) continue;
    download += e.bytes;
    texture += textureBytes(e);
  }
  for (const a of Object.values(manifest.atlases)) {
    download += a.bytes + a.jsonBytes;
    texture += textureBytes(a);
  }
  return { download, texture };
}

export function budgetProblems(b: { download: number; texture: number }): string[] {
  const out: string[] = [];
  if (b.download > BUDGET.downloadBytes)
    out.push(`download ${b.download} B > ${BUDGET.downloadBytes} B (TECH §2R.13)`);
  if (b.texture > BUDGET.textureBytes)
    out.push(`texture memory ${b.texture} B > ${BUDGET.textureBytes} B (TECH §2R.13)`);
  return out;
}

export function readManifest(outDir = OUT): { manifest: Manifest; bytes: number } | null {
  const p = join(outDir, MANIFEST_FILE);
  if (!existsSync(p)) return null;
  const text = readFileSync(p, 'utf8');
  return { manifest: parseManifest(JSON.parse(text)), bytes: Buffer.byteLength(text) };
}

/** Stable JSON (sorted object keys) so the manifest diff only shows real changes. */
export function stableJson(v: unknown): string {
  const sort = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(sort);
    if (x && typeof x === 'object') {
      return Object.fromEntries(
        Object.keys(x as Record<string, unknown>)
          .sort()
          .map((k) => [k, sort((x as Record<string, unknown>)[k])]),
      );
    }
    return x;
  };
  return `${JSON.stringify(sort(v), null, 2)}\n`;
}

// ---------------------------------------------------------------------------------------------------------------
// Chromium part

interface RasterJob {
  readonly name: string;
  readonly svg: string;
  readonly w: number;
  readonly h: number;
  /** ART §7.2 blueprint ghost of the structure instead of the image itself. */
  readonly ghost?: {
    readonly fill: string;
    readonly fillAlpha: number;
    readonly linePx: number;
    readonly lineAlpha: number;
    readonly dash: readonly [number, number];
  };
}

interface RasterResult {
  readonly name: string;
  readonly webp: string | null;
  readonly error: string | null;
}

/** Runs in the page: DOMParser checks of one SVG (TECH §2R.6 step 1, Chromium part). */
function domCheck(svg: string): string[] {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const errs: string[] = [];
  if (doc.querySelector('parsererror')) errs.push('SVG does not parse');
  for (const el of ['text', 'image', 'foreignObject', 'script', 'filter', 'mask']) {
    if (doc.getElementsByTagName(el).length > 0) errs.push(`forbidden element <${el}> (DOM)`);
  }
  for (const node of Array.from(doc.querySelectorAll('*'))) {
    for (const a of Array.from(node.attributes)) {
      if ((a.name === 'href' || a.name === 'xlink:href') && !a.value.startsWith('#'))
        errs.push(`external href (DOM)`);
      if (a.name.startsWith('on')) errs.push(`event handler ${a.name} (DOM)`);
    }
  }
  return errs;
}

/** Runs in the page: rasterises jobs to WebP (base64). */
async function rasterInPage(arg: { jobs: RasterJob[]; quality: number }): Promise<RasterResult[]> {
  const out: RasterResult[] = [];
  for (const job of arg.jobs) {
    try {
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(job.svg)}`;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = job.w;
      canvas.height = job.h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no 2d context');
      ctx.imageSmoothingQuality = 'high';
      if (!job.ghost) ctx.drawImage(img, 0, 0, job.w, job.h);
      else {
        const g = job.ghost;
        const sil = document.createElement('canvas');
        sil.width = job.w;
        sil.height = job.h;
        const s = sil.getContext('2d');
        if (!s) throw new Error('no 2d context');
        s.drawImage(img, 0, 0, job.w, job.h);
        s.globalCompositeOperation = 'source-in';
        s.fillStyle = '#FFFFFF';
        s.fillRect(0, 0, job.w, job.h);
        // fill: the silhouette in the blueprint colour
        const fill = document.createElement('canvas');
        fill.width = job.w;
        fill.height = job.h;
        const f = fill.getContext('2d');
        if (!f) throw new Error('no 2d context');
        f.drawImage(sil, 0, 0);
        f.globalCompositeOperation = 'source-in';
        f.fillStyle = g.fill;
        f.fillRect(0, 0, job.w, job.h);
        ctx.globalAlpha = g.fillAlpha;
        ctx.drawImage(fill, 0, 0);
        ctx.globalAlpha = 1;
        // contour: the silhouette grown by linePx minus itself, dashed by a diagonal stripe pattern
        const ring = document.createElement('canvas');
        ring.width = job.w;
        ring.height = job.h;
        const r = ring.getContext('2d');
        if (!r) throw new Error('no 2d context');
        for (let a = 0; a < 16; a++) {
          const t = (a / 16) * Math.PI * 2;
          r.drawImage(sil, Math.cos(t) * g.linePx, Math.sin(t) * g.linePx);
        }
        r.globalCompositeOperation = 'destination-out';
        r.drawImage(sil, 0, 0);
        r.globalCompositeOperation = 'destination-in';
        const period = g.dash[0] + g.dash[1];
        const pat = document.createElement('canvas');
        pat.width = period;
        pat.height = period;
        const p = pat.getContext('2d');
        if (!p) throw new Error('no 2d context');
        for (let y = 0; y < period; y++) {
          for (let x = 0; x < period; x++) {
            if ((x + y) % period < g.dash[0]) p.fillRect(x, y, 1, 1);
          }
        }
        const pattern = r.createPattern(pat, 'repeat');
        if (pattern) {
          r.fillStyle = pattern;
          r.fillRect(0, 0, job.w, job.h);
        }
        ctx.globalAlpha = g.lineAlpha;
        ctx.drawImage(ring, 0, 0);
        ctx.globalAlpha = 1;
      }
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', arg.quality));
      if (!blob || blob.type !== 'image/webp') throw new Error('WebP encoding failed');
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000)
        bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      out.push({ name: job.name, webp: btoa(bin), error: null });
    } catch (e) {
      out.push({ name: job.name, webp: null, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return out;
}

/** Runs in the page: packs icons (already checked) into one canvas → WebP. */
async function packIconsInPage(arg: {
  icons: { name: string; svg: string; x: number; y: number }[];
  w: number;
  h: number;
  size: number;
  quality: number;
}): Promise<{ webp: string | null; error: string | null; failed: string[] }> {
  const canvas = document.createElement('canvas');
  canvas.width = arg.w;
  canvas.height = arg.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { webp: null, error: 'no 2d context', failed: [] };
  const failed: string[] = [];
  for (const ic of arg.icons) {
    try {
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(ic.svg)}`;
      await img.decode();
      ctx.drawImage(img, ic.x, ic.y, arg.size, arg.size);
    } catch {
      failed.push(ic.name);
    }
  }
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', arg.quality));
  if (!blob) return { webp: null, error: 'WebP encoding failed', failed };
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { webp: btoa(bin), error: null, failed };
}

/** Phaser JSON Hash of the icon atlas. */
export function iconAtlasJson(names: readonly string[], image: string): unknown {
  const size = iconAtlasSize(names.length);
  const frames: Record<string, unknown> = {};
  names.forEach((name, i) => {
    const s = iconSlot(i);
    frames[name] = {
      frame: { x: s.x, y: s.y, w: ICON_SIZE, h: ICON_SIZE },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: ICON_SIZE, h: ICON_SIZE },
      sourceSize: { w: ICON_SIZE, h: ICON_SIZE },
    };
  });
  return { frames, meta: { app: 'minik-usta tools/assets.ts', image, format: 'RGBA8888', size, scale: '1' } };
}

async function build(sources: readonly SvgSource[]): Promise<{ manifest: Manifest; problems: string[] }> {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH, headless: true });
  const manifest = emptyManifest();
  const problems: string[] = [];
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><body></body></html>');
    const passing: { src: SvgSource; def: AssetDef }[] = [];
    for (const src of sources) {
      const def = defOf(src);
      const errs = staticProblems(src);
      if (!def) {
        manifest.unknown.push({ path: src.path, srcSha1: src.sha1 });
        problems.push(...errs);
        continue;
      }
      errs.push(...(await page.evaluate(domCheck, src.text)));
      if (errs.length > 0) {
        manifest.assets[def.id] = rejected(def, src, errs);
        problems.push(`${src.path}: ${errs.join('; ')}`);
      } else passing.push({ src, def });
    }

    const b = tokens.color.board;
    const jobs: RasterJob[] = [];
    for (const { src, def } of passing) {
      if (def.inAtlas) continue;
      jobs.push({ name: def.id, svg: src.text, w: def.raster.w, h: def.raster.h });
      if (def.ghost) {
        jobs.push({
          name: `${def.id}_ghost`,
          svg: src.text,
          w: def.raster.w,
          h: def.raster.h,
          ghost: { fill: b.blueprint, fillAlpha: 0.35, linePx: 4, lineAlpha: 0.9, dash: [16, 12] },
        });
      }
    }
    const results = await page.evaluate(rasterInPage, { jobs, quality: WEBP_QUALITY });
    const byName = new Map(results.map((r) => [r.name, r]));
    for (const { src, def } of passing) {
      if (def.inAtlas) continue;
      const names = def.ghost ? [def.id, `${def.id}_ghost`] : [def.id];
      const errs = names.map((n) => byName.get(n)?.error).filter((e): e is string => !!e);
      if (errs.length > 0) {
        manifest.assets[def.id] = rejected(def, src, errs);
        problems.push(`${src.path}: ${errs.join('; ')}`);
        continue;
      }
      for (const n of names) {
        const webp = Buffer.from(byName.get(n)?.webp ?? '', 'base64');
        const file = `${n}.webp`;
        writeFileSync(join(OUT, file), webp);
        manifest.assets[n] = {
          file,
          w: def.raster.w,
          h: def.raster.h,
          bytes: webp.length,
          ...(n === def.id ? { srcSha1: src.sha1 } : {}),
          group: def.group,
          status: 'ok',
        };
      }
    }

    // icon atlas: passing icons in catalogue order
    const iconOrder = ASSET_CATALOG.filter((d) => d.inAtlas).map((d) => d.id);
    const icons = passing
      .filter((p) => p.def.inAtlas)
      .sort((a, b2) => iconOrder.indexOf(a.def.id) - iconOrder.indexOf(b2.def.id));
    if (icons.length > 0) {
      const size = iconAtlasSize(icons.length);
      const packed = await page.evaluate(packIconsInPage, {
        icons: icons.map((ic, i) => ({ name: ic.def.id, svg: ic.src.text, ...iconSlot(i) })),
        w: size.w,
        h: size.h,
        size: ICON_SIZE,
        quality: WEBP_QUALITY,
      });
      if (!packed.webp || packed.failed.length > 0) {
        problems.push(`icon atlas: ${packed.error ?? `decode failed for ${packed.failed.join(', ')}`}`);
        for (const ic of icons) manifest.assets[ic.def.id] = rejected(ic.def, ic.src, ['icon atlas failed']);
      } else {
        const file = `${ICON_ATLAS_KEY}.webp`;
        const jsonFile = `${ICON_ATLAS_KEY}.json`;
        const webp = Buffer.from(packed.webp, 'base64');
        const json = stableJson(
          iconAtlasJson(
            icons.map((ic) => ic.def.id),
            file,
          ),
        );
        writeFileSync(join(OUT, file), webp);
        writeFileSync(join(OUT, jsonFile), json);
        manifest.atlases[ICON_ATLAS_KEY] = {
          file,
          json: jsonFile,
          w: size.w,
          h: size.h,
          bytes: webp.length,
          jsonBytes: Buffer.byteLength(json),
          group: 'P1',
          frames: icons.map((ic) => ic.def.id),
        };
        for (const ic of icons) {
          manifest.assets[ic.def.id] = {
            atlas: ICON_ATLAS_KEY,
            w: ICON_SIZE,
            h: ICON_SIZE,
            bytes: 0,
            srcSha1: ic.src.sha1,
            group: ic.def.group,
            status: 'ok',
          };
        }
      }
    }
  } finally {
    await browser.close();
  }
  return { manifest, problems };
}

function rejected(def: AssetDef, src: SvgSource, errors: string[]): ManifestEntry {
  return {
    w: def.raster.w,
    h: def.raster.h,
    bytes: 0,
    srcSha1: src.sha1,
    group: def.group,
    status: 'rejected',
    errors,
  };
}

/** Deletes output files the manifest no longer lists. */
function pruneOutputs(manifest: Manifest): string[] {
  const keep = new Set<string>([MANIFEST_FILE]);
  for (const e of Object.values(manifest.assets)) if (e.file) keep.add(e.file);
  for (const a of Object.values(manifest.atlases)) keep.add(a.file).add(a.json);
  const removed: string[] = [];
  for (const name of readdirSync(OUT)) {
    if (!keep.has(name)) {
      rmSync(join(OUT, name), { force: true });
      removed.push(name);
    }
  }
  return removed;
}

function log(s: string): void {
  process.stdout.write(`${s}\n`);
}

function check(): number {
  const sources = readSvgSources();
  const m = readManifest();
  if (!m) {
    if (sources.length === 0) {
      log('assets --check: no SVG under public/art and no manifest: nothing to do');
      return 0;
    }
    log(`assets --check: ${OUT_DIR}/${MANIFEST_FILE} missing; run "npm run assets"`);
    return 1;
  }
  const stale = stalenessProblems(sources, m.manifest);
  const budget = budgetOf(m.manifest, m.bytes);
  const over = budgetProblems(budget);
  const rejectedIds = Object.entries(m.manifest.assets).filter(([, e]) => e.status === 'rejected');
  for (const [id, e] of rejectedIds)
    log(`  warning: ${id} rejected (procedural fallback in game): ${(e.errors ?? []).join('; ')}`);
  for (const u of m.manifest.unknown) log(`  warning: ${u.path} is not in the ASSET §16.3 catalogue`);
  for (const p of [...stale, ...over]) log(`  ${p}`);
  if (stale.length > 0) log('assets --check: outputs are stale; run "npm run assets" (TECH §2R.6 step 5)');
  log(
    `assets --check: ${sources.length} SVG, download ${(budget.download / 1024).toFixed(1)} KB / ${BUDGET.downloadBytes / 1024} KB, textures ${(budget.texture / 1048576).toFixed(1)} MB / ${BUDGET.textureBytes / 1048576} MB`,
  );
  return stale.length + over.length > 0 ? 1 : 0;
}

async function main(args: readonly string[]): Promise<number> {
  if (args.includes('--check')) return check();
  const sources = readSvgSources();
  mkdirSync(OUT, { recursive: true });
  const t0 = Date.now();
  const { manifest, problems } =
    sources.length > 0 ? await build(sources) : { manifest: emptyManifest(), problems: [] };
  manifest.version = MANIFEST_VERSION;
  const text = stableJson(manifest);
  writeFileSync(join(OUT, MANIFEST_FILE), text);
  const removed = pruneOutputs(manifest);
  const budget = budgetOf(manifest, Buffer.byteLength(text));
  const over = budgetProblems(budget);
  const ok = Object.values(manifest.assets).filter((e) => e.status === 'ok').length;
  for (const p of [...problems, ...over]) log(`  ${p}`);
  if (removed.length > 0) log(`  removed stale outputs: ${removed.join(', ')}`);
  const missing = ASSET_CATALOG.filter(
    (d) => d.phase === '2R' && !d.optional && !(d.id in manifest.assets),
  ).map((d) => d.id);
  if (missing.length > 0) log(`  not yet drawn (procedural fallback): ${missing.join(', ')}`);
  log(
    `assets: ${sources.length} SVG → ${ok} ok, ${problems.length} problem(s); download ${(budget.download / 1024).toFixed(1)} KB / ${BUDGET.downloadBytes / 1024} KB, textures ${(budget.texture / 1048576).toFixed(1)} MB / ${BUDGET.textureBytes / 1048576} MB (${((Date.now() - t0) / 1000).toFixed(1)} s)`,
  );
  return problems.length + over.length > 0 ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = await main(process.argv.slice(2));
}
