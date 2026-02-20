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
import type { StudyPlanData, StudyPlanWeek, DailySummary } from '../api/types';
import { EmptyState, Skeleton, SkeletonCard, CircularProgress } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { ProGate } from '../components/ProGate';

const PHASE_STYLES: Record<string, { label: string; color: string; bg: string; calBg: string; icon: React.ElementType }> = {
  foundation: {
    label: 'Foundation',
    color: '#dc2626',
    bg: 'color-mix(in srgb, #dc2626 12%, transparent)',
    calBg: 'color-mix(in srgb, #dc2626 22%, transparent)',
    icon: BookOpen,
  },
  reinforcement: {
    label: 'Reinforcement',
    color: '#d97706',
    bg: 'color-mix(in srgb, #d97706 12%, transparent)',
    calBg: 'color-mix(in srgb, #d97706 22%, transparent)',
    icon: TrendingUp,
  },
  review: {
    label: 'Review',
    color: '#16a34a',
    bg: 'color-mix(in srgb, #16a34a 12%, transparent)',
    calBg: 'color-mix(in srgb, #16a34a 22%, transparent)',
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
  const examDate = new Date(plan.exam_date + 'T00:00:00');
  const [viewYear, setViewYear] = useState(planStart.getFullYear());
  const [viewMonth, setViewMonth] = useState(planStart.getMonth());

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = getMonthDays(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const isViewingExamMonth = viewYear === examDate.getFullYear() && viewMonth === examDate.getMonth();
  const isViewingTodayMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };
  const jumpToExam = () => {
    setViewYear(examDate.getFullYear());
    setViewMonth(examDate.getMonth());
  };
  const jumpToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
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
    <div className="chiron-mockup" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="chiron-mockup-label">Calendar</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2.5 md:p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--color-text-tertiary)]" />
          </button>
          <span className="text-sm font-medium text-[var(--color-text-primary)] min-w-[140px] text-center">
            {monthName}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2.5 md:p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
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
              className={`relative flex items-center justify-center h-9 rounded-lg text-xs transition-colors cursor-default
                ${cell.isToday ? 'ring-2 ring-[var(--color-brand-blue)] ring-offset-1 ring-offset-[var(--color-bg-secondary)] font-bold' : ''}
                ${cell.isExam ? 'ring-2 ring-[var(--color-error)] ring-offset-1 ring-offset-[var(--color-bg-secondary)] font-bold' : ''}
                ${!cell.isToday && !cell.isExam ? 'font-semibold' : ''}
              `}
              style={{
                backgroundColor: phase ? phase.calBg : undefined,
                color: cell.isToday
                  ? 'var(--color-brand-blue)'
                  : cell.isExam
                    ? 'var(--color-error)'
                    : phase
                      ? phase.color
                      : 'var(--color-text-muted)',
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

      <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-[color-mix(in_srgb,var(--color-border)_50%,transparent)]">
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

      <div className="flex items-center gap-2 mt-3">
        {!isViewingTodayMonth && (
          <button
            type="button"
            onClick={jumpToToday}
            className="text-[0.65rem] font-medium text-[var(--color-brand-blue)] hover:underline"
          >
            Jump to today
          </button>
        )}
        {!isViewingExamMonth && (
          <>
            {!isViewingTodayMonth && <span className="text-[var(--color-text-muted)] text-[0.6rem]">·</span>}
            <button
              type="button"
              onClick={jumpToExam}
              className="text-[0.65rem] font-medium text-[#dc2626] hover:underline"
            >
              Jump to exam
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Today's Progress ───

function TodayProgress({
  dailySummary,
  onPractice,
}: {
  dailySummary: DailySummary | null;
  onPractice: () => void;
}) {
  const todayCount = dailySummary?.today_count ?? 0;
  const dailyGoal = dailySummary?.daily_goal ?? 0;
  const streak = dailySummary?.streak ?? 0;
  const goalPct = dailyGoal > 0 ? Math.min(100, Math.round((todayCount / dailyGoal) * 100)) : 0;
  const goalMet = todayCount >= dailyGoal && dailyGoal > 0;
  const remaining = Math.max(0, dailyGoal - todayCount);
  const last7 = dailySummary?.history.slice(-7) ?? [];

  return (
    <div
      className="chiron-mockup flex flex-col"
      style={{
        boxShadow: '0 6px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)',
        backgroundColor: 'var(--color-bg-primary)',
        padding: '1.5rem',
      }}
    >
      <p className="chiron-mockup-label mb-4">Today</p>

      <div className="flex-1 flex items-center gap-5">
        <CircularProgress
          value={goalPct}
          label=""
          centerLabel={`${todayCount}/${dailyGoal}`}
          color={goalMet ? 'var(--color-success)' : 'var(--color-brand-blue)'}
          size={110}
          strokeWidth={9}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-2xl font-bold font-display tabular-nums text-[var(--color-text-primary)]">
              {todayCount}
            </p>
            {streak > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] text-[var(--color-warning)]">
                🔥 {streak}d
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            {goalMet ? 'Daily goal reached!' : `${remaining} more to hit your goal.`}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {goalMet ? 'Keep the momentum going.' : 'Complete today\'s set to stay on pace.'}
          </p>

          {last7.length > 0 && (
            <>
              <div className="flex gap-1 mt-3">
                {last7.map((day) => (
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
            </>
          )}
        </div>
      </div>

      {!goalMet && (
        <button
          type="button"
          onClick={onPractice}
          className="mt-4 chiron-btn chiron-btn-primary px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 w-full shadow-sm"
        >
          Start Practice
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Week Card ───

function WeekCard({
  week,
  isCurrent,
  isPast,
  totalWeeks,
  onPractice,
}: {
  week: StudyPlanWeek;
  isCurrent: boolean;
  isPast: boolean;
  totalWeeks: number;
  onPractice: () => void;
}) {
  const [expanded, setExpanded] = useState(isCurrent);
  const style = PHASE_STYLES[week.phase] || PHASE_STYLES.foundation;
  const PhaseIcon = style.icon;
  const completionPct = week.question_target > 0
    ? Math.min(100, Math.round((week.completed / week.question_target) * 100))
    : 0;
  const hasProgress = completionPct > 0;

  return (
    <div
      className={`rounded-xl transition-all hover:shadow-sm ${isPast ? 'opacity-50' : ''}`}
      style={{
        backgroundColor: isCurrent ? 'var(--color-bg-primary)' : 'var(--color-bg-secondary)',
        borderLeft: isCurrent ? '3px solid var(--color-brand-blue)' : '3px solid transparent',
        boxShadow: isCurrent ? '0 4px 20px rgba(0,0,0,0.08)' : undefined,
        border: isCurrent ? undefined : '1px solid color-mix(in srgb, var(--color-border) 60%, transparent)',
        padding: '0.75rem 1rem',
      }}
    >
      <button
        type="button"
        className="flex items-center gap-3 w-full text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: style.bg, color: style.color }}
        >
          <PhaseIcon className="w-3.5 h-3.5" />
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
              className="text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: style.bg, color: style.color }}
            >
              {style.label}
            </span>
          </div>
          <p className="text-[0.7rem] text-[var(--color-text-muted)] mt-0.5">
            {formatDate(week.start)} – {formatDate(week.end)}
            {isCurrent && <span className="ml-2 text-[var(--color-brand-blue)] font-medium">· Week {week.week} of {totalWeeks}</span>}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            {hasProgress ? (
              <>
                <p className="text-sm font-bold tabular-nums text-[var(--color-text-primary)]">{completionPct}%</p>
                <p className="text-[0.6rem] text-[var(--color-text-muted)]">{week.completed}/{week.question_target}</p>
              </>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">Not started</p>
            )}
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
        <div className="mt-2.5 pt-2.5 border-t border-[color-mix(in_srgb,var(--color-border)_50%,transparent)] space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="flex-1 chiron-meter-track" style={{ height: '5px' }}>
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
              <p className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                Focus Areas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {week.focus_sections.map((section) => (
                  <span
                    key={section}
                    className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] font-medium"
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
              className="chiron-btn chiron-btn-primary px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 w-full justify-center sm:w-auto"
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

// ─── Week List (smart truncation for long plans) ───

const VISIBLE_AROUND_CURRENT = 3;

function WeekList({
  weeks,
  today,
  totalWeeks,
  onPractice,
}: {
  weeks: StudyPlanWeek[];
  today: string;
  totalWeeks: number;
  onPractice: () => void;
}) {
  const [showAll, setShowAll] = useState(false);

  const currentIdx = weeks.findIndex((w) => today >= w.start && today <= w.end);
  const anchorIdx = currentIdx >= 0 ? currentIdx : 0;

  const shouldTruncate = weeks.length > 10 && !showAll;

  const visibleWeeks = shouldTruncate
    ? weeks.filter((_, i) => {
        if (i <= anchorIdx + VISIBLE_AROUND_CURRENT) return true;
        if (i >= weeks.length - 2) return true;
        return false;
      })
    : weeks;

  const gapStart = anchorIdx + VISIBLE_AROUND_CURRENT + 1;
  const gapEnd = weeks.length - 2;
  const hiddenCount = shouldTruncate && gapEnd > gapStart ? gapEnd - gapStart : 0;

  return (
    <div className="space-y-2">
      {visibleWeeks.map((week, vIdx) => {
        const realIdx = weeks.indexOf(week);
        const isCurrent = today >= week.start && today <= week.end;
        const isPast = today > week.end;

        const prevRealIdx = vIdx > 0 ? weeks.indexOf(visibleWeeks[vIdx - 1]) : realIdx - 1;
        const showGap = shouldTruncate && realIdx - prevRealIdx > 1 && vIdx > 0;

        return (
          <div key={week.week}>
            {showGap && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="w-full py-2 text-center text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-brand-blue)] transition-colors"
              >
                {hiddenCount} more weeks — show all
              </button>
            )}
            <WeekCard
              week={week}
              isCurrent={isCurrent}
              isPast={isPast}
              totalWeeks={totalWeeks}
              onPractice={onPractice}
            />
          </div>
        );
      })}

      {shouldTruncate && weeks.length > 10 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full py-3 text-center text-xs font-medium text-[var(--color-brand-blue)] hover:underline transition-colors"
        >
          Show all {weeks.length} weeks
        </button>
      )}

      {showAll && weeks.length > 10 && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="w-full py-3 text-center text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Show less
        </button>
      )}
    </div>
  );
}

// ─── Main Page ───

export function StudyPlan() {
  const navigate = useNavigate();
  const { isPro } = useAuth();
  const [plan, setPlan] = useState<StudyPlanData | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);

  const fetchPlan = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.studyPlan.get(),
      api.progress.dailySummary().catch(() => null),
    ])
      .then(([res, daily]) => {
        setPlan(res.plan_data);
        setGeneratedAt(res.generated_at ?? null);
        if (daily) setDailySummary(daily);
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

  if (!isPro) {
    return (
      <div className="chiron-dash flex-1 overflow-y-auto">
        <div className="dash-glow dash-glow-one" aria-hidden />
        <div className="dash-glow dash-glow-two" aria-hidden />
        <div className="relative z-[1] py-20">
          <div className="container">
            <ProGate feature="AI Study Plan">
              <div className="h-[400px]" />
            </ProGate>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chiron-dash flex-1 overflow-y-auto">
      <div className="dash-glow dash-glow-one" aria-hidden />
      <div className="dash-glow dash-glow-two" aria-hidden />

      {/* ── Hero ── */}
      <section
        className="relative z-[1] pt-8 pb-8 md:pt-12 md:pb-10 chiron-page-enter"
        style={{
          '--page-enter-order': 0,
          backgroundColor: 'var(--color-bg-secondary)',
          borderBottom: '1px solid var(--color-border)',
        } as React.CSSProperties}
      >
        <div className="container">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-[var(--color-text-primary)] font-display tracking-tight leading-[1.08]">
              {plan ? 'Your study plan.' : 'Plan your prep.'}
            </h1>
            <p className="mt-3 text-base text-[var(--color-text-secondary)] max-w-xl leading-relaxed">
              {plan
                ? `${daysLeft} days until your exam. Complete ${plan.daily_goal} questions daily to stay on track.`
                : 'Generate a personalized study plan based on your progress and exam date.'}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              {plan && (
                <button
                  type="button"
                  onClick={() => navigate('/exam/config?type=practice')}
                  className="chiron-btn chiron-btn-primary px-5 py-2.5 rounded-md focus-ring inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  Start Today's Practice
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className={`px-5 py-2.5 rounded-md focus-ring inline-flex items-center gap-2 whitespace-nowrap shrink-0 text-sm font-medium transition-colors ${
                  plan
                    ? 'border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                    : 'chiron-btn chiron-btn-primary'
                }`}
              >
                {generating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : plan ? (
                  <RefreshCw className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {generating ? 'Generating...' : plan ? 'Regenerate Plan' : 'Generate Plan'}
              </button>
            </div>

            {/* Chips — only exam date + daily goal */}
            {plan && (
              <div className="flex flex-wrap items-center gap-3 mt-5">
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[var(--color-bg-primary)] rounded-full border border-[var(--color-border)] shadow-sm text-sm text-[var(--color-text-secondary)] font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <span>{formatDateLong(plan.exam_date)}</span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[var(--color-bg-primary)] rounded-full border border-[var(--color-border)] shadow-sm text-sm text-[var(--color-text-secondary)] font-medium">
                  <Target className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <span>{plan.daily_goal} Q/day</span>
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
            className="py-11 chiron-page-enter"
            style={{ '--page-enter-order': 1 } as React.CSSProperties}
          >
            <div className="container">
              <div className="mb-6">
                <p className="chiron-feature-label">Overview</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {/* Stats */}
                <div className="chiron-mockup" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
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

                {/* Today's Progress */}
                <TodayProgress dailySummary={dailySummary} onPractice={() => navigate('/exam/config?type=practice')} />

                {/* Calendar */}
                <StudyCalendar plan={plan} />
              </div>
            </div>
          </section>

          {/* ── Phase Breakdown ── */}
          {phaseBreakdown.length > 0 && (
            <section
              className="py-11 border-t border-[color-mix(in_srgb,var(--color-border)_60%,transparent)] chiron-page-enter"
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
                      <div className="chiron-mockup mt-6" style={{ border: 'none', backgroundColor: 'var(--color-bg-secondary)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: PHASE_STYLES[currentWeek.phase]?.color }}
                          />
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
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
                    <div className="space-y-5">
                      {phaseBreakdown.map(({ phase, total, completed, weeks, pct }) => {
                        const ps = PHASE_STYLES[phase] || PHASE_STYLES.foundation;
                        return (
                          <div key={phase}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: ps.color }}
                                />
                                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                                  {ps.label}
                                </span>
                                <span className="text-[0.65rem] text-[var(--color-text-muted)]">
                                  {weeks} {weeks === 1 ? 'week' : 'weeks'}
                                </span>
                              </div>
                              <span className="text-sm tabular-nums font-bold" style={{ color: ps.color }}>
                                {pct > 0 ? `${pct}%` : 'Not started'}
                              </span>
                            </div>
                            <div className="chiron-meter-track" style={{ height: '7px' }}>
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
            className="py-11 border-t border-[color-mix(in_srgb,var(--color-border)_60%,transparent)] chiron-page-enter"
            style={{ '--page-enter-order': 3 } as React.CSSProperties}
          >
            <div className="container max-w-3xl">
              <div className="mb-6">
                <p className="chiron-feature-label">Schedule</p>
                <h2 className="chiron-feature-heading">Weekly breakdown</h2>
                <p className="chiron-feature-body mt-2">
                  Each week targets specific sections based on your performance. Expand a week to see focus areas.
                </p>
              </div>

              <WeekList
                weeks={plan.weeks}
                today={today}
                totalWeeks={plan.weeks.length}
                onPractice={() => navigate('/exam/config?type=practice')}
              />

              {generatedAt && (
                <p className="text-[0.6rem] text-[var(--color-text-muted)] mt-6 text-center">
                  Plan generated {new Date(generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          </section>

          {/* ── Quick Actions ── */}
          <section
            className="py-11 border-t border-[color-mix(in_srgb,var(--color-border)_60%,transparent)] chiron-page-enter"
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
