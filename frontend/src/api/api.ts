import { API_BASE } from '../config/env';
import { supabase } from '../lib/supabase';
import type {
  AIExplainRequest,
  AIExplainResponse,
  AIFlashcardRequest,
  AIFlashcardResponse,
  BookmarkResponse,
  CheckoutResponse,
  DailySummary,
  ExamGenerateRequest,
  ExamGenerateResponse,
  ExamSession,
  ExamSessionAnswer,
  ExamSessionAnswerUpdateRequest,
  ExamSessionCreateRequest,
  ExamSessionDetail,
  FlashcardCreateRequest,
  FlashcardDeckCreateRequest,
  FlashcardDeckResponse,
  FlashcardResponse,
  FlashcardReviewResponse,
  FlashcardSettingsResponse,
  FlashcardSettingsUpdate,
  FlashcardStatsResponse,
  GenerationQuestionsRequest,
  GenerationQuestionsResponse,
  GenerationSourcesResponse,
  IntervalPreview,
  NoteCreateRequest,
  NoteResponse,
  NoteUpdateRequest,
  PortalResponse,
  ProgressRecord,
  ProgressStats,
  Question,
  SectionTrend,
  StudyPlanResponse,
  StudyProfileResponse,
  StudyProfileUpdate,
  SubscriptionStatus,
  TimeStats,
  TokenResponse,
  User,
} from './types';
import { request, isPublicPath } from './request';

export const api = {
  auth: {
    login: (email: string, password?: string) =>
      request<TokenResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      }),
    googleLogin: (idToken: string) =>
      request<TokenResponse>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ id_token: idToken }),
        skipAuth: true,
      }),
    me: (opts?: { retries?: number }) => request<User>('/auth/me', { retries: opts?.retries }),
  },
  questions: {
    list: (params?: { sections?: string[]; limit?: number; offset?: number }) => {
      const search = new URLSearchParams();
      if (params?.sections?.length)
        params.sections.forEach((s) => search.append('sections[]', s));
      if (params?.limit != null) search.set('limit', String(params.limit));
      if (params?.offset != null) search.set('offset', String(params.offset));
      const q = search.toString();
      return request<{ items: Question[]; total: number }>(
        `/questions${q ? `?${q}` : ''}`
      );
    },
    get: (id: string) => request<Question>(`/questions/${id}`),
    sections: () =>
      request<{ sections: string[] }>('/questions/sections', { cacheTtlMs: 120_000 }),
    getByIds: (ids: string[]) =>
      request<Question[]>('/questions/by-ids', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
  },
  progress: {
    list: () =>
      request<Array<{ question_id: string; correct: boolean; section: string }>>(
        '/progress'
      ),
    stats: () => request<ProgressStats>('/progress/stats', { cacheTtlMs: 30_000 }),
    dailySummary: () => request<DailySummary>('/progress/daily-summary', { cacheTtlMs: 30_000 }),
    timeStats: () => request<TimeStats>('/progress/time-stats', { cacheTtlMs: 60_000 }),
    trends: () => request<SectionTrend[]>('/progress/trends', { cacheTtlMs: 60_000 }),
    record: (data: {
      question_id: string;
      correct: boolean;
      answer_selected?: string;
      section: string;
    }) =>
      request<ProgressRecord>('/progress', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  exams: {
    generate: (body: ExamGenerateRequest) =>
      request<ExamGenerateResponse>('/exams/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  ai: {
    explain: (body: AIExplainRequest) =>
      request<AIExplainResponse>('/ai/explain', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    generateFlashcard: (body: AIFlashcardRequest) =>
      request<AIFlashcardResponse>('/ai/flashcard', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  examSessions: {
    list: (status?: string) => {
      const q = status ? `?status_filter=${status}` : '';
      return request<ExamSession[]>(`/exam-sessions${q}`);
    },
    get: (id: number) => request<ExamSessionDetail>(`/exam-sessions/${id}`),
    create: (body: ExamSessionCreateRequest) =>
      request<ExamSession>('/exam-sessions', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: number, body: Record<string, unknown>) =>
      request<ExamSession>(`/exam-sessions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (id: number) =>
      request<void>(`/exam-sessions/${id}`, { method: 'DELETE' }),
    updateAnswer: (sessionId: number, questionId: string, body: ExamSessionAnswerUpdateRequest) =>
      request<ExamSessionAnswer>(`/exam-sessions/${sessionId}/answers/${encodeURIComponent(questionId)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    batchUpdateAnswers: (sessionId: number, answers: Array<{ question_id: string } & ExamSessionAnswerUpdateRequest>) =>
      request<ExamSessionAnswer[]>(`/exam-sessions/${sessionId}/answers`, {
        method: 'PATCH',
        body: JSON.stringify({ answers }),
      }),
  },
  notes: {
    list: (params?: { question_id?: string; section?: string }) => {
      const search = new URLSearchParams();
      if (params?.question_id) search.set('question_id', params.question_id);
      if (params?.section) search.set('section', params.section);
      const q = search.toString();
      return request<NoteResponse[]>(`/notes${q ? `?${q}` : ''}`);
    },
    get: (id: number) => request<NoteResponse>(`/notes/${id}`),
    create: (body: NoteCreateRequest) =>
      request<NoteResponse>('/notes', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: number, body: NoteUpdateRequest) =>
      request<NoteResponse>(`/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (id: number) =>
      request<void>(`/notes/${id}`, { method: 'DELETE' }),
  },
  flashcards: {
    listDecks: () => request<FlashcardDeckResponse[]>('/flashcards/decks'),
    createDeck: (body: FlashcardDeckCreateRequest) =>
      request<FlashcardDeckResponse>('/flashcards/decks', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateDeck: (id: number, body: { name?: string; description?: string }) =>
      request<FlashcardDeckResponse>(`/flashcards/decks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteDeck: (id: number) =>
      request<void>(`/flashcards/decks/${id}`, { method: 'DELETE' }),
    listCards: (deckId: number) =>
      request<FlashcardResponse[]>(`/flashcards/decks/${deckId}/cards`),
    getDeckReviewCards: (deckId: number, mode: 'due' | 'all' = 'all', limit = 200) =>
      request<FlashcardResponse[]>(`/flashcards/decks/${deckId}/review?mode=${mode}&limit=${limit}`),
    getDueCards: (limit = 20) =>
      request<FlashcardResponse[]>(`/flashcards/due?limit=${limit}`),
    createCard: (body: FlashcardCreateRequest) =>
      request<FlashcardResponse>('/flashcards/cards', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateCard: (id: number, body: { front?: string; back?: string; flagged?: boolean; suspended?: boolean; buried?: boolean; notes?: string; tags?: string }) =>
      request<FlashcardResponse>(`/flashcards/cards/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    reviewCard: (id: number, rating: number) =>
      request<FlashcardReviewResponse>(`/flashcards/cards/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating }),
      }),
    getIntervals: (id: number) =>
      request<IntervalPreview>(`/flashcards/cards/${id}/intervals`),
    deleteCard: (id: number) =>
      request<void>(`/flashcards/cards/${id}`, { method: 'DELETE' }),
    getGenerationSources: () =>
      request<GenerationSourcesResponse>('/flashcards/generation-sources'),
    getGenerationQuestions: (body: GenerationQuestionsRequest) =>
      request<GenerationQuestionsResponse>('/flashcards/generation-questions', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    getSettings: () =>
      request<FlashcardSettingsResponse>('/flashcards/settings'),
    updateSettings: (body: FlashcardSettingsUpdate) =>
      request<FlashcardSettingsResponse>('/flashcards/settings', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    getStats: () =>
      request<FlashcardStatsResponse>('/flashcards/stats', { cacheTtlMs: 30_000 }),
    unburyAll: () =>
      request<{ unburied: number }>('/flashcards/cards/unbury-all', { method: 'POST' }),
    importApkg: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const url = `${API_BASE}/flashcards/import-apkg`;
      const headers: HeadersInit = {};
      let token = localStorage.getItem('token');
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) token = data.session.access_token;
      }
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(url, { method: 'POST', headers, body: formData });
      if (res.status === 401) {
        if (supabase) await supabase.auth.signOut();
        localStorage.removeItem('token');
        if (!isPublicPath(window.location.pathname)) {
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
      }
      return res.json() as Promise<FlashcardDeckResponse[]>;
    },
  },
  studyProfile: {
    get: () => request<StudyProfileResponse>('/study-profile'),
    update: (body: StudyProfileUpdate) =>
      request<StudyProfileResponse>('/study-profile', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
  },
  studyPlan: {
    get: () => request<StudyPlanResponse>('/study-plan'),
    generate: () =>
      request<StudyPlanResponse>('/study-plan/generate', { method: 'POST' }),
  },
  billing: {
    createCheckout: (interval: 'month' | 'year') =>
      request<CheckoutResponse>(`/billing/checkout/${interval}`, { method: 'POST' }),
    createPortal: () =>
      request<PortalResponse>('/billing/portal', { method: 'POST' }),
    getSubscription: () =>
      request<SubscriptionStatus>('/billing/subscription'),
  },
  bookmarks: {
    list: () => request<BookmarkResponse[]>('/bookmarks'),
    count: () => request<{ count: number }>('/bookmarks/count'),
    create: (questionId: string) =>
      request<BookmarkResponse>('/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ question_id: questionId }),
      }),
    delete: (questionId: string) =>
      request<void>(`/bookmarks/${questionId}`, { method: 'DELETE' }),
    check: (questionId: string) =>
      request<{ bookmarked: boolean }>(`/bookmarks/check/${questionId}`),
  },
};
