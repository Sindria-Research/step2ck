"""Progress endpoints."""
import logging
import math
from collections import defaultdict
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func as sqlfunc, cast, Date as SADate
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import User, UserProgress
from app.models.exam_session import ExamSessionAnswer, ExamSession
from app.models.study_profile import UserStudyProfile
from app.models.question import Question
from app.schemas.progress import ProgressRecordCreate, ProgressRecordResponse, ProgressStatsResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=list)
def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """Return current user's progress records (question_id, correct) with pagination."""
    rows = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == current_user.id)
        .order_by(UserProgress.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        {"question_id": r.question_id, "correct": r.correct, "section": r.section}
        for r in rows
    ]


@router.get("/stats", response_model=ProgressStatsResponse)
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregate stats using SQL — no full table scan into Python."""
    base = db.query(UserProgress).filter(UserProgress.user_id == current_user.id)

    totals = base.with_entities(
        sqlfunc.count().label("total"),
        sqlfunc.sum(case((UserProgress.correct == True, 1), else_=0)).label("correct"),  # noqa: E712
    ).first()

    total = totals.total or 0
    correct = int(totals.correct or 0)
    incorrect = total - correct

    section_rows = (
        base.with_entities(
            UserProgress.section,
            sqlfunc.count().label("total"),
            sqlfunc.sum(case((UserProgress.correct == True, 1), else_=0)).label("correct"),  # noqa: E712
        )
        .group_by(UserProgress.section)
        .all()
    )

    by_section = [
        {
            "name": row.section,
            "total": row.total,
            "correct": int(row.correct or 0),
            "accuracy": round((int(row.correct or 0) / row.total) * 100) if row.total else 0,
        }
        for row in section_rows
    ]

    weak_areas = [
        {"name": s["name"], "accuracy": s["accuracy"], "total": s["total"]}
        for s in by_section
        if s["total"] >= 10 and s["accuracy"] < 60
    ]
    weak_areas.sort(key=lambda s: s["accuracy"])

    total_sections_available = db.query(sqlfunc.count(sqlfunc.distinct(Question.section))).scalar() or 1
    sections_touched = len(by_section)
    coverage = min(1.0, sections_touched / total_sections_available) if total_sections_available else 0

    overall_accuracy = (correct / total) if total > 0 else 0
    volume_score = min(1.0, total / 500)

    recent_rows = (
        base.with_entities(UserProgress.correct, UserProgress.created_at)
        .order_by(UserProgress.created_at.desc())
        .limit(100)
        .all()
    )
    if len(recent_rows) >= 20:
        first_half = recent_rows[len(recent_rows) // 2:]
        second_half = recent_rows[:len(recent_rows) // 2]
        old_acc = sum(1 for r in first_half if r.correct) / len(first_half) if first_half else 0
        new_acc = sum(1 for r in second_half if r.correct) / len(second_half) if second_half else 0
        consistency = min(1.0, max(0, 0.5 + (new_acc - old_acc)))
    else:
        consistency = 0.5

    readiness_score = round(
        (coverage * 0.2 + overall_accuracy * 0.35 + volume_score * 0.2 + consistency * 0.25) * 100
    )
    readiness_score = max(0, min(100, readiness_score))

    return ProgressStatsResponse(
        total=total,
        correct=correct,
        incorrect=incorrect,
        by_section=by_section,
        weak_areas=weak_areas,
        readiness_score=readiness_score,
    )


@router.get("/daily-summary")
def get_daily_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Today's progress, streak count, and last 14 days history."""
    profile = db.query(UserStudyProfile).filter(UserStudyProfile.user_id == current_user.id).first()
    daily_goal = profile.daily_question_goal if profile else 40

    today = date.today()
    start_date = today - timedelta(days=13)

    rows = (
        db.query(
            cast(UserProgress.created_at, SADate).label("day"),
            sqlfunc.count().label("cnt"),
        )
        .filter(
            UserProgress.user_id == current_user.id,
            cast(UserProgress.created_at, SADate) >= start_date,
        )
        .group_by("day")
        .all()
    )

    by_day = {row.day if isinstance(row.day, date) else datetime.fromisoformat(str(row.day)).date(): row.cnt for row in rows}

    history = []
    for i in range(14):
        d = start_date + timedelta(days=i)
        cnt = by_day.get(d, 0)
        history.append({"date": d.isoformat(), "count": cnt, "met_goal": cnt >= daily_goal})

    today_count = by_day.get(today, 0)

    streak = 0
    check = today
    while True:
        cnt = by_day.get(check, 0)
        if cnt >= daily_goal:
            streak += 1
            check -= timedelta(days=1)
        else:
            break

    return {
        "today_count": today_count,
        "daily_goal": daily_goal,
        "streak": streak,
        "history": history,
    }


@router.get("/time-stats")
def get_time_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Average time per question overall and by section."""
    base = (
        db.query(ExamSessionAnswer)
        .join(ExamSession, ExamSession.id == ExamSessionAnswer.session_id)
        .filter(ExamSession.user_id == current_user.id)
        .filter(ExamSessionAnswer.time_spent_seconds.isnot(None))
        .filter(ExamSessionAnswer.time_spent_seconds > 0)
    )

    agg = base.with_entities(
        sqlfunc.count().label("cnt"),
        sqlfunc.avg(ExamSessionAnswer.time_spent_seconds).label("avg"),
    ).first()

    total_count = agg.cnt or 0
    avg_seconds = round(float(agg.avg or 0), 1)

    median_seconds = 0
    if total_count > 0:
        mid = total_count // 2
        median_row = (
            base.with_entities(ExamSessionAnswer.time_spent_seconds)
            .order_by(ExamSessionAnswer.time_spent_seconds)
            .offset(mid)
            .limit(1)
            .first()
        )
        median_seconds = median_row.time_spent_seconds if median_row else 0

    section_rows = (
        base.join(Question, Question.id == ExamSessionAnswer.question_id)
        .with_entities(
            Question.section,
            sqlfunc.count().label("total"),
            sqlfunc.avg(ExamSessionAnswer.time_spent_seconds).label("avg_time"),
            sqlfunc.avg(
                case(
                    (ExamSessionAnswer.correct == True, ExamSessionAnswer.time_spent_seconds),  # noqa: E712
                    else_=None,
                )
            ).label("correct_avg"),
            sqlfunc.avg(
                case(
                    (ExamSessionAnswer.correct == False, ExamSessionAnswer.time_spent_seconds),  # noqa: E712
                    else_=None,
                )
            ).label("incorrect_avg"),
        )
        .group_by(Question.section)
        .all()
    )

    by_section = [
        {
            "name": row.section,
            "avg_seconds": round(float(row.avg_time or 0), 1),
            "correct_avg": round(float(row.correct_avg or 0), 1),
            "incorrect_avg": round(float(row.incorrect_avg or 0), 1),
            "total": row.total,
        }
        for row in section_rows
    ]

    return {
        "avg_seconds": avg_seconds,
        "median_seconds": median_seconds,
        "by_section": sorted(by_section, key=lambda s: s["avg_seconds"], reverse=True),
    }


@router.get("/trends")
def get_trends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Weekly accuracy trends by section (top 8 sections by volume).

    Aggregation is done in SQL to avoid loading all rows into memory.
    """
    top_sections_q = (
        db.query(UserProgress.section, sqlfunc.count().label("cnt"))
        .filter(UserProgress.user_id == current_user.id)
        .group_by(UserProgress.section)
        .order_by(sqlfunc.count().desc())
        .limit(8)
        .all()
    )
    top_sections = [r.section for r in top_sections_q]
    if not top_sections:
        return []

    week_expr = cast(UserProgress.created_at, SADate)

    rows = (
        db.query(
            UserProgress.section,
            week_expr.label("day"),
            sqlfunc.count().label("total"),
            sqlfunc.sum(case((UserProgress.correct == True, 1), else_=0)).label("correct"),  # noqa: E712
        )
        .filter(
            UserProgress.user_id == current_user.id,
            UserProgress.section.in_(top_sections),
        )
        .group_by(UserProgress.section, "day")
        .order_by(UserProgress.section, "day")
        .all()
    )

    section_weeks: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        d = row.day
        if isinstance(d, str):
            d = datetime.fromisoformat(d).date()
        week_start = (d - timedelta(days=d.weekday())).isoformat()
        section_weeks[row.section].append({
            "week": week_start,
            "total": row.total,
            "correct": int(row.correct or 0),
        })

    result = []
    for section in top_sections:
        merged: dict[str, dict] = {}
        for entry in section_weeks.get(section, []):
            w = entry["week"]
            if w in merged:
                merged[w]["total"] += entry["total"]
                merged[w]["correct"] += entry["correct"]
            else:
                merged[w] = {"total": entry["total"], "correct": entry["correct"]}
        weeks = []
        for wk in sorted(merged):
            d = merged[wk]
            acc = round((d["correct"] / d["total"]) * 100) if d["total"] else 0
            weeks.append({"week": wk, "total": d["total"], "correct": d["correct"], "accuracy": acc})
        result.append({"section": section, "weeks": weeks})

    return result


def _serialize_created_at(value):
    """Normalize created_at for JSON (SQLite may return str or datetime)."""
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


@router.post("", response_model=ProgressRecordResponse)
def record_progress(
    data: ProgressRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record one answer (append; multiple attempts allowed)."""
    try:
        rec = UserProgress(
            user_id=current_user.id,
            question_id=data.question_id,
            section=data.section,
            correct=data.correct,
            answer_selected=data.answer_selected,
        )
        db.add(rec)
        db.flush()
        # Build response explicitly to avoid ORM->Pydantic issues (e.g. SQLite datetime)
        return ProgressRecordResponse(
            id=rec.id,
            user_id=rec.user_id,
            question_id=rec.question_id,
            correct=rec.correct,
            answer_selected=rec.answer_selected,
            section=rec.section,
            created_at=_serialize_created_at(rec.created_at),
        )
    except IntegrityError as e:
        db.rollback()
        logger.warning("Progress record IntegrityError: %s", e)
        raise HTTPException(
            status_code=400,
            detail="Invalid question_id or user: question may not exist in the database.",
        ) from e
    except Exception as e:
        logger.exception("Progress record failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e
