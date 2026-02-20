import { describe, it, expect } from 'vitest';
import { formatFlashcardContent } from '../utils/formatFlashcardContent';

describe('formatFlashcardContent', () => {
  it('returns empty string for null/empty input', () => {
    expect(formatFlashcardContent('')).toBe('');
    expect(formatFlashcardContent(null as unknown as string)).toBe('');
  });

  it('renders plain text as-is', () => {
    const result = formatFlashcardContent('Hello world');
    expect(result).toBe('Hello world');
  });

  it('converts **bold** to <strong>', () => {
    const result = formatFlashcardContent('This is **bold** text');
    expect(result).toContain('<strong>bold</strong>');
  });

  it('converts *italic* to <em>', () => {
    const result = formatFlashcardContent('This is *italic* text');
    expect(result).toContain('<em>italic</em>');
  });

  it('converts `code` to <code>', () => {
    const result = formatFlashcardContent('Use `console.log`');
    expect(result).toContain('<code>console.log</code>');
  });

  it('converts newlines to <br>', () => {
    const result = formatFlashcardContent('Line 1\nLine 2');
    expect(result).toContain('<br>');
  });

  it('handles Anki cloze deletions', () => {
    const result = formatFlashcardContent('The {{c1::heart}} pumps blood');
    expect(result).toContain('heart');
    expect(result).not.toContain('{{');
    expect(result).not.toContain('c1::');
  });

  it('handles Anki cloze with hints', () => {
    const result = formatFlashcardContent('{{c1::mitral valve::cardiac structure}}');
    expect(result).toContain('mitral valve');
    expect(result).not.toContain('cardiac structure');
  });

  it('preserves existing HTML tags', () => {
    const result = formatFlashcardContent('<strong>already bold</strong>');
    expect(result).toContain('<strong>already bold</strong>');
  });

  it('does not double-convert HTML content with markdown', () => {
    const result = formatFlashcardContent('<p>Some **text**</p>');
    expect(result).not.toContain('<strong>');
    expect(result).toContain('**text**');
  });

  it('sanitizes dangerous HTML', () => {
    const result = formatFlashcardContent('<script>alert("xss")</script>Hello');
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });

  it('strips disallowed tags but keeps content', () => {
    const result = formatFlashcardContent('<img src="x" onerror="alert(1)">Safe text');
    expect(result).not.toContain('<img');
    expect(result).toContain('Safe text');
  });

  it('handles medical content with arrows and symbols', () => {
    const result = formatFlashcardContent(
      '**21-hydroxylase** deficiency → ↑ 17-OH progesterone, ↓ cortisol'
    );
    expect(result).toContain('<strong>21-hydroxylase</strong>');
    expect(result).toContain('→');
    expect(result).toContain('↑');
  });
});
