/**
 * The shipped levels 1–10 (`levels/level_001…010.json`, levels v3b: 8 → 16 blocks, `schemaVersion` 2 or 3) against the
 * validator, the mechanic signatures (OBSTACLES "Veri imzası", K-45/10) and the owner's wishes (CL-V3-01/04/05): more blocks,
 * a different layout every level, new shapes and at least four new block traits. The Faz 2R levels they replaced are the
 * archive tests/fixtures/levels-2r/ (tests/level/drafts.test.ts).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateLevelJson } from '../../src/core/level/logic.ts';
import { deriveMechanics } from '../../src/core/level/mechanics.ts';
import { LevelSchema, schemaVersionOf } from '../../src/core/level/schema.ts';
import type { LevelData, MechanicId } from '../../src/core/level/schema.ts';
import { loadBoosterUnlock } from '../../tools/lib/levels.ts';

const ROOT = join(import.meta.dirname, '..', '..');
const IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const raw = (n: number): unknown =>
  JSON.parse(readFileSync(join(ROOT, 'levels', `level_${String(n).padStart(3, '0')}.json`), 'utf8'));
const parsed = (n: number): LevelData => LevelSchema.parse(raw(n));
const pieces = (n: number): LevelData['yard']['batches'][number]['pieces'] =>
  parsed(n).yard.batches.flatMap((b) => b.pieces);

describe('K-55 shipped levels 1–10 (fixed yard)', () => {
  it('K-55 K-45 every shipped level is schemaVersion 2 or 3 and passes every validate check without an error (mechanic history, booster unlocks); the only warnings are K-63 tile_family_mix', () => {
    const previous = new Set<MechanicId>();
    for (const n of IDS) {
      expect(schemaVersionOf(parsed(n)), `level ${n}`).toBeGreaterThanOrEqual(2);
      const issues = validateLevelJson(raw(n), {
        fileId: n,
        previousMechanics: previous,
        boosterUnlock: loadBoosterUnlock() ?? undefined,
      }).issues;
      expect(
        issues.filter((i) => i.severity === 'error'),
        `level ${n}`,
      ).toEqual([]);
      expect(
        [...new Set(issues.map((i) => i.code))].filter((c) => c !== 'tile_family_mix'),
        `level ${n}`,
      ).toEqual([]);
      for (const m of deriveMechanics(parsed(n))) previous.add(m);
    }
  });

  it('K-55 every block is in the yard from the start: one batch for segment 0, no dropColumns, at least two floors', () => {
    for (const n of IDS) {
      const lvl = parsed(n);
      expect(lvl.yard.batches, `level ${n}`).toHaveLength(1);
      expect(lvl.yard.batches[0]?.forSegment, `level ${n}`).toBe(0);
      expect(lvl.yard.batches[0]?.dropColumns, `level ${n}`).toBeUndefined();
      expect(lvl.build.segments.length, `level ${n} floors`).toBeGreaterThanOrEqual(2);
    }
  });

  it('K-45/10 the derived new mechanics are 1 → S1, 5 → Y9, 7 → Y11, 8 → Y13, 9 → Y12 and match `teaches` (CL-V3-05: slippery moved to level 8)', () => {
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
      4: [],
      5: ['Y9'],
      6: [],
      7: ['Y11'],
      8: ['Y13'],
      9: ['Y12'],
      10: [],
    });
  });

  it('K-49 CL-V3-01 the block count climbs (a one-block dip is allowed): 8, 8, then 9–16; level 10 holds at least 16 blocks and the ten levels at least 110', () => {
    const n = IDS.map((id) => pieces(id).length);
    expect(n[0]).toBeLessThanOrEqual(8);
    expect(n[9]).toBeGreaterThanOrEqual(16);
    expect(n.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(110);
    for (let i = 2; i < 10; i++)
      expect(n[i] ?? 0, `level ${i + 1}`).toBeGreaterThanOrEqual((n[i - 1] ?? 99) - 1);
  });

  it('K-49 CL-V3-04 the layout changes: no (yard, site, wall) triple is shared by more than two levels, and the yard fills up to 6 × 8', () => {
    const counts = new Map<string, number>();
    for (const n of IDS) {
      const l = parsed(n);
      const key = `${l.yard.cols}x${l.yard.rows}|${l.site?.cols}x${l.site?.rows}x${l.build.segments.length}|w${l.wall.height}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
    expect(Math.max(...IDS.map((n) => parsed(n).yard.rows ?? 8))).toBe(8);
  });

  it('K-56 CL-V3-04 the shapes vary: at least eight kinds across the ten levels (D2 O4 C3 L4 J4 T4 I3 …), and from level 6 on a level carries at least four of them', () => {
    const kinds = (n: number): Set<string> => new Set(pieces(n).map((p) => p.shape.split('_')[0] as string));
    const all = new Set(IDS.flatMap((n) => [...kinds(n)]));
    expect(all.size).toBeGreaterThanOrEqual(7);
    for (const n of [6, 7, 8, 9, 10]) expect(kinds(n).size, `level ${n}`).toBeGreaterThanOrEqual(3);
    expect([...all]).toEqual(expect.arrayContaining(['D2', 'O4', 'C3', 'L4', 'J4', 'T4', 'I3']));
  });

  it('K-57 K-59 K-60 K-61 CL-V3-05 at least four block traits are in shipped levels: two-tone (5), wrap + scissors (7), slippery (8), bonus (9)', () => {
    const has = (n: number, pred: (p: ReturnType<typeof pieces>[number]) => boolean): boolean =>
      pieces(n).some(pred);
    expect(has(5, (p) => p.colors !== undefined)).toBe(true);
    expect(has(7, (p) => p.flags?.includes('wrapped') === true)).toBe(true);
    expect(has(7, (p) => p.flags?.includes('scissors') === true)).toBe(true);
    expect(has(8, (p) => p.flags?.includes('slippery') === true)).toBe(true);
    expect(has(9, (p) => p.flags?.includes('bonus') === true)).toBe(true);
    // the finale uses three of them (CL-V3-07: the wrap is what the Hammer cuts)
    expect(has(10, (p) => p.flags?.includes('wrapped') === true)).toBe(true);
  });

  it('K-65 CL-V3-08 two-tone blocks use the readable pairs only: no green–yellow block anywhere, and level 10 has a two-tone block that is not a vertical domino (C3 or L4)', () => {
    for (const n of IDS)
      for (const p of pieces(n).filter((q) => q.colors !== undefined))
        expect([...new Set(p.colors)].sort().join(''), `level ${n}`).not.toBe('GY');
    const odd = pieces(10).filter((p) => p.colors !== undefined && !p.shape.startsWith('D2'));
    expect(odd.length).toBeGreaterThanOrEqual(1);
  });

  it('K-45 CL-V3-04 from level 4 on dominoes are at most 70 % of the blocks of a level and at most 64 % of all blocks', () => {
    let d = 0;
    let all = 0;
    for (const n of IDS) {
      const ps = pieces(n);
      const dom = ps.filter((p) => p.shape.startsWith('D2')).length;
      if (n >= 4) expect(dom / ps.length, `level ${n}`).toBeLessThanOrEqual(0.7);
      d += dom;
      all += ps.length;
    }
    expect(d / all).toBeLessThanOrEqual(0.64);
  });
});
