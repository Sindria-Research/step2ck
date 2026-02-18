# Question data

- **`all_questions.json`** — Consolidated list of questions. Format: array of objects with `id`, `section`, `questionStem`, `choices`, `correctAnswer`, `correctExplanation`, `incorrectExplanation`, etc. (camelCase or snake_case; seed script normalizes.)
- Seed the database: from repo root, `cd backend && python scripts/seed_questions.py` (uses `../data/all_questions.json` by default) or `python scripts/seed_questions.py /path/to/all_questions.json`.

Do not commit the CMS source folder; this folder contains only the consolidated `all_questions.json` for production use.
