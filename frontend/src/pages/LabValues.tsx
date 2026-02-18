import { FlaskConical } from 'lucide-react';
import { LAB_SECTIONS } from '../data/labValues';

export function LabValues() {
  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-bg-secondary)]">
      <div className="max-w-[900px] mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] font-display tracking-tight">
            Lab Values
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1 text-sm">
            Reference ranges for common labs. For study use only; always confirm with your institution or lab.
          </p>
        </div>

        <div className="space-y-8">
          {LAB_SECTIONS.map((section) => (
            <section key={section.title} className="card rounded-lg overflow-hidden">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)] px-5 py-4 border-b border-[var(--color-border)] flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[var(--color-text-tertiary)]" aria-hidden />
                {section.title}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left font-medium text-[var(--color-text-secondary)] py-3 px-5">
                        Lab
                      </th>
                      <th className="text-left font-medium text-[var(--color-text-secondary)] py-3 px-5">
                        Normal range
                      </th>
                      <th className="text-left font-medium text-[var(--color-text-secondary)] py-3 px-5">
                        Unit
                      </th>
                      <th className="text-left font-medium text-[var(--color-text-secondary)] py-3 px-5 hidden sm:table-cell">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row) => (
                      <tr
                        key={row.name}
                        className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-hover)] transition-colors"
                      >
                        <td className="py-2.5 px-5 font-medium text-[var(--color-text-primary)]">
                          {row.name}
                        </td>
                        <td className="py-2.5 px-5 text-[var(--color-text-secondary)]">
                          {row.normal}
                        </td>
                        <td className="py-2.5 px-5 text-[var(--color-text-tertiary)]">
                          {row.unit}
                        </td>
                        <td className="py-2.5 px-5 text-[var(--color-text-tertiary)] hidden sm:table-cell">
                          {row.notes ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
