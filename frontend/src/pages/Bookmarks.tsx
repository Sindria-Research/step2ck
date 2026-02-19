import { useState, useEffect } from 'react';
import { Bookmark as BookmarkIcon, Trash2, BookOpen } from 'lucide-react';
import { api } from '../api/api';
import type { BookmarkResponse, Question } from '../api/types';
import { EmptyState } from '../components/common';
import { FreeTierBanner } from '../components/ProGate';

export function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkResponse[]>([]);
  const [questions, setQuestions] = useState<Map<string, Question>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api.bookmarks.list()
      .then(async (bm) => {
        setBookmarks(bm);
        const qMap = new Map<string, Question>();
        const fetches = bm.map(async (b) => {
          try {
            const q = await api.questions.get(b.question_id);
            qMap.set(b.question_id, q);
          } catch { /* question may not exist */ }
        });
        await Promise.all(fetches);
        setQuestions(qMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (questionId: string) => {
    await api.bookmarks.delete(questionId);
    setBookmarks((prev) => prev.filter((b) => b.question_id !== questionId));
    window.dispatchEvent(new CustomEvent('bookmarks-changed'));
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="chiron-dash min-h-screen">
      <div className="dash-glow" />

      <section className="py-14 chiron-page-enter" style={{ '--page-enter-order': 0 } as React.CSSProperties}>
        <div className="container max-w-4xl">
          <div className="mb-6">
            <p className="chiron-feature-label">Tools</p>
            <h1 className="chiron-feature-heading">Bookmarks</h1>
            <p className="chiron-feature-body mt-2">Questions you've saved for later review.</p>
          </div>
          <FreeTierBanner used={bookmarks.length} limit={25} feature="bookmarks" />

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="chiron-mockup animate-pulse h-16" />
              ))}
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="chiron-mockup">
              <EmptyState
                icon={BookmarkIcon}
                title="No bookmarks yet"
                description="Bookmark questions during exams to review them later."
              />
            </div>
          ) : (
            <div className="chiron-mockup">
              <p className="chiron-mockup-label mb-4">{bookmarks.length} saved question{bookmarks.length !== 1 ? 's' : ''}</p>
              <div className="space-y-2">
                {bookmarks.map((bm) => {
                  const q = questions.get(bm.question_id);
                  return (
                    <div key={bm.id} className="chiron-progress-row">
                      <div className="flex items-start gap-3">
                        <BookOpen className="w-4 h-4 text-[var(--color-brand-blue)] mt-0.5 shrink-0" />
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => setExpandedId(expandedId === bm.question_id ? null : bm.question_id)}
                        >
                          {q ? (
                            <>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-brand-blue)]">
                                  {q.section}
                                </span>
                                <span className="text-[0.65rem] text-[var(--color-text-muted)]">
                                  Saved {formatDate(bm.created_at)}
                                </span>
                              </div>
                              <p className={`text-sm text-[var(--color-text-primary)] ${expandedId === bm.question_id ? '' : 'line-clamp-2'}`}>
                                {q.question_stem}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-[var(--color-text-tertiary)]">
                              Question {bm.question_id}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(bm.question_id)}
                          className="p-2.5 md:p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-bg-hover)] transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
