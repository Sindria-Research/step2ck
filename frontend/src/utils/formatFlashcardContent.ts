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

const ALLOWED_TAGS = [
  'b', 'i', 'u', 'strong', 'em', 'br', 'p', 'div', 'span',
  'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'sub', 'sup', 'blockquote',
];

/**
 * Format flashcard text: uncloze Anki syntax, then sanitize and return HTML
 * safe to render with dangerouslySetInnerHTML.
 */
export function formatFlashcardContent(raw: string): string {
  if (raw == null || raw === '') return '';
  const unclozed = uncloze(raw);
  return DOMPurify.sanitize(unclozed, { ALLOWED_TAGS });
}
