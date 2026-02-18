"""Add exam_sessions, notes, flashcards, bookmarks tables.

Revision ID: 004
Revises: 003
Create Date: 2026-02-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "exam_sessions",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(36), nullable=False, index=True),
        sa.Column("mode", sa.String(32), nullable=False),
        sa.Column("total_questions", sa.Integer, nullable=False),
        sa.Column("correct_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("incorrect_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("unanswered_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("accuracy", sa.Float, nullable=True),
        sa.Column("subjects", sa.Text, nullable=True),
        sa.Column("status", sa.String(16), nullable=False, server_default="in_progress"),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "exam_session_answers",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("session_id", sa.Integer, nullable=False, index=True),
        sa.Column("question_id", sa.String(255), nullable=False),
        sa.Column("answer_selected", sa.String(32), nullable=True),
        sa.Column("correct", sa.Boolean, nullable=True),
        sa.Column("time_spent_seconds", sa.Integer, nullable=True),
        sa.Column("flagged", sa.Boolean, server_default="0"),
        sa.Column("order_index", sa.Integer, nullable=False, server_default="0"),
    )

    op.create_table(
        "notes",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(36), nullable=False, index=True),
        sa.Column("question_id", sa.String(255), nullable=True, index=True),
        sa.Column("title", sa.String(255), nullable=False, server_default=""),
        sa.Column("content", sa.Text, nullable=False, server_default=""),
        sa.Column("section", sa.String(255), nullable=True),
        sa.Column("tags", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "flashcard_decks",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(36), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("section", sa.String(255), nullable=True),
        sa.Column("card_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "flashcards",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("deck_id", sa.Integer, nullable=False, index=True),
        sa.Column("user_id", sa.String(36), nullable=False, index=True),
        sa.Column("front", sa.Text, nullable=False),
        sa.Column("back", sa.Text, nullable=False),
        sa.Column("question_id", sa.String(255), nullable=True),
        sa.Column("ease_factor", sa.Float, nullable=False, server_default="2.5"),
        sa.Column("interval_days", sa.Integer, nullable=False, server_default="0"),
        sa.Column("repetitions", sa.Integer, nullable=False, server_default="0"),
        sa.Column("next_review", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "bookmarks",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(36), nullable=False, index=True),
        sa.Column("question_id", sa.String(255), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("bookmarks")
    op.drop_table("flashcards")
    op.drop_table("flashcard_decks")
    op.drop_table("notes")
    op.drop_table("exam_session_answers")
    op.drop_table("exam_sessions")
