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

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str | None = None
    club: str | None = None
    country: str | None = None
    coaching_level: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
