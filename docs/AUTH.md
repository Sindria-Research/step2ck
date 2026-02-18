# Authentication & authorization

This doc describes how auth works end-to-end and what to do for OAuth (e.g. Google) and production.

---

## 1. How it works today

### Frontend

- **Token storage:** After login (demo or email), the backend returns `{ access_token, user }`. The frontend stores `access_token` in `localStorage` under the key `token` (see `api/request.ts` and `setToken`).
- **Sending the token:** Every API request that does **not** use `skipAuth: true` automatically includes:
  ```http
  Authorization: Bearer <token>
  ```
  if a token exists in `localStorage`. So:
  - **With token:** `GET /auth/me`, `GET /progress`, `GET /progress/stats`, `POST /progress`, `POST /exams/generate` (and `GET /questions/*`) all send the header. The backend knows who is calling.
  - **Without token:** The header is omitted (e.g. first visit, or after logout). The backend then uses the **demo user** for protected routes (see below).
- **Calls that skip auth (no header):**
  - `POST /auth/login` – you don’t have a token yet.
  - `POST /auth/google` – same; you send the Google ID token in the body, backend returns our JWT.
- **On 401:** If the backend returns 401, the frontend clears the token and redirects to `/login`.

So: **yes, the APIs that need to know the user use the `Authorization` header.** The frontend sends the Bearer token for all non-login calls when it has one.

### Backend

- **Protected routes (require identity):** These use `Depends(get_current_user)` and therefore need to know the caller:
  - `GET /auth/me` – return current user.
  - `GET /progress` – list current user’s progress.
  - `GET /progress/stats` – stats for current user.
  - `POST /progress` – record progress for current user.
  - `POST /exams/generate` – generate exam for current user (unused/incorrect modes use their progress).

  For these, the backend:
  1. Reads `Authorization: Bearer <token>` (if present).
  2. Decodes the JWT (our own token, signed with `SECRET_KEY`) to get `user_id`.
  3. Loads the user from the DB and returns 401 if token is invalid or user not found.
  4. If **no** `Authorization` header is sent, it does **not** 401; it uses the **demo user** (single shared user) so “Continue in Demo Mode” works without an account.

- **Public routes (no auth):**
  - `POST /auth/login`, `POST /auth/google` – login.
  - `GET /questions`, `GET /questions/sections`, `GET /questions/{id}` – read-only question bank; same data for everyone. No `get_current_user`.

So: **authorization is “user-scoped data only for that user.”** We don’t have roles (e.g. admin); we only have “current user” and “demo user when no token.”

---

## 2. Is it reliant on OAuth?

**No.** Auth is **not** dependent on OAuth today:

- **Login** is either:
  - Demo: no password, backend creates/returns the demo user and issues a **JWT**.
  - Email/password: backend checks password and issues a **JWT**.
- The frontend then sends that **JWT** in the `Authorization` header. The backend only cares that the JWT is valid and maps to a user; it doesn’t care whether that user was created via demo, email/password, or (in the future) Google.

**OAuth (e.g. Google)** would be an extra way to **obtain** a user and then we’d still issue the **same kind of JWT** and use the same header. So:

- Current: login (demo or email) → our JWT → `Authorization: Bearer <our-jwt>` on every request.
- With Google: user signs in with Google → we verify the Google ID token and create/find user → we issue **our JWT** → same `Authorization: Bearer <our-jwt>` on every request.

So the APIs already “properly use authorization in header calls”; adding OAuth is just another login path that ends in the same JWT and same headers.

---

## 3. What to do for auth (checklist)

### Require login in production (no demo user)

If you want only real users (no anonymous demo):

1. **Backend:** In `app/api/deps.py`, change `get_current_user` so that when there are **no** credentials it returns **401** instead of calling `get_or_create_demo_user(db)`. For example:
   - If `not credentials`: `raise HTTPException(status_code=401, detail="Authentication required")`.
2. **Frontend:** Already redirects to `/login` on 401 and clears the token. No change needed.
3. **Login options:** Users must use a real login (e.g. email/password or Google when you enable it). “Continue in Demo Mode” can be hidden or removed on the login page in production.

### Enable Google OAuth

Backend is already in place; you only need config and frontend wiring.

1. **Google Cloud:** Create a project, enable Google Identity / OAuth, create an OAuth 2.0 Client ID (Web application). Add your frontend origin(s) (e.g. `https://app.yourdomain.com`) to authorized JavaScript origins.
2. **Backend:** Set `GOOGLE_CLIENT_ID` in env to that client ID. `POST /auth/google` verifies the Google ID token and creates/updates the user, then returns our JWT.
3. **Frontend:** Set `VITE_GOOGLE_CLIENT_ID` to the same client ID. Replace the placeholder “Sign in with Google (coming soon)” with the real Google Sign-In button (e.g. load Google Identity Services script, render button, on success call `loginWithGoogle(credential.credential)` and redirect). See `frontend/src/context/AuthContext.tsx` (`loginWithGoogle`) and `frontend/src/api/api.ts` (`auth.googleLogin(idToken)`).
4. **CORS:** Ensure your frontend origin is in `CORS_ORIGINS` so the browser allows the request.

After that, login flow is: Google → frontend gets ID token → `POST /auth/google` with `id_token` → backend returns our JWT → frontend stores it and sends `Authorization: Bearer <jwt>` on all subsequent requests, same as today.

### Optional: email/password registration

- Backend: add something like `POST /auth/register` (email, password, optional display name), hash password, create user with `auth_provider="email"`, return JWT.
- Frontend: add a registration form and call that endpoint, then store token and redirect like login.

---

## 4. Summary

| Question | Answer |
|----------|--------|
| Do APIs use the Authorization header? | Yes. All requests except `POST /auth/login` and `POST /auth/google` send `Authorization: Bearer <token>` when the frontend has a token. |
| Does the backend know who is allowed to access data? | Yes. Protected routes use `get_current_user`; progress and exams are scoped to that user’s ID. |
| Is this reliant on OAuth? | No. We use our own JWT. OAuth (Google) is just another way to get a user; we still issue our JWT and use the same header. |
| Where to write what we need for auth? | This file (`docs/AUTH.md`): flow, backend/frontend behavior, how to require auth in prod, and how to add Google OAuth. |
