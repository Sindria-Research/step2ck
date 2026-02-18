"""Questions endpoints."""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Question
from app.schemas.question import QuestionListResponse, QuestionResponse

router = APIRouter()


@router.get("", response_model=QuestionListResponse)
def list_questions(
    db: Session = Depends(get_db),
    sections: Optional[List[str]] = Query(None, alias="sections[]"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """List questions with optional section filter."""
    q = db.query(Question)
    if sections:
        q = q.filter(Question.section.in_(sections))
    total = q.count()
    items = q.offset(offset).limit(limit).all()
    return QuestionListResponse(
        items=[QuestionResponse.model_validate(x) for x in items],
        total=total,
    )


@router.get("/sections")
def list_sections(db: Session = Depends(get_db)):
    """Return distinct section names."""
    rows = db.query(Question.section).distinct().all()
    return {"sections": [r[0] for r in rows]}


@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(question_id: str, db: Session = Depends(get_db)):
    """Get a single question by id."""
    from fastapi import HTTPException
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return QuestionResponse.model_validate(q)
