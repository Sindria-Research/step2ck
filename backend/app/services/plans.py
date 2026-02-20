"""Plan/tier constants, feature limits, and gating helpers."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import cast, func as sqlfunc, Date as SADate
from sqlalchemy.orm import Session

PLAN_FREE = "free"
PLAN_PRO = "pro"
PLANS = (PLAN_FREE, PLAN_PRO)


def is_valid_plan(plan: str) -> bool:
    return plan in PLANS


@dataclass(frozen=True)
class PlanLimits:
    daily_questions: int
    daily_ai_explains: int
    max_notes: int
    max_flashcard_decks: int
    max_cards_per_deck: int
    max_bookmarks: int
    personalized_mode: bool
    timed_mode: bool
    study_plan: bool
    full_analytics: bool
    ai_flashcards: bool


FREE_LIMITS = PlanLimits(
    daily_questions=40,
    daily_ai_explains=5,
    max_notes=10,
    max_flashcard_decks=3,
    max_cards_per_deck=50,
    max_bookmarks=25,
    personalized_mode=False,
    timed_mode=False,
    study_plan=False,
    full_analytics=False,
    ai_flashcards=False,
)

PRO_LIMITS = PlanLimits(
    daily_questions=999_999,
    daily_ai_explains=999_999,
    max_notes=999_999,
    max_flashcard_decks=999_999,
    max_cards_per_deck=999_999,
    max_bookmarks=999_999,
    personalized_mode=True,
    timed_mode=True,
    study_plan=True,
    full_analytics=True,
    ai_flashcards=True,
)

_PLAN_LIMITS = {
    PLAN_FREE: FREE_LIMITS,
    PLAN_PRO: PRO_LIMITS,
}


def get_plan_limits(plan: str) -> PlanLimits:
    return _PLAN_LIMITS.get(plan, FREE_LIMITS)


def is_pro(plan: str) -> bool:
    return plan == PLAN_PRO


def count_today_progress(user_id: str, db: Session) -> int:
    from app.models import UserProgress
    today = date.today()
    return (
        db.query(sqlfunc.count(UserProgress.id))
        .filter(
            UserProgress.user_id == user_id,
            cast(UserProgress.created_at, SADate) == today,
        )
        .scalar()
        or 0
    )


def count_today_ai_explains(user_id: str, db: Session) -> int:
    """Count AI explanation requests today via the usage_log table."""
    from app.models.usage_log import UsageLog
    today = date.today()
    return (
        db.query(sqlfunc.count(UsageLog.id))
        .filter(
            UsageLog.user_id == user_id,
            UsageLog.feature == "ai_explain",
            cast(UsageLog.created_at, SADate) == today,
        )
        .scalar()
        or 0
    )


def log_usage(user_id: str, feature: str, db: Session) -> None:
    from app.models.usage_log import UsageLog
    entry = UsageLog(user_id=user_id, feature=feature)
    db.add(entry)
    db.flush()


def count_user_notes(user_id: str, db: Session) -> int:
    from app.models.note import Note
    return db.query(sqlfunc.count(Note.id)).filter(Note.user_id == user_id).scalar() or 0


def count_user_decks(user_id: str, db: Session) -> int:
    from app.models.flashcard import FlashcardDeck
    return db.query(sqlfunc.count(FlashcardDeck.id)).filter(FlashcardDeck.user_id == user_id).scalar() or 0


def count_deck_cards(deck_id: int, user_id: str, db: Session) -> int:
    from app.models.flashcard import Flashcard
    return (
        db.query(sqlfunc.count(Flashcard.id))
        .filter(Flashcard.deck_id == deck_id, Flashcard.user_id == user_id)
        .scalar()
        or 0
    )


def count_user_bookmarks(user_id: str, db: Session) -> int:
    from app.models.bookmark import Bookmark
    return db.query(sqlfunc.count(Bookmark.id)).filter(Bookmark.user_id == user_id).scalar() or 0
