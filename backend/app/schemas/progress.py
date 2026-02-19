"""Progress schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProgressRecordBase(BaseModel):
    question_id: str
    correct: bool
    answer_selected: Optional[str] = None


class ProgressRecordCreate(ProgressRecordBase):
    section: str


class ProgressRecordResponse(ProgressRecordBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: str
    section: str
    created_at: Optional[datetime] = None


class ProgressStatsResponse(BaseModel):
    total: int
    correct: int
    incorrect: int
    by_section: list[dict]
    weak_areas: list[dict] = []
    readiness_score: int = 0
