# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> scene smoke (TECH 12.4, Faz 2R) >> K-43 level 2: a reload mid-level resumes the same attempt, then the golden wins
- Location: tests/e2e/smoke.spec.ts:106:3

# Error details

```
TimeoutError: page.waitForFunction: Timeout 120000ms exceeded.
```

# Test source

```ts
  140 |   /** Console errors and uncaught page errors seen so far. */
  141 |   readonly errors: string[];
  142 |   close(): Promise<void>;
  143 | }
  144 | 
  145 | export interface OpenOptions {
  146 |   /** Base URL of the harness server (no trailing slash). */
  147 |   readonly url: string;
  148 |   readonly profile: Profile;
  149 |   /** `prefers-reduced-motion: reduce` + `?reducedMotion=1` (screens: still frames, JUICE §0 rule 8). */
  150 |   readonly reducedMotion?: boolean;
  151 |   /** CDP `Emulation.setCPUThrottlingRate` (perf: 4). */
  152 |   readonly cpuRate?: number;
  153 |   readonly network?: NetworkConditions;
  154 |   /** Extra query parameters after `?harness=1`. */
  155 |   readonly query?: string;
  156 |   /** Wait for `window.__ready` (default true). */
  157 |   readonly waitReady?: boolean;
  158 |   /** localStorage items written before the page runs (a seeded save: `minikusta.save`). */
  159 |   readonly storage?: Readonly<Record<string, string>>;
  160 |   /** Browser permissions of the context (screens: `clipboard-write` for the feedback copy). */
  161 |   readonly permissions?: readonly string[];
  162 | }
  163 | 
  164 | /** A fresh browser context (empty storage and cache) on the harness page. */
  165 | export async function openGame(browser: Browser, opts: OpenOptions): Promise<GamePage> {
  166 |   const { profile } = opts;
  167 |   const context = await browser.newContext({
  168 |     viewport: { width: profile.width, height: profile.height },
  169 |     deviceScaleFactor: profile.dpr,
  170 |     isMobile: true,
  171 |     hasTouch: true,
  172 |     reducedMotion: opts.reducedMotion ? 'reduce' : 'no-preference',
  173 |   });
  174 |   if (opts.storage) {
  175 |     await context.addInitScript((items: Record<string, string>) => {
  176 |       // once per context: a reload keeps what the game wrote since
  177 |       if (sessionStorage.getItem('harness.seeded') === '1') return;
  178 |       for (const [k, v] of Object.entries(items)) localStorage.setItem(k, v);
  179 |       sessionStorage.setItem('harness.seeded', '1');
  180 |     }, opts.storage);
  181 |   }
  182 |   if (opts.permissions) await context.grantPermissions([...opts.permissions], { origin: opts.url });
  183 |   const page = await context.newPage();
  184 |   const gp = await attachGame(page, context);
  185 |   if (opts.cpuRate && opts.cpuRate !== 1)
  186 |     await gp.cdp.send('Emulation.setCPUThrottlingRate', { rate: opts.cpuRate });
  187 |   if (opts.network) {
  188 |     await gp.cdp.send('Network.enable');
  189 |     await gp.cdp.send('Network.emulateNetworkConditions', { offline: false, ...opts.network });
  190 |   }
  191 |   const rm = opts.reducedMotion ? '&reducedMotion=1' : '&reducedMotion=0';
  192 |   await page.goto(`${opts.url}/?harness=1${rm}${opts.query ?? ''}`);
  193 |   if (opts.waitReady !== false) await waitReady(page);
  194 |   return gp;
  195 | }
  196 | 
  197 | /** Wraps an existing page (Playwright test fixtures): console error capture, CDP session, touch driver. */
  198 | export async function attachGame(page: Page, context: BrowserContext): Promise<GamePage> {
  199 |   const errors: string[] = [];
  200 |   page.on('console', (msg) => {
  201 |     if (msg.type() === 'error') errors.push(msg.text());
  202 |   });
  203 |   page.on('pageerror', (err) => errors.push(err.stack ?? String(err)));
  204 |   const cdp = await context.newCDPSession(page);
  205 |   return { page, context, cdp, touch: new TouchDriver(cdp, page), errors, close: () => context.close() };
  206 | }
  207 | 
  208 | export async function waitReady(page: Page, timeoutMs = 30_000): Promise<void> {
  209 |   await page.waitForFunction(() => window.__ready === true && window.__harness !== undefined, null, {
  210 |     timeout: timeoutMs,
  211 |     polling: 100,
  212 |   });
  213 | }
  214 | 
  215 | // --- window.__harness wrappers ------------------------------------------------------------------------------------------
  216 | 
  217 | export const status = (page: Page): Promise<HarnessStatus> => page.evaluate(() => window.__harness!.status());
  218 | export const state = (page: Page): Promise<HarnessState> => page.evaluate(() => window.__harness!.state());
  219 | export const loadLevel = (page: Page, id: number): Promise<HarnessState> =>
  220 |   page.evaluate((n) => window.__harness!.loadLevel(n), id);
  221 | export const waitInteractive = (page: Page, id?: number, timeoutMs = 120_000): Promise<HarnessState> =>
  222 |   page.evaluate(([n, ms]) => window.__harness!.waitInteractive(ms, n ?? undefined), [
  223 |     id ?? null,
  224 |     timeoutMs,
  225 |   ] as const);
  226 | export const golden = (page: Page, id: number): Promise<DragMove[]> =>
  227 |   page.evaluate((n) => window.__harness!.golden(n), id);
  228 | export const findDrag = (page: Page, kind: DragKind): Promise<DragMove | null> =>
  229 |   page.evaluate((k) => window.__harness!.findDrag(k), kind);
  230 | export const planDrag = (page: Page, move: DragMove, opts: DragPlanOptions = {}): Promise<TouchPlan> =>
  231 |   page.evaluate(([m, o]) => window.__harness!.planDrag(m, o), [move, opts] as const);
  232 | export const perfStart = (page: Page, label: string): Promise<void> =>
  233 |   page.evaluate((l) => window.__harness!.perfStart(l), label);
  234 | export const perfStop = (page: Page): Promise<void> => page.evaluate(() => window.__harness!.perfStop());
  235 | export const perfStats = (page: Page, label: string): Promise<PerfStats | null> =>
  236 |   page.evaluate((l) => window.__harness!.perfStats(l), label);
  237 | 
  238 | /** Waits until the level window `kind` is open (`pause`, `exit`, `offer`, `loss`, `win`). */
  239 | export async function waitWindow(page: Page, kind: string, timeoutMs = 120_000): Promise<void> {
> 240 |   await page.waitForFunction((k) => window.__harness!.status().window === k, kind, {
      |              ^ TimeoutError: page.waitForFunction: Timeout 120000ms exceeded.
  241 |     timeout: timeoutMs,
  242 |     polling: 50,
  243 |   });
  244 | }
  245 | 
  246 | /** Waits until the attempt's log has more than `n` actions. */
  247 | export async function waitLog(page: Page, n: number, timeoutMs = 5_000): Promise<void> {
  248 |   await page.waitForFunction((k) => window.__harness!.status().logLength > k, n, {
  249 |     timeout: timeoutMs,
  250 |     polling: 30,
  251 |   });
  252 | }
  253 | 
  254 | /**
  255 |  * Taps a harness tap target (pause button, a text button) through the touch driver, once it is on screen and at rest
  256 |  * (the same point twice, 200 ms apart: window entries fade and slide in, JUICE #52 / #70 / #87).
  257 |  */
  258 | export async function tap(gp: GamePage, target: TapTarget, timeoutMs = 60_000): Promise<void> {
  259 |   const end = performance.now() + timeoutMs;
  260 |   let prev: ClientPoint | null = null;
  261 |   for (;;) {
  262 |     const p = await gp.page.evaluate((t) => window.__harness!.tapPoint(t), target);
  263 |     if (p && prev && Math.abs(p.x - prev.x) < 0.5 && Math.abs(p.y - prev.y) < 0.5) {
  264 |       await gp.touch.tap(p);
  265 |       return;
  266 |     }
  267 |     if (performance.now() > end) throw new Error(`tap target not on screen: ${JSON.stringify(target)}`);
  268 |     prev = p;
  269 |     await sleep(200);
  270 |   }
  271 | }
  272 | 
  273 | /**
  274 |  * Plays one drag move as a real touch gesture and checks that the scene committed exactly that move (log grows by one,
  275 |  * last action = `move`). Does not wait for the move's cues; `waitInteractive` / `waitWindow` do.
  276 |  */
  277 | export async function playMove(
  278 |   gp: GamePage,
  279 |   move: DragMove,
  280 |   opts: DragPlanOptions = {},
  281 |   pace: 'ack' | 'clock' = 'ack',
  282 | ): Promise<void> {
  283 |   const before = (await status(gp.page)).logLength;
  284 |   const plan = await planDrag(gp.page, move, opts);
  285 |   await gp.touch.gesture(plan, true, pace);
  286 |   try {
  287 |     await waitLog(gp.page, before);
  288 |   } catch {
  289 |     throw new Error(`move not committed: ${JSON.stringify(move)} (log length ${before})`);
  290 |   }
  291 |   await assertLastMove(gp.page, move);
  292 | }
  293 | 
  294 | /** The attempt's last action is exactly `move` (the scene committed what the gesture planned). */
  295 | export async function assertLastMove(page: Page, move: DragMove): Promise<void> {
  296 |   const s = await state(page);
  297 |   const last = s.log[s.log.length - 1];
  298 |   const same =
  299 |     last?.kind === 'drag' &&
  300 |     last.pieceId === move.pieceId &&
  301 |     last.to.ix === move.to.ix &&
  302 |     last.to.iy === move.to.iy &&
  303 |     last.to.mode === move.to.mode;
  304 |   if (!same) throw new Error(`committed ${JSON.stringify(last)} instead of ${JSON.stringify(move)}`);
  305 | }
  306 | 
  307 | /** Plays `moves` in order, each after the board became interactive again (the last one's cues are not awaited). */
  308 | export async function playMoves(
  309 |   gp: GamePage,
  310 |   moves: readonly DragMove[],
  311 |   opts: DragPlanOptions = {},
  312 | ): Promise<void> {
  313 |   for (const move of moves) {
  314 |     await waitInteractive(gp.page);
  315 |     await playMove(gp, move, opts);
  316 |   }
  317 | }
  318 | 
```