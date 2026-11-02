/**
 * The shipped levels 1–10 (`levels/level_001…010.json`, D-099 level round, `schemaVersion` 2 = K-55 fixed yard) against the
 * validator, the mechanic signatures (OBSTACLES "Veri imzası", K-45/10) and the LEVELS §6.6 Tablo A rows (P4B-01). The Faz 2R
 * levels they replaced are the archive tests/fixtures/levels-2r/ and are checked in tests/level/drafts.test.ts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { geoFromLevel } from '../../src/core/geometry.ts';
import { validateLevelJson } from '../../src/core/level/logic.ts';
import { deriveMechanics, isCargo } from '../../src/core/level/mechanics.ts';
import { LevelSchema, schemaVersionOf } from '../../src/core/level/schema.ts';
import type { LevelData, MechanicId } from '../../src/core/level/schema.ts';
import { shapeById } from '../../src/core/shapes.ts';
import { loadBoosterUnlock } from '../../tools/lib/levels.ts';

const ROOT = join(import.meta.dirname, '..', '..');
const LEVELS_MD = readFileSync(join(ROOT, 'docs', 'LEVELS.md'), 'utf8');
const IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const raw = (n: number): unknown =>
  JSON.parse(readFileSync(join(ROOT, 'levels', `level_${String(n).padStart(3, '0')}.json`), 'utf8'));
const parsed = (n: number): LevelData => LevelSchema.parse(raw(n));

/** LEVELS §6.6 "Tablo A" rows by level number: the cells of the table. */
function tableARows(): Map<number, string[]> {
  const start = LEVELS_MD.indexOf('**Tablo A');
  const end = LEVELS_MD.indexOf('\n\n', LEVELS_MD.indexOf('| 10 |', start));
  const out = new Map<number, string[]>();
  for (const line of LEVELS_MD.slice(start, end).split('\n')) {
    const m = /^\| (\d+) \|/.exec(line);
    if (m)
      out.set(
        Number(m[1]),
        line
          .split('|')
          .map((c) => c.trim())
          .slice(1, -1),
      );
  }
  return out;
}

describe('K-55 shipped levels 1–10 (schemaVersion 2)', () => {
  it('K-55 K-45 every shipped level is schemaVersion 2 and passes every validate check (mechanic history, booster unlocks)', () => {
    const previous = new Set<MechanicId>();
    for (const n of IDS) {
      expect(schemaVersionOf(parsed(n)), `level ${n}`).toBe(2);
      const issues = validateLevelJson(raw(n), {
        fileId: n,
        previousMechanics: previous,
        boosterUnlock: loadBoosterUnlock() ?? undefined,
      }).issues;
      expect(issues, `level ${n}`).toEqual([]);
      for (const m of deriveMechanics(parsed(n))) previous.add(m);
    }
  });

  it('K-55 every block is in the yard from the start: one batch for segment 0, no dropColumns, two floors', () => {
    for (const n of IDS) {
      const lvl = parsed(n);
      expect(lvl.yard.batches, `level ${n}`).toHaveLength(1);
      expect(lvl.yard.batches[0]?.forSegment, `level ${n}`).toBe(0);
      expect(lvl.yard.batches[0]?.dropColumns, `level ${n}`).toBeUndefined();
      expect(lvl.build.segments.length, `level ${n} floors`).toBeGreaterThanOrEqual(2);
    }
  });

  it('K-45/10 the derived new mechanics are 1 → S1, 4 → W1, 6 → W2, 8 → Y5, 9 → W3 and match `teaches` (D-099, LEVELS §6.6)', () => {
    const seen = new Set<MechanicId>();
    const fresh: Record<number, MechanicId[]> = {};
    for (const n of IDS) {
      const lvl = parsed(n);
      fresh[n] = deriveMechanics(lvl).filter((m) => !seen.has(m));
      for (const m of deriveMechanics(lvl)) seen.add(m);
      expect(lvl.teaches, `level ${n} teaches`).toBe(fresh[n]?.[0]);
    }
    expect(fresh).toEqual({
      1: ['S1'],
      2: [],
      3: [],
      4: ['W1'],
      5: [],
      6: ['W2'],
      7: [],
      8: ['Y5'],
      9: ['W3'],
      10: [],
    });
  });

  it('K-49 K-02 K-47 each shipped level matches its LEVELS §6.6 Tablo A row: name, difficulty, sizes, H, wall, gap, E, colours, shapes, N', () => {
    const rows = tableARows();
    expect([...rows.keys()]).toEqual(IDS);
    const difficulty: Record<string, string> = {
      Kolay: 'easy',
      Normal: 'normal',
      Zor: 'hard',
      'Çok Zor': 'superhard',
    };
    for (const n of IDS) {
      const row = rows.get(n) ?? [];
      const lvl = parsed(n);
      const geo = geoFromLevel(lvl);
      const pieces = lvl.yard.batches.flatMap((b) => b.pieces);
      const material = pieces.filter((p) => !isCargo(shapeById(p.shape)));
      const filled = pieces.reduce((s, p) => s + shapeById(p.shape).cellCount, 0);
      expect(row[1], `level ${n} name`).toBe(`${lvl.name.tr} / ${lvl.name.en}`);
      const label = (row[2] ?? '').replace(/\*/g, '').replace(/ \(.*\)/, '');
      expect(difficulty[label], `level ${n} difficulty`).toBe(lvl.difficulty);
      expect(row[6], `level ${n} yard`).toBe(`${geo.wy}×${geo.hy}`);
      expect(
        row[7]?.startsWith(`${geo.ws}×${geo.hs} × ${lvl.build.segments.length}`),
        `level ${n} site: ${row[7]}`,
      ).toBe(true);
      const [h, wall, gap] = (row[8] ?? '').split(' / ');
      expect([h, wall], `level ${n} H / wall`).toEqual([String(geo.h), String(lvl.wall.height)]);
      const g = lvl.wall.gaps[0];
      expect(gap, `level ${n} gap`).toBe(g === undefined ? '—' : `y${g.y} boy ${g.size}`);
      expect(Number(row[9]), `level ${n} E`).toBe(geo.wy * geo.hy - filled);
      expect(row[10]?.split(', ').sort().join(', '), `level ${n} colours`).toBe(
        [...new Set(material.map((p) => p.color))].sort().join(', '),
      );
      expect(row[11]?.split(', ').sort().join(', '), `level ${n} shapes`).toBe(
        [...new Set(pieces.map((p) => p.shape.split('_')[0] as string))].sort().join(', '),
      );
      expect(Number(row[12]), `level ${n} N`).toBe(material.length);
    }
  });
});
