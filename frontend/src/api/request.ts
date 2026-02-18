import { API_BASE } from '../config/env';
import { supabase } from '../lib/supabase';

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

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
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      setToken(data.session.access_token);
      return data.session.access_token;
    }
  }
  return getToken();
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) ?? {}),
  };
  if (!skipAuth) {
    const token = await resolveToken();
    if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...fetchOptions, headers });
  if (res.status === 401) {
    if (supabase) await supabase.auth.signOut();
    setToken(null);
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
