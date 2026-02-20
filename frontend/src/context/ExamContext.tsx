import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Question } from '../api/types';
import { api } from '../api/api';

export type ExamType = 'practice' | 'test';

interface ExamConfig {
  subjects: string[];
  mode: 'all' | 'unused' | 'incorrect' | 'personalized';
  count: number;
  examType?: ExamType;
  timeLimitPerQuestion?: number | null;
  timeLimitTotal?: number | null;
  existingSessionId?: number | null;
  questionIds?: string[] | null;
  reviewMode?: boolean;
}

export interface HighlightRange {
  start: number;
  end: number;
}

interface ExamContextValue {
  questions: Question[];
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  selectedAnswer: string | null;
  struckThroughChoices: Set<string>;
  isSubmitted: boolean;
  answeredQuestions: Map<string, { selected: string; correct: boolean }>;
  loading: boolean;
  loadError: string | null;
  isPersonalizedMode: boolean;
  highlightsByQuestionId: Map<string, HighlightRange[]>;
  examType: ExamType;
  examFinished: boolean;
  questionTimeSpent: Map<string, number>;
  examStartTime: number | null;
  examEndTime: number | null;
  timeLimitPerQuestion: number | null;
  timeLimitTotal: number | null;
  isReviewMode: boolean;
  selectAnswer: (choice: string) => void;
  toggleStrikethrough: (choice: string) => void;
  submit: () => Promise<void>;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  finishExam: () => Promise<void>;
  registerFinishHandler: (fn: () => void) => () => void;
  getProgress: (sectionQuestions: Question[]) => { completed: number; total: number };
  loadExam: (config: ExamConfig) => Promise<void>;
  resetExam: () => void;
  addHighlight: (questionId: string, range: HighlightRange) => void;
  removeHighlight: (questionId: string, range: HighlightRange) => void;
  getHighlights: (questionId: string) => HighlightRange[];
  flaggedQuestions: Set<string>;
  toggleFlag: (questionId: string) => void;
  lockAnswerAndAdvance: () => Promise<void>;
  reviewQuestion: (index: number) => void;
}

const ExamContext = createContext<ExamContextValue | null>(null);

export function ExamProvider({ children }: { children: React.ReactNode }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [struckThroughChoices, setStruckThroughChoices] = useState<Set<string>>(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<
    Map<string, { selected: string; correct: boolean }>
  >(new Map());
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPersonalizedMode, setIsPersonalizedMode] = useState(false);
  const [highlightsByQuestionId, setHighlightsByQuestionId] = useState<Map<string, HighlightRange[]>>(new Map());
  const [sessionId, setSessionId] = useState<number | null>(null);
  const finishHandlerRef = useRef<(() => void) | null>(null);

  const [examType, setExamType] = useState<ExamType>('practice');
  const [examFinished, setExamFinished] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [questionTimeSpent, setQuestionTimeSpent] = useState<Map<string, number>>(new Map());
  const [examStartTime, setExamStartTime] = useState<number | null>(null);
  const [examEndTime, setExamEndTime] = useState<number | null>(null);
  const [timeLimitPerQuestion, setTimeLimitPerQuestion] = useState<number | null>(null);
  const [timeLimitTotal, setTimeLimitTotal] = useState<number | null>(null);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const questionStartTimeRef = useRef<number>(Date.now());

  const currentQuestion = questions[currentQuestionIndex] ?? null;

  const recordQuestionTime = useCallback(() => {
    if (!currentQuestion) return;
    const elapsed = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    setQuestionTimeSpent((prev) => {
      const next = new Map(prev);
      next.set(currentQuestion.id, (next.get(currentQuestion.id) ?? 0) + elapsed);
      return next;
    });
  }, [currentQuestion]);

  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, [currentQuestionIndex]);

  const finishExam = useCallback(async () => {
    const finalTimeSpent = new Map(questionTimeSpent);
    if (currentQuestion) {
      const elapsed = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
      finalTimeSpent.set(currentQuestion.id, (finalTimeSpent.get(currentQuestion.id) ?? 0) + elapsed);
    }
    setQuestionTimeSpent(finalTimeSpent);

    if (sessionId != null && !isReviewMode) {
      const timeUpdates = Array.from(finalTimeSpent.entries()).map(([qid, time]) => ({
        question_id: qid,
        time_spent_seconds: time,
      }));
      if (timeUpdates.length > 0) {
        api.examSessions.batchUpdateAnswers(sessionId, timeUpdates).catch((e) =>
          console.error('Failed to batch update answer times', e),
        );
      }

      const total = questions.length;
      let correctCount = 0;
      let incorrectCount = 0;
      answeredQuestions.forEach(({ correct }) => {
        if (correct) correctCount++;
        else incorrectCount++;
      });
      const unansweredCount = total - answeredQuestions.size;
      const accuracy = total > 0 ? (correctCount / total) * 100 : 0;
      try {
        await api.examSessions.update(sessionId, {
          status: 'completed',
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          unanswered_count: unansweredCount,
          accuracy,
        });
      } catch (e) {
        console.error('Failed to save exam session', e);
      }
    }

    if (examType === 'test') {
      setExamEndTime(Date.now());
      setExamFinished(true);
      return;
    }

    if (!isReviewMode) {
      setSessionId(null);
    }
    finishHandlerRef.current?.();
  }, [sessionId, questions.length, answeredQuestions, examType, isReviewMode, questionTimeSpent, currentQuestion]);

  const registerFinishHandler = useCallback((fn: () => void) => {
    finishHandlerRef.current = fn;
    return () => {
      finishHandlerRef.current = null;
    };
  }, []);

  const resetExam = useCallback(() => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setStruckThroughChoices(new Set());
    setAnsweredQuestions(new Map());
    setHighlightsByQuestionId(new Map());
    setSessionId(null);
    setExamType('practice');
    setExamFinished(false);
    setIsReviewMode(false);
    setQuestionTimeSpent(new Map());
    setExamStartTime(null);
    setExamEndTime(null);
    setTimeLimitPerQuestion(null);
    setTimeLimitTotal(null);
    setFlaggedQuestions(new Set());
    try {
      sessionStorage.removeItem('examConfig');
    } catch {
      /* ignore */
    }
  }, []);

  const addHighlight = useCallback((questionId: string, range: HighlightRange) => {
    if (range.start >= range.end) return;
    setHighlightsByQuestionId((prev) => {
      const list = [...(prev.get(questionId) ?? []), range].sort((a, b) => a.start - b.start);
      const merged: HighlightRange[] = [];
      for (const r of list) {
        const last = merged[merged.length - 1];
        if (last && r.start <= last.end) {
          merged[merged.length - 1] = { start: last.start, end: Math.max(last.end, r.end) };
        } else {
          merged.push(r);
        }
      }
      const next = new Map(prev);
      next.set(questionId, merged);
      return next;
    });
  }, []);

  const removeHighlight = useCallback((questionId: string, range: HighlightRange) => {
    setHighlightsByQuestionId((prev) => {
      const list = (prev.get(questionId) ?? []).filter(
        (r) => !(r.start === range.start && r.end === range.end)
      );
      const next = new Map(prev);
      if (list.length) next.set(questionId, list);
      else next.delete(questionId);
      return next;
    });
  }, []);

  const getHighlights = useCallback((questionId: string) => {
    return highlightsByQuestionId.get(questionId) ?? [];
  }, [highlightsByQuestionId]);

  const loadExam = useCallback(async (config: ExamConfig) => {
    setLoading(true);
    setLoadError(null);
    setSessionId(null);
    setExamFinished(false);
    setIsReviewMode(false);
    setQuestionTimeSpent(new Map());

    const type = config.examType ?? 'practice';
    setExamType(type);
    setTimeLimitPerQuestion(config.timeLimitPerQuestion ?? null);
    setTimeLimitTotal(config.timeLimitTotal ?? null);

    try {
      let questionList: Question[];

      if (config.questionIds?.length) {
        questionList = await api.questions.getByIds(config.questionIds);
      } else {
        const res = await api.exams.generate({
          subjects: config.subjects,
          mode: config.mode,
          count: config.count,
        });
        questionList = res.questions ?? [];
      }

      setQuestions(questionList);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setIsSubmitted(false);
      setStruckThroughChoices(new Set());
      setAnsweredQuestions(new Map());
      setIsPersonalizedMode(config.mode === 'personalized');
      setExamStartTime(Date.now());
      questionStartTimeRef.current = Date.now();

      if (config.existingSessionId) {
        setSessionId(config.existingSessionId);

        try {
          const detail = await api.examSessions.get(config.existingSessionId);
          const restoredAnswers = new Map<string, { selected: string; correct: boolean }>();
          const restoredTime = new Map<string, number>();

          for (const a of detail.answers ?? []) {
            if (a.answer_selected != null) {
              restoredAnswers.set(a.question_id, {
                selected: a.answer_selected,
                correct: a.correct ?? false,
              });
            }
            if (a.time_spent_seconds != null) {
              restoredTime.set(a.question_id, a.time_spent_seconds);
            }
          }

          setAnsweredQuestions(restoredAnswers);
          if (restoredTime.size > 0) setQuestionTimeSpent(restoredTime);

          if (config.reviewMode) {
            setIsReviewMode(true);

            if (type === 'test') {
              setExamFinished(true);
              setExamEndTime(Date.now());
            }

            const firstQ = questionList[0];
            if (firstQ) {
              const saved = restoredAnswers.get(firstQ.id);
              if (saved) {
                setSelectedAnswer(saved.selected);
                setIsSubmitted(true);
              }
            }
          } else {
            const firstUnanswered = questionList.findIndex((q) => !restoredAnswers.has(q.id));
            if (firstUnanswered > 0) {
              setCurrentQuestionIndex(firstUnanswered);
            } else if (firstUnanswered === -1 && questionList.length > 0) {
              const firstQ = questionList[0];
              const saved = restoredAnswers.get(firstQ.id);
              if (saved) {
                setSelectedAnswer(saved.selected);
                setIsSubmitted(true);
              }
            }
          }
        } catch (e) {
          console.error('Failed to load session answers', e);
        }
      } else if (config.mode !== 'personalized' && questionList.length > 0) {
        try {
          const session = await api.examSessions.create({
            mode: `${type}:${config.mode}`,
            total_questions: questionList.length,
            subjects: config.subjects?.join(', ') ?? undefined,
            question_ids: questionList.map((q) => q.id),
          });
          setSessionId(session.id);
        } catch (e) {
          console.error('Failed to create exam session', e);
        }
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load exam');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectAnswer = useCallback((choice: string) => {
    if (!isSubmitted && !isReviewMode) setSelectedAnswer(choice);
  }, [isSubmitted, isReviewMode]);

  const toggleStrikethrough = useCallback((choice: string) => {
    if (!isSubmitted) {
      setStruckThroughChoices((prev) => {
        const next = new Set(prev);
        if (next.has(choice)) next.delete(choice);
        else next.add(choice);
        return next;
      });
    }
  }, [isSubmitted]);

  const submit = useCallback(async () => {
    if (!selectedAnswer || !currentQuestion || isSubmitted || isReviewMode) return;
    const correct = selectedAnswer === currentQuestion.correct_answer;
    setIsSubmitted(true);
    setAnsweredQuestions((prev) => {
      const next = new Map(prev);
      next.set(currentQuestion.id, { selected: selectedAnswer, correct });
      return next;
    });
    try {
      await api.progress.record({
        question_id: currentQuestion.id,
        correct,
        answer_selected: selectedAnswer,
        section: currentQuestion.section,
      });
    } catch (e) {
      console.error('Failed to save progress', e);
    }
    if (sessionId != null) {
      api.examSessions.updateAnswer(sessionId, currentQuestion.id, {
        answer_selected: selectedAnswer,
        correct,
      }).catch((e) => console.error('Failed to persist session answer', e));
    }
  }, [selectedAnswer, currentQuestion, isSubmitted, isReviewMode, sessionId]);

  const lockAnswerAndAdvance = useCallback(async () => {
    if (!currentQuestion || isReviewMode) return;
    recordQuestionTime();

    if (selectedAnswer) {
      const correct = selectedAnswer === currentQuestion.correct_answer;
      setAnsweredQuestions((prev) => {
        const next = new Map(prev);
        next.set(currentQuestion.id, { selected: selectedAnswer, correct });
        return next;
      });
      try {
        await api.progress.record({
          question_id: currentQuestion.id,
          correct,
          answer_selected: selectedAnswer,
          section: currentQuestion.section,
        });
      } catch (e) {
        console.error('Failed to save progress', e);
      }
      if (sessionId != null) {
        api.examSessions.updateAnswer(sessionId, currentQuestion.id, {
          answer_selected: selectedAnswer,
          correct,
        }).catch((e) => console.error('Failed to persist session answer', e));
      }
    }

    const hasNext = currentQuestionIndex < questions.length - 1;
    if (hasNext) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      const q = questions[nextIdx];
      const prev = answeredQuestions.get(q.id);
      if (prev) {
        setSelectedAnswer(prev.selected);
      } else {
        setSelectedAnswer(null);
      }
      setIsSubmitted(false);
      setStruckThroughChoices(new Set());
    } else {
      finishExam();
    }
  }, [currentQuestion, selectedAnswer, currentQuestionIndex, questions, answeredQuestions, recordQuestionTime, finishExam, isReviewMode, sessionId]);

  const goToQuestion = useCallback((index: number) => {
    if (index < 0 || index >= questions.length) return;
    recordQuestionTime();
    setCurrentQuestionIndex(index);
    const q = questions[index];
    const prev = answeredQuestions.get(q.id);
    if (prev) {
      setSelectedAnswer(prev.selected);
      setIsSubmitted(true);
    } else {
      setSelectedAnswer(null);
      setIsSubmitted(false);
    }
    setStruckThroughChoices(new Set());
  }, [questions, answeredQuestions, recordQuestionTime]);

  const reviewQuestion = useCallback((index: number) => {
    if (index < 0 || index >= questions.length) return;
    setCurrentQuestionIndex(index);
    const q = questions[index];
    const prev = answeredQuestions.get(q.id);
    if (prev) {
      setSelectedAnswer(prev.selected);
      setIsSubmitted(true);
    } else {
      setSelectedAnswer(null);
      setIsSubmitted(false);
    }
  }, [questions, answeredQuestions]);

  const nextQuestion = useCallback(() => {
    if (isPersonalizedMode) {
      loadExam({
        subjects: JSON.parse(sessionStorage.getItem('examConfig') ?? '{}').subjects ?? [],
        mode: 'personalized',
        count: 1,
      });
    } else {
      goToQuestion(currentQuestionIndex + 1);
    }
  }, [currentQuestionIndex, goToQuestion, isPersonalizedMode, loadExam]);

  const prevQuestion = useCallback(() => {
    goToQuestion(currentQuestionIndex - 1);
  }, [currentQuestionIndex, goToQuestion]);

  const getProgress = useCallback(
    (sectionQuestions: Question[]) => {
      let completed = 0;
      for (const q of sectionQuestions) {
        if (answeredQuestions.has(q.id)) completed++;
      }
      return { completed, total: sectionQuestions.length };
    },
    [answeredQuestions]
  );

  const toggleFlag = useCallback((questionId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }, []);

  const value: ExamContextValue = {
    questions,
    currentQuestion,
    currentQuestionIndex,
    selectedAnswer,
    struckThroughChoices,
    isSubmitted,
    answeredQuestions,
    loading,
    loadError,
    isPersonalizedMode,
    highlightsByQuestionId,
    examType,
    examFinished,
    questionTimeSpent,
    examStartTime,
    examEndTime,
    timeLimitPerQuestion,
    timeLimitTotal,
    isReviewMode,
    selectAnswer,
    toggleStrikethrough,
    submit,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    finishExam,
    registerFinishHandler,
    getProgress,
    loadExam,
    resetExam,
    addHighlight,
    removeHighlight,
    getHighlights,
    flaggedQuestions,
    toggleFlag,
    lockAnswerAndAdvance,
    reviewQuestion,
  };

  return (
    <ExamContext.Provider value={value}>{children}</ExamContext.Provider>
  );
}

export function useExam() {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error('useExam must be used within ExamProvider');
  return ctx;
}
