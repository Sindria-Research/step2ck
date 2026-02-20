import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  Activity,
  Filter,
  Layers,
  Play,
  Flame,
} from 'lucide-react';
import { api } from '../api/api';
import type { ProgressStats, ProgressRecord, DailySummary, FlashcardStatsResponse } from '../api/types';
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
  const [fcStats, setFcStats] = useState<FlashcardStatsResponse | null>(null);
  const dashRef = useRef<HTMLDivElement>(null);

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

    Promise.all([
      api.progress.stats(),
      api.progress.list(),
      api.progress.dailySummary().catch(() => null),
      api.flashcards.getStats().catch(() => null),
    ])
      .then(([statsData, historyData, daily, fc]) => {
        if (!cancelled) {
          setStats(statsData);
          setHistory(historyData);
          if (daily) setDailySummary(daily);
          if (fc) setFcStats(fc);
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
      <section
        className="relative z-[1] pt-6 pb-5 md:pt-14 md:pb-10 chiron-page-enter"
        style={{
          '--page-enter-order': 0,
          backgroundColor: 'var(--color-bg-secondary)',
          borderBottom: '1px solid var(--color-border)',
        } as React.CSSProperties}
      >
        <div className="container">
          <div className="max-w-4xl">
            <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[0.7rem] font-bold tracking-wider text-[var(--color-text-secondary)] uppercase mb-4 shadow-sm">
              Dashboard
            </span>
            <h1 className="text-2xl md:text-4xl lg:text-[2.75rem] font-semibold text-[var(--color-text-primary)] font-display tracking-tight leading-[1.08]">
              Your Performance Dashboard
            </h1>
            <p className="mt-2 md:mt-3 text-sm md:text-base text-[var(--color-text-secondary)] max-w-xl leading-relaxed">
              {hasData
                ? dailySummary
                  ? dailySummary.today_count > 0
                    ? `You're ${dailySummary.today_count} question${dailySummary.today_count === 1 ? '' : 's'} into today's plan.${dailySummary.streak > 1 ? ` ${dailySummary.streak}-day streak — keep going.` : ' Consistency builds mastery.'}`
                    : 'Pick up where you left off. Consistency builds mastery.'
                  : 'Here is a breakdown of your preparation.'
                : 'Start a test to track your Step 2 CK preparation.'}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 mt-5 md:mt-6">
              <button
                type="button"
                onClick={() => navigate('/exam/config')}
                className="chiron-btn chiron-btn-primary px-5 py-2.5 md:px-6 md:py-3 rounded-md focus-ring inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold"
              >
                New test
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/lab-values')}
                className="px-4 py-2.5 rounded-md focus-ring whitespace-nowrap text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Lab values
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Stripe ── */}
      <section className="py-8 md:py-12 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-primary)_94%,transparent)] chiron-page-enter" style={{ '--page-enter-order': 1 } as React.CSSProperties}>
        <div className="container">
          <div className="mb-5 md:mb-8">
            <p className="chiron-feature-label">Overview</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-5">
            {/* Today's Progress — dominant card */}
            <div
              className="chiron-mockup flex flex-col"
              style={{
                boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                backgroundColor: 'var(--color-bg-primary)',
                padding: '1.5rem',
              }}
            >
              <p className="chiron-mockup-label mb-4">Today&apos;s Progress</p>
              {dailySummary ? (() => {
                const todayGoalPct = dailySummary.daily_goal > 0 ? Math.min(100, Math.round((dailySummary.today_count / dailySummary.daily_goal) * 100)) : 0;
                const goalMet = dailySummary.today_count >= dailySummary.daily_goal && dailySummary.daily_goal > 0;
                const remaining = Math.max(0, dailySummary.daily_goal - dailySummary.today_count);
                return (
                  <>
                    <div className="flex-1 flex items-center gap-5">
                      <CircularProgress
                        value={todayGoalPct}
                        label=""
                        centerLabel={`${dailySummary.today_count}/${dailySummary.daily_goal}`}
                        color={goalMet ? 'var(--color-success)' : 'var(--color-brand-blue)'}
                        size={96}
                        strokeWidth={8}
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
                        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                          {goalMet
                            ? 'Daily goal reached!'
                            : `You're ${remaining} question${remaining === 1 ? '' : 's'} from your goal.`}
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
                );
              })() : (
                <div className="flex-1 flex items-center gap-5">
                  <CircularProgress
                    value={goalPct}
                    label=""
                    centerLabel={`${total}/${goal}`}
                    color="var(--color-brand-blue)"
                    size={96}
                    strokeWidth={8}
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

            {/* Performance — compact, secondary card */}
            <div className="chiron-mockup" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
              <p className="chiron-mockup-label mb-4">Performance</p>
              <div className="grid grid-cols-2 gap-3">
                <OverviewStat label="Questions" value={total} icon={BookOpen} color="var(--color-brand-blue)" animate={!loading} />
                <OverviewStat label="Correct" value={correct} icon={CheckCircle2} color="var(--color-success)" animate={!loading} />
                <OverviewStat label="Incorrect" value={incorrect} icon={XCircle} color="var(--color-error)" animate={!loading} />
                <OverviewStat label="Accuracy" value={hasData ? `${accuracy}%` : '—'} icon={TrendingUp} color="var(--color-brand-blue)" animate={!loading} />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── Analytics Stripe ── */}
      <section className="py-8 md:py-12 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-primary)_94%,transparent)] chiron-page-enter" style={{ '--page-enter-order': 3 } as React.CSSProperties}>
        <div className="container">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 md:mb-8">
            <div>
              <p className="chiron-feature-label">Analytics</p>
            </div>

            {filteredHistory.length > 0 && (
              <div className="relative group z-10">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                </div>
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="w-full sm:w-auto pl-9 pr-8 py-2.5 sm:py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm font-medium text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)] appearance-none cursor-pointer hover:border-[var(--color-border-hover)] sm:min-w-[180px]"
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
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
            <div className="chiron-mockup" style={{ padding: filteredHistory.length < 10 ? undefined : '1rem 1rem 0.75rem' }}>
              <p className="chiron-mockup-label mb-3">Performance Trend</p>
              {filteredHistory.length < 10 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Activity className="w-8 h-8 text-[var(--color-text-muted)] mb-3 opacity-40" />
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Answer 10+ questions to unlock trend analytics.
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {filteredHistory.length > 0 ? `${filteredHistory.length} of 10 answered` : 'Start a test to begin tracking'}
                  </p>
                </div>
              ) : (
                <ProgressChart history={filteredHistory} className="h-full" />
              )}
            </div>
            <div className="chiron-mockup" style={{ padding: bySection.length > 0 ? '1rem 1rem 0.75rem' : undefined }}>
              <p className="chiron-mockup-label mb-3">Section Performance</p>
              <SectionBreakdown sections={bySection} className="h-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Readiness Score Stripe ── */}
      {hasData && stats && (
        <section className="py-8 md:py-14 border-t border-[var(--color-border)] chiron-page-enter" style={{ '--page-enter-order': 4 } as React.CSSProperties}>
          <div className="container">
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <div
                className="chiron-mockup flex flex-col items-center text-center py-8"
                style={{
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                  backgroundColor: 'var(--color-bg-primary)',
                }}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-blue)] mb-5">
                  Readiness Score
                </p>
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
                  size={130}
                  strokeWidth={10}
                />
                <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-5 max-w-xs">
                  {stats.readiness_score >= 70
                    ? 'You\'re making strong progress. Keep it up!'
                    : stats.readiness_score >= 40
                      ? 'Good start. Focus on weak areas to improve faster.'
                      : 'Early stages. Keep practicing consistently.'}
                </p>
              </div>

              <div className="chiron-mockup" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-[var(--color-warning)]" />
                  <p className="chiron-mockup-label">Weak Areas</p>
                </div>
                {stats.weak_areas.length > 0 ? (
                  <div className="space-y-4">
                    {stats.weak_areas.slice(0, 5).map((area) => (
                      <div key={area.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-[var(--color-text-primary)]">{area.name}</span>
                          <span className="text-xs tabular-nums font-semibold" style={{
                            color: area.accuracy < 40 ? 'var(--color-error)' : area.accuracy < 70 ? 'var(--color-warning)' : 'var(--color-text-secondary)'
                          }}>{area.accuracy}%</span>
                        </div>
                        <div className="chiron-meter-track">
                          <div className="chiron-meter-fill" style={{
                            width: `${area.accuracy}%`,
                            backgroundColor: area.accuracy < 40 ? 'var(--color-error)' : area.accuracy < 70 ? 'var(--color-warning)' : 'var(--color-brand-blue)',
                          }} />
                        </div>
                        <p className="mt-1 text-[0.6rem] text-[var(--color-text-muted)]">
                          Practice {Math.max(10, 20 - Math.floor(area.total / 5))} more questions to improve
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertTriangle className="w-8 h-8 text-[var(--color-text-muted)] mb-3 opacity-30" />
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                      {total >= 50
                        ? 'No weak areas detected. Great job!'
                        : 'No weak areas identified yet'}
                    </p>
                    {total < 50 && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        Answer 10+ per section to unlock diagnostics
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Section Performance Stripe ── */}
      {hasData && bySection.length > 0 && (
        <section className="py-8 md:py-14 border-t border-[var(--color-border)] chiron-page-enter" style={{ '--page-enter-order': 5 } as React.CSSProperties}>
          <div className="container">
            <div className="grid md:grid-cols-[0.35fr_0.65fr] gap-6 md:gap-12 items-start">
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
                            <span className="text-xs tabular-nums font-semibold" style={{
                              color: s.accuracy < 40 ? 'var(--color-error)' : s.accuracy < 70 ? 'var(--color-warning)' : 'var(--color-success)'
                            }}>{s.accuracy}%</span>
                          </div>
                          <div className="chiron-meter-track">
                            <div className="chiron-meter-fill" style={{
                              width: `${s.accuracy}%`,
                              backgroundColor: s.accuracy < 40 ? 'var(--color-error)' : s.accuracy < 70 ? 'var(--color-warning)' : 'var(--color-brand-blue)',
                            }} />
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

              <div className="chiron-mockup" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <p className="chiron-mockup-label mb-5">All Sections</p>
                <div className="space-y-5">
                  {bySection.map((s) => {
                    const acc = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                    const barColor = acc === 0 ? 'var(--color-text-muted)' : acc < 40 ? 'var(--color-error)' : acc < 70 ? 'var(--color-warning)' : 'var(--color-success)';
                    return (
                      <div key={s.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-[var(--color-text-primary)]">{s.name}</span>
                          <span className="text-xs tabular-nums font-semibold" style={{ color: barColor }}>{acc}%</span>
                        </div>
                        <div className="chiron-meter-track" style={{ opacity: 0.85 }}>
                          <div className="chiron-meter-fill" style={{ width: `${Math.max(acc, 2)}%`, backgroundColor: barColor }} />
                        </div>
                        <p className="mt-1 text-[0.68rem] text-[var(--color-text-muted)]">
                          {s.correct}/{s.total} correct
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

      {/* ── Flashcard Progress Stripe ── */}
      {fcStats && fcStats.total_cards > 0 && (
        <section className="py-8 md:py-14 border-t border-[var(--color-border)] chiron-page-enter" style={{ '--page-enter-order': 6 } as React.CSSProperties}>
          <div className="container">
            <div className="grid md:grid-cols-[0.35fr_0.65fr] gap-6 md:gap-12 items-start">
              <div>
                <p className="chiron-feature-label">Retention</p>
                <h2 className="chiron-feature-heading">Flashcard progress</h2>
                <p className="chiron-feature-body mt-4">
                  Spaced repetition drives long-term retention. Review your cards daily to build and maintain streaks.
                </p>
                {fcStats.reviews_streak > 0 && (
                  <div className="flex items-center gap-2 mt-6 px-4 py-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-semibold text-orange-500">{fcStats.reviews_streak} day streak</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/flashcards')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg btn-primary text-sm font-medium transition-all focus-ring mt-6"
                >
                  <Play className="w-4 h-4" />
                  Review cards
                </button>
              </div>

              <div className="space-y-4">
                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Today', value: String(fcStats.reviews_today), color: 'var(--color-brand-blue)' },
                    { label: 'Retention', value: `${fcStats.retention_rate}%`, color: 'var(--color-success)' },
                    { label: 'Total reviews', value: String(fcStats.total_reviews), color: 'var(--color-text-secondary)' },
                    { label: 'Avg ease', value: fcStats.average_ease.toFixed(2), color: 'var(--color-text-secondary)' },
                  ].map((s) => (
                    <div key={s.label} className="chiron-mockup text-center" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{s.label}</p>
                      <p className="text-xl font-semibold tabular-nums mt-1" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Card distribution */}
                <div className="chiron-mockup" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                    <p className="chiron-mockup-label">Card breakdown</p>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: 'New', count: fcStats.cards_new, color: 'var(--color-brand-blue)' },
                      { label: 'Young', count: fcStats.cards_young, color: 'var(--color-success)' },
                      { label: 'Mature', count: fcStats.cards_mature, color: '#10b981' },
                      ...(fcStats.cards_suspended > 0 ? [{ label: 'Suspended', count: fcStats.cards_suspended, color: 'var(--color-error)' }] : []),
                    ].map((item) => {
                      const pct = fcStats.total_cards > 0 ? Math.round((item.count / fcStats.total_cards) * 100) : 0;
                      return (
                        <div key={item.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-[var(--color-text-primary)]">{item.label}</span>
                            <span className="text-xs tabular-nums text-[var(--color-text-muted)]">{item.count} ({pct}%)</span>
                          </div>
                          <div className="chiron-meter-track">
                            <div className="chiron-meter-fill" style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: item.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 14-day review history */}
                {fcStats.daily_reviews_history.length > 0 && (
                  <div className="chiron-mockup" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                    <p className="chiron-mockup-label mb-3">Reviews (last 14 days)</p>
                    <div className="flex items-end gap-1 h-24">
                      {fcStats.daily_reviews_history.map((day) => {
                        const maxCount = Math.max(...fcStats.daily_reviews_history.map((d) => d.count), 1);
                        const height = day.count > 0 ? Math.max((day.count / maxCount) * 100, 4) : 2;
                        return (
                          <div
                            key={day.date}
                            className="flex-1 flex flex-col items-center justify-end gap-1"
                            title={`${day.date}: ${day.count} reviews`}
                          >
                            <div
                              className="w-full rounded-t transition-all"
                              style={{
                                height: `${height}%`,
                                backgroundColor: day.count > 0 ? 'var(--color-brand-blue)' : 'var(--color-bg-tertiary)',
                                minHeight: '2px',
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[0.55rem] text-[var(--color-text-muted)]">
                        {fcStats.daily_reviews_history[0]?.date.slice(5)}
                      </span>
                      <span className="text-[0.55rem] text-[var(--color-text-muted)]">
                        {fcStats.daily_reviews_history[fcStats.daily_reviews_history.length - 1]?.date.slice(5)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

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
