"""Questions endpoints."""
import time
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Question
from app.models.question import QUESTION_STATUS_READY, QUESTION_STATUS_INCOMPLETE
from app.schemas.question import QuestionListResponse, QuestionResponse

router = APIRouter()

USABLE_STATUSES = [QUESTION_STATUS_READY, QUESTION_STATUS_INCOMPLETE]

_cache: dict[str, tuple[float, Any]] = {}
CACHE_TTL = 300  # 5 minutes


def _get_cached(key: str):
    entry = _cache.get(key)
    if entry and (time.monotonic() - entry[0]) < CACHE_TTL:
        return entry[1]
    return None


def _set_cached(key: str, value: Any):
    _cache[key] = (time.monotonic(), value)


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
    """Return distinct section names (only from usable questions). Cached for 5 min."""
    cached = _get_cached("sections")
    if cached is not None:
        return cached
    rows = (
        db.query(Question.section)
        .filter(Question.status.in_(USABLE_STATUSES))
        .distinct()
        .all()
    )
    result = {"sections": [r[0] for r in rows]}
    _set_cached("sections", result)
    return result


@router.get("/stats")
def question_stats(db: Session = Depends(get_db)):
    """Return count of questions per status. Cached for 5 min."""
    cached = _get_cached("stats")
    if cached is not None:
        return cached
    from sqlalchemy import func
    rows = db.query(Question.status, func.count()).group_by(Question.status).all()
    result = {s: count for s, count in rows}
    _set_cached("stats", result)
    return result


MAX_BY_IDS = 200


@router.post("/by-ids", response_model=list[QuestionResponse])
def get_questions_by_ids(
    body: dict,
    db: Session = Depends(get_db),
):
    """Fetch questions by a list of IDs, preserving the requested order."""
    ids = body.get("ids", [])
    if not ids:
        return []
    if len(ids) > MAX_BY_IDS:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_BY_IDS} IDs per request")
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
