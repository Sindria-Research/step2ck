import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  X,
  ChevronLeft,
  Sparkles,
  Zap,
  Brain,
  BarChart3,
  CalendarDays,
  Clock3,
  FileText,
  Layers,
  Bookmark,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';

const FEATURES = [
  { label: 'Question bank (all / unused / incorrect)', free: true, pro: true },
  { label: 'Daily question limit', free: '40 / day', pro: 'Unlimited' },
  { label: 'AI explanations', free: '5 / day', pro: 'Unlimited' },
  { label: 'Personalized exam mode', free: false, pro: true },
  { label: 'Timed exam mode', free: false, pro: true },
  { label: 'AI study plan', free: false, pro: true },
  { label: 'Full performance analytics', free: false, pro: true },
  { label: 'Notes', free: '10', pro: 'Unlimited' },
  { label: 'Flashcard decks', free: '3', pro: 'Unlimited' },
  { label: 'Bookmarks', free: '25', pro: 'Unlimited' },
  { label: 'Search & Lab Values', free: true, pro: true },
  { label: 'Dark mode', free: true, pro: true },
];

const PRO_HIGHLIGHTS = [
  { icon: Brain, label: 'Unlimited AI explanations' },
  { icon: Sparkles, label: 'Personalized exam mode' },
  { icon: CalendarDays, label: 'AI-generated study plan' },
  { icon: Clock3, label: 'Timed exam mode' },
  { icon: BarChart3, label: 'Full performance analytics' },
  { icon: FileText, label: 'Unlimited notes & flashcards' },
];

export function Pricing() {
  const navigate = useNavigate();
  const { user, isPro } = useAuth();
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState(false);

  const monthlyPrice = 29;
  const annualPrice = 279;
  const effectiveMonthly = interval === 'year' ? Math.round((annualPrice / 12) * 100) / 100 : monthlyPrice;
  const savings = interval === 'year' ? Math.round(((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12)) * 100) : 0;

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isPro) return;

    setLoading(true);
    try {
      const { checkout_url } = await api.billing.createCheckout(interval);
      if (checkout_url) {
        window.location.href = checkout_url;
      }
    } catch (err) {
      console.error('Checkout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'string') {
      return <span className="text-sm text-[var(--color-text-primary)]">{value}</span>;
    }
    return value ? (
      <Check className="w-4 h-4 text-[var(--color-success)]" />
    ) : (
      <X className="w-4 h-4 text-[var(--color-text-muted)]" />
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-bg-secondary)]">
      <div className="max-w-[960px] mx-auto px-6 py-10 md:py-16">
        {user && (
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" /> Back to settings
          </Link>
        )}

        <div className="text-center mb-10">
          <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-brand-blue)] mb-3">
            Pricing
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] font-display tracking-tight">
            Unlock your full potential
          </h1>
          <p className="mt-3 text-base text-[var(--color-text-secondary)] max-w-lg mx-auto">
            Start free. Upgrade when you need unlimited AI explanations, personalized exams, and advanced analytics.
          </p>
        </div>

        {/* Interval toggle */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <button
            type="button"
            onClick={() => setInterval('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              interval === 'month'
                ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval('year')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-2 ${
              interval === 'year'
                ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            Annual
            <span className="text-[0.65rem] font-bold uppercase tracking-wider bg-[var(--color-success)] text-white px-1.5 py-0.5 rounded">
              Save {savings || 20}%
            </span>
          </button>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-14">
          {/* Free */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Free</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Get started with the core question bank
            </p>
            <div className="mt-5 mb-6">
              <span className="text-4xl font-bold text-[var(--color-text-primary)]">$0</span>
              <span className="text-sm text-[var(--color-text-muted)] ml-1">forever</span>
            </div>
            <ul className="space-y-2.5 flex-1">
              {[
                '40 questions / day',
                '5 AI explanations / day',
                'All / unused / incorrect modes',
                'Search & Lab Values',
                'Basic performance stats',
                '10 notes, 3 decks, 25 bookmarks',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
                  <Check className="w-4 h-4 text-[var(--color-success)] shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            {isPro ? (
              <div className="mt-6 py-2.5 text-center rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
                Previous plan
              </div>
            ) : user ? (
              <div className="mt-6 py-2.5 text-center rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)]">
                Current plan
              </div>
            ) : (
              <Link
                to="/login"
                className="mt-6 py-2.5 text-center rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors block"
              >
                Get started
              </Link>
            )}
          </div>

          {/* Pro */}
          <div className="rounded-xl border-2 border-[var(--color-brand-blue)] bg-[var(--color-bg-primary)] p-6 flex flex-col relative">
            <div className="absolute -top-3 left-6 bg-[var(--color-brand-blue)] text-white text-[0.65rem] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              Most Popular
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              Pro
              <Zap className="w-4 h-4 text-[var(--color-brand-blue)]" />
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Everything you need to maximize your score
            </p>
            <div className="mt-5 mb-6">
              <span className="text-4xl font-bold text-[var(--color-text-primary)]">
                ${interval === 'year' ? effectiveMonthly.toFixed(0) : monthlyPrice}
              </span>
              <span className="text-sm text-[var(--color-text-muted)] ml-1">/ month</span>
              {interval === 'year' && (
                <span className="block text-xs text-[var(--color-text-muted)] mt-0.5">
                  ${annualPrice} billed annually
                </span>
              )}
            </div>
            <ul className="space-y-2.5 flex-1">
              {PRO_HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
                  <Icon className="w-4 h-4 text-[var(--color-brand-blue)] shrink-0 mt-0.5" />
                  {label}
                </li>
              ))}
            </ul>
            {isPro ? (
              <div className="mt-6 py-2.5 text-center rounded-lg bg-[var(--color-brand-blue)] text-white text-sm font-medium">
                Current plan
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className="mt-6 py-2.5 rounded-lg bg-[var(--color-brand-blue)] text-white text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Redirecting...' : 'Start 7-day free trial'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Comparison table */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] overflow-hidden mb-14">
          <div className="px-6 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Feature comparison
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] px-6 py-3 w-1/2">
                    Feature
                  </th>
                  <th className="text-center text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] px-6 py-3">
                    Free
                  </th>
                  <th className="text-center text-xs font-medium uppercase tracking-wider text-[var(--color-brand-blue)] px-6 py-3">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f, i) => (
                  <tr
                    key={f.label}
                    className={i < FEATURES.length - 1 ? 'border-b border-[var(--color-border)]' : ''}
                  >
                    <td className="px-6 py-3 text-sm text-[var(--color-text-primary)]">{f.label}</td>
                    <td className="px-6 py-3 text-center">{renderFeatureValue(f.free)}</td>
                    <td className="px-6 py-3 text-center">{renderFeatureValue(f.pro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-10">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] text-center mb-6">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'What happens when my trial ends?',
                a: 'After your 7-day free trial, you\'ll be charged the selected plan price. Cancel anytime before the trial ends to avoid charges.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Cancel from your Settings page or the Stripe billing portal. You\'ll keep Pro access until the end of your current billing period.',
              },
              {
                q: 'What happens if I downgrade?',
                a: 'You\'ll retain access to all your data. Features above free-tier limits will become read-only until you upgrade again or reduce usage.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'We offer a full refund within the first 7 days after your trial ends if you\'re not satisfied.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-5 py-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{q}</h3>
                <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
