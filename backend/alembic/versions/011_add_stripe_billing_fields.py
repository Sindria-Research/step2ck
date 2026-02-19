"""Add Stripe billing fields to users table.

Revision ID: 011
Revises: 010
Create Date: 2026-02-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("stripe_customer_id", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("stripe_subscription_id", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("plan_interval", sa.String(16), nullable=True))
    op.add_column("users", sa.Column("plan_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_users_stripe_customer_id", "users", ["stripe_customer_id"], unique=True)

    op.create_table(
        "usage_log",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("feature", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_usage_log_user_id", "usage_log", ["user_id"])
    op.create_index("ix_usage_log_feature", "usage_log", ["feature"])


def downgrade() -> None:
    op.drop_index("ix_usage_log_feature", table_name="usage_log")
    op.drop_index("ix_usage_log_user_id", table_name="usage_log")
    op.drop_table("usage_log")
    op.drop_index("ix_users_stripe_customer_id", table_name="users")
    op.drop_column("users", "plan_expires_at")
    op.drop_column("users", "plan_interval")
    op.drop_column("users", "stripe_subscription_id")
    op.drop_column("users", "stripe_customer_id")
