import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, RotateCcw, Trash2, ChevronRight } from 'lucide-react';
import { api } from '../api/api';
import type { ExamSession } from '../api/types';
import { EmptyState } from '../components/common';

export function PreviousTests() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress'>('all');

  useEffect(() => {
    api.examSessions.list(filter === 'all' ? undefined : filter)
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const handleDelete = async (id: number) => {
    await api.examSessions.delete(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="chiron-dash flex-1 overflow-y-auto min-h-full">
      <div className="dash-glow" />

      <section className="py-14 chiron-page-enter" style={{ '--page-enter-order': 0 } as React.CSSProperties}>
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="chiron-feature-label">QBank</p>
              <h1 className="chiron-feature-heading">Previous Tests</h1>
              <p className="chiron-feature-body mt-2">Review past exams and track how your performance evolves.</p>
            </div>

            <div className="flex gap-2">
              {(['all', 'completed', 'in_progress'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === f
                      ? 'bg-[var(--color-brand-blue)] text-white'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'completed' ? 'Completed' : 'In Progress'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="chiron-mockup animate-pulse h-20" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="chiron-mockup">
              <EmptyState
                icon={Clock}
                title="No tests yet"
                description="Complete a test to see it appear here."
                action={{ label: 'Create a Test', onClick: () => navigate('/exam/config') }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const acc = session.accuracy != null ? Math.round(session.accuracy) : null;
                return (
                  <div key={session.id} className="chiron-mockup hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider ${
                            session.status === 'completed'
                              ? 'bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] text-[var(--color-success)]'
                              : 'bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] text-[var(--color-warning)]'
                          }`}>
                            {session.status === 'completed' ? 'Completed' : 'In Progress'}
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)]">{formatDate(session.started_at)}</span>
                        </div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          {session.subjects || 'Mixed'} &middot; {session.mode} mode &middot; {session.total_questions} questions
                        </p>
                      </div>

                      {session.status === 'completed' && acc != null && (
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="flex items-center gap-1.5 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)]" />
                            <span className="text-[var(--color-text-secondary)]">{session.correct_count}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <XCircle className="w-3.5 h-3.5 text-[var(--color-error)]" />
                            <span className="text-[var(--color-text-secondary)]">{session.incorrect_count}</span>
                          </div>
                          <div className="chiron-meter-track w-16">
                            <div className="chiron-meter-fill" style={{ width: `${acc}%` }} />
                          </div>
                          <span className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">{acc}%</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          title="Review"
                          className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        {session.status === 'completed' && (
                          <button
                            type="button"
                            title="Retake"
                            className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-brand-blue)] transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => handleDelete(session.id)}
                          className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-error)] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
