/**
 * Press feel of the v2 kit buttons (JUICE #69 sound + haptic, #97 look in KitButton): `sfx_button` and a light haptic
 * on press. The look is the button's own; this is only the sound side, shared by the home screen and the win layer
 * (the win layer is built by scenes/level/LevelWindows, which passes no hook for v2 buttons).
 */
import { gameAudio, gameHaptics } from '../../scenes/level/sceneServices.ts';
import type { PressVariant } from './KitButton.ts';

export function buttonFeel(v: PressVariant): void {
  if (v !== 'press') return;
  gameAudio().play('sfx_button');
  gameHaptics().play('light');
}

/**
 * A locked item was touched (JUICE #73). `sfx_locked` has no `audio.sfx` row in tokens yet (design-lead, REVIEW_LOG):
 * until then the blocked tick `sfx_blocked` stands in.
 */
export function lockedFeel(): void {
  gameAudio().play('sfx_blocked');
  gameHaptics().play('light');
}
