# How to View and Analyze Logs in CSMS

## Architecture Overview

The app uses a **three-tiered logging system**:

1. **Pino structured JSON logs** (`/var/log/csms/app/`) — application observability and debugging
2. **PostgreSQL audit trail** (`audit.audit_log_YYYY_MM` partitions) — authoritative business records
3. **Wazuh/OpenSearch** — centralized monitoring (if configured)

The core logger is at `src/lib/logger.ts`, built on Pino v10. It exports 10 child loggers (auth, db, email, worker, cron, etc.) each tagged with a `component` field for filtering. In development, logs are pretty-printed to stdout; in production, raw JSON goes to `/var/log/csms/app/app.log`.

---

## 1. Real-time Log Viewing

```bash
# Development (pretty-printed)
tail -f /var/log/csms/app/app.log | npx pino-pretty
tail -f /var/log/csms/app/error.log | npx pino-pretty
tail -f /var/log/csms/workers/queue-worker.log | npx pino-pretty

# Production (raw JSON)
tail -n 100 /var/log/csms/app/app.log
tail -n 1 /var/log/csms/app/app.log | jq '.'
```

---

## 2. Searching and Filtering with jq

```bash
# Errors only
grep '"level":50' /var/log/csms/app/app.log | jq '.'

# Logs by component
grep '"component":"auth"' /var/log/csms/app/app.log | jq '.'

# Logs by user ID
grep '"userId":"12345"' /var/log/csms/app/app.log

# Logs within a time range
jq 'select(.time > "2026-05-01T00:00:00Z")' /var/log/csms/app/app.log
```

---

## 3. Log Analysis

```bash
# Count by level
jq -r '.level' /var/log/csms/app/app.log | sort | uniq -c

# Count by component
jq -r '.component // "root"' /var/log/csms/app/app.log | sort | uniq -c

# Top error messages
jq -r '.msg' /var/log/csms/app/error.log | sort | uniq -c | sort -rn | head -20

# Average response time
jq -r 'select(.responseTime) | .responseTime' /var/log/csms/app/app.log | \
  awk '{sum+=$1; count++} END {print "Avg:", sum/count, "ms"}'
```

### Pino Log Levels

| Level | Value | Usage |
|-------|-------|-------|
| trace | 10 | Very detailed debug |
| debug | 20 | Debug information |
| info  | 30 | General info (default) |
| warn  | 40 | Warnings |
| error | 50 | Errors |
| fatal | 60 | Critical failures |

Filter by level:
```bash
grep -E '"level":(50|60)' /var/log/csms/app/app.log
```

---

## 4. PostgreSQL Audit Queries

```bash
psql -U postgres -d nody
```

```sql
-- List all partitions
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'audit' ORDER BY table_name;

-- Recent audit events
SELECT * FROM audit.audit_log_2026_05 ORDER BY created_at DESC LIMIT 100;

-- User activity
SELECT * FROM audit.audit_log_2026_05 WHERE user_id = '12345';

-- Approval events in last 7 days
SELECT * FROM audit.audit_log_2026_05
WHERE action = 'REQUEST_APPROVED' AND created_at > NOW() - INTERVAL '7 days';
```

---

## 5. Admin Audit Trail UI

Navigate to `/dashboard/admin/audit-trail` (Admin-only). Provides:

- Statistics cards (total events, blocked attempts, critical events, success rate)
- Filterable table by category, event type, user, date range
- Color-coded severity badges
- IP address and device info (browser/OS)
- CSV export

---

## 6. PM2 Process Logs

```bash
tail -f logs/production-out.log
tail -f logs/production-error.log
tail -f logs/worker-out.log
tail -f logs/worker-error.log
tail -f logs/redis-out.log
tail -f logs/genkit-out.log
```

---

## 7. Debug Panel (Development Only)

The `DebugPanel` component (`src/components/debug-panel.tsx`) provides in-browser auth debug logs persisted to `localStorage` under `auth_debug_logs`. Visible only in non-production environments.

---

## 8. Log Rotation

Controlled by `logrotate` at `/etc/logrotate.d/csms`:
- Daily rotation, 30 days retained
- gzip compression with `delaycompress`
- `copytruncate` so the app keeps writing to the same file

```bash
# Test rotation (dry-run)
sudo logrotate --debug /etc/logrotate.d/csms

# Force immediate rotation
sudo logrotate --force /etc/logrotate.d/csms
```

---

## 9. Archived Audit Exports

Monthly audit partitions are archived to `/var/log/csms/archive/audit/YYYY/` as compressed JSON with SHA-256 checksums.

```bash
# List archives
ls -la /var/log/csms/archive/audit/

# Verify checksum
sha256sum /var/log/csms/archive/audit/2026/audit_log_2026_05.gz
cat /var/log/csms/archive/audit/2026/audit_log_2026_05.gz.sha256

# Decompress and view
gunzip -c /var/log/csms/archive/audit/2026/audit_log_2026_05.gz | head -n 100

# Count records
gunzip -c /var/log/csms/archive/audit/2026/audit_log_2026_05.gz | jq -s 'length'
```

Run the archive script:
```bash
# Dry-run (exports but does NOT drop partition)
sudo -u nextjs /opt/csms/scripts/archive-audit.sh

# With partition drop
sudo -u nextjs /opt/csms/scripts/archive-audit.sh --drop-partition
```

---

## 10. Partition Management

```bash
# Pre-create partitions for next 6 months
/opt/csms/scripts/ensure-partitions.sh

# With custom months ahead
CSMS_PARTITION_MONTHS=12 /opt/csms/scripts/ensure-partitions.sh
```

---

## 11. Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `archive-audit.sh` | 2 AM, 1st of month | Export and archive previous month |
| `ensure-partitions.sh` | 3 AM, 1st of month | Create partitions for next 6 months |

```bash
# Check last archive run
tail -n 20 /var/log/csms/workers/archive.log

# Check last partition run
tail -n 20 /var/log/csms/workers/partitions.log
```

---

## 12. Wazuh/OpenSearch (Centralized Monitoring)

When configured, use the OpenSearch Dashboard:

```
# All errors in last 24 hours
level: "error" AND @timestamp:[now-24h TO now]

# Specific component
component: "worker"

# User activity
userId: "12345"
```

---

## 13. Complete Audit Event Types Reference

The audit system logs **43 distinct event types** across 6 categories. All events are written to the `audit.audit_log` table (partitioned monthly) via `src/lib/audit-db.ts` and simultaneously to the Pino logger for real-time monitoring.

### 13.1 Event Categories

| Category | Description |
|----------|-------------|
| `SECURITY` | Security events (unauthorized access, lockouts, password resets, CSRF violations) |
| `ACCESS` | Access control events (forbidden routes) |
| `AUTHENTICATION` | Login/logout/session events |
| `AUTHORIZATION` | Permission/role violation events |
| `SYSTEM` | System-level events (cron jobs) |
| `DATA_MODIFICATION` | CRUD operations on business entities |

### 13.2 Severity Levels

| Severity | Usage |
|----------|-------|
| `INFO` | Normal operations (successful logins, entity creation, request submission) |
| `WARNING` | Potential issues (failed logins, access denied, request rejection, account locked) |
| `ERROR` | Errors (forbidden routes, handler errors) |
| `CRITICAL` | Critical events (employee/user deletion, security lockout, cron job failure) |

### 13.3 Security Events

| Event Type | Severity | Description |
|------------|----------|-------------|
| `UNAUTHORIZED_ACCESS` | WARNING | Unauthenticated or unauthorized user attempted to access a route |
| `MULTIPLE_FAILED_ATTEMPTS` | WARNING | Multiple failed login attempts detected |
| `SUSPICIOUS_REQUEST` | WARNING | Request flagged as suspicious |
| `POTENTIAL_BREACH` | CRITICAL | Potential security breach detected |
| `ACCOUNT_LOCKED` | WARNING | User account locked |
| `ACCOUNT_UNLOCKED` | INFO | User account unlocked |
| `PASSWORD_CHANGED` | INFO | User changed their password |
| `ADMIN_PASSWORD_RESET` | WARNING | Admin reset a user's password |
| `CSRF_VIOLATION` | WARNING | CSRF token validation failed |
| `ACCOUNT_LOCKOUT_UPGRADED` | WARNING | Lockout upgraded from STANDARD to SECURITY |
| `ADMIN_ACCOUNT_LOCK` | WARNING | Admin manually locked an account |
| `ADMIN_ACCOUNT_UNLOCK` | INFO | Admin manually unlocked an account |
| `PASSWORD_EXPIRED_ACCOUNT_LOCKED` | CRITICAL | Account locked because password expired beyond grace period |
| `PASSWORD_EXPIRED_GRACE_PERIOD_STARTED` | WARNING | Grace period started for expired password |
| `PASSWORD_EXPIRATION_WARNING` | WARNING | Password expiration warning sent to user |

### 13.4 Access & Authorization Events

| Event Type | Severity | Description |
|------------|----------|-------------|
| `ACCESS_DENIED` | WARNING | Authenticated user was denied access to a resource |
| `FORBIDDEN_ROUTE` | ERROR | User's role does not have permission for the route |
| `ROLE_VIOLATION` | WARNING | User attempted to act outside their role |
| `PERMISSION_DENIED` | WARNING | User lacks specific permission |

### 13.5 Authentication Events

| Event Type | Severity | Description |
|------------|----------|-------------|
| `LOGIN_SUCCESS` | INFO | Successful login |
| `LOGIN_FAILED` | WARNING | Failed login attempt |
| `LOGOUT` | INFO | User logged out |
| `SESSION_EXPIRED` | WARNING | User session expired |
| `AUTHENTICATION` | INFO | MFA authentication event (auto-detected for `/auth/mfa` routes) |

### 13.6 Data Modification Events — Requests

| Event Type | Severity | Description |
|------------|----------|-------------|
| `REQUEST_SUBMITTED` | INFO | A new HR request was submitted (promotion, termination, LWOP, resignation, confirmation, retirement, service extension, cadre change) |
| `REQUEST_APPROVED` | INFO | A request was approved |
| `REQUEST_REJECTED` | WARNING | A request was rejected |
| `REQUEST_UPDATED` | INFO | A request was updated (non-approval/rejection) |
| `REQUEST_WITHDRAWN` | INFO | A request was withdrawn |

### 13.7 Data Modification Events — Employee

| Event Type | Severity | Description |
|------------|----------|-------------|
| `EMPLOYEE_CREATED` | INFO | New employee record created |
| `EMPLOYEE_UPDATED` | INFO | Employee record updated |
| `EMPLOYEE_DELETED` | CRITICAL | Employee record deleted |

### 13.8 Data Modification Events — User

| Event Type | Severity | Description |
|------------|----------|-------------|
| `USER_CREATED` | INFO | New user account created |
| `USER_UPDATED` | INFO | User account updated |
| `USER_DELETED` | CRITICAL | User account deleted |

### 13.9 Data Modification Events — Complaints

| Event Type | Severity | Description |
|------------|----------|-------------|
| `COMPLAINT_SUBMITTED` | INFO | New complaint submitted |
| `COMPLAINT_UPDATED` | INFO | Complaint updated |
| `COMPLAINT_RESOLVED` | INFO | Complaint resolved |

### 13.10 Data Modification Events — Files & Institutions

| Event Type | Severity | Description |
|------------|----------|-------------|
| `FILE_UPLOADED` | INFO | File uploaded |
| `FILE_DELETED` | INFO | File deleted |
| `INSTITUTION_CREATED` | INFO | New institution created |
| `INSTITUTION_UPDATED` | INFO | Institution updated |

### 13.11 System Events

| Event Type | Severity | Description |
|------------|----------|-------------|
| `CRON_JOB_COMPLETED` | INFO | Cron job ran successfully |
| `CRON_JOB_FAILED` | CRITICAL | Cron job failed with error |

### 13.12 Audit Log Table Schema

Each audit log entry in `audit.audit_log` contains:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `event_id` | UUID | Unique event identifier |
| `user_id` | UUID (nullable) | FK to User table |
| `username` | VARCHAR (nullable) | Username at time of event |
| `user_role` | VARCHAR (nullable) | Role at time of event |
| `action` | VARCHAR | Event type (e.g. `LOGIN_SUCCESS`) |
| `event_category` | VARCHAR | Category (SECURITY, AUTHENTICATION, etc.) |
| `severity` | VARCHAR | INFO / WARNING / ERROR / CRITICAL |
| `entity_type` | VARCHAR | Type of entity affected (defaults to 'SYSTEM') |
| `entity_id` | VARCHAR (nullable) | ID of affected entity |
| `ip_address` | INET (nullable) | Client IP address |
| `device_info` | JSONB (nullable) | `{ browser, os, deviceType, userAgent, screenResolution }` |
| `request_method` | VARCHAR (nullable) | HTTP method |
| `request_route` | VARCHAR | The attempted route/path |
| `is_authenticated` | BOOLEAN | Whether user was authenticated |
| `was_blocked` | BOOLEAN | Whether the action was blocked |
| `block_reason` | VARCHAR (nullable) | Reason for blocking |
| `additional_data` | JSONB (nullable) | Event-specific context (see below) |
| `created_at` | TIMESTAMPTZ | Auto-generated timestamp (partition key) |

Common `additional_data` keys by event type:

| Event Type | additional_data Fields |
|------------|----------------------|
| Request events | `requestType`, `requestId`, `employeeId`, `employeeName`, `employeeZanId`, `reviewStage`, `action`, `rejectionReason` |
| Account actions | `targetUserId`, `targetUsername`, `reason` |
| File actions | `fileName`, `objectKey` |
| Institution actions | `institutionId`, `institutionName` |
| Complaint actions | `complaintId`, `complainantId`, `subject` |
| Lockout events | `failedAttempts`, `lockoutType`, `lockedUntil` |
| Password expiration | `warningLevel`, `daysUntilExpiration`, `passwordExpiresAt` |
| Cron completion | `usersChecked`, `warningsSent`, `gracePeriodStarted`, `accountsLocked`, `durationMs` |
| Failed events | `error` |

### 13.13 Convenience Functions (src/lib/audit-logger.ts)

| Function | Event Type(s) | wasBlocked |
|----------|---------------|------------|
| `logUnauthorizedAccess()` | `UNAUTHORIZED_ACCESS` | true |
| `logAccessDenied()` | `ACCESS_DENIED` | true |
| `logForbiddenRoute()` | `FORBIDDEN_ROUTE` | true |
| `logLoginAttempt()` | `LOGIN_SUCCESS` / `LOGIN_FAILED` | opposite of success |
| `logRequestApproval()` | `REQUEST_APPROVED` | false |
| `logRequestRejection()` | `REQUEST_REJECTED` | false |
| `logRequestSubmission()` | `REQUEST_SUBMITTED` | false |
| `logRequestUpdate()` | `REQUEST_UPDATED` | false |
| `logEmployeeAction()` | `EMPLOYEE_CREATED` / `UPDATED` / `DELETED` | false |
| `logUserAction()` | `USER_CREATED` / `UPDATED` / `DELETED` | false |
| `logComplaintAction()` | `COMPLAINT_SUBMITTED` / `UPDATED` / `RESOLVED` | false |
| `logFileAction()` | `FILE_UPLOADED` / `FILE_DELETED` | false |
| `logInstitutionAction()` | `INSTITUTION_CREATED` / `INSTITUTION_UPDATED` | false |
| `logAccountAction()` | `ACCOUNT_LOCKED` / `ACCOUNT_UNLOCKED` | false |
| `logAuditEvent()` | Any (generic) | Any |

### 13.14 Auto-Detection via withAuditLogging Wrapper

The `withAuditLogging()` HOF in `src/lib/audit-wrapper.ts` auto-detects event types from HTTP method and route pattern:

| Route Pattern | Method | Auto-Detected Event |
|---------------|--------|---------------------|
| `/auth/login` | any | `LOGIN_SUCCESS` |
| `/auth/logout` | any | `LOGOUT` |
| `/auth/change-password` | any | `PASSWORD_CHANGED` |
| `/auth/mfa` | any | `AUTHENTICATION` |
| `/admin/reset-password` | any | `ADMIN_PASSWORD_RESET` |
| `/admin/lock-account` | any | `ACCOUNT_LOCKED` |
| `/admin/unlock-account` | any | `ACCOUNT_UNLOCKED` |
| `/files/upload` | any | `FILE_UPLOADED` |
| `/complaints` | POST | `COMPLAINT_SUBMITTED` |
| `/complaints` | PUT/PATCH | `COMPLAINT_UPDATED` |
| `/employees` | POST | `EMPLOYEE_CREATED` |
| `/employees` | PUT/PATCH | `EMPLOYEE_UPDATED` |
| `/users` | POST | `USER_CREATED` |
| `/users` | PUT/PATCH | `USER_UPDATED` |
| `/institutions` | POST | `INSTITUTION_CREATED` |
| `/institutions` | PUT/PATCH | `INSTITUTION_UPDATED` |
| any other | POST | `REQUEST_SUBMITTED` |
| any other | PUT/PATCH | `REQUEST_UPDATED` |

GET/HEAD/OPTIONS requests are skipped. Severity is upgraded to `WARNING` for non-2xx responses and `ERROR` for thrown exceptions.

---

## Quick Reference

| Item | Location |
|------|----------|
| App logs | `/var/log/csms/app/` |
| Worker logs | `/var/log/csms/workers/` |
| Archives | `/var/log/csms/archive/audit/` |
| Logrotate config | `/etc/logrotate.d/csms` |
| Archive script | `/opt/csms/scripts/archive-audit.sh` |
| Partition script | `/opt/csms/scripts/ensure-partitions.sh` |
| Logger code | `src/lib/logger.ts` |
| Audit logger | `src/lib/audit-logger.ts` |
| Audit DB layer | `src/lib/audit-db.ts` |
| Audit wrapper | `src/lib/audit-wrapper.ts` |
| PM2 logs | `./logs/` (project root) |
| Audit trail UI | `/dashboard/admin/audit-trail` |
