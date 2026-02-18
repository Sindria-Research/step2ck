"""Exam generation endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import User
from app.schemas.exam import ExamGenerateRequest, ExamGenerateResponse
from app.schemas.question import QuestionResponse
from app.services.exam import generate_exam

router = APIRouter()


@router.post("/generate", response_model=ExamGenerateResponse)
def generate(
    body: ExamGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate an exam: filter by subjects and mode, return up to count questions."""
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
