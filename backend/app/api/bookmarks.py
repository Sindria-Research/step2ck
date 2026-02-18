"""API routes for bookmarks."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import User
from app.models.bookmark import Bookmark
from app.schemas.bookmark import BookmarkCreate, BookmarkResponse

router = APIRouter()


def _normalize_created_at(value):
    """Normalize created_at for JSON (SQLite may return str or datetime)."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return None
    return None


@router.get("", response_model=list[BookmarkResponse])
def list_bookmarks(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = db.query(Bookmark).filter(Bookmark.user_id == user.id).order_by(Bookmark.created_at.desc()).all()
    return [
        BookmarkResponse(
            id=bm.id,
            user_id=bm.user_id,
            question_id=bm.question_id,
            created_at=_normalize_created_at(bm.created_at) or datetime.now(),
        )
        for bm in rows
    ]


@router.get("/count")
def count_bookmarks(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    count = db.query(func.count(Bookmark.id)).filter(Bookmark.user_id == user.id).scalar() or 0
    return {"count": int(count)}


@router.post("", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
def create_bookmark(
    body: BookmarkCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    existing = db.query(Bookmark).filter(
        Bookmark.user_id == user.id, Bookmark.question_id == body.question_id
    ).first()
    if existing:
        return BookmarkResponse(
            id=existing.id,
            user_id=existing.user_id,
            question_id=existing.question_id,
            created_at=_normalize_created_at(existing.created_at) or datetime.now(),
        )

    bookmark = Bookmark(user_id=user.id, question_id=body.question_id)
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return BookmarkResponse(
        id=bookmark.id,
        user_id=bookmark.user_id,
        question_id=bookmark.question_id,
        created_at=_normalize_created_at(bookmark.created_at) or datetime.now(),
    )


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bookmark(
    question_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    bookmark = db.query(Bookmark).filter(
        Bookmark.user_id == user.id, Bookmark.question_id == question_id
    ).first()
    if not bookmark:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found")
    db.delete(bookmark)
    db.commit()


@router.get("/check/{question_id}")
def check_bookmark(
    question_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    exists = db.query(Bookmark).filter(
        Bookmark.user_id == user.id, Bookmark.question_id == question_id
    ).first() is not None
    return {"bookmarked": exists}
