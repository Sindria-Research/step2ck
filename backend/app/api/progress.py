"""Progress endpoints."""
import logging

from fastapi import APIRouter, Depends, HTTPException
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
):
    """Return current user's progress records (question_id, correct)."""
    rows = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == current_user.id)
        .order_by(UserProgress.created_at.desc())
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
    """Aggregate stats: total, correct, incorrect, by_section."""
    rows = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == current_user.id)
        .all()
    )
    correct = sum(1 for r in rows if r.correct)
    incorrect = len(rows) - correct
    section_map = {}
    for r in rows:
        if r.section not in section_map:
            section_map[r.section] = {"total": 0, "correct": 0}
        section_map[r.section]["total"] += 1
        if r.correct:
            section_map[r.section]["correct"] += 1
    by_section = [
        {
            "name": name,
            "total": d["total"],
            "correct": d["correct"],
            "accuracy": round((d["correct"] / d["total"]) * 100) if d["total"] else 0,
        }
        for name, d in section_map.items()
    ]
    return ProgressStatsResponse(
        total=len(rows),
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
