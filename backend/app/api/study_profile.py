"""Study profile endpoints — exam date, target score, daily goal."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import User
from app.models.study_profile import UserStudyProfile
from app.schemas.study_profile import StudyProfileResponse, StudyProfileUpdate

router = APIRouter()


def _get_or_create(db: Session, user: User) -> UserStudyProfile:
    profile = db.query(UserStudyProfile).filter(UserStudyProfile.user_id == user.id).first()
    if not profile:
        profile = UserStudyProfile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("", response_model=StudyProfileResponse)
def get_study_profile(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return _get_or_create(db, user)


@router.put("", response_model=StudyProfileResponse)
def update_study_profile(
    body: StudyProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    profile = _get_or_create(db, user)
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile
