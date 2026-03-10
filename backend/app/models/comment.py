import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Comment(Base):
    __tablename__ = "comments"

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
    parent_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("comments.id"), nullable=True
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="comments")  # noqa: F821
    replies: Mapped[list["Comment"]] = relationship(
        "Comment",
        back_populates="parent",
        foreign_keys=[parent_id],
        lazy="select",
    )
    parent: Mapped["Comment | None"] = relationship(
        "Comment",
        back_populates="replies",
        foreign_keys=[parent_id],
        remote_side=[id],
    )
