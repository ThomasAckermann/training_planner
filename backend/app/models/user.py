# ruff: noqa: F821
import uuid
from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.drill import Drill, Favourite
from app.models.session import Session


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    club: Mapped[str | None] = mapped_column(String, nullable=True)
    country: Mapped[str | None] = mapped_column(String, nullable=True)
    coaching_level: Mapped[str | None] = mapped_column(String, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    drills: Mapped[list["Drill"]] = relationship(
        "Drill", back_populates="created_by", lazy="select"
    )  # noqa: F821
    likes: Mapped[list["Like"]] = relationship(back_populates="user", lazy="select")
    favourites: Mapped[list["Favourite"]] = relationship(
        back_populates="user", lazy="select"
    )
    comments: Mapped[list["Comment"]] = relationship(
        back_populates="user", lazy="select"
    )
    sessions: Mapped[list["Session"]] = relationship(
        "Session", back_populates="created_by", lazy="select"
    )  # noqa: F821
    ratings: Mapped[list["Rating"]] = relationship(back_populates="user", lazy="select")
    followers: Mapped[list["Follow"]] = relationship(  # noqa: F821
        "Follow",
        foreign_keys="Follow.following_id",
        back_populates="following_user",
        lazy="select",
    )
    following: Mapped[list["Follow"]] = relationship(  # noqa: F821
        "Follow",
        foreign_keys="Follow.follower_id",
        back_populates="follower",
        lazy="select",
    )
