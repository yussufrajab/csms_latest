/**
 * Unit tests for src/lib/api-auth.ts
 *
 * Tests verifyAuth() and withAuth() for API route authentication.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, withAuth } from './api-auth';

// ---------------------------------------------------------------------------
// Mock @/lib/db
// ---------------------------------------------------------------------------

const mockFindUnique = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
    },
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a NextRequest with an `auth-storage` cookie.
 */
function makeRequest(cookieValue?: string): NextRequest {
  const url = 'http://localhost:9002/api/test';
  if (cookieValue === undefined) {
    return new NextRequest(url);
  }
  const encoded = encodeURIComponent(cookieValue);
  return new NextRequest(url, {
    headers: { cookie: `auth-storage=${encoded}` },
  });
}

/**
 * Read the JSON body of a NextResponse.  The module-level constants
 * (UNAUTHENTICATED, INVALID_SESSION, FORBIDDEN) are created once with
 * NextResponse.json(), which means their body streams can only be consumed
 * a single time.  Cloning avoids the "Body is unusable" error in repeated
 * test invocations.
 */
async function responseBody(response: NextResponse): Promise<any> {
  const cloned = response.clone();
  return cloned.json();
}

// ---------------------------------------------------------------------------
// verifyAuth tests
// ---------------------------------------------------------------------------

describe('verifyAuth', () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
  });

  it('returns UNAUTHENTICATED (401) when no cookie is present', async () => {
    const req = new NextRequest('http://localhost:9002/api/test');
    const result = await verifyAuth(req);

    expect(result.authenticated).toBe(false);
    expect(result.response!.status).toBe(401);

    const body = await responseBody(result.response!);
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe('UNAUTHENTICATED');
  });

  it('returns INVALID_SESSION (401) when cookie cannot be parsed', async () => {
    // Provide a cookie value that is not valid JSON even after decoding
    const req = makeRequest('not-json-at-all');
    const result = await verifyAuth(req);

    expect(result.authenticated).toBe(false);
    expect(result.response!.status).toBe(401);

    const body = await responseBody(result.response!);
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe('INVALID_SESSION');
  });

  it('returns INVALID_SESSION (401) when user does not exist in DB', async () => {
    mockFindUnique.mockResolvedValue(null);

    const cookie = JSON.stringify({
      state: {
        user: { id: 'nonexistent', role: 'Admin', institutionId: null, username: 'admin' },
      },
    });
    const req = makeRequest(cookie);
    const result = await verifyAuth(req);

    expect(result.authenticated).toBe(false);
    expect(result.response!.status).toBe(401);

    const body = await responseBody(result.response!);
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe('INVALID_SESSION');
  });

  it('returns INVALID_SESSION (401) when user is inactive in DB', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', active: false, role: 'Admin' });

    const cookie = JSON.stringify({
      state: {
        user: { id: 'user-1', role: 'Admin', institutionId: null, username: 'admin' },
      },
    });
    const req = makeRequest(cookie);
    const result = await verifyAuth(req);

    expect(result.authenticated).toBe(false);
    expect(result.response!.status).toBe(401);

    const body = await responseBody(result.response!);
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe('INVALID_SESSION');
  });

  it('returns authenticated context for a valid user', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', active: true, role: 'Admin' });

    const cookie = JSON.stringify({
      state: {
        user: {
          id: 'user-1',
          role: 'Admin',
          institutionId: 'inst-1',
          username: 'admin',
        },
      },
    });
    const req = makeRequest(cookie);
    const result = await verifyAuth(req);

    expect(result.authenticated).toBe(true);
    expect(result.context).toBeDefined();
    expect(result.context!.userId).toBe('user-1');
    expect(result.context!.role).toBe('Admin');
    expect(result.context!.institutionId).toBe('inst-1');
    expect(result.context!.username).toBe('admin');
  });

  it('returns INVALID_SESSION when cookie has no userId or role', async () => {
    const cookie = JSON.stringify({ state: { user: {} } });
    const req = makeRequest(cookie);
    const result = await verifyAuth(req);

    expect(result.authenticated).toBe(false);

    const body = await responseBody(result.response!);
    expect(body.errorCode).toBe('INVALID_SESSION');
  });

  it('error responses include success: false and errorCode fields', async () => {
    // Test with no cookie — UNAUTHENTICATED
    const req1 = new NextRequest('http://localhost:9002/api/test');
    const result1 = await verifyAuth(req1);
    const body1 = await responseBody(result1.response!);
    expect(body1.success).toBe(false);
    expect(body1.errorCode).toBeDefined();

    // Test with invalid cookie — INVALID_SESSION
    const req2 = makeRequest('garbage');
    const result2 = await verifyAuth(req2);
    const body2 = await responseBody(result2.response!);
    expect(body2.success).toBe(false);
    expect(body2.errorCode).toBeDefined();
  });

  it('defaults username to empty string when not in cookie', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', active: true, role: 'User' });

    const cookie = JSON.stringify({
      state: {
        user: { id: 'user-1', role: 'User', institutionId: null },
      },
    });
    const req = makeRequest(cookie);
    const result = await verifyAuth(req);

    expect(result.authenticated).toBe(true);
    expect(result.context!.username).toBe('');
  });

  it('returns INVALID_SESSION when DB query throws', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB connection failed'));

    const cookie = JSON.stringify({
      state: {
        user: { id: 'user-1', role: 'Admin', institutionId: null, username: 'admin' },
      },
    });
    const req = makeRequest(cookie);
    const result = await verifyAuth(req);

    expect(result.authenticated).toBe(false);

    const body = await responseBody(result.response!);
    expect(body.errorCode).toBe('INVALID_SESSION');
  });
});

// ---------------------------------------------------------------------------
// withAuth tests
// ---------------------------------------------------------------------------

describe('withAuth', () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
  });

  it('calls handler when auth succeeds with no role restriction', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', active: true, role: 'User' });

    const handler = vi.fn().mockResolvedValue(
      NextResponse.json({ ok: true })
    );

    const wrapped = withAuth(handler);
    const cookie = JSON.stringify({
      state: {
        user: { id: 'user-1', role: 'User', institutionId: null, username: 'user' },
      },
    });
    const req = makeRequest(cookie);

    const response = await wrapped(req);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(req, {
      auth: {
        userId: 'user-1',
        role: 'User',
        institutionId: null,
        username: 'user',
      },
    });
    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it('returns 403 with errorCode FORBIDDEN when role not in allowedRoles', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', active: true, role: 'User' });

    const handler = vi.fn().mockResolvedValue(
      NextResponse.json({ ok: true })
    );

    const wrapped = withAuth(handler, { allowedRoles: ['Admin'] });
    const cookie = JSON.stringify({
      state: {
        user: { id: 'user-1', role: 'User', institutionId: null, username: 'user' },
      },
    });
    const req = makeRequest(cookie);

    const response = await wrapped(req);

    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(403);

    const body = await response.clone().json();
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe('FORBIDDEN');
  });

  it('allows access when role is in allowedRoles', async () => {
    mockFindUnique.mockResolvedValue({ id: 'admin-1', active: true, role: 'Admin' });

    const handler = vi.fn().mockResolvedValue(
      NextResponse.json({ ok: true })
    );

    const wrapped = withAuth(handler, { allowedRoles: ['Admin', 'SuperAdmin'] });
    const cookie = JSON.stringify({
      state: {
        user: { id: 'admin-1', role: 'Admin', institutionId: 'inst-1', username: 'admin' },
      },
    });
    const req = makeRequest(cookie);

    const response = await wrapped(req);

    expect(handler).toHaveBeenCalledOnce();
    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it('allows access when role casing differs from allowedRoles (case-insensitive)', async () => {
    mockFindUnique.mockResolvedValue({ id: 'admin-1', active: true, role: 'Admin' });

    const handler = vi.fn().mockResolvedValue(
      NextResponse.json({ ok: true })
    );

    // DB stores 'Admin' but allowedRoles uses 'ADMIN' — should still match
    const wrapped = withAuth(handler, { allowedRoles: ['ADMIN', 'HHRMD', 'HRO'] });
    const cookie = JSON.stringify({
      state: {
        user: { id: 'admin-1', role: 'Admin', institutionId: 'inst-1', username: 'admin' },
      },
    });
    const req = makeRequest(cookie);

    const response = await wrapped(req);

    expect(handler).toHaveBeenCalledOnce();
    const body = await response.json();
    expect(body.ok).toBe(true);
  });
});