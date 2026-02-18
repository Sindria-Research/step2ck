import { useState } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { useExam } from '../../context/ExamContext';

export function ExplanationPanel() {
  const { currentQuestion, selectedAnswer, isSubmitted, nextQuestion, currentQuestionIndex, questions } = useExam();
  const [aiExplainActive, setAiExplainActive] = useState(false);

  if (!currentQuestion) return null;

  const showExplanation = isSubmitted;
  const isCorrect = selectedAnswer === currentQuestion.correct_answer;

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-bg-secondary)] flex flex-col">
      {showExplanation && (
        <div className="p-6 flex-1">
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
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                Why others are wrong
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                {currentQuestion.incorrect_explanation}
              </p>
            </div>
          )}

          {/* Explain with AI — placeholder */}
          <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setAiExplainActive(true)}
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors focus-ring rounded-md py-1.5"
            >
              <Sparkles className="w-4 h-4" />
              Explain with AI
            </button>
            {aiExplainActive && (
              <div className="mt-4 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="thinking-gradient w-6 h-6 rounded-full flex-shrink-0" />
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    Thinking…
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  AI-powered explanation will be available in a future update.
                </p>
                <button
                  type="button"
                  onClick={() => setAiExplainActive(false)}
                  className="mt-3 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] focus-ring"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Easy next question — only when there is a next */}
          {currentQuestionIndex < questions.length - 1 && (
            <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={nextQuestion}
                className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg focus-ring"
              >
                Next question
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
      {!showExplanation && (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Submit your answer to see the explanation.
          </p>
        </div>
      )}
    </div>
  );
}
