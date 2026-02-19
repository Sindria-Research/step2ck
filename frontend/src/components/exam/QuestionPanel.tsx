import { useRef, useState, useCallback, useEffect } from 'react';
import { Highlighter, Wand2, Bookmark, Sparkles } from 'lucide-react';
// Wand2 used in selection toolbar, Sparkles in selection explain popup
import Markdown from 'react-markdown';
import { useExam } from '../../context/ExamContext';
import { useToast } from '../../context/ToastContext';
import { getSelectionOffsets, segmentTextWithRanges } from '../../utils/selectionUtils';
import { api } from '../../api/api';

export function QuestionPanel() {
  const {
    currentQuestion,
    addHighlight,
    getHighlights,
    examType,
    examFinished,
  } = useExam();
  const isTestMode = examType === 'test' && !examFinished;
  const stemRef = useRef<HTMLDivElement>(null);
  const [selectionToolbar, setSelectionToolbar] = useState<{
    start: number;
    end: number;
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [explainSelectionActive, setExplainSelectionActive] = useState(false);
  const [selectionExplainLoading, setSelectionExplainLoading] = useState(false);
  const [selectionExplainError, setSelectionExplainError] = useState<string | null>(null);
  const [selectionExplainText, setSelectionExplainText] = useState('');
  const { addToast } = useToast();
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    if (!currentQuestion?.id) {
      setBookmarked(false);
      return;
    }
    let cancelled = false;
    api.bookmarks.check(currentQuestion.id).then((r) => {
      if (!cancelled) setBookmarked(r.bookmarked);
    }).catch(() => {
      if (!cancelled) setBookmarked(false);
    });
    return () => { cancelled = true; };
  }, [currentQuestion?.id]);

  const handleBookmarkToggle = useCallback(async () => {
    if (!currentQuestion || bookmarkLoading) return;
    setBookmarkLoading(true);
    try {
      if (bookmarked) {
        await api.bookmarks.delete(currentQuestion.id);
        setBookmarked(false);
      } else {
        await api.bookmarks.create(currentQuestion.id);
        setBookmarked(true);
      }
      window.dispatchEvent(new CustomEvent('bookmarks-changed'));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update bookmark';
      addToast(message, 'error');
    } finally {
      setBookmarkLoading(false);
    }
  }, [currentQuestion, bookmarked, bookmarkLoading]);

  const handleMouseUp = useCallback(() => {
    if (!currentQuestion || !stemRef.current) return;
    const offsets = getSelectionOffsets(stemRef.current);
    if (!offsets) {
      setSelectionToolbar(null);
      return;
    }
    const text = currentQuestion.question_stem.slice(offsets.start, offsets.end).trim();
    if (!text) {
      setSelectionToolbar(null);
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      setSelectionToolbar(null);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    setSelectionToolbar({
      ...offsets,
      text,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  }, [currentQuestion]);

  const handleHighlight = useCallback(() => {
    if (!currentQuestion || !selectionToolbar) return;
    addHighlight(currentQuestion.id, { start: selectionToolbar.start, end: selectionToolbar.end });
    window.getSelection()?.removeAllRanges();
    setSelectionToolbar(null);
  }, [currentQuestion, selectionToolbar, addHighlight]);

  const handleExplainSelection = useCallback(() => {
    if (!selectionToolbar || !currentQuestion) return;
    setExplainSelectionActive(true);
    setSelectionExplainLoading(true);
    setSelectionExplainError(null);
    setSelectionExplainText('');
    window.getSelection()?.removeAllRanges();
    const selectionText = selectionToolbar.text;
    setSelectionToolbar(null);
    void api.ai
      .explain({
        question_id: currentQuestion.id,
        selection_text: selectionText,
      })
      .then((res) => {
        setSelectionExplainText(res.explanation);
      })
      .catch((e) => {
        setSelectionExplainError(e instanceof Error ? e.message : 'Chiron couldn\u2019t explain this one');
      })
      .finally(() => {
        setSelectionExplainLoading(false);
      });
  }, [selectionToolbar, currentQuestion]);

  useEffect(() => {
    setExplainSelectionActive(false);
    setSelectionExplainLoading(false);
    setSelectionExplainError(null);
    setSelectionExplainText('');
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (!selectionToolbar) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const toolbar = document.querySelector('[data-selection-toolbar]');
      if (toolbar?.contains(target) || stemRef.current?.contains(target)) return;
      setSelectionToolbar(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [selectionToolbar]);

  if (!currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-text-tertiary)]">
        No question selected
      </div>
    );
  }

  const highlights = getHighlights(currentQuestion.id);
  const segments = segmentTextWithRanges(currentQuestion.question_stem, highlights);

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-bg-primary)] relative">
      <div className="p-4 md:p-8 max-w-2xl">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="badge badge-primary">{currentQuestion.section}</span>
          {currentQuestion.subsection && (
            <span className="badge">{currentQuestion.subsection}</span>
          )}
          {currentQuestion.system && currentQuestion.system !== 'Unknown' && (
            <span className="badge badge-success">{currentQuestion.system}</span>
          )}
          <button
            type="button"
            onClick={handleBookmarkToggle}
            disabled={bookmarkLoading}
            className={`ml-auto p-2 rounded-md transition-colors focus-ring shrink-0 ${
              bookmarked
                ? 'text-[var(--color-accent)] bg-[var(--color-bg-active)]'
                : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
            }`}
            title={bookmarked ? 'Remove bookmark' : 'Save to bookmarks'}
            aria-label={bookmarked ? 'Remove bookmark' : 'Save to bookmarks'}
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
        <div
          ref={stemRef}
          className="text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap select-text"
          onMouseUp={handleMouseUp}
        >
          {segments.map((seg, i) =>
            seg.highlight ? (
              <mark key={i} className="question-highlight">
                {seg.text}
              </mark>
            ) : (
              <span key={i}>{seg.text}</span>
            )
          )}
        </div>
        <p className="mt-6 text-xs text-[var(--color-text-tertiary)]">
          {isTestMode
            ? 'Select text to highlight. Right\u2011click an answer to strikethrough.'
            : 'Select text to highlight or explain. Right\u2011click an answer to strikethrough.'}
        </p>
      </div>

      {/* Selection toolbar */}
      {selectionToolbar && (
        <div
          data-selection-toolbar
          className="fixed z-40 flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-1.5 shadow-lg"
          style={{
            left: selectionToolbar.x,
            top: selectionToolbar.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {!isTestMode && (
            <button
              type="button"
              onClick={handleExplainSelection}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring"
              title="Ask Chiron about selection"
            >
              <Wand2 className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              Ask Chiron
            </button>
          )}
          <button
            type="button"
            onClick={handleHighlight}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring"
            title="Highlight"
          >
            <Highlighter className="w-3.5 h-3.5" />
            Highlight
          </button>
        </div>
      )}

      {/* Explain selection response */}
      {!isTestMode && explainSelectionActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-30 rounded-lg">
          <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-xl max-w-[calc(100vw-2rem)] md:max-w-lg w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">Chiron</span>
              </div>
              <button
                type="button"
                onClick={() => setExplainSelectionActive(false)}
                className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
              >
                Dismiss
              </button>
            </div>
            <div className="px-5 py-4 max-h-[50vh] overflow-y-auto">
              {selectionExplainLoading ? (
                <div className="flex items-center gap-3 py-4">
                  <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-[var(--color-text-secondary)] thinking-text">
                    Chiron is thinking…
                  </span>
                </div>
              ) : selectionExplainError ? (
                <p className="text-sm text-[var(--color-error)]">
                  {selectionExplainError}
                </p>
              ) : (
                <div className="ai-explanation-content text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  <Markdown>{selectionExplainText}</Markdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
