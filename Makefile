.PHONY: dev setup backend frontend seed

dev:
	npx concurrently "cd backend && PYTHONPATH=. .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8001" "cd frontend && npm run dev"

setup:
	cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
	cd frontend && npm install

backend:
	cd backend && PYTHONPATH=. .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8001

frontend:
	cd frontend && npm run dev

# Seed questions from step2ck/data/all_questions.json (run once after setup, or after adding new data)
seed:
	cd backend && PYTHONPATH=. .venv/bin/python scripts/seed_questions.py
