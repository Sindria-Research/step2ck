import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LogOut, Sun, Moon } from 'lucide-react';
import { APP_NAME, getLogoUrl } from '../../config/branding';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserAvatar } from '../common/UserAvatar';

interface HeaderProps {
  examContext?: {
    currentQuestionIndex: number;
    questions: unknown[];
    prevQuestion: () => void;
    nextQuestion: () => void;
  } | null;
}

export function Header({ examContext = null }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isExamPage = location.pathname === '/exam';
  const logoUrl = getLogoUrl(theme);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className="h-14 shrink-0 flex items-center justify-between px-4 md:px-6 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)] transition-colors duration-150"
      style={{ height: '3.5rem' }}
      role="banner"
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-ring rounded-md py-2 pr-2 min-w-0"
          aria-label={`Go to home, ${APP_NAME}`}
        >
          <img src={logoUrl} alt="" className="w-8 h-8 shrink-0 rounded-lg object-contain" />
          <span className="text-lg font-semibold text-[var(--color-text-primary)] font-display truncate">
            {APP_NAME}
          </span>
        </button>
        {isExamPage && examContext && (
          <span
            className="hidden sm:inline-flex text-xs text-[var(--color-text-tertiary)] bg-[var(--color-bg-tertiary)] px-2.5 py-1 rounded-md font-medium"
            aria-live="polite"
          >
            Question {examContext.currentQuestionIndex + 1} of {examContext.questions.length}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isExamPage && examContext && (
          <>
            <div className="flex items-center rounded-md border border-[var(--color-border)] overflow-hidden">
              <button
                type="button"
                onClick={examContext.prevQuestion}
                className="p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-ring"
                title="Previous question"
                aria-label="Previous question"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={examContext.nextQuestion}
                className="p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-ring border-l border-[var(--color-border)]"
                title="Next question"
                aria-label="Next question"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="w-px h-6 bg-[var(--color-border)] mx-1" aria-hidden />
          </>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" aria-hidden />
          ) : (
            <Moon className="w-4 h-4" aria-hidden />
          )}
        </button>

        <div className="w-px h-6 bg-[var(--color-border)]" aria-hidden />

        {user ? (
          <div className="flex items-center gap-2">
            <UserAvatar src={user.avatar_url} name={user.display_name} size="sm" />
            <span
              className="hidden sm:block text-sm text-[var(--color-text-secondary)] truncate max-w-[140px]"
              title={user.display_name || user.email}
            >
              {user.display_name || user.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-md transition-colors focus-ring"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span
            className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-2.5 py-1.5 rounded-md"
            title="Demo user – progress is saved locally"
          >
            Demo
          </span>
        )}
      </div>
    </header>
  );
}
