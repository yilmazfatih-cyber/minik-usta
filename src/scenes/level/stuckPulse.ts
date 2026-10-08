/**
 * Stuck pulse ("takılma nabzı", GDD K-34 hook 5 Faz 2R; TECH §2R.0 item 5, §2R.15 item 2): when the player has not
 * touched the screen for 6000 ms on an easy level (12000 ms on a normal one), the `neededNow` blocks pulse twice — once
 * per idle period; any touch starts a new period. Hard and super hard levels have no pulse; nor does a level while a
 * tutorial step is active (K-53 item 4), a window is open or the board is busy. Real time lives here, in the scene; the
 * core only answers `neededNow`. Pure: the scene feeds the clock and the touches.
 */
import type { CompiledLevel } from '../../core/level/compile.ts';

type Difficulty = CompiledLevel['difficulty'];

/** GDD K-34 hook 5 idle times (ms). */
export const STUCK_IDLE_MS: Readonly<Partial<Record<Difficulty, number>>> = Object.freeze({
  easy: 6000,
  normal: 12000,
});
/** GDD K-34 hook 5: "2 kez nabız atar". */
export const STUCK_PULSES = 2;

/** Idle time before the pulse on a level of `difficulty`; null when the level has none (hard, super hard). */
export function stuckIdleMs(difficulty: Difficulty): number | null {
  return STUCK_IDLE_MS[difficulty] ?? null;
}

export class StuckPulse {
  #idleMs: number | null = null;
  #since = 0;
  #fired = false;

  /** A new level (or attempt): the period starts now. */
  level(difficulty: Difficulty, now: number): void {
    this.#idleMs = stuckIdleMs(difficulty);
    this.#since = now;
    this.#fired = false;
  }

  /** Any touch: a new idle period. */
  touched(now: number): void {
    this.#since = now;
    this.#fired = false;
  }

  /**
   * True once per idle period when the pulse is due now. `quiet` = the pulse may not show (tutorial step active,
   * window open, drag or cues running): the period's clock keeps running and the pulse comes when it is allowed again.
   */
  due(now: number, quiet: boolean): boolean {
    if (this.#idleMs === null || this.#fired || quiet) return false;
    if (now - this.#since < this.#idleMs) return false;
    this.#fired = true;
    return true;
  }
}
