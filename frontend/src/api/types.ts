/** Types aligned with backend schemas */

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro';
  plan_interval: 'month' | 'year' | null;
  plan_expires_at: string | null;
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

export interface AIFlashcardRequest {
  question_id: string;
  selected_answer?: string;
  num_cards?: number;
}

export interface AIFlashcardCard {
  front: string;
  back: string;
}

export interface AIFlashcardResponse {
  cards: AIFlashcardCard[];
  model: string;
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
  new_count: number;
  learning_count: number;
  due_count: number;
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
  stability: number;
  difficulty: number;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  state: string;
  learning_step: number;
  flagged: boolean;
  suspended: boolean;
  buried: boolean;
  notes: string | null;
  tags: string | null;
  next_review: string | null;
  last_review: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleInfo {
  days: number;
  minutes: number;
  graduated: boolean;
}

export interface FlashcardReviewResponse {
  card: FlashcardResponse;
  intervals: Record<string, ScheduleInfo>;
  again_in_minutes: number;
  graduated: boolean;
}

export interface IntervalPreview {
  again: ScheduleInfo;
  hard: ScheduleInfo;
  good: ScheduleInfo;
  easy: ScheduleInfo;
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

// ── Billing ──

export interface CheckoutResponse {
  checkout_url: string;
}

export interface PortalResponse {
  portal_url: string;
}

export interface SubscriptionStatus {
  plan: 'free' | 'pro';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | null;
  interval: 'month' | 'year' | null;
  current_period_end: string | null;
  cancel_at: string | null;
  trial_end: string | null;
}

// ── Flashcard Generation Sources ──

export interface GenerationSessionSource {
  id: number;
  mode: string;
  date: string;
  subjects: string | null;
  accuracy: number | null;
  incorrect_count: number;
}

export interface GenerationSourcesResponse {
  sessions: GenerationSessionSource[];
  sections: string[];
  systems: string[];
  all_sections: string[];
  all_systems: string[];
}

export interface GenerationQuestionsRequest {
  source: 'missed' | 'session' | 'section' | 'system' | 'all_section' | 'all_system';
  session_id?: number;
  section?: string;
  system?: string;
  limit?: number;
}

export interface GenerationQuestionItem {
  id: string;
  section: string;
  system: string | null;
  question_stem: string;
}

export interface GenerationQuestionsResponse {
  questions: GenerationQuestionItem[];
}

// ── Flashcard Settings ──

export interface FlashcardSettingsResponse {
  daily_new_cards: number;
  daily_review_limit: number;
  learning_steps: string;
  relearning_steps: string;
  desired_retention: number;
  max_interval_days: number;
  new_card_order: string;

  hotkey_show_answer: string;
  hotkey_again: string;
  hotkey_hard: string;
  hotkey_good: string;
  hotkey_easy: string;
  hotkey_flag: string;
  hotkey_undo: string;

  auto_advance: boolean;
  show_remaining_count: boolean;
  show_timer: boolean;
}

export interface FlashcardSettingsUpdate {
  daily_new_cards?: number;
  daily_review_limit?: number;
  learning_steps?: string;
  relearning_steps?: string;
  desired_retention?: number;
  max_interval_days?: number;
  new_card_order?: string;

  hotkey_show_answer?: string;
  hotkey_again?: string;
  hotkey_hard?: string;
  hotkey_good?: string;
  hotkey_easy?: string;
  hotkey_flag?: string;
  hotkey_undo?: string;

  auto_advance?: boolean;
  show_remaining_count?: boolean;
  show_timer?: boolean;
}

// ── Flashcard Stats ──

export interface FlashcardStatsDayHistory {
  date: string;
  count: number;
}

export interface FlashcardStatsResponse {
  total_cards: number;
  cards_new: number;
  cards_young: number;
  cards_mature: number;
  cards_suspended: number;
  cards_buried: number;
  reviews_today: number;
  reviews_streak: number;
  retention_rate: number;
  average_ease: number;
  total_reviews: number;
  daily_reviews_history: FlashcardStatsDayHistory[];
}

// ── Bookmarks ──

export interface BookmarkResponse {
  id: number;
  user_id: string;
  question_id: string;
  created_at: string;
}
