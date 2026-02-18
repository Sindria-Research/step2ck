"""AI explanation schemas."""
from typing import Optional

from pydantic import BaseModel, Field


class AIExplainRequest(BaseModel):
    question_id: str
    selected_answer: Optional[str] = None
    selection_text: Optional[str] = Field(default=None, max_length=1200)


class AIExplainResponse(BaseModel):
    explanation: str
    model: str
    fallback_used: bool = False
