# Audit Log Partitioning Implementation

## Problem

The CSMS application generates a high volume of audit events — every login, every request submission, every admin action. Storing these in a single `AuditLog` table via Prisma creates two problems:

1. **Query degradation** — As the table grows into millions of rows, filtering by date range requires full table scans
2. **Prisma overhead** — Prisma's query builder adds latency for simple log inserts that don't need relations or complex mappings

## Architecture

The implementation replaces the Prisma-backed `AuditLog` model with a **PostgreSQL range-partitioned table** in a dedicated `audit` schema, accessed through a **raw SQL layer** using the `pg` driver.

### Three-Layer Design

```
┌─────────────────────────────────────────┐
│  API Routes (audit-logger.ts)           │  ← High-level convenience functions
│  logLoginAttempt(), logUserAction(),     │
│  logRequestApproval(), etc.             │
├─────────────────────────────────────────┤
│  Audit Wrapper (audit-wrapper.ts)        │  ← withAuditLogging() for auto-logging
├─────────────────────────────────────────┤
│  Raw SQL Layer (audit-db.ts)            │  ← writeAuditLog(), queryAuditLogs(),
│  Uses pg Pool, audit schema,            │     queryAuditStats(), ensurePartitions()
│  INET type, partitioned table           │
├─────────────────────────────────────────┤
│  PostgreSQL                              │
│  audit.audit_log (partitioned parent)    │
│  ├── audit.audit_log_2025_11            │
│  ├── audit.audit_log_2025_12            │
│  ├── audit.audit_log_2026_01           │
│  │   ...                                │
│  └── audit.audit_log_2027_05            │
└─────────────────────────────────────────┘
```

---

## File-by-File Breakdown

### 1. `prisma/migrations/20260522010000_migrate_audit_to_partitioned/migration.sql`

This is the core migration that sets everything up:

**Step 1 — Create the `audit` schema:**
```sql
CREATE SCHEMA IF NOT EXISTS audit;
```
Isolates audit data from the application's `public` schema.

**Step 2 — Create the partitioned parent table:**
```sql
CREATE TABLE audit.audit_log (
    id BIGSERIAL,
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id TEXT,
    username TEXT,
    user_role TEXT,
    action TEXT NOT NULL,           -- e.g., 'LOGIN_SUCCESS', 'REQUEST_APPROVED'
    event_category TEXT NOT NULL DEFAULT 'SYSTEM',
    severity TEXT NOT NULL DEFAULT 'INFO',
    entity_type TEXT NOT NULL DEFAULT 'SYSTEM',
    entity_id TEXT,
    ip_address INET,                -- Native PostgreSQL INET type for IP storage
    device_info JSONB,             -- Browser/device metadata
    request_method TEXT,
    request_route TEXT NOT NULL,
    is_authenticated BOOLEAN DEFAULT false,
    was_blocked BOOLEAN DEFAULT false,
    block_reason TEXT,
    additional_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)   -- Composite PK includes partition key
) PARTITION BY RANGE (created_at);
```

Key design decisions:
- **`PARTITION BY RANGE (created_at)`** — Monthly partitions based on timestamp. This means date-range queries only scan the relevant partition.
- **`BIGSERIAL` for `id`** — Auto-incrementing 64-bit ID, not UUID, for insert performance on high-throughput tables.
- **`INET` type for `ip_address`** — Native PostgreSQL type that supports CIDR queries and network operators.
- **Composite primary key `(id, created_at)`** — PostgreSQL requires the partition key to be included in the primary key.
- **`JSONB` for `device_info` and `additional_data`** — Flexible schema for varying metadata without table alterations.

**Step 3 — Indexes on the parent table:**
```sql
CREATE INDEX idx_audit_log_action ON audit.audit_log (action);
CREATE INDEX idx_audit_log_event_category ON audit.audit_log (event_category);
CREATE INDEX idx_audit_log_severity ON audit.audit_log (severity);
CREATE INDEX idx_audit_log_user_id ON audit.audit_log (user_id);
CREATE INDEX idx_audit_log_created_at ON audit.audit_log (created_at);
CREATE INDEX idx_audit_log_request_route ON audit.audit_log (request_route);
CREATE INDEX idx_audit_log_event_id ON audit.audit_log (event_id);
```
PostgreSQL automatically applies these indexes to each partition.

**Step 4 — Pre-created monthly partitions (Nov 2025 through May 2027):**
```sql
CREATE TABLE audit.audit_log_2025_11 PARTITION OF audit.audit_log FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE audit.audit_log_2025_12 PARTITION OF audit.audit_log FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
-- ... 19 partitions total through 2027-05
```
Each partition stores one calendar month of data. The range is `[start_of_month, start_of_next_month)`.

**Step 5 — Migrate existing data from the old Prisma table:**
```sql
INSERT INTO audit.audit_log (...)
SELECT ... FROM public."AuditLog";
```
Casts `ipAddress` text to `INET` type, maps column names from camelCase to snake_case.

**Step 6 — Drop the old table:**
```sql
DROP TABLE IF EXISTS public."AuditLog";
```

---

### 2. `src/lib/audit-db.ts` — Raw SQL Access Layer

This module replaces Prisma for all audit log operations. It uses the `pg` package directly.

**Connection management:**
```typescript
function createAuditPool(): Pool {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    options: '-c search_path=audit,public',
  });
  return pool;
}
```
- Uses `globalThis` singleton pattern to survive Next.js hot-reload
- Sets `search_path=audit,public` so queries target the audit schema by default
- Registers a custom type parser for INET (OID 869) to return strings instead of JS objects

**Write function — `writeAuditLog()`:**
```typescript
const sql = `
  INSERT INTO audit.audit_log (
    user_id, username, user_role, action, event_category, severity,
    entity_type, entity_id, ip_address, device_info,
    request_method, request_route, is_authenticated,
    was_blocked, block_reason, additional_data
  ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::inet,$10,$11,$12,$13,$14,$15,$16)
`;
```
- Uses parameterized queries to prevent SQL injection
- Casts `ip_address` to `::inet` for PostgreSQL's native INET type
- **INET fallback**: If the IP address is invalid (e.g., `"unknown"`, IPv6 with zone ID), the insert retries with `ip_address = NULL` instead of crashing the application
- **Never throws**: Audit logging failures are caught and logged to console, but the application continues

**Query function — `queryAuditLogs()`:**
```typescript
SELECT a.*, u.id AS u_id, u.username AS u_username, ...
FROM audit.audit_log a
LEFT JOIN public."User" u ON a.user_id = u.id
WHERE [dynamic filters]
ORDER BY a.created_at DESC
LIMIT $N OFFSET $M
```
- Cross-schema JOIN: queries `audit.audit_log` and joins to `public."User"` for user details
- Dynamic WHERE clause builder for filtering by date, event type, category, severity, user, route
- Returns typed `AuditLogRow[]` objects

**Stats function — `queryAuditStats()`:**
Runs 5 parallel queries for total events, blocked attempts, critical events, events by type, and events by severity.

**Partition maintenance — `ensurePartitions()`:**
```typescript
export async function ensurePartitions(monthsAhead: number = 12): Promise<void> {
  for (let i = 0; i < monthsAhead; i++) {
    const partitionName = `audit_log_${year}_${month}`;
    const createSql = `CREATE TABLE IF NOT EXISTS audit.${partitionName}
      PARTITION OF audit.audit_log
      FOR VALUES FROM ('${rangeStart}') TO ('${rangeEnd}')`;
    // Ignores "already exists" errors (PG error code 42P07)
  }
}
```
- Creates monthly partitions for the next `monthsAhead` months
- Idempotent: uses `CREATE TABLE IF NOT EXISTS` and catches duplicate errors
- Called on startup and monthly via cron (see below)

---

### 3. `src/lib/audit-logger.ts` — High-Level Convenience Functions

Provides domain-specific logging functions that map to the raw SQL layer:

| Function | Event Type | Category |
|----------|-----------|----------|
| `logAuditEvent()` | Generic | Configurable |
| `logUnauthorizedAccess()` | `UNAUTHORIZED_ACCESS` | `SECURITY` |
| `logAccessDenied()` | `ACCESS_DENIED` | `AUTHORIZATION` |
| `logForbiddenRoute()` | `FORBIDDEN_ROUTE` | `ACCESS` |
| `logLoginAttempt()` | `LOGIN_SUCCESS` / `LOGIN_FAILED` | `AUTHENTICATION` |
| `logRequestApproval()` | `REQUEST_APPROVED` | `DATA_MODIFICATION` |
| `logRequestRejection()` | `REQUEST_REJECTED` | `DATA_MODIFICATION` |
| `logRequestSubmission()` | `REQUEST_SUBMITTED` | `DATA_MODIFICATION` |
| `logRequestUpdate()` | `REQUEST_UPDATED` | `DATA_MODIFICATION` |
| `logEmployeeAction()` | `EMPLOYEE_CREATED/UPDATED/DELETED` | `DATA_MODIFICATION` |
| `logUserAction()` | `USER_CREATED/UPDATED/DELETED` | `DATA_MODIFICATION` |
| `logComplaintAction()` | `COMPLAINT_SUBMITTED/UPDATED/RESOLVED` | `DATA_MODIFICATION` |
| `logFileAction()` | `FILE_UPLOADED/DELETED` | `DATA_MODIFICATION` |
| `logInstitutionAction()` | `INSTITUTION_CREATED/UPDATED` | `DATA_MODIFICATION` |
| `logAccountAction()` | `ACCOUNT_LOCKED/UNLOCKED` | `SECURITY` |

All functions:
- Never throw (wrapped in try/catch, logged to console on failure)
- Also log to console for real-time monitoring: `[AUDIT] INFO - LOGIN_SUCCESS: { user, role, route, blocked }`

---

### 4. `src/lib/audit-wrapper.ts` — Route Handler Wrapper

`withAuditLogging(handler, options?)` automatically wraps any Next.js API route handler:

```typescript
export const POST = withAuditLogging(async (request, context) => {
  // ... handler logic
}, {
  action: AuditEventType.REQUEST_APPROVED,  // override auto-detected event
  extractDetails: (body) => ({ requestId: body.id }),  // extract from request body
});
```

**What it does:**
1. Skips read-only requests (GET, HEAD, OPTIONS)
2. Extracts auth context from `auth-storage` cookie
3. Extracts IP address from `x-forwarded-for` / `x-real-ip` / `cf-connecting-ip` headers
4. Extracts device info from `x-device-info` header
5. Auto-detects event type from HTTP method + URL path
6. Calls the handler and logs the result (success or failure)
7. If the handler throws, logs as error severity and re-throws

**Auto-detection logic:**

| Path Pattern | POST | PUT/PATCH |
|-------------|------|-----------|
| `/auth/login` | `LOGIN_SUCCESS` | — |
| `/auth/change-password` | `PASSWORD_CHANGED` | — |
| `/admin/lock-account` | `ACCOUNT_LOCKED` | — |
| `/files/upload` | `FILE_UPLOADED` | — |
| `/complaints` | `COMPLAINT_SUBMITTED` | `COMPLAINT_UPDATED` |
| `/employees` | `EMPLOYEE_CREATED` | `EMPLOYEE_UPDATED` |
| `/users` | `USER_CREATED` | `USER_UPDATED` |
| Default | `REQUEST_SUBMITTED` | `REQUEST_UPDATED` |

---

### 5. `src/lib/cron-service.ts` — Partition Maintenance

The cron service ensures partitions are created ahead of time:

```typescript
// Monthly on the 1st: create partitions for next 3 months
await ensurePartitions(3);

// On startup: verify partitions exist
if (process.env.NODE_ENV === 'development') {
  ensurePartitions(3);
}
```

This guarantees that when a new month starts, the partition already exists and inserts won't fail.

---

### 6. `src/app/api/audit/` — Query API Endpoints

The audit trail API routes consume the raw SQL layer:

- **`GET /api/audit/logs`** — Paginated log queries with filters (date range, event type, severity, user, route)
- **`GET /api/audit/stats`** — Aggregate statistics (total events, blocked attempts, critical events, breakdowns)
- **`POST /api/audit/logs`** — Direct log creation (used by client-side audit events)

All use `queryAuditLogs()` and `queryAuditStats()` from `audit-db.ts`.

---

## Why Partitioning?

### Without Partitioning

```sql
-- Scans ALL rows even with date filter
SELECT * FROM "AuditLog" WHERE "timestamp" >= '2026-05-01'
                        AND "timestamp" < '2026-06-01';
-- Query plan: Seq Scan on "AuditLog" (cost=0.00..45000.00 rows=500000)
```

As the table grows to millions of rows, every query touches every row regardless of the date filter.

### With Partitioning

```sql
-- Only scans the May 2026 partition
SELECT * FROM audit.audit_log WHERE created_at >= '2026-05-01'
                                AND created_at < '2026-06-01';
-- Query plan: Seq Scan on audit_log_2026_05 (cost=0.00..500.00 rows=50000)
```

PostgreSQL's partition pruning eliminates all other partitions from the scan. Each partition is a separate physical table, so:
- **Inserts** go to only the current month's partition (smaller indexes, less contention)
- **Date-range queries** scan only relevant partitions
- **Dropping old data** is `DROP TABLE audit.audit_log_2025_11` (instant, no VACUUM)
- **Index maintenance** runs on smaller per-month indexes instead of one massive index

---

## Data Flow Example

```
1. User clicks "Approve Promotion"
   ↓
2. API route calls logRequestApproval({
     requestType: 'Promotion',
     requestId: 'abc-123',
     performedById: 'user-1',
     performedByUsername: 'admin',
     performedByRole: 'HRO',
   })
   ↓
3. audit-logger.ts calls writeAuditLog({
     eventType: 'REQUEST_APPROVED',
     eventCategory: 'DATA_MODIFICATION',
     severity: 'INFO',
     ...
   })
   ↓
4. audit-db.ts executes:
   INSERT INTO audit.audit_log (...) VALUES (...)
   ↓
5. PostgreSQL routes to partition: audit_log_2026_05
   ↓
6. Dashboard calls GET /api/audit/logs?startDate=2026-05-01
   ↓
7. audit-db.ts executes:
   SELECT a.*, u.username FROM audit.audit_log a
   LEFT JOIN public."User" u ON a.user_id = u.id
   WHERE a.created_at >= '2026-05-01'
   ORDER BY a.created_at DESC LIMIT 50
   ↓
8. PostgreSQL scans only audit_log_2026_05 partition
```

---

## Schema Comparison

### Before (Prisma, single table)
```prisma
model AuditLog {
  id          String   @id @default(cuid())
  eventType   String
  userAgent   String?   ← replaced with deviceInfo
  timestamp   DateTime @default(now())
  // ... flat table, no partitioning
}
```

### After (Raw SQL, partitioned)
```sql
audit.audit_log (
  id              BIGSERIAL,
  event_id        UUID DEFAULT gen_random_uuid(),
  user_id         TEXT,
  action          TEXT NOT NULL,          -- was eventType
  event_category  TEXT DEFAULT 'SYSTEM',  -- new
  severity        TEXT DEFAULT 'INFO',     -- new
  entity_type     TEXT DEFAULT 'SYSTEM',   -- new
  entity_id       TEXT,                     -- new
  ip_address      INET,                    -- was TEXT, now native INET
  device_info     JSONB,                   -- was userAgent TEXT
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, created_at)            -- composite for partitioning
) PARTITION BY RANGE (created_at);
```

Key improvements:
| Feature | Before | After |
|---------|--------|-------|
| Schema | `public` (mixed with app tables) | `audit` (isolated) |
| Access | Prisma ORM | Raw SQL via `pg` |
| Partitioning | None | Monthly RANGE on `created_at` |
| IP storage | `TEXT` | `INET` (native type, CIDR queries) |
| Device info | `userAgent TEXT` | `deviceInfo JSONB` (structured) |
| Entity tracking | None | `entity_type` + `entity_id` |
| Severity | None | `severity` (INFO/WARNING/ERROR/CRITICAL) |
| Block tracking | `wasBlocked BOOLEAN DEFAULT true` | `was_blocked BOOLEAN DEFAULT false` + `block_reason` |
| Insert performance | Prisma overhead | Direct SQL, partition-local indexes |
| Query performance | Full table scan | Partition pruning |
| Data retention | Manual DELETE | `DROP TABLE audit_log_YYYY_MM` |