# Production readiness & deploy guide

Use this checklist to make the app **scalable, robust, and resilient** before deploy.

---

## Must-have before deploy

### 1. Environment & config
- [ ] **Postgres:** Set `DATABASE_URL` to a Postgres URL (e.g. managed DB). Run `alembic upgrade head` against it.
- [ ] **SECRET_KEY:** Set to a strong random value (`openssl rand -hex 32`).
- [ ] **CORS_ORIGINS:** Set to your frontend origin(s) only (comma-separated: `https://app.com,https://www.app.com`).
- [ ] **AI_API_KEY:** Set your OpenAI API key for AI explanations. Without it, the fallback explanation engine is used.
- [ ] **Frontend build:** Set `VITE_API_URL` to your backend URL. Build with `cd frontend && npm run build` and serve `dist/`.

### 2. Auth & users
- [ ] **Demo mode:** Decide whether to allow unauthenticated (demo) access in production. If not, require a valid JWT for all protected routes (change `get_current_user` in `deps.py` to 401 when no token).
- [ ] **Google OAuth (optional):** Set `GOOGLE_CLIENT_ID` and wire the frontend button. See `docs/AUTH.md`.

### 3. Data & resilience
- [ ] **Questions:** Seed production DB: `make seed` or `backend/scripts/seed_questions.py` against production `DATABASE_URL`.
- [ ] **Migrations:** Run `alembic upgrade head` as part of deploy. Migration 004 creates tables for exam sessions, notes, flashcards, and bookmarks.
- [ ] **Backups:** Enable automated backups for Postgres. Plan restore and point-in-time recovery.

### 4. Observability & health
- [ ] **Health checks:** `GET /health` (liveness) and `GET /health/db` (DB connectivity) for load balancer health checks.
- [ ] **Logging:** Keep `LOG_LEVEL=INFO` (or `WARNING` in prod). Ensure logs go to a central aggregation service.
- [ ] **Errors:** Backend returns 500 with generic message and logs the exception. No stack traces exposed to clients.

### 5. Security
- [ ] **HTTPS:** Serve frontend and API over HTTPS only.
- [ ] **Secrets:** Never commit `.env` or secrets; use platform secrets (Vercel env, Railway env, etc.).
- [ ] **Dependencies:** Run `pip audit` (backend) and `npm audit` (frontend) and fix critical issues.

---

## Should-have (scalable & robust)

### Backend
- [ ] **Rate limiting:** Add rate limiting on auth and API endpoints (e.g. slowapi or nginx).
- [ ] **Connection pooling:** With Postgres, use SQLAlchemy pool settings or PgBouncer under load.
- [ ] **Idempotent progress:** Optionally deduplicate progress by (user_id, question_id) for "last attempt" or "best attempt" per question.
- [ ] **Full-text search:** Move question search from client-side filtering to a backend endpoint with Postgres full-text search.

### Frontend
- [ ] **Error boundary:** Already implemented — verify it catches all page-level errors.
- [ ] **API base URL:** Ensure `VITE_API_URL` is set at build time.
- [ ] **Code splitting:** Consider lazy-loading page routes to reduce initial bundle size (currently ~743KB).

### DevOps
- [ ] **Docker:** Add `Dockerfile` (and optional `docker-compose.yml`) for reproducible deploys.
- [ ] **CI:** Pipeline for lint, test, build on push. Run migrations on release.
- [ ] **Staging:** Deploy to staging with production-like config and smoke test before production.

---

## Nice-to-have (later)

- [ ] **Refresh tokens:** Extend auth with refresh tokens for longer sessions.
- [ ] **Email verification:** If email/password registration is added, verify email before full access.
- [ ] **Monitoring:** APM or metrics (response times, error rate, DB pool usage).
- [ ] **CDN:** Serve frontend static assets from a CDN.
- [ ] **Timed exams:** Add countdown timer and session timing.

---

## Quick reference: env vars for production

| Backend (in deploy env) | Example |
|-------------------------|--------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` |
| `SECRET_KEY` | (32+ byte hex from `openssl rand -hex 32`) |
| `CORS_ORIGINS` | `https://app.yourdomain.com` |
| `AI_API_KEY` | `sk-...` (OpenAI API key) |
| `AI_MODEL` | `gpt-4o-mini` (default) |
| `AI_BASE_URL` | `https://api.openai.com/v1` (default) |
| `LOG_LEVEL` | `INFO` or `WARNING` |

| Frontend (build-time) | Example |
|------------------------|--------|
| `VITE_API_URL` | `https://api.yourdomain.com` |
| `VITE_APP_NAME` | `Chiron` |

---

## Deploy order (suggested)

1. Create Postgres DB and run `alembic upgrade head` (includes migration 004 for all new tables).
2. Seed questions (`make seed`).
3. Set backend env vars and deploy API (Railway, Render, Fly.io, etc.).
4. Set `VITE_API_URL`, build frontend, deploy static site (Vercel, Netlify, Cloudflare Pages).
5. Point domain(s) at frontend and API; enforce HTTPS.
6. Smoke test: login, start exam, submit answer, check dashboard, create a note, review flashcards.

---

## Backend API surface

All routes require auth (Bearer token) except `/health` and `/auth/login`.

| Prefix | Methods | Tables |
|--------|---------|--------|
| `/auth` | POST login, POST google, GET me | users |
| `/questions` | GET list, GET by ID, GET sections | questions |
| `/progress` | GET list, GET stats, POST record | user_progress |
| `/exams` | POST generate | questions (read) |
| `/exam-sessions` | GET list, POST create, GET/:id, PATCH/:id, DELETE/:id | exam_sessions, exam_session_answers |
| `/notes` | GET list, POST create, GET/:id, PATCH/:id, DELETE/:id | notes |
| `/flashcards` | GET decks, POST deck, PATCH deck, DELETE deck, GET cards, POST card, PATCH card, POST review, DELETE card, GET due | flashcard_decks, flashcards |
| `/bookmarks` | GET list, POST create, DELETE/:id, GET check/:id | bookmarks |
| `/ai` | POST explain | (external API call) |
| `/health` | GET /, GET /db | (no table) |
