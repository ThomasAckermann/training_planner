"""phase10_module_likes_favourites

Revision ID: b2c3d4e5f6a7
Revises: 80813cf87882
Create Date: 2026-03-11 18:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "80813cf87882"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("likes", sa.Column("module_id", sa.String(), nullable=True))
    op.create_foreign_key(
        None, "likes", "training_modules", ["module_id"], ["id"], ondelete="CASCADE"
    )
    op.add_column("favourites", sa.Column("module_id", sa.String(), nullable=True))
    op.create_foreign_key(
        None,
        "favourites",
        "training_modules",
        ["module_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(None, "favourites", type_="foreignkey")
    op.drop_column("favourites", "module_id")
    op.drop_constraint(None, "likes", type_="foreignkey")
    op.drop_column("likes", "module_id")
