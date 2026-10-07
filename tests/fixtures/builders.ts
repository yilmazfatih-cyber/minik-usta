/**
 * Test fixture builders (TECH_DESIGN §12.4): `level({...})` returns a real, schema-parsed LevelData;
 * `compiledLevel` / `initialState` go one step further; `expectAscii` compares a state with Appendix A text.
 * Builders only run the zod schema, not the logic checks, so small hand-made boards (e.g. a nearly empty yard)
 * are allowed for rule tests.
 *
 * Faz 2R sizes (K-49, TECH §2R.1): `yard: { cols, rows }` and `site: { cols, rows }` are optional; without them the
 * level is the default 6×8 | 2×8 board and every pre-2R fixture builds unchanged. While the schema does not carry the
 * size fields yet (WP-B), a sized spec is parsed through a 2-wide stand-in (rows and debris columns the old schema
 * accepts) and the sizes, the real plan rows and debris columns are attached to the parsed data afterwards.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';
import * as z from 'zod/mini';
import { LevelSchema } from '../../src/core/level/schema.ts';
import type { LevelData, LevelInput } from '../../src/core/level/schema.ts';
import { compile } from '../../src/core/level/compile.ts';
import type { CompiledLevel } from '../../src/core/level/compile.ts';
import { createInitialState } from '../../src/core/state.ts';
import type { GameState } from '../../src/core/state.ts';
import { toAscii } from '../../src/core/ascii.ts';
import type { AsciiOptions } from '../../src/core/ascii.ts';
import type { ColorCode, DataPieceFlag, ShapeId } from '../../src/core/types.ts';

/** `[shape, colour, x, y, flags?, wetMoves?]` — anchor = bottom-left of the bounding box. */
export type PieceSpec = readonly [ShapeId, ColorCode, number, number, (readonly DataPieceFlag[])?, number?];
/** `[shape, colour, x (global site column, default 6–7), plan row, segment?]`. */
export type DebrisSpec = readonly [ShapeId, ColorCode, number, number, number?];

/** K-49 size fields of `yard` / `site`. */
export interface SizeSpec {
  readonly cols?: number;
  readonly rows?: number;
}

export interface LevelSpec {
  readonly id?: number;
  /** K-49 yard size Wy × Hy (default 6 × 8). */
  readonly yard?: SizeSpec;
  /** K-49 site size Ws × Hs (default 2 × 8). */
  readonly site?: SizeSpec;
  readonly chapter?: number;
  readonly moves?: number;
  readonly difficulty?: LevelInput['difficulty'];
  readonly seed?: number;
  readonly teaches?: LevelInput['teaches'];
  readonly wall?: {
    readonly height?: number;
    readonly gaps?: LevelInput['wall']['gaps'];
    readonly fan?: 'left' | 'right';
  };
  /** Rows of one segment (top → bottom), or one row list per segment. */
  readonly plan?: readonly string[] | readonly (readonly string[])[];
  readonly hidden?: readonly (NonNullable<LevelInput['build']['segments'][number]['hidden']> | undefined)[];
  /** Batch 0 (start yard). */
  readonly pieces?: readonly PieceSpec[];
  /** Truck batches k ≥ 1 (y is written as 8). */
  readonly batches?: readonly {
    readonly forSegment: number;
    readonly pieces: readonly PieceSpec[];
    readonly dropColumns?: readonly number[];
  }[];
  readonly debris?: readonly DebrisSpec[];
  readonly obstacles?: readonly LevelInput['obstacles'][number][];
  readonly gravity?: Partial<LevelInput['gravity']>;
  readonly mode?: LevelInput['build']['mode'];
  readonly carouselEvery?: number;
  readonly elevator?: LevelInput['build']['elevator'];
  readonly goals?: readonly LevelInput['goals'][number][];
  readonly tutorial?: readonly NonNullable<LevelInput['tutorial']>[number][];
}

function piece([
  shape,
  color,
  x,
  y,
  flags,
  wetMoves,
]: PieceSpec): LevelInput['yard']['batches'][number]['pieces'][number] {
  return {
    shape,
    color,
    x,
    y,
    ...(flags && flags.length > 0 ? { flags: [...flags] } : {}),
    ...(wetMoves !== undefined ? { wetMoves } : {}),
  };
}

/** Level JSON as it would be written in levels/ (unparsed). */
export function levelJson(spec: LevelSpec = {}): LevelInput {
  const id = spec.id ?? 1;
  const planInput = spec.plan ?? ['WW'];
  const segments: readonly (readonly string[])[] =
    typeof planInput[0] === 'string'
      ? [planInput as readonly string[]]
      : (planInput as readonly (readonly string[])[]);
  return {
    schemaVersion: 1,
    id,
    chapter: spec.chapter ?? Math.ceil(id / 10),
    name: { tr: 'Test', en: 'Test' },
    difficulty: spec.difficulty ?? 'easy',
    moves: spec.moves ?? 20,
    ...(spec.teaches ? { teaches: spec.teaches } : {}),
    ...(spec.seed !== undefined ? { seed: spec.seed } : {}),
    goals: spec.goals ? [...spec.goals] : [{ type: 'build' }],
    gravity: { build: spec.gravity?.build ?? 'normal', yard: spec.gravity?.yard ?? false },
    wall: {
      height: spec.wall?.height ?? 0,
      gaps: spec.wall?.gaps ?? [],
      ...(spec.wall?.fan ? { fan: { dir: spec.wall.fan } } : {}),
    },
    build: {
      mode: spec.mode ?? 'segments',
      ...(spec.carouselEvery !== undefined ? { carouselEvery: spec.carouselEvery } : {}),
      ...(spec.elevator ? { elevator: spec.elevator } : {}),
      segments: segments.map((rows, i) => {
        const hidden = spec.hidden?.[i];
        return { name: { tr: `D${i}`, en: `S${i}` }, rows: [...rows], ...(hidden ? { hidden } : {}) };
      }),
      ...(spec.debris
        ? {
            debris: spec.debris.map(([shape, color, x, y, segment]) => ({
              shape,
              color,
              x,
              y,
              ...(segment !== undefined ? { segment } : {}),
            })),
          }
        : {}),
    },
    yard: {
      batches: [
        { forSegment: 0, pieces: (spec.pieces ?? []).map(piece) },
        ...(spec.batches ?? []).map((b) => ({
          forSegment: b.forSegment,
          ...(b.dropColumns ? { dropColumns: [...b.dropColumns] } : {}),
          pieces: b.pieces.map((p) => piece([p[0], p[1], p[2], spec.yard?.rows ?? 8, p[4], p[5]])),
        })),
      ],
    },
    obstacles: [...(spec.obstacles ?? [])],
    ...(spec.tutorial ? { tutorial: [...spec.tutorial] } : {}),
  };
}

const hasSizes = (spec: LevelSpec): boolean => spec.yard !== undefined || spec.site !== undefined;

/** The spec's level JSON with the K-49 size fields written in (`yard.cols/rows`, `site`). */
function sizedJson(spec: LevelSpec): LevelInput {
  const json = levelJson(spec);
  if (!hasSizes(spec)) return json;
  return {
    ...json,
    yard: { ...json.yard, ...(spec.yard ?? {}) },
    ...(spec.site ? { site: { ...spec.site } } : {}),
  } as LevelInput;
}

/**
 * Pre-WP-B schema path: parses a 2-wide, size-free stand-in of the spec, then attaches the sizes, the real plan rows
 * and the real debris columns to the parsed data. Returns null when even the stand-in breaks the schema.
 */
function standInLevel(spec: LevelSpec): LevelData | null {
  const json = levelJson(spec);
  const standIn: LevelInput = {
    ...json,
    build: {
      ...json.build,
      segments: json.build.segments.map((sg) => ({ ...sg, rows: sg.rows.map((r) => `${r}WW`.slice(0, 2)) })),
      ...(json.build.debris ? { debris: json.build.debris.map((d) => ({ ...d, x: 6 })) } : {}),
    },
  };
  const parsed = LevelSchema.safeParse(standIn);
  if (!parsed.success) return null;
  const data = parsed.data;
  return {
    ...data,
    yard: { ...data.yard, ...(spec.yard ?? {}) },
    ...(spec.site ? { site: { ...spec.site } } : {}),
    build: {
      ...data.build,
      segments: data.build.segments.map((sg, i) => ({
        ...sg,
        rows: [...(json.build.segments[i]?.rows ?? [])],
      })),
      ...(data.build.debris
        ? { debris: data.build.debris.map((d, i) => ({ ...d, x: json.build.debris?.[i]?.x ?? d.x })) }
        : {}),
    },
  } as LevelData;
}

/** Schema-parsed LevelData; throws with a readable message when the spec breaks the schema. */
export function level(spec: LevelSpec = {}): LevelData {
  const parsed = LevelSchema.safeParse(sizedJson(spec));
  if (parsed.success) return parsed.data;
  const standIn = hasSizes(spec) ? standInLevel(spec) : null;
  if (standIn) return standIn;
  throw new Error(`fixture breaks the level schema:\n${z.prettifyError(parsed.error)}`);
}

export function compiledLevel(spec: LevelSpec = {}): CompiledLevel {
  return compile(level(spec));
}

export function initialState(spec: LevelSpec = {}): GameState {
  return createInitialState(compiledLevel(spec));
}

/** Removes the common indentation and blank first/last lines of a template literal. */
export function dedent(text: string): string {
  const lines = text
    .replace(/^\n/, '')
    .replace(/\n\s*$/, '')
    .split('\n');
  const indent = Math.min(...lines.filter((l) => l.trim() !== '').map((l) => /^ */.exec(l)?.[0].length ?? 0));
  return lines.map((l) => l.slice(indent)).join('\n');
}

/** Snapshot comparison against Appendix A text (indentation-insensitive, trailing spaces ignored). */
export function expectAscii(s: GameState, expected: string, opts: AsciiOptions = {}): void {
  const norm = (t: string): string =>
    t
      .split('\n')
      .map((l) => l.replace(/\s+$/, ''))
      .join('\n');
  expect(norm(toAscii(s, opts))).toBe(norm(dedent(expected)));
}

/** Level validator fixtures (Faz 2R, WP-B; TECH §2R.3): tests/level/fixtures. */
const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'level', 'fixtures');

/** Reads `tests/level/fixtures/<group>/<name>.json`. */
export function loadFixture(group: string, name: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, group, `${name}.json`), 'utf8'));
}

export function fixturePath(...parts: string[]): string {
  return join(FIXTURE_DIR, ...parts);
}
