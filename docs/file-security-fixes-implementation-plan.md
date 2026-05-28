# Implementation Plan: File Upload/Download Security Fixes

## Summary

This document provides step-by-step implementation instructions for fixing the 6 security findings identified in `docs/file-upload-download-security-analysis.md`. Each fix follows existing code patterns (HOF wrappers, existing utility functions) already established in the codebase.

---

## Fix 1: Add Authentication to All Download Routes

**Severity:** Critical
**Files to modify:** 5 download/preview/exists routes

### 1.1 Generic Download — `/api/files/download/[...objectKey]/route.ts`

Wrap the `GET` handler with `withAuth`:

```typescript
// Current
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ objectKey: string[] }> }
) {

// Change to
export const GET = withAuth(async (
  request: NextRequest,
  { auth, params }: { auth: import('@/lib/api-auth').AuthContext; params: Promise<{ objectKey: string[] }> }
) => {
```

Add these imports at the top:
```typescript
import { withAuth, AuthContext } from '@/lib/api-auth';
```

### 1.2 Generic Preview — `/api/files/preview/[...objectKey]/route.ts`

Same pattern — wrap `GET` with `withAuth`. Add the import.

### 1.3 File Exists — `/api/files/exists/[...objectKey]/route.ts`

Same pattern — wrap `GET` with `withAuth`. Add the import.

### 1.4 Employee Photos — `/api/files/employee-photos/[filename]/route.ts`

Wrap `GET` with `withAuth`. Add the import.

### 1.5 Employee Documents — `/api/files/employee-documents/[filename]/route.ts`

Wrap `GET` with `withAuth`. Add the import.

### 1.6 Template Download — `/api/promotion-form-template/download/route.ts`

This one is lower risk (hardcoded path) but should still require auth. Wrap `GET` with `withAuth`. Add the import.

---

## Fix 2: Add Authorization to Employee-Scoped Download Routes

**Severity:** Critical
**Files to modify:** 2 routes

Currently, any authenticated user can download any employee's photo or document. We need institution-scoped authorization matching the pattern already used in the upload routes.

### 2.1 Employee Photos — `/api/files/employee-photos/[filename]/route.ts`

After the `withAuth` wrapper, add an institution check. The filename is `<employee-id>.<ext>`, so extract the employee ID and verify the requesting user has access:

```typescript
import { db as prisma } from '@/lib/db';

// Inside the handler, after extracting filename and before the MinIO call:

// Extract employee ID from filename (format: <uuid>.<ext>)
const employeeId = filename.substring(0, filename.lastIndexOf('.'));

// Authorization: HRO users can only access employees in their institution
if (auth.role === 'HRO') {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { institutionId: true },
  });
  if (!employee || employee.institutionId !== auth.institutionId) {
    return NextResponse.json(
      { success: false, message: 'Access denied' },
      { status: 403 }
    );
  }
}
```

### 2.2 Employee Documents — `/api/files/employee-documents/[filename]/route.ts`

Same pattern. The filename is `<employeeId>_<documentType>.pdf`, so extract the employee ID:

```typescript
// Extract employee ID from filename (format: <employeeId>_<documentType>.pdf)
const employeeId = filename.substring(0, filename.indexOf('_'));

// Same institution check as above
```

---

## Fix 3: Add Rate Limiting to Download Routes

**Severity:** High
**Files to modify:** 6 routes

Add a new `download` rate limit tier and apply it to all download/preview/exists routes.

### 3.1 Add `download` tier to `src/lib/rate-limiter.ts`

In the `RATE_LIMITS` object, add:

```typescript
export const RATE_LIMITS: Record<RateLimitTier, { limit: number; windowSeconds: number }> = {
  auth: { limit: 5, windowSeconds: 60 },
  write: { limit: 30, windowSeconds: 60 },
  read: { limit: 100, windowSeconds: 60 },
  upload: { limit: 10, windowSeconds: 60 },
  download: { limit: 60, windowSeconds: 60 },  // ADD THIS LINE
};
```

Update the `RateLimitTier` type:

```typescript
export type RateLimitTier = 'auth' | 'write' | 'read' | 'upload' | 'download';
```

### 3.2 Apply to download routes

Wrap each download route's handler with `withRateLimit(..., 'download')`:

- `/api/files/download/[...objectKey]/route.ts`
- `/api/files/preview/[...objectKey]/route.ts`
- `/api/files/exists/[...objectKey]/route.ts`
- `/api/files/employee-photos/[filename]/route.ts`
- `/api/files/employee-documents/[filename]/route.ts`
- `/api/promotion-form-template/download/route.ts`

The `withAuth` and `withRateLimit` wrappers compose naturally. The pattern is:

```typescript
export const GET = withRateLimit(withAuth(async (request, { auth }) => {
  // handler body
}), 'download');
```

---

## Fix 4: Add CSRF Protection to Main Upload Route

**Severity:** Medium
**File to modify:** `/api/files/upload/route.ts`

Add the `withCSRF` wrapper to the upload route. The current export is:

```typescript
export const POST = withRateLimit(withAuth(async (request, { auth }) => {
```

Change to:

```typescript
import { withCSRF } from '@/lib/api-csrf-middleware';

export const POST = withCSRF(withRateLimit(withAuth(async (request, { auth }) => {
```

This applies CSRF validation (double-submit cookie pattern) before auth and rate limiting. The `withCSRF` HOF already exists in `src/lib/api-csrf-middleware.ts` and follows the same pattern as `withAuth`.

---

## Fix 5: Add Audit Logging to All File Operations

**Severity:** Medium
**Files to modify:** 8 routes

### 5.1 Add `DOWNLOADED` and `PREVIEWED` actions to `logFileAction()`

In `src/lib/audit-logger.ts`, update the `logFileAction` function signature and event type map:

```typescript
export async function logFileAction(data: {
  action: 'UPLOADED' | 'DELETED' | 'DOWNLOADED' | 'PREVIEWED';
  // ... rest unchanged
```

Add a new event type `FILE_DOWNLOADED` and `FILE_PREVIEWED` to the `AuditEventType` enum, or reuse existing types. Since these are read operations, add them to the enum:

```typescript
// In AuditEventType enum, add:
FILE_DOWNLOADED = 'FILE_DOWNLOADED',
FILE_PREVIEWED = 'FILE_PREVIEWED',
```

Update the event type map in `logFileAction`:

```typescript
const eventTypeMap = {
  UPLOADED: AuditEventType.FILE_UPLOADED,
  DELETED: AuditEventType.FILE_DELETED,
  DOWNLOADED: AuditEventType.FILE_DOWNLOADED,
  PREVIEWED: AuditEventType.FILE_PREVIEWED,
};
```

### 5.2 Add audit calls to download routes

In each download/preview handler, after the auth context is available, add:

```typescript
await logFileAction({
  action: 'DOWNLOADED', // or 'PREVIEWED' for preview route
  fileName: filename,
  objectKey: objectKey,
  performedById: auth.userId,
  performedByUsername: auth.username,
  performedByRole: auth.role,
  ipAddress: getClientIp(request.headers),
  deviceInfo: JSON.parse(request.headers.get('x-device-info') || 'null'),
}).catch(() => {}); // fire-and-forget, never block the response
```

Import `logFileAction` and `getClientIp` from `@/lib/audit-logger`.

### 5.3 Add audit calls to employee document/certificate upload routes

In `src/app/api/employees/[id]/documents/route.ts` POST handler, after successful upload:

```typescript
import { logFileAction, getClientIp } from '@/lib/audit-logger';

// After the MinIO upload succeeds:
await logFileAction({
  action: 'UPLOADED',
  fileName: file.name,
  objectKey: uploadResult.objectKey,
  performedById: auth.userId,
  performedByUsername: auth.username,
  performedByRole: auth.role,
  ipAddress: getClientIp(request.headers),
  deviceInfo: JSON.parse(request.headers.get('x-device-info') || 'null'),
  additionalData: { documentType, employeeId },
}).catch(() => {});
```

Same pattern for `src/app/api/employees/[id]/certificates/route.ts` POST handler.

### 5.4 Add audit calls to template upload

In `src/app/api/promotion-form-template/upload/route.ts`, add the same pattern after successful upload.

---

## Fix 6: Add Authentication to HRIMS Fetch Routes

**Severity:** High
**Files to modify:** 4 routes

### 6.1 Employee Photo Fetch — `/api/employees/[id]/fetch-photo/route.ts`

Wrap the `POST` handler with `withAuth`:

```typescript
import { withAuth, AuthContext } from '@/lib/api-auth';

export const POST = withAuth(async (
  request: NextRequest,
  { auth, params }: { auth: AuthContext; params: Promise<{ id: string }> }
) => {
  // existing handler body
});
```

### 6.2 Employee Documents Fetch — `/api/employees/[id]/fetch-documents/route.ts`

Same pattern — wrap `POST` with `withAuth`.

### 6.3 Bulk Photo Fetch — `/api/hrims/fetch-photos-by-institution/route.ts`

Wrap with `withAuth` and restrict to admin roles:

```typescript
export const POST = withAuth(async (request, { auth }) => {
  // existing handler body
}, { allowedRoles: ['HHRMD', 'ADMIN', 'CSCS'] });
```

### 6.4 Bulk Document Fetch — `/api/hrims/fetch-documents-by-institution/route.ts`

Same pattern — wrap with `withAuth` and restrict to admin roles.

---

## Fix 7: (Optional) MinIO Server-Side Encryption

**Severity:** Low
**File to modify:** `src/lib/minio.ts`

If MinIO is configured with SSE-KMS or SSE-S3, add encryption headers to `putObject()`:

```typescript
const uploadResult = await minioClient.putObject(
  bucketName,
  objectKey,
  file,
  undefined,
  {
    'Content-Type': contentType,
    'Upload-Date': new Date().toISOString(),
    // Add SSE headers if MinIO is configured for it
    ...(process.env.MINIO_SSE_TYPE === 'SSE-S3' ? { 'x-amz-server-side-encryption': 'AES256' } : {}),
  }
);
```

Add `MINIO_SSE_TYPE` to the environment variable documentation.

---

## Implementation Order

1. **Fix 1** — Auth on download routes (critical, blocks all other download fixes)
2. **Fix 2** — Authorization on employee-scoped downloads (critical)
3. **Fix 3** — Rate limiting on downloads (high)
4. **Fix 4** — CSRF on upload route (medium)
5. **Fix 5** — Audit logging (medium)
6. **Fix 6** — Auth on HRIMS fetch routes (high)
7. **Fix 7** — Encryption at rest (low, optional)

## Files Changed Summary

| File | Fixes Applied |
|------|--------------|
| `src/lib/rate-limiter.ts` | Fix 3: add `download` tier |
| `src/lib/audit-logger.ts` | Fix 5: add `DOWNLOADED`/`PREVIEWED` actions |
| `src/app/api/files/upload/route.ts` | Fix 4: add CSRF wrapper |
| `src/app/api/files/download/[...objectKey]/route.ts` | Fixes 1, 3, 5: auth, rate limit, audit |
| `src/app/api/files/preview/[...objectKey]/route.ts` | Fixes 1, 3, 5: auth, rate limit, audit |
| `src/app/api/files/exists/[...objectKey]/route.ts` | Fixes 1, 3: auth, rate limit |
| `src/app/api/files/employee-photos/[filename]/route.ts` | Fixes 1, 2, 3, 5: auth, authorization, rate limit, audit |
| `src/app/api/files/employee-documents/[filename]/route.ts` | Fixes 1, 2, 3, 5: auth, authorization, rate limit, audit |
| `src/app/api/promotion-form-template/download/route.ts` | Fixes 1, 3: auth, rate limit |
| `src/app/api/employees/[id]/documents/route.ts` | Fix 5: audit logging on upload |
| `src/app/api/employees/[id]/certificates/route.ts` | Fix 5: audit logging on upload |
| `src/app/api/promotion-form-template/upload/route.ts` | Fix 5: audit logging on upload |
| `src/app/api/employees/[id]/fetch-photo/route.ts` | Fix 6: auth |
| `src/app/api/employees/[id]/fetch-documents/route.ts` | Fix 6: auth |
| `src/app/api/hrims/fetch-photos-by-institution/route.ts` | Fix 6: auth + role restriction |
| `src/app/api/hrims/fetch-documents-by-institution/route.ts` | Fix 6: auth + role restriction |
| `src/lib/minio.ts` | Fix 7: optional SSE headers |

## Testing Checklist

After implementation, verify:

- [ ] Unauthenticated requests to download routes return 401
- [ ] Authenticated HRO user can download their own institution's employee photos/documents
- [ ] Authenticated HRO user cannot download another institution's employee photos/documents (403)
- [ ] Admin/CSCS users can download any employee's files
- [ ] Rate limit headers appear on download responses (`X-RateLimit-Limit`, `X-RateLimit-Remaining`)
- [ ] CSRF token required on `/api/files/upload` POST (403 without valid token)
- [ ] File download events appear in audit trail (`/dashboard/admin/audit-trail`)
- [ ] Employee document/certificate uploads appear in audit trail
- [ ] Unauthenticated requests to HRIMS fetch routes return 401
- [ ] Existing upload functionality still works (regression check)
