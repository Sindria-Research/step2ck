import { ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ExamBarProps {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export function ExamBar({ currentIndex, total, onPrev, onNext }: ExamBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]"
      role="banner"
    >
      <div className="flex items-center gap-2">
        <div className="flex rounded-md border border-[var(--color-border)] overflow-hidden">
          <button
            type="button"
            onClick={onPrev}
            className="p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-ring"
            title="Previous question"
            aria-label="Previous question"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-ring border-l border-[var(--color-border)]"
            title="Next question"
            aria-label="Next question"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <span className="text-xs text-[var(--color-text-tertiary)] font-medium tabular-nums">
          {currentIndex + 1} / {total}
        </span>
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className="p-2 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  );
}
