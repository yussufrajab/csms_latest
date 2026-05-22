# API Security Design

## Context

The CSMS application has 80+ API endpoints with inconsistent security. Authentication is not enforced on API routes (middleware excludes `/api/*`), most routes trust client-sent role parameters, there is no rate limiting, sensitive fields leak in responses, and several routes lack input validation. CSRF middleware exists but is only applied to a test endpoint.

This design addresses UAT controls API-01 through API-04.

## Architecture

**Approach: Wrapper-based middleware** — Each security concern is a composable wrapper function that wraps route handlers. Wrappers are applied in order: `withRateLimit(withCSRF(withAuth(handler, options)))`. This follows the existing pattern in the codebase (CSRF middleware) and keeps each concern isolated.

## Components

### 1. Authentication Enforcement — `src/lib/api-auth.ts` (API-01)

**`AuthContext` interface:**
```ts
interface AuthContext {
  userId: string;
  role: string;
  institutionId: string | null;
  username: string;
}
```

**`withAuth(handler, options?)`** wrapper:
1. Reads `auth-storage` cookie from the request
2. Parses and validates the session data
3. Verifies the user exists and is active in the database
4. Checks `allowedRoles` if provided — returns 403 if role not permitted
5. Returns 401 if unauthenticated (missing/invalid/expired cookie)
6. Passes the verified `AuthContext` to the handler

**Public endpoints (no auth required):**
- `/api/auth/login`, `/api/auth/employee-login`
- `/api/auth/mfa/send-otp`, `/api/auth/mfa/verify-otp`, `/api/auth/mfa/magic-link`, `/api/auth/mfa/magic-link/verify`
- `/api/auth/change-password` (requires current password verification, not session)
- `/api/auth/password-status`, `/api/auth/account-lockout-status`
- `/api/external/employees` (has its own API key auth)

**Critical fix:** Routes currently accepting `userRole`/`userInstitutionId` from request params will use server-verified `AuthContext` values instead.

### 2. Rate Limiting — `src/lib/rate-limiter.ts` (API-02)

**Redis-backed sliding window** using ioredis (already installed).

**Rate limit tiers:**

| Tier | Limit | Window | Applies to |
|------|-------|--------|------------|
| `auth` | 5 requests | 60s | Login, password change, MFA endpoints |
| `write` | 30 requests | 60s | POST/PUT/PATCH/DELETE on all other routes |
| `read` | 100 requests | 60s | GET on all other routes |
| `upload` | 10 requests | 60s | File upload endpoints |

**`withRateLimit(handler, tier)`** wrapper:
- Key format: `ratelimit:{ip}:{tier}:{window}`
- Uses Redis `INCR` + `EXPIRE` for counting
- Sets headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Returns 429 with `Retry-After` header and `{ error: 'Too many requests', retryAfter: seconds }`
- **Fail-open:** If Redis is unavailable, logs warning and allows request through

### 3. Sensitive Data Protection (API-03)

**3a. Response sanitization — `src/lib/sanitize-response.ts`:**

`sanitizeUser(user)` strips these fields from all user responses:
- `password`, `passwordHash`
- `failedLoginAttempts`, `loginLockedUntil`, `loginLockoutType`
- `isManuallyLocked`, `lockoutNotes`
- `failedPasswordChangeAttempts`, `passwordChangeLockoutUntil`
- `isTemporaryPassword`, `mustChangePassword`

Applied in all routes that return user data.

**3b. Debug/test routes:**
- Gate `/api/test`, `/api/test/csrf`, `/api/debug-request`, `/api/debug/nav-test` behind `NODE_ENV !== 'production'` — return 404 in production

**3c. Hardcoded credentials:**
- Move HRIMS API key and token from `src/lib/hrims-config.ts` to env vars: `HRIMS_API_KEY`, `HRIMS_TOKEN`
- Move hardcoded credentials in `src/app/api/employees/[id]/fetch-photo/route.ts` and `src/app/api/employees/[id]/fetch-documents/route.ts` to use the same env vars
- Remove hardcoded `DEFAULT_HRIMS_CONFIG` with credentials; use env vars only

**3d. Session token masking:**
- Change session token display from first 10 chars to first 4 chars + `...`

**3e. CORS fix:**
- Replace `Access-Control-Allow-Origin: *` on `/api/external/employees` with specific origins from env var `ALLOWED_ORIGINS`

### 4. Input Validation & CSRF (API-04)

**4a. Zod schemas for unvalidated routes — `src/lib/api-schemas.ts`:**

Schemas for routes currently lacking validation:
- `/api/files/upload` — validate `file` (required), `folder` (optional string)
- `/api/notifications` GET/POST — validate query/body params
- `/api/dashboard/metrics` GET — validate query params
- `/api/employees` GET — validate `page`, `limit`, `search`, `role`, `institutionId`
- `/api/employees/search` GET — validate `query` (required string)

**`withValidation(handler, { body?, query? })`** wrapper:
- Validates request body and/or query params against Zod schemas
- Returns 400 with `{ error: 'Validation failed', details: [...] }` on failure
- Passes validated data to handler

**4b. CSRF protection on all mutation endpoints:**

Apply existing `validateCSRF` from `src/lib/csrf-utils.ts` to all POST/PUT/PATCH/DELETE endpoints via `withCSRF(handler)` wrapper. This enforces the double-submit cookie pattern that's already implemented.

### 5. Composition Pattern

Wrappers compose in this order (outermost first):
```ts
export const POST = withRateLimit(
  withCSRF(
    withAuth(handler, { allowedRoles: ['HRO'] })
  ),
  'write'
);

export const GET = withRateLimit(
  withAuth(handler, { allowedRoles: ['HRO', 'HRMO', 'ADMIN'] }),
  'read'
);
```

Order rationale:
1. `withRateLimit` — outermost, blocks abusers before auth processing
2. `withCSRF` — second, validates CSRF before processing body
3. `withAuth` — innermost, validates session and role

### 6. Error Responses

Consistent error format across all security wrappers:

| Wrapper | Status | Code | Message |
|---------|--------|------|---------|
| withAuth (no cookie) | 401 | `UNAUTHENTICATED` | "Authentication required" |
| withAuth (invalid/expired) | 401 | `INVALID_SESSION` | "Invalid or expired session" |
| withAuth (wrong role) | 403 | `FORBIDDEN` | "Insufficient permissions" |
| withRateLimit (exceeded) | 429 | `RATE_LIMIT_EXCEEDED` | "Too many requests" |
| withCSRF (missing/invalid) | 403 | `CSRF_TOKEN_INVALID` | "Invalid CSRF token" |
| withValidation (failed) | 400 | `VALIDATION_ERROR` | "Validation failed" |

### 7. Testing

**Unit tests:**
- `api-auth.test.ts` — test auth extraction, role checks, unauthenticated/forbidden responses
- `rate-limiter.test.ts` — test rate limit counting, 429 response, fail-open on Redis down, header values
- `sanitize-response.test.ts` — test field stripping, verify all sensitive fields removed
- `api-schemas.test.ts` — test Zod schema validation for each route

**E2E tests (Playwright) matching UAT controls:**
- API-01: Call protected endpoint without auth cookie → 401
- API-02: Send 100 requests to a rate-limited endpoint → 429 after limit exceeded
- API-03: Call `/api/users` → verify no `password`, `failedLoginAttempts`, etc. in response
- API-04: Send malformed request body → 400 with validation error

## UAT Control Coverage

| Control | Requirement | Implementation |
|---------|-------------|----------------|
| API-01 | Access API without authentication | `withAuth` wrapper returns 401/403, all routes protected |
| API-02 | Test API rate limiting | `withRateLimit` Redis sliding window, 429 on exceed |
| API-03 | Inspect API response for sensitive data | `sanitizeUser` strips all security fields, debug routes gated, credentials moved to env vars |
| API-04 | Test parameter tampering | `withValidation` Zod schemas + `withCSRF` token validation |