import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_follow"),
    )

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    follower_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    following_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    follower: Mapped["User"] = relationship(  # noqa: F821
        "User", foreign_keys=[follower_id], back_populates="following"
    )
    following_user: Mapped["User"] = relationship(  # noqa: F821
        "User", foreign_keys=[following_id], back_populates="followers"
    )
