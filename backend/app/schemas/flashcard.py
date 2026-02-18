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


class FlashcardReview(BaseModel):
    quality: int  # 0-5 SM-2 scale


class FlashcardResponse(BaseModel):
    id: int
    deck_id: int
    user_id: str
    front: str
    back: str
    question_id: Optional[str] = None
    ease_factor: float
    interval_days: int
    repetitions: int
    next_review: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
