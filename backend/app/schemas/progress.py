"""Progress schemas."""
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
    created_at: Optional[str] = None


class ProgressStatsResponse(BaseModel):
    total: int
    correct: int
    incorrect: int
    by_section: list[dict]  # [{"name": str, "accuracy": int, "total": int, "correct": int}]
