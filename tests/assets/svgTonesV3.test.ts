/**
 * design-lead's SVG v3 tone table (`check.svgTonesV3`; ART_REFERENCE §6.2, ART §17; REVIEW_LOG "SVG v3 paketi"
 * 2026-10-20): the derived tones the `public/art` SVGs use. Its `_doc` states the invariant "only tones that occur in an
 * SVG file are listed" (the scratch generator rewrites the table) and `services/assetCatalog.paletteOf` relies on the
 * table to accept those tones in the static palette check — both are pinned here. The schema side (`#RRGGBB` only,
 * named boot error, `SVG_TONES_V3`) is tests/theme/tokens.test.ts (TECH 2R.7).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import rawTokens from '../../src/theme/tokens.json' with { type: 'json' };
import { inPalette, paletteOf } from '../../src/services/assetCatalog.ts';
import { SVG_TONES_V3 } from '../../src/theme/tokens.ts';

const ROOT = join(import.meta.dirname, '..', '..');

function svgFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? svgFiles(join(dir, e.name)) : e.name.endsWith('.svg') ? [join(dir, e.name)] : [],
  );
}

describe('SVG v3 tone table (ART_REFERENCE 6.2; tokens check.svgTonesV3)', () => {
  const files = svgFiles(join(ROOT, 'public/art'));
  const corpus = files.map((f) => readFileSync(f, 'utf8').toUpperCase()).join('\n');

  it('ART_REFERENCE 6.2 every listed tone occurs in at least one public/art SVG (design-lead invariant: no stale tones)', () => {
    expect(files.length).toBeGreaterThanOrEqual(41);
    const stale: string[] = [];
    for (const [group, tones] of Object.entries(SVG_TONES_V3))
      for (const [name, hex] of Object.entries(tones))
        if (!corpus.includes(hex.toUpperCase())) stale.push(`${group}.${name}=${hex}`);
    expect(stale).toEqual([]);
  });

  it('ASSET 16.2 the static palette check accepts every listed tone (paletteOf walks check.svgTonesV3)', () => {
    const palette = paletteOf(rawTokens);
    const rejected: string[] = [];
    for (const [group, tones] of Object.entries(SVG_TONES_V3))
      for (const [name, hex] of Object.entries(tones))
        if (!inPalette(hex, palette)) rejected.push(`${group}.${name}`);
    expect(rejected).toEqual([]);
  });
});
