/**
 * The tutorial glove (UX_FLOWS §13.1 "Eldiven", DL-2R-20; GDD §14 "`hand.path` anlamı"; TECH §2R.9 part 3): when it may
 * play and the path its fingertip follows on screen. Pure: core reads + layout geometry, no Phaser.
 *
 * Play condition (DL-2R-20), checked when the step becomes active and after every move end (one BFS, `tryBeginDrag`):
 * a `drag` / `hold` glove plays only when (a) `path[0]` is a cell of one of the step's highlighted blocks, (b) that
 * block can be held now (K-09) and (c) the path walks through the block's reachable set R (K-08) and ends on a
 * release that does not cancel (K-07 rows 2, 6, 7; `hold` over the site columns). Otherwise no glove: the highlight
 * and the bubble stay. A `tap` glove needs only its target on screen (the view's highlight rect).
 *
 * Fingertip path: `path[0]` is the touched cell's centre; every later point is the held cell's centre plus the drag's
 * finger offset (`drag.fingerOffsetCells` rows under the block, K-08 "p = parmak − tutmaOfseti + (0; 1,2)"), so the
 * glove moves the way a finger moves the block. Corners are rounded with `CORNER_RADIUS_PX` (UX §13.1: 24 px).
 */
import { pieceBoardCells } from '../../../core/grid.ts';
import { tryBeginDrag } from '../../../core/movement.ts';
import type { DragRules, DragSession } from '../../../core/movement.ts';
import type { TutorialStepData } from '../../../core/level/schema.ts';
import type { GameState } from '../../../core/state.ts';
import type { DragNode, PieceId } from '../../../core/types.ts';
import type { Layout } from '../../../theme/layout.ts';
import { TOKENS } from '../../../theme/tokens.ts';

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** UX §13.1: corners of the glove path are rounded with a 24 px radius. */
export const CORNER_RADIUS_PX = 24;

/** A unit step of the drag graph to anchor (ax, ay): same mode first, then FREE, then a rail; else any R node there. */
function stepTo(session: DragSession, node: DragNode, ax: number, ay: number): DragNode | null {
  const near = session.neighbours(node).filter((n) => n.ix === ax && n.iy === ay);
  const same = near.find((n) => n.mode === node.mode);
  if (same) return same;
  const free = near.find((n) => n.mode === 0);
  if (free) return free;
  if (near[0]) return near[0];
  const modes = session.reachableNodes().filter((n) => n.ix === ax && n.iy === ay);
  return modes.find((n) => n.mode === 0) ?? modes[0] ?? null;
}

/**
 * DL-2R-20: may the step's glove play on state `s`? `pieces` = the step's highlighted blocks, `rules` the level's drag
 * rules (K-09 (c) chain / wet). A step without `hand` has no glove.
 */
export function glovePlays(
  s: GameState,
  step: TutorialStepData,
  pieces: readonly PieceId[],
  rules: DragRules = {},
): boolean {
  const hand = step.hand;
  if (!hand) return false;
  if (hand.kind === 'tap') return true;
  const path = hand.path ?? [];
  const p0 = path[0];
  if (!p0) return false;
  const pieceId = pieces.find((id) => pieceBoardCells(s, id).some((c) => c.x === p0[0] && c.y === p0[1]));
  if (pieceId === undefined) return false; // (a) the block left path[0]
  const attempt = tryBeginDrag(s, pieceId, rules);
  if (!attempt.ok) return false; // (b) K-09
  const session = attempt.session;
  const ox = p0[0] - session.start.ix;
  const oy = p0[1] - session.start.iy;
  let node: DragNode = session.start;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] as readonly [number, number];
    const b = path[i] as readonly [number, number];
    if (a[0] !== b[0] && a[1] !== b[1]) return false;
    const dx = Math.sign(b[0] - a[0]);
    const dy = Math.sign(b[1] - a[1]);
    let px = a[0];
    let py = a[1];
    while (px !== b[0] || py !== b[1]) {
      px += dx;
      py += dy;
      const next = stepTo(session, node, px - ox, py - oy);
      if (!next) return false; // (c) outside R
      node = next;
    }
  }
  const drop = session.classify(node);
  if (drop.kind === 'cancel') return false; // (c) a cancel
  return hand.kind !== 'hold' || drop.kind !== 'yard';
}

/** The fingertip points of a `drag` / `hold` path on screen (design px; see the module comment). */
export function fingerPoints(layout: Layout, path: readonly (readonly [number, number])[]): Point[] {
  const g = layout.grid;
  const offset = TOKENS.drag.fingerOffsetCells * g.cellPx;
  return path.map(([cx, cy], i) => {
    const r = g.cellRect(cx, cy);
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 + (i === 0 ? 0 : offset) };
  });
}

/**
 * The polyline `pts` with every inner corner replaced by a circular arc of radius ≤ `radius` (shortened when a leg is
 * short), sampled every ≤ 15°. The first and last points stay.
 */
export function roundedPath(pts: readonly Point[], radius = CORNER_RADIUS_PX): Point[] {
  if (pts.length < 3) return [...pts];
  const out: Point[] = [pts[0] as Point];
  for (let i = 1; i + 1 < pts.length; i++) {
    const a = pts[i - 1] as Point;
    const b = pts[i] as Point;
    const c = pts[i + 1] as Point;
    const l1 = Math.hypot(b.x - a.x, b.y - a.y);
    const l2 = Math.hypot(c.x - b.x, c.y - b.y);
    if (l1 === 0 || l2 === 0) {
      out.push(b);
      continue;
    }
    const u1 = { x: (b.x - a.x) / l1, y: (b.y - a.y) / l1 };
    const u2 = { x: (c.x - b.x) / l2, y: (c.y - b.y) / l2 };
    const turn = Math.acos(Math.max(-1, Math.min(1, u1.x * u2.x + u1.y * u2.y)));
    if (turn < 1e-6) {
      out.push(b);
      continue;
    }
    // tangent length d = r · tan(turn / 2), at most half of each leg
    const r = Math.min(radius, Math.min(l1, l2) / 2 / Math.tan(turn / 2));
    const d = r * Math.tan(turn / 2);
    const p1 = { x: b.x - u1.x * d, y: b.y - u1.y * d };
    const cross = u1.x * u2.y - u1.y * u2.x;
    const side = cross > 0 ? 1 : -1;
    const centre = { x: p1.x - u1.y * r * side, y: p1.y + u1.x * r * side };
    const a0 = Math.atan2(p1.y - centre.y, p1.x - centre.x);
    const steps = Math.max(2, Math.ceil(turn / (Math.PI / 12)));
    for (let k = 0; k <= steps; k++) {
      const ang = a0 + side * turn * (k / steps);
      out.push({ x: centre.x + r * Math.cos(ang), y: centre.y + r * Math.sin(ang) });
    }
  }
  out.push(pts[pts.length - 1] as Point);
  return out;
}

/** Point at fraction `u` (0…1) of a polyline, by length. */
export function pathAt(path: readonly Point[], u: number): Point {
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1) return path[0] as Point;
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] as Point;
    const b = path[i] as Point;
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    lens.push(l);
    total += l;
  }
  let d = Math.max(0, Math.min(1, u)) * total;
  for (let i = 1; i < path.length; i++) {
    const l = lens[i - 1] as number;
    const a = path[i - 1] as Point;
    const b = path[i] as Point;
    if (d <= l || i === path.length - 1) {
      const k = l === 0 ? 1 : Math.min(1, d / l);
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
    d -= l;
  }
  return path[path.length - 1] as Point;
}

/** Trail dot centres along `path`, every `gap` px from its start (UX §13.1: 12 px dots, 22 px apart). */
export function trailDots(path: readonly Point[], gap: number = TOKENS.tutorial.trailGapPx): Point[] {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] as Point;
    const b = path[i] as Point;
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  if (total === 0 || gap <= 0) return path.length > 0 ? [path[0] as Point] : [];
  const n = Math.floor(total / gap);
  const out: Point[] = [];
  for (let k = 0; k <= n; k++) out.push(pathAt(path, (k * gap) / total));
  return out;
}
