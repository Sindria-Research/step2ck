import { API_BASE } from '../config/env';
import { supabase } from '../lib/supabase';

const REQUEST_TIMEOUT_MS = 10_000;

let _cachedToken: string | null = null;
let _tokenResolving: Promise<string | null> | null = null;

/** Read from memory first, then localStorage. */
export const getToken = (): string | null => {
  return _cachedToken ?? localStorage.getItem('token');
};

export function isPublicPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/';
  return p === '/' || p === '/login' || p === '/tos' || p === '/privacy';
}

export const setToken = (token: string | null) => {
  _cachedToken = token;
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
};

/**
 * Resolve auth token. Uses in-memory cache; only hits Supabase once per
 * batch of concurrent requests (deduplicates via shared promise).
 */
async function resolveToken(): Promise<string | null> {
  if (_cachedToken) return _cachedToken;

  if (!supabase) return localStorage.getItem('token');

  if (_tokenResolving) return _tokenResolving;

  _tokenResolving = (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        setToken(data.session.access_token);
        return data.session.access_token;
      }
    } catch {
      // Supabase unreachable — fall through
    }
    return localStorage.getItem('token');
  })();

  try {
    return await _tokenResolving;
  } finally {
    _tokenResolving = null;
  }
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  timeoutMs?: number;
  /** Serve from in-memory cache for this many milliseconds (GET-only). */
  cacheTtlMs?: number;
}

interface CacheEntry { data: unknown; expiresAt: number; pending?: Promise<unknown> }
const _responseCache = new Map<string, CacheEntry>();
const CACHE_MAX_ENTRIES = 64;

function _pruneCache() {
  if (_responseCache.size <= CACHE_MAX_ENTRIES) return;
  const now = Date.now();
  for (const [k, v] of _responseCache) {
    if (v.expiresAt < now) _responseCache.delete(k);
  }
  if (_responseCache.size > CACHE_MAX_ENTRIES) {
    const oldest = _responseCache.keys().next().value;
    if (oldest) _responseCache.delete(oldest);
  }
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth, timeoutMs = REQUEST_TIMEOUT_MS, cacheTtlMs, ...fetchOptions } = options;
  const method = (fetchOptions.method ?? 'GET').toUpperCase();
  const cacheKey = method === 'GET' && cacheTtlMs ? path : null;

  if (cacheKey) {
    const hit = _responseCache.get(cacheKey);
    if (hit) {
      if (hit.pending) return hit.pending as Promise<T>;
      if (hit.expiresAt > Date.now()) return hit.data as T;
      _responseCache.delete(cacheKey);
    }
  }

  const doFetch = async (): Promise<T> => {
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
  };

  if (!cacheKey || !cacheTtlMs) return doFetch();

  const pending = doFetch();
  _responseCache.set(cacheKey, { data: null, expiresAt: 0, pending });
  try {
    const data = await pending;
    _responseCache.set(cacheKey, { data, expiresAt: Date.now() + cacheTtlMs });
    _pruneCache();
    return data;
  } catch (err) {
    _responseCache.delete(cacheKey);
    throw err;
  }
}
