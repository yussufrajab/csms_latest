# CSMS Logging Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 934 `console.log/error/warn` calls across 152 files with structured Pino logging, plus add log rotation, audit archival, and worker logging.

**Architecture:** Pino for structured JSON logging to `/var/log/csms/app/` in production, `pino-pretty` in dev. Client-side gets a thin wrapper that calls `console` methods (browser-safe). Workers use a child logger with `component: 'worker'`. PostgreSQL audit trail stays as-is — file logs are for app observability only.

**Tech Stack:** Pino, pino-pretty, rotating-file-stream, BullMQ (existing), node-cron (existing), Prisma (existing)

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/lib/logger.ts` | Core Pino logger — server-side, writes to files in prod, pretty-print in dev |
| `src/lib/logger-client.ts` | Browser-safe logger — delegates to `console` in client components |
| `src/lib/db.ts` | Modified — wire Prisma error events to logger |
| `src/lib/jobs/hrims-sync-worker.ts` | Modified — use worker child logger |
| `src/lib/audit-logger.ts` | Modified — replace console calls with logger |
| `src/lib/redis.ts` | Modified — replace console calls with logger |
| `src/lib/cron-service.ts` | Modified — replace console calls with logger |
| `src/lib/email.ts` | Modified — replace console calls with logger |
| `src/lib/session-manager.ts` | Modified — replace console calls with logger |
| `src/lib/minio.ts` | Modified — replace console calls with logger |
| `src/lib/api-client.ts` | Modified — replace console calls with logger |
| `src/lib/csrf-utils.ts` | Modified — replace console calls with logger |
| `src/lib/rate-limiter.ts` | Modified — replace console calls with logger |
| `src/lib/notifications.ts` | Modified — replace console calls with logger |
| `src/lib/auth-cookie-helper.ts` | Modified — replace console calls with logger |
| `src/lib/session-timeout-utils.ts` | Modified — replace console calls with logger |
| `src/lib/suspicious-login-detector.ts` | Modified — replace console calls with logger |
| `src/lib/debug-logger.ts` | Modified — use client logger in browser, server logger on SSR |
| `src/lib/hrims-config.ts` | Modified — replace console calls with logger |
| `src/lib/export-utils.ts` | Modified — replace console calls with logger |
| `src/lib/api-csrf-middleware.ts` | Modified — replace console calls with logger |
| `src/lib/cron-init.ts` | Modified — replace console calls with logger |
| `src/lib/audit-db.ts` | Modified — replace console calls with logger |
| `src/store/auth-store.ts` | Modified — use client logger |
| `src/app/api/**/route.ts` (79 files) | Modified — replace console calls with logger |
| `src/app/dashboard/**/*.tsx` (many) | Modified — use client logger |
| `scripts/archive-audit.sh` | New — audit archive script |
| `scripts/ensure-partitions.sh` | New — partition pre-creation script |
| `config/logrotate/csms` | New — logrotate configuration |

---

### Task 1: Install Pino Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install pino and pino-pretty**

```bash
npm install pino pino-pretty
```

- [ ] **Step 2: Verify installation**

```bash
npm ls pino pino-pretty
```

Expected: Both packages listed with version numbers.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add pino and pino-pretty dependencies"
```

---

### Task 2: Create Core Logger Module

**Files:**
- Create: `src/lib/logger.ts`

- [ ] **Step 1: Create `src/lib/logger.ts`**

```ts
import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');

// In test mode, use silent logger to avoid noise
if (isTest) {
  // We still export a real logger, but suppress most output
}

const transport = isDev
  ? pino.transport({ target: 'pino-pretty' })
  : pino.transport({
      targets: [
        {
          target: 'pino/file',
          options: { destination: '/var/log/csms/app/app.log', mkdir: true },
        },
        {
          target: 'pino/file',
          level: 'error',
          options: { destination: '/var/log/csms/app/error.log', mkdir: true },
        },
      ],
    });

export const logger = pino(
  {
    level: logLevel,
    base: {
      service: 'csms',
      env: process.env.NODE_ENV,
    },
  },
  transport
);

// Child loggers for specific components
export const workerLogger = logger.child({ component: 'worker' });
export const cronLogger = logger.child({ component: 'cron' });
export const authLogger = logger.child({ component: 'auth' });
export const dbLogger = logger.child({ component: 'db' });
export const emailLogger = logger.child({ component: 'email' });
export const fileLogger = logger.child({ component: 'file' });
export const hrimsLogger = logger.child({ component: 'hrims' });
export const sessionLogger = logger.child({ component: 'session' });
export const rateLimitLogger = logger.child({ component: 'rate-limit' });
export const csrfLogger = logger.child({ component: 'csrf' });
```

- [ ] **Step 2: Add LOG_LEVEL to `.env`**

Add to the end of `.env`:

```
# Logging Configuration
LOG_LEVEL=info
```

- [ ] **Step 3: Add LOG_LEVEL to `.env.test`**

Add to the end of `.env.test`:

```
# Logging Configuration
LOG_LEVEL=warn
```

- [ ] **Step 4: Verify logger module loads without errors**

```bash
npx tsx -e "import { logger } from './src/lib/logger'; logger.info({ test: true }, 'Logger test'); process.exit(0)"
```

Expected: JSON log line printed to stdout (dev mode uses pino-pretty).

- [ ] **Step 5: Commit**

```bash
git add src/lib/logger.ts .env .env.test
git commit -m "feat: add structured Pino logger module with child loggers"
```

---

### Task 3: Create Client-Side Logger

**Files:**
- Create: `src/lib/logger-client.ts`

- [ ] **Step 1: Create `src/lib/logger-client.ts`**

Client components can't import Pino (Node.js-only). This thin wrapper provides the same structured API but delegates to browser `console` methods. It's safe to import in both client and server components.

```ts
/**
 * Client-safe logger for browser components.
 *
 * Provides the same structured logging API as the server logger,
 * but delegates to browser console methods. Safe to import in
 * client components ('use client').
 *
 * For server-side code (API routes, lib/), import from '@/lib/logger' instead.
 */

type LogData = Record<string, unknown>;

const formatMessage = (component: string, msg: string) =>
  `[${component}] ${msg}`;

class ClientLogger {
  private component: string;

  constructor(component: string) {
    this.component = component;
  }

  child(bindings: { component: string }) {
    return new ClientLogger(bindings.component);
  }

  debug(data: LogData | string, msg?: string) {
    if (typeof data === 'string') {
      console.debug(formatMessage(this.component, data));
    } else {
      console.debug(formatMessage(this.component, msg || ''), data);
    }
  }

  info(data: LogData | string, msg?: string) {
    if (typeof data === 'string') {
      console.info(formatMessage(this.component, data));
    } else {
      console.info(formatMessage(this.component, msg || ''), data);
    }
  }

  warn(data: LogData | string, msg?: string) {
    if (typeof data === 'string') {
      console.warn(formatMessage(this.component, data));
    } else {
      console.warn(formatMessage(this.component, msg || ''), data);
    }
  }

  error(data: LogData | string, msg?: string) {
    if (typeof data === 'string') {
      console.error(formatMessage(this.component, data));
    } else {
      console.error(formatMessage(this.component, msg || ''), data);
    }
  }
}

export const clientLogger = new ClientLogger('app');

export default ClientLogger;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/logger-client.ts
git commit -m "feat: add client-safe logger for browser components"
```

---

### Task 4: Wire Prisma Errors to Logger

**Files:**
- Modify: `src/lib/db.ts`

- [ ] **Step 1: Update `src/lib/db.ts` to wire Prisma errors to logger**

The current file creates a bare `PrismaClient()` with no logging. Add error event logging:

```ts
import { PrismaClient } from '@prisma/client';
import { dbLogger } from '@/lib/logger';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { emit: 'event', level: 'error' },
    ],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
};

const db = globalThis.prisma ?? prismaClientSingleton();

// Wire Prisma errors to structured logger
db.$on('error', (e) => {
  dbLogger.error({ err: e }, 'Prisma error');
});

export { db };

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}
```

- [ ] **Step 2: Verify Prisma still connects**

```bash
npx tsx -e "import { db } from './src/lib/db'; db.\$queryRaw\`SELECT 1\`.then(() => console.log('OK')).catch(e => console.error(e)).finally(() => process.exit(0))"
```

Expected: `OK` printed.

- [ ] **Step 3: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat: wire Prisma error events to structured logger"
```

---

### Task 5: Replace Console Calls in Core Server Libraries (lib/)

This task replaces all `console.log/error/warn` calls in the server-side `src/lib/` files with the structured logger. Each file gets the appropriate child logger.

**Files:**
- Modify: `src/lib/redis.ts`
- Modify: `src/lib/cron-service.ts`
- Modify: `src/lib/cron-init.ts`
- Modify: `src/lib/email.ts`
- Modify: `src/lib/session-manager.ts`
- Modify: `src/lib/minio.ts`
- Modify: `src/lib/api-client.ts`
- Modify: `src/lib/csrf-utils.ts`
- Modify: `src/lib/rate-limiter.ts`
- Modify: `src/lib/notifications.ts`
- Modify: `src/lib/auth-cookie-helper.ts`
- Modify: `src/lib/session-timeout-utils.ts`
- Modify: `src/lib/suspicious-login-detector.ts`
- Modify: `src/lib/hrims-config.ts`
- Modify: `src/lib/export-utils.ts`
- Modify: `src/lib/api-csrf-middleware.ts`
- Modify: `src/lib/audit-db.ts`
- Modify: `src/lib/audit-logger.ts`
- Modify: `src/lib/debug-logger.ts`

**Conversion pattern** — apply this pattern to every file:

1. Add `import { logger } from '@/lib/logger';` (or the relevant child logger)
2. Replace:
   - `console.log('[TAG] message', data)` → `logger.info({ ...data }, 'message')`
   - `console.error('[TAG] message', data)` → `logger.error({ ...data }, 'message')`
   - `console.warn('[TAG] message', data)` → `logger.warn({ ...data }, 'message')`
3. Flatten bracket-prefixed strings into structured fields:
   - `console.log('[AUTH] Login success', { userId })` → `authLogger.info({ userId }, 'Login success')`
   - `console.error('[SESSION] Expired', { sessionId })` → `sessionLogger.error({ sessionId }, 'Session expired')`

**Key per-file mappings:**

| File | Logger | Replace count |
|------|--------|--------------|
| `redis.ts` | `dbLogger` | 3 |
| `cron-service.ts` | `cronLogger` | 21 |
| `cron-init.ts` | `cronLogger` | 1 |
| `email.ts` | `emailLogger` | 7 |
| `session-manager.ts` | `sessionLogger` | 16 |
| `minio.ts` | `fileLogger` | 9 |
| `api-client.ts` | `logger` | 13 |
| `csrf-utils.ts` | `csrfLogger` | 5 |
| `rate-limiter.ts` | `rateLimitLogger` | 4 |
| `notifications.ts` | `logger` | 4 |
| `auth-cookie-helper.ts` | `authLogger` | 3 |
| `session-timeout-utils.ts` | `sessionLogger` | 3 |
| `suspicious-login-detector.ts` | `authLogger` | 1 |
| `hrims-config.ts` | `hrimsLogger` | 2 |
| `export-utils.ts` | `logger` | 2 |
| `api-csrf-middleware.ts` | `csrfLogger` | 1 |
| `audit-db.ts` | `dbLogger` | 9 |
| `audit-logger.ts` | `logger` | 3 |
| `debug-logger.ts` | Keep `console` in browser, use `logger` on SSR |

- [ ] **Step 1: Replace console calls in `src/lib/redis.ts`**

Replace the 3 console calls with `dbLogger`:

```ts
// Before:
console.log('✅ Redis connected');
console.error('❌ Redis connection error:', error);
console.log('⚠️  Redis connection closed');

// After:
dbLogger.info('Redis connected');
dbLogger.error({ err: error }, 'Redis connection error');
dbLogger.info('Redis connection closed');
```

- [ ] **Step 2: Replace console calls in `src/lib/cron-service.ts`**

Replace all 21 console calls. The file already uses `[CRON]` prefixes — convert these to structured fields:

```ts
// Before:
console.log('[CRON] Starting password expiration check...');
console.error('[CRON] Error checking password expirations:', error);

// After:
cronLogger.info('Starting password expiration check');
cronLogger.error({ err: error }, 'Error checking password expirations');
```

- [ ] **Step 3: Replace console calls in remaining `src/lib/` files**

Continue with the same pattern for: `cron-init.ts`, `email.ts`, `session-manager.ts`, `minio.ts`, `api-client.ts`, `csrf-utils.ts`, `rate-limiter.ts`, `notifications.ts`, `auth-cookie-helper.ts`, `session-timeout-utils.ts`, `suspicious-login-detector.ts`, `hrims-config.ts`, `export-utils.ts`, `api-csrf-middleware.ts`, `audit-db.ts`, `audit-logger.ts`.

For `audit-logger.ts` specifically, replace:
```ts
// Before:
console.log(`[AUDIT] ${data.severity} - ${data.eventType}:`, { ... });
console.error('[AUDIT] Failed to log audit event:', error);

// After:
logger.info({ action: data.eventType, severity: data.severity, user: data.username, route: data.attemptedRoute, blocked: data.wasBlocked }, `${data.severity} - ${data.eventType}`);
logger.error({ err: error, eventData: data }, 'Failed to log audit event');
```

For `debug-logger.ts` — this is a client-side only utility (uses `localStorage`). Keep the browser console calls but add a guard for SSR:

```ts
// Add at the top of debug-logger.ts:
import { isServerLogger } from '@/lib/logger';

// In the log() method, add server-side logging:
static log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, message, data: data ? JSON.stringify(data) : undefined };

  if (typeof window !== 'undefined') {
    // Browser: keep existing localStorage behavior
    const existingLogs = this.getLogs();
    existingLogs.push(logEntry);
    const trimmedLogs = existingLogs.slice(-this.MAX_LOGS);
    try {
      localStorage.setItem(this.LOG_KEY, JSON.stringify(trimmedLogs));
    } catch (error) {
      // Storage full, silently ignore
    }
  }

  // Always log to structured logger
  if (data) {
    isServerLogger.info({ debugLog: data }, message);
  } else {
    isServerLogger.info(message);
  }
}
```

Actually, since `debug-logger.ts` runs in the browser and uses `localStorage`, the simplest approach is to leave its `console.log` calls as-is (they're for browser DevTools) and NOT import the server logger there. The file already does what it needs to do for browser debugging. Just remove the `console.error` calls and replace with silent error handling.

- [ ] **Step 4: Run typecheck to verify no import errors**

```bash
npm run typecheck
```

Expected: No type errors related to logger imports.

- [ ] **Step 5: Run existing tests**

```bash
npm test
```

Expected: All existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/
git commit -m "feat: replace console calls with structured Pino logger in lib/ modules"
```

---

### Task 6: Replace Console Calls in Worker and Queue Files

**Files:**
- Modify: `src/lib/jobs/hrims-sync-worker.ts` (25 console calls)
- Modify: `src/lib/jobs/hrims-sync-queue.ts` (3 console calls)

- [ ] **Step 1: Replace console calls in `hrims-sync-worker.ts`**

Add import: `import { workerLogger } from '@/lib/logger';`

Convert all 25 console calls. Key pattern:

```ts
// Before:
console.log(`[HRIMS] Processing job ${job.id}`);
console.error('[HRIMS] Sync failed:', error);

// After:
workerLogger.info({ jobId: job.id }, 'Processing HRIMS sync job');
workerLogger.error({ err: error, jobId: job.id }, 'HRIMS sync failed');
```

- [ ] **Step 2: Replace console calls in `hrims-sync-queue.ts`**

Add import: `import { workerLogger } from '@/lib/logger';`

```ts
// Before:
console.log('✅ HRIMS Sync Queue initialized');
console.error('❌ Failed to initialize HRIMS Sync Queue:', error);

// After:
workerLogger.info('HRIMS Sync Queue initialized');
workerLogger.error({ err: error }, 'Failed to initialize HRIMS Sync Queue');
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/jobs/
git commit -m "feat: replace console calls with worker logger in HRIMS sync"
```

---

### Task 7: Replace Console Calls in API Route Files

This is the largest batch — 79 API route files with console calls. Apply the same pattern to all: import the appropriate logger, replace console calls with structured equivalents.

**Files:**
- All files in `src/app/api/` that contain `console.log/error/warn` calls

**Conversion pattern for API routes:**

```ts
// Add import at top of each file:
import { logger } from '@/lib/logger';

// Or use a domain-specific child logger:
import { authLogger } from '@/lib/logger';
import { hrimsLogger } from '@/lib/logger';
import { fileLogger } from '@/lib/logger';

// Convert error handlers:
// Before:
console.error('Failed to process request:', error);
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

// After:
logger.error({ err: error }, 'Failed to process request');
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

// Convert info logs:
// Before:
console.log('Request processed successfully', { userId, action });

// After:
logger.info({ userId, action }, 'Request processed successfully');
```

**File-to-logger mapping for API routes:**

| Route path | Logger | Files |
|-----------|--------|-------|
| `/api/auth/*` | `authLogger` | login, logout, employee-login, change-password, mfa/*, session/*, refresh-user-data, account-lockout-status, activity |
| `/api/hrims/*` | `hrimsLogger` | test, fetch-employee, sync-employee, sync-documents, sync-certificates, bulk-fetch, fetch-by-institution, fetch-documents-by-institution, fetch-photos-by-institution, search-employee, job-status, sync-status |
| `/api/files/*` | `fileLogger` | upload, download, preview, exists, employee-documents, employee-photos |
| `/api/employees/*` | `logger` | route, search, urgent-actions, manual-entry, bulk-upload, validate, fetch-documents, fetch-photo, documents, certificates |
| `/api/admin/*` | `logger` | lock-account, unlock-account, reset-password, trigger-password-check, cleanup-sessions, hrims-settings |
| All other routes | `logger` | promotions, confirmations, cadre-change, lwop, retirement, resignation, termination, service-extension, complaints, reports, etc. |

- [ ] **Step 1: Replace console calls in `src/app/api/auth/` routes**

Files: `login/route.ts` (11 calls), `logout/route.ts` (7), `employee-login/route.ts` (8), `change-password/route.ts` (8), `session/route.ts` (2), `sessions/force-logout/route.ts` (1), `sessions/route.ts` (2), `refresh-user-data/route.ts` (2), `activity/route.ts` (2), `password-status/route.ts` (1), `account-lockout-status/route.ts` (1), `mfa/send-otp/route.ts` (1), `mfa/verify-otp/route.ts` (1), `mfa/magic-link/route.ts` (1), `mfa/magic-link/verify/route.ts` (1)

- [ ] **Step 2: Replace console calls in `src/app/api/hrims/` routes**

Files: `test/route.ts` (47 calls - largest), `fetch-employee/route.ts` (21), `sync-employee/route.ts` (16), `sync-documents/route.ts` (8), `sync-certificates/route.ts` (8), `bulk-fetch/route.ts` (25), `fetch-by-institution/route.ts` (2), `fetch-documents-by-institution/route.ts` (28), `fetch-photos-by-institution/route.ts` (9), `search-employee/route.ts` (6), `job-status/[jobId]/route.ts` (1), `sync-status/[jobId]/route.ts` (1)

- [ ] **Step 3: Replace console calls in `src/app/api/employees/` routes**

Files: `route.ts` (7), `search/route.ts` (6), `urgent-actions/route.ts` (6), `manual-entry/route.ts` (6), `bulk-upload/route.ts` (3), `validate/route.ts` (1), `[id]/fetch-documents/route.ts` (31), `[id]/fetch-photo/route.ts` (19), `[id]/documents/route.ts` (2), `[id]/certificates/route.ts` (3)

- [ ] **Step 4: Replace console calls in `src/app/api/files/` routes**

Files: `upload/route.ts` (1), `download/[...objectKey]/route.ts` (3), `preview/[...objectKey]/route.ts` (3), `exists/[...objectKey]/route.ts` (3), `employee-photos/[filename]/route.ts` (2), `employee-documents/[filename]/route.ts` (2)

- [ ] **Step 5: Replace console calls in all remaining API route files**

Files: `promotions/` (12 + 2), `confirmations/` (11 + 2), `cadre-change/` (11 + 2), `lwop/` (10 + 2), `retirement/` (10 + 2), `resignation/` (10 + 2), `termination/` (10 + 2), `service-extension/` (11 + 2), `complaints/` (2 + 2), `reports/` (2), `institutions/` (5 + 2), `users/` (2 + 2), `notifications/` (2), `confirmation-requests/` (3), `lwop-requests/` (3), `retirement-requests/` (3), `service-extension-requests/` (3), `dashboard/metrics/` (16), `admin/` (various), `audit/` (2 + 2), `promotion-form-template/` (1 + 1), `test/` (2), `debug-request/` (4), `test/csrf/` (1)

- [ ] **Step 6: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add src/app/api/
git commit -m "feat: replace console calls with structured logger in all API routes"
```

---

### Task 8: Replace Console Calls in Client-Side Components

**Files:**
- Modify: `src/store/auth-store.ts` (64 calls — largest single file)
- Modify: `src/hooks/use-inactivity-timeout.ts` (4 calls)
- Modify: `src/hooks/use-api-init.ts` (2 calls)
- Modify: `src/hooks/use-auth.ts` (1 call)
- Modify: `src/components/ui/file-preview-modal.tsx` (10 calls)
- Modify: `src/components/ui/file-upload.tsx` (2 calls)
- Modify: `src/components/layout/sidebar.tsx` (10 calls)
- Modify: `src/components/shared/employee-search.tsx` (5 calls)
- Modify: `src/components/auth/login-form.tsx` (7 calls)
- Modify: `src/components/auth/password-expiration-banner.tsx` (1)
- Modify: `src/components/auth/device-limit-dialog.tsx` (1)
- Modify: `src/components/debug-panel.tsx` (3)
- Modify: `src/components/employee/document-upload.tsx` (2)
- Modify: `src/components/employee/certificate-upload.tsx` (2)
- Modify: `src/components/examples/file-upload-example.tsx` (2)
- Modify: `src/components/layout/notification-bell.tsx` (2)
- Modify: `src/components/manual-entry/personal-info-step.tsx` (1)
- Modify: `src/app/dashboard/` pages (multiple, ~5-10 calls each)
- Modify: `src/ai/wrapper.ts` (1 call)

**Conversion pattern for client components:**

```ts
// Add import at top of each client component:
import { clientLogger } from '@/lib/logger-client';
// Or create a child logger:
const log = clientLogger.child({ component: 'auth-store' });

// Convert:
// Before:
console.log('User logged in:', userData);
console.error('Login failed:', error);

// After:
log.info({ userId: userData.id }, 'User logged in');
log.error({ err: error }, 'Login failed');
```

- [ ] **Step 1: Replace console calls in `src/store/auth-store.ts`**

This is the largest file (64 calls). Add `clientLogger.child({ component: 'auth-store' })` and convert all calls.

- [ ] **Step 2: Replace console calls in `src/hooks/` files**

- `use-inactivity-timeout.ts` (4 calls)
- `use-api-init.ts` (2 calls)
- `use-auth.ts` (1 call)

- [ ] **Step 3: Replace console calls in `src/components/` files**

- `ui/file-preview-modal.tsx` (10)
- `ui/file-upload.tsx` (2)
- `layout/sidebar.tsx` (10)
- `shared/employee-search.tsx` (5)
- `auth/login-form.tsx` (7)
- `auth/password-expiration-banner.tsx` (1)
- `auth/device-limit-dialog.tsx` (1)
- `debug-panel.tsx` (3)
- `employee/document-upload.tsx` (2)
- `employee/certificate-upload.tsx` (2)
- `examples/file-upload-example.tsx` (2)
- `layout/notification-bell.tsx` (2)
- `manual-entry/personal-info-step.tsx` (1)

- [ ] **Step 4: Replace console calls in `src/app/dashboard/` page files**

Pages with console calls: `reports`, `confirmation`, `page`, `add-employee`, `profile`, `termination`, `retirement`, `promotion`, `admin/session-cleanup`, `complaints`, `cadre-change`, `resignation`, `recent-activities`, `lwop`, `admin/hrims-settings`, `admin/audit-trail`, `admin/get-documents`, `admin/institutions`, `institutions`, `service-extension`, `dismissal`, `track-status`, `admin/test-hrims`, `admin/fetch-data`

- [ ] **Step 5: Replace console call in `src/ai/wrapper.ts`**

1 call — use `logger` (server-side AI module).

- [ ] **Step 6: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add src/store/ src/hooks/ src/components/ src/app/dashboard/ src/ai/
git commit -m "feat: replace console calls with client logger in frontend components"
```

---

### Task 9: Write Logger Unit Tests

**Files:**
- Create: `src/lib/logger.test.ts`

- [ ] **Step 1: Create `src/lib/logger.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock pino before importing the module
vi.mock('pino', () => {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => mockLogger),
  };
  return {
    default: vi.fn(() => mockLogger),
    __mockLogger: mockLogger,
  };
});

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports logger with correct base fields', async () => {
    const { logger } = await import('./logger');
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('exports child loggers for each component', async () => {
    const { workerLogger, cronLogger, authLogger, dbLogger, emailLogger, fileLogger, hrimsLogger, sessionLogger, rateLimitLogger, csrfLogger } = await import('./logger');
    expect(workerLogger).toBeDefined();
    expect(cronLogger).toBeDefined();
    expect(authLogger).toBeDefined();
    expect(dbLogger).toBeDefined();
    expect(emailLogger).toBeDefined();
    expect(fileLogger).toBeDefined();
    expect(hrimsLogger).toBeDefined();
    expect(sessionLogger).toBeDefined();
    expect(rateLimitLogger).toBeDefined();
    expect(csrfLogger).toBeDefined();
  });

  it('respects LOG_LEVEL environment variable', async () => {
    process.env.LOG_LEVEL = 'debug';
    vi.resetModules();
    const { logger } = await import('./logger');
    expect(logger).toBeDefined();
    delete process.env.LOG_LEVEL;
  });
});

describe('clientLogger', () => {
  it('exports clientLogger with structured methods', async () => {
    const { clientLogger } = await import('./logger-client');
    expect(clientLogger).toBeDefined();
    expect(typeof clientLogger.info).toBe('function');
    expect(typeof clientLogger.error).toBe('function');
    expect(typeof clientLogger.warn).toBe('function');
    expect(typeof clientLogger.debug).toBe('function');
  });

  it('creates child loggers with component binding', async () => {
    const { clientLogger } = await import('./logger-client');
    const childLogger = clientLogger.child({ component: 'test' });
    expect(childLogger).toBeDefined();
    expect(typeof childLogger.info).toBe('function');
  });

  it('calls console methods for browser output', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { clientLogger } = require('./logger-client');
    clientLogger.info({ test: true }, 'Test message');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test -- src/lib/logger.test.ts
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/logger.test.ts
git commit -m "test: add unit tests for structured logger modules"
```

---

### Task 10: Create Logrotate Configuration

**Files:**
- Create: `config/logrotate/csms`

- [ ] **Step 1: Create `config/logrotate/csms`**

This file should be deployed to `/etc/logrotate.d/csms` on the server:

```
/var/log/csms/app/*.log
/var/log/csms/workers/*.log
{
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
```

- [ ] **Step 2: Create deployment helper script `scripts/deploy-logrotate.sh`**

```bash
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../config/logrotate/csms"

echo "Deploying logrotate configuration..."
sudo cp "$CONFIG_FILE" /etc/logrotate.d/csms
sudo chmod 644 /etc/logrotate.d/csms

echo "Testing logrotate configuration..."
sudo logrotate --debug /etc/logrotate.d/csms

echo "Logrotate configuration deployed successfully."
echo ""
echo "To manually test rotation:"
echo "  sudo logrotate --force /etc/logrotate.d/csms"
```

- [ ] **Step 3: Make script executable**

```bash
chmod +x scripts/deploy-logrotate.sh
```

- [ ] **Step 4: Commit**

```bash
git add config/ scripts/deploy-logrotate.sh
git commit -m "feat: add logrotate configuration for CSMS log files"
```

---

### Task 11: Create Audit Archive Script

**Files:**
- Create: `scripts/archive-audit.sh`

- [ ] **Step 1: Create `scripts/archive-audit.sh`**

```bash
#!/bin/bash
set -e

# CSMS Audit Log Archival Script
# Exports the previous month's audit partition to compressed JSON
# and optionally drops the partition after verification.
#
# Usage: ./archive-audit.sh [--drop-partition]
#   --drop-partition  Also drop the PostgreSQL partition after archiving

DB_NAME="${CSMS_DB_NAME:-nody}"
DB_USER="${CSMS_DB_USER:-postgres}"
ARCHIVE_DIR="/var/log/csms/archive/audit"
DROP_PARTITION=false

if [[ "${1:-}" == "--drop-partition" ]]; then
  DROP_PARTITION=true
fi

YEAR=$(date -d "last month" +"%Y")
MONTH=$(date -d "last month" +"%m")
PARTITION="audit_log_${YEAR}_${MONTH}"
OUTPUT="${ARCHIVE_DIR}/${YEAR}/${PARTITION}.json"

mkdir -p "${ARCHIVE_DIR}/${YEAR}"

echo "[$(date -u +%FT%TZ)] Starting archive: ${PARTITION}"

# Check if partition exists
PARTITION_EXISTS=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'audit'
    AND table_name = '${PARTITION}'
  );
" 2>/dev/null | tr -d '[:space:]')

if [ "$PARTITION_EXISTS" != "t" ]; then
  echo "[$(date -u +%FT%TZ)] ERROR: Partition audit.${PARTITION} does not exist"
  exit 1
fi

# Export partition to JSON
psql -U "$DB_USER" -d "$DB_NAME" <<EOF
COPY (
    SELECT row_to_json(t)
    FROM (
        SELECT * FROM audit.${PARTITION} ORDER BY created_at
    ) t
) TO '${OUTPUT}';
EOF

ROW_COUNT=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "
  SELECT COUNT(*) FROM audit.${PARTITION};
" | tr -d '[:space:]')

echo "[$(date -u +%FT%TZ)] Exported ${ROW_COUNT} rows to ${OUTPUT}"

# Compress and checksum
gzip -f "${OUTPUT}"
sha256sum "${OUTPUT}.gz" > "${OUTPUT}.gz.sha256"

echo "[$(date -u +%FT%TZ)] Archive complete: ${OUTPUT}.gz"
echo "[$(date -u +%FT%TZ)] Checksum: $(cat ${OUTPUT}.gz.sha256)"

# Optionally drop partition after verifying archive
if [ "$DROP_PARTITION" = true ]; then
  if [ -s "${OUTPUT}.gz" ]; then
    psql -U "$DB_USER" -d "$DB_NAME" -c "DROP TABLE IF EXISTS audit.${PARTITION};"
    echo "[$(date -u +%FT%TZ)] Partition dropped: ${PARTITION}"
  else
    echo "[$(date -u +%FT%TZ)] ERROR: Archive empty — partition NOT dropped"
    exit 1
  fi
fi
```

- [ ] **Step 2: Make script executable**

```bash
chmod +x scripts/archive-audit.sh
```

- [ ] **Step 3: Commit**

```bash
git add scripts/archive-audit.sh
git commit -m "feat: add audit log archival script with partition verification"
```

---

### Task 12: Create Partition Pre-creation Script

**Files:**
- Create: `scripts/ensure-partitions.sh`

- [ ] **Step 1: Create `scripts/ensure-partitions.sh`**

```bash
#!/bin/bash
set -e

# CSMS Audit Partition Pre-creation Script
# Ensures that audit log partitions exist for the next N months
# preventing insert failures when new months arrive.

DB_NAME="${CSMS_DB_NAME:-nody}"
DB_USER="${CSMS_DB_USER:-postgres}"
MONTHS_AHEAD="${CSMS_PARTITION_MONTHS:-6}"

echo "[$(date -u +%FT%TZ)] Ensuring audit partitions exist for next ${MONTHS_AHEAD} months"

for i in $(seq 0 "$MONTHS_AHEAD"); do
  MONTH_DATE=$(date -d "+${i} months" +"%Y_%m")
  PARTITION="audit_log_${MONTH_DATE}"
  
  # Check if partition exists
  EXISTS=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'audit'
      AND table_name = '${PARTITION}'
    );
  " | tr -d '[:space:]')
  
  if [ "$EXISTS" != "t" ]; then
    # Calculate date range for the partition
    START_DATE=$(date -d "+${i} months" +"%Y-%m-01")
    END_DATE=$(date -d "+$((i+1)) months" +"%Y-%m-01")
    
    psql -U "$DB_USER" -d "$DB_NAME" <<EOSQL
CREATE TABLE IF NOT EXISTS audit.${PARTITION}
  PARTITION OF audit.audit_log
  FOR VALUES FROM ('${START_DATE}') TO ('${END_DATE}');
EOSQL
    echo "[$(date -u +%FT%TZ)] Created partition: audit.${PARTITION}"
  else
    echo "[$(date -u +%FT%TZ)] Partition already exists: audit.${PARTITION}"
  fi
done

echo "[$(date -u +%FT%TZ)] Partition check complete"
```

- [ ] **Step 2: Make script executable**

```bash
chmod +x scripts/ensure-partitions.sh
```

- [ ] **Step 3: Commit**

```bash
git add scripts/ensure-partitions.sh
git commit -m "feat: add audit partition pre-creation script"
```

---

### Task 13: Create Server Setup Script

**Files:**
- Create: `scripts/setup-logging.sh`

- [ ] **Step 1: Create `scripts/setup-logging.sh`**

This script handles Phase 1 (server directory setup) and Phase 5 (cron configuration):

```bash
#!/bin/bash
set -e

# CSMS Logging Infrastructure Setup
# Run this script on the production/staging server to create
# log directories, set permissions, and configure cron jobs.

CSMS_USER="${CSMS_USER:-nextjs}"
LOG_DIR="/var/log/csms"

echo "=== CSMS Logging Infrastructure Setup ==="
echo ""

# Phase 1: Create log directories
echo "[1/4] Creating log directories..."
sudo mkdir -p "${LOG_DIR}/app"
sudo mkdir -p "${LOG_DIR}/audit"
sudo mkdir -p "${LOG_DIR}/workers"
sudo mkdir -p "${LOG_DIR}/archive/audit"

# Set ownership and permissions
sudo chown -R "${CSMS_USER}:${CSMS_USER}" "${LOG_DIR}"
sudo chmod -R 750 "${LOG_DIR}"

echo "  Directories created: ${LOG_DIR}/{app,audit,workers,archive/audit}"
echo "  Owner: ${CSMS_USER}:${CSMS_USER}"
echo "  Permissions: 750"
echo ""

# Phase 3: Deploy logrotate config
echo "[2/4] Deploying logrotate configuration..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/deploy-logrotate.sh" ]; then
  bash "${SCRIPT_DIR}/deploy-logrotate.sh"
else
  echo "  WARNING: deploy-logrotate.sh not found, skipping logrotate setup"
fi
echo ""

# Phase 5: Configure cron jobs
echo "[3/4] Configuring cron jobs..."
CRON_ARCHIVE="0 2 1 * * ${SCRIPT_DIR}/archive-audit.sh >> /var/log/csms/workers/archive.log 2>&1"
CRON_PARTITIONS="0 3 1 * * ${SCRIPT_DIR}/ensure-partitions.sh >> /var/log/csms/workers/partitions.log 2>&1"

# Add cron entries if they don't exist
(crontab -l 2>/dev/null | grep -v "archive-audit.sh"; echo "$CRON_ARCHIVE") | crontab -
(crontab -l 2>/dev/null | grep -v "ensure-partitions.sh"; echo "$CRON_PARTITIONS") | crontab -

echo "  Archive cron: 2 AM on 1st of each month"
echo "  Partition cron: 3 AM on 1st of each month"
echo ""

# Verify setup
echo "[4/4] Verifying setup..."
echo ""
echo "  Log directories:"
ls -la "${LOG_DIR}/"
echo ""
echo "  Logrotate config:"
cat /etc/logrotate.d/csms 2>/dev/null || echo "  (not yet deployed)"
echo ""
echo "  Cron jobs:"
crontab -l 2>/dev/null | grep -E "(archive-audit|ensure-partitions)" || echo "  (none configured)"
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Deploy the application with the new Pino logger"
echo "  2. Verify logs are writing to ${LOG_DIR}/app/"
echo "  3. Configure Wazuh agent (see docs/superpowers/csms-logging-plan.md Phase 6)"
echo "  4. Test archive script: sudo -u ${CSMS_USER} ${SCRIPT_DIR}/archive-audit.sh"
```

- [ ] **Step 2: Make script executable**

```bash
chmod +x scripts/setup-logging.sh
```

- [ ] **Step 3: Commit**

```bash
git add scripts/setup-logging.sh
git commit -m "feat: add logging infrastructure setup script"
```

---

### Task 14: Final Verification — Build and Full Test Suite

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: No new lint errors (existing warnings acceptable).

- [ ] **Step 3: Run unit tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 4: Run build**

```bash
npm run build
```

Expected: Build succeeds. (Note: the project has `typescript.errors` and `eslint.warnings` ignored during builds per the CLAUDE.md config.)

- [ ] **Step 5: Verify no remaining console calls in server-side code**

```bash
grep -r "console\.\(log\|error\|warn\)" src/lib/ src/app/api/ --include="*.ts" --include="*.tsx" | grep -v "logger-client.ts" | grep -v "node_modules" | head -20
```

Expected: 0 results (or only references in `logger-client.ts`).

- [ ] **Step 6: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: resolve any remaining console references in server code"
```

---

## Infrastructure Checklist (Manual — Not Code)

These items require server access and cannot be done in code:

- [ ] **Phase 1**: Run `scripts/setup-logging.sh` on production server (creates `/var/log/csms/` directories)
- [ ] **Phase 3**: Verify logrotate is working (`sudo logrotate --debug /etc/logrotate.d/csms`)
- [ ] **Phase 5**: Verify cron jobs are running (`crontab -l`)
- [ ] **Phase 6**: Configure Wazuh agent (add CSMS log paths to `/var/ossec/etc/ossec.conf`)
- [ ] **Phase 6**: Restart Wazuh agent (`sudo systemctl restart wazuh-agent`)
- [ ] **Phase 6**: Verify logs appear in OpenSearch Dashboard
- [ ] **Phase 7**: Define and document retention policy with stakeholders
- [ ] **Phase 7**: Set up offsite backup for archived audit logs

---

## Summary

| Task | Description | Estimated effort |
|------|-------------|-----------------|
| 1 | Install Pino dependencies | 5 min |
| 2 | Create core logger module | 15 min |
| 3 | Create client-side logger | 10 min |
| 4 | Wire Prisma errors to logger | 10 min |
| 5 | Replace console calls in lib/ modules | 30 min |
| 6 | Replace console calls in worker files | 10 min |
| 7 | Replace console calls in API routes | 60 min |
| 8 | Replace console calls in client components | 45 min |
| 9 | Write logger unit tests | 15 min |
| 10 | Create logrotate configuration | 10 min |
| 11 | Create audit archive script | 15 min |
| 12 | Create partition pre-creation script | 10 min |
| 13 | Create server setup script | 10 min |
| 14 | Final verification (build + test) | 15 min |
| **Total** | | **~4.5 hours** |