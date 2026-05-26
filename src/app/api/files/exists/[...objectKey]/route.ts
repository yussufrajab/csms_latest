import { NextRequest, NextResponse } from 'next/server';
import { getFileMetadata } from '@/lib/minio';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ objectKey: string[] }> }
) {
  try {
    // Await params to get the actual value
    const resolvedParams = await params;
    // Reconstruct the object key from the dynamic route segments
    const objectKey = decodeURIComponent(resolvedParams.objectKey.join('/'));

    logger.info(
      { objectKeySegments: resolvedParams.objectKey },
      'File exists API - Object key segments'
    );
    logger.info({ value: objectKey }, 'File exists API - Reconstructed object key');

    // Try to get file metadata to check if file exists
    const metadata = await getFileMetadata(objectKey);

    return NextResponse.json({
      success: true,
      exists: true,
      metadata: {
        size: metadata.size,
        contentType: metadata.contentType,
        lastModified: metadata.lastModified,
      },
    });
  } catch (error) {
    logger.error({ value: error }, 'File exists check error');
    // If file doesn't exist or any error occurs, return exists: false
    return NextResponse.json({
      success: true,
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
