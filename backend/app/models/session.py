import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.drill import AgeRange, SkillLevel


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    age_range: Mapped[AgeRange | None] = mapped_column(
        Enum(AgeRange, name="agerange", create_type=False), nullable=True
    )
    skill_level: Mapped[SkillLevel | None] = mapped_column(
        Enum(SkillLevel, name="skilllevel", create_type=False), nullable=True
    )
    focus_areas: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    team_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    created_by: Mapped["User"] = relationship("User", back_populates="sessions")  # noqa: F821
    drill_sessions: Mapped[list["DrillSession"]] = relationship(
        "DrillSession",
        back_populates="session",
        order_by="DrillSession.order_index",
        cascade="all, delete-orphan",
    )
    likes: Mapped[list["Like"]] = relationship("Like", back_populates="session")  # noqa: F821


class DrillSession(Base):
    __tablename__ = "drill_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    drill_id: Mapped[str] = mapped_column(String, ForeignKey("drills.id"), nullable=False)
    session_id: Mapped[str] = mapped_column(String, ForeignKey("sessions.id"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_override: Mapped[int | None] = mapped_column(Integer, nullable=True)
    coach_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    drill: Mapped["Drill"] = relationship("Drill")  # noqa: F821
    session: Mapped["Session"] = relationship("Session", back_populates="drill_sessions")
