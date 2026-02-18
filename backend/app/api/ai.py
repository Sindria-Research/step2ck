"""AI endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import Question, User
from app.schemas.ai import AIExplainRequest, AIExplainResponse
from app.services.ai import generate_ai_explanation

router = APIRouter()


@router.post("/explain", response_model=AIExplainResponse)
def explain(
    body: AIExplainRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return AI-generated explanation for a question or a selected snippet."""
    _ = current_user  # Reserved for future auditing / rate-limits.
    question = db.query(Question).filter(Question.id == body.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    explanation, model, fallback_used = generate_ai_explanation(
        question=question,
        selected_answer=body.selected_answer,
        selection_text=body.selection_text,
    )
    return AIExplainResponse(
        explanation=explanation,
        model=model,
        fallback_used=fallback_used,
    )
