import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Sparkles, ArrowLeft, Info, Clock } from 'lucide-react';
import { api } from '../api/api';
import type { ExamType } from '../context/ExamContext';
import { useAuth } from '../context/AuthContext';
import { ProBadge, UpgradePrompt } from '../components/ProGate';

const SUBJECTS = [
  'Internal Medicine',
  'Surgery',
  'OB/GYN',
  'Pediatrics',
  'Neurology',
  'Psychiatry',
  'Family Medicine',
  'Emergency Medicine',
];

const MODES = [
  { id: 'all' as const, label: 'All questions', desc: 'All in selected subjects' },
  { id: 'unused' as const, label: 'Unused only', desc: 'Skip already answered' },
  { id: 'incorrect' as const, label: 'Incorrect only', desc: 'Questions you missed' },
  { id: 'personalized' as const, label: 'Personalized', desc: 'Adaptive, one at a time' },
];

const QUICK_COUNTS = [10, 20, 40];

export function ExamConfig() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rootRef = useRef<HTMLDivElement>(null);
  const { isPro } = useAuth();

  const examType: ExamType = searchParams.get('type') === 'test' ? 'test' : 'practice';
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set(SUBJECTS));
  const [mode, setMode] = useState<'all' | 'unused' | 'incorrect' | 'personalized'>('all');
  const [questionCount, setQuestionCount] = useState(20);
  const [customCount, setCustomCount] = useState('');
  const [availableCount, setAvailableCount] = useState(0);
  const [sections, setSections] = useState<string[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionsError, setSectionsError] = useState<string | null>(null);
  const [timeLimitPerQ, setTimeLimitPerQ] = useState<number | null>(null);
  const [timeLimitTotal, setTimeLimitTotal] = useState<number | null>(null);

  const [showTip, setShowTip] = useState(() => !localStorage.getItem('chiron-exam-tip-dismissed'));
  const dismissTip = () => {
    setShowTip(false);
    localStorage.setItem('chiron-exam-tip-dismissed', '1');
  };

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

  useEffect(() => {
    let cancelled = false;
    setSectionsLoading(true);
    setSectionsError(null);

    Promise.all([api.questions.sections(), api.questions.list({ limit: 1 })])
      .then(([secRes, countRes]) => {
        if (cancelled) return;
        setSections(secRes.sections);
        setAvailableCount(countRes.total);
      })
      .catch((e) => { if (!cancelled) setSectionsError(e instanceof Error ? e.message : 'Failed to load subjects'); })
      .finally(() => { if (!cancelled) setSectionsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (sections.length === 0) return;
    const subList = Array.from(selectedSubjects).filter((s) => sections.includes(s));
    if (subList.length === 0) { setAvailableCount(0); return; }
    api.questions
      .list({ sections: subList, limit: 1 })
      .then((res) => setAvailableCount(res.total))
      .catch(() => setAvailableCount(0));
  }, [selectedSubjects, sections]);

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelectedSubjects(new Set(SUBJECTS.filter((s) => sections.includes(s))));
  const clearAll = () => setSelectedSubjects(new Set());

  const isPersonalized = mode === 'personalized';
  const finalCount = isPersonalized
    ? 1
    : Math.min(
        customCount ? parseInt(customCount, 10) || questionCount : questionCount,
        availableCount,
        questionCount
      );
  const canStart = selectedSubjects.size > 0 && (isPersonalized ? availableCount > 0 : availableCount > 0 && finalCount > 0);

  const handleStart = () => {
    const config = {
      subjects: Array.from(selectedSubjects),
      mode: isPersonalized ? 'personalized' : mode,
      count: isPersonalized ? 1 : finalCount,
      examType,
      timeLimitPerQuestion: examType === 'test' ? timeLimitPerQ : null,
      timeLimitTotal: examType === 'test' ? timeLimitTotal : null,
    };
    sessionStorage.setItem('examConfig', JSON.stringify(config));
    navigate('/exam');
  };

  const setCount = (c: number) => { setQuestionCount(c); setCustomCount(''); };
  const displaySubjects = sections.length > 0 ? SUBJECTS.filter((s) => sections.includes(s)) : SUBJECTS;

  return (
    <div ref={rootRef} className="chiron-dash flex-1 overflow-y-auto">
      <div className="dash-glow dash-glow-one" aria-hidden />
      <div className="dash-glow dash-glow-two" aria-hidden />

      <div className="relative z-[1]">
        {/* ── Hero header ── */}
        <section
          className="pt-8 pb-6 md:pt-10 md:pb-8"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="container">
            <div className="chiron-reveal" data-reveal>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="group inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Back to dashboard
              </button>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] font-display tracking-tight leading-[1.08]">
                {examType === 'test' ? 'New test' : 'New practice'}
              </h1>
              <p className="mt-3 text-sm md:text-base text-[var(--color-text-secondary)] max-w-lg leading-relaxed">
                Choose subjects, select a mode, and start.
              </p>
            </div>
          </div>
        </section>

        {/* ── Subjects (feature-row) ── */}
        <div className="chiron-feature-row">
          <div className="container">
            <div className="chiron-feature-grid">
              <div className="chiron-reveal" data-reveal>
                <p className="chiron-feature-label">Subjects</p>
                <h2 className="chiron-feature-heading">What to study</h2>
                <p className="chiron-feature-body">
                  Toggle the subjects you want in this set. Questions are pulled from your selection.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <button type="button" onClick={selectAll} className="text-xs font-semibold text-[var(--color-brand-blue)] hover:underline focus-ring">
                    Select all
                  </button>
                  <span className="text-[var(--color-text-muted)]">·</span>
                  <button type="button" onClick={clearAll} className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] focus-ring">
                    Clear
                  </button>
                </div>
              </div>

              <div className="chiron-mockup chiron-reveal chiron-reveal-delay-1" data-reveal>
                {sectionsLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-8 w-28 rounded-full bg-[var(--color-bg-tertiary)] animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    {sectionsError && (
                      <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
                        {sectionsError} — using defaults.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {displaySubjects.map((subject) => (
                        <button
                          key={subject}
                          type="button"
                          onClick={() => toggleSubject(subject)}
                          className={`chiron-subject-tag ${selectedSubjects.has(subject) ? 'is-selected' : ''}`}
                        >
                          {subject}
                        </button>
                      ))}
                    </div>
                    <div className="mt-5 chiron-mockup-meta">
                      <span>{selectedSubjects.size} subjects selected</span>
                      <span className="chiron-mockup-dot" />
                      <span>{availableCount} available</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Mode + Count + Timing ── */}
        <div className="chiron-feature-row chiron-feature-row-alt">
          <div className="container">
            <div className="chiron-reveal mb-5" data-reveal>
              <p className="chiron-feature-label">Settings</p>
              <h2 className="chiron-feature-heading">
                {examType === 'test' ? 'Configure your test' : 'How to study'}
              </h2>
              <p className="chiron-feature-body">
                {examType === 'test'
                  ? 'Pick a question mode, set how many questions you want, and configure time limits.'
                  : 'Pick a question mode and set how many questions you want.'}
              </p>
            </div>

            <div className={`grid ${examType === 'test' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 chiron-reveal chiron-reveal-delay-1`} data-reveal>
              {/* Mode panel */}
              <div className="chiron-mockup">
                <p className="chiron-mockup-label mb-3">Mode</p>
                <div className="space-y-1.5">
                  {MODES.map((m) => {
                    const locked = !isPro && m.id === 'personalized';
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => !locked && setMode(m.id)}
                        disabled={locked}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all focus-ring ${
                          locked
                            ? 'border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] opacity-60 cursor-not-allowed'
                            : mode === m.id
                              ? 'border-[1.5px] border-[var(--color-brand-blue)] bg-[color-mix(in_srgb,var(--color-brand-blue)_10%,var(--color-bg-primary))] shadow-sm'
                              : 'border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-hover)] opacity-75'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          mode === m.id ? 'border-[var(--color-brand-blue)]' : 'border-[var(--color-border)]'
                        }`}>
                          {mode === m.id && <span className="w-2 h-2 rounded-full bg-[var(--color-brand-blue)]" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className={`text-sm ${mode === m.id ? 'font-semibold text-[var(--color-text-primary)]' : 'font-medium text-[var(--color-text-secondary)]'}`}>
                              {m.label}
                            </span>
                            {m.id === 'personalized' && <Sparkles className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />}
                            {locked && <ProBadge />}
                          </span>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{m.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {!isPro && (
                  <div className="mt-3">
                    <UpgradePrompt message="Unlock Personalized mode and unlimited daily questions." />
                  </div>
                )}
              </div>

              {/* Count panel */}
              <div className="chiron-mockup">
                <p className="chiron-mockup-label mb-3">Question count</p>
                {isPersonalized ? (
                  <div className="py-6 text-center">
                    <Sparkles className="w-6 h-6 text-[var(--color-brand-blue)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Personalized mode is adaptive — questions are served one at a time.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-4">
                      {QUICK_COUNTS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCount(c)}
                          disabled={c > availableCount}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all focus-ring border ${
                            questionCount === c && !customCount
                              ? 'chiron-btn-primary border-transparent text-white shadow-md'
                              : c > availableCount
                                ? 'bg-[var(--color-bg-tertiary)] border-transparent text-[var(--color-text-muted)] cursor-not-allowed'
                                : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCount(availableCount)}
                        disabled={availableCount === 0}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all focus-ring border ${
                          questionCount === availableCount && !customCount
                            ? 'chiron-btn-primary border-transparent text-white shadow-md'
                            : availableCount === 0
                              ? 'bg-[var(--color-bg-tertiary)] border-transparent text-[var(--color-text-muted)] cursor-not-allowed'
                              : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                        }`}
                      >
                        All remaining
                      </button>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={availableCount}
                      value={customCount}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCustomCount(v);
                        const n = parseInt(v, 10);
                        if (v === '') setQuestionCount(20);
                        else if (!isNaN(n) && n > 0) setQuestionCount(Math.min(n, availableCount));
                      }}
                      placeholder="Custom amount..."
                      className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)] transition-all outline-none"
                    />
                  </>
                )}

                {/* Summary + CTA */}
                <div
                  className="mt-5 pt-4 border-t border-[var(--color-border)] space-y-2 text-sm sticky bottom-0 bg-[var(--color-bg-primary)] rounded-b-xl"
                  style={{ boxShadow: '0 -4px 16px rgba(0,0,0,0.04)' }}
                >
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-tertiary)]">Subjects</span>
                    <span className="font-medium text-[var(--color-text-primary)]">{selectedSubjects.size} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-tertiary)]">Mode</span>
                    <span className="font-medium text-[var(--color-text-primary)] capitalize">{mode === 'all' ? 'All questions' : mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-tertiary)]">Questions</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">{isPersonalized ? 'Adaptive' : finalCount}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStart}
                    disabled={!canStart}
                    className={`w-full mt-3 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all focus-ring ${
                      canStart
                        ? 'chiron-btn chiron-btn-primary shadow-md'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {isPersonalized ? 'Start Session' : examType === 'test' ? 'Start Test' : 'Start Practice'}
                  </button>
                  {!canStart && selectedSubjects.size === 0 && (
                    <p className="text-center text-xs text-[var(--color-text-muted)] pt-1">
                      Select at least one subject to begin.
                    </p>
                  )}
                </div>
              </div>

              {examType === 'test' && (
                <div className="chiron-mockup">
                  <p className="chiron-mockup-label mb-3">Time Limits</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Per question
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {([
                          { label: 'None', value: null },
                          { label: '1 min', value: 60 },
                          { label: '1.5 min', value: 90 },
                          { label: '2 min', value: 120 },
                          { label: '3 min', value: 180 },
                        ] as const).map((opt) => (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => setTimeLimitPerQ(opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border focus-ring ${
                              timeLimitPerQ === opt.value
                                ? 'chiron-btn-primary border-transparent text-white'
                                : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Overall
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {([
                          { label: 'None', value: null },
                          { label: '30 min', value: 1800 },
                          { label: '60 min', value: 3600 },
                          { label: '90 min', value: 5400 },
                          { label: '120 min', value: 7200 },
                        ] as const).map((opt) => (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => setTimeLimitTotal(opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border focus-ring ${
                              timeLimitTotal === opt.value
                                ? 'chiron-btn-primary border-transparent text-white'
                                : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tip (optional, secondary) ── */}
        {showTip && (
          <div className="py-4">
            <div className="container">
              <div className="chiron-reveal" data-reveal>
                <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)]" style={{ opacity: 0.8 }}>
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 mt-0.5 text-[var(--color-brand-blue)] shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Try Personalized Mode</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed max-w-md">
                        Prioritizes unseen questions and ones you got wrong.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={dismissTip}
                    className="text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* bottom spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
