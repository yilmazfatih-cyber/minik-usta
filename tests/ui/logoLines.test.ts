/**
 * The loading-screen logo's line split (ART_REFERENCE §9.1 v1.1 "harf bloğu 2 satır", DS3-07): a pure helper of
 * scenes/BootScene (ui/kit/logoLines.ts).
 */
import { describe, expect, it } from 'vitest';
import { logoLines } from '../../src/ui/kit/logoLines.ts';

describe('ART_REFERENCE 9.1 logo line split (DS3-07)', () => {
  it('ART_REFERENCE 9.1 "Lift & Land" splits into "Lift &" / "Land" (balanced, the longer line first)', () => {
    expect(logoLines('Lift & Land')).toEqual(['Lift &', 'Land']);
    expect(logoLines('Minik Usta')).toEqual(['Minik', 'Usta']);
    expect(logoLines('Küçük Usta Şantiye')).toEqual(['Küçük Usta', 'Şantiye']);
  });

  it('ART_REFERENCE 9.1 a one-word title is one line; blank input is one empty line; extra spaces are ignored', () => {
    expect(logoLines('Usta')).toEqual(['Usta']);
    expect(logoLines('')).toEqual(['']);
    expect(logoLines('  Lift   &  Land ')).toEqual(['Lift &', 'Land']);
  });
});
