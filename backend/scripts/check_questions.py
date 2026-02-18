#!/usr/bin/env python3
"""Diagnose why questions might not show up: data file path, DB connection, and question count."""
import sys
from pathlib import Path

# Add parent so app is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

def main():
    repo_root = Path(__file__).resolve().parent.parent.parent
    data_dir = repo_root / "data"
    data_path = data_dir / "all_questions.json"
    alt_path = data_dir / "allquestions.json"

    print("=== Question setup check ===\n")
    print("1. Data file (questions JSON)")
    print(f"   Looking in: {data_dir}")
    print(f"   all_questions.json: {'found' if data_path.exists() else 'NOT FOUND'}")
    print(f"   allquestions.json:  {'found' if alt_path.exists() else 'NOT FOUND'}")
    if not data_path.exists() and not alt_path.exists():
        print("\n   -> Put your questions in step2ck/data/all_questions.json (or allquestions.json)")
        print("      Then run from project root: make seed")
        sys.exit(1)

    print("\n2. Database")
    try:
        from app.config import get_settings
        from app.db.session import SessionLocal
        from app.models import Question

        settings = get_settings()
        print(f"   DATABASE_URL: {settings.DATABASE_URL}")
        db = SessionLocal()
        try:
            count = db.query(Question).count()
            sections = [r[0] for r in db.query(Question.section).distinct().all()]
            print(f"   Questions in DB: {count}")
            print(f"   Sections: {len(sections)} ", end="")
            if sections:
                print("(" + ", ".join(sections[:5]) + ("..." if len(sections) > 5 else "") + ")")
            else:
                print("(none)")
            if count == 0:
                print("\n   -> DB has no questions. From project root run: make migrate && make seed")
                sys.exit(1)
        finally:
            db.close()
    except Exception as e:
        print(f"   Error: {e}")
        print("\n   -> Run from project root: make migrate  (creates/updates tables)")
        sys.exit(1)

    print("\n3. Summary")
    print("   Data file and DB look OK. If the app still shows 0 questions:")
    print("   - Restart the backend (make dev or make backend)")
    print("   - Hard-refresh the frontend (or reopen the New Test page)")
    print()

if __name__ == "__main__":
    main()
