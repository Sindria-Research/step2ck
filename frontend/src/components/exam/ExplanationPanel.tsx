import { useEffect, useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import { useExam } from '../../context/ExamContext';
import { api } from '../../api/api';

export function ExplanationPanel() {
  const {
    currentQuestion,
    selectedAnswer,
    isSubmitted,
    nextQuestion,
    finishExam,
    currentQuestionIndex,
    questions,
    examType,
    examFinished,
    lockAnswerAndAdvance,
    answeredQuestions,
  } = useExam();
  const [aiExplainActive, setAiExplainActive] = useState(false);
  const [aiExplainLoading, setAiExplainLoading] = useState(false);
  const [aiExplainError, setAiExplainError] = useState<string | null>(null);
  const [aiExplainText, setAiExplainText] = useState('');

  useEffect(() => {
    setAiExplainActive(false);
    setAiExplainLoading(false);
    setAiExplainError(null);
    setAiExplainText('');
  }, [currentQuestion?.id]);

  if (!currentQuestion) return null;

  const isTestMode = examType === 'test';
  const isCorrect = selectedAnswer === currentQuestion.correct_answer;
  const hasNext = currentQuestionIndex < questions.length - 1;
  const isLocked = isTestMode && answeredQuestions.has(currentQuestion.id);

  // In test mode during the exam: only show navigation, no feedback
  if (isTestMode && !examFinished) {
    if (!isLocked) return null;
    return (
      <div className="shrink-0 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Answer locked. {hasNext ? 'Move to next question.' : 'Finish to see results.'}
          </p>
          <div className="flex gap-2">
            {hasNext ? (
              <button
                type="button"
                onClick={lockAnswerAndAdvance}
                className="btn btn-primary flex items-center gap-2 py-2 px-4 rounded-lg focus-ring text-sm"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finishExam}
                className="btn btn-primary flex items-center gap-2 py-2 px-4 rounded-lg focus-ring text-sm"
              >
                Finish Test
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Practice mode or test review: show full explanations
  const showExplanation = isTestMode ? examFinished && isSubmitted : isSubmitted;
  if (!showExplanation) return null;

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
    } catch (e) {
      setAiExplainError(e instanceof Error ? e.message : 'Chiron couldn\u2019t explain this one');
    } finally {
      setAiExplainLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[var(--color-bg-secondary)]">
      <div className="p-6 flex-1 flex flex-col gap-5">
        {/* Result badge + correct answer */}
        <div className="flex items-center gap-3">
          <span className={`badge ${isCorrect ? 'badge-success' : 'badge-error'}`}>
            {isCorrect ? 'Correct' : 'Incorrect'}
          </span>
          {!isCorrect && (
            <span className="text-sm font-medium text-[var(--color-success)]">
              Correct answer: {currentQuestion.correct_answer}
            </span>
          )}
        </div>

        {/* Built-in explanations */}
        {currentQuestion.correct_explanation && (
          <div>
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

        {/* AI Explanation */}
        <div className="pt-4 border-t border-[var(--color-border)]">
          {!aiExplainActive ? (
            <button
              type="button"
              onClick={handleExplainWithAI}
              className="group flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all focus-ring border border-[var(--color-border)] hover:border-[var(--color-accent)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]"
            >
              <Sparkles className="w-4 h-4 text-[var(--color-accent)] group-hover:scale-110 transition-transform" />
              Ask Chiron
            </button>
          ) : (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">Chiron</span>
                </div>
                <div className="flex items-center gap-2">
                  {!aiExplainLoading && (
                    <button
                      type="button"
                      onClick={handleExplainWithAI}
                      className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors focus-ring"
                      title="Regenerate"
                    >
                      Retry
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAiExplainActive(false)}
                    className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <div className="px-5 py-4">
                {aiExplainLoading ? (
                  <div className="flex items-center gap-3 py-4">
                    <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-[var(--color-text-secondary)] thinking-text">
                      Chiron is thinking…
                    </span>
                  </div>
                ) : aiExplainError ? (
                  <p className="text-sm text-[var(--color-error)] py-2">
                    {aiExplainError}
                  </p>
                ) : (
                  <div className="ai-explanation-content text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    <Markdown>{aiExplainText}</Markdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Next question or Finish */}
        {!examFinished && (
          <div className="mt-auto pt-4 flex justify-end">
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
        )}
      </div>
    </div>
  );
}
