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
} from 'lucide-react';
import { api } from '../api/api';
import type { ProgressStats } from '../api/types';
import { Skeleton, SkeletonCard, EmptyState, CircularProgress } from '../components/common';
import { QuestionGoalModal } from '../components/dashboard/QuestionGoalModal';
import { useQuestionGoal } from '../hooks/useQuestionGoal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

let dashboardHasLoadedOnce = false;

export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { theme: _ } = useTheme();
  const [goal, setGoal] = useQuestionGoal();
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dashRef = useRef<HTMLDivElement>(null);

  const welcomeName =
    user?.display_name?.trim() || user?.email?.split('@')[0] || 'there';

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

  useEffect(() => {
    const root = dashRef.current;
    if (!root || loading) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -4% 0px' }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [loading, stats]);

  const accuracy =
    stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="chiron-dash flex-1 overflow-y-auto">
        <div className="dash-glow dash-glow-one" aria-hidden />
        <div className="dash-glow dash-glow-two" aria-hidden />
        <div className="relative z-[1] p-6 md:p-10">
          <div className="max-w-[1100px] mx-auto">
            <div className="flex items-center justify-between mb-10">
              <Skeleton className="h-10 w-56" />
              <Skeleton className="h-11 w-36" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            <Skeleton className="h-72 w-full rounded-xl" />
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
        <div className="relative z-[1] p-6 md:p-10">
          <div className="max-w-[1100px] mx-auto">
            <p className="text-[var(--color-text-secondary)]">{error}</p>
          </div>
        </div>
      </div>
    );
  }

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
    <div ref={dashRef} className="chiron-dash flex-1 overflow-y-auto">
      <div className="dash-glow dash-glow-one" aria-hidden />
      <div className="dash-glow dash-glow-two" aria-hidden />

      <div className="relative z-[1] pt-10 pb-12 px-6 md:px-10">
        <div className="max-w-[1100px] mx-auto">

          {/* ── Hero header ── */}
          <section className="chiron-reveal mb-10" data-reveal>
            <p className="chiron-kicker mb-5">Dashboard</p>
            <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-semibold text-[var(--color-text-primary)] font-display tracking-tight leading-[1.1]">
              {user ? <>Hey, {welcomeName}.</> : <>Your progress.</>}
            </h1>
            <p className="mt-4 text-base md:text-lg text-[var(--color-text-secondary)] max-w-lg leading-relaxed">
              {hasData
                ? 'Your preparation at a glance.'
                : 'Start a test to track your Step 2 CK preparation.'}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate('/exam/config')}
                className="chiron-btn chiron-btn-primary px-5 py-2.5 rounded-md focus-ring inline-flex items-center gap-2"
              >
                New test
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/lab-values')}
                className="chiron-btn chiron-btn-subtle px-5 py-2.5 rounded-md focus-ring"
              >
                Lab values
              </button>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <span className="chiron-stat-pill"><Clock3 className="w-3.5 h-3.5" /> {total} answered</span>
              <span className="chiron-stat-pill"><Target className="w-3.5 h-3.5" /> {accuracy}% accuracy</span>
              <span className="chiron-stat-pill"><Activity className="w-3.5 h-3.5" /> {goalPct}% of goal</span>
            </div>
          </section>

          {/* ── Stats grid ── */}
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8 chiron-reveal" data-reveal>
            <StatPanel label="Questions" value={total} icon={BookOpen} color="var(--color-brand-blue)" />
            <StatPanel label="Correct" value={correct} icon={CheckCircle2} color="var(--color-success)" />
            <StatPanel label="Incorrect" value={incorrect} icon={XCircle} color="var(--color-error)" />
            <StatPanel label="Accuracy" value={hasData ? `${accuracy}%` : '—'} icon={TrendingUp} color="var(--color-brand-blue)" />
            <div className="dash-panel flex flex-col items-center justify-center col-span-2 lg:col-span-1">
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
              >
                Change goal
              </button>
            </div>
          </section>

          {/* ── Section Performance ── */}
          {hasData && bySection.length > 0 && (
            <section className="dash-panel mb-8 chiron-reveal" data-reveal>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Performance by section
                  </h2>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                    Sorted by volume. Hover for details.
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
              <div>
                {bySection.map((s) => (
                  <SectionRow
                    key={s.name}
                    name={s.name}
                    correct={s.correct}
                    total={s.total}
                    maxTotal={maxSectionTotal}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Focus + Actions ── */}
          <div className="grid md:grid-cols-2 gap-3 mb-8">
            <div className="dash-panel chiron-reveal" data-reveal>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-[var(--color-warning)]" />
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Focus areas
                </h2>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
                Lowest accuracy sections (min 5 questions).
              </p>
              {focusAreas.length > 0 ? (
                <div className="space-y-3.5">
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

            <div className="dash-panel chiron-reveal chiron-reveal-delay-1" data-reveal>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                Quick actions
              </h2>
              <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
                Jump to test config or review lab values.
              </p>
              <div className="space-y-2">
                <ActionRow label="Configure test" onClick={() => navigate('/exam/config')} />
                <ActionRow label="Lab values" onClick={() => navigate('/lab-values')} icon={FlaskConical} />
                {hasData && focusAreas.length > 0 && (
                  <ActionRow label="Practice weak sections" onClick={() => navigate('/exam/config')} icon={Target} />
                )}
              </div>
            </div>
          </div>

          {/* ── Empty State ── */}
          {!hasData && (
            <section className="dash-panel chiron-reveal" data-reveal>
              <EmptyState
                icon={Target}
                title="No progress yet"
                description="Start a test to see your stats and analytics here."
                action={{ label: 'Start test', onClick: () => navigate('/exam/config') }}
              />
            </section>
          )}
        </div>
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

function StatPanel({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="dash-panel dash-panel-lift flex items-center gap-4">
      <div
        className="dash-stat-icon"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          {label}
        </p>
        <p className="text-xl font-semibold font-display tabular-nums leading-tight text-[var(--color-text-primary)]">
          {value}
        </p>
      </div>
    </div>
  );
}

function SectionRow({
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
  const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
  const barWidth = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  const correctPct = total > 0 ? (correct / total) * 100 : 0;

  return (
    <div
      className="dash-section-row"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="dash-section-name">{name}</span>
      <div className="relative flex-1">
        {hovered && (
          <div className="dash-section-tooltip">
            <span className="text-[var(--color-success)]">{correct} correct</span>
            <span className="text-[var(--color-text-muted)]">·</span>
            <span className="text-[var(--color-error)]">{incorrect} incorrect</span>
          </div>
        )}
        <div className="dash-section-bar" style={{ width: `${Math.max(barWidth, 4)}%` }}>
          {correct > 0 && (
            <div
              className="h-full bg-[var(--color-success)] transition-all duration-500"
              style={{ width: `${correctPct}%` }}
            />
          )}
          {incorrect > 0 && (
            <div
              className="h-full bg-[var(--color-error)] opacity-70 transition-all duration-500"
              style={{ width: `${100 - correctPct}%` }}
            />
          )}
        </div>
      </div>
      <div className="dash-section-acc">
        <span className="text-sm font-semibold text-[var(--color-text-primary)] tabular-nums">{acc}%</span>
        <span className="text-xs text-[var(--color-text-muted)] ml-1 tabular-nums">({total})</span>
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
    <button type="button" onClick={onClick} className="dash-action group">
      <span className="text-sm font-medium text-[var(--color-text-primary)]">{label}</span>
      <Icon className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-blue)] transition-colors" />
    </button>
  );
}
