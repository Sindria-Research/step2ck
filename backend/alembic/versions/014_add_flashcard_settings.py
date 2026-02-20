"""Add flashcard_settings table.

Revision ID: 014
Revises: 013
Create Date: 2026-02-19
"""
from alembic import op
import sqlalchemy as sa

revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "flashcard_settings",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(36), nullable=False, unique=True, index=True),
        # Scheduling
        sa.Column("daily_new_cards", sa.Integer, nullable=False, server_default="20"),
        sa.Column("daily_review_limit", sa.Integer, nullable=False, server_default="200"),
        sa.Column("learning_steps", sa.String(100), nullable=False, server_default="1,10"),
        sa.Column("relearning_steps", sa.String(100), nullable=False, server_default="10"),
        sa.Column("desired_retention", sa.Float, nullable=False, server_default="0.9"),
        sa.Column("max_interval_days", sa.Integer, nullable=False, server_default="365"),
        sa.Column("new_card_order", sa.String(20), nullable=False, server_default="sequential"),
        # Hotkeys
        sa.Column("hotkey_show_answer", sa.String(20), nullable=False, server_default="Space"),
        sa.Column("hotkey_again", sa.String(20), nullable=False, server_default="1"),
        sa.Column("hotkey_hard", sa.String(20), nullable=False, server_default="2"),
        sa.Column("hotkey_good", sa.String(20), nullable=False, server_default="3"),
        sa.Column("hotkey_easy", sa.String(20), nullable=False, server_default="4"),
        sa.Column("hotkey_flag", sa.String(20), nullable=False, server_default="f"),
        sa.Column("hotkey_undo", sa.String(20), nullable=False, server_default="z"),
        # Display
        sa.Column("auto_advance", sa.Boolean, nullable=False, server_default="0"),
        sa.Column("show_remaining_count", sa.Boolean, nullable=False, server_default="1"),
        sa.Column("show_timer", sa.Boolean, nullable=False, server_default="0"),
        # Timestamps
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("flashcard_settings")
