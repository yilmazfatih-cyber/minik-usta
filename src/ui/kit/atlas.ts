/**
 * The kit atlas of a game (TECH §2R.7 "Kit": buttons, round × / +, shine band, panels, ribbons, badges, capsule,
 * progress, navigation, bubble, fx frames — theme/textures.ts `bakeKitAtlas`). Baked once per game on first use and
 * re-uploaded after a WebGL context restore (TECH §10.2). Scenes look frames up by name through `kitRef` and stretch
 * the sliced ones with `kitSlices` (Phaser NineSlice; `top = bottom = 0` → 3-slice).
 *
 * Variable buttons: a kit button height outside `KIT_BUTTON_HEIGHTS` is baked on demand into its own small canvas
 * (`kitButtonFrame`), once per name.
 */
import Phaser from 'phaser';
import { TOKENS } from '../../theme/tokens.ts';
import {
  KIT_ATLAS_KEY,
  bakeKitAtlas,
  frameRef,
  kitButtonFrame,
  kitButtonStates,
  kitSlices,
  packFrames,
  uploadAtlas,
} from '../../theme/textures.ts';
import type { FrameRef, UploadedAtlas } from '../../theme/textures.ts';
import { KIT_BUTTON_HEIGHTS, buttonSlices, kitButtonFrameName } from '../../theme/draw/kit.ts';
import type { ButtonState, KitButtonColor, Slices } from '../../theme/draw/kit.ts';

/** Fallback when the renderer reports no limit (Canvas). */
const DEFAULT_MAX_TEXTURE = 4096;

interface KitState {
  atlas: UploadedAtlas;
  extra: Map<string, FrameRef>;
  extraAtlases: UploadedAtlas[];
  hooked: boolean;
}

const states = new WeakMap<Phaser.Game, KitState>();
let slicesCache: ReadonlyMap<string, Slices> | null = null;

function maxTextureSize(game: Phaser.Game): number {
  const r = game.renderer as Phaser.Renderer.WebGL.WebGLRenderer | Phaser.Renderer.Canvas.CanvasRenderer;
  return 'getMaxTextureSize' in r ? r.getMaxTextureSize() : DEFAULT_MAX_TEXTURE;
}

/** Bakes the kit atlas the first time (≈ 30 frames, behind a transition) and returns the game's kit state. */
function kitState(game: Phaser.Game): KitState {
  let st = states.get(game);
  if (st && game.textures.exists(KIT_ATLAS_KEY)) return st;
  const atlas = bakeKitAtlas(game.textures, TOKENS, maxTextureSize(game));
  st = { atlas, extra: new Map(), extraAtlases: [], hooked: st?.hooked ?? false };
  states.set(game, st);
  if (!st.hooked) {
    st.hooked = true;
    const s = st;
    game.renderer.on(Phaser.Renderer.Events.RESTORE_WEBGL, () => {
      s.atlas.refresh();
      for (const a of s.extraAtlases) a.refresh();
    });
  }
  return st;
}

/** Bakes the kit atlas now (a scene's `create`, behind its entry fade). */
export function ensureKitAtlas(game: Phaser.Game): void {
  kitState(game);
}

/** Texture key + frame of a kit frame (atlas or an on-demand button bake). */
export function kitRef(game: Phaser.Game, name: string): FrameRef {
  const st = kitState(game);
  return st.extra.get(name) ?? frameRef(st.atlas.index, name);
}

/** NineSlice insets of a sliced kit frame (null: a fixed-size frame). */
export function kitSlice(name: string): Slices | null {
  slicesCache ??= kitSlices(TOKENS);
  return slicesCache.get(name) ?? null;
}

/** A kit button frame of any height: from the atlas for `KIT_BUTTON_HEIGHTS`, baked once on demand otherwise. */
export function kitButtonRef(
  game: Phaser.Game,
  color: KitButtonColor,
  h: number,
  state: ButtonState,
): { readonly ref: FrameRef; readonly slices: Slices } {
  const st = kitState(game);
  const states0 = kitButtonStates(color);
  const s: ButtonState = states0.includes(state) ? state : 'normal';
  const name = kitButtonFrameName(color, h, s);
  const slices = buttonSlices({ color, w: 0, h }, TOKENS);
  if ((KIT_BUTTON_HEIGHTS as readonly number[]).includes(h)) return { ref: kitRef(game, name), slices };
  let ref = st.extra.get(name);
  if (!ref) {
    const key = `kit_btn_${color}_${h}`;
    const frames = states0.map((x) => kitButtonFrame(color, h, x, TOKENS));
    const atlas = uploadAtlas(
      game.textures,
      key,
      packFrames(frames, { maxWidth: 1024, maxHeight: 1024, gutter: 2 }),
    );
    st.extraAtlases.push(atlas);
    for (const [n, r] of atlas.index) st.extra.set(n, r);
    ref = frameRef(atlas.index, name);
  }
  return { ref, slices };
}
