"""Question model."""
from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

QUESTION_STATUS_READY = "ready"
QUESTION_STATUS_INCOMPLETE = "incomplete"
QUESTION_STATUS_NEEDS_REVIEW = "needs_review"
QUESTION_STATUS_BROKEN = "broken"


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(255), primary_key=True, index=True)
    section: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    subsection: Mapped[Optional[str]] = mapped_column(Text, nullable=True, index=True)
    question_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    system: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    question_stem: Mapped[str] = mapped_column(Text, nullable=False)
    choices: Mapped[Dict[str, str]] = mapped_column(JSON, nullable=False)
    correct_answer: Mapped[str] = mapped_column(String(32), nullable=False)
    correct_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    incorrect_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default=QUESTION_STATUS_READY, index=True)
    status_issues: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<Question {self.id} status={self.status}>"
