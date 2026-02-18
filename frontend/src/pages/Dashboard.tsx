import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Target, TrendingUp, CheckCircle2, XCircle, BookOpen, ArrowRight } from 'lucide-react';
import { api } from '../api/api';
import type { ProgressStats } from '../api/types';
import { Skeleton, SkeletonCard, EmptyState, CircularProgress } from '../components/common';
import { QuestionGoalModal } from '../components/dashboard/QuestionGoalModal';
import { useQuestionGoal } from '../hooks/useQuestionGoal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

let dashboardHasLoadedOnce = false;

/* ------------------------------------------------------------------ */
/*  Custom tooltip for section bars                                    */
/* ------------------------------------------------------------------ */
function SectionTooltip({
  section,
  correct,
  incorrect,
  accuracy,
}: {
  section: string;
  correct: number;
  incorrect: number;
  accuracy: number;
}) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 pointer-events-none whitespace-nowrap">
      <div className="card rounded-lg px-3 py-2 text-xs shadow-md border border-[var(--color-border)]">
        <p className="font-semibold text-[var(--color-text-primary)] mb-1">{section}</p>
        <div className="flex items-center gap-3">
          <span className="text-[var(--color-success)]">{correct} correct</span>
          <span className="text-[var(--color-error)]">{incorrect} incorrect</span>
          <span className="font-medium text-[var(--color-text-primary)]">{accuracy}%</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section bar row                                                    */
/* ------------------------------------------------------------------ */
function SectionBar({
  name,
  correct,
  total,
  maxTotal,
}: {
  name: string;
  correct: number;
  total: number;
  maxTotal: number;
}) {
  const [hovered, setHovered] = useState(false);
  const incorrect = total - correct;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const barWidth = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  const correctPct = total > 0 ? (correct / total) * 100 : 0;

  return (
    <div
      className="group grid items-center gap-3 py-2"
      style={{ gridTemplateColumns: '140px 1fr 72px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="text-sm font-medium text-[var(--color-text-secondary)] truncate">
        {name}
      </span>

      <div className="relative">
        {hovered && (
          <SectionTooltip
            section={name}
            correct={correct}
            incorrect={incorrect}
            accuracy={accuracy}
          />
        )}
        <div
          className="h-6 rounded-md overflow-hidden flex transition-all duration-300"
          style={{ width: `${Math.max(barWidth, 4)}%` }}
        >
          {correct > 0 && (
            <div
              className="h-full bg-[var(--color-success)] transition-all duration-500"
              style={{ width: `${correctPct}%` }}
            />
          )}
          {incorrect > 0 && (
            <div
              className="h-full bg-[var(--color-error)] opacity-80 transition-all duration-500"
              style={{ width: `${100 - correctPct}%` }}
            />
          )}
        </div>
      </div>

      <div className="text-right tabular-nums">
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          {accuracy}%
        </span>
        <span className="text-xs text-[var(--color-text-muted)] ml-1">
          ({total})
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <div className="card rounded-lg flex items-center gap-4 p-4">
      <div
        className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{
          backgroundColor: accent
            ? `color-mix(in srgb, ${accent} 12%, transparent)`
            : 'var(--color-bg-tertiary)',
        }}
      >
        <Icon className="w-5 h-5" style={{ color: accent || 'var(--color-text-tertiary)' }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
          {label}
        </p>
        <p
          className="text-xl font-semibold font-display tabular-nums leading-tight"
          style={{ color: accent || 'var(--color-text-primary)' }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */
export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { theme: _ } = useTheme(); // subscribe so charts re-render on toggle
  const [goal, setGoal] = useQuestionGoal();
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const welcomeName = user?.display_name?.trim() || user?.email?.split('@')[0] || 'there';

  const fetchStats = useCallback(() => {
    let cancelled = false;
    if (!dashboardHasLoadedOnce) setLoading(true);
    api.progress
      .stats()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
          dashboardHasLoadedOnce = true;
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (location.pathname !== '/dashboard') {
      dashboardHasLoadedOnce = false;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== '/dashboard') return;
    const cancel = fetchStats();
    return cancel;
  }, [location.pathname, fetchStats]);

  useEffect(() => {
    if (location.pathname !== '/dashboard') return;
    const onFocus = () => {
      dashboardHasLoadedOnce = false;
      fetchStats();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [location.pathname, fetchStats]);

  const accuracy =
    stats && stats.total > 0
      ? Math.round((stats.correct / stats.total) * 100)
      : 0;

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--color-bg-secondary)]">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  /* ---- Error ---- */
  if (error) {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--color-bg-secondary)]">
        <div className="max-w-[1100px] mx-auto">
          <p className="text-[var(--color-text-secondary)]">{error}</p>
        </div>
      </div>
    );
  }

  /* ---- Derived data ---- */
  const bySection = [...(stats?.by_section ?? [])].sort((a, b) => b.total - a.total);
  const hasData = (stats?.total ?? 0) > 0;

  const focusAreas = [...(stats?.by_section ?? [])]
    .filter((s) => s.total >= 5)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);

  const total = stats?.total ?? 0;
  const correct = stats?.correct ?? 0;
  const incorrect = stats?.incorrect ?? 0;
  const maxSectionTotal = Math.max(...bySection.map((s) => s.total), 1);

  const goalPct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--color-bg-secondary)]">
      <div className="max-w-[1100px] mx-auto space-y-6">
        {/* ──────── Header ──────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] font-display tracking-tight">
              Dashboard
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-0.5">
              {user ? (
                <>Welcome, {welcomeName}. {hasData ? 'Your progress at a glance.' : 'Track your Step 2 CK preparation here.'}</>
              ) : (
                hasData ? 'Your progress at a glance.' : 'Track your Step 2 CK preparation here.'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/exam/config')}
            className="btn btn-primary self-start sm:self-center focus-ring px-5 py-2.5 rounded-md flex items-center gap-2"
          >
            New test
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* ──────── Stat cards + Goal ring ──────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Questions"
            value={total}
            icon={BookOpen}
            accent="var(--color-accent)"
          />
          <StatCard
            label="Correct"
            value={correct}
            icon={CheckCircle2}
            accent="var(--color-success)"
          />
          <StatCard
            label="Incorrect"
            value={incorrect}
            icon={XCircle}
            accent="var(--color-error)"
          />
          <StatCard
            label="Accuracy"
            value={hasData ? `${accuracy}%` : '—'}
            icon={TrendingUp}
            accent="var(--color-accent)"
          />

          {/* Goal ring */}
          <div className="card rounded-lg flex flex-col items-center justify-center p-4 col-span-2 lg:col-span-1">
            <CircularProgress
              value={goalPct}
              label="Question goal"
              centerLabel={`${total}/${goal}`}
              color="var(--color-success)"
              size={72}
              strokeWidth={6}
            />
            <button
              type="button"
              onClick={() => setGoalModalOpen(true)}
              className="mt-1.5 text-xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] focus-ring rounded transition-colors"
              aria-label="Change question goal"
            >
              Change goal
            </button>
          </div>
        </div>

        {/* ──────── Section Performance (the one comprehensive chart) ──────── */}
        {hasData && bySection.length > 0 && (
          <div className="card rounded-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Performance by section
                </h2>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  Sorted by volume. Hover a bar for details.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-success)]" />
                  <span className="text-[var(--color-text-tertiary)]">Correct</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-error)] opacity-80" />
                  <span className="text-[var(--color-text-tertiary)]">Incorrect</span>
                </span>
              </div>
            </div>

            <div className="divide-y divide-[var(--color-border)]">
              {bySection.map((s) => (
                <SectionBar
                  key={s.name}
                  name={s.name}
                  correct={s.correct}
                  total={s.total}
                  maxTotal={maxSectionTotal}
                />
              ))}
            </div>
          </div>
        )}

        {/* ──────── Focus areas + Quick actions ──────── */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card rounded-lg">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
              Focus areas
            </h2>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
              Lowest accuracy sections (min 5 questions answered).
            </p>
            {focusAreas.length > 0 ? (
              <ul className="space-y-0.5">
                {focusAreas.map((s) => (
                  <li
                    key={s.name}
                    className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)] last:border-0 last:pb-0"
                  >
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {s.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--color-error)]"
                          style={{ width: `${s.accuracy}%` }}
                        />
                      </div>
                      <span className="text-sm tabular-nums font-medium text-[var(--color-text-tertiary)] w-10 text-right">
                        {s.accuracy}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--color-text-tertiary)] py-4">
                Answer at least 5 questions per section to see focus areas.
              </p>
            )}
          </div>

          <div className="card rounded-lg">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
              Quick actions
            </h2>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
              Jump to test config or review lab values.
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate('/exam/config')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring group"
              >
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  Configure test
                </span>
                <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/lab-values')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring group"
              >
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  Lab values
                </span>
                <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
              </button>
              {hasData && focusAreas.length > 0 && (
                <button
                  type="button"
                  onClick={() => navigate('/exam/config')}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring group"
                >
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    Practice weak sections
                  </span>
                  <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ──────── Empty state ──────── */}
        {!hasData && (
          <div className="card rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)]">
            <EmptyState
              icon={Target}
              title="No progress yet"
              description="Start a test to see your stats and analytics here."
              action={{ label: 'Start test', onClick: () => navigate('/exam/config') }}
            />
          </div>
        )}
      </div>

      <QuestionGoalModal
        open={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        currentGoal={goal}
        onSave={setGoal}
      />
    </div>
  );
}
