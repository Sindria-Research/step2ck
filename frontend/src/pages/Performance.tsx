import { useState, useEffect } from 'react';
import { api } from '../api/api';
import type { ProgressStats } from '../api/types';
import { ProgressChart } from '../components/analytics/ProgressChart';
import { SectionBreakdown } from '../components/analytics/SectionBreakdown';

export function Performance() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [history, setHistory] = useState<Array<{ question_id: string; correct: boolean; section: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.progress.stats(), api.progress.list()])
      .then(([s, h]) => { setStats(s); setHistory(h); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const bySection = stats?.by_section ?? [];
  const total = stats?.total ?? 0;
  const correct = stats?.correct ?? 0;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="chiron-dash flex-1 overflow-y-auto min-h-full">
      <div className="dash-glow" />

      <section className="py-14 chiron-page-enter" style={{ '--page-enter-order': 0 } as React.CSSProperties}>
        <div className="container">
          <div className="mb-8">
            <p className="chiron-feature-label">QBank</p>
            <h1 className="chiron-feature-heading">Performance</h1>
            <p className="chiron-feature-body mt-2">Comprehensive analytics across all your question bank activity.</p>
          </div>

          {/* Summary row */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {([
              { label: 'Total Answered', value: total },
              { label: 'Correct', value: correct },
              { label: 'Accuracy', value: total > 0 ? `${accuracy}%` : '—' },
            ] as const).map((item) => (
              <div key={item.label} className="chiron-mockup text-center py-6">
                <p className="chiron-mockup-label mb-2">{item.label}</p>
                <p className="text-3xl font-semibold font-display tabular-nums text-[var(--color-text-primary)]">
                  {loading ? '—' : item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="chiron-mockup">
              <p className="chiron-mockup-label mb-4">Performance Trend</p>
              <ProgressChart history={history} />
            </div>
            <div className="chiron-mockup">
              <p className="chiron-mockup-label mb-4">Section Distribution</p>
              <SectionBreakdown sections={bySection} />
            </div>
          </div>

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
    </div>
  );
}
