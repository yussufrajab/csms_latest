import { NextResponse } from 'next/server';
import { clearUserActivity } from '@/lib/session-timeout-utils';
import {
  terminateSession,
  terminateAllUserSessions,
} from '@/lib/session-manager';
import {
  logAuditEvent,
  AuditEventType,
  AuditEventCategory,
  AuditSeverity,
  getClientIp,
} from '@/lib/audit-logger';
import { authLogger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    // Get userId and sessionToken from request body
    const body = await req.json();
    const userId = body?.userId;
    const sessionToken = body?.sessionToken;
    const logoutAll = body?.logoutAll || false; // Option to logout all sessions

    authLogger.info({
      userId,
      hasSessionToken: !!sessionToken,
      sessionTokenPreview: sessionToken
        ? sessionToken.substring(0, 15) + '...'
        : 'none',
      logoutAll,
    }, 'Logout request');

    // Terminate session(s)
    if (logoutAll && userId) {
      // Terminate all sessions for this user
      const count = await terminateAllUserSessions(userId);
      authLogger.info({ userId, count }, 'Terminated all sessions');
    } else if (sessionToken) {
      // Terminate specific session
      const success = await terminateSession(sessionToken);
      if (!success) {
        authLogger.error(
          { sessionTokenPreview: sessionToken.substring(0, 15) + '...' },
          'Failed to terminate session'
        );
        // Still clear activity and return success since session might already be deleted
      } else {
        authLogger.info(
          { sessionTokenPreview: sessionToken.substring(0, 15) + '...' },
          'Successfully terminated session'
        );
      }
    } else {
      authLogger.warn('No sessionToken or userId provided for logout');
    }

    // Clear user's activity timestamp
    if (userId) {
      await clearUserActivity(userId);
      authLogger.info({ userId }, 'Cleared activity for user');
    }

    // Log logout event
    if (userId) {
      await logAuditEvent({
        eventType: AuditEventType.LOGOUT,
        eventCategory: AuditEventCategory.AUTHENTICATION,
        severity: AuditSeverity.INFO,
        userId: userId,
        username: null,
        userRole: null,
        ipAddress: getClientIp(req.headers),
        deviceInfo: JSON.parse(req.headers.get('x-device-info') || 'null'),
        attemptedRoute: '/api/auth/logout',
        requestMethod: 'POST',
        isAuthenticated: true,
        wasBlocked: false,
        blockReason: null,
        additionalData: { logoutAll: logoutAll },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    authLogger.error({ err: error }, 'Logout POST error');
    return NextResponse.json(
      {
        success: false,
        message: 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
