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
  Filter,
  Gauge,
} from 'lucide-react';
import { api } from '../api/api';
import type { ProgressStats, ProgressRecord, DailySummary } from '../api/types';
import { Skeleton, SkeletonCard, EmptyState, CircularProgress } from '../components/common';
import { QuestionGoalModal } from '../components/dashboard/QuestionGoalModal';
import { useQuestionGoal } from '../hooks/useQuestionGoal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { ProgressChart } from '../components/analytics/ProgressChart';
import { SectionBreakdown } from '../components/analytics/SectionBreakdown';
import { OnboardingModal } from '../components/onboarding/OnboardingModal';

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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const dashRef = useRef<HTMLDivElement>(null);

  const welcomeName =
    user?.display_name?.trim() || user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    if (!user) return;
    const dismissed = sessionStorage.getItem('onboarding_dismissed');
    if (dismissed) return;
    api.studyProfile.get()
      .then((p) => {
        if (!p.exam_date && !p.target_score) setShowOnboarding(true);
      })
      .catch(() => {});
  }, [user]);

  const fetchStats = useCallback(() => {
    let cancelled = false;
    if (!dashboardHasLoadedOnce) setLoading(true);
    if (!dashboardHasLoadedOnce) setLoading(true);

    Promise.all([
      api.progress.stats(),
      api.progress.list(),
      api.progress.dailySummary().catch(() => null),
    ])
      .then(([statsData, historyData, daily]) => {
        if (!cancelled) {
          setStats(statsData);
          setHistory(historyData);
          if (daily) setDailySummary(daily);
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
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Left mockup: key stats in a progress-grid style */}
            <div className="chiron-mockup">
              <p className="chiron-mockup-label mb-4">Performance</p>
              <div className="grid grid-cols-2 gap-3">
                <OverviewStat label="Questions" value={total} icon={BookOpen} color="var(--color-brand-blue)" animate={!loading} />
                <OverviewStat label="Correct" value={correct} icon={CheckCircle2} color="var(--color-success)" animate={!loading} />
                <OverviewStat label="Incorrect" value={incorrect} icon={XCircle} color="var(--color-error)" animate={!loading} />
                <OverviewStat label="Accuracy" value={hasData ? `${accuracy}%` : '—'} icon={TrendingUp} color="var(--color-brand-blue)" animate={!loading} />
              </div>
            </div>

            {/* Right mockup: today's progress */}
            <div className="chiron-mockup flex flex-col">
              <p className="chiron-mockup-label mb-4">Today&apos;s Progress</p>
              {dailySummary ? (
                <>
                  <div className="flex-1 flex items-center gap-5">
                    <CircularProgress
                      value={dailySummary.daily_goal > 0 ? Math.min(100, Math.round((dailySummary.today_count / dailySummary.daily_goal) * 100)) : 0}
                      label=""
                      centerLabel={`${dailySummary.today_count}/${dailySummary.daily_goal}`}
                      color="var(--color-success)"
                      size={80}
                      strokeWidth={6}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-2xl font-semibold font-display tabular-nums text-[var(--color-text-primary)]">
                          {dailySummary.today_count}
                        </p>
                        {dailySummary.streak > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] text-[var(--color-warning)]">
                            🔥 {dailySummary.streak}d streak
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {dailySummary.today_count >= dailySummary.daily_goal ? 'Daily goal reached!' : `${dailySummary.daily_goal - dailySummary.today_count} more to hit your goal`}
                      </p>
                      <div className="flex gap-1 mt-3">
                        {dailySummary.history.slice(-7).map((day) => (
                          <div
                            key={day.date}
                            title={`${day.date}: ${day.count} questions`}
                            className={`w-5 h-5 rounded-sm transition-colors ${
                              day.count === 0
                                ? 'bg-[var(--color-bg-tertiary)]'
                                : day.met_goal
                                  ? 'bg-[var(--color-success)]'
                                  : 'bg-[color-mix(in_srgb,var(--color-success)_40%,var(--color-bg-tertiary))]'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[0.6rem] text-[var(--color-text-muted)] mt-1">Last 7 days</p>
                    </div>
                  </div>
                  <div className="mt-4 chiron-mockup-meta">
                    <button
                      type="button"
                      onClick={() => setGoalModalOpen(true)}
                      className="text-xs font-medium text-[var(--color-brand-blue)] hover:underline transition-colors"
                    >
                      Change goal
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center gap-5">
                  <CircularProgress
                    value={goalPct}
                    label=""
                    centerLabel={`${total}/${goal}`}
                    color="var(--color-success)"
                    size={80}
                    strokeWidth={6}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-semibold font-display tabular-nums text-[var(--color-text-primary)]">
                      {goalPct}%
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      {total} of {goal} questions answered
                    </p>
                    <div className="chiron-meter-track mt-3">
                      <div className="chiron-meter-fill" style={{ width: `${goalPct}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Analytics Stripe ── */}
      <section className="py-12 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-primary)_94%,transparent)] chiron-page-enter" style={{ '--page-enter-order': 2 } as React.CSSProperties}>
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="chiron-feature-label">Analytics</p>
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

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="chiron-mockup">
              <p className="chiron-mockup-label mb-4">Performance Trend</p>
              <ProgressChart history={filteredHistory} className="h-full" />
            </div>
            <div className="chiron-mockup">
              <p className="chiron-mockup-label mb-4">Section Performance</p>
              <SectionBreakdown sections={bySection} className="h-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Readiness Score Stripe ── */}
      {hasData && stats && (
        <section className="py-14 border-t border-[var(--color-border)] chiron-page-enter" style={{ '--page-enter-order': 3 } as React.CSSProperties}>
          <div className="container">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="chiron-mockup flex flex-col items-center text-center py-6">
                <div className="flex items-center gap-2 mb-4">
                  <Gauge className="w-4 h-4 text-[var(--color-brand-blue)]" />
                  <p className="chiron-mockup-label">Readiness Score</p>
                </div>
                <CircularProgress
                  value={stats.readiness_score}
                  label=""
                  centerLabel={`${stats.readiness_score}`}
                  color={
                    stats.readiness_score >= 70
                      ? 'var(--color-success)'
                      : stats.readiness_score >= 40
                        ? 'var(--color-warning)'
                        : 'var(--color-error)'
                  }
                  size={100}
                  strokeWidth={8}
                />
                <p className="text-sm text-[var(--color-text-secondary)] mt-4 max-w-xs">
                  {stats.readiness_score >= 70
                    ? 'You\'re making strong progress. Keep it up!'
                    : stats.readiness_score >= 40
                      ? 'Good start. Focus on weak areas to improve faster.'
                      : 'Early stages. Keep practicing consistently.'}
                </p>
              </div>

              <div className="chiron-mockup">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-[var(--color-warning)]" />
                  <p className="chiron-mockup-label">Weak Areas</p>
                </div>
                {stats.weak_areas.length > 0 ? (
                  <div className="space-y-3">
                    {stats.weak_areas.slice(0, 5).map((area) => (
                      <div key={area.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-[var(--color-text-primary)]">{area.name}</span>
                          <span className="text-xs tabular-nums text-[var(--color-error)]">{area.accuracy}%</span>
                        </div>
                        <div className="chiron-meter-track">
                          <div className="chiron-meter-fill bg-[var(--color-error)]" style={{ width: `${area.accuracy}%` }} />
                        </div>
                        <p className="mt-1 text-[0.6rem] text-[var(--color-text-muted)]">
                          Practice {Math.max(10, 20 - Math.floor(area.total / 5))} more questions to improve
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    {total >= 50
                      ? 'No weak areas detected. Great job!'
                      : 'Answer more questions to identify weak areas (10+ per section).'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Section Performance Stripe ── */}
      {hasData && bySection.length > 0 && (
        <section className="py-14 border-t border-[var(--color-border)] chiron-page-enter" style={{ '--page-enter-order': 4 } as React.CSSProperties}>
          <div className="container">
            <div className="grid md:grid-cols-[0.35fr_0.65fr] gap-12 items-start">
              <div>
                <p className="chiron-feature-label">Breakdown</p>
                <h2 className="chiron-feature-heading">Performance by section</h2>
                <p className="chiron-feature-body mt-4">
                  Identifying weak spots is the fastest way to improve. Focus your review on sections with high volume but lower accuracy.
                </p>

                {focusAreas.length > 0 && (
                  <div className="chiron-mockup mt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-4 h-4 text-[var(--color-warning)]" />
                      <p className="chiron-mockup-label">Focus areas</p>
                    </div>
                    <div className="space-y-4">
                      {focusAreas.map((s) => (
                        <div key={s.name}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-[var(--color-text-primary)]">{s.name}</span>
                            <span className="text-xs tabular-nums text-[var(--color-text-tertiary)]">{s.accuracy}%</span>
                          </div>
                          <div className="chiron-meter-track">
                            <div className="chiron-meter-fill" style={{ width: `${s.accuracy}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {focusAreas.length === 0 && (
                  <p className="text-sm text-[var(--color-text-tertiary)] mt-6">
                    Answer 5+ questions per section to see focus areas.
                  </p>
                )}
              </div>

              <div className="chiron-mockup">
                <p className="chiron-mockup-label mb-4">All Sections</p>
                <div className="chiron-progress-grid">
                  {bySection.map((s) => {
                    const acc = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                    return (
                      <div key={s.name} className="chiron-progress-row">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-[var(--color-text-primary)]">{s.name}</span>
                          <span className="text-xs tabular-nums text-[var(--color-text-tertiary)]">{acc}%</span>
                        </div>
                        <div className="chiron-meter-track">
                          <div className="chiron-meter-fill" style={{ width: `${acc}%` }} />
                        </div>
                        <p className="mt-1 text-[0.68rem] text-[var(--color-text-muted)]">
                          {s.correct}/{s.total} answered
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Actions / Utilities Stripe ── */}
      <section className="py-14 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-primary)_94%,transparent)] chiron-page-enter" style={{ '--page-enter-order': 5 } as React.CSSProperties}>
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="chiron-feature-label">Utilities</p>
              <h2 className="chiron-feature-heading">Quick actions</h2>
              <p className="chiron-feature-body mt-2">
                Jump straight to key tools.
              </p>
            </div>

            <div className="chiron-mockup space-y-2">
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
        <section className="py-14 border-t border-[var(--color-border)] chiron-page-enter" style={{ '--page-enter-order': 6 } as React.CSSProperties}>
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

      <OnboardingModal
        open={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          sessionStorage.setItem('onboarding_dismissed', '1');
        }}
        onComplete={() => {
          setShowOnboarding(false);
          sessionStorage.setItem('onboarding_dismissed', '1');
        }}
      />
    </div>
  );
}

function OverviewStat({
  label,
  value,
  icon: Icon,
  color,
  animate = true,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  animate?: boolean;
}) {
  const numericTarget = typeof value === 'number' ? value : 0;
  const isNumeric = typeof value === 'number';
  const animatedValue = useCountUp(numericTarget, 800, animate && isNumeric);

  return (
    <div className="chiron-progress-row flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, var(--color-bg-primary))` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>
        <p className="text-xl font-semibold font-display tabular-nums tracking-tight text-[var(--color-text-primary)]">
          {isNumeric ? animatedValue : value}
        </p>
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
