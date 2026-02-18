import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
});

describe('request helper', () => {
    it('makes GET requests with auth token', async () => {
        localStorage.setItem('token', 'test-jwt-123');
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: 'test' }),
        });

        const { request } = await import('../api/request');
        const result = await request('/test');

        expect(mockFetch).toHaveBeenCalledOnce();
        const [, options] = mockFetch.mock.calls[0];
        expect(options.headers['Authorization']).toBe('Bearer test-jwt-123');
        expect(result).toEqual({ data: 'test' });
    });

    it('skips auth header when skipAuth is true', async () => {
        localStorage.setItem('token', 'test-jwt-123');
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ ok: true }),
        });

        const { request } = await import('../api/request');
        await request('/auth/login', { skipAuth: true });

        const [, options] = mockFetch.mock.calls[0];
        expect(options.headers['Authorization']).toBeUndefined();
    });

    it('throws on non-ok response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: () => Promise.resolve({ detail: 'Invalid input' }),
        });

        const { request } = await import('../api/request');
        await expect(request('/fail')).rejects.toThrow('Invalid input');
    });

    it('redirects on 401', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            json: () => Promise.resolve({ detail: 'Unauthorized' }),
        });

        const { request } = await import('../api/request');
        await expect(request('/protected')).rejects.toThrow('Unauthorized');
        expect(localStorage.getItem('token')).toBeNull();
    });

    it('returns undefined for 204 No Content', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 204,
            json: () => Promise.reject(new Error('No content')),
        });

        const { request } = await import('../api/request');
        const result = await request('/delete');
        expect(result).toBeUndefined();
    });
});
