from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CommentAuthor(BaseModel):
    id: str
    name: str
    avatar_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class CommentCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=5_000)
    parent_id: str | None = None


class CommentOut(BaseModel):
    id: str
    user_id: str
    drill_id: str | None = None
    session_id: str | None = None
    parent_id: str | None = None
    body: str
    created_at: datetime
    author: CommentAuthor
    replies: list["CommentOut"] = []

    model_config = ConfigDict(from_attributes=True)


CommentOut.model_rebuild()
