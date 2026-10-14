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
import { VIEW } from '../../src/scenes/level/viewConstants.ts';
import { boardTray, createLayout } from '../../src/theme/layout.ts';
import { TOKENS } from '../../src/theme/tokens.ts';
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
    expect(src('src/scenes/level/LevelScene.ts')).toMatch(/const r = boardTray\(L, TOKENS\);[\s\S]{0,300}if \(r\.sides\)/);
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
    expect(src('src/ui/StatusStrip.ts')).toMatch(/this\.cancel\.setVisible\(on\);\s+this\.trowel\.setVisible\(!on\);/);
    expect(src('src/ui/icons.ts')).toMatch(/export function drawCancelX[\s\S]{0,200}TOKENS\.kit\.buttonColor\.red/);
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

  it('ART 7.2 ozalit ghost (DS-03 / DS-30): the silhouette opaque in planUnderlay, then blueprint 35 % and the dashed contour', () => {
    const tool = src('tools/assets.ts');
    expect(tool).toMatch(/underlay: b\.planUnderlay,\s+fill: b\.blueprint,\s+fillAlpha: 0\.35,\s+linePx: 4,\s+lineAlpha: 0\.9/);
    expect(tool).toMatch(/\[g\.underlay, 1\],\s+\[g\.fill, g\.fillAlpha\],/);
    expect(TOKENS.color.board.planUnderlay).toBe('#BCCADD');
  });
});
