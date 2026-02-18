import { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, FolderOpen, Folder } from 'lucide-react';
import type { Question } from '../../api/types';

interface ExamContextSidebar {
  questions: Question[];
  currentQuestion: Question | null;
  goToQuestion: (index: number) => void;
  answeredQuestions: Map<string, { selected: string; correct: boolean }>;
  getProgress: (sectionQuestions: Question[]) => { completed: number; total: number };
}

function getQuestionsBySection(questions: Question[]) {
  const grouped: Record<string, Record<string, Array<Question & { examIndex: number }>>> = {};
  questions.forEach((q, index) => {
    const section = q.section || 'Unknown';
    const subsection = q.subsection || 'General';
    if (!grouped[section]) grouped[section] = {};
    if (!grouped[section][subsection]) grouped[section][subsection] = [];
    grouped[section][subsection].push({ ...q, examIndex: index });
  });
  return grouped;
}

function SubsectionItem({
  subsection,
  questions,
  examContext,
}: {
  subsection: string;
  questions: Array<Question & { examIndex: number }>;
  examContext: ExamContextSidebar;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const { goToQuestion, currentQuestion, getProgress, answeredQuestions } = examContext;
  const progress = getProgress(questions);

  return (
    <div className="ml-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded transition-colors focus-ring"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        {isOpen ? (
          <FolderOpen className="w-4 h-4 text-[var(--color-accent)]" />
        ) : (
          <Folder className="w-4 h-4 text-[var(--color-accent)]" />
        )}
        <span className="flex-1 text-left font-medium">{subsection}</span>
        <span className="text-xs text-[var(--color-text-muted)]">
          {progress.completed}/{progress.total}
        </span>
      </button>
      {isOpen && (
        <div className="ml-6 mt-1 space-y-0.5">
          {questions.map((q) => {
            const answerData = answeredQuestions.get(q.id);
            const isAnswered = !!answerData;
            const isCurrent = currentQuestion?.id === q.id;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => goToQuestion(q.examIndex)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded transition-colors duration-100 focus-ring ${
                  isCurrent
                    ? 'bg-[var(--color-bg-active)] text-[var(--color-accent-text)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                <FileText
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isAnswered
                      ? answerData.correct
                        ? 'text-[var(--color-success)]'
                        : 'text-[var(--color-error)]'
                      : 'text-[var(--color-text-muted)]'
                  }`}
                />
                <span>Q{q.examIndex + 1}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionItem({
  section,
  subsections,
  examContext,
}: {
  section: string;
  subsections: Record<string, Array<Question & { examIndex: number }>>;
  examContext: ExamContextSidebar;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors focus-ring"
      >
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <span className="flex-1 text-left">{section}</span>
      </button>
      {isOpen && (
        <div className="mt-1">
          {Object.entries(subsections).map(([subsection, questions]) => (
            <SubsectionItem
              key={subsection}
              subsection={subsection}
              questions={questions}
              examContext={examContext}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ examContext }: { examContext: ExamContextSidebar }) {
  const grouped = getQuestionsBySection(examContext.questions);

  return (
    <aside className="w-64 shrink-0 border-r border-[var(--color-border)] h-full overflow-y-auto bg-[var(--color-bg-primary)]">
      <div className="p-4 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Questions</h2>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
          {examContext.questions.length} questions in this exam
        </p>
      </div>
      <nav className="p-3">
        {Object.entries(grouped).map(([section, subsections]) => (
          <SectionItem
            key={section}
            section={section}
            subsections={subsections}
            examContext={examContext}
          />
        ))}
      </nav>
    </aside>
  );
}
