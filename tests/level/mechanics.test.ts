/**
 * Mechanic data signatures (GDD K-45/10, R-21; OBSTACLES "Veri imzası" Faz 2R, CL-2R-12). A level's mechanic set is
 * derived from its data only.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MECHANICS, boardHeight, deriveMechanics, newMechanics } from '../../src/core/level/mechanics.ts';
import { MECHANIC_IDS } from '../../src/core/level/schema.ts';
import { level } from '../fixtures/builders.ts';

const OBSTACLES = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'OBSTACLES.md'),
  'utf8',
);

/** OBSTACLES "Veri imzası" table rows: [id, first level]. */
function signatureRows(): [string, number][] {
  const start = OBSTACLES.indexOf('## Veri imzası');
  const end = OBSTACLES.indexOf('## ', start + 5);
  return OBSTACLES.slice(start, end)
    .split('\n')
    .flatMap((line) => {
      const m = /^\| ([A-Z][\w-]*) \| .* \| (\d+) \|$/.exec(line);
      return m ? [[m[1] ?? '', Number(m[2])] as [string, number]] : [];
    });
}

const B1: ['B1_0', 'W', number, number][] = [['B1_0', 'W', 0, 0]];

describe('K-45/10 mechanic signatures (OBSTACLES "Veri imzası", Faz 2R)', () => {
  it('K-45/10 signature table equals the OBSTACLES rows (ids, order, first level; S2 out, S9 in)', () => {
    const rows = signatureRows();
    expect(rows).toHaveLength(27);
    expect(MECHANICS.map((m) => [m.id, m.firstLevel])).toEqual(rows);
    expect(MECHANICS.map((m) => m.id)).toEqual([...MECHANIC_IDS]);
  });

  it('K-45/10 W3 derived from gap size (any gap type, N2)', () => {
    const shutter = level({
      id: 13,
      wall: { height: 4, gaps: [{ type: 'shutter', y: 0, size: 1, period: 2 }] },
      pieces: B1,
    });
    expect(deriveMechanics(shutter)).toEqual(['W3', 'W4']);
    const wide = level({ id: 4, wall: { height: 6, gaps: [{ type: 'static', y: 2, size: 2 }] }, pieces: B1 });
    expect(deriveMechanics(wide)).toEqual(['W1']);
  });

  it('K-45/10 K-49 W2 is height = H (H = max(Hy, Hs + eMax)); the default board keeps height = 8', () => {
    const at = (height: number, site: { cols: number; rows: number }, yardRows = 4): string[] =>
      deriveMechanics(
        level({ id: 6, yard: { cols: 4, rows: yardRows }, site, wall: { height }, pieces: B1 }),
      );
    expect(at(7, { cols: 2, rows: 7 }, 5)).toEqual(['W2']); // LEVELS Bölüm 6
    expect(at(6, { cols: 2, rows: 7 }, 5)).toEqual([]);
    expect(at(5, { cols: 2, rows: 5 }, 5)).toEqual(['W2']); // Bölüm 7
    expect(at(4, { cols: 2, rows: 6 })).toEqual([]); // Bölüm 4: H = 6
    expect(deriveMechanics(level({ id: 6, wall: { height: 8 }, pieces: B1 }))).toEqual(['W2']);
    const elevator = level({
      id: 37,
      yard: { cols: 4, rows: 4 },
      site: { cols: 2, rows: 5 },
      elevator: { range: [0, 2], start: 0, dir: 1 },
      wall: { height: 7 },
      pieces: B1,
    });
    expect(boardHeight(elevator)).toBe(7);
    expect(deriveMechanics(elevator)).toEqual(['W2', 'S6']);
  });

  it('K-45/10 K-44 Y5 is I5/Q9 in any batch; a 3-wide material block (I3_90) is not Y5 any more', () => {
    expect(deriveMechanics(level({ id: 8, pieces: [['Q9_0', 'W', 0, 0]] }))).toEqual(['Y5']);
    expect(
      deriveMechanics(
        level({
          id: 8,
          plan: [['WW'], ['WW']],
          batches: [{ forSegment: 1, pieces: [['I5_0', 'W', 0, 0]] }],
          pieces: B1,
        }),
      ),
    ).toEqual(['Y5', 'S1']);
    expect(deriveMechanics(level({ id: 12, pieces: [['I3_90', 'W', 0, 0]] }))).toEqual([]);
  });

  it('K-45/10 K-49 S9 is site.cols ≥ 3', () => {
    const site = (cols: number): string[] =>
      deriveMechanics(level({ id: 12, yard: { cols: 4, rows: 4 }, site: { cols, rows: 4 }, pieces: B1 }));
    expect(site(2)).toEqual([]);
    expect(site(3)).toEqual(['S9']);
    expect(site(4)).toEqual(['S9']);
  });

  it('K-45/10 every signature is detected from data alone (S2 is not in the table)', () => {
    const full = level({
      id: 40,
      wall: {
        height: 8,
        fan: 'left',
        gaps: [
          { type: 'static', y: 0, size: 1 },
          { type: 'shutter', y: 2, size: 1, period: 2 },
          { type: 'slider', y: 4, size: 1, range: [4, 5] },
        ],
      },
      gravity: { build: 'high', yard: true },
      plan: [
        ['W.', 'WW'],
        ['??', 'WW'],
        ['??', 'WW'],
      ],
      hidden: [undefined, { kind: 'repeat', period: 1 }, { kind: 'mirrorOf', segment: 0 }],
      pieces: [
        ['B1_0', 'W', 0, 0, ['chained', 'wet'], 2],
        ['B1_0', 'W', 1, 0, ['glass', 'mortar']],
        ['B1_0', 'W', 2, 0, ['balloon']],
        ['I5_0', 'W', 0, 1],
      ],
      debris: [['B1_0', 'W', 6, 0]],
      obstacles: [
        { type: 'crate', x: 3, y: 0, hp: 1 },
        { type: 'cement_bag', x: 4, y: 0 },
        { type: 'screw', x: 0, y: 0 },
      ],
      elevator: { range: [0, 1], start: 0, dir: 1 },
    });
    expect(deriveMechanics(full)).toEqual([
      'W1',
      'W2',
      'W3',
      'W4',
      'W5',
      'W8',
      'Y1',
      'Y2',
      'Y3',
      'Y4',
      'Y5',
      'Y6',
      'Y7',
      'Y8',
      'S1',
      'S3',
      'S4',
      'S6',
      'S7-R',
      'S7-M',
      'S8',
      'G-H',
    ]);
    const others = level({
      id: 31,
      mode: 'carousel',
      carouselEvery: 3,
      gravity: { build: 'low' },
      wall: {
        height: 6,
        gaps: [
          { type: 'paint', y: 0, size: 2, color: 'W' },
          { type: 'locked', y: 3, size: 2, keyId: 'a' },
        ],
      },
      site: { cols: 3, rows: 8 },
      yard: { cols: 5, rows: 8 },
      pieces: B1,
    });
    expect(deriveMechanics(others)).toEqual(['W6', 'W7', 'S5', 'G-L', 'S9']);
  });

  it('K-45/10 a single segment is not S1, teaches adds nothing to the derived set', () => {
    expect(deriveMechanics(level({ id: 5, teaches: 'S1', pieces: B1 }))).toEqual([]);
    expect(deriveMechanics(level({ id: 5, plan: [['WW'], ['WW']], pieces: B1 }))).toEqual(['S1']);
  });

  it('K-45/10 newMechanics subtracts the earlier levels; a `.` plan derives no mechanic (S2 MVP dışı)', () => {
    const l4 = level({
      id: 4,
      wall: { height: 6, gaps: [{ type: 'static', y: 3, size: 2 }] },
      plan: ['RR', 'WW', 'W.', 'WW', 'YY'],
      pieces: B1,
    });
    expect(deriveMechanics(l4)).toEqual(['W1']);
    expect(newMechanics(l4, new Set(['W1']))).toEqual([]);
    expect(newMechanics(l4, new Set())).toEqual(['W1']);
  });
});
