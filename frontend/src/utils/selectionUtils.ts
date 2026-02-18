/**
 * Get character offsets of the current selection relative to a container element.
 * Returns null if selection is outside the container or collapsed.
 */
export function getSelectionOffsets(container: HTMLElement): { start: number; end: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return null;
  if (!container.contains(range.commonAncestorContainer)) return null;

  const pre = document.createRange();
  pre.selectNodeContents(container);
  pre.setEnd(range.startContainer, range.startOffset);
  const start = pre.toString().length;
  const end = start + range.toString().length;
  return { start, end };
}

/**
 * Merge overlapping or adjacent ranges, then sort by start.
 */
function mergeRanges(ranges: Array<{ start: number; end: number }>): Array<{ start: number; end: number }> {
  if (ranges.length <= 1) return [...ranges].sort((a, b) => a.start - b.start);
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const out: Array<{ start: number; end: number }> = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const r = sorted[i];
    const last = out[out.length - 1];
    if (r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
    } else {
      out.push(r);
    }
  }
  return out;
}

/**
 * Given plain text and ranges (may overlap), return an array of segments
 * { text, highlight: boolean } for rendering.
 */
export function segmentTextWithRanges(
  text: string,
  ranges: Array<{ start: number; end: number }>
): Array<{ text: string; highlight: boolean }> {
  if (!ranges.length) return [{ text, highlight: false }];
  const merged = mergeRanges(ranges);
  const segments: Array<{ text: string; highlight: boolean }> = [];
  let last = 0;
  for (const r of merged) {
    const start = Math.max(last, Math.min(r.start, text.length));
    const end = Math.min(r.end, text.length);
    if (start > last) {
      segments.push({ text: text.slice(last, start), highlight: false });
    }
    if (end > start) {
      segments.push({ text: text.slice(start, end), highlight: true });
    }
    last = Math.max(last, end);
  }
  if (last < text.length) {
    segments.push({ text: text.slice(last), highlight: false });
  }
  return segments;
}
