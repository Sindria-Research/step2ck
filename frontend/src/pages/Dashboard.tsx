import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../api/api';
import type { ProgressStats } from '../api/types';
import { Skeleton, SkeletonCard, EmptyState, CircularProgress } from '../components/common';
import { useQuestionGoal } from '../hooks/useQuestionGoal';

export function Dashboard() {
  const navigate = useNavigate();
  const [goal, setGoal] = useQuestionGoal();
  const [editingGoal, setEditingGoal] = useState(false);
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

  const total = stats?.total ?? 0;
  const correct = stats?.correct ?? 0;
  const incorrect = stats?.incorrect ?? 0;
  const correctPct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const incorrectPct = total > 0 ? Math.round((incorrect / total) * 100) : 0;

  const pieData = [
    { name: 'Correct', value: correct, color: 'var(--color-success)' },
    { name: 'Incorrect', value: incorrect, color: 'var(--color-error)' },
  ].filter((d) => d.value > 0);

  const goalPct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;

  const handleGoalBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const n = parseInt(e.target.value, 10);
      if (Number.isFinite(n) && n > 0) setGoal(n);
      setEditingGoal(false);
    },
    [setGoal]
  );

  const handleGoalKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const n = parseInt((e.target as HTMLInputElement).value, 10);
        if (Number.isFinite(n) && n > 0) setGoal(n);
        setEditingGoal(false);
      }
    },
    [setGoal]
  );

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

        {/* Row 1: Accuracy ring + Goal ring + stat numbers */}
        <div className="card rounded-lg p-6">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">
            Overview
          </h2>
          <div className="flex flex-wrap items-start gap-8">
            <CircularProgress
              value={accuracy}
              label="Accuracy"
              centerLabel={hasData ? `${accuracy}%` : '—'}
              color="var(--color-accent)"
              size={88}
              strokeWidth={7}
            />
            <div className="flex flex-wrap items-start gap-8">
              <div className="flex flex-col items-center">
                <CircularProgress
                  value={goalPct}
                  label="Question goal"
                  centerLabel={`${total}/${goal}`}
                  color="var(--color-success)"
                  size={88}
                  strokeWidth={7}
                />
                {editingGoal ? (
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    defaultValue={goal}
                    onBlur={handleGoalBlur}
                    onKeyDown={handleGoalKeyDown}
                    className="input w-20 mt-2 text-center text-sm"
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingGoal(true)}
                    className="mt-2 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] focus-ring"
                  >
                    Change goal
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-6 sm:gap-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-0.5">
                  Questions
                </p>
                <p className="text-2xl font-semibold text-[var(--color-text-primary)] font-display tabular-nums">
                  {total}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-0.5">
                  Correct
                </p>
                <p className="text-2xl font-semibold text-[var(--color-success)] font-display tabular-nums">
                  {correct}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-0.5">
                  Incorrect
                </p>
                <p className="text-2xl font-semibold text-[var(--color-error)] font-display tabular-nums">
                  {incorrect}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Correct vs Incorrect donut + Performance by section (accuracy) */}
        <div className="grid lg:grid-cols-3 gap-6">
          {pieData.length > 0 && (
            <div className="card rounded-lg">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">
                Correct vs incorrect
              </h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={56}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [value, '']}
                      contentStyle={{
                        backgroundColor: 'var(--color-bg-primary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className={pieData.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="card rounded-lg h-full">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">
                Performance by section (accuracy)
              </h2>
              {bySection.length > 0 ? (
                <div className="h-64">
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
                        fill="var(--color-accent)"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
                    No section data yet. Complete a practice test to see accuracy by section.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/exam/config')}
                    className="btn btn-primary rounded-md px-4 py-2 text-sm focus-ring"
                  >
                    New test
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Questions answered by section (volume) */}
        {bySection.length > 0 && (
          <div className="card rounded-lg">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">
              Questions answered by section
            </h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bySection}
                  layout="vertical"
                  margin={{ left: 80, right: 24 }}
                >
                  <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'var(--color-text-primary)' }}
                  />
                  <Bar
                    dataKey="total"
                    name="Questions"
                    fill="var(--color-border-hover)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Row 4: Focus areas + Quick actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card rounded-lg">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-3">
              Focus areas
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Sections with lowest accuracy (min 5 questions). Consider a targeted practice test.
            </p>
            {focusAreas.length > 0 ? (
              <>
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
                  className="mt-4 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors focus-ring"
                >
                  Start a practice test →
                </button>
              </>
            ) : (
              <p className="text-sm text-[var(--color-text-tertiary)]">
                Answer at least 5 questions per section to see focus areas here.
              </p>
            )}
          </div>

          <div className="card rounded-lg">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-3">
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

        {!hasData && (
          <div className="card rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)]">
            <EmptyState
              icon={Target}
              title="No progress yet"
              description="Start a test to see your stats and analytics here."
              action={{ label: 'New test', onClick: () => navigate('/exam/config') }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
