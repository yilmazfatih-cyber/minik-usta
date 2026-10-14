/**
 * Manual copy box of the feedback export (TECH §2R.16 "Yazma reddedilirse salt okunur, seçili bir metin kutusu açılır";
 * UX §3 / §11 Geri bildirim; STORY `settings.feedbackManual`, `common.continue`). The clipboard refused the text (no
 * HTTPS, no permission), so the player copies it by hand: a DOM layer over the game — `settings.feedbackManual` above,
 * the read-only text box (already selected) in the middle, `common.continue` below in the thumb zone. A DOM layer,
 * because only a real text box gives the system's select / copy menu. Texts are i18n, colours and type are tokens.
 */
import { TOKENS } from '../theme/tokens.ts';

export interface ManualCopyTexts {
  /** `settings.feedbackManual`. */
  readonly hint: string;
  /** `common.continue` (closes the box). */
  readonly close: string;
}

const C = TOKENS.color.ui;

/** `#RRGGBB` + α → CSS `rgba()` (the window dim of UX §0.3: `ui.overlay` at `alpha.overlay`). */
function rgba(hex: string, a: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** Opens the box over `parent` (the game's DOM parent); returns the closer. `onClose` runs once when it closes. */
export function openManualCopy(
  doc: Document,
  parent: HTMLElement,
  text: string,
  texts: ManualCopyTexts,
  onClose: () => void,
): () => void {
  const font = [TOKENS.font.family, ...TOKENS.font.fallback]
    .map((f) => (f.includes(' ') ? `"${f}"` : f))
    .join(', ');
  const layer = doc.createElement('div');
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-label', texts.hint);
  Object.assign(layer.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '10',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    gap: '12px',
    padding: '16px 16px max(24px, env(safe-area-inset-bottom))',
    background: rgba(C.overlay, TOKENS.alpha.overlay),
    fontFamily: font,
  } satisfies Partial<CSSStyleDeclaration>);
  const hint = doc.createElement('p');
  hint.textContent = texts.hint;
  Object.assign(hint.style, {
    margin: '0',
    padding: '12px 16px',
    borderRadius: '16px',
    background: C.panel,
    color: C.ink,
    fontSize: '18px',
    fontWeight: String(TOKENS.font.weight.button),
    textAlign: 'center',
  } satisfies Partial<CSSStyleDeclaration>);
  const box = doc.createElement('textarea');
  box.readOnly = true;
  box.value = text;
  box.setAttribute('aria-label', texts.hint);
  Object.assign(box.style, {
    flex: '1 1 auto',
    minHeight: '120px',
    maxHeight: '55vh',
    padding: '12px',
    borderRadius: '16px',
    border: `4px solid ${C.ink}`,
    background: '#FFFFFF',
    color: C.ink,
    fontSize: '13px',
    fontFamily: 'monospace',
    resize: 'none',
  } satisfies Partial<CSSStyleDeclaration>);
  const button = doc.createElement('button');
  button.type = 'button';
  button.textContent = texts.close;
  Object.assign(button.style, {
    minHeight: '72px',
    borderRadius: '24px',
    border: `4px solid ${C.ink}`,
    background: TOKENS.kit.buttonColor.green.base,
    color: '#FFFFFF',
    fontFamily: font,
    fontSize: '24px',
    fontWeight: String(TOKENS.font.weight.display),
  } satisfies Partial<CSSStyleDeclaration>);
  layer.append(hint, box, button);
  parent.append(layer);
  box.focus();
  box.select();
  let open = true;
  const close = (): void => {
    if (!open) return;
    open = false;
    layer.remove();
    onClose();
  };
  button.addEventListener('click', close);
  return close;
}
