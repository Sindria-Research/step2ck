# Known Issues & Tech Debt

## Active

- **Exam session answers not linked:** Exam sessions are created on start and updated on finish, but individual question answers are only recorded to the `progress` table. They are not persisted as `ExamSessionAnswer` rows on the session. Review mode from Previous Tests cannot replay exact answers.
- **Personalized mode single-fetch:** Personalized mode fetches one question per request when clicking "Next"; consider batching or prefetching for smoother UX.
- **Demo mode progress:** Stored in the database for the single demo user; clearing the DB or redeploying resets it.
- **Focus management:** When opening modals or moving between question panels, focus is not always moved for screen readers.
- **Search is client-side filtered:** The search page fetches questions then filters in-browser. For large question banks, this should move to a backend full-text search endpoint.
- **Flashcard deck card_count:** The `card_count` field on decks is manually incremented/decremented. Deleting cards outside the API (e.g., direct DB edit) can cause drift. Consider a computed field or periodic sync.
- **Bookmark question hydration:** The Bookmarks page fetches each question individually. For many bookmarks, this creates N+1 requests. A batch endpoint would be better.
- **No security headers:** Missing CSP, X-Frame-Options, HSTS, X-Content-Type-Options. Should be added as middleware before launch.
- **Legal pages are placeholders:** ToS and Privacy Policy pages exist at /tos and /privacy but contain placeholder content.
- **No 404 page:** Unknown routes redirect to /dashboard instead of showing a proper 404.
- **Bundle size:** Frontend bundle is ~743KB. Should be profiled and reduced before launch.

## Resolved

- ~~Dashboard refetch: now refetches stats on navigation back (uses module flag for initial load)~~
- ~~React hooks ordering violation in ExplanationPanel (fixed via optional chaining in deps)~~
- ~~Goal card misalignment in dashboard stats row (fixed with consistent card heights)~~
- ~~TypeScript build errors from unused imports (cleaned up across multiple passes)~~
- ~~Retake button broken after finishing a test: `initialLoadDone` ref in ExamView stayed `true` when navigating to the same `/exam` route, preventing reload. Fixed by adding a reset-detection effect that clears the guard when exam state is emptied.~~
