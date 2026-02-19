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
- [x] Performance page (dedicated analytics with trend/section charts)
- [x] Search page (keyword + section filtering)
- [x] Notes system (create, edit, delete, question-linked or freeform)
- [x] Flashcards with SM-2 spaced repetition (decks, cards, review mode)
- [x] Bookmarks (save questions for later review)
- [x] Grouped sidebar navigation (Study / QBank / Tools)
- [x] Chiron branding and design system
- [x] Google OAuth via Supabase (full flow: frontend button, Supabase auth, backend JWKS verification)
- [x] Supabase JWKS token verification (ES256/RS256/EdDSA with cached key discovery)
- [x] Bookmark toggle on exam question panel
- [x] Bookmark count badge in sidebar
- [x] Exam session auto-creation on exam start
- [x] Retake from Previous Tests (regenerate same config)

## In Progress

### Exam Sessions Integration
- [ ] Wire individual question answers to ExamSessionAnswer records (answers recorded but not persisted to session)
- [ ] Enable review mode from Previous Tests (load session answers + questions instead of regenerating)

### Notes Integration
- [ ] Add quick-note button on exam explanation panel
- [ ] Pre-fill note with question context when created from exam

## Planned

### Auth
- [ ] Email/password registration + email verification
- [ ] Refresh tokens for longer sessions

### Study Features
- [ ] Timed exam mode with countdown timer
- [ ] Study planner / scheduler (daily tasks, weekly focus)
- [ ] Score prediction engine
- [ ] Onboarding flow (exam date, target score, specialty)

### Content
- [ ] Expand question bank with additional sections
- [ ] AI-generated flashcards from incorrect questions
- [ ] Medical library / reference content organized by system

### DevOps
- [ ] Docker Compose for local dev (frontend, backend, DB)
- [ ] CI pipeline (lint, test, build on push)
- [ ] Staging environment
- [ ] Automated backups

### Polish
- [ ] Export progress data (CSV/PDF)
- [ ] Keyboard shortcuts for exam navigation
- [ ] Accessibility audit (focus management, screen readers)
- [ ] Mobile-responsive refinements
