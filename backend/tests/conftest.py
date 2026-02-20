"""Shared fixtures for backend tests."""
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

from app.db.base import Base
from app.models.flashcard import Flashcard, FlashcardDeck


TEST_DB_URL = "sqlite://"


@pytest.fixture()
def db():
    """In-memory SQLite session for each test."""
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def sample_deck(db):
    """Create a sample deck and return it."""
    deck = FlashcardDeck(user_id="test-user", name="Test Deck", card_count=0)
    db.add(deck)
    db.commit()
    db.refresh(deck)
    return deck


@pytest.fixture()
def sample_card(db, sample_deck):
    """Create a new flashcard in the sample deck."""
    card = Flashcard(
        deck_id=sample_deck.id,
        user_id="test-user",
        front="What is the capital of France?",
        back="Paris",
    )
    db.add(card)
    sample_deck.card_count += 1
    db.commit()
    db.refresh(card)
    return card
