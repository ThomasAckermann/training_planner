from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text as sa_text

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.drill import Drill
    from app.models.user import User


class PhaseType(str, enum.Enum):
    WARMUP = "WARMUP"
    MAIN = "MAIN"
    GAME = "GAME"
    COOLDOWN = "COOLDOWN"


class TrainingModule(Base):
    __tablename__ = "training_modules"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    phase_type: Mapped[PhaseType] = mapped_column(
        Enum(PhaseType, name="phasetype"), nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=sa_text("now()")
    )

    drills: Mapped[list["ModuleDrill"]] = relationship(
        "ModuleDrill",
        back_populates="module",
        cascade="all, delete-orphan",
        order_by="ModuleDrill.order_index",
    )
    user: Mapped["User"] = relationship("User", back_populates="modules")


class ModuleDrill(Base):
    __tablename__ = "module_drills"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    module_id: Mapped[str] = mapped_column(
        String, ForeignKey("training_modules.id", ondelete="CASCADE"), nullable=False
    )
    drill_id: Mapped[str] = mapped_column(
        String, ForeignKey("drills.id", ondelete="CASCADE"), nullable=False
    )
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    duration_override: Mapped[int | None] = mapped_column(Integer, nullable=True)
    coach_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    module: Mapped[TrainingModule] = relationship(
        "TrainingModule", back_populates="drills"
    )
    drill: Mapped["Drill"] = relationship("Drill")
