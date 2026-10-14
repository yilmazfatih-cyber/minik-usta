/**
 * Timing samples of the TECH §2R.13 performance gates (`tools/perf.ts` reads them through the harness): the kit atlas
 * bake (≤ 200 ms at 4× CPU), the level-start block bake (≤ 150 ms) and one core action package — `GameSession.apply`,
 * K-35 steps 1–12 with the step 12 deadlock checks (p99 ≤ 2 ms, worst ≤ 8 ms). A few `performance.now()` reads per
 * level or per move; nothing is shown or sent.
 */
export type TimingKey = 'kitBake' | 'levelBake' | 'apply';

/** Samples kept per key (the newest). */
export const TIMING_CAPACITY = 512;

const samples = new Map<TimingKey, number[]>();

export function recordTiming(key: TimingKey, ms: number): void {
  let list = samples.get(key);
  if (!list) {
    list = [];
    samples.set(key, list);
  }
  list.push(Math.round(ms * 1000) / 1000);
  if (list.length > TIMING_CAPACITY) list.splice(0, list.length - TIMING_CAPACITY);
}

/** `fn`'s duration recorded under `key`; returns its result. */
export function timed<T>(key: TimingKey, fn: () => T): T {
  const t0 = performance.now();
  try {
    return fn();
  } finally {
    recordTiming(key, performance.now() - t0);
  }
}

/** A copy of every key's samples (oldest first). */
export function timingSamples(): Partial<Record<TimingKey, number[]>> {
  const out: Partial<Record<TimingKey, number[]>> = {};
  for (const [k, v] of samples) out[k] = [...v];
  return out;
}

export function clearTimings(): void {
  samples.clear();
}
