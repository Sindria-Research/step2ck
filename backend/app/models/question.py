"""Question model."""
from __future__ import annotations

from datetime import datetime
from typing import Dict, Optional

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(255), primary_key=True, index=True)
    section: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    subsection: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    question_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    system: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    question_stem: Mapped[str] = mapped_column(Text, nullable=False)
    choices: Mapped[Dict[str, str]] = mapped_column(JSON, nullable=False)
    correct_answer: Mapped[str] = mapped_column(String(32), nullable=False)
    correct_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    incorrect_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<Question {self.id}>"
