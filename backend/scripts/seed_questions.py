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
        # Default: use in-repo data (all_questions.json or allquestions.json), then mock
        repo_root = Path(__file__).resolve().parent.parent.parent
        data_dir = repo_root / "data"
        data_path = data_dir / "all_questions.json"
        alt_data_path = data_dir / "allquestions.json"
        mock_path = Path(__file__).resolve().parent / "mock_questions.json"
        if data_path.exists():
            questions_data = load_json(data_path)
            print(f"Using {data_path}")
        elif alt_data_path.exists():
            questions_data = load_json(alt_data_path)
            print(f"Using {alt_data_path}")
        elif mock_path.exists():
            questions_data = load_json(mock_path)
            print(f"Using {mock_path}")
        else:
            print("No json_path given and no default file found.")
            print(f"  Checked: {data_path}")
            print(f"           {alt_data_path}")
            print("  Put all_questions.json (or allquestions.json) in the project's data/ folder.")
            print("  Usage: python seed_questions.py [path-to-questions.json]")
            sys.exit(1)

    print(f"Loaded {len(questions_data)} questions from JSON.")
    if len(questions_data) == 0:
        print("No questions in file. Check that the JSON is an array of question objects.")
        sys.exit(1)

    with get_db_context() as db:
        if args.clear:
            db.query(Question).delete()
            print("Cleared existing questions.")
        inserted = 0
        updated = 0
        skipped = 0
        for raw in questions_data:
            q = normalize_question(raw)
            if not q["id"] or not q["question_stem"]:
                skipped += 1
                continue
            existing = db.query(Question).filter(Question.id == q["id"]).first()
            if existing:
                for k, v in q.items():
                    setattr(existing, k, v)
                updated += 1
            else:
                db.add(Question(**q))
                inserted += 1
        print(f"Done: {inserted} inserted, {updated} updated, {skipped} skipped.")
        print(f"Total in DB: {inserted + updated} (from {len(questions_data)} in file).")


if __name__ == "__main__":
    main()
