import { useEffect, useState } from 'react';
import { Wand2, ChevronRight } from 'lucide-react';
import { useExam } from '../../context/ExamContext';
import { StreamingText } from '../common/StreamingText';
import { api } from '../../api/api';

export function ExplanationPanel() {
  const { currentQuestion, selectedAnswer, isSubmitted, nextQuestion, finishExam, currentQuestionIndex, questions } = useExam();
  const [aiExplainActive, setAiExplainActive] = useState(false);
  const [aiExplainLoading, setAiExplainLoading] = useState(false);
  const [aiExplainError, setAiExplainError] = useState<string | null>(null);
  const [aiExplainText, setAiExplainText] = useState('');
  const [aiExplainMeta, setAiExplainMeta] = useState<{ model: string; fallback: boolean } | null>(null);

  useEffect(() => {
    setAiExplainActive(false);
    setAiExplainLoading(false);
    setAiExplainError(null);
    setAiExplainText('');
    setAiExplainMeta(null);
  }, [currentQuestion?.id]);

  if (!currentQuestion) return null;

  const showExplanation = isSubmitted;
  const isCorrect = selectedAnswer === currentQuestion.correct_answer;
  const hasNext = currentQuestionIndex < questions.length - 1;

  if (!showExplanation) {
    return null;
  }

  const handleExplainWithAI = async () => {
    if (!currentQuestion) return;
    setAiExplainActive(true);
    setAiExplainLoading(true);
    setAiExplainError(null);
    setAiExplainText('');
    try {
      const res = await api.ai.explain({
        question_id: currentQuestion.id,
        selected_answer: selectedAnswer ?? undefined,
      });
      setAiExplainText(res.explanation);
      setAiExplainMeta({ model: res.model, fallback: res.fallback_used });
    } catch (e) {
      setAiExplainError(e instanceof Error ? e.message : 'Failed to get AI explanation');
    } finally {
      setAiExplainLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[var(--color-bg-secondary)]">
      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-4 flex items-center gap-3">
          <span
            className={`badge ${isCorrect ? 'badge-success' : 'badge-error'}`}
          >
            {isCorrect ? 'Correct' : 'Incorrect'}
          </span>
          {!isCorrect && (
            <span className="text-sm font-medium text-[var(--color-success)]">
              Correct answer: {currentQuestion.correct_answer}
            </span>
          )}
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
            onClick={handleExplainWithAI}
            className="flex items-center gap-2 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors focus-ring rounded-md py-1.5"
            disabled={aiExplainLoading}
          >
            <Wand2 className="w-4 h-4" />
            {aiExplainLoading ? 'Explaining…' : 'Explain with AI'}
          </button>
          {aiExplainActive && (
            <div className="mt-4 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)]">
              {aiExplainLoading ? (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium thinking-text">
                      Thinking…
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed min-h-[1.5rem]">
                    <StreamingText text="Analyzing this question..." charDelay={24} cursor />
                  </p>
                </>
              ) : aiExplainError ? (
                <p className="text-xs text-[var(--color-error)] leading-relaxed">
                  {aiExplainError}
                </p>
              ) : (
                <>
                  {aiExplainMeta && (
                    <p className="text-[0.68rem] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-2">
                      {aiExplainMeta.fallback ? 'Built-in explanation fallback' : `Model: ${aiExplainMeta.model}`}
                    </p>
                  )}
                  <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed whitespace-pre-wrap min-h-[1.5rem]">
                    <StreamingText text={aiExplainText} charDelay={10} cursor />
                  </p>
                </>
              )}
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

        {/* Next question or Finish exam — bottom right */}
        <div className="mt-auto pt-6 flex justify-end">
          {hasNext ? (
            <button
              type="button"
              onClick={nextQuestion}
              className="btn btn-primary flex items-center gap-2 py-2.5 px-4 rounded-lg focus-ring"
            >
              Next question
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={finishExam}
              className="btn btn-primary flex items-center gap-2 py-2.5 px-4 rounded-lg focus-ring"
            >
              Finish exam
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
