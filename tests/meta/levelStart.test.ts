/**
 * Level-start window model (UX_FLOWS §4 / §4.1; GDD K-40; META §4): the three pre-level booster slots and their
 * states, the selection toggle, the "window from level 3" rule. Pure (src/meta/levelStart.ts).
 */
import { describe, expect, it } from 'vitest';
import economy from '../../config/economy.json' with { type: 'json' };
import {
  LEVEL_START_WINDOW_FROM,
  PRE_BOOSTERS,
  levelStartSlots,
  opensLevelStartWindow,
  preBoosterUnlock,
  toggleSlot,
} from '../../src/meta/levelStart.ts';

describe('level-start window model (UX 4.1, K-40, META 4)', () => {
  it('K-40 the three slots in UX §4 order: Termos, Mala Başlangıcı, Açık Kepenk with their META §4 unlock levels', () => {
    expect(PRE_BOOSTERS).toEqual(['thermos', 'trowelStart', 'openShutter']);
    expect(preBoosterUnlock('thermos')).toBe(economy.boosters.thermos.unlockLevel);
    expect(preBoosterUnlock('trowelStart')).toBe(economy.boosters.trowelStart.unlockLevel);
    expect(preBoosterUnlock('openShutter')).toBe(economy.boosters.openShutter.unlockLevel);
  });

  it('K-40 / META 4 slot states: locked before the unlock level (a stored count shows), empty at 0, ready at ≥ 1', () => {
    const slice = levelStartSlots({
      levelId: 3,
      inventory: { thermos: 1 },
      hasShutterGaps: true,
      selected: [],
    });
    expect(slice.map((s) => s.state)).toEqual(['locked', 'locked', 'locked']);
    expect(slice[0]).toMatchObject({ id: 'thermos', count: 1, unlockLevel: 12, selected: false });
    const late = levelStartSlots({
      levelId: 20,
      inventory: { thermos: 2, openShutter: 1 },
      hasShutterGaps: true,
      selected: ['thermos'],
    });
    expect(late.map((s) => [s.id, s.state, s.count, s.selected])).toEqual([
      ['thermos', 'ready', 2, true],
      ['trowelStart', 'empty', 0, false],
      ['openShutter', 'ready', 1, false],
    ]);
  });

  it('K-40 Açık Kepenk is unavailable in a level without a Kepenk (W4) or Kilitli (W7) gap ("Bu bölümde kepenk yok")', () => {
    const slots = levelStartSlots({
      levelId: 25,
      inventory: { openShutter: 3 },
      hasShutterGaps: false,
      selected: ['openShutter'],
    });
    expect(slots[2]).toMatchObject({ id: 'openShutter', state: 'unavailable', count: 3, selected: false });
  });

  it('K-40 a tap toggles a ready slot only; locked / unavailable / empty slots leave the selection unchanged', () => {
    const slots = levelStartSlots({
      levelId: 25,
      inventory: { thermos: 1, openShutter: 2 },
      hasShutterGaps: false,
      selected: [],
    });
    const once = toggleSlot([], slots, 'thermos');
    expect(once).toEqual(['thermos']);
    expect(toggleSlot(once, slots, 'thermos')).toEqual([]);
    expect(toggleSlot(once, slots, 'trowelStart')).toEqual(['thermos']); // empty
    expect(toggleSlot(once, slots, 'openShutter')).toEqual(['thermos']); // unavailable
    const locked = levelStartSlots({
      levelId: 5,
      inventory: { thermos: 1 },
      hasShutterGaps: true,
      selected: [],
    });
    expect(toggleSlot([], locked, 'thermos')).toEqual([]);
  });

  it('UX 4 / UX 3 the window opens from level 3 on; levels 1–2 start directly', () => {
    expect(LEVEL_START_WINDOW_FROM).toBe(3);
    expect([1, 2, 3, 10].map(opensLevelStartWindow)).toEqual([false, false, true, true]);
  });
});
