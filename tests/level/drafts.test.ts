/**
 * Levels 1–10 in the Faz 2R format. WP-B accepted the LEVELS §2 drafts (tests/level/fixtures/levels-2r: "a level
 * written in the new format validates"); since WP-M the checks run on the real levels/level_001…010.json that
 * product-lead wrote from the solver round (LEVELS §2.11) and that replaced the drafts of Bölüm 4, 5, 7 and 10. They pin
 * that the validator accepts the levels, that each level matches its LEVELS §2 summary row and that the GDD
 * counter-examples are caught.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateLevelJson } from '../../src/core/level/logic.ts';
import type { Issue } from '../../src/core/level/logic.ts';
import { deriveMechanics, isCargo } from '../../src/core/level/mechanics.ts';
import { LevelSchema } from '../../src/core/level/schema.ts';
import type { LevelInput, MechanicId } from '../../src/core/level/schema.ts';
import { geoFromLevel } from '../../src/core/geometry.ts';
import { shapeById } from '../../src/core/shapes.ts';
import { loadBoosterUnlock } from '../../tools/lib/levels.ts';

const ROOT = join(import.meta.dirname, '..', '..');
const LEVELS = readFileSync(join(ROOT, 'docs', 'LEVELS.md'), 'utf8');
/** levels/level_NNN.json (a fresh copy: the counter-example tests change it). */
const draft = (n: number): LevelInput =>
  JSON.parse(readFileSync(join(ROOT, 'levels', `level_${String(n).padStart(3, '0')}.json`), 'utf8')) as LevelInput;
const IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const codes = (issues: readonly Issue[]): string[] => [...new Set(issues.map((i) => i.code))].sort();

/** Validates draft n with the mechanic history of drafts 1 … n − 1 (as `levels:validate` does). */
function validateDraft(n: number, json: unknown = draft(n)): Issue[] {
  const previous = new Set<MechanicId>();
  for (let k = 1; k < Math.min(n, 11); k++)
    for (const m of deriveMechanics(LevelSchema.parse(draft(k)))) previous.add(m);
  return validateLevelJson(json, {
    fileId: n,
    previousMechanics: previous,
    boosterUnlock: loadBoosterUnlock() ?? undefined,
  }).issues;
}

/** LEVELS §2 "Bölüm 1–10 özeti" rows by level number: the cells of the table. */
function summaryRows(): Map<number, string[]> {
  const start = LEVELS.indexOf('**Bölüm 1–10 özeti**');
  const end = LEVELS.indexOf('\n\n', LEVELS.indexOf('| 10 |', start));
  const out = new Map<number, string[]>();
  for (const line of LEVELS.slice(start, end).split('\n')) {
    const m = /^\| (\d+) \|/.exec(line);
    if (m)
      out.set(
        Number(m[1]),
        line.split('|').map((c) => c.trim()),
      );
  }
  return out;
}

describe('K-45 levels 1–10 (levels/*.json) in the Faz 2R format', () => {
  it('K-45 every level passes the schema and every validate check (mechanic history, booster unlocks)', () => {
    for (const n of IDS) expect(validateDraft(n), `level ${n}`).toEqual([]);
  });

  it('K-45/10 the derived new mechanics are 4 → W1, 5 → S1, 6 → W2, 8 → Y5, 9 → W3 (OBSTACLES "Veri imzası" Faz 2R)', () => {
    const seen = new Set<MechanicId>();
    const fresh: Record<number, MechanicId[]> = {};
    for (const n of IDS) {
      const lvl = LevelSchema.parse(draft(n));
      fresh[n] = deriveMechanics(lvl).filter((m) => !seen.has(m));
      for (const m of deriveMechanics(lvl)) seen.add(m);
      expect(lvl.teaches, `level ${n} teaches`).toBe(fresh[n]?.[0]);
    }
    expect(fresh).toEqual({
      1: [],
      2: [],
      3: [],
      4: ['W1'],
      5: ['S1'],
      6: ['W2'],
      7: [],
      8: ['Y5'],
      9: ['W3'],
      10: [],
    });
  });

  it('K-49 K-02 K-47 each level matches its LEVELS 2 summary row: sizes, H, wall, E, N, colours, moves', () => {
    const rows = summaryRows();
    expect([...rows.keys()]).toEqual(IDS);
    for (const n of IDS) {
      const row = rows.get(n) ?? [];
      const lvl = LevelSchema.parse(draft(n));
      const geo = geoFromLevel(lvl);
      const material = lvl.yard.batches.flatMap((b) => b.pieces).filter((p) => !isCargo(shapeById(p.shape)));
      const filled = (lvl.yard.batches[0]?.pieces ?? []).reduce(
        (s, p) => s + shapeById(p.shape).cellCount,
        0,
      );
      const colors = [...new Set(material.map((p) => p.color))].sort().join(', ');
      expect(row[5], `level ${n} yard`).toBe(`${geo.wy}×${geo.hy}`);
      expect(row[6], `level ${n} site`).toBe(`${geo.ws}×${geo.hs} × ${lvl.build.segments.length}`);
      expect(row[7]?.split(' / ').slice(0, 2), `level ${n} H / wall`).toEqual([
        String(geo.h),
        String(lvl.wall.height),
      ]);
      expect(row[8]?.split(', ').sort().join(', '), `level ${n} colours`).toBe(colors);
      expect(Number(row[10]), `level ${n} N`).toBe(material.length);
      expect(Number(row[11]), `level ${n} E`).toBe(geo.wy * geo.hy - filled);
      expect(row[18], `level ${n} moves`).toBe(`**${lvl.moves}**`);
    }
  });

  it('GDD 14.1/1 every level textKey is a key of LEVELS 2.0 item 8 (STORY 6A tut.m.*)', () => {
    const start = LEVELS.indexOf('8. **Metin anahtarları');
    const section = LEVELS.slice(start, LEVELS.indexOf('**Bölüm 1–10 özeti**', start));
    const listed = new Set([...section.matchAll(/`(tut\.[a-z]+\.[A-Za-z]+)`/g)].map((m) => m[1]));
    for (const n of IDS)
      for (const st of draft(n).tutorial ?? [])
        expect(listed.has(st.textKey), `level ${n} ${st.textKey}`).toBe(true);
  });
});

describe('K-45 GDD counter-examples on levels 1–10', () => {
  it('K-47 GDD example level 3: one more D2_90 Y makes the Y supply 6 > 4: cover_mismatch', () => {
    const json = draft(3);
    json.yard.batches[0]?.pieces.push({ shape: 'D2_90', color: 'Y', x: 2, y: 1 });
    expect(codes(validateDraft(3, json))).toEqual(['cover_mismatch']);
  });

  it('K-45 GDD example level 2: one B1 more keeps E = 5 in the band but supply 11 > 10: cover_mismatch', () => {
    const json = draft(2);
    json.yard.batches[0]?.pieces.push({ shape: 'B1_0', color: 'W', x: 0, y: 2 });
    expect(codes(validateDraft(2, json))).toEqual(['cover_mismatch']);
  });

  it('K-45/3 GDD example level 9: the narrow gap moved to y = 3 is gap_touches_top (3 + 1 > height − 1)', () => {
    const json = draft(9);
    json.wall.gaps = [{ type: 'static', y: 3, size: 1 }];
    expect(codes(validateDraft(9, json))).toEqual(['gap_touches_top']);
  });

  it('K-45/10 GDD example level 4: a size-1 gap derives {W1, W3}: too_many_new_mechanics', () => {
    const json = draft(4);
    json.wall.gaps = [{ type: 'static', y: 0, size: 1 }];
    expect(codes(validateDraft(4, json))).toEqual(['too_many_new_mechanics']);
  });

  it('K-49 GDD example: Wy = 6, Ws = 3 is board_too_wide', () => {
    const json = draft(1);
    json.yard.cols = 6;
    json.site = { cols: 3, rows: 5 };
    expect(codes(validateDraft(1, json))).toEqual(['board_too_wide']);
  });

  it('K-44 GDD example: an L4_90 W on a 2-column site is piece_too_wide', () => {
    const json = draft(1);
    json.id = 12;
    json.chapter = 2;
    json.difficulty = 'normal';
    const [first] = json.yard.batches[0]?.pieces ?? [];
    if (first) Object.assign(first, { shape: 'L4_90', color: 'W', x: 0, y: 2 });
    expect(validateDraft(12, json).map((i) => i.code)).toContain('piece_too_wide');
  });

  it('K-15 K-45/4 GDD example ["YY","W."] is plan_has_window and (Hs = 5) plan_size', () => {
    const json = draft(2);
    const segment = json.build.segments[0];
    if (segment) segment.rows = ['YY', 'W.'];
    expect(codes(validateDraft(2, json))).toEqual(['plan_has_window', 'plan_size']);
  });

  it('K-44 GDD example level 8: Q9_0 is Ağır Yük even with a colour written; it stays out of the colour set', () => {
    const json = draft(8);
    const q9 = json.yard.batches[0]?.pieces[5];
    if (q9) q9.color = 'G';
    expect(validateDraft(8, json)).toEqual([]);
  });
});
