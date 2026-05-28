# File Upload & Download Security Analysis

## Upload Security (Strong)

The upload pipeline at `src/lib/file-validation.ts` runs a **6-step validation chain** before any file hits storage:

| Step | Check | Failure Code | HTTP Status |
|------|-------|-------------|-------------|
| 1 | Extension blocklist (20 blocked: `.exe`, `.sh`, `.php`, etc.) | `BLOCKED_FILE_TYPE` | 403 |
| 2 | MIME type blocklist (11 blocked) | `BLOCKED_FILE_TYPE` | 403 |
| 3 | Context-specific MIME allowlist (PDF-only for generic, images for photos, etc.) | `INVALID_FILE_TYPE` | 415 |
| 4 | Size limit (1 MB across all contexts) | `FILE_TOO_LARGE` | 413 |
| 5 | Magic-byte verification (8 signature types + CSV heuristic) | `FILE_CONTENT_MISMATCH` | 415 |
| 6 | ClamAV malware scan (INSTREAM protocol, fail-closed) | `MALWARE_DETECTED` / `SCAN_SERVICE_UNAVAILABLE` | 403 / 503 |

---

## 1. Extension Blocklist

**File:** `src/lib/file-validation.ts` (lines 76-97)

20 extensions blocked, case-insensitive:

```
.exe, .bat, .cmd, .sh, .ps1, .vbs, .wsf, .msi,
.com, .scr, .pif, .dll, .reg, .hta, .cpl, .inf,
.jsp, .php, .asp, .aspx
```

Checked via `isBlockedExtension()` — returns true if the filename ends with any blocked extension.

---

## 2. MIME Type Blocklist

**File:** `src/lib/file-validation.ts` (lines 99-112)

11 MIME types blocked, case-insensitive:

```
application/x-executable, application/x-msdos-program,
application/x-msdownload, application/x-bat, application/x-cmd,
application/x-sh, application/x-shellscript, application/x-msi,
application/x-dosexec, application/x-winexe, application/x-windows-exe
```

Checked via `isBlockedMime()`.

---

## 3. Context-Specific MIME Allowlists

**File:** `src/lib/file-validation.ts` (lines 42-70)

| Context | Allowed MIME Types | Max Size |
|---------|-------------------|----------|
| `documents` | `application/pdf` | 1 MB |
| `certificates` | `application/pdf` | 1 MB |
| `templates` | `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | 1 MB |
| `bulkUpload` | `text/csv`, `application/vnd.ms-excel`, `text/plain` | 1 MB |
| `photos` | `image/jpeg`, `image/png`, `image/gif`, `image/webp` | 1 MB |
| `generic` | `application/pdf` | 1 MB |

---

## 4. Size Limits

All contexts capped at **1 MB** (1048576 bytes). Enforced server-side in the validation pipeline and client-side in the `FileUpload` component (`src/components/ui/file-upload.tsx`).

---

## 5. Magic-Byte Verification

**File:** `src/lib/file-validation.ts` (lines 124-212)

`detectMimeType()` reads file headers and matches against known signatures:

| Signature | Detected MIME |
|-----------|---------------|
| `%PDF-` at offset 0 | `application/pdf` |
| `D0 CF 11 E0 A1 B1 1A E1` | `application/msword` (OLE2) |
| `50 4B 03 04` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX/ZIP) |
| `FF D8 FF` | `image/jpeg` |
| `89 50 4E 47 0D 0A 1A 0A` | `image/png` |
| `47 49 46 38 37 61` | `image/gif` (GIF87a) |
| `47 49 46 38 39 61` | `image/gif` (GIF89a) |
| `52 49 46 46` + `WEBP` at offset 8 | `image/webp` |

**CSV heuristic:** If no magic bytes match and >=85% of the first 512 bytes are printable ASCII (including tab, LF, CR), the file is classified as `text/csv`.

**Compatibility rules** (`isMimeTypeCompatible()`):
- Exact match: always compatible
- `text/csv` detected is compatible with `text/csv`, `text/plain`, `application/vnd.ms-excel`
- `image/jpeg` detected is compatible with `image/jpg` (common misdeclaration)
- DOCX detected is compatible with `application/msword` declared (browser misdeclaration)
- If no magic bytes match at all (`null`), the check passes (allows through)

---

## 6. ClamAV Malware Scanning

**File:** `src/lib/clamav.ts`

Uses ClamAV's **INSTREAM protocol** over TCP:

1. Connects to `CLAMAV_HOST:CLAMAV_PORT` (default: `localhost:3310`)
2. Sends `nINSTREAM\n` command
3. Streams file in 2048-byte chunks with 4-byte big-endian length prefix
4. Sends zero-length chunk to signal end
5. Reads response: `OK` = clean, `FOUND: <name>` = infected

**Environment variables:**

| Variable | Default | Purpose |
|----------|---------|---------|
| `CLAMAV_HOST` | `localhost` | ClamAV daemon host |
| `CLAMAV_PORT` | `3310` | ClamAV daemon port |
| `CLAMAV_TIMEOUT` | `30000` (30s) | Connection timeout in ms |
| `CLAMAV_ENABLED` | `true` | Set to `false` to skip scanning |

**Fail-closed policy:** If ClamAV is enabled but unreachable, the upload is rejected with HTTP 503 (`SCAN_SERVICE_UNAVAILABLE`). If disabled, scanning is skipped entirely.

---

## 7. Storage — MinIO

**File:** `src/lib/minio.ts`

S3-compatible object storage via the `minio` npm package.

**Configuration:**

| Variable | Default |
|----------|---------|
| `MINIO_ACCESS_KEY` | `minioadmin` |
| `MINIO_SECRET_KEY` | `minioadmin123` |
| `MINIO_ENDPOINT` | `localhost` |
| `MINIO_PORT` | `9000` |
| `MINIO_USE_SSL` | `false` |
| `MINIO_BUCKET_NAME` | `documents` |

**Filename sanitization** (`generateObjectKey()`):

```typescript
export function generateObjectKey(folder: string, originalName: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${folder}/${timestamp}_${randomSuffix}_${sanitizedName}`;
}
```

Strips all non-alphanumeric characters except `.` and `-`, then prefixes with `folder/timestamp_randomSuffix_`. This prevents path traversal and filename collisions.

---

## 8. Authentication & Authorization on Uploads

| Route | Auth | Rate Limit | Role Restriction | Institution Check |
|-------|------|------------|-----------------|-------------------|
| `/api/files/upload` | `verifyAuth` + `withCSRF` | `upload` (10/min) | Any authenticated user | No |
| `/api/employees/[id]/documents` POST | `verifyAuth` | `write` (30/min) | HRO, HHRMD, HRMO, DO, CSCS, PO, ADMIN | Yes (HRO only) |
| `/api/employees/[id]/certificates` POST | `verifyAuth` | `write` (30/min) | HRO, ADMIN | Yes |
| `/api/employees/bulk-upload` POST | `verifyAuth` | `upload` (10/min) | HRO, ADMIN | No |
| `/api/promotion-form-template/upload` | `verifyAuth` | `upload` (10/min) | HHRMD only | No |

**Institution-scoped authorization for HRO:** The documents and certificates routes verify `employee.institutionId === userInstitutionId` before allowing upload. HRO users can only modify employees at their own institution.

---

## 9. Download Security (Fixed)

All download routes now have authentication, rate limiting, and audit logging:

| Route | Auth | Rate Limit | Audit Log | Institution Check |
|-------|------|------------|-----------|-------------------|
| `/api/files/download/[...objectKey]` | `verifyAuth` | `download` (60/min) | Yes (`FILE_DOWNLOADED`) | No |
| `/api/files/preview/[...objectKey]` | `verifyAuth` | `download` (60/min) | Yes (`FILE_PREVIEWED`) | No |
| `/api/files/exists/[...objectKey]` | `verifyAuth` | `download` (60/min) | No | No |
| `/api/files/employee-photos/[filename]` | `verifyAuth` | `download` (60/min) | Yes (`FILE_DOWNLOADED`) | Yes (HRO only) |
| `/api/files/employee-documents/[filename]` | `verifyAuth` | `download` (60/min) | Yes (`FILE_DOWNLOADED`) | Yes (HRO only) |
| `/api/promotion-form-template/download` | `verifyAuth` | `download` (60/min) | No | No |

**Implementation pattern:** All download routes use direct `verifyAuth(request)` and `checkRateLimit(...)` calls (not HOF wrappers) to properly support Next.js 15 async params.

**Institution-scoped authorization for employee downloads:** The employee-photos and employee-documents routes extract the employee ID from the filename and verify `employee.institutionId === userInstitutionId` for HRO users.

### Path Traversal Protections on Downloads

- Employee photos route: strict regex `/^[a-f0-9-]+\.(jpg|jpeg|png|gif|webp)$/i`
- Employee documents route: rejects `..` and `/` in filename
- Generic download/preview: reconstructs object key from URL segments via `decodeURIComponent()`, relies on MinIO's internal path handling
- Template download: hardcoded path `templates/promotion-form-template.docx` — no user input

---

## 10. CSRF Protection

**Implementation:** `src/lib/csrf-utils.ts` and `src/lib/api-csrf-middleware.ts`

Double-submit cookie pattern:
- HMAC-SHA256 signed tokens (32-byte random)
- Cookie: `csrf-token`, Header: `x-csrf-token`
- `sameSite: 'strict'`
- Safe methods (GET, HEAD, OPTIONS) exempt

**Server-side:** The CSRF token is generated on login (`src/lib/auth-helpers.ts`) and set as both a cookie and returned in the response JSON. The `withCSRF` wrapper validates the token on state-changing routes.

**Client-side:** All frontend components making state-changing requests (POST, PUT, PATCH, DELETE) must include the CSRF token. Components use a helper function to read the `csrf-token` cookie and send it as the `x-csrf-token` header:

```typescript
// Helper used by file-upload.tsx, document-upload.tsx, bulk-upload.tsx, etc.
const csrfToken = document.cookie
  .split('; ')
  .find((row) => row.startsWith('csrf-token='))
  ?.split('=')[1];
if (csrfToken) {
  headers['x-csrf-token'] = csrfToken;
}
```

**Status:** The main file upload route (`/api/files/upload`) uses `withCSRF` wrapper. All upload-invoking frontend components now send the CSRF header. Other state-changing routes rely on auth/institution checks.

---

## 11. Rate Limiting

**Implementation:** `src/lib/rate-limiter.ts`

Redis-backed sliding window:

| Tier | Limit | Window |
|------|-------|--------|
| `auth` | 5 | 60s |
| `write` | 30 | 60s |
| `read` | 100 | 60s |
| `upload` | 10 | 60s |
| `download` | 60 | 60s |

**Applied to all upload and download routes.** The `download` tier was added as part of the security fixes.

**Fail-open:** If Redis is unavailable, requests are allowed through.

---

## 12. Audit Logging

**File:** `src/lib/audit-logger.ts` — `logFileAction()` function

| Route | Audit Logged |
|-------|-------------|
| `/api/files/upload` | Yes (`FILE_UPLOADED`) |
| `/api/employees/[id]/documents` POST | Yes (`FILE_UPLOADED`) |
| `/api/employees/[id]/certificates` POST | Yes (`FILE_UPLOADED`) |
| `/api/employees/bulk-upload` POST | Partial (employee creation only) |
| `/api/promotion-form-template/upload` | Yes (`FILE_UPLOADED`) |
| `/api/files/download/[...objectKey]` | Yes (`FILE_DOWNLOADED`) |
| `/api/files/preview/[...objectKey]` | Yes (`FILE_PREVIEWED`) |
| `/api/files/employee-photos/[filename]` | Yes (`FILE_DOWNLOADED`) |
| `/api/files/employee-documents/[filename]` | Yes (`FILE_DOWNLOADED`) |

**Audit event types:**
- `FILE_UPLOADED` — file uploaded to storage
- `FILE_DELETED` — file deleted from storage
- `FILE_DOWNLOADED` — file downloaded by user
- `FILE_PREVIEWED` — file previewed inline

All audit logging calls use `.catch(() => {})` (fire-and-forget) to avoid blocking responses on audit failures.

---

## 13. Encryption

**At rest:** Not configured. MinIO `putObject()` is called without server-side encryption options (SSE-S3, SSE-KMS).

**In transit:** Depends on `MINIO_USE_SSL` environment variable (defaults to `false`). Application-layer TLS is assumed for client-to-server communication.

---

## 14. HRIMS Fetch Routes

All HRIMS fetch routes now have authentication and rate limiting:

| Route | Auth | Rate Limit | Role Restriction |
|-------|------|------------|-----------------|
| `/api/hrims/fetch-photos-by-institution` | `verifyAuth` | `write` (30/min) | HHRMD, ADMIN, CSCS |
| `/api/hrims/fetch-documents-by-institution` | `verifyAuth` | `write` (30/min) | HHRMD, ADMIN, CSCS |
| `/api/employees/[id]/fetch-photo` | `verifyAuth` | `write` (30/min) | Any authenticated user |
| `/api/employees/[id]/fetch-documents` | `verifyAuth` | `write` (30/min) | Any authenticated user |

---

## 15. Vulnerability Summary

| Control | Upload | Download |
|---------|--------|----------|
| Extension blocklist | Yes | N/A |
| MIME blocklist + allowlist | Yes | N/A |
| Magic-byte verification | Yes | N/A |
| Size limit (1 MB) | Yes | N/A |
| ClamAV malware scan | Yes | N/A |
| Filename sanitization | Yes | Yes (path traversal) |
| Authentication | Yes | **Fixed** |
| Authorization (institution) | Partial | **Fixed** (employee routes) |
| CSRF protection | **Fixed** on main route | N/A (GET) |
| Rate limiting | Yes | **Fixed** (download tier) |
| Audit logging | **Fixed** (all routes) | **Fixed** (all routes) |
| Encryption at rest | **Missing** | N/A |

### Resolved Findings

1. ~~IDOR on all download routes~~ — Fixed. All download routes now require authentication via `verifyAuth()`.
2. ~~Employee photo enumeration~~ — Fixed. Employee photo/document routes require authentication and enforce institution-scoped authorization for HRO users.
3. ~~File existence enumeration~~ — Fixed. `/api/files/exists/[...objectKey]` now requires authentication and rate limiting.
4. ~~Unauthenticated HRIMS fetch routes~~ — Fixed. All four HRIMS fetch routes require authentication, rate limiting, and role restrictions.
5. ~~No CSRF on main upload route~~ — Fixed. `/api/files/upload` now uses `withCSRF` wrapper. Additionally, all frontend components that invoke upload routes (`file-upload.tsx`, `document-upload.tsx`, `bulk-upload.tsx`) have been updated to read the `csrf-token` cookie and send it as the `x-csrf-token` header in their fetch/XHR requests.
6. ~~No audit logging on upload/download routes~~ — Fixed. All file operations (upload, download, preview) are now audit-logged.
7. **No encryption at rest** — Remaining. Files stored in MinIO without server-side encryption. Optional SSE can be configured in MinIO server settings.

### Key Source Files

| File | Role |
|------|------|
| `src/lib/file-validation.ts` | 6-step upload validation pipeline |
| `src/lib/clamav.ts` | ClamAV INSTREAM protocol client |
| `src/lib/minio.ts` | MinIO storage client + filename sanitization |
| `src/app/api/files/upload/route.ts` | Generic file upload endpoint (auth + CSRF + rate limit + audit) |
| `src/app/api/files/download/[...objectKey]/route.ts` | Generic file download (auth + rate limit + audit) |
| `src/app/api/files/preview/[...objectKey]/route.ts` | File preview/inline (auth + rate limit + audit) |
| `src/app/api/files/exists/[...objectKey]/route.ts` | File existence check (auth + rate limit) |
| `src/app/api/files/employee-photos/[filename]/route.ts` | Employee photo download (auth + rate limit + institution check + audit) |
| `src/app/api/files/employee-documents/[filename]/route.ts` | Employee document download (auth + rate limit + institution check + audit) |
| `src/app/api/employees/[id]/documents/route.ts` | Employee document upload (auth + institution check + audit) |
| `src/app/api/employees/[id]/certificates/route.ts` | Employee certificate upload (auth + audit) |
| `src/app/api/employees/bulk-upload/route.ts` | CSV bulk upload |
| `src/app/api/promotion-form-template/upload/route.ts` | Template upload (auth + rate limit + audit) |
| `src/app/api/promotion-form-template/download/route.ts` | Template download (auth + rate limit) |
| `src/app/api/employees/[id]/fetch-photo/route.ts` | HRIMS individual photo fetch (auth + rate limit) |
| `src/app/api/employees/[id]/fetch-documents/route.ts` | HRIMS individual document fetch (auth + rate limit) |
| `src/app/api/hrims/fetch-photos-by-institution/route.ts` | HRIMS bulk photo fetch (auth + rate limit + role restriction) |
| `src/app/api/hrims/fetch-documents-by-institution/route.ts` | HRIMS bulk document fetch (auth + rate limit + role restriction) |
| `src/lib/api-auth.ts` | Auth verification (`verifyAuth`) and wrapper (`withAuth`) |
| `src/lib/rate-limiter.ts` | Redis-backed rate limiter with `download` tier |
| `src/lib/csrf-utils.ts` | CSRF token generation/validation |
| `src/lib/api-csrf-middleware.ts` | CSRF middleware (`withCSRF`) |
| `src/lib/audit-logger.ts` | Audit logging (`logFileAction`) with FILE_DOWNLOADED/FILE_PREVIEWED types |
