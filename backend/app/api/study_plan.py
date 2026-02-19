"""Study plan endpoints — auto-generated weekly study schedule."""
import math
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import case, func as sqlfunc
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import User, UserProgress
from app.models.study_plan import StudyPlan
from app.models.study_profile import UserStudyProfile

router = APIRouter()


def _generate_plan_data(
    db: Session,
    user: User,
    profile: UserStudyProfile,
) -> dict:
    """Build a weekly study plan based on exam date, weak areas, and coverage."""
    today = date.today()
    exam_dt = profile.exam_date or (today + timedelta(weeks=8))
    days_left = max((exam_dt - today).days, 7)
    weeks_left = max(math.ceil(days_left / 7), 1)

    section_rows = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == user.id)
        .with_entities(
            UserProgress.section,
            sqlfunc.count().label("total"),
            sqlfunc.sum(case((UserProgress.correct == True, 1), else_=0)).label("correct"),  # noqa: E712
        )
        .group_by(UserProgress.section)
        .all()
    )

    sections: list[dict] = []
    for row in section_rows:
        acc = round((int(row.correct or 0) / row.total) * 100) if row.total else 0
        sections.append({"name": row.section, "total": row.total, "accuracy": acc})

    weak = sorted([s for s in sections if s["accuracy"] < 70], key=lambda s: s["accuracy"])
    medium = sorted([s for s in sections if 70 <= s["accuracy"] < 85], key=lambda s: s["accuracy"])
    strong = [s for s in sections if s["accuracy"] >= 85]

    daily_goal = profile.daily_question_goal or 40
    weekly_target = daily_goal * 5

    weeks = []
    for i in range(min(weeks_left, 12)):
        week_start = today + timedelta(weeks=i)
        week_end = week_start + timedelta(days=6)
        phase = "foundation" if i < weeks_left * 0.4 else ("reinforcement" if i < weeks_left * 0.75 else "review")

        focus_sections = []
        if phase == "foundation":
            pool = weak + medium
        elif phase == "reinforcement":
            pool = medium + weak[:2]
        else:
            pool = weak[:3] + medium[:2] + strong[:2]

        for s in pool[:4]:
            focus_sections.append(s["name"])

        weeks.append({
            "week": i + 1,
            "start": week_start.isoformat(),
            "end": week_end.isoformat(),
            "phase": phase,
            "focus_sections": focus_sections,
            "question_target": weekly_target,
            "completed": 0,
        })

    return {
        "exam_date": exam_dt.isoformat(),
        "weeks_until_exam": weeks_left,
        "daily_goal": daily_goal,
        "weeks": weeks,
    }


@router.get("")
def get_study_plan(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    plan = db.query(StudyPlan).filter(StudyPlan.user_id == user.id).first()
    if not plan:
        return {"plan_data": None}
    return {"plan_data": plan.plan_data, "generated_at": plan.generated_at}


@router.post("/generate")
def generate_study_plan(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    profile = db.query(UserStudyProfile).filter(UserStudyProfile.user_id == user.id).first()
    if not profile:
        profile = UserStudyProfile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    plan_data = _generate_plan_data(db, user, profile)

    existing = db.query(StudyPlan).filter(StudyPlan.user_id == user.id).first()
    if existing:
        existing.plan_data = plan_data
        existing.generated_at = sqlfunc.now()
    else:
        existing = StudyPlan(user_id=user.id, plan_data=plan_data)
        db.add(existing)

    db.commit()
    db.refresh(existing)
    return {"plan_data": existing.plan_data, "generated_at": existing.generated_at}
