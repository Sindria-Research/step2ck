import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Flag } from 'lucide-react';
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

interface IndexedQuestion {
  question: Question;
  examIndex: number;
}

function groupBySection(questions: IndexedQuestion[]) {
  const sections: { name: string; items: IndexedQuestion[] }[] = [];
  const sectionMap = new Map<string, number>();

  for (const iq of questions) {
    const name = iq.question.section || 'General';
    let idx = sectionMap.get(name);
    if (idx === undefined) {
      idx = sections.length;
      sectionMap.set(name, idx);
      sections.push({ name, items: [] });
    }
    sections[idx].items.push(iq);
  }

  return sections;
}

function SectionGroup({
  name,
  items,
  examContext,
  activeRef,
}: {
  name: string;
  items: IndexedQuestion[];
  examContext: ExamContextSidebar;
  activeRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const { currentQuestion, goToQuestion, answeredQuestions, flaggedQuestions, toggleFlag } = examContext;
  const progress = examContext.getProgress(items.map((i) => i.question));
  const allDone = progress.completed === progress.total;
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 w-full px-1 py-1.5 group"
      >
        {isOpen
          ? <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          : <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
        }
        <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] transition-colors">
          {name}
        </span>
        <span className={`text-[10px] font-semibold tabular-nums ${allDone ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'}`}>
          {progress.completed}/{progress.total}
        </span>
      </button>

      {isOpen && (
        <div className="grid grid-cols-5 gap-1 mt-1 mb-3">
          {items.map(({ question: q, examIndex }) => {
            const answerData = answeredQuestions.get(q.id);
            const isCurrent = currentQuestion?.id === q.id;
            const isFlagged = flaggedQuestions.has(q.id);
            const isAnswered = !!answerData;

            let tileClass: string;
            if (isCurrent) {
              tileClass = 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white shadow-sm';
            } else if (isAnswered && answerData.correct) {
              tileClass = 'bg-[var(--color-success)]/10 border-[var(--color-success)]/40 text-[var(--color-success)]';
            } else if (isAnswered && !answerData.correct) {
              tileClass = 'bg-[var(--color-error)]/10 border-[var(--color-error)]/40 text-[var(--color-error)]';
            } else if (isFlagged) {
              tileClass = 'bg-[var(--color-warning)]/8 border-[var(--color-warning)]/40 text-[var(--color-warning)]';
            } else {
              tileClass = 'bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40';
            }

            return (
              <div key={q.id} className="relative">
                <button
                  ref={isCurrent ? activeRef : undefined}
                  type="button"
                  onClick={() => goToQuestion(examIndex)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    toggleFlag(q.id);
                  }}
                  className={`w-full aspect-square flex items-center justify-center rounded-md border text-xs font-semibold tabular-nums transition-all duration-100 focus-ring ${tileClass}`}
                  title={`Q${examIndex + 1}${isFlagged ? ' (flagged)' : ''} — right-click to flag`}
                >
                  {examIndex + 1}
                </button>
                {isFlagged && (
                  <Flag className="absolute -top-1 -right-1 w-2.5 h-2.5 text-[var(--color-warning)] fill-[var(--color-warning)]" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ examContext }: { examContext: ExamContextSidebar }) {
  const { questions, answeredQuestions, flaggedQuestions } = examContext;
  const [filter, setFilter] = useState<FilterMode>('all');
  const activeRef = useRef<HTMLButtonElement>(null);

  const totalProgress = examContext.getProgress(questions);
  const unansweredCount = questions.length - answeredQuestions.size;
  const flaggedCount = flaggedQuestions.size;

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [examContext.currentQuestion?.id]);

  const allIndexed: IndexedQuestion[] = questions.map((q, i) => ({ question: q, examIndex: i }));

  const filtered = allIndexed.filter(({ question: q }) => {
    if (filter === 'unanswered') return !answeredQuestions.has(q.id);
    if (filter === 'flagged') return flaggedQuestions.has(q.id);
    return true;
  });

  const sections = groupBySection(filtered);

  const filters: { mode: FilterMode; label: string; count?: number }[] = [
    { mode: 'all', label: 'All' },
    { mode: 'unanswered', label: 'Unanswered', count: unansweredCount },
    { mode: 'flagged', label: 'Flagged', count: flaggedCount },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-[var(--color-border)] h-full flex flex-col bg-[var(--color-bg-primary)]">
      {/* Sticky summary */}
      <div className="shrink-0 p-4 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            {totalProgress.completed}/{totalProgress.total} completed
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
            style={{ width: `${totalProgress.total > 0 ? (totalProgress.completed / totalProgress.total) * 100 : 0}%` }}
          />
        </div>
        <div className="flex gap-4 mt-2">
          <span className="text-[11px] text-[var(--color-text-muted)]">
            <span className="font-semibold tabular-nums text-[var(--color-text-secondary)]">{unansweredCount}</span> unanswered
          </span>
          {flaggedCount > 0 && (
            <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-0.5">
              <Flag className="w-2.5 h-2.5 text-[var(--color-warning)] fill-[var(--color-warning)]" />
              <span className="font-semibold tabular-nums text-[var(--color-warning)]">{flaggedCount}</span>
            </span>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="shrink-0 flex border-b border-[var(--color-border)]">
        {filters.map((f) => (
          <button
            key={f.mode}
            type="button"
            onClick={() => setFilter(f.mode)}
            className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${
              filter === f.mode
                ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            {f.label}
            {f.count !== undefined && f.count > 0 && (
              <span className="ml-1 text-[10px] tabular-nums opacity-70">{f.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Question grid */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {sections.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--color-text-muted)]">
              {filter === 'flagged' ? 'No flagged questions' : 'No unanswered questions'}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {filter === 'flagged' ? 'Right-click a question to flag it.' : 'All questions have been answered.'}
            </p>
          </div>
        ) : (
          sections.map((section) => (
            <SectionGroup
              key={section.name}
              name={section.name}
              items={section.items}
              examContext={examContext}
              activeRef={activeRef}
            />
          ))
        )}
      </nav>
    </aside>
  );
}
