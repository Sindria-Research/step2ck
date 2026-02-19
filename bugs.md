# Known issues and tech debt

## Active

- ~~**Exam sessions not persisted:** Session is now created on exam start, per-answer data (answer_selected, correct, time_spent_seconds) is persisted on submit and batch-updated on finish, and session aggregate counts are PATCHed on completion.~~
- **Personalized mode single-fetch:** Personalized mode fetches one question per request when clicking "Next"; consider batching or prefetching for smoother UX.
- **Demo mode progress:** Stored in the database for the single demo user; clearing the DB or redeploying resets it.
- **Focus management:** When opening modals or moving between question panels, focus is not always moved for screen readers.
- **Search is client-side filtered:** The search page fetches questions then filters in-browser. For large question banks, this should move to a backend full-text search endpoint.
- **Flashcard deck card_count:** The `card_count` field on decks is manually incremented/decremented. Deleting cards outside the API (e.g., direct DB edit) can cause drift. Consider a computed field or periodic sync.
- **Bookmark question hydration:** The Bookmarks page fetches each question individually. For many bookmarks, this creates N+1 requests. A batch endpoint would be better.

## Resolved

- ~~Dashboard refetch: now refetches stats on navigation back (uses module flag for initial load)~~
- ~~React hooks ordering violation in ExplanationPanel (fixed via optional chaining in deps)~~
- ~~Goal card misalignment in dashboard stats row (fixed with consistent card heights)~~
- ~~TypeScript build errors from unused imports (cleaned up across multiple passes)~~
