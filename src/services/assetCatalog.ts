/**
 * The v2 art catalogue (ASSET_LIST §16.1–§16.3; TECH_DESIGN §2R.6): every SVG design-lead writes under
 * `public/art/<category>/<id>.svg`, its viewBox, raster size, size limit, load group and procedural fallback, plus the
 * manifest format that `npm run assets` (tools/assets.ts) writes to `public/assets/v2/manifest.json` and the game
 * reads (services/assets.ts). Pure data + pure checks (no Phaser, no DOM, no Node API), shared by the tool, the game
 * and tests/assets.
 */
import * as z from 'zod/mini';

export type AssetCategory = 'bg' | 'town' | 'chr' | 'icon' | 'logo';
/** TECH §2R.6 load groups: P1 after level 1 is interactive, P2 after P1, P3 last. (P0 = font + intro, not art.) */
export type AssetGroup = 'P1' | 'P2' | 'P3';
export const ASSET_GROUPS: readonly AssetGroup[] = ['P1', 'P2', 'P3'];

export interface Size {
  readonly w: number;
  readonly h: number;
}

export interface AssetDef {
  readonly id: string;
  readonly category: AssetCategory;
  /** Root viewBox `0 0 w h` and `width` / `height` (ASSET §16.2). */
  readonly viewBox: Size;
  /** Texture size the game loads (ASSET §16.3 "Raster"); icons are packed into `icons_v2`. */
  readonly raster: Size;
  /** Max SVG bytes before gzip (ASSET §16.2). */
  readonly maxBytes: number;
  readonly group: AssetGroup;
  /** ASSET §16.3 "Faz": needed by the 2R slice, or Phase 3. */
  readonly phase: '2R' | '3';
  /** The structure also gets its blueprint ghost (`<id>_ghost`, ART §7.2). */
  readonly ghost?: boolean;
  /** Character signature colours that must appear verbatim (`color.character.<who>.<key>`, ASSET §16.3). */
  readonly signature?: { readonly who: string; readonly keys: readonly string[] };
  /** Not in ASSET §16.3 yet (code-lead request): an SVG is optional, the fallback is the plan. */
  readonly optional?: boolean;
  /** Packed into the `icons_v2` atlas (128 px icons) instead of its own image. */
  readonly inAtlas?: boolean;
}

/** ASSET §16.2 size limits (bytes, before gzip). */
export const MAX_BYTES: Readonly<Record<AssetCategory, number>> = Object.freeze({
  bg: 60 * 1024,
  town: 40 * 1024,
  chr: 20 * 1024,
  logo: 15 * 1024,
  icon: 6 * 1024,
});

const def = (
  id: string,
  category: AssetCategory,
  viewBox: Size,
  raster: Size,
  group: AssetGroup,
  extra: Partial<Pick<AssetDef, 'ghost' | 'signature' | 'optional' | 'phase' | 'inAtlas'>> = {},
): AssetDef => ({
  id,
  category,
  viewBox,
  raster,
  maxBytes: MAX_BYTES[category],
  group,
  phase: extra.phase ?? '2R',
  ...(extra.ghost ? { ghost: true } : {}),
  ...(extra.signature ? { signature: extra.signature } : {}),
  ...(extra.optional ? { optional: true } : {}),
  ...(extra.inAtlas ? { inAtlas: true } : {}),
});

/** ASSET §16.3 icons (16 + `icon_piggy`, `icon_kettlebell`, `icon_nextfloor`) + 2 nav icons UX §3 needs. */
export const ICON_IDS = [
  'icon_coin',
  'icon_life',
  'icon_star',
  'icon_moves',
  'icon_settings',
  'icon_lock',
  'icon_hammer',
  'icon_crane',
  'icon_brush',
  'icon_undo',
  'icon_thermos',
  'icon_gold_trowel',
  'icon_chest',
  'icon_nav_shop',
  'icon_nav_league',
  'icon_nav_team',
  'icon_piggy',
  'icon_kettlebell',
  'icon_nextfloor',
  'icon_nav_home',
  'icon_nav_album',
] as const;

const ICON_PHASE3 = new Set(['icon_brush', 'icon_undo', 'icon_thermos']);
const ICON_OPTIONAL = new Set(['icon_nav_home', 'icon_nav_album']);
export const ICON_SIZE = 128;

/** The catalogue, ASSET §16.3 order. */
export const ASSET_CATALOG: readonly AssetDef[] = Object.freeze([
  def('bg_home_town', 'bg', { w: 1080, h: 1920 }, { w: 540, h: 960 }, 'P2'),
  def('bg_level_site_edge', 'bg', { w: 120, h: 1920 }, { w: 60, h: 960 }, 'P1'),
  def('bg_win_plaza', 'bg', { w: 1080, h: 1920 }, { w: 540, h: 960 }, 'P3'),
  def('town_ch1_treehouse', 'town', { w: 760, h: 820 }, { w: 760, h: 820 }, 'P2', { ghost: true }),
  def('chr_tuna_bust', 'chr', { w: 256, h: 320 }, { w: 300, h: 375 }, 'P1', {
    signature: { who: 'tuna', keys: ['helmet', 'vest', 'gloves'] },
  }),
  def('chr_tuna_cheer', 'chr', { w: 300, h: 400 }, { w: 300, h: 400 }, 'P3', {
    signature: { who: 'tuna', keys: ['helmet', 'vest', 'gloves'] },
  }),
  def('chr_dede_bust', 'chr', { w: 256, h: 320 }, { w: 256, h: 320 }, 'P1', {
    signature: { who: 'dede', keys: ['cap', 'jacket'] },
  }),
  def('chr_kepce_bust', 'chr', { w: 320, h: 220 }, { w: 300, h: 206 }, 'P2', {
    signature: { who: 'kepce', keys: ['helmet', 'collar'] },
  }),
  def('chr_gribeton_bust', 'chr', { w: 256, h: 320 }, { w: 256, h: 320 }, 'P3', {
    signature: { who: 'gribeton', keys: ['suit', 'hair'] },
  }),
  def('logo_emblem', 'logo', { w: 360, h: 360 }, { w: 360, h: 360 }, 'P2'),
  // ASSET §16.5: the tutorial glove may be a small SVG (`public/art/icon/ui_tutorial_glove.svg`), its own image
  def('ui_tutorial_glove', 'icon', { w: 140, h: 160 }, { w: 140, h: 160 }, 'P1'),
  ...ICON_IDS.map((id) =>
    def(id, 'icon', { w: ICON_SIZE, h: ICON_SIZE }, { w: ICON_SIZE, h: ICON_SIZE }, 'P1', {
      phase: ICON_PHASE3.has(id) ? '3' : '2R',
      optional: ICON_OPTIONAL.has(id),
      inAtlas: true,
    }),
  ),
]);

export const ASSET_BY_ID: ReadonlyMap<string, AssetDef> = new Map(ASSET_CATALOG.map((a) => [a.id, a]));

/** The packed icon atlas (TECH §2R.6 step 3): 4 columns of 128 px slots, rows as needed (19 → 512 × 640). */
export const ICON_ATLAS_KEY = 'icons_v2';
export const ICON_ATLAS_COLS = 4;

/** Slot of icon i in the atlas (catalogue order of the icons that passed, so the layout is stable). */
export function iconSlot(i: number): { x: number; y: number } {
  return { x: (i % ICON_ATLAS_COLS) * ICON_SIZE, y: Math.floor(i / ICON_ATLAS_COLS) * ICON_SIZE };
}

export function iconAtlasSize(count: number): Size {
  return { w: ICON_ATLAS_COLS * ICON_SIZE, h: Math.max(1, Math.ceil(count / ICON_ATLAS_COLS)) * ICON_SIZE };
}

/** Public path of an SVG source, relative to the repo root. */
export const svgPath = (a: AssetDef): string => `public/art/${a.category}/${a.id}.svg`;

/** Output folder (repo) and URL folder (game, relative to the page). */
export const OUT_DIR = 'public/assets/v2';
export const OUT_URL = 'assets/v2';
export const MANIFEST_FILE = 'manifest.json';

/** TECH §2R.6 / §2R.13 budgets. */
export const BUDGET = Object.freeze({
  /** v2 art download (all raster outputs + atlas JSON + manifest). */
  downloadBytes: 900 * 1024,
  /** Texture memory estimate of every raster output (RGBA, all loaded at once). */
  textureBytes: 64 * 1024 * 1024,
});

// ---------------------------------------------------------------------------------------------------------------
// Manifest (`{ version, assets: { [key]: { file, w, h, bytes, srcSha1, group, status } } }`, TECH §2R.6 step 4)

export const MANIFEST_VERSION = 1;

const Entry = z.object({
  /** Output file in `public/assets/v2` (absent when rejected or packed into the icon atlas). */
  file: z.optional(z.string()),
  /** Packed into this atlas key (icons). */
  atlas: z.optional(z.string()),
  w: z.number(),
  h: z.number(),
  bytes: z.number(),
  /** sha1 of the source SVG (staleness gate). */
  srcSha1: z.optional(z.string()),
  group: z.enum(['P1', 'P2', 'P3']),
  status: z.enum(['ok', 'rejected']),
  /** Why the SVG was rejected (static checks, ASSET §16.2). */
  errors: z.optional(z.array(z.string())),
});

const AtlasEntry = z.object({
  file: z.string(),
  json: z.string(),
  w: z.number(),
  h: z.number(),
  bytes: z.number(),
  jsonBytes: z.number(),
  group: z.enum(['P1', 'P2', 'P3']),
  frames: z.array(z.string()),
});

export const ManifestSchema = z.object({
  version: z.number(),
  generator: z.string(),
  assets: z.record(z.string(), Entry),
  atlases: z.record(z.string(), AtlasEntry),
  /** SVGs under public/art that match no catalogue id (rejected). */
  unknown: z.array(z.object({ path: z.string(), srcSha1: z.string() })),
});

export type Manifest = z.output<typeof ManifestSchema>;
export type ManifestEntry = z.output<typeof Entry>;
export type ManifestAtlas = z.output<typeof AtlasEntry>;

export function parseManifest(raw: unknown): Manifest {
  const r = ManifestSchema.safeParse(raw);
  if (!r.success) throw new Error(`assets manifest is invalid:\n${z.prettifyError(r.error)}`);
  return r.data;
}

export const emptyManifest = (): Manifest => ({
  version: MANIFEST_VERSION,
  generator: 'tools/assets.ts',
  assets: {},
  atlases: {},
  unknown: [],
});

/** Texture bytes of a raster (RGBA). */
export const textureBytes = (s: Size): number => s.w * s.h * 4;

// ---------------------------------------------------------------------------------------------------------------
// Static SVG checks (ASSET §16.2 common acceptance criteria 1–2; TECH §2R.6 step 1, the Chromium-free part)

/** Forbidden elements (by local name, case-insensitive). */
export const FORBIDDEN_ELEMENTS = [
  'text',
  'image',
  'foreignObject',
  'script',
  'filter',
  'mask',
  'iframe',
  'video',
  'audio',
];

/** sRGB `#RRGGBB` (or `#RGB`) → [r, g, b]. */
function hexToRgb(hex: string): [number, number, number] | null {
  let h = hex.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, (c) => c + c);
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const NAMED: Readonly<Record<string, string>> = { white: '#FFFFFF', black: '#000000' };

/** Every hex colour in a tokens tree (any depth; `check.*` included: they are the same derived tones). */
export function tokenColors(tokens: unknown): string[] {
  const out = new Set<string>();
  const walk = (v: unknown): void => {
    if (typeof v === 'string') {
      if (/^#[0-9a-f]{6}$/i.test(v)) out.add(v.toUpperCase());
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(tokens);
  return [...out];
}

/**
 * ASSET §16.2 palette: token colours ∪ the volume tones of each (c·0.68 + white·0.32, c × 0.92, c × 0.68), as RGB
 * triples. A drawn colour passes when every channel is within `tolerance` (±2) of one of them.
 */
export function paletteOf(tokens: unknown): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (const hex of tokenColors(tokens)) {
    const c = hexToRgb(hex);
    if (!c) continue;
    out.push(c);
    out.push([c[0] * 0.68 + 255 * 0.32, c[1] * 0.68 + 255 * 0.32, c[2] * 0.68 + 255 * 0.32]);
    out.push([c[0] * 0.92, c[1] * 0.92, c[2] * 0.92]);
    out.push([c[0] * 0.68, c[1] * 0.68, c[2] * 0.68]);
  }
  return out;
}

export function inPalette(hex: string, palette: readonly [number, number, number][], tolerance = 2): boolean {
  const c = hexToRgb(NAMED[hex.toLowerCase()] ?? hex);
  if (!c) return false;
  return palette.some(
    (p) =>
      Math.abs(p[0] - c[0]) <= tolerance &&
      Math.abs(p[1] - c[1]) <= tolerance &&
      Math.abs(p[2] - c[2]) <= tolerance,
  );
}

/** Colour values used for painting: `fill`, `stroke`, `stop-color` attributes and the same CSS properties. */
export function paintColors(svg: string): string[] {
  const out: string[] = [];
  const re =
    /(?:\b(?:fill|stroke|stop-color|flood-color|lighting-color|color)\s*[=:]\s*["']?)\s*(#[0-9a-fA-F]{3,6}\b|[a-zA-Z]+)/g;
  for (const m of svg.matchAll(re)) {
    const v = (m[1] ?? '').trim();
    if (/^(none|transparent|currentColor|inherit|url)$/i.test(v)) continue;
    out.push(v);
  }
  return out;
}

export interface SvgCheckContext {
  readonly palette: readonly [number, number, number][];
  /** `color.character` of the tokens (signature colours). */
  readonly characterColors: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

/**
 * The static checks of one SVG source (text, no DOM): forbidden elements and attributes, external `href`, `@import`,
 * event handlers; root `viewBox` = the catalogue's and `width` / `height` = the viewBox; byte limit; path coordinates
 * with at most 1 decimal; palette; character signature colours. Returns the list of problems (empty = ok).
 */
export function checkSvg(def: AssetDef, svg: string, bytes: number, ctx: SvgCheckContext): string[] {
  const errors: string[] = [];
  if (bytes > def.maxBytes) errors.push(`size ${bytes} B > ${def.maxBytes} B (ASSET §16.2)`);
  for (const el of FORBIDDEN_ELEMENTS) {
    if (new RegExp(`<\\s*(?:[a-zA-Z]+:)?${el}[\\s/>]`, 'i').test(svg))
      errors.push(`forbidden element <${el}>`);
  }
  if (/\s(?:filter|mask)\s*=/i.test(svg)) errors.push('forbidden filter / mask attribute');
  if (/@import/i.test(svg)) errors.push('forbidden @import');
  if (/\son[a-z]+\s*=/i.test(svg)) errors.push('forbidden event handler attribute');
  if (/javascript:/i.test(svg)) errors.push('forbidden javascript: URL');
  for (const m of svg.matchAll(/\b(?:xlink:)?href\s*=\s*["']([^"']*)["']/g)) {
    if (!(m[1] ?? '').startsWith('#')) errors.push(`external href "${m[1]}"`);
  }
  for (const m of svg.matchAll(/url\(\s*["']?([^)"']*)/g)) {
    if (!(m[1] ?? '').startsWith('#')) errors.push(`external url(${m[1]})`);
  }
  const root = /<svg\b[^>]*>/i.exec(svg)?.[0];
  if (!root) errors.push('no <svg> root');
  else {
    const attr = (n: string): string | null =>
      new RegExp(`\\s${n}\\s*=\\s*["']([^"']*)["']`).exec(root)?.[1] ?? null;
    const vb = attr('viewBox')
      ?.trim()
      .split(/[\s,]+/)
      .map(Number);
    const want = `0 0 ${def.viewBox.w} ${def.viewBox.h}`;
    if (
      !vb ||
      vb.length !== 4 ||
      vb[0] !== 0 ||
      vb[1] !== 0 ||
      vb[2] !== def.viewBox.w ||
      vb[3] !== def.viewBox.h
    ) {
      errors.push(`root viewBox must be "${want}"`);
    }
    if (Number(attr('width')) !== def.viewBox.w || Number(attr('height')) !== def.viewBox.h) {
      errors.push(`root width/height must be ${def.viewBox.w} × ${def.viewBox.h}`);
    }
  }
  for (const m of svg.matchAll(/\sd\s*=\s*["']([^"']*)["']/g)) {
    const bad = /\d\.\d{2,}/.exec(m[1] ?? '');
    if (bad) {
      errors.push(`path coordinate with more than 1 decimal (${bad[0]}…)`);
      break;
    }
  }
  const off = [...new Set(paintColors(svg).filter((c) => !inPalette(c, ctx.palette)))];
  if (off.length > 0) errors.push(`colours outside the token palette: ${off.slice(0, 8).join(', ')}`);
  if (def.signature) {
    const pal = ctx.characterColors[def.signature.who] ?? {};
    const upper = svg.toUpperCase();
    const missing = def.signature.keys.filter((k) => {
      const hex = pal[k];
      return !hex || !upper.includes(hex.toUpperCase());
    });
    if (missing.length > 0) {
      errors.push(`signature colours missing (color.character.${def.signature.who}): ${missing.join(', ')}`);
    }
  }
  return errors;
}

/** Catalogue id of an SVG path `public/art/<category>/<id>.svg` (null when it does not follow the layout). */
export function idOfSvgPath(path: string): { category: string; id: string } | null {
  const m = /(?:^|\/)public\/art\/([^/]+)\/([^/]+)\.svg$/.exec(path.replace(/\\/g, '/'));
  return m ? { category: m[1] ?? '', id: m[2] ?? '' } : null;
}
