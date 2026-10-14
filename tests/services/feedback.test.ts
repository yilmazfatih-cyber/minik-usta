/**
 * WP-O feedback export (docs/TECH_DESIGN.md §2R.16, EN-2R-20; ANALYTICS "Kapı 0 veri toplama"; STORY `settings.feedback*`):
 * the local analytics ring that survives a reload, the pasteable JSON (funnel events only, no common parameters, relative
 * times, ≤ 20 000 characters) and the clipboard / manual fallback.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Analytics, ANALYTICS_EVENTS } from '../../src/services/analytics.ts';
import type { AnalyticsEvent } from '../../src/services/analytics.ts';
import { FakeClock } from '../../src/services/clock.ts';
import {
  FEEDBACK_CAPACITY,
  FEEDBACK_EVENTS,
  FEEDBACK_KEY,
  FEEDBACK_MAX_CHARS,
  PersistentLog,
  compactEvent,
  copyFeedback,
  feedbackExport,
} from '../../src/services/feedback.ts';
import { MemoryStore } from '../../src/services/save.ts';

const COMMON = {
  sessionId: 'session-SECRET',
  appVersion: '0.0.0',
  platform: 'web',
  lang: 'tr',
  coins: 4321,
  lives: 4,
  highestLevel: 7,
  payer: false,
} as const;

function service(store = new MemoryStore(), clock = new FakeClock(1_700_000_000_000)) {
  const log = new PersistentLog({ store, scheduler: clock });
  const analytics = new Analytics({
    clock,
    common: () => COMMON,
    onInvalid: (issues) => {
      throw new Error(issues.join('\n'));
    },
  });
  analytics.addSink(log.push);
  return { store, clock, log, track: analytics.track };
}

const LEVEL_END: AnalyticsEvent = {
  name: 'level_end',
  level: 4,
  mode: 'story',
  result: 'lose',
  movesLeft: 0,
  wrongPlacements: 2,
  yao: 75,
  durationMs: 93_000,
  extensions: 1,
  exitFree: false,
  truckHelps: 1,
  teardowns: 1,
  blocksLeft: 3,
};
const META = { app: '0.0.0', rules: 2, platform: 'web', lang: 'tr' };

describe('ANALYTICS feedback export (TECH 2R.16, WP-O)', () => {
  it('ANALYTICS ring buffer survives a reload', () => {
    const a = service();
    a.track({ name: 'app_open' });
    a.track({ name: 'level_start', level: 1, attempt: 1, mode: 'story', preBoosters: 0 });
    expect(a.store.get(FEEDBACK_KEY)).toBeNull(); // coalesced …
    a.clock.advance(1000);
    expect(JSON.parse(a.store.get(FEEDBACK_KEY) ?? '[]')).toHaveLength(2); // … then written
    a.track(LEVEL_END);
    a.log.flush(); // app hidden: written at once
    // a reload: a new ring on the same storage has the earlier session's rows, in order
    const b = service(a.store, a.clock);
    expect(b.log.rows().map((r) => r[1])).toEqual(['app_open', 'level_start', 'level_end']);
    expect(b.log.rows()[2]).toEqual(compactEvent(1_700_000_001_000, LEVEL_END));
    // the ring keeps the newest FEEDBACK_CAPACITY rows; a damaged text starts an empty one
    for (let i = 0; i < FEEDBACK_CAPACITY + 20; i++) b.track({ name: 'life_lost', level: 1 + (i % 10) });
    b.log.flush();
    expect(new PersistentLog({ store: b.store, scheduler: b.clock }).rows()).toHaveLength(FEEDBACK_CAPACITY);
    b.store.set(FEEDBACK_KEY, '[[1,"level_end"');
    expect(new PersistentLog({ store: b.store, scheduler: b.clock }).rows()).toEqual([]);
    b.store.set(FEEDBACK_KEY, JSON.stringify([[1, 'not_an_event'], [2, 'app_open'], 'x']));
    expect(new PersistentLog({ store: b.store, scheduler: b.clock }).rows()).toEqual([[2, 'app_open']]);
  });

  it('ANALYTICS feedback export has no personal data and fits 20 000 chars', () => {
    const a = service();
    // a long play: every event kind, a few hundred funnel events
    a.track({ name: 'app_open' });
    a.track({
      name: 'event_join',
      event: 'bridge',
      eventInstanceId: 'inst-SECRET',
      botSimVersion: '1',
      seedHash: 'h',
    });
    a.track({ name: 'star_spent', task: 'ch1_t1' });
    for (let i = 0; i < 400; i++) {
      a.clock.advance(61_000);
      a.track({ name: 'level_start', level: 1 + (i % 10), attempt: i + 1, mode: 'story', preBoosters: 0 });
      a.track({ name: 'tutorial_step', level: 1, step: 0, shows: 2, msToDone: 4200 });
      a.track({ name: 'deadlock_teardown', level: 4, cause: 'tiling', movesLeft: 3, piecesReturned: 1 });
      a.track({ ...LEVEL_END, level: 1 + (i % 10) } as AnalyticsEvent);
      a.track({ name: 'nav_tap', tab: 'shop', locked: true });
    }
    const text = feedbackExport(a.log.rows(), META);
    expect(text.length).toBeLessThanOrEqual(FEEDBACK_MAX_CHARS);
    const out = JSON.parse(text) as { v: number; events: unknown[][] } & Record<string, unknown>;
    expect(Object.keys(out)).toEqual(['v', 'app', 'rules', 'platform', 'lang', 'events']);
    expect([out.v, out.rules]).toEqual([1, 2]);
    // only the funnel events, the newest kept (the oldest dropped first), times relative to the first one kept
    const names = new Set(out.events.map((e) => e[1]));
    for (const n of names) expect(FEEDBACK_EVENTS as readonly unknown[]).toContain(n);
    expect(names.has('event_join') || names.has('star_spent') || names.has('life_lost')).toBe(false);
    expect(out.events[0]?.[0]).toBe(0);
    const times = out.events.map((e) => e[0] as number);
    expect(times).toEqual([...times].sort((x, y) => x - y));
    expect(out.events.at(-1)?.[1]).toBe('nav_tap');
    // every value is a table type of its event (int / bool / enum), in table order; no common parameter, no id
    for (const [, name, ...values] of out.events) {
      const specs = Object.values(ANALYTICS_EVENTS[name as keyof typeof ANALYTICS_EVENTS]) as {
        kind: string;
      }[];
      expect(values).toHaveLength(specs.length);
      values.forEach((v, i) => {
        const kind = specs[i]?.kind;
        if (v === null) return;
        if (kind === 'int') expect(Number.isInteger(v)).toBe(true);
        else if (kind === 'bool') expect(typeof v).toBe('boolean');
        else expect(kind).toBe('enum'); // the exported events carry no free string
      });
    }
    for (const secret of ['SECRET', 'sessionId', 'analyticsId', 'installId', '4321', '1700000']) {
      expect(text).not.toContain(secret);
    }
    // the export text of an empty ring is still valid JSON
    expect(JSON.parse(feedbackExport([], META))).toMatchObject({ v: 1, events: [] });
  });

  it('ANALYTICS feedback copy: clipboard → copied; no clipboard or a refusal → the manual text box', async () => {
    let got = '';
    expect(await copyFeedback('{"v":1}', { writeText: async (t) => void (got = t) })).toBe('copied');
    expect(got).toBe('{"v":1}');
    expect(
      await copyFeedback('x', {
        writeText: () => Promise.reject(new Error('NotAllowedError')),
      }),
    ).toBe('manual');
    expect(await copyFeedback('x', undefined)).toBe('manual');
  });

  it('UX 3 settings window: "Geri bildirim" is its last item (cream 640 × 128); copied → 1,5 s balloon, refused → manual box', () => {
    const home = readFileSync(new URL('../../src/scenes/HomeScene.ts', import.meta.url), 'utf8');
    expect(home).toMatch(/const FEEDBACK_W = 640;\s+const FEEDBACK_H = 128;/);
    expect(home).toMatch(/const FEEDBACK_COPIED_MS = 1500;/);
    expect(home).toMatch(
      /color: 'cream',\s+w: FEEDBACK_W,\s+h: FEEDBACK_H,\s+label: t\('settings\.feedback'\)/,
    );
    expect(home).toMatch(/t\('settings\.feedbackCopied'\)/);
    expect(home).toMatch(/hint: t\('settings\.feedbackManual'\), close: t\('common\.continue'\)/);
    // the button is the last row of the settings window (after the three switches)
    const rows = home.slice(home.indexOf('private openSettings'), home.indexOf("options: [{ id: 'ok'"));
    expect(rows.indexOf("kind: 'custom'")).toBeGreaterThan(rows.indexOf('TOGGLES.map'));
  });
});
