import type {
  ExamGenerateRequest,
  ExamGenerateResponse,
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
};
