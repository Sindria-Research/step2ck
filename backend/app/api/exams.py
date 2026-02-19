"""Exam generation endpoint."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import User
from app.schemas.exam import ExamGenerateRequest, ExamGenerateResponse
from app.schemas.question import QuestionResponse
from app.services.exam import generate_exam
from app.services.plans import get_plan_limits

router = APIRouter()


@router.post("/generate", response_model=ExamGenerateResponse)
def generate(
    body: ExamGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate an exam: filter by subjects and mode, return up to count questions."""
    limits = get_plan_limits(current_user.plan)

    if body.mode == "personalized" and not limits.personalized_mode:
        raise HTTPException(
            status_code=403,
            detail="Personalized mode requires a Pro plan",
            headers={"X-Upgrade-Required": "true"},
        )

    questions = generate_exam(
        db,
        current_user.id,
        body.subjects,
        body.mode,
        body.count,
    )
    return ExamGenerateResponse(
        questions=[QuestionResponse.model_validate(q) for q in questions],
        total=len(questions),
    )
