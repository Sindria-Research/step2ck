import { API_BASE } from '../config/env';
import { supabase } from '../lib/supabase';

const REQUEST_TIMEOUT_MS = 10_000;
const COLD_START_TIMEOUT_MS = 45_000;
const RETRY_DELAYS = [2_000, 4_000, 8_000];

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
  /** Retry on network/timeout errors (for cold-start resilience). */
  retries?: number;
}

let _backendAwake = false;
let _wakePromise: Promise<void> | null = null;

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (err instanceof Error && err.message.includes('timed out')) return true;
  return false;
}

/**
 * Fire a lightweight ping to wake the backend.
 * Resolves when the backend responds (or after max wait).
 */
export function wakeBackend(): Promise<void> {
  if (_backendAwake) return Promise.resolve();
  if (_wakePromise) return _wakePromise;
  _wakePromise = (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), COLD_START_TIMEOUT_MS);
      await fetch(`${API_BASE}/health`, { signal: controller.signal });
      clearTimeout(timer);
      _backendAwake = true;
    } catch {
      // Backend may still be starting; callers will retry
    } finally {
      _wakePromise = null;
    }
  })();
  return _wakePromise;
}

export function markBackendAwake() {
  _backendAwake = true;
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
  const { skipAuth, timeoutMs = REQUEST_TIMEOUT_MS, cacheTtlMs, retries = 0, ...fetchOptions } = options;
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

  const doFetch = async (attempt: number): Promise<T> => {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...((fetchOptions.headers as Record<string, string>) ?? {}),
    };
    if (!skipAuth) {
      const token = await resolveToken();
      if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const effectiveTimeout = !_backendAwake && attempt === 0 ? COLD_START_TIMEOUT_MS : timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), effectiveTimeout);
    let res: Response;
    try {
      res = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: fetchOptions.signal ?? controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timer);
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      const networkish = isAbort || isNetworkError(err);

      if (networkish && attempt < retries) {
        const delay = RETRY_DELAYS[Math.min(attempt, RETRY_DELAYS.length - 1)];
        await new Promise((r) => setTimeout(r, delay));
        return doFetch(attempt + 1);
      }
      if (isAbort) throw new Error(`Request timed out: ${path}`);
      throw err;
    } finally {
      clearTimeout(timer);
    }

    _backendAwake = true;

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

  if (!cacheKey || !cacheTtlMs) return doFetch(0);

  const pending = doFetch(0);
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
