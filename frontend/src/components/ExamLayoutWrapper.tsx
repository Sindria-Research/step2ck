import { AppLayout } from './layout/AppLayout';
import { ExamView } from '../pages/ExamView';
import { useExam } from '../context/ExamContext';

/** Wraps ExamView with AppLayout and injects exam context for sidebar/header. */
export function ExamLayoutWrapper() {
  const examContext = useExam();
  return (
    <AppLayout
      showSidebar
      examContext={{
        questions: examContext.questions,
        currentQuestion: examContext.currentQuestion,
        currentQuestionIndex: examContext.currentQuestionIndex,
        goToQuestion: examContext.goToQuestion,
        answeredQuestions: examContext.answeredQuestions,
        getProgress: examContext.getProgress,
        prevQuestion: examContext.prevQuestion,
        nextQuestion: examContext.nextQuestion,
      }}
    >
      <ExamView />
    </AppLayout>
  );
}
