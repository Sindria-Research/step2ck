# Roadmap

## Completed

- [x] Landing page with interactive question preview, feature showcases, animations
- [x] Dashboard with overview stats, analytics charts, section breakdown, goal tracking
- [x] Exam engine (all / unused / incorrect / personalized modes)
- [x] Section-filtered test creation with subject tags
- [x] AI explanations (OpenAI integration with fallback)
- [x] Dark mode with full CSS variable theming
- [x] Lab values reference page
- [x] Previous Tests page (session history, review, retake, delete)
- [x] Practice History page
- [x] Performance page (dedicated analytics with trend/section charts)
- [x] Search page (keyword + section filtering)
- [x] Notes system (create, edit, delete, question-linked or freeform)
- [x] Flashcards with SM-2 spaced repetition (decks, cards, review mode, Anki import)
- [x] Bookmarks (save questions, count badge in sidebar)
- [x] Grouped sidebar navigation (Study / Practice / Test / Review / Tools)
- [x] Chiron branding and design system
- [x] Google OAuth via Supabase (JWKS verification, ES256/RS256/EdDSA)
- [x] Exam session auto-creation and completion tracking
- [x] Retake from Previous Tests (regenerate same config)
- [x] Study plan page (AI-generated plan, calendar, phase breakdown, daily progress widget, quick actions)
- [x] Onboarding flow (exam date, target score, specialty modal)
- [x] Timed exam mode with countdown timer
- [x] Retake button fix (stale load guard in ExamView)
- [x] Rate limiting on auth endpoints (slowapi)
- [x] Alembic database migrations
- [x] Health check endpoints (/health, /health/db)
- [x] Vercel deployment pipeline (GitHub Actions)
- [x] Vercel Analytics integration
- [x] Wire individual question answers to ExamSessionAnswer records (per-answer PATCH + batch update on finish)
- [x] Enable review mode from Previous Tests (hydrates saved answers, supports both test and practice review)
- [x] Quick-note button on exam explanation panel (creates pre-filled note from question context)

---

## In Progress

(none)

---

## Must-Have Before Launch

### Payments & Subscriptions (Stripe)
- [ ] Stripe SDK integration (backend + frontend)
- [ ] Pricing page with plan comparison (Free vs Pro)
- [ ] Checkout session creation endpoint (`POST /billing/checkout`)
- [ ] Stripe webhook handler (`POST /billing/webhook`) for subscription events
- [ ] Customer portal link for subscription management (upgrade/downgrade/cancel)
- [ ] Store Stripe customer ID on user model
- [ ] Feature gating middleware (enforce free-tier limits: question count, AI explanations, etc.)
- [ ] Billing section in Settings (current plan, manage subscription, invoices)
- [ ] Trial period logic (e.g. 7-day free trial of Pro)
- [ ] Graceful downgrade handling (what happens when Pro expires)

### Auth Completeness
- [ ] Email/password registration endpoint with validation
- [ ] Email verification flow (send verification link, verify endpoint)
- [ ] Forgot password / password reset flow (request reset, token generation, reset endpoint)
- [ ] Password change from Settings
- [ ] Account deletion endpoint + UI confirmation flow
- [ ] Password strength validation

### Email Infrastructure
- [ ] Email service integration (SendGrid, Resend, or SES)
- [ ] Email templates (branded HTML)
- [ ] Welcome email on registration
- [ ] Email verification email
- [ ] Password reset email
- [ ] Subscription confirmation / receipt email
- [ ] Subscription cancellation email
- [ ] Failed payment notification email

### Legal & Compliance
- [ ] Complete Terms of Service content (currently placeholder)
- [ ] Complete Privacy Policy content (currently placeholder)
- [ ] Cookie consent banner
- [ ] GDPR data export (user can download their data)
- [ ] GDPR right to deletion (account deletion wipes all user data)
- [ ] Refund policy page

### SEO & Meta
- [ ] Meta description and title tags in index.html
- [ ] Open Graph tags (og:title, og:description, og:image)
- [ ] Twitter Card tags
- [ ] Sitemap.xml generation
- [ ] robots.txt
- [ ] Structured data (JSON-LD for SaaS product)
- [ ] Dynamic page titles per route

### Error Handling & Monitoring
- [ ] Sentry integration (frontend + backend)
- [ ] Dedicated 404 page
- [ ] User-friendly error pages for 500, network failures
- [ ] Uptime monitoring (e.g. BetterUptime, UptimeRobot)

### Security Hardening
- [ ] Security headers middleware (CSP, X-Frame-Options, HSTS, X-Content-Type-Options)
- [ ] Rate limiting on all sensitive endpoints (AI, exam generation, study plan)
- [ ] Input sanitization on all user-facing text fields
- [ ] CSRF protection for state-changing requests
- [ ] Dependency audit automation (npm audit, pip audit in CI)

### Database & Backups
- [ ] Automated daily database backups (cron or managed service)
- [ ] Backup restoration procedure documented and tested
- [ ] Database indexing audit (ensure indexes on frequent query columns)

---

## Should-Have for Scale

### Admin Panel
- [ ] Admin role and permissions system
- [ ] Admin dashboard (user count, subscription metrics, daily active users)
- [ ] User management (view users, edit plans, deactivate accounts)
- [ ] Question bank management (add/edit/review questions via UI)
- [ ] Content quality review pipeline (flag, approve, reject questions)

### Infrastructure
- [ ] Docker Compose for local development (frontend, backend, Postgres)
- [ ] Staging environment (separate from production)
- [ ] CI pipeline (lint, typecheck, test on every push)
- [ ] Database connection pooling (pgbouncer or equivalent)
- [ ] Environment variable validation on startup

### Testing
- [ ] Backend unit tests (auth, progress, exam generation, study plan)
- [ ] Frontend component tests (expand existing Vitest suite)
- [ ] E2E tests (Playwright: login, take exam, view results, retake flow)
- [ ] Test coverage reporting and thresholds
- [ ] CI test execution (block deploy on failure)

### Performance
- [ ] Redis caching for hot paths (question sections, stats, daily summary)
- [ ] HTTP caching headers on static/cacheable API responses
- [ ] Bundle size optimization (currently ~743KB, target <500KB)
- [ ] Image optimization pipeline (if adding images to questions)
- [ ] Database query profiling and slow query logging

### User Experience
- [ ] Data export (CSV/PDF for progress, notes, flashcards)
- [ ] Keyboard shortcuts for exam navigation (documented shortcut panel)
- [ ] Profile editing (display name, avatar)
- [ ] Notification preferences (email frequency, study reminders toggle)
- [ ] Accessibility audit (focus management, ARIA labels, screen reader testing)

---

## Nice-to-Have / Future

### Product Features
- [ ] Score prediction engine (estimate Step 2 CK score from performance data)
- [ ] AI-generated flashcards from incorrect questions
- [ ] Study reminders (daily email or push notification)
- [ ] Social features (leaderboard, study groups)
- [ ] Medical reference library organized by organ system
- [ ] Question discussion / comments per question
- [ ] Spaced repetition for missed questions (auto-resurface)

### Content
- [ ] Expand question bank with additional sections
- [ ] Question images / diagrams support
- [ ] Video explanations for high-yield topics
- [ ] Content versioning and changelog

### Mobile & PWA
- [ ] PWA manifest (installable on mobile home screen)
- [ ] Service worker for offline access to flashcards
- [ ] Mobile-specific touch gestures (swipe between questions)
- [ ] Mobile app icons and splash screens

### Marketing & Growth
- [ ] Referral program (invite friends, get free month)
- [ ] Affiliate/partner program
- [ ] Blog / content marketing pages
- [ ] Testimonials section on landing page
- [ ] Comparison page (vs. UWorld, Amboss, etc.)
- [ ] Email drip campaign for trial users
