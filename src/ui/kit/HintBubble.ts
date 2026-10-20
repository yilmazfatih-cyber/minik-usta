/**
 * Short hint bubble v3 (ART_REFERENCE §3.14; UX §0.3 "Kilitli öğe" / "Kilitli sekme", §3 coin "+" in the slice; JUICE
 * #73): the cream two-ring kit bubble (`ui_tutorial_bubble`, 9-sliced) with a tail towards the touched item and one
 * line in the card text look (`kit.v3.text.cardText` 44 px); it pops in (`duration.reducedFade` fade + 0.9 → 1.0) and
 * leaves after `lockedHint` ms. One bubble per screen: a new hint replaces the old one. It takes no touches.
 */
import type Phaser from 'phaser';
import { TOKENS } from '../../theme/tokens.ts';
import { KIT, bubbleTailFrameName } from '../../theme/textures.ts';
import { bubbleV3Inset, bubbleV3TailSize } from '../../theme/draw/kitV3.ts';
import { kitRef, kitSlice } from './atlas.ts';
import { addKitText } from './text.ts';

const BB = TOKENS.kit.v3.bubble;
/** Screen margin the bubble keeps from the left / right edge. */
const EDGE_PX = 24;
/** Hint text size (ART_REFERENCE §4 `cardText` small). */
const HINT_PX = 44;

/** Height of a one-line hint bubble with its tail (the home screen places the locked-tab balloon with it). */
export function hintBubbleHeight(): number {
  const ins = bubbleV3Inset(TOKENS);
  return Math.ceil(HINT_PX * 1.3) + 2 * BB.padYPx + ins.side + ins.bottom + bubbleV3TailSize('down', TOKENS).h;
}

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
   * Shows `text` with the tail tip at `at`: above the point (`dir` 'down', the tail points down) or below it ('up'),
   * for `ms` (default `duration.lockedHint`; the feedback "Kopyalandı" balloon stays 1,5 s, UX §3).
   */
  show(
    text: string,
    at: { x: number; y: number },
    dir: 'down' | 'up',
    reduced: boolean,
    ms: number = TOKENS.duration.lockedHint,
  ): void {
    this.hide();
    const s = this.scene;
    const ins = bubbleV3Inset(TOKENS);
    const label = addKitText(s, 0, 0, text, 'cardText', HINT_PX);
    const w = Math.ceil(label.width) + 2 * BB.padXPx + 2 * ins.side;
    const h = Math.ceil(HINT_PX * 1.3) + 2 * BB.padYPx + ins.side + ins.bottom;
    const ref = kitRef(s.game, KIT.bubble);
    const sl = kitSlice(KIT.bubble);
    const body = s.add
      .nineslice(0, 0, ref.key, ref.frame, w, h + BB.shadowYPx, sl?.left, sl?.right, sl?.top, sl?.bottom)
      .setOrigin(0, 0);
    const tailName = bubbleTailFrameName(dir);
    const tr = kitRef(s.game, tailName);
    const tsz = bubbleV3TailSize(dir, TOKENS);
    const ring = BB.strokeOuterPx + BB.strokeInnerPx;
    const W = s.scale.width;
    const x0 = Math.min(Math.max(EDGE_PX, at.x - w / 2), W - EDGE_PX - w);
    const y0 = dir === 'down' ? at.y - tsz.h + ring - h : at.y + tsz.h - ring;
    const tailX = Math.min(Math.max(at.x - x0, BB.radiusPx + tsz.w / 2), w - BB.radiusPx - tsz.w / 2);
    const tail = s.add
      .image(tailX, dir === 'down' ? h - ring : ring, tr.key, tr.frame)
      .setOrigin(0.5, dir === 'down' ? 0 : 1);
    label.setPosition(w / 2, (h - (ins.bottom - ins.side)) / 2);
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
    this.timer = s.time.delayedCall(ms, () => this.fadeOut());
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
