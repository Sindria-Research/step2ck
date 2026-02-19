"""API routes for flashcards and decks."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import User
from app.models.flashcard import Flashcard, FlashcardDeck
from app.services.plans import count_deck_cards, count_user_decks, get_plan_limits
from app.schemas.flashcard import (
    FlashcardCreate,
    FlashcardDeckCreate,
    FlashcardDeckResponse,
    FlashcardDeckUpdate,
    FlashcardResponse,
    FlashcardReview,
    FlashcardUpdate,
)
from app.services.apkg_parser import parse_apkg

router = APIRouter()


# ── Decks ──

@router.get("/decks", response_model=list[FlashcardDeckResponse])
def list_decks(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return db.query(FlashcardDeck).filter(FlashcardDeck.user_id == user.id).order_by(FlashcardDeck.updated_at.desc()).all()


@router.post("/decks", response_model=FlashcardDeckResponse, status_code=status.HTTP_201_CREATED)
def create_deck(
    body: FlashcardDeckCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    limits = get_plan_limits(user.plan)
    current_count = count_user_decks(user.id, db)
    if current_count >= limits.max_flashcard_decks:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Deck limit reached ({limits.max_flashcard_decks}). Upgrade to Pro for unlimited decks.",
            headers={"X-Upgrade-Required": "true"},
        )

    deck = FlashcardDeck(user_id=user.id, **body.model_dump())
    db.add(deck)
    db.commit()
    db.refresh(deck)
    return deck


@router.patch("/decks/{deck_id}", response_model=FlashcardDeckResponse)
def update_deck(
    deck_id: int,
    body: FlashcardDeckUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == deck_id, FlashcardDeck.user_id == user.id).first()
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(deck, field, value)
    db.commit()
    db.refresh(deck)
    return deck


@router.delete("/decks/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == deck_id, FlashcardDeck.user_id == user.id).first()
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    db.delete(deck)
    db.commit()


# ── Cards ──

@router.get("/decks/{deck_id}/cards", response_model=list[FlashcardResponse])
def list_cards(
    deck_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == deck_id, FlashcardDeck.user_id == user.id).first()
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    return db.query(Flashcard).filter(Flashcard.deck_id == deck_id, Flashcard.user_id == user.id).all()


@router.get("/decks/{deck_id}/review", response_model=list[FlashcardResponse])
def get_deck_review_cards(
    deck_id: int,
    mode: str = "due",
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get cards to study in a deck. mode=due: only due/new cards; mode=all: all cards in deck."""
    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == deck_id, FlashcardDeck.user_id == user.id).first()
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    q = db.query(Flashcard).filter(Flashcard.deck_id == deck_id, Flashcard.user_id == user.id)
    if mode == "due":
        now = datetime.now(timezone.utc)
        q = q.filter((Flashcard.next_review == None) | (Flashcard.next_review <= now))  # noqa: E711
    return q.limit(limit).all()


@router.get("/due", response_model=list[FlashcardResponse])
def get_due_cards(
    limit: int = 20,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    return (
        db.query(Flashcard)
        .filter(Flashcard.user_id == user.id)
        .filter((Flashcard.next_review == None) | (Flashcard.next_review <= now))  # noqa: E711
        .limit(limit)
        .all()
    )


@router.post("/cards", response_model=FlashcardResponse, status_code=status.HTTP_201_CREATED)
def create_card(
    body: FlashcardCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == body.deck_id, FlashcardDeck.user_id == user.id).first()
    if not deck:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")

    limits = get_plan_limits(user.plan)
    card_count = count_deck_cards(deck.id, user.id, db)
    if card_count >= limits.max_cards_per_deck:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Card limit reached ({limits.max_cards_per_deck} per deck). Upgrade to Pro for unlimited cards.",
            headers={"X-Upgrade-Required": "true"},
        )

    card = Flashcard(user_id=user.id, **body.model_dump())
    db.add(card)
    deck.card_count += 1
    db.commit()
    db.refresh(card)
    return card


@router.patch("/cards/{card_id}", response_model=FlashcardResponse)
def update_card(
    card_id: int,
    body: FlashcardUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    card = db.query(Flashcard).filter(Flashcard.id == card_id, Flashcard.user_id == user.id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(card, field, value)
    db.commit()
    db.refresh(card)
    return card


@router.post("/cards/{card_id}/review", response_model=FlashcardResponse)
def review_card(
    card_id: int,
    body: FlashcardReview,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """SM-2 spaced repetition algorithm."""
    card = db.query(Flashcard).filter(Flashcard.id == card_id, Flashcard.user_id == user.id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    q = max(0, min(5, body.quality))

    if q < 3:
        card.repetitions = 0
        card.interval_days = 1
    else:
        if card.repetitions == 0:
            card.interval_days = 1
        elif card.repetitions == 1:
            card.interval_days = 6
        else:
            card.interval_days = max(1, round(card.interval_days * card.ease_factor))
        card.repetitions += 1

    card.ease_factor = max(1.3, card.ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
    card.next_review = datetime.now(timezone.utc) + timedelta(days=card.interval_days)

    db.commit()
    db.refresh(card)
    return card


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(
    card_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    card = db.query(Flashcard).filter(Flashcard.id == card_id, Flashcard.user_id == user.id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == card.deck_id).first()
    if deck:
        deck.card_count = max(0, deck.card_count - 1)

    db.delete(card)
    db.commit()


# ── Import .apkg ──


@router.post("/import-apkg", response_model=list[FlashcardDeckResponse])
def import_apkg(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Import Anki .apkg file. Creates one deck per Anki deck with all cards."""
    if not file.filename or not file.filename.lower().endswith(".apkg"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be a .apkg file")
    data = file.file.read()
    if len(data) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")
    try:
        decks_cards = parse_apkg(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    created_decks: list[FlashcardDeckResponse] = []
    for deck_name, cards in decks_cards:
        deck = FlashcardDeck(user_id=user.id, name=deck_name, description=f"Imported from Anki ({len(cards)} cards)")
        db.add(deck)
        db.flush()
        for front, back in cards:
            card = Flashcard(user_id=user.id, deck_id=deck.id, front=front, back=back)
            db.add(card)
        deck.card_count = len(cards)
        db.commit()
        db.refresh(deck)
        created_decks.append(FlashcardDeckResponse.model_validate(deck))
    return created_decks
