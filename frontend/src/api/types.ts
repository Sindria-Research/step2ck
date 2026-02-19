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
  status?: 'ready' | 'incomplete' | 'needs_review' | 'broken';
  status_issues?: string[];
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
  weak_areas: Array<{ name: string; accuracy: number; total: number }>;
  readiness_score: number;
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

export interface AIExplainRequest {
  question_id: string;
  selected_answer?: string;
  selection_text?: string;
}

export interface AIExplainResponse {
  explanation: string;
  model: string;
  fallback_used: boolean;
}

// ── Exam Sessions ──

export interface ExamSessionAnswer {
  id: number;
  question_id: string;
  answer_selected: string | null;
  correct: boolean | null;
  time_spent_seconds: number | null;
  flagged: boolean;
  order_index: number;
}

export interface ExamSession {
  id: number;
  user_id: string;
  mode: string;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  accuracy: number | null;
  subjects: string | null;
  status: string;
  started_at: string;
  completed_at: string | null;
}

export interface ExamSessionDetail extends ExamSession {
  answers: ExamSessionAnswer[];
}

export interface ExamSessionCreateRequest {
  mode: string;
  total_questions: number;
  subjects?: string;
  question_ids: string[];
}

export interface ExamSessionAnswerUpdateRequest {
  answer_selected?: string;
  correct?: boolean;
  time_spent_seconds?: number;
  flagged?: boolean;
}

// ── Notes ──

export interface NoteResponse {
  id: number;
  user_id: string;
  question_id: string | null;
  title: string;
  content: string;
  section: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteCreateRequest {
  title?: string;
  content?: string;
  question_id?: string;
  section?: string;
  tags?: string;
}

export interface NoteUpdateRequest {
  title?: string;
  content?: string;
  tags?: string;
}

// ── Flashcards ──

export interface FlashcardDeckResponse {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  section: string | null;
  card_count: number;
  created_at: string;
  updated_at: string;
}

export interface FlashcardResponse {
  id: number;
  deck_id: number;
  user_id: string;
  front: string;
  back: string;
  question_id: string | null;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlashcardDeckCreateRequest {
  name: string;
  description?: string;
  section?: string;
}

export interface FlashcardCreateRequest {
  deck_id: number;
  front: string;
  back: string;
  question_id?: string;
}

// ── Study Profile ──

export interface StudyProfileResponse {
  id: number;
  user_id: string;
  exam_date: string | null;
  target_score: number | null;
  daily_question_goal: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface StudyProfileUpdate {
  exam_date?: string | null;
  target_score?: number | null;
  daily_question_goal?: number | null;
}

// ── Study Plan ──

export interface StudyPlanWeek {
  week: number;
  start: string;
  end: string;
  phase: string;
  focus_sections: string[];
  question_target: number;
  completed: number;
}

export interface StudyPlanData {
  exam_date: string;
  weeks_until_exam: number;
  daily_goal: number;
  weeks: StudyPlanWeek[];
}

export interface StudyPlanResponse {
  plan_data: StudyPlanData | null;
  generated_at?: string;
}

// ── Daily Summary ──

export interface DailySummaryDay {
  date: string;
  count: number;
  met_goal: boolean;
}

export interface DailySummary {
  today_count: number;
  daily_goal: number;
  streak: number;
  history: DailySummaryDay[];
}

// ── Time Stats ──

export interface TimeSectionStat {
  name: string;
  avg_seconds: number;
  correct_avg: number;
  incorrect_avg: number;
  total: number;
}

export interface TimeStats {
  avg_seconds: number;
  median_seconds: number;
  by_section: TimeSectionStat[];
}

// ── Trends ──

export interface TrendWeek {
  week: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface SectionTrend {
  section: string;
  weeks: TrendWeek[];
}

// ── Bookmarks ──

export interface BookmarkResponse {
  id: number;
  user_id: string;
  question_id: string;
  created_at: string;
}
