# Chiron

Step 2 CK clinical reasoning and study platform. Practice questions, spaced-repetition flashcards, performance analytics, AI explanations, and personalized exam modes — all in one place. Built with **Vite + React + TypeScript + Tailwind** and **FastAPI + SQLAlchemy**.

## Structure

```
├── frontend/          Vite + React (TS) + Tailwind
├── backend/           FastAPI + uvicorn, SQLAlchemy 2.x, Alembic
├── data/              Question bank JSON
├── docs/              AUTH.md, PLANS_AND_TIERS.md
├── FRONTEND.md        Design tokens, component system, patterns
├── DEPLOY.md          Production readiness checklist
├── PRD.md             Full product requirements document
├── bugs.md            Known issues and tech debt
└── todo.md            Remaining work and roadmap
```

## Features

| Area | What's built |
|------|-------------|
| **QBank** | Create tests (all / unused / incorrect / personalized modes), section filtering, question count, exam interface with explanations |
| **Previous Tests** | Browse past exam sessions, accuracy metrics, review/retake/delete |
| **Performance** | Dedicated analytics — trend charts, section breakdown, progress grid, focus areas |
| **Search** | Keyword + section search across the question bank |
| **Notes** | Create, edit, and organize personal notes (freeform or per-question) |
| **Flashcards** | Deck management with SM-2 spaced repetition, due-card review mode |
| **Bookmarks** | Save questions for later review |
| **AI Explanations** | OpenAI-powered contextual explanations for questions and selected text |
| **Lab Values** | Reference lab values page |
| **Dashboard** | Overview stats, analytics charts, section performance, goal tracking, quick actions |
| **Dark Mode** | Full light/dark theme with CSS variable tokens |

## Run locally

**First-time setup (from project root):**

```bash
make setup    # backend venv + deps, frontend npm install
make migrate  # create/update DB tables
make seed     # load questions from data/all_questions.json
make dev      # start backend + frontend
```

Then open http://localhost:5173 and use **Continue in Demo Mode** on the login page.

### Backend (manual)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
PYTHONPATH=. uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server proxies `/api` to `http://127.0.0.1:8001`.

### Seed questions

```bash
make seed
# Or manually:
cd backend && PYTHONPATH=. .venv/bin/python scripts/seed_questions.py ../data/all_questions.json --clear
```

## API routes

| Prefix | Endpoints | Purpose |
|--------|-----------|---------|
| `/auth` | login, google, me | Authentication |
| `/questions` | list, get, sections | Question bank |
| `/progress` | list, stats, record | Answer tracking |
| `/exams` | generate | Exam generation |
| `/exam-sessions` | CRUD + list | Test session history |
| `/notes` | CRUD + list | User notes |
| `/flashcards` | decks CRUD, cards CRUD, review, due | Flashcards + spaced repetition |
| `/bookmarks` | list, create, delete, check | Saved questions |
| `/ai` | explain | AI explanations |
| `/health` | health, health/db | Liveness + DB checks |

## Data model

| Table | Purpose |
|-------|---------|
| `users` | Email, display name, auth provider, plan |
| `questions` | Question bank (seeded from JSON) |
| `user_progress` | One row per answer attempt |
| `exam_sessions` | Test session metadata (mode, scores, timestamps) |
| `exam_session_answers` | Per-question answers within a session |
| `notes` | User notes (optional question/section link) |
| `flashcard_decks` | Flashcard deck metadata |
| `flashcards` | Individual cards with SM-2 scheduling fields |
| `bookmarks` | Saved question references |

## Navigation

The sidebar is organized into three groups:

- **Study** — Dashboard
- **QBank** — New Test, Previous Tests, Performance, Search
- **Tools** — Notes, Flashcards, Bookmarks, Lab Values

## Flashcards: import & export

Flashcards support **import** from text in formats used by Quizlet and similar tools:

- **One card per line**, with front and back separated by **tab**, **comma**, or **semicolon**.
- Example: `term\tdefinition` (Quizlet-style) or `question,answer` (CSV).
- In the app: open a deck → **Import** → paste your text → Import.

**Export** downloads the current deck as tab-delimited `.txt`, which you can re-import here or into other apps. Anki uses a different format (`.apkg`, a packaged archive); for Anki you can export from Anki as plain text/CSV if available, or use a converter.

## Env vars

**Backend** (in `.env` or deploy environment):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./step2ck.db` | DB URL (use Postgres in prod) |
| `SECRET_KEY` | (change in production) | JWT signing key |
| `GOOGLE_CLIENT_ID` | (empty) | Google OAuth client ID |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed origins |
| `LOG_LEVEL` | `INFO` | Logging level |
| `AI_API_KEY` | (empty) | OpenAI API key for AI explanations |
| `AI_MODEL` | `gpt-4o-mini` | AI model to use |
| `AI_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible API base |

**Frontend** (build-time):

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` in dev | API base URL |
| `VITE_APP_NAME` | `Chiron` | App name |
| `VITE_APP_TAGLINE` | Deliberate Step 2 CK preparation | Tagline |
| `VITE_LOGO_URL` | `/logo.svg` | Logo path |

## Production

See **[DEPLOY.md](DEPLOY.md)** for the full production checklist. Summary:

1. Set `DATABASE_URL` to Postgres, run `alembic upgrade head`
2. Set `SECRET_KEY` (`openssl rand -hex 32`)
3. Set `CORS_ORIGINS` to your frontend origin
4. Set `AI_API_KEY` for AI explanations
5. Build frontend with `VITE_API_URL`, serve `dist/`
6. Enforce HTTPS
