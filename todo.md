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

## In Progress

### Exam Sessions Integration
- [ ] Wire exam completion to auto-create an ExamSession record
- [ ] Wire individual question answers to ExamSessionAnswer records
- [ ] Enable review mode from Previous Tests (load session answers + questions)
- [ ] Enable retake from Previous Tests (regenerate same config)

### Bookmarks Integration
- [ ] Add bookmark toggle to the exam question panel
- [ ] Show bookmark count in sidebar or dashboard

### Notes Integration
- [ ] Add quick-note button on exam explanation panel
- [ ] Pre-fill note with question context when created from exam

## Planned

### Auth
- [ ] Google OAuth (backend ready, frontend button placeholder)
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
