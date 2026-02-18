import { useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { ExamBar } from './ExamBar';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  examContext?: {
    questions: import('../../api/types').Question[];
    currentQuestion: import('../../api/types').Question | null;
    currentQuestionIndex: number;
    goToQuestion: (index: number) => void;
    answeredQuestions: Map<string, { selected: string; correct: boolean }>;
    getProgress: (sectionQuestions: import('../../api/types').Question[]) => { completed: number; total: number };
    prevQuestion: () => void;
    nextQuestion: () => void;
  } | null;
  onExamExit?: () => void;
  onExamFinish?: () => void;
}

export function AppLayout({
  children,
  showSidebar = false,
  examContext = null,
  onExamExit,
  onExamFinish,
}: AppLayoutProps) {
  const location = useLocation();
  const isExamPage = location.pathname === '/exam';

  return (
    <div className="h-screen flex bg-[var(--color-bg-secondary)] overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {isExamPage && examContext && (
          <ExamBar
            currentIndex={examContext.currentQuestionIndex}
            total={examContext.questions.length}
            answeredCount={examContext.answeredQuestions.size}
            onPrev={examContext.prevQuestion}
            onNext={examContext.nextQuestion}
            onExit={onExamExit}
            onFinish={onExamFinish}
          />
        )}
        <div className="flex-1 flex min-w-0 overflow-hidden">
          {showSidebar && isExamPage && examContext && (
            <Sidebar examContext={examContext} />
          )}
          <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden" role="main">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
