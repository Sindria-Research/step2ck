# Plans and tiers (e.g. free vs pro)

**Current state:** The app does **not** have account tiers or plans. Every user has the same access: full question bank, progress tracking, exam modes, and dashboard. The Settings page has a “Billing” section that is placeholder only (“Billing is not yet available”).

---

## What we’d need to add

To support levels like **free** vs **pro** (or more tiers), you’d do the following.

### 1. Backend: user plan/tier

- **User model:** Add a field, e.g. `plan: str` with values like `"free"` | `"pro"` (or `tier`, or `subscription_plan`). Default `"free"` for new users.
- **Migration:** New Alembic migration that adds the column (e.g. `plan VARCHAR(32) NOT NULL DEFAULT 'free'`).
- **Auth/me:** Include `plan` (or equivalent) in the user payload so the frontend knows the current tier. Either:
  - Add `plan` to `UserResponse` in `schemas/user.py` and ensure the User model has the attribute, or
  - Add a separate endpoint like `GET /auth/me` that already returns the user and extend it with `plan`.

### 2. Deciding what each tier can do

Define limits or features per plan, for example:

| Feature / limit        | Free        | Pro          |
|------------------------|------------|-------------|
| Questions per day      | e.g. 50    | Unlimited   |
| Exam modes             | All / Unused | All + Personalized |
| AI explanations        | No         | Yes         |
| Lab values reference   | Yes        | Yes         |
| Export progress        | No         | Yes         |

(These are only examples; you can change them.)

### 3. Enforcing limits in the backend

- **Per request:** In the relevant endpoints (e.g. `POST /progress`, `POST /exams/generate`), load the current user’s `plan` and apply rules:
  - **Rate limits:** e.g. count how many questions the user has answered today; if over the free limit and plan is `"free"`, return 403 or 429 with a clear message.
  - **Feature gates:** e.g. if “personalized” mode is pro-only, check `plan == "pro"` (or similar) before generating a personalized exam; otherwise 403.
- **Central place:** You can add a small module, e.g. `app/services/plans.py`, with constants and helpers like `def can_use_personalized(plan: str) -> bool` and `def daily_question_limit(plan: str) -> int`, and call them from the API.

### 4. Frontend

- **User type:** Extend the `User` type (and API response) with `plan?: string` (or `tier`).
- **Settings / Billing:** Replace the placeholder with:
  - Current plan (e.g. “Free” or “Pro”).
  - For paid: upgrade button or link to billing portal (Stripe, Paddle, etc.); for free: “Upgrade to Pro” CTA.
- **Gating features:** Where a feature is pro-only (e.g. “Explain with AI”, or “Personalized” mode), either hide it for free users or show it disabled with “Upgrade to Pro” (and optionally a usage count for free, e.g. “3/50 questions today”).

### 5. Billing (when you’re ready)

- **Stripe (or similar):** Create products/prices for “Pro” (monthly/yearly). On purchase or subscription creation, call your backend (e.g. `POST /billing/webhook` or `PATCH /auth/me` with a token from the payment provider) to set the user’s `plan` to `"pro"` and optionally store `stripe_customer_id` or `subscription_id` on the user (or in a separate table).
- **Trials:** If you want a trial, you can add `plan_expires_at` (or `trial_ends_at`) and treat “free trial” as pro until that date.

---

## Summary

| Question | Answer |
|----------|--------|
| Do we account for different levels/tiers (e.g. pro vs free)? | **No.** All users are treated the same today. |
| Where is this documented? | Here: **docs/PLANS_AND_TIERS.md**. |
| What’s needed to add tiers? | User field (e.g. `plan`), migration, expose in `/auth/me`, define limits/features per plan, enforce in backend, surface plan and upgrade in frontend (Settings/Billing + feature gating). |
