import { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search as SearchIcon, FlaskConical } from 'lucide-react';
import { LAB_SECTIONS } from '../../data/labValues';
import type { LabValueRow } from '../../data/labValues';

interface LabValuesModalProps {
  open: boolean;
  onClose: () => void;
}

function matchesRow(row: LabValueRow, q: string): boolean {
  const lower = q.toLowerCase();
  return (
    row.name.toLowerCase().includes(lower) ||
    row.normal.toLowerCase().includes(lower) ||
    row.unit.toLowerCase().includes(lower) ||
    (row.notes?.toLowerCase().includes(lower) ?? false)
  );
}

export function LabValuesModal({ open, onClose }: LabValuesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return LAB_SECTIONS;
    return LAB_SECTIONS.map((section) => {
      const rows = section.rows.filter((row) => matchesRow(row, q));
      return rows.length ? { ...section, rows } : null;
    }).filter((s): s is NonNullable<typeof s> => s !== null);
  }, [searchQuery]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setSearchQuery('');
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Lab values reference"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Enter' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close lab values"
      />
      <div
        className="relative w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[80vh] flex flex-col rounded-none sm:rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border)] animate-slide-up overflow-hidden"
        style={{ boxShadow: 'var(--shadow-elevated)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <FlaskConical className="w-4.5 h-4.5 text-[var(--color-text-secondary)]" />
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] font-display">
              Lab values
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] transition-colors focus-ring"
            aria-label="Close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 px-5 py-3 border-b border-[var(--color-border)]">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" aria-hidden />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, range, unit..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {filteredSections.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)] py-6 text-center">
              No lab values match &quot;{searchQuery}&quot;
            </p>
          ) : (
            filteredSections.map((section) => (
              <div
                key={section.title}
                className="border border-[var(--color-border)] rounded-lg overflow-hidden"
              >
                <div className="px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30">
                  <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left font-medium text-[var(--color-text-secondary)] py-2 px-4 text-xs">Lab</th>
                      <th className="text-left font-medium text-[var(--color-text-secondary)] py-2 px-4 text-xs">Normal</th>
                      <th className="text-left font-medium text-[var(--color-text-secondary)] py-2 px-4 text-xs">Unit</th>
                      <th className="text-left font-medium text-[var(--color-text-secondary)] py-2 px-4 text-xs hidden sm:table-cell">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {section.rows.map((row) => (
                      <tr key={row.name} className="hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
                        <td className="py-2 px-4 font-medium text-[var(--color-text-primary)] text-sm">{row.name}</td>
                        <td className="py-2 px-4 text-[var(--color-text-primary)] tabular-nums text-sm">{row.normal}</td>
                        <td className="py-2 px-4 text-[var(--color-text-tertiary)] text-sm">{row.unit}</td>
                        <td className="py-2 px-4 text-[var(--color-text-tertiary)] text-sm hidden sm:table-cell">{row.notes ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
