import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock,
  Target,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  TrendingUp,
  Flame,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/api';
import type { StudyPlanData, StudyPlanWeek } from '../api/types';
import { EmptyState, Skeleton, SkeletonCard } from '../components/common';

const PHASE_STYLES: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  foundation: {
    label: 'Foundation',
    color: 'var(--color-error)',
    bg: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
    icon: BookOpen,
  },
  reinforcement: {
    label: 'Reinforcement',
    color: 'var(--color-warning)',
    bg: 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
    icon: TrendingUp,
  },
  review: {
    label: 'Review',
    color: 'var(--color-success)',
    bg: 'color-mix(in srgb, var(--color-success) 10%, transparent)',
    icon: CheckCircle2,
  },
};

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateLong(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function daysUntil(iso: string) {
  const target = new Date(iso + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

// ─── Calendar helpers ───

function getMonthDays(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getWeekForDate(dateISO: string, weeks: StudyPlanWeek[]): StudyPlanWeek | null {
  for (const w of weeks) {
    if (dateISO >= w.start && dateISO <= w.end) return w;
  }
  return null;
}

// ─── Study Plan Calendar ───

function StudyCalendar({ plan }: { plan: StudyPlanData }) {
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];

  const planStart = plan.weeks.length > 0 ? new Date(plan.weeks[0].start + 'T00:00:00') : today;
  const [viewYear, setViewYear] = useState(planStart.getFullYear());
  const [viewMonth, setViewMonth] = useState(planStart.getMonth());

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = getMonthDays(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const calendarCells = useMemo(() => {
    const cells: Array<{ day: number; iso: string; week: StudyPlanWeek | null; isToday: boolean; isExam: boolean }> = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toISO(viewYear, viewMonth, d);
      cells.push({
        day: d,
        iso,
        week: getWeekForDate(iso, plan.weeks),
        isToday: iso === todayISO,
        isExam: iso === plan.exam_date,
      });
    }
    return cells;
  }, [viewYear, viewMonth, daysInMonth, plan.weeks, plan.exam_date, todayISO]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="chiron-mockup">
      <div className="flex items-center justify-between mb-4">
        <p className="chiron-mockup-label">Calendar</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--color-text-tertiary)]" />
          </button>
          <span className="text-sm font-medium text-[var(--color-text-primary)] min-w-[140px] text-center">
            {monthName}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-[var(--color-text-tertiary)]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px">
        {weekDays.map((wd) => (
          <div key={wd} className="text-center text-[0.6rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)] py-2">
            {wd}
          </div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {calendarCells.map((cell) => {
          const phase = cell.week ? PHASE_STYLES[cell.week.phase] : null;
          return (
            <div
              key={cell.day}
              className={`relative flex items-center justify-center h-9 rounded-lg text-xs font-medium transition-colors
                ${cell.isToday ? 'ring-2 ring-[var(--color-brand-blue)] ring-offset-1 ring-offset-[var(--color-bg-primary)]' : ''}
                ${cell.isExam ? 'ring-2 ring-[var(--color-error)] ring-offset-1 ring-offset-[var(--color-bg-primary)]' : ''}
              `}
              style={{
                backgroundColor: phase ? phase.bg : undefined,
                color: cell.isToday
                  ? 'var(--color-brand-blue)'
                  : cell.isExam
                    ? 'var(--color-error)'
                    : phase
                      ? phase.color
                      : 'var(--color-text-tertiary)',
                fontWeight: cell.isToday || cell.isExam ? 700 : 500,
              }}
              title={
                cell.isExam
                  ? 'Exam day'
                  : cell.isToday
                    ? 'Today'
                    : cell.week
                      ? `Week ${cell.week.week} · ${PHASE_STYLES[cell.week.phase]?.label ?? cell.week.phase}`
                      : undefined
              }
            >
              {cell.day}
              {cell.isExam && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--color-error)]" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-[var(--color-border)]">
        {Object.entries(PHASE_STYLES).map(([key, style]) => (
          <span
            key={key}
            className="flex items-center gap-1.5 text-[0.65rem] font-medium"
            style={{ color: style.color }}
          >
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: style.bg, border: `1px solid ${style.color}` }} />
            {style.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-[0.65rem] font-medium text-[var(--color-brand-blue)]">
          <span className="w-2 h-2 rounded-full ring-2 ring-[var(--color-brand-blue)] bg-transparent" />
          Today
        </span>
        <span className="flex items-center gap-1.5 text-[0.65rem] font-medium text-[var(--color-error)]">
          <span className="w-2 h-2 rounded-full bg-[var(--color-error)]" />
          Exam
        </span>
      </div>
    </div>
  );
}

// ─── Week Card ───

function WeekCard({
  week,
  isCurrent,
  isPast,
  onPractice,
}: {
  week: StudyPlanWeek;
  isCurrent: boolean;
  isPast: boolean;
  onPractice: () => void;
}) {
  const [expanded, setExpanded] = useState(isCurrent);
  const style = PHASE_STYLES[week.phase] || PHASE_STYLES.foundation;
  const PhaseIcon = style.icon;
  const completionPct = week.question_target > 0
    ? Math.min(100, Math.round((week.completed / week.question_target) * 100))
    : 0;

  return (
    <div
      className={`chiron-mockup transition-all ${isCurrent ? 'ring-2 ring-[var(--color-brand-blue)]/40 shadow-md' : ''} ${isPast ? 'opacity-55' : ''}`}
    >
      <button
        type="button"
        className="flex items-center gap-3 w-full text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: style.bg, color: style.color }}
        >
          <PhaseIcon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              Week {week.week}
            </span>
            {isCurrent && (
              <span className="text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--color-brand-blue)_12%,transparent)] text-[var(--color-brand-blue)]">
                Current
              </span>
            )}
            <span
              className="text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: style.bg, color: style.color }}
            >
              {style.label}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {formatDate(week.start)} – {formatDate(week.end)}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">{completionPct}%</p>
            <p className="text-[0.6rem] text-[var(--color-text-muted)]">{week.completed}/{week.question_target}</p>
          </div>
          {isPast ? (
            <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
          ) : (
            <ChevronDown
              className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </button>

      {expanded && !isPast && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 chiron-meter-track" style={{ height: '6px' }}>
              <div
                className="chiron-meter-fill"
                style={{ width: `${completionPct}%`, backgroundColor: style.color }}
              />
            </div>
            <span className="text-xs tabular-nums text-[var(--color-text-muted)] shrink-0 sm:hidden">
              {week.completed}/{week.question_target}
            </span>
          </div>

          {week.focus_sections.length > 0 && (
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                Focus Areas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {week.focus_sections.map((section) => (
                  <span
                    key={section}
                    className="text-xs px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] font-medium"
                  >
                    {section}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isCurrent && week.focus_sections.length > 0 && (
            <button
              type="button"
              onClick={onPractice}
              className="chiron-btn chiron-btn-primary px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 w-full justify-center sm:w-auto"
            >
              Start Practice
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───

export function StudyPlan() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<StudyPlanData | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(() => {
    setLoading(true);
    setError(null);
    api.studyPlan.get()
      .then((res) => {
        setPlan(res.plan_data);
        setGeneratedAt(res.generated_at ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load study plan'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await api.studyPlan.generate();
      setPlan(res.plan_data);
      setGeneratedAt(res.generated_at ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const totalCompleted = plan?.weeks.reduce((s, w) => s + w.completed, 0) ?? 0;
  const totalTarget = plan?.weeks.reduce((s, w) => s + w.question_target, 0) ?? 0;
  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalCompleted / totalTarget) * 100)) : 0;

  const currentWeek = plan?.weeks.find((w) => today >= w.start && today <= w.end);
  const daysLeft = plan ? daysUntil(plan.exam_date) : 0;

  const phaseBreakdown = useMemo(() => {
    if (!plan) return [];
    const phases: Record<string, { total: number; completed: number; weeks: number }> = {};
    for (const w of plan.weeks) {
      if (!phases[w.phase]) phases[w.phase] = { total: 0, completed: 0, weeks: 0 };
      phases[w.phase].total += w.question_target;
      phases[w.phase].completed += w.completed;
      phases[w.phase].weeks += 1;
    }
    return Object.entries(phases).map(([phase, data]) => ({
      phase,
      ...data,
      pct: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }));
  }, [plan]);

  return (
    <div className="chiron-dash flex-1 overflow-y-auto">
      <div className="dash-glow dash-glow-one" aria-hidden />
      <div className="dash-glow dash-glow-two" aria-hidden />

      {/* ── Hero ── */}
      <section
        className="relative z-[1] pt-14 pb-16 md:pt-24 md:pb-20 chiron-page-enter"
        style={{ '--page-enter-order': 0 } as React.CSSProperties}
      >
        <div className="container">
          <div className="max-w-4xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[0.7rem] font-bold tracking-wider text-[var(--color-text-secondary)] uppercase mb-6 shadow-sm">
                  Study Plan
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-[var(--color-text-primary)] font-display tracking-tight leading-[1.04]">
                  {plan ? 'Your study plan.' : 'Plan your prep.'}
                </h1>
                <p className="mt-6 text-base md:text-lg text-[var(--color-text-secondary)] max-w-xl leading-relaxed">
                  {plan
                    ? `${daysLeft} days until your exam. Stay on track with ${plan.daily_goal} questions per day.`
                    : 'Generate a personalized study plan based on your progress and exam date.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="chiron-btn chiron-btn-primary px-5 py-2.5 rounded-md focus-ring inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                {generating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : plan ? (
                  <RefreshCw className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {generating ? 'Generating...' : plan ? 'Regenerate' : 'Generate Plan'}
              </button>
            </div>

            {plan && (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-primary)] rounded-full border border-[var(--color-border)] shadow-sm text-sm text-[var(--color-text-secondary)] font-medium">
                  <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <span>{formatDateLong(plan.exam_date)}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-primary)] rounded-full border border-[var(--color-border)] shadow-sm text-sm text-[var(--color-text-secondary)] font-medium">
                  <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <span>{plan.weeks_until_exam} weeks left</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-primary)] rounded-full border border-[var(--color-border)] shadow-sm text-sm text-[var(--color-text-secondary)] font-medium">
                  <Target className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <span>{plan.daily_goal} Q/day</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-primary)] rounded-full border border-[var(--color-border)] shadow-sm text-sm text-[var(--color-text-secondary)] font-medium">
                  <Flame className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <span>{overallPct}% complete</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Error ── */}
      {error && (
        <section className="pb-8 relative z-[1]">
          <div className="container max-w-4xl">
            <div className="chiron-mockup text-center py-6">
              <p className="text-sm text-[var(--color-error)] mb-3">{error}</p>
              <button type="button" onClick={fetchPlan} className="chiron-btn chiron-btn-subtle px-4 py-2 rounded-lg text-sm font-medium">
                Retry
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Loading ── */}
      {loading && !plan && (
        <section className="pb-14 relative z-[1]">
          <div className="container max-w-4xl">
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
            <Skeleton className="h-72 w-full rounded-xl mb-6" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Empty State ── */}
      {!loading && !plan && !error && (
        <section className="pb-14 relative z-[1]">
          <div className="container max-w-4xl">
            <div className="chiron-mockup">
              <EmptyState
                icon={Calendar}
                title="No study plan yet"
                description="Set your exam date in Settings, then generate a plan tailored to your weak areas."
                action={{ label: 'Generate Plan', onClick: handleGenerate }}
              />
            </div>
          </div>
        </section>
      )}

      {plan && (
        <>
          {/* ── Stats + Calendar ── */}
          <section
            className="py-14 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-primary)_94%,transparent)] chiron-page-enter"
            style={{ '--page-enter-order': 1 } as React.CSSProperties}
          >
            <div className="container">
              <div className="mb-8">
                <p className="chiron-feature-label">Overview</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Stats */}
                <div className="chiron-mockup">
                  <p className="chiron-mockup-label mb-4">Progress</p>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard
                      icon={Calendar}
                      label="Exam Date"
                      value={formatDate(plan.exam_date)}
                      color="var(--color-brand-blue)"
                    />
                    <StatCard
                      icon={Clock}
                      label="Days Left"
                      value={String(daysLeft)}
                      color="var(--color-warning)"
                    />
                    <StatCard
                      icon={Target}
                      label="Daily Goal"
                      value={`${plan.daily_goal} Q`}
                      color="var(--color-success)"
                    />
                    <StatCard
                      icon={Flame}
                      label="Completed"
                      value={`${totalCompleted}/${totalTarget}`}
                      color="var(--color-brand-blue)"
                    />
                  </div>

                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-[var(--color-text-secondary)]">Overall Progress</p>
                      <p className="text-xs font-semibold tabular-nums text-[var(--color-text-primary)]">{overallPct}%</p>
                    </div>
                    <div className="chiron-meter-track" style={{ height: '8px' }}>
                      <div className="chiron-meter-fill" style={{ width: `${overallPct}%` }} />
                    </div>
                  </div>
                </div>

                {/* Calendar */}
                <StudyCalendar plan={plan} />
              </div>
            </div>
          </section>

          {/* ── Phase Breakdown ── */}
          {phaseBreakdown.length > 0 && (
            <section
              className="py-14 border-t border-[var(--color-border)] chiron-page-enter"
              style={{ '--page-enter-order': 2 } as React.CSSProperties}
            >
              <div className="container">
                <div className="grid md:grid-cols-[0.35fr_0.65fr] gap-12 items-start">
                  <div>
                    <p className="chiron-feature-label">Phases</p>
                    <h2 className="chiron-feature-heading">Study phases</h2>
                    <p className="chiron-feature-body mt-4">
                      Your plan is divided into phases that progressively shift focus from building foundations to targeted review.
                    </p>
                    {currentWeek && (
                      <div className="chiron-mockup mt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: PHASE_STYLES[currentWeek.phase]?.color }}
                          />
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                            Current Phase
                          </p>
                        </div>
                        <p className="text-lg font-semibold font-display text-[var(--color-text-primary)]">
                          {PHASE_STYLES[currentWeek.phase]?.label ?? currentWeek.phase}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                          Week {currentWeek.week} · {formatDate(currentWeek.start)} – {formatDate(currentWeek.end)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="chiron-mockup">
                    <p className="chiron-mockup-label mb-4">Phase Progress</p>
                    <div className="space-y-4">
                      {phaseBreakdown.map(({ phase, total, completed, weeks, pct }) => {
                        const ps = PHASE_STYLES[phase] || PHASE_STYLES.foundation;
                        return (
                          <div key={phase}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: ps.color }}
                                />
                                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                                  {ps.label}
                                </span>
                                <span className="text-[0.65rem] text-[var(--color-text-muted)]">
                                  {weeks} {weeks === 1 ? 'week' : 'weeks'}
                                </span>
                              </div>
                              <span className="text-xs tabular-nums font-semibold" style={{ color: ps.color }}>
                                {pct}%
                              </span>
                            </div>
                            <div className="chiron-meter-track" style={{ height: '6px' }}>
                              <div
                                className="chiron-meter-fill"
                                style={{ width: `${pct}%`, backgroundColor: ps.color }}
                              />
                            </div>
                            <p className="mt-1 text-[0.6rem] text-[var(--color-text-muted)]">
                              {completed} of {total} questions completed
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

          {/* ── Weekly Timeline ── */}
          <section
            className="py-14 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-primary)_94%,transparent)] chiron-page-enter"
            style={{ '--page-enter-order': 3 } as React.CSSProperties}
          >
            <div className="container max-w-3xl">
              <div className="mb-8">
                <p className="chiron-feature-label">Schedule</p>
                <h2 className="chiron-feature-heading">Weekly breakdown</h2>
                <p className="chiron-feature-body mt-2">
                  Each week targets specific sections based on your performance. Expand a week to see focus areas.
                </p>
              </div>

              <div className="space-y-3">
                {plan.weeks.map((week) => {
                  const isCurrent = today >= week.start && today <= week.end;
                  const isPast = today > week.end;
                  return (
                    <WeekCard
                      key={week.week}
                      week={week}
                      isCurrent={isCurrent}
                      isPast={isPast}
                      onPractice={() => navigate('/exam/config?type=practice')}
                    />
                  );
                })}
              </div>

              {generatedAt && (
                <p className="text-[0.6rem] text-[var(--color-text-muted)] mt-6 text-center">
                  Plan generated {new Date(generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          </section>

          {/* ── Quick Actions ── */}
          <section
            className="py-14 border-t border-[var(--color-border)] chiron-page-enter"
            style={{ '--page-enter-order': 4 } as React.CSSProperties}
          >
            <div className="container">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <p className="chiron-feature-label">Actions</p>
                  <h2 className="chiron-feature-heading">Next steps</h2>
                  <p className="chiron-feature-body mt-2">
                    Stay on track with your daily goals and focus on your weakest areas.
                  </p>
                </div>
                <div className="chiron-mockup space-y-2">
                  <ActionRow
                    label="Start practice session"
                    description={currentWeek ? `Focus on ${currentWeek.focus_sections.slice(0, 2).join(', ') || 'all sections'}` : 'Practice questions'}
                    onClick={() => navigate('/exam/config?type=practice')}
                  />
                  <ActionRow
                    label="View your progress"
                    description="Check performance analytics"
                    onClick={() => navigate('/dashboard')}
                    icon={TrendingUp}
                  />
                  <ActionRow
                    label="Update study settings"
                    description="Change exam date or daily goal"
                    onClick={() => navigate('/settings')}
                    icon={Calendar}
                  />
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
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
        <p className="text-lg font-semibold font-display tabular-nums tracking-tight text-[var(--color-text-primary)]">
          {value}
        </p>
      </div>
    </div>
  );
}

function ActionRow({
  label,
  description,
  onClick,
  icon: Icon = ArrowRight,
}: {
  label: string;
  description?: string;
  onClick: () => void;
  icon?: React.ElementType;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors group text-left"
    >
      <div>
        <span className="text-sm font-medium text-[var(--color-text-primary)]">{label}</span>
        {description && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{description}</p>
        )}
      </div>
      <Icon className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-blue)] transition-colors shrink-0" />
    </button>
  );
}
