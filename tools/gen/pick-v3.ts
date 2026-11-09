/**
 * `node tools/gen/pick-v3.ts <spec.json> <fromSeed> <toSeed> [outDir]` — the levels v3b picker (CL-V3-01/03/04). For each
 * seed: a colour plan from the spec (sample-plan.ts), a random drop layout (generate.ts `startLevel`), the validator,
 * the large-level search (best found solution, replayed on the core) and the play measures that need no whole graph:
 * the dig count (best found − N), the win rate of a placement-first player within the budget (`greedy`) and of the same
 * player who errs 15 % of the time (`careless`). The spec's `want` window ranks the layouts; the best `keep` are written
 * as `<outDir>/s<seed>.json` (level JSON, `moves` = best found + P) with a one-line summary on stdout.
 * Deterministic. Not a proof: the dead-state gate runs afterwards in `levels:solve` (random walks, tools/solver/walks.ts).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { samplePlan } from './sample-plan.ts';
import type { PlanSpec } from './sample-plan.ts';
import type { Layout } from './generate.ts';
import { levelOf, neighbour, planTilings, startLayout } from './generate.ts';
import { mulberry32 } from '../../src/core/rng.ts';
import { validateLevelJson } from '../../src/core/level/logic.ts';
import { compile } from '../../src/core/level/compile.ts';
import { solveLarge } from '../solver/large.ts';
import { Expander, KIND_RAIL, infoKind } from '../solver/expand.ts';
import { solverStart } from '../solver/explore.ts';
import { hashState } from '../../src/core/hash.ts';
import { levelHooks } from '../../src/core/obstacles/registry.ts';
import { d099Band } from '../solver/puzzle.ts';
import { policyWinRate, randomWalks } from '../solver/walks.ts';

export interface Want {
  /** best found − N (digs in the found solution). */
  readonly dig: readonly [number, number];
  readonly greedy: readonly [number, number];
  readonly careless: readonly [number, number];
  readonly keep?: number;
}

/** Correct placements available at the start (0 wanted from level 3: the first block is dug out first). */
function startPlacements(lvl: ReturnType<typeof compile>): number {
  const x = new Expander(lvl, levelHooks(lvl));
  const start = solverStart(lvl);
  const h = hashState(start);
  let n = 0;
  x.expand(start, h[0] ?? 0, h[1] ?? 0, (_lo, _hi, info) => {
    if (infoKind(info) <= KIND_RAIL) n++;
  });
  return n;
}

const dist = (v: number, [lo, hi]: readonly [number, number]): number =>
  v < lo ? lo - v : v > hi ? v - hi : 0;

function main(argv: readonly string[]): void {
  const spec = JSON.parse(readFileSync(argv[0] as string, 'utf8')) as PlanSpec & { want: Want };
  const from = Number(argv[1]);
  const to = Number(argv[2]);
  const out = argv[3];
  const steps = Number(argv[4] ?? 25);
  if (out) mkdirSync(out, { recursive: true });
  const why: Record<string, number> = {};
  const no = (k: string): null => {
    why[k] = (why[k] ?? 0) + 1;
    return null;
  };
  const w = spec.want;
  interface Row {
    seed: number;
    score: number;
    line: string;
    json: unknown;
  }
  const evaluate = (plan: ReturnType<typeof samplePlan>, l: Layout, seed: number): Row | null => {
    const json = levelOf(plan, l, 99);
    if (!json) return no('nolayout');
    const v = validateLevelJson(json, { fileId: spec.id });
    const errs = v.issues.filter((i) => i.severity === 'error').map((i) => i.code);
    if (!v.level || errs.length > 0) return no(`invalid:${errs[0] ?? 'x'}`);
    const lvl = compile(v.level);
    // cheap gradient first: a layout whose first block is placeable at the start is not solved, only counted
    const sp = spec.id >= 3 ? startPlacements(lvl) : 0;
    if (sp > 0)
      return {
        seed,
        score: 100 + 4 * sp,
        line: `seed ${seed} score ${100 + 4 * sp} startPlacements ${sp} (not solved)`,
        json: { ...json, moves: 99 },
      };
    const r = solveLarge(lvl, { widths: [8, 32, 128, 512], maxExpanded: 20_000 });
    if (r.status !== 'solved' || r.best === null) return no('unsolved');
    const n = lvl.materialCount;
    const band = d099Band(r.best, spec.difficulty, spec.teaches !== undefined);
    const moves = band.lo;
    const loose = moves + Math.round(n / 2);
    const dig = r.best - n;
    const g = policyWinRate(lvl, loose, { plays: 150, seed });
    const c = policyWinRate(lvl, loose, { plays: 150, seed, eps: 0.15 });
    const kinds = new Set(lvl.pieces.filter((p) => p.cls === 'material').map((p) => p.dataShape.slice(0, 2)));
    // a careful player (heuristic moves, a fifth random) must be able to finish: share of won walks (30 walks)
    const cw = randomWalks(lvl, { walks: 30, sample: 0, seed }).won / 30;
    const score =
      Math.max(0, 0.4 - cw) * 20 +
      dist(dig, w.dig) * 3 +
      dist(g, w.greedy) * 10 +
      dist(c, w.careless) * 10 +
      (spec.id >= 3 ? 4 * startPlacements(lvl) : 0) +
      (r.yao.value !== null && r.yao.value < 0.6 ? 20 : 0) +
      (kinds.size < (spec.minKinds ?? 3) ? 5 : 0) +
      (n < spec.blocks[0] || n > spec.blocks[1] ? 20 : 0);
    return {
      seed,
      score,
      line: `seed ${seed} score ${score.toFixed(2)} N ${n} lb ${r.lowerBound} best ${r.best} dig ${dig} moves ${moves} greedy ${g} careless ${c} careful ${cw.toFixed(2)} yao ${r.yao.value?.toFixed(2)} kinds ${[...kinds].join('')} ${r.ms}ms`,
      json: { ...json, moves },
    };
  };
  const rows: Row[] = [];
  const emit = (): void => {
    rows.sort((a, b) => a.score - b.score || a.seed - b.seed);
    const seen = new Set<string>();
    let kept = 0;
    for (const row of rows) {
      const key = JSON.stringify((row.json as { yard: unknown }).yard);
      if (seen.has(key)) continue;
      seen.add(key);
      process.stdout.write(`${row.line}\n`);
      if (out) writeFileSync(`${out}/c${kept}_s${row.seed}.json`, `${JSON.stringify(row.json, null, 2)}\n`);
      if (++kept >= (w.keep ?? 5)) break;
    }
  };
  for (let seed = from; seed <= to; seed++) {
    let plan;
    try {
      plan = samplePlan(spec, seed);
    } catch (e) {
      no(`plan:${String(e).slice(0, 40)}`);
      continue;
    }
    const rng = mulberry32(seed * 31 + 7);
    const all = planTilings(plan);
    let l: Layout | null = null;
    for (let t = 0; t < 40 && !l; t++) l = startLayout(plan, all, rng);
    if (!l) continue;
    let best = evaluate(plan, l, seed);
    if (best) rows.push(best);
    for (let k = 0; k < steps; k++) {
      const nb = neighbour(plan, all, l, rng);
      if (!nb) continue;
      const row = evaluate(plan, nb, seed);
      if (!row) continue;
      rows.push(row);
      if (!best || row.score <= best.score) {
        best = row;
        l = nb;
      }
      if (best.score === 0) break;
    }
    if (process.env.PICK_PROGRESS) emit();
  }
  emit();
  process.stderr.write(`${JSON.stringify(why)}\n`);
  process.stdout.write(`(${rows.length} evaluated)\n`);
}

if (process.argv[1]?.endsWith('pick-v3.ts')) main(process.argv.slice(2));
