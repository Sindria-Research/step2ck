"""API routes for flashcards and decks."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import distinct, func as sa_func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import User
from app.models.flashcard import Flashcard, FlashcardDeck
from app.models.flashcard_settings import FlashcardSettings
from app.models.exam_session import ExamSession, ExamSessionAnswer
from app.models.question import Question
from app.models.user_progress import UserProgress
from app.services.plans import count_deck_cards, count_user_decks, get_plan_limits
from app.schemas.flashcard import (
    FlashcardCreate,
    FlashcardDeckCreate,
    FlashcardDeckResponse,
    FlashcardDeckUpdate,
    FlashcardResponse,
    FlashcardReview,
    FlashcardReviewResponse,
    FlashcardStatsDayHistory,
    FlashcardStatsResponse,
    FlashcardUpdate,
    GenerationQuestionItem,
    GenerationQuestionsRequest,
    GenerationQuestionsResponse,
    GenerationSessionSource,
    GenerationSourcesResponse,
    IntervalPreview,
    ScheduleInfo,
)
from app.schemas.flashcard_settings import FlashcardSettingsResponse, FlashcardSettingsUpdate
from app.services.apkg_parser import parse_apkg
from app.services.fsrs import CardState, preview_intervals
from app.services.fsrs import review as fsrs_review

router = APIRouter()


# ── Decks ──

@router.get("/decks", response_model=list[FlashcardDeckResponse])
def list_decks(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    decks = db.query(FlashcardDeck).filter(FlashcardDeck.user_id == user.id).order_by(FlashcardDeck.updated_at.desc()).all()
    now = datetime.now(timezone.utc)
    result = []
    for deck in decks:
        cards = db.query(Flashcard).filter(Flashcard.deck_id == deck.id, Flashcard.user_id == user.id).all()
        new_count = sum(1 for c in cards if c.state == "new" and not c.suspended and not c.buried)
        learning_count = sum(1 for c in cards if c.state == "learning" and not c.suspended and not c.buried)
        due_count = sum(
            1 for c in cards
            if not c.suspended and not c.buried
            and c.state not in ("new",)
            and c.next_review is not None
            and c.next_review <= now
        )
        d = FlashcardDeckResponse.model_validate(deck)
        d.new_count = new_count
        d.learning_count = learning_count
        d.due_count = due_count
        result.append(d)
    return result


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
    q = q.filter(Flashcard.suspended == False, Flashcard.buried == False)  # noqa: E712
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
        .filter(Flashcard.suspended == False, Flashcard.buried == False)  # noqa: E712
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


def _card_to_state(card: Flashcard) -> CardState:
    return CardState(
        stability=card.stability,
        difficulty=card.difficulty,
        interval_days=card.interval_days,
        repetitions=card.repetitions,
        lapses=card.lapses,
        state=card.state,
        next_review=card.next_review,
        last_review=card.last_review,
        learning_step=card.learning_step,
    )


def _parse_steps(s: str) -> list[int]:
    """Parse comma-separated step minutes like '1,10' -> [1, 10]."""
    parts = [p.strip() for p in s.split(",") if p.strip()]
    return [int(p) for p in parts if p.isdigit()]


def _load_fsrs_overrides(user_id: str, db: Session) -> dict:
    """Load user FSRS settings overrides for passing to review/preview_intervals."""
    try:
        settings = db.query(FlashcardSettings).filter(FlashcardSettings.user_id == user_id).first()
    except Exception:
        return {}
    if not settings:
        return {}
    return {
        "learning_steps": _parse_steps(settings.learning_steps),
        "relearning_steps": _parse_steps(settings.relearning_steps),
        "desired_retention": settings.desired_retention,
        "max_interval": settings.max_interval_days,
    }


@router.post("/cards/{card_id}/review", response_model=FlashcardReviewResponse)
def review_card(
    card_id: int,
    body: FlashcardReview,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """FSRS v4.5 spaced repetition review."""
    card = db.query(Flashcard).filter(Flashcard.id == card_id, Flashcard.user_id == user.id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    now = datetime.now(timezone.utc)
    cs = _card_to_state(card)
    overrides = _load_fsrs_overrides(user.id, db)
    result = fsrs_review(cs, body.rating, now, **overrides)

    card.stability = result.stability
    card.difficulty = result.difficulty
    card.interval_days = result.interval_days
    card.repetitions = result.repetitions
    card.lapses = result.lapses
    card.state = result.state
    card.learning_step = result.learning_step
    card.next_review = result.next_review
    card.last_review = result.last_review

    db.commit()
    db.refresh(card)

    new_cs = _card_to_state(card)
    raw_intervals = preview_intervals(new_cs, now, **overrides)

    return FlashcardReviewResponse(
        card=FlashcardResponse.model_validate(card),
        intervals={str(k): ScheduleInfo(**v) for k, v in raw_intervals.items()},
        again_in_minutes=result.again_in_minutes,
        graduated=result.graduated,
    )


@router.get("/cards/{card_id}/intervals", response_model=IntervalPreview)
def get_card_intervals(
    card_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Preview the next interval for each rating without committing a review."""
    card = db.query(Flashcard).filter(Flashcard.id == card_id, Flashcard.user_id == user.id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")

    cs = _card_to_state(card)
    overrides = _load_fsrs_overrides(user.id, db)
    raw = preview_intervals(cs, **overrides)
    return IntervalPreview(
        again=ScheduleInfo(**raw[1]),
        hard=ScheduleInfo(**raw[2]),
        good=ScheduleInfo(**raw[3]),
        easy=ScheduleInfo(**raw[4]),
    )


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


@router.post("/cards/unbury-all", status_code=status.HTTP_200_OK)
def unbury_all_cards(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Reset buried status on all user's cards."""
    count = (
        db.query(Flashcard)
        .filter(Flashcard.user_id == user.id, Flashcard.buried == True)  # noqa: E712
        .update({Flashcard.buried: False})
    )
    db.commit()
    return {"unburied": count}


# ── Stats ──

@router.get("/stats", response_model=FlashcardStatsResponse)
def get_flashcard_stats(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Aggregate flashcard stats for the current user."""
    from datetime import timedelta, date as date_type

    cards = db.query(Flashcard).filter(Flashcard.user_id == user.id).all()
    total = len(cards)
    cards_new = sum(1 for c in cards if c.state == "new" and not c.suspended)
    cards_suspended = sum(1 for c in cards if c.suspended)
    cards_buried = sum(1 for c in cards if c.buried)
    cards_mature = sum(1 for c in cards if c.interval_days >= 21 and not c.suspended)
    cards_young = total - cards_new - cards_mature - cards_suspended

    today = datetime.now(timezone.utc).date()

    # Reviews today and streak: count reviews by last_review date
    review_dates: dict[date_type, int] = {}
    total_reviews = 0
    good_easy_count = 0
    ease_sum = 0.0
    reviewed_cards = 0
    for c in cards:
        if c.last_review:
            d = c.last_review.date() if hasattr(c.last_review, 'date') else c.last_review
            review_dates[d] = review_dates.get(d, 0) + 1
        if c.repetitions > 0:
            total_reviews += c.repetitions
            ease_sum += c.ease_factor
            reviewed_cards += 1
            if c.state == "review" and c.interval_days >= 1:
                good_easy_count += 1

    reviews_today = review_dates.get(today, 0)

    # Streak: consecutive days ending today (or yesterday) with at least 1 review
    streak = 0
    check_date = today
    if check_date not in review_dates and (check_date - timedelta(days=1)) in review_dates:
        check_date = check_date - timedelta(days=1)
    while check_date in review_dates:
        streak += 1
        check_date -= timedelta(days=1)

    # Retention rate: proportion of cards currently in review state vs total reviewed
    retention_rate = (good_easy_count / reviewed_cards * 100) if reviewed_cards > 0 else 0.0
    average_ease = (ease_sum / reviewed_cards) if reviewed_cards > 0 else 2.5

    # Daily history for last 14 days
    daily_history: list[FlashcardStatsDayHistory] = []
    for i in range(13, -1, -1):
        d = today - timedelta(days=i)
        daily_history.append(FlashcardStatsDayHistory(
            date=d.isoformat(),
            count=review_dates.get(d, 0),
        ))

    return FlashcardStatsResponse(
        total_cards=total,
        cards_new=cards_new,
        cards_young=max(0, cards_young),
        cards_mature=cards_mature,
        cards_suspended=cards_suspended,
        cards_buried=cards_buried,
        reviews_today=reviews_today,
        reviews_streak=streak,
        retention_rate=round(retention_rate, 1),
        average_ease=round(average_ease, 2),
        total_reviews=total_reviews,
        daily_reviews_history=daily_history,
    )


# ── Settings ──

@router.get("/settings", response_model=FlashcardSettingsResponse)
def get_settings(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return flashcard settings for the current user, or defaults if none exist."""
    try:
        row = db.query(FlashcardSettings).filter(FlashcardSettings.user_id == user.id).first()
        if row:
            return row
    except Exception:
        pass
    return FlashcardSettingsResponse()


@router.patch("/settings", response_model=FlashcardSettingsResponse)
def update_settings(
    body: FlashcardSettingsUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update flashcard settings (upsert)."""
    try:
        row = db.query(FlashcardSettings).filter(FlashcardSettings.user_id == user.id).first()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Settings table not available. Please run database migrations.",
        )
    if not row:
        row = FlashcardSettings(user_id=user.id)
        db.add(row)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(row, field, value)
    db.commit()
    db.refresh(row)
    return row


# ── AI Generation Sources ──

def _existing_flashcard_qids(user_id: str, db: Session) -> set[str]:
    """Return the set of question_ids that already have flashcards for this user."""
    rows = (
        db.query(Flashcard.question_id)
        .filter(Flashcard.user_id == user_id, Flashcard.question_id.isnot(None))
        .distinct()
        .all()
    )
    return {r[0] for r in rows}


@router.get("/generation-sources", response_model=GenerationSourcesResponse)
def get_generation_sources(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return available sources for AI flashcard generation."""
    existing_qids = _existing_flashcard_qids(user.id, db)

    # Completed sessions with at least one incorrect answer
    sessions_raw = (
        db.query(ExamSession)
        .filter(
            ExamSession.user_id == user.id,
            ExamSession.status == "completed",
            ExamSession.incorrect_count > 0,
        )
        .order_by(ExamSession.completed_at.desc())
        .all()
    )
    sessions = []
    for s in sessions_raw:
        incorrect_qids = [
            a.question_id
            for a in db.query(ExamSessionAnswer.question_id)
            .filter(ExamSessionAnswer.session_id == s.id, ExamSessionAnswer.correct == False)  # noqa: E712
            .all()
        ]
        remaining = [qid for qid in incorrect_qids if qid not in existing_qids]
        if remaining:
            sessions.append(GenerationSessionSource(
                id=s.id,
                mode=s.mode,
                date=s.completed_at.isoformat() if s.completed_at else s.started_at.isoformat(),
                subjects=s.subjects,
                accuracy=s.accuracy,
                incorrect_count=len(remaining),
            ))

    # Sections and systems from missed questions that don't already have flashcards
    missed_qids_rows = (
        db.query(distinct(UserProgress.question_id))
        .filter(UserProgress.user_id == user.id, UserProgress.correct == False)  # noqa: E712
        .all()
    )
    missed_qids = {r[0] for r in missed_qids_rows} - existing_qids

    sections: list[str] = []
    systems: list[str] = []
    if missed_qids:
        sec_rows = (
            db.query(distinct(Question.section))
            .filter(Question.id.in_(missed_qids))
            .all()
        )
        sections = sorted([r[0] for r in sec_rows if r[0]])

        sys_rows = (
            db.query(distinct(Question.system))
            .filter(Question.id.in_(missed_qids), Question.system.isnot(None))
            .all()
        )
        systems = sorted([r[0] for r in sys_rows if r[0]])

    # All available sections/systems (not limited to missed)
    all_sec_rows = db.query(distinct(Question.section)).filter(Question.section.isnot(None)).all()
    all_sections = sorted([r[0] for r in all_sec_rows if r[0]])

    all_sys_rows = db.query(distinct(Question.system)).filter(Question.system.isnot(None)).all()
    all_systems = sorted([r[0] for r in all_sys_rows if r[0]])

    return GenerationSourcesResponse(
        sessions=sessions,
        sections=sections,
        systems=systems,
        all_sections=all_sections,
        all_systems=all_systems,
    )


@router.post("/generation-questions", response_model=GenerationQuestionsResponse)
def get_generation_questions(
    body: GenerationQuestionsRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return questions matching a generation source filter, excluding those with existing flashcards."""
    existing_qids = _existing_flashcard_qids(user.id, db)

    if body.source == "session":
        if body.session_id is None:
            raise HTTPException(status_code=400, detail="session_id is required for source=session")
        session = (
            db.query(ExamSession)
            .filter(ExamSession.id == body.session_id, ExamSession.user_id == user.id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        qid_rows = (
            db.query(ExamSessionAnswer.question_id)
            .filter(ExamSessionAnswer.session_id == session.id, ExamSessionAnswer.correct == False)  # noqa: E712
            .all()
        )
        target_qids = {r[0] for r in qid_rows} - existing_qids

    elif body.source == "section":
        if not body.section:
            raise HTTPException(status_code=400, detail="section is required for source=section")
        missed_qids = {
            r[0]
            for r in db.query(distinct(UserProgress.question_id))
            .filter(UserProgress.user_id == user.id, UserProgress.correct == False)  # noqa: E712
            .all()
        } - existing_qids
        q_in_section = {
            r[0]
            for r in db.query(Question.id)
            .filter(Question.id.in_(missed_qids), Question.section == body.section)
            .all()
        } if missed_qids else set()
        target_qids = q_in_section

    elif body.source == "system":
        if not body.system:
            raise HTTPException(status_code=400, detail="system is required for source=system")
        missed_qids = {
            r[0]
            for r in db.query(distinct(UserProgress.question_id))
            .filter(UserProgress.user_id == user.id, UserProgress.correct == False)  # noqa: E712
            .all()
        } - existing_qids
        q_in_system = {
            r[0]
            for r in db.query(Question.id)
            .filter(Question.id.in_(missed_qids), Question.system == body.system)
            .all()
        } if missed_qids else set()
        target_qids = q_in_system

    elif body.source == "all_section":
        if not body.section:
            raise HTTPException(status_code=400, detail="section is required for source=all_section")
        all_qids = {
            r[0]
            for r in db.query(Question.id)
            .filter(Question.section == body.section)
            .all()
        } - existing_qids
        target_qids = all_qids

    elif body.source == "all_system":
        if not body.system:
            raise HTTPException(status_code=400, detail="system is required for source=all_system")
        all_qids = {
            r[0]
            for r in db.query(Question.id)
            .filter(Question.system == body.system)
            .all()
        } - existing_qids
        target_qids = all_qids

    else:
        # Default: "missed" — all incorrect questions without flashcards
        target_qids = {
            r[0]
            for r in db.query(distinct(UserProgress.question_id))
            .filter(UserProgress.user_id == user.id, UserProgress.correct == False)  # noqa: E712
            .all()
        } - existing_qids

    if not target_qids:
        return GenerationQuestionsResponse(questions=[])

    questions = (
        db.query(Question)
        .filter(Question.id.in_(target_qids))
        .order_by(Question.section, Question.id)
        .limit(body.limit)
        .all()
    )

    return GenerationQuestionsResponse(
        questions=[
            GenerationQuestionItem(
                id=q.id,
                section=q.section,
                system=q.system,
                question_stem=q.question_stem,
            )
            for q in questions
        ]
    )


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
