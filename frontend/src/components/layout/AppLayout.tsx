import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, Menu } from 'lucide-react';
import { AppSidebar } from './AppSidebar';
import { ExamBar } from './ExamBar';
import { Sidebar } from './Sidebar';
import { useSidebar } from '../../context/SidebarContext';
import { useTheme } from '../../context/ThemeContext';
import { APP_NAME, getLogoUrl } from '../../config/branding';

interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  examContext?: {
    questions: import('../../api/types').Question[];
    currentQuestion: import('../../api/types').Question | null;
    currentQuestionIndex: number;
    goToQuestion: (index: number) => void;
    answeredQuestions: Map<string, { selected: string; correct: boolean }>;
    flaggedQuestions: Set<string>;
    toggleFlag: (questionId: string) => void;
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
  const [questionSidebarOpen, setQuestionSidebarOpen] = useState(true);
  const { mobileOpen, setMobileOpen } = useSidebar();
  const { theme } = useTheme();
  const logoUrl = getLogoUrl(theme);

  const shouldShowQuestionSidebar = showSidebar && isExamPage && examContext;

  return (
    <div className="h-screen flex bg-[var(--color-bg-secondary)] overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:rounded-md focus:bg-[var(--color-accent)] focus:text-white focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0" {...(mobileOpen ? { inert: true, 'aria-hidden': true } : {})}>
        {!isExamPage && (
          <div className="md:hidden shrink-0 mobile-header-bar">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-1 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <img src={logoUrl} alt="" className="w-6 h-6 rounded-md object-contain" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)] font-display truncate">
              {APP_NAME}
            </span>
          </div>
        )}
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
          {shouldShowQuestionSidebar && (
            <div className="hidden md:block">
              {questionSidebarOpen ? (
                <div className="relative shrink-0">
                  <Sidebar examContext={examContext} />
                  <button
                    type="button"
                    onClick={() => setQuestionSidebarOpen(false)}
                    className="absolute top-[1.55rem] right-2 p-1 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring z-10"
                    title="Hide question list"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg-primary)] flex items-start pt-3 px-1.5">
                  <button
                    type="button"
                    onClick={() => setQuestionSidebarOpen(true)}
                    className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                    title="Show question list"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
          <main id="main-content" className="flex-1 flex flex-col min-h-0 min-w-0 overflow-y-auto" role="main">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
