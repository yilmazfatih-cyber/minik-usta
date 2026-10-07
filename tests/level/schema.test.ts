/**
 * Level schema (TECH §8.2, Faz 2R delta §2R.2; GDD §14, §14.1, K-44, K-45/1, K-49, K-53). Logic codes that the schema
 * stage maps (plan_size, tut_blocking, tut_key_missing) are tested in validator.test.ts.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CARGO_PLACEHOLDER_COLOR,
  HIGHLIGHT_PATTERNS,
  HIGHLIGHT_REGEX,
  LEGACY_MECHANIC_IDS,
  LevelSchema,
  MECHANIC_IDS,
  PIECE_REF_REGEX,
  TUT_EVENTS,
  TUT_TEXT_KEY_REGEX,
  TutCond,
} from '../../src/core/level/schema.ts';
import type { LevelInput } from '../../src/core/level/schema.ts';
import { levelJson, loadFixture } from '../fixtures/builders.ts';

const DOCS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs');
const doc = (name: string): string => readFileSync(join(DOCS, name), 'utf8');

type Step = NonNullable<LevelInput['tutorial']>[number];
const ok = (v: unknown): boolean => LevelSchema.safeParse(v).success;
const withTutorial = (steps: Step[]): unknown => ({
  ...levelJson({ pieces: [['B1_0', 'W', 0, 0]] }),
  tutorial: steps,
});
const step = (done: unknown, extra: Record<string, unknown> = {}): Step =>
  ({ step: 1, highlight: ['build'], textKey: 'tut.m.lift', done, ...extra }) as Step;
const condOk = (cond: unknown): boolean => TutCond.safeParse(cond).success;
const base = (): Record<string, unknown> => loadFixture('valid', 'base') as Record<string, unknown>;

describe('K-45/1 level schema (TECH §8.2, §2R.2)', () => {
  it('K-45/1 base fixture passes and unknown keys are rejected (strictObject)', () => {
    expect(ok(base())).toBe(true);
    expect(ok({ ...base(), elevatorRange: [0, 1] })).toBe(false);
  });

  it('K-45/1 defaults: shutter phase 0, slider dir 1; schemaVersion and seed optional', () => {
    const json = levelJson({
      id: 16,
      wall: {
        height: 8,
        gaps: [
          { type: 'shutter', y: 0, size: 1, period: 2 },
          { type: 'slider', y: 3, size: 1, range: [2, 4] },
        ],
      },
      pieces: [['B1_0', 'W', 0, 0]],
    });
    const parsed = LevelSchema.parse(json);
    const [shutter, slider] = parsed.wall.gaps;
    expect(shutter?.type === 'shutter' && shutter.phase).toBe(0);
    expect(slider?.type === 'slider' && slider.dir).toBe(1);
    const noVersion: Record<string, unknown> = { ...json };
    delete noVersion.schemaVersion;
    expect(ok(noVersion)).toBe(true);
    expect(parsed.seed).toBeUndefined();
  });

  it('K-49 K-45/1 yard.cols/rows and site { cols, rows } are optional; a site needs both fields', () => {
    const parsed = LevelSchema.parse(base());
    expect([parsed.yard.cols, parsed.yard.rows, parsed.site?.cols, parsed.site?.rows]).toEqual([4, 4, 2, 6]);
    const json = levelJson({ pieces: [['B1_0', 'W', 0, 0]] });
    const def = LevelSchema.parse(json);
    expect([def.yard.cols, def.yard.rows, def.site]).toEqual([undefined, undefined, undefined]);
    expect(ok({ ...json, site: { cols: 2 } })).toBe(false);
    expect(ok({ ...json, site: { cols: 2, rows: 5, depth: 1 } })).toBe(false);
    // The K-49 ranges are logic checks (size_out_of_range, board_too_wide): the schema only bounds the numbers.
    expect(ok({ ...json, site: { cols: 4, rows: 8 }, yard: { ...json.yard, cols: 6 } })).toBe(true);
    expect(ok({ ...json, site: { cols: 0, rows: 8 } })).toBe(false);
  });

  it('K-24 elevator start and dir are required (GDD §14)', () => {
    const json = levelJson({ pieces: [['B1_0', 'W', 0, 0]] });
    const withElevator = (elevator: unknown): unknown => ({ ...json, build: { ...json.build, elevator } });
    expect(ok(withElevator({ range: [0, 2], start: 0, dir: 1 }))).toBe(true);
    expect(ok(withElevator({ range: [0, 2], dir: 1 }))).toBe(false);
    expect(ok(withElevator({ range: [0, 2], start: 0 }))).toBe(false);
  });

  it('K-45/1 ranges follow GDD/OBSTACLES (segments 1–5, carouselEvery 2–6, wetMoves 1–5, period 1–4)', () => {
    const json = levelJson({ pieces: [['B1_0', 'W', 0, 0]] });
    expect(ok({ ...json, build: { ...json.build, carouselEvery: 7 } })).toBe(false);
    expect(ok({ ...json, build: { ...json.build, segments: [] } })).toBe(false);
    expect(ok(levelJson({ pieces: [['B1_0', 'W', 0, 0, ['wet'], 6]] }))).toBe(false);
    expect(ok(levelJson({ pieces: [['B1_0', 'W', 0, 0, ['wet'], 5]] }))).toBe(true);
    expect(
      ok(levelJson({ wall: { height: 4, gaps: [{ type: 'shutter', y: 0, size: 1, period: 5 }] } })),
    ).toBe(false);
  });

  it('K-44 shape ids: all 52 accepted by the schema, others rejected', () => {
    expect(ok(levelJson({ pieces: [['O4_270', 'W', 0, 0]] }))).toBe(true);
    const bad = levelJson({ pieces: [['B1_0', 'W', 0, 0]] });
    const piece = bad.yard.batches[0]?.pieces[0];
    if (piece) (piece as { shape: string }).shape = 'B1_45';
    expect(ok(bad)).toBe(false);
  });

  it('K-44 Ağır Yük (I5/Q9) may omit color, a material block may not; a missing cargo colour parses to the placeholder', () => {
    const cargo = loadFixture('valid', 'cargo_level8') as LevelInput;
    const q9 = cargo.yard.batches[0]?.pieces[5];
    expect(q9?.shape).toBe('Q9_0');
    expect(q9?.color).toBeUndefined();
    const parsed = LevelSchema.parse(cargo);
    expect(parsed.yard.batches[0]?.pieces[5]?.color).toBe(CARGO_PLACEHOLDER_COLOR);
    // A written cargo colour is kept (and ignored by every rule, K-44).
    expect(
      LevelSchema.parse(levelJson({ id: 8, pieces: [['I5_0', 'R', 0, 0]] })).yard.batches[0]?.pieces[0]
        ?.color,
    ).toBe('R');
    const res = LevelSchema.safeParse(loadFixture('invalid', 'schema_invalid_color_missing'));
    expect(res.success).toBe(false);
    expect(res.error?.issues.map((i) => i.path.join('.'))).toEqual(['yard.batches.0.pieces.0.color']);
  });

  it('K-45/10 teaches accepts the 27 mechanic ids of the Faz 2R table (S9 in, S2 only as the legacy id)', () => {
    expect(MECHANIC_IDS).toHaveLength(27);
    expect(MECHANIC_IDS).toContain('S9');
    expect(MECHANIC_IDS).not.toContain('S2');
    expect(LEGACY_MECHANIC_IDS).toEqual(['S2']);
    expect(ok(levelJson({ teaches: 'S7-R', pieces: [['B1_0', 'W', 0, 0]] }))).toBe(true);
    expect(ok(levelJson({ teaches: 'S9', pieces: [['B1_0', 'W', 0, 0]] }))).toBe(true);
    expect(ok({ ...levelJson({ pieces: [['B1_0', 'W', 0, 0]] }), teaches: 'S7' })).toBe(false);
  });

  it('K-45/1 targets (LEVELS §0, P-2R-4): optional K-50 bands minShifts, firstNeedDepth, choices0, deadRate', () => {
    expect(LevelSchema.parse(base()).targets).toEqual({
      minShifts: [1, 1],
      firstNeedDepth: [1, 1],
      deadRate: [0, 0],
    });
    const json = levelJson({ pieces: [['B1_0', 'W', 0, 0]] });
    expect(ok({ ...json, targets: { choices0: [3, 12], deadRate: [0, 0.2] } })).toBe(true);
    expect(ok({ ...json, targets: {} })).toBe(true);
    expect(ok({ ...json, targets: { deadRate: [0, 1.5] } })).toBe(false);
    expect(ok({ ...json, targets: { minShifts: [1] } })).toBe(false);
    expect(ok({ ...json, targets: { yao: [0.6, 1] } })).toBe(false);
  });
});

describe('GDD 14.1 tutorial schema (Faz 2R, K-53)', () => {
  it('tutorial done vocabulary equals GDD 14.1 list', () => {
    const gdd = doc('GDD.md');
    const start = gdd.indexOf('3. **`done` olay sözlüğü**');
    const end = gdd.indexOf('- **Süzgeçler**', start);
    expect(start).toBeGreaterThan(0);
    const section = gdd.slice(start, end);
    const names = new Set(
      [...section.matchAll(/(?<!olay yerine )`([a-z][A-Za-z]+)`(?= —| \(|; olay yerine)/g)].map((m) => m[1]),
    );
    expect([...names].sort()).toEqual([...TUT_EVENTS].sort());
    for (const event of TUT_EVENTS) {
      const minimal =
        event === 'holdOverBuild'
          ? { event, minMs: 500 }
          : event === 'obstacleHit'
            ? { event, type: 'crate' }
            : event === 'itemCollected'
              ? { event, type: 'screw' }
              : { event };
      expect(condOk(minimal), event).toBe(true);
    }
    expect(condOk({ event: 'pieceMoved' })).toBe(false);
  });

  it('tutorial highlight vocabulary equals UX 13.1 list (Faz 2R: blocks, CL-2R-21)', () => {
    const ux = doc('UX_FLOWS.md');
    const start = ux.indexOf('**Vurgu kimlikleri**');
    const end = ux.indexOf('### 13.2', start);
    const section = ux.slice(start, end);
    const items = [...section.matchAll(/`([a-z]+(?::(?:<[^`]*>|x,y|k<[^`]*>_<i>))?)`/g)]
      .map((m) => m[1] ?? '')
      .filter((s) => s !== 'highlight');
    const kind = (s: string): string => s.split(':')[0] ?? s;
    const uxKinds = new Set(items.map(kind));
    const schemaKinds = new Set(HIGHLIGHT_PATTERNS.map(kind));
    expect([...uxKinds].sort()).toEqual([...schemaKinds].sort());
    expect(schemaKinds.has('blocks')).toBe(true);
    // every UX form has a concrete sample accepted by the schema regex
    const samples = items.flatMap((s) => {
      const alt = /<([a-z|]+)>/.exec(s);
      if (alt && alt[1]?.includes('|')) return alt[1].split('|').map((a) => s.replace(/<[^>]+>/, a));
      return [s.replace('k<parti>_<i>', 'k1_0').replace('<i>', '0').replace('x,y', '6,1')];
    });
    for (const sample of samples) expect(HIGHLIGHT_REGEX.test(sample), sample).toBe(true);
    expect(HIGHLIGHT_REGEX.test('piece:k1_0')).toBe(true);
    expect(HIGHLIGHT_REGEX.test('booster:paintBrush')).toBe(false);
    expect(HIGHLIGHT_REGEX.test('gap')).toBe(false);
  });

  it('K-53/3 done and startOn are events only: timeoutMs is schema_invalid (CL-2R-10)', () => {
    expect(condOk({ timeoutMs: 2500 })).toBe(false);
    expect(ok(withTutorial([step({ event: 'tap' })]))).toBe(true);
    expect(ok(withTutorial([step({ timeoutMs: 2500 })]))).toBe(false);
    expect(ok(withTutorial([step({ event: 'tap' }, { startOn: { timeoutMs: 1000 } })]))).toBe(false);
  });

  it('K-53/2 mode is optional; any string passes the schema (L-31 names a non-soft value tut_blocking)', () => {
    expect(ok(withTutorial([step({ event: 'tap' })]))).toBe(true);
    expect(ok(withTutorial([step({ event: 'tap' }, { mode: 'soft' })]))).toBe(true);
    expect(ok(withTutorial([step({ event: 'tap' }, { mode: 'required' })]))).toBe(true);
    expect(ok(withTutorial([step({ event: 'tap' }, { mode: 3 })]))).toBe(false);
    expect(ok(withTutorial([step({ event: 'tap' }, { spotlight: true })]))).toBe(false);
  });

  it('GDD 14.1/3 piece filter (DL-2R-02): only on yardMove and placementCorrect, a piece:<i> / piece:k<p>_<i> id, with at', () => {
    expect(condOk({ event: 'yardMove', piece: 'piece:2' })).toBe(true);
    expect(condOk({ event: 'placementCorrect', count: 1, piece: 'piece:k1_0', at: [6, 0] })).toBe(true);
    expect(condOk({ event: 'landed', piece: 'piece:2' })).toBe(false);
    expect(condOk({ event: 'yardMove', piece: 'debris:0' })).toBe(false);
    expect(condOk({ event: 'yardMove', piece: '2' })).toBe(false);
    expect(PIECE_REF_REGEX.test('piece:k1_12')).toBe(true);
  });

  it('GDD 14.1/3 boosterUsed is an event; startOn may be segmentDone (Faz 2R LEVELS 7, 10)', () => {
    expect(
      ok(withTutorial([step({ event: 'boosterUsed', count: 1 }, { startOn: { event: 'segmentDone' } })])),
    ).toBe(true);
  });

  it('tutorial holdOverBuild needs minMs', () => {
    expect(condOk({ event: 'holdOverBuild' })).toBe(false);
    expect(condOk({ event: 'holdOverBuild', minMs: 500 })).toBe(true);
    expect(condOk({ event: 'overWall', minMs: 500 })).toBe(false);
  });

  it('tutorial at only on yardMove and placementCorrect', () => {
    expect(condOk({ event: 'yardMove', count: 1, at: [0, 6] })).toBe(true);
    expect(condOk({ event: 'placementCorrect', at: [6, 0] })).toBe(true);
    expect(condOk({ event: 'landed', at: [6, 0] })).toBe(false);
    expect(condOk({ event: 'gapPass', at: [6, 0] })).toBe(false);
  });

  it('tutorial filter only on its event', () => {
    expect(condOk({ event: 'landed', flag: 'glass', wind: true })).toBe(true);
    expect(condOk({ event: 'deliveryDone', flag: 'mortar' })).toBe(true);
    expect(condOk({ event: 'placementCorrect', hidden: true })).toBe(true);
    expect(condOk({ event: 'yardMove', painted: true })).toBe(true);
    expect(condOk({ event: 'landed', type: 'crate' })).toBe(false);
    expect(condOk({ event: 'yardMove', hidden: true })).toBe(false);
    expect(condOk({ event: 'deliveryDone', wind: true })).toBe(false);
    expect(condOk({ event: 'landed', flag: 'chained' })).toBe(false);
  });

  it('tutorial obstacleHit and itemCollected need type', () => {
    expect(condOk({ event: 'obstacleHit' })).toBe(false);
    expect(condOk({ event: 'itemCollected' })).toBe(false);
    expect(condOk({ event: 'obstacleHit', type: 'chain' })).toBe(true);
    expect(condOk({ event: 'itemCollected', type: 'key' })).toBe(true);
    expect(condOk({ event: 'itemCollected', type: 'crate' })).toBe(false);
  });

  it('GDD 14.1/1 textKey accepts tut.l<n>.<topic>, tut.m.<topic> (Faz 2R) and tut.ctx.<topic>', () => {
    for (const key of [
      'tut.m.dig',
      'tut.m.carryNow',
      'tut.m.cranebooster',
      'tut.ctx.support',
      'tut.l12.clear',
    ])
      expect(TUT_TEXT_KEY_REGEX.test(key), key).toBe(true);
    for (const key of [
      'tut.meta.bridge',
      'tut.L1.lift',
      'tut.m.',
      'tut.m.dig.more',
      'tut.m.Dig',
      'tut.l123.x',
    ])
      expect(TUT_TEXT_KEY_REGEX.test(key), key).toBe(false);
    expect(ok(withTutorial([step({ event: 'tap' }, { textKey: 'tut.m.free' })]))).toBe(true);
    expect(ok(withTutorial([step({ event: 'tap' }, { textKey: 'tut.meta.bridge' })]))).toBe(false);
  });

  it('K-45/1 K-53/3 LEVELS 11-38 tutorial done data passes schema, except the Faz 1 timeoutMs rows (Faz 3 redesign)', () => {
    // LEVELS §3 is Faz 1 data, redesigned in Faz 3 (R2-06). Its `{ timeoutMs }` rows are invalid since Faz 2R
    // (K-53/3, CL-2R-10): the schema must reject exactly those; every event row passes.
    const levels = doc('LEVELS.md');
    const start = levels.indexOf('**11–38 `tutorial[]` `done` eşlemesi**');
    const end = levels.indexOf('\n\n', levels.indexOf('| 38 ·', start));
    const rows = levels
      .slice(start, end)
      .split('\n')
      .filter((l) => /^\| \d+ · \d+ \|/.test(l));
    expect(rows.length).toBe(30);
    const toJson = (pseudo: string): unknown =>
      JSON.parse(
        pseudo
          .replace(/(\w+):/g, '"$1":')
          .replace(/: ([A-Za-z_]\w*)/g, (_m, word: string) => (word === 'true' ? ': true' : `: "${word}"`)),
      );
    let startOns = 0;
    const timed: string[] = [];
    for (const row of rows) {
      const cell = row.split('|')[3] ?? '';
      const startOn = /`startOn: (\{[^`]*\})`/.exec(cell);
      const done = [...cell.matchAll(/`(\{[^`]*\})`/g)].map((m) => m[1] ?? '');
      const doneJson = toJson(done[done.length - 1] ?? '{}');
      const extra = startOn ? { startOn: toJson(startOn[1] ?? '{}') } : {};
      if (startOn) startOns++;
      const isTimed = typeof doneJson === 'object' && doneJson !== null && 'timeoutMs' in doneJson;
      if (isTimed) timed.push(row.split('|')[1]?.trim() ?? '');
      expect(ok(withTutorial([step(doneJson, extra)])), row).toBe(!isTimed);
    }
    expect(startOns).toBe(1); // Bölüm 35
    expect(timed).toEqual(['12 · 2', '13 · 2', '15 · 2', '22 · 3', '35 · 1']);
  });
});
