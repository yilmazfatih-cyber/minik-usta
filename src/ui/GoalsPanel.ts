/**
 * Goal chips v3 (ART_REFERENCE §9.4 "hedef çipleri": HUD capsules h 60, §3.4; UX_FLOWS §5.1 "Hedefler", §5.9 items 1,
 * 2, 7; GDD K-41, K-47, K-48): in `layout.top.goals` (row 1, right of the "Bölüm N" capsule) the chips sit side by
 * side, right-aligned, each a dark HUD capsule (`ui_capsule_hud`, 3-sliced) with its Ø 64 icon overhanging the left
 * end and its text in the lavender counter look (40 px):
 * - the structure chip: build icon + segment counter `common.count` "1/3";
 * - the BLOCKS-LEFT chip: neutral L icon (`ui_blocks_left_icon`, PL-2R-14) + the number (cream 44) + `hud.blocks`
 *   "blok"; under its icon the truck sub-badge "+n" while undelivered batches hold material blocks (DL-2R-23); a green
 *   ✓ at 0. The number is `TurnSummary.blocksLeft` (K-47/K-48, the core's single formula); it moves up out / down in
 *   on a change and pulses 1,0 → 1,15 → 1,0 when it falls (JUICE #20 look; no pulse when a Söküm / Undo raises it);
 * - extra goals (`clear` / `collect`), at most 4 chips (`layout.hud.goalChipMax`).
 * A dumb view: it draws the core's `goalViews(state)` and the summary values, and redraws only on a change (TECH
 * §10.3). Texts come from i18n; a key the dictionary does not have yet (WP-L) is left out, never written in code.
 */
import type Phaser from 'phaser';
import type { GoalView } from '../core/goals.ts';
import { hasKey, t, tDynamic } from '../services/i18n.ts';
import type { Rect } from '../theme/layout.ts';
import { TOKENS } from '../theme/tokens.ts';
import { KIT, badgeFrameName } from '../theme/textures.ts';
import type { FrameRef } from '../theme/textures.ts';
import type { Slices } from '../theme/draw/kit.ts';
import { capsuleV3Height } from '../theme/draw/kitV3.ts';
import { drawBuildIcon } from './icons.ts';
import { hex } from './text.ts';
import { addBakedGraphics } from './BakedGraphics.ts';
import { addKitText, kitTextStyle } from './kit/text.ts';

const HUD = TOKENS.layout.hud;
const CP = TOKENS.kit.v3.capsule;

/** Frame lookups of the panel (kit atlas + boot atlas badges); absent → Graphics fallback (tests). */
export interface GoalsKit {
  ref(name: string): FrameRef;
  slice(name: string): Slices | null;
  /** Boot-atlas frame (the ✓ badge `ghost_badge_ok`). */
  boot(name: string): FrameRef | null;
}

/** UX §5.9 item 7: chip icon size and gap for `n` chips (3–4 → compact). */
export function chipMetrics(n: number): { readonly iconPx: number; readonly gapPx: number } {
  return n >= 3
    ? { iconPx: HUD.goalChipIconCompactPx, gapPx: HUD.goalChipGapCompactPx }
    : { iconPx: HUD.goalChipIconPx, gapPx: HUD.goalChipGapPx };
}

/** UX §5.9 item 7: the chips of a level: the structure (build), blocks left, then the extra goals (≤ 4 in total). */
export function goalChips(goals: readonly GoalView[]): ('build' | 'blocks' | GoalView['kind'])[] {
  const out: ('build' | 'blocks' | GoalView['kind'])[] = [];
  if (goals.some((g) => g.kind === 'build')) out.push('build');
  out.push('blocks');
  for (const g of goals) if (g.kind !== 'build' && out.length < HUD.goalChipMax) out.push(g.kind);
  return out;
}

/** Optional i18n text: the key's text, or '' while the dictionary lacks it (STORY keys of WP-L). */
export function optText(key: string, params?: Readonly<Record<string, string | number>>): string {
  return hasKey(key) ? tDynamic(key, params) : '';
}

interface Chip {
  readonly objs: Phaser.GameObjects.GameObject[];
}

/** Chip anatomy (ART_REFERENCE §3.4 HUD capsule): icon Ø 64 overhangs 20, text 40 lavender, pads. */
const ICON_PX = CP.hudIconPx;
const OVERHANG = CP.iconOverhangPx;
const TEXT_PX = CP.hudFontPx;
const PAD_R = 22;
const TEXT_GAP = 10;
const CHIP_GAP = 24;

export class GoalsPanel {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly kit: GoalsKit | null;
  private chips: Chip[] = [];
  private rect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private goals: readonly GoalView[] = [];
  private key = '';
  private blocks = -1;
  private pending = 0;
  private blocksText: Phaser.GameObjects.Text | null = null;
  private blocksGroup: Phaser.GameObjects.Container | null = null;
  private blocksRectNow: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private bump: { start: number; dir: -1 | 1 } | null = null;

  constructor(scene: Phaser.Scene, depth: number, kit: GoalsKit | null = null) {
    this.scene = scene;
    this.kit = kit;
    this.root = scene.add.container(0, 0, []).setDepth(depth);
  }

  layout(rect: Rect): void {
    this.rect = rect;
    this.root.setPosition(rect.x, rect.y);
    this.key = '';
    this.rebuild();
  }

  /** Goal values from core `goalViews(state)`. */
  setGoals(goals: readonly GoalView[]): void {
    this.goals = goals;
    this.rebuild();
  }

  /**
   * UX §5.9 items 1–2: blocks left (`TurnSummary.blocksLeft`) and the material blocks of undelivered batches
   * (`pendingBlocks`). `now` starts the change animation (falls: up + pulse; rises: down, no pulse).
   */
  setBlocks(n: number, pending: number, now: number, animate = true): void {
    if (n === this.blocks && pending === this.pending) return;
    const before = this.blocks;
    this.blocks = n;
    this.pending = pending;
    if (animate && before >= 0 && n !== before) this.bump = { start: now, dir: n < before ? -1 : 1 };
    this.rebuild();
  }

  /** The blocks-left chip (tutorial `blocks` highlight, CL-2R-21). */
  blocksRect(): Rect {
    return this.blocksRectNow;
  }

  /** Per frame: the blocks-left change (#20 look: 1,0 → 1,15 → 1,0 when falling, a short slide). */
  update(now: number, reduced: boolean): void {
    const b = this.bump;
    const grp = this.blocksGroup;
    if (!b || !grp) return;
    const ms = TOKENS.duration.queue;
    const u = (now - b.start) / ms;
    if (u >= 1 || u < 0) {
      this.bump = null;
      grp.setScale(1);
      if (this.blocksText) this.blocksText.setY(this.midY());
      return;
    }
    if (reduced) return;
    const peak = 1.15;
    grp.setScale(b.dir < 0 ? 1 + (peak - 1) * Math.sin(Math.PI * u) : 1);
    if (this.blocksText) this.blocksText.setY(this.midY() - b.dir * SLIDE_PX * (1 - u));
  }

  setVisible(on: boolean): void {
    this.root.setVisible(on);
  }

  destroy(): void {
    this.root.destroy(true);
  }

  private midY(): number {
    return this.rect.h / 2;
  }

  private rebuild(): void {
    if (this.rect.w <= 0) return;
    const goals = this.goals;
    const key = `${goals.map((g) => `${g.kind}:${g.value}/${g.target}`).join(',')}|${this.blocks}|${this.pending}`;
    if (key === this.key) return;
    this.key = key;
    for (const c of this.chips) for (const o of c.objs) o.destroy();
    this.chips = [];
    this.blocksText = null;
    this.blocksGroup = null;
    const kinds = goalChips(goals);
    const parts: { w: number; build: (x: number) => Phaser.GameObjects.GameObject[] }[] = kinds.map((k) => {
      if (k === 'build') return this.buildChip(goals.find((g) => g.kind === 'build'));
      if (k === 'blocks') return this.blocksChip();
      return this.goalChip(goals.find((g) => g.kind === k));
    });
    const total = parts.reduce((m, p) => m + p.w, 0) + CHIP_GAP * (parts.length - 1);
    // right-aligned in the row (ART_REFERENCE §9.4), overflow shrinks the gap
    let x = Math.max(OVERHANG, this.rect.w - total);
    for (const p of parts) {
      const objs = p.build(x);
      this.root.add(objs);
      this.chips.push({ objs });
      x += p.w + CHIP_GAP;
    }
  }

  /** The dark HUD capsule of a chip: `w` from the icon's left overhang to the right end. */
  private capsule(x: number, w: number): Phaser.GameObjects.GameObject {
    const kit = this.kit;
    const h = capsuleV3Height('hud', TOKENS);
    const y = this.midY() - h / 2;
    if (kit) {
      const ref = kit.ref(KIT.capsuleHud);
      const sl = kit.slice(KIT.capsuleHud);
      return this.scene.add
        .nineslice(x + OVERHANG, y, ref.key, ref.frame, w - OVERHANG, 0, sl?.left ?? 38, sl?.right ?? 38, 0, 0)
        .setOrigin(0, 0);
    }
    const g = addBakedGraphics(this.scene);
    g.fillStyle(hex(CP.hudFill), CP.fillAlpha).fillRoundedRect(x + OVERHANG, y, w - OVERHANG, h, h / 2);
    return g;
  }

  private countText(text: string, done: boolean): Phaser.GameObjects.Text {
    const t0 = addKitText(this.scene, 0, this.midY(), text, done ? 'counterCream' : 'counterLavender', TEXT_PX);
    if (done) t0.setColor(TOKENS.kit.v3.palette.checkGreen);
    return t0.setOrigin(0, t0.originY);
  }

  private okBadge(x: number, y: number): Phaser.GameObjects.GameObject {
    const ref = this.kit?.boot(badgeFrameName('ok')) ?? null;
    if (ref) return this.scene.add.image(x, y, ref.key, ref.frame).setDisplaySize(OK_PX, OK_PX);
    const g = addBakedGraphics(this.scene);
    g.fillStyle(hex(TOKENS.kit.v3.palette.checkGreen), 1).fillCircle(x, y, OK_PX / 2);
    return g;
  }

  private buildChip(goal: GoalView | undefined): { w: number; build: (x: number) => Phaser.GameObjects.GameObject[] } {
    const done = goal?.done ?? false;
    const text = this.countText(t('common.count', { n: goal?.value ?? 0, max: goal?.target ?? 0 }), done);
    const w = ICON_PX + TEXT_GAP + text.width + PAD_R;
    return {
      w,
      build: (x) => {
        const cap = this.capsule(x, w);
        const icon = addBakedGraphics(this.scene);
        drawBuildIcon(icon, ICON_PX * 0.9);
        icon.setPosition(x + ICON_PX / 2, this.midY());
        text.setX(x + ICON_PX + TEXT_GAP);
        const out: Phaser.GameObjects.GameObject[] = [cap, icon, text];
        if (done) out.push(this.okBadge(x + ICON_PX * 0.85, this.midY() + ICON_PX * 0.3));
        return out;
      },
    };
  }

  private blocksChip(): { w: number; build: (x: number) => Phaser.GameObjects.GameObject[] } {
    const n = Math.max(0, this.blocks);
    const num = addKitText(this.scene, 0, this.midY(), String(n), 'counterCream', TEXT_PX + 4);
    num.setOrigin(0, num.originY);
    const labelText = optText('hud.blocks');
    const label = labelText
      ? this.scene.add
          .text(0, this.midY() + LABEL_DY_PX, labelText, kitTextStyle('counterLavender', HUD.blocksLeftLabelPx))
          .setOrigin(0, 0.5)
      : null;
    const w = ICON_PX + TEXT_GAP + num.width + (label ? LABEL_GAP_PX + label.width : 0) + PAD_R;
    return {
      w,
      build: (x) => {
        const cap = this.capsule(x, w);
        const ref = this.kit?.ref(KIT.blocksLeftCompact) ?? null;
        const icon: Phaser.GameObjects.GameObject = ref
          ? this.scene.add
              .image(x + ICON_PX / 2, this.midY(), ref.key, ref.frame)
              .setDisplaySize(ICON_PX, ICON_PX)
          : addBakedGraphics(this.scene)
              .fillStyle(hex(TOKENS.kit.v3.buttonColor.cream.faceTop), 1)
              .fillRoundedRect(x, this.midY() - ICON_PX / 2, ICON_PX, ICON_PX, 12);
        num.setX(0);
        const group = this.scene.add.container(x + ICON_PX + TEXT_GAP, 0, [num]);
        label?.setX(x + ICON_PX + TEXT_GAP + num.width + LABEL_GAP_PX);
        this.blocksText = num;
        this.blocksGroup = group;
        const out: Phaser.GameObjects.GameObject[] = [cap, icon, group];
        if (label) out.push(label);
        if (this.pending > 0) {
          const sub = this.kit?.ref(KIT.truckSubBadge) ?? null;
          const bx = x + ICON_PX - HUD.truckSubBadgePx / 4;
          const by = this.midY() + ICON_PX / 2 - HUD.truckSubBadgePx / 4;
          if (sub) out.push(this.scene.add.image(bx, by, sub.key, sub.frame).setOrigin(0.5, 0.5));
          out.push(
            this.scene.add
              .text(bx, by, t('common.plus', { n: this.pending }), kitTextStyle('button', SUB_FONT_PX, TOKENS.kit.v3.badge.textStroke))
              .setOrigin(0.5, 0.55),
          );
        }
        if (n === 0) out.push(this.okBadge(x + ICON_PX * 0.85, this.midY() + ICON_PX * 0.3));
        this.blocksRectNow = { x: this.rect.x + x, y: this.rect.y, w, h: this.rect.h };
        return out;
      },
    };
  }

  private goalChip(goal: GoalView | undefined): { w: number; build: (x: number) => Phaser.GameObjects.GameObject[] } {
    const done = goal?.done ?? false;
    const text = this.countText(t('common.count', { n: goal?.value ?? 0, max: goal?.target ?? 0 }), done);
    const w = ICON_PX + TEXT_GAP + text.width + PAD_R;
    return {
      w,
      build: (x) => {
        const cap = this.capsule(x, w);
        const icon = addBakedGraphics(this.scene)
          .fillStyle(hex(TOKENS.color.board.yardFrame), 1)
          .fillRoundedRect(x + ICON_PX * 0.1, this.midY() - ICON_PX * 0.4, ICON_PX * 0.8, ICON_PX * 0.8, 12);
        text.setX(x + ICON_PX + TEXT_GAP);
        const out: Phaser.GameObjects.GameObject[] = [cap, icon, text];
        if (done) out.push(this.okBadge(x + ICON_PX * 0.85, this.midY() + ICON_PX * 0.3));
        return out;
      },
    };
  }
}

/** Gap between the number and the "blok" label; the label sits on the number's baseline. */
const LABEL_GAP_PX = 8;
const LABEL_DY_PX = 8;
/** ✓ badge on a done chip (ART §14.9: 40 px). */
const OK_PX = 40;
/** "+n" text on the 40 px truck sub-badge. */
const SUB_FONT_PX = 26;
/** #20-look slide of the number on a change. */
const SLIDE_PX = 18;
