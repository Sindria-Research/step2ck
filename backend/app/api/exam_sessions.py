"""API routes for exam sessions (previous tests)."""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db import get_db
from app.models import User
from app.models.exam_session import ExamSession, ExamSessionAnswer
from app.schemas.exam_session import (
    ExamSessionCreate,
    ExamSessionDetailResponse,
    ExamSessionResponse,
    ExamSessionUpdate,
)

router = APIRouter()


@router.get("", response_model=list[ExamSessionResponse])
def list_sessions(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    q = db.query(ExamSession).filter(ExamSession.user_id == user.id)
    if status_filter:
        q = q.filter(ExamSession.status == status_filter)
    return q.order_by(ExamSession.started_at.desc()).offset(offset).limit(limit).all()


@router.post("", response_model=ExamSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    body: ExamSessionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not body.question_ids:
        raise HTTPException(status_code=400, detail="question_ids must not be empty")

    session = ExamSession(
        user_id=user.id,
        mode=body.mode,
        total_questions=len(body.question_ids),
        subjects=body.subjects,
        status="in_progress",
    )
    db.add(session)
    db.flush()

    for idx, qid in enumerate(body.question_ids):
        db.add(ExamSessionAnswer(session_id=session.id, question_id=qid, order_index=idx))

    db.commit()
    db.refresh(session)
    return session


@router.get("/{session_id}", response_model=ExamSessionDetailResponse)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = (
        db.query(ExamSession)
        .options(selectinload(ExamSession.answers))
        .filter(ExamSession.id == session_id, ExamSession.user_id == user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


@router.patch("/{session_id}", response_model=ExamSessionResponse)
def update_session(
    session_id: int,
    body: ExamSessionUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = db.query(ExamSession).filter(
        ExamSession.id == session_id, ExamSession.user_id == user.id
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(session, field, value)

    if body.status == "completed" and not session.completed_at:
        session.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(session)
    return session


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = db.query(ExamSession).filter(
        ExamSession.id == session_id, ExamSession.user_id == user.id
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    db.delete(session)
    db.commit()
