/**
 * design-lead ekran incelemesi 1 (docs/review_inbox/design-lead-2R-screens-1.md) — the code-lead findings, pure parts:
 * DS-16 board tray (UX §5.8 rule 9), DS-12 level label in the panorama well (UX §5.9 item 8), DS-13 "Vazgeç" in the
 * thumb zone (UX §5.2 step 1), DS-15 tutorial block ghost (UX §13.1), DS-14 Söküm line duration, DS-03 / DS-30 ghost
 * underlay (ART §7.2).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: { TintModes: { FILL: 1 }, BlendModes: { ADD: 1, NORMAL: 0 }, Geom: { Rectangle: class {} } },
}));

import { createInitialState } from '../../src/core/state.ts';
import { panoramaView } from '../../src/core/panorama.ts';
import type { PanoramaSegment } from '../../src/core/panorama.ts';
import { hintStripY, HINT_GAP_PX } from '../../src/scenes/level/TrowelPicker.ts';
import {
  ContextTips,
  LOCKED_LINE_TOPICS,
  TEARDOWN_LINE_MS,
} from '../../src/scenes/level/tutorial/contextTips.ts';
import { fingerPoints, ghostPoints } from '../../src/scenes/level/tutorial/glove.ts';
import { planMove } from '../../src/scenes/level/juice/plan.ts';
import type { PlanContext } from '../../src/scenes/level/juice/plan.ts';
import type { GameEvent } from '../../src/core/types.ts';
import { JUICE_VIEW, VIEW } from '../../src/scenes/level/viewConstants.ts';
import { boardTray, createLayout } from '../../src/theme/layout.ts';
import { TOKENS } from '../../src/theme/tokens.ts';
import { DEBUG_ROOT_ID, LABEL } from '../../src/debug/labels.ts';
import { BALLOON_BUTTON_GAP_PX, homeLayout, lockedTabBalloon } from '../../src/ui/kit/layout.ts';
import { WELL_LABEL_PAD_PX, panoramaWellSplit } from '../../src/ui/Panorama.ts';
import { levelFile } from '../core/moves.fixtures.ts';

const src = (path: string): string => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const layoutOf = (n: number, H = 1920) => createLayout(TOKENS, H, levelFile(n).geo);
const STYLE = {
  padPx: VIEW.panoramaPadPx,
  gapCells: VIEW.panoramaGapCells,
  maxCellPx: VIEW.panoramaMaxCellPx,
  minCellPx: VIEW.panoramaMinCellPx,
};

describe('design-lead screens review 1 — code-lead findings', () => {
  it('UX 5.8 rule 9 board tray (DS-16): pad = min(24, yardX − 20 − 12); 8 columns → a full-width band without side edges', () => {
    const b1 = layoutOf(1);
    expect(b1.grid.yardX).toBe(72);
    const t1 = boardTray(b1, TOKENS);
    expect(t1).toMatchObject({ sides: true, pad: 24, x: 72 - 20 - 24 });
    expect(t1.x + t1.w).toBe(1080 - t1.x); // symmetric
    expect(t1.y).toBe(b1.board.crane.y - 24);
    const b6 = layoutOf(6);
    expect(boardTray(b6, TOKENS)).toMatchObject({ sides: true, pad: 24 });
    for (const n of [8, 10]) {
      const L = layoutOf(n, 2336); // 390 × 844
      expect(L.grid.yardX).toBe(30);
      const t = boardTray(L, TOKENS);
      expect(t).toMatchObject({ sides: false, x: 0, w: 1080 }); // 30 − 32 < 8: no side edge near the screen edge
      expect(t.y).toBe(L.board.crane.y - 24);
    }
    // the scene draws the side edges only when `sides` (no rounded edge 2 CSS px from the screen edge any more)
    expect(src('src/scenes/level/LevelScene.ts')).toMatch(
      /const r = boardTray\(L, TOKENS\);[\s\S]{0,300}if \(r\.sides\)/,
    );
  });

  it('UX 5.9 item 8 level label in the panorama well (DS-12): left of the strip, hidden when the plan needs the room', () => {
    const L = layoutOf(1);
    const well = L.top.panorama;
    const one = panoramaView(createInitialState(levelFile(1)));
    const split = panoramaWellSplit(well, one, STYLE, 260);
    expect(split.label).toEqual({ x: well.x + WELL_LABEL_PAD_PX, y: well.y, w: 260, h: well.h });
    expect(split.strip.x).toBe(well.x + 24 + 260 + 24);
    expect(split.strip.x + split.strip.w).toBe(well.x + well.w - 24);
    // a 6-segment plan of 8 columns cannot keep its cell size next to the label: no label, the whole well
    const wide: PanoramaSegment[] = Array.from({ length: 6 }, () => ({
      status: 'future',
      rows: [Array(4).fill('W'), Array(4).fill('W')],
    })) as unknown as PanoramaSegment[];
    expect(panoramaWellSplit(well, wide, STYLE, 260)).toEqual({ label: null, strip: well });
    const scene = src('src/scenes/level/LevelScene.ts');
    expect(scene).toMatch(/upper\(t\('home\.play', \{ n: this\.levelId \}\)\)/);
    expect(scene).toMatch(/kitTextStyle\('brightTitle', LEVEL_LABEL_PX, TOKENS\.color\.ui\.ink\)/);
    expect(scene).toMatch(/const LEVEL_LABEL_PX = 52;/);
    // every panorama read (draw, the #18 slot, the tutorial arrow) uses the same rect
    expect(scene.match(/this\.panoRect\(\)/g)?.length).toBe(3);
  });

  it('UX 5.2 step 1 "Vazgeç" in the thumb zone (DS-13): × on the selected slot / strip trowel, text-only hint strip 16 px above the crane area', () => {
    for (const n of [1, 4, 6, 8]) {
      for (const H of [1920, 2336]) {
        const L = layoutOf(n, H);
        const y = hintStripY(L, 60);
        const bottom = y + 60;
        if (L.board.crane.y - HINT_GAP_PX - 60 >= L.top.groupBottomY + HINT_GAP_PX)
          expect(bottom).toBe(L.board.crane.y - HINT_GAP_PX);
        else expect(y).toBe(L.top.groupBottomY + HINT_GAP_PX);
      }
    }
    const picker = src('src/scenes/level/TrowelPicker.ts');
    expect(picker).not.toMatch(/TextButton|common\.cancel/); // the big cream "Vazgeç" button is gone
    const slots = src('src/ui/boosterSlots.ts');
    expect(slots).toMatch(/const CANCEL_PX = 128;/);
    expect(slots).toMatch(/v\.cancel\.setVisible\(on\);/);
    expect(slots).toMatch(/const showCount = !v\.raised &&/); // the count badge hides on the selected slot
    expect(src('src/ui/StatusStrip.ts')).toMatch(
      /this\.cancel\.setVisible\(on\);\s+this\.trowel\.setVisible\(!on\);/,
    );
    expect(src('src/ui/icons.ts')).toMatch(
      /export function drawCancelX[\s\S]{0,200}TOKENS\.kit\.buttonColor\.red/,
    );
  });

  it('UX 13.1 tutorial block ghost (DS-15): the glove walks in finger space, the ghost in block space with the same cell steps', () => {
    const L = layoutOf(3);
    const path: [number, number][] = [
      [1, 0],
      [1, 1],
      [2, 1],
    ];
    const glove = fingerPoints(L, path);
    const centre = { x: 300, y: 1300 };
    const ghost = ghostPoints(L, path, centre);
    expect(ghost[0]).toEqual(centre);
    const c = L.grid.cellPx;
    const offset = TOKENS.drag.fingerOffsetCells * c;
    // a one-cell shift inside the yard is a straight block slide (no diagonal), the glove carries the finger offset
    expect(ghost[1]).toEqual({ x: centre.x, y: centre.y - c });
    expect(ghost[2]).toEqual({ x: centre.x + c, y: centre.y - c });
    expect((glove[1]?.y ?? 0) - (glove[0]?.y ?? 0)).toBeCloseTo(-c + offset);
    expect(TOKENS.tutorial.ghostAlpha).toBe(0.55);
    expect(TOKENS.tutorial.ghostLiftMs).toBe(160);
    const view = src('src/scenes/level/TutorialView.ts');
    expect(view).toMatch(/setAlpha\(TT\.ghostAlpha \* a\)/);
    expect(view).toMatch(/Math\.min\(1, t \/ TT\.ghostLiftMs\)/);
    expect(view).toMatch(/const trail = this\.ghostPath\.length > 0 \? this\.ghostPath : this\.path;/);
  });

  it('UX 13.1 locked-sequence lines (DS-14): Söküm, truckhelp.free and reshuffle stay duration.teardownLine (2400 ms), queued lines 4000', () => {
    expect(TOKENS.duration.teardownLine).toBe(2400);
    expect(TEARDOWN_LINE_MS).toBe(2400);
    expect([...LOCKED_LINE_TOPICS].sort()).toEqual(['reshuffle', 'teardown', 'truckhelp.free']);
    const seen = new Set<string>();
    const tips = new ContextTips({ seen: (t) => seen.has(t), markSeen: (t) => void seen.add(t) });
    const open = { stepActive: false, blocked: false };
    for (const [topic, ms] of [
      ['reshuffle', 2400],
      ['truckhelp.free', 2400],
      ['queue', TOKENS.tutorial.visibleMs],
    ] as const) {
      tips.trigger(topic);
      tips.update(0, open, TOKENS.tutorial.visibleMs);
      expect(tips.showing).toBe(topic);
      tips.update(ms - 1, open, TOKENS.tutorial.visibleMs);
      expect(tips.showing).toBe(topic);
      tips.update(ms, open, TOKENS.tutorial.visibleMs);
      expect(tips.showing).toBeNull();
    }
  });

  it("DS-14 the Söküm (JUICE #107) is planned under the cue kind 'teardown', never 107: the screens tool waits on that kind", () => {
    const teardown: GameEvent = {
      seq: 0,
      step: 12,
      t: 'teardown',
      toTurn: 1,
      cause: 'tiling',
      pieces: [{ pieceId: 1, from: { zone: 'site', x: 6, y: 2, seg: 0 }, to: { zone: 'yard', x: 1, y: 0 } }],
    };
    const ctx: PlanContext = {
      reduced: true,
      gravity: 'normal',
      queuedBefore: [],
      movesBefore: 9,
      pieceHeight: () => 1,
    };
    const kinds = planMove([teardown], ctx, 10).cues.map((c) => c.kind);
    expect(kinds).toContain('teardown');
    expect(kinds).not.toContain(107);
    // the first full run waited on `cueCount(107)`, which is 0 forever: the scenario timed out after the Söküm had played
    expect(src('tools/screens.ts')).toMatch(/const CUE_TEARDOWN = 'teardown' as const;/);
    expect(src('src/harness/api.ts')).toMatch(/cueCount\(id: CueKey\): number;/);
    // tools/ type-check without vite/client: the harness API must not reach the scene graph (import.meta.env)
    expect(src('src/harness/api.ts')).not.toMatch(/from '\.\.\/scenes\//);
  });

  it('ART 7.2 ozalit ghost (DS-03 / DS-30): the silhouette opaque in planUnderlay, then blueprint 35 % and the dashed contour', () => {
    const tool = src('tools/assets.ts');
    expect(tool).toMatch(
      /underlay: b\.planUnderlay,\s+fill: b\.blueprint,\s+fillAlpha: 0\.35,\s+linePx: 4,\s+lineAlpha: 0\.9/,
    );
    expect(tool).toMatch(/\[g\.underlay, 1\],\s+\[g\.fill, g\.fillAlpha\],/);
    expect(TOKENS.color.board.planUnderlay).toBe('#BCCADD');
  });
  it('UX 3 locked tab balloon (DS-06): never over the "Bölüm N" button — above the tab only with an 8 px clearance, else inside the nav bar and on screen', () => {
    const bb = TOKENS.kit.bubble;
    const balloonH = Math.ceil(TOKENS.font.size.body * 1.3) + 2 * bb.padYPx + bb.tailPx; // HomeScene comingSoonBalloonH
    const span = (p: ReturnType<typeof lockedTabBalloon>): [number, number] =>
      p.dir === 'down' ? [p.at.y - balloonH, p.at.y] : [p.at.y, p.at.y + balloonH];
    for (const H of [1920, 2336, 2400]) {
      const geo = homeLayout(TOKENS, H);
      const tab = geo.navTabs[1] as { x: number; y: number; w: number };
      const at = { x: tab.x + tab.w / 2, y: tab.y }; // NavBar: the cell's top edge
      const p = lockedTabBalloon(geo.play, geo.nav, at, balloonH);
      const [top, bottom] = span(p);
      // with the UX §3 tokens the bar is 64 px under the button: the balloon cannot clear it, it drops into the bar
      expect(p.dir).toBe('up');
      expect(top).toBeGreaterThanOrEqual(geo.play.y + geo.play.h + BALLOON_BUTTON_GAP_PX);
      expect(top).toBeGreaterThanOrEqual(geo.nav.y);
      expect(bottom).toBeLessThanOrEqual(geo.nav.y + geo.nav.h); // on screen, in the bar (over the tab's label)
      expect(p.at.x).toBe(at.x);
    }
    // a bar far enough under the button: the balloon stays above the tab with its tail down
    const play = { x: 180, y: 1000, w: 720, h: 176 };
    const nav = { x: 0, y: 1500, w: 1080, h: 176 };
    expect(lockedTabBalloon(play, nav, { x: 540, y: 1500 }, balloonH)).toEqual({
      at: { x: 540, y: 1500 },
      dir: 'down',
    });
    expect(lockedTabBalloon(play, nav, { x: 540, y: 1200 }, balloonH).dir).toBe('up');
    const home = src('src/scenes/HomeScene.ts');
    expect(home).toMatch(/lockedTabBalloon\(this\.geo\.play, this\.geo\.nav, at, comingSoonBalloonH\(\)\)/);
  });

  it('JUICE 61 hammer flash (DS-19): the baked cargo silhouette as an additive white copy at 0,85 — the piece frame itself, corner radius kept', () => {
    expect(JUICE_VIEW.smashFlashPeak).toBe(0.85);
    const player = src('src/scenes/level/EventPlayer.ts');
    expect(player).toMatch(
      /this\.pieceFlash\(cue\.piece, time, WHITE, V\.smashFlashPeak, Math\.min\(cue\.ms, D\.blockedShake\), false\)/,
    );
    expect(player).toMatch(/const add = color === WHITE;/); // a white flash is additive (ADD), not a painted square
    // the flash overlay is the piece's own frame, tint-filled: the silhouette and its rounded corners are the frame's
    const view = src('src/scenes/level/PieceView.ts');
    expect(view).toMatch(
      /o\.setTint\(color\)\.setTintMode\(Phaser\.TintModes\.FILL\);\s+o\.setBlendMode\(add \? Phaser\.BlendModes\.ADD : Phaser\.BlendModes\.NORMAL\);/,
    );
    expect(view).toMatch(/the same frame tint-filled/);
  });

  it('DS-20 the debug badge reaches neither a review shot nor the store build: DEV-only import, screens text + DOM gate, verify-dist marker', () => {
    expect(src('src/main.ts')).toMatch(
      /if \(import\.meta\.env\.DEV\) \{[\s\S]{0,700}import\('\.\/debug\/debug\.ts'\)/,
    );
    expect(src('src/debug/panel.ts')).toMatch(/const ROOT_ID = DEBUG_ROOT_ID;/);
    const screens = src('tools/screens.ts');
    expect(screens).toMatch(/const DEBUG_LABEL = LABEL\.toggle;/);
    expect(screens).toMatch(/line\.startsWith\(DEBUG_LABEL\)/); // "DBG 60" (the toggle carries the fps)
    expect(screens).toMatch(/document\.getElementById\(id\) !== null, DEBUG_ROOT_ID/);
    expect(DEBUG_ROOT_ID).toBe('mu-debug');
    // tools/verify-dist.ts recognises the panel by one of its own labels (never a generic word like "debug")
    const marker = /Drop the running attempt/;
    expect(src('tools/verify-dist.ts')).toMatch(marker);
    expect(LABEL.restartTitle).toMatch(marker);
  });
});
