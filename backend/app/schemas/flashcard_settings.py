"""Schemas for flashcard settings."""
from typing import Optional

from pydantic import BaseModel, Field


class FlashcardSettingsResponse(BaseModel):
    daily_new_cards: int = 20
    daily_review_limit: int = 200
    learning_steps: str = "1,10"
    relearning_steps: str = "10"
    desired_retention: float = 0.9
    max_interval_days: int = 365
    new_card_order: str = "sequential"

    hotkey_show_answer: str = "Space"
    hotkey_again: str = "1"
    hotkey_hard: str = "2"
    hotkey_good: str = "3"
    hotkey_easy: str = "4"
    hotkey_flag: str = "f"
    hotkey_undo: str = "z"

    auto_advance: bool = False
    show_remaining_count: bool = True
    show_timer: bool = False

    model_config = {"from_attributes": True}


class FlashcardSettingsUpdate(BaseModel):
    daily_new_cards: Optional[int] = Field(None, ge=1, le=999)
    daily_review_limit: Optional[int] = Field(None, ge=1, le=9999)
    learning_steps: Optional[str] = None
    relearning_steps: Optional[str] = None
    desired_retention: Optional[float] = Field(None, ge=0.70, le=0.99)
    max_interval_days: Optional[int] = Field(None, ge=1, le=3650)
    new_card_order: Optional[str] = None

    hotkey_show_answer: Optional[str] = None
    hotkey_again: Optional[str] = None
    hotkey_hard: Optional[str] = None
    hotkey_good: Optional[str] = None
    hotkey_easy: Optional[str] = None
    hotkey_flag: Optional[str] = None
    hotkey_undo: Optional[str] = None

    auto_advance: Optional[bool] = None
    show_remaining_count: Optional[bool] = None
    show_timer: Optional[bool] = None
