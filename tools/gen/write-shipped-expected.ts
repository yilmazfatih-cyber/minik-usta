/**
 * `node tools/gen/write-shipped-expected.ts` — rewrites tests/tools/solver/shipped.expected.ts from the solver's own output
 * on levels/level_001…010.json (the numbers of docs/LEVEL_REPORT.md). Run after `levels:solve --update-golden`; a change of a
 * level file or of the solver shows up in the diff of that file. Levels with at least `LARGE_MIN_BLOCKS` blocks are measured by
 * the large-level search and the random-walk gate (CL-V3-01), the others by the complete scan.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { LevelSchema } from '../../src/core/level/schema.ts';
import { SOLVER_VERSION, solveLevelData } from '../solver/solveLevel.ts';
import { POLICY_GAMES_DEFAULT } from '../solver/walks.ts';
import { RULES_VERSION } from '../../src/core/session.ts';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const pad = (n: number): string => String(n).padStart(3, '0');
const WALKS = 600;
const SAMPLE = 40;

const entries: string[] = [];
for (let n = 1; n <= 10; n++) {
  const data = LevelSchema.parse(JSON.parse(readFileSync(`${ROOT}levels/level_${pad(n)}.json`, 'utf8')));
  const r = solveLevelData(data, { fileId: n }, { walks: WALKS, walkSample: SAMPLE });
  const golden = JSON.parse(readFileSync(`${ROOT}tests/golden/level_${pad(n)}.solver.json`, 'utf8')) as {
    eventLogHash: string;
  };
  const m = r.metrics;
  const d = m?.d099;
  const large = m === null;
  const best = m?.min ?? r.large?.best ?? -1;
  const yao = m ? [m.yao.overWall, m.yao.rail] : [r.large?.yao.overWall ?? 0, r.large?.yao.rail ?? 0];
  const o: Record<string, unknown> = {
    level: n,
    difficulty: r.difficulty,
    moves: r.moves,
    blocks: data.yard.batches.reduce((c, b) => c + b.pieces.length, 0),
    scan: large ? 'large' : 'full',
    best,
    lowerBound: r.large?.lowerBound ?? best,
    yao,
    band: [r.band?.lo, r.band?.hi],
    warnings: r.issues.filter((i) => i.severity === 'warn').map((i) => i.code),
    eventLogHash: golden.eventLogHash,
    policyLoose: r.large?.policy?.loose ?? null,
    policyTight: r.large?.policy?.tight ?? null,
  };
  if (m && d)
    o.full = {
      minShifts: m.minShifts,
      shiftsBySegment: m.shiftsBySegment,
      firstNeedDepth: m.firstNeedDepth,
      choices: m.choices,
      maxCover: d.maxCover,
      depLater: d.depLater,
      crossDeps: d.crossDeps,
      parkSlack: d.parkSlack,
      forced: d.forced,
      greedyExcess: d.greedyExcess,
      greedyWin: Math.round(d.greedyWin * 100) / 100,
      ahaMin: d.ahaMin,
      branch3: d.branch3,
      skillMid: Math.round((d.skillWin?.mid ?? -1) * 100) / 100,
    };
  entries.push(`  ${n}: ${JSON.stringify(o)},`);
  process.stderr.write(`level ${n}: ${r.status} best ${best} ${large ? 'large' : 'full'}\n`);
}
const text = `/**
 * The solver values of the shipped levels 1–10 (\`levels:solve\`, SOLVER_VERSION ${SOLVER_VERSION}, RULES_VERSION ${RULES_VERSION}; CL-V3-01). Written by
 * \`node tools/gen/write-shipped-expected.ts\` from the solver's own output: a change of a level file or of the solver shows up
 * here first. \`scan\` 'full' = complete state-space scan (proven \`min\`, K-50 metrics); 'large' = large-level search (\`best\` is
 * an upper bound of \`min\`, \`lowerBound\` = N or N + 1) plus the random-walk dead-state gate and the placement-first play
 * proxy (CL-V3-03; \`policyLoose\` = win rate within moves + N / 2, not \`ahaMin\`; CL-V3C-13: ${POLICY_GAMES_DEFAULT} plays, tight and loose on
 * the same plays).
 */
export interface ShippedFull {
  readonly minShifts: number;
  readonly shiftsBySegment: readonly number[];
  readonly firstNeedDepth: number | null;
  readonly choices: readonly number[];
  readonly maxCover: number | null;
  readonly depLater: number;
  readonly crossDeps: number;
  readonly parkSlack: number | null;
  readonly forced: number;
  readonly greedyExcess: number | null;
  readonly greedyWin: number;
  readonly ahaMin: number;
  readonly branch3: number | null;
  readonly skillMid: number;
}

export interface ShippedExpectation {
  readonly level: number;
  readonly difficulty: string;
  readonly moves: number;
  readonly blocks: number;
  readonly scan: 'full' | 'large';
  readonly best: number;
  readonly lowerBound: number;
  readonly yao: readonly [number, number];
  readonly band: readonly [number, number];
  readonly warnings: readonly string[];
  readonly eventLogHash: string;
  readonly policyLoose: number | null;
  readonly policyTight: number | null;
  readonly full?: ShippedFull;
}

export const SHIPPED: Readonly<Record<number, ShippedExpectation>> = {
${entries.join('\n')}
};
`;
const path = `${ROOT}tests/tools/solver/shipped.expected.ts`;
writeFileSync(path, await format(text, { ...(await resolveConfig(path)), filepath: path }));
