import { useRef, useState, useCallback, useEffect } from 'react';
import { Highlighter, Wand2 } from 'lucide-react';
import { useExam } from '../../context/ExamContext';
import { StreamingText } from '../common/StreamingText';
import { getSelectionOffsets, segmentTextWithRanges } from '../../utils/selectionUtils';

export function QuestionPanel() {
  const {
    currentQuestion,
    addHighlight,
    getHighlights,
  } = useExam();
  const stemRef = useRef<HTMLDivElement>(null);
  const [selectionToolbar, setSelectionToolbar] = useState<{
    start: number;
    end: number;
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [explainSelectionActive, setExplainSelectionActive] = useState(false);

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
    if (!selectionToolbar) return;
    setExplainSelectionActive(true);
    setTimeout(() => setExplainSelectionActive(false), 2500);
    window.getSelection()?.removeAllRanges();
    setSelectionToolbar(null);
  }, [selectionToolbar]);

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
      <div className="p-8 max-w-2xl">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="badge badge-primary">{currentQuestion.section}</span>
          {currentQuestion.subsection && (
            <span className="badge">{currentQuestion.subsection}</span>
          )}
          {currentQuestion.system && currentQuestion.system !== 'Unknown' && (
            <span className="badge badge-success">{currentQuestion.system}</span>
          )}
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
          Select text to highlight or explain. Right‑click an answer to strikethrough.
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
          <button
            type="button"
            onClick={handleExplainSelection}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring"
            title="Explain selection (AI)"
          >
            <Wand2 className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            Explain selection
          </button>
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

      {/* Explain selection placeholder (thinking animation + streaming) */}
      {explainSelectionActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-30 rounded-lg">
          <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-medium thinking-text">
                Explaining selection…
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)] min-h-[1.5rem]">
              <StreamingText text="AI explanation will appear here in a future update." charDelay={25} cursor />
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
