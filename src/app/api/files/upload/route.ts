import { NextResponse } from 'next/server';
import { uploadFile, generateObjectKey } from '@/lib/minio';
import { logFileAction, getClientIp } from '@/lib/audit-logger';
import { validateFileUpload } from '@/lib/file-validation';
import { withAuth } from '@/lib/api-auth';
import { withRateLimit } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

export const POST = withRateLimit(withAuth(async (request, { auth }) => {
  try {
    // Get the multipart form data
    const formData = await request.formData();

    // Get the file from form data
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'documents';

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer first for validation
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const validation = await validateFileUpload(buffer, file.name, file.type, 'generic');
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error, errorCode: validation.errorCode },
        { status: validation.status! }
      );
    }

    // Generate unique object key
    const objectKey = generateObjectKey(folder, file.name);

    // Upload to MinIO
    const uploadResult = await uploadFile(
      buffer,
      objectKey,
      file.type || 'application/octet-stream'
    );

    // Audit log: file uploaded
    // Auth context from verified session
    const auditUserId = auth.userId;
    const auditUsername = auth.username;
    const auditUserRole = auth.role;

    await logFileAction({
      action: 'UPLOADED',
      fileName: file.name,
      objectKey: uploadResult.objectKey,
      performedById: auditUserId || 'unknown',
      performedByUsername: auditUsername || 'unknown',
      performedByRole: auditUserRole || 'unknown',
      ipAddress: getClientIp(request.headers),
      deviceInfo: JSON.parse(request.headers.get('x-device-info') || 'null'),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        objectKey: uploadResult.objectKey,
        originalName: file.name,
        size: file.size,
        contentType: file.type,
        etag: uploadResult.etag,
        bucketName: uploadResult.bucketName,
      },
    });
  } catch (error) {
    logger.error({ value: error }, 'File upload error');
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}), 'upload');
