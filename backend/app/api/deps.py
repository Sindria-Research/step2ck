"""Shared FastAPI dependencies."""
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.services.auth import decode_token

security = HTTPBearer(auto_error=False)


def get_current_user_optional(
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[User]:
    """Return current user if valid token present, else None (for optional auth)."""
    if not credentials:
        return None
    user_id = decode_token(credentials.credentials)
    if not user_id:
        return None
    user = db.query(User).filter(User.id == user_id).first()
    return user


def get_current_user(
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> User:
    """Return current user; use demo user if no token. Raises 401 only if token invalid."""
    if credentials:
        user_id = decode_token(credentials.credentials)
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                return user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    # No token: use demo user for backward compatibility / demo mode
    from app.services.auth import get_or_create_demo_user
    return get_or_create_demo_user(db)
