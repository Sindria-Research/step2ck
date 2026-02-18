/** Types aligned with backend schemas */

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Question {
  id: string;
  section: string;
  subsection: string | null;
  question_number: number | null;
  system: string | null;
  question_stem: string;
  choices: Record<string, string>;
  correct_answer: string;
  correct_explanation: string | null;
  incorrect_explanation: string | null;
  created_at?: string;
}

export interface ProgressRecord {
  question_id: string;
  correct: boolean;
  section?: string;
}

export interface ProgressStats {
  total: number;
  correct: number;
  incorrect: number;
  by_section: Array<{ name: string; total: number; correct: number; accuracy: number }>;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ExamGenerateRequest {
  subjects: string[];
  mode: 'all' | 'unused' | 'incorrect' | 'personalized';
  count: number;
}

export interface ExamGenerateResponse {
  questions: Question[];
  total: number;
}
