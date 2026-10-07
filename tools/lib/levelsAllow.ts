/**
 * `tools/levels-allow.json` (GDD K-45/9, TECH §2R.3 L-34, E-54): deliberate level WARNINGS, silenced level by level
 * (e.g. `{ "10": ["batch_queued"] }`). The reason lives in the level's LEVELS.md record. Errors are never silenced.
 * Shared by `levels:validate` and `levels:solve`.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Issue } from '../../src/core/level/logic.ts';
import { ROOT } from './levels.ts';

/** Level number → silenced warning codes. */
export type AllowList = ReadonlyMap<number, ReadonlySet<string>>;

export const ALLOW_FILE = join(ROOT, 'tools', 'levels-allow.json');

/** Parses the allow list; throws on a malformed file (keys = level numbers 1–999, values = arrays of codes). */
export function parseAllowList(json: unknown): AllowList {
  if (json === null || typeof json !== 'object' || Array.isArray(json))
    throw new Error('levels-allow.json: expected an object { "<level>": ["<code>", …] }');
  const out = new Map<number, ReadonlySet<string>>();
  for (const [key, value] of Object.entries(json as Record<string, unknown>)) {
    if (key.startsWith('_doc')) continue;
    const id = Number(key);
    if (!/^\d{1,3}$/.test(key) || id < 1)
      throw new Error(`levels-allow.json: key "${key}" is not a level number`);
    if (!Array.isArray(value) || value.some((c) => typeof c !== 'string' || !/^[a-z_]+$/.test(c)))
      throw new Error(`levels-allow.json: level ${key} needs an array of snake_case codes`);
    out.set(id, new Set(value as string[]));
  }
  return out;
}

/** Reads `tools/levels-allow.json` (or `path`); an absent file is an empty list. */
export function loadAllowList(path: string = ALLOW_FILE): AllowList {
  if (!existsSync(path)) return new Map();
  return parseAllowList(JSON.parse(readFileSync(path, 'utf8')));
}

/** The issue is a warning the allow list silences for this level. */
export function isAllowed(allow: AllowList, levelId: number, issue: Issue): boolean {
  return issue.severity === 'warn' && (allow.get(levelId)?.has(issue.code) ?? false);
}
