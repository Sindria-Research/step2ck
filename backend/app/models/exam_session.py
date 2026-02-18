"""Exam session model - tracks each test a user takes."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    mode: Mapped[str] = mapped_column(String(32), nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    correct_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    incorrect_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    unanswered_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    subjects: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="in_progress")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    answers = relationship("ExamSessionAnswer", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<ExamSession id={self.id} user={self.user_id} status={self.status}>"


class ExamSessionAnswer(Base):
    __tablename__ = "exam_session_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("exam_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id: Mapped[str] = mapped_column(String(255), nullable=False)
    answer_selected: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    correct: Mapped[Optional[bool]] = mapped_column(nullable=True)
    time_spent_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    flagged: Mapped[bool] = mapped_column(default=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    session = relationship("ExamSession", back_populates="answers")

    def __repr__(self) -> str:
        return f"<ExamSessionAnswer session={self.session_id} q={self.question_id}>"
