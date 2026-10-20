/**
 * Bottom navigation v3 (ART_REFERENCE §3.9 `kit.v3.nav`; UX §3 "Alt gezinme", §0.3 "Kilitli sekme"; R2-12): the
 * indigo bar (`ui_nav_bar`, h 200, stretched to the width; the safe-area band below it in `safeArea`), five tabs of
 * `tabW` with 2 px dividers. The selected tab is the raised 300 × 300 tile (`ui_nav_tab_selected`, `raisePx` above
 * the bar's top) with a `iconSelectedPx` icon and a white label; the other tabs show only their icon (`iconPx`), a
 * locked one at `lockedAlpha` with the small gold lock at its lower right. The raised tile is the SELECTED tab, not the
 * middle one (ART_REFERENCE §3.9). Tapping a locked tab shakes its lock (JUICE #73) — the scene shows the "Yakında"
 * bubble; the tab never changes.
 */
import Phaser from 'phaser';
import { TOKENS } from '../../theme/tokens.ts';
import { KIT } from '../../theme/textures.ts';
import type { Rect } from '../../theme/layout.ts';
import { addBakedGraphics } from '../BakedGraphics.ts';
import { hex } from '../text.ts';
import { kitRef } from './atlas.ts';
import type { IconBinder } from './icons.ts';
import { addKitText, fitWidth } from './text.ts';

const NV = TOKENS.kit.v3.nav;

export interface NavTabSpec {
  readonly id: string;
  readonly icon: string;
  readonly label: string;
  readonly locked: boolean;
  readonly selected: boolean;
}

interface TabView {
  readonly spec: NavTabSpec;
  readonly cell: Rect;
  readonly icon: Phaser.GameObjects.Image;
  readonly lock: Phaser.GameObjects.Image | null;
}

export class NavBar {
  readonly root: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly tabs: TabView[] = [];
  private tapFn: ((id: string, locked: boolean, at: { x: number; y: number }) => void) | null = null;

  /** `bar` = from the bar's top edge to the screen bottom; `cells` = the five tab cells (bar height). */
  constructor(
    scene: Phaser.Scene,
    icons: IconBinder,
    bar: Rect,
    cells: readonly Rect[],
    specs: readonly NavTabSpec[],
  ) {
    this.scene = scene;
    const navH = NV.barH;
    const br = kitRef(scene.game, KIT.navBar);
    const parts: Phaser.GameObjects.GameObject[] = [];
    const under = addBakedGraphics(scene);
    // the bar's shadow over the scene above it, the safe-area band under it, the dividers between the tabs
    under
      .fillStyle(0x000000, NV.shadowAlpha)
      .fillRect(bar.x, bar.y - NV.shadowPx, bar.w, NV.shadowPx)
      .fillStyle(hex(NV.safeArea), 1)
      .fillRect(bar.x, bar.y + navH - 1, bar.w, Math.max(1, bar.h - navH + 1));
    const strip = scene.add.image(bar.x, bar.y, br.key, br.frame).setOrigin(0, 0).setDisplaySize(bar.w, navH);
    const dividers = addBakedGraphics(scene).fillStyle(hex(NV.divider), 1);
    cells.forEach((c, i) => {
      if (i === 0) return;
      dividers.fillRect(c.x - NV.dividerPx / 2, bar.y + 60, NV.dividerPx, 80);
    });
    parts.push(under, strip, dividers);
    specs.forEach((spec, i) => {
      const cell = cells[i];
      if (!cell) return;
      const cx = cell.x + cell.w / 2;
      if (spec.selected) {
        const tr = kitRef(scene.game, KIT.navTab);
        parts.push(scene.add.image(cx, cell.y - NV.raisePx, tr.key, tr.frame).setOrigin(0.5, 0));
      }
      const iconPx = spec.selected ? NV.iconSelectedPx : NV.iconPx;
      // selected: the icon in the tile's upper part; others: centred 6 px above the bar's middle
      const iconCy = spec.selected ? cell.y - NV.raisePx + 30 + iconPx / 2 : cell.y + navH / 2 - 6;
      const icon = icons.add(scene, cx, iconCy, spec.icon, iconPx);
      if (spec.locked) icon.setAlpha(NV.lockedAlpha);
      parts.push(icon);
      let lock: Phaser.GameObjects.Image | null = null;
      if (spec.locked) {
        const lr = kitRef(scene.game, KIT.lockSmall);
        lock = scene.add
          .image(cx + iconPx / 2 - NV.lockPx / 2 + 8, iconCy + iconPx / 2 - NV.lockPx / 2 + 4, lr.key, lr.frame)
          .setDisplaySize(NV.lockPx, (NV.lockPx * lr.h) / lr.w);
        parts.push(lock);
      }
      if (spec.selected) {
        const labelY = cell.y - NV.raisePx + NV.raisedH - 44;
        const label = addKitText(scene, cx, labelY, spec.label, 'button', NV.labelPx, NV.labelStroke, '#FFFFFF');
        fitWidth(label, NV.raisedW - 24);
        parts.push(label);
      }
      this.tabs.push({ spec, cell, icon, lock });
    });
    this.root = scene.add.container(0, 0, parts);
    // one tap zone per tab (the cell, plus the raised tile above the selected one)
    for (const tab of this.tabs) {
      const raise = tab.spec.selected ? NV.raisePx : 0;
      const zone = scene.add
        .zone(tab.cell.x, tab.cell.y - raise, tab.cell.w, tab.cell.h + raise)
        .setOrigin(0, 0)
        .setInteractive();
      zone.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, (p: Phaser.Input.Pointer) => {
        if (p.wasCanceled) return;
        this.tapFn?.(tab.spec.id, tab.spec.locked, { x: tab.cell.x + tab.cell.w / 2, y: tab.cell.y - raise });
      });
      this.root.add(zone);
    }
  }

  onTap(fn: (id: string, locked: boolean, at: { x: number; y: number }) => void): this {
    this.tapFn = fn;
    return this;
  }

  /** JUICE #73: the tab's lock shakes 3 times (`duration.lockedShake`); reduced motion: no shake. */
  shakeLock(id: string, reduced: boolean): void {
    const tab = this.tabs.find((x) => x.spec.id === id);
    if (!tab?.lock || reduced) return;
    const lock = tab.lock;
    this.scene.tweens.killTweensOf(lock);
    lock.setAngle(0);
    this.scene.tweens.add({
      targets: lock,
      angle: { from: -14, to: 14 },
      duration: TOKENS.duration.lockedShake / 6,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: () => lock.setAngle(0),
    });
  }

  setDepth(d: number): this {
    this.root.setDepth(d);
    return this;
  }

  destroy(): void {
    this.root.destroy(true);
  }
}
