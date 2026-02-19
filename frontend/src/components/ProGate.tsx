import { Link } from 'react-router-dom';
import { Lock, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProGateProps {
  children: React.ReactNode;
  feature?: string;
}

export function ProGate({ children, feature }: ProGateProps) {
  const { isPro } = useAuth();

  if (isPro) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-30 blur-[2px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 shadow-lg max-w-sm text-center">
          <div className="w-10 h-10 rounded-full bg-[var(--color-brand-blue)]/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5 text-[var(--color-brand-blue)]" />
          </div>
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
            Pro feature
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            {feature
              ? `${feature} requires a Pro plan.`
              : 'Upgrade to Pro to unlock this feature.'}
          </p>
          <Link
            to="/pricing"
            className="chiron-btn chiron-btn-primary px-5 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
          >
            Upgrade to Pro
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-wider bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)]">
      <Zap className="w-2.5 h-2.5" />
      Pro
    </span>
  );
}

interface UsageIndicatorProps {
  used: number;
  limit: number;
  label?: string;
}

export function UsageIndicator({ used, limit, label }: UsageIndicatorProps) {
  const pct = Math.min(100, (used / limit) * 100);
  const atLimit = used >= limit;

  return (
    <div className="flex items-center gap-2 text-xs">
      {label && (
        <span className="text-[var(--color-text-muted)]">{label}</span>
      )}
      <span className={`tabular-nums font-medium ${atLimit ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]'}`}>
        {used}/{limit}
      </span>
      <div className="w-12 h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${atLimit ? 'bg-[var(--color-error)]' : 'bg-[var(--color-brand-blue)]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {atLimit && (
        <Link
          to="/pricing"
          className="text-[var(--color-brand-blue)] hover:underline font-medium"
        >
          Upgrade
        </Link>
      )}
    </div>
  );
}

interface UpgradePromptProps {
  message?: string;
  compact?: boolean;
}

export function UpgradePrompt({ message, compact }: UpgradePromptProps) {
  if (compact) {
    return (
      <Link
        to="/pricing"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-brand-blue)] hover:underline font-medium"
      >
        <Zap className="w-3 h-3" />
        Upgrade to Pro
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-[var(--color-brand-blue)]/10 flex items-center justify-center shrink-0">
        <Zap className="w-4 h-4 text-[var(--color-brand-blue)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {message || 'Upgrade to Pro for unlimited access.'}
        </p>
      </div>
      <Link
        to="/pricing"
        className="chiron-btn chiron-btn-primary px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 shrink-0"
      >
        Upgrade
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
