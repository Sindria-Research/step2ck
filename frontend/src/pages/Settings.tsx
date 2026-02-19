import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, CreditCard, User, Moon, Sun, Monitor, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/api';

export function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [targetScore, setTargetScore] = useState(240);
  const [dailyGoal, setDailyGoal] = useState(40);

  useEffect(() => {
    api.studyProfile.get()
      .then((p) => {
        if (p.exam_date) setExamDate(p.exam_date);
        if (p.target_score) setTargetScore(p.target_score);
        setDailyGoal(p.daily_question_goal);
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  const handleSaveProfile = useCallback(async () => {
    setProfileSaving(true);
    try {
      await api.studyProfile.update({
        exam_date: examDate || null,
        target_score: targetScore,
        daily_question_goal: dailyGoal,
      });
    } catch {}
    setProfileSaving(false);
  }, [examDate, targetScore, dailyGoal]);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--color-bg-secondary)]">
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/dashboard"
            className="p-2 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
            aria-label="Back to dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)] font-display tracking-tight">
              Settings
            </h1>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
              Account and preferences
            </p>
          </div>
        </div>

        {/* User / profile */}
        <section className="card rounded-lg mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <User className="w-5 h-5 text-[var(--color-text-tertiary)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Profile
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Your account information.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Email
              </p>
              <p className="text-sm text-[var(--color-text-primary)] mt-0.5">
                {user?.email ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Display name
              </p>
              <p className="text-sm text-[var(--color-text-primary)] mt-0.5">
                {user?.display_name ?? '—'}
              </p>
            </div>
          </div>
        </section>

        {/* Study Profile */}
        <section className="card rounded-lg mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <Target className="w-5 h-5 text-[var(--color-text-tertiary)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Study Profile
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Your exam date, target score, and daily goal.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--color-border)] space-y-4">
            {profileLoading ? (
              <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] block mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full max-w-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] block mb-1">
                    Target Score
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={200}
                      max={290}
                      step={5}
                      value={targetScore}
                      onChange={(e) => setTargetScore(Number(e.target.value))}
                      className="flex-1 max-w-xs accent-[var(--color-brand-blue)]"
                    />
                    <span className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)] w-10 text-right">{targetScore}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] block mb-1">
                    Daily Question Goal
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(Math.max(1, Math.min(500, Number(e.target.value))))}
                    className="w-24 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="chiron-btn chiron-btn-primary px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {profileSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </section>

        {/* Appearance */}
        <section className="card rounded-lg mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <Monitor className="w-5 h-5 text-[var(--color-text-tertiary)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Appearance
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Customize your interface theme.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--color-border)]">
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-md border text-sm font-medium transition-all ${theme === 'light'
                    ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] border-[var(--color-text-primary)]'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'
                  }`}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-md border text-sm font-medium transition-all ${theme === 'dark'
                    ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] border-[var(--color-text-primary)]'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'
                  }`}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
            </div>
          </div>
        </section>

        {/* Billing */}
        <section className="card rounded-lg mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[var(--color-text-tertiary)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Billing
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Manage your subscription and payment methods.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Billing is not yet available. It will appear here when enabled.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
