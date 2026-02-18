import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ChevronLeft, Check, Sparkles } from 'lucide-react';
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
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set(SUBJECTS));
  const [mode, setMode] = useState<'all' | 'unused' | 'incorrect' | 'personalized'>('all');
  const [questionCount, setQuestionCount] = useState(20);
  const [customCount, setCustomCount] = useState('');
  const [availableCount, setAvailableCount] = useState(0);
  const [sections, setSections] = useState<string[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionsError, setSectionsError] = useState<string | null>(null);

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
      .list({ sections: subList, limit: 5000 })
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
  const effectiveCount = isPersonalized ? 1 : questionCount;
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
    <div className="flex-1 min-h-0 overflow-y-auto bg-[var(--color-bg-secondary)]">
      <div className="max-w-2xl mx-auto p-6 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)] font-display tracking-tight">
              New test
            </h1>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
              Choose subjects, mode, and length
            </p>
          </div>
        </div>

        {/* Subjects */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
              Subjects
            </h2>
            <div className="flex gap-2">
              <button type="button" onClick={selectAll} className="text-xs font-medium text-[var(--color-text-primary)] hover:underline focus-ring">
                All
              </button>
              <span className="text-[var(--color-border)]">·</span>
              <button type="button" onClick={clearAll} className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] focus-ring">
                Clear
              </button>
            </div>
          </div>
          {sectionsLoading ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-6 text-center text-sm text-[var(--color-text-tertiary)]">
              Loading subjects…
            </div>
          ) : sectionsError ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4 text-sm text-[var(--color-text-secondary)]">
              {sectionsError} — using default list.
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            {displaySubjects.map((subject) => (
              <button
                key={subject}
                type="button"
                onClick={() => toggleSubject(subject)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all focus-ring text-left ${
                  selectedSubjects.has(subject)
                    ? 'border-[var(--color-border-hover)] bg-[var(--color-bg-hover)]'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-hover)]'
                } text-[var(--color-text-primary)]`}
              >
                <span className="flex-1 font-medium text-sm">{subject}</span>
                {selectedSubjects.has(subject) && <Check className="w-4 h-4 shrink-0 text-[var(--color-text-tertiary)]" />}
              </button>
            ))}
          </div>
          {!sectionsLoading && (
            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
              {availableCount} questions available with selected subjects
            </p>
          )}
        </section>

        {/* Mode */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-3">
            Mode
          </h2>
          <div className="space-y-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border transition-all text-left focus-ring ${
                  mode === m.id
                    ? 'border-[var(--color-border-hover)] bg-[var(--color-bg-hover)]'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-hover)]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    mode === m.id ? 'border-[var(--color-text-primary)] bg-[var(--color-text-primary)]' : 'border-[var(--color-border)] bg-transparent'
                  }`}
                >
                  {mode === m.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {m.label}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] truncate">{m.description}</p>
                </div>
                {m.id === 'personalized' && (
                  <Sparkles className="w-4 h-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Number of questions — hidden when personalized */}
        {!isPersonalized && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-3">
              Number of questions
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK_COUNTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCount(c)}
                  disabled={c > availableCount}
                  className={`min-w-[3rem] py-2.5 px-4 rounded-lg text-sm font-semibold transition-all focus-ring ${
                    questionCount === c && !customCount
                      ? 'bg-[var(--color-text-primary)] text-white'
                      : c > availableCount
                      ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
                      : 'bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  {c}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCount(availableCount)}
                disabled={availableCount === 0}
                className={`min-w-[3rem] py-2.5 px-4 rounded-lg text-sm font-semibold transition-all focus-ring ${
                  questionCount === availableCount && !customCount
                    ? 'bg-[var(--color-text-primary)] text-white'
                    : availableCount === 0
                    ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
                    : 'bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                All ({availableCount})
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="custom-count" className="text-xs text-[var(--color-text-tertiary)]">
                Custom:
              </label>
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
                placeholder="e.g. 15"
                className="input w-24 h-9 text-center text-sm"
              />
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart}
          className={`w-full btn flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-medium focus-ring ${
            canStart ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'
          }`}
        >
          <Play className="w-5 h-5" />
          {isPersonalized ? 'Start personalized study' : `Start test (${finalCount} questions)`}
        </button>
      </div>
    </div>
  );
}
