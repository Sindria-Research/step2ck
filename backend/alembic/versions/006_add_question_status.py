"""Add status and status_issues columns to questions table.

Revision ID: 006
Revises: 005
Create Date: 2026-02-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("questions", sa.Column("status", sa.String(32), nullable=False, server_default="ready"))
    op.add_column("questions", sa.Column("status_issues", sa.JSON(), nullable=True))
    op.create_index("ix_questions_status", "questions", ["status"])


def downgrade() -> None:
    op.drop_index("ix_questions_status", table_name="questions")
    op.drop_column("questions", "status_issues")
    op.drop_column("questions", "status")
