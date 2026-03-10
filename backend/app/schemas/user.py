from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    club: str | None = None
    country: str | None = None
    coaching_level: str | None = None
    avatar_url: str | None = None
    created_at: datetime
    follower_count: int = 0
    following_count: int = 0
    is_following: bool = False

    model_config = {"from_attributes": True}


class PublicUserOut(BaseModel):
    """UserOut for public profile endpoints — omits email."""

    id: str
    name: str
    club: str | None = None
    country: str | None = None
    coaching_level: str | None = None
    avatar_url: str | None = None
    created_at: datetime
    follower_count: int = 0
    following_count: int = 0
    is_following: bool = False

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str | None = None
    club: str | None = None
    country: str | None = None
    coaching_level: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
