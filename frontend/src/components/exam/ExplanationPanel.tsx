import { useState } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { useExam } from '../../context/ExamContext';
import { StreamingText } from '../common/StreamingText';

const AI_PLACEHOLDER_TEXT = 'AI-powered explanation will be available in a future update.';

export function ExplanationPanel() {
  const { currentQuestion, selectedAnswer, isSubmitted, nextQuestion, currentQuestionIndex, questions } = useExam();
  const [aiExplainActive, setAiExplainActive] = useState(false);

  if (!currentQuestion) return null;

  const showExplanation = isSubmitted;
  const isCorrect = selectedAnswer === currentQuestion.correct_answer;
  const hasNext = currentQuestionIndex < questions.length - 1;

  if (!showExplanation) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[var(--color-bg-secondary)]">
      <div className="p-6 flex-1 flex flex-col">
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

        {/* Explain with AI — placeholder with thinking gradient + streaming */}
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
              <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed min-h-[1.5rem]">
                <StreamingText text={AI_PLACEHOLDER_TEXT} charDelay={30} cursor />
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

        {/* Next question — bottom right */}
        {hasNext && (
          <div className="mt-auto pt-6 flex justify-end">
            <button
              type="button"
              onClick={nextQuestion}
              className="btn btn-primary flex items-center gap-2 py-2.5 px-4 rounded-lg focus-ring"
            >
              Next question
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
