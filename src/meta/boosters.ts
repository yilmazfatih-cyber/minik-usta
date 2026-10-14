/**
 * Booster unlocks and free trials (META §4; GDD K-54; `config/economy.json → boosters`). Pure and engine-free: the
 * attempt record (`scenes/flow/attempt.ts`) grants the trials when an attempt begins, the slot models
 * (`ui/boosterSlots.ts`) show the same count.
 *
 * META §4: "Açılış bölümünde … ücretsiz denemeler o an envantere eklenir." A booster's trials are granted once per
 * account (`save.boosters.freeTrialsGranted`), when the first attempt of a level ≥ its `unlockLevel` begins; a booster
 * that came earlier from a chest or a pack stays in the inventory and the trials are added on top ("META 4 locked
 * booster grant is kept and free trials add").
 */
import economy from '../../config/economy.json' with { type: 'json' };

/** In-level boosters of the K-54 slots, UX §5.1 order (pre-level boosters are outside the Faz 2R slice). */
export const IN_LEVEL_BOOSTERS = ['hammer', 'crane', 'paintBrush', 'undo'] as const;
export type InLevelBooster = (typeof IN_LEVEL_BOOSTERS)[number];

/** META §4 row of an in-level booster. */
export function boosterUnlock(id: InLevelBooster): {
  readonly unlockLevel: number;
  readonly freeTrials: number;
} {
  const b = economy.boosters[id];
  return { unlockLevel: b.unlockLevel, freeTrials: b.freeTrials };
}

/**
 * The free trials an attempt of `levelId` grants: every in-level booster unlocked at or below it whose trials are not
 * in `freeTrialsGranted` yet (normally only the opening level's own; a save that skipped one gets it on its next level).
 */
export function pendingFreeTrials(
  levelId: number,
  freeTrialsGranted: readonly string[],
): Partial<Record<InLevelBooster, number>> {
  const out: Partial<Record<InLevelBooster, number>> = {};
  for (const id of IN_LEVEL_BOOSTERS) {
    const u = boosterUnlock(id);
    if (levelId >= u.unlockLevel && !freeTrialsGranted.includes(id)) out[id] = u.freeTrials;
  }
  return out;
}
