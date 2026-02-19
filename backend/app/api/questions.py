"""Questions endpoints."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Question
from app.models.question import QUESTION_STATUS_READY, QUESTION_STATUS_INCOMPLETE
from app.schemas.question import QuestionListResponse, QuestionResponse

router = APIRouter()

USABLE_STATUSES = [QUESTION_STATUS_READY, QUESTION_STATUS_INCOMPLETE]


@router.get("", response_model=QuestionListResponse)
def list_questions(
    db: Session = Depends(get_db),
    sections: Optional[List[str]] = Query(None, alias="sections[]"),
    status: Optional[List[str]] = Query(None, alias="status[]"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """List questions with optional section and status filters.
    
    By default only 'ready' and 'incomplete' questions are returned.
    Pass status[]=all to include every question regardless of status.
    """
    q = db.query(Question)
    if sections:
        q = q.filter(Question.section.in_(sections))
    if status and "all" in status:
        pass
    elif status:
        q = q.filter(Question.status.in_(status))
    else:
        q = q.filter(Question.status.in_(USABLE_STATUSES))
    total = q.count()
    items = q.offset(offset).limit(limit).all()
    return QuestionListResponse(
        items=[QuestionResponse.model_validate(x) for x in items],
        total=total,
    )


@router.get("/sections")
def list_sections(db: Session = Depends(get_db)):
    """Return distinct section names (only from usable questions)."""
    rows = (
        db.query(Question.section)
        .filter(Question.status.in_(USABLE_STATUSES))
        .distinct()
        .all()
    )
    return {"sections": [r[0] for r in rows]}


@router.get("/stats")
def question_stats(db: Session = Depends(get_db)):
    """Return count of questions per status."""
    from sqlalchemy import func
    rows = db.query(Question.status, func.count()).group_by(Question.status).all()
    return {status: count for status, count in rows}


@router.post("/by-ids", response_model=list[QuestionResponse])
def get_questions_by_ids(
    body: dict,
    db: Session = Depends(get_db),
):
    """Fetch questions by a list of IDs, preserving the requested order."""
    ids = body.get("ids", [])
    if not ids:
        return []
    rows = db.query(Question).filter(Question.id.in_(ids)).all()
    by_id = {q.id: q for q in rows}
    ordered = [by_id[qid] for qid in ids if qid in by_id]
    return [QuestionResponse.model_validate(q) for q in ordered]


@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(question_id: str, db: Session = Depends(get_db)):
    """Get a single question by id."""
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return QuestionResponse.model_validate(q)
