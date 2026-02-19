"""Shared FastAPI dependencies."""
from typing import Callable, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models import User
from app.services.auth import (
    decode_token,
    get_or_create_user_from_supabase,
    verify_supabase_token,
)
from app.services.plans import get_plan_limits, is_pro, PLAN_PRO

security = HTTPBearer(auto_error=False)


def _resolve_token(token: str, db: Session) -> Optional[User]:
    """Try to resolve a bearer token to a User. Supabase JWT first, then local JWT."""
    settings = get_settings()

    if settings.SUPABASE_JWT_SECRET or settings.SUPABASE_URL:
        payload = verify_supabase_token(token)
        if payload:
            return get_or_create_user_from_supabase(
                db,
                supabase_id=payload["sub"],
                email=payload["email"],
                name=payload.get("full_name"),
                avatar_url=payload.get("avatar_url"),
            )

    user_id = decode_token(token)
    if user_id:
        return db.query(User).filter(User.id == user_id).first()

    return None


def get_current_user_optional(
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[User]:
    """Return current user if valid token present, else None (for optional auth)."""
    if not credentials:
        return None
    return _resolve_token(credentials.credentials, db)


def get_current_user(
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> User:
    """Return current user from token. Demo fallback only in development."""
    if credentials:
        user = _resolve_token(credentials.credentials, db)
        if user:
            return user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    settings = get_settings()
    if settings.ENVIRONMENT == "development":
        from app.services.auth import get_or_create_demo_user
        return get_or_create_demo_user(db)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
    )


def require_pro(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that enforces Pro plan."""
    if current_user.plan != PLAN_PRO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pro plan required",
            headers={"X-Upgrade-Required": "true"},
        )
    return current_user
