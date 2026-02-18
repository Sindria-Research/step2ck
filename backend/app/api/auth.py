"""Auth endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import User
from app.schemas.user import LoginRequest, Token, UserResponse
from app.services.auth import (
    create_access_token,
    get_or_create_demo_user,
    verify_password,
)

router = APIRouter()

DEMO_EMAIL = "demo@step2ck.local"


@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Login: use demo@step2ck.local (no password) for demo, or email+password for real user."""
    if data.email == DEMO_EMAIL or not data.password:
        user = get_or_create_demo_user(db)
    else:
        user = db.query(User).filter(User.email == data.email).first()
        if not user or not user.hashed_password:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        if not verify_password(data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.id)
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    """Return current user (from token or demo user)."""
    return UserResponse.model_validate(current_user)
