import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  downloadFile,
  getFileMetadata,
  generatePresignedUrl,
} from '@/lib/minio';
import { verifyAuth } from '@/lib/api-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import { logFileAction, parseDeviceInfo } from '@/lib/audit-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ objectKey: string[] }> }
) {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    return authResult.response!;
  }
  const auth = authResult.context!;

  const rateLimitResult = await checkRateLimit(`ratelimit:${getClientIp(request)}:download`, 'download');
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests', errorCode: 'RATE_LIMIT_EXCEEDED', retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
    );
  }

  try {
    const resolvedParams = await params;
    const objectKey = decodeURIComponent(resolvedParams.objectKey.join('/'));

    logger.info({ value: resolvedParams.objectKey }, 'Preview API - Object key segments');
    logger.info({ value: objectKey }, 'Preview API - Reconstructed object key');

    const searchParams = request.nextUrl.searchParams;
    const expiry = parseInt(searchParams.get('expiry') || '3600');
    const mode = searchParams.get('mode') || 'inline';

    const metadata = await getFileMetadata(objectKey);

    if (mode === 'presigned') {
      const presignedUrl = await generatePresignedUrl(objectKey, expiry);

      return NextResponse.json({
        success: true,
        data: {
          presignedUrl,
          objectKey,
          contentType: metadata.contentType,
          size: metadata.size,
          lastModified: metadata.lastModified,
          expiresIn: expiry,
        },
      });
    }

    const fileStream = await downloadFile(objectKey);

    const readable = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });

        fileStream.on('end', () => {
          controller.close();
        });

        fileStream.on('error', (error: Error) => {
          controller.error(error);
        });
      },
    });

    const headers = new Headers();
    headers.set('Content-Type', metadata.contentType);
    headers.set('Content-Length', metadata.size.toString());

    if (metadata.contentType === 'application/pdf') {
      headers.set('Content-Disposition', 'inline');
    }

    headers.set('Cache-Control', 'public, max-age=3600');
    headers.set('Last-Modified', metadata.lastModified.toUTCString());

    await logFileAction({
      action: 'PREVIEWED',
      fileName: objectKey.split('/').pop() || 'preview',
      objectKey: objectKey,
      performedById: auth.userId,
      performedByUsername: auth.username,
      performedByRole: auth.role,
      ipAddress: getClientIp(request),
      deviceInfo: parseDeviceInfo(request.headers),
    }).catch(() => {});

    return new NextResponse(readable, {
      status: 200,
      headers,
    });
  } catch (error) {
    logger.error({ value: error }, 'File preview error');
    return NextResponse.json(
      { success: false, message: 'File not found or internal server error' },
      { status: 404 }
    );
  }
}