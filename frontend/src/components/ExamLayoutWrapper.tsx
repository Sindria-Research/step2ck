import { useNavigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { ExamView } from '../pages/ExamView';
import { useExam } from '../context/ExamContext';

/** Wraps ExamView with AppLayout and injects exam context for sidebar/header. */
export function ExamLayoutWrapper() {
  const navigate = useNavigate();
  const examContext = useExam();

  const handleExamExit = () => {
    examContext.resetExam();
    navigate('/dashboard');
  };

  const handleExamFinish = () => {
    examContext.resetExam();
    navigate('/dashboard');
  };

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
      onExamExit={handleExamExit}
      onExamFinish={handleExamFinish}
    >
      <ExamView />
    </AppLayout>
  );
}
