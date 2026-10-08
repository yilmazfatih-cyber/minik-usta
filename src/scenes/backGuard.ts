/**
 * Web back guard (docs/TECH_DESIGN.md §2R.1 "Web geri hareketi", DL-2R-16's web counterpart; UX §5.8). With gesture
 * navigation an inward swipe from the left edge is the browser's "back" and leaves the page; on an 8-column board the
 * yard's column 0 starts 10 CSS px from that edge. The web has no API to exclude the system gesture, so:
 * - on the player's first ACTIVATING input (`pointerup` / `keydown`: Chrome skips history entries added without user
 *   activation on back) ONE guard entry is pushed (`history.pushState`);
 * - a `popstate` (the back gesture or button used that entry) calls `onBack` — the level opens its Pause window — and
 *   pushes the guard again;
 * - if the system took the touch instead, Phaser's `pointercancel` aborts the drag (DragController, K-07: no move spent).
 * DOM-only, no Phaser: `main.ts` installs it once per page.
 */

/** Game event emitted on a guarded back (the level scene opens Pause). */
export const BACK_EVENT = 'backGuard';

/** The guard entry's state object (recognisable in the history). */
export const BACK_GUARD_STATE = Object.freeze({ minikUstaBackGuard: 1 });

/** The window surface the guard needs (fakes in tests). */
export interface BackGuardHost {
  readonly history: { pushState(data: unknown, unused: string, url?: string | null): void };
  addEventListener(type: string, fn: (e: Event) => void, opts?: AddEventListenerOptions | boolean): void;
  removeEventListener(type: string, fn: (e: Event) => void, opts?: EventListenerOptions | boolean): void;
}

/** Installs the guard; returns the uninstall function. */
export function installBackGuard(win: BackGuardHost, onBack: () => void): () => void {
  let armed = false;
  const push = (): void => win.history.pushState(BACK_GUARD_STATE, '');
  const arm = (): void => {
    if (armed) return;
    armed = true;
    push();
  };
  const pop = (): void => {
    if (!armed) return;
    push();
    onBack();
  };
  win.addEventListener('pointerup', arm, true);
  win.addEventListener('keydown', arm, true);
  win.addEventListener('popstate', pop);
  return () => {
    win.removeEventListener('pointerup', arm, true);
    win.removeEventListener('keydown', arm, true);
    win.removeEventListener('popstate', pop);
  };
}
