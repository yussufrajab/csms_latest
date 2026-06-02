/**
 * Audit Logging Wrapper for Next.js API Routes
 *
 * Wraps route handlers to automatically log mutating requests.
 * Business-specific events (approval, rejection, complaint resolution)
 * use the convenience functions in audit-logger.ts directly.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  AuditEventType,
  AuditEventCategory,
  AuditSeverity,
  logAuditEvent,
  getClientIp,
} from './audit-logger';

/**
 * Parse auth context from the auth-storage cookie.
 */
function parseAuthContext(request: NextRequest): {
  userId: string | null;
  username: string | null;
  userRole: string | null;
  isAuthenticated: boolean;
} {
  try {
    const authCookie = request.cookies.get('auth-storage')?.value;
    if (!authCookie) {
      return { userId: null, username: null, userRole: null, isAuthenticated: false };
    }
    const parsed = JSON.parse(authCookie);
    const state = parsed?.state;
    return {
      userId: state?.user?.id || null,
      username: state?.user?.username || null,
      userRole: state?.user?.role || null,
      isAuthenticated: state?.isAuthenticated === true,
    };
  } catch {
    return { userId: null, username: null, userRole: null, isAuthenticated: false };
  }
}

/**
 * Parse device info from x-device-info header.
 */
function parseDeviceInfo(request: NextRequest): Record<string, any> | null {
  try {
    const header = request.headers.get('x-device-info');
    if (!header) return null;
    return JSON.parse(header);
  } catch {
    return null;
  }
}

/**
 * Determine event type from HTTP method and route pattern.
 */
function detectEventType(
  method: string,
  pathname: string
): { eventType: string; eventCategory: string; severity: string } {
  const m = method.toUpperCase();
  const path = pathname.toLowerCase();

  // Auth routes
  if (path.includes('/auth/login')) {
    return { eventType: 'LOGIN_SUCCESS', eventCategory: 'AUTHENTICATION', severity: 'INFO' };
  }
  if (path.includes('/auth/logout')) {
    return { eventType: 'LOGOUT', eventCategory: 'AUTHENTICATION', severity: 'INFO' };
  }
  if (path.includes('/auth/change-password')) {
    return { eventType: 'PASSWORD_CHANGED', eventCategory: 'SECURITY', severity: 'INFO' };
  }
  // Admin routes
  if (path.includes('/admin/reset-password')) {
    return { eventType: 'ADMIN_PASSWORD_RESET', eventCategory: 'SECURITY', severity: 'WARNING' };
  }
  if (path.includes('/admin/lock-account')) {
    return { eventType: 'ACCOUNT_LOCKED', eventCategory: 'SECURITY', severity: 'WARNING' };
  }
  if (path.includes('/admin/unlock-account')) {
    return { eventType: 'ACCOUNT_UNLOCKED', eventCategory: 'SECURITY', severity: 'INFO' };
  }

  // File operations
  if (path.includes('/files/upload')) {
    return { eventType: 'FILE_UPLOADED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
  }

  // Entity routes - POST = creation, PUT/PATCH = update
  if (path.includes('/complaints')) {
    if (m === 'POST') return { eventType: 'COMPLAINT_SUBMITTED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
    return { eventType: 'COMPLAINT_UPDATED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
  }
  if (path.includes('/employees')) {
    if (m === 'POST') return { eventType: 'EMPLOYEE_CREATED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
    return { eventType: 'EMPLOYEE_UPDATED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
  }
  if (path.includes('/users')) {
    if (m === 'POST') return { eventType: 'USER_CREATED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
    return { eventType: 'USER_UPDATED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
  }
  if (path.includes('/institutions')) {
    if (m === 'POST') return { eventType: 'INSTITUTION_CREATED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
    return { eventType: 'INSTITUTION_UPDATED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
  }

  // Request type routes (promotions, confirmations, lwop, etc.) - POST = submission
  if (m === 'POST') {
    return { eventType: 'REQUEST_SUBMITTED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
  }

  // Default: data modification
  return { eventType: 'REQUEST_UPDATED', eventCategory: 'DATA_MODIFICATION', severity: 'INFO' };
}

interface AuditWrapperOptions {
  /** Override the auto-detected event type */
  action?: AuditEventType | string;
  /** Override the auto-detected event category */
  category?: AuditEventCategory | string;
  /** Override the auto-detected severity */
  severity?: AuditSeverity | string;
  /** Skip audit logging for this route */
  skip?: boolean;
  /** Extract business details from the request body for additionalData */
  extractDetails?: (body: unknown) => Record<string, any>;
}

type HandlerFn = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps a Next.js API route handler with automatic audit logging.
 *
 * Extracts auth context, IP, and device info from the request,
 * calls the handler, and logs the event based on the response status.
 *
 * For business-specific events (approval, rejection, complaint resolution),
 * use the convenience functions from audit-logger.ts directly instead of this wrapper.
 */
export function withAuditLogging(
  handler: HandlerFn,
  options: AuditWrapperOptions = {}
): HandlerFn {
  if (options.skip) return handler;

  return async (request, context) => {
    const method = request.method;
    const pathname = new URL(request.url).pathname;

    // Skip read-only requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
      return handler(request, context);
    }

    // Extract context
    const auth = parseAuthContext(request);
    const ipAddress = getClientIp(request.headers);
    const deviceInfo = parseDeviceInfo(request);
    const detected = detectEventType(method, pathname);

    // Clone the body if we need to extract details
    let bodyDetails: Record<string, any> = {};
    if (options.extractDetails) {
      try {
        const clonedRequest = request.clone();
        const body = await clonedRequest.json();
        bodyDetails = options.extractDetails(body) || {};
      } catch {
        // Body may not be JSON or may be empty
      }
    }

    // Call the original handler
    let response: NextResponse;
    try {
      response = await handler(request, context);
    } catch (error) {
      // Handler threw — log as failed and re-throw
      await logAuditEvent({
        eventType: options.action || detected.eventType,
        eventCategory: options.category || detected.eventCategory,
        severity: AuditSeverity.ERROR,
        userId: auth.userId,
        username: auth.username,
        userRole: auth.userRole,
        ipAddress,
        deviceInfo,
        attemptedRoute: pathname,
        requestMethod: method,
        isAuthenticated: auth.isAuthenticated,
        wasBlocked: false,
        blockReason: 'Handler error',
        additionalData: {
          ...bodyDetails,
          error: true,
        },
      }).catch(() => {});
      throw error;
    }

    // Determine if the action was successful
    const isSuccess = response.status >= 200 && response.status < 300;

    // Log the event
    await logAuditEvent({
      eventType: options.action || detected.eventType,
      eventCategory: options.category || detected.eventCategory,
      severity: options.severity || (isSuccess ? detected.severity : AuditSeverity.WARNING),
      userId: auth.userId,
      username: auth.username,
      userRole: auth.userRole,
      ipAddress,
      deviceInfo,
      attemptedRoute: pathname,
      requestMethod: method,
      isAuthenticated: auth.isAuthenticated,
      wasBlocked: !isSuccess,
      blockReason: isSuccess ? null : `Request failed with status ${response.status}`,
      additionalData: {
        ...bodyDetails,
        ...(isSuccess ? {} : { failedStatus: response.status }),
      },
    }).catch(() => {
      // Never block the response due to audit logging failure
    });

    return response;
  };
}