/**
 * Level-start window v3 (UX_FLOWS §4 / §4.1; ART_REFERENCE §9.3; GDD K-40; STORY §7.8 `levelStart.*`): opened by the
 * home screen's "Bölüm N" button from level 3 on. An indigo window (ui/Popup) with the two-ring "Bölüm {n}" title
 * mounted on its top edge (the ZOR / ÇOK ZOR pill beside it), the red ×, a lavender plate holding the goal row
 * (structure thumbnail + area name + segment count), the "Güçlendiricileri seç" label and the three pre-level booster
 * squares (blue; locked = grey + small lock + "Bölüm N"; selected = cyan ring + ✓; count badge at the lower right)
 * and the green L "Oyna". Without a life: a disabled cream M "Bekle mm:ss" above a green L "Can doldur".
 *
 * The slot states come from the pure meta/levelStart.ts model; a tap toggles a ready slot. "Oyna" hands the chosen
 * ids to the scene (`preBoosters`), which starts the level (spent at the start, refunded on a free exit — K-43).
 */
import Phaser from 'phaser';
import type { CompiledLevel } from '../core/level/compile.ts';
import type { PreBooster } from '../core/types.ts';
import { levelStartSlots, toggleSlot } from '../meta/levelStart.ts';
import type { PreSlotModel } from '../meta/levelStart.ts';
import type { LivesView } from '../meta/home.ts';
import { formatCountdown } from '../meta/home.ts';
import type { AssetService } from '../services/assets.ts';
import { t, tDynamic, upper } from '../services/i18n.ts';
import type { Layout } from '../theme/layout.ts';
import { TOKENS } from '../theme/tokens.ts';
import { KIT } from '../theme/textures.ts';
import { buttonV3PlateRect } from '../theme/draw/kitV3.ts';
import type { KitV3ButtonColor } from '../theme/draw/kitV3.ts';
import { addBakedGraphics } from './BakedGraphics.ts';
import { drawBuildIcon } from './icons.ts';
import { Popup } from './Popup.ts';
import type { PopupOption } from './Popup.ts';
import { hex } from './text.ts';
import { ArtImage } from './kit/ArtImage.ts';
import { kitButtonRef, kitRef, kitSlice } from './kit/atlas.ts';
import type { IconBinder } from './kit/icons.ts';
import { addKitText, fitWidth } from './kit/text.ts';
import type { KitButton, PressVariant } from './kit/KitButton.ts';

const V = TOKENS.kit.v3;
const LS = V.screen.levelStart;

/** Icon of each pre-level booster slot (ART §9 icon set; `icon_shutter` = Açık Kepenk, ASSET §16.3 ek 2026-10-20). */
export const PRE_SLOT_ICON: Readonly<Record<PreBooster, string>> = {
  thermos: 'icon_thermos',
  trowelStart: 'icon_gold_trowel',
  openShutter: 'icon_shutter',
};
/** The selected slot's ✓ (`icon_check`, 40 px at the upper right; ASSET §16.3 ek 2026-10-20). */
const CHECK_ICON = 'icon_check';
const CHECK_PX = 40;

export interface LevelStartInput {
  readonly level: CompiledLevel;
  readonly inventory: Readonly<Partial<Record<string, number>>>;
  readonly lives: LivesView;
  /** STORY §7.7 area title key (`town.ch1.title`). */
  readonly areaKey: string;
  readonly difficultyTag: 'hard' | 'superhard' | null;
}

export interface LevelStartHandlers {
  readonly onPlay: (preBoosters: readonly PreBooster[]) => void;
  readonly onClose: () => void;
  /** A tap on a slot that cannot be chosen (locked / no shutter in this level / empty): the scene shows the hint. */
  readonly onSlotHint: (slot: PreSlotModel, at: { x: number; y: number }) => void;
  /** "Can doldur" (no life): the scene decides (the lives window is Faz 4 → "Yakında"). */
  readonly onRefill: (at: { x: number; y: number }) => void;
  readonly button?: (b: KitButton, v: PressVariant) => void;
}

interface SlotView {
  readonly model: PreSlotModel;
  readonly root: Phaser.GameObjects.Container;
  readonly face: Phaser.GameObjects.NineSlice;
  readonly ring: Phaser.GameObjects.Graphics;
  readonly ok: Phaser.GameObjects.Image;
  readonly badge: Phaser.GameObjects.Image;
  readonly count: Phaser.GameObjects.Text;
}

/**
 * Plate content rhythm (ART_REFERENCE §9.3: goal row 716–876, streak row 892–972, label 1016, squares 1052–1236 in the
 * 684–1244 plate). Without the streak row (before level 15, UX §4; DS3-08) the plate is 480 high (684–1164), the label
 * centre at 976 and the squares at 1012: offsets from the plate top below. The squares ride the plate's bottom edge
 * then (their lower 32 px and the count badges on the window body), the streak row brings the 560 plate back.
 */
const PLATE_PAD = 32;
const STREAK_ROW_PX = LS.plateH - 480;
const LABEL_Y = LS.labelY - LS.plateY - STREAK_ROW_PX;
const SQUARES_Y = LS.boosterY - LS.plateY - STREAK_ROW_PX;
const PLATE_H = LS.plateH - STREAK_ROW_PX;
const BADGE_PX = V.badge.sizePx;

export class LevelStartWindow {
  readonly popup: Popup;
  private readonly scene: Phaser.Scene;
  private readonly handlers: LevelStartHandlers;
  private readonly input: LevelStartInput;
  private readonly icons: IconBinder;
  private readonly assets: AssetService;
  private readonly slots: SlotView[] = [];
  private selected: PreBooster[] = [];
  private closed = false;

  constructor(
    scene: Phaser.Scene,
    layout: Layout,
    input: LevelStartInput,
    deps: { readonly icons: IconBinder; readonly assets: AssetService; readonly reduced: () => boolean },
    depth: number,
    handlers: LevelStartHandlers,
  ) {
    this.scene = scene;
    this.handlers = handlers;
    this.input = input;
    this.icons = deps.icons;
    this.assets = deps.assets;
    const lvl = input.level;
    const noLife = !input.lives.unlimited && input.lives.count <= 0;
    const options: PopupOption[] = noLife
      ? [
          {
            id: 'wait',
            label: `${t('lives.wait')} ${input.lives.nextInMs !== null ? formatCountdown(input.lives.nextInMs) : ''}`,
            tone: 'disabled',
            size: 'M',
          },
          { id: 'refill', label: t('lives.title'), tone: 'primary', size: 'L' },
        ]
      : [{ id: 'play', label: t('levelStart.play'), tone: 'primary', size: 'L' }];
    this.popup = new Popup(
      scene,
      layout,
      {
        rows: [
          { kind: 'title', text: t('home.play', { n: lvl.id }) },
          { kind: 'custom', h: PLATE_H, build: (s, w) => this.plate(s, w, deps.reduced) },
        ],
        options,
        close: true,
        titlePx: V.text.titleTwoRing.fontPx,
      },
      depth,
      {
        option: (id) => {
          if (id === 'play') this.play();
          else if (id === 'refill') this.handlers.onRefill(this.optionPoint('refill'));
        },
        close: () => this.close(),
        ...(handlers.button ? { button: handlers.button } : {}),
      },
    );
    if (input.difficultyTag) this.difficultyPill(input.difficultyTag);
  }

  /** The `preBoosters` the player chose so far (harness, tests). */
  get chosen(): readonly PreBooster[] {
    return this.selected;
  }

  get closePoint(): { readonly x: number; readonly y: number } | null {
    return this.popup.closePoint;
  }

  /** Centre of slot `id` in design px (harness taps). */
  slotPoint(id: PreBooster): { x: number; y: number } | null {
    const v = this.slots.find((s) => s.model.id === id);
    if (!v) return null;
    const m = v.root.getWorldTransformMatrix();
    return { x: m.tx, y: m.ty };
  }

  private optionPoint(id: string): { x: number; y: number } {
    const i = id === 'refill' ? 1 : 0;
    const b = this.popup.options[i];
    if (!b) return { x: this.popup.panel.x, y: this.popup.panel.y };
    const m = b.root.getWorldTransformMatrix();
    return { x: m.tx, y: m.ty };
  }

  private play(): void {
    if (this.closed) return;
    this.closed = true;
    this.handlers.onPlay(this.selected);
  }

  private close(): void {
    if (this.closed) return;
    this.closed = true;
    this.handlers.onClose();
  }

  /** The difficulty pill beside the mounted title (UX §3 / §4: ZOR red, ÇOK ZOR purple). */
  private difficultyPill(tag: 'hard' | 'superhard'): void {
    const title = this.popup.title;
    if (!title) return;
    const fill = tag === 'hard' ? V.badge.mid : V.palette.pink;
    const stroke = tag === 'hard' ? V.badge.stroke : V.panel.outline;
    const w = LS.difficultyW;
    const h = LS.difficultyH;
    const g = addBakedGraphics(this.scene);
    g.fillStyle(hex(stroke), 1).fillRoundedRect(0, 0, w, h + 6, h / 2);
    g.fillStyle(hex(fill), 1).fillRoundedRect(5, 5, w - 10, h - 10, h / 2 - 5);
    g.fillStyle(0xffffff, 0.22).fillRoundedRect(16, 9, w - 32, (h - 18) * 0.4, 10);
    const label = addKitText(
      this.scene,
      w / 2,
      h / 2,
      upper(t(tag === 'hard' ? 'difficulty.hard' : 'difficulty.superhard')),
      'button',
      36,
      stroke,
    );
    fitWidth(label, w - 24);
    const root = this.scene.add.container(title.root.x + title.width / 2 + 24, title.root.y - h / 2, [
      g,
      label,
    ]);
    root.setAngle(-4);
    this.popup.panel.add(root);
  }

  /** The lavender plate: goal row, label and the three booster squares (centred on x = 0, top at y = 0). */
  private plate(scene: Phaser.Scene, w: number, reduced: () => boolean): Phaser.GameObjects.GameObject[] {
    const out: Phaser.GameObjects.GameObject[] = [];
    const pr = kitRef(scene.game, KIT.plate);
    const ps = kitSlice(KIT.plate);
    out.push(
      scene.add
        .nineslice(0, 0, pr.key, pr.frame, w, PLATE_H, ps?.left, ps?.right, ps?.top, ps?.bottom)
        .setOrigin(0.5, 0),
    );
    // goal row: structure thumbnail (the area's structure in full colour) + area title + segments chip
    const lvl = this.input.level;
    const thumb = LS.goalThumbPx;
    const gx = -w / 2 + PLATE_PAD + 8;
    const gy = PLATE_PAD;
    const cr = kitRef(scene.game, KIT.card);
    const cs = kitSlice(KIT.card);
    out.push(
      scene.add
        .nineslice(gx, gy, cr.key, cr.frame, thumb, thumb, cs?.left, cs?.right, cs?.top, cs?.bottom)
        .setOrigin(0, 0),
    );
    const art = ArtImage.create(
      scene,
      this.assets,
      'town_ch1_treehouse',
      { x: gx + 16, y: gy + 12, w: thumb - 32, h: thumb - 24 },
      { reduced },
    );
    out.push(art.image);
    const title = addKitText(
      scene,
      0,
      0,
      tDynamic(this.input.areaKey),
      'button',
      48,
      V.panel.plateStroke,
      '#FFFFFF',
    );
    title.setOrigin(0, title.originY).setPosition(gx + thumb + 28, gy + 44);
    fitWidth(title, w - thumb - 2 * PLATE_PAD - 60);
    out.push(title);
    const segments = lvl.segments.length;
    const chipIcon = addBakedGraphics(scene);
    drawBuildIcon(chipIcon, 56);
    chipIcon.setPosition(gx + thumb + 28 + 28, gy + 118);
    const chip = addKitText(scene, 0, 0, t('common.count', { n: 0, max: segments }), 'counterCream', 40);
    chip.setOrigin(0, chip.originY).setPosition(gx + thumb + 28 + 64, gy + 118);
    out.push(chipIcon, chip);
    // "Güçlendiricileri seç" (STORY §7.8), 56 px white + plate contour
    const label = addKitText(
      scene,
      0,
      LABEL_Y,
      t('levelStart.boosters'),
      'button',
      LS.labelFontPx,
      V.panel.plateStroke,
      '#FFFFFF',
    );
    fitWidth(label, w - 2 * PLATE_PAD);
    out.push(label);
    // the three squares
    const models = levelStartSlots({
      levelId: lvl.id,
      inventory: this.input.inventory,
      hasShutterGaps: lvl.gaps.some((g) => g.type === 'shutter' || g.type === 'locked'),
      selected: this.selected,
    });
    const n = models.length;
    const total = n * LS.boosterPx + (n - 1) * LS.boosterGapPx;
    models.forEach((m, i) => {
      const x = -total / 2 + i * (LS.boosterPx + LS.boosterGapPx) + LS.boosterPx / 2;
      const view = this.square(scene, m, x, SQUARES_Y + LS.boosterPx / 2);
      this.slots.push(view);
      out.push(view.root);
    });
    return out;
  }

  private squareLook(m: PreSlotModel): { color: KitV3ButtonColor; state: 'normal' | 'disabled' } {
    return m.state === 'ready' || m.state === 'empty'
      ? { color: 'blue', state: 'normal' }
      : { color: 'grey', state: 'disabled' };
  }

  private square(scene: Phaser.Scene, m: PreSlotModel, cx: number, cy: number): SlotView {
    const px = LS.boosterPx;
    const look = this.squareLook(m);
    const f = kitButtonRef(scene.game, look.color, px, look.state, true);
    const face = scene.add
      .nineslice(
        0,
        0,
        f.ref.key,
        f.ref.frame,
        px,
        0,
        f.slices.left,
        f.slices.right,
        f.slices.top,
        f.slices.bottom,
      )
      .setOrigin(0.5, px / 2 / f.ref.h);
    const plate = buttonV3PlateRect({ color: 'blue', w: px, h: px, square: true }, TOKENS);
    const icy = -px / 2 + plate.y + plate.h / 2;
    const icon = this.icons.add(scene, 0, icy, PRE_SLOT_ICON[m.id], Math.round(px * 0.6));
    if (m.state !== 'ready' && m.state !== 'empty') icon.setAlpha(V.nav.lockedAlpha);
    // selected: 8 px cyan ring (ART_REFERENCE §9.3 "8 px #24CCFF ışıma") + ✓ 40 at the upper right
    const ring = addBakedGraphics(scene).setVisible(false);
    ring
      .lineStyle(V.effects.selectGlowPx, hex(V.effects.selectGlow), 0.9)
      .strokeRoundedRect(-px / 2 - 6, -px / 2 - 6, px + 12, px + 12, 46);
    const ok = this.icons.add(scene, px / 2 - 14, -px / 2 + 14, CHECK_ICON, CHECK_PX).setVisible(false);
    // count badge riding the lower-right corner (grey while locked, UX §4)
    const bref = kitRef(scene.game, KIT.badge);
    const bx = px / 2 - 8;
    const by = px / 2 - 10;
    const badge = scene.add.image(bx, by, bref.key, bref.frame).setOrigin(0.5, BADGE_PX / 2 / bref.h);
    const count = addKitText(scene, bx, by - 2, '', 'button', V.badge.fontPx - 4, V.badge.textStroke);
    const parts: Phaser.GameObjects.GameObject[] = [ring, face, icon, badge, count, ok];
    if (m.state === 'locked') {
      badge.setTint(0x9a9a9a);
      const lr = kitRef(scene.game, KIT.lockSmall);
      const lpx = V.lock.smallW;
      parts.push(
        scene.add
          .image(px / 2 - lpx / 2 - 4, -px / 2 + V.lock.smallH / 2 + 2, lr.key, lr.frame)
          .setDisplaySize(lpx, (lpx * lr.h) / lr.w),
      );
      const caption = addKitText(
        scene,
        0,
        px / 2 + 26,
        t('home.play', { n: m.unlockLevel }),
        'counterCream',
        34,
      );
      fitWidth(caption, px + LS.boosterGapPx - 8);
      parts.push(caption);
    }
    const showBadge = m.count > 0 || m.state === 'empty';
    badge.setVisible(showBadge);
    count.setText(m.state === 'empty' ? '+' : String(m.count)).setVisible(showBadge);
    const root = scene.add.container(cx, cy, parts);
    root.setSize(px + 24, px + 24).setInteractive();
    root.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, (p: Phaser.Input.Pointer) => {
      if (p.wasCanceled) return;
      this.slotTapped(m.id);
    });
    const view: SlotView = { model: m, root, face, ring, ok, badge, count };
    this.applySelection(view, m.selected);
    return view;
  }

  private applySelection(v: SlotView, on: boolean): void {
    v.ring.setVisible(on);
    v.ok.setVisible(on);
  }

  private slotTapped(id: PreBooster): void {
    const models = this.slots.map((s) => s.model);
    const slot = models.find((m) => m.id === id);
    if (!slot) return;
    if (slot.state !== 'ready') {
      const p = this.slotPoint(id);
      if (p) this.handlers.onSlotHint(slot, { x: p.x, y: p.y - LS.boosterPx / 2 });
      return;
    }
    this.selected = toggleSlot(this.selected, models, id);
    for (const v of this.slots) this.applySelection(v, this.selected.includes(v.model.id));
  }

  destroy(): void {
    this.popup.destroy();
  }
}
