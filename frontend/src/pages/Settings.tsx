import { Link } from 'react-router-dom';
import { ChevronLeft, CreditCard, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Settings() {
  const { user } = useAuth();

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--color-bg-secondary)]">
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/dashboard"
            className="p-2 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
            aria-label="Back to dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)] font-display tracking-tight">
              Settings
            </h1>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
              Account and billing
            </p>
          </div>
        </div>

        {/* User / profile */}
        <section className="card rounded-lg mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <User className="w-5 h-5 text-[var(--color-text-tertiary)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Profile
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Your account information.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Email
              </p>
              <p className="text-sm text-[var(--color-text-primary)] mt-0.5">
                {user?.email ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Display name
              </p>
              <p className="text-sm text-[var(--color-text-primary)] mt-0.5">
                {user?.display_name ?? '—'}
              </p>
            </div>
          </div>
        </section>

        {/* Billing */}
        <section className="card rounded-lg mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[var(--color-text-tertiary)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Billing
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Manage your subscription and payment methods.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Billing is not yet available. It will appear here when enabled.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
