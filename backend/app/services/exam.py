"""Exam generation service: filter, shuffle, personalize."""
import random
from typing import List

from sqlalchemy.orm import Session

from app.models import Question, UserProgress
from app.models.question import QUESTION_STATUS_READY, QUESTION_STATUS_INCOMPLETE

USABLE_STATUSES = [QUESTION_STATUS_READY, QUESTION_STATUS_INCOMPLETE]


def _shuffle(items: List[Question]) -> List[Question]:
    out = list(items)
    for i in range(len(out) - 1, 0, -1):
        j = random.randint(0, i)
        out[i], out[j] = out[j], out[i]
    return out


def _get_user_progress(db: Session, user_id: str) -> List[dict]:
    rows = (
        db.query(UserProgress.question_id, UserProgress.correct)
        .filter(UserProgress.user_id == user_id)
        .all()
    )
    return [{"question_id": r.question_id, "correct": r.correct} for r in rows]


def generate_personalized_queue(
    questions: List[Question], user_progress: List[dict]
) -> List[Question]:
    """Priority: never seen, then incorrect (by count), then correct (shuffled)."""
    progress_map = {}
    incorrect_counts = {}
    for p in user_progress:
        qid = p["question_id"]
        if qid not in progress_map:
            progress_map[qid] = {"answered": True, "correct": p["correct"]}
        if not p["correct"]:
            incorrect_counts[qid] = incorrect_counts.get(qid, 0) + 1

    never_seen = []
    incorrect_list = []
    correct_list = []
    for q in questions:
        prog = progress_map.get(q.id)
        if not prog:
            never_seen.append(q)
        elif not prog["correct"]:
            incorrect_list.append((q, incorrect_counts.get(q.id, 1)))
        else:
            correct_list.append(q)

    incorrect_list.sort(key=lambda x: -x[1])
    incorrect_questions = [x[0] for x in incorrect_list]
    return _shuffle(never_seen) + incorrect_questions + _shuffle(correct_list)


def generate_exam(
    db: Session,
    user_id: str,
    subjects: List[str],
    mode: str,
    count: int,
) -> List[Question]:
    """Return list of questions for the exam."""
    q = db.query(Question).filter(
        Question.section.in_(subjects),
        Question.status.in_(USABLE_STATUSES),
    )
    filtered = q.all()
    if not filtered:
        return []

    progress = _get_user_progress(db, user_id)

    if mode == "unused":
        answered_ids = {p["question_id"] for p in progress}
        filtered = [q for q in filtered if q.id not in answered_ids]
    elif mode == "incorrect":
        incorrect_ids = {p["question_id"] for p in progress if not p["correct"]}
        filtered = [q for q in filtered if q.id in incorrect_ids]
    elif mode == "personalized":
        queue = generate_personalized_queue(filtered, progress)
        return queue[:max(1, count)]

    shuffled = _shuffle(filtered)
    return shuffled[:count]
