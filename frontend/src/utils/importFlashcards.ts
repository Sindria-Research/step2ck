/**
 * Parse flashcard text in common formats (Quizlet, CSV, tab-delimited).
 * One card per line; front and back separated by tab, semicolon, or comma.
 * Compatible with Quizlet export (tab or comma) and simple CSV.
 */
export interface ParsedCard {
  front: string;
  back: string;
}

export function parseFlashcardText(text: string): ParsedCard[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const result: ParsedCard[] = [];

  for (const line of lines) {
    let front = '';
    let back = '';

    if (line.includes('\t')) {
      const idx = line.indexOf('\t');
      front = line.slice(0, idx).trim();
      back = line.slice(idx + 1).trim();
    } else if (line.includes(';')) {
      const idx = line.indexOf(';');
      front = line.slice(0, idx).trim();
      back = line.slice(idx + 1).trim();
    } else if (line.includes(',')) {
      const idx = line.indexOf(',');
      front = line.slice(0, idx).trim();
      back = line.slice(idx + 1).trim();
    }

    if (front || back) result.push({ front: front || '(empty)', back: back || '(empty)' });
  }

  return result;
}

/** Export cards as tab-delimited text (Quizlet/Anki-compatible). */
export function exportCardsAsText(cards: { front: string; back: string }[]): string {
  return cards.map((c) => `${c.front}\t${c.back}`).join('\n');
}
