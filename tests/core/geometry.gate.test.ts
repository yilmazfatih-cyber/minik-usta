/**
 * WP-A acceptance gates (docs/TECH_DESIGN.md §2R.1, §2R.13 "gizli sabit" risk):
 * 1. ESLint `no-restricted-imports` forbids the pre-2R board constants outside core/coords.ts (eslint.config.js
 *    `LEGACY_BOARD`); the transition list is pinned here so it can only shrink.
 * 2. The number gate: every literal 5–10 left in the geometry core is either bound to the geometry or justified
 *    below (field offsets, bit packing, K-07 row numbers, text parsing). A new `x <= 5` or `y < 8` fails.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

describe('K-49 ESLint: no pre-2R board constants outside coords.ts', () => {
  const eslint = new ESLint({ cwd: ROOT });
  const lint = async (filePath: string, code: string): Promise<string[]> => {
    const [res] = await eslint.lintText(code, { filePath: `${ROOT}${filePath}` });
    return (res?.messages ?? []).filter((m) => m.ruleId === 'no-restricted-imports').map((m) => m.message);
  };

  it('K-49 core, tools, tests, meta and debug code cannot import GRID_ROWS, SITE_X, BOARD_ROWS … or YARD_OCC_ROWS', async () => {
    const cases: [string, string][] = [
      ['src/core/zz.ts', "import { GRID_ROWS } from './coords.ts';\nexport const a = GRID_ROWS;\n"],
      ['src/core/level/zz.ts', "import { SITE_X } from '../coords.ts';\nexport const a = SITE_X;\n"],
      ['src/core/zz.ts', "import { YARD_OCC_ROWS } from './state.ts';\nexport const a = YARD_OCC_ROWS;\n"],
      ['tools/zz.ts', "import { BOARD_ROWS } from '../src/core/coords.ts';\nexport const a = BOARD_ROWS;\n"],
      [
        'tests/core/zz.test.ts',
        "import { YARD_COLS } from '../../src/core/coords.ts';\nexport const a = YARD_COLS;\n",
      ],
      ['src/meta/zz.ts', "import { SITE_COLS } from '../core/coords.ts';\nexport const a = SITE_COLS;\n"],
      ['src/debug/zz.ts', "import { CRANE_ROW } from '../core/coords.ts';\nexport const a = CRANE_ROW;\n"],
      [
        'src/scenes/zz.ts',
        "import { ROW_MASK_ALL } from '../core/coords.ts';\nexport const a = ROW_MASK_ALL;\n",
      ],
    ];
    for (const [file, code] of cases) {
      const msgs = await lint(file, code);
      expect(msgs.length, file).toBe(1);
      expect(msgs[0], file).toMatch(/pre-2R board constant/);
    }
    // geometry functions and the frame constants stay importable
    expect(
      await lint(
        'src/core/zz.ts',
        "import { neighbors4 } from './coords.ts';\nexport const a = neighbors4;\n",
      ),
    ).toEqual([]);
    expect(
      await lint('src/core/zz.ts', "import { MAX_COLS } from './geometry.ts';\nexport const a = MAX_COLS;\n"),
    ).toEqual([]);
  }, 30_000);

  it('K-49 the transition list only shrinks: 8 scene/UI files (WP-G); level/logic.ts is off it (WP-B)', () => {
    const config = readFileSync(`${ROOT}eslint.config.js`, 'utf8');
    const list = (name: string): string[] => {
      const m = new RegExp(`const ${name} = \\[([^\\]]*)\\]`).exec(config);
      return [...(m?.[1] ?? '').matchAll(/'([^']+)'/g)].map((x) => x[1] ?? '');
    };
    expect(list('LEGACY_BOARD_CORE')).toEqual([]);
    const scenes = list('LEGACY_BOARD_SCENES');
    expect(scenes.length).toBeLessThanOrEqual(8);
    for (const f of scenes) expect(f, f).toMatch(/^src\/(scenes|ui)\//);
  });
});

// --- the number gate ---------------------------------------------------------------------------------------------------

/** WP-A files (TECH §2R.12): every core file that reads the board geometry. */
const GEOMETRY_CORE = [
  'src/core/geometry.ts',
  'src/core/coords.ts',
  'src/core/state.ts',
  'src/core/grid.ts',
  'src/core/movement.ts',
  'src/core/gravity.ts',
  'src/core/placement.ts',
  'src/core/delivery.ts',
  'src/core/hash.ts',
  'src/core/ascii.ts',
  'src/core/level/compile.ts',
  'src/core/level/plan.ts',
] as const;

/** Justified literals per file: a line pattern and why the number is not a board size. */
const JUSTIFIED: Readonly<Record<string, readonly (readonly [RegExp, string])[]>> = {
  'src/core/geometry.ts': [
    [/^export const MAX_COLS = 8;$/, 'the maximum frame (K-49 Wy + Ws ≤ 8): the single source'],
    [/^export const MAX_ROWS = 10;$/, 'the maximum frame (K-49 H ≤ 8 + 2 crane rows): the single source'],
    [/^export const MAX_SEGMENTS = 5;$/, 'GDD K-22: 1 ≤ S ≤ 5'],
    [/^export const DEFAULT_SIZES: .*\{ wy: 6, hy: 8, ws: 2, hs: 8, eMax: 0 \}\);$/, 'GDD K-49 defaults'],
  ],
  'src/core/state.ts': [
    [/^\w+: (5|6|7|8|9|10),$/, 'header (H) and piece record (PF) field offsets'],
    [/^export const PIECE_STRIDE = 9;$/, 'piece record stride'],
    [/<< 16\)|>> 6\)|<< 6\)|\(16 - 8 \* k\)/, 'base64 byte packing of the buffer'],
  ],
  'src/core/movement.ts': [
    [/D2_EPSILON = 1e-9;$/, 'float tolerance'],
    [/^const NEIGHBOURS = new Int16Array\(8\);$/, 'neighbour scratch (4 FREE steps + rails ≤ 3 + spare)'],
    [/row: (0 \| 1 \| 3 \| 4 \| 5|5|6|7)\b/, 'GDD K-07 release table row numbers'],
    [/(4|5) \* space/, 'five per-session arrays in one arena'],
  ],
  'src/core/hash.ts': [
    [/^const HEADER_TERMS = 8;$/, 'eight hashed header fields'],
    [/& 7\) << 6\)|& 255\) << 9\)/, 'piece class bit packing (colour 3 bits, flags 8 bits)'],
    [/^mixField\((5|6|7), /, 'hashed header term index'],
    [/padStart\(8, '0'\)/, 'hex digits of a 32-bit lane'],
  ],
  'src/core/ascii.ts': [
    [/(head|sized)\[(5|6|7)\]/, 'regex group index'],
    [/line\.slice\((6|7|10)\)/, 'line prefix length (`queue:`, `locked:`, `obstacles:` …)'],
  ],
  'src/core/level/compile.ts': [[/order: (5|6) \}/, 'K-35 step-10 timer order']],
};

const NUMBER = /(?<![\w.$])(5|6|7|8|9|10)(?![\w.])/;

/** Code part of a line: comment lines dropped, trailing `//` comments cut. */
function codeOf(line: string): string {
  const t = line.trim();
  if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) return '';
  const cut = t.indexOf(' // ');
  return (cut >= 0 ? t.slice(0, cut) : t).trim();
}

describe('K-49 number gate (TECH §2R.1): no hidden board sizes in the geometry core', () => {
  it('K-49 the gate sees board literals', () => {
    for (const code of ['if (x <= 5) return;', 'for (let y = 0; y < 8; y++)', 'const top = 10 - h;'])
      expect(NUMBER.test(codeOf(code)), code).toBe(true);
    for (const code of ['if (x <= geo.boundaryX) return;', '// x <= 5', 'const a = 1e-9;', 'f(x5, 0x7)'])
      expect(NUMBER.test(codeOf(code)), code).toBe(code === 'const a = 1e-9;');
  });

  it('K-49 every literal 5–10 in the WP-A core files is geometry-bound or justified', () => {
    const unexplained: string[] = [];
    for (const file of GEOMETRY_CORE) {
      const rules = JUSTIFIED[file] ?? [];
      readFileSync(`${ROOT}${file}`, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          const code = codeOf(line);
          if (!NUMBER.test(code)) return;
          if (rules.some(([re]) => re.test(code))) return;
          unexplained.push(`${file}:${i + 1}: ${code}`);
        });
    }
    expect(unexplained).toEqual([]);
  });
});
