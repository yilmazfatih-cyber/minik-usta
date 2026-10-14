/**
 * Feedback export (docs/TECH_DESIGN.md §2R.16, EN-2R-20; ANALYTICS "Kapı 0 veri toplama"; no server, no SDK): the
 * analytics events of this device, kept across sessions, copied as one short JSON text the test player pastes into the
 * Kapı 0 survey (Settings → "Geri bildirim", UX §3 / §11; STORY `settings.feedback*`).
 *
 * - `PersistentLog`: a local ring of the last `FEEDBACK_CAPACITY` (500) events under `minikusta.analytics`, one compact
 *   row per event `[wall ms, name, …values in table order]` (≈ 100 KB at most, device only). Writes are coalesced
 *   (`FEEDBACK_DEBOUNCE_MS`) and flushed when the app is hidden; a damaged stored text starts an empty ring.
 * - `feedbackExport`: `{ v: 1, app, rules, platform, lang, events: [[tMs, name, …values]] }` — only the
 *   `FEEDBACK_EVENTS` funnel events, no common parameters (`sessionId`, `coins`, `lives` …), `tMs` relative to the first
 *   event exported (no wall clock). Every value is a table type of ANALYTICS §2 (int, bool, enum; the exported events
 *   have no free string), so there is no personal data. At most `FEEDBACK_MAX_CHARS` (20 000) characters: the oldest
 *   events drop first.
 * - `copyFeedback`: `navigator.clipboard.writeText` (HTTPS + the player's tap); a refusal answers `manual` and the
 *   screen opens the read-only, selected text box (`settings.feedbackManual`).
 */
import { ANALYTICS_EVENTS } from './analytics.ts';
import type { AnalyticsEvent, AnalyticsEventName, AnalyticsRecord } from './analytics.ts';
import type { Scheduler, TimerHandle } from './clock.ts';

/** localStorage key of the ring (TECH §2R.16). */
export const FEEDBACK_KEY = 'minikusta.analytics';
/** Ring size: the last 500 events (TECH §11.4 ring, now kept across sessions). */
export const FEEDBACK_CAPACITY = 500;
/** Export size limit (TECH §2R.16: ≤ 20 000 characters; a survey text field takes it). */
export const FEEDBACK_MAX_CHARS = 20_000;
/** Write coalescing of the ring (a level end sends 3–5 events in one frame). */
export const FEEDBACK_DEBOUNCE_MS = 1000;

/** The exported funnel events (TECH §2R.16 "Olay süzgeci"). */
export const FEEDBACK_EVENTS = [
  'app_open',
  'level_start',
  'level_end',
  'tutorial_step',
  'deadlock_teardown',
  'offer_shown',
  'offer_result',
  'nav_tap',
  'session_end',
] as const satisfies readonly AnalyticsEventName[];

export type LogValue = string | number | boolean | null;
/** One stored row: wall time (ms, device only), event name, the parameter values in ANALYTICS §2 table order. */
export type LogRow = readonly [number, string, ...LogValue[]];

/** The row of one event: its parameters in the table's order (the order `ANALYTICS_EVENTS` lists them). */
export function compactEvent(at: number, event: AnalyticsEvent): LogRow {
  const specs = ANALYTICS_EVENTS[event.name] as Readonly<Record<string, unknown>>;
  const obj = event as unknown as Readonly<Record<string, LogValue>>;
  return [Math.round(at), event.name, ...Object.keys(specs).map((p) => obj[p] ?? null)];
}

/** A stored row read back: a finite time, a known event name and only table-type values; anything else is dropped. */
function isRow(v: unknown): v is LogRow {
  if (!Array.isArray(v) || v.length < 2) return false;
  const [at, name, ...rest] = v as unknown[];
  if (typeof at !== 'number' || !Number.isFinite(at)) return false;
  if (typeof name !== 'string' || !Object.hasOwn(ANALYTICS_EVENTS, name)) return false;
  return rest.every((x) => x === null || ['string', 'number', 'boolean'].includes(typeof x));
}

export interface LogStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

export interface PersistentLogOptions {
  readonly store: LogStore;
  readonly scheduler: Scheduler;
  readonly capacity?: number;
  readonly debounceMs?: number;
}

/** The local analytics ring that survives a reload (TECH §2R.16 "Halka tampon yerel kalıcıdır"). */
export class PersistentLog {
  readonly capacity: number;
  readonly #store: LogStore;
  readonly #scheduler: Scheduler;
  readonly #debounceMs: number;
  #rows: LogRow[];
  #timer: TimerHandle | null = null;

  constructor(opts: PersistentLogOptions) {
    this.capacity = Math.max(1, opts.capacity ?? FEEDBACK_CAPACITY);
    this.#store = opts.store;
    this.#scheduler = opts.scheduler;
    this.#debounceMs = opts.debounceMs ?? FEEDBACK_DEBOUNCE_MS;
    this.#rows = PersistentLog.#read(opts.store, this.capacity);
  }

  static #read(store: LogStore, capacity: number): LogRow[] {
    try {
      const raw: unknown = JSON.parse(store.get(FEEDBACK_KEY) ?? '[]');
      return Array.isArray(raw) ? raw.filter(isRow).slice(-capacity) : [];
    } catch {
      return []; // a torn or foreign text: start an empty ring
    }
  }

  /** Analytics sink: one row per validated event; written within `debounceMs`. */
  readonly push = (record: AnalyticsRecord): void => {
    this.#rows.push(compactEvent(record.at, record.event));
    if (this.#rows.length > this.capacity) this.#rows.splice(0, this.#rows.length - this.capacity);
    if (this.#timer === null) {
      this.#timer = this.#scheduler.setTimeout(() => {
        this.#timer = null;
        this.flush();
      }, this.#debounceMs);
    }
  };

  /** Writes the ring now (app hidden, page left); a full storage keeps the rows in memory. */
  flush(): void {
    if (this.#timer !== null) {
      this.#scheduler.clearTimeout(this.#timer);
      this.#timer = null;
    }
    try {
      this.#store.set(FEEDBACK_KEY, JSON.stringify(this.#rows));
    } catch {
      // quota / blocked storage: the export still has this session's rows
    }
  }

  rows(): readonly LogRow[] {
    return [...this.#rows];
  }
}

/** The export header (TECH §2R.16): build version, core rules version, platform and language — nothing personal. */
export interface FeedbackMeta {
  readonly app: string;
  readonly rules: number;
  readonly platform: string;
  readonly lang: string;
}

const EXPORTED: ReadonlySet<string> = new Set(FEEDBACK_EVENTS);

/** The pasteable JSON text (≤ `maxChars`; the oldest events drop first, times relative to the first one kept). */
export function feedbackExport(
  rows: readonly LogRow[],
  meta: FeedbackMeta,
  maxChars: number = FEEDBACK_MAX_CHARS,
): string {
  let kept = rows.filter((r) => EXPORTED.has(r[1]));
  const text = (): string => {
    const t0 = kept[0]?.[0] ?? 0;
    const events = kept.map(([at, name, ...values]) => [Math.max(0, Math.round(at - t0)), name, ...values]);
    return JSON.stringify({
      v: 1,
      app: meta.app,
      rules: meta.rules,
      platform: meta.platform,
      lang: meta.lang,
      events,
    });
  };
  let out = text();
  while (out.length > maxChars && kept.length > 0) {
    // drop about the share that is too long (at least one row), then measure again
    const drop = Math.max(1, Math.ceil((kept.length * (out.length - maxChars)) / out.length));
    kept = kept.slice(drop);
    out = text();
  }
  return out;
}

/** What the screen shows after the copy: the 1,5 s `settings.feedbackCopied` balloon, or the manual text box. */
export type CopyResult = 'copied' | 'manual';

/** `navigator.clipboard.writeText`, or `manual` when there is no clipboard or it refuses (no HTTPS, no permission). */
export async function copyFeedback(
  text: string,
  clipboard: { writeText(text: string): Promise<void> } | undefined = globalThis.navigator?.clipboard,
): Promise<CopyResult> {
  if (!clipboard) return 'manual';
  try {
    await clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'manual';
  }
}
