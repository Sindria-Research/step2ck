"""Add composite indexes for common query patterns.

Revision ID: 010
Revises: 009
Create Date: 2026-02-19

"""
from typing import Sequence, Union

from alembic import op

revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_user_progress_user_created",
        "user_progress",
        ["user_id", "created_at"],
    )
    op.create_index(
        "ix_exam_sessions_user_started",
        "exam_sessions",
        ["user_id", "started_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_exam_sessions_user_started", table_name="exam_sessions")
    op.drop_index("ix_user_progress_user_created", table_name="user_progress")
