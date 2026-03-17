from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.module import PhaseType


class ModuleDrillIn(BaseModel):
    drill_id: str
    order_index: int = 0
    duration_override: Optional[int] = None
    coach_notes: Optional[str] = Field(None, max_length=5000)


class ModuleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    phase_type: PhaseType
    description: Optional[str] = Field(None, max_length=10000)
    is_public: bool = False
    drills: list[ModuleDrillIn] = []


class ModuleUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    phase_type: Optional[PhaseType] = None
    description: Optional[str] = Field(None, max_length=10000)
    is_public: Optional[bool] = None
    drills: Optional[list[ModuleDrillIn]] = None


class ModuleDrillOut(BaseModel):
    id: str
    drill_id: str
    order_index: int
    duration_override: Optional[int]
    coach_notes: Optional[str]
    # Flatten basic drill info for display
    drill_title: Optional[str] = None
    drill_duration_minutes: Optional[int] = None
    drill_focus_area: Optional[str] = None

    model_config = {"from_attributes": True}


class ModuleOut(BaseModel):
    id: str
    user_id: str
    title: str
    phase_type: PhaseType
    description: Optional[str]
    is_public: bool
    created_at: datetime
    drills: list[ModuleDrillOut] = []
    likes_count: int = 0
    is_liked: bool = False
    is_favourited: bool = False

    model_config = {"from_attributes": True}


class ModuleListResponse(BaseModel):
    items: list[ModuleOut]
    total: int
    page: int
    limit: int
    pages: int
