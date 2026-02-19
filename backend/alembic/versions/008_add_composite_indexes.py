"""Add composite indexes and missing column indexes for performance.

Revision ID: 008
Revises: 007
Create Date: 2026-02-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
        DELETE FROM bookmarks
        WHERE id NOT IN (
            SELECT MIN(id) FROM bookmarks GROUP BY user_id, question_id
        )
    """))
    op.create_index("ix_bookmarks_user_question", "bookmarks", ["user_id", "question_id"], unique=True)
    op.create_index("ix_exam_session_answers_question_id", "exam_session_answers", ["question_id"])
    op.create_index("ix_exam_sessions_status", "exam_sessions", ["status"])
    op.create_index("ix_notes_section", "notes", ["section"])


def downgrade() -> None:
    op.drop_index("ix_notes_section", table_name="notes")
    op.drop_index("ix_exam_sessions_status", table_name="exam_sessions")
    op.drop_index("ix_exam_session_answers_question_id", table_name="exam_session_answers")
    op.drop_index("ix_bookmarks_user_question", table_name="bookmarks")
