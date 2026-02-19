import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { useExamKeyboard } from '../hooks/useExamKeyboard';
import { QuestionPanel } from '../components/exam/QuestionPanel';
import { AnswerPanel } from '../components/exam/AnswerPanel';
import { ExplanationPanel } from '../components/exam/ExplanationPanel';
import { TimerBar } from '../components/exam/TimerBar';
import { TestReviewPanel } from '../components/exam/TestReviewPanel';

export function ExamView() {
  const { loadExam, loading, loadError, questions, examType, examFinished } = useExam();
  useExamKeyboard();
  const navigate = useNavigate();
  const initialLoadDone = useRef(false);
  const [initialLoadStarted, setInitialLoadStarted] = useState(false);

  useEffect(() => {
    if (initialLoadDone.current) return;
    const raw = sessionStorage.getItem('examConfig');
    if (!raw) {
      navigate('/exam/config');
      return;
    }
    try {
      const config = JSON.parse(raw);
      if (!config.subjects?.length) {
        navigate('/exam/config');
        return;
      }
      initialLoadDone.current = true;
      setInitialLoadStarted(true);
      loadExam({
        subjects: config.subjects,
        mode: config.mode || 'all',
        count: config.count ?? 20,
        examType: config.examType || 'practice',
        timeLimitPerQuestion: config.timeLimitPerQuestion ?? null,
        timeLimitTotal: config.timeLimitTotal ?? null,
        existingSessionId: config.existingSessionId ?? null,
      });
    } catch {
      navigate('/exam/config');
    }
  }, [loadExam, navigate]);

  const showLoading = loading || (initialLoadStarted && questions.length === 0 && !loadError);

  if (showLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-bg-secondary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--color-text-secondary)]">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-bg-secondary)]">
        <div className="text-center max-w-sm">
          <p className="text-[var(--color-text-secondary)] mb-4">{loadError}</p>
          <button
            type="button"
            onClick={() => navigate('/exam/config')}
            className="btn btn-primary focus-ring rounded-lg"
          >
            Back to config
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-bg-secondary)]">
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)] mb-4">
            No questions match your criteria. Try different subjects or mode.
          </p>
          <button
            type="button"
            onClick={() => navigate('/exam/config')}
            className="btn btn-primary focus-ring rounded-lg"
          >
            Back to config
          </button>
        </div>
      </div>
    );
  }

  if (examType === 'test' && examFinished) {
    return <TestReviewPanel />;
  }

  const isTestMode = examType === 'test';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {isTestMode && <TimerBar />}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r border-[var(--color-border)] flex flex-col overflow-hidden">
          <QuestionPanel />
        </div>
        <div className="w-1/2 flex flex-col overflow-hidden">
          <AnswerPanel />
          <ExplanationPanel />
        </div>
      </div>
    </div>
  );
}
