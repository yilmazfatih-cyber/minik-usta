/**
 * Icon images of the v2 screens (ART §9; ASSET §16.3 icons; TECH §2R.6): `icons_v2` frames when the P1 atlas is loaded,
 * the procedural `icons_fallback` frames before (services/assets.ts `icon`). The asset service announces no change for
 * the icon atlas, so a screen keeps its icon images in one `IconBinder` and calls `refresh()` once P1 has loaded: every
 * live image takes the current frame at its own display size (same 128 px frame size in both sources).
 */
import type Phaser from 'phaser';

export interface IconFrame {
  readonly key: string;
  readonly frame?: string;
}

/** `id` (`icon_coin` …) → the frame to draw now. */
export type IconSource = (id: string) => IconFrame;

interface Bound {
  readonly image: Phaser.GameObjects.Image;
  readonly id: string;
  readonly px: number;
}

export class IconBinder {
  private readonly source: IconSource;
  private readonly bound: Bound[] = [];

  constructor(source: IconSource) {
    this.source = source;
  }

  /** The current frame of `id` (for objects that take a texture themselves). */
  frame(id: string): IconFrame {
    return this.source(id);
  }

  /** A `px`-wide square icon image centred on (x, y), kept up to date by `refresh`. */
  add(scene: Phaser.Scene, x: number, y: number, id: string, px: number): Phaser.GameObjects.Image {
    const f = this.source(id);
    const image = scene.add.image(x, y, f.key, f.frame).setDisplaySize(px, px);
    this.bound.push({ image, id, px });
    return image;
  }

  /** Re-applies the current frame to every live image (destroyed ones are dropped). */
  refresh(): void {
    for (let i = this.bound.length - 1; i >= 0; i--) {
      const b = this.bound[i] as Bound;
      if (!b.image.active) {
        this.bound.splice(i, 1);
        continue;
      }
      const f = this.source(b.id);
      if (b.image.texture.key === f.key && b.image.frame.name === (f.frame ?? b.image.frame.name)) continue;
      b.image.setTexture(f.key, f.frame).setDisplaySize(b.px, b.px);
    }
  }

  /** Forgets every image (scene shutdown; the images die with the scene). */
  clear(): void {
    this.bound.length = 0;
  }
}
