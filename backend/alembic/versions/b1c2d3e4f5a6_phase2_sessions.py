"""phase2 sessions

Revision ID: b1c2d3e4f5a6
Revises: a55656c41165
Create Date: 2026-03-09 20:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import ENUM as PgEnum

# revision identifiers, used by Alembic.
revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, None] = "a55656c41165"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create sessions table
    op.create_table(
        "sessions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "age_range",
            PgEnum(
                "U12",
                "U14",
                "U16",
                "U18",
                "ADULTS",
                "ALL",
                name="agerange",
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column(
            "skill_level",
            PgEnum(
                "BEGINNER",
                "INTERMEDIATE",
                "ADVANCED",
                "ELITE",
                name="skilllevel",
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column("focus_areas", postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column("team_size", sa.Integer(), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=False),
        sa.Column("tags", postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create drill_sessions table
    op.create_table(
        "drill_sessions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("drill_id", sa.String(), nullable=False),
        sa.Column("session_id", sa.String(), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("duration_override", sa.Integer(), nullable=True),
        sa.Column("coach_notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["drill_id"], ["drills.id"]),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Add session_id column to likes table
    op.add_column("likes", sa.Column("session_id", sa.String(), nullable=True))
    op.create_foreign_key(
        "fk_likes_session_id",
        "likes",
        "sessions",
        ["session_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_likes_session_id", "likes", type_="foreignkey")
    op.drop_column("likes", "session_id")
    op.drop_table("drill_sessions")
    op.drop_table("sessions")
