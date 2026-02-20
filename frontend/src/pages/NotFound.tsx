import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function NotFound() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const destination = user ? '/dashboard' : '/';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-secondary)] px-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-accent)]/10 mx-auto mb-6">
          <Search className="w-8 h-8 text-[var(--color-accent)]" />
        </div>

        <h1 className="text-6xl font-bold text-[var(--color-text-primary)] tracking-tight">
          404
        </h1>
        <p className="mt-3 text-lg text-[var(--color-text-secondary)]">
          Page not found
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Nothing at <code className="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-xs font-mono">{pathname}</code>
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to={destination}
            className="btn btn-primary flex items-center gap-2 py-2.5 px-5 rounded-lg focus-ring text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {user ? 'Back to Dashboard' : 'Go Home'}
          </Link>
        </div>
      </div>
    </div>
  );
}
