.PHONY: dev setup backend frontend migrate seed

dev:
	npx concurrently "cd backend && PYTHONPATH=. .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8001" "cd frontend && npm run dev"

setup:
	cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
	cd frontend && npm install

backend:
	cd backend && PYTHONPATH=. .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8001

frontend:
	cd frontend && npm run dev

# Create/update DB tables (run once after setup, then after schema changes)
migrate:
	cd backend && .venv/bin/alembic upgrade head

# Seed questions from step2ck/data/all_questions.json or data/allquestions.json (run after migrate)
seed:
	cd backend && PYTHONPATH=. .venv/bin/python scripts/seed_questions.py

# Diagnose why questions might not show (data path, DB, count)
check-questions:
	cd backend && PYTHONPATH=. .venv/bin/python scripts/check_questions.py
