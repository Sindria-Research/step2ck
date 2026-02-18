# Known issues and tech debt

- **Dashboard** now refetches stats when you navigate back to it (e.g. after an exam); the first load uses a module flag so returning from an exam updates without a full skeleton.
- **Personalized mode** fetches one question per request when clicking "Next"; consider batching or prefetching for smoother UX.
- **Demo mode progress** is stored in the database for the single demo user; clearing the DB or redeploying resets it.
- **Focus management:** When opening modals or moving between question panels, focus is not always moved for screen readers.
