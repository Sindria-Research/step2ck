import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Check, Sparkles, ArrowLeft, Settings2, BookOpen, Calculator } from 'lucide-react';
import { api } from '../api/api';

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
  { id: 'all' as const, label: 'All questions', description: 'Include all questions in selected subjects' },
  { id: 'unused' as const, label: 'Unused only', description: 'Exclude questions you’ve already answered' },
  { id: 'incorrect' as const, label: 'Incorrect only', description: 'Only questions you got wrong before' },
  { id: 'personalized' as const, label: 'Personalized', description: 'One at a time — prioritizes unseen and incorrect' },
];

const QUICK_COUNTS = [10, 20, 40];

export function ExamConfig() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);

  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set(SUBJECTS));
  const [mode, setMode] = useState<'all' | 'unused' | 'incorrect' | 'personalized'>('all');
  const [questionCount, setQuestionCount] = useState(20);
  const [customCount, setCustomCount] = useState('');
  const [availableCount, setAvailableCount] = useState(0);
  const [sections, setSections] = useState<string[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionsError, setSectionsError] = useState<string | null>(null);

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
    api.questions
      .sections()
      .then((res) => {
        if (!cancelled) setSections(res.sections);
      })
      .catch((e) => {
        if (!cancelled) setSectionsError(e instanceof Error ? e.message : 'Failed to load subjects');
      })
      .finally(() => {
        if (!cancelled) setSectionsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (sections.length === 0) return;
    const subList = Array.from(selectedSubjects).filter((s) => sections.includes(s));
    if (subList.length === 0) {
      setAvailableCount(0);
      return;
    }
    api.questions
      .list({ sections: subList, limit: 500 })
      .then((res) => setAvailableCount(res.total))
      .catch(() => setAvailableCount(0));
  }, [selectedSubjects, sections]);

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
    };
    sessionStorage.setItem('examConfig', JSON.stringify(config));
    navigate('/exam');
  };

  const setCount = (c: number) => {
    setQuestionCount(c);
    setCustomCount('');
  };

  const displaySubjects = sections.length > 0 ? SUBJECTS.filter((s) => sections.includes(s)) : SUBJECTS;

  return (
    <div ref={rootRef} className="chiron-dash flex-1 overflow-y-auto">
      <div className="dash-glow dash-glow-one" aria-hidden />
      <div className="dash-glow dash-glow-two" aria-hidden />

      {/* ── Header ── */}
      <div className="relative z-[1] pt-8 pb-6 md:pt-12 md:pb-8">
        <div className="container">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="group inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to dashboard
          </button>
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)] font-display tracking-tight">
            New test
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)] max-w-lg leading-relaxed">
            Choose your subjects and mode to focus your study.
          </p>
        </div>
      </div>

      {/* ── Configuration Stripe ── */}
      <section className="py-14 border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-primary)_94%,transparent)] chiron-reveal" data-reveal>
        <div className="container">
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">

            {/* Left Column: Subjects */}
            <div className="bg-white border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-secondary)]/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-secondary)]">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Subjects</h2>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={selectAll} className="text-xs font-medium text-[var(--color-text-primary)] hover:underline focus-ring">
                    Select All
                  </button>
                  <button type="button" onClick={clearAll} className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] focus-ring">
                    Clear
                  </button>
                </div>
              </div>

              <div className="p-6">
                {sectionsLoading ? (
                  <div className="text-center text-sm text-[var(--color-text-tertiary)] py-8">
                    Loading subjects…
                  </div>
                ) : sectionsError ? (
                  <div className="text-sm text-[var(--color-text-secondary)] py-4">
                    {sectionsError} — using default list.
                  </div>
                ) : null}

                <div className="grid sm:grid-cols-2 gap-3">
                  {displaySubjects.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-lg border text-left transition-all focus-ring ${selectedSubjects.has(subject)
                        ? 'border-[var(--color-brand-blue)] bg-[color-mix(in_srgb,var(--color-brand-blue)_5%,white)] shadow-sm ring-1 ring-[var(--color-brand-blue)]/10'
                        : 'border-[var(--color-border)] bg-gray-50/50 hover:bg-white hover:border-[var(--color-border-hover)]'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedSubjects.has(subject)
                        ? 'bg-[var(--color-brand-blue)] border-[var(--color-brand-blue)]'
                        : 'bg-white border-[var(--color-border)]'
                        }`}>
                        {selectedSubjects.has(subject) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm font-medium ${selectedSubjects.has(subject) ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                        {subject}
                      </span>
                    </button>
                  ))}
                </div>

                {!sectionsLoading && (
                  <div className="mt-6 flex items-center gap-2 text-xs text-[var(--color-text-tertiary)] border-t border-[var(--color-border)] pt-4">
                    <Check className="w-3.5 h-3.5" />
                    {availableCount} questions available with selected subjects
                  </div>
                )}

                {!sectionsLoading && availableCount === 0 && (
                  <div className="mt-4 p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]">
                    <p className="font-medium text-[var(--color-text-primary)] mb-1">No questions available</p>
                    {import.meta.env.DEV ? (
                      <div className="space-y-1 text-xs">
                        <p>Ensure backend is running (make dev) and database is seeded.</p>
                      </div>
                    ) : (
                      <p className="mb-0">If this persists, please contact support.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Settings */}
            <div className="space-y-6">

              {/* Mode Selection */}
              <div className="bg-white border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center gap-3 bg-[var(--color-bg-secondary)]/30">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-secondary)]">
                    <Settings2 className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Mode</h2>
                </div>
                <div className="p-4 space-y-2">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition-all focus-ring ${mode === m.id
                        ? 'border-[var(--color-brand-blue)] bg-[color-mix(in_srgb,var(--color-brand-blue)_5%,white)] shadow-sm'
                        : 'border-[var(--color-border)] bg-gray-50/50 hover:bg-white hover:border-[var(--color-border-hover)]'
                        }`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${mode === m.id ? 'border-[var(--color-brand-blue)]' : 'border-[var(--color-border)]'
                        }`}>
                        {mode === m.id && <div className="w-2 h-2 rounded-full bg-[var(--color-brand-blue)]" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${mode === m.id ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>{m.label}</p>
                          {m.id === 'personalized' && <Sparkles className="w-3.5 h-3.5 text-[var(--color-brand-purple)]" />}
                        </div>
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 leading-snug">{m.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              {!isPersonalized && (
                <div className="bg-white border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center gap-3 bg-[var(--color-bg-secondary)]/30">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-secondary)]">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Count</h2>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {QUICK_COUNTS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCount(c)}
                          disabled={c > availableCount}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all focus-ring border ${questionCount === c && !customCount
                            ? 'bg-[var(--color-brand-blue)] border-[var(--color-brand-blue)] text-white shadow-sm'
                            : c > availableCount
                              ? 'bg-[var(--color-bg-tertiary)] border-transparent text-[var(--color-text-muted)] cursor-not-allowed'
                              : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]'
                            }`}
                        >
                          {c}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCount(availableCount)}
                        disabled={availableCount === 0}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all focus-ring border ${questionCount === availableCount && !customCount
                          ? 'bg-[var(--color-brand-blue)] border-[var(--color-brand-blue)] text-white shadow-sm'
                          : availableCount === 0
                            ? 'bg-[var(--color-bg-tertiary)] border-transparent text-[var(--color-text-muted)] cursor-not-allowed'
                            : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]'
                          }`}
                      >
                        Max
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        id="custom-count"
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
                        className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] bg-gray-50/50 text-sm focus:bg-white focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)] transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleStart}
                disabled={!canStart}
                className={`w-full group btn flex items-center justify-center gap-2 py-4 rounded-full text-base font-semibold shadow-lg shadow-[var(--color-brand-blue)]/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus-ring ${canStart
                  ? 'bg-[var(--color-brand-blue)] text-white hover:bg-[color-mix(in_srgb,var(--color-brand-blue)_90%,white)]'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed shadow-none'
                  }`}
              >
                <Play className="w-5 h-5 fill-current" />
                {isPersonalized ? 'Start Session' : 'Start Test'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
