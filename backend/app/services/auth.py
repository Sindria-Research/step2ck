"""Auth service: JWT, Supabase Auth, Google OAuth, and user resolution."""
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import httpx
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import User

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

GOOGLE_TOKENINFO = "https://oauth2.googleapis.com/tokeninfo"


def verify_password(plain: str, hashed: Optional[str]) -> bool:
    if not hashed:
        return False
    return pwd_context.verify(plain, hashed)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(user_id: str) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[str]:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


def get_or_create_demo_user(db: Session) -> User:
    """Get or create the single demo user for unauthenticated use."""
    demo_email = "demo@chiron.local"
    user = db.query(User).filter(User.email == demo_email).first()
    if user:
        return user
    user = User(
        email=demo_email,
        display_name="Demo User",
        hashed_password=None,
        auth_provider="demo",
    )
    db.add(user)
    db.flush()
    return user


def verify_google_id_token(id_token: str) -> Optional[dict[str, Any]]:
    """Verify Google ID token via tokeninfo endpoint. Returns payload with email, name, picture, sub."""
    settings = get_settings()
    try:
        with httpx.Client(timeout=10.0) as client:
            r = client.get(GOOGLE_TOKENINFO, params={"id_token": id_token})
            r.raise_for_status()
            data = r.json()
        if settings.GOOGLE_CLIENT_ID and data.get("aud") != settings.GOOGLE_CLIENT_ID:
            return None
        email = data.get("email")
        if not email:
            return None
        return {
            "email": email,
            "name": data.get("name"),
            "picture": data.get("picture"),
            "sub": data.get("sub"),
        }
    except (httpx.HTTPError, ValueError):
        return None


def get_or_create_user_from_google(
    db: Session,
    email: str,
    google_id: str,
    name: Optional[str] = None,
    picture: Optional[str] = None,
) -> User:
    """Find user by google_id or email; create or update with Google profile."""
    user = db.query(User).filter(User.google_id == google_id).first()
    if user:
        user.display_name = name or user.display_name
        user.avatar_url = picture or user.avatar_url
        user.email = email
        db.flush()
        return user
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.google_id = google_id
        user.auth_provider = "google"
        user.display_name = name or user.display_name
        user.avatar_url = picture or user.avatar_url
        db.flush()
        return user
    user = User(
        email=email,
        display_name=name,
        avatar_url=picture,
        auth_provider="google",
        google_id=google_id,
    )
    db.add(user)
    db.flush()
    return user


def verify_supabase_token(token: str) -> Optional[dict[str, Any]]:
    """Verify a Supabase-issued JWT and extract user claims.

    Returns dict with sub, email, full_name, avatar_url on success, None on failure.
    """
    settings = get_settings()
    if not settings.SUPABASE_JWT_SECRET:
        return None
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"require_exp": True, "require_sub": True},
        )
        sub = payload.get("sub")
        email = payload.get("email")
        if not sub or not email:
            return None
        user_metadata = payload.get("user_metadata", {})
        return {
            "sub": sub,
            "email": email,
            "full_name": user_metadata.get("full_name") or user_metadata.get("name"),
            "avatar_url": user_metadata.get("avatar_url") or user_metadata.get("picture"),
        }
    except JWTError as exc:
        logger.debug("Supabase JWT verification failed: %s", exc)
        return None


def get_or_create_user_from_supabase(
    db: Session,
    supabase_id: str,
    email: str,
    name: Optional[str] = None,
    avatar_url: Optional[str] = None,
) -> User:
    """Find user by supabase_id or email; create or update with Supabase/Google profile."""
    user = db.query(User).filter(User.supabase_id == supabase_id).first()
    if user:
        user.display_name = name or user.display_name
        user.avatar_url = avatar_url or user.avatar_url
        user.email = email
        db.flush()
        return user
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.supabase_id = supabase_id
        user.auth_provider = "google"
        user.display_name = name or user.display_name
        user.avatar_url = avatar_url or user.avatar_url
        db.flush()
        return user
    user = User(
        email=email,
        display_name=name,
        avatar_url=avatar_url,
        auth_provider="google",
        supabase_id=supabase_id,
    )
    db.add(user)
    db.flush()
    return user
