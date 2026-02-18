"""Exam generation schemas."""
from typing import List, Literal

from pydantic import BaseModel

from app.schemas.question import QuestionResponse


class ExamGenerateRequest(BaseModel):
    subjects: List[str]
    mode: Literal["all", "unused", "incorrect", "personalized"] = "all"
    count: int = 20


class ExamGenerateResponse(BaseModel):
    questions: List[QuestionResponse]
    total: int
