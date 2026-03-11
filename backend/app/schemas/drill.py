from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.drill import AgeRange, FocusArea, SkillLevel


class DrillCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: str | None = Field(None, max_length=10_000)
    duration_minutes: int | None = None
    num_players_min: int | None = None
    num_players_max: int | None = None
    equipment: list[str] = []
    skill_tags: list[str] = []
    age_range: AgeRange | None = None
    skill_level: SkillLevel | None = None
    focus_area: FocusArea | None = None
    video_url: str | None = Field(None, max_length=500)
    is_public: bool = False


class DrillUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    description: str | None = Field(None, max_length=10_000)
    duration_minutes: int | None = None
    num_players_min: int | None = None
    num_players_max: int | None = None
    equipment: list[str] | None = None
    skill_tags: list[str] | None = None
    age_range: AgeRange | None = None
    skill_level: SkillLevel | None = None
    focus_area: FocusArea | None = None
    drawing_json: dict[str, Any] | None = None
    drawing_thumb_url: str | None = None
    video_url: str | None = None
    is_public: bool | None = None


class DrillOut(BaseModel):
    id: str
    title: str
    description: str | None = None
    duration_minutes: int | None = None
    num_players_min: int | None = None
    num_players_max: int | None = None
    equipment: list[str] | None = None
    skill_tags: list[str] | None = None
    age_range: AgeRange | None = None
    skill_level: SkillLevel | None = None
    focus_area: FocusArea | None = None
    drawing_json: dict[str, Any] | None = None
    drawing_thumb_url: str | None = None
    video_url: str | None = None
    is_public: bool
    user_id: str
    created_at: datetime
    updated_at: datetime
    likes_count: int = 0
    avg_rating: float | None = None
    rating_count: int = 0
    view_count: int = 0

    model_config = {"from_attributes": True}


class DrillListResponse(BaseModel):
    items: list[DrillOut]
    total: int
    page: int
    limit: int
    pages: int


class DrillAnalyticsOut(BaseModel):
    id: str
    title: str
    view_count: int
    likes_count: int
    avg_rating: float | None
    rating_count: int
    session_count: int
