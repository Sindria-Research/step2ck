import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { APP_NAME, APP_TAGLINE, getLogoUrl } from '../config/branding';

export function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, user, navigate]);

  const logoUrl = getLogoUrl(theme);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
        <div className="skeleton h-10 w-48 rounded-md" aria-hidden />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      {/* Nav – Notion-style: clean bar */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 md:px-6 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]"
        aria-label="Main"
      >
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 focus-ring rounded-md py-1.5 pr-2 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
            aria-label={`${APP_NAME} home`}
          >
            <img
              src={logoUrl}
              alt=""
              className="w-7 h-7 rounded-md object-contain shrink-0"
            />
            <span className="text-base font-semibold font-display tracking-tight">
              {APP_NAME}
            </span>
          </Link>
          <a href="#features" className="hidden sm:block text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            Features
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-3 py-2 rounded-md transition-colors focus-ring"
          >
            Sign in
          </Link>
          <Link
            to="/login"
            className="btn btn-primary text-sm px-4 py-2 rounded-md focus-ring inline-flex items-center gap-2"
          >
            Get started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero – clear headline, one CTA */}
      <section className="pt-16 pb-14 md:pt-20 md:pb-18">
        <div className="container max-w-2xl">
          <p className="inline-block px-2.5 py-1 mb-5 text-xs font-medium rounded-md bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]">
            {APP_TAGLINE}
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold text-[var(--color-text-primary)] font-display tracking-tight leading-tight mb-4">
            Practice questions with explanations. Track progress by section.
          </h1>
          <p className="text-[var(--color-text-secondary)] mb-8 leading-relaxed">
            Custom tests by subject, personalized review, and clear analytics. One place to study and see where you stand.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/login"
              className="btn btn-primary px-5 py-2.5 rounded-md focus-ring inline-flex items-center gap-2"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="btn btn-ghost px-5 py-2.5 rounded-md focus-ring"
            >
              See features
            </a>
          </div>
        </div>
      </section>

      {/* Features – 3 cards, minimal */}
      <section id="features" className="py-12 md:py-16 border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]" style={{ scrollMarginTop: '60px' }}>
        <div className="container">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] font-display tracking-tight mb-2">
            Practice, track, improve
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-xl mb-8">
            Build custom tests by subject, focus on unused or incorrect questions, and review accuracy over time.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-hover)] transition-colors">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
                Custom practice tests
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Choose subjects and question count. Timed or untimed.
              </p>
            </div>
            <div className="p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-hover)] transition-colors">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
                Track progress
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                See accuracy by section and focus on what needs work.
              </p>
            </div>
            <div className="p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-hover)] transition-colors">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">
                Personalized mode
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                One question at a time — prioritizes unseen or incorrect.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 border-t border-[var(--color-border)]">
        <div className="container text-center max-w-lg mx-auto">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] font-display tracking-tight mb-2">
            Ready to practice?
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Start with a demo — no account required. Progress is saved for the session.
          </p>
          <Link
            to="/login"
            className="btn btn-primary px-6 py-2.5 rounded-md focus-ring inline-flex items-center gap-2"
          >
            Get started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="py-6 border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-text-muted)]">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="" className="w-5 h-5 rounded object-contain" />
            <span>{APP_NAME}</span>
          </div>
          <span>For study use only.</span>
        </div>
      </footer>
    </div>
  );
}
