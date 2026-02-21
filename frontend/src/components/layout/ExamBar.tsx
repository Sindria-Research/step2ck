import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sun, Moon, LogOut, Flag, FlaskConical } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Modal } from '../common/Modal';
import { LabValuesModal } from '../exam/LabValuesModal';

interface ExamBarProps {
  currentIndex: number;
  total: number;
  answeredCount: number;
  onPrev: () => void;
  onNext: () => void;
  onExit?: () => void;
  onFinish?: () => void;
}

export function ExamBar({
  currentIndex,
  total,
  answeredCount,
  onPrev,
  onNext,
  onExit,
  onFinish,
}: ExamBarProps) {
  const { theme, toggleTheme } = useTheme();
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [labValuesOpen, setLabValuesOpen] = useState(false);

  const atLast = currentIndex >= total - 1;
  const atFirst = currentIndex <= 0;

  return (
    <>
      <header
        className="h-12 shrink-0 flex items-center justify-between px-2 sm:px-4 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]"
        role="banner"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex rounded-md border border-[var(--color-border)] overflow-hidden">
            <button
              type="button"
              onClick={onPrev}
              disabled={atFirst}
              className="p-2.5 sm:p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-ring"
              title="Previous question"
              aria-label="Previous question"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          <button
            type="button"
            onClick={onNext}
            disabled={atLast}
            className="p-2.5 sm:p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-ring border-l border-[var(--color-border)]"
            title="Next question"
            aria-label="Next question"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          </div>
          <span className="text-xs text-[var(--color-text-tertiary)] font-medium tabular-nums whitespace-nowrap">
            {currentIndex + 1}<span className="text-[var(--color-text-muted)]">/</span>{total}
          </span>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={() => setLabValuesOpen(true)}
            className="p-2.5 sm:p-2 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring flex items-center gap-1.5 text-sm"
            title="Lab values"
            aria-label="Lab values"
          >
            <FlaskConical className="w-4 h-4" />
            <span className="hidden sm:inline">Lab values</span>
          </button>
          {onExit && (
            <button
              type="button"
              onClick={() => setExitModalOpen(true)}
              className="p-2.5 sm:p-2 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring flex items-center gap-1.5 text-sm"
              title="Exit exam"
              aria-label="Exit exam"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          )}
          {onFinish && (
            <button
              type="button"
              onClick={() => setFinishModalOpen(true)}
              className="p-2.5 sm:p-2 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring flex items-center gap-1.5 text-sm"
              title="Finish exam"
              aria-label="Finish exam"
            >
              <Flag className="w-4 h-4" />
              <span className="hidden sm:inline">Finish</span>
            </button>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden sm:flex p-2 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {onExit && (
        <Modal
          open={exitModalOpen}
          onClose={() => setExitModalOpen(false)}
          title="Exit exam?"
          size="sm"
        >
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Your progress is saved. You can start a new test anytime from the dashboard.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setExitModalOpen(false)}
              className="btn btn-secondary px-4 py-2 rounded-md focus-ring"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setExitModalOpen(false);
                onExit();
              }}
              className="btn btn-primary px-4 py-2 rounded-md focus-ring"
            >
              Exit exam
            </button>
          </div>
        </Modal>
      )}

      {onFinish && (
        <Modal
          open={finishModalOpen}
          onClose={() => setFinishModalOpen(false)}
          title="Finish exam?"
          size="sm"
        >
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            You&apos;ve answered {answeredCount} of {total} questions. Your progress is saved and will appear on your dashboard.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFinishModalOpen(false)}
              className="btn btn-secondary px-4 py-2 rounded-md focus-ring"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setFinishModalOpen(false);
                onFinish();
              }}
              className="btn btn-primary px-4 py-2 rounded-md focus-ring"
            >
              Finish exam
            </button>
          </div>
        </Modal>
      )}

      <LabValuesModal open={labValuesOpen} onClose={() => setLabValuesOpen(false)} />
    </>
  );
}
