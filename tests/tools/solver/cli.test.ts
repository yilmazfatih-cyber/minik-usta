/** `npm run levels:solve` / `levels:check` CLI (TECH §2R.5 "CLI", §12.2): exit codes, JSON output, cache, check mode. */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import type { SolveReport } from '../../../tools/solver/solveLevel.ts';
import { fixturePath } from '../../fixtures/builders.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const OUT = mkdtempSync(join(tmpdir(), 'minik-usta-solve-'));
const run = (...args: string[]): { code: number | null; out: string; err: string } => {
  const r = spawnSync(process.execPath, [join(ROOT, 'tools', 'solve.ts'), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
};

afterAll(() => rmSync(OUT, { recursive: true, force: true }));

describe('levels:solve CLI', () => {
  it('K-45/9 levels:solve --json solves the chosen levels with workers, writes the artifacts and reuses them', () => {
    const args = ['--dir', fixturePath('levels-2r'), '--level', '2,3', '--out', OUT, '--json', '--jobs', '2'];
    const first = run(...args, '--no-cache');
    expect(first.code, first.err).toBe(0);
    const reports = JSON.parse(first.out) as SolveReport[];
    expect(reports.map((r) => [r.level, r.status, r.metrics?.min])).toEqual([
      [2, 'solved', 3],
      [3, 'solved', 5],
    ]);
    expect(reports[1]?.canonical[0]).toEqual({ kind: 'start', preBoosters: [], streakTier: 0 });
    expect(existsSync(join(OUT, 'level_003.json'))).toBe(true);
    expect(first.err).toContain('2 level(s) (0 from cache');
    const second = run(...args);
    expect(second.code).toBe(0);
    expect(second.err).toContain('2 level(s) (2 from cache');
  }, 60_000);

  it('K-45/9 levels:solve prints a readable block, the summary table and exits 0 without errors', () => {
    const r = run(
      '--dir',
      fixturePath('levels-2r'),
      '--level',
      '3',
      '--out',
      OUT,
      '--no-cache',
      '--jobs',
      '1',
    );
    expect(r.code).toBe(0);
    expect(r.out).toContain('level_003.json  OK  solved  4x4|2x5 H5  easy');
    expect(r.out).toContain('min 5 = N 4 + minShifts 1');
    expect(r.out).toContain('canonical: 1 shift c O4_0 G (0,2)→(1,2)');
    expect(r.out).toMatch(
      /\| 3 \| Kolay \| solved \| 4 \| 5 \| 1 \| 1 \| 1 \| 0 \| 0\.000 \| 6·9·10 \/ 3·1·1 \| 4\/4 \| 11 \| 10–12 \(11\)/,
    );
  }, 60_000);

  it('K-45/9 a level that fails the validate stage makes levels:solve exit 1 (level_invalid)', () => {
    const r = run('--dir', fixturePath('cli-invalid'), '--out', OUT, '--no-cache');
    expect(r.code).toBe(1);
    expect(r.out).toContain('level_invalid');
  });

  it('K-45 levels:check runs validate first and stops when it fails', () => {
    const r = run('--check', '--dir', fixturePath('cli-invalid'), '--out', OUT);
    expect(r.code).toBe(1);
    expect(r.out).toContain('levels:check 1/3 validate');
    expect(r.out).toContain('levels:validate failed; the solve stage did not run');
  });

  it('K-45 levels:check = validate + solve (+ bot when present) on the Faz 2R drafts 2 and 3', () => {
    const r = run('--check', '--dir', fixturePath('levels-2r'), '--level', '2,3', '--no-i18n', '--out', OUT);
    expect(r.code, r.out).toBe(0);
    expect(r.out).toContain('levels:check 2/3 solve');
    expect(r.out).toMatch(/levels:check 3\/3 bot/);
  }, 60_000);
});
