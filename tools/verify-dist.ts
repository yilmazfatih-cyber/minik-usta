/**
 * `npm run build:verify` (part of `npm run build`): the production bundle in dist/ must not contain the debug panel
 * or the Playwright harness (R-20, TECH_DESIGN §12.2–§12.3), and it must fit the download budgets of TECH §2R.6 /
 * §2R.13: the v2 art in `dist/assets/v2` ≤ 1 MB, and the first load (the JS chunks `index.html` loads, gzip, + the
 * preloaded font) ≤ 620 KB. Exit 1 when a marker is found or a budget is exceeded.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const TEXT_EXTENSIONS = ['.js', '.mjs', '.html', '.css', '.json', '.map', '.txt', '.webmanifest'];

/** Content markers that only debug/harness code produces (generic words like "debug" also occur inside Phaser). */
const CONTENT_MARKERS: readonly { pattern: RegExp; why: string }[] = [
  { pattern: /__debug/, why: '__debug global' },
  { pattern: /__harness/, why: '__harness global' },
  { pattern: /src\/debug\//, why: 'src/debug module path' },
  { pattern: /src\/harness\//, why: 'src/harness module path' },
  { pattern: /\.get\(\s*["']debug["']\s*\)/, why: '?debug query handler' },
  { pattern: /\.get\(\s*["']harness["']\s*\)/, why: '?harness query handler' },
  { pattern: /[?&]debug=1/, why: '?debug=1 handler' },
];

/** File-name markers: a chunk named after the debug panel or harness. */
const NAME_MARKER = /(^|[/\\._-])(debug|harness)([/\\._-]|$)/i;

function walk(dir: string, out: string[]): void {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
}

/** TECH §2R.6: `dist/assets/v2` (v2 art rasters + atlas + manifest) ≤ 1 MB. */
export const ART_DIST_BUDGET = 1024 * 1024;
/** TECH §2R.6: first load = index JS gzip + font ≤ 620 KB (2026-10-07: 501 KB + 38 KB). */
export const FIRST_LOAD_BUDGET = 620 * 1024;

function dirBytes(dir: string): number {
  if (!existsSync(dir)) return 0;
  const files: string[] = [];
  walk(dir, files);
  return files.reduce((n, f) => n + statSync(f).size, 0);
}

/**
 * Bytes of the first load: every `<script src>` / `modulepreload` / `stylesheet` of dist/index.html gzip-compressed,
 * plus the preloaded fonts as they are (WOFF2 is already compressed).
 */
export function firstLoadBytes(dist: string): { total: number; parts: string[] } {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const parts: string[] = [];
  let total = 0;
  const seen = new Set<string>();
  const refs = [
    ...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g),
    ...html.matchAll(/<link[^>]*rel="(?:modulepreload|stylesheet|preload)"[^>]*href="([^"]+)"/g),
    ...html.matchAll(/<link[^>]*href="([^"]+)"[^>]*rel="(?:modulepreload|stylesheet|preload)"/g),
  ];
  for (const m of refs) {
    const url = (m[1] ?? '').replace(/^\.?\//, '');
    if (!url || seen.has(url) || /^(?:https?:|data:)/.test(url)) continue;
    seen.add(url);
    const p = join(dist, url);
    if (!existsSync(p)) continue;
    const buf = readFileSync(p);
    const bytes = /\.(?:woff2?|webp|png|jpg)$/.test(url) ? buf.length : gzipSync(buf, { level: 9 }).length;
    total += bytes;
    parts.push(`${url} ${(bytes / 1024).toFixed(1)} KB`);
  }
  return { total, parts };
}

function main(): number {
  let files: string[] = [];
  try {
    walk(DIST, files);
  } catch {
    process.stderr.write(`verify-dist: ${DIST}/ not found; run "vite build" first.\n`);
    return 1;
  }
  files = files.sort();
  const problems: string[] = [];
  for (const file of files) {
    const rel = relative(DIST, file);
    if (NAME_MARKER.test(rel)) problems.push(`${rel}: file name looks like a debug/harness chunk`);
    if (!TEXT_EXTENSIONS.some((ext) => file.endsWith(ext))) continue;
    const text = readFileSync(file, 'utf8');
    for (const marker of CONTENT_MARKERS) {
      if (marker.pattern.test(text)) problems.push(`${rel}: contains ${marker.why}`);
    }
  }
  const art = dirBytes(join(DIST, 'assets', 'v2'));
  if (art > ART_DIST_BUDGET) problems.push(`assets/v2: ${art} B > ${ART_DIST_BUDGET} B (TECH §2R.6)`);
  const first = firstLoadBytes(DIST);
  if (first.total > FIRST_LOAD_BUDGET) {
    problems.push(
      `first load ${first.total} B > ${FIRST_LOAD_BUDGET} B (TECH §2R.6): ${first.parts.join(', ')}`,
    );
  }
  process.stdout.write(
    `verify-dist: v2 art ${(art / 1024).toFixed(1)} KB / ${ART_DIST_BUDGET / 1024} KB, first load ${(first.total / 1024).toFixed(1)} KB / ${FIRST_LOAD_BUDGET / 1024} KB (${first.parts.join(', ')})\n`,
  );
  if (problems.length > 0) {
    process.stderr.write(`verify-dist: ${problems.length} problem(s) in ${DIST}/ (R-20, TECH §2R.6)\n`);
    for (const p of problems) process.stderr.write(`  ${p}\n`);
    return 1;
  }
  process.stdout.write(`verify-dist: ${files.length} files in ${DIST}/, no debug/harness code (R-20)\n`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exitCode = main();
