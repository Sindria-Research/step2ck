"""Tests for flashcard database models and relationships."""
from datetime import datetime, timezone

from app.models.flashcard import Flashcard, FlashcardDeck


class TestFlashcardDeckModel:
    def test_create_deck(self, db):
        deck = FlashcardDeck(user_id="u1", name="My Deck")
        db.add(deck)
        db.commit()
        db.refresh(deck)
        assert deck.id is not None
        assert deck.name == "My Deck"
        assert deck.card_count == 0

    def test_deck_defaults(self, db):
        deck = FlashcardDeck(user_id="u1", name="Test")
        db.add(deck)
        db.commit()
        db.refresh(deck)
        assert deck.description is None
        assert deck.section is None
        assert deck.card_count == 0

    def test_deck_cascade_delete(self, db):
        deck = FlashcardDeck(user_id="u1", name="Del Deck")
        db.add(deck)
        db.commit()
        db.refresh(deck)

        card = Flashcard(
            deck_id=deck.id, user_id="u1",
            front="Q", back="A",
        )
        db.add(card)
        db.commit()

        db.delete(deck)
        db.commit()

        remaining = db.query(Flashcard).filter(Flashcard.deck_id == deck.id).all()
        assert remaining == []


class TestFlashcardModel:
    def test_create_card(self, sample_deck, db):
        card = Flashcard(
            deck_id=sample_deck.id, user_id="test-user",
            front="Front text", back="Back text",
        )
        db.add(card)
        db.commit()
        db.refresh(card)
        assert card.id is not None
        assert card.front == "Front text"

    def test_card_defaults(self, sample_deck, db):
        card = Flashcard(
            deck_id=sample_deck.id, user_id="test-user",
            front="Q", back="A",
        )
        db.add(card)
        db.commit()
        db.refresh(card)
        assert card.stability == 0.0
        assert card.difficulty == 0.0
        assert card.interval_days == 0
        assert card.repetitions == 0
        assert card.lapses == 0
        assert card.state == "new"
        assert card.learning_step == 0
        assert card.flagged is False
        assert card.ease_factor == 2.5
        assert card.next_review is None
        assert card.last_review is None

    def test_card_fsrs_fields_update(self, sample_card, db):
        sample_card.stability = 5.5
        sample_card.difficulty = 4.2
        sample_card.state = "review"
        sample_card.learning_step = 0
        sample_card.interval_days = 7
        sample_card.repetitions = 3
        sample_card.next_review = datetime(2026, 2, 1, tzinfo=timezone.utc)
        sample_card.last_review = datetime(2026, 1, 25, tzinfo=timezone.utc)
        db.commit()
        db.refresh(sample_card)
        assert sample_card.stability == 5.5
        assert sample_card.state == "review"

    def test_card_flagged_toggle(self, sample_card, db):
        assert sample_card.flagged is False
        sample_card.flagged = True
        db.commit()
        db.refresh(sample_card)
        assert sample_card.flagged is True

    def test_card_deck_relationship(self, sample_card, sample_deck, db):
        assert sample_card.deck_id == sample_deck.id
        assert sample_card.deck.name == "Test Deck"

    def test_deck_cards_relationship(self, sample_card, sample_deck, db):
        assert len(sample_deck.cards) == 1
        assert sample_deck.cards[0].id == sample_card.id
