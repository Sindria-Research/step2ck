import { useState, useCallback } from 'react';
import { Target, BookOpen, ChevronRight, ChevronLeft, X, Calendar } from 'lucide-react';
import { api } from '../../api/api';
import { DatePicker } from '../common/DatePicker';

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const GOAL_PRESETS = [20, 40, 60, 80];

export function OnboardingModal({ open, onClose, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [examDate, setExamDate] = useState('');
  const [targetScore, setTargetScore] = useState(240);
  const [dailyGoal, setDailyGoal] = useState(40);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await api.studyProfile.update({
        exam_date: examDate || null,
        target_score: targetScore,
        daily_question_goal: dailyGoal,
      });
      onComplete();
    } catch {
      onComplete();
    } finally {
      setSaving(false);
    }
  }, [examDate, targetScore, dailyGoal, onComplete]);

  if (!open) return null;

  const steps = [
    {
      icon: Calendar,
      title: 'When is your exam?',
      subtitle: 'We\'ll build a timeline to keep you on track.',
      content: (
        <div className="flex flex-col items-center gap-4">
          <DatePicker
            value={examDate}
            onChange={setExamDate}
            min={new Date().toISOString().split('T')[0]}
            placeholder="mm/dd/yyyy"
          />
          <p className="text-xs text-[var(--color-text-muted)]">You can always change this later in Settings.</p>
        </div>
      ),
    },
    {
      icon: Target,
      title: 'Target score?',
      subtitle: 'Set a goal to aim for. The average is around 245.',
      content: (
        <div className="flex flex-col items-center gap-5">
          <div className="text-5xl font-semibold font-display tabular-nums text-[var(--color-text-primary)]">
            {targetScore}
          </div>
          <input
            type="range"
            min={200}
            max={290}
            step={5}
            value={targetScore}
            onChange={(e) => setTargetScore(Number(e.target.value))}
            className="w-full max-w-xs accent-[var(--color-brand-blue)]"
          />
          <div className="flex justify-between w-full max-w-xs text-xs text-[var(--color-text-muted)]">
            <span>200</span>
            <span>290</span>
          </div>
        </div>
      ),
    },
    {
      icon: BookOpen,
      title: 'Daily question goal?',
      subtitle: 'How many questions do you want to answer each day?',
      content: (
        <div className="flex flex-col items-center gap-5">
          <div className="grid grid-cols-4 gap-3 w-full max-w-xs">
            {GOAL_PRESETS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setDailyGoal(g)}
                className={`py-3 rounded-lg border text-sm font-semibold transition-all ${
                  dailyGoal === g
                    ? 'border-[var(--color-brand-blue)] bg-[color-mix(in_srgb,var(--color-brand-blue)_12%,transparent)] text-[var(--color-brand-blue)]'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">Custom:</span>
            <input
              type="number"
              min={1}
              max={500}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Math.max(1, Math.min(500, Number(e.target.value))))}
              className="w-20 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-center text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
            />
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden animate-fade-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors z-10"
          aria-label="Skip onboarding"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step indicator */}
        <div className="flex gap-1.5 px-8 pr-14 pt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-[var(--color-brand-blue)]' : 'bg-[var(--color-border)]'
              }`}
            />
          ))}
        </div>

        <div className="px-8 pt-8 pb-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[color-mix(in_srgb,var(--color-brand-blue)_12%,transparent)] flex items-center justify-center">
            <Icon className="w-6 h-6 text-[var(--color-brand-blue)]" />
          </div>
          <h2 className="text-xl font-semibold font-display text-[var(--color-text-primary)] mb-1">
            {current.title}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-8">
            {current.subtitle}
          </p>
          {current.content}
        </div>

        <div className="flex items-center justify-between px-8 pb-6">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="chiron-btn chiron-btn-primary px-6 py-2.5 rounded-lg text-sm font-medium"
            >
              {saving ? 'Saving...' : 'Get Started'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              className="chiron-btn chiron-btn-primary px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
