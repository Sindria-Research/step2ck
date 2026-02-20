import { useState, useEffect } from 'react';
import { Clock, Zap, TrendingUp, Layers, Flame } from 'lucide-react';
import { api } from '../api/api';
import type { ProgressStats, TimeStats, SectionTrend, FlashcardStatsResponse } from '../api/types';
import { ProgressChart } from '../components/analytics/ProgressChart';
import { SectionBreakdown } from '../components/analytics/SectionBreakdown';

const TREND_COLORS = [
  'var(--color-brand-blue)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-error)',
  '#a78bfa',
  '#f472b6',
  '#34d399',
  '#fbbf24',
];

export function Performance() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [history, setHistory] = useState<Array<{ question_id: string; correct: boolean; section: string }>>([]);
  const [timeStats, setTimeStats] = useState<TimeStats | null>(null);
  const [trends, setTrends] = useState<SectionTrend[]>([]);
  const [fcStats, setFcStats] = useState<FlashcardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.progress.stats(),
      api.progress.list(),
      api.progress.timeStats().catch(() => null),
      api.progress.trends().catch(() => []),
      api.flashcards.getStats().catch(() => null),
    ])
      .then(([s, h, ts, tr, fc]) => {
        setStats(s);
        setHistory(h);
        if (ts) setTimeStats(ts);
        if (tr) setTrends(tr);
        if (fc) setFcStats(fc);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load performance data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const bySection = stats?.by_section ?? [];
  const total = stats?.total ?? 0;
  const correct = stats?.correct ?? 0;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const allWeeks = Array.from(new Set(trends.flatMap((t) => t.weeks.map((w) => w.week)))).sort();
  const maxBarTime = timeStats?.by_section?.length
    ? Math.max(...timeStats.by_section.map((s) => s.avg_seconds))
    : 1;

  return (
    <div className="chiron-dash flex-1 overflow-y-auto min-h-full">
      <div className="dash-glow" />

      <section className="py-8 md:py-14 chiron-page-enter" style={{ '--page-enter-order': 0 } as React.CSSProperties}>
        <div className="container">
          <div className="mb-5 md:mb-8">
            <p className="chiron-feature-label">QBank</p>
            <h1 className="chiron-feature-heading">Performance</h1>
            <p className="chiron-feature-body mt-2">Comprehensive analytics across all your question bank activity.</p>
          </div>

          {error && (
            <div className="chiron-mockup mb-8 text-center py-8">
              <p className="text-sm text-[var(--color-error)] mb-3">{error}</p>
              <button type="button" onClick={fetchData} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">
                Retry
              </button>
            </div>
          )}

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5 md:mb-8">
            {([
              { label: 'Total Answered', value: total },
              { label: 'Correct', value: correct },
              { label: 'Accuracy', value: total > 0 ? `${accuracy}%` : '—' },
            ] as const).map((item) => (
              <div key={item.label} className="chiron-mockup text-center py-4 md:py-6">
                <p className="chiron-mockup-label mb-1 md:mb-2 text-[0.55rem] sm:text-[0.72rem]">{item.label}</p>
                <p className="text-xl sm:text-3xl font-semibold font-display tabular-nums text-[var(--color-text-primary)]">
                  {loading ? '—' : item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-4 md:gap-6 mb-5 md:mb-8">
            <div className="chiron-mockup">
              <p className="chiron-mockup-label mb-4">Performance Trend</p>
              <ProgressChart history={history} />
            </div>
            <div className="chiron-mockup">
              <p className="chiron-mockup-label mb-4">Section Distribution</p>
              <SectionBreakdown sections={bySection} />
            </div>
          </div>

          {/* Time Analytics */}
          {timeStats && timeStats.by_section.length > 0 && (
            <div className="chiron-mockup mb-8 chiron-page-enter" style={{ '--page-enter-order': 1 } as React.CSSProperties}>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-4 h-4 text-[var(--color-brand-blue)]" />
                <p className="chiron-mockup-label">Time Analytics</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Avg per Question</p>
                  <p className="text-2xl font-semibold font-display tabular-nums text-[var(--color-text-primary)]">
                    {timeStats.avg_seconds}s
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Median</p>
                  <p className="text-2xl font-semibold font-display tabular-nums text-[var(--color-text-primary)]">
                    {timeStats.median_seconds}s
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                  <div className="flex items-center gap-1 mb-1">
                    <Zap className="w-3 h-3 text-[var(--color-warning)]" />
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Speed vs Accuracy</p>
                  </div>
                  {(() => {
                    const correctAvg = timeStats.by_section.reduce((sum, s) => sum + s.correct_avg * s.total, 0) / Math.max(1, timeStats.by_section.reduce((sum, s) => sum + s.total, 0));
                    const incorrectAvg = timeStats.by_section.reduce((sum, s) => sum + s.incorrect_avg * s.total, 0) / Math.max(1, timeStats.by_section.reduce((sum, s) => sum + s.total, 0));
                    const faster = correctAvg < incorrectAvg;
                    return (
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Correct answers are <span className="font-semibold text-[var(--color-text-primary)]">{Math.abs(Math.round(correctAvg - incorrectAvg))}s {faster ? 'faster' : 'slower'}</span> on average
                      </p>
                    );
                  })()}
                </div>
              </div>

              <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-3">Time by Section</p>
              <div className="space-y-2">
                {timeStats.by_section.slice(0, 10).map((s) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="text-xs text-[var(--color-text-primary)] w-32 truncate shrink-0" title={s.name}>{s.name}</span>
                    <div className="flex-1 h-5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-brand-blue)] transition-all"
                        style={{ width: `${(s.avg_seconds / maxBarTime) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-[var(--color-text-muted)] w-12 text-right shrink-0">{s.avg_seconds}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Trend Lines */}
          {trends.length > 0 && allWeeks.length >= 2 && (
            <div className="chiron-mockup mb-8 chiron-page-enter" style={{ '--page-enter-order': 2 } as React.CSSProperties}>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-4 h-4 text-[var(--color-success)]" />
                <p className="chiron-mockup-label">Accuracy Trends by Section</p>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                {trends.map((t, i) => (
                  <span key={t.section} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: TREND_COLORS[i % TREND_COLORS.length] }} />
                    {t.section}
                  </span>
                ))}
              </div>

              <div className="relative h-48">
                <svg viewBox={`0 0 ${Math.max(allWeeks.length * 60, 200)} 200`} className="w-full h-full" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((pct) => (
                    <line
                      key={pct}
                      x1="0"
                      y1={200 - pct * 2}
                      x2={allWeeks.length * 60}
                      y2={200 - pct * 2}
                      stroke="var(--color-border)"
                      strokeWidth="0.5"
                    />
                  ))}
                  {trends.map((t, tIdx) => {
                    const weekMap = new Map(t.weeks.map((w) => [w.week, w.accuracy]));
                    const points = allWeeks.map((w, i) => {
                      const acc = weekMap.get(w) ?? 0;
                      return `${i * 60 + 30},${200 - acc * 2}`;
                    }).join(' ');
                    return (
                      <polyline
                        key={t.section}
                        points={points}
                        fill="none"
                        stroke={TREND_COLORS[tIdx % TREND_COLORS.length]}
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    );
                  })}
                </svg>
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
                  {allWeeks.length <= 12 && allWeeks.map((w) => (
                    <span key={w} className="text-[0.55rem] text-[var(--color-text-muted)]">
                      {w.slice(5)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between mt-1 text-[0.55rem] text-[var(--color-text-muted)]">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Section-level breakdown */}
          {bySection.length > 0 && (
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
                        {s.correct}/{s.total} correct
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Flashcard Performance ── */}
      {fcStats && fcStats.total_cards > 0 && (
        <section className="py-8 md:py-14 border-t border-[var(--color-border)] chiron-page-enter" style={{ '--page-enter-order': 4 } as React.CSSProperties}>
          <div className="container">
            <div className="mb-5 md:mb-8">
              <p className="chiron-feature-label">Retention</p>
              <h2 className="chiron-feature-heading">Flashcard performance</h2>
              <p className="chiron-feature-body mt-2">Review history and card maturity tracking.</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mb-5 md:mb-8">
              {[
                { label: 'Total cards', value: String(fcStats.total_cards) },
                { label: 'Retention', value: `${fcStats.retention_rate}%` },
                { label: 'Reviews today', value: String(fcStats.reviews_today) },
                { label: 'Total reviews', value: String(fcStats.total_reviews) },
                { label: 'Streak', value: fcStats.reviews_streak > 0 ? `${fcStats.reviews_streak}d` : '—' },
              ].map((item) => (
                <div key={item.label} className="chiron-mockup text-center py-4 md:py-6">
                  <p className="chiron-mockup-label mb-1 md:mb-2 text-[0.55rem] sm:text-[0.72rem]">{item.label}</p>
                  <p className="text-xl sm:text-3xl font-semibold font-display tabular-nums text-[var(--color-text-primary)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* 14-day review history */}
            {fcStats.daily_reviews_history.length > 0 && (
              <div className="chiron-mockup mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                  <p className="chiron-mockup-label">Reviews per day (last 14 days)</p>
                  {fcStats.reviews_streak > 0 && (
                    <span className="flex items-center gap-1 ml-auto text-xs font-semibold text-orange-500">
                      <Flame className="w-3.5 h-3.5" /> {fcStats.reviews_streak}d streak
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-1 h-28">
                  {fcStats.daily_reviews_history.map((day) => {
                    const maxCount = Math.max(...fcStats.daily_reviews_history.map((d) => d.count), 1);
                    const height = day.count > 0 ? Math.max((day.count / maxCount) * 100, 4) : 2;
                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center justify-end"
                        title={`${day.date}: ${day.count} reviews`}
                      >
                        <span className="text-[0.5rem] text-[var(--color-text-muted)] mb-0.5 tabular-nums">
                          {day.count > 0 ? day.count : ''}
                        </span>
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

            {/* Card state distribution */}
            <div className="chiron-mockup">
              <p className="chiron-mockup-label mb-4">Card maturity</p>
              {(() => {
                const segments = [
                  { label: 'New', count: fcStats.cards_new, color: 'var(--color-brand-blue)' },
                  { label: 'Young', count: fcStats.cards_young, color: '#fbbf24' },
                  { label: 'Mature', count: fcStats.cards_mature, color: 'var(--color-success)' },
                  ...(fcStats.cards_suspended > 0 ? [{ label: 'Suspended', count: fcStats.cards_suspended, color: 'var(--color-error)' }] : []),
                ].filter((s) => s.count > 0);
                return (
                  <>
                    {/* Bar */}
                    <div className="flex rounded-lg overflow-hidden h-6 mb-3">
                      {segments.map((s) => (
                        <div
                          key={s.label}
                          style={{ width: `${(s.count / fcStats.total_cards) * 100}%`, backgroundColor: s.color }}
                          title={`${s.label}: ${s.count}`}
                        />
                      ))}
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {segments.map((s) => (
                        <div key={s.label} className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            {s.label} ({s.count})
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
