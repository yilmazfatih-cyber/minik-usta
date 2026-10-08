/**
 * Tutorial highlight ids → screen rectangles (UX_FLOWS §13.1 "Vurgu kimlikleri"; TECH_DESIGN §8.2) and the Usta Dede
 * bubble dock (UX §13.1 "Balon", PL-2R-12). Pure: layout geometry + state reads, no Phaser.
 *
 * Faz 2R light tutorial (K-53): a highlight is only a soft glow around its target — nothing else dims, nothing is
 * blocked (the Faz 2 spotlight holes, dark layer and touch blockers are gone). A highlight whose target is not on
 * screen (the truck chip while the queue is empty, a booster slot the level does not show) is skipped; the step runs.
 */
import { buildFront } from '../../../core/placement.ts';
import { shapeByIndex } from '../../../core/shapes.ts';
import { GF, gapField, pieceShape } from '../../../core/state.ts';
import type { GameState } from '../../../core/state.ts';
import type { CompiledLevel } from '../../../core/level/compile.ts';
import { rectBottom, rectRight, rectsOverlap } from '../../../theme/layout.ts';
import type { Layout, Rect } from '../../../theme/layout.ts';
import { statePose } from '../pieceState.ts';

/** HUD rectangles the level screen knows (status strip parts, goals chips, booster slots). */
export interface HudRects {
  /** "Kamyonda: N" chip; null while the queue is empty (the chip is hidden, UX §5.1, DL-2R-20). */
  readonly truck: Rect | null;
  readonly streak: Rect | null;
  /** The blocks-left chip of the goals panel (`blocks`, UX §5.9). */
  readonly blocks?: Rect | null;
  /** Booster slot `booster:<id>` (UX §5.10); null when the level shows no such slot. */
  readonly booster?: (id: string) => Rect | null;
}

export interface HighlightInput {
  readonly layout: Layout;
  readonly state: GameState;
  readonly level: CompiledLevel;
  readonly hud: HudRects;
  /** The block being dragged and its current drag node: its `piece:` glow is there. */
  readonly dragging?: { readonly pieceId: number; readonly ix: number; readonly iy: number } | null;
}

/** Rectangles of one highlight id (empty when the thing is not on screen). */
export function highlightRects(id: string, input: HighlightInput): Rect[] {
  const { layout, state: s, level } = input;
  const g = layout.grid;
  if (id.startsWith('piece:') || id.startsWith('debris:') || id.startsWith(PID_PREFIX)) {
    const pid = id.startsWith(PID_PREFIX) ? runtimePieceId(id, s) : level.tutorialPieceIds.get(id);
    if (pid === undefined) return [];
    const shape = shapeByIndex(pieceShape(s, pid));
    const drag = input.dragging;
    if (drag && drag.pieceId === pid) return [g.pieceRect(drag.ix, drag.iy, shape.w, shape.h)];
    const pose = statePose(s, pid);
    if (!pose) return [];
    return [g.pieceRect(pose.ax, pose.ay, shape.w, shape.h)];
  }
  if (id.startsWith('cell:')) {
    const [x, y] = id
      .slice(5)
      .split(',')
      .map((v) => Number(v));
    if (x === undefined || y === undefined || !Number.isFinite(x) || !Number.isFinite(y)) return [];
    return [g.cellRect(x, y)];
  }
  if (id.startsWith('gap:')) {
    const i = Number(id.slice(4));
    const gap = level.gaps[i];
    if (!gap) return [];
    return [g.gapRect(gapField(s, i, GF.y), gap.size)];
  }
  if (id.startsWith('booster:')) {
    const r = input.hud.booster?.(id.slice('booster:'.length)) ?? null;
    return r ? [r] : [];
  }
  switch (id) {
    case 'crane':
      return [layout.board.crane];
    case 'build':
      return [layout.board.site];
    case 'wall':
      return [g.wallRect(level.wallHeight)];
    case 'front':
      return buildFront(s).map((c) => g.cellRect(c.x, c.y));
    case 'panorama':
      return [layout.top.panorama];
    case 'goals':
      return [layout.top.goals];
    case 'blocks':
      return input.hud.blocks ? [input.hud.blocks] : [];
    case 'moves':
      return [layout.top.moves];
    case 'truck':
      return input.hud.truck ? [input.hud.truck] : [];
    case 'streak':
      return input.hud.streak ? [input.hud.streak] : [];
    default:
      return []; // pre:*, obstacle:*, fan: not on the Faz 2R screen
  }
}

/**
 * Runtime highlight id of one block by its `PieceId` (contextual tips light the block of their trigger — the bounced or
 * the blocked block — which need not have a `piece:<i>` tutorial id). Not a level-data id.
 */
export const PID_PREFIX = 'pid:';
export const pidHighlight = (id: number): string => `${PID_PREFIX}${id}`;

function runtimePieceId(id: string, s: GameState): number | undefined {
  const n = Number(id.slice(PID_PREFIX.length));
  return Number.isInteger(n) && n >= 0 && n < s.lvl.layout.counts.pieces ? n : undefined;
}

export function highlightAll(ids: readonly string[], input: HighlightInput): Rect[] {
  return ids.flatMap((id) => highlightRects(id, input));
}

export function padRect(r: Rect, pad: number): Rect {
  return { x: r.x - pad, y: r.y - pad, w: r.w + 2 * pad, h: r.h + 2 * pad };
}

/** Bounding box of `rects` (null when empty). */
export function boundsOf(rects: readonly Rect[]): Rect | null {
  if (rects.length === 0) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const r of rects) {
    x0 = Math.min(x0, r.x);
    y0 = Math.min(y0, r.y);
    x1 = Math.max(x1, rectRight(r));
    y1 = Math.max(y1, rectBottom(r));
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// --- bubble dock (UX §13.1 "Balon", PL-2R-12) ---------------------------------------------------------------------------

/** HUD highlight ids: the bubble takes the top dock and its tail points up to the HUD. */
export const HUD_HIGHLIGHTS: ReadonlySet<string> = new Set(['panorama', 'goals', 'blocks', 'moves']);

export type BubbleDock = 'top' | 'bottom';

export interface DockQuery {
  readonly layout: Layout;
  /** Bubble size (portrait + gap + box), design px. */
  readonly w: number;
  readonly h: number;
  /** The step's highlight ids and their rects (soft condition). */
  readonly ids: readonly string[];
  readonly lit: readonly Rect[];
  /** Bounding box of the glove path (soft condition); null without a glove. */
  readonly handBox: Rect | null;
}

export interface DockPlace {
  readonly dock: BubbleDock;
  /** Portrait + bubble at its place. */
  readonly rect: Rect;
  /** The tail points up to the HUD (a HUD highlight). */
  readonly tailUp: boolean;
}

/** Top-left of the two docks (`tutorial.dockGapPx` = 16; x = the screen margin, 24). */
export function dockRect(
  layout: Layout,
  dock: BubbleDock,
  w: number,
  h: number,
  margin: number,
  gap: number,
): Rect {
  const y = dock === 'top' ? layout.top.groupBottomY + gap : rectBottom(layout.board.status) + gap;
  return { x: margin, y, w, h };
}

/** The bottom dock exists only when the bubble ends `gap` px over the bottom group (none at FIT 1080 × 1920). */
export function bottomDockValid(layout: Layout, h: number, gap: number): boolean {
  return rectBottom(layout.board.status) + gap + h <= layout.bottom.groupTopY - gap;
}

/**
 * Hard areas the bubble (padded by `gap`) never touches: the yard cells, the site cells, the status strip and the top
 * group (HUD).
 */
export function dockHardAreas(layout: Layout): Rect[] {
  return [
    layout.board.yard,
    layout.board.site,
    layout.board.status,
    { x: 0, y: 0, w: layout.W, h: layout.top.groupBottomY },
  ];
}

const touches = (r: Rect, areas: readonly Rect[]): boolean => areas.some((a) => rectsOverlap(r, a));

/**
 * UX §13.1 "Seçim (PL-2R-12)": a HUD highlight takes the top dock (tail up). Else the docks in order top, bottom: the
 * first meeting the hard condition (yard / site cells, status strip, HUD) and the soft one (the step's highlights, the
 * glove path box); else the first meeting the hard one; else the top dock.
 */
export function placeBubble(q: DockQuery, margin: number, gap: number): DockPlace {
  const { layout } = q;
  const top = dockRect(layout, 'top', q.w, q.h, margin, gap);
  if (q.ids.some((id) => HUD_HIGHLIGHTS.has(id))) return { dock: 'top', rect: top, tailUp: true };
  const docks: DockPlace[] = [{ dock: 'top', rect: top, tailUp: false }];
  if (bottomDockValid(layout, q.h, gap))
    docks.push({ dock: 'bottom', rect: dockRect(layout, 'bottom', q.w, q.h, margin, gap), tailUp: false });
  const hard = dockHardAreas(layout);
  const soft = [...q.lit, ...(q.handBox ? [q.handBox] : [])];
  const hardOk = (d: DockPlace): boolean => !touches(padRect(d.rect, gap), hard);
  const softOk = (d: DockPlace): boolean => !touches(padRect(d.rect, gap), soft);
  return docks.find((d) => hardOk(d) && softOk(d)) ?? docks.find(hardOk) ?? (docks[0] as DockPlace);
}
