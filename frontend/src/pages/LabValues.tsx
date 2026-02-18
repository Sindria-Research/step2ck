import { FlaskConical, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LAB_SECTIONS } from '../data/labValues';
import { useEffect, useRef } from 'react';

export function LabValues() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);

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

      {/* ── Hero Stripe ── */}
      <section className="relative z-[1] pt-14 pb-16 md:pt-24 md:pb-24 chiron-reveal" data-reveal>
        <div className="container">
          <div className="max-w-4xl">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="group inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to dashboard
            </button>

            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-[var(--color-border)] text-[0.7rem] font-bold tracking-wider text-[var(--color-text-secondary)] uppercase mb-6 shadow-sm">
              Reference
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-[var(--color-text-primary)] font-display tracking-tight leading-[1.04]">
              Lab values
            </h1>
            <p className="mt-6 text-base md:text-lg text-[var(--color-text-secondary)] max-w-xl leading-relaxed">
              Reference ranges for common labs. For study use only; always confirm with your institution or lab.
            </p>
          </div>
        </div>
      </section>

      {/* ── Content Stripe ── */}
      <section className="py-14 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-primary)_94%,transparent)] chiron-reveal" data-reveal>
        <div className="container">
          <div className="grid gap-8 max-w-5xl">
            {LAB_SECTIONS.map((section) => (
              <div key={section.title} className="bg-white border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden">
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
