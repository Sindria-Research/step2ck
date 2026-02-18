import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  BookOpen,
  ArrowRight,
  FlaskConical,
  AlertTriangle,
  Clock3,
  Activity,
  BarChart3,
  Filter,
} from 'lucide-react';
import { api } from '../api/api';
import type { ProgressStats, ProgressRecord } from '../api/types';
import { Skeleton, SkeletonCard, EmptyState, CircularProgress } from '../components/common';
import { QuestionGoalModal } from '../components/dashboard/QuestionGoalModal';
import { useQuestionGoal } from '../hooks/useQuestionGoal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { ProgressChart } from '../components/analytics/ProgressChart';
import { SectionBreakdown } from '../components/analytics/SectionBreakdown';

let dashboardHasLoadedOnce = false;

/** Animate a number from 0 → target over `duration` ms */
function useCountUp(target: number, duration = 800, enabled = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled || target === 0) { setValue(target); return; }
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);
  return value;
}

export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { theme: _ } = useTheme();
  const { addToast } = useToast();
  const [goal, setGoal] = useQuestionGoal();
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [history, setHistory] = useState<ProgressRecord[]>([]);
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dashRef = useRef<HTMLDivElement>(null);

  const welcomeName =
    user?.display_name?.trim() || user?.email?.split('@')[0] || 'there';

  const fetchStats = useCallback(() => {
    let cancelled = false;
    if (!dashboardHasLoadedOnce) setLoading(true);
    if (!dashboardHasLoadedOnce) setLoading(true);

    // Fetch stats and history
    Promise.all([
      api.progress.stats(),
      api.progress.list()
    ])
      .then(([statsData, historyData]) => {
        if (!cancelled) {
          setStats(statsData);
          setHistory(historyData);
          dashboardHasLoadedOnce = true;
        }
      })
      .catch((e) => {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Failed to load';
          setError(msg);
          addToast(msg, 'error');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (location.pathname !== '/dashboard') dashboardHasLoadedOnce = false;
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== '/dashboard') return;
    return fetchStats();
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
    stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="chiron-dash flex-1 overflow-y-auto">
        <div className="dash-glow dash-glow-one" aria-hidden />
        <div className="dash-glow dash-glow-two" aria-hidden />
        <div className="relative z-[1] py-10 md:py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-10">
              <Skeleton className="h-14 w-64 md:w-96" />
              <Skeleton className="h-11 w-36" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chiron-dash flex-1 overflow-y-auto">
        <div className="dash-glow dash-glow-one" aria-hidden />
        <div className="dash-glow dash-glow-two" aria-hidden />
        <div className="relative z-[1] py-10 md:py-16">
          <div className="container">
            <p className="text-[var(--color-text-secondary)]">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const bySection = [...(stats?.by_section ?? [])].sort((a, b) => b.total - a.total);

  // Filter history for charts
  const filteredHistory = sectionFilter === 'all'
    ? history
    : history.filter(h => h.section === sectionFilter);

  // Filter sections for dropdown
  const availableSections = Array.from(new Set(history.map(h => h.section).filter(Boolean))).sort();

  const hasData = (stats?.total ?? 0) > 0;
  const focusAreas = [...(stats?.by_section ?? [])]
    .filter((s) => s.total >= 5)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);
  const total = stats?.total ?? 0;
  const correct = stats?.correct ?? 0;
  const incorrect = stats?.incorrect ?? 0;
  const goalPct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;

  return (
    <div ref={dashRef} className="chiron-dash flex-1 overflow-y-auto">
      <div className="dash-glow dash-glow-one" aria-hidden />
      <div className="dash-glow dash-glow-two" aria-hidden />

      {/* ── Hero Stripe ── */}
      <section className="relative z-[1] pt-14 pb-16 md:pt-24 md:pb-24 chiron-page-enter" style={{ '--page-enter-order': 0 } as React.CSSProperties}>
        <div className="container">
          <div className="max-w-4xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[0.7rem] font-bold tracking-wider text-[var(--color-text-secondary)] uppercase mb-6 shadow-sm">
                  Dashboard
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-[var(--color-text-primary)] font-display tracking-tight leading-[1.04]">
                  {user ? <>Hey, {welcomeName}</> : <>Your progress.</>}
                </h1>
                <p className="mt-6 text-base md:text-lg text-[var(--color-text-secondary)] max-w-xl leading-relaxed">
                  {hasData
                    ? 'Here is a breakdown of your preparation.'
                    : 'Start a test to track your Step 2 CK preparation.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/exam/config')}
                  className="chiron-btn chiron-btn-primary px-5 py-2.5 rounded-md focus-ring inline-flex items-center gap-2 whitespace-nowrap"
                >
                  New test
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/lab-values')}
                  className="chiron-btn chiron-btn-subtle px-5 py-2.5 rounded-md focus-ring whitespace-nowrap"
                >
                  Lab values
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-primary)] rounded-full border border-[var(--color-border)] shadow-sm text-sm text-[var(--color-text-secondary)] font-medium">
                <Clock3 className="w-4 h-4 text-[var(--color-text-muted)]" />
                <span>{total} answered</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-primary)] rounded-full border border-[var(--color-border)] shadow-sm text-sm text-[var(--color-text-secondary)] font-medium">
                <Target className="w-4 h-4 text-[var(--color-text-muted)]" />
                <span>{accuracy}% accuracy</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-primary)] rounded-full border border-[var(--color-border)] shadow-sm text-sm text-[var(--color-text-secondary)] font-medium">
                <Activity className="w-4 h-4 text-[var(--color-text-muted)]" />
                <span>{goalPct}% of goal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Stripe ── */}
      <section className="py-14 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-primary)_94%,transparent)] chiron-page-enter" style={{ '--page-enter-order': 1 } as React.CSSProperties}>
        <div className="container">
          <div className="mb-8">
            <p className="chiron-feature-label">Overview</p>
            <h2 className="chiron-feature-heading">Current standing</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatPanel label="Questions" value={total} icon={BookOpen} color="var(--color-brand-blue)" stagger={0} animate={!loading} />
            <StatPanel label="Correct" value={correct} icon={CheckCircle2} color="var(--color-success)" stagger={1} animate={!loading} />
            <StatPanel label="Incorrect" value={incorrect} icon={XCircle} color="var(--color-error)" stagger={2} animate={!loading} />
            <StatPanel label="Accuracy" value={hasData ? `${accuracy}%` : '—'} icon={TrendingUp} color="var(--color-brand-blue)" stagger={3} animate={!loading} />

            {/* Goal Card */}
            <div className="dash-card dash-stat-stagger flex flex-col items-center justify-center p-6 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-sm hover:shadow-md transition-shadow" style={{ '--dash-stagger': 4 } as React.CSSProperties}>
              <CircularProgress
                value={goalPct}
                label=""
                centerLabel={`${total}/${goal}`}
                color="var(--color-success)"
                size={64}
                strokeWidth={5}
              />
              <div className="text-center mt-2">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Question Goal</p>
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(true)}
                  className="text-xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Change goal
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Analytics Stripe ── */}
      <section className="py-12 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-primary)_94%,transparent)] chiron-page-enter" style={{ '--page-enter-order': 2 } as React.CSSProperties}>
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] font-display">Analytics</h2>
            </div>

            <div className="relative group z-10">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              </div>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="pl-9 pr-8 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm font-medium text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)] appearance-none cursor-pointer hover:border-[var(--color-border-hover)] min-w-[180px]"
              >
                <option value="all">All Sections</option>
                {availableSections.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[var(--color-text-tertiary)]">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <ProgressChart history={filteredHistory} className="h-full" />
            <SectionBreakdown sections={bySection} className="h-full" />
          </div>
        </div>
      </section>

      {/* ── Section Performance Stripe ── */}
      {hasData && bySection.length > 0 && (
        <section className="py-14 border-t border-[var(--color-border)] chiron-page-enter" style={{ '--page-enter-order': 3 } as React.CSSProperties}>
          <div className="container">
            <div className="grid md:grid-cols-[0.35fr_0.65fr] gap-12 items-start">
              <div>
                <p className="chiron-feature-label">Breakdown</p>
                <h2 className="chiron-feature-heading">Performance by section</h2>
                <p className="chiron-feature-body mt-4">
                  Identifying weak spots is the fastest way to improve. Focus your review on sections with high volume but lower accuracy.
                </p>

                <div className="mt-8 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-[var(--color-warning)]" />
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Focus areas</h3>
                  </div>
                  {focusAreas.length > 0 ? (
                    <div className="space-y-4">
                      {focusAreas.map((s) => (
                        <div key={s.name}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-[var(--color-text-primary)]">
                              {s.name}
                            </span>
                            <span className="text-xs tabular-nums text-[var(--color-text-tertiary)]">
                              {s.accuracy}%
                            </span>
                          </div>
                          <div className="chiron-meter-track">
                            <div className="chiron-meter-fill" style={{ width: `${s.accuracy}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      Answer 5+ questions per section to see focus areas.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-secondary)]/30">
                  <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">All Sections</span>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                      <span className="text-[var(--color-text-tertiary)]">Correct</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-error)] opacity-80" />
                      <span className="text-[var(--color-text-tertiary)]">Incorrect</span>
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-[var(--color-border)]">
                  {bySection.map((s) => (
                    <SectionRow
                      key={s.name}
                      name={s.name}
                      correct={s.correct}
                      total={s.total}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Actions / Utilities Stripe ── */}
      <section className="py-14 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-primary)_94%,transparent)] chiron-page-enter" style={{ '--page-enter-order': 4 } as React.CSSProperties}>
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="chiron-feature-label">Utilities</p>
              <h2 className="chiron-feature-heading">Quick actions</h2>
              <p className="chiron-feature-body mt-2">
                Jump straight to key tools.
              </p>
            </div>

            <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-sm p-4 space-y-2">
              <ActionRow label="Configure new test" onClick={() => navigate('/exam/config')} />
              <ActionRow label="Reference lab values" onClick={() => navigate('/lab-values')} icon={FlaskConical} />
              {hasData && focusAreas.length > 0 && (
                <ActionRow label="Practice weak sections" onClick={() => navigate('/exam/config')} icon={Target} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Empty State Stripe (only if no data) ── */}
      {!hasData && (
        <section className="py-14 border-t border-[var(--color-border)] chiron-page-enter" style={{ '--page-enter-order': 5 } as React.CSSProperties}>
          <div className="container">
            <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-sm max-w-2xl mx-auto p-8">
              <EmptyState
                icon={Target}
                title="No progress yet"
                description="Start a test to see your stats and analytics here."
                action={{ label: 'Start test', onClick: () => navigate('/exam/config') }}
              />
            </div>
          </div>
        </section>
      )}

      <QuestionGoalModal
        open={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        currentGoal={goal}
        onSave={setGoal}
      />
    </div>
  );
}

function StatPanel({
  label,
  value,
  icon: Icon,
  color,
  stagger = 0,
  animate = true,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  stagger?: number;
  animate?: boolean;
}) {
  const numericTarget = typeof value === 'number' ? value : 0;
  const isNumeric = typeof value === 'number';
  const animatedValue = useCountUp(numericTarget, 800, animate && isNumeric);

  return (
    <div
      className="dash-card dash-stat-stagger bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-32"
      style={{ '--dash-stagger': stagger } as React.CSSProperties}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, var(--color-bg-primary))` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mt-1">
          {label}
        </p>
      </div>
      <div>
        <p className="text-3xl font-semibold font-display tabular-nums tracking-tight text-[var(--color-text-primary)]">
          {isNumeric ? animatedValue : value}
        </p>
      </div>
    </div>
  );
}

function SectionRow({
  name,
  correct,
  total,
}: {
  name: string;
  correct: number;
  total: number;
}) {
  const incorrect = total - correct;
  const acc = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Correct/Incorrect ratio within the bar
  const correctPct = total > 0 ? (correct / total) * 100 : 0;

  return (
    <div className="grid grid-cols-[140px_1fr_60px] gap-6 items-center px-6 py-3.5 hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
      <span className="text-sm font-medium text-[var(--color-text-secondary)] truncate" title={name}>{name}</span>

      {/* Progress Bar Container */}
      <div className="h-2.5 w-full bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden flex">
        {correct > 0 && (
          <div className="h-full bg-[var(--color-success)] dash-bar-fill" style={{ '--bar-target': `${correctPct}%` } as React.CSSProperties} />
        )}
        {incorrect > 0 && (
          <div className="h-full bg-[var(--color-error)] opacity-80 dash-bar-fill" style={{ '--bar-target': `${100 - correctPct}%` } as React.CSSProperties} />
        )}
      </div>

      <div className="text-right">
        <span className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">{acc}%</span>
        {/* <span className="text-xs text-[var(--color-text-muted)] ml-1 tabular-nums">({total})</span> */}
      </div>
    </div>
  );
}

function ActionRow({
  label,
  onClick,
  icon: Icon = ArrowRight,
}: {
  label: string;
  onClick: () => void;
  icon?: React.ElementType;
}) {
  return (
    <button type="button" onClick={onClick} className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors group text-left">
      <span className="text-sm font-medium text-[var(--color-text-primary)]">{label}</span>
      <Icon className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-blue)] transition-colors" />
    </button>
  );
}
