"""Schemas for flashcards and decks."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class FlashcardDeckCreate(BaseModel):
    name: str
    description: Optional[str] = None
    section: Optional[str] = None


class FlashcardDeckUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class FlashcardDeckResponse(BaseModel):
    id: int
    user_id: str
    name: str
    description: Optional[str] = None
    section: Optional[str] = None
    card_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FlashcardCreate(BaseModel):
    deck_id: int
    front: str
    back: str
    question_id: Optional[str] = None


class FlashcardUpdate(BaseModel):
    front: Optional[str] = None
    back: Optional[str] = None
    flagged: Optional[bool] = None
    suspended: Optional[bool] = None
    buried: Optional[bool] = None
    notes: Optional[str] = None
    tags: Optional[str] = None


class FlashcardReview(BaseModel):
    rating: int  # 1=Again, 2=Hard, 3=Good, 4=Easy (FSRS scale)


class FlashcardResponse(BaseModel):
    id: int
    deck_id: int
    user_id: str
    front: str
    back: str
    question_id: Optional[str] = None
    stability: float
    difficulty: float
    ease_factor: float
    interval_days: int
    repetitions: int
    lapses: int
    state: str
    learning_step: int = 0
    flagged: bool
    suspended: bool = False
    buried: bool = False
    notes: Optional[str] = None
    tags: Optional[str] = None
    next_review: Optional[datetime] = None
    last_review: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ScheduleInfo(BaseModel):
    days: int
    minutes: int
    graduated: bool


class FlashcardReviewResponse(BaseModel):
    card: FlashcardResponse
    intervals: dict[str, ScheduleInfo]
    again_in_minutes: int = 0
    graduated: bool = False


class IntervalPreview(BaseModel):
    again: ScheduleInfo
    hard: ScheduleInfo
    good: ScheduleInfo
    easy: ScheduleInfo


# ── Generation Sources ──

class GenerationSessionSource(BaseModel):
    id: int
    mode: str
    date: str
    subjects: Optional[str] = None
    accuracy: Optional[float] = None
    incorrect_count: int

    model_config = {"from_attributes": True}


class GenerationSourcesResponse(BaseModel):
    sessions: list[GenerationSessionSource]
    sections: list[str]
    systems: list[str]


class GenerationQuestionsRequest(BaseModel):
    source: str  # "missed" | "session" | "section" | "system"
    session_id: Optional[int] = None
    section: Optional[str] = None
    system: Optional[str] = None


class GenerationQuestionItem(BaseModel):
    id: str
    section: str
    system: Optional[str] = None
    question_stem: str

    model_config = {"from_attributes": True}


class GenerationQuestionsResponse(BaseModel):
    questions: list[GenerationQuestionItem]


# ── Flashcard Stats ──

class FlashcardStatsDayHistory(BaseModel):
    date: str
    count: int


class FlashcardStatsResponse(BaseModel):
    total_cards: int = 0
    cards_new: int = 0
    cards_young: int = 0
    cards_mature: int = 0
    cards_suspended: int = 0
    cards_buried: int = 0
    reviews_today: int = 0
    reviews_streak: int = 0
    retention_rate: float = 0.0
    average_ease: float = 0.0
    total_reviews: int = 0
    daily_reviews_history: list[FlashcardStatsDayHistory] = []
