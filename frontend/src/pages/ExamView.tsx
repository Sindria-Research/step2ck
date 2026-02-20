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
      {/* Mobile tab bar */}
      <div className="md:hidden shrink-0 flex border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]">
        <button
          type="button"
          onClick={() => setMobileTab('question')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
            mobileTab === 'question'
              ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
              : 'text-[var(--color-text-secondary)]'
          }`}
        >
          <FileText className="w-4 h-4" />
          Question
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('answer')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
            mobileTab === 'answer'
              ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
              : 'text-[var(--color-text-secondary)]'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          Answer
        </button>
      </div>
      {/* Desktop: side-by-side; Mobile: tab-switched */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className={`w-full md:w-1/2 border-r border-[var(--color-border)] flex flex-col overflow-hidden ${mobileTab !== 'question' ? 'hidden md:flex' : 'flex'}`}>
          <QuestionPanel />
        </div>
        <div className={`w-full md:w-1/2 flex flex-col overflow-hidden ${mobileTab !== 'answer' ? 'hidden md:flex' : 'flex'}`}>
          <AnswerPanel />
          <ExplanationPanel />
        </div>
      </div>
    </div>
  );
}
