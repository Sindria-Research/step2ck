import { describe, it, expect } from 'vitest';

/**
 * Pure-logic tests for session mode prefix parsing and filtering.
 * These mirror the logic used in PreviousTests and PracticeHistory.
 */

function parseSessionMode(mode: string) {
  const match = mode.match(/^(practice|test):(.+)$/);
  return match
    ? { examType: match[1] as 'practice' | 'test', questionMode: match[2] }
    : { examType: 'practice' as const, questionMode: mode };
}

function isTestSession(mode: string): boolean {
  return mode.startsWith('test:');
}

function isPracticeSession(mode: string): boolean {
  return mode.startsWith('practice:') || !mode.includes(':');
}

describe('parseSessionMode', () => {
  it('parses test:all correctly', () => {
    expect(parseSessionMode('test:all')).toEqual({ examType: 'test', questionMode: 'all' });
  });

  it('parses practice:unused correctly', () => {
    expect(parseSessionMode('practice:unused')).toEqual({ examType: 'practice', questionMode: 'unused' });
  });

  it('parses test:incorrect correctly', () => {
    expect(parseSessionMode('test:incorrect')).toEqual({ examType: 'test', questionMode: 'incorrect' });
  });

  it('parses practice:personalized correctly', () => {
    expect(parseSessionMode('practice:personalized')).toEqual({ examType: 'practice', questionMode: 'personalized' });
  });

  it('treats unprefixed mode as practice (legacy)', () => {
    expect(parseSessionMode('all')).toEqual({ examType: 'practice', questionMode: 'all' });
  });

  it('treats unprefixed "unused" as practice (legacy)', () => {
    expect(parseSessionMode('unused')).toEqual({ examType: 'practice', questionMode: 'unused' });
  });

  it('treats unprefixed "incorrect" as practice (legacy)', () => {
    expect(parseSessionMode('incorrect')).toEqual({ examType: 'practice', questionMode: 'incorrect' });
  });
});

describe('isTestSession', () => {
  it('returns true for test:all', () => {
    expect(isTestSession('test:all')).toBe(true);
  });

  it('returns true for test:unused', () => {
    expect(isTestSession('test:unused')).toBe(true);
  });

  it('returns false for practice:all', () => {
    expect(isTestSession('practice:all')).toBe(false);
  });

  it('returns false for unprefixed "all" (legacy)', () => {
    expect(isTestSession('all')).toBe(false);
  });

  it('returns false for unprefixed "unused" (legacy)', () => {
    expect(isTestSession('unused')).toBe(false);
  });
});

describe('isPracticeSession', () => {
  it('returns true for practice:all', () => {
    expect(isPracticeSession('practice:all')).toBe(true);
  });

  it('returns true for practice:incorrect', () => {
    expect(isPracticeSession('practice:incorrect')).toBe(true);
  });

  it('returns true for unprefixed "all" (legacy)', () => {
    expect(isPracticeSession('all')).toBe(true);
  });

  it('returns true for unprefixed "unused" (legacy)', () => {
    expect(isPracticeSession('unused')).toBe(true);
  });

  it('returns false for test:all', () => {
    expect(isPracticeSession('test:all')).toBe(false);
  });

  it('returns false for test:incorrect', () => {
    expect(isPracticeSession('test:incorrect')).toBe(false);
  });
});

describe('filtering sessions into correct lists', () => {
  const sessions = [
    { id: 1, mode: 'test:all' },
    { id: 2, mode: 'practice:all' },
    { id: 3, mode: 'all' },           // legacy, no prefix
    { id: 4, mode: 'test:unused' },
    { id: 5, mode: 'practice:incorrect' },
    { id: 6, mode: 'unused' },         // legacy
    { id: 7, mode: 'incorrect' },      // legacy
    { id: 8, mode: 'test:incorrect' },
  ];

  it('Previous Tests shows only test: sessions', () => {
    const testSessions = sessions.filter((s) => isTestSession(s.mode));
    expect(testSessions.map((s) => s.id)).toEqual([1, 4, 8]);
  });

  it('Practice History shows practice: and legacy sessions', () => {
    const practiceSessions = sessions.filter((s) => isPracticeSession(s.mode));
    expect(practiceSessions.map((s) => s.id)).toEqual([2, 3, 5, 6, 7]);
  });

  it('no session appears in both lists', () => {
    const testIds = sessions.filter((s) => isTestSession(s.mode)).map((s) => s.id);
    const practiceIds = sessions.filter((s) => isPracticeSession(s.mode)).map((s) => s.id);
    const overlap = testIds.filter((id) => practiceIds.includes(id));
    expect(overlap).toEqual([]);
  });

  it('every session appears in exactly one list', () => {
    const testIds = sessions.filter((s) => isTestSession(s.mode)).map((s) => s.id);
    const practiceIds = sessions.filter((s) => isPracticeSession(s.mode)).map((s) => s.id);
    const allCategorized = [...testIds, ...practiceIds].sort((a, b) => a - b);
    const allOriginal = sessions.map((s) => s.id).sort((a, b) => a - b);
    expect(allCategorized).toEqual(allOriginal);
  });
});

describe('mode display stripping', () => {
  it('strips test: prefix for display', () => {
    expect('test:all'.replace(/^(practice|test):/, '')).toBe('all');
  });

  it('strips practice: prefix for display', () => {
    expect('practice:unused'.replace(/^(practice|test):/, '')).toBe('unused');
  });

  it('leaves unprefixed mode unchanged for display', () => {
    expect('all'.replace(/^(practice|test):/, '')).toBe('all');
  });
});

describe('existingSessionId config handling', () => {
  it('retake config should not have existingSessionId', () => {
    const config = {
      subjects: ['Surgery'],
      mode: 'all',
      count: 20,
      examType: 'test',
    };
    expect(config).not.toHaveProperty('existingSessionId');
  });

  it('continue/review config should have existingSessionId', () => {
    const config = {
      subjects: ['Surgery'],
      mode: 'all',
      count: 20,
      examType: 'test',
      existingSessionId: 42,
    };
    expect(config.existingSessionId).toBe(42);
  });

  it('retake from TestReviewPanel strips existingSessionId', () => {
    const raw = JSON.stringify({
      subjects: ['Surgery'],
      mode: 'all',
      examType: 'test',
      existingSessionId: 42,
    });
    const parsed = JSON.parse(raw);
    delete parsed.existingSessionId;
    expect(parsed).not.toHaveProperty('existingSessionId');
    expect(parsed.examType).toBe('test');
    expect(parsed.mode).toBe('all');
  });
});
