"""User study profile — exam date, target score, daily goal."""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserStudyProfile(Base):
    __tablename__ = "user_study_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    exam_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    target_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    daily_question_goal: Mapped[int] = mapped_column(Integer, nullable=False, default=40)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", backref="study_profile")

    def __repr__(self) -> str:
        return f"<UserStudyProfile user={self.user_id} exam={self.exam_date}>"
