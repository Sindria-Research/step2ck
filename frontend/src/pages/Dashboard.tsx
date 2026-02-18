import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api/api';
import type { ProgressStats } from '../api/types';
import { Skeleton, SkeletonCard, EmptyState } from '../components/common';

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.progress
      .stats()
      .then((data) => {
        if (!cancelled) setStats(data);
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

  const accuracy =
    stats && stats.total > 0
      ? Math.round((stats.correct / stats.total) * 100)
      : 0;

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--color-bg-secondary)]">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--color-bg-secondary)]">
        <div className="max-w-[1200px] mx-auto">
          <p className="text-[var(--color-text-secondary)]">{error}</p>
        </div>
      </div>
    );
  }

  const bySection = stats?.by_section ?? [];
  const hasData = (stats?.total ?? 0) > 0;

  const focusAreas = bySection
    .filter((s) => s.total >= 5)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--color-bg-secondary)]">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] font-display tracking-tight">
              Dashboard
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-0.5">
              {hasData
                ? 'Your progress and performance at a glance.'
                : 'Track your Step 2 CK preparation here.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/exam/config')}
            className="btn btn-primary self-start sm:self-center focus-ring px-5 py-2.5 rounded-md"
          >
            New test
          </button>
        </div>

        {!hasData ? (
          <div className="space-y-8">
            {/* Getting started – Notion-style cards */}
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--color-border)]">
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Getting started
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                  Your dashboard will show questions answered, accuracy by section, and focus areas once you’ve done some practice.
                </p>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] text-xs font-medium text-[var(--color-text-secondary)]">
                    1
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Create a practice test</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">Choose subjects and number of questions, then start.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] text-xs font-medium text-[var(--color-text-secondary)]">
                    2
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Answer and review</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">See explanations and track correct vs incorrect.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] text-xs font-medium text-[var(--color-text-secondary)]">
                    3
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">See your stats here</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">Accuracy by section, focus areas, and quick actions.</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/exam/config')}
                  className="btn btn-primary rounded-md px-4 py-2 text-sm focus-ring"
                >
                  New test
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/lab-values')}
                  className="btn btn-secondary rounded-md px-4 py-2 text-sm focus-ring"
                >
                  Lab values
                </button>
              </div>
            </div>

            <EmptyState
              icon={Target}
              title="No progress yet"
              description="Start a test to see your stats and analytics here."
              action={{ label: 'New test', onClick: () => navigate('/exam/config') }}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card pl-5 border-l-4 border-l-[var(--color-border-hover)] rounded-lg">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
                  Questions answered
                </p>
                <p className="text-2xl font-semibold text-[var(--color-text-primary)] font-display tabular-nums">
                  {stats!.total}
                </p>
              </div>
              <div className="card pl-5 border-l-4 border-l-[var(--color-success)] rounded-lg">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
                  Overall accuracy
                </p>
                <p className="text-2xl font-semibold text-[var(--color-text-primary)] font-display tabular-nums">
                  {accuracy}%
                </p>
              </div>
              <div className="card pl-5 border-l-4 border-l-[var(--color-success)] rounded-lg">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
                  Correct
                </p>
                <p className="text-2xl font-semibold text-[var(--color-success)] font-display tabular-nums">
                  {stats!.correct}
                </p>
              </div>
              <div className="card pl-5 border-l-4 border-l-[var(--color-error)] rounded-lg">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
                  Incorrect
                </p>
                <p className="text-2xl font-semibold text-[var(--color-error)] font-display tabular-nums">
                  {stats!.incorrect}
                </p>
              </div>
            </div>

            <div className="card rounded-lg">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                Performance by section
              </h2>
              {bySection.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bySection}
                      layout="vertical"
                      margin={{ left: 80, right: 24 }}
                    >
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={80}
                        tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                      />
                      <Tooltip
                        formatter={(value: number) => (value != null ? `${value}%` : '')}
                        contentStyle={{
                          backgroundColor: 'var(--color-bg-primary)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'var(--color-text-primary)' }}
                      />
                      <Bar
                        dataKey="accuracy"
                        fill="var(--color-text-primary)"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-[var(--color-text-tertiary)] py-8 text-sm">
                  No section data yet.
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {focusAreas.length > 0 && (
                <div className="card rounded-lg">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                    Focus areas
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    Sections with lowest accuracy (min 5 questions). Consider a targeted practice test.
                  </p>
                  <ul className="space-y-2">
                    {focusAreas.map((s) => (
                      <li
                        key={s.name}
                        className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0 last:pb-0"
                      >
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          {s.name}
                        </span>
                        <span className="text-sm tabular-nums text-[var(--color-text-tertiary)]">
                          {s.accuracy}%
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => navigate('/exam/config')}
                    className="mt-4 text-sm font-medium text-[var(--color-text-primary)] hover:underline focus-ring"
                  >
                    Start a practice test →
                  </button>
                </div>
              )}

              <div className="card rounded-lg">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                  Quick actions
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Start a new test or review lab values.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/exam/config')}
                    className="btn btn-primary text-sm px-4 py-2 rounded-md focus-ring"
                  >
                    New test
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/lab-values')}
                    className="btn btn-secondary text-sm px-4 py-2 rounded-md focus-ring"
                  >
                    Lab values
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
