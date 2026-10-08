/**
 * Target pick of the in-level boosters (GDD K-33 Golden Trowel, K-36 Hammer, K-37 Crane; UX_FLOWS §5.2 Faz 2R table;
 * JUICE #17, #61). The picker never decides a rule: the eligible blocks and the target spots are core queries, the
 * chosen action is committed through `GameSession` by the scene (`commit`), which the core checks again (an invalid
 * target — e.g. the D3a pre-check, E-60 — is refused and spends nothing; the picker then stays open and the block shakes).
 *
 * - Opening (`start`): the hint strip `booster.hint.<id>` with "Vazgeç" (`common.cancel`) above the board; the
 *   selectable blocks pulse every `duration.spotlightPulse`, the others dim to α 0,5 (placed blocks, HUD and scene keep
 *   their look; information, so also with reduced motion).
 * - Golden Trowel (K-33): selectable = yard material blocks with a non-empty `P` (core `trowelPieces`). A tap on one:
 *   |P| = 1 → it flies there at once (`goldTrowel { pieceId, x, y }`); |P| ≥ 2 → the `P` spots show as valid ghosts
 *   (`ghost_<shape>_valid`), a tap on a ghost flies it; another selectable block changes the choice. Without any
 *   selectable block nothing opens (the scene shows `booster.trowel.noTarget`).
 * - Hammer (K-36): selectable = core `hammerTargets` (Ağır Yük, chain, site debris, stuck mortar; crates and bags with
 *   their Phase 3 rules). One tap applies it.
 * - Crane (K-37): selectable = `craneSelectable`. Cheaper than the UX drag-and-rotate flow (CL note, TECH §2R.12
 *   WP-G): after the block is chosen its correct site spots in every orientation (`craneSiteSpots`) show as ghosts
 *   (the rotation is part of the spot), and a tap on an empty yard cell moves it there (K-37 (a), same orientation).
 * - A tap on a block that is not selectable shakes it 2 px (nothing spent); "Vazgeç" closes.
 *
 * While it is open a full-screen input zone takes the touches, so the board's DragController stays out.
 */
import type Phaser from 'phaser';
import {
  craneSelectable,
  craneSiteSpots,
  hammerTargets,
  trowelPieces,
  trowelSpots,
} from '../../core/boosters.ts';
import type { MoveHooks } from '../../core/moves.ts';
import { shapeByIndex, shapeById } from '../../core/shapes.ts';
import type { ShapeDef } from '../../core/shapes.ts';
import { pieceShape } from '../../core/state.ts';
import type { GameState } from '../../core/state.ts';
import type { Move, PieceId } from '../../core/types.ts';
import { hasKey, t, tDynamic } from '../../services/i18n.ts';
import type { Layout, Rect } from '../../theme/layout.ts';
import { FRAME, ghostFrameName } from '../../theme/textures.ts';
import { TOKENS } from '../../theme/tokens.ts';
import { TextButton } from '../../ui/TextButton.ts';
import { textStyle } from '../../ui/text.ts';
import { BOOT_ATLAS_KEY } from '../atlas.ts';
import type { Frames } from '../atlas.ts';
import { DEPTH } from './depth.ts';
import { hexColor, setFrameAt } from './frameImage.ts';
import { pieceAtPoint } from './hitTest.ts';

/** The boosters with a target pick (UX §5.2); Undo applies at once, the brush is Phase 3. */
export type PickKind = 'trowel' | 'hammer' | 'crane';

/** A target spot on the board: the action it commits and the box it shows / takes taps in. */
export interface PickSpot {
  readonly move: Move;
  readonly shape: ShapeDef;
  /** Board anchor of the box (bottom-left cell). */
  readonly ax: number;
  readonly ay: number;
}

export interface TrowelPickerHost {
  layout(): Layout;
  state(): GameState | null;
  frames(): Frames | null;
  hooks(): MoveHooks;
  /** Commits the chosen action; false when the core refused it (nothing spent). */
  commit(move: Move): boolean;
  /** The pick mode opened / closed (strip and slot highlight). */
  changed(kind: PickKind | null): void;
  /** JUICE #69 on the cancel button. */
  button(button: TextButton, variant: 'press' | 'release'): void;
  /** Reduced motion (JUICE §0 rule 8): the selectable blocks and spots do not pulse. */
  reduced(): boolean;
  /**
   * UX §5.2 "seçilemeyenler α 0,5": `eligible` blocks lit (pulse `k` 0…1), the others dimmed, `selected` outlined;
   * null restores every block.
   */
  dimPieces(eligible: ReadonlySet<PieceId> | null, selected: PieceId | null, k: number): void;
  /** A refused tap (block not selectable, core refusal): the block shakes 2 px, nothing is spent. */
  refused(id: PieceId | null): void;
}

/** UX §5.2: valid targets pulse once every `duration.spotlightPulse` (1,2 s). */
const PULSE_MIN = 0.35;
const CANCEL_W = 360;
const CANCEL_H = 144;
const GHOST_CELL_TINT = hexColor(TOKENS.color.ghost.valid);

/** Selectable blocks of a pick kind now (core queries). */
export function pickEligible(kind: PickKind, s: GameState, hooks: MoveHooks): PieceId[] {
  if (kind === 'trowel') return trowelPieces(s, hooks);
  if (kind === 'hammer')
    return hammerTargets(s, hooks).flatMap((tg) => ('pieceId' in tg ? [tg.pieceId] : []));
  const out: PieceId[] = [];
  for (let id = 0; id < s.lvl.layout.counts.pieces; id++) if (craneSelectable(s, id, hooks)) out.push(id);
  return out;
}

/** Target spots of the chosen block (trowel `P`; crane: site spots per orientation). */
export function pickSpots(kind: PickKind, s: GameState, id: PieceId): PickSpot[] {
  if (kind === 'trowel') {
    const shape = shapeByIndex(pieceShape(s, id));
    return trowelSpots(s, id).map((a) => ({
      move: { kind: 'goldTrowel', pieceId: id, x: a.ix, y: a.iy },
      shape,
      ax: a.ix,
      ay: a.iy,
    }));
  }
  if (kind === 'crane') {
    const base = shapeByIndex(pieceShape(s, id));
    return craneSiteSpots(s, id).map((sp) => {
      const shape = shapeByIndex(shapeById(`${base.kind}_${sp.rotation}`).canonicalIndex);
      return {
        move: {
          kind: 'crane',
          pieceId: id,
          to: { zone: 'site', x: sp.at.ix, y: sp.at.iy },
          rotation: sp.rotation,
        },
        shape,
        ax: sp.at.ix,
        ay: sp.at.iy,
      };
    });
  }
  return [];
}

/** The spot whose box holds `(x, y)` with the nearest box centre (taps between ghosts pick the closest). */
export function spotAt(layout: Layout, spots: readonly PickSpot[], x: number, y: number): PickSpot | null {
  let best: PickSpot | null = null;
  let bestD = Infinity;
  for (const sp of spots) {
    const r = layout.grid.pieceRect(sp.ax, sp.ay, sp.shape.w, sp.shape.h);
    if (x < r.x || x >= r.x + r.w || y < r.y || y >= r.y + r.h) continue;
    const d = (x - (r.x + r.w / 2)) ** 2 + (y - (r.y + r.h / 2)) ** 2;
    if (d < bestD) {
      bestD = d;
      best = sp;
    }
  }
  return best;
}

export class TrowelPicker {
  private readonly scene: Phaser.Scene;
  private readonly host: TrowelPickerHost;
  private readonly zone: Phaser.GameObjects.Zone;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly cancel: TextButton;
  private readonly marks: Phaser.GameObjects.Image[] = [];
  private kindNow: PickKind | null = null;
  private eligible = new Set<PieceId>();
  private selected: PieceId | null = null;
  private spots: PickSpot[] = [];
  private since = 0;

  constructor(scene: Phaser.Scene, host: TrowelPickerHost) {
    this.scene = scene;
    this.host = host;
    this.zone = scene.add
      .zone(0, 0, 1, 1)
      .setOrigin(0, 0)
      .setDepth(DEPTH.hud - 1);
    this.zone.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!p.wasCanceled) this.tap(p.worldX, p.worldY); // a cancelled touch (touchcancel) picks nothing
    });
    this.hint = scene.add
      .text(0, 0, '', textStyle('body', TOKENS.color.ui.inkOnDark, { color: TOKENS.color.ui.ink, px: 10 }))
      .setOrigin(0.5)
      .setDepth(DEPTH.hud + 1)
      .setVisible(false);
    this.cancel = new TextButton(
      scene,
      t('common.cancel'),
      { w: CANCEL_W, h: CANCEL_H },
      'neutral',
      DEPTH.hud + 1,
    );
    this.cancel.setVisible(false);
    this.cancel.on('pointerdown', () => host.button(this.cancel, 'press'));
    this.cancel.on('pointerup', (canceled) => {
      host.button(this.cancel, 'release');
      if (!canceled) this.close();
    });
  }

  get active(): boolean {
    return this.kindNow !== null;
  }

  get kind(): PickKind | null {
    return this.kindNow;
  }

  /** The block chosen in a two-step pick (trowel |P| ≥ 2, crane), or null. */
  get chosen(): PieceId | null {
    return this.selected;
  }

  /** Spots shown now (harness, tests). */
  get shownSpots(): readonly PickSpot[] {
    return this.spots;
  }

  /** Opens the pick mode of `kind`; returns false (and opens nothing) without a selectable block. */
  start(kind: PickKind, now: number): boolean {
    const s = this.host.state();
    if (!s) return false;
    if (this.kindNow) this.close();
    const ids = pickEligible(kind, s, this.host.hooks());
    if (ids.length === 0) return false;
    this.kindNow = kind;
    this.eligible = new Set(ids);
    this.selected = null;
    this.spots = [];
    this.since = now;
    this.zone.setInteractive();
    const key = `booster.hint.${kind}`;
    this.hint.setText(hasKey(key) ? tDynamic(key) : '').setVisible(true);
    this.cancel.setVisible(true);
    this.place();
    this.host.dimPieces(this.eligible, null, 1);
    this.host.changed(kind);
    return true;
  }

  close(): void {
    if (!this.kindNow) return;
    this.kindNow = null;
    this.selected = null;
    this.spots = [];
    this.eligible = new Set();
    this.zone.disableInteractive();
    this.hint.setVisible(false);
    this.cancel.setVisible(false);
    for (const m of this.marks) m.setVisible(false);
    this.host.dimPieces(null, null, 1);
    this.host.changed(null);
  }

  /** Re-places everything for a new layout. */
  relayout(): void {
    if (this.kindNow) this.place();
  }

  /** New language: the hint and the cancel button. */
  relabel(): void {
    if (this.kindNow) {
      const key = `booster.hint.${this.kindNow}`;
      this.hint.setText(hasKey(key) ? tDynamic(key) : '');
    }
    this.cancel.setLabel(t('common.cancel'));
    this.relayout();
  }

  /** Per frame: the selectable blocks and the spots pulse (steady with reduced motion, JUICE §0 rule 8). */
  update(now: number): void {
    if (!this.kindNow) return;
    let k = 1;
    if (this.host.reduced()) {
      for (const m of this.marks) if (m.visible) m.setAlpha(1);
    } else {
      const period = TOKENS.duration.spotlightPulse;
      k = 0.5 + 0.5 * Math.cos((2 * Math.PI * (now - this.since)) / period);
      const a = PULSE_MIN + (1 - PULSE_MIN) * k;
      for (const m of this.marks) if (m.visible) m.setAlpha(a);
    }
    this.host.dimPieces(this.eligible, this.selected, k);
  }

  destroy(): void {
    this.zone.destroy();
    this.hint.destroy();
    this.cancel.destroy();
    for (const m of this.marks) m.destroy();
  }

  private place(): void {
    const layout = this.host.layout();
    const f = this.host.frames();
    if (!f) return;
    this.zone.setPosition(0, 0).setSize(layout.W, layout.H);
    this.zone.input?.hitArea.setSize(layout.W, layout.H);
    // UX §5.2 "tahta üstünde ince açıklama şeridi": hint and "Vazgeç" above the board, in the crane area band
    const crane = layout.board.crane;
    this.cancel.x = crane.x + crane.w / 2;
    this.cancel.y = crane.y + crane.h - CANCEL_H / 2 - 8;
    this.hint.setPosition(crane.x + crane.w / 2, this.cancel.y - CANCEL_H / 2 - this.hint.height / 2 - 8);
    // spot ghosts: the baked `ghost_<shape>_valid` when the level has it, else a valid-green contour per cell
    let used = 0;
    const take = (): Phaser.GameObjects.Image => {
      let m = this.marks[used];
      if (!m) {
        m = this.scene.add.image(0, 0, BOOT_ATLAS_KEY, FRAME.whitePixel).setDepth(DEPTH.effects);
        this.marks.push(m);
      }
      used += 1;
      return m.setVisible(true).clearTint().setScale(1).setAlpha(1);
    };
    const c = layout.grid.cellPx;
    for (const sp of this.spots) {
      const ghost = ghostFrameName(sp.shape.id, 'valid');
      if (f.has(ghost)) {
        const r = layout.grid.pieceRect(sp.ax, sp.ay, sp.shape.w, sp.shape.h);
        const m = take();
        setFrameAt(m, f.ref(ghost), r.x, r.y);
        if (layout.grid.k !== 1) m.setScale(layout.grid.k);
        continue;
      }
      for (const cell of sp.shape.cells) {
        const r = layout.grid.cellRect(sp.ax + cell.x, sp.ay + cell.y);
        const m = take();
        setFrameAt(m, f.ref(FRAME.front), r.x, r.y);
        m.setDisplaySize(c, c).setTint(GHOST_CELL_TINT);
      }
    }
    for (let i = used; i < this.marks.length; i++) this.marks[i]?.setVisible(false);
  }

  private tap(x: number, y: number): void {
    const kind = this.kindNow;
    if (!kind) return;
    const s = this.host.state();
    if (!s) return;
    const layout = this.host.layout();
    // a spot of the chosen block
    const sp = spotAt(layout, this.spots, x, y);
    if (sp) {
      this.apply(sp.move, sp.move.kind === 'goldTrowel' || sp.move.kind === 'crane' ? sp.move.pieceId : null);
      return;
    }
    const id = pieceAtPoint(s, layout.grid, x, y, layout.touch.hitSlopPx);
    if (id !== null && this.eligible.has(id)) {
      if (kind === 'hammer') {
        this.apply({ kind: 'hammer', target: { pieceId: id } }, id);
        return;
      }
      const spots = pickSpots(kind, s, id);
      if (kind === 'trowel' && spots.length === 1 && spots[0]) {
        this.apply(spots[0].move, id);
        return;
      }
      this.selected = id;
      this.spots = spots;
      this.place();
      return;
    }
    if (id !== null) {
      this.host.refused(id);
      return;
    }
    // K-37 (a): the chosen crane block to an empty yard cell (same orientation; the core checks the cells)
    const cell = layout.grid.cellAt(x, y);
    const chosen = this.selected;
    if (kind === 'crane' && chosen !== null && cell && cell.x < s.lvl.geo.wy && cell.y < s.lvl.geo.hy) {
      const shape = shapeByIndex(pieceShape(s, chosen));
      const ax = Math.max(0, Math.min(s.lvl.geo.wy - shape.w, cell.x));
      const ay = Math.max(0, Math.min(s.lvl.geo.hy - shape.h, cell.y));
      this.apply(
        { kind: 'crane', pieceId: chosen, to: { zone: 'yard', x: ax, y: ay }, rotation: shape.rotation },
        chosen,
      );
    }
  }

  private apply(move: Move, id: PieceId | null): void {
    if (this.host.commit(move)) {
      this.close();
      return;
    }
    this.host.refused(id);
  }
}

export type { Rect };
