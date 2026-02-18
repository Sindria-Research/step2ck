/** API base URL: use proxy in dev or full URL in production */
export const API_BASE =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '/api' : '/api');

/** Google OAuth client ID (optional). Enables "Sign in with Google" on login page. */
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
