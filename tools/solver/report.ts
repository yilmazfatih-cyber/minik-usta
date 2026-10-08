/**
 * Solver output (docs/TECH_DESIGN.md §2R.5 "Çıktılar"): the readable text of `levels:solve`, the summary table (the
 * columns of LEVELS §2 "Bölüm 1–10 özeti" + K-52 band + variants + `d3aMaxExpansions` + status), the cached JSON
 * artifact `artifacts/solver/[<dir>/]level_NNN.json`, the LEVEL_REPORT section (`--report`) and the solver golden
 * (`--update-golden`). The D3b dead-state table export is cut 1 (Faz 3).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { SolveReport } from './solveLevel.ts';
import type { CanonicalStep, PuzzleMetrics, SolveIssue } from './metrics.ts';

const DIFFICULTY_TR: Readonly<Record<string, string>> = {
  easy: 'Kolay',
  normal: 'Normal',
  hard: 'Zor',
  superhard: 'Çok Zor',
};

/** LEVELS letters: `piece:0` → a, `piece:k1_0` → k1_0, `debris:0` → debris0. */
export function refLabel(ref: string): string {
  const m = /^piece:(\d+)$/.exec(ref);
  if (m) return String.fromCharCode(97 + Number(m[1]));
  return ref.replace(/^piece:/, '').replace(/^debris:/, 'debris');
}

const fmtNum = (n: number): string => n.toLocaleString('en-US').replace(/,/g, ' ');
const dot = (xs: readonly (number | null)[]): string =>
  xs.map((x) => (x === null ? '–' : String(x))).join('·');

export function stepText(st: CanonicalStep): string {
  const kind = st.kind === 'overWall' ? 'over' : st.kind;
  return `${st.n} ${kind} ${refLabel(st.ref)} ${st.shape}${st.color === '-' ? '' : ` ${st.color}`} (${st.from[0]},${st.from[1]})→(${st.to[0]},${st.to[1]})`;
}

export function issueText(i: SolveIssue, allowed = false): string {
  return `  ${i.severity.padEnd(5)}  ${i.rule.padEnd(8)}  ${i.code.padEnd(22)}  ${i.check.padEnd(4)}  ${i.path}: ${allowed ? '(allowed) ' : ''}${i.message}`;
}

/** Readable block of one level. `allowed(i)` = the warning is silenced by tools/levels-allow.json. */
export function levelText(r: SolveReport, name: string, allowed: (i: SolveIssue) => boolean): string {
  const shown = r.issues.filter((i) => !allowed(i));
  const errors = shown.filter((i) => i.severity === 'error').length;
  const tag = errors > 0 ? 'FAIL' : shown.length > 0 ? 'WARN' : 'OK';
  const lines: string[] = [];
  const head = [name, tag, r.status];
  if (r.variant) head.push(`variant ${r.variant}`);
  if (r.geometry) head.push(r.geometry);
  if (r.difficulty) head.push(`${r.difficulty}${r.teaches ? ` (teaches ${r.teaches})` : ''}`);
  lines.push(head.join('  '));
  const m = r.metrics;
  if (m) {
    const seg = m.shiftsBySegment.length > 1 ? ` (by segment ${m.shiftsBySegment.join('+')})` : '';
    lines.push(
      `  min ${m.min} = N ${m.N} + minShifts ${m.minShifts}${seg} · firstNeedDepth ${m.firstNeedDepth ?? '–'} · F0 ${m.F0.map(refLabel).join(' ') || '–'} (firstNeedCover ${m.firstNeedCover ?? '–'})`,
    );
    lines.push(
      `  trapCount ${m.trapCount} · deadRate ${m.deadRate.toFixed(3)} (scope K: ${fmtNum(m.scope.states)} states, shifts ≤ ${m.scope.maxShifts}; dead states ${fmtNum(m.deadStates)}) · choices ${dot(m.choices)} / best ${dot(m.bestChoices)} (budget ${m.budget})`,
    );
    const yao = m.yao.value === null ? '–' : m.yao.value.toFixed(2);
    const band = r.band
      ? `K-52 band [${r.band.lo}, ${r.band.hi}] (${r.band.row} row: T ${r.band.T}, A ${r.band.A}, floor ${r.band.floor}; nominal ${r.band.nominal})`
      : '';
    lines.push(
      `  YAO ${m.yao.overWall}/${m.yao.overWall + m.yao.rail} = ${yao} · moves ${r.moves} · ${band}`,
    );
    if (m.delivery.length > 0)
      lines.push(
        `  delivery fairness (K-51/5): ${m.delivery.map((d) => `segment ${d.forSegment}: D ${d.D}, ${d.states} state(s), dist ${d.distMin ?? 'dead'}…${d.distMax ?? 'dead'}, g ${d.g ?? '∞'}, f ${d.f ?? '∞'}`).join(' · ')}`,
      );
  }
  for (const v of r.variants) {
    const delta =
      v.min === null || !m ? '' : v.name === 'no-gaps' ? ` (+${v.min - m.min})` : ` (−${m.min - v.min})`;
    const ok = v.bandOk === null ? '' : v.bandOk ? ', band ok' : ', BAND RED';
    lines.push(
      `  variant ${v.name}: ${v.status} min ${v.min ?? '–'}${delta}${ok} (${fmtNum(v.states)} states, ${v.ms} ms)`,
    );
  }
  if (r.stats && r.status !== 'invalid') {
    const s = r.stats;
    const replay = r.replay
      ? r.replay.ok
        ? `replay ok (eventLogHash ${r.replay.eventLogHash})`
        : 'replay FAILED'
      : '';
    lines.push(
      `  states ${fmtNum(s.states)} · edges ${fmtNum(s.edges)} · ${Math.round(s.bytes / 1048576)} MB · d3aMaxExpansions ${s.d3aMaxExpansions} · explore ${fmtNum(s.ms)} ms · total ${fmtNum(s.totalMs)} ms${s.complete ? '' : ` · INCOMPLETE (${s.limit})`}${replay ? ` · ${replay}` : ''}`,
    );
  }
  if (r.steps.length > 0) {
    const parts = r.steps.map(stepText);
    for (let i = 0; i < parts.length; i += 4)
      lines.push(`  ${i === 0 ? 'canonical: ' : '           '}${parts.slice(i, i + 4).join(' · ')}`);
  }
  for (const n of r.notes) lines.push(`  note: ${n}`);
  for (const i of r.issues) lines.push(issueText(i, allowed(i)));
  return lines.join('\n');
}

/** K-51 item 5 per truck batch: `g·f`, comma separated (`–` without trucks, `∞` with a dead delivery state). */
export function deliveryText(list: PuzzleMetrics['delivery']): string {
  if (list.length === 0) return '–';
  return list.map((d) => `${d.g ?? '∞'}·${d.f ?? '∞'}`).join(', ');
}

/** Markdown summary table of the solved levels (the product-lead's LEVELS §2 comparison). */
export function summaryTable(reports: readonly SolveReport[]): string {
  const head =
    '| # | Zorluk | Durum | N | min | s (dilim) | d | F0 örtü | trap | deadRate | ch@0·1·2 / best | YAO | moves | K-52 bandı (nominal) | varyant | uzay çıkmaz (yakalanan) | teslimat g·f | states | ms |';
  const sep = '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|';
  const rows = reports.map((r) => {
    const m = r.metrics;
    const v = r.variants
      .map((x) => `${x.name} ${x.min ?? '–'}${x.bandOk === false ? ' (kırmızı)' : ''}`)
      .join(', ');
    const band = r.band ? `${r.band.lo}–${r.band.hi} (${r.band.nominal})` : '–';
    return [
      r.level,
      `${DIFFICULTY_TR[r.difficulty ?? ''] ?? '–'}${r.teaches ? ' (tanıtım)' : ''}`,
      r.status,
      m?.N ?? '–',
      m?.min ?? '–',
      m ? `${m.minShifts}${m.shiftsBySegment.length > 1 ? ` (${m.shiftsBySegment.join('+')})` : ''}` : '–',
      m?.firstNeedDepth ?? '–',
      m?.firstNeedCover ?? '–',
      m?.trapCount ?? '–',
      m ? m.deadRate.toFixed(3) : '–',
      m ? `${dot(m.choices)} / ${dot(m.bestChoices)}` : '–',
      m ? `${m.yao.overWall}/${m.yao.overWall + m.yao.rail}` : '–',
      r.moves ?? '–',
      band,
      v || '–',
      m ? `${m.deadEntries.states} (${m.deadEntries.caught})` : '–',
      m ? deliveryText(m.delivery) : '–',
      r.stats ? fmtNum(r.stats.states) : '–',
      r.stats ? fmtNum(r.stats.totalMs) : '–',
    ].join(' | ');
  });
  return [head, sep, ...rows.map((x) => `| ${x} |`)].join('\n');
}

// --- files ---------------------------------------------------------------------------------------------------------

export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

/** A cached report when its key matches (`levelHash`, rules and solver versions, variant, variants flag). */
export function readCached(path: string, key: string): SolveReport | null {
  if (!existsSync(path)) return null;
  try {
    const json = JSON.parse(readFileSync(path, 'utf8')) as SolveReport & { cacheKey?: string };
    if (json.cacheKey !== key || json.status === 'unknown') return null;
    return json;
  } catch {
    return null;
  }
}

const REPORT_BEGIN = '<!-- levels:solve:begin -->';
const REPORT_END = '<!-- levels:solve:end -->';

/** Writes the "Bulmaca ölçütleri" section of docs/LEVEL_REPORT.md between its markers (`--report`). */
export function writeLevelReportSection(path: string, reports: readonly SolveReport[], date: string): void {
  const body = [
    REPORT_BEGIN,
    '## Bulmaca ölçütleri (`npm run levels:solve`)',
    '',
    `Üretildi: ${date} · solver ${reports[0]?.solverVersion ?? '–'} · kurallar ${reports[0]?.rulesVersion ?? '–'}. Tanımlar GDD K-50; zorunluluklar K-51; hamle bandı K-52.`,
    '',
    summaryTable(reports),
    REPORT_END,
  ].join('\n');
  const old = existsSync(path) ? readFileSync(path, 'utf8') : '# Bölüm raporu\n';
  const a = old.indexOf(REPORT_BEGIN);
  const b = old.indexOf(REPORT_END);
  const next =
    a >= 0 && b > a
      ? `${old.slice(0, a)}${body}${old.slice(b + REPORT_END.length)}`
      : `${old.trimEnd()}\n\n${body}\n`;
  writeFileSync(path, next);
}

/** `tests/golden/level_NNN.solver.json` (`--update-golden` only): canonical log + `eventLogHash`. */
export function solverGolden(r: SolveReport): unknown {
  return {
    level: r.level,
    levelHash: r.levelHash,
    rulesVersion: r.rulesVersion,
    solverVersion: r.solverVersion,
    min: r.metrics?.min ?? null,
    yao: r.metrics ? { overWall: r.metrics.yao.overWall, rail: r.metrics.yao.rail } : null,
    log: r.canonical,
    eventLogHash: r.replay?.eventLogHash ?? null,
  };
}
