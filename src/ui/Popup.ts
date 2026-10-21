/**
 * Window v3 (ART_REFERENCE §3.7 indigo window, §3.6 mounted title, §3.2 red round ×, §9.5 / §9.7 / §9.8 layouts;
 * UX §0.1 / TECH §10.1 popup anchor contract: the panel's bottom edge is at `H − popup.panelBottomPx`, the option
 * buttons are stacked bottom → top above it — never vertically centred; UX §0.2: the primary action is the lowest).
 *
 * Anatomy: `overlay` dim (α `overlayAlpha`) → the 9-sliced indigo panel (`ui_panel`, 1000 wide) → content rows →
 * option buttons (`KitButton` v3: L 560 × 212, M 360 × 136 or the full 920 × 152 option row) → the two-ring title
 * mounted on the panel's top edge (centre = edge − 20) → the Ø 120 × overhanging the top-right corner (−60, +50).
 * Rows: consecutive `text` rows share one cream card (`ui_card`, card text #1A467B); `toggle` rows share one lavender
 * plate (`ui_plate`) with cream row strips and the 176 × 88 switch pill; `custom` rows draw themselves (centred on
 * x = 0, top at y = 0). The dim layer takes every touch under the window. The window opens / closes through the
 * EventPlayer (JUICE #70 / #71, or #52 for the out-of-moves offer) via `target`; options press with #69 / #97.
 */
import Phaser from 'phaser';
import type { Layout, Rect } from '../theme/layout.ts';
import { TOKENS } from '../theme/tokens.ts';
import { KIT } from '../theme/textures.ts';
import type { KitV3ButtonColor } from '../theme/draw/kitV3.ts';
import { hex } from './text.ts';
import { kitRef, kitSlice } from './kit/atlas.ts';
import type { IconBinder } from './kit/icons.ts';
import { KitButton } from './kit/KitButton.ts';
import type { PressVariant } from './kit/KitButton.ts';
import { addInlineText } from './kit/InlineText.ts';
import { addKitText, addTitleGold, addTitleTwoRing, fitWidth, kitTextStyle } from './kit/text.ts';
import type { LayeredTitle } from './kit/text.ts';

const V3 = TOKENS.kit.v3;
const PN = V3.panel;
const CL = V3.close;

export type OptionTone = 'primary' | 'secondary' | 'neutral' | 'disabled' | 'text';
/** Option button sizes: L / M (ART_REFERENCE §3.1) or the full 920 × 152 option row (UX §7 equal options). */
import type { OptionSize } from './popupLayout.ts';
import { optionRects } from './popupLayout.ts';

export type { OptionSize } from './popupLayout.ts';
export { OPTION_SIZE, optionRects, pairRects } from './popupLayout.ts';

export interface PopupOption {
  readonly id: string;
  readonly label: string;
  readonly tone: OptionTone;
  readonly enabled?: boolean;
  readonly size?: OptionSize;
  /** Leading "▶" (rewarded ad, UX §7). */
  readonly play?: boolean;
  /** PriceLabel (UX §0.3): coins line + real-money line. */
  readonly price?: { readonly line1: string; readonly line2: string } | null;
  /** One small right-hand line (ad: `lose.adToday` / `ads.none` / `ads.tomorrow`). */
  readonly sub?: string | null;
}

export type PopupRow =
  | { readonly kind: 'title'; readonly text: string; readonly gold?: boolean }
  | {
      readonly kind: 'text';
      readonly text: string;
      /** Text size (default `kit.v3.text.cardText.fontPx` 48; `small` 34 lavender outside a card). */
      readonly size?: number;
      /** `card` (default: cream card, #1A467B) or `plain` (lavender on the panel body, no card). */
      readonly look?: 'card' | 'plain';
    }
  | { readonly kind: 'gap'; readonly h: number }
  | { readonly kind: 'toggle'; readonly id: string; readonly label: string; readonly on: boolean }
  | {
      readonly kind: 'custom';
      readonly h: number;
      /** Builds the row's objects centred on x = 0, top at y = 0 (local to the row). */
      readonly build: (scene: Phaser.Scene, width: number) => Phaser.GameObjects.GameObject[];
    };

export interface PopupSpec {
  readonly rows: readonly PopupRow[];
  readonly options: readonly PopupOption[];
  /** Kept for the callers of the v2 window: both arrangements stack bottom → top in v3 (UX §0.2). */
  readonly arrange?: 'stack' | 'pair';
  /** × in the top-right corner (same result as the "no" option, R-15). */
  readonly close?: boolean;
  /** Title size: 96 (default) or 112 (the level-start window). */
  readonly titlePx?: number;
  /** Panel width (default `kit.v3.panel.w` 1000). */
  readonly panelW?: number;
  /** Inline `{coin}` icons of the option labels / price lines. */
  readonly icons?: IconBinder | null;
}

export interface PopupHandlers {
  option(id: string): void;
  close?(): void;
  toggle?(id: string): void;
  /** JUICE #69 on any button of the window. */
  button?(b: KitButton, variant: PressVariant): void;
}

/** Vertical rhythm of the window (ART_REFERENCE §9.3 / §9.5: Oyna altı boşluk 80, kareler üstü 88). */
const OPTIONS_BOTTOM_INSET = 80;
const CONTENT_TO_OPTIONS = 56;
const PANEL_TOP_PAD = 104;
const ROW_GAP = 24;
/** Content inset inside the panel (plate 880 wide in the 1000 window, ART_REFERENCE §9.3). */
const CONTENT_INSET = 60;
/** Cream card and plate paddings. */
const CARD_PAD_X = 48;
const CARD_PAD_Y = 36;
const PLATE_PAD = 24;
const TOGGLE_ROW_H = V3.screen.settings.rowH;
const TOGGLE_ROW_GAP = 16;

/** Tone → v3 button colour (ART_REFERENCE §2.3). */
const TONE_COLOR: Readonly<Record<OptionTone, KitV3ButtonColor>> = {
  primary: 'green',
  secondary: 'orange',
  neutral: 'cream',
  disabled: 'grey',
  text: 'cream',
};

interface Toggle {
  readonly pill: Phaser.GameObjects.Image;
  on: boolean;
}

export class Popup {
  readonly dim: Phaser.GameObjects.Rectangle;
  readonly panel: Phaser.GameObjects.Container;
  readonly options: readonly KitButton[];
  /** Panel rectangle in design px (tests of the anchor contract read it). */
  readonly rect: Rect;
  /** The mounted title (null without a title row). */
  readonly title: LayeredTitle | null;
  private readonly toggles = new Map<string, Toggle>();
  private readonly extras: Phaser.GameObjects.GameObject[] = [];
  private closeButton: Phaser.GameObjects.Container | null = null;
  private readonly scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    layout: Layout,
    spec: PopupSpec,
    depth: number,
    handlers: PopupHandlers,
    _toggleTexts: { readonly on: string; readonly off: string } = { on: '', off: '' },
  ) {
    this.scene = scene;
    const W = layout.W;
    const panelW = spec.panelW ?? PN.w;
    const innerW = panelW - 2 * CONTENT_INSET;
    const bottom = layout.popup.panelBottomY;
    const rects = optionRects(W, bottom - OPTIONS_BOTTOM_INSET, spec.options);
    const optionsTop = rects.length > 0 ? Math.min(...rects.map((r) => r.y)) : bottom - OPTIONS_BOTTOM_INSET;

    // rows → objects with heights (measured), laid out top → bottom later (titles are mounted, not in the flow)
    const built: { objs: Phaser.GameObjects.GameObject[]; h: number; place: (top: number) => void }[] = [];
    const titleRow = spec.rows.find((r) => r.kind === 'title');
    const rows = spec.rows.filter((r) => r.kind !== 'title');
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as Exclude<PopupRow, { kind: 'title' }>;
      if (row.kind === 'gap') {
        built.push({ objs: [], h: row.h, place: () => {} });
        continue;
      }
      if (row.kind === 'text') {
        if (row.look === 'plain') {
          const t = addKitText(scene, 0, 0, row.text, 'counterLavender', row.size ?? 34);
          t.setOrigin(0.5, 0);
          fitWidth(t, innerW);
          const th = t.height;
          built.push({ objs: [t], h: th, place: (top) => t.setPosition(0, top) });
          continue;
        }
        // one cream card for this and the following text rows
        const group: Extract<PopupRow, { kind: 'text' }>[] = [row];
        while (rows[i + 1]?.kind === 'text' && (rows[i + 1] as { look?: string }).look !== 'plain') {
          group.push(rows[++i] as Extract<PopupRow, { kind: 'text' }>);
        }
        built.push(this.textCard(group, innerW, spec.icons ?? null));
        continue;
      }
      if (row.kind === 'toggle') {
        const group: Extract<PopupRow, { kind: 'toggle' }>[] = [row];
        while (rows[i + 1]?.kind === 'toggle') group.push(rows[++i] as Extract<PopupRow, { kind: 'toggle' }>);
        built.push(this.togglePlate(group, innerW, handlers));
        continue;
      }
      const objs = row.build(scene, innerW);
      built.push({
        objs,
        h: row.h,
        place: (top) => objs.forEach((o) => ((o as unknown as { y: number }).y += top)),
      });
    }
    const contentH = built.reduce((s, b) => s + b.h, 0) + Math.max(0, built.length - 1) * ROW_GAP;
    const top = optionsTop - CONTENT_TO_OPTIONS - contentH - PANEL_TOP_PAD;
    const h = Math.min(PN.maxH + 200, bottom - top);
    this.rect = { x: (W - panelW) / 2, y: bottom - h, w: panelW, h };
    const cx = W / 2;
    const cy = this.rect.y + h / 2;

    this.dim = scene.add
      .rectangle(0, 0, W, layout.H, hex(V3.palette.overlay), 1)
      .setOrigin(0, 0)
      .setDepth(depth)
      .setAlpha(V3.palette.overlayAlpha);
    this.dim.setInteractive(); // swallows every touch under the window

    const pr = kitRef(scene.game, KIT.panel);
    const ps = kitSlice(KIT.panel);
    const frameH = h + PN.shadowYPx + Math.round(PN.shadowBlurPx / 2);
    const body = scene.add
      .nineslice(0, 0, pr.key, pr.frame, panelW, frameH, ps?.left, ps?.right, ps?.top, ps?.bottom)
      .setOrigin(0.5, h / 2 / frameH);
    const children: Phaser.GameObjects.GameObject[] = [body];

    let y = -h / 2 + PANEL_TOP_PAD;
    for (const b of built) {
      b.place(y);
      children.push(...b.objs);
      y += b.h + ROW_GAP;
    }

    const buttons: KitButton[] = [];
    spec.options.forEach((o, i) => {
      const rr = rects[i];
      if (!rr) return;
      const disabled = o.enabled === false || o.tone === 'disabled';
      const btn = new KitButton(scene, {
        color: TONE_COLOR[o.tone],
        w: rr.w,
        h: rr.h,
        label: o.label,
        disabled,
        ...(o.play ? { play: true } : {}),
        ...(o.price ? { price: o.price } : {}),
        ...(o.sub ? { sub: o.sub } : {}),
        icons: spec.icons ?? null,
      });
      btn.setEnabled(!disabled);
      btn.root.setPosition(rr.x + rr.w / 2 - cx, rr.y + rr.h / 2 - cy);
      btn.onTap(() => handlers.option(o.id));
      btn.onPress((v) => handlers.button?.(btn, v));
      buttons.push(btn);
      children.push(btn.root);
    });
    this.options = buttons;

    // mounted title (ART_REFERENCE §3.6): centre = panel top edge − 20, over a soft shadow band of the panel tone
    let title: LayeredTitle | null = null;
    if (titleRow && titleRow.kind === 'title') {
      const px = spec.titlePx ?? V3.text.titleTwoRing.fontSmallPx;
      const ty = -h / 2 + V3.header.mountedCenterOffsetPx;
      title = titleRow.gold
        ? addTitleGold(scene, 0, ty, titleRow.text, px)
        : addTitleTwoRing(scene, 0, ty, titleRow.text, px);
      title.fit(panelW - 2 * CL.diameterPx - 40);
      children.push(title.root);
    }
    this.title = title;

    if (spec.close) {
      const close = scene.add.container(panelW / 2 + CL.offsetXPx, -h / 2 + CL.offsetYPx);
      const n = kitRef(scene.game, KIT.close);
      const p = kitRef(scene.game, KIT.closePressed);
      const normal = scene.add.image(0, 0, n.key, n.frame).setOrigin(0.5, CL.diameterPx / 2 / n.h);
      const pressed = scene.add
        .image(0, 0, p.key, p.frame)
        .setOrigin(0.5, CL.diameterPx / 2 / p.h)
        .setVisible(false);
      close.add([normal, pressed]);
      close.setSize(CL.hitPx, CL.hitPx).setInteractive();
      let down = false;
      close.on('pointerdown', () => {
        down = true;
        normal.setVisible(false);
        pressed.setVisible(true);
        handlers.button?.(buttons[0] as KitButton, 'press');
      });
      const up = (tap: boolean): void => {
        if (!down) return;
        down = false;
        normal.setVisible(true);
        pressed.setVisible(false);
        if (tap) handlers.close?.();
      };
      close.on('pointerup', (pt: Phaser.Input.Pointer) => up(!pt.wasCanceled));
      close.on('pointerout', () => up(false));
      children.push(close);
      this.closeButton = close;
    }

    this.panel = scene.add.container(cx, cy, children).setDepth(depth + 1);
  }

  /** WindowTarget of JUICE #70 / #71 / #52 / #87. */
  get target(): {
    dim: Phaser.GameObjects.Rectangle;
    panel: Phaser.GameObjects.Container;
    options: readonly KitButton[];
  } {
    return { dim: this.dim, panel: this.panel, options: this.options };
  }

  /** Centre of the × in design px (null without one): the harness taps it (tests/e2e). */
  get closePoint(): { readonly x: number; readonly y: number } | null {
    const c = this.closeButton;
    if (!c) return null;
    const p = this.panel;
    return { x: p.x + c.x * p.scaleX, y: p.y + c.y * p.scaleY };
  }

  /** Switch row state (Pause / Settings windows). */
  setToggle(id: string, on: boolean): void {
    const t = this.toggles.get(id);
    if (!t || t.on === on) return;
    t.on = on;
    const ref = kitRef(this.scene.game, on ? KIT.toggleOn : KIT.toggleOff);
    t.pill.setTexture(ref.key, ref.frame);
  }

  /** Extra objects owned by the window (destroyed with it). */
  own(...objs: Phaser.GameObjects.GameObject[]): void {
    this.extras.push(...objs);
  }

  setVisible(on: boolean): void {
    this.dim.setVisible(on);
    this.panel.setVisible(on);
  }

  destroy(): void {
    for (const o of this.extras) o.destroy();
    this.panel.destroy(true);
    this.dim.destroy();
  }

  /** Cream card with the text rows (ART_REFERENCE §3.7 layer 9, §4 `cardText`). */
  private textCard(
    rows: readonly Extract<PopupRow, { kind: 'text' }>[],
    innerW: number,
    icons: IconBinder | null,
  ): { objs: Phaser.GameObjects.GameObject[]; h: number; place: (top: number) => void } {
    const scene = this.scene;
    const texts: { obj: Phaser.GameObjects.GameObject & { y: number }; h: number }[] = [];
    const maxW = innerW - 2 * CARD_PAD_X;
    for (const r of rows) {
      const px = r.size ?? V3.text.cardText.fontPx;
      if (icons && r.text.includes('{')) {
        const inl = addInlineText(scene, icons, r.text, 'cardText', px, 'center');
        if (inl.width > maxW) inl.root.setScale(maxW / inl.width);
        texts.push({ obj: inl.root, h: px * 1.25 });
        continue;
      }
      const t = scene.add
        .text(0, 0, r.text, {
          ...kitTextStyle('cardText', px),
          wordWrap: { width: maxW, useAdvancedWrap: true },
        })
        .setOrigin(0.5, 0);
      texts.push({ obj: t, h: t.height });
    }
    const gap = 12;
    const textH = texts.reduce((s, t) => s + t.h, 0) + gap * Math.max(0, texts.length - 1);
    const h = textH + 2 * CARD_PAD_Y;
    const cr = kitRef(scene.game, KIT.card);
    const cs = kitSlice(KIT.card);
    const card = scene.add
      .nineslice(0, 0, cr.key, cr.frame, innerW, h, cs?.left, cs?.right, cs?.top, cs?.bottom)
      .setOrigin(0.5, 0);
    return {
      objs: [card, ...texts.map((t) => t.obj)],
      h,
      place: (top) => {
        card.setY(top);
        let y = top + CARD_PAD_Y;
        for (const t of texts) {
          // inline containers are centred on their line; plain texts hang from their top
          t.obj.y = t.obj instanceof Phaser.GameObjects.Container ? y + t.h / 2 : y;
          y += t.h + gap;
        }
      },
    };
  }

  /** Lavender plate with cream row strips and the switch pills (ART_REFERENCE §9.5, §9.8). */
  private togglePlate(
    rows: readonly Extract<PopupRow, { kind: 'toggle' }>[],
    innerW: number,
    handlers: PopupHandlers,
  ): { objs: Phaser.GameObjects.GameObject[]; h: number; place: (top: number) => void } {
    const scene = this.scene;
    const S = V3.screen.settings;
    const rowW = innerW - 2 * PLATE_PAD;
    const h = 2 * PLATE_PAD + rows.length * TOGGLE_ROW_H + (rows.length - 1) * TOGGLE_ROW_GAP;
    const pr = kitRef(scene.game, KIT.plate);
    const ps = kitSlice(KIT.plate);
    const plate = scene.add
      .nineslice(0, 0, pr.key, pr.frame, innerW, h, ps?.left, ps?.right, ps?.top, ps?.bottom)
      .setOrigin(0.5, 0);
    const objs: (Phaser.GameObjects.GameObject & { y: number })[] = [plate];
    const strips = scene.add.graphics();
    objs.push(strips);
    rows.forEach((row, i) => {
      const ry = PLATE_PAD + i * (TOGGLE_ROW_H + TOGGLE_ROW_GAP);
      strips
        .fillStyle(hex(S.rowStroke), 1)
        .fillRoundedRect(-rowW / 2, ry, rowW, TOGGLE_ROW_H, S.rowRadiusPx)
        .fillStyle(hex(S.rowFill), 1)
        .fillRoundedRect(
          -rowW / 2 + S.rowStrokePx,
          ry + S.rowStrokePx,
          rowW - 2 * S.rowStrokePx,
          TOGGLE_ROW_H - 2 * S.rowStrokePx,
          S.rowRadiusPx - S.rowStrokePx,
        );
      const label = addKitText(scene, 0, 0, row.label, 'cardText', V3.text.cardText.fontPx - 4);
      label.setOrigin(0, label.originY).setPosition(-rowW / 2 + 32, ry + TOGGLE_ROW_H / 2);
      const ref = kitRef(scene.game, row.on ? KIT.toggleOn : KIT.toggleOff);
      const pill = scene.add
        .image(rowW / 2 - 24 - V3.screen.pause.toggleW / 2, ry + TOGGLE_ROW_H / 2, ref.key, ref.frame)
        .setOrigin(0.5, V3.screen.pause.toggleH / 2 / ref.h);
      const zone = scene.add.zone(0, ry + TOGGLE_ROW_H / 2, rowW, TOGGLE_ROW_H).setInteractive();
      zone.on('pointerup', (p: Phaser.Input.Pointer) => {
        if (!p.wasCanceled) handlers.toggle?.(row.id);
      });
      this.toggles.set(row.id, { pill, on: row.on });
      objs.push(label, pill, zone);
    });
    return {
      objs,
      h,
      place: (top) => objs.forEach((o) => (o.y += top)),
    };
  }
}
