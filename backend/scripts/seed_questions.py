#!/usr/bin/env python3
"""Seed questions from JSON file. JSON can use camelCase (questionStem, etc.) or snake_case."""
import json
import os
import sys
from pathlib import Path

# Add parent so app is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import get_db_context
from app.models import Question


def normalize_question(raw: dict) -> dict:
    """Map camelCase keys to snake_case for DB."""
    return {
        "id": raw.get("id") or raw.get("question_id", ""),
        "section": raw.get("section", ""),
        "subsection": raw.get("subsection"),
        "question_number": raw.get("question_number") or raw.get("questionNumber"),
        "system": raw.get("system"),
        "question_stem": raw.get("question_stem") or raw.get("questionStem", ""),
        "choices": raw.get("choices", {}),
        "correct_answer": raw.get("correct_answer") or raw.get("correctAnswer", ""),
        "correct_explanation": raw.get("correct_explanation") or raw.get("correctExplanation"),
        "incorrect_explanation": raw.get("incorrect_explanation") or raw.get("incorrectExplanation"),
    }


def load_json(path: Path) -> list:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, list) else [data]


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Seed questions from JSON")
    parser.add_argument("json_path", nargs="?", help="Path to all_questions.json or similar")
    parser.add_argument("--clear", action="store_true", help="Delete existing questions before seeding")
    args = parser.parse_args()

    if args.json_path:
        path = Path(args.json_path)
        if not path.exists():
            print(f"File not found: {path}")
            sys.exit(1)
        questions_data = load_json(path)
    else:
        # Default: use mock data from step2ck-mario if available
        candidate = Path(__file__).resolve().parent.parent.parent.parent / "step2ck-mario" / "output" / "all_questions.json"
        if candidate.exists():
            questions_data = load_json(candidate)
            print(f"Using {candidate}")
        else:
            # Minimal in-repo mock for dev (no external file)
            mock_path = Path(__file__).resolve().parent / "mock_questions.json"
            if mock_path.exists():
                questions_data = load_json(mock_path)
            else:
                print("No json_path given and no step2ck-mario/output/all_questions.json or scripts/mock_questions.json found.")
                print("Usage: python seed_questions.py <path-to-all_questions.json>")
                sys.exit(1)

    with get_db_context() as db:
        if args.clear:
            db.query(Question).delete()
            print("Cleared existing questions.")
        for raw in questions_data:
            q = normalize_question(raw)
            if not q["id"] or not q["question_stem"]:
                continue
            existing = db.query(Question).filter(Question.id == q["id"]).first()
            if existing:
                for k, v in q.items():
                    setattr(existing, k, v)
            else:
                db.add(Question(**q))
        print(f"Seeded {len(questions_data)} questions.")


if __name__ == "__main__":
    main()
