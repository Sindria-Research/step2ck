"""API routes for bookmarks."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import User
from app.models.bookmark import Bookmark
from app.schemas.bookmark import BookmarkCreate, BookmarkResponse

router = APIRouter()


@router.get("", response_model=list[BookmarkResponse])
def list_bookmarks(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return db.query(Bookmark).filter(Bookmark.user_id == user.id).order_by(Bookmark.created_at.desc()).all()


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
        return existing

    bookmark = Bookmark(user_id=user.id, question_id=body.question_id)
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return bookmark


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
