"""phase5 favourites and comments

Revision ID: c3d4e5f6a7b8
Revises: b1c2d3e4f5a6
Create Date: 2026-03-10 09:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b1c2d3e4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create favourites table
    op.create_table(
        "favourites",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("drill_id", sa.String(), nullable=True),
        sa.Column("session_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["drill_id"], ["drills.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_favourites_user_id", "favourites", ["user_id"])
    op.create_index("ix_favourites_drill_id", "favourites", ["drill_id"])
    op.create_index("ix_favourites_session_id", "favourites", ["session_id"])

    # Create comments table
    op.create_table(
        "comments",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("drill_id", sa.String(), nullable=True),
        sa.Column("session_id", sa.String(), nullable=True),
        sa.Column("parent_id", sa.String(), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["drill_id"], ["drills.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["parent_id"], ["comments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_comments_drill_id", "comments", ["drill_id"])
    op.create_index("ix_comments_session_id", "comments", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_comments_session_id", "comments")
    op.drop_index("ix_comments_drill_id", "comments")
    op.drop_table("comments")
    op.drop_index("ix_favourites_session_id", "favourites")
    op.drop_index("ix_favourites_drill_id", "favourites")
    op.drop_index("ix_favourites_user_id", "favourites")
    op.drop_table("favourites")
