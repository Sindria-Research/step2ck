import { useExam } from '../../context/ExamContext';

export function ExplanationPanel() {
  const { currentQuestion, selectedAnswer, isSubmitted } = useExam();

  if (!isSubmitted || !currentQuestion) return null;

  const isCorrect = selectedAnswer === currentQuestion.correct_answer;

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-bg-secondary)]">
      <div className="p-6">
        <div className="mb-4">
          <span
            className={`badge ${isCorrect ? 'badge-success' : 'badge-error'}`}
          >
            {isCorrect ? 'Correct' : 'Incorrect'}
          </span>
        </div>
        {currentQuestion.correct_explanation && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
              Explanation
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
              {currentQuestion.correct_explanation}
            </p>
          </div>
        )}
        {!isCorrect && currentQuestion.incorrect_explanation && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
              Why others are wrong
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
              {currentQuestion.incorrect_explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
