"""Question schemas."""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict


class QuestionBase(BaseModel):
    section: str
    subsection: Optional[str] = None
    question_number: Optional[int] = None
    system: Optional[str] = None
    question_stem: str
    choices: Dict[str, str]
    correct_answer: str
    correct_explanation: Optional[str] = None
    incorrect_explanation: Optional[str] = None


class QuestionCreate(QuestionBase):
    id: str
    status: str = "ready"
    status_issues: Optional[List[str]] = None


class QuestionResponse(QuestionBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    status: str = "ready"
    status_issues: Optional[List[str]] = None
    created_at: Optional[Any] = None


class QuestionListResponse(BaseModel):
    items: list[QuestionResponse]
    total: int
