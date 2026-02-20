"""Add FSRS scheduling fields and flagged to flashcards.

Revision ID: 012
Revises: 011
Create Date: 2026-02-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("flashcards") as batch_op:
        batch_op.add_column(sa.Column("stability", sa.Float, nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("difficulty", sa.Float, nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("lapses", sa.Integer, nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("state", sa.String(16), nullable=False, server_default="new"))
        batch_op.add_column(sa.Column("last_review", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("flagged", sa.Boolean, nullable=False, server_default="0"))


def downgrade() -> None:
    with op.batch_alter_table("flashcards") as batch_op:
        batch_op.drop_column("flagged")
        batch_op.drop_column("last_review")
        batch_op.drop_column("state")
        batch_op.drop_column("lapses")
        batch_op.drop_column("difficulty")
        batch_op.drop_column("stability")
