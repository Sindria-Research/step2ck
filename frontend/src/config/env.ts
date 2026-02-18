/** API base URL: use proxy in dev or full URL in production */
export const API_BASE =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '/api' : '/api');
