/**
 * The level screen's windows (UX_FLOWS §5.1 Pause + exit confirm, §7 out of moves window 1 / life lost window 2, §6
 * win screen, §7 "Altın yetmez" → fake store; ART_REFERENCE §9.5 pause / exit, §9.7 lose; STORY §7.3, §7.5, §7.6;
 * D-022, D-024). This class only builds and shows them — every decision (offer number, prices, exit kind, rewards) is
 * made before by core / ui models and passed in; every button calls back into the scene. One window at a time; opening
 * another closes the current one at once.
 *
 * v3 anatomy (ui/Popup): indigo window, mounted two-ring title (gold for "Hamleler bitti!"), × at the corner, cream
 * text card, lavender toggle plate; the primary action is the lowest button (L green), the secondary above it (M cream)
 * — UX §0.2. Animations (JUICE P0): #70 open, #71 close, #52 the out-of-moves window (dim, slide up, options 40 ms
 * apart), #87 the resume variants, #58 the heart, #69 / #97 every button. While a window is open the board takes no
 * input (the dim swallows touches; LevelScene.boardState also checks `open`).
 */
import type Phaser from 'phaser';
import { getLocale, t } from '../../services/i18n.ts';
import type { Frames } from '../atlas.ts';
import type { I18nKey } from '../../services/i18n.ts';
import type { Layout } from '../../theme/layout.ts';
import { TOKENS } from '../../theme/tokens.ts';
import { KIT, bakedFlagsOf, blockFrameName } from '../../theme/textures.ts';
import { previewRow } from '../../ui/losePreview.ts';
import type { PreviewPiece } from '../../ui/losePreview.ts';
import type { OfferModel } from '../../ui/offer.ts';
import { Popup } from '../../ui/Popup.ts';
import type { PopupOption, PopupRow, PopupSpec } from '../../ui/Popup.ts';
import { realMoneyText } from '../../ui/price.ts';
import type { WinRewards } from '../../ui/rewards.ts';
import { UI } from '../../ui/uiConstants.ts';
import { WinScreen } from '../../ui/WinScreen.ts';
import { gameAssets } from '../AssetLoaderScene.ts';
import { kitRef, kitSlice } from '../../ui/kit/atlas.ts';
import { greyIconFrame } from '../../ui/kit/greyIcon.ts';
import { IconBinder } from '../../ui/kit/icons.ts';
import type { KitButton } from '../../ui/kit/KitButton.ts';
import type { PressVariant } from '../../ui/kit/KitButton.ts';
import { addKitText } from '../../ui/kit/text.ts';
import { DEPTH } from './depth.ts';
import type { EventPlayer } from './EventPlayer.ts';
import { juiceMs } from './juice/catalog.ts';

export type WindowKind = 'pause' | 'exit' | 'offer' | 'loss' | 'win' | 'store';

export interface WindowsHost {
  layout(): Layout;
  readonly player: EventPlayer;
}

export interface PauseSettings {
  readonly sound: boolean;
  readonly music: boolean;
  readonly haptics: boolean;
}

export type PauseToggle = keyof PauseSettings;

interface Open {
  readonly kind: WindowKind;
  readonly view: Popup | WinScreen;
  /** Rebuilds the same window (resize). */
  readonly reopen: () => void;
}

/** ART_REFERENCE §9.7: the out-of-moves preview card 880 × 300 (the remaining blocks + "Kalan: n blok" in it). */
const LOSE_PREVIEW_H = TOKENS.kit.v3.screen.lose.previewH;
/**
 * Preview row inside the 300 card: the blocks in the upper band (y 26–210, centre 118; a vertical I4 still clears the
 * count line at 244), at most 56 px per cell, 24 apart, at most 6 shown.
 */
const PREVIEW_CELL_MAX = 56;
const PREVIEW_GAP = 24;
const PREVIEW_MAX_SHOWN = 6;
const PREVIEW_PAD_X = 48;
const PREVIEW_ROW_CY = 118;
const PREVIEW_BAND_H = 184;
const PREVIEW_TEXT_Y = 244;

/** UX §7 window 2 heart: the lives icon of the home capsule (ART §9 icon set). */
const HEART_ICON = 'icon_life';

/** The blocks the out-of-moves window previews, drawn from the level bake at its cell scale `k`. */
export interface LosePreview {
  readonly pieces: readonly PreviewPiece[];
  readonly frames: Frames;
  /** Level cell scale (`layout.grid.k`): the baked block is `cellPx × k` per cell. */
  readonly k: number;
}

export class LevelWindows {
  private readonly scene: Phaser.Scene;
  private readonly host: WindowsHost;
  private readonly icons: IconBinder;
  private current: Open | null = null;
  private closing: (Popup | WinScreen)[] = [];

  constructor(scene: Phaser.Scene, host: WindowsHost) {
    this.scene = scene;
    this.host = host;
    const assets = gameAssets(scene.game);
    this.icons = new IconBinder((id) => assets.icon(id));
  }

  get open(): WindowKind | null {
    return this.current?.kind ?? null;
  }

  /** Centre of the open window's × in design px (harness), or null. */
  get closePoint(): { readonly x: number; readonly y: number } | null {
    const v = this.current?.view;
    return v instanceof Popup ? v.closePoint : null;
  }

  /** UX §5.1 Pause (`resume`: the K-43 resume variant — `resume.title`, JUICE #87 strip, `tut.ctx.resume` line). */
  openPause(opts: {
    readonly resume: boolean;
    readonly resumeTip: boolean;
    /** Read at every (re)build: a toggle or a language change rebuilds the window with the current values. */
    readonly settings: () => PauseSettings;
    readonly onToggle: (id: PauseToggle) => boolean;
    readonly onContinue: () => void;
    readonly onExit: () => void;
  }): void {
    const build = (animate: boolean): void => {
      const rows: PopupRow[] = [{ kind: 'title', text: t(opts.resume ? 'resume.title' : 'pause.title') }];
      if (opts.resumeTip) rows.push({ kind: 'text', text: t('tut.ctx.resume'), size: 40 });
      const toggles: [PauseToggle, I18nKey][] = [
        ['sound', 'settings.sound'],
        ['music', 'settings.music'],
        ['haptics', 'settings.haptics'],
      ];
      // ART_REFERENCE §9.5: the 760 × 340 plate, white labels straight on it (no cream strips)
      for (const [id, key] of toggles)
        rows.push({ kind: 'toggle', id, label: t(key), on: opts.settings()[id], look: 'plain' });
      // ART_REFERENCE §9.5: "Bölümden çık" M cream above, "Devam" L green lowest; the × continues too
      const spec: PopupSpec = {
        rows,
        close: true,
        options: [
          { id: 'exit', label: t('pause.exit'), tone: 'neutral', size: 'M' },
          { id: 'continue', label: t('common.continue'), tone: 'primary', size: 'L' },
        ],
      };
      const popup = this.popup(spec, {
        option: (id) => (id === 'exit' ? opts.onExit() : opts.onContinue()),
        close: opts.onContinue,
        toggle: (id) => popup.setToggle(id, opts.onToggle(id as PauseToggle)),
      });
      this.set('pause', popup, () => build(false));
      if (animate) {
        if (opts.resume) this.host.player.play(87, { variant: 'pause', window: popup.target });
        else this.host.player.play(70, { window: popup.target });
      }
    };
    build(true);
  }

  /** UX §5.1 exit confirm: lines from ui/windowLines `exitLines` in a cream card; "Kal" L green lowest, "Çık" M cream. */
  openExit(opts: {
    readonly lines: readonly I18nKey[];
    readonly onStay: () => void;
    readonly onLeave: () => void;
  }): void {
    const build = (animate: boolean): void => {
      const rows: PopupRow[] = [
        { kind: 'title', text: t('exit.title') },
        ...opts.lines.map((k): PopupRow => ({ kind: 'text', text: t(k), size: 44 })),
      ];
      const popup = this.popup(
        {
          rows,
          close: true,
          panelW: TOKENS.kit.v3.screen.pause.confirmPanelW,
          options: [
            { id: 'leave', label: t('exit.leave'), tone: 'neutral', size: 'M' },
            { id: 'stay', label: t('exit.stay'), tone: 'primary', size: 'L' },
          ],
        },
        { option: (id) => (id === 'stay' ? opts.onStay() : opts.onLeave()), close: opts.onStay },
      );
      this.set('exit', popup, () => build(false));
      if (animate) this.host.player.play(70, { window: popup.target });
    };
    build(true);
  }

  /**
   * UX §7 window 1 "Hamleler bitti!" (D-024; ART_REFERENCE §9.7): gold title, the preview card, "Teklif 1/3" in
   * lavender, three equal 920 × 152 options in the order coins (orange) / ad (cream) / no (cream); × = no. `entry`:
   * `offer` = JUICE #52 after #57; `resume` = K-43 (a) reopened at launch (#87 offer variant); `none` = rebuilt.
   */
  openOffer(opts: {
    readonly model: OfferModel;
    readonly remaining: number;
    /** The remaining blocks in the card (UX §7 "▣ ▣ önizleme"); null = the count line alone. */
    readonly preview?: LosePreview | null;
    readonly entry: 'offer' | 'resume' | 'none';
    readonly onCoins: () => void;
    readonly onAd: () => void;
    readonly onDecline: () => void;
  }): void {
    const build = (entry: 'offer' | 'resume' | 'none'): void => {
      const m = opts.model;
      const locale = getLocale();
      const coin = m.coin;
      const coinOption: PopupOption =
        coin.kind === 'gift'
          ? { id: 'coins', label: t('lose.offer.gift', { n: coin.moves }), tone: 'secondary' }
          : coin.kind === 'buy'
            ? {
                id: 'coins',
                label: t('lose.offer.moves', { n: coin.moves }),
                tone: 'secondary',
                price: {
                  line1: t('common.coins', { n: coin.price }),
                  line2: realMoneyText(coin.price, locale),
                },
              }
            : { id: 'coins', label: t('lose.buygold', { n: coin.missing }), tone: 'secondary' };
      const options: PopupOption[] = [coinOption];
      if (m.ad) {
        const l2 = m.ad.line2;
        options.push({
          id: 'ad',
          label: t('lose.ad', { n: m.ad.moves }),
          play: true,
          tone: 'neutral',
          enabled: m.ad.enabled,
          sub: l2.key === 'lose.adToday' ? t('lose.adToday', { n: l2.n, max: l2.max }) : t(l2.key),
        });
      }
      options.push({ id: 'decline', label: t('lose.decline'), tone: 'neutral' });
      const rows: PopupRow[] = [
        { kind: 'title', text: t('lose.title'), gold: true },
        {
          kind: 'custom',
          h: LOSE_PREVIEW_H,
          build: (scene, w) =>
            this.previewCard(scene, w, t('lose.blocksLeft', { n: opts.remaining }), opts.preview ?? null),
        },
        { kind: 'text', text: t(m.counterKey, { n: m.n, max: m.max }), look: 'plain', size: 34 },
      ];
      const popup = this.popup(
        { rows, options, close: true, icons: this.icons },
        {
          option: (id) => (id === 'coins' ? opts.onCoins() : id === 'ad' ? opts.onAd() : opts.onDecline()),
          close: opts.onDecline,
        },
      );
      this.set('offer', popup, () => build('none'));
      if (entry === 'offer') this.host.player.play(52, { window: popup.target });
      else if (entry === 'resume') this.host.player.play(87, { variant: 'offer', window: popup.target });
    };
    build(opts.entry);
  }

  /**
   * UX §7 window 2 (life lost): the v3 heart (`icon_life`) greys out bottom → top (#58: a greyscale copy under the red
   * icon, whose crop shrinks from the bottom), `lose.life` (+ `lose.streak`), retry L green / home M.
   */
  openLoss(opts: {
    readonly lines: readonly I18nKey[];
    readonly lifeLost: boolean;
    readonly onRetry: () => void;
    readonly onHome: () => void;
  }): void {
    const build = (animate: boolean): void => {
      let drain: ((k: number) => void) | null = null;
      const rows: PopupRow[] = [
        {
          kind: 'custom',
          h: UI.heartPx + 16,
          build: (scene) => {
            const cy = UI.heartPx / 2 + 8;
            const grey = greyIconFrame(scene, this.icons.frame(HEART_ICON));
            const back = scene.add.image(0, cy, grey.key, grey.frame).setDisplaySize(UI.heartPx, UI.heartPx);
            const front = this.icons.add(scene, 0, cy, HEART_ICON, UI.heartPx);
            drain = (k) => {
              const fw = front.frame.width;
              const fh = front.frame.height;
              const keep = Math.max(0, Math.min(1, 1 - k));
              if (keep >= 1) front.isCropped = false;
              else front.setCrop(0, 0, fw, fh * keep);
            };
            drain(animate || !opts.lifeLost ? 0 : 1);
            return [back, front];
          },
        },
        ...opts.lines.map((k, i): PopupRow => ({ kind: 'text', text: t(k), size: i === 0 ? 48 : 40 })),
      ];
      const popup = this.popup(
        {
          rows,
          options: [
            { id: 'home', label: t('common.home'), tone: 'neutral', size: 'M' },
            { id: 'retry', label: t('lose.retry'), tone: 'primary', size: 'L' },
          ],
        },
        { option: (id) => (id === 'retry' ? opts.onRetry() : opts.onHome()) },
      );
      this.set('loss', popup, () => build(false));
      if (!animate) return;
      this.host.player.play(70, { window: popup.target });
      const d = drain as ((k: number) => void) | null;
      if (d && opts.lifeLost) this.host.player.play(58, { heart: { setDrain: d } });
    };
    build(true);
  }

  /** UX §6 win screen (Phase 2: rows + "Devam" under the board). */
  openWin(opts: { readonly rewards: WinRewards; readonly onContinue: () => void }): void {
    const build = (animate: boolean): void => {
      const view = new WinScreen(
        this.scene,
        this.host.layout(),
        opts.rewards,
        DEPTH.windows,
        opts.onContinue,
      );
      this.set('win', view, () => build(false));
      if (animate) this.host.player.play(70, { window: view.target });
    };
    build(true);
  }

  /** UX §7 "Altın yetmez" → the (fake, MVP) store with the smallest covering pack; returns to the same offer. */
  openStore(opts: {
    readonly missing: number;
    readonly pack: { readonly coins: number };
    readonly onBuy: () => void;
    readonly onCancel: () => void;
  }): void {
    const build = (animate: boolean): void => {
      const popup = this.popup(
        {
          // `shop.covers` / `shop.testBuy` (STORY §7.5) are not in i18n yet: the header repeats the offer's own line
          rows: [{ kind: 'text', text: t('lose.buygold', { n: opts.missing }) }],
          close: true,
          icons: this.icons,
          options: [
            {
              id: 'buy',
              label: t('common.coins', { n: opts.pack.coins }),
              tone: 'secondary',
              sub: realMoneyText(opts.pack.coins, getLocale()),
            },
            { id: 'cancel', label: t('common.cancel'), tone: 'neutral' },
          ],
        },
        { option: (id) => (id === 'buy' ? opts.onBuy() : opts.onCancel()), close: opts.onCancel },
      );
      this.set('store', popup, () => build(false));
      if (animate) this.host.player.play(70, { window: popup.target });
    };
    build(true);
  }

  /** Closes the open window (JUICE #71), then destroys it. */
  close(): void {
    const cur = this.current;
    if (!cur) return;
    this.current = null;
    this.host.player.play(71, { window: cur.view.target });
    this.closing.push(cur.view);
    const ms = juiceMs(71, this.host.player.reduced);
    this.scene.time.delayedCall(ms + 20, () => {
      const i = this.closing.indexOf(cur.view);
      if (i < 0) return; // `clear()` already destroyed it
      this.closing.splice(i, 1);
      cur.view.destroy();
    });
  }

  /** Destroys everything at once (level change, scene shutdown). */
  clear(): void {
    this.current?.view.destroy();
    this.current = null;
    for (const v of this.closing) v.destroy();
    this.closing = [];
  }

  /** Resize: the open window is rebuilt for the new layout (no animation). */
  relayout(): void {
    const cur = this.current;
    if (!cur) return;
    cur.reopen();
  }

  // --- internals ---------------------------------------------------------------------------------------------------------

  private popup(spec: PopupSpec, handlers: Omit<ConstructorParameters<typeof Popup>[4], 'button'>): Popup {
    return new Popup(
      this.scene,
      this.host.layout(),
      spec,
      DEPTH.windows,
      { ...handlers, button: (b, v) => this.press(b, v) },
      { on: t('common.on'), off: t('common.off') },
    );
  }

  private set(kind: WindowKind, view: Popup | WinScreen, reopen: () => void): void {
    this.current?.view.destroy();
    this.current = { kind, view, reopen };
  }

  private press(b: KitButton, variant: PressVariant): void {
    this.host.player.play(69, { button: b, variant });
  }

  /**
   * UX §7 window 1 preview card (ART_REFERENCE §9.7): the cream card with the remaining blocks (the level bake's own
   * block frames, shrunk to the row) over the neutral "Kalan: n blok" line (R-15). Without a preview (no bake yet) the
   * line sits in the middle.
   */
  private previewCard(
    scene: Phaser.Scene,
    w: number,
    text: string,
    preview: LosePreview | null,
  ): Phaser.GameObjects.GameObject[] {
    const h = LOSE_PREVIEW_H;
    const cr = kitRef(scene.game, KIT.card);
    const cs = kitSlice(KIT.card);
    const card = scene.add
      .nineslice(0, 0, cr.key, cr.frame, w, h, cs?.left, cs?.right, cs?.top, cs?.bottom)
      .setOrigin(0.5, 0);
    const out: Phaser.GameObjects.GameObject[] = [card];
    const pieces = preview?.pieces ?? [];
    if (!preview || pieces.length === 0) {
      out.push(addKitText(scene, 0, h / 2, text, 'cardText', TOKENS.kit.v3.text.cardText.fontPx));
      return out;
    }
    const row = previewRow(
      pieces,
      w - 2 * PREVIEW_PAD_X,
      PREVIEW_CELL_MAX,
      PREVIEW_GAP,
      PREVIEW_MAX_SHOWN,
      PREVIEW_BAND_H,
    );
    const bakedCell = TOKENS.layout.grid.cellPx * preview.k;
    row.items.forEach((it, i) => {
      const p = pieces[i];
      if (!p) return;
      const flagged = blockFrameName(p.shape, p.color, bakedFlagsOf(p.flags));
      const plain = blockFrameName(p.shape, p.color);
      const name = preview.frames.has(flagged) ? flagged : preview.frames.has(plain) ? plain : null;
      if (!name) return;
      const ref = preview.frames.ref(name);
      out.push(
        scene.add
          .image(it.cx, PREVIEW_ROW_CY, ref.key, ref.frame)
          .setOrigin(0.5, 0.5)
          .setScale(row.cell / bakedCell),
      );
    });
    out.push(addKitText(scene, 0, PREVIEW_TEXT_Y, text, 'cardText', TOKENS.kit.v3.text.cardText.fontPx - 4));
    return out;
  }
}
