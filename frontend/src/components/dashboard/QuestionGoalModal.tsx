import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../common/Modal';

const MIN_GOAL = 1;
const MAX_GOAL = 10_000;

interface QuestionGoalModalProps {
  open: boolean;
  onClose: () => void;
  currentGoal: number;
  onSave: (goal: number) => void;
}

export function QuestionGoalModal({
  open,
  onClose,
  currentGoal,
  onSave,
}: QuestionGoalModalProps) {
  const [value, setValue] = useState(String(currentGoal));
  const [error, setError] = useState<string | null>(null);

  const syncFromGoal = useCallback(() => {
    setValue(String(currentGoal));
    setError(null);
  }, [currentGoal]);

  useEffect(() => {
    if (open) syncFromGoal();
  }, [open, syncFromGoal]);

  const validate = useCallback((): number | null => {
    const trimmed = value.trim();
    if (trimmed === '') {
      setError('Enter a number');
      return null;
    }
    const n = parseInt(trimmed, 10);
    if (!Number.isFinite(n)) {
      setError('Must be a valid number');
      return null;
    }
    if (n < MIN_GOAL || n > MAX_GOAL) {
      setError(`Between ${MIN_GOAL.toLocaleString()} and ${MAX_GOAL.toLocaleString()}`);
      return null;
    }
    setError(null);
    return n;
  }, [value]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const n = validate();
      if (n != null) {
        onSave(n);
        onClose();
      }
    },
    [validate, onSave, onClose]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setError(null);
  }, []);

  return (
    <Modal open={open} onClose={onClose} title="Question goal" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Set a target number of questions to answer. Your progress toward this goal appears on the dashboard.
        </p>
        <div>
          <label htmlFor="goal-input" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
            Goal (questions)
          </label>
          <input
            id="goal-input"
            type="number"
            min={MIN_GOAL}
            max={MAX_GOAL}
            step={1}
            value={value}
            onChange={handleChange}
            aria-invalid={error != null}
            aria-describedby={error ? 'goal-error' : undefined}
            className="input w-full text-[var(--color-text-primary)]"
            autoFocus
          />
          {error && (
            <p id="goal-error" className="mt-1.5 text-sm text-[var(--color-error)]" role="alert">
              {error}
            </p>
          )}
          <p className="mt-1.5 text-xs text-[var(--color-text-tertiary)]">
            {MIN_GOAL.toLocaleString()}–{MAX_GOAL.toLocaleString()}
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-secondary px-4 py-2 rounded-md focus-ring">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary px-4 py-2 rounded-md focus-ring">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
