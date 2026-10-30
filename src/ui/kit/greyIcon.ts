/**
 * Greyscale copy of an icon frame (UX §7 window 2: the heart "kırılmaz, söner — gri"; JUICE #58). The v3 heart is a
 * raster icon (`icon_life`, three tones + specular); a tint cannot grey it (tints multiply), so the frame is copied once
 * into a canvas texture with its luminance (Rec. 601) and its alpha kept. Works on both renderers; the copy is keyed by
 * the source key + frame and reused.
 */
import type Phaser from 'phaser';
import type { IconFrame } from './icons.ts';

export const greyIconKey = (f: IconFrame): string => `${f.key}__${f.frame ?? ''}__grey`;

export function greyIconFrame(scene: Phaser.Scene, f: IconFrame): IconFrame {
  const key = greyIconKey(f);
  const textures = scene.textures;
  if (!textures.exists(key)) {
    const frame = textures.getFrame(f.key, f.frame);
    const w = Math.max(1, Math.ceil(frame.cutWidth));
    const h = Math.max(1, Math.ceil(frame.cutHeight));
    const tex = textures.createCanvas(key, w, h);
    if (!tex) return f;
    const ctx = tex.context;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(
      frame.source.image as CanvasImageSource,
      frame.cutX,
      frame.cutY,
      frame.cutWidth,
      frame.cutHeight,
      0,
      0,
      w,
      h,
    );
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const y = Math.round(
        0.299 * (d[i] as number) + 0.587 * (d[i + 1] as number) + 0.114 * (d[i + 2] as number),
      );
      d[i] = y;
      d[i + 1] = y;
      d[i + 2] = y;
    }
    ctx.putImageData(img, 0, 0);
    tex.refresh();
  }
  return { key };
}
