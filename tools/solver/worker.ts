/**
 * `worker_threads` entry of `levels:solve` (docs/TECH_DESIGN.md §2R.5): one level per message, the report posted back.
 * Levels are independent, so the pool size is `os.availableParallelism()` (tools/solve.ts `--jobs`).
 */
import { readFileSync } from 'node:fs';
import { parentPort } from 'node:worker_threads';
import { solveLevelJson } from './solveLevel.ts';
import type { SolveOptions } from './solveLevel.ts';

export interface SolveJob {
  readonly index: number;
  readonly path: string;
  readonly fileId: number;
  readonly name: string;
  readonly opts: SolveOptions;
}

parentPort?.on('message', (job: SolveJob) => {
  try {
    const json: unknown = JSON.parse(readFileSync(job.path, 'utf8'));
    const report = solveLevelJson(json, { fileId: job.fileId, file: job.name }, job.opts);
    parentPort?.postMessage({ index: job.index, report });
  } catch (e) {
    parentPort?.postMessage({
      index: job.index,
      error: e instanceof Error ? (e.stack ?? e.message) : String(e),
    });
  }
});
