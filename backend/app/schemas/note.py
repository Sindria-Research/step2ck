"""Schemas for notes."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NoteCreate(BaseModel):
    title: str = ""
    content: str = ""
    question_id: Optional[str] = None
    section: Optional[str] = None
    tags: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None


class NoteResponse(BaseModel):
    id: int
    user_id: str
    question_id: Optional[str] = None
    title: str
    content: str
    section: Optional[str] = None
    tags: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
