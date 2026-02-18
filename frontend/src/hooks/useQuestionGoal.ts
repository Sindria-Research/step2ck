import { useCallback, useState } from 'react';

const STORAGE_KEY = 'step2ck-question-goal';
const DEFAULT_GOAL = 100;

export function useQuestionGoal(): [number, (goal: number) => void] {
  const getStored = (): number => {
    if (typeof window === 'undefined') return DEFAULT_GOAL;
    const v = localStorage.getItem(STORAGE_KEY);
    const n = v ? parseInt(v, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_GOAL;
  };

  const [goal, setGoalState] = useState(() => getStored());

  const setGoal = useCallback((value: number) => {
    const n = Math.max(1, Math.min(10000, Math.round(value)));
    localStorage.setItem(STORAGE_KEY, String(n));
    setGoalState(n);
  }, []);

  return [goal, setGoal];
}
