import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Activity,
  CheckCircle2,
  Clock3,
  RotateCcw,
  Target,
  XCircle,
  Sun,
  Moon,
  Users,
  Shield,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { APP_NAME, getLogoUrl } from '../config/branding';

const WaveCanvas = lazy(() =>
  import('../components/landing/WaveCanvas').then((m) => ({ default: m.WaveCanvas }))
);

const SUBJECTS = ['Cardiology', 'Pulmonology', 'Neurology', 'GI', 'Renal', 'OB/GYN', 'Psych', 'Endocrine'];
const TESTS = ['Step 2 CK', 'the SAT', 'the ACT', 'the MCAT', 'the GRE', 'the LSAT', 'the USMLE', 'the Bar'];

const HERO_CHOICES = [
  { letter: 'A', text: 'Aortic stenosis' },
  { letter: 'B', text: 'Mitral regurgitation', correct: true },
  { letter: 'C', text: 'Mitral valve prolapse' },
  { letter: 'D', text: 'Tricuspid regurgitation' },
];

export function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const landingRef = useRef<HTMLDivElement>(null);
  const [heroAnswered, setHeroAnswered] = useState(false);
  const [heroSelected, setHeroSelected] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
    () => new Set(['Cardiology', 'Neurology', 'GI'])
  );
  const [activeReviewTab, setActiveReviewTab] = useState<'incorrect' | 'unused'>('incorrect');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [testIndex, setTestIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Typewriter effect
  useEffect(() => {
    const current = TESTS[testIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && typedText === current) {
      // Pause before deleting
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && typedText === '') {
      // Move to next word
      setIsDeleting(false);
      setTestIndex((i) => (i + 1) % TESTS.length);
    } else {
      timeout = setTimeout(
        () => {
          setTypedText((prev) =>
            isDeleting ? prev.slice(0, -1) : current.slice(0, prev.length + 1)
          );
        },
        isDeleting ? 40 : 80
      );
    }

    return () => clearTimeout(timeout);
  }, [typedText, isDeleting, testIndex]);

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const root = landingRef.current;
    if (!root) return;
    let ticking = false;

    const checkVisibility = () => {
      const targets = root.querySelectorAll<HTMLElement>('[data-reveal]');
      const vh = window.innerHeight;
      targets.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const inView = rect.top < vh * 0.88 && rect.bottom > vh * 0.08;
        if (inView) {
          el.classList.add('is-visible');
        } else {
          el.classList.remove('is-visible');
        }
      });
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(checkVisibility);
      }
    };

    // Check on mount + listen for scroll
    checkVisibility();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true });

    // Start float animation on hero panel after entrance completes
    const panel = root.querySelector<HTMLElement>('.chiron-hero .chiron-panel');
    const floatTimer = setTimeout(() => {
      panel?.classList.add('is-floating');
    }, 1400);

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('scroll', onScroll);
      clearTimeout(floatTimer);
    };
  }, [loading, user]);

  if (!loading && user) return null;

  const toggleSubject = (s: string) => {
    setSelectedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  return (
    <div ref={landingRef} className="chiron-landing min-h-screen">
      <div className="chiron-ambient-glow chiron-ambient-glow-one" aria-hidden />
      <div className="chiron-ambient-glow chiron-ambient-glow-two" aria-hidden />

      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-primary)_86%,transparent)] backdrop-blur-xl"
        aria-label="Main"
      >
        <div className="container h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="group inline-flex items-center gap-2.5 focus-ring rounded-md px-1 py-1.5"
              aria-label={`${APP_NAME} home`}
            >
              <img
                src={getLogoUrl(theme)}
                alt=""
                className="w-7 h-7 rounded-md object-contain shrink-0"
              />
              <span className="text-sm md:text-base font-semibold tracking-[0.14em] uppercase text-[var(--color-text-primary)]">
                {APP_NAME}
              </span>
            </Link>
            <a
              href="#features"
              className="hidden md:inline-flex text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-3 py-2 rounded-md transition-colors focus-ring"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="hidden md:inline-flex text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-3 py-2 rounded-md transition-colors focus-ring"
            >
              Pricing
            </a>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Link to="/login" className="btn btn-ghost text-sm px-4 py-2 rounded-md focus-ring">
              Sign in
            </Link>
            <Link
              to="/login"
              className="chiron-btn chiron-btn-primary text-sm px-4 py-2 rounded-md focus-ring inline-flex items-center gap-2"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <button
            type="button"
            className="sm:hidden p-2 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring"
            onClick={() => setMobileNavOpen((o) => !o)}
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileNavOpen && (
          <div className="sm:hidden mobile-nav-menu border-t border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-3 space-y-1">
            <a
              href="#features"
              onClick={() => setMobileNavOpen(false)}
              className="block px-3 py-2.5 rounded-md text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileNavOpen(false)}
              className="block px-3 py-2.5 rounded-md text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Pricing
            </a>
            <div className="pt-2 border-t border-[var(--color-border)] flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileNavOpen(false)}
                className="block px-3 py-2.5 rounded-md text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] text-center"
              >
                Sign in
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileNavOpen(false)}
                className="chiron-btn chiron-btn-primary text-sm px-4 py-2.5 rounded-md focus-ring inline-flex items-center justify-center gap-2"
              >
                Get started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="chiron-hero relative flex items-center min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)]">
        <Suspense fallback={null}>
          <WaveCanvas isDark={theme === 'dark'} />
        </Suspense>
        <div className="container relative z-10 grid gap-8 lg:gap-16 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.1fr_0.9fr] items-center w-full py-10 md:py-24">
          <div>
            <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-bold text-[var(--color-text-primary)] font-display tracking-tight leading-[1.06] max-w-2xl chiron-entrance" style={{ '--entrance-order': 0 } as React.CSSProperties}>
              Prep for <span className="chiron-typewriter text-[var(--color-brand-blue)]">{typedText}<span className="chiron-cursor" /></span>
            </h1>
            <p className="mt-4 md:mt-6 text-sm md:text-lg lg:text-xl text-[var(--color-text-secondary)] max-w-xl leading-relaxed chiron-entrance" style={{ '--entrance-order': 1 } as React.CSSProperties}>
              Practice, track, and adapt in one clean workspace.
            </p>
            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 chiron-entrance" style={{ '--entrance-order': 3 } as React.CSSProperties}>
              <Link
                to="/login"
                className="chiron-btn chiron-btn-primary px-6 py-3 rounded-lg focus-ring inline-flex items-center justify-center gap-2 text-base"
              >
                Start studying
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#features" className="chiron-btn chiron-btn-subtle px-6 py-3 rounded-lg focus-ring text-base text-center">
                See how it works
              </a>
            </div>
            <div className="mt-6 md:mt-8 flex flex-wrap items-center gap-2 md:gap-2.5 chiron-entrance" style={{ '--entrance-order': 4 } as React.CSSProperties}>
              <span className="chiron-stat-pill"><Clock3 className="w-3.5 h-3.5" /> Timed sets</span>
              <span className="chiron-stat-pill"><Target className="w-3.5 h-3.5" /> Adaptive review</span>
              <span className="chiron-stat-pill"><Activity className="w-3.5 h-3.5" /> Live progress</span>
            </div>
          </div>

          <aside className="chiron-panel chiron-entrance" style={{ '--entrance-order': 2 } as React.CSSProperties} aria-label="Question preview">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-[var(--color-text-muted)]">Question 14 of 40</p>
              <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Clock3 className="w-3 h-3" /> 1:12:34
              </p>
            </div>
            <p className="text-xs font-medium text-[var(--color-brand-blue)] mb-2">Cardiology</p>
            <p className="text-sm text-[var(--color-text-primary)] leading-relaxed mb-5">
              A 62-year-old woman presents with a holosystolic murmur best heard at the apex, radiating to the axilla. Which of the following is the most likely diagnosis?
            </p>
            <div className="grid gap-2" role="radiogroup" aria-label="Answer choices">
              {HERO_CHOICES.map((c) => {
                let cls = 'chiron-hero-choice';
                const isSelected = heroSelected === c.letter;
                if (heroAnswered && c.correct) cls += ' is-correct';
                if (heroAnswered && isSelected && !c.correct) cls += ' is-selected-wrong';
                return (
                  <button
                    key={c.letter}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-disabled={heroAnswered}
                    className={cls}
                    onClick={() => {
                      if (!heroAnswered) {
                        setHeroSelected(c.letter);
                        setHeroAnswered(true);
                      }
                    }}
                  >
                    <span className="chiron-hero-choice-letter">{c.letter}</span>
                    <span>{c.text}</span>
                    {heroAnswered && c.correct && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-[var(--color-success)]" />}
                    {heroAnswered && isSelected && !c.correct && <XCircle className="w-3.5 h-3.5 ml-auto text-[var(--color-error)]" />}
                  </button>
                );
              })}
            </div>
            {heroAnswered && (
              <div className="mt-4 p-3 rounded-lg border border-[var(--color-success)] bg-[var(--color-success-bg)]">
                <p className="text-xs font-medium text-[var(--color-success)] mb-1">Correct answer: B</p>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  A holosystolic murmur at the apex radiating to the axilla is characteristic of mitral regurgitation.
                </p>
              </div>
            )}
            {!heroAnswered && (
              <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
                Click an answer to see how it works
              </p>
            )}
          </aside>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-t border-[var(--color-border)]" style={{ scrollMarginTop: '80px' }}>

        {/* 1 · Custom Sets */}
        <div className="chiron-feature-row chiron-feature-row-padded">
          <div className="container">
            <div className="chiron-feature-grid">
              <div className="chiron-reveal" data-reveal>
                <p className="chiron-feature-label">Custom Sets</p>
                <h2 className="chiron-feature-heading">Build exactly the test you need</h2>
                <p className="chiron-feature-body">
                  Pick subjects, set the count, choose timed or untimed. Every session is yours.
                </p>
              </div>
              <div className="chiron-mockup chiron-reveal chiron-reveal-delay-1" data-reveal aria-hidden>
                <p className="chiron-mockup-label">Select subjects</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSubject(s)}
                      className={`chiron-subject-tag ${selectedSubjects.has(s) ? 'is-selected' : ''}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <div className="chiron-mockup-meta">
                    <span>{selectedSubjects.size} subjects</span>
                    <span className="chiron-mockup-dot" />
                    <span>40 questions</span>
                    <span className="chiron-mockup-dot" />
                    <span>Timed</span>
                  </div>
                  <div className="chiron-mockup-btn">Start set</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2 · Mode Switching */}
        <div className="chiron-feature-row chiron-feature-row-alt chiron-feature-row-padded">
          <div className="container">
            <div className="chiron-feature-grid chiron-feature-grid-reverse">
              <div className="chiron-reveal" data-reveal>
                <p className="chiron-feature-label">Mode Switching</p>
                <h2 className="chiron-feature-heading">Switch how you study, instantly</h2>
                <p className="chiron-feature-body">
                  Move between unused questions, incorrect-only review, or full random sets without losing your place.
                </p>
              </div>
              <div className="chiron-mockup chiron-reveal chiron-reveal-delay-1" data-reveal aria-hidden>
                <div className="chiron-mode-switcher">
                  {(['All questions', 'Unused only', 'Incorrect only'] as const).map((label, i) => (
                    <div
                      key={label}
                      className={`chiron-mode-switcher-item ${i === 2 ? 'is-current' : ''}`}
                    >
                      <span className="chiron-mode-switcher-radio" />
                      <span>{label}</span>
                      {i === 2 && <span className="chiron-mode-switcher-badge">Active</span>}
                    </div>
                  ))}
                </div>
                <div className="mt-4 chiron-mockup-question">
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">Question 14 of 40 · Cardiology</p>
                  <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                    A 58-year-old man presents with acute substernal chest pain radiating to the left arm...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 · Progress Map */}
        <div className="chiron-feature-row chiron-feature-row-padded">
          <div className="container">
            <div className="chiron-feature-grid">
              <div className="chiron-reveal" data-reveal>
                <p className="chiron-feature-label">Progress Map</p>
                <h2 className="chiron-feature-heading">See where you stand at a glance</h2>
                <p className="chiron-feature-body">
                  Accuracy by section, completion rates, and trends over time — all in one dashboard.
                </p>
              </div>
              <div className="chiron-mockup chiron-reveal chiron-reveal-delay-1" data-reveal aria-hidden>
                <div className="chiron-progress-grid">
                  {([
                    { name: 'Cardiology', pct: 78, done: 62, total: 80 },
                    { name: 'Pulmonology', pct: 65, done: 39, total: 60 },
                    { name: 'Neurology', pct: 84, done: 51, total: 60 },
                    { name: 'GI', pct: 71, done: 43, total: 60 },
                    { name: 'Renal', pct: 59, done: 24, total: 40 },
                    { name: 'OB/GYN', pct: 88, done: 35, total: 40 },
                  ] as const).map((s) => (
                    <div key={s.name} className="chiron-progress-row">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-[var(--color-text-primary)]">{s.name}</span>
                        <span className="text-xs text-[var(--color-text-tertiary)]">{s.pct}%</span>
                      </div>
                      <div className="chiron-meter-track">
                        <div
                          className="chiron-meter-fill chiron-meter-fill-animated"
                          style={{ '--fill-target': `${s.pct}%` } as React.CSSProperties}
                        />
                      </div>
                      <p className="mt-1 text-[0.68rem] text-[var(--color-text-muted)]">
                        {s.done}/{s.total} answered
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 · Targeted Review */}
        <div className="chiron-feature-row chiron-feature-row-alt chiron-feature-row-padded">
          <div className="container">
            <div className="chiron-feature-grid chiron-feature-grid-reverse">
              <div className="chiron-reveal" data-reveal>
                <p className="chiron-feature-label">Targeted Review</p>
                <h2 className="chiron-feature-heading">Focus on what you got wrong</h2>
                <p className="chiron-feature-body">
                  Resurface missed questions with full explanations so you close gaps instead of repeating them.
                </p>
              </div>
              <div className="chiron-mockup chiron-reveal chiron-reveal-delay-1" data-reveal aria-hidden>
                <div className="flex gap-1 mb-4">
                  {(['incorrect', 'unused'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveReviewTab(tab)}
                      className={`chiron-review-tab ${activeReviewTab === tab ? 'is-active' : ''}`}
                    >
                      {tab === 'incorrect' ? (
                        <><XCircle className="w-3.5 h-3.5" /> Incorrect</>
                      ) : (
                        <><RotateCcw className="w-3.5 h-3.5" /> Unused</>
                      )}
                    </button>
                  ))}
                </div>
                {activeReviewTab === 'incorrect' ? (
                  <div className="space-y-2.5">
                    {([
                      { q: 'Murmur best heard at apex, radiating to axilla', section: 'Cardiology', your: 'Aortic stenosis', correct: 'Mitral regurgitation' },
                      { q: 'Sudden painless vision loss, pale retina, cherry-red spot', section: 'Neurology', your: 'Retinal detachment', correct: 'Central retinal artery occlusion' },
                    ] as const).map((item, i) => (
                      <div key={i} className="chiron-review-item">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">{item.section}</p>
                        <p className="text-sm text-[var(--color-text-primary)] leading-snug mb-2">{item.q}</p>
                        <div className="flex gap-3">
                          <span className="chiron-review-answer is-wrong"><XCircle className="w-3 h-3" /> {item.your}</span>
                          <span className="chiron-review-answer is-right"><CheckCircle2 className="w-3 h-3" /> {item.correct}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {([
                      { q: 'Pregnant patient with new-onset seizures and HTN at 34 weeks', section: 'OB/GYN' },
                      { q: 'Child with barking cough and inspiratory stridor', section: 'Pulmonology' },
                    ] as const).map((item, i) => (
                      <div key={i} className="chiron-review-item">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">{item.section}</p>
                        <p className="text-sm text-[var(--color-text-primary)] leading-snug">{item.q}</p>
                        <p className="mt-1.5 text-xs text-[var(--color-brand-blue)]">Not yet attempted</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-10 md:py-16 border-t border-[var(--color-border)]">
        <div className="container">
          <div className="text-center mb-8 md:mb-10 chiron-reveal" data-reveal>
            <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-brand-blue)] mb-3">
              Pricing
            </p>
            <h2 className="text-2xl md:text-4xl font-semibold font-display tracking-tight text-[var(--color-text-primary)]">
              Start free. Upgrade when ready.
            </h2>
            <p className="mt-3 text-base text-[var(--color-text-secondary)] max-w-lg mx-auto">
              Get full access to the question bank for free. Upgrade to Pro for unlimited AI, personalized exams, and more.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-[720px] mx-auto chiron-reveal chiron-reveal-delay-1" data-reveal>
            {/* Free card */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Free</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 mb-4">Core question bank access</p>
              <div className="mb-5">
                <span className="text-3xl font-bold text-[var(--color-text-primary)]">$0</span>
                <span className="text-sm text-[var(--color-text-muted)] ml-1">forever</span>
              </div>
              <ul className="space-y-2 flex-1 text-sm text-[var(--color-text-secondary)]">
                {['40 questions / day', '5 AI explanations / day', 'Basic analytics', 'Search & Lab Values'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className="mt-5 py-2.5 text-center rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors block"
              >
                Get started
              </Link>
            </div>

            {/* Pro card */}
            <div className="rounded-xl border-2 border-[var(--color-brand-blue)] bg-[var(--color-bg-primary)] p-6 flex flex-col relative">
              <div className="absolute -top-3 left-6 bg-[var(--color-brand-blue)] text-white text-[0.65rem] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                Pro <Zap className="w-4 h-4 text-[var(--color-brand-blue)]" />
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 mb-4">Everything unlimited</p>
              <div className="mb-5">
                <span className="text-3xl font-bold text-[var(--color-text-primary)]">$29</span>
                <span className="text-sm text-[var(--color-text-muted)] ml-1">/ month</span>
              </div>
              <ul className="space-y-2 flex-1 text-sm text-[var(--color-text-secondary)]">
                {['Unlimited AI explanations', 'Personalized exam mode', 'AI study plan', 'Full performance analytics', 'Unlimited notes & flashcards'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[var(--color-brand-blue)] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className="mt-5 py-2.5 text-center rounded-lg bg-[var(--color-brand-blue)] text-white text-sm font-medium hover:opacity-90 transition-opacity block"
              >
                Start 7-day free trial
              </Link>
            </div>
          </div>

          <div className="text-center mt-6 chiron-reveal chiron-reveal-delay-1" data-reveal>
            <Link
              to="/pricing"
              className="text-sm text-[var(--color-brand-blue)] hover:underline font-medium inline-flex items-center gap-1.5"
            >
              View full feature comparison <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-10 md:py-12 border-t border-[var(--color-border)] chiron-reveal" data-reveal>
        <div className="container">
          <div className="flex flex-col items-center text-center gap-4 md:gap-6">
            <p className="text-sm font-bold uppercase tracking-widest text-[var(--color-brand-blue)]">
              Trusted by students
            </p>
            <h2 className="text-2xl md:text-4xl font-semibold font-display tracking-tight text-[var(--color-text-primary)]">
              Join students preparing smarter
            </h2>
            <div className="flex flex-wrap justify-center gap-3 md:gap-8 mt-2 md:mt-4">
              <div className="flex items-center gap-3 px-5 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-sm">
                <Users className="w-5 h-5 text-[var(--color-brand-blue)]" />
                <div className="text-left">
                  <p className="text-lg font-bold tabular-nums text-[var(--color-text-primary)]">1,200+</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Active students</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-sm">
                <Zap className="w-5 h-5 text-[var(--color-success)]" />
                <div className="text-left">
                  <p className="text-lg font-bold tabular-nums text-[var(--color-text-primary)]">50,000+</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Questions answered</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-sm">
                <Shield className="w-5 h-5 text-[var(--color-warning)]" />
                <div className="text-left">
                  <p className="text-lg font-bold tabular-nums text-[var(--color-text-primary)]">94%</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Pass rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-10 md:py-16">
        <div className="container">
          <div className="chiron-cta-wrap chiron-reveal" data-reveal>
            <div>
              <h2 className="text-xl md:text-3xl font-semibold text-[var(--color-text-primary)] font-display tracking-tight">
                Enter Chiron.
              </h2>
              <p className="mt-1.5 md:mt-2 text-sm text-[var(--color-text-secondary)]">
                Try it out today - start learning now.
              </p>
            </div>
            <Link
              to="/login"
              className="chiron-btn chiron-btn-primary px-6 py-2.5 rounded-md focus-ring inline-flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-10 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-primary)_94%,transparent)]">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src={getLogoUrl(theme)} alt="" className="w-5 h-5 rounded object-contain" />
                <span className="text-sm font-semibold tracking-wider uppercase text-[var(--color-text-primary)]">{APP_NAME}</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed max-w-xs">
                Deliberate test preparation, powered by adaptive question banks and real-time analytics.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Features</a></li>
                <li><Link to="/login" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Dashboard</Link></li>
                <li><Link to="/login" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Lab Values</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-[var(--color-text-tertiary)]">For study use only</span></li>
                <li><span className="text-[var(--color-text-tertiary)]">Not medical advice</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[var(--color-border)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
            <span>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved. Powered by Sindria.</span>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
