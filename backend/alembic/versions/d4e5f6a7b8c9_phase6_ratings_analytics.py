"""phase6 ratings and analytics

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-03-10 10:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add view_count to drills
    op.add_column(
        "drills",
        sa.Column(
            "view_count",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )

    # Create ratings table
    op.create_table(
        "ratings",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("drill_id", sa.String(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["drill_id"], ["drills.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "drill_id", name="uq_rating_user_drill"),
    )
    op.create_index("ix_ratings_drill_id", "ratings", ["drill_id"])
    op.create_index("ix_ratings_user_id", "ratings", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_ratings_user_id", "ratings")
    op.drop_index("ix_ratings_drill_id", "ratings")
    op.drop_table("ratings")
    op.drop_column("drills", "view_count")
