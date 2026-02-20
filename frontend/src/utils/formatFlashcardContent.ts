import DOMPurify from 'dompurify';

/**
 * Anki cloze: {{c1::content}} or {{c1::content::hint}}.
 * We replace with the visible content only (optionally could show hint in parens).
 */
function uncloze(text: string): string {
  return text.replace(/\{\{c\d+::([\s\S]*?)\}\}/g, (_, inner) => {
    const lastDbl = inner.lastIndexOf('::');
    const content = lastDbl >= 0 ? inner.slice(0, lastDbl) : inner;
    return content;
  });
}

/**
 * Convert basic markdown to HTML: **bold**, *italic*, `code`, and newlines.
 */
function markdownToHtml(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

const ALLOWED_TAGS = [
  'b', 'i', 'u', 'strong', 'em', 'br', 'p', 'div', 'span', 'code',
  'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'sub', 'sup', 'blockquote',
];

/**
 * Format flashcard text: uncloze Anki syntax, convert markdown, then sanitize
 * and return HTML safe to render with dangerouslySetInnerHTML.
 */
export function formatFlashcardContent(raw: string): string {
  if (raw == null || raw === '') return '';
  let text = uncloze(raw);
  // Only run markdown conversion if the text doesn't already contain HTML tags
  if (!/<[a-z][\s\S]*>/i.test(text)) {
    text = markdownToHtml(text);
  }
  return DOMPurify.sanitize(text, { ALLOWED_TAGS });
}
