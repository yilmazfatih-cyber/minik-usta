/**
 * Booster bar of the level screen (UX_FLOWS §5.1 "Güçlendiriciler", §5.2, §5.10; GDD K-54; META §4; JUICE #108):
 * four candy slots in `layout.bottom.boosters` — hammer (K-36), crane (K-37), paint brush (K-38), undo (K-39) — with the
 * K-54 state of each (core `slotState`: locked > noTarget > empty > ready).
 *
 * - `boosterSlotModels` is pure: META unlock level (`config/economy.json` `boosters.<id>.unlockLevel`), the count the
 *   player holds for this attempt and the core's target predicate (`TurnSummary.boosterTargets`) → the slot models.
 *   The count = stored inventory + the unlock's `freeTrials` not granted yet (META §4) − the boosters this attempt
 *   already applied (its action log; `services/save` `attemptBoosters` counts the same way for a void refund).
 * - `BoosterBar` only draws the models: green kit button (ready / empty), grey (locked, no target), the 112 px icon, the
 *   red square count badge (`ui_badge`, R2-12) or the green "+" of an empty slot, the lock + "Bölüm N" caption of a
 *   locked slot (`home.play`, `font.size.caption`). A tap reports the slot; the scene decides (K-54: a locked slot shows
 *   `common.unlockAt`, a slot without target shakes and shows `booster.<id>.noTarget`, #108; `empty` would open the
 *   mini purchase window — Faz 4, no `offer_shown` here).
 */
import Phaser from 'phaser';
import economy from '../../config/economy.json' with { type: 'json' };
import { slotState } from '../core/summary.ts';
import type { SlotState, TurnSummary } from '../core/summary.ts';
import type { SessionAction } from '../core/types.ts';
import { t } from '../services/i18n.ts';
import type { Rect } from '../theme/layout.ts';
import { hitArea } from '../theme/layout.ts';
import { TOKENS } from '../theme/tokens.ts';
import { KIT } from '../theme/textures.ts';
import type { FrameRef } from '../theme/textures.ts';
import type { ButtonState, KitButtonColor, Slices } from '../theme/draw/kit.ts';
import { kitTextStyle } from './kit/text.ts';

/** UX §5.1 slot order, left → right. */
export const BOOSTER_SLOT_IDS = ['hammer', 'crane', 'paintBrush', 'undo'] as const;
export type BoosterSlotId = (typeof BOOSTER_SLOT_IDS)[number];

/** Icon of each slot (ART §9 icon set, `icon_<name>`). */
export const SLOT_ICON: Readonly<Record<BoosterSlotId, string>> = {
  hammer: 'icon_hammer',
  crane: 'icon_crane',
  paintBrush: 'icon_brush',
  undo: 'icon_undo',
};

/** The session actions a slot's use logs (K-43 replay; `services/save` `ACTION_BOOSTER`). */
const SLOT_ACTION: Readonly<Record<BoosterSlotId, SessionAction['kind']>> = {
  hammer: 'hammer',
  crane: 'crane',
  paintBrush: 'paint',
  undo: 'undo',
};

/** i18n key of a slot's hint strip (UX §5.2 step 1) and of its "no target" line (#108; STORY §7, WP-L). */
export const SLOT_HINT_KEY: Readonly<Record<BoosterSlotId, string>> = {
  hammer: 'booster.hint.hammer',
  crane: 'booster.hint.crane',
  paintBrush: 'booster.hint.brush',
  undo: 'booster.noUndo',
};
export const SLOT_NO_TARGET_KEY: Readonly<Record<BoosterSlotId, string>> = {
  hammer: 'booster.hammer.noTarget',
  crane: 'booster.crane.noTarget',
  paintBrush: 'booster.brush.noTarget',
  undo: 'booster.noUndo',
};

export interface BoosterSlotModel {
  readonly id: BoosterSlotId;
  readonly state: SlotState;
  /** Boosters the player can use now (≥ 0). */
  readonly count: number;
  /** META §4 unlock level (the "Bölüm N" caption of a locked slot). */
  readonly unlockLevel: number;
}

export interface SlotInventory {
  /** `save.boosters.inventory` (stored counts). */
  readonly inventory: Readonly<Partial<Record<string, number>>>;
  /** `save.boosters.freeTrialsGranted`. */
  readonly freeTrialsGranted: readonly string[];
}

/** META §4 rows of the in-level boosters (`config/economy.json`). */
function econ(id: BoosterSlotId): { readonly unlockLevel: number; readonly freeTrials: number } {
  const b = economy.boosters[id];
  return { unlockLevel: b.unlockLevel, freeTrials: b.freeTrials };
}

/** Boosters of slot `id` the attempt's log already applied (`start` excluded). */
export function usedInAttempt(id: BoosterSlotId, log: readonly SessionAction[]): number {
  const kind = SLOT_ACTION[id];
  // an undo that undid nothing is never logged; a logged undo after a booster cannot happen (K-39)
  return log.filter((a) => a.kind === kind).length;
}

/**
 * K-54 slot models (pure): unlock from META §4, count = stored + pending free trials − used in this attempt, target
 * predicate from the core summary. Undo's target is `boosterTargets.undo` (K-39 `canUndo`).
 */
export function boosterSlotModels(input: {
  readonly levelId: number;
  readonly inv: SlotInventory;
  readonly log: readonly SessionAction[];
  readonly targets: TurnSummary['boosterTargets'];
}): BoosterSlotModel[] {
  return BOOSTER_SLOT_IDS.map((id) => {
    const e = econ(id);
    const unlocked = input.levelId >= e.unlockLevel;
    const stored = input.inv.inventory[id] ?? 0;
    const trials = unlocked && !input.inv.freeTrialsGranted.includes(id) ? e.freeTrials : 0;
    const count = Math.max(0, stored + trials - usedInAttempt(id, input.log));
    const hasTarget = input.targets[id];
    return { id, state: slotState({ unlocked, hasTarget, count }), count, unlockLevel: e.unlockLevel };
  });
}

/** Kit look of a slot state (ART §14.1: green active, grey pasif / kilitli). */
export function slotLook(state: SlotState): { readonly color: KitButtonColor; readonly state: ButtonState } {
  return state === 'ready' || state === 'empty'
    ? { color: 'green', state: 'normal' }
    : { color: 'grey', state: 'disabled' };
}

/** Kit frames the bar needs (ui/kit/atlas.ts). */
export interface SlotKit {
  button(
    color: KitButtonColor,
    h: number,
    state: ButtonState,
  ): { readonly ref: FrameRef; readonly slices: Slices };
  ref(name: string): FrameRef;
  icon(id: string): { readonly key: string; readonly frame?: string };
}

const ICON_PX = 112;
const LOCK_PX = 48;
const BADGE = TOKENS.kit.badge;

interface SlotView {
  readonly root: Phaser.GameObjects.Container;
  face: Phaser.GameObjects.NineSlice;
  readonly icon: Phaser.GameObjects.Image;
  readonly badge: Phaser.GameObjects.Image;
  readonly count: Phaser.GameObjects.Text;
  readonly lock: Phaser.GameObjects.Image;
  readonly caption: Phaser.GameObjects.Text;
  rect: Rect;
  key: string;
  shake: { start: number; ms: number } | null;
  raised: boolean;
}

export class BoosterBar {
  private readonly scene: Phaser.Scene;
  private readonly kit: SlotKit;
  private readonly depth: number;
  private readonly views: SlotView[] = [];
  private models: BoosterSlotModel[] = [];
  private tapFn: ((id: BoosterSlotId) => void) | null = null;

  constructor(scene: Phaser.Scene, kit: SlotKit, depth: number) {
    this.scene = scene;
    this.kit = kit;
    this.depth = depth;
  }

  onTap(fn: (id: BoosterSlotId) => void): void {
    this.tapFn = fn;
  }

  /** Places the slots in `rects` (left → right, UX §5.1). */
  layout(rects: readonly Rect[]): void {
    BOOSTER_SLOT_IDS.forEach((id, i) => {
      const r = rects[i];
      if (!r) return;
      const v = this.views[i] ?? this.build(id, r);
      this.views[i] = v;
      v.rect = r;
      v.root.setPosition(r.x + r.w / 2, r.y + r.h / 2);
      const hit = hitArea({ x: -r.w / 2, y: -r.h / 2, w: r.w, h: r.h }, TOKENS.touch.minTargetPx);
      v.root.setInteractive(
        new Phaser.Geom.Rectangle(hit.x, hit.y, hit.w, hit.h),
        Phaser.Geom.Rectangle.Contains,
      );
      v.key = '';
    });
    if (this.models.length > 0) this.setSlots(this.models);
  }

  /** Shows the K-54 state and count of every slot (redraws a slot only when it changed). */
  setSlots(models: readonly BoosterSlotModel[]): void {
    this.models = [...models];
    models.forEach((m, i) => {
      const v = this.views[i];
      if (!v) return;
      const key = `${m.state}:${m.count}:${t('home.play', { n: m.unlockLevel })}`;
      if (key === v.key) return;
      v.key = key;
      const look = slotLook(m.state);
      const f = this.kit.button(look.color, v.rect.h, look.state);
      v.face.setTexture(f.ref.key, f.ref.frame);
      v.icon.setAlpha(m.state === 'locked' || m.state === 'noTarget' ? 0.55 : 1);
      const showCount = m.state === 'ready' || (m.state !== 'locked' && m.count > 0);
      v.badge.setVisible(showCount || m.state === 'empty');
      v.count
        .setText(m.state === 'empty' ? '+' : String(m.count))
        .setVisible(showCount || m.state === 'empty');
      v.lock.setVisible(m.state === 'locked');
      v.caption.setText(t('home.play', { n: m.unlockLevel })).setVisible(m.state === 'locked');
    });
  }

  get slots(): readonly BoosterSlotModel[] {
    return this.models;
  }

  /** The slot's rect (tutorial `booster:<id>` highlight, the #108 balloon). */
  slotRect(id: BoosterSlotId): Rect | null {
    const i = BOOSTER_SLOT_IDS.indexOf(id);
    return this.views[i]?.rect ?? null;
  }

  /** UX §5.2 step 1: the selected slot rises (null: none). */
  select(id: BoosterSlotId | null): void {
    this.views.forEach((v, i) => {
      const on = BOOSTER_SLOT_IDS[i] === id;
      if (on === v.raised) return;
      v.raised = on;
      v.root.setY(v.rect.y + v.rect.h / 2 - (on ? SLOT_RAISE_PX : 0));
    });
  }

  /** JUICE #108: 2 px left-right ×3 over `duration.blockedShake` (reduced motion: none). */
  shake(id: BoosterSlotId, now: number): void {
    const v = this.views[BOOSTER_SLOT_IDS.indexOf(id)];
    if (v) v.shake = { start: now, ms: TOKENS.duration.blockedShake };
  }

  update(now: number): void {
    for (const v of this.views) {
      if (!v.shake) continue;
      const u = (now - v.shake.start) / v.shake.ms;
      const x = v.rect.x + v.rect.w / 2;
      if (u >= 1 || u < 0) {
        v.shake = null;
        v.root.setX(x);
      } else v.root.setX(x + SHAKE_PX * Math.sin(2 * Math.PI * SHAKE_CYCLES * u));
    }
  }

  setVisible(on: boolean): void {
    for (const v of this.views) v.root.setVisible(on);
  }

  destroy(): void {
    for (const v of this.views) v.root.destroy(true);
    this.views.length = 0;
  }

  private build(id: BoosterSlotId, r: Rect): SlotView {
    const s = this.scene;
    const f = this.kit.button('grey', r.h, 'disabled');
    const face = s.add
      .nineslice(
        0,
        0,
        f.ref.key,
        f.ref.frame,
        r.w,
        0,
        f.slices.left,
        f.slices.right,
        f.slices.top,
        f.slices.bottom,
      )
      .setOrigin(0.5, 0.5);
    const ic = this.kit.icon(SLOT_ICON[id]);
    const lip = TOKENS.kit.button.lipPx;
    const icon = s.add.image(0, -lip / 2, ic.key, ic.frame).setDisplaySize(ICON_PX, ICON_PX);
    const bref = this.kit.ref(KIT.badge);
    const bx = r.w / 2 - BADGE.diameterPx / 2 + 8;
    const by = r.h / 2 - BADGE.diameterPx / 2 + 4;
    const badge = s.add.image(bx, by, bref.key, bref.frame);
    const count = s.add
      .text(bx, by, '', kitTextStyle('brightTitle', BADGE.fontPx, BADGE.stroke))
      .setOrigin(0.5, 0.55);
    const lk = this.kit.icon('icon_lock');
    const lock = s.add
      .image(r.w / 2 - LOCK_PX / 2 - 6, -r.h / 2 + LOCK_PX / 2 + 6, lk.key, lk.frame)
      .setDisplaySize(LOCK_PX, LOCK_PX);
    const caption = s.add
      .text(0, r.h / 2 + CAPTION_GAP_PX, '', kitTextStyle('counter', TOKENS.font.size.caption))
      .setOrigin(0.5, 0);
    const root = s.add.container(0, 0, [face, icon, badge, count, lock, caption]).setDepth(this.depth);
    root.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!p.wasCanceled) this.tapFn?.(id);
    });
    return { root, face, icon, badge, count, lock, caption, rect: r, key: '', shake: null, raised: false };
  }
}

/** UX §5.2 step 1 "yuva yükselir". */
const SLOT_RAISE_PX = 16;
/** JUICE #108 shake (2 px, 3 cycles). */
const SHAKE_PX = 2;
const SHAKE_CYCLES = 3;
/** Gap between a locked slot and its "Bölüm N" caption. */
const CAPTION_GAP_PX = 2;
