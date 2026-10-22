/**
 * Pure (tests/ui): the loading-screen logo's line split.
 *
 * The title's two lines (ART_REFERENCE §9.1 v1.1 "harf bloğu 2 satır"): the word split that balances the line
 * lengths best (ties: the longer line first), one line for a single word. "Lift & Land" → "Lift &" / "Land".
 */
export function logoLines(title: string): string[] {
  const words = title
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (words.length <= 1) return words.length === 0 ? [''] : [words[0] as string];
  let best: [string, string] | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let k = 1; k < words.length; k++) {
    const a = words.slice(0, k).join(' ');
    const b = words.slice(k).join(' ');
    const diff = Math.abs(a.length - b.length);
    if (diff < bestDiff || (diff === bestDiff && a.length > b.length)) {
      best = [a, b];
      bestDiff = diff;
    }
  }
  return best ?? [title];
}
