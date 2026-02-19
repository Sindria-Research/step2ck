"""Study profile schemas."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class StudyProfileUpdate(BaseModel):
    exam_date: Optional[date] = None
    target_score: Optional[int] = Field(None, ge=1, le=300)
    daily_question_goal: Optional[int] = Field(None, ge=1, le=500)


class StudyProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    exam_date: Optional[date] = None
    target_score: Optional[int] = None
    daily_question_goal: int = 40
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
