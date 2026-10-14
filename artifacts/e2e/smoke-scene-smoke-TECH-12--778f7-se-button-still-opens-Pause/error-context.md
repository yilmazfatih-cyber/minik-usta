# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> scene smoke (TECH 12.4, Faz 2R) >> UX 13.1 level 1 step 1: the drag glove plays (with its block ghost, DS-15) and the pause button still opens Pause
- Location: tests/e2e/smoke.spec.ts:226:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 1

  Object {
-   "hidden": false,
+   "hidden": true,
    "kind": "drag",
  }
```

# Test source

```ts
  137 |   }) => {
  138 |     const gp = await attachGame(page, context);
  139 |     await open(page);
  140 |     await loadLevel(page, 2);
  141 |     const moves = await golden(page, 2);
  142 |     await playMoves(gp, moves.slice(0, 1), E2E_DRAG);
  143 |     await waitInteractive(page);
  144 |     const lives = (await state(page)).lives;
  145 |     for (const stay of [{ kind: 'text', key: 'exit.stay' } as const, { kind: 'close' } as const]) {
  146 |       await tap(gp, { kind: 'pause' });
  147 |       await waitWindow(page, 'pause', 30_000);
  148 |       await tap(gp, { kind: 'text', key: 'pause.exit' });
  149 |       await waitWindow(page, 'exit', 30_000);
  150 |       await tap(gp, stay);
  151 |       await waitWindow(page, 'pause', 30_000);
  152 |       await tap(gp, { kind: 'text', key: 'common.continue' });
  153 |       await waitInteractive(page);
  154 |     }
  155 |     const s = await state(page);
  156 |     expect([s.outcome, s.logLength]).toEqual(['playing', 2]);
  157 |     expect(s.lives).toEqual(lives);
  158 |     expect(gp.errors).toEqual([]);
  159 |   });
  160 | 
  161 |   test('K-07 a system-cancelled touch (touchcancel) mid-drag commits no move', async ({ page, context }) => {
  162 |     const gp = await attachGame(page, context);
  163 |     await open(page);
  164 |     await loadLevel(page, 2);
  165 |     const first = (await golden(page, 2))[0];
  166 |     if (!first) throw new Error('level 2 golden is empty');
  167 |     await waitInteractive(page);
  168 |     const before = await state(page);
  169 |     await gp.touch.gesture(await planDrag(page, first, E2E_DRAG), false);
  170 |     await gp.cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  171 |     await waitInteractive(page);
  172 |     const after = await status(page);
  173 |     expect([after.logLength, after.movesMade]).toEqual([before.logLength, 0]);
  174 |     expect((await state(page)).hash).toBe(before.hash);
  175 |     await playMoves(gp, [first], E2E_DRAG);
  176 |     expect((await status(page)).logLength).toBe(before.logLength + 1);
  177 |     expect(gp.errors).toEqual([]);
  178 |   });
  179 | 
  180 |   test('TECH 10.4 level 1 won → "Devam" → home → "BÖLÜM 2": the level scene is woken, not created again', async ({
  181 |     page,
  182 |     context,
  183 |   }) => {
  184 |     const gp = await attachGame(page, context);
  185 |     await open(page);
  186 |     await loadLevel(page, 1);
  187 |     await playMoves(gp, await golden(page, 1), E2E_DRAG);
  188 |     await waitWindow(page, 'win', 120_000);
  189 |     const creates = (await state(page)).levelCreates;
  190 |     await tap(gp, { kind: 'text', key: 'common.continue' });
  191 |     await page.waitForFunction(() => window.__harness!.status().scene === 'Home', null, { timeout: 60_000 });
  192 |     await tap(gp, { kind: 'text', key: 'home.play', params: { n: 2 } });
  193 |     await waitInteractive(page, 2);
  194 |     const s = await state(page);
  195 |     expect([s.levelId, s.levelCreates, s.window]).toEqual([2, creates, null]);
  196 |     expect(gp.errors).toEqual([]);
  197 |   });
  198 | 
  199 |   test('K-43 + K-53 a reload keeps the tutorial step on screen (level 1: step 2 after the first correct placement)', async ({
  200 |     page,
  201 |     context,
  202 |   }) => {
  203 |     const gp = await attachGame(page, context);
  204 |     await open(page);
  205 |     await loadLevel(page, 1);
  206 |     await waitInteractive(page, 1);
  207 |     expect((await state(page)).tutorial).toMatchObject({ index: 0, textKey: 'tut.m.lift' });
  208 |     const moves = await golden(page, 1);
  209 |     await playMoves(gp, moves.slice(0, 1), E2E_DRAG);
  210 |     await waitInteractive(page);
  211 |     const before = await state(page);
  212 |     expect(before.tutorial).toMatchObject({ index: 1, textKey: 'tut.m.useall' });
  213 |     await page.reload();
  214 |     await waitReady(page);
  215 |     await waitWindow(page, 'pause', 30_000);
  216 |     await tap(gp, { kind: 'text', key: 'common.continue' });
  217 |     await waitInteractive(page);
  218 |     const after = await state(page);
  219 |     expect(after.log).toEqual(before.log);
  220 |     expect(stepOf(after.tutorial)).toEqual(stepOf(before.tutorial));
  221 |     await playMoves(gp, moves.slice(1), E2E_DRAG);
  222 |     await waitWindow(page, 'win', 120_000);
  223 |     expect(gp.errors).toEqual([]);
  224 |   });
  225 | 
  226 |   test('UX 13.1 level 1 step 1: the drag glove plays (with its block ghost, DS-15) and the pause button still opens Pause', async ({
  227 |     page,
  228 |     context,
  229 |   }) => {
  230 |     const gp = await attachGame(page, context);
  231 |     await open(page);
  232 |     await loadLevel(page, 1);
  233 |     await waitInteractive(page, 1);
  234 |     await page.waitForFunction(() => window.__harness!.state().tutorial?.phase === 'shown', null, {
  235 |       timeout: 60_000,
  236 |     });
> 237 |     expect((await state(page)).tutorialHand).toEqual({ kind: 'drag', hidden: false });
      |                                              ^ Error: expect(received).toEqual(expected) // deep equality
  238 |     await tap(gp, { kind: 'pause' });
  239 |     await waitWindow(page, 'pause', 30_000);
  240 |     await tap(gp, { kind: 'text', key: 'common.continue' });
  241 |     await waitInteractive(page);
  242 |     const s = await state(page);
  243 |     expect(s.window).toBeNull();
  244 |     expect(s.tutorial).toMatchObject({ index: 0 });
  245 |     expect(gp.errors).toEqual([]);
  246 |   });
  247 | 
  248 |   test('META 4 / K-54 / UX 5.2 level 8: 3 hammer trials, the slot × and the system back cancel the pick, a hit spends one', async ({
  249 |     page,
  250 |     context,
  251 |   }) => {
  252 |     const gp = await attachGame(page, context);
  253 |     await open(page);
  254 |     await loadLevel(page, 8);
  255 |     await waitInteractive(page, 8);
  256 |     expect((await state(page)).boosters).toMatchObject({ hammer: 3 });
  257 |     const pick = async () => (await state(page)).pick.kind;
  258 |     await tap(gp, { kind: 'slot', id: 'hammer' });
  259 |     await gameMs(page, 200);
  260 |     expect(await pick()).toBe('hammer');
  261 |     await tap(gp, { kind: 'cancel' }); // DS-13: the red × on the selected slot
  262 |     await gameMs(page, 200);
  263 |     expect(await pick()).toBeNull();
  264 |     await tap(gp, { kind: 'slot', id: 'hammer' });
  265 |     await gameMs(page, 200);
  266 |     expect(await pick()).toBe('hammer');
  267 |     await page.evaluate(() => history.back()); // DS-13: the system back (popstate) cancels the pick, no Pause
  268 |     await gameMs(page, 300);
  269 |     expect([await pick(), (await status(page)).window]).toEqual([null, null]);
  270 |     const lvl = compiled(levelJson(8));
  271 |     const cargo =
  272 |       [...Array(lvl.layout.counts.pieces).keys()].find((i) => lvl.pieces[i]?.cls === 'cargo') ?? -1;
  273 |     await tap(gp, { kind: 'slot', id: 'hammer' });
  274 |     await gameMs(page, 200);
  275 |     const before = (await status(page)).logLength;
  276 |     await tap(gp, { kind: 'piece', pieceId: cargo });
  277 |     await page.waitForFunction((n) => window.__harness!.status().logLength > n, before, { timeout: 20_000 });
  278 |     await waitInteractive(page, 8);
  279 |     const s = await state(page);
  280 |     expect(s.log.at(-1)).toMatchObject({ kind: 'hammer', target: { pieceId: cargo } });
  281 |     expect(s.boosters).toMatchObject({ hammer: 2 }); // UX 5.2 step 3: count − 1, in the same write
  282 |     expect(s.savedAttempt?.actions).toBe(s.log.length);
  283 |     expect(gp.errors).toEqual([]);
  284 |   });
  285 | 
  286 |   test('UX 13.2 opening the trowel pick closes and marks tut.ctx.goldtrowel (level 5); the strip × cancels', async ({
  287 |     page,
  288 |     context,
  289 |   }) => {
  290 |     const gp = await attachGame(page, context);
  291 |     await open(page);
  292 |     await loadLevel(page, 5);
  293 |     const moves = await golden(page, 5);
  294 |     // the golden move that earns the first Golden Trowel (K-33), on the core
  295 |     const lvl = compiled(levelJson(5));
  296 |     const g = GameSession.start(lvl, { preBoosters: [], streakTier: 0 }, { hooks: levelHooks(lvl) });
  297 |     let k = -1;
  298 |     for (let i = 0; i < moves.length && k < 0; i++) {
  299 |       const m = moves[i] as DragMove;
  300 |       g.apply({ kind: 'drag', pieceId: m.pieceId, to: m.to });
  301 |       if (trowelsOf(g.state) > 0) k = i;
  302 |     }
  303 |     expect(k).toBeGreaterThanOrEqual(0);
  304 |     await playMoves(gp, moves.slice(0, k + 1), E2E_DRAG);
  305 |     await waitInteractive(page, 5);
  306 |     const before = (await state(page)).contextTip;
  307 |     expect(before.showing === 'goldtrowel' || before.queued.includes('goldtrowel')).toBe(true);
  308 |     await tap(gp, { kind: 'trowel' });
  309 |     await page.waitForFunction(
  310 |       () => window.__harness!.tapPoint({ kind: 'text', key: 'booster.hint.trowel' }) !== null,
  311 |       null,
  312 |       { timeout: 30_000 },
  313 |     );
  314 |     await gameMs(page, 100);
  315 |     const open1 = (await state(page)).contextTip;
  316 |     expect(open1.showing).toBeNull();
  317 |     expect(open1.queued).not.toContain('goldtrowel');
  318 |     expect(open1.seen).toContain('goldtrowel');
  319 |     await tap(gp, { kind: 'cancel' }); // DS-13: the × drawn in place of the strip's trowel icon
  320 |     await gameMs(page, 1000);
  321 |     const s = await state(page);
  322 |     expect(s.pick.kind).toBeNull();
  323 |     expect(s.contextTip.showing).not.toBe('goldtrowel');
  324 |     expect(gp.errors).toEqual([]);
  325 |   });
  326 | 
  327 |   test('K-30 a dead-end fixture board tears down: tut.ctx.teardown shows and the level plays on', async ({
  328 |     page,
  329 |     context,
  330 |   }) => {
  331 |     const gp = await attachGame(page, context);
  332 |     await open(page);
  333 |     const d = levelJson(1);
  334 |     const build = d['build'] as { segments: { name: unknown }[] };
  335 |     const data = {
  336 |       ...d,
  337 |       id: 90,
```