"""Schemas for bookmarks."""
from datetime import datetime

from pydantic import BaseModel


class BookmarkCreate(BaseModel):
    question_id: str


class BookmarkResponse(BaseModel):
    id: int
    user_id: str
    question_id: str
    created_at: datetime

    model_config = {"from_attributes": True}
