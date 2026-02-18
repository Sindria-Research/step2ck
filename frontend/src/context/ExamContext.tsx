import {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import type { Question } from '../api/types';
import { api } from '../api/api';

interface ExamConfig {
  subjects: string[];
  mode: 'all' | 'unused' | 'incorrect' | 'personalized';
  count: number;
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
  selectAnswer: (choice: string) => void;
  toggleStrikethrough: (choice: string) => void;
  submit: () => Promise<void>;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  getProgress: (sectionQuestions: Question[]) => { completed: number; total: number };
  loadExam: (config: ExamConfig) => Promise<void>;
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

  const currentQuestion = questions[currentQuestionIndex] ?? null;

  const loadExam = useCallback(async (config: ExamConfig) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.exams.generate({
        subjects: config.subjects,
        mode: config.mode,
        count: config.count,
      });
      setQuestions(res.questions ?? []);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setIsSubmitted(false);
      setStruckThroughChoices(new Set());
      setAnsweredQuestions(new Map());
      setIsPersonalizedMode(config.mode === 'personalized');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load exam');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectAnswer = useCallback((choice: string) => {
    if (!isSubmitted) setSelectedAnswer(choice);
  }, [isSubmitted]);

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
    if (!selectedAnswer || !currentQuestion || isSubmitted) return;
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
  }, [selectedAnswer, currentQuestion, isSubmitted]);

  const goToQuestion = useCallback((index: number) => {
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
    setStruckThroughChoices(new Set());
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
    selectAnswer,
    toggleStrikethrough,
    submit,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    getProgress,
    loadExam,
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
