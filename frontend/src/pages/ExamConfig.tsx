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
  { id: 'all' as const, label: 'All Questions', description: 'Include all questions' },
  { id: 'unused' as const, label: 'Unused Only', description: 'Exclude previously answered' },
  { id: 'incorrect' as const, label: 'Incorrect Only', description: 'Only questions you got wrong' },
];

const QUICK_COUNTS = [10, 20, 40];

export function ExamConfig() {
  const navigate = useNavigate();
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
    new Set(SUBJECTS)
  );
  const [mode, setMode] = useState<'all' | 'unused' | 'incorrect'>('all');
  const [questionCount, setQuestionCount] = useState(20);
  const [customCount, setCustomCount] = useState('');
  const [availableCount, setAvailableCount] = useState(0);
  const [sections, setSections] = useState<string[]>([]);
  useEffect(() => {
    api.questions.sections().then((res) => setSections(res.sections));
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

  const finalCount = Math.min(
    questionCount,
    customCount ? parseInt(customCount, 10) || questionCount : questionCount,
    availableCount
  );
  const canStart = selectedSubjects.size > 0 && availableCount > 0 && finalCount > 0;

  const handleStart = () => {
    const config = {
      subjects: Array.from(selectedSubjects),
      mode,
      count: finalCount,
    };
    sessionStorage.setItem('examConfig', JSON.stringify(config));
    navigate('/exam');
  };

  const handlePersonalized = () => {
    const config = {
      subjects: Array.from(selectedSubjects),
      mode: 'personalized' as const,
      count: 1,
    };
    sessionStorage.setItem('examConfig', JSON.stringify(config));
    navigate('/exam');
  };

  const displaySubjects = SUBJECTS.filter((s) => sections.includes(s)).length
    ? SUBJECTS.filter((s) => sections.includes(s))
    : SUBJECTS;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[var(--color-bg-secondary)]">
      <div className="max-w-3xl mx-auto p-6 pb-12">
        <div className="flex items-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)] font-display tracking-tight">
              Create New Test
            </h1>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
              Configure your exam session
            </p>
          </div>
        </div>

        <div className="card mb-6 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[var(--color-text-tertiary)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                Personalized Study Mode
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                One question at a time. Prioritizes questions you haven't seen or get wrong.
              </p>
              <button
                type="button"
                onClick={handlePersonalized}
                disabled={!canStart}
                className={`btn focus-ring text-sm ${canStart ? 'btn-primary' : 'btn-secondary opacity-60 cursor-not-allowed'}`}
              >
                Start Personalized Study
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-[var(--color-border)]" />
          <span className="text-sm text-[var(--color-text-muted)] font-medium">
            OR CREATE CUSTOM TEST
          </span>
          <div className="flex-1 h-px bg-[var(--color-border)]" />
        </div>

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Select Subjects
            </h2>
            <div className="flex gap-2">
              <button type="button" onClick={selectAll} className="text-sm text-[var(--color-text-primary)] hover:underline focus-ring font-medium">
                Select All
              </button>
              <span className="text-[var(--color-border)]">|</span>
              <button type="button" onClick={clearAll} className="text-sm text-[var(--color-text-tertiary)] hover:underline focus-ring">
                Clear
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {displaySubjects.map((subject) => (
              <button
                key={subject}
                type="button"
                onClick={() => toggleSubject(subject)}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all focus-ring ${
                  selectedSubjects.has(subject)
                    ? 'border-[var(--color-text-primary)] bg-[var(--color-bg-hover)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                }`}
              >
                <span className="flex-1 text-left font-medium text-[var(--color-text-primary)]">
                  {subject}
                </span>
                {selectedSubjects.has(subject) && (
                  <Check className="w-4 h-4 text-[var(--color-text-primary)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Question Mode
          </h2>
          <div className="space-y-3">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left focus-ring ${
                  mode === m.id
                    ? 'border-[var(--color-text-primary)] bg-[var(--color-bg-hover)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    mode === m.id ? 'border-[var(--color-text-primary)] bg-[var(--color-text-primary)]' : 'border-[var(--color-border)]'
                  }`}
                >
                  {mode === m.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">{m.label}</p>
                  <p className="text-sm text-[var(--color-text-tertiary)]">{m.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Number of Questions
          </h2>
          <div className="flex flex-wrap gap-3 mb-4">
            {QUICK_COUNTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setQuestionCount(c)}
                disabled={c > availableCount}
                className={`flex-1 min-w-[4rem] py-3 rounded-lg font-semibold transition-all focus-ring ${
                  questionCount === c && !customCount
                    ? 'bg-[var(--color-text-primary)] text-white'
                    : c > availableCount
                    ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                {c}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setQuestionCount(availableCount)}
              disabled={availableCount === 0}
              className={`flex-1 min-w-[4rem] py-3 rounded-lg font-semibold transition-all focus-ring ${
                questionCount === availableCount && !customCount
                  ? 'bg-[var(--color-text-primary)] text-white'
                  : availableCount === 0
                  ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              All ({availableCount})
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-text-tertiary)]">Or custom:</span>
            <input
              type="number"
              min={1}
              max={availableCount}
              value={customCount}
              onChange={(e) => {
                setCustomCount(e.target.value);
                const n = parseInt(e.target.value, 10);
                if (!isNaN(n) && n > 0) setQuestionCount(Math.min(n, availableCount));
              }}
              placeholder="Number"
              className="input flex-1 max-w-[8rem] text-center"
            />
          </div>
          <p className="text-center text-sm text-[var(--color-text-tertiary)] mt-3">
            {availableCount} questions available with current filters
          </p>
        </div>

        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart || finalCount === 0}
          className={`w-full btn focus-ring flex items-center justify-center gap-3 py-4 text-lg ${
            canStart && finalCount > 0 ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'
          }`}
        >
          <Play className="w-5 h-5" />
          Start Custom Test ({finalCount} questions)
        </button>
      </div>
    </div>
  );
}
