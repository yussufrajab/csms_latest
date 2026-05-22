# File Upload Security Design

## Context

The CSMS application handles file uploads across multiple endpoints (employee documents, certificates, photos, bulk CSV, promotion templates). Current validation is inconsistent: MIME types and size limits are hardcoded per route, no magic-byte verification, no executable blocking, no malware scanning, and the generic upload endpoint has no authentication.

This design addresses UAT controls FILE-01 through FILE-04.

## Architecture

**Approach: Centralized Validation Module** — a single `src/lib/file-validation.ts` module that all upload routes import and call. Matches the existing codebase pattern of routes calling utility functions directly.

## Components

### 1. File Validation Module (`src/lib/file-validation.ts`)

**Upload context configs:**

```ts
const UPLOAD_CONFIGS = {
  documents:    { allowedMimes: ['application/pdf'], maxSize: 5MB },
  certificates: { allowedMimes: ['application/pdf'], maxSize: 1MB },
  templates:    { allowedMimes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], maxSize: 1MB },
  bulkUpload:   { allowedMimes: ['text/csv', 'application/vnd.ms-excel'], maxSize: 5MB },
  photos:       { allowedMimes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], maxSize: 2MB },
  generic:      { allowedMimes: ['application/pdf'], maxSize: 1MB },
}
```

**Executable blocklist** — always blocked regardless of context:

```ts
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.wsf', '.msi',
  '.com', '.scr', '.pif', '.dll', '.reg', '.hta', '.cpl', '.inf',
  '.jsp', '.php', '.asp', '.aspx'
]
const BLOCKED_MIMES = [
  'application/x-executable', 'application/x-dosexec',
  'application/x-msdownload', 'application/x-shellscript',
  'application/x-bat', 'application/x-csh',
  'application/x-sh', 'application/x-msi',
]
```

**Magic-byte signatures:**

| Type | Signature | Hex |
|------|-----------|-----|
| PDF | `%PDF-` | `25 50 44 46 2D` |
| DOC (OLE2) | `ÐÏà¡±é` | `D0 CF 11 E0 A1 B1 1A E1` |
| DOCX/ZIP | `PK` | `50 4B 03 04` (+ verify ZIP contains `word/`) |
| JPEG | `ÿØÿ` | `FF D8 FF` |
| PNG | `PNG` | `89 50 4E 47 0D 0A 1A 0A` |
| GIF | `GIF87a`/`GIF89a` | `47 49 46 38 37 61` / `47 49 46 38 39 61` |
| WebP | `RIFF....WEBP` | `52 49 46 46 xx xx xx xx 57 45 42 50` |
| CSV | No binary sig | Validate printable ASCII/UTF-8 |

**Validation pipeline** — `validateFileUpload(buffer, filename, context)`:

1. **Extension blocklist** — reject if extension matches `BLOCKED_EXTENSIONS` → 403 `BLOCKED_FILE_TYPE`
2. **MIME allowlist** — reject if declared MIME not in context's `allowedMimes` → 415 `INVALID_FILE_TYPE`
3. **Size limit** — reject if buffer size exceeds context's `maxSize` → 413 `FILE_TOO_LARGE`
4. **Magic-byte verification** — read file header bytes and verify they match the expected signature for the claimed MIME type → 415 `FILE_CONTENT_MISMATCH`
5. **ClamAV scan** — send buffer to ClamAV for malware detection → 403 `MALWARE_DETECTED`

Returns `{ success: true, sanitizedFilename, detectedMime }` on success.

### 2. ClamAV Client (`src/lib/clamav.ts`)

**Connection:** TCP socket to ClamAV daemon (INSTREAM protocol).

**Environment variables:**
- `CLAMAV_HOST` (default: `localhost`)
- `CLAMAV_PORT` (default: `3310`)
- `CLAMAV_TIMEOUT` (default: `30000ms`)
- `CLAMAV_ENABLED` (default: `true`)

**Protocol:**
1. Open TCP connection to ClamAV
2. Send `nINSTREAM\n`
3. Send chunk length (4 bytes big-endian) + chunk data, repeat until buffer is sent
4. Send `0` length chunk to signal end
5. Read response: `stream: OK` → clean, `stream: <VIRUS_NAME> FOUND` → infected
6. Close connection

**Fail-closed policy:**
- ClamAV unreachable + `CLAMAV_ENABLED=true` → reject upload (503 `SCAN_SERVICE_UNAVAILABLE`)
- `CLAMAV_ENABLED=false` → skip scan (dev/test mode)
- Connection timeout → reject upload

### 3. Route Integration

Each upload route replaces inline MIME/size checks with:

```ts
import { validateFileUpload } from '@/lib/file-validation';

const result = await validateFileUpload(buffer, filename, 'documents');
if (!result.success) {
  return NextResponse.json({ error: result.error }, { status: result.status });
}
```

**Affected routes:**
- `src/app/api/files/upload/route.ts` — context: `generic`
- `src/app/api/employees/[id]/documents/route.ts` — context: `documents`
- `src/app/api/employees/[id]/certificates/route.ts` — context: `certificates`
- `src/app/api/promotion-form-template/upload/route.ts` — context: `templates`
- `src/app/api/employees/bulk-upload/route.ts` — context: `bulkUpload`
- `src/app/api/employees/[id]/fetch-photo/route.ts` — context: `photos`
- `src/app/api/employees/[id]/fetch-documents/route.ts` — context: `generic`

Existing role-based access checks remain unchanged — they're a separate concern.

### 4. Error Responses

Consistent `FileValidationError` with structured error codes:

| Step | Status | Error Code | Message |
|------|--------|------------|---------|
| Extension blocklist | 403 | `BLOCKED_FILE_TYPE` | "This file type is not allowed" |
| MIME not in allowlist | 415 | `INVALID_FILE_TYPE` | "File type {mime} is not allowed for {context}" |
| Size exceeded | 413 | `FILE_TOO_LARGE` | "File exceeds maximum size of {max}MB" |
| Magic byte mismatch | 415 | `FILE_CONTENT_MISMATCH` | "File content does not match the declared type" |
| ClamAV infected | 403 | `MALWARE_DETECTED` | "File failed security scan" |
| ClamAV unavailable | 503 | `SCAN_SERVICE_UNAVAILABLE` | "Security scanning is unavailable. Please try again later." |

**Frontend:** Update `FileUpload` and related components to parse these error codes and display user-friendly messages. Clear the file input on rejection.

### 5. Testing

**Unit tests (`src/lib/__tests__/`):**

- `file-validation.test.ts`:
  - Extension blocklist blocks `.exe`, `.bat`, `.sh`, etc.
  - MIME allowlist rejects disallowed types per context
  - Size limits enforced per context
  - Magic-byte verification catches spoofed MIME types (e.g., `.exe` renamed to `.pdf`)
  - Full pipeline: valid files pass, invalid files rejected at the right step

- `clamav.test.ts`:
  - `CLAMAV_ENABLED=false` skips scan
  - Connection failure returns `SCAN_SERVICE_UNAVAILABLE`
  - Virus detected returns `MALWARE_DETECTED`
  - Clean file returns success
  - Uses mocked TCP socket

**E2E tests (Playwright) matching UAT controls:**
- FILE-01: Upload `.exe` file → verify 403 with `BLOCKED_FILE_TYPE`
- FILE-02: Upload oversized file → verify 413 with `FILE_TOO_LARGE`
- FILE-03: Upload EICAR test signature → verify 403 with `MALWARE_DETECTED` (if ClamAV running)
- FILE-04: Upload allowed file types → success; upload disallowed type → 415

## UAT Control Coverage

| Control | Requirement | Implementation |
|---------|-------------|----------------|
| FILE-01 | Upload executable file → blocked | Extension blocklist + MIME blocklist + magic-byte check |
| FILE-02 | Upload oversized file → rejected | Size limit per context in UPLOAD_CONFIGS |
| FILE-03 | Upload malicious script → detection triggered | ClamAV INSTREAM scan on every upload |
| FILE-04 | Verify allowed file extensions → enforced | MIME allowlist per context + magic-byte verification |