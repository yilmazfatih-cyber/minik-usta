/**
 * `npm run test:rules` (tools/rule-coverage.ts; TECH_DESIGN §12.2, §14.1): rule ids and phases are read from the real
 * documents, and a missing id fails the gate.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PHASE_2R, missingIds, names, parsePhase, phaseLabel, ruleIds } from '../../tools/rule-coverage.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const docs = {
  gdd: readFileSync(join(ROOT, 'docs/GDD.md'), 'utf8'),
  tech: readFileSync(join(ROOT, 'docs/TECH_DESIGN.md'), 'utf8'),
  obstacles: readFileSync(join(ROOT, 'docs/OBSTACLES.md'), 'utf8'),
};

describe('test:rules (TECH 12.2)', () => {
  const ids = ruleIds(docs);
  const phase = (n: number, kind: string): string[] =>
    ids.filter((r) => r.kind === kind && r.phase <= n).map((r) => r.id);

  it('test:rules phase 2 requires no N-note and no bridge E row', () => {
    expect(phase(2, 'N')).toEqual([]);
    // Faz 2R: E-27 names K-30 (phase 3) since the GDD Faz 2R rewrite, so it left the phase 2 set (TECH 12.2).
    expect(phase(2, 'E')).toEqual(['E-01', 'E-03', 'E-06', 'E-21', 'E-28', 'E-30', 'E-34', 'E-38']);
    // Faz 2R: S2 is out of the MVP (OBSTACLES signature row without a first level), so only W1 (level 4) and S1 (5).
    expect(phase(2, 'obstacle').sort()).toEqual(['S1', 'W1']);
    expect(phase(3, 'E')).not.toContain('E-22');
    expect(phase(3, 'E')).not.toContain('E-45');
    expect(phase(4, 'E')).toEqual(expect.arrayContaining(['E-22', 'E-45']));
    // N01–N43 [kural] notes + the matrix-free Faz 2R notes N44–N47.
    expect(phase(3, 'N')).toHaveLength(42);
  });

  it('test:rules phase 2 K set = TECH 12.4 F ≤ 2 (K-20, K-30 later; every GDD K-xx has a row)', () => {
    const k = phase(2, 'K');
    expect(k).toEqual(expect.arrayContaining(['K-01', 'K-19', 'K-29', 'K-34', 'K-35', 'K-43', 'K-46']));
    expect(k).not.toContain('K-20');
    expect(k).not.toContain('K-30');
    // Faz 2R closure: K-54 (booster slot state) is the newest rule.
    expect(ids.filter((r) => r.kind === 'K')).toHaveLength(54);
  });

  it('test:rules phase 2R (TECH 2R.11): K-47…K-54, the Faz 2R slice rules and the "(Faz 2R" E rows sit between phase 2 and phase 3', () => {
    expect(parsePhase('2')).toBe(2);
    expect(parsePhase('2R')).toBe(PHASE_2R);
    expect(parsePhase('2, 3 (cam)')).toBe(2);
    expect(parsePhase('—')).toBeNull();
    expect(phaseLabel(PHASE_2R)).toBe('2R');
    const only2R = (kind: string): string[] =>
      ids.filter((r) => r.kind === kind && r.phase > 2 && r.phase <= PHASE_2R).map((r) => r.id);
    // TECH 12.4 F "2R": Söküm (K-30), Çekiç on Ağır Yük (K-36, level 8) and Vinç (K-37, level 10) are in the 1–10 slice.
    expect(only2R('K')).toEqual([
      'K-30',
      'K-36',
      'K-37',
      'K-47',
      'K-48',
      'K-49',
      'K-50',
      'K-51',
      'K-52',
      'K-53',
      'K-54',
    ]);
    // E-49 names K-48 (2R); E-50 names only K-33 (phase 2) but is tagged "(Faz 2R)" in GDD §13; the K-30 / K-36 / K-37
    // rows follow those rules unless they also name a phase 3 obstacle (E-59 names W4).
    expect(only2R('E')).toEqual([
      'E-23',
      'E-26',
      'E-27',
      'E-37',
      'E-42',
      'E-48',
      'E-49',
      'E-50',
      'E-51',
      'E-54',
      'E-55',
      'E-56',
      'E-57',
      'E-58',
      'E-60',
      'E-61',
    ]);
    expect(only2R('E')).not.toContain('E-59');
    // Obstacles first seen in levels 6–10 (OBSTACLES "Veri imzası": W2 6, Y5 8, W3 9).
    expect(only2R('obstacle').sort()).toEqual(['W2', 'W3', 'Y5']);
    expect(phase(2, 'K')).not.toContain('K-47');
  });

  it('test:rules id match: K-1 is not K-10, S1 is not S10, "K-17 …" and "(K-17)" count', () => {
    expect(names('K-17 wrong placement bounces', 'K-17')).toBe(true);
    expect(names('bounce (K-17)', 'K-17')).toBe(true);
    expect(names('K-170 x', 'K-17')).toBe(false);
    expect(names('S10 x', 'S1')).toBe(false);
    expect(missingIds(ids, ['K-01'], 2).length).toBeGreaterThan(0);
  });

  it('test:rules exits 1 when a phase 2 id has no test, 0 with every id named', { timeout: 30_000 }, () => {
    const dir = mkdtempSync(join(tmpdir(), 'rules-'));
    const required = ids.filter((r) => r.phase <= 2).map((r) => r.id);
    const all = join(dir, 'all.json');
    writeFileSync(all, JSON.stringify(required.map((id) => ({ name: `${id} covered`, file: 'x' }))));
    const short = join(dir, 'short.json');
    writeFileSync(
      short,
      JSON.stringify(required.slice(1).map((id) => ({ name: `${id} covered`, file: 'x' }))),
    );
    const run = (file: string) =>
      spawnSync(process.execPath, [join(ROOT, 'tools/rule-coverage.ts'), '--phase', '2', '--list', file], {
        cwd: ROOT,
        encoding: 'utf8',
      });
    expect(run(all).status).toBe(0);
    const r = run(short);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(required[0]);
    // `--phase 2R` also wants the Faz 2R ids; a malformed phase is an argument error (exit 2).
    const with2R = (file: string, p: string) =>
      spawnSync(process.execPath, [join(ROOT, 'tools/rule-coverage.ts'), '--phase', p, '--list', file], {
        cwd: ROOT,
        encoding: 'utf8',
      });
    const r2 = with2R(all, '2R');
    expect(r2.status).toBe(1);
    expect(r2.stderr).toContain('K-47');
    expect(with2R(all, '2X').status).toBe(2);
  });
});
