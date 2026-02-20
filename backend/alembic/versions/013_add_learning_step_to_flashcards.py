"""Add learning_step field to flashcards for intra-session step tracking.

Revision ID: 013
Revises: 012
Create Date: 2026-02-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("flashcards") as batch_op:
        batch_op.add_column(sa.Column("learning_step", sa.Integer, nullable=False, server_default="0"))


def downgrade() -> None:
    with op.batch_alter_table("flashcards") as batch_op:
        batch_op.drop_column("learning_step")
