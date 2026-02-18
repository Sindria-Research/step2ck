# Known issues and tech debt

- **Dashboard does not refresh automatically after completing an exam.** Refresh the page or navigate away and back to see updated stats.
- **Personalized mode** fetches one question per request when clicking "Next"; consider batching or prefetching for smoother UX.
- **Demo mode progress** is stored in the database for the single demo user; clearing the DB or redeploying resets it.
- **Focus management:** When opening modals or moving between question panels, focus is not always moved for screen readers.
