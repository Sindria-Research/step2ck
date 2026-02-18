# step2ck

Step 2 CK preparation app: practice questions, progress tracking, and exam modes. Built with a **Vite + React + TypeScript + Tailwind** frontend and **FastAPI + SQLAlchemy** backend.

## Structure

- **`frontend/`** — Vite + React (TS) + Tailwind. UI follows [FRONTEND.md](FRONTEND.md) (design tokens, dark mode, component system).
- **`backend/`** — FastAPI + uvicorn, SQLAlchemy 2.x, Alembic. SQLite for dev, Postgres-ready for production.
- **`bugs.md`** — Known issues and tech debt.
- **`todo.md`** — Future work (auth, features, DevOps, content).

## Run locally

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
# Optional: set DATABASE_URL, SECRET_KEY, etc. in .env
alembic upgrade head
python scripts/seed_questions.py   # uses scripts/mock_questions.json if no path given
PYTHONPATH=. uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server proxies `/api` to `http://127.0.0.1:8001`, so the app talks to the backend without CORS. Open http://localhost:5173 and use **Continue in Demo Mode** on the login page.

### Seed more questions

Point the seed script at a JSON file with the same shape as `backend/scripts/mock_questions.json` (camelCase or snake_case):

```bash
cd backend
PYTHONPATH=. python scripts/seed_questions.py /path/to/all_questions.json
# Or with --clear to replace existing questions
PYTHONPATH=. python scripts/seed_questions.py /path/to/all_questions.json --clear
```

## Env vars

**Backend** (optional; defaults in `backend/app/config.py`):

| Variable        | Default                    | Description                    |
|----------------|----------------------------|--------------------------------|
| `DATABASE_URL` | `sqlite:///./step2ck.db`   | DB URL (use Postgres in prod). |
| `SECRET_KEY`   | (change in production)     | JWT signing key.               |
| `CORS_ORIGINS` | `["http://localhost:5173"]`| Allowed origins.               |
| `LOG_LEVEL`    | `INFO`                     | Logging level.                 |

**Frontend** (optional):

| Variable           | Default   | Description              |
|--------------------|-----------|--------------------------|
| `VITE_API_URL`     | `/api` in dev | API base (e.g. `https://api.example.com` in prod). |
| `VITE_APP_NAME`    | `step2ck` | App name in header/login. |
| `VITE_APP_TAGLINE` | Step 2 CK preparation | Tagline on login.   |
| `VITE_LOGO_URL`    | `/logo.svg` | Logo path.            |

## Production

- Set `DATABASE_URL` to a Postgres URL and run `alembic upgrade head`.
- Set `SECRET_KEY` (e.g. `openssl rand -hex 32`).
- Set `CORS_ORIGINS` to your frontend origin(s).
- Build frontend: `cd frontend && npm run build`. Serve `dist/` and point `VITE_API_URL` to your backend.
