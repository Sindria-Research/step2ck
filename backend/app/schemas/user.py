"""User schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    email: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: Optional[str] = None  # None for demo/OAuth


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    plan: str = "free"
    plan_interval: Optional[str] = None
    plan_expires_at: Optional[datetime] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None  # Optional for demo login


class GoogleLoginRequest(BaseModel):
    id_token: str  # Google ID token from frontend OAuth flow
