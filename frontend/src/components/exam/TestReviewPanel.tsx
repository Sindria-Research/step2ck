import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, RotateCcw, LayoutDashboard, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import { useExam } from '../../context/ExamContext';
import { api } from '../../api/api';

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function TestReviewPanel() {
  const navigate = useNavigate();
  const {
    questions,
    answeredQuestions,
    questionTimeSpent,
    examStartTime,
    examEndTime,
    resetExam,
  } = useExam();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiStates, setAiStates] = useState<Map<string, { loading: boolean; text: string; error: string | null }>>(new Map());

  let correctCount = 0;
  let incorrectCount = 0;
  answeredQuestions.forEach(({ correct }) => {
    if (correct) correctCount++;
    else incorrectCount++;
  });
  const unanswered = questions.length - answeredQuestions.size;
  const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const totalTime = examStartTime ? Math.round(((examEndTime ?? Date.now()) - examStartTime) / 1000) : 0;

  const handleAskChiron = async (questionId: string, selectedAnswer: string | undefined) => {
    setAiStates((prev) => {
      const next = new Map(prev);
      next.set(questionId, { loading: true, text: '', error: null });
      return next;
    });
    try {
      const res = await api.ai.explain({
        question_id: questionId,
        selected_answer: selectedAnswer,
      });
      setAiStates((prev) => {
        const next = new Map(prev);
        next.set(questionId, { loading: false, text: res.explanation, error: null });
        return next;
      });
    } catch (e) {
      setAiStates((prev) => {
        const next = new Map(prev);
        next.set(questionId, { loading: false, text: '', error: e instanceof Error ? e.message : 'Failed' });
        return next;
      });
    }
  };

  const handleRetake = () => {
    const raw = sessionStorage.getItem('examConfig');
    resetExam();
    if (raw) {
      try {
        const config = JSON.parse(raw);
        delete config.existingSessionId;
        sessionStorage.setItem('examConfig', JSON.stringify(config));
      } catch {
        sessionStorage.setItem('examConfig', raw);
      }
    }
    navigate('/exam');
  };

  const handleDashboard = () => {
    resetExam();
    navigate('/dashboard');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-bg-secondary)]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-[var(--color-text-primary)] font-display tracking-tight">
            Test Complete
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Review your answers and explanations below.
          </p>
        </div>

        {/* Score summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="chiron-mockup text-center py-5">
            <p className="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums">{accuracy}%</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Accuracy</p>
          </div>
          <div className="chiron-mockup text-center py-5">
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />
              <span className="text-3xl font-bold text-[var(--color-success)] tabular-nums">{correctCount}</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Correct</p>
          </div>
          <div className="chiron-mockup text-center py-5">
            <div className="flex items-center justify-center gap-1.5">
              <XCircle className="w-5 h-5 text-[var(--color-error)]" />
              <span className="text-3xl font-bold text-[var(--color-error)] tabular-nums">{incorrectCount}</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Incorrect</p>
          </div>
          <div className="chiron-mockup text-center py-5">
            <div className="flex items-center justify-center gap-1.5">
              <Clock className="w-4 h-4 text-[var(--color-text-secondary)]" />
              <span className="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums">{formatTime(totalTime)}</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Total time</p>
          </div>
        </div>

        {unanswered > 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center mb-6">
            {unanswered} question{unanswered > 1 ? 's' : ''} left unanswered.
          </p>
        )}

        {/* Question list */}
        <div className="space-y-3">
          {questions.map((q, idx) => {
            const answer = answeredQuestions.get(q.id);
            const isCorrect = answer?.correct;
            const time = questionTimeSpent.get(q.id);
            const isExpanded = expandedId === q.id;
            const ai = aiStates.get(q.id);

            return (
              <div key={q.id} className="chiron-mockup overflow-hidden">
                {/* Row header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    answer == null
                      ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
                      : isCorrect
                      ? 'bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)]'
                      : 'bg-[color-mix(in_srgb,var(--color-error)_15%,transparent)] text-[var(--color-error)]'
                  }`}>
                    {idx + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {q.question_stem.slice(0, 120)}{q.question_stem.length > 120 ? '...' : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[var(--color-text-muted)]">{q.section}</span>
                      {answer && (
                        <>
                          <span className="text-[var(--color-text-muted)]">·</span>
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            You: <span className={isCorrect ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}>{answer.selected}</span>
                            {!isCorrect && <> → <span className="text-[var(--color-success)]">{q.correct_answer}</span></>}
                          </span>
                        </>
                      )}
                      {!answer && (
                        <>
                          <span className="text-[var(--color-text-muted)]">·</span>
                          <span className="text-xs text-[var(--color-text-muted)] italic">Unanswered</span>
                        </>
                      )}
                      {time != null && (
                        <>
                          <span className="text-[var(--color-text-muted)]">·</span>
                          <span className="text-xs text-[var(--color-text-muted)] tabular-nums">{formatTime(time)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <span className="shrink-0 text-[var(--color-text-tertiary)]">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-4">
                    {/* Full stem */}
                    <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
                      {q.question_stem}
                    </p>

                    {/* Choices */}
                    <div className="space-y-1.5">
                      {Object.entries(q.choices).sort(([a], [b]) => a.localeCompare(b)).map(([key, label]) => {
                        const isUserAnswer = answer?.selected === key;
                        const isCorrectChoice = q.correct_answer === key;
                        return (
                          <div
                            key={key}
                            className={`px-3 py-2 rounded-lg text-sm border ${
                              isCorrectChoice
                                ? 'border-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)]'
                                : isUserAnswer && !isCorrect
                                ? 'border-[var(--color-error)] bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)]'
                                : 'border-[var(--color-border)] bg-transparent'
                            }`}
                          >
                            <span className={`font-medium ${
                              isCorrectChoice ? 'text-[var(--color-success)]' : isUserAnswer && !isCorrect ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]'
                            }`}>
                              {key}.
                            </span>{' '}
                            <span className="text-[var(--color-text-secondary)]">{label}</span>
                            {isCorrectChoice && <span className="ml-2 text-xs font-semibold text-[var(--color-success)]">Correct</span>}
                            {isUserAnswer && !isCorrectChoice && <span className="ml-2 text-xs font-semibold text-[var(--color-error)]">Your answer</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.correct_explanation && (
                      <div>
                        <h4 className="text-xs font-semibold text-[var(--color-text-primary)] mb-1">Explanation</h4>
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">{q.correct_explanation}</p>
                      </div>
                    )}
                    {answer && !isCorrect && q.incorrect_explanation && (
                      <div>
                        <h4 className="text-xs font-semibold text-[var(--color-text-primary)] mb-1">Why others are wrong</h4>
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">{q.incorrect_explanation}</p>
                      </div>
                    )}

                    {/* Ask Chiron */}
                    <div className="pt-3 border-t border-[var(--color-border)]">
                      {!ai || (!ai.loading && !ai.text && !ai.error) ? (
                        <button
                          type="button"
                          onClick={() => handleAskChiron(q.id, answer?.selected)}
                          className="group flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border border-[var(--color-border)] hover:border-[var(--color-accent)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                          Ask Chiron
                        </button>
                      ) : ai.loading ? (
                        <div className="flex items-center gap-2 py-2">
                          <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-[var(--color-text-secondary)]">Chiron is thinking...</span>
                        </div>
                      ) : ai.error ? (
                        <p className="text-xs text-[var(--color-error)]">{ai.error}</p>
                      ) : (
                        <div className="ai-explanation-content text-sm text-[var(--color-text-secondary)] leading-relaxed">
                          <Markdown>{ai.text}</Markdown>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 mt-10 pb-10">
          <button
            type="button"
            onClick={handleRetake}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring"
          >
            <RotateCcw className="w-4 h-4" />
            Retake
          </button>
          <button
            type="button"
            onClick={handleDashboard}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium btn-primary focus-ring"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
