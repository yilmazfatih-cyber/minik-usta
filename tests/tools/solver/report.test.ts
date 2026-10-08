/** Solver output files (TECH §2R.5 "Çıktılar"): the LEVEL_REPORT section and the solver golden. */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LevelSchema } from '../../../src/core/level/schema.ts';
import { solveLevelData } from '../../../tools/solver/solveLevel.ts';
import { refLabel, solverGolden, writeLevelReportSection } from '../../../tools/solver/report.ts';
import { loadFixture } from '../../fixtures/builders.ts';

describe('levels:solve output files', () => {
  it('K-50 the LEVEL_REPORT "Bulmaca ölçütleri" section is replaced between its markers, the rest is kept', () => {
    const dir = mkdtempSync(join(tmpdir(), 'minik-usta-report-'));
    try {
      const path = join(dir, 'LEVEL_REPORT.md');
      writeFileSync(path, '# Bölüm raporu\n\nElle yazılmış giriş.\n');
      const r = solveLevelData(
        LevelSchema.parse(loadFixture('levels-2r', 'level_002')),
        {},
        { variants: false },
      );
      writeLevelReportSection(path, [r], '2026-10-07');
      writeLevelReportSection(path, [r], '2026-10-08');
      const text = readFileSync(path, 'utf8');
      expect(text).toContain('Elle yazılmış giriş.');
      expect(text.match(/<!-- levels:solve:begin -->/g)?.length).toBe(1);
      expect(text).toContain('Üretildi: 2026-10-08');
      expect(text).toContain(
        '| 2 | Kolay | solved | 3 | 3 | 0 | 0 | 0 | 0 | 0.000 | 7·13·9 / 1·1·1 | 3/3 | 9 |',
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('K-50 the solver golden holds the canonical log and the replay eventLogHash', () => {
    const r = solveLevelData(
      LevelSchema.parse(loadFixture('levels-2r', 'level_002')),
      {},
      { variants: false },
    );
    const g = solverGolden(r) as { log: unknown[]; eventLogHash: string; min: number };
    expect(g.min).toBe(3);
    expect(g.log).toHaveLength(4);
    expect(g.eventLogHash).toMatch(/^[0-9a-f]{16}$/);
    expect([refLabel('piece:0'), refLabel('piece:k1_3'), refLabel('debris:2')]).toEqual([
      'a',
      'k1_3',
      'debris2',
    ]);
  });
});
