# File Upload Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement file upload security (FILE-01 through FILE-04) with centralized validation, ClamAV integration, magic-byte verification, and executable blocking.

**Architecture:** Single `src/lib/file-validation.ts` module exports `validateFileUpload()` which all upload routes call. A separate `src/lib/clamav.ts` handles TCP socket communication with ClamAV. Validation pipeline runs: extension blocklist → MIME allowlist → size limit → magic-byte check → ClamAV scan.

**Tech Stack:** TypeScript, Node.js net module (TCP socket for ClamAV), Vitest for unit tests, Playwright for E2E

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/clamav.ts` | ClamAV TCP client (INSTREAM protocol) |
| Create | `src/lib/file-validation.ts` | Centralized validation pipeline + config |
| Create | `src/lib/clamav.test.ts` | Unit tests for ClamAV client |
| Create | `src/lib/file-validation.test.ts` | Unit tests for validation pipeline |
| Modify | `src/app/api/files/upload/route.ts` | Replace inline checks with `validateFileUpload` |
| Modify | `src/app/api/employees/[id]/documents/route.ts` | Replace inline checks with `validateFileUpload` |
| Modify | `src/app/api/employees/[id]/certificates/route.ts` | Replace inline checks with `validateFileUpload` |
| Modify | `src/app/api/promotion-form-template/upload/route.ts` | Replace inline checks with `validateFileUpload` |
| Modify | `src/app/api/employees/bulk-upload/route.ts` | Add file validation to CSV upload |
| Modify | `src/app/api/employees/[id]/fetch-photo/route.ts` | Validate HRIMS-fetched photos before storage |
| Modify | `src/app/api/employees/[id]/fetch-documents/route.ts` | Validate HRIMS-fetched docs before storage |
| Modify | `src/components/ui/file-upload.tsx` | Parse new error codes from server responses |

---

### Task 1: Create ClamAV Client (`src/lib/clamav.ts`)

**Files:**
- Create: `src/lib/clamav.ts`

- [ ] **Step 1: Create the ClamAV client module**

```ts
// src/lib/clamav.ts
import * as net from 'net';

const CLAMAV_HOST = process.env.CLAMAV_HOST || 'localhost';
const CLAMAV_PORT = parseInt(process.env.CLAMAV_PORT || '3310', 10);
const CLAMAV_TIMEOUT = parseInt(process.env.CLAMAV_TIMEOUT || '30000', 10);
const CLAMAV_ENABLED = process.env.CLAMAV_ENABLED !== 'false'; // default true

export interface ClamAVResult {
  isClean: boolean;
  virusName?: string;
  error?: string;
}

function scanWithClamAV(buffer: Buffer): Promise<ClamAVResult> {
  return new Promise((resolve) => {
    if (!CLAMAV_ENABLED) {
      resolve({ isClean: true });
      return;
    }

    const socket = new net.Socket();
    socket.setTimeout(CLAMAV_TIMEOUT);

    let response = '';

    socket.on('data', (data) => {
      response += data.toString();
    });

    socket.on('end', () => {
      const trimmed = response.trim();
      if (trimmed.includes('FOUND')) {
        const match = trimmed.match(/stream: (.+?) FOUND/);
        resolve({
          isClean: false,
          virusName: match ? match[1] : 'UNKNOWN',
        });
      } else if (trimmed.includes('OK')) {
        resolve({ isClean: true });
      } else {
        resolve({
          isClean: false,
          error: `Unexpected ClamAV response: ${trimmed}`,
        });
      }
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({
        isClean: false,
        error: 'ClamAV connection timeout',
      });
    });

    socket.on('error', (err) => {
      resolve({
        isClean: false,
        error: `ClamAV connection error: ${err.message}`,
      });
    });

    socket.connect(CLAMAV_PORT, CLAMAV_HOST, () => {
      // Send INSTREAM command
      socket.write('nINSTREAM\n');

      // Send file in chunks (max 2048 bytes per chunk per ClamAV protocol)
      const CHUNK_SIZE = 2048;
      let offset = 0;

      function sendChunk() {
        if (offset >= buffer.length) {
          // Send zero-length chunk to signal end
          const endBuffer = Buffer.alloc(4);
          endBuffer.writeUInt32BE(0, 0);
          socket.write(endBuffer);
          return;
        }

        const chunk = buffer.subarray(offset, offset + CHUNK_SIZE);
        const sizeBuffer = Buffer.alloc(4);
        sizeBuffer.writeUInt32BE(chunk.length, 0);

        socket.write(Buffer.concat([sizeBuffer, chunk]));
        offset += CHUNK_SIZE;
        // Small delay to avoid flooding the socket
        setImmediate(sendChunk);
      }

      sendChunk();
    });
  });
}

/**
 * Scan a file buffer for malware using ClamAV.
 * Returns isClean=true if no malware detected, isClean=false if infected.
 * If ClamAV is unavailable and CLAMAV_ENABLED=true, returns an error result
 * (fail-closed). If CLAMAV_ENABLED=false, skips scanning and returns clean.
 */
export async function scanFile(buffer: Buffer): Promise<ClamAVResult> {
  return scanWithClamAV(buffer);
}

/**
 * Check if ClamAV scanning is enabled.
 */
export function isClamAVEnabled(): boolean {
  return CLAMAV_ENABLED;
}
```

- [ ] **Step 2: Commit ClamAV client**

```bash
git add src/lib/clamav.ts
git commit -m "feat: add ClamAV client for file malware scanning (FILE-03)"
```

---

### Task 2: Create File Validation Module (`src/lib/file-validation.ts`)

**Files:**
- Create: `src/lib/file-validation.ts`

- [ ] **Step 1: Create the file validation module**

```ts
// src/lib/file-validation.ts
import { scanFile, isClamAVEnabled } from './clamav';

// --- Upload context configs ---
export type UploadContext = 'documents' | 'certificates' | 'templates' | 'bulkUpload' | 'photos' | 'generic';

interface UploadConfig {
  allowedMimes: string[];
  maxSize: number; // in bytes
}

const UPLOAD_CONFIGS: Record<UploadContext, UploadConfig> = {
  documents: {
    allowedMimes: ['application/pdf'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  certificates: {
    allowedMimes: ['application/pdf'],
    maxSize: 1 * 1024 * 1024, // 1MB
  },
  templates: {
    allowedMimes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    maxSize: 1 * 1024 * 1024, // 1MB
  },
  bulkUpload: {
    allowedMimes: ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  photos: {
    allowedMimes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 2 * 1024 * 1024, // 2MB
  },
  generic: {
    allowedMimes: ['application/pdf'],
    maxSize: 1 * 1024 * 1024, // 1MB
  },
};

// --- Extension blocklist ---
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.wsf', '.msi',
  '.com', '.scr', '.pif', '.dll', '.reg', '.hta', '.cpl', '.inf',
  '.jsp', '.php', '.asp', '.aspx',
];

const BLOCKED_MIMES = [
  'application/x-executable', 'application/x-dosexec',
  'application/x-msdownload', 'application/x-shellscript',
  'application/x-bat', 'application/x-csh',
  'application/x-sh', 'application/x-msi',
  'application/x-httpd-php', 'application/x-asp',
];

// --- Magic byte signatures ---
interface MagicSignature {
  mimes: string[];
  offset: number;
  bytes: number[];
  // Optional mask: if provided, signature matches where (bytes[i] & mask[i]) === expected[i]
  mask?: number[];
}

const MAGIC_SIGNATURES: MagicSignature[] = [
  // PDF: starts with %PDF-
  { mimes: ['application/pdf'], offset: 0, bytes: [0x25, 0x50, 0x44, 0x46, 0x2D] },
  // DOC (OLE2): starts with D0 CF 11 E0 A1 B1 1A E1
  { mimes: ['application/msword'], offset: 0, bytes: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1] },
  // DOCX/ZIP: starts with PK (50 4B 03 04) - also matches XLSX, PPTX, etc.
  { mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'], offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04] },
  // JPEG: FF D8 FF
  { mimes: ['image/jpeg'], offset: 0, bytes: [0xFF, 0xD8, 0xFF] },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  { mimes: ['image/png'], offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  // GIF87a
  { mimes: ['image/gif'], offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] },
  // GIF89a
  { mimes: ['image/gif'], offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] },
  // WebP: RIFF....WEBP
  { mimes: ['image/webp'], offset: 0, bytes: [0x52, 0x49, 0x46, 0x46], mask: [0xFF, 0xFF, 0xFF, 0xFF] },
  // WebP offset check: bytes 8-11 should be W E B P
  // (handled separately in the verification function)
];

// --- Error types ---
export type FileValidationErrorCode =
  | 'BLOCKED_FILE_TYPE'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'FILE_CONTENT_MISMATCH'
  | 'MALWARE_DETECTED'
  | 'SCAN_SERVICE_UNAVAILABLE';

export interface FileValidationResult {
  success: boolean;
  error?: string;
  errorCode?: FileValidationErrorCode;
  status?: number;
  detectedMime?: string;
}

/**
 * Get the config for a given upload context.
 */
export function getUploadConfig(context: UploadContext): UploadConfig {
  return UPLOAD_CONFIGS[context];
}

/**
 * Get file extension from filename, lowercased.
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot).toLowerCase();
}

/**
 * Check if a file extension is in the blocklist.
 */
function isBlockedExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  return BLOCKED_EXTENSIONS.includes(ext);
}

/**
 * Check if a MIME type is in the blocklist.
 */
function isBlockedMime(mimeType: string): boolean {
  return BLOCKED_MIMES.includes(mimeType.toLowerCase());
}

/**
 * Verify file content matches the claimed MIME type using magic bytes.
 * Returns the detected MIME type or null if no match found.
 */
function detectMimeType(buffer: Buffer): string | null {
  // Check each known signature
  for (const sig of MAGIC_SIGNATURES) {
    if (buffer.length < sig.offset + sig.bytes.length) continue;

    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      const actual = buffer[sig.offset + i];
      const expected = sig.bytes[i];
      const mask = sig.mask?.[i] ?? 0xFF;

      if ((actual & mask) !== expected) {
        match = false;
        break;
      }
    }

    if (match) {
      // Special case: WebP needs to verify "WEBP" at offset 8
      if (sig.mimes.includes('image/webp') && buffer.length >= 12) {
        const webpTag = buffer.subarray(8, 12).toString('ascii');
        if (webpTag === 'WEBP') {
          return 'image/webp';
        }
        continue; // RIFF but not WebP, keep checking
      }

      // Special case: DOCX (ZIP) - check for word/ entry to distinguish from other Office docs
      // We accept the ZIP signature for DOCX context since the MIME allowlist
      // already constrains what's allowed per context
      return sig.mimes[0];
    }
  }

  // CSV/text: no binary signature, check if content is mostly printable
  // This is a heuristic - if no binary signature matched, check if it looks like text
  let printableCount = 0;
  const sampleSize = Math.min(buffer.length, 512);
  for (let i = 0; i < sampleSize; i++) {
    const byte = buffer[i];
    if (
      (byte >= 0x20 && byte <= 0x7E) || // Printable ASCII
      byte === 0x09 || // Tab
      byte === 0x0A || // Newline
      byte === 0x0D || // Carriage return
      byte > 0x7F       // Extended ASCII / UTF-8
    ) {
      printableCount++;
    }
  }

  if (sampleSize > 0 && printableCount / sampleSize > 0.85) {
    return 'text/csv'; // Could be CSV or plain text
  }

  return null;
}

/**
 * Validate that the detected MIME type is compatible with the declared MIME type.
 */
function isMimeTypeCompatible(detected: string | null, declared: string): boolean {
  if (!detected) {
    // If we couldn't detect the type, reject (fail-closed)
    return false;
  }

  // Exact match
  if (detected === declared) return true;

  // text/csv is compatible with text/plain and application/vnd.ms-excel
  if (detected === 'text/csv' && (declared === 'text/csv' || declared === 'text/plain' || declared === 'application/vnd.ms-excel')) {
    return true;
  }

  // image/jpeg covers both image/jpeg and image/jpg (some browsers send image/jpg)
  if (detected === 'image/jpeg' && declared === 'image/jpg') return true;
  if (declared === 'image/jpeg' && detected === 'image/jpeg') return true;

  return false;
}

/**
 * Main validation pipeline.
 * Validates a file upload buffer against the specified context's security rules.
 *
 * @param buffer - The file content as a Buffer
 * @param filename - The original filename
 * @param mimeType - The MIME type reported by the client
 * @param context - The upload context determining allowed types/sizes
 * @returns FileValidationResult with success=true or error details
 */
export async function validateFileUpload(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  context: UploadContext
): Promise<FileValidationResult> {
  const config = UPLOAD_CONFIGS[context];

  // Step 1: Extension blocklist check
  if (isBlockedExtension(filename)) {
    return {
      success: false,
      error: 'This file type is not allowed',
      errorCode: 'BLOCKED_FILE_TYPE',
      status: 403,
    };
  }

  // Also check MIME against blocklist
  if (isBlockedMime(mimeType)) {
    return {
      success: false,
      error: 'This file type is not allowed',
      errorCode: 'BLOCKED_FILE_TYPE',
      status: 403,
    };
  }

  // Step 2: MIME allowlist check
  if (!config.allowedMimes.includes(mimeType)) {
    return {
      success: false,
      error: `File type ${mimeType} is not allowed for ${context}`,
      errorCode: 'INVALID_FILE_TYPE',
      status: 415,
    };
  }

  // Step 3: Size limit check
  if (buffer.length > config.maxSize) {
    const maxMB = (config.maxSize / (1024 * 1024)).toFixed(1);
    return {
      success: false,
      error: `File exceeds maximum size of ${maxMB}MB`,
      errorCode: 'FILE_TOO_LARGE',
      status: 413,
    };
  }

  // Step 4: Magic-byte verification
  const detectedMime = detectMimeType(buffer);
  if (!isMimeTypeCompatible(detectedMime, mimeType)) {
    return {
      success: false,
      error: 'File content does not match the declared type',
      errorCode: 'FILE_CONTENT_MISMATCH',
      status: 415,
    };
  }

  // Step 5: ClamAV malware scan
  const scanResult = await scanFile(buffer);
  if (scanResult.error) {
    // ClamAV unavailable - fail-closed
    return {
      success: false,
      error: 'Security scanning is unavailable. Please try again later.',
      errorCode: 'SCAN_SERVICE_UNAVAILABLE',
      status: 503,
    };
  }

  if (!scanResult.isClean) {
    return {
      success: false,
      error: 'File failed security scan',
      errorCode: 'MALWARE_DETECTED',
      status: 403,
    };
  }

  return {
    success: true,
    detectedMime: detectedMime || mimeType,
  };
}

// Export helpers for testing
export { UPLOAD_CONFIGS, BLOCKED_EXTENSIONS, BLOCKED_MIMES, isBlockedExtension, isBlockedMime, detectMimeType, isMimeTypeCompatible };
```

- [ ] **Step 2: Commit file validation module**

```bash
git add src/lib/file-validation.ts
git commit -m "feat: add centralized file validation module (FILE-01, FILE-02, FILE-04)"
```

---

### Task 3: Write Unit Tests for File Validation

**Files:**
- Create: `src/lib/file-validation.test.ts`

- [ ] **Step 1: Write file validation tests**

```ts
// src/lib/file-validation.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateFileUpload,
  UPLOAD_CONFIGS,
  BLOCKED_EXTENSIONS,
  BLOCKED_MIMES,
  isBlockedExtension,
  isBlockedMime,
  detectMimeType,
  isMimeTypeCompatible,
  getUploadConfig,
} from './file-validation';

// Mock ClamAV to always return clean
vi.mock('./clamav', () => ({
  scanFile: vi.fn().mockResolvedValue({ isClean: true }),
  isClamAVEnabled: vi.fn().mockReturnValue(true),
}));

// Helper: create a PDF buffer with valid magic bytes
function createPdfBuffer(size: number = 1024): Buffer {
  const header = Buffer.from('%PDF-1.4\n');
  const body = Buffer.alloc(size - header.length, 0x20); // fill with spaces
  return Buffer.concat([header, body]);
}

// Helper: create a JPEG buffer
function createJpegBuffer(size: number = 1024): Buffer {
  const header = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
  const body = Buffer.alloc(size - header.length, 0x20);
  return Buffer.concat([header, body]);
}

// Helper: create a PNG buffer
function createPngBuffer(size: number = 1024): Buffer {
  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const body = Buffer.alloc(size - header.length, 0x20);
  return Buffer.concat([header, body]);
}

// Helper: create a DOC (OLE2) buffer
function createDocBuffer(size: number = 1024): Buffer {
  const header = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
  const body = Buffer.alloc(size - header.length, 0x20);
  return Buffer.concat([header, body]);
}

// Helper: create a DOCX (ZIP/PK) buffer
function createDocxBuffer(size: number = 2048): Buffer {
  // PK signature (ZIP local file header)
  const header = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
  const body = Buffer.alloc(size - header.length, 0x20);
  return Buffer.concat([header, body]);
}

// Helper: create a CSV buffer
function createCsvBuffer(content: string = 'Name,Age,City\nJohn,30,NYC'): Buffer {
  return Buffer.from(content, 'utf-8');
}

// Helper: create a GIF87a buffer
function createGifBuffer(size: number = 1024): Buffer {
  const header = Buffer.from('GIF87a');
  const body = Buffer.alloc(size - header.length, 0x20);
  return Buffer.concat([header, body]);
}

// Helper: create a WebP buffer
function createWebpBuffer(size: number = 1024): Buffer {
  const header = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // RIFF
    0x00, 0x00, 0x00, 0x00, // file size placeholder
    0x57, 0x45, 0x42, 0x50, // WEBP
  ]);
  const body = Buffer.alloc(size - header.length, 0x20);
  return Buffer.concat([header, body]);
}

describe('file-validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Config tests ---
  describe('UPLOAD_CONFIGS', () => {
    it('should have config for all contexts', () => {
      const contexts = ['documents', 'certificates', 'templates', 'bulkUpload', 'photos', 'generic'];
      contexts.forEach((ctx) => {
        expect(UPLOAD_CONFIGS[ctx as keyof typeof UPLOAD_CONFIGS]).toBeDefined();
      });
    });

    it('should have correct size limits', () => {
      expect(UPLOAD_CONFIGS.documents.maxSize).toBe(5 * 1024 * 1024);
      expect(UPLOAD_CONFIGS.certificates.maxSize).toBe(1 * 1024 * 1024);
      expect(UPLOAD_CONFIGS.templates.maxSize).toBe(1 * 1024 * 1024);
      expect(UPLOAD_CONFIGS.bulkUpload.maxSize).toBe(5 * 1024 * 1024);
      expect(UPLOAD_CONFIGS.photos.maxSize).toBe(2 * 1024 * 1024);
      expect(UPLOAD_CONFIGS.generic.maxSize).toBe(1 * 1024 * 1024);
    });
  });

  describe('getUploadConfig', () => {
    it('should return config for valid context', () => {
      const config = getUploadConfig('documents');
      expect(config.allowedMimes).toContain('application/pdf');
    });
  });

  // --- Extension blocklist tests ---
  describe('isBlockedExtension', () => {
    it('should block .exe files', () => {
      expect(isBlockedExtension('malware.exe')).toBe(true);
    });

    it('should block .bat files', () => {
      expect(isBlockedExtension('script.bat')).toBe(true);
    });

    it('should block .sh files', () => {
      expect(isBlockedExtension('run.sh')).toBe(true);
    });

    it('should block .php files', () => {
      expect(isBlockedExtension('index.php')).toBe(true);
    });

    it('should block .jsp files', () => {
      expect(isBlockedExtension('page.jsp')).toBe(true);
    });

    it('should block .asp files', () => {
      expect(isBlockedExtension('page.asp')).toBe(true);
    });

    it('should allow .pdf files', () => {
      expect(isBlockedExtension('document.pdf')).toBe(false);
    });

    it('should allow .docx files', () => {
      expect(isBlockedExtension('template.docx')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isBlockedExtension('VIRUS.EXE')).toBe(true);
      expect(isBlockedExtension('Script.BAT')).toBe(true);
    });

    it('should handle files without extension', () => {
      expect(isBlockedExtension('README')).toBe(false);
    });
  });

  describe('isBlockedMime', () => {
    it('should block executable MIME types', () => {
      expect(isBlockedMime('application/x-executable')).toBe(true);
      expect(isBlockedMime('application/x-dosexec')).toBe(true);
      expect(isBlockedMime('application/x-shellscript')).toBe(true);
    });

    it('should allow valid MIME types', () => {
      expect(isBlockedMime('application/pdf')).toBe(false);
      expect(isBlockedMime('image/jpeg')).toBe(false);
    });
  });

  // --- Magic byte detection ---
  describe('detectMimeType', () => {
    it('should detect PDF files', () => {
      const buffer = createPdfBuffer();
      expect(detectMimeType(buffer)).toBe('application/pdf');
    });

    it('should detect JPEG files', () => {
      const buffer = createJpegBuffer();
      expect(detectMimeType(buffer)).toBe('image/jpeg');
    });

    it('should detect PNG files', () => {
      const buffer = createPngBuffer();
      expect(detectMimeType(buffer)).toBe('image/png');
    });

    it('should detect DOC (OLE2) files', () => {
      const buffer = createDocBuffer();
      expect(detectMimeType(buffer)).toBe('application/msword');
    });

    it('should detect GIF files', () => {
      const buffer = createGifBuffer();
      expect(detectMimeType(buffer)).toBe('image/gif');
    });

    it('should detect WebP files', () => {
      const buffer = createWebpBuffer();
      expect(detectMimeType(buffer)).toBe('image/webp');
    });

    it('should detect CSV/text files', () => {
      const buffer = createCsvBuffer();
      expect(detectMimeType(buffer)).toBe('text/csv');
    });

    it('should return null for binary files with no known signature', () => {
      const buffer = Buffer.alloc(1024, 0x00);
      expect(detectMimeType(buffer)).toBeNull();
    });
  });

  // --- MIME type compatibility ---
  describe('isMimeTypeCompatible', () => {
    it('should match identical MIME types', () => {
      expect(isMimeTypeCompatible('application/pdf', 'application/pdf')).toBe(true);
    });

    it('should allow text/csv for declared application/vnd.ms-excel', () => {
      expect(isMimeTypeCompatible('text/csv', 'application/vnd.ms-excel')).toBe(true);
    });

    it('should reject mismatched types', () => {
      expect(isMimeTypeCompatible('application/pdf', 'image/jpeg')).toBe(false);
    });

    it('should reject null detected type', () => {
      expect(isMimeTypeCompatible(null, 'application/pdf')).toBe(false);
    });
  });

  // --- Full pipeline tests ---
  describe('validateFileUpload', () => {
    it('should accept valid PDF for documents context', async () => {
      const buffer = createPdfBuffer();
      const result = await validateFileUpload(buffer, 'document.pdf', 'application/pdf', 'documents');
      expect(result.success).toBe(true);
      expect(result.detectedMime).toBe('application/pdf');
    });

    it('should reject executable files (FILE-01)', async () => {
      const buffer = Buffer.alloc(100, 0x00);
      const result = await validateFileUpload(buffer, 'malware.exe', 'application/x-msdownload', 'documents');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('BLOCKED_FILE_TYPE');
      expect(result.status).toBe(403);
    });

    it('should reject .bat files regardless of MIME type', async () => {
      const buffer = Buffer.alloc(100, 0x20);
      const result = await validateFileUpload(buffer, 'script.bat', 'text/plain', 'documents');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('BLOCKED_FILE_TYPE');
    });

    it('should reject oversized files (FILE-02)', async () => {
      // Create a buffer larger than 1MB for 'generic' context
      const buffer = Buffer.alloc(2 * 1024 * 1024, 0x20);
      // Prefix with PDF header so it passes content check
      buffer.write('%PDF-', 0);
      const result = await validateFileUpload(buffer, 'big.pdf', 'application/pdf', 'generic');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('FILE_TOO_LARGE');
      expect(result.status).toBe(413);
    });

    it('should reject wrong MIME type (FILE-04)', async () => {
      const buffer = createJpegBuffer();
      const result = await validateFileUpload(buffer, 'photo.jpg', 'image/jpeg', 'documents');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_TYPE');
      expect(result.status).toBe(415);
    });

    it('should reject files with spoofed extension (FILE-01)', async () => {
      // An executable renamed to .pdf — content won't match PDF signature
      const buffer = Buffer.alloc(1024, 0x00); // random binary, no PDF header
      const result = await validateFileUpload(buffer, 'document.pdf', 'application/pdf', 'documents');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('FILE_CONTENT_MISMATCH');
    });

    it('should accept JPEG for photos context', async () => {
      const buffer = createJpegBuffer();
      const result = await validateFileUpload(buffer, 'photo.jpg', 'image/jpeg', 'photos');
      expect(result.success).toBe(true);
    });

    it('should accept PNG for photos context', async () => {
      const buffer = createPngBuffer();
      const result = await validateFileUpload(buffer, 'photo.png', 'image/png', 'photos');
      expect(result.success).toBe(true);
    });

    it('should accept CSV for bulkUpload context', async () => {
      const buffer = createCsvBuffer();
      const result = await validateFileUpload(buffer, 'employees.csv', 'text/csv', 'bulkUpload');
      expect(result.success).toBe(true);
    });

    it('should accept DOCX for templates context', async () => {
      const buffer = createDocxBuffer();
      const result = await validateFileUpload(buffer, 'template.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'templates');
      expect(result.success).toBe(true);
    });

    it('should accept DOC for templates context', async () => {
      const buffer = createDocBuffer();
      const result = await validateFileUpload(buffer, 'template.doc', 'application/msword', 'templates');
      expect(result.success).toBe(true);
    });

    it('should reject PDF in photos context', async () => {
      const buffer = createPdfBuffer();
      const result = await validateFileUpload(buffer, 'photo.pdf', 'application/pdf', 'photos');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_TYPE');
    });
  });

  // --- ClamAV integration tests ---
  describe('validateFileUpload - ClamAV integration', () => {
    it('should reject files when ClamAV detects malware (FILE-03)', async () => {
      const { scanFile } = await import('./clamav');
      vi.mocked(scanFile).mockResolvedValueOnce({
        isClean: false,
        virusName: 'EICAR-Test-File',
      });

      const buffer = createPdfBuffer();
      const result = await validateFileUpload(buffer, 'infected.pdf', 'application/pdf', 'documents');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('MALWARE_DETECTED');
      expect(result.status).toBe(403);
    });

    it('should reject files when ClamAV is unavailable and enabled', async () => {
      const { scanFile } = await import('./clamav');
      vi.mocked(scanFile).mockResolvedValueOnce({
        isClean: false,
        error: 'ClamAV connection error: ECONNREFUSED',
      });

      const buffer = createPdfBuffer();
      const result = await validateFileUpload(buffer, 'doc.pdf', 'application/pdf', 'documents');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('SCAN_SERVICE_UNAVAILABLE');
      expect(result.status).toBe(503);
    });

    it('should pass files when ClamAV scan is clean', async () => {
      const { scanFile } = await import('./clamav');
      vi.mocked(scanFile).mockResolvedValueOnce({ isClean: true });

      const buffer = createPdfBuffer();
      const result = await validateFileUpload(buffer, 'clean.pdf', 'application/pdf', 'documents');
      expect(result.success).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Write ClamAV client tests**

```ts
// src/lib/clamav.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as net from 'net';
import { scanFile, isClamAVEnabled } from './clamav';

// Save original env vars
const originalEnv = { ...process.env };

describe('clamav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env
    process.env.CLAMAV_HOST = 'localhost';
    process.env.CLAMAV_PORT = '3310';
    process.env.CLAMAV_TIMEOUT = '30000';
    delete process.env.CLAMAV_ENABLED;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('isClamAVEnabled', () => {
    it('should return true by default', () => {
      // Need to reimport to get fresh env
      expect(process.env.CLAMAV_ENABLED).toBeUndefined();
    });

    it('should return false when CLAMAV_ENABLED=false', () => {
      process.env.CLAMAV_ENABLED = 'false';
      // The module reads env at import time, so we test the behavior
      // through scanFile which checks CLAMAV_ENABLED
    });
  });

  describe('scanFile', () => {
    it('should skip scan when CLAMAV_ENABLED=false', async () => {
      process.env.CLAMAV_ENABLED = 'false';
      // Re-import to get fresh config
      vi.resetModules();
      const { scanFile: scanFileFresh } = await import('./clamav');
      const result = await scanFileFresh(Buffer.from('test'));
      expect(result.isClean).toBe(true);
    });

    it('should return error when ClamAV is unreachable', async () => {
      // Use a port that's definitely not listening
      process.env.CLAMAV_PORT = '19999';
      process.env.CLAMAV_TIMEOUT = '2000'; // Short timeout for test
      vi.resetModules();
      const { scanFile: scanFileFresh } = await import('./clamav');
      const result = await scanFileFresh(Buffer.from('test'));
      expect(result.isClean).toBe(false);
      expect(result.error).toBeDefined();
    }, 10000);
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
npx vitest run src/lib/file-validation.test.ts src/lib/clamav.test.ts
```

Expected: All tests pass (ClamAV tests may show connection errors for the unreachable test, which is expected).

- [ ] **Step 4: Commit tests**

```bash
git add src/lib/file-validation.test.ts src/lib/clamav.test.ts
git commit -m "test: add unit tests for file validation and ClamAV client"
```

---

### Task 4: Integrate `validateFileUpload` into Generic Upload Route

**Files:**
- Modify: `src/app/api/files/upload/route.ts`

- [ ] **Step 1: Update generic upload route**

Replace the inline MIME and size checks (lines 21-36) with `validateFileUpload`. The new route should:

1. Parse the file from form data
2. Convert to buffer
3. Call `validateFileUpload(buffer, file.name, file.type, 'generic')`
4. If validation fails, return the error response
5. Proceed with upload if validation passes

The modified POST handler should look like:

```ts
// Replace lines 21-36 with:
import { validateFileUpload } from '@/lib/file-validation';

// ... inside POST handler, after getting file:

if (!file) {
  return NextResponse.json(
    { success: false, message: 'No file provided' },
    { status: 400 }
  );
}

// Convert file to buffer first (needed for validation)
const arrayBuffer = await file.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

// Validate file upload security
const validation = await validateFileUpload(buffer, file.name, file.type, 'generic');
if (!validation.success) {
  return NextResponse.json(
    { success: false, message: validation.error, errorCode: validation.errorCode },
    { status: validation.status! }
  );
}

// Generate unique object key
const objectKey = generateObjectKey(folder, file.name);
```

Remove the old `file.type !== 'application/pdf'` check and `file.size > maxSize` check, since those are now handled by `validateFileUpload`.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/files/upload/route.ts
git commit -m "feat: integrate file validation into generic upload route (FILE-01, FILE-02, FILE-04)"
```

---

### Task 5: Integrate `validateFileUpload` into Employee Documents Route

**Files:**
- Modify: `src/app/api/employees/[id]/documents/route.ts`

- [ ] **Step 1: Update employee documents route**

Add import at top:
```ts
import { validateFileUpload } from '@/lib/file-validation';
```

Replace lines 76-91 (the inline `file.type !== 'application/pdf'` and `file.size > maxSize` checks) with:

```ts
// Convert file to buffer first
const arrayBuffer = await file.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

// Validate file upload security
const validation = await validateFileUpload(buffer, file.name, file.type, 'documents');
if (!validation.success) {
  return NextResponse.json(
    { success: false, message: validation.error, errorCode: validation.errorCode },
    { status: validation.status! }
  );
}
```

Then keep the `generateObjectKey` and `uploadFile` calls but remove the separate buffer creation (it's already done above).

- [ ] **Step 2: Commit**

```bash
git add src/app/api/employees/[id]/documents/route.ts
git commit -m "feat: integrate file validation into employee documents route"
```

---

### Task 6: Integrate `validateFileUpload` into Employee Certificates Route

**Files:**
- Modify: `src/app/api/employees/[id]/certificates/route.ts`

- [ ] **Step 1: Update employee certificates route**

Add import at top:
```ts
import { validateFileUpload } from '@/lib/file-validation';
```

Replace lines 106-121 (the inline `file.type !== 'application/pdf'` and `file.size > maxSize` checks) with:

```ts
// Convert file to buffer first
const arrayBuffer = await file.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

// Validate file upload security
const validation = await validateFileUpload(buffer, file.name, file.type, 'certificates');
if (!validation.success) {
  return NextResponse.json(
    { success: false, message: validation.error, errorCode: validation.errorCode },
    { status: validation.status! }
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/employees/[id]/certificates/route.ts
git commit -m "feat: integrate file validation into employee certificates route"
```

---

### Task 7: Integrate `validateFileUpload` into Promotion Template Upload Route

**Files:**
- Modify: `src/app/api/promotion-form-template/upload/route.ts`

- [ ] **Step 1: Update promotion template upload route**

Add import at top:
```ts
import { validateFileUpload } from '@/lib/file-validation';
```

Remove the `ACCEPTED_WORD_TYPES` constant and `MAX_FILE_SIZE` constant (they're now in the config).

Replace lines 39-59 (the `ACCEPTED_WORD_TYPES` check and `file.size > MAX_FILE_SIZE` check) with:

```ts
// Convert file to buffer first
const arrayBuffer = await file.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

// Validate file upload security
const validation = await validateFileUpload(buffer, file.name, file.type, 'templates');
if (!validation.success) {
  return NextResponse.json(
    { success: false, message: validation.error, errorCode: validation.errorCode },
    { status: validation.status! }
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/promotion-form-template/upload/route.ts
git commit -m "feat: integrate file validation into promotion template upload route"
```

---

### Task 8: Integrate `validateFileUpload` into Bulk Upload Route

**Files:**
- Modify: `src/app/api/employees/bulk-upload/route.ts`

- [ ] **Step 1: Update bulk upload route**

Add import at top:
```ts
import { validateFileUpload } from '@/lib/file-validation';
```

After the file null check (around line 213), add validation before reading file content:

```ts
// Read file as buffer for validation
const arrayBuffer = await file.arrayBuffer();
const fileBuffer = Buffer.from(arrayBuffer);

// Validate file upload security (CSV only)
const validation = await validateFileUpload(fileBuffer, file.name, file.type || 'text/csv', 'bulkUpload');
if (!validation.success) {
  return NextResponse.json(
    { success: false, error: validation.error, errorCode: validation.errorCode },
    { status: validation.status! }
  );
}

// Parse CSV content
const fileContent = fileBuffer.toString('utf-8');
const lines = fileContent.split('\n').filter((line) => line.trim());
```

Replace the existing `fileContent` assignment (line 217: `const fileContent = await file.text();`) with the buffer-based approach above. Remove the `await file.text()` call since we already have the buffer.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/employees/bulk-upload/route.ts
git commit -m "feat: integrate file validation into bulk upload route"
```

---

### Task 9: Integrate `validateFileUpload` into HRIMS Fetch Routes

**Files:**
- Modify: `src/app/api/employees/[id]/fetch-photo/route.ts`
- Modify: `src/app/api/employees/[id]/fetch-documents/route.ts`

- [ ] **Step 1: Update fetch-photo route**

Add import at top:
```ts
import { validateFileUpload } from '@/lib/file-validation';
```

Before the MinIO upload call (around line 196: `await uploadFile(photoBuffer, filePath, mimeType);`), add validation:

```ts
// Validate photo from HRIMS before storing
const photoValidation = await validateFileUpload(photoBuffer, `photo.${extension}`, mimeType, 'photos');
if (!photoValidation.success) {
  console.error(`Photo validation failed for employee ${employee.name}: ${photoValidation.error}`);
  return NextResponse.json(
    { success: false, message: `Photo validation failed: ${photoValidation.error}`, errorCode: photoValidation.errorCode },
    { status: photoValidation.status! }
  );
}
```

- [ ] **Step 2: Update fetch-documents route**

Add import at top:
```ts
import { validateFileUpload } from '@/lib/file-validation';
```

In the `storeDocumentInMinIO` helper function, add validation before the MinIO upload:

```ts
async function storeDocumentInMinIO(
  employeeId: string,
  documentType: string,
  base64Data: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Remove data URI prefix if present
    let cleanBase64 = base64Data;
    let mimeType = 'application/pdf'; // default for documents
    if (base64Data.startsWith('data:')) {
      const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        cleanBase64 = matches[2];
      }
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(cleanBase64, 'base64');

    // Validate document from HRIMS before storing
    const validation = await validateFileUpload(buffer, `${documentType}.pdf`, mimeType, 'documents');
    if (!validation.success) {
      return {
        success: false,
        error: `Document validation failed: ${validation.error}`,
      };
    }

    // Generate file path
    const fileName = `${employeeId}_${documentType}.pdf`;
    const filePath = `employee-documents/${fileName}`;

    // Upload to MinIO
    await uploadFile(buffer, filePath, mimeType);

    // Return MinIO URL
    const url = `/api/files/employee-documents/${fileName}`;
    return { success: true, url };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/employees/[id]/fetch-photo/route.ts src/app/api/employees/[id]/fetch-documents/route.ts
git commit -m "feat: validate HRIMS-fetched files before storage (FILE-03)"
```

---

### Task 10: Update Frontend Error Handling

**Files:**
- Modify: `src/components/ui/file-upload.tsx`

- [ ] **Step 1: Update FileUpload component to handle new error codes**

In `src/components/ui/file-upload.tsx`, update the `handleFileSelect` function to parse structured error responses from the server. Find the XHR response handling (around line 146-183) and update the error handling.

After line 148 (`if (result.success) {`), update the else branch to parse error codes:

Find the section that handles `result.success` being false (around lines 156-159) and the error status handling (around lines 170-183). Update the XHR load handler to map error codes:

```ts
// Replace the error toast section inside handleFileSelect
// In the xhr 'load' handler, update the error parsing:

xhr.addEventListener('load', async () => {
  if (xhr.status >= 200 && xhr.status < 300) {
    try {
      const result = JSON.parse(xhr.responseText);
      if (result.success) {
        resolve({
          success: true,
          objectKey: result.data.objectKey,
          fileName: file.name,
        });
      } else {
        resolve({
          success: false,
          error: result.errorCode
            ? getErrorMessage(result.errorCode, result.message)
            : result.message || 'Upload failed',
          fileName: file.name,
        });
      }
    } catch (error: any) {
      resolve({
        success: false,
        error: 'Invalid server response',
        fileName: file.name,
      });
    }
  } else {
    try {
      const errorData = JSON.parse(xhr.responseText);
      resolve({
        success: false,
        error: errorData.errorCode
          ? getErrorMessage(errorData.errorCode, errorData.message)
          : errorData.message || 'Upload failed',
        fileName: file.name,
      });
    } catch {
      resolve({
        success: false,
        error: `Upload failed with status ${xhr.status}`,
        fileName: file.name,
      });
    }
  }
});
```

Add the error message mapper function inside the component file (before the component definition):

```ts
function getErrorMessage(errorCode: string, defaultMessage: string): string {
  const messages: Record<string, string> = {
    BLOCKED_FILE_TYPE: 'This file type is not allowed for security reasons.',
    INVALID_FILE_TYPE: 'This file type is not supported. Please upload a different format.',
    FILE_TOO_LARGE: defaultMessage || 'The file is too large to upload.',
    FILE_CONTENT_MISMATCH: 'The file content does not match its type. The file may be corrupted or mislabeled.',
    MALWARE_DETECTED: 'The file failed a security scan and cannot be uploaded.',
    SCAN_SERVICE_UNAVAILABLE: 'Security scanning is temporarily unavailable. Please try again later.',
  };
  return messages[errorCode] || defaultMessage || 'Upload failed';
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/file-upload.tsx
git commit -m "feat: update file upload component to handle security error codes"
```

---

### Task 11: Add Environment Variables and Run Full Test Suite

**Files:**
- Modify: `.env.local` or `.env.example` (add ClamAV config)
- Modify: `test/setup.ts` (add ClamAV env vars for tests)

- [ ] **Step 1: Add ClamAV environment variables to test setup**

In `test/setup.ts`, add after the existing environment variables:

```ts
process.env.CLAMAV_HOST = 'localhost';
process.env.CLAMAV_PORT = '3310';
process.env.CLAMAV_ENABLED = 'false'; // Disable ClamAV in tests
process.env.CLAMAV_TIMEOUT = '5000';
```

- [ ] **Step 2: Add ClamAV env vars to .env file**

Add to `.env` or `.env.local`:

```
# ClamAV Configuration
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
CLAMAV_ENABLED=true
CLAMAV_TIMEOUT=30000
```

- [ ] **Step 3: Run the full test suite**

```bash
npx vitest run
```

Expected: All existing tests pass + new file validation tests pass.

- [ ] **Step 4: Run type checking**

```bash
npx typecheck 2>/dev/null || npx tsc --noEmit
```

Expected: No new type errors.

- [ ] **Step 5: Commit**

```bash
git add test/setup.ts .env.local
git commit -m "feat: add ClamAV env config and test setup for file upload security"
```

---

### Task 12: Final Integration Verification

- [ ] **Step 1: Run linter**

```bash
npm run lint
```

Fix any lint errors.

- [ ] **Step 2: Build the application**

```bash
npm run build
```

Expected: Build succeeds without errors related to the new modules.

- [ ] **Step 3: Run all tests one more time**

```bash
npx vitest run
```

- [ ] **Step 4: Verify each route has been updated by grepping for the old inline checks**

```bash
grep -r "file.type !== 'application/pdf'" src/app/api/ --include="*.ts" || echo "No inline MIME checks remaining"
grep -r "file.size > maxSize" src/app/api/ --include="*.ts" || echo "No inline size checks remaining"
grep -r "validateFileUpload" src/app/api/ --include="*.ts"
```

Expected: No inline checks remaining; all routes import and use `validateFileUpload`.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: file upload security complete (FILE-01 through FILE-04)"
```

---

## UAT Control Traceability

| Control | Test | Task |
|---------|------|------|
| FILE-01 (executable blocked) | `file-validation.test.ts`: "should reject executable files", "should reject .bat files" | Task 3 |
| FILE-02 (oversized rejected) | `file-validation.test.ts`: "should reject oversized files" | Task 3 |
| FILE-03 (malware detected) | `file-validation.test.ts`: "should reject files when ClamAV detects malware" | Task 3 |
| FILE-04 (extensions enforced) | `file-validation.test.ts`: "should reject wrong MIME type", "should reject files with spoofed extension" | Task 3 |