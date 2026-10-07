/**
 * One illustration on a v2 screen (TECH §2R.6 "Çalışma anı"; UX §3 "Yükleniyor"): shows the SVG raster when it is
 * loaded, its procedural fallback otherwise, and cross-fades (`ART_FADE_MS`, 200 ms) to the raster when it arrives —
 * a temporary copy on top fades in, then the image takes the texture (no mask). Unlike scenes/AssetLoaderScene
 * `attachArt` it re-applies the display box and a crop after every texture change (the tree house layers are cropped,
 * ART §7.2). Reduced motion swaps at once. The subscription ends with the image.
 */
import Phaser from 'phaser';
import { ART_FADE_MS } from '../../services/assets.ts';
import type { TextureRef } from '../../services/assets.ts';

/** What an art image needs from services/assets.ts `AssetService` (structural). */
export interface ArtSource {
  texture(id: string): TextureRef | null;
  onChange(id: string, cb: (ref: TextureRef) => void): () => void;
}

/** Phaser's built-in transparent texture: the stand-in of an id that has nothing to show yet. */
const EMPTY_TEXTURE = '__DEFAULT';

export interface ArtBox {
  /** Top-left of the display box. */
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface ArtImageOptions {
  readonly reduced: () => boolean;
  /** Crop in display px of the box (top-left origin), applied after every texture change; null = none. */
  readonly crop?: () => ArtBox | null;
  /**
   * Bands above / below the box filled by stretching the art's first / last pixel row (EXPAND surplus of a 1080 × 1920
   * background, UX §0.1: no seam against a flat colour). Display px; 0 = none.
   */
  readonly extend?: { readonly top: number; readonly bottom: number };
}

export class ArtImage {
  readonly image: Phaser.GameObjects.Image;
  readonly id: string;
  /** Edge bands (`extend`): stretched first / last pixel rows of the current texture. */
  readonly edges: readonly Phaser.GameObjects.Image[];
  private readonly box: ArtBox;
  private readonly opts: ArtImageOptions;
  private art: boolean;

  /**
   * An art image. An id with neither art nor a fallback yet (e.g. a base layer that has no procedural version) starts
   * hidden and appears with the cross-fade when its raster arrives.
   */
  static create(
    scene: Phaser.Scene,
    source: ArtSource,
    id: string,
    box: ArtBox,
    opts: ArtImageOptions,
  ): ArtImage {
    return new ArtImage(scene, source, id, source.texture(id), box, opts);
  }

  private constructor(
    scene: Phaser.Scene,
    source: ArtSource,
    id: string,
    initial: TextureRef | null,
    box: ArtBox,
    opts: ArtImageOptions,
  ) {
    const ref = initial ?? { key: EMPTY_TEXTURE, art: false };
    this.id = id;
    this.box = box;
    this.opts = opts;
    this.art = ref.art;
    const edges: Phaser.GameObjects.Image[] = [];
    const ext = opts.extend;
    if (ext && ext.top > 0)
      edges.push(scene.add.image(0, 0, ref.key, ref.frame).setOrigin(0, 0).setName('top'));
    if (ext && ext.bottom > 0)
      edges.push(scene.add.image(0, 0, ref.key, ref.frame).setOrigin(0, 0).setName('bottom'));
    this.edges = edges;
    this.image = scene.add.image(box.x, box.y, ref.key, ref.frame).setOrigin(0, 0);
    if (!initial) this.image.setVisible(false);
    this.fit(this.image);
    this.fitEdges();
    const off = source.onChange(id, (next) => this.swap(next));
    this.image.once(Phaser.GameObjects.Events.DESTROY, () => {
      off();
      for (const e of this.edges) e.destroy();
    });
  }

  /** True when the SVG raster shows (false: the procedural fallback). */
  get isArt(): boolean {
    return this.art;
  }

  /** Re-applies the crop (the reveal ratio changed). */
  refreshCrop(): void {
    this.fit(this.image);
  }

  /** Gives `img` (a copy on the same texture, e.g. a flash) this image's display box and crop. */
  fitOther(img: Phaser.GameObjects.Image): void {
    this.fit(img);
  }

  private fit(img: Phaser.GameObjects.Image): void {
    img.setDisplaySize(this.box.w, this.box.h);
    const c = this.opts.crop?.() ?? null;
    if (!c) {
      img.setCrop();
      return;
    }
    // crop is in texture px: map the display box onto the frame
    const sx = img.frame.width / this.box.w;
    const sy = img.frame.height / this.box.h;
    img.setCrop(c.x * sx, c.y * sy, c.w * sx, c.h * sy);
  }

  /** One pixel row of the frame stretched over the band above (`top`) or below (`bottom`) the box. */
  private fitEdges(): void {
    const ext = this.opts.extend;
    if (!ext) return;
    for (const e of this.edges) {
      e.setTexture(this.image.texture.key, this.image.frame.name);
      const fw = e.frame.width;
      const fh = e.frame.height;
      const top = e.name === 'top';
      const band = top ? ext.top : ext.bottom;
      const row = top ? 0 : fh - 1;
      e.setScale(this.box.w / fw, band);
      e.setCrop(0, row, fw, 1);
      e.setPosition(this.box.x, top ? this.box.y - band : this.box.y + this.box.h - row * band);
      e.setDepth(this.image.depth);
    }
  }

  private swap(next: TextureRef): void {
    const image = this.image;
    if (!image.scene || !image.active) return;
    this.art = next.art;
    if (!image.visible) {
      // nothing showed before: the art fades in on its own
      image.setTexture(next.key, next.frame).setVisible(true);
      this.fit(image);
      this.fitEdges();
      if (!this.opts.reduced()) {
        const a = image.alpha;
        image.setAlpha(0);
        image.scene.tweens.add({ targets: image, alpha: a, duration: ART_FADE_MS });
      }
      return;
    }
    if (this.opts.reduced() || !next.art) {
      image.setTexture(next.key, next.frame);
      this.fit(image);
      this.fitEdges();
      return;
    }
    const scene = image.scene;
    const top = scene.add
      .image(image.x, image.y, next.key, next.frame)
      .setOrigin(0, 0)
      .setDepth(image.depth)
      .setScrollFactor(image.scrollFactorX, image.scrollFactorY)
      .setAlpha(0);
    this.fit(top);
    const parent = image.parentContainer;
    if (parent) parent.addAt(top, parent.getIndex(image) + 1);
    scene.tweens.add({
      targets: top,
      alpha: image.alpha,
      duration: ART_FADE_MS,
      onComplete: () => {
        if (image.active) {
          image.setTexture(next.key, next.frame);
          this.fit(image);
          this.fitEdges();
        }
        top.destroy();
      },
    });
  }

  destroy(): void {
    this.image.destroy();
  }
}
