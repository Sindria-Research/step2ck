"""FlashcardSettings model - per-user spaced repetition and display preferences."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class FlashcardSettings(Base):
    __tablename__ = "flashcard_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, unique=True, index=True)

    # Scheduling
    daily_new_cards: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    daily_review_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=200)
    learning_steps: Mapped[str] = mapped_column(String(100), nullable=False, default="1,10")
    relearning_steps: Mapped[str] = mapped_column(String(100), nullable=False, default="10")
    desired_retention: Mapped[float] = mapped_column(Float, nullable=False, default=0.9)
    max_interval_days: Mapped[int] = mapped_column(Integer, nullable=False, default=365)
    new_card_order: Mapped[str] = mapped_column(String(20), nullable=False, default="sequential")

    # Hotkeys
    hotkey_show_answer: Mapped[str] = mapped_column(String(20), nullable=False, default="Space")
    hotkey_again: Mapped[str] = mapped_column(String(20), nullable=False, default="1")
    hotkey_hard: Mapped[str] = mapped_column(String(20), nullable=False, default="2")
    hotkey_good: Mapped[str] = mapped_column(String(20), nullable=False, default="3")
    hotkey_easy: Mapped[str] = mapped_column(String(20), nullable=False, default="4")
    hotkey_flag: Mapped[str] = mapped_column(String(20), nullable=False, default="f")
    hotkey_undo: Mapped[str] = mapped_column(String(20), nullable=False, default="z")

    # Display
    auto_advance: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    show_remaining_count: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_timer: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<FlashcardSettings user={self.user_id}>"
