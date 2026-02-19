import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { APP_NAME } from '../config/branding';

export function Privacy() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <article className="panel p-8 sm:p-10" style={{ boxShadow: 'var(--shadow-md)' }}>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] font-display tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-8">
            Last updated: placeholder. How {APP_NAME} handles your data.
          </p>
          <div className="prose prose-sm max-w-none text-[var(--color-text-secondary)] space-y-4">
            <p>
              This page is a placeholder. Full privacy policy will be added here later.
            </p>
            <p>
              Please check back for updates.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
