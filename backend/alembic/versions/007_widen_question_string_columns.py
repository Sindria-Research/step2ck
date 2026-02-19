"""Widen questions section, subsection, system to TEXT (was varchar 255).

Revision ID: 007
Revises: 006
Create Date: 2026-02-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        return
    op.alter_column("questions", "section", existing_type=sa.String(255), type_=sa.Text(), existing_nullable=False)
    op.alter_column("questions", "subsection", existing_type=sa.String(255), type_=sa.Text(), existing_nullable=True)
    op.alter_column("questions", "system", existing_type=sa.String(255), type_=sa.Text(), existing_nullable=True)


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        return
    op.alter_column("questions", "section", existing_type=sa.Text(), type_=sa.String(255), existing_nullable=False)
    op.alter_column("questions", "subsection", existing_type=sa.Text(), type_=sa.String(255), existing_nullable=True)
    op.alter_column("questions", "system", existing_type=sa.Text(), type_=sa.String(255), existing_nullable=True)
