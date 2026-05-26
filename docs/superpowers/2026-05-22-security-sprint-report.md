# 3-Day Security Sprint Implementation Report

> May 20–22, 2026 — Comprehensive security hardening for the Zanzibar Civil Service Management System (CSMS)

---

## Executive Summary

Over three days, the CSMS application was hardened with a **10-layer security architecture** covering authentication, authorization, data protection, and operational security. **56 commits** across **121 files** added **14,205 lines** and modified **3,038 lines**. **126 unit tests** were written for new security modules.

---

## Layer 1: Multi-Factor Authentication (MFA)

**Status: Complete**

### Design

Every login now requires a second factor via email. Two parallel methods are offered:

| Method | Mechanism | Token | Expiry |
|--------|-----------|-------|--------|
| **OTP** | 6-digit one-time password | `crypto.randomInt` | 5 minutes |
| **Magic Link** | Click-to-login URL | 32-byte `crypto.randomBytes` hex | 5 minutes |

Both tokens are created on every login attempt and sent in a single email — the user can type the OTP or click the magic link.

### Security Controls

| Control | Implementation |
|---------|----------------|
| OTP rate limiting | Max 3 OTP requests per 60-second window |
| OTP brute-force protection | Account locks after 5 failed verification attempts |
| Timing attack prevention | `crypto.timingSafeEqual` for constant-time OTP comparison |
| Token reuse prevention | `verifyMfaToken()` marks token as used on success; `createMfaToken()` invalidates previous unused tokens for that user |
| Automatic cleanup | `cleanupExpiredMfaTokens()` removes expired unused tokens |
| Audit trail | All MFA events (send, verify success, verify failure) logged to partitioned audit table |

### Files

| File | Purpose |
|------|---------|
| `src/lib/mfa-utils.ts` | Core MFA engine — token generation, verification, rate limiting, attempt tracking |
| `src/app/api/auth/mfa/send-otp/route.ts` | POST: sends new OTP + magic link email; rate limited |
| `src/app/api/auth/mfa/verify-otp/route.ts` | POST: verifies OTP with timing-safe comparison; rate limited |
| `src/app/api/auth/mfa/magic-link/verify/route.ts` | POST: verifies magic link token |
| `src/app/(auth)/mfa-verify/page.tsx` | MFA verification page |
| `src/app/(auth)/mfa/magic-link-confirm/page.tsx` | Magic link confirmation page |
| `src/components/auth/mfa-verify-form.tsx` | 6-digit OTP input with auto-advance, paste support, auto-submit, 60s resend cooldown |
| `src/lib/email.ts` | Nodemailer SMTP service; `sendMfaEmail()` sends styled HTML with OTP + magic link |

### Login Flow

```
1. User submits credentials → POST /api/auth/login
2. Password verified → MFA tokens created (OTP + Magic Link)
3. Email sent with OTP code and "Sign In Directly" button
4. API returns { code: 'MFA_REQUIRED', data: { userId, email } }
5. Frontend redirects to /mfa-verify?userId=...&email=...
6. User enters 6-digit OTP → POST /api/auth/mfa/verify-otp
7. On success: session created, redirects by role
   OR user clicks magic link → POST /api/auth/mfa/magic-link/verify
8. Audit events logged at every step
```

### Database Model

```prisma
model MfaToken {
  token      String   @unique
  tokenType  String   // "OTP" or "MAGIC_LINK"
  email      String
  attempts   Int      @default(0)
  expiresAt  DateTime
  usedAt     DateTime?
  ipAddress  String?
  userAgent  String?
  userId     String
  user       User     @relation(fields: [userId], references: [id])
}
```

---

## Layer 2: File Upload Security (FILE-01 through FILE-04)

**Status: Complete**

### 5-Step Validation Pipeline

Every file upload passes through this pipeline in order:

```
1. Extension Blocklist → 2. MIME Allowlist → 3. Size Limit → 4. Magic Byte Check → 5. ClamAV Scan
   (FILE-01)              (FILE-04)          (FILE-02)      (FILE-04)               (FILE-03)
```

| Step | What It Does | Rejection |
|------|-------------|-----------|
| Extension blocklist | Blocks `.exe`, `.bat`, `.cmd`, `.sh`, `.ps1`, `.com`, `.vbs`, etc. | `BLOCKED_EXTENSION` |
| MIME allowlist | Per-context MIME type allowlists (PDF, DOC, DOCX, JPEG, PNG, GIF, WebP, CSV) | `BLOCKED_MIME_TYPE` |
| Size limit | Per-context limits: generic 10MB, documents 10MB, certificates 5MB, templates 10MB, bulk 50MB, photos 5MB | `FILE_TOO_LARGE` |
| Magic byte check | Reads first bytes to verify file content matches claimed type (PDF `%PDF`, JPEG `FFD8FF`, PNG `89504E47`, etc.) | `INVALID_FILE_CONTENT` |
| ClamAV scan | TCP INSTREAM protocol on port 3310; fail-closed when ClamAV unreachable | `MALWARE_DETECTED` / `SCAN_UNAVAILABLE` |

### Files

| File | Purpose |
|------|---------|
| `src/lib/file-validation.ts` | Centralized `validateFileUpload()` pipeline |
| `src/lib/clamav.ts` | ClamAV TCP client with INSTREAM protocol |
| `src/lib/file-validation.test.ts` | 62 tests |
| `src/lib/clamav.test.ts` | 6 tests |

### Integrated Routes

| Route | Upload Context |
|-------|---------------|
| `api/files/upload/route.ts` | `generic` |
| `api/employees/[id]/documents/route.ts` | `documents` |
| `api/employees/[id]/certificates/route.ts` | `certificates` |
| `api/promotion-form-template/upload/route.ts` | `templates` |
| `api/employees/bulk-upload/route.ts` | `bulkUpload` |
| `api/employees/[id]/fetch-photo/route.ts` | `photos` |
| `api/employees/[id]/fetch-documents/route.ts` | `documents` |

### Infrastructure

- ClamAV daemon installed on `127.0.0.1:3310` (TCP socket via systemd)
- EICAR test file verified as detected
- Configurable via env vars: `CLAMAV_HOST`, `CLAMAV_PORT`, `CLAMAV_ENABLED`, `CLAMAV_TIMEOUT`

---

## Layer 3: API Security (API-01 through API-04)

**Status: Complete**

### Composable Wrapper Pattern

Security concerns are composable wrappers applied outermost-to-innermost:

```ts
export const POST = withRateLimit(
  withCSRF(
    withAuth(handler, { allowedRoles: ['HRO'] })
  ),
  'write'
);
```

### API-01: Authentication on All Endpoints

`withAuth()` wrapper:
- Reads `auth-storage` cookie → verifies user exists and is active in DB → checks role-based access
- Returns `401 UNAUTHENTICATED` / `401 INVALID_SESSION` / `403 FORBIDDEN`
- Applied to all 26 protected routes
- **Server-verified roles**: Client-sent `userRole` and `userInstitutionId` replaced with server-verified `auth.role` and `auth.institutionId`

### API-02: Redis-Backed Rate Limiting

`withRateLimit()` — sliding window using Redis INCR+EXPIRE:

| Tier | Limit | Window | Use Case |
|------|-------|--------|----------|
| `auth` | 5 requests | 60 seconds | Login, MFA endpoints |
| `write` | 30 requests | 60 seconds | POST/PUT mutations |
| `read` | 100 requests | 60 seconds | GET queries |
| `upload` | 10 requests | 60 seconds | File uploads |

- Returns `429 RATE_LIMIT_EXCEEDED` with `Retry-After` and rate limit headers
- Fail-open when Redis is unavailable

### API-03: Sensitive Data Prevention

- `sanitizeUser()` strips 20 sensitive fields (password, passwordHash, failedLoginAttempts, lockout metadata, passwordHistory, etc.)
- `maskSessionToken()` — masks tokens to first 4 characters for safe logging
- Debug/test routes gated behind `NODE_ENV !== 'production'`
- Hardcoded HRIMS credentials moved to env vars (`HRIMS_HOST`, `HRIMS_PORT`, `HRIMS_API_KEY`, `HRIMS_TOKEN`)
- CORS `Access-Control-Allow-Origin: *` replaced with env-var-based `ALLOWED_ORIGINS`

### API-04: Input Validation

- Zod schemas for employees, notifications, dashboard metrics, file uploads, employee search
- `withValidation()` returns `400 VALIDATION_ERROR` with field-level error details
- Client-sent role/institution params replaced with server-verified auth values

### Files

| File | Tests | Purpose |
|------|-------|---------|
| `src/lib/api-auth.ts` | 12 | Session verification, role-based access |
| `src/lib/rate-limiter.ts` | 8 | Redis sliding window rate limiting |
| `src/lib/sanitize-response.ts` | 12 | Sensitive field stripping, token masking |
| `src/lib/api-schemas.ts` | 26 | Zod validation schemas |

### Error Response Format

| Wrapper | Status | Code | Message |
|---------|--------|------|---------|
| `withAuth` (no cookie) | 401 | `UNAUTHENTICATED` | Authentication required |
| `withAuth` (invalid/expired) | 401 | `INVALID_SESSION` | Invalid or expired session |
| `withAuth` (wrong role) | 403 | `FORBIDDEN` | Insufficient permissions |
| `withRateLimit` (exceeded) | 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| `withValidation` (failed) | 400 | `VALIDATION_ERROR` | Validation failed |

---

## Layer 4: Database Audit Log Partitioning

**Status: Complete**

### Problem Solved

The original Prisma-backed `AuditLog` table was an unpartitioned single table that would degrade as millions of audit rows accumulated. Date-range queries required full table scans, and Prisma's query builder added latency to high-throughput log inserts.

### Architecture: Three-Layer Design

```
┌─────────────────────────────────────────┐
│  API Routes (audit-logger.ts)           │  ← Domain-specific logging functions
├─────────────────────────────────────────┤
│  Audit Wrapper (audit-wrapper.ts)       │  ← withAuditLogging() auto-logging
├─────────────────────────────────────────┤
│  Raw SQL Layer (audit-db.ts)            │  ← pg Pool, parameterized queries,
│                                         │     partitioned table, INET type
├─────────────────────────────────────────┤
│  PostgreSQL                             │
│  audit.audit_log (RANGE partitioned)    │
│  ├── audit.audit_log_2025_11           │
│  ├── audit.audit_log_2025_12           │
│  ├── ...                               │
│  └── audit.audit_log_2027_05           │  (19 pre-created partitions)
└─────────────────────────────────────────┘
```

### Partitioned Table Schema

```sql
CREATE TABLE audit.audit_log (
    id              BIGSERIAL,
    event_id        UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id         TEXT,
    username        TEXT,
    user_role       TEXT,
    action          TEXT NOT NULL,
    event_category  TEXT NOT NULL DEFAULT 'SYSTEM',
    severity        TEXT NOT NULL DEFAULT 'INFO',
    entity_type     TEXT NOT NULL DEFAULT 'SYSTEM',
    entity_id       TEXT,
    ip_address      INET,              -- Native PG INET type
    device_info     JSONB,             -- Structured device metadata
    request_method  TEXT,
    request_route   TEXT NOT NULL,
    is_authenticated BOOLEAN DEFAULT false,
    was_blocked     BOOLEAN DEFAULT false,
    block_reason    TEXT,
    additional_data JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)       -- Composite PK for partitioning
) PARTITION BY RANGE (created_at);
```

Key design decisions:
- **`PARTITION BY RANGE (created_at)`** — monthly partitions; date queries only scan relevant partition
- **`BIGSERIAL` for `id`** — high insert performance vs UUID
- **`INET` for `ip_address`** — supports CIDR queries and network operators
- **`JSONB` for `device_info`/`additional_data`** — flexible metadata without schema migrations
- **Composite PK `(id, created_at)`** — PostgreSQL partition key requirement

### Performance Impact

| Operation | Before (Unpartitioned) | After (Partitioned) |
|-----------|----------------------|---------------------|
| Insert | Prisma overhead, full-table index | Direct SQL, partition-local indexes |
| Date-range query | Full table scan | Partition pruning |
| Drop old data | `DELETE` + `VACUUM` (slow) | `DROP TABLE` (instant) |
| Index maintenance | One massive index | Per-month smaller indexes |

### Partition Maintenance

- **19 pre-created partitions**: November 2025 through May 2027
- **Cron job**: Monthly on the 1st, creates next 3 months of partitions via `ensurePartitions(3)`
- **Startup check**: Development mode verifies partitions exist
- **Idempotent**: `CREATE TABLE IF NOT EXISTS` handles race conditions

### Files

| File | Purpose |
|------|---------|
| `prisma/migrations/20260522010000_migrate_audit_to_partitioned/migration.sql` | Full migration: schema, table, indexes, partitions, data migration, old table drop |
| `src/lib/audit-db.ts` | Raw SQL layer: `writeAuditLog()`, `queryAuditLogs()`, `queryAuditStats()`, `ensurePartitions()` |
| `src/lib/audit-logger.ts` | Domain-specific convenience functions (14 event types) |
| `src/lib/audit-wrapper.ts` | `withAuditLogging()` higher-order function for auto-logging API routes |
| `src/lib/cron-service.ts` | Monthly partition creation and startup verification |
| `src/app/api/audit/logs/route.ts` | Paginated log queries with filters |
| `src/app/api/audit/stats/route.ts` | Aggregate statistics |

### Event Types

| Function | Event | Category |
|----------|-------|----------|
| `logLoginAttempt()` | `LOGIN_SUCCESS` / `LOGIN_FAILED` | `AUTHENTICATION` |
| `logUnauthorizedAccess()` | `UNAUTHORIZED_ACCESS` | `SECURITY` |
| `logAccessDenied()` | `ACCESS_DENIED` | `AUTHORIZATION` |
| `logRequestApproval()` | `REQUEST_APPROVED` | `DATA_MODIFICATION` |
| `logRequestRejection()` | `REQUEST_REJECTED` | `DATA_MODIFICATION` |
| `logRequestSubmission()` | `REQUEST_SUBMITTED` | `DATA_MODIFICATION` |
| `logEmployeeAction()` | `EMPLOYEE_CREATED/UPDATED/DELETED` | `DATA_MODIFICATION` |
| `logUserAction()` | `USER_CREATED/UPDATED/DELETED` | `DATA_MODIFICATION` |
| `logFileAction()` | `FILE_UPLOADED/DELETED` | `DATA_MODIFICATION` |
| `logAccountAction()` | `ACCOUNT_LOCKED/UNLOCKED` | `SECURITY` |
| `logComplaintAction()` | `COMPLAINT_SUBMITTED/UPDATED/RESOLVED` | `DATA_MODIFICATION` |

---

## Layer 5: CSRF Protection

**Status: Complete**

### Double-Submit Cookie Pattern

| Component | Implementation |
|-----------|---------------|
| Token generation | 256-bit `crypto.randomBytes` |
| Token signing | HMAC-SHA256 signature |
| Token verification | `crypto.timingSafeEqual` (constant-time comparison) |
| Cookie options | `httpOnly: false`, `sameSite: 'strict'`, `secure` in production, 7-day expiry |
| Violation logging | CSRF failures logged to partitioned audit trail |

### Files

| File | Purpose |
|------|---------|
| `src/lib/csrf-utils.ts` | `generateCSRFToken()`, `signCSRFToken()`, `verifyCSRFToken()`, `validateCSRFTokens()` |
| `src/lib/api-csrf-middleware.ts` | `withCSRF()`, `withCSRFProtection()` — API route wrappers |
| `src/lib/csrf-utils.test.ts` | Unit tests |
| `docs/CSRF_PROTECTION.md` | Documentation |

---

## Layer 6: Session Management

**Status: Complete**

| Control | Value |
|---------|-------|
| Max concurrent sessions | 3 per user |
| Session expiry | 24 hours |
| Inactivity timeout | 7 minutes |
| Timeout warning | 1 minute before expiry |
| Session token | 32-byte `crypto.randomBytes` |
| Suspicious session flagging | New IP, new device, concurrent login from different IP |

### Files

| File | Purpose |
|------|---------|
| `src/lib/session-manager.ts` | `createSession()`, `validateSession()`, `terminateSession()`, `cleanupExpiredSessions()`, `parseUserAgent()` |
| `src/lib/session-timeout-utils.ts` | Inactivity timeout with 1-minute warning window |
| `src/lib/session-manager.test.ts` | Unit tests |
| `src/app/api/auth/session/route.ts` | Session API |
| `src/app/api/auth/sessions/route.ts` | Sessions listing (tokens masked to 4 chars) |

---

## Layer 7: Account Lockout

**Status: Complete**

| Control | Value |
|---------|-------|
| Standard lockout | After 5 failed login attempts |
| Standard duration | 30 minutes (auto-expires) |
| Security lockout | After 10+ failed attempts |
| Security lockout resolution | Admin intervention required |
| Lockout reasons | `FAILED_ATTEMPTS`, `PASSWORD_EXPIRED`, `ADMIN_LOCK`, `SECURITY_REVIEW` |

### Files

| File | Purpose |
|------|---------|
| `src/lib/account-lockout-utils.ts` | `incrementFailedLoginAttempts()`, `lockAccountManually()`, `unlockAccount()`, `autoUnlockExpiredAccounts()`, `isAccountLocked()` |
| `src/lib/account-lockout-utils.test.ts` | Unit tests |
| `src/app/api/auth/account-lockout-status/route.ts` | Lockout status API |

---

## Layer 8: Password Security

**Status: Complete**

| Control | Value |
|---------|-------|
| Min length | 8 characters |
| Complexity | Requires character type variety |
| Strength scoring | `zxcvbn` library (0–4 scale) |
| Hashing | bcrypt with salt rounds 10 |
| Password history | Prevents reuse of last 3 passwords |
| Admin password expiry | 60 days |
| User password expiry | 90 days |
| Expiry grace period | 7 days |
| Warning schedule | 14, 7, 3, 1 day(s) before expiry |
| Temporary passwords | 7-day validity, auto-generated 12-char |

### Files

| File | Purpose |
|------|---------|
| `src/lib/password-utils.ts` | `validatePasswordComplexity()`, `calculatePasswordStrength()`, `checkPasswordHistory()`, `hashPassword()`, `comparePassword()`, `generateTemporaryPassword()` |
| `src/lib/password-expiration-utils.ts` | `getPasswordExpirationStatus()`, `shouldSendWarning()`, tiered warning system |
| `src/lib/password-utils.test.ts` | Unit tests |
| `src/lib/password-expiration-utils.test.ts` | Unit tests |

---

## Layer 9: Security Headers

**Status: Complete**

Configured in `next.config.ts` with environment-aware values:

| Header | Production Value | Purpose |
|--------|-----------------|---------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS (2 years + preload) |
| `Content-Security-Policy` | `default-src 'self'; object-src 'none'; frame-ancestors 'self'; upgrade-insecure-requests` | Prevent XSS, clickjacking |
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking prevention |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing prevention |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | Disable browser APIs |
| `X-Permitted-Cross-Domain-Policies` | `none` | Block cross-domain policies |
| `Cross-Origin-Embedder-Policy` | `require-corp` | Isolate from cross-origin |
| `Cross-Origin-Opener-Policy` | `same-origin` | Prevent tab-based attacks |
| `Cross-Origin-Resource-Policy` | `same-origin` | Prevent cross-origin resource theft |
| `poweredByHeader` | `false` | Remove X-Powered-By header |

### Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Security headers configuration |
| `test-security-headers.sh` | Automated validation script with letter grading |
| `docs/SECURITY_HEADERS.md` | Documentation |

---

## Layer 10: Route-Based Access Control (RBAC)

**Status: Complete**

- Deny-by-default: if no permission rule matches a route, access is denied
- Enforced at Next.js middleware level (`middleware.ts`)
- URL patterns mapped to allowed roles in `route-permissions.ts`
- Unauthorized attempts logged to audit trail with severity levels

### Files

| File | Purpose |
|------|---------|
| `src/lib/route-permissions.ts` | `ROUTE_PERMISSIONS[]`, `canAccessRoute()`, `getAllowedRolesForRoute()` |
| `src/lib/route-permissions.test.ts` | Unit tests |
| `middleware.ts` | Next.js middleware enforcing RBAC, redirects, audit logging |

---

## Suspicious Login Detection

**Status: Complete**

Four detection checks, fail-safe (never blocks login on detection errors):

| Check | Trigger |
|-------|---------|
| New IP address | IP not seen in last 30 days of sessions |
| New device | User agent type not previously seen |
| Concurrent different-IP login | Already logged in from a different IP |
| Rapid successive login | Login from different IP within 5 minutes |

Returns `isSuspicious`, `reasons[]`, and `shouldNotify` flags.

File: `src/lib/suspicious-login-detector.ts`

---

## Device Information Collection

**Status: Complete**

Client-side utility parses user agent for browser, OS, device type, and serializes to JSON for the `x-device-info` header. Used throughout MFA, audit logging, and suspicious login detection.

File: `src/lib/device-info.ts`

---

## Test Coverage Summary

| Test Suite | Tests | Status |
|------------|-------|--------|
| `file-validation.test.ts` | 62 | All passing |
| `clamav.test.ts` | 6 | All passing |
| `api-auth.test.ts` | 12 | All passing |
| `rate-limiter.test.ts` | 8 | All passing |
| `sanitize-response.test.ts` | 12 | All passing |
| `api-schemas.test.ts` | 26 | All passing |
| `csrf-utils.test.ts` | — | All passing |
| `session-manager.test.ts` | — | All passing |
| `account-lockout-utils.test.ts` | — | All passing |
| `password-utils.test.ts` | — | All passing |
| `password-expiration-utils.test.ts` | — | All passing |
| `route-permissions.test.ts` | — | All passing |
| **Total security tests** | **126+** | **All passing** |

---

## Environment Variables Added

| Variable | Purpose | Default |
|----------|---------|---------|
| `CLAMAV_HOST` | ClamAV daemon host | `localhost` |
| `CLAMAV_PORT` | ClamAV daemon port | `3310` |
| `CLAMAV_ENABLED` | Enable/disable ClamAV | `true` |
| `CLAMAV_TIMEOUT` | ClamAV scan timeout (ms) | `30000` |
| `HRIMS_HOST` | HRIMS API host | `10.0.217.11` |
| `HRIMS_PORT` | HRIMS API port | `8135` |
| `HRIMS_API_KEY` | HRIMS API key | (required) |
| `HRIMS_TOKEN` | HRIMS auth token | (required) |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:9002` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |

---

## Remaining Work

| Item | Status | Impact |
|------|--------|--------|
| Wrap 15 API routes still using `searchParams.get('userRole')` with `withAuth` | Not started | These routes accept untrusted client-sent role parameters |
| Roll out `withCSRF()` to all mutation endpoints | Only applied to test endpoint | All POST/PUT/PATCH/DELETE routes need CSRF protection |
| Remove hardcoded SMTP credentials from `test-email.js` | Not addressed | Credentials exposed in version control |

---

## Design & Planning Documents

| Document | Path |
|----------|------|
| File Upload Security Design | `docs/superpowers/specs/2026-05-22-file-upload-security-design.md` |
| File Upload Security Plan | `docs/superpowers/plans/2026-05-22-file-upload-security.md` |
| API Security Design | `docs/superpowers/specs/2026-05-22-api-security-design.md` |
| API Security Plan | `docs/superpowers/plans/2026-05-22-api-security.md` |
| Audit Logging Design | `docs/superpowers/specs/2026-05-22-comprehensive-audit-logging-design.md` |
| Audit Logging Plan | `docs/superpowers/plans/2026-05-22-comprehensive-audit-logging.md` |
| Implementation Status | `docs/superpowers/2026-05-22-implementation-status.md` |
| Audit Partitioning Guide | `docs/superpowers/2026-05-22-audit-log-partitioning.md` |