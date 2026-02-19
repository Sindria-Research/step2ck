import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, CreditCard, User, Moon, Sun, Monitor, Target, ArrowRight, Zap, CheckCircle2, Activity, Sparkles, BookOpen, Search, Infinity, Receipt, ExternalLink, Bug } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/api';
import type { SubscriptionStatus, DailySummary } from '../api/types';
import { DatePicker } from '../components/common/DatePicker';

const isDev = import.meta.env.DEV;

export function Settings() {
  const { user, isPro: realIsPro, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, setTheme } = useTheme();
  const [devProOverride, setDevProOverride] = useState<boolean | null>(null);
  const isPro = devProOverride !== null ? devProOverride : realIsPro;
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [targetScore, setTargetScore] = useState(240);
  const [dailyGoal, setDailyGoal] = useState(40);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setCheckoutSuccess(true);
      refreshUser();
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshUser]);

  useEffect(() => {
    api.billing.getSubscription()
      .then(setSubscription)
      .catch(() => {})
      .finally(() => setBillingLoading(false));
  }, [isPro]);

  useEffect(() => {
    api.progress.dailySummary().then(setDailySummary).catch(() => {});
  }, []);

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
                  <DatePicker
                    value={examDate}
                    onChange={setExamDate}
                    min={new Date().toISOString().split('T')[0]}
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

        {/* Usage / Limits */}
        <section className="card rounded-lg mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <Activity className="w-5 h-5 text-[var(--color-text-tertiary)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Usage
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {isPro ? 'Unlimited access across all features.' : 'Daily limits reset at midnight UTC.'}
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--color-border)] space-y-4">
            {(() => {
              const questionsUsed = dailySummary?.today_count ?? 0;
              const questionsLimit = isPro ? null : 40;
              const aiUsed = 0;
              const aiLimit = isPro ? null : 5;

              const limits: { label: string; icon: React.ReactNode; used: number; cap: number | null }[] = [
                { label: 'Questions today', icon: <BookOpen className="w-3.5 h-3.5" />, used: questionsUsed, cap: questionsLimit },
                { label: 'AI explanations', icon: <Sparkles className="w-3.5 h-3.5" />, used: aiUsed, cap: aiLimit },
                { label: 'Search', icon: <Search className="w-3.5 h-3.5" />, used: 0, cap: isPro ? null : 50 },
              ];

              return limits.map((item) => {
                const unlimited = item.cap === null;
                const pct = unlimited ? 100 : item.cap! > 0 ? Math.min(100, (item.used / item.cap!) * 100) : 0;
                const nearLimit = !unlimited && item.cap! > 0 && pct >= 80;

                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)]">
                        {item.icon}
                        {item.label}
                      </span>
                      <span className={`text-xs font-semibold tabular-nums ${
                        unlimited
                          ? 'text-[var(--color-brand-blue)]'
                          : nearLimit
                            ? 'text-[var(--color-warning)]'
                            : 'text-[var(--color-text-tertiary)]'
                      }`}>
                        {unlimited ? (
                          <span className="inline-flex items-center gap-1">
                            <Infinity className="w-3.5 h-3.5" /> Unlimited
                          </span>
                        ) : (
                          `${item.used} / ${item.cap}`
                        )}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-[var(--color-bg-tertiary)]">
                      {unlimited ? (
                        <div className="chiron-pro-bar h-full rounded-full w-full" />
                      ) : (
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            nearLimit
                              ? 'bg-[var(--color-warning)]'
                              : 'bg-[var(--color-brand-blue)]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              });
            })()}
            {isPro ? (
              <button
                type="button"
                onClick={async () => {
                  setPortalLoading(true);
                  try {
                    const { portal_url } = await api.billing.createPortal();
                    if (portal_url) window.location.href = portal_url;
                  } catch {}
                  setPortalLoading(false);
                }}
                disabled={portalLoading}
                className="chiron-btn chiron-btn-subtle px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 mt-2"
              >
                {portalLoading ? 'Loading...' : 'Manage subscription'}
              </button>
            ) : (
              <Link
                to="/pricing"
                className="chiron-btn chiron-btn-primary px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 mt-2"
              >
                
                Manage subscription
              </Link>
            )}
          </div>
        </section>

        {/* Checkout success banner */}
        {checkoutSuccess && (
          <div className="mb-6 rounded-lg border border-[var(--color-success)] bg-[var(--color-success-bg)] p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-success)]">Welcome to Pro!</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Your subscription is active. Enjoy unlimited access to all features.
              </p>
            </div>
          </div>
        )}

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
            {billingLoading ? (
              <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
            ) : isPro ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-brand-blue)] text-white text-xs font-bold uppercase tracking-wider">
                    <Zap className="w-3 h-3" /> Pro
                  </span>
                  {subscription?.status === 'trialing' && (
                    <span className="text-xs text-[var(--color-text-muted)]">Trial active</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {subscription?.interval && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        Billing
                      </p>
                      <p className="text-[var(--color-text-primary)] mt-0.5 capitalize">{subscription.interval}ly</p>
                    </div>
                  )}
                  {subscription?.current_period_end && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        {subscription.cancel_at ? 'Access until' : 'Next renewal'}
                      </p>
                      <p className="text-[var(--color-text-primary)] mt-0.5">
                        {new Date(subscription.current_period_end).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {subscription?.trial_end && subscription.status === 'trialing' && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        Trial ends
                      </p>
                      <p className="text-[var(--color-text-primary)] mt-0.5">
                        {new Date(subscription.trial_end).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                {subscription?.cancel_at && (
                  <p className="text-xs text-[var(--color-warning)]">
                    Your subscription is set to cancel. You'll retain access until the end of your billing period.
                  </p>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    setPortalLoading(true);
                    try {
                      const { portal_url } = await api.billing.createPortal();
                      if (portal_url) window.location.href = portal_url;
                    } catch {}
                    setPortalLoading(false);
                  }}
                  disabled={portalLoading}
                  className="chiron-btn chiron-btn-subtle px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
                >
                  {portalLoading ? 'Loading...' : 'Manage subscription'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">
                    Free
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Upgrade to Pro for unlimited AI explanations, personalized exams, study plans, and more.
                </p>
                <Link
                  to="/pricing"
                  className="chiron-btn chiron-btn-primary px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
                >
                  Upgrade to Pro
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Invoices & History */}
        <section className="card rounded-lg mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <Receipt className="w-5 h-5 text-[var(--color-text-tertiary)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Invoices
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Your billing history and receipts.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--color-border)]">
            {billingLoading ? (
              <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
            ) : isPro && subscription ? (
              <div className="space-y-3">
                {/* Trial row */}
                {subscription.status === 'trialing' && subscription.trial_end && (
                  <div className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-dashed border-[var(--color-brand-blue)] bg-[color-mix(in_srgb,var(--color-brand-blue)_6%,var(--color-bg-primary))]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-[color-mix(in_srgb,var(--color-brand-blue)_14%,transparent)] flex items-center justify-center">
                        <Zap className="w-4 h-4 text-[var(--color-brand-blue)]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          7-day free trial
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Ends {new Date(subscription.trial_end).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-success)]">
                      $0.00
                    </span>
                  </div>
                )}

                {/* Current / upcoming charge row */}
                {subscription.current_period_end && (
                  <div className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-[color-mix(in_srgb,var(--color-brand-blue)_12%,transparent)] flex items-center justify-center">
                        <Receipt className="w-4 h-4 text-[var(--color-brand-blue)]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          Pro — {subscription.interval === 'year' ? 'Annual' : 'Monthly'}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {subscription.status === 'trialing'
                            ? `First charge on ${new Date(subscription.trial_end!).toLocaleDateString()}`
                            : `Billed ${new Date(
                                new Date(subscription.current_period_end).getTime() -
                                (subscription.interval === 'year' ? 365 : 30) * 86400000
                              ).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
                      ${subscription.interval === 'year' ? '290' : '29'}.00
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    setPortalLoading(true);
                    try {
                      const { portal_url } = await api.billing.createPortal();
                      if (portal_url) window.location.href = portal_url;
                    } catch {}
                    setPortalLoading(false);
                  }}
                  disabled={portalLoading}
                  className="text-sm text-[var(--color-brand-blue)] hover:underline font-medium inline-flex items-center gap-1.5"
                >
                  View all invoices in Stripe
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <Receipt className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2 opacity-40" />
                <p className="text-sm text-[var(--color-text-muted)]">No invoices yet</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Invoices will appear here after you subscribe to Pro.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Dev tools */}
        {isDev && (
          <section className="card rounded-lg mb-6 border-dashed !border-[var(--color-warning)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-warning-bg)] flex items-center justify-center">
                <Bug className="w-5 h-5 text-[var(--color-warning)]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Dev Tools
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Only visible in development.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">Simulate Pro plan</span>
                <div className="flex items-center gap-2">
                  {(['off', 'free', 'pro'] as const).map((mode) => {
                    const active =
                      mode === 'off' ? devProOverride === null :
                      mode === 'free' ? devProOverride === false :
                      devProOverride === true;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() =>
                          setDevProOverride(mode === 'off' ? null : mode === 'pro')
                        }
                        className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition-all ${
                          active
                            ? 'border-[var(--color-warning)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]'
                            : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                        }`}
                      >
                        {mode === 'off' ? 'Real' : mode === 'free' ? 'Free' : 'Pro'}
                      </button>
                    );
                  })}
                </div>
              </div>
              {devProOverride !== null && (
                <p className="text-xs text-[var(--color-warning)]">
                  Overriding plan to <strong>{devProOverride ? 'Pro' : 'Free'}</strong> — UI only, no backend change.
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
