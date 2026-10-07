/**
 * One line with inline icons in a v2 look (STORY §0-11 `{coin}`, `{ok}`; services/i18n `splitInline`): text runs are
 * Phaser Text in a ui/kit/text.ts role, the coin is the v2 `icon_coin` (asset service frame through the screen's
 * `IconBinder`) at 1.1 em, `{ok}` the procedural check. Laid out left → right in one container, aligned on its origin.
 */
import type Phaser from 'phaser';
import { splitInline } from '../../services/i18n.ts';
import { addBakedGraphics } from '../BakedGraphics.ts';
import { drawOk } from '../icons.ts';
import type { IconBinder } from './icons.ts';
import { addKitText } from './text.ts';
import type { TextRole } from './text.ts';

export type InlineAlign = 'left' | 'center' | 'right';

/** Icon size in em and the gap around icons (px at the given size). */
const ICON_EM = 1.1;
const GAP_EM = 0.12;

export function addInlineText(
  scene: Phaser.Scene,
  icons: IconBinder,
  text: string,
  role: TextRole,
  sizePx: number,
  align: InlineAlign = 'center',
  contour?: string,
): { root: Phaser.GameObjects.Container; width: number } {
  const items: { obj: Phaser.GameObjects.GameObject & { x: number }; w: number; icon: boolean }[] = [];
  const iconPx = Math.round(sizePx * ICON_EM);
  for (const run of splitInline(text)) {
    if (run.kind === 'text') {
      if (run.text.length === 0) continue;
      const t = addKitText(scene, 0, 0, run.text, role, sizePx, contour);
      // addKitText centred the glyph box; keep its y origin, anchor x on the left edge
      t.setOrigin(0, t.originY);
      items.push({ obj: t, w: t.width, icon: false });
    } else if (run.icon === 'coin') {
      const img = icons.add(scene, 0, 0, 'icon_coin', iconPx);
      items.push({ obj: img, w: iconPx, icon: true });
    } else {
      const g = addBakedGraphics(scene);
      drawOk(g, iconPx * 0.8);
      items.push({ obj: g, w: iconPx * 0.8, icon: true });
    }
  }
  const gap = Math.round(sizePx * GAP_EM);
  let total = 0;
  items.forEach((it, i) => {
    if (i > 0 && (it.icon || items[i - 1]?.icon)) total += gap;
    total += it.w;
  });
  let x = align === 'left' ? 0 : align === 'right' ? -total : -total / 2;
  const root = scene.add.container(0, 0);
  items.forEach((it, i) => {
    if (i > 0 && (it.icon || items[i - 1]?.icon)) x += gap;
    it.obj.x = it.icon ? x + it.w / 2 : x;
    root.add(it.obj);
    x += it.w;
  });
  return { root, width: total };
}
