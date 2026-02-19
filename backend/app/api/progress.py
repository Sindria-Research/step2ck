"""Progress endpoints."""
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func as sqlfunc
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import User, UserProgress
from app.schemas.progress import ProgressRecordCreate, ProgressRecordResponse, ProgressStatsResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=list)
def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """Return current user's progress records (question_id, correct) with pagination."""
    rows = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == current_user.id)
        .order_by(UserProgress.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        {"question_id": r.question_id, "correct": r.correct, "section": r.section}
        for r in rows
    ]


@router.get("/stats", response_model=ProgressStatsResponse)
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregate stats using SQL — no full table scan into Python."""
    base = db.query(UserProgress).filter(UserProgress.user_id == current_user.id)

    totals = base.with_entities(
        sqlfunc.count().label("total"),
        sqlfunc.sum(case((UserProgress.correct == True, 1), else_=0)).label("correct"),  # noqa: E712
    ).first()

    total = totals.total or 0
    correct = int(totals.correct or 0)
    incorrect = total - correct

    section_rows = (
        base.with_entities(
            UserProgress.section,
            sqlfunc.count().label("total"),
            sqlfunc.sum(case((UserProgress.correct == True, 1), else_=0)).label("correct"),  # noqa: E712
        )
        .group_by(UserProgress.section)
        .all()
    )

    by_section = [
        {
            "name": row.section,
            "total": row.total,
            "correct": int(row.correct or 0),
            "accuracy": round((int(row.correct or 0) / row.total) * 100) if row.total else 0,
        }
        for row in section_rows
    ]

    return ProgressStatsResponse(
        total=total,
        correct=correct,
        incorrect=incorrect,
        by_section=by_section,
    )


def _serialize_created_at(value):
    """Normalize created_at for JSON (SQLite may return str or datetime)."""
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


@router.post("", response_model=ProgressRecordResponse)
def record_progress(
    data: ProgressRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record one answer (append; multiple attempts allowed)."""
    try:
        rec = UserProgress(
            user_id=current_user.id,
            question_id=data.question_id,
            section=data.section,
            correct=data.correct,
            answer_selected=data.answer_selected,
        )
        db.add(rec)
        db.flush()
        # Build response explicitly to avoid ORM->Pydantic issues (e.g. SQLite datetime)
        return ProgressRecordResponse(
            id=rec.id,
            user_id=rec.user_id,
            question_id=rec.question_id,
            correct=rec.correct,
            answer_selected=rec.answer_selected,
            section=rec.section,
            created_at=_serialize_created_at(rec.created_at),
        )
    except IntegrityError as e:
        db.rollback()
        logger.warning("Progress record IntegrityError: %s", e)
        raise HTTPException(
            status_code=400,
            detail="Invalid question_id or user: question may not exist in the database.",
        ) from e
    except Exception as e:
        logger.exception("Progress record failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e
