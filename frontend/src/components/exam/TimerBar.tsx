import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useExam } from '../../context/ExamContext';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TimerBar() {
  const {
    currentQuestionIndex,
    questions,
    examStartTime,
    timeLimitPerQuestion,
    timeLimitTotal,
    lockAnswerAndAdvance,
    finishExam,
    answeredQuestions,
    examFinished,
  } = useExam();

  const [now, setNow] = useState(Date.now());
  const [questionStart, setQuestionStart] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setQuestionStart(Date.now());
  }, [currentQuestionIndex]);

  if (examFinished) return null;

  const questionElapsed = Math.floor((now - questionStart) / 1000);
  const totalElapsed = examStartTime ? Math.floor((now - examStartTime) / 1000) : 0;

  const questionRemaining = timeLimitPerQuestion ? Math.max(0, timeLimitPerQuestion - questionElapsed) : null;
  const totalRemaining = timeLimitTotal ? Math.max(0, timeLimitTotal - totalElapsed) : null;

  const questionUrgent = questionRemaining !== null && questionRemaining <= 10;
  const totalUrgent = totalRemaining !== null && totalRemaining <= 60;

  useEffect(() => {
    if (examFinished) return;
    if (questionRemaining !== null && questionRemaining <= 0) {
      lockAnswerAndAdvance();
    }
  }, [questionRemaining, lockAnswerAndAdvance, examFinished]);

  useEffect(() => {
    if (examFinished) return;
    if (totalRemaining !== null && totalRemaining <= 0) {
      finishExam();
    }
  }, [totalRemaining, finishExam, examFinished]);

  const answered = answeredQuestions.size;

  return (
    <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 md:gap-4 px-3 py-2 md:px-5 md:py-2.5 bg-[var(--color-bg-primary)] border-b border-[var(--color-border)] text-xs md:text-sm">
      <div className="flex items-center gap-2 md:gap-4">
        <span className="font-semibold text-[var(--color-text-primary)] tabular-nums">
          Q {currentQuestionIndex + 1}/{questions.length}
        </span>
        <span className="text-[var(--color-text-muted)] hidden md:inline">·</span>
        <span className="text-[var(--color-text-secondary)] tabular-nums hidden md:inline">
          {answered} answered
        </span>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        {/* Per-question timer */}
        <div className={`flex items-center gap-1.5 tabular-nums ${questionUrgent ? 'text-[var(--color-error)] font-semibold' : 'text-[var(--color-text-secondary)]'}`}>
          <Clock className="w-3.5 h-3.5" />
          {questionRemaining !== null ? (
            <span>{formatTime(questionRemaining)}</span>
          ) : (
            <span>{formatTime(questionElapsed)}</span>
          )}
          <span className="text-[var(--color-text-muted)] text-xs ml-0.5">
            {questionRemaining !== null ? 'left' : 'elapsed'}
          </span>
        </div>

        {/* Overall timer */}
        {(timeLimitTotal || examStartTime) && (
          <>
            <span className="text-[var(--color-text-muted)]">·</span>
            <div className={`flex items-center gap-1.5 tabular-nums ${totalUrgent ? 'text-[var(--color-error)] font-semibold' : 'text-[var(--color-text-secondary)]'}`}>
              {totalUrgent && <AlertTriangle className="w-3.5 h-3.5" />}
              {totalRemaining !== null ? (
                <span>{formatTime(totalRemaining)} total</span>
              ) : (
                <span>{formatTime(totalElapsed)} total</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
