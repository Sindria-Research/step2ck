import { useState, useCallback, useEffect } from 'react';
import { Search as SearchIcon, BookOpen, ChevronRight, Check, Bookmark } from 'lucide-react';
import { api } from '../api/api';
import type { Question } from '../api/types';

const CHOICE_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [sections, setSections] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkTogglingId, setBookmarkTogglingId] = useState<string | null>(null);

  useEffect(() => {
    api.questions.sections().then((r) => setSections(r.sections)).catch(() => {});
  }, []);

  useEffect(() => {
    api.bookmarks.list().then((bm) => setBookmarkedIds(new Set(bm.map((b) => b.question_id)))).catch(() => {});
  }, []);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.questions.list({
        sections: selectedSection ? [selectedSection] : undefined,
        limit: 50,
      });
      const filtered = query.trim()
        ? res.items.filter((q) =>
            q.question_stem.toLowerCase().includes(query.toLowerCase()) ||
            q.section.toLowerCase().includes(query.toLowerCase()) ||
            (q.subsection?.toLowerCase().includes(query.toLowerCase()) ?? false)
          )
        : res.items;
      setResults(filtered);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, selectedSection]);

  const toggleBookmark = useCallback(async (e: React.MouseEvent, questionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarkTogglingId) return;
    setBookmarkTogglingId(questionId);
    const wasBookmarked = bookmarkedIds.has(questionId);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
    try {
      if (wasBookmarked) await api.bookmarks.delete(questionId);
      else await api.bookmarks.create(questionId);
      window.dispatchEvent(new CustomEvent('bookmarks-changed'));
    } catch {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.add(questionId);
        else next.delete(questionId);
        return next;
      });
    } finally {
      setBookmarkTogglingId(null);
    }
  }, [bookmarkedIds, bookmarkTogglingId]);

  return (
    <div className="chiron-dash flex-1 overflow-y-auto min-h-0">
      <div className="dash-glow" />

      <section className="py-14 chiron-page-enter" style={{ '--page-enter-order': 0 } as React.CSSProperties}>
        <div className="container max-w-4xl">
          <div className="mb-8">
            <p className="chiron-feature-label">QBank</p>
            <h1 className="chiron-feature-heading">Search</h1>
            <p className="chiron-feature-body mt-2">Find questions by keyword, topic, or section.</p>
          </div>

          {/* Search bar */}
          <div className="chiron-mockup mb-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search questions..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                />
              </div>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
              >
                <option value="">All Sections</option>
                {sections.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg btn-primary text-sm font-medium transition-all disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Results */}
          {searched && (
            <div className="chiron-mockup">
              <p className="chiron-mockup-label mb-4">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </p>
              {results.length === 0 ? (
                <p className="text-sm text-[var(--color-text-tertiary)] py-4 text-center">
                  No questions match your search. Try different keywords.
                </p>
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {results.map((q) => {
                    const isExpanded = expandedId === q.id;
                    const choiceKeys = CHOICE_ORDER.filter((k) => k in (q.choices || {}));
                    return (
                      <div key={q.id} className="first:pt-0 pt-2 first:mt-0 mt-2">
                        <div className="flex items-start gap-3 rounded-lg py-2.5 px-1 -mx-1 hover:bg-[var(--color-bg-tertiary)]">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : q.id)}
                            className="flex-1 flex items-start gap-3 text-left min-w-0"
                          >
                            <BookOpen className="w-4 h-4 text-[var(--color-brand-blue)] mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-brand-blue)]">
                                  {q.section}
                                </span>
                                {q.subsection && (
                                  <span className="text-[0.65rem] text-[var(--color-text-muted)]">
                                    &middot; {q.subsection}
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm text-[var(--color-text-primary)] ${isExpanded ? '' : 'line-clamp-2'}`}>
                                {q.question_stem}
                              </p>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-[var(--color-text-muted)] shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => toggleBookmark(e, q.id)}
                            disabled={bookmarkTogglingId === q.id}
                            className={`p-1.5 rounded-md transition-colors focus-ring shrink-0 ${
                              bookmarkedIds.has(q.id)
                                ? 'text-[var(--color-accent)] bg-[var(--color-bg-active)]'
                                : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                            }`}
                            title={bookmarkedIds.has(q.id) ? 'Remove from bookmarks' : 'Add to bookmarks'}
                            aria-label={bookmarkedIds.has(q.id) ? 'Remove from bookmarks' : 'Add to bookmarks'}
                          >
                            <Bookmark className={`w-4 h-4 ${bookmarkedIds.has(q.id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="pl-7 pr-1 pb-3 pt-1 rounded-lg bg-[var(--color-bg-tertiary)]/50">
                            <p className="text-[0.72rem] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">Answer choices</p>
                            <ul className="space-y-2">
                              {choiceKeys.map((key) => {
                                const label = q.choices[key];
                                const isCorrect = q.correct_answer === key;
                                return (
                                  <li
                                    key={key}
                                    className={`flex items-start gap-2 text-sm ${isCorrect ? 'text-[var(--color-success)]' : 'text-[var(--color-text-secondary)]'}`}
                                  >
                                    <span className="font-medium shrink-0 w-5">{key}.</span>
                                    <span className={isCorrect ? 'font-medium' : ''}>
                                      {label}
                                      {isCorrect && (
                                        <span className="inline-flex items-center gap-1 ml-2 text-[0.65rem] uppercase tracking-wider text-[var(--color-success)]">
                                          <Check className="w-3 h-3" /> Correct
                                        </span>
                                      )}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
