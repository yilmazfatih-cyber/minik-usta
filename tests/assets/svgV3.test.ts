/**
 * The code-lead side of design-lead's SVG v3 package (REVIEW_LOG 2026-10-20; ASSET_LIST §16.3 "Ek (2026-10-20, SVG
 * v3)"; UX §1.1, §4.1): the loading screen's eight bricks are the four `brick_fly_*` SVGs twice, loaded as group P0 on
 * the boot scene's own request — awaited with the font for at most `BOOT_ART_WAIT_MS` since the boot pack
 * (ART_REFERENCE §9.1 v1.1, DS3-01), the fallbacks only when the art cannot come; the level-start window's third slot
 * carries `icon_shutter` and the selected slot's ✓ is `icon_check`; the procedural fallbacks cover both.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BOOT_ART_WAIT_MS, BRICK_FLY_IDS } from '../../src/services/assetCatalog.ts';
import { ICON_NAMES } from '../../src/theme/draw/kitIcons.ts';
import { TOKENS } from '../../src/theme/tokens.ts';
import { BRICK_FLY_FALLBACK, fallbackArt, iconFallbackFrames } from '../../src/theme/textures.ts';
import { createRecorder } from '../theme/recordingContext.ts';

const ROOT = join(import.meta.dirname, '..', '..');
const src = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8');

describe('SVG v3 package — code-lead side (ASSET 16.3 ek 2026-10-20)', () => {
  it('UX 1.1 the boot scene rings the logo with the four P0 bricks twice; P0 is the boot pack, awaited with the font for at most BOOT_ART_WAIT_MS (ART_REFERENCE 9.1 v1.1)', () => {
    const boot = src('src/scenes/BootScene.ts');
    // the bounded wait: `Promise.race([loadGroup('P0'), timeout])` inside the `Promise.all` with the font wait
    expect(boot).toMatch(
      /Promise\.race\(\[\s*assets\.loadGroup\('P0'\),\s*new Promise<void>\(\(resolve\) => setTimeout\(resolve, BOOT_ART_WAIT_MS\)\),?\s*\]\)/,
    );
    expect(boot).toMatch(/await Promise\.all\(\[\s*waitForFont\(\),/);
    expect(boot).not.toMatch(/await assets\.loadGroup\('P0'\)/); // never unbounded
    // every image of the screen waits for its raster (no skeleton on the loading screen)
    expect(boot.match(/waitArt: true/g)?.length).toBe(5); // bricks (one site), Dede, Tuna, Kepçe, emblem
    expect(BOOT_ART_WAIT_MS).toBeLessThanOrEqual(1500); // never longer than the font wait
    // 8 ring entries = each SVG exactly twice (ASSET §16.3 ek "8 kopya"); ±30° tilts; far bricks 0,7 / α 0,85
    const rows = [...boot.matchAll(/^\s+\[(-?\d+), ([\d.]+), (-?\d+), '(brick_fly_\w+)'\],$/gm)];
    expect(rows).toHaveLength(8);
    const counts = new Map<string, number>();
    for (const r of rows) {
      counts.set(r[4] ?? '', (counts.get(r[4] ?? '') ?? 0) + 1);
      expect(Math.abs(Number(r[3])), r[0]).toBeLessThanOrEqual(30);
      expect(Number(r[2])).toBeGreaterThan(0);
      expect(Number(r[2])).toBeLessThanOrEqual(1);
    }
    expect([...counts.entries()].sort()).toEqual(BRICK_FLY_IDS.map((id) => [id, 2]).sort());
    expect(boot).toMatch(/\.setScale\(far \? 0\.7 : 1\)/);
    expect(boot).toMatch(/\.setAlpha\(far \? 0\.85 : 1\)/);
    // each brick is an ArtImage (art ↔ fallback cross-fade) inside a container so the tilt turns its centre
    expect(boot).toMatch(
      /ArtImage\.create\(\s*this,\s*assets,\s*id,\s*\{ x: -px \/ 2, y: -px \/ 2, w: px, h: px \}/,
    );
    expect(boot).toMatch(/root\.add\(art\.image\);/);
    expect(boot).not.toMatch(/boot_bricks_v3|bakeBricks/);
  });

  it('ASSET 16.3 ek the brick fallbacks are the v2 blocks of the SVG stud layouts and draw deterministically at 200 × 200', () => {
    expect(BRICK_FLY_FALLBACK).toEqual({
      brick_fly_o: { shape: 'O4_0', color: 'R' },
      brick_fly_i2: { shape: 'D2_0', color: 'B' },
      brick_fly_l3: { shape: 'C3_0', color: 'Y' },
      brick_fly_1: { shape: 'B1_0', color: 'G' },
    });
    for (const id of BRICK_FLY_IDS) {
      const fb = fallbackArt(id, { w: 200, h: 200 }, TOKENS);
      expect(fb).toMatchObject({ w: 200, h: 200 });
      const a = createRecorder();
      const b = createRecorder();
      fb?.draw(a.ctx);
      fb?.draw(b.ctx);
      expect(a.ops).toEqual(b.ops);
      expect(a.ops.length).toBeGreaterThan(0);
      expect(a.depth()).toBe(0);
    }
  });

  it('UX 4.1 the level-start window: slot 3 = icon_shutter, the selected ✓ = icon_check (40 px), both with procedural frames', () => {
    // the window imports Phaser: its slot → icon table is read from the source (vitest runs engine-free)
    const win = src('src/ui/LevelStartWindow.ts');
    expect(win).toMatch(
      /PRE_SLOT_ICON[^}]*\{\s+thermos: 'icon_thermos',\s+trowelStart: 'icon_gold_trowel',\s+openShutter: 'icon_shutter',\s+\}/,
    );
    expect(win).toMatch(/const CHECK_ICON = 'icon_check';\s+const CHECK_PX = 40;/);
    // visual v3 package B: the ✓ sits on a white Ø 56 disc riding the square's upper-right corner
    expect(win).toMatch(/const CHECK_DISC_PX = 56;/);
    expect(win).toMatch(/this\.icons\.add\(scene, 0, 0, CHECK_ICON, CHECK_PX\)/);
    expect(win).toMatch(/scene\.add\.container\(px \/ 2 - 10, -px \/ 2 \+ 10, \[okDisc, okIcon\]\)/);
    expect(win).not.toMatch(/drawOk/);
    expect(ICON_NAMES).toContain('shutter');
    expect(ICON_NAMES).toContain('check');
    const frames = iconFallbackFrames(TOKENS).map((f) => f.name);
    expect(frames).toContain('icon_shutter');
    expect(frames).toContain('icon_check');
  });
});
