import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import text as sa_text

from app.models.base import Base


class AgeRange(str, enum.Enum):
    U12 = "U12"
    U14 = "U14"
    U16 = "U16"
    U18 = "U18"
    ADULTS = "ADULTS"
    ALL = "ALL"


class SkillLevel(str, enum.Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    ELITE = "ELITE"


class FocusArea(str, enum.Enum):
    SERVING = "SERVING"
    RECEPTION = "RECEPTION"
    SETTING = "SETTING"
    ATTACK = "ATTACK"
    BLOCK = "BLOCK"
    DEFENSE = "DEFENSE"
    TACTICS = "TACTICS"
    FITNESS = "FITNESS"
    FUN = "FUN"
    WARMUP = "WARMUP"


class Drill(Base):
    __tablename__ = "drills"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    num_players_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    num_players_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    equipment: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    skill_tags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    age_range: Mapped[AgeRange | None] = mapped_column(
        Enum(AgeRange, name="agerange", create_type=True), nullable=True
    )
    skill_level: Mapped[SkillLevel | None] = mapped_column(
        Enum(SkillLevel, name="skilllevel", create_type=True), nullable=True
    )
    focus_area: Mapped[FocusArea | None] = mapped_column(
        Enum(FocusArea, name="focusarea", create_type=True), nullable=True
    )
    drawing_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    drawing_thumb_url: Mapped[str | None] = mapped_column(String, nullable=True)
    video_url: Mapped[str | None] = mapped_column(String, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    view_count: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=sa_text("0"), default=0
    )
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    created_by: Mapped["User"] = relationship("User", back_populates="drills")  # noqa: F821
    likes: Mapped[list["Like"]] = relationship(
        "Like", back_populates="drill", lazy="select"
    )  # noqa: F821
    favourites: Mapped[list["Favourite"]] = relationship(
        "Favourite", back_populates="drill", lazy="select"
    )  # noqa: F821
    ratings: Mapped[list["Rating"]] = relationship(  # noqa: F821
        "Rating", back_populates="drill", lazy="select"
    )


class Like(Base):
    __tablename__ = "likes"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    drill_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("drills.id"), nullable=True
    )
    session_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("sessions.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="likes")  # noqa: F821
    drill: Mapped["Drill | None"] = relationship("Drill", back_populates="likes")  # noqa: F821
    session: Mapped["Session | None"] = relationship("Session", back_populates="likes")  # noqa: F821


class Favourite(Base):
    __tablename__ = "favourites"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    drill_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("drills.id"), nullable=True
    )
    session_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("sessions.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="favourites")  # noqa: F821
    drill: Mapped["Drill | None"] = relationship("Drill", back_populates="favourites")  # noqa: F821
    session: Mapped["Session | None"] = relationship(  # noqa: F821
        "Session", back_populates="favourites"
    )
