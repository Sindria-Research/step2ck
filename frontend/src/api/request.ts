import { API_BASE } from '../config/env';

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setToken = (token: string | null) => {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
};

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) ?? {}),
  };
  // Send JWT for all requests except login (skipAuth). Backend uses it to scope data to the current user.
  if (!skipAuth) {
    const token = getToken();
    if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...fetchOptions, headers });
  if (res.status === 401) {
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
