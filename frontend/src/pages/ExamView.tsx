import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ListChecks } from 'lucide-react';
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
  const [mobileTab, setMobileTab] = useState<'question' | 'answer'>('question');

  // Reset load guard when exam state is cleared (e.g. retake)
  useEffect(() => {
    if (questions.length === 0 && initialLoadDone.current && !loading) {
      initialLoadDone.current = false;
      setInitialLoadStarted(false);
    }
  }, [questions.length, loading]);

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
        questionIds: config.questionIds ?? null,
        reviewMode: config.reviewMode ?? false,
      });
    } catch {
      navigate('/exam/config');
    }
  }, [loadExam, navigate, initialLoadStarted]);

  const showLoading = loading || (initialLoadStarted && questions.length === 0 && !loadError);

  if (showLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-bg-secondary)]">
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-1/2 border-r border-[var(--color-border)] p-6 space-y-4 bg-[var(--color-bg-primary)]">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-3 w-16 rounded" />
            <div className="space-y-2 mt-4">
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-3/4 rounded" />
            </div>
          </div>
          <div className="w-full md:w-1/2 p-6 space-y-3 bg-[var(--color-bg-primary)]">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-12 w-full rounded-lg" />
            ))}
          </div>
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
      {/* Mobile tab bar */}
      <div className="md:hidden shrink-0 mobile-tab-bar" role="tablist" aria-label="Exam panels">
        <button
          type="button"
          role="tab"
          id="tab-question"
          aria-selected={mobileTab === 'question'}
          aria-controls="panel-question"
          onClick={() => setMobileTab('question')}
        >
          <FileText className="w-4 h-4" />
          Question
        </button>
        <button
          type="button"
          role="tab"
          id="tab-answer"
          aria-selected={mobileTab === 'answer'}
          aria-controls="panel-answer"
          onClick={() => setMobileTab('answer')}
        >
          <ListChecks className="w-4 h-4" />
          Answer
        </button>
      </div>
      {/* Desktop: side-by-side; Mobile: tab-switched */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div
          id="panel-question"
          role="tabpanel"
          aria-labelledby="tab-question"
          className={`w-full md:w-1/2 border-r border-[var(--color-border)] flex-col overflow-hidden md:!flex ${mobileTab === 'question' ? 'flex' : 'hidden'}`}
        >
          <QuestionPanel />
        </div>
        <div
          id="panel-answer"
          role="tabpanel"
          aria-labelledby="tab-answer"
          className={`w-full md:w-1/2 flex-col overflow-hidden md:!flex ${mobileTab === 'answer' ? 'flex' : 'hidden'}`}
        >
          <AnswerPanel />
          <ExplanationPanel />
        </div>
      </div>
    </div>
  );
}
