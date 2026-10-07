import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Layer rules: docs/TECH_DESIGN.md §1.3.
// Flat config replaces (does not merge) the options of a rule when several blocks match the same file, so every
// layer block below repeats the shared patterns it still needs (debug/harness, extension rule).

/** R-20: debug panel and harness hooks are only loaded via an import.meta.env guarded dynamic import in main.ts. */
const DEBUG_HARNESS = {
  regex: '(^|/)(debug|harness)(/|\\.|$)',
  message: 'load debug/harness only via import.meta.env guarded dynamic import in main.ts',
};
/** TECH §12.1: code reachable from Node tools uses explicit `.ts` extensions in relative imports (type stripping). */
const TS_EXTENSION = {
  regex: '^\\.{1,2}/(?!.*\\.(ts|json)$)',
  message: 'relative imports need an explicit .ts extension (Node type stripping, TECH_DESIGN §12.1)',
};
const NO_PHASER = (message) => ({ name: 'phaser', message });
const NO_UPWARD = { regex: '(^|/)(scenes|ui)(/|\\.|$)', message: 'no upward imports' };
/**
 * TECH §2R.1 (K-49, WP-A acceptance): the pre-2R board constants describe only the default 6×8 | 2×8 board. Outside
 * core/coords.ts every size comes from the level geometry (`s.lvl.geo`, `CompiledLevel.geo`) or, for encodings, from
 * core/geometry.ts (`MAX_COLS`, `MAX_ROWS`).
 */
const LEGACY_BOARD_MESSAGE =
  'pre-2R board constant: read the level geometry (s.lvl.geo) or geometry.ts (TECH §2R.1)';
const LEGACY_BOARD = [
  {
    regex: '(^|/)coords(\\.ts)?$',
    importNames: [
      'GRID_COLS',
      'GRID_ROWS',
      'GRID_CELLS',
      'BOARD_ROWS',
      'CRANE_ROW',
      'YARD_COLS',
      'SITE_X',
      'SITE_COLS',
      'BOUNDARY_X',
      'YARD_CELLS',
      'SEGMENT_CELLS',
      'ROW_MASK_ALL',
    ],
    message: LEGACY_BOARD_MESSAGE,
  },
  {
    regex: '(^|/)core/state(\\.ts)?$|^\\./state(\\.ts)?$',
    importNames: ['YARD_OCC_ROWS'],
    message: LEGACY_BOARD_MESSAGE,
  },
];
/**
 * Transition (TECH §2R.12): files that still read the default-board constants until their package moves them to the
 * level geometry. WP-G removes the scene/UI entries; WP-B moved the validator (core list empty). Do not add files.
 */
const LEGACY_BOARD_SCENES = [
  'src/ui/remaining.ts',
  'src/scenes/level/BoardView.ts',
  'src/scenes/level/TrowelPicker.ts',
  'src/scenes/level/pieceState.ts',
  'src/scenes/level/tutorial/highlights.ts',
  'src/scenes/level/LevelScene.ts',
  'src/scenes/level/hitTest.ts',
  'src/scenes/level/EventPlayer.ts',
];
const LEGACY_BOARD_CORE = [];
const BROWSER_PATTERNS = [DEBUG_HARNESS, { regex: '^node:', message: 'browser code: no Node APIs' }];
const CORE_PATHS = [
  NO_PHASER('core is pure: no Phaser'),
  { name: 'zod', message: 'core uses zod/mini (bundle size, see TECH_DESIGN §8)' },
];
const CORE_PATTERNS = [
  { regex: '^node:', message: 'core is pure: no Node APIs' },
  {
    regex: '(^|/)(scenes|ui|meta|services|theme|i18n|tools|debug|harness|config)(/|\\.|$)',
    message: 'core must not import outer layers',
  },
  TS_EXTENSION,
];

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'artifacts', 'coverage'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Browser code: no Node APIs, no static debug/harness imports.
    files: ['src/**/*.ts'],
    ignores: ['src/main.ts', 'src/debug/**', 'src/harness/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [...BROWSER_PATTERNS, ...LEGACY_BOARD] }],
    },
  },
  {
    // main.ts and the dev-only debug/harness code: no pre-2R board constants either.
    files: ['src/main.ts', 'src/debug/**/*.ts', 'src/harness/**/*.ts', 'tests/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: LEGACY_BOARD }],
    },
  },
  {
    // core is pure and deterministic: only zod/mini from outside.
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: CORE_PATHS, patterns: [...CORE_PATTERNS, ...LEGACY_BOARD] },
      ],
      'no-restricted-globals': [
        'error',
        'window',
        'document',
        'navigator',
        'localStorage',
        'sessionStorage',
        'performance',
        'requestAnimationFrame',
        'setTimeout',
        'setInterval',
        'fetch',
        'process',
        'console',
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'use core/rng (seeded)' },
        { object: 'Date', property: 'now', message: 'core has no clock' },
      ],
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date']", message: 'core has no clock' },
        { selector: 'TSEnumDeclaration', message: 'erasable syntax only (Node type stripping)' },
      ],
    },
  },
  {
    files: ['src/meta/**/*.ts', 'src/services/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [NO_PHASER('meta/services are engine-free')],
          patterns: [
            NO_UPWARD,
            DEBUG_HARNESS,
            { regex: '^node:', message: 'browser code: no Node APIs' },
            ...LEGACY_BOARD,
          ],
        },
      ],
    },
  },
  {
    // R-14, BUSINESS E8: the bot simulation must not see purchases, economy or save data.
    files: ['src/services/events/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [NO_PHASER('engine-free')],
          patterns: [
            {
              regex: '(^|/)(meta/economy|services/(save|iap|ads|analytics))(/|\\.|$)',
              message: 'bot sim must be independent of purchases/economy/save (E8)',
            },
            {
              regex: '(^|/)(save|iap|ads|analytics)(/|\\.|$)',
              message: 'bot sim must be independent of purchases/economy/save (E8)',
            },
            NO_UPWARD,
            DEBUG_HARNESS,
            { regex: '^node:', message: 'browser code: no Node APIs' },
            ...LEGACY_BOARD,
          ],
        },
      ],
    },
  },
  {
    files: ['tools/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [NO_PHASER('tools run in Node')],
          patterns: [
            { regex: '(^|/)(scenes|ui)(/|\\.|$)', message: 'tools may import core and theme/draw only' },
            TS_EXTENSION,
            ...LEGACY_BOARD,
          ],
        },
      ],
    },
  },
  {
    // Transition (see LEGACY_BOARD_SCENES): the scene/UI layer rules without the board-constant ban.
    files: LEGACY_BOARD_SCENES,
    rules: { 'no-restricted-imports': ['error', { patterns: BROWSER_PATTERNS }] },
  },
  // Transition (see LEGACY_BOARD_CORE): the core layer rules without the board-constant ban.
  ...(LEGACY_BOARD_CORE.length > 0
    ? [
        {
          files: LEGACY_BOARD_CORE,
          rules: { 'no-restricted-imports': ['error', { paths: CORE_PATHS, patterns: CORE_PATTERNS }] },
        },
      ]
    : []),
);
