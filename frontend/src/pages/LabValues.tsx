import { FlaskConical, ArrowLeft, Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LAB_SECTIONS } from '../data/labValues';
import type { LabValueRow } from '../data/labValues';
import { useEffect, useMemo, useRef, useState } from 'react';

function matchesRow(row: LabValueRow, q: string): boolean {
  const lower = q.toLowerCase();
  return (
    row.name.toLowerCase().includes(lower) ||
    row.normal.toLowerCase().includes(lower) ||
    row.unit.toLowerCase().includes(lower) ||
    (row.notes?.toLowerCase().includes(lower) ?? false)
  );
}

export function LabValues() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return LAB_SECTIONS;
    return LAB_SECTIONS.map((section) => {
      const rows = section.rows.filter((row) => matchesRow(row, q));
      return rows.length ? { ...section, rows } : null;
    }).filter((s): s is NonNullable<typeof s> => s !== null);
  }, [searchQuery]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -4% 0px' }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="chiron-dash flex-1 overflow-y-auto">
      <div className="dash-glow dash-glow-one" aria-hidden />
      <div className="dash-glow dash-glow-two" aria-hidden />

      {/* ── Header ── */}
      <div className="relative z-[1] pt-8 pb-6 md:pt-12 md:pb-8">
        <div className="container">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="group inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to dashboard
          </button>
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)] font-display tracking-tight">
            Lab values
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)] max-w-lg leading-relaxed">
            Reference ranges for common labs. For study use only.
          </p>

          {/* Search */}
          <div className="mt-6 max-w-md">
            <label htmlFor="lab-values-search" className="sr-only">
              Search lab values
            </label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" aria-hidden />
              <input
                id="lab-values-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, range, unit..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Stripe ── */}
      <section className="py-14 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-primary)_94%,transparent)] chiron-reveal" data-reveal>
        <div className="container">
          <div className="grid gap-8 max-w-5xl">
            {filteredSections.length === 0 ? (
              <p className="text-sm text-[var(--color-text-tertiary)] py-8 text-center col-span-full">
                No lab values match &quot;{searchQuery}&quot;. Try a different term.
              </p>
            ) : (
            filteredSections.map((section) => (
              <div key={section.title} className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center gap-3 bg-[var(--color-bg-secondary)]/30">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-secondary)]">
                    <FlaskConical className="w-4 h-4" aria-hidden />
                  </div>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    {section.title}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/50">
                        <th className="text-left font-medium text-[var(--color-text-secondary)] py-3 px-6 w-[25%]">
                          Lab
                        </th>
                        <th className="text-left font-medium text-[var(--color-text-secondary)] py-3 px-6 w-[25%]">
                          Normal range
                        </th>
                        <th className="text-left font-medium text-[var(--color-text-secondary)] py-3 px-6 w-[15%]">
                          Unit
                        </th>
                        <th className="text-left font-medium text-[var(--color-text-secondary)] py-3 px-6 hidden sm:table-cell">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {section.rows.map((row) => (
                        <tr
                          key={row.name}
                          className="hover:bg-[var(--color-bg-secondary)]/50 transition-colors"
                        >
                          <td className="py-3 px-6 font-medium text-[var(--color-text-primary)]">
                            {row.name}
                          </td>
                          <td className="py-3 px-6 text-[var(--color-text-primary)] tabular-nums">
                            {row.normal}
                          </td>
                          <td className="py-3 px-6 text-[var(--color-text-tertiary)]">
                            {row.unit}
                          </td>
                          <td className="py-3 px-6 text-[var(--color-text-tertiary)] hidden sm:table-cell">
                            {row.notes ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
