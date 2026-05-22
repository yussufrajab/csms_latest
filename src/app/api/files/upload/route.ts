import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, generateObjectKey } from '@/lib/minio';
import { logFileAction, getClientIp } from '@/lib/audit-logger';

export async function POST(request: NextRequest) {
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

    // Validate file type - only PDF files allowed
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, message: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 1MB)
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds 1MB limit' },
        { status: 400 }
      );
    }

    // Generate unique object key
    const objectKey = generateObjectKey(folder, file.name);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to MinIO
    const uploadResult = await uploadFile(
      buffer,
      objectKey,
      file.type || 'application/octet-stream'
    );

    // Audit log: file uploaded
    // Parse auth info from cookie for audit context
    const authCookie = request.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('auth-storage='));
    let auditUserId: string | null = null;
    let auditUsername: string | null = null;
    let auditUserRole: string | null = null;
    if (authCookie) {
      try {
        const cookieValue = decodeURIComponent(authCookie.split('=')[1]);
        const authData = JSON.parse(cookieValue);
        const state = authData.state || authData;
        auditUserId = state.user?.id || null;
        auditUsername = state.user?.name || state.user?.username || null;
        auditUserRole = state.user?.role || state.role || null;
      } catch {}
    }

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
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
