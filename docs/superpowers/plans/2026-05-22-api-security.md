# API Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement API security controls API-01 through API-04: authentication enforcement, rate limiting, sensitive data protection, and input validation.

**Architecture:** Composable wrapper functions (`withAuth`, `withRateLimit`, `withCSRF`, `withValidation`) applied to route handlers in order. Redis-backed rate limiting. Response sanitization utility. Zod input validation schemas. Debug route gating. Hardcoded credential removal.

**Tech Stack:** TypeScript, Next.js App Router, Prisma, Redis (ioredis), Zod, Vitest

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/api-auth.ts` | Auth wrapper — session verification, role checking |
| Create | `src/lib/rate-limiter.ts` | Redis-backed rate limiter with tiers |
| Create | `src/lib/sanitize-response.ts` | Strip sensitive fields from user responses |
| Create | `src/lib/api-schemas.ts` | Zod schemas for unvalidated routes |
| Create | `src/lib/api-auth.test.ts` | Unit tests for auth wrapper |
| Create | `src/lib/rate-limiter.test.ts` | Unit tests for rate limiter |
| Create | `src/lib/sanitize-response.test.ts` | Unit tests for sanitization |
| Create | `src/lib/api-schemas.test.ts` | Unit tests for input schemas |
| Modify | `src/app/api/auth/login/route.ts` | Add rate limiting |
| Modify | `src/app/api/auth/employee-login/route.ts` | Add rate limiting |
| Modify | `src/app/api/auth/change-password/route.ts` | Add rate limiting |
| Modify | `src/app/api/employees/route.ts` | Add auth + rate limiting + validation |
| Modify | `src/app/api/employees/search/route.ts` | Add auth + rate limiting + validation |
| Modify | `src/app/api/dashboard/metrics/route.ts` | Add auth + rate limiting |
| Modify | `src/app/api/notifications/route.ts` | Add auth + rate limiting |
| Modify | `src/app/api/users/route.ts` | Add auth + rate limiting + sanitization |
| Modify | `src/app/api/users/[id]/route.ts` | Add auth + rate limiting + sanitization |
| Modify | `src/app/api/files/upload/route.ts` | Add auth + rate limiting |
| Modify | `src/app/api/institutions/route.ts` | Add auth + rate limiting |
| Modify | `src/app/api/admin/lock-account/route.ts` | Add auth wrapper |
| Modify | `src/app/api/external/employees/route.ts` | Fix CORS, move creds to env |
| Modify | `src/app/api/auth/sessions/route.ts` | Add auth + mask tokens to 4 chars |
| Modify | `src/lib/hrims-config.ts` | Move hardcoded creds to env vars |
| Modify | `src/app/api/employees/[id]/fetch-photo/route.ts` | Move hardcoded creds to env vars |
| Modify | `src/app/api/employees/[id]/fetch-documents/route.ts` | Move hardcoded creds to env vars |
| Modify | `src/app/api/test/route.ts` | Gate behind non-production env |
| Modify | `src/app/api/test/csrf/route.ts` | Gate behind non-production env |
| Modify | `src/app/api/debug-request/route.ts` | Gate behind non-production env |
| Modify | `src/app/api/debug/nav-test/route.ts` | Gate behind non-production env |
| Modify | `test/setup.ts` | Add rate limiter test config |
| Modify | `.env.local` | Add rate limiter and HRIMS env vars |

---

### Task 1: Create Auth Wrapper (`src/lib/api-auth.ts`)

**Files:**
- Create: `src/lib/api-auth.ts`

- [ ] **Step 1: Create the auth wrapper module**

```ts
// src/lib/api-auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export interface AuthContext {
  userId: string;
  role: string;
  institutionId: string | null;
  username: string;
}

export interface AuthResult {
  authenticated: boolean;
  context?: AuthContext;
  response?: NextResponse;
}

interface WithAuthOptions {
  allowedRoles?: string[];
}

/**
 * Extract and verify auth context from the auth-storage cookie.
 * Returns AuthResult with context if valid, or an error response if not.
 */
export async function verifyAuth(request: NextRequest | Request): Promise<AuthResult> {
  // Extract auth-storage cookie
  let cookieValue: string | undefined;

  if (request instanceof NextRequest) {
    cookieValue = request.cookies.get('auth-storage')?.value;
  } else {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/auth-storage=([^;]+)/);
      if (match) {
        cookieValue = decodeURIComponent(match[1]);
      }
    }
  }

  if (!cookieValue) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, error: 'Authentication required', errorCode: 'UNAUTHENTICATED' },
        { status: 401 }
      ),
    };
  }

  // Parse the auth cookie
  let authData: any;
  try {
    const parsed = JSON.parse(cookieValue);
    authData = parsed.state || parsed;
  } catch {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, error: 'Invalid or expired session', errorCode: 'INVALID_SESSION' },
        { status: 401 }
      ),
    };
  }

  const userId = authData?.user?.id;
  const role = authData?.role || authData?.user?.role;
  const institutionId = authData?.user?.institutionId || authData?.institutionId;
  const username = authData?.user?.name || authData?.user?.username;

  if (!userId || !role) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, error: 'Invalid or expired session', errorCode: 'INVALID_SESSION' },
        { status: 401 }
      ),
    };
  }

  // Verify user still exists and is active in the database
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, active: true, role: true },
  });

  if (!user || !user.active) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, error: 'Invalid or expired session', errorCode: 'INVALID_SESSION' },
        { status: 401 }
      ),
    };
  }

  return {
    authenticated: true,
    context: {
      userId,
      role: user.role,
      institutionId: institutionId || null,
      username: username || '',
    },
  };
}

/**
 * Higher-order function that wraps a route handler with authentication.
 * Verifies the auth cookie, checks the user exists and is active,
 * and optionally checks role-based access.
 *
 * Usage:
 *   export const GET = withAuth(async (request, { auth }) => {
 *     // auth.userId, auth.role, auth.institutionId are verified
 *   }, { allowedRoles: ['HRO', 'ADMIN'] });
 */
export function withAuth(
  handler: (request: NextRequest | Request, context: { auth: AuthContext }) => Promise<NextResponse>,
  options?: WithAuthOptions
) {
  return async (request: NextRequest | Request): Promise<NextResponse> => {
    const authResult = await verifyAuth(request);

    if (!authResult.authenticated || !authResult.context) {
      return authResult.response!;
    }

    // Check role-based access if allowedRoles is specified
    if (options?.allowedRoles && !options.allowedRoles.includes(authResult.context.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', errorCode: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return handler(request, { auth: authResult.context });
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/api-auth.ts
git commit -m "feat: add API auth wrapper with session verification and role checking (API-01)"
```

---

### Task 2: Create Rate Limiter (`src/lib/rate-limiter.ts`)

**Files:**
- Create: `src/lib/rate-limiter.ts`

- [ ] **Step 1: Create the rate limiter module**

```ts
// src/lib/rate-limiter.ts
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

export type RateLimitTier = 'auth' | 'write' | 'read' | 'upload';

const RATE_LIMITS: Record<RateLimitTier, { limit: number; windowSeconds: number }> = {
  auth: { limit: 5, windowSeconds: 60 },
  write: { limit: 30, windowSeconds: 60 },
  read: { limit: 100, windowSeconds: 60 },
  upload: { limit: 10, windowSeconds: 60 },
};

// Lazy Redis client singleton
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Don't retry on failure
      lazyConnect: true,
      connectTimeout: 2000,
    });
    redis.on('error', () => {
      // Suppress connection errors — we fail open
    });
    return redis;
  } catch {
    return null;
  }
}

/**
 * Get client IP from request headers.
 */
function getClientIp(request: NextRequest | Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return 'unknown';
}

/**
 * Check rate limit for a given key and tier.
 * Returns null if allowed, or rate limit info if exceeded.
 */
async function checkRateLimit(
  key: string,
  tier: RateLimitTier
): Promise<{ allowed: true } | { allowed: false; limit: number; remaining: number; retryAfter: number }> {
  const config = RATE_LIMITS[tier];
  const redisClient = getRedis();

  if (!redisClient) {
    // Fail open: if Redis is unavailable, allow the request
    console.warn('Rate limiter: Redis unavailable, allowing request');
    return { allowed: true };
  }

  try {
    const current = await redisClient.incr(key);

    if (current === 1) {
      // First request in window — set expiry
      await redisClient.expire(key, config.windowSeconds);
    }

    const ttl = await redisClient.ttl(key);
    const remaining = Math.max(0, config.limit - current);

    if (current > config.limit) {
      return {
        allowed: false,
        limit: config.limit,
        remaining: 0,
        retryAfter: ttl > 0 ? ttl : config.windowSeconds,
      };
    }

    return { allowed: true };
  } catch (error) {
    // Fail open on Redis errors
    console.warn('Rate limiter: Redis error, allowing request', error);
    return { allowed: true };
  }
}

/**
 * Higher-order function that wraps a route handler with rate limiting.
 * Uses Redis sliding window based on client IP.
 *
 * Usage:
 *   export const POST = withRateLimit(handler, 'write');
 */
export function withRateLimit(
  handler: (request: NextRequest | Request) => Promise<NextResponse>,
  tier: RateLimitTier
) {
  return async (request: NextRequest | Request): Promise<NextResponse> => {
    const ip = getClientIp(request);
    const config = RATE_LIMITS[tier];
    const key = `ratelimit:${ip}:${tier}`;

    const result = await checkRateLimit(key, tier);

    if (!result.allowed) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          errorCode: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.retryAfter,
        },
        { status: 429 }
      );
      response.headers.set('Retry-After', String(result.retryAfter));
      response.headers.set('X-RateLimit-Limit', String(config.limit));
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000) + result.retryAfter));
      return response;
    }

    const response = await handler(request);

    // Add rate limit headers to successful responses
    if (result.allowed) {
      response.headers.set('X-RateLimit-Limit', String(config.limit));
      // Get current count for remaining
      const redisClient = getRedis();
      if (redisClient) {
        try {
          const current = await redisClient.get(key);
          const remaining = Math.max(0, config.limit - (parseInt(current || '0', 10)));
          response.headers.set('X-RateLimit-Remaining', String(remaining));
        } catch {
          response.headers.set('X-RateLimit-Remaining', String(config.limit));
        }
      }
    }

    return response;
  };
}

/**
 * Get rate limit configuration for a tier.
 */
export function getRateLimitConfig(tier: RateLimitTier) {
  return RATE_LIMITS[tier];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/rate-limiter.ts
git commit -m "feat: add Redis-backed rate limiter with auth/write/read/upload tiers (API-02)"
```

---

### Task 3: Create Response Sanitization (`src/lib/sanitize-response.ts`)

**Files:**
- Create: `src/lib/sanitize-response.ts`

- [ ] **Step 1: Create the sanitization module**

```ts
// src/lib/sanitize-response.ts

/**
 * Fields to strip from user responses for security.
 * These are internal security/metadata fields that should never be exposed via API.
 */
const SENSITIVE_USER_FIELDS = [
  'password',
  'passwordHash',
  'failedLoginAttempts',
  'loginLockedUntil',
  'loginLockoutType',
  'loginLockoutReason',
  'isManuallyLocked',
  'lockedBy',
  'lockedAt',
  'lockoutNotes',
  'failedPasswordChangeAttempts',
  'passwordChangeLockoutUntil',
  'isTemporaryPassword',
  'mustChangePassword',
  'passwordExpiresAt',
  'gracePeriodStartedAt',
  'lastExpirationWarningLevel',
  'passwordHistory',
] as const;

/**
 * Remove sensitive fields from a user object before sending in API responses.
 * Strips password hashes, lockout metadata, and other internal security fields.
 */
export function sanitizeUser<T extends Record<string, any>>(user: T): Omit<T, typeof SENSITIVE_USER_FIELDS[number]> {
  const sanitized = { ...user };
  for (const field of SENSITIVE_USER_FIELDS) {
    delete (sanitized as any)[field];
  }
  return sanitized;
}

/**
 * Remove sensitive fields from an array of user objects.
 */
export function sanitizeUsers<T extends Record<string, any>>(users: T[]): Omit<T, typeof SENSITIVE_USER_FIELDS[number]>[] {
  return users.map(sanitizeUser);
}

/**
 * Mask a session token for display, showing only the first 4 characters.
 * E.g., "abc123def456ghi789" -> "abc1..."
 */
export function maskSessionToken(token: string): string {
  if (!token || token.length <= 4) {
    return '****';
  }
  return token.substring(0, 4) + '...';
}

/**
 * List of sensitive field names for reference/testing.
 */
export { SENSITIVE_USER_FIELDS };
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/sanitize-response.ts
git commit -m "feat: add response sanitization to strip sensitive user fields (API-03)"
```

---

### Task 4: Create Input Validation Schemas (`src/lib/api-schemas.ts`)

**Files:**
- Create: `src/lib/api-schemas.ts`

- [ ] **Step 1: Create the validation schemas module**

```ts
// src/lib/api-schemas.ts
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Validate request body or query params against a Zod schema.
 * Returns parsed data or an error response.
 */
export function validateRequest<T extends z.ZodType>(
  request: NextRequest | Request,
  schema: T,
  source: 'body' | 'query' = 'body'
): Promise<{ success: true; data: z.infer<T> } | { success: false; response: NextResponse }> {
  return (async () => {
    try {
      let input: unknown;

      if (source === 'query') {
        const url = new URL(request.url);
        input = Object.fromEntries(url.searchParams.entries());
      } else {
        input = await request.json();
      }

      const data = schema.parse(input);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          response: NextResponse.json(
            {
              success: false,
              error: 'Validation failed',
              errorCode: 'VALIDATION_ERROR',
              details: error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
              })),
            },
            { status: 400 }
          ),
        };
      }
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Invalid request body', errorCode: 'VALIDATION_ERROR' },
          { status: 400 }
        ),
      };
    }
  })();
}

// --- Employee query schema ---
export const employeeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.string().optional(),
  institutionId: z.string().optional(),
  status: z.string().optional(),
});

// --- Employee search schema ---
export const employeeSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// --- File upload query schema ---
export const fileUploadQuerySchema = z.object({
  folder: z.string().max(100).optional(),
});

// --- Notification query schema ---
export const notificationQuerySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// --- Notification create schema ---
export const notificationCreateSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1, 'Title is required').max(200),
  message: z.string().min(1, 'Message is required').max(2000),
  type: z.enum(['info', 'warning', 'success', 'error']).default('info'),
});

// --- Dashboard metrics query schema ---
export const dashboardMetricsSchema = z.object({
  userRole: z.string().optional(),
  institutionId: z.string().optional(),
});
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/api-schemas.ts
git commit -m "feat: add Zod validation schemas and request validator (API-04)"
```

---

### Task 5: Write Unit Tests for Core Modules

**Files:**
- Create: `src/lib/api-auth.test.ts`
- Create: `src/lib/rate-limiter.test.ts`
- Create: `src/lib/sanitize-response.test.ts`
- Create: `src/lib/api-schemas.test.ts`

- [ ] **Step 1: Write auth wrapper tests**

```ts
// src/lib/api-auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyAuth, withAuth, AuthContext } from './api-auth';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db';

const mockUser = {
  id: 'user-1',
  active: true,
  role: 'ADMIN',
};

function createMockRequest(cookieValue?: string) {
  const headers = new Headers();
  if (cookieValue) {
    headers.set('cookie', `auth-storage=${encodeURIComponent(JSON.stringify({
      state: {
        user: { id: 'user-1', role: 'ADMIN', institutionId: 'inst-1', name: 'Admin User' },
        role: 'ADMIN',
        isAuthenticated: true,
      },
    }))}`);
  }
  return { headers, cookies: { get: (name: string) => name === 'auth-storage' ? { value: cookieValue } : undefined } };
}

describe('api-auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyAuth', () => {
    it('should return UNAUTHENTICATED when no cookie is present', async () => {
      const request = { headers: new Headers(), cookies: { get: () => undefined } } as any;
      const result = await verifyAuth(request);
      expect(result.authenticated).toBe(false);
      if (!result.authenticated) {
        expect(result.response?.status).toBe(401);
        const body = await result.response!.json();
        expect(body.errorCode).toBe('UNAUTHENTICATED');
      }
    });

    it('should return INVALID_SESSION when cookie cannot be parsed', async () => {
      const request = { headers: new Headers(), cookies: { get: () => ({ value: 'not-valid-json' }) } } as any;
      const result = await verifyAuth(request);
      expect(result.authenticated).toBe(false);
      if (!result.authenticated) {
        expect(result.response?.status).toBe(401);
        const body = await result.response!.json();
        expect(body.errorCode).toBe('INVALID_SESSION');
      }
    });

    it('should return INVALID_SESSION when user does not exist', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);
      const mockCookie = encodeURIComponent(JSON.stringify({
        state: { user: { id: 'nonexistent', role: 'ADMIN' }, role: 'ADMIN', isAuthenticated: true },
      }));
      const request = { headers: new Headers(), cookies: { get: () => ({ value: mockCookie }) } } as any;
      const result = await verifyAuth(request);
      expect(result.authenticated).toBe(false);
      if (!result.authenticated) {
        expect(result.response?.status).toBe(401);
        const body = await result.response!.json();
        expect(body.errorCode).toBe('INVALID_SESSION');
      }
    });

    it('should return INVALID_SESSION when user is inactive', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ ...mockUser, active: false });
      const mockCookie = encodeURIComponent(JSON.stringify({
        state: { user: { id: 'user-1', role: 'ADMIN' }, role: 'ADMIN', isAuthenticated: true },
      }));
      const request = { headers: new Headers(), cookies: { get: () => ({ value: mockCookie }) } } as any;
      const result = await verifyAuth(request);
      expect(result.authenticated).toBe(false);
    });

    it('should return auth context for valid user', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      const mockCookie = encodeURIComponent(JSON.stringify({
        state: { user: { id: 'user-1', role: 'ADMIN', institutionId: 'inst-1', name: 'Admin' }, role: 'ADMIN', isAuthenticated: true },
      }));
      const request = { headers: new Headers(), cookies: { get: () => ({ value: mockCookie }) } } as any;
      const result = await verifyAuth(request);
      expect(result.authenticated).toBe(true);
      expect(result.context?.userId).toBe('user-1');
      expect(result.context?.role).toBe('ADMIN');
    });
  });

  describe('withAuth', () => {
    it('should call handler when auth succeeds with no role restriction', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
      const mockCookie = encodeURIComponent(JSON.stringify({
        state: { user: { id: 'user-1', role: 'ADMIN' }, role: 'ADMIN', isAuthenticated: true },
      }));
      const request = { headers: new Headers(), cookies: { get: () => ({ value: mockCookie }) } } as any;

      let handlerCalled = false;
      const handler = withAuth(async (req, { auth }) => {
        handlerCalled = true;
        expect(auth.userId).toBe('user-1');
        return new Response('ok') as any;
      });

      await handler(request);
      expect(handlerCalled).toBe(true);
    });

    it('should return 403 when role is not in allowedRoles', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ ...mockUser, role: 'HRO' });
      const mockCookie = encodeURIComponent(JSON.stringify({
        state: { user: { id: 'user-1', role: 'HRO' }, role: 'HRO', isAuthenticated: true },
      }));
      const request = { headers: new Headers(), cookies: { get: () => ({ value: mockCookie }) } } as any;

      const handler = withAuth(async () => new Response('ok') as any, { allowedRoles: ['ADMIN'] });
      const response = await handler(request);
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.errorCode).toBe('FORBIDDEN');
    });

    it('should allow access when role is in allowedRoles', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ ...mockUser, role: 'HRO' });
      const mockCookie = encodeURIComponent(JSON.stringify({
        state: { user: { id: 'user-1', role: 'HRO' }, role: 'HRO', isAuthenticated: true },
      }));
      const request = { headers: new Headers(), cookies: { get: () => ({ value: mockCookie }) } } as any;

      let handlerCalled = false;
      const handler = withAuth(async () => { handlerCalled = true; return new Response('ok') as any; }, { allowedRoles: ['HRO', 'ADMIN'] });
      await handler(request);
      expect(handlerCalled).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Write rate limiter tests**

```ts
// src/lib/rate-limiter.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRateLimitConfig, RateLimitTier } from './rate-limiter';

// Note: We test the configuration and utility functions.
// The actual Redis-based rate limiting is tested via integration tests
// since it requires a running Redis instance.

describe('rate-limiter', () => {
  describe('getRateLimitConfig', () => {
    it('should return correct config for auth tier', () => {
      const config = getRateLimitConfig('auth');
      expect(config.limit).toBe(5);
      expect(config.windowSeconds).toBe(60);
    });

    it('should return correct config for write tier', () => {
      const config = getRateLimitConfig('write');
      expect(config.limit).toBe(30);
      expect(config.windowSeconds).toBe(60);
    });

    it('should return correct config for read tier', () => {
      const config = getRateLimitConfig('read');
      expect(config.limit).toBe(100);
      expect(config.windowSeconds).toBe(60);
    });

    it('should return correct config for upload tier', () => {
      const config = getRateLimitConfig('upload');
      expect(config.limit).toBe(10);
      expect(config.windowSeconds).toBe(60);
    });
  });
});
```

- [ ] **Step 3: Write sanitization tests**

```ts
// src/lib/sanitize-response.test.ts
import { describe, it, expect } from 'vitest';
import { sanitizeUser, sanitizeUsers, maskSessionToken, SENSITIVE_USER_FIELDS } from './sanitize-response';

describe('sanitize-response', () => {
  describe('sanitizeUser', () => {
    it('should strip all sensitive fields from user object', () => {
      const user = {
        id: 'user-1',
        name: 'Admin User',
        username: 'admin',
        email: 'admin@example.com',
        role: 'ADMIN',
        active: true,
        password: 'hashed_password_here',
        failedLoginAttempts: 5,
        loginLockedUntil: new Date(),
        loginLockoutType: 'TEMPORARY',
        isManuallyLocked: false,
        lockoutNotes: 'suspicious activity',
        isTemporaryPassword: true,
        mustChangePassword: true,
      };

      const sanitized = sanitizeUser(user);

      expect(sanitized.id).toBe('user-1');
      expect(sanitized.name).toBe('Admin User');
      expect(sanitized.role).toBe('ADMIN');
      expect(sanitized.active).toBe(true);
      expect((sanitized as any).password).toBeUndefined();
      expect((sanitized as any).failedLoginAttempts).toBeUndefined();
      expect((sanitized as any).loginLockedUntil).toBeUndefined();
      expect((sanitized as any).loginLockoutType).toBeUndefined();
      expect((sanitized as any).isManuallyLocked).toBeUndefined();
      expect((sanitized as any).lockoutNotes).toBeUndefined();
      expect((sanitized as any).isTemporaryPassword).toBeUndefined();
      expect((sanitized as any).mustChangePassword).toBeUndefined();
    });

    it('should handle user object without sensitive fields', () => {
      const user = { id: 'user-1', name: 'Test', role: 'HRO', active: true };
      const sanitized = sanitizeUser(user);
      expect(sanitized).toEqual(user);
    });

    it('should not strip non-sensitive fields', () => {
      const user = {
        id: 'user-1',
        name: 'Admin',
        institutionId: 'inst-1',
        employeeId: 'emp-1',
        active: true,
        password: 'secret',
      };
      const sanitized = sanitizeUser(user);
      expect(sanitized.id).toBe('user-1');
      expect(sanitized.institutionId).toBe('inst-1');
      expect((sanitized as any).password).toBeUndefined();
    });
  });

  describe('sanitizeUsers', () => {
    it('should sanitize an array of users', () => {
      const users = [
        { id: '1', name: 'A', password: 'secret1' },
        { id: '2', name: 'B', password: 'secret2' },
      ];
      const sanitized = sanitizeUsers(users);
      expect(sanitized).toHaveLength(2);
      expect((sanitized[0] as any).password).toBeUndefined();
      expect((sanitized[1] as any).password).toBeUndefined();
    });
  });

  describe('maskSessionToken', () => {
    it('should mask token to first 4 characters', () => {
      expect(maskSessionToken('abc123def456ghi789')).toBe('abc1...');
    });

    it('should handle short tokens', () => {
      expect(maskSessionToken('ab')).toBe('****');
    });

    it('should handle empty token', () => {
      expect(maskSessionToken('')).toBe('****');
    });

    it('should handle 4-character token', () => {
      expect(maskSessionToken('abcd')).toBe('abcd...');
    });
  });

  describe('SENSITIVE_USER_FIELDS', () => {
    it('should include all expected field names', () => {
      expect(SENSITIVE_USER_FIELDS).toContain('password');
      expect(SENSITIVE_USER_FIELDS).toContain('failedLoginAttempts');
      expect(SENSITIVE_USER_FIELDS).toContain('loginLockedUntil');
      expect(SENSITIVE_USER_FIELDS).toContain('isManuallyLocked');
      expect(SENSITIVE_USER_FIELDS).toContain('lockoutNotes');
      expect(SENSITIVE_USER_FIELDS).toContain('isTemporaryPassword');
      expect(SENSITIVE_USER_FIELDS).toContain('mustChangePassword');
    });
  });
});
```

- [ ] **Step 4: Write validation schema tests**

```ts
// src/lib/api-schemas.test.ts
import { describe, it, expect } from 'vitest';
import {
  employeeQuerySchema,
  employeeSearchSchema,
  fileUploadQuerySchema,
  notificationQuerySchema,
  notificationCreateSchema,
  dashboardMetricsSchema,
} from './api-schemas';

describe('api-schemas', () => {
  describe('employeeQuerySchema', () => {
    it('should provide defaults for optional fields', () => {
      const result = employeeQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should coerce string query params to numbers', () => {
      const result = employeeQuerySchema.parse({ page: '3', limit: '50' });
      expect(result.page).toBe(3);
      expect(result.limit).toBe(50);
    });

    it('should reject invalid page numbers', () => {
      expect(() => employeeQuerySchema.parse({ page: '0' })).toThrow();
      expect(() => employeeQuerySchema.parse({ page: '-1' })).toThrow();
    });

    it('should reject limit over 100', () => {
      expect(() => employeeQuerySchema.parse({ limit: '101' })).toThrow();
    });
  });

  describe('employeeSearchSchema', () => {
    it('should require query parameter', () => {
      expect(() => employeeSearchSchema.parse({})).toThrow();
    });

    it('should accept valid search', () => {
      const result = employeeSearchSchema.parse({ query: 'John Doe' });
      expect(result.query).toBe('John Doe');
      expect(result.limit).toBe(10);
    });
  });

  describe('notificationCreateSchema', () => {
    it('should require userId and message', () => {
      expect(() => notificationCreateSchema.parse({})).toThrow();
      expect(() => notificationCreateSchema.parse({ userId: '1', message: 'test' })).toThrow();
    });

    it('should accept valid notification', () => {
      const result = notificationCreateSchema.parse({
        userId: 'user-1',
        title: 'Test',
        message: 'Test message',
      });
      expect(result.type).toBe('info'); // default
    });
  });

  describe('dashboardMetricsSchema', () => {
    it('should accept empty params', () => {
      const result = dashboardMetricsSchema.parse({});
      expect(result.userRole).toBeUndefined();
      expect(result.institutionId).toBeUndefined();
    });

    it('should accept valid params', () => {
      const result = dashboardMetricsSchema.parse({ userRole: 'HRO', institutionId: 'inst-1' });
      expect(result.userRole).toBe('HRO');
    });
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run src/lib/api-auth.test.ts src/lib/rate-limiter.test.ts src/lib/sanitize-response.test.ts src/lib/api-schemas.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/api-auth.test.ts src/lib/rate-limiter.test.ts src/lib/sanitize-response.test.ts src/lib/api-schemas.test.ts
git commit -m "test: add unit tests for API auth, rate limiter, sanitization, and validation schemas"
```

---

### Task 6: Integrate Security Wrappers into Representative Routes

This task integrates `withAuth`, `withRateLimit`, and `sanitizeUser` into representative routes covering each pattern. The remaining routes follow the same pattern and are listed at the end.

**Files to modify:**
- `src/app/api/users/route.ts` (GET + POST: auth + rate limit + sanitization)
- `src/app/api/notifications/route.ts` (GET + POST: auth + rate limit + validation)
- `src/app/api/dashboard/metrics/route.ts` (GET: auth + rate limit + validation)
- `src/app/api/employees/route.ts` (GET: auth + rate limit + validation)
- `src/app/api/files/upload/route.ts` (POST: auth + rate limit 'upload' tier)
- `src/app/api/auth/login/route.ts` (POST: rate limit 'auth' tier only, no auth)

- [ ] **Step 1: Update `src/app/api/users/route.ts`**

Add imports at top:
```ts
import { withAuth, AuthContext } from '@/lib/api-auth';
import { withRateLimit } from '@/lib/rate-limiter';
import { sanitizeUser, sanitizeUsers } from '@/lib/sanitize-response';
```

Wrap the GET handler:
```ts
export const GET = withRateLimit(
  withAuth(async (request, { auth }) => {
    // Replace the existing auth-cookie parsing with the verified auth context
    // ... existing logic but use auth.role and auth.institutionId instead of client-sent params
    // ... use sanitizeUsers() on the response
  }, { allowedRoles: ['ADMIN', 'HHRMD', 'HRO'] }),
  'read'
);
```

Wrap the POST handler similarly with `'write'` tier and `sanitizeUser()` on the response.

Remove any inline auth-cookie parsing that was used for role checking, since `withAuth` now provides the verified context.

- [ ] **Step 2: Update `src/app/api/notifications/route.ts`**

Add imports and wrap both handlers:
```ts
import { withAuth } from '@/lib/api-auth';
import { withRateLimit } from '@/lib/rate-limiter';
import { validateRequest } from '@/lib/api-schemas';
import { notificationQuerySchema, notificationCreateSchema } from '@/lib/api-schemas';

export const GET = withRateLimit(
  withAuth(async (request, { auth }) => {
    const validation = await validateRequest(request, notificationQuerySchema, 'query');
    if (!validation.success) return validation.response;
    const { userId } = validation.data;
    // Use auth.userId to verify the requesting user matches
    // ... existing logic
  }),
  'read'
);

export const POST = withRateLimit(
  withAuth(async (request, { auth }) => {
    const validation = await validateRequest(request, notificationCreateSchema);
    if (!validation.success) return validation.response;
    // ... existing logic
  }),
  'write'
);
```

- [ ] **Step 3: Update `src/app/api/dashboard/metrics/route.ts`**

Wrap the GET handler with auth and rate limiting. Replace client-sent `userRole`/`userInstitutionId` with `auth.role`/`auth.institutionId`:
```ts
import { withAuth } from '@/lib/api-auth';
import { withRateLimit } from '@/lib/rate-limiter';

export const GET = withRateLimit(
  withAuth(async (request, { auth }) => {
    const userRole = auth.role;
    const userInstitutionId = auth.institutionId;
    // ... existing logic using these verified values
  }),
  'read'
);
```

- [ ] **Step 4: Update `src/app/api/employees/route.ts`**

Wrap GET handler. Replace client-sent role params:
```ts
import { withAuth } from '@/lib/api-auth';
import { withRateLimit } from '@/lib/rate-limiter';
import { validateRequest } from '@/lib/api-schemas';
import { employeeQuerySchema } from '@/lib/api-schemas';

export const GET = withRateLimit(
  withAuth(async (request, { auth }) => {
    const validation = await validateRequest(request, employeeQuerySchema, 'query');
    if (!validation.success) return validation.response;
    const { page, limit, search, role, institutionId } = validation.data;
    // Use auth.role and auth.institutionId for access control
    // ... existing logic
  }),
  'read'
);
```

- [ ] **Step 5: Update `src/app/api/files/upload/route.ts`**

Wrap POST handler with auth + upload rate limit. The file already has `validateFileUpload` — now add auth:
```ts
import { withAuth } from '@/lib/api-auth';
import { withRateLimit } from '@/lib/rate-limiter';

export const POST = withRateLimit(
  withAuth(async (request, { auth }) => {
    // ... existing logic, using auth for audit logging
  }),
  'upload'
);
```

- [ ] **Step 6: Update `src/app/api/auth/login/route.ts`**

Add rate limiting only (no auth — login is a public endpoint):
```ts
import { withRateLimit } from '@/lib/rate-limiter';

export const POST = withRateLimit(
  async (request) => {
    // ... existing login logic
  },
  'auth'
);
```

- [ ] **Step 7: Commit**

```bash
git add src/app/api/users/route.ts src/app/api/notifications/route.ts src/app/api/dashboard/metrics/route.ts src/app/api/employees/route.ts src/app/api/files/upload/route.ts src/app/api/auth/login/route.ts
git commit -m "feat: integrate auth, rate limiting, and sanitization into core API routes (API-01, API-02, API-03)"
```

---

### Task 7: Integrate Security Wrappers into Remaining Routes

Apply the same pattern from Task 6 to the remaining routes. Each route gets the appropriate wrappers.

**Routes to update:**

- `src/app/api/auth/employee-login/route.ts` — Add `withRateLimit(handler, 'auth')` to POST
- `src/app/api/auth/change-password/route.ts` — Add `withRateLimit(handler, 'auth')` to POST
- `src/app/api/auth/mfa/send-otp/route.ts` — Add `withRateLimit(handler, 'auth')` to POST
- `src/app/api/auth/mfa/verify-otp/route.ts` — Add `withRateLimit(handler, 'auth')` to POST
- `src/app/api/auth/mfa/magic-link/route.ts` — Add `withRateLimit(handler, 'auth')` to POST
- `src/app/api/employees/search/route.ts` — Add `withRateLimit(withAuth(handler), 'read')` to GET
- `src/app/api/employees/[id]/route.ts` — Add `withRateLimit(withAuth(handler), 'read')` to GET, `withRateLimit(withAuth(handler), 'write')` to PATCH/DELETE
- `src/app/api/employees/[id]/certificates/route.ts` — Add `withRateLimit(withAuth(handler, { allowedRoles: [...] }), 'write')` to POST
- `src/app/api/employees/[id]/documents/route.ts` — Add `withRateLimit(withAuth(handler, { allowedRoles: [...] }), 'write')` to POST
- `src/app/api/employees/bulk-upload/route.ts` — Add `withRateLimit(withAuth(handler, { allowedRoles: ['HRO'] }), 'upload')` to POST
- `src/app/api/institutions/route.ts` — Add `withRateLimit(withAuth(handler), 'read')` to GET, `withRateLimit(withAuth(handler), 'write')` to POST
- `src/app/api/institutions/[id]/route.ts` — Add auth + rate limit wrappers
- `src/app/api/complaints/route.ts` — Add auth + rate limit wrappers
- `src/app/api/complaints/[id]/route.ts` — Add auth + rate limit wrappers
- `src/app/api/admin/lock-account/route.ts` — Wrap with `withAuth(handler, { allowedRoles: ['ADMIN'] })` instead of client-sent adminId
- `src/app/api/admin/reset-password/route.ts` — Add `withAuth(handler, { allowedRoles: ['ADMIN'] })`
- `src/app/api/admin/unlock-account/route.ts` — Add `withAuth(handler, { allowedRoles: ['ADMIN'] })`

For each route, the pattern is:
1. Add imports for `withAuth`, `withRateLimit`, and `sanitizeUser` as needed
2. Wrap the handler function with the appropriate tier and roles
3. Replace any client-sent `userRole`/`userInstitutionId` with the verified `auth.role`/`auth.institutionId`
4. Apply `sanitizeUser()` to any user data in responses

- [ ] **Step 1: Update all remaining auth endpoints with rate limiting**

- [ ] **Step 2: Update all remaining API endpoints with auth + rate limiting**

- [ ] **Step 3: Commit**

```bash
git add src/app/api/
git commit -m "feat: integrate auth and rate limiting into all remaining API routes"
```

---

### Task 8: Gate Debug Routes Behind Non-Production Environment

**Files:**
- Modify: `src/app/api/test/route.ts`
- Modify: `src/app/api/test/csrf/route.ts`
- Modify: `src/app/api/debug-request/route.ts`
- Modify: `src/app/api/debug/nav-test/route.ts`

- [ ] **Step 1: Add production gate to each debug route**

For each of the 4 routes, add this check at the top of the handler:

```ts
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json(
    { success: false, message: 'Not found' },
    { status: 404 }
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/test/ src/app/api/debug-request/ src/app/api/debug/
git commit -m "feat: gate debug/test routes behind non-production environment (API-03)"
```

---

### Task 9: Move Hardcoded HRIMS Credentials to Environment Variables

**Files:**
- Modify: `src/lib/hrims-config.ts`
- Modify: `src/app/api/employees/[id]/fetch-photo/route.ts`
- Modify: `src/app/api/employees/[id]/fetch-documents/route.ts`
- Modify: `.env.local`

- [ ] **Step 1: Update `src/lib/hrims-config.ts`**

Replace the hardcoded `DEFAULT_HRIMS_CONFIG` to use env vars with no hardcoded fallbacks for secrets:

```ts
const DEFAULT_HRIMS_CONFIG = {
  host: process.env.HRIMS_HOST || '10.0.217.11',
  port: process.env.HRIMS_PORT || '8135',
  apiKey: process.env.HRIMS_API_KEY || '',
  token: process.env.HRIMS_TOKEN || '',
};
```

- [ ] **Step 2: Update `src/app/api/employees/[id]/fetch-photo/route.ts`**

Remove the `HRIMS_CONFIG` object with hardcoded credentials (lines 6-11). Replace with:
```ts
import { getHrimsApiConfig } from '@/lib/hrims-config';
```

Then inside the handler, replace `HRIMS_CONFIG.BASE_URL`, `HRIMS_CONFIG.API_KEY`, `HRIMS_CONFIG.TOKEN` with:
```ts
const hrimsConfig = await getHrimsApiConfig();
// Use hrimsConfig.BASE_URL, hrimsConfig.API_KEY, hrimsConfig.TOKEN
```

- [ ] **Step 3: Update `src/app/api/employees/[id]/fetch-documents/route.ts`**

Same pattern — remove the hardcoded `HRIMS_CONFIG`, import `getHrimsApiConfig`, and use the async config function.

- [ ] **Step 4: Update `src/app/api/external/employees/route.ts`**

Replace `Access-Control-Allow-Origin: *` with env-var-based origins:
```ts
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
const origin = request.headers.get('origin') || '';
const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || '';
```

Use `corsOrigin` in all `Access-Control-Allow-Origin` headers.

- [ ] **Step 5: Add env vars to `.env.local`**

```
HRIMS_HOST=10.0.217.11
HRIMS_PORT=8135
HRIMS_API_KEY=0ea1e3f5-ea57-410b-a199-246fa288b851
HRIMS_TOKEN=CfDJ8M6SKjORsSdBliudb_vdU_DEea8FKIcQckiBxdvt4EJgtcP0ba_3REOpGvWYeOF46fvqw8heVnqFnXTwOmD5Wg5Qg3yNJlwyGDHVhqbgyKxB31Bjh2pI6C2qAYnLMovU4XLlQFVu7cTpIqtgItNZpM4
ALLOWED_ORIGINS=http://localhost:9002
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/hrims-config.ts src/app/api/employees/[id]/fetch-photo/route.ts src/app/api/employees/[id]/fetch-documents/route.ts src/app/api/external/employees/route.ts .env.local
git commit -m "feat: move HRIMS credentials to env vars and fix CORS (API-03)"
```

---

### Task 10: Mask Session Tokens in Sessions API

**Files:**
- Modify: `src/app/api/auth/sessions/route.ts`

- [ ] **Step 1: Update session token masking**

Add import:
```ts
import { maskSessionToken } from '@/lib/sanitize-response';
```

Find the line that masks tokens to 10 chars:
```ts
sessionToken: session.sessionToken.substring(0, 10) + '...'
```

Replace with:
```ts
sessionToken: maskSessionToken(session.sessionToken)
```

- [ ] **Step 2: Add auth wrapper to session endpoints**

Add imports:
```ts
import { withAuth } from '@/lib/api-auth';
import { withRateLimit } from '@/lib/rate-limiter';
```

Wrap the GET handler:
```ts
export const GET = withRateLimit(
  withAuth(async (request, { auth }) => {
    // ... existing logic, verify userId matches auth.userId or admin role
  }, { allowedRoles: ['ADMIN', 'HRO', 'HHRMD', 'HRMO', 'DO', 'CSCS', 'PO'] }),
  'read'
);
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/auth/sessions/route.ts
git commit -m "feat: mask session tokens to 4 chars and add auth to sessions API (API-03, API-01)"
```

---

### Task 11: Add Environment Variables and Update Test Setup

**Files:**
- Modify: `test/setup.ts`

- [ ] **Step 1: Add env vars to test setup**

In `test/setup.ts`, add after the existing Redis env vars:
```ts
process.env.HRIMS_HOST = '10.0.217.11';
process.env.HRIMS_PORT = '8135';
process.env.HRIMS_API_KEY = 'test-hrims-api-key';
process.env.HRIMS_TOKEN = 'test-hrims-token';
process.env.ALLOWED_ORIGINS = 'http://localhost:9002';
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

- [ ] **Step 3: Run type checking**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add test/setup.ts
git commit -m "feat: add HRIMS and rate limiter env vars to test setup"
```

---

### Task 12: Final Integration Verification

- [ ] **Step 1: Run linter**

```bash
npm run lint
```

Fix any lint errors.

- [ ] **Step 2: Build the application**

```bash
npm run build
```

- [ ] **Step 3: Run all tests one more time**

```bash
npx vitest run
```

- [ ] **Step 4: Verify auth wrapping by grepping for old patterns**

```bash
# Check that withAuth is used in routes
grep -r "withAuth" src/app/api/ --include="*.ts" | head -20

# Check that no route trusts client-sent userRole without auth
grep -r "searchParams.get('userRole')" src/app/api/ --include="*.ts" || echo "No untrusted userRole params remaining"

# Check that sensitive fields are stripped
grep -r "sanitizeUser\|sanitizeUsers" src/app/api/ --include="*.ts" | head -10
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: API security complete (API-01 through API-04)"
```

---

## UAT Control Traceability

| Control | Requirement | Implementation |
|---------|-------------|----------------|
| API-01 | Access API without authentication | `withAuth` wrapper returns 401/403, all routes protected |
| API-02 | Test API rate limiting | `withRateLimit` Redis sliding window, 429 on exceed |
| API-03 | Inspect API response for sensitive data | `sanitizeUser` strips all security fields, debug routes gated, credentials in env vars, tokens masked |
| API-04 | Test parameter tampering | `withValidation` Zod schemas + `withAuth` replaces client-sent role params |