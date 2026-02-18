# Production readiness & deploy guide

Use this checklist to make the app **scalable, robust, and resilient** before deploy.

---

## Must-have before deploy

### 1. Environment & config
- [ ] **Postgres:** Set `DATABASE_URL` to a Postgres URL (e.g. managed DB). Run `make migrate` or `alembic upgrade head` against it.
- [ ] **SECRET_KEY:** Set to a strong random value (e.g. `openssl rand -hex 32`). The app should refuse to start in production with the default placeholder (see below).
- [ ] **CORS_ORIGINS:** Set to your frontend origin(s) only (e.g. `https://app.yourdomain.com`). Backend accepts comma-separated in env; default is dev-only.
- [ ] **Frontend build:** Set `VITE_API_URL` to your backend URL (e.g. `https://api.yourdomain.com`). Build with `cd frontend && npm run build` and serve `dist/` (e.g. Nginx, Vercel, Cloudflare Pages).

### 2. Auth & users
- [ ] **Demo mode:** Decide whether to allow unauthenticated (demo) access in production. If not, require a valid JWT for `/progress`, `/exams`, `/auth/me` (see **docs/AUTH.md** – change `get_current_user` to 401 when no token instead of demo user).
- [ ] **Google OAuth (optional):** When ready, follow **docs/AUTH.md** (Google Cloud client ID, env vars, wire frontend button to `loginWithGoogle(idToken)`).

### 3. Data & resilience
- [ ] **Questions:** Seed production DB with questions once: run `make seed` (or `backend/scripts/seed_questions.py`) against production `DATABASE_URL`. Use `data/all_questions.json` or your own JSON.
- [ ] **Backups:** Enable automated backups for the Postgres DB. Plan restore and point-in-time recovery if needed.
- [ ] **Migrations:** Run migrations as part of deploy (e.g. in CI or release script): `alembic upgrade head`.

### 4. Observability & health
- [ ] **Health checks:** Use `GET /health` (liveness) and `GET /health/db` (DB connectivity) for load balancer or orchestrator health checks.
- [ ] **Logging:** Keep `LOG_LEVEL=INFO` (or `WARNING` in prod). Ensure logs go to a central place (e.g. stdout + platform log aggregation).
- [ ] **Errors:** Backend already returns 500 with generic message and logs the exception; avoid exposing stack traces to clients in production.

### 5. Security
- [ ] **HTTPS:** Serve frontend and API over HTTPS only.
- [ ] **Secrets:** Never commit `.env` or secrets; use platform secrets (e.g. Vercel env, Railway env, GitHub Secrets).
- [ ] **Dependencies:** Run `pip audit` (backend) and `npm audit` (frontend) and fix critical issues.

---

## Should-have (scalable & robust)

### Backend
- [ ] **CORS from env:** Support `CORS_ORIGINS` as a single comma-separated string in production (e.g. `CORS_ORIGINS=https://app.com,https://www.app.com`). Update `config.py` to parse it.
- [ ] **Rate limiting:** Add rate limiting (e.g. slowapi or nginx) on auth and API to prevent abuse.
- [ ] **Connection pooling:** With Postgres, use a connection pool (e.g. SQLAlchemy pool settings or PgBouncer) under load.
- [ ] **Idempotent progress:** Optionally deduplicate progress by (user_id, question_id) so repeated submits don’t bloat the table (e.g. “last attempt” or “best attempt” per question).

### Frontend
- [ ] **Error boundary:** Add a React error boundary so a single component failure doesn’t blank the whole app; show a “Something went wrong” UI and option to reload.
- [ ] **API base URL:** Ensure `VITE_API_URL` is set at build time so the built app points to the right backend.
- [ ] **Hide dev-only UI:** In production build, hide or soften the “No questions in the database, run make seed…” message (e.g. show only “No questions available” or link to support).

### DevOps
- [ ] **Docker:** Add a `Dockerfile` (and optional `docker-compose.yml`) for backend and optionally frontend so deploy is reproducible.
- [ ] **CI:** Add a pipeline (GitHub Actions, etc.) that runs lint, tests (if any), and build on push; optionally run migrations on release.
- [ ] **Staging:** Deploy to a staging environment with production-like config and run a smoke test (login, load exam, submit answer, check dashboard) before production.

---

## Nice-to-have (later)

- [ ] **Refresh tokens:** Extend auth with refresh tokens for longer sessions without re-login.
- [ ] **Email verification:** If you add email/password registration, verify email before full access.
- [ ] **Monitoring:** APM or metrics (e.g. response times, error rate, DB pool usage).
- [ ] **CDN:** Serve frontend static assets from a CDN.
- [ ] **Timed exams, bookmarks, export:** Per PRD/todo; can ship after initial deploy.

---

## Quick reference: env vars for production

| Backend (in deploy env) | Example |
|-------------------------|--------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` |
| `SECRET_KEY` | (32+ byte hex from `openssl rand -hex 32`) |
| `CORS_ORIGINS` | `https://app.yourdomain.com` (or comma-separated) |
| `LOG_LEVEL` | `INFO` or `WARNING` |

| Frontend (build-time) | Example |
|------------------------|--------|
| `VITE_API_URL` | `https://api.yourdomain.com` |

---

## Deploy order (suggested)

1. Create Postgres DB and run migrations.
2. Seed questions.
3. Set backend env vars and deploy API (e.g. Railway, Render, Fly.io).
4. Set `VITE_API_URL`, build frontend, deploy static site (e.g. Vercel, Netlify, Cloudflare Pages).
5. Point your domain(s) at frontend and API; enforce HTTPS.
6. Smoke test: login (demo or Google), start exam, submit answer, check dashboard stats.
