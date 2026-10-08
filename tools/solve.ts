/**
 * `npm run levels:solve` — the solve stage of the level pipeline (docs/TECH_DESIGN.md §2R.5; GDD K-45 item 9, K-46,
 * K-50…K-53). For every level_NNN.json: validate stage (without mechanic history / i18n; `levels:validate` owns those),
 * full exploration with the real core, K-50 metrics, the canonical solution replayed on the core, the solve-stage codes
 * (L-19 `unsolvable` `unused_block` `moves_budget` `yao_low`, L-27 `trap_in_easy` `trap_warn` `trap_scan_incomplete`,
 * L-32 `puzzle_first_reachable` `puzzle_no_shift`, L-33 `metric_out_of_band`, L-34 `batch_queued`, L-35
 * `tut_hand_invalid`), the K-52 move band and the LEVEL_REPORT variants. Exit 1 when any error remains (warnings in
 * tools/levels-allow.json are shown as allowed).
 *
 * Tool gates (no K-45 code): `level_invalid` (the validate stage fails), `solve_unknown` (a state / time limit was hit:
 * every metric is unknown until the Faz 3 A* fallback), `solver_replay_mismatch` (the canonical solution does not
 * replay), `dead_table_missing` (deadRate > 0, or GDD K-51 item 2: a dead state of the whole space that D1/D2/D3a do
 * not catch, while the D3b table export is cut 1, TECH §2R.4). Warning `delivery_foresight` (GDD K-51 item 5).
 *
 * Usage: `npm run levels:solve [-- --level N[,M|N-M]] [--dir <path>] [--variant no-gaps|hammer-start]
 *   [--max-states N] [--max-ms N] [--jobs N] [--no-cache] [--no-variants] [--no-d3a] [--json] [--allow <file>]
 *   [--out <dir>] [--report] [--update-golden] [--emit-tables]`
 * `npm run levels:check [-- …]` = this tool with `--check`: `levels:validate` (same `--dir`, `--level`, `--allow`,
 *   `--no-i18n`) and, when it passes, the solve stage; the playtest bot (WP-N) joins when tools/playtest-bot.ts exists.
 *
 * `--update-golden` (levels/ only) writes tests/golden/level_NNN.solver.json (canonical log + `eventLogHash`) and
 * tests/golden/level_NNN.hand.json (the same solution move by move, tools/solver/golden.ts; TECH §2R.10).
 *
 * Output: a readable block per level and a markdown summary table; `--json` prints the reports as a JSON array instead
 * (stdout holds only the JSON; the summary line goes to stderr). Every report is written to
 * artifacts/solver/level_NNN.json (levels/), artifacts/solver/<dir name>/level_NNN.json (other directories) or
 * `--out <dir>`, `{ levelHash, rulesVersion, solverVersion, status, metrics, canonical, steps, issues, stats, … }`, and
 * reused while `levelHash`, `RULES_VERSION`, `SOLVER_VERSION` and the options match (`--no-cache` recomputes).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { Worker } from 'node:worker_threads';
import { ROOT, listLevelFiles } from './lib/levels.ts';
import type { LevelFile } from './lib/levels.ts';
import { loadAllowList } from './lib/levelsAllow.ts';
import type { AllowList } from './lib/levelsAllow.ts';
import { RULES_VERSION } from '../src/core/session.ts';
import { DEFAULT_MAX_MS, DEFAULT_MAX_STATES } from './solver/explore.ts';
import { SOLVER_VERSION, solveLevelJson } from './solver/solveLevel.ts';
import type { SolveOptions, SolveReport } from './solver/solveLevel.ts';
import type { SolveIssue } from './solver/metrics.ts';
import { isVariantName } from './solver/variants.ts';
import {
  levelText,
  readCached,
  solverGolden,
  summaryTable,
  writeJson,
  writeLevelReportSection,
} from './solver/report.ts';
import type { SolveJob } from './solver/worker.ts';
import { handGolden } from './solver/golden.ts';
import { loadLevel } from '../src/core/level/compile.ts';

const argv = process.argv.slice(2);
const has = (name: string): boolean => argv.includes(name);
function arg(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

/** `--level 3`, `--level 1,4`, `--level 1-10`. */
function parseLevelList(text: string | undefined): Set<number> | null {
  if (text === undefined) return null;
  const out = new Set<number>();
  for (const part of text.split(',')) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part.trim());
    if (!m) throw new Error(`--level: "${part}" is not N, N,M or N-M`);
    const a = Number(m[1]);
    const b = m[2] !== undefined ? Number(m[2]) : a;
    for (let n = Math.min(a, b); n <= Math.max(a, b); n++) out.add(n);
  }
  return out;
}

function intArg(name: string, fallback: number): number {
  const v = arg(name);
  if (v === undefined) return fallback;
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${name}: "${v}" is not a positive integer`);
  return n;
}

interface Job {
  readonly file: LevelFile;
  readonly opts: SolveOptions;
  readonly cachePath: string;
  readonly cacheKey: string;
}

function cacheKeyOf(file: LevelFile, opts: SolveOptions): string {
  const json: unknown = JSON.parse(readFileSync(file.path, 'utf8'));
  return [
    // the report's levelHash is of the parsed level; the raw text hash keys the cache (cheap, no parse)
    fnv(JSON.stringify(json)),
    `rules${RULES_VERSION}`,
    `solver${SOLVER_VERSION}`,
    opts.variant ?? 'level',
    opts.variants === false ? 'novar' : 'var',
    opts.d3a === false ? 'nod3a' : 'd3a',
  ].join(':');
}

/** Golden files are checked in: written in the repository's Prettier style so `format:check` stays green. */
async function writeGolden(path: string, value: unknown): Promise<void> {
  const text = await format(JSON.stringify(value), { ...(await resolveConfig(path)), filepath: path });
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

function fnv(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(16).padStart(8, '0');
}

async function runJobs(jobs: readonly Job[], workers: number): Promise<SolveReport[]> {
  const out: SolveReport[] = new Array<SolveReport>(jobs.length);
  if (workers <= 1 || jobs.length <= 1) {
    jobs.forEach((job, i) => {
      const json: unknown = JSON.parse(readFileSync(job.file.path, 'utf8'));
      out[i] = solveLevelJson(json, { fileId: job.file.fileId, file: job.file.name }, job.opts);
    });
    return out;
  }
  // the heaviest levels first (larger file id ≈ larger board) keeps the pool busy to the end
  const order = jobs
    .map((_, i) => i)
    .sort((a, b) => (jobs[b]?.file.fileId ?? 0) - (jobs[a]?.file.fileId ?? 0));
  let next = 0;
  await new Promise<void>((resolveAll, reject) => {
    let running = 0;
    const pool: Worker[] = [];
    const finish = (): void => {
      for (const w of pool) void w.terminate();
      resolveAll();
    };
    const feed = (w: Worker): void => {
      const i = order[next++];
      if (i === undefined) {
        if (running === 0) finish();
        return;
      }
      const job = jobs[i];
      if (!job) return;
      running++;
      const msg: SolveJob = {
        index: i,
        path: job.file.path,
        fileId: job.file.fileId,
        name: job.file.name,
        opts: job.opts,
      };
      w.postMessage(msg);
    };
    for (let k = 0; k < Math.min(workers, jobs.length); k++) {
      const w = new Worker(new URL('./solver/worker.ts', import.meta.url));
      pool.push(w);
      w.on('message', (m: { index: number; report?: SolveReport; error?: string }) => {
        running--;
        if (m.error !== undefined || !m.report) {
          for (const p of pool) void p.terminate();
          reject(new Error(`level ${jobs[m.index]?.file.name}: ${m.error ?? 'no report'}`));
          return;
        }
        out[m.index] = m.report;
        feed(w);
        if (running === 0 && next >= order.length) finish();
      });
      w.on('error', (e) => reject(e));
      feed(w);
    }
  });
  return out;
}

function runValidate(dir: string): number {
  const forward: string[] = ['--dir', dir];
  // levels:validate takes one level number; a list or a range validates every file (the history checks need them)
  const level = arg('--level');
  if (level !== undefined && /^\d+$/.test(level)) forward.push('--level', level);
  const allowFile = arg('--allow');
  if (allowFile !== undefined) forward.push('--allow', allowFile);
  if (has('--no-i18n')) forward.push('--no-i18n');
  const res = spawnSync(process.execPath, [join(ROOT, 'tools', 'validate-levels.ts'), ...forward], {
    stdio: 'inherit',
  });
  return res.status ?? 1;
}

async function main(): Promise<number> {
  const dir = resolve(arg('--dir') ?? join(ROOT, 'levels'));
  const defaultDir = dir === resolve(join(ROOT, 'levels'));
  if (has('--check')) {
    process.stdout.write('levels:check 1/3 validate\n');
    const code = runValidate(dir);
    if (code !== 0) {
      process.stdout.write('levels:check: levels:validate failed; the solve stage did not run\n');
      return 1;
    }
    process.stdout.write('levels:check 2/3 solve\n');
  }
  const only = parseLevelList(arg('--level'));
  const variant = arg('--variant');
  if (variant !== undefined && !isVariantName(variant))
    throw new Error(`--variant: "${variant}" is not no-gaps or hammer-start`);
  if (has('--emit-tables'))
    process.stdout.write(
      'note: --emit-tables (D3b dead-state tables) is cut 1 (TECH §2R.4, §2R.12): Faz 3; nothing is written\n',
    );
  const opts: SolveOptions = {
    maxStates: intArg('--max-states', DEFAULT_MAX_STATES),
    maxMs: intArg('--max-ms', DEFAULT_MAX_MS),
    ...(has('--no-d3a') ? { d3a: false } : {}),
    ...(has('--no-variants') ? { variants: false } : {}),
    ...(variant !== undefined && isVariantName(variant) ? { variant } : {}),
  };
  const allow: AllowList = arg('--allow') !== undefined ? loadAllowList(arg('--allow')) : loadAllowList();
  const files = listLevelFiles(dir).filter((f) => only === null || only.has(f.fileId));
  if (files.length === 0) {
    process.stdout.write(`levels:solve: no level files (level_NNN.json) in ${dir}; nothing to solve.\n`);
    return 0;
  }
  const outArg = arg('--out');
  const outDir =
    outArg !== undefined
      ? resolve(outArg)
      : defaultDir
        ? join(ROOT, 'artifacts', 'solver')
        : join(ROOT, 'artifacts', 'solver', basename(dir));
  const suffix = opts.variant ? `.${opts.variant}` : '';
  const useCache = !has('--no-cache');
  const jobs: Job[] = files.map((file) => ({
    file,
    opts,
    cachePath: join(outDir, `${file.name.replace(/\.json$/, '')}${suffix}.json`),
    cacheKey: cacheKeyOf(file, opts),
  }));
  const t0 = performance.now();
  const reports: (SolveReport | null)[] = jobs.map((j) =>
    useCache ? readCached(j.cachePath, j.cacheKey) : null,
  );
  const todo = jobs.filter((_, i) => reports[i] === null);
  const workers = Math.max(1, intArg('--jobs', Math.min(availableParallelism(), todo.length || 1)));
  const fresh = await runJobs(todo, workers);
  let f = 0;
  jobs.forEach((job, i) => {
    if (reports[i] !== null) return;
    const r = fresh[f++];
    if (!r) return;
    reports[i] = r;
    writeJson(job.cachePath, { ...r, cacheKey: job.cacheKey });
  });
  const done = reports.filter((r): r is SolveReport => r !== null);
  const isAllowedIssue = (r: SolveReport) => (i: SolveIssue) =>
    i.severity === 'warn' && (allow.get(r.level)?.has(i.code) ?? false);
  let errors = 0;
  let warnings = 0;
  for (const r of done) {
    const allowed = isAllowedIssue(r);
    for (const i of r.issues) {
      if (allowed(i)) continue;
      if (i.severity === 'error') errors++;
      else warnings++;
    }
  }
  const cached = done.length - todo.length;
  if (has('--json')) process.stdout.write(`${JSON.stringify(done, null, 2)}\n`);
  else {
    done.forEach((r, i) => {
      const name = jobs[i]?.file.name ?? `level_${r.level}`;
      process.stdout.write(`${levelText(r, name, isAllowedIssue(r))}\n\n`);
    });
    process.stdout.write(`${summaryTable(done)}\n\n`);
  }
  if (has('--update-golden')) {
    if (!defaultDir) process.stdout.write('note: --update-golden writes only for levels/ (skipped)\n');
    else
      for (const [i, r] of done.entries()) {
        const job = jobs[i];
        if (r.status !== 'solved' || !r.replay?.ok || !job) continue;
        const nnn = String(r.level).padStart(3, '0');
        await writeGolden(join(ROOT, 'tests', 'golden', `level_${nnn}.solver.json`), solverGolden(r));
        // the hand golden (TECH §2R.10): the canonical solution described move by move, replayed on the level as loaded
        const loaded = loadLevel(JSON.parse(readFileSync(job.file.path, 'utf8')));
        if (!loaded.ok) throw new Error(`${job.file.name}: does not load for the hand golden`);
        await writeGolden(join(ROOT, 'tests', 'golden', `level_${nnn}.hand.json`), handGolden(r, loaded.level));
      }
  }
  if (has('--report')) {
    const path = join(ROOT, 'docs', 'LEVEL_REPORT.md');
    writeLevelReportSection(path, done, new Date().toISOString().slice(0, 10));
    process.stdout.write(`levels:solve: wrote the "Bulmaca ölçütleri" section of ${path}\n`);
  }
  const ms = Math.round(performance.now() - t0);
  // with --json, stdout carries only the JSON; the summary line goes to stderr
  (has('--json') ? process.stderr : process.stdout).write(
    `levels:solve: ${done.length} level(s) (${cached} from cache, ${workers} worker(s), ${ms} ms), ${errors} error(s), ${warnings} warning(s)\n`,
  );
  if (has('--check')) {
    const bot = join(ROOT, 'tools', 'playtest-bot.ts');
    if (existsSync(bot)) {
      process.stdout.write('levels:check 3/3 bot\n');
      const res = spawnSync(process.execPath, [bot, '--dir', dir], { stdio: 'inherit' });
      if ((res.status ?? 1) !== 0) return 1;
    } else
      process.stdout.write(
        'levels:check 3/3 bot: tools/playtest-bot.ts (WP-N, Faz 3) not present — skipped\n',
      );
  }
  return errors > 0 ? 1 : 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (e: unknown) => {
    process.stdout.write(`levels:solve: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exitCode = 2;
  },
);
