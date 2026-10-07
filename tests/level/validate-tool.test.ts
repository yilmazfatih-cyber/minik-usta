/** `npm run levels:validate` (TECH §8.3, §12.2, §2R.3; GDD K-45/9 allow list). */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { flattenKeys, listLevelFiles } from '../../tools/lib/levels.ts';
import { ALLOW_FILE, isAllowed, loadAllowList, parseAllowList } from '../../tools/lib/levelsAllow.ts';
import type { Issue } from '../../src/core/level/logic.ts';
import { fixturePath } from '../fixtures/builders.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const run = (...args: string[]): { code: number | null; out: string } => {
  const r = spawnSync(process.execPath, [join(ROOT, 'tools', 'validate-levels.ts'), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
};

describe('levels:validate tool (TECH §8.3, §12.2)', () => {
  it('K-45 valid directory exits 0 and prints one line per level', () => {
    const r = run('--dir', fixturePath('cli-valid'), '--no-i18n');
    expect(r.code).toBe(0);
    expect(r.out).toContain('level_001.json  OK');
    expect(r.out).toContain('level_002.json  OK');
    expect(r.out).toContain('2 file(s), 0 error(s)');
  });

  it('K-45/3 invalid directory exits 1 and prints code + rule', () => {
    const r = run('--dir', fixturePath('cli-invalid'));
    expect(r.code).toBe(1);
    expect(r.out).toContain('level_001.json  FAIL');
    expect(r.out).toMatch(/error\s+K-45\/3\s+gap_touches_top\s+L-09\s+wall\.gaps\[0\]/);
  });

  it('K-45 empty directory says so and exits 0', () => {
    const r = run('--dir', fixturePath('valid'));
    expect(r.code).toBe(0);
    expect(r.out).toContain('no level files');
  });

  it('K-45 only level_NNN.json names are level files, sorted by number', () => {
    expect(listLevelFiles(fixturePath('cli-invalid')).map((f) => f.name)).toEqual(['level_001.json']);
    expect(listLevelFiles(fixturePath('cli-valid')).map((f) => f.fileId)).toEqual([1, 2]);
    expect(listLevelFiles(fixturePath('does-not-exist'))).toEqual([]);
  });

  it('GDD 14.1 i18n keys are read nested or flat; --no-i18n skips the key lookup with a note', () => {
    expect([...flattenKeys({ tut: { l1: { lift: 'x' } }, 'tut.ctx.support': 'y' })].sort()).toEqual([
      'tut.ctx.support',
      'tut.l1.lift',
    ]);
    expect(run('--dir', fixturePath('cli-valid'), '--no-i18n').out).toContain('note: --no-i18n');
  });

  it('K-45 the Faz 2R drafts of LEVELS levels 1–10 validate (WP-M input; i18n keys are WP-L)', () => {
    const r = run('--dir', fixturePath('levels-2r'), '--no-i18n');
    expect(r.code, r.out).toBe(0);
    for (let n = 1; n <= 10; n++) expect(r.out).toContain(`level_${String(n).padStart(3, '0')}.json  OK`);
    expect(r.out).toContain('level_004.json  OK  mechanics: W1');
    expect(r.out).toContain('10 file(s), 0 error(s), 0 warning(s)');
  });
});

describe('K-45/9 tools/levels-allow.json (TECH §2R.3 L-34, E-54)', () => {
  const warn = (code: string): Issue => ({
    code,
    rule: 'K-45/9',
    check: 'L-18',
    severity: 'warn',
    path: 'level',
    message: 'm',
  });

  it('K-45/9 the project allow list silences only level 10 batch_queued (LEVELS Bölüm 10, dilim 2 kuyruğu)', () => {
    const allow = loadAllowList();
    expect(ALLOW_FILE.endsWith(join('tools', 'levels-allow.json'))).toBe(true);
    expect([...allow].map(([id, set]) => [id, [...set]])).toEqual([[10, ['batch_queued']]]);
    expect(isAllowed(allow, 10, warn('batch_queued'))).toBe(true);
    expect(isAllowed(allow, 9, warn('batch_queued'))).toBe(false);
    expect(isAllowed(allow, 10, { ...warn('batch_queued'), severity: 'error' })).toBe(false); // errors never
  });

  it('K-45/9 a malformed allow list is refused', () => {
    expect(() => parseAllowList([])).toThrow();
    expect(() => parseAllowList({ ten: ['x'] })).toThrow();
    expect(() => parseAllowList({ 10: 'batch_queued' })).toThrow();
    expect(() => parseAllowList({ 10: ['Batch Queued'] })).toThrow();
    expect([...parseAllowList({ _doc: 'x', 3: [] })]).toEqual([[3, new Set()]]);
    expect(loadAllowList(fixturePath('does-not-exist.json')).size).toBe(0);
  });

  it('K-45/9 the tool shows an allowed warning as allowed and does not count it', () => {
    const dir = fixturePath('cli-allow');
    const plain = run('--dir', dir, '--no-i18n');
    expect(plain.code).toBe(0);
    expect(plain.out).toContain('level_010.json  WARN');
    expect(plain.out).toContain('1 file(s), 0 error(s), 1 warning(s)');
    const allowed = run('--dir', dir, '--no-i18n', '--allow', join(dir, 'allow.json'));
    expect(allowed.code).toBe(0);
    expect(allowed.out).toContain('level_010.json  OK');
    expect(allowed.out).toMatch(/difficulty_sawtooth .*\(allowed\)/);
    expect(allowed.out).toContain('0 warning(s), 1 allowed warning(s)');
  });
});
