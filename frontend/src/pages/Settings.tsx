import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, CreditCard, User, Moon, Sun, Monitor, Target, ArrowRight, Crown, CheckCircle2, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/api';
import type { SubscriptionStatus } from '../api/types';

function trialDaysLeft(trialEnd: string | null): number | null {
  if (!trialEnd) return null;
  const diff = new Date(trialEnd).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 86_400_000);
}

export function Settings() {
  const { user, isPro, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, setTheme } = useTheme();
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [targetScore, setTargetScore] = useState(240);
  const [dailyGoal, setDailyGoal] = useState(40);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const pollingRef = useRef(false);

  useEffect(() => {
    if (searchParams.get('checkout') !== 'success' || pollingRef.current) return;
    pollingRef.current = true;
    setCheckoutSuccess(true);
    searchParams.delete('checkout');
    setSearchParams(searchParams, { replace: true });

    let attempts = 0;
    const poll = async () => {
      while (attempts < 10) {
        await refreshUser();
        const sub = await api.billing.getSubscription().catch(() => null);
        if (sub) setSubscription(sub);
        if (sub?.plan === 'pro' || sub?.status === 'active' || sub?.status === 'trialing') {
          setBillingLoading(false);
          return;
        }
        attempts++;
        await new Promise((r) => setTimeout(r, 2000));
      }
      setBillingLoading(false);
    };
    poll();
  }, [searchParams, setSearchParams, refreshUser]);

  useEffect(() => {
    if (pollingRef.current) return;
    api.billing.getSubscription()
      .then(setSubscription)
      .catch(() => {})
      .finally(() => setBillingLoading(false));
  }, [isPro]);

  useEffect(() => {
    api.studyProfile.get()
      .then((p) => {
        if (p.exam_date) setExamDate(p.exam_date);
        if (p.target_score) setTargetScore(p.target_score);
        setDailyGoal(p.daily_question_goal);
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  const handleSaveProfile = useCallback(async () => {
    setProfileSaving(true);
    try {
      await api.studyProfile.update({
        exam_date: examDate || null,
        target_score: targetScore,
        daily_question_goal: dailyGoal,
      });
    } catch {}
    setProfileSaving(false);
  }, [examDate, targetScore, dailyGoal]);

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
              Account and preferences
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

        {/* Study Profile */}
        <section className="card rounded-lg mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <Target className="w-5 h-5 text-[var(--color-text-tertiary)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Study Profile
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Your exam date, target score, and daily goal.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--color-border)] space-y-4">
            {profileLoading ? (
              <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] block mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full max-w-xs px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] block mb-1">
                    Target Score
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={200}
                      max={290}
                      step={5}
                      value={targetScore}
                      onChange={(e) => setTargetScore(Number(e.target.value))}
                      className="flex-1 max-w-xs accent-[var(--color-brand-blue)]"
                    />
                    <span className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)] w-10 text-right">{targetScore}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] block mb-1">
                    Daily Question Goal
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(Math.max(1, Math.min(500, Number(e.target.value))))}
                    className="w-24 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="chiron-btn chiron-btn-primary px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {profileSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </section>

        {/* Appearance */}
        <section className="card rounded-lg mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <Monitor className="w-5 h-5 text-[var(--color-text-tertiary)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Appearance
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Customize your interface theme.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--color-border)]">
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-md border text-sm font-medium transition-all ${theme === 'light'
                    ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] border-[var(--color-text-primary)]'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'
                  }`}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-md border text-sm font-medium transition-all ${theme === 'dark'
                    ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] border-[var(--color-text-primary)]'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'
                  }`}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
            </div>
          </div>
        </section>

        {/* Checkout success banner */}
        {checkoutSuccess && (isPro || subscription?.status === 'trialing' || subscription?.status === 'active') && (
          <div className="mb-6 rounded-lg border border-[var(--color-success)]/40 bg-[var(--color-success)]/5 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-success)]">Welcome to Pro!</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Your subscription is active. Enjoy unlimited access to all features.
              </p>
            </div>
          </div>
        )}

        {/* Subscription & Billing */}
        <section className="card rounded-lg mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[var(--color-text-tertiary)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Subscription
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {isPro ? 'Your plan and billing.' : 'Manage your plan.'}
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--color-border)]">
            {billingLoading ? (
              <div className="space-y-3">
                <div className="skeleton h-6 w-20 rounded-full" />
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-9 w-40 rounded-lg" />
              </div>
            ) : (isPro || subscription?.status === 'active' || subscription?.status === 'trialing') ? (
              <ProBillingSection subscription={subscription} portalLoading={portalLoading} setPortalLoading={setPortalLoading} />
            ) : (
              <FreeBillingSection />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}


function ProBillingSection({
  subscription,
  portalLoading,
  setPortalLoading,
}: {
  subscription: SubscriptionStatus | null;
  portalLoading: boolean;
  setPortalLoading: (v: boolean) => void;
}) {
  const isTrialing = subscription?.status === 'trialing';
  const days = trialDaysLeft(subscription?.trial_end ?? null);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { portal_url } = await api.billing.createPortal();
      if (portal_url) window.location.href = portal_url;
    } catch {}
    setPortalLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Plan badge + trial banner */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-brand-blue)] text-white text-xs font-bold uppercase tracking-wider">
          <Crown className="w-3 h-3" /> Pro
        </span>
        {subscription?.interval && (
          <span className="text-xs text-[var(--color-text-muted)] capitalize">
            {subscription.interval === 'month' ? 'Monthly' : 'Annual'} plan
          </span>
        )}
      </div>

      {isTrialing && days != null && (
        <div className="rounded-lg border border-[var(--color-brand-blue)]/20 bg-[var(--color-brand-blue)]/5 px-4 py-3 flex items-center gap-3">
          <div className="text-2xl font-bold tabular-nums text-[var(--color-brand-blue)]">{days}</div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {days === 1 ? 'day' : 'days'} left in your free trial
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {subscription?.trial_end
                ? `Trial ends ${new Date(subscription.trial_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                : 'Your card will be charged when the trial ends.'}
            </p>
          </div>
        </div>
      )}

      {subscription?.cancel_at && (
        <div className="rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 px-4 py-3">
          <p className="text-sm font-medium text-[var(--color-warning)]">
            Subscription canceling
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            You'll retain Pro access until {new Date(subscription.cancel_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
          </p>
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {subscription?.current_period_end && !subscription.cancel_at && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Next renewal
            </p>
            <p className="text-sm text-[var(--color-text-primary)] mt-0.5">
              {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Status
          </p>
          <p className="text-sm text-[var(--color-text-primary)] mt-0.5 capitalize">
            {subscription?.status === 'trialing' ? 'Free trial' : subscription?.status ?? 'Active'}
          </p>
        </div>
      </div>

      {/* Manage button — opens Stripe Customer Portal (invoices, payment method, cancel) */}
      <button
        type="button"
        onClick={openPortal}
        disabled={portalLoading}
        className="chiron-btn chiron-btn-subtle px-4 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2"
      >
        {portalLoading ? 'Loading...' : 'Manage subscription'}
        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
      </button>
      <p className="text-xs text-[var(--color-text-muted)] -mt-3">
        Update payment method, view invoices, or cancel your plan.
      </p>
    </div>
  );
}


function FreeBillingSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">
          Free
        </span>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)]">
        You're on the free plan with limited daily usage. Upgrade to Pro for unlimited AI explanations, personalized exams, study plans, and more.
      </p>
      <Link
        to="/pricing"
        className="chiron-btn chiron-btn-primary px-5 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2"
      >
        Upgrade to Pro
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
