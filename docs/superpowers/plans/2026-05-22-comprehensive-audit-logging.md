# Comprehensive Audit Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comprehensive audit logging to all database-affecting API routes, replace `userAgent` with `deviceInfo` JSON, and enhance the audit trail page.

**Architecture:** A `withAuditLogging()` higher-order function wraps Next.js API route handlers to automatically log mutating requests. Business-specific events (approval, rejection) use explicit convenience functions. A client-side `getDeviceInfo()` utility sends device context via an `x-device-info` header.

**Tech Stack:** Next.js 14 API routes, Prisma ORM, Zustand auth store, TypeScript

---

### Task 1: Update Prisma Schema — Replace `userAgent` with `deviceInfo`, fix `wasBlocked` default

**Files:**
- Modify: `prisma/schema.prisma` (AuditLog model, ~lines 376-401)

- [ ] **Step 1: Update the AuditLog model in schema.prisma**

Replace `userAgent String?` with `deviceInfo Json?` and change `wasBlocked` default from `true` to `false`:

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
  deviceInfo      Json?
  attemptedRoute  String
  requestMethod   String?
  isAuthenticated Boolean  @default(false)
  wasBlocked      Boolean  @default(false)
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

- [ ] **Step 2: Generate the Prisma migration**

Run: `npx prisma migrate dev --name add-audit-comprehensive-logging --create-only`

This creates the migration file without applying it. Review the generated SQL to ensure it:
- Drops `userAgent` column
- Adds `deviceInfo` column (Json, nullable)
- Changes `wasBlocked` default from `true` to `false`

- [ ] **Step 3: Apply the migration**

Run: `npx prisma migrate dev --name add-audit-comprehensive-logging`

- [ ] **Step 4: Regenerate Prisma client**

Run: `npx prisma generate`

- [ ] **Step 5: Commit the schema change**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: update AuditLog schema — replace userAgent with deviceInfo, fix wasBlocked default"
```

---

### Task 2: Update `audit-logger.ts` — Add new event types, replace `userAgent` with `deviceInfo`, add new convenience functions

**Files:**
- Modify: `src/lib/audit-logger.ts`

- [ ] **Step 1: Add new event types to `AuditEventType` enum**

Add these entries after `REQUEST_UPDATED`:

```typescript
// Request Lifecycle
REQUEST_WITHDRAWN = 'REQUEST_WITHDRAWN',

// Employee Management
EMPLOYEE_CREATED = 'EMPLOYEE_CREATED',
EMPLOYEE_UPDATED = 'EMPLOYEE_UPDATED',
EMPLOYEE_DELETED = 'EMPLOYEE_DELETED',

// User Management
USER_CREATED = 'USER_CREATED',
USER_UPDATED = 'USER_UPDATED',
USER_DELETED = 'USER_DELETED',

// Complaint Lifecycle
COMPLAINT_SUBMITTED = 'COMPLAINT_SUBMITTED',
COMPLAINT_UPDATED = 'COMPLAINT_UPDATED',
COMPLAINT_RESOLVED = 'COMPLAINT_RESOLVED',

// Account & Security
ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
PASSWORD_CHANGED = 'PASSWORD_CHANGED',
ADMIN_PASSWORD_RESET = 'ADMIN_PASSWORD_RESET',

// File Operations
FILE_UPLOADED = 'FILE_UPLOADED',
FILE_DELETED = 'FILE_DELETED',

// Institution Management
INSTITUTION_CREATED = 'INSTITUTION_CREATED',
INSTITUTION_UPDATED = 'INSTITUTION_UPDATED',
```

- [ ] **Step 2: Update `AuditLogData` interface — replace `userAgent` with `deviceInfo`**

Replace the `userAgent` field:

```typescript
export interface AuditLogData {
  eventType: AuditEventType | string;
  eventCategory: AuditEventCategory | string;
  severity: AuditSeverity | string;
  userId?: string | null;
  username?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  attemptedRoute: string;
  requestMethod?: string | null;
  isAuthenticated?: boolean;
  wasBlocked?: boolean;
  blockReason?: string | null;
  additionalData?: Record<string, any> | null;
}
```

- [ ] **Step 3: Update `logAuditEvent` to use `deviceInfo` instead of `userAgent`**

In the `logAuditEvent` function body, replace `userAgent: data.userAgent` with `deviceInfo: data.deviceInfo ? JSON.parse(JSON.stringify(data.deviceInfo)) : null`. Do this in both the primary `create` call and the retry `create` call.

Also change the default for `wasBlocked` from `true` to `false`:

```typescript
wasBlocked: data.wasBlocked ?? false,
```

(This applies to both the main create and the retry create.)

- [ ] **Step 4: Update all convenience functions to use `deviceInfo` instead of `userAgent`**

In each convenience function (`logUnauthorizedAccess`, `logAccessDenied`, `logForbiddenRoute`, `logLoginAttempt`, `logRequestApproval`, `logRequestRejection`), replace the `userAgent` parameter with `deviceInfo`:

Change parameter type from `userAgent?: string | null` to `deviceInfo?: Record<string, any> | null`.

In the spread into `logAuditEvent`, replace `userAgent: data.userAgent` with `deviceInfo: data.deviceInfo`.

- [ ] **Step 5: Add new convenience functions after `logRequestRejection`**

```typescript
/**
 * Log request submission
 */
export async function logRequestSubmission(data: {
  requestType: string;
  requestId: string;
  employeeId?: string;
  employeeName?: string;
  employeeZanId?: string;
  submittedById: string;
  submittedByUsername: string;
  submittedByRole: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.REQUEST_SUBMITTED,
    eventCategory: AuditEventCategory.DATA_MODIFICATION,
    severity: AuditSeverity.INFO,
    userId: data.submittedById,
    username: data.submittedByUsername,
    userRole: data.submittedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/${data.requestType.toLowerCase()}`,
    requestMethod: 'POST',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: null,
    additionalData: {
      requestType: data.requestType,
      requestId: data.requestId,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      employeeZanId: data.employeeZanId,
      action: 'SUBMITTED',
      ...data.additionalData,
    },
  });
}

/**
 * Log request update (non-approval/rejection)
 */
export async function logRequestUpdate(data: {
  requestType: string;
  requestId: string;
  employeeId?: string;
  employeeName?: string;
  updatedById: string;
  updatedByUsername: string;
  updatedByRole: string;
  updateDetails?: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.REQUEST_UPDATED,
    eventCategory: AuditEventCategory.DATA_MODIFICATION,
    severity: AuditSeverity.INFO,
    userId: data.updatedById,
    username: data.updatedByUsername,
    userRole: data.updatedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/${data.requestType.toLowerCase()}/${data.requestId}`,
    requestMethod: 'PATCH',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: null,
    additionalData: {
      requestType: data.requestType,
      requestId: data.requestId,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      updateDetails: data.updateDetails,
      action: 'UPDATED',
      ...data.additionalData,
    },
  });
}

/**
 * Log employee creation or update
 */
export async function logEmployeeAction(data: {
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  employeeId: string;
  employeeName?: string;
  employeeZanId?: string;
  performedById: string;
  performedByUsername: string;
  performedByRole: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  const eventTypeMap = {
    CREATED: AuditEventType.EMPLOYEE_CREATED,
    UPDATED: AuditEventType.EMPLOYEE_UPDATED,
    DELETED: AuditEventType.EMPLOYEE_DELETED,
  };
  await logAuditEvent({
    eventType: eventTypeMap[data.action],
    eventCategory: AuditEventCategory.DATA_MODIFICATION,
    severity: data.action === 'DELETED' ? AuditSeverity.CRITICAL : AuditSeverity.INFO,
    userId: data.performedById,
    username: data.performedByUsername,
    userRole: data.performedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/employees${data.action === 'CREATED' ? '' : `/${data.employeeId}`}`,
    requestMethod: data.action === 'CREATED' ? 'POST' : data.action === 'UPDATED' ? 'PATCH' : 'DELETE',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: null,
    additionalData: {
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      employeeZanId: data.employeeZanId,
      action: data.action,
      ...data.additionalData,
    },
  });
}

/**
 * Log user management action
 */
export async function logUserAction(data: {
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  targetUserId: string;
  targetUsername?: string;
  performedById: string;
  performedByUsername: string;
  performedByRole: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  const eventTypeMap = {
    CREATED: AuditEventType.USER_CREATED,
    UPDATED: AuditEventType.USER_UPDATED,
    DELETED: AuditEventType.USER_DELETED,
  };
  await logAuditEvent({
    eventType: eventTypeMap[data.action],
    eventCategory: AuditEventCategory.DATA_MODIFICATION,
    severity: data.action === 'DELETED' ? AuditSeverity.CRITICAL : AuditSeverity.INFO,
    userId: data.performedById,
    username: data.performedByUsername,
    userRole: data.performedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/users${data.action === 'CREATED' ? '' : `/${data.targetUserId}`}`,
    requestMethod: data.action === 'CREATED' ? 'POST' : data.action === 'UPDATED' ? 'PATCH' : 'DELETE',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: null,
    additionalData: {
      targetUserId: data.targetUserId,
      targetUsername: data.targetUsername,
      action: data.action,
      ...data.additionalData,
    },
  });
}

/**
 * Log complaint lifecycle event
 */
export async function logComplaintAction(data: {
  action: 'SUBMITTED' | 'UPDATED' | 'RESOLVED';
  complaintId: string;
  complainantId?: string;
  subject?: string;
  performedById: string;
  performedByUsername: string;
  performedByRole: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  const eventTypeMap = {
    SUBMITTED: AuditEventType.COMPLAINT_SUBMITTED,
    UPDATED: AuditEventType.COMPLAINT_UPDATED,
    RESOLVED: AuditEventType.COMPLAINT_RESOLVED,
  };
  const severityMap = {
    SUBMITTED: AuditSeverity.INFO,
    UPDATED: AuditSeverity.INFO,
    RESOLVED: AuditSeverity.INFO,
  };
  await logAuditEvent({
    eventType: eventTypeMap[data.action],
    eventCategory: AuditEventCategory.DATA_MODIFICATION,
    severity: severityMap[data.action],
    userId: data.performedById,
    username: data.performedByUsername,
    userRole: data.performedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/complaints${data.action === 'SUBMITTED' ? '' : `/${data.complaintId}`}`,
    requestMethod: data.action === 'SUBMITTED' ? 'POST' : 'PUT',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: null,
    additionalData: {
      complaintId: data.complaintId,
      complainantId: data.complainantId,
      subject: data.subject,
      action: data.action,
      ...data.additionalData,
    },
  });
}

/**
 * Log file operation
 */
export async function logFileAction(data: {
  action: 'UPLOADED' | 'DELETED';
  fileName?: string;
  objectKey?: string;
  performedById: string;
  performedByUsername: string;
  performedByRole: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  const eventTypeMap = {
    UPLOADED: AuditEventType.FILE_UPLOADED,
    DELETED: AuditEventType.FILE_DELETED,
  };
  await logAuditEvent({
    eventType: eventTypeMap[data.action],
    eventCategory: AuditEventCategory.DATA_MODIFICATION,
    severity: AuditSeverity.INFO,
    userId: data.performedById,
    username: data.performedByUsername,
    userRole: data.performedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/files/${data.action === 'UPLOADED' ? 'upload' : 'delete'}`,
    requestMethod: data.action === 'UPLOADED' ? 'POST' : 'DELETE',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: null,
    additionalData: {
      fileName: data.fileName,
      objectKey: data.objectKey,
      action: data.action,
      ...data.additionalData,
    },
  });
}

/**
 * Log institution management action
 */
export async function logInstitutionAction(data: {
  action: 'CREATED' | 'UPDATED';
  institutionId: string;
  institutionName?: string;
  performedById: string;
  performedByUsername: string;
  performedByRole: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  const eventTypeMap = {
    CREATED: AuditEventType.INSTITUTION_CREATED,
    UPDATED: AuditEventType.INSTITUTION_UPDATED,
  };
  await logAuditEvent({
    eventType: eventTypeMap[data.action],
    eventCategory: AuditEventCategory.DATA_MODIFICATION,
    severity: AuditSeverity.INFO,
    userId: data.performedById,
    username: data.performedByUsername,
    userRole: data.performedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/institutions${data.action === 'CREATED' ? '' : `/${data.institutionId}`}`,
    requestMethod: data.action === 'CREATED' ? 'POST' : 'PATCH',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: null,
    additionalData: {
      institutionId: data.institutionId,
      institutionName: data.institutionName,
      action: data.action,
      ...data.additionalData,
    },
  });
}

/**
 * Log account lock/unlock event
 */
export async function logAccountAction(data: {
  action: 'LOCKED' | 'UNLOCKED';
  targetUserId: string;
  targetUsername?: string;
  performedById: string;
  performedByUsername: string;
  performedByRole: string;
  reason?: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  await logAuditEvent({
    eventType: data.action === 'LOCKED' ? AuditEventType.ACCOUNT_LOCKED : AuditEventType.ACCOUNT_UNLOCKED,
    eventCategory: AuditEventCategory.SECURITY,
    severity: data.action === 'LOCKED' ? AuditSeverity.WARNING : AuditSeverity.INFO,
    userId: data.performedById,
    username: data.performedByUsername,
    userRole: data.performedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/admin/${data.action === 'LOCKED' ? 'lock-account' : 'unlock-account'}`,
    requestMethod: 'POST',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: data.reason || null,
    additionalData: {
      targetUserId: data.targetUserId,
      targetUsername: data.targetUsername,
      action: data.action,
      reason: data.reason,
      ...data.additionalData,
    },
  });
}
```

- [ ] **Step 6: Update the default export at the bottom of the file**

Add all new functions to the default export:

```typescript
export default {
  logAuditEvent,
  logUnauthorizedAccess,
  logAccessDenied,
  logForbiddenRoute,
  logLoginAttempt,
  logRequestApproval,
  logRequestRejection,
  logRequestSubmission,
  logRequestUpdate,
  logEmployeeAction,
  logUserAction,
  logComplaintAction,
  logFileAction,
  logInstitutionAction,
  logAccountAction,
  getClientIp,
  getAuditLogs,
  getAuditStatistics,
};
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/audit-logger.ts
git commit -m "feat: expand audit-logger with new event types, deviceInfo, and convenience functions"
```

---

### Task 3: Create `device-info.ts` — Client-side device info utility

**Files:**
- Create: `src/lib/device-info.ts`

- [ ] **Step 1: Create the device info utility**

```typescript
/**
 * Client-side device information utility.
 * Collects browser, OS, and device details for audit logging.
 */

export interface DeviceInfo {
  browser: string;
  os: string;
  deviceType: string;
  userAgent: string;
  screenResolution: string;
}

/**
 * Parse the User-Agent string to extract browser and OS info.
 */
export function getDeviceInfo(): DeviceInfo {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  return {
    browser: parseBrowser(ua),
    os: parseOS(ua),
    deviceType: parseDeviceType(ua),
    userAgent: ua,
    screenResolution: typeof window !== 'undefined'
      ? `${window.screen.width}x${window.screen.height}`
      : 'unknown',
  };
}

/**
 * Serialize device info to a JSON string for the x-device-info header.
 */
export function getDeviceInfoHeader(): string {
  return JSON.stringify(getDeviceInfo());
}

function parseBrowser(ua: string): string {
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR/')) return 'Opera';
  return 'Unknown';
}

function parseOS(ua: string): string {
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}

function parseDeviceType(ua: string): string {
  if (ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('Android')) return 'Mobile';
  if (ua.includes('iPad') || ua.includes('Tablet')) return 'Tablet';
  return 'Desktop';
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/device-info.ts
git commit -m "feat: add client-side device info utility for audit logging"
```

---

### Task 4: Update `api-client.ts` — Add `x-device-info` header to mutating requests

**Files:**
- Modify: `src/lib/api-client.ts`

- [ ] **Step 1: Import `getDeviceInfoHeader` at the top of api-client.ts**

Add this import near the other imports:

```typescript
import { getDeviceInfoHeader } from './device-info';
```

- [ ] **Step 2: Add `x-device-info` header in the `request` method**

In the `request<T>` method, inside the headers block (after the CSRF token section, around line 195), add the device info header for mutating requests:

```typescript
// Add device info for audit logging on state-changing requests
if (requiresCSRF && typeof window !== 'undefined') {
  headers['x-device-info'] = getDeviceInfoHeader();
}
```

Place this right after the existing CSRF token block (after the `else` branch that warns about missing CSRF). This ensures device info is only sent on mutating requests (POST, PUT, PATCH, DELETE), not on reads.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api-client.ts
git commit -m "feat: add x-device-info header to mutating API requests"
```

---

### Task 5: Create `audit-wrapper.ts` — The `withAuditLogging` higher-order function

**Files:**
- Create: `src/lib/audit-wrapper.ts`

- [ ] **Step 1: Create the audit wrapper**

```typescript
/**
 * Audit Logging Wrapper for Next.js API Routes
 *
 * Wraps route handlers to automatically log mutating requests.
 * Business-specific events use the convenience functions in audit-logger.ts.
 * The wrapper provides automatic IP extraction, auth context parsing,
 * and device info capture.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  AuditEventType,
  AuditEventCategory,
  AuditSeverity,
  logAuditEvent,
  getClientIp,
} from './audit-logger';

/**
 * Parse auth context from the auth-storage cookie.
 */
function parseAuthContext(request: NextRequest): {
  userId: string | null;
  username: string | null;
  userRole: string | null;
  isAuthenticated: boolean;
} {
  try {
    const authCookie = request.cookies.get('auth-storage')?.value;
    if (!authCookie) {
      return { userId: null, username: null, userRole: null, isAuthenticated: false };
    }
    const parsed = JSON.parse(authCookie);
    const state = parsed?.state;
    return {
      userId: state?.user?.id || null,
      username: state?.user?.username || null,
      userRole: state?.user?.role || null,
      isAuthenticated: state?.isAuthenticated === true,
    };
  } catch {
    return { userId: null, username: null, userRole: null, isAuthenticated: false };
  }
}

/**
 * Parse device info from x-device-info header.
 */
function parseDeviceInfo(request: NextRequest): Record<string, any> | null {
  try {
    const header = request.headers.get('x-device-info');
    if (!header) return null;
    return JSON.parse(header);
  } catch {
    return null;
  }
}

/**
 * Determine event type from HTTP method and route pattern.
 */
function detectEventType(
  method: string,
  pathname: string
): { eventType: string; eventCategory: string; severity: string } {
  const m = method.toUpperCase();
  const path = pathname.toLowerCase();

  // Auth routes
  if (path.includes('/auth/login')) {
    return { eventType: 'LOGIN_SUCCESS', eventCategory: 'AUTHENTICATION', severity: 'INFO' };
  }
  if (path.includes('/auth/logout')) {
    return { eventType: 'LOGOUT', eventCategory: 'AUTHENTICATION', severity: 'INFO' };
  }
  if (path.includes('/auth/change-password')) {
    return { eventType: 'PASSWORD_CHANGED', eventCategory: 'SECURITY', severity: 'INFO' };
  }
  if (path.includes('/auth/mfa')) {
    return { eventType: 'AUTHENTICATION', eventCategory: 'AUTHENTICATION', severity: 'INFO' };
  }

  // Admin routes
  if (path.includes('/admin/reset-password')) {
    return { eventType: 'ADMIN_PASSWORD_RESET', eventCategory: 'SECURITY', severity: 'WARNING' };
  }
  if (path.includes('/admin/lock-account')) {
    return { eventType: 'ACCOUNT_LOCKED', eventCategory: 'SECURITY', severity: 'WARNING' };
  }
  if (path.includes('/admin/unlock-account')) {
    return { eventType: 'ACCOUNT_UNLOCKED', eventCategory: 'SECURITY', severity: 'INFO' };
  }

  // File operations
  if (path.includes('/files/upload')) {
    return { eventType: 'FILE_UPLOADED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
  }

  // Entity routes - POST = creation, PUT/PATCH = update
  if (path.includes('/complaints')) {
    if (m === 'POST') return { eventType: 'COMPLAINT_SUBMITTED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
    return { eventType: 'COMPLAINT_UPDATED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
  }
  if (path.includes('/employees')) {
    if (m === 'POST') return { eventType: 'EMPLOYEE_CREATED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
    return { eventType: 'EMPLOYEE_UPDATED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
  }
  if (path.includes('/users')) {
    if (m === 'POST') return { eventType: 'USER_CREATED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
    return { eventType: 'USER_UPDATED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
  }
  if (path.includes('/institutions')) {
    if (m === 'POST') return { eventType: 'INSTITUTION_CREATED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
    return { eventType: 'INSTITUTION_UPDATED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
  }

  // Request type routes (promotions, confirmations, lwop, etc.) - POST = submission
  if (m === 'POST') {
    return { eventType: 'REQUEST_SUBMITTED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
  }

  // Default: data modification
  return { eventType: 'REQUEST_UPDATED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
}

interface AuditWrapperOptions {
  /** Override the auto-detected event type */
  action?: AuditEventType | string;
  /** Override the auto-detected event category */
  category?: AuditEventCategory | string;
  /** Override the auto-detected severity */
  severity?: AuditSeverity | string;
  /** Skip audit logging for this route */
  skip?: boolean;
  /** Extract business details from the request body for additionalData */
  extractDetails?: (body: unknown) => Record<string, any>;
}

type HandlerFn = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps a Next.js API route handler with automatic audit logging.
 *
 * Extracts auth context, IP, and device info from the request,
 * calls the handler, and logs the event based on the response status.
 *
 * For business-specific events (approval, rejection, complaint resolution),
 * use the convenience functions from audit-logger.ts directly instead of this wrapper.
 */
export function withAuditLogging(
  handler: HandlerFn,
  options: AuditWrapperOptions = {}
): HandlerFn {
  if (options.skip) return handler;

  return async (request, context) => {
    const method = request.method;
    const pathname = new URL(request.url).pathname;

    // Skip read-only requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
      return handler(request, context);
    }

    // Extract context
    const auth = parseAuthContext(request);
    const ipAddress = getClientIp(request.headers);
    const deviceInfo = parseDeviceInfo(request);
    const detected = detectEventType(method, pathname);

    // Clone the body if we need to extract details
    let bodyDetails: Record<string, any> = {};
    if (options.extractDetails) {
      try {
        const clonedRequest = request.clone();
        const body = await clonedRequest.json();
        bodyDetails = options.extractDetails(body) || {};
      } catch {
        // Body may not be JSON or may be empty
      }
    }

    // Call the original handler
    let response: NextResponse;
    try {
      response = await handler(request, context);
    } catch (error) {
      // Handler threw — log as failed and re-throw
      await logAuditEvent({
        eventType: options.action || detected.eventType,
        eventCategory: options.category || detected.eventCategory,
        severity: AuditSeverity.ERROR,
        userId: auth.userId,
        username: auth.username,
        userRole: auth.userRole,
        ipAddress,
        deviceInfo,
        attemptedRoute: pathname,
        requestMethod: method,
        isAuthenticated: auth.isAuthenticated,
        wasBlocked: false,
        blockReason: 'Handler error',
        additionalData: {
          ...bodyDetails,
          error: true,
        },
      }).catch(() => {});
      throw error;
    }

    // Determine if the action was successful
    const isSuccess = response.status >= 200 && response.status < 300;

    // Log the event
    await logAuditEvent({
      eventType: options.action || detected.eventType,
      eventCategory: options.category || detected.eventCategory,
      severity: options.severity || (isSuccess ? detected.severity : AuditSeverity.WARNING),
      userId: auth.userId,
      username: auth.username,
      userRole: auth.userRole,
      ipAddress,
      deviceInfo,
      attemptedRoute: pathname,
      requestMethod: method,
      isAuthenticated: auth.isAuthenticated,
      wasBlocked: !isSuccess,
      blockReason: isSuccess ? null : `Request failed with status ${response.status}`,
      additionalData: {
        ...bodyDetails,
        ...(isSuccess ? {} : { failedStatus: response.status }),
      },
    }).catch(() => {
      // Never block the response due to audit logging failure
    });

    return response;
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/audit-wrapper.ts
git commit -m "feat: add withAuditLogging higher-order function for API routes"
```

---

### Task 6: Wire audit logging into auth routes

**Files:**
- Modify: `src/app/api/auth/login/route.ts`
- Modify: `src/app/api/auth/employee-login/route.ts`
- Modify: `src/app/api/auth/logout/route.ts`
- Modify: `src/app/api/auth/change-password/route.ts`

- [ ] **Step 1: Update `auth/login/route.ts`**

In this file, `logLoginAttempt` is already called. The only change needed is to replace `userAgent` with `deviceInfo` in all calls. Find each `logLoginAttempt` call and:

1. Replace `userAgent: request.headers.get('user-agent') || undefined` with `deviceInfo: JSON.parse(request.headers.get('x-device-info') || 'null')`
2. Replace `ipAddress: getClientIp(request.headers)` with `ipAddress: getClientIp(request.headers)` (no change needed — IP is already captured)

If the calls use `userAgent`, replace with `deviceInfo`. If they already pass IP correctly, leave those.

- [ ] **Step 2: Update `auth/employee-login/route.ts`**

Add `logLoginAttempt` calls for all failure paths (user not found, wrong credentials, inactive account, etc.). Currently only the success path logs via `completeLogin()`. Add the import for `logLoginAttempt` and `getClientIp`, then add calls at each failure return point, replacing any `userAgent` references with `deviceInfo`.

- [ ] **Step 3: Update `auth/logout/route.ts`**

Add audit logging for logout events. Import `logAuditEvent`, `AuditEventType`, `AuditEventCategory`, `AuditSeverity`, and `getClientIp` from `@/lib/audit-logger`. After successful logout processing, add:

```typescript
await logAuditEvent({
  eventType: AuditEventType.LOGOUT,
  eventCategory: AuditEventCategory.AUTHENTICATION,
  severity: AuditSeverity.INFO,
  userId: body.userId || auth.userId,
  username: auth.username,
  userRole: auth.userRole,
  ipAddress: getClientIp(request.headers),
  deviceInfo: JSON.parse(request.headers.get('x-device-info') || 'null'),
  attemptedRoute: '/api/auth/logout',
  requestMethod: 'POST',
  isAuthenticated: true,
  wasBlocked: false,
  blockReason: null,
  additionalData: { logoutAll: body.logoutAll },
}).catch(() => {});
```

- [ ] **Step 4: Update `auth/change-password/route.ts`**

This route already logs `PASSWORD_CHANGED`. Update any `userAgent` reference to `deviceInfo` using `JSON.parse(request.headers.get('x-device-info') || 'null')`.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/
git commit -m "feat: add comprehensive audit logging to auth routes with deviceInfo"
```

---

### Task 7: Wire audit logging into admin routes

**Files:**
- Modify: `src/app/api/admin/reset-password/route.ts`
- Modify: `src/app/api/admin/lock-account/route.ts`
- Modify: `src/app/api/admin/unlock-account/route.ts`

- [ ] **Step 1: Update `admin/reset-password/route.ts`**

This route already logs `ADMIN_PASSWORD_RESET`. Update any `userAgent` reference to `deviceInfo`.

- [ ] **Step 2: Update `admin/lock-account/route.ts`**

Import `logAccountAction` from `@/lib/audit-logger`. After successful account lock, add:

```typescript
await logAccountAction({
  action: 'LOCKED',
  targetUserId: validatedData.userId,
  performedById: validatedData.adminId,
  performedByUsername: adminUser.name || adminUser.username,
  performedByRole: adminUser.role,
  reason: validatedData.reason,
  ipAddress: getClientIp(request.headers),
  deviceInfo: JSON.parse(request.headers.get('x-device-info') || 'null'),
}).catch(() => {});
```

- [ ] **Step 3: Update `admin/unlock-account/route.ts`**

Import `logAccountAction` from `@/lib/audit-logger`. After successful account unlock, add:

```typescript
await logAccountAction({
  action: 'UNLOCKED',
  targetUserId: validatedData.userId,
  performedById: validatedData.adminId,
  performedByUsername: adminUser.name || adminUser.username,
  performedByRole: adminUser.role,
  verificationNotes: validatedData.verificationNotes,
  ipAddress: getClientIp(request.headers),
  deviceInfo: JSON.parse(request.headers.get('x-device-info') || 'null'),
}).catch(() => {});
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/
git commit -m "feat: add audit logging to admin routes with deviceInfo"
```

---

### Task 8: Wire audit logging into request routes (promotions, confirmations, lwop, cadre-change, resignation, retirement, service-extension, termination)

**Files:**
- Modify: `src/app/api/promotions/route.ts`
- Modify: `src/app/api/promotions/[id]/route.ts`
- Modify: `src/app/api/confirmations/route.ts`
- Modify: `src/app/api/confirmations/[id]/route.ts`
- Modify: `src/app/api/lwop/route.ts`
- Modify: `src/app/api/lwop/[id]/route.ts`
- Modify: `src/app/api/cadre-change/route.ts`
- Modify: `src/app/api/cadre-change/[id]/route.ts`
- Modify: `src/app/api/resignation/route.ts`
- Modify: `src/app/api/resignation/[id]/route.ts`
- Modify: `src/app/api/retirement/route.ts`
- Modify: `src/app/api/retirement/[id]/route.ts`
- Modify: `src/app/api/service-extension/route.ts`
- Modify: `src/app/api/service-extension/[id]/route.ts`
- Modify: `src/app/api/termination/route.ts`
- Modify: `src/app/api/termination/[id]/route.ts`

For each request type, the pattern is the same:

**List routes (e.g., `promotions/route.ts`):**
- In the POST handler (create/submission), add a `logRequestSubmission()` call after successful creation. Replace any `userAgent` references with `deviceInfo`.

**Detail routes (e.g., `promotions/[id]/route.ts`):**
- Approval/rejection logging already exists via `logRequestApproval`/`logRequestRejection`. Update `userAgent` to `deviceInfo` in those calls.
- For PATCH/PUT updates that are NOT approvals/rejections, add `logRequestUpdate()` calls.

- [ ] **Step 1: Update all request route files**

For each file, make these changes:
1. Import `logRequestSubmission` and `logRequestUpdate` from `@/lib/audit-logger` (add to existing imports)
2. Replace any `userAgent: request.headers.get('user-agent') || undefined` with `deviceInfo: JSON.parse(request.headers.get('x-device-info') || 'null')`
3. In POST handlers, add `logRequestSubmission()` after successful creation
4. In PATCH/PUT handlers that handle non-approval/non-rejection updates, add `logRequestUpdate()`

The logRequestSubmission call pattern:

```typescript
await logRequestSubmission({
  requestType: 'Promotion', // or 'Confirmation', 'LWOP', etc.
  requestId: newRecord.id,
  employeeId: newRecord.employeeId,
  employeeName: employee?.name,
  employeeZanId: employee?.zanId,
  submittedById: user.id,
  submittedByUsername: user.username,
  submittedByRole: user.role,
  ipAddress: getClientIp(request.headers),
  deviceInfo: JSON.parse(request.headers.get('x-device-info') || 'null'),
}).catch(() => {});
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/promotions/ src/app/api/confirmations/ src/app/api/lwop/ src/app/api/cadre-change/ src/app/api/resignation/ src/app/api/retirement/ src/app/api/service-extension/ src/app/api/termination/
git commit -m "feat: add request submission and update audit logging to all request routes"
```

---

### Task 9: Wire audit logging into complaints, employees, users, institutions, and files routes

**Files:**
- Modify: `src/app/api/complaints/route.ts`
- Modify: `src/app/api/complaints/[id]/route.ts`
- Modify: `src/app/api/employees/route.ts`
- Modify: `src/app/api/employees/[id]/route.ts` (if it exists and has PUT/PATCH)
- Modify: `src/app/api/employees/manual-entry/route.ts`
- Modify: `src/app/api/employees/bulk-upload/route.ts`
- Modify: `src/app/api/users/route.ts`
- Modify: `src/app/api/users/[id]/route.ts`
- Modify: `src/app/api/institutions/route.ts`
- Modify: `src/app/api/institutions/[id]/route.ts`
- Modify: `src/app/api/files/upload/route.ts`

- [ ] **Step 1: Update complaint routes**

In `complaints/route.ts` POST handler, add after successful creation:

```typescript
await logComplaintAction({
  action: 'SUBMITTED',
  complaintId: newComplaint.id,
  complainantId: newComplaint.complainantId,
  subject: newComplaint.subject,
  performedById: user.id,
  performedByUsername: user.username,
  performedByRole: user.role,
  ipAddress: getClientIp(request.headers),
  deviceInfo: JSON.parse(request.headers.get('x-device-info') || 'null'),
}).catch(() => {});
```

In `complaints/[id]/route.ts` PUT handler, add audit logging for status changes. After successful update, log `COMPLAINT_UPDATED` or `COMPLAINT_RESOLVED` based on the new status.

- [ ] **Step 2: Update employee routes**

In `employees/route.ts` POST handler and `employees/manual-entry/route.ts`, add `logEmployeeAction({ action: 'CREATED', ... })` after successful creation.

In `employees/bulk-upload/route.ts`, add `logEmployeeAction({ action: 'CREATED', ... })` after successful bulk creation, including batch details in `additionalData`.

In `employees/[id]/route.ts` (if it has PUT/PATCH), add `logEmployeeAction({ action: 'UPDATED', ... })`.

- [ ] **Step 3: Update user routes**

In `users/route.ts` POST handler, add `logUserAction({ action: 'CREATED', ... })`.

In `users/[id]/route.ts` PUT/PATCH handler, add `logUserAction({ action: 'UPDATED', ... })`.

- [ ] **Step 4: Update institution routes**

In `institutions/route.ts` POST handler, add `logInstitutionAction({ action: 'CREATED', ... })`.

In `institutions/[id]/route.ts` PUT/PATCH handler, add `logInstitutionAction({ action: 'UPDATED', ... })`.

- [ ] **Step 5: Update file upload route**

In `files/upload/route.ts` POST handler, add `logFileAction({ action: 'UPLOADED', ... })` after successful upload.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/complaints/ src/app/api/employees/ src/app/api/users/ src/app/api/institutions/ src/app/api/files/
git commit -m "feat: add audit logging to complaints, employees, users, institutions, and file upload routes"
```

---

### Task 10: Update MFA routes with audit logging

**Files:**
- Modify: `src/app/api/auth/mfa/send-otp/route.ts`
- Modify: `src/app/api/auth/mfa/verify-otp/route.ts`
- Modify: `src/app/api/auth/mfa/magic-link/route.ts`
- Modify: `src/app/api/auth/mfa/magic-link/verify/route.ts`

- [ ] **Step 1: Add audit logging to MFA routes**

For each MFA route, import `logAuditEvent`, `AuditEventType`, `AuditEventCategory`, `AuditSeverity`, and `getClientIp` from `@/lib/audit-logger`. Add logging after the main action:

```typescript
await logAuditEvent({
  eventType: AuditEventType.LOGIN_SUCCESS, // or LOGIN_FAILED for verification failures
  eventCategory: AuditEventCategory.AUTHENTICATION,
  severity: AuditSeverity.INFO,
  userId: user.id,
  username: user.username,
  userRole: user.role,
  ipAddress: getClientIp(request.headers),
  deviceInfo: JSON.parse(request.headers.get('x-device-info') || 'null'),
  attemptedRoute: '/api/auth/mfa/...',
  requestMethod: 'POST',
  isAuthenticated: true,
  wasBlocked: false,
  blockReason: null,
  additionalData: { mfaMethod: 'otp' }, // or 'magic-link'
}).catch(() => {});
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/auth/mfa/
git commit -m "feat: add audit logging to MFA routes"
```

---

### Task 11: Update the audit trail page — add new event types, device column, action column, enhanced CSV

**Files:**
- Modify: `src/app/dashboard/admin/audit-trail/page.tsx`

- [ ] **Step 1: Update the `AuditLog` interface**

Add `deviceInfo` field and remove `userAgent`:

```typescript
interface AuditLog {
  id: string;
  eventType: string;
  eventCategory: string;
  severity: string;
  userId?: string | null;
  username?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  deviceInfo?: {
    browser?: string;
    os?: string;
    deviceType?: string;
    userAgent?: string;
    screenResolution?: string;
  } | null;
  attemptedRoute: string;
  requestMethod?: string | null;
  isAuthenticated: boolean;
  wasBlocked: boolean;
  blockReason?: string | null;
  timestamp: string;
  additionalData?: {
    requestType?: string;
    requestId?: string;
    employeeId?: string;
    employeeName?: string;
    employeeZanId?: string;
    reviewStage?: string;
    action?: string;
    rejectionReason?: string;
    [key: string]: any;
  } | null;
}
```

- [ ] **Step 2: Add new event type options to the filter dropdown**

Update the `eventTypeFilter` SelectContent to include all new event types. Add these `SelectItem` values after the existing ones:

```tsx
<SelectItem value="LOGOUT">Logout</SelectItem>
<SelectItem value="SESSION_EXPIRED">Session Expired</SelectItem>
<SelectItem value="REQUEST_WITHDRAWN">Request Withdrawn</SelectItem>
<SelectItem value="EMPLOYEE_CREATED">Employee Created</SelectItem>
<SelectItem value="EMPLOYEE_UPDATED">Employee Updated</SelectItem>
<SelectItem value="EMPLOYEE_DELETED">Employee Deleted</SelectItem>
<SelectItem value="USER_CREATED">User Created</SelectItem>
<SelectItem value="USER_UPDATED">User Updated</SelectItem>
<SelectItem value="USER_DELETED">User Deleted</SelectItem>
<SelectItem value="COMPLAINT_SUBMITTED">Complaint Submitted</SelectItem>
<SelectItem value="COMPLAINT_UPDATED">Complaint Updated</SelectItem>
<SelectItem value="COMPLAINT_RESOLVED">Complaint Resolved</SelectItem>
<SelectItem value="PASSWORD_CHANGED">Password Changed</SelectItem>
<SelectItem value="ADMIN_PASSWORD_RESET">Admin Password Reset</SelectItem>
<SelectItem value="ACCOUNT_LOCKED">Account Locked</SelectItem>
<SelectItem value="ACCOUNT_UNLOCKED">Account Unlocked</SelectItem>
<SelectItem value="FILE_UPLOADED">File Uploaded</SelectItem>
<SelectItem value="FILE_DELETED">File Deleted</SelectItem>
<SelectItem value="INSTITUTION_CREATED">Institution Created</SelectItem>
<SelectItem value="INSTITUTION_UPDATED">Institution Updated</SelectItem>
```

- [ ] **Step 3: Add a "Device" column to the table**

Add a new `TableHead` between "IP Address" and "Status":

```tsx
<TableHead>Device</TableHead>
```

Add a corresponding `TableCell`:

```tsx
<TableCell className="text-xs">
  {log.deviceInfo ? (
    <span title={`OS: ${log.deviceInfo.os || 'Unknown'}\nBrowser: ${log.deviceInfo.browser || 'Unknown'}\nResolution: ${log.deviceInfo.screenResolution || 'Unknown'}\nUA: ${log.deviceInfo.userAgent || 'Unknown'}`}>
      {log.deviceInfo.browser || 'Unknown'} / {log.deviceInfo.os || 'Unknown'}
    </span>
  ) : (
    <span className="text-muted-foreground">-</span>
  )}
</TableCell>
```

- [ ] **Step 4: Enhance the "Details" column to show human-readable action descriptions**

Update the details cell rendering. Expand `isRequestEvent` to cover more event types:

```tsx
const hasRichDetails =
  log.additionalData &&
  [
    'REQUEST_APPROVED', 'REQUEST_REJECTED', 'REQUEST_SUBMITTED',
    'REQUEST_UPDATED', 'REQUEST_WITHDRAWN',
    'COMPLAINT_SUBMITTED', 'COMPLAINT_UPDATED', 'COMPLAINT_RESOLVED',
    'EMPLOYEE_CREATED', 'EMPLOYEE_UPDATED', 'EMPLOYEE_DELETED',
    'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
    'INSTITUTION_CREATED', 'INSTITUTION_UPDATED',
    'FILE_UPLOADED', 'FILE_DELETED',
    'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED',
    'PASSWORD_CHANGED', 'ADMIN_PASSWORD_RESET',
  ].includes(log.eventType);
```

Then in the rendering, use `hasRichDetails` instead of `isRequestEvent`, and show `log.additionalData.action` or a label derived from `eventType` plus any subject name from `additionalData`.

- [ ] **Step 5: Update the Status column to handle new event types**

Add more badges for the new event types:

```tsx
<TableCell>
  {['REQUEST_APPROVED', 'COMPLAINT_RESOLVED', 'INSTITUTION_CREATED', 'INSTITUTION_UPDATED', 'EMPLOYEE_CREATED', 'USER_CREATED', 'FILE_UPLOADED', 'ACCOUNT_UNLOCKED'].includes(log.eventType) ? (
    <Badge variant="default" className="bg-green-600">Success</Badge>
  ) : ['REQUEST_REJECTED', 'ACCOUNT_LOCKED', 'EMPLOYEE_DELETED', 'USER_DELETED'].includes(log.eventType) ? (
    <Badge variant="destructive">Rejected</Badge>
  ) : log.wasBlocked ? (
    <Badge variant="destructive">Blocked</Badge>
  ) : (
    <Badge variant="default">Allowed</Badge>
  )}
</TableCell>
```

- [ ] **Step 6: Update the CSV export to include deviceInfo fields**

In the `handleExport` function, update the headers and row mapping:

```typescript
const headers = ['Timestamp', 'Severity', 'Event Type', 'Category', 'Username', 'Role', 'IP Address', 'Browser', 'OS', 'Device Type', 'Route', 'Method', 'Status', 'Block Reason'];
```

And in the row mapping:

```typescript
...rows.map((log) =>
  [
    escape(format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')),
    escape(log.severity),
    escape(log.eventType),
    escape(log.eventCategory),
    escape(log.username || log.userId),
    escape(log.userRole),
    escape(log.ipAddress),
    escape(log.deviceInfo?.browser || ''),
    escape(log.deviceInfo?.os || ''),
    escape(log.deviceInfo?.deviceType || ''),
    escape(log.attemptedRoute),
    escape(log.requestMethod),
    escape(log.wasBlocked ? 'Blocked' : 'Allowed'),
    escape(log.blockReason),
  ].join(',')
),
```

- [ ] **Step 7: Add category breakdown stats card**

After the existing 4 stats cards, add a 5th card showing events by category:

```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">
      By Category
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-1 text-sm">
      {Object.entries(
        (logs || []).reduce((acc, log) => {
          acc[log.eventCategory] = (acc[log.eventCategory] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1]).map(([category, count]) => (
        <div key={category} className="flex justify-between">
          <span className="text-muted-foreground">{category.replace(/_/g, ' ')}</span>
          <span className="font-medium">{count}</span>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

Change the grid from `md:grid-cols-4` to `md:grid-cols-5` to accommodate the new card.

- [ ] **Step 8: Commit**

```bash
git add src/app/dashboard/admin/audit-trail/page.tsx
git commit -m "feat: enhance audit trail page with new event types, device column, and improved CSV export"
```

---

### Task 12: Update existing callers of `userAgent` to use `deviceInfo` across all API routes

**Files:**
- All files in `src/app/api/` that reference `userAgent` in audit-logger calls

- [ ] **Step 1: Find all remaining `userAgent` references in audit calls**

Run: `grep -rn "userAgent" src/app/api/ --include="*.ts" | grep -v node_modules`

For every match in an audit-logger call, replace:
- `userAgent: request.headers.get('user-agent') || undefined` → `deviceInfo: JSON.parse(request.headers.get('x-device-info') || 'null')`
- Or if it's a plain string value, wrap it in a deviceInfo object: `deviceInfo: { userAgent: '...' }`

- [ ] **Step 2: Verify no `userAgent` references remain in audit-logger calls**

Run: `grep -rn "userAgent" src/app/api/ --include="*.ts" | grep -v node_modules`

Expected: No results (or only in non-audit contexts).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: replace all userAgent references with deviceInfo in audit logging"
```

---

### Task 13: Build and typecheck — verify no compilation errors

**Files:** None (verification only)

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`

Expected: No TypeScript errors related to audit logging changes.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: No lint errors related to audit logging changes.

- [ ] **Step 3: Run dev server briefly to check for runtime import errors**

Run: `npm run dev` and verify the server starts without errors, then stop it.

---

### Task 14: Final integration commit

- [ ] **Step 1: Review all changes**

Run: `git diff --stat main`

Review that all expected files are modified and no unexpected changes are present.

- [ ] **Step 2: Final commit if any remaining changes**

```bash
git add -A
git commit -m "feat: comprehensive audit logging — all database-affecting actions logged with device info"
```