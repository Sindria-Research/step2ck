"""Add supabase_id to users for Supabase Auth integration.

Revision ID: 005
Revises: 004
Create Date: 2026-02-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("supabase_id", sa.String(255), nullable=True))
    op.create_index("ix_users_supabase_id", "users", ["supabase_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_supabase_id", table_name="users")
    op.drop_column("users", "supabase_id")
