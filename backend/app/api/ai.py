"""AI endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import Question, User
from app.schemas.ai import (
    AIExplainRequest,
    AIExplainResponse,
    AIFlashcardCard,
    AIFlashcardRequest,
    AIFlashcardResponse,
)
from app.services.ai import AIFlashcardError, generate_ai_explanation, generate_ai_flashcards
from app.services.plans import (
    count_today_ai_explains,
    get_plan_limits,
    log_usage,
)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/explain", response_model=AIExplainResponse)
@limiter.limit("20/minute")
def explain(
    request: Request,
    body: AIExplainRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return AI-generated explanation for a question or a selected snippet."""
    limits = get_plan_limits(current_user.plan)
    used = count_today_ai_explains(current_user.id, db)
    if used >= limits.daily_ai_explains:
        raise HTTPException(
            status_code=429,
            detail="Daily AI explanation limit reached",
            headers={"X-Upgrade-Required": "true"},
        )

    question = db.query(Question).filter(Question.id == body.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    explanation, model, fallback_used = generate_ai_explanation(
        question=question,
        selected_answer=body.selected_answer,
        selection_text=body.selection_text,
    )

    log_usage(current_user.id, "ai_explain", db)
    db.commit()

    remaining = max(0, limits.daily_ai_explains - used - 1)
    return AIExplainResponse(
        explanation=explanation,
        model=model,
        fallback_used=fallback_used,
    )


@router.post("/flashcard", response_model=AIFlashcardResponse)
@limiter.limit("20/minute")
def generate_flashcard(
    request: Request,
    body: AIFlashcardRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate AI-distilled flashcards from a question. Pro only."""
    limits = get_plan_limits(current_user.plan)
    if not limits.ai_flashcards:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Flashcards is a Pro feature. Upgrade to unlock.",
            headers={"X-Upgrade-Required": "true"},
        )
    used = count_today_ai_explains(current_user.id, db)
    if used >= limits.daily_ai_explains:
        raise HTTPException(
            status_code=429,
            detail="Daily AI limit reached.",
            headers={"X-Upgrade-Required": "true"},
        )

    question = db.query(Question).filter(Question.id == body.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    try:
        cards, model = generate_ai_flashcards(
            question=question,
            selected_answer=body.selected_answer,
            num_cards=body.num_cards,
        )
    except AIFlashcardError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    log_usage(current_user.id, "ai_flashcard", db)
    db.commit()

    return AIFlashcardResponse(
        cards=[AIFlashcardCard(front=f, back=b) for f, b in cards],
        model=model,
    )
