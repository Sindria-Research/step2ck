"""Initial schema: questions, users, user_progress.

Revision ID: 001
Revises:
Create Date: 2025-02-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "questions",
        sa.Column("id", sa.String(255), primary_key=True),
        sa.Column("section", sa.String(255), nullable=False),
        sa.Column("subsection", sa.String(255), nullable=True),
        sa.Column("question_number", sa.Integer(), nullable=True),
        sa.Column("system", sa.String(255), nullable=True),
        sa.Column("question_stem", sa.Text(), nullable=False),
        sa.Column("choices", sa.JSON(), nullable=False),
        sa.Column("correct_answer", sa.String(32), nullable=False),
        sa.Column("correct_explanation", sa.Text(), nullable=True),
        sa.Column("incorrect_explanation", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_questions_section", "questions", ["section"], unique=False)
    op.create_index("ix_questions_subsection", "questions", ["subsection"], unique=False)

    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(255), nullable=True),
        sa.Column("avatar_url", sa.String(512), nullable=True),
        sa.Column("hashed_password", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "user_progress",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_id", sa.String(255), sa.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("section", sa.String(255), nullable=False),
        sa.Column("correct", sa.Boolean(), nullable=False),
        sa.Column("answer_selected", sa.String(32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_user_progress_user_id", "user_progress", ["user_id"], unique=False)
    op.create_index("ix_user_progress_question_id", "user_progress", ["question_id"], unique=False)
    op.create_index("ix_user_progress_section", "user_progress", ["section"], unique=False)


def downgrade() -> None:
    op.drop_table("user_progress")
    op.drop_table("users")
    op.drop_table("questions")
