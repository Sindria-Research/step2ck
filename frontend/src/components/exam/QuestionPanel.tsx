import { useExam } from '../../context/ExamContext';

export function QuestionPanel() {
  const { currentQuestion } = useExam();

  if (!currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-text-tertiary)]">
        No question selected
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-bg-primary)]">
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
        <div className="text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
          {currentQuestion.question_stem}
        </div>
        <p className="mt-6 text-xs text-[var(--color-text-muted)] italic">
          Tip: Select text to highlight for reference
        </p>
      </div>
    </div>
  );
}
