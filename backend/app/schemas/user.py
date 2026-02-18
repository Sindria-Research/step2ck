"""User schemas."""
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


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None  # Optional for demo login
