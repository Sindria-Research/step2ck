"""Add suspended, buried, notes, tags columns to flashcards.

Revision ID: 015
Revises: 014
Create Date: 2026-02-19
"""
from alembic import op
import sqlalchemy as sa

revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("flashcards", sa.Column("suspended", sa.Boolean, nullable=False, server_default="0"))
    op.add_column("flashcards", sa.Column("buried", sa.Boolean, nullable=False, server_default="0"))
    op.add_column("flashcards", sa.Column("notes", sa.Text, nullable=True))
    op.add_column("flashcards", sa.Column("tags", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("flashcards", "tags")
    op.drop_column("flashcards", "notes")
    op.drop_column("flashcards", "buried")
    op.drop_column("flashcards", "suspended")
