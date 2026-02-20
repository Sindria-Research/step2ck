import { useEffect, useRef, useState } from 'react';
import { Flag } from 'lucide-react';
import type { Question } from '../../api/types';

type FilterMode = 'all' | 'unanswered' | 'flagged';

interface ExamContextSidebar {
  questions: Question[];
  currentQuestion: Question | null;
  goToQuestion: (index: number) => void;
  answeredQuestions: Map<string, { selected: string; correct: boolean }>;
  flaggedQuestions: Set<string>;
  toggleFlag: (questionId: string) => void;
  getProgress: (sectionQuestions: Question[]) => { completed: number; total: number };
}

export function Sidebar({ examContext }: { examContext: ExamContextSidebar }) {
  const { questions, currentQuestion, goToQuestion, answeredQuestions, flaggedQuestions, toggleFlag } = examContext;
  const [filter, setFilter] = useState<FilterMode>('all');
  const activeRef = useRef<HTMLButtonElement>(null);

  const totalProgress = examContext.getProgress(questions);
  const unansweredCount = questions.length - answeredQuestions.size;
  const flaggedCount = flaggedQuestions.size;

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentQuestion?.id]);

  const filtered = questions
    .map((q, i) => ({ question: q, examIndex: i }))
    .filter(({ question: q }) => {
      if (filter === 'unanswered') return !answeredQuestions.has(q.id);
      if (filter === 'flagged') return flaggedQuestions.has(q.id);
      return true;
    });

  const filters: { mode: FilterMode; label: string; count?: number }[] = [
    { mode: 'all', label: 'All' },
    { mode: 'unanswered', label: 'Unanswered', count: unansweredCount },
    { mode: 'flagged', label: 'Flagged', count: flaggedCount },
  ];

  return (
    <aside className="w-56 shrink-0 border-r border-[var(--color-border)] h-full flex flex-col bg-[var(--color-bg-primary)]">
      {/* Progress header */}
      <div className="shrink-0 px-3 pt-3 pb-2.5 border-b border-[var(--color-border)]">
        <div className="h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
            style={{ width: `${totalProgress.total > 0 ? (totalProgress.completed / totalProgress.total) * 100 : 0}%` }}
          />
        </div>
        <div className="mt-1.5">
          <span className="text-[11px] tabular-nums text-[var(--color-text-muted)]">
            <span className="font-semibold text-[var(--color-text-secondary)]">{totalProgress.completed}</span>/{totalProgress.total} answered
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="shrink-0 flex border-b border-[var(--color-border)]">
        {filters.map((f) => (
          <button
            key={f.mode}
            type="button"
            onClick={() => setFilter(f.mode)}
            className={`flex-1 py-1.5 text-[11px] font-medium text-center transition-colors ${
              filter === f.mode
                ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            {f.label}
            {f.count !== undefined && f.count > 0 && (
              <span className="ml-0.5 tabular-nums opacity-70">{f.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Vertical question list */}
      <nav className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-8 px-3">
            <p className="text-xs text-[var(--color-text-muted)]">
              {filter === 'flagged' ? 'No flagged questions.' : 'All answered.'}
            </p>
          </div>
        ) : (
          filtered.map(({ question: q, examIndex }) => {
            const answerData = answeredQuestions.get(q.id);
            const isCurrent = currentQuestion?.id === q.id;
            const isFlagged = flaggedQuestions.has(q.id);
            const isAnswered = !!answerData;

            let statusDot = 'bg-[var(--color-border)]';
            if (isAnswered && answerData.correct) statusDot = 'bg-[var(--color-success)]';
            else if (isAnswered) statusDot = 'bg-[var(--color-error)]';

            return (
              <button
                key={q.id}
                ref={isCurrent ? activeRef : undefined}
                type="button"
                onClick={() => goToQuestion(examIndex)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors duration-75 border-l-2 ${
                  isCurrent
                    ? 'bg-[var(--color-accent)]/8 border-l-[var(--color-accent)] text-[var(--color-text-primary)]'
                    : 'border-l-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                {/* Status dot */}
                <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot}`} />

                {/* Number */}
                <span className={`w-5 text-xs font-semibold tabular-nums ${isCurrent ? 'text-[var(--color-accent)]' : ''}`}>
                  {examIndex + 1}
                </span>

                {/* Section label */}
                <span className="flex-1 text-xs truncate text-[var(--color-text-muted)]">
                  {q.section || 'General'}
                </span>

                {/* Flag button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFlag(q.id);
                  }}
                  className={`p-0.5 rounded transition-colors shrink-0 ${
                    isFlagged
                      ? 'text-[var(--color-warning)]'
                      : 'text-transparent hover:text-[var(--color-text-muted)]'
                  }`}
                  aria-label={isFlagged ? 'Unflag question' : 'Flag question'}
                >
                  <Flag className={`w-3 h-3 ${isFlagged ? 'fill-[var(--color-warning)]' : ''}`} />
                </button>
              </button>
            );
          })
        )}
      </nav>
    </aside>
  );
}
