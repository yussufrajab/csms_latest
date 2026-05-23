import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { lockAccountManually } from '@/lib/account-lockout-utils';
import { createNotification } from '@/lib/notifications';
import { logAccountAction, getClientIp } from '@/lib/audit-logger';
import { withAuth } from '@/lib/api-auth';
import { withRateLimit } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

const lockAccountSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  notes: z.string().optional(),
});

export const POST = withRateLimit(withAuth(async (request, { auth }) => {
  try {
    const body = await request.json();
    const { userId, reason, notes } = lockAccountSchema.parse(body);

    // Use verified admin ID from auth context instead of client-sent adminId
    const adminId = auth.userId;

    // Verify target user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        isManuallyLocked: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent locking another admin (optional safety check)
    if (user.role === 'Admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot lock another administrator account',
        },
        { status: 403 }
      );
    }

    // Check if already locked
    if (user.isManuallyLocked) {
      return NextResponse.json(
        { success: false, message: 'Account is already locked' },
        { status: 400 }
      );
    }

    // Lock the account
    await lockAccountManually(userId, adminId, reason, notes);

    // Log the account lock action
    await logAccountAction({
      action: 'LOCKED',
      targetUserId: userId,
      targetUsername: user.username,
      performedById: adminId,
      performedByUsername: auth.username,
      performedByRole: auth.role,
      reason,
      ipAddress: getClientIp(request.headers),
      deviceInfo: JSON.parse(request.headers.get('x-device-info') || 'null'),
    }).catch(() => {});

    // Send notification to user
    await createNotification({
      userId: user.id,
      message: `Your account has been locked by an administrator. Reason: ${reason}. Please contact support for assistance.`,
      link: undefined,
    });

    logger.info(
      `Account locked for user ${user.username} by admin ${auth.username}`
    );

    return NextResponse.json({
      success: true,
      message: 'Account locked successfully',
      data: {
        userId: user.id,
        username: user.username,
        lockedBy: auth.username,
        reason,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    logger.error({ err: error }, 'LOCK ACCOUNT POST');
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}, { allowedRoles: ['Admin'] }), 'write');