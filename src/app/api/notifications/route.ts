import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';
import { withRateLimit } from '@/lib/rate-limiter';
import { validateRequest, notificationQuerySchema } from '@/lib/api-schemas';
import { logger } from '@/lib/logger';

export const GET = withRateLimit(withAuth(async (request, { auth }) => {
  try {
    const validation = await validateRequest(request as NextRequest, notificationQuerySchema, 'query');
    if (!validation.success) return validation.response;

    const { userId } = validation.data;

    // Verify auth.userId matches userId or admin role
    if (userId !== auth.userId && auth.role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    const notifications = await db.notification.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    logger.error({ err: error }, 'NOTIFICATIONS GET');
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}), 'read');

export const POST = withRateLimit(withAuth(async (request, { auth: _auth }) => {
  try {
    const body = await request.json();
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { success: false, message: 'Notification IDs are required' },
        { status: 400 }
      );
    }

    await db.notification.updateMany({
      where: { id: { in: notificationIds } },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read',
    });
  } catch (error) {
    logger.error({ err: error }, 'NOTIFICATIONS POST');
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}), 'write');
