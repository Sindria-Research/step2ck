import type {
  AIExplainRequest,
  AIExplainResponse,
  BookmarkResponse,
  ExamGenerateRequest,
  ExamGenerateResponse,
  ExamSession,
  ExamSessionCreateRequest,
  ExamSessionDetail,
  FlashcardCreateRequest,
  FlashcardDeckCreateRequest,
  FlashcardDeckResponse,
  FlashcardResponse,
  NoteCreateRequest,
  NoteResponse,
  NoteUpdateRequest,
  ProgressRecord,
  ProgressStats,
  Question,
  TokenResponse,
  User,
} from './types';
import { request } from './request';

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
    me: () => request<User>('/auth/me'),
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
      request<{ sections: string[] }>('/questions/sections'),
  },
  progress: {
    list: () =>
      request<Array<{ question_id: string; correct: boolean; section: string }>>(
        '/progress'
      ),
    stats: () => request<ProgressStats>('/progress/stats'),
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
    getDueCards: (limit = 20) =>
      request<FlashcardResponse[]>(`/flashcards/due?limit=${limit}`),
    createCard: (body: FlashcardCreateRequest) =>
      request<FlashcardResponse>('/flashcards/cards', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateCard: (id: number, body: { front?: string; back?: string }) =>
      request<FlashcardResponse>(`/flashcards/cards/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    reviewCard: (id: number, quality: number) =>
      request<FlashcardResponse>(`/flashcards/cards/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ quality }),
      }),
    deleteCard: (id: number) =>
      request<void>(`/flashcards/cards/${id}`, { method: 'DELETE' }),
  },
  bookmarks: {
    list: () => request<BookmarkResponse[]>('/bookmarks'),
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
