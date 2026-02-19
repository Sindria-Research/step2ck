import { API_BASE } from '../config/env';
import { supabase } from '../lib/supabase';

const REQUEST_TIMEOUT_MS = 10_000;

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

/** Paths that are public (no auth required). Used to avoid redirecting to login on 401 when user is on these pages. */
export function isPublicPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/';
  return p === '/' || p === '/login' || p === '/tos' || p === '/privacy';
}

export const setToken = (token: string | null) => {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
};

/**
 * Get the best available auth token. Prefers a fresh Supabase session token
 * (handles auto-refresh), falls back to localStorage (demo mode).
 */
async function resolveToken(): Promise<string | null> {
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        setToken(data.session.access_token);
        return data.session.access_token;
      }
    } catch {
      // Supabase unreachable or session expired — fall through to localStorage
    }
  }
  return getToken();
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  timeoutMs?: number;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth, timeoutMs = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) ?? {}),
  };
  if (!skipAuth) {
    const token = await resolveToken();
    if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: fetchOptions.signal ?? controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Request timed out: ${path}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401) {
    setToken(null);
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
