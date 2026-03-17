from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.drill import AgeRange, SkillLevel


class DrillInSession(BaseModel):
    # DrillSession junction fields
    drill_session_id: str
    order_index: int
    duration_override: int | None = None
    coach_notes: str | None = None
    phase_label: str | None = None

    # Drill fields (from DrillOut)
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
    focus_area: str | None = None
    drawing_json: dict[str, Any] | None = None
    drawing_thumb_url: str | None = None
    video_url: str | None = None
    is_public: bool
    user_id: str
    created_at: datetime
    updated_at: datetime
    likes_count: int = 0

    @property
    def effective_duration(self) -> int:
        return self.duration_override or self.duration_minutes or 0

    model_config = ConfigDict(from_attributes=True)


class SessionCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: str | None = Field(None, max_length=10_000)
    age_range: AgeRange | None = None
    skill_level: SkillLevel | None = None
    focus_areas: list[str] = []
    team_size: int | None = None
    is_public: bool = False
    tags: list[str] = []


class SessionUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    description: str | None = Field(None, max_length=10_000)
    age_range: AgeRange | None = None
    skill_level: SkillLevel | None = None
    focus_areas: list[str] | None = None
    team_size: int | None = None
    is_public: bool | None = None
    tags: list[str] | None = None


class SessionOut(BaseModel):
    id: str
    title: str
    description: str | None = None
    age_range: AgeRange | None = None
    skill_level: SkillLevel | None = None
    focus_areas: list[str] | None = None
    team_size: int | None = None
    is_public: bool
    tags: list[str] | None = None
    user_id: str
    created_at: datetime
    updated_at: datetime
    drills: list[DrillInSession] = []
    total_duration_minutes: int = 0
    likes_count: int = 0

    @property
    def drill_count(self) -> int:
        return len(self.drills)

    model_config = ConfigDict(from_attributes=True)


class SessionListResponse(BaseModel):
    items: list[SessionOut]
    total: int
    page: int
    limit: int
    pages: int


class AddDrillToSession(BaseModel):
    drill_id: str
    duration_override: int | None = None
    coach_notes: str | None = None


class ReorderDrills(BaseModel):
    drill_session_ids: list[str]


class UpdateDrillInSession(BaseModel):
    duration_override: int | None = None
    coach_notes: str | None = None
