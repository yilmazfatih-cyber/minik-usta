/**
 * `npm run levels:gen -- --plan <plan.json> --targets <targets.json> --seed N [--iterations N] [--starts N]
 * [--count N] [--max-states N] [--max-full N] [--out <dir>]` — the deterministic D-099 level generator (tools/gen/generate.ts;
 * docs/LEVELS.md §7 U-5; docs/TECH_DESIGN.md §D99.5).
 *
 * Writes `<out>/candidate_<rank>.json` (level JSON, `schemaVersion` 2, `targets` = the targets file) and
 * `<out>/report.md` (score, metrics, issues, ASCII of every candidate, the search trace). Default `--out`:
 * `artifacts/levels-gen/level_NNN/`. The same plan, targets, seed, options and `SOLVER_VERSION` give the same files
 * bit for bit (no clock, one PRNG). Exit 1 when no candidate is free of error codes.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from './gen/generate.ts';
import type { GenPlan, GenResult, GenTargets } from './gen/generate.ts';
import { SOLVER_VERSION } from './solver/solveLevel.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function arg(argv: readonly string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}

function num(argv: readonly string[], name: string): number | undefined {
  const v = arg(argv, name);
  if (v === undefined) return undefined;
  const n = Number(v);
  if (!Number.isInteger(n)) throw new Error(`--${name} needs an integer (got ${v})`);
  return n;
}

const pad = (n: number): string => String(n).padStart(3, '0');

/** The report text of a run (stable: no dates, no timings). */
export function genReport(plan: GenPlan, res: GenResult): string {
  const lines = [
    `# levels:gen — level ${plan.id} (${plan.name.tr} / ${plan.name.en})`,
    '',
    `seed ${res.seed} · solver ${SOLVER_VERSION} · evaluated ${res.evaluated} layouts (${res.solved} solved) · start score ${res.startScore.toFixed(2)} · best ${res.candidates[0]?.score.toFixed(2) ?? '–'}`,
    '',
  ];
  for (const c of res.candidates) {
    const m = c.metrics;
    const d = m?.d099;
    lines.push(
      `## Aday ${c.rank} (score ${c.score.toFixed(2)}, iteration ${c.iteration}, ${c.states} states)`,
      '',
    );
    if (m && d)
      lines.push(
        `- min ${m.min} (N ${m.N} + minShifts ${m.minShifts}) · moves ${c.level.moves} · firstNeedDepth ${m.firstNeedDepth ?? '–'} · YAO ${m.yao.overWall}/${m.yao.overWall + m.yao.rail}`,
        `- maxCover ${d.maxCover ?? '–'} · depLater ${d.depLater} · crossDeps ${d.crossDeps} · carryShifts ${d.carryShifts} · parkSlack ${d.parkSlack ?? '–'} · forced ${d.forced}`,
        `- trapCount ${m.trapCount} · greedyTrap ${d.greedyTrap ?? '–'} · greedyExcess ${d.greedyExcess ?? '∞'} · greedyWin ${d.greedyWin.toFixed(2)} · ahaMin ${d.ahaMin} · branch3 ${d.branch3 ?? '–'}`,
        `- complete ${d.complete ? 'evet' : 'hayır'} · undetectedDead ${d.undetectedDead} · D1 ${d.d1States}`,
      );
    for (const i of c.issues) lines.push(`- ${i.severity} ${i.code}: ${i.message}`);
    lines.push('', '```', c.ascii, '```', '');
  }
  lines.push('## İz', '', res.trace.map((s) => s.toFixed(1)).join(' '), '');
  return lines.join('\n');
}

export function main(argv: readonly string[]): number {
  const planPath = arg(argv, 'plan');
  const targetsPath = arg(argv, 'targets');
  const seed = num(argv, 'seed');
  if (!planPath || !targetsPath || seed === undefined) {
    process.stderr.write(
      'usage: npm run levels:gen -- --plan <plan.json> --targets <targets.json> --seed N [--iterations N] [--starts N] [--count N] [--max-states N] [--max-full N] [--out <dir>]\n',
    );
    return 2;
  }
  const plan = JSON.parse(readFileSync(planPath, 'utf8')) as GenPlan;
  const targets = JSON.parse(readFileSync(targetsPath, 'utf8')) as GenTargets;
  const iterations = num(argv, 'iterations');
  const starts = num(argv, 'starts');
  const count = num(argv, 'count');
  const maxStates = num(argv, 'max-states');
  const maxFull = num(argv, 'max-full');
  const res = generate(plan, targets, {
    seed,
    ...(iterations !== undefined ? { iterations } : {}),
    ...(starts !== undefined ? { starts } : {}),
    ...(count !== undefined ? { count } : {}),
    ...(maxStates !== undefined ? { maxStates } : {}),
    ...(maxFull !== undefined ? { maxFull } : {}),
    onSolved: (i) =>
      process.stderr.write(`  iteration ${i.iteration}: score ${i.score.toFixed(1)} (${i.states} states)\n`),
  });
  const out = arg(argv, 'out') ?? join(ROOT, 'artifacts', 'levels-gen', `level_${pad(plan.id)}`);
  mkdirSync(out, { recursive: true });
  for (const c of res.candidates)
    writeFileSync(join(out, `candidate_${c.rank}.json`), `${JSON.stringify(c.level, null, 2)}\n`);
  writeFileSync(join(out, 'report.md'), genReport(plan, res));
  const ok = res.candidates.some((c) => c.issues.every((i) => i.severity !== 'error'));
  process.stderr.write(
    `levels:gen: level ${plan.id}, seed ${seed}: ${res.evaluated} layouts, best score ${res.candidates[0]?.score.toFixed(2) ?? '–'} → ${out}\n`,
  );
  return ok ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = main(process.argv.slice(2));
}
