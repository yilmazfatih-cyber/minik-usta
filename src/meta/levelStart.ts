/**
 * Level-start window model (UX_FLOWS §4 / §4.1 "Bölüm başı penceresi v3"; GDD K-40; META §4; ART_REFERENCE §9.3).
 * Pure and engine-free: the save's inventory, the level's gaps and the chosen slots in, the three pre-level booster
 * slots (Termos, Mala Başlangıcı, Açık Kepenk) with their K-40 / META §4 state out. The window only draws it; the
 * chosen ids go to `GameSession.start` / `LevelAttempt.begin` as `preBoosters` (spent at the start, refunded on an
 * exit before the first move — K-43).
 *
 * Slot states (UX §4 "Durumlar"): `locked` (META §4 unlock level not reached; a stored count shows as a grey badge),
 * `unavailable` (Açık Kepenk when the level has neither a Kepenk W4 nor a Kilitli W7 gap: `booster.noShutter`),
 * `empty` (0 in the inventory: "+" → mini purchase, Faz 4), `ready` (≥ 1; a tap selects / deselects).
 */
import economy from '../../config/economy.json' with { type: 'json' };
import type { PreBooster } from '../core/types.ts';

/** UX §4 slot order, left → right. */
export const PRE_BOOSTERS: readonly PreBooster[] = ['thermos', 'trowelStart', 'openShutter'];

export type PreSlotState = 'locked' | 'unavailable' | 'empty' | 'ready';

export interface PreSlotModel {
  readonly id: PreBooster;
  readonly state: PreSlotState;
  /** Boosters the player holds (shown on the badge; grey while locked). */
  readonly count: number;
  readonly unlockLevel: number;
  readonly selected: boolean;
}

export interface LevelStartInput {
  readonly levelId: number;
  readonly inventory: Readonly<Partial<Record<string, number>>>;
  /** The level has a Kepenk (W4) or Kilitli (W7) gap: Açık Kepenk can be chosen (K-40). */
  readonly hasShutterGaps: boolean;
  readonly selected: readonly PreBooster[];
}

/** META §4 unlock level of a pre-level booster (`config/economy.json`). */
export function preBoosterUnlock(id: PreBooster): number {
  return economy.boosters[id].unlockLevel;
}

/** K-40 / META §4 slot models of the level-start window. */
export function levelStartSlots(input: LevelStartInput): PreSlotModel[] {
  return PRE_BOOSTERS.map((id) => {
    const unlockLevel = preBoosterUnlock(id);
    const count = Math.max(0, input.inventory[id] ?? 0);
    let state: PreSlotState;
    if (input.levelId < unlockLevel) state = 'locked';
    else if (id === 'openShutter' && !input.hasShutterGaps) state = 'unavailable';
    else if (count === 0) state = 'empty';
    else state = 'ready';
    return { id, state, count, unlockLevel, selected: state === 'ready' && input.selected.includes(id) };
  });
}

/** A tap on slot `id`: a ready slot toggles its selection; any other state leaves the selection unchanged. */
export function toggleSlot(
  selected: readonly PreBooster[],
  slots: readonly PreSlotModel[],
  id: PreBooster,
): PreBooster[] {
  const slot = slots.find((s) => s.id === id);
  if (!slot || slot.state !== 'ready') return [...selected];
  return selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
}

/** UX §4 / §3: the window opens from level 3 on (levels 1–2 start directly). */
export const LEVEL_START_WINDOW_FROM = 3;

export function opensLevelStartWindow(levelId: number): boolean {
  return levelId >= LEVEL_START_WINDOW_FROM;
}
