/**
 * `node tools/gen/finalize-v3.ts <candidate.json> <levels/level_NNN.json>` — turns a picker candidate (pick-v3.ts) into
 * a shipped level file: keeps the layout, writes the K-53 tutorial step (one soft step; piece references come from the
 * found solution and the block flags), the `targets` the large-level gates can check (`min`, `deadRate`) and the
 * file in Prettier style. `moves` stays best found + P (K-52 D-099). Deterministic.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { validateLevelJson } from '../../src/core/level/logic.ts';
import { compile } from '../../src/core/level/compile.ts';
import { pieceRef } from '../solver/metrics.ts';
import { solveLarge } from '../solver/large.ts';
import { format, resolveConfig } from 'prettier';

type Json = Record<string, unknown>;

async function main(argv: readonly string[]): Promise<void> {
  const [from, to] = argv as [string, string];
  const json = JSON.parse(readFileSync(from, 'utf8')) as Json & {
    id: number;
    teaches?: string;
    yard: { batches: { pieces: { flags?: string[]; colors?: string }[] }[] };
  };
  const v = validateLevelJson(json, { fileId: json.id });
  if (!v.level) throw new Error('candidate does not validate');
  const lvl = compile(v.level);
  const r = solveLarge(lvl, { widths: [8, 32, 128, 512, 2048], maxExpanded: 200_000 });
  if (r.status !== 'solved' || r.best === null) throw new Error('candidate is not solved');
  const pieces = json.yard.batches[0]?.pieces ?? [];
  const idx = (pred: (p: { flags?: string[]; colors?: string }) => boolean): number => pieces.findIndex(pred);
  const first = r.steps[0];
  const firstShift = r.steps.find((s) => s.kind === 'shift');
  let tutorial: unknown[] | undefined;
  const ref = (id: number): string => pieceRef(lvl, id);
  switch (json.id) {
    case 3:
      if (firstShift)
        tutorial = [
          {
            step: 1,
            highlight: [ref(firstShift.pieceId)],
            textKey: 'tut.m.dig',
            done: { event: 'yardMove', count: 1, piece: ref(firstShift.pieceId) },
          },
        ];
      break;
    case 5: {
      const i = idx((p) => p.colors !== undefined);
      tutorial = [
        {
          step: 1,
          highlight: [`piece:${i}`],
          textKey: 'tut.m.twotone',
          done: { event: 'placementCorrect', count: 1 },
        },
      ];
      break;
    }
    case 6:
      if (first)
        tutorial = [
          {
            step: 1,
            highlight: [ref(first.pieceId)],
            textKey: 'tut.m.pattern',
            done: { event: 'placementCorrect', count: 1 },
          },
        ];
      break;
    case 7: {
      const i = idx((p) => p.flags?.includes('scissors') === true);
      tutorial = [
        {
          step: 1,
          highlight: [`piece:${i}`],
          textKey: 'tut.m.wrap',
          done: { event: 'placementCorrect', count: 1, piece: `piece:${i}` },
        },
      ];
      break;
    }
    case 9: {
      const i = idx((p) => p.flags?.includes('bonus') === true);
      tutorial = [
        {
          step: 1,
          highlight: [`piece:${i}`, 'moves'],
          textKey: 'tut.m.bonus',
          done: { event: 'placementCorrect', count: 1, piece: `piece:${i}` },
        },
      ];
      break;
    }
    case 10:
      tutorial = [
        {
          step: 1,
          startOn: { event: 'segmentDone' },
          highlight: ['booster:crane'],
          hand: { kind: 'tap' },
          textKey: 'tut.m.cranebooster',
          done: { event: 'boosterUsed', count: 1 },
        },
      ];
      break;
    default:
  }
  const out: Json = { ...json };
  delete out.tutorial;
  if (tutorial) out.tutorial = tutorial;
  out.targets = { min: [r.best, r.best], deadRate: [0, 0] };
  const text = await format(JSON.stringify(out), { ...(await resolveConfig(to)), filepath: to });
  writeFileSync(to, text);
  process.stdout.write(`${to}: N ${lvl.materialCount} best ${r.best} moves ${String(json.moves)}\n`);
}

await main(process.argv.slice(2));
