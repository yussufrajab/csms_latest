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

export async function POST(req: Request) {
  try {
    // Get userId and sessionToken from request body
    const body = await req.json();
    const userId = body?.userId;
    const sessionToken = body?.sessionToken;
    const logoutAll = body?.logoutAll || false; // Option to logout all sessions

    console.log('[LOGOUT] Request:', {
      userId,
      hasSessionToken: !!sessionToken,
      sessionTokenPreview: sessionToken
        ? sessionToken.substring(0, 15) + '...'
        : 'none',
      logoutAll,
    });

    // Terminate session(s)
    if (logoutAll && userId) {
      // Terminate all sessions for this user
      const count = await terminateAllUserSessions(userId);
      console.log(
        `[LOGOUT] Terminated all ${count} session(s) for user:`,
        userId
      );
    } else if (sessionToken) {
      // Terminate specific session
      const success = await terminateSession(sessionToken);
      if (!success) {
        console.error(
          '[LOGOUT] Failed to terminate session:',
          sessionToken.substring(0, 15) + '...'
        );
        // Still clear activity and return success since session might already be deleted
      } else {
        console.log(
          '[LOGOUT] Successfully terminated session:',
          sessionToken.substring(0, 15) + '...'
        );
      }
    } else {
      console.warn('[LOGOUT] No sessionToken or userId provided for logout');
    }

    // Clear user's activity timestamp
    if (userId) {
      await clearUserActivity(userId);
      console.log('[LOGOUT] Cleared activity for user:', userId);
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
    console.error('[LOGOUT_POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
