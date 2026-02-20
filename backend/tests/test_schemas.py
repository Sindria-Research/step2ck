"""Tests for flashcard and AI schemas (serialization / validation)."""
from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.schemas.flashcard import (
    FlashcardCreate,
    FlashcardDeckCreate,
    FlashcardReview,
    FlashcardReviewResponse,
    FlashcardResponse,
    IntervalPreview,
    ScheduleInfo,
)
from app.schemas.ai import (
    AIFlashcardCard,
    AIFlashcardRequest,
    AIFlashcardResponse,
)


class TestFlashcardSchemas:
    def test_deck_create_valid(self):
        schema = FlashcardDeckCreate(name="Test Deck")
        assert schema.name == "Test Deck"
        assert schema.description is None

    def test_card_create_valid(self):
        schema = FlashcardCreate(deck_id=1, front="Q", back="A")
        assert schema.deck_id == 1

    def test_card_create_with_question_id(self):
        schema = FlashcardCreate(
            deck_id=1, front="Q", back="A", question_id="q-123"
        )
        assert schema.question_id == "q-123"

    def test_review_valid_ratings(self):
        for rating in [1, 2, 3, 4]:
            r = FlashcardReview(rating=rating)
            assert r.rating == rating

    def test_schedule_info(self):
        info = ScheduleInfo(days=7, minutes=0, graduated=True)
        assert info.days == 7
        assert info.graduated is True

    def test_interval_preview(self):
        preview = IntervalPreview(
            again=ScheduleInfo(days=0, minutes=1, graduated=False),
            hard=ScheduleInfo(days=0, minutes=5, graduated=False),
            good=ScheduleInfo(days=0, minutes=10, graduated=False),
            easy=ScheduleInfo(days=14, minutes=0, graduated=True),
        )
        assert preview.easy.graduated is True
        assert preview.again.minutes == 1

    def test_review_response(self):
        card_data = {
            "id": 1, "deck_id": 1, "user_id": "u1",
            "front": "Q", "back": "A", "question_id": None,
            "stability": 3.7, "difficulty": 5.1, "ease_factor": 2.5,
            "interval_days": 0, "repetitions": 1, "lapses": 0,
            "state": "learning", "learning_step": 1, "flagged": False,
            "next_review": datetime(2026, 1, 15, 12, 10, tzinfo=timezone.utc).isoformat(),
            "last_review": datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc).isoformat(),
            "created_at": datetime(2026, 1, 1, tzinfo=timezone.utc).isoformat(),
            "updated_at": datetime(2026, 1, 15, tzinfo=timezone.utc).isoformat(),
        }
        resp = FlashcardReviewResponse(
            card=FlashcardResponse(**card_data),
            intervals={
                "1": ScheduleInfo(days=0, minutes=1, graduated=False),
                "2": ScheduleInfo(days=0, minutes=5, graduated=False),
                "3": ScheduleInfo(days=0, minutes=10, graduated=False),
                "4": ScheduleInfo(days=14, minutes=0, graduated=True),
            },
            again_in_minutes=10,
            graduated=False,
        )
        assert resp.again_in_minutes == 10
        assert resp.graduated is False


class TestAISchemas:
    def test_flashcard_request(self):
        req = AIFlashcardRequest(question_id="q-1")
        assert req.question_id == "q-1"
        assert req.selected_answer is None

    def test_flashcard_card(self):
        card = AIFlashcardCard(front="Q", back="A")
        assert card.front == "Q"

    def test_flashcard_response(self):
        resp = AIFlashcardResponse(
            cards=[AIFlashcardCard(front="Q1", back="A1")],
            model="gpt-4o-mini",
        )
        assert len(resp.cards) == 1
        assert resp.model == "gpt-4o-mini"
