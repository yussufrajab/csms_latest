import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }
  logger.info('=== TEST API CALLED ===');
  try {
    // Test database connection
    const userCount = await db.user.count();

    return NextResponse.json({
      success: true,
      message: 'Test API is working',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        userCount,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'TEST API');
    return NextResponse.json({
      success: false,
      message: 'Test API working but database error',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
