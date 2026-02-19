"""Add user_study_profiles and study_plans tables.

Revision ID: 009
Revises: 008
Create Date: 2026-02-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_study_profiles",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("exam_date", sa.Date, nullable=True),
        sa.Column("target_score", sa.Integer, nullable=True),
        sa.Column("daily_question_goal", sa.Integer, nullable=False, server_default="40"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_user_study_profiles_user_id", "user_study_profiles", ["user_id"], unique=True)

    op.create_table(
        "study_plans",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("plan_data", sa.JSON, nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_study_plans_user_id", "study_plans", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_study_plans_user_id", table_name="study_plans")
    op.drop_table("study_plans")
    op.drop_index("ix_user_study_profiles_user_id", table_name="user_study_profiles")
    op.drop_table("user_study_profiles")
