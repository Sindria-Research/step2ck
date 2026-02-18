# step2ck

Step 2 CK preparation app: practice questions, progress tracking, and exam modes. Built with a **Vite + React + TypeScript + Tailwind** frontend and **FastAPI + SQLAlchemy** backend.

## Structure

- **`frontend/`** — Vite + React (TS) + Tailwind. UI follows [FRONTEND.md](FRONTEND.md) (design tokens, dark mode, component system).
- **`backend/`** — FastAPI + uvicorn, SQLAlchemy 2.x, Alembic. SQLite for dev, Postgres-ready for production.
- **`bugs.md`** — Known issues and tech debt.
- **`todo.md`** — Future work (auth, features, DevOps, content).

## Run locally

**First-time setup (from project root):**

```bash
make setup    # backend venv + deps, frontend npm install
make migrate  # create/update DB tables (backend)
make seed     # load questions from data/all_questions.json or data/allquestions.json
make dev      # backend + frontend
```

Then open http://localhost:5173 and use **Continue in Demo Mode** on the login page.

### Backend (manual)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
# Optional: set DATABASE_URL, SECRET_KEY, etc. in .env
alembic upgrade head
make seed   # from project root, or: PYTHONPATH=. python scripts/seed_questions.py
PYTHONPATH=. uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server proxies `/api` to `http://127.0.0.1:8001`, so the app talks to the backend without CORS.

### Seed questions (integrate test bank)

Questions live in **`data/all_questions.json`** (or **`data/allquestions.json`**). Seed the database once after setup:

```bash
make seed
# Optional: pass a path or --clear to replace existing
#   cd backend && PYTHONPATH=. .venv/bin/python scripts/seed_questions.py ../data/all_questions.json --clear
```

**Important:** Run all `make` commands from the **project root** (the folder that contains `backend/`, `frontend/`, and `data/`). If you're in a parent folder or only in `backend/`, paths will be wrong.

### If the app still shows "0 questions"

1. From the project root, run:
   ```bash
   make check-questions
   ```
   This prints whether the data file was found, how many questions are in the DB, and what’s wrong if something isn’t set up.

2. If it says "Data file ... NOT FOUND", you’re likely in the wrong directory. `cd` into the project folder that has `data/all_questions.json`, then run `make check-questions` and `make seed` again.

3. If it says "Questions in DB: 0", run:
   ```bash
   make migrate
   make seed
   ```
   then restart the app (`make dev`).

4. If it shows thousands of questions in the DB but the app still shows 0, the frontend may not be talking to this backend. Restart both with `make dev`, open http://localhost:5173 (not 127.0.0.1 or another port), and hard-refresh the page (e.g. Cmd+Shift+R). Ensure no other backend is running on port 8001.

## Auth and users

- **Authorization:** The frontend sends `Authorization: Bearer <token>` on all API calls except login. The backend uses this to identify the user and scope progress/stats/exams to them. See **[docs/AUTH.md](docs/AUTH.md)** for the full flow and how to require auth in production or add Google OAuth.
- **Google OAuth:** Placeholder only for now (“Sign in with Google (coming soon)” on the login page). Backend `POST /auth/google` and user fields (`auth_provider`, `google_id`) are in place; see `docs/AUTH.md` for what to do when you enable it.
- **Plans / tiers:** There are no account levels (e.g. free vs pro) today; all users have the same access. See **[docs/PLANS_AND_TIERS.md](docs/PLANS_AND_TIERS.md)** for how to add tiers later (User.plan, limits, feature gating, billing).
- **Email/password:** Backend support exists; registration UI can be added.
- **Demo mode:** Without a token, the app uses a single shared demo user. Progress for the demo user is stored in the DB.
- **User-specific data:** Stats, progress, and exam modes (e.g. “unused” / “incorrect”) are scoped to the current user. Each user has their own progress records and dashboard stats.

## Data model (modular)

- **Questions** live in the `questions` table (seeded from `data/all_questions.json`). Add or update questions by editing the JSON and running `make seed` (optionally with `--clear`). The exam engine filters by section and mode from this table.
- **Users** have `email`, `display_name`, `avatar_url`, `auth_provider` (e.g. `google`, `email`, `demo`), and optional `google_id`.
- **User progress** is one row per answer (`user_id`, `question_id`, `section`, `correct`, `answer_selected`). Used for stats, “unused” (never answered), and “incorrect” (previously wrong) modes.

## Env vars

**Backend** (optional; defaults in `backend/app/config.py`):

| Variable           | Default                    | Description                    |
|--------------------|----------------------------|--------------------------------|
| `DATABASE_URL`     | `sqlite:///./step2ck.db`   | DB URL (use Postgres in prod). |
| `SECRET_KEY`       | (change in production)     | JWT signing key.               |
| `GOOGLE_CLIENT_ID` | (empty)                    | Google OAuth client ID (verifies ID tokens). |
| `CORS_ORIGINS`     | `["http://localhost:5173"]`| Allowed origins.               |
| `LOG_LEVEL`        | `INFO`                     | Logging level.                 |

**Frontend** (optional):

| Variable               | Default   | Description              |
|------------------------|-----------|--------------------------|
| `VITE_API_URL`         | `/api` in dev | API base (e.g. `https://api.example.com` in prod). |
| `VITE_GOOGLE_CLIENT_ID`| (empty)   | Google OAuth client ID (enables “Sign in with Google”). |
| `VITE_APP_NAME`        | `step2ck` | App name in header/login. |
| `VITE_APP_TAGLINE`     | Step 2 CK preparation | Tagline on login.   |
| `VITE_LOGO_URL`        | `/logo.svg` | Logo path.            |

## Production

See **[DEPLOY.md](DEPLOY.md)** for a full production checklist (must-have, should-have, env vars, deploy order).

Summary:
- Set `DATABASE_URL` to a Postgres URL and run `alembic upgrade head`.
- Set `SECRET_KEY` (e.g. `openssl rand -hex 32`).
- Set `CORS_ORIGINS` to your frontend origin(s) (comma-separated: `https://app.com,https://www.app.com`).
- Build frontend with `VITE_API_URL` set; serve `dist/` and enforce HTTPS.
