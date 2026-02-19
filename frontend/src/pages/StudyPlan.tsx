import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, RefreshCw, CheckCircle2, Clock, Target, ArrowRight } from 'lucide-react';
import { api } from '../api/api';
import type { StudyPlanData } from '../api/types';
import { EmptyState } from '../components/common';

const PHASE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  foundation: {
    label: 'Foundation',
    color: 'var(--color-error)',
    bg: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
  },
  reinforcement: {
    label: 'Reinforcement',
    color: 'var(--color-warning)',
    bg: 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
  },
  review: {
    label: 'Review',
    color: 'var(--color-success)',
    bg: 'color-mix(in srgb, var(--color-success) 10%, transparent)',
  },
};

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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

  return (
    <div className="chiron-dash flex-1 overflow-y-auto min-h-full">
      <div className="dash-glow" />

      <section className="py-14 chiron-page-enter" style={{ '--page-enter-order': 0 } as React.CSSProperties}>
        <div className="container max-w-4xl">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <p className="chiron-feature-label">Plan</p>
              <h1 className="chiron-feature-heading">Study Plan</h1>
              <p className="chiron-feature-body mt-2">
                {plan
                  ? `${plan.weeks_until_exam} weeks until your exam. ${plan.daily_goal} questions/day.`
                  : 'Generate a personalized study plan based on your progress and exam date.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="chiron-btn chiron-btn-primary px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : plan ? 'Regenerate' : 'Generate Plan'}
            </button>
          </div>

          {error && (
            <div className="chiron-mockup mb-6 text-center py-6">
              <p className="text-sm text-[var(--color-error)] mb-3">{error}</p>
              <button type="button" onClick={fetchPlan} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">
                Retry
              </button>
            </div>
          )}

          {loading && !plan && (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="chiron-mockup animate-pulse h-24" />
              ))}
            </div>
          )}

          {!loading && !plan && !error && (
            <div className="chiron-mockup">
              <EmptyState
                icon={Calendar}
                title="No study plan yet"
                description="Set your exam date in Settings, then generate a plan tailored to your weak areas."
                action={{ label: 'Generate Plan', onClick: handleGenerate }}
              />
            </div>
          )}

          {plan && (
            <>
              {/* Summary bar */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <div className="chiron-mockup text-center py-4">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Exam Date</p>
                  </div>
                  <p className="text-lg font-semibold font-display text-[var(--color-text-primary)]">
                    {formatDate(plan.exam_date)}
                  </p>
                </div>
                <div className="chiron-mockup text-center py-4">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[var(--color-warning)]" />
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Weeks Left</p>
                  </div>
                  <p className="text-lg font-semibold font-display tabular-nums text-[var(--color-text-primary)]">
                    {plan.weeks_until_exam}
                  </p>
                </div>
                <div className="chiron-mockup text-center py-4">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Target className="w-3.5 h-3.5 text-[var(--color-success)]" />
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Daily Goal</p>
                  </div>
                  <p className="text-lg font-semibold font-display tabular-nums text-[var(--color-text-primary)]">
                    {plan.daily_goal} Q/day
                  </p>
                </div>
              </div>

              {/* Phase legend */}
              <div className="flex flex-wrap gap-3 mb-6">
                {Object.entries(PHASE_STYLES).map(([key, style]) => (
                  <span
                    key={key}
                    className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: style.bg, color: style.color }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.color }} />
                    {style.label}
                  </span>
                ))}
              </div>

              {/* Weekly timeline */}
              <div className="space-y-3">
                {plan.weeks.map((week) => {
                  const style = PHASE_STYLES[week.phase] || PHASE_STYLES.foundation;
                  const isCurrent = today >= week.start && today <= week.end;
                  const isPast = today > week.end;
                  const completionPct = week.question_target > 0
                    ? Math.min(100, Math.round((week.completed / week.question_target) * 100))
                    : 0;

                  return (
                    <div
                      key={week.week}
                      className={`chiron-mockup transition-shadow ${isCurrent ? 'ring-2 ring-[var(--color-brand-blue)] shadow-md' : ''} ${isPast ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Week number */}
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                          style={{ backgroundColor: style.bg, color: style.color }}
                        >
                          W{week.week}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-[var(--color-text-primary)]">
                              {formatDate(week.start)} – {formatDate(week.end)}
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

                          {week.focus_sections.length > 0 && (
                            <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                              Focus: {week.focus_sections.join(', ')}
                            </p>
                          )}

                          <div className="flex items-center gap-3">
                            <div className="flex-1 chiron-meter-track">
                              <div
                                className="chiron-meter-fill"
                                style={{ width: `${completionPct}%`, backgroundColor: style.color }}
                              />
                            </div>
                            <span className="text-xs tabular-nums text-[var(--color-text-muted)] shrink-0">
                              {week.completed}/{week.question_target}
                            </span>
                          </div>
                        </div>

                        {/* Action */}
                        {isCurrent && week.focus_sections.length > 0 && (
                          <button
                            type="button"
                            onClick={() => navigate('/exam/config?type=practice')}
                            className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-brand-blue)] transition-colors shrink-0"
                            title="Start practice"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                        {isPast && (
                          <CheckCircle2 className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {generatedAt && (
                <p className="text-[0.6rem] text-[var(--color-text-muted)] mt-4 text-center">
                  Plan generated {new Date(generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
