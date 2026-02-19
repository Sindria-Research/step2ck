"""Schemas for exam sessions."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ExamSessionAnswerResponse(BaseModel):
    id: int
    question_id: str
    answer_selected: Optional[str] = None
    correct: Optional[bool] = None
    time_spent_seconds: Optional[int] = None
    flagged: bool = False
    order_index: int = 0

    model_config = {"from_attributes": True}


class ExamSessionCreate(BaseModel):
    mode: str
    total_questions: int
    subjects: Optional[str] = None
    question_ids: list[str] = []


class ExamSessionUpdate(BaseModel):
    correct_count: Optional[int] = None
    incorrect_count: Optional[int] = None
    unanswered_count: Optional[int] = None
    accuracy: Optional[float] = None
    status: Optional[str] = None
    completed_at: Optional[datetime] = None


class ExamSessionResponse(BaseModel):
    id: int
    user_id: str
    mode: str
    total_questions: int
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    accuracy: Optional[float] = None
    subjects: Optional[str] = None
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ExamSessionDetailResponse(ExamSessionResponse):
    answers: list[ExamSessionAnswerResponse] = []


class ExamSessionAnswerUpdate(BaseModel):
    answer_selected: Optional[str] = None
    correct: Optional[bool] = None
    time_spent_seconds: Optional[int] = None
    flagged: Optional[bool] = None


class ExamSessionAnswerBatchItem(BaseModel):
    question_id: str
    answer_selected: Optional[str] = None
    correct: Optional[bool] = None
    time_spent_seconds: Optional[int] = None
    flagged: Optional[bool] = None


class ExamSessionAnswerBatchUpdate(BaseModel):
    answers: list[ExamSessionAnswerBatchItem]
