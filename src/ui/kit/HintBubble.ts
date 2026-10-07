/**
 * Short hint bubble (UX §0.3 "Kilitli öğe" / "Kilitli sekme (v2)", §3 coin "+" in the slice; JUICE #73): the white
 * kit bubble (`ui_tutorial_bubble`, 9-sliced) with a tail towards the touched item and one line in the "Panel metni"
 * look (`font.size.body`); it pops in (`duration.reducedFade` fade + 0.9 → 1.0) and leaves after `lockedHint` ms. One
 * bubble per screen: a new hint replaces the old one. It takes no touches.
 */
import type Phaser from 'phaser';
import { TOKENS } from '../../theme/tokens.ts';
import { KIT, bubbleTailFrameName } from '../../theme/textures.ts';
import { bubbleTailSize } from '../../theme/draw/kit.ts';
import { kitRef, kitSlice } from './atlas.ts';
import { addKitText } from './text.ts';

const BB = TOKENS.kit.bubble;
/** Screen margin the bubble keeps from the left / right edge. */
const EDGE_PX = 24;

export class HintBubble {
  private readonly scene: Phaser.Scene;
  private readonly depth: number;
  private root: Phaser.GameObjects.Container | null = null;
  private timer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, depth: number) {
    this.scene = scene;
    this.depth = depth;
  }

  get visible(): boolean {
    return this.root !== null;
  }

  /**
   * Shows `text` with the tail tip at `at`: above the point (`dir` 'down', the tail points down) or below it ('up').
   */
  show(text: string, at: { x: number; y: number }, dir: 'down' | 'up', reduced: boolean): void {
    this.hide();
    const s = this.scene;
    const label = addKitText(s, 0, 0, text, 'panel', TOKENS.font.size.body);
    const w = Math.ceil(label.width) + 2 * BB.padXPx + 2 * BB.strokePx;
    const h = Math.ceil(TOKENS.font.size.body * 1.3) + 2 * BB.padYPx;
    const ref = kitRef(s.game, KIT.bubble);
    const sl = kitSlice(KIT.bubble);
    const body = s.add
      .nineslice(0, 0, ref.key, ref.frame, w, h + BB.shadowYPx, sl?.left, sl?.right, sl?.top, sl?.bottom)
      .setOrigin(0, 0);
    const tailName = bubbleTailFrameName(dir);
    const tr = kitRef(s.game, tailName);
    const tsz = bubbleTailSize(dir, TOKENS);
    const W = s.scale.width;
    const x0 = Math.min(Math.max(EDGE_PX, at.x - w / 2), W - EDGE_PX - w);
    const y0 = dir === 'down' ? at.y - tsz.h + BB.strokePx - h : at.y + tsz.h - BB.strokePx;
    const tailX = Math.min(Math.max(at.x - x0, BB.radiusPx + tsz.w / 2), w - BB.radiusPx - tsz.w / 2);
    const tail = s.add
      .image(tailX, dir === 'down' ? h - BB.strokePx : BB.strokePx, tr.key, tr.frame)
      .setOrigin(0.5, dir === 'down' ? 0 : 1);
    label.setPosition(w / 2, h / 2);
    const root = s.add.container(x0, y0, [body, tail, label]).setDepth(this.depth);
    this.root = root;
    const pivotY = dir === 'down' ? h : 0;
    // pop from the tail: scale about the tail tip
    root.setAlpha(0);
    s.tweens.add({ targets: root, alpha: 1, duration: TOKENS.duration.reducedFade });
    if (!reduced) {
      root.setScale(0.9);
      root.x = x0 + tailX * 0.1;
      root.y = y0 + pivotY * 0.1;
      s.tweens.add({
        targets: root,
        scale: 1,
        x: x0,
        y: y0,
        duration: TOKENS.duration.popupOpen,
        ease: 'Back.easeOut',
      });
    }
    this.timer = s.time.delayedCall(TOKENS.duration.lockedHint, () => this.fadeOut());
  }

  private fadeOut(): void {
    const root = this.root;
    if (!root) return;
    this.root = null;
    this.timer = null;
    this.scene.tweens.add({
      targets: root,
      alpha: 0,
      duration: TOKENS.duration.reducedFade,
      onComplete: () => root.destroy(true),
    });
  }

  hide(): void {
    this.timer?.remove(false);
    this.timer = null;
    this.root?.destroy(true);
    this.root = null;
  }
}
