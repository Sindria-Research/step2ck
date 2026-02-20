"""Flashcard models - decks and individual cards with FSRS spaced repetition."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class FlashcardDeck(Base):
    __tablename__ = "flashcard_decks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    section: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    card_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    cards = relationship("Flashcard", back_populates="deck", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<FlashcardDeck id={self.id} name={self.name!r}>"


class Flashcard(Base):
    __tablename__ = "flashcards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    deck_id: Mapped[int] = mapped_column(Integer, ForeignKey("flashcard_decks.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    front: Mapped[str] = mapped_column(Text, nullable=False)
    back: Mapped[str] = mapped_column(Text, nullable=False)
    question_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # FSRS scheduling fields
    stability: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    difficulty: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    interval_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    repetitions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    lapses: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    state: Mapped[str] = mapped_column(String(16), nullable=False, default="new")
    learning_step: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    next_review: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_review: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Legacy SM-2 field (kept for backward compat, no longer used for scheduling)
    ease_factor: Mapped[float] = mapped_column(Float, nullable=False, default=2.5)

    flagged: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    deck = relationship("FlashcardDeck", back_populates="cards")

    def __repr__(self) -> str:
        return f"<Flashcard id={self.id} deck={self.deck_id}>"
