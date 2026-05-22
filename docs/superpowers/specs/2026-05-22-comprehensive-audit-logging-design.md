# Comprehensive Audit Logging Design

## Problem

The current audit trail only logs login attempts, request approvals/rejections, and unauthorized access. Many database-affecting actions have no audit trail: request submissions, employee CRUD, user management, file operations, complaint lifecycle, MFA events, logout, and session expiry. IP addresses are captured inconsistently, and there is no device information.

## Approach

**Approach A: Middleware-Based Auto-Logging with Manual Enrichment** — a `withAuditLogging()` higher-order function wraps API route handlers to automatically log mutating requests (POST/PUT/PATCH/DELETE). Business-specific events (approval, rejection, complaint resolution) still use explicit convenience functions for richer detail.

## Schema Changes

Replace `userAgent` with `deviceInfo` JSON field and fix `wasBlocked` default:

```prisma
model AuditLog {
  id              String   @id @default(cuid())
  eventType       String
  eventCategory   String
  severity        String
  userId          String?
  username        String?
  userRole        String?
  ipAddress       String?
  deviceInfo      Json?        // { browser, os, deviceType, userAgent, screenResolution }
  attemptedRoute  String
  requestMethod   String?
  isAuthenticated Boolean  @default(false)
  wasBlocked      Boolean  @default(false)  // Changed from true → false
  blockReason     String?
  timestamp       DateTime @default(now())
  additionalData  Json?
  User            User?    @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([timestamp])
  @@index([eventType])
  @@index([eventCategory])
  @@index([severity])
  @@index([attemptedRoute])
}
```

## API Route Wrapper

```typescript
// src/lib/audit-wrapper.ts

type HandlerContext = {
  userId: string | null;
  username: string | null;
  userRole: string | null;
  isAuthenticated: boolean;
  ipAddress: string;
  deviceInfo: DeviceInfo;
};

function withAuditLogging(
  handler: (req: NextRequest, ctx: RouteContext, auditCtx: HandlerContext) => Response | Promise<Response>,
  options?: {
    action?: AuditEventType;
    category?: AuditEventCategory;
    severity?: AuditSeverity;
    skip?: boolean;
    extractDetails?: (body: unknown) => Record<string, unknown>;
  }
): (req: NextRequest, ctx: RouteContext) => Response | Promise<Response>
```

**Behavior:**
1. Extracts auth context from `auth-storage` cookie
2. Extracts IP from headers (`x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`)
3. Parses `deviceInfo` from `x-device-info` header (set by client-side interceptor)
4. Auto-detects action type from HTTP method + route pattern
5. Calls handler, inspects response status: 2xx logs success, 4xx/5xx logs failure
6. Passes `auditCtx` to handler for business-specific enrichment
7. Audit failures are caught and logged to console — never block the API response

## Client-Side Device Info

```typescript
// src/lib/device-info.ts
function getDeviceInfo(): {
  browser: string;
  os: string;
  deviceType: string;
  userAgent: string;
  screenResolution: string;
}
```

Applied via the existing `api-client.ts` fetch wrapper — adds `x-device-info` header to every mutating request.

## New Event Types

| Event Type | Category | Severity | When |
|---|---|---|---|
| `REQUEST_SUBMITTED` | DATA_MODIFICATION | INFO | Creating any request |
| `REQUEST_UPDATED` | DATA_MODIFICATION | INFO | Editing an existing request |
| `REQUEST_WITHDRAWN` | DATA_MODIFICATION | INFO | Withdrawing/cancelling a request |
| `EMPLOYEE_CREATED` | DATA_MODIFICATION | INFO | Creating an employee record |
| `EMPLOYEE_UPDATED` | DATA_MODIFICATION | INFO | Updating employee data |
| `EMPLOYEE_DELETED` | DATA_MODIFICATION | CRITICAL | Deleting an employee |
| `USER_CREATED` | DATA_MODIFICATION | INFO | Admin creating a user |
| `USER_UPDATED` | DATA_MODIFICATION | INFO | Updating user details |
| `USER_DELETED` | DATA_MODIFICATION | CRITICAL | Deleting a user |
| `LOGOUT` | AUTHENTICATION | INFO | Explicit logout |
| `SESSION_EXPIRED` | AUTHENTICATION | INFO | Session timeout |
| `PASSWORD_CHANGED` | SECURITY | INFO | Self-service password change |
| `ADMIN_PASSWORD_RESET` | SECURITY | WARNING | Admin resetting a password |
| `ACCOUNT_LOCKED` | SECURITY | WARNING | Account lockout |
| `ACCOUNT_UNLOCKED` | SECURITY | INFO | Admin unlocking account |
| `FILE_UPLOADED` | DATA_MODIFICATION | INFO | File upload |
| `FILE_DELETED` | DATA_MODIFICATION | INFO | File deletion |
| `COMPLAINT_SUBMITTED` | DATA_MODIFICATION | INFO | Filing a complaint |
| `COMPLAINT_UPDATED` | DATA_MODIFICATION | INFO | Updating a complaint |
| `COMPLAINT_RESOLVED` | DATA_MODIFICATION | INFO | Resolving a complaint |
| `INSTITUTION_CREATED` | DATA_MODIFICATION | INFO | Creating institution |
| `INSTITUTION_UPDATED` | DATA_MODIFICATION | INFO | Updating institution |

## Route Coverage

| Route | Methods | Event Type |
|---|---|---|
| `auth/login` | POST | LOGIN_SUCCESS/FAILED |
| `auth/employee-login` | POST | LOGIN_SUCCESS/FAILED |
| `auth/logout` | POST | LOGOUT |
| `auth/change-password` | POST | PASSWORD_CHANGED |
| `auth/mfa/*` | POST | MFA events |
| `admin/reset-password` | POST | ADMIN_PASSWORD_RESET |
| `admin/lock-account` | POST | ACCOUNT_LOCKED |
| `admin/unlock-account` | POST | ACCOUNT_UNLOCKED |
| `promotions` | POST | REQUEST_SUBMITTED |
| `promotions/[id]` | PUT/PATCH | REQUEST_APPROVED/REJECTED/UPDATED |
| `confirmations` | POST | REQUEST_SUBMITTED |
| `confirmations/[id]` | PUT/PATCH | REQUEST_APPROVED/REJECTED/UPDATED |
| `lwop` | POST | REQUEST_SUBMITTED |
| `lwop/[id]` | PUT/PATCH | REQUEST_APPROVED/REJECTED/UPDATED |
| `cadre-change` | POST | REQUEST_SUBMITTED |
| `cadre-change/[id]` | PUT/PATCH | REQUEST_APPROVED/REJECTED/UPDATED |
| `resignation` | POST | REQUEST_SUBMITTED |
| `resignation/[id]` | PUT/PATCH | REQUEST_APPROVED/REJECTED/UPDATED |
| `retirement` | POST | REQUEST_SUBMITTED |
| `retirement/[id]` | PUT/PATCH | REQUEST_APPROVED/REJECTED/UPDATED |
| `service-extension` | POST | REQUEST_SUBMITTED |
| `service-extension/[id]` | PUT/PATCH | REQUEST_APPROVED/REJECTED/UPDATED |
| `termination` | POST | REQUEST_SUBMITTED |
| `termination/[id]` | PUT/PATCH | REQUEST_APPROVED/REJECTED/UPDATED |
| `complaints` | POST | COMPLAINT_SUBMITTED |
| `complaints/[id]` | PUT/PATCH | COMPLAINT_UPDATED/RESOLVED |
| `employees` | POST | EMPLOYEE_CREATED |
| `employees/manual-entry` | POST | EMPLOYEE_CREATED |
| `employees/bulk-upload` | POST | EMPLOYEE_CREATED (batch) |
| `employees/[id]` | PUT/PATCH | EMPLOYEE_UPDATED |
| `institutions` | POST | INSTITUTION_CREATED |
| `institutions/[id]` | PUT/PATCH | INSTITUTION_UPDATED |
| `users` | POST | USER_CREATED |
| `users/[id]` | PUT/PATCH | USER_UPDATED |
| `files/upload` | POST | FILE_UPLOADED |

**Skipped routes:** All GET endpoints, `audit/logs` (read-only), `dashboard/metrics` (read-only), `notifications` (read-only GET), `test/*`, `debug/*`.

## Audit Trail Page Enhancements

1. **Updated event type filter** — add all new event types to the dropdown
2. **"Action" column** — human-readable description derived from `additionalData` (e.g., "Promoted John Doe (EMP-001)")
3. **"Device" column** — compact device summary from `deviceInfo` (e.g., "Chrome / Windows"), tooltip for full details
4. **Category breakdown card** — event counts by category alongside existing stats
5. **Enhanced CSV export** — include `deviceInfo` fields (browser, os, device type) as separate columns

## Migration Strategy

1. Add `deviceInfo Json?` to AuditLog, remove `userAgent String?`, change `wasBlocked` default to `false`
2. `npx prisma migrate dev --name add-audit-comprehensive-logging`
3. Non-destructive: nullable field, default change only affects new rows
4. Old `userAgent` values are lost — acceptable since they were sparsely populated

## Error Handling

- Audit logging failures never block the API response
- If `prisma.auditLog.create()` fails, log to `console.error` and continue
- If auth context can't be parsed, log with `userId: null`, `isAuthenticated: false`
- Existing P2003 foreign key retry logic in `logAuditEvent` is preserved