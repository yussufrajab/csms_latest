/**
 * Audit Logging Utility
 *
 * Logs security events, unauthorized access attempts, and system activities
 * for compliance, monitoring, and security analysis.
 *
 * Uses the raw SQL layer from audit-db.ts for all database operations
 * instead of Prisma, targeting the partitioned audit.audit_log table.
 */

import {
  writeAuditLog,
  queryAuditLogs,
  queryAuditStats,
  ensurePartitions,
} from './audit-db';

export enum AuditEventType {
  // Access Control Events
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  ACCESS_DENIED = 'ACCESS_DENIED',
  FORBIDDEN_ROUTE = 'FORBIDDEN_ROUTE',

  // Authentication Events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Authorization Events
  ROLE_VIOLATION = 'ROLE_VIOLATION',
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  // Suspicious Activity
  MULTIPLE_FAILED_ATTEMPTS = 'MULTIPLE_FAILED_ATTEMPTS',
  SUSPICIOUS_REQUEST = 'SUSPICIOUS_REQUEST',
  POTENTIAL_BREACH = 'POTENTIAL_BREACH',

  // Request Management Events
  REQUEST_APPROVED = 'REQUEST_APPROVED',
  REQUEST_REJECTED = 'REQUEST_REJECTED',
  REQUEST_SUBMITTED = 'REQUEST_SUBMITTED',
  REQUEST_UPDATED = 'REQUEST_UPDATED',
  REQUEST_WITHDRAWN = 'REQUEST_WITHDRAWN',
  EMPLOYEE_CREATED = 'EMPLOYEE_CREATED',
  EMPLOYEE_UPDATED = 'EMPLOYEE_UPDATED',
  EMPLOYEE_DELETED = 'EMPLOYEE_DELETED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  COMPLAINT_SUBMITTED = 'COMPLAINT_SUBMITTED',
  COMPLAINT_UPDATED = 'COMPLAINT_UPDATED',
  COMPLAINT_RESOLVED = 'COMPLAINT_RESOLVED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  ADMIN_PASSWORD_RESET = 'ADMIN_PASSWORD_RESET',
  FILE_UPLOADED = 'FILE_UPLOADED',
  FILE_DELETED = 'FILE_DELETED',
  INSTITUTION_CREATED = 'INSTITUTION_CREATED',
  INSTITUTION_UPDATED = 'INSTITUTION_UPDATED',
}

export enum AuditEventCategory {
  SECURITY = 'SECURITY',
  ACCESS = 'ACCESS',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  SYSTEM = 'SYSTEM',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
}

export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface AuditLogData {
  eventType: AuditEventType | string;
  eventCategory: AuditEventCategory | string;
  severity: AuditSeverity | string;
  userId?: string | null;
  username?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  attemptedRoute: string;
  requestMethod?: string | null;
  isAuthenticated?: boolean;
  wasBlocked?: boolean;
  blockReason?: string | null;
  additionalData?: Record<string, any> | null;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    await writeAuditLog({
      eventType: data.eventType,
      eventCategory: data.eventCategory,
      severity: data.severity,
      userId: data.userId,
      username: data.username,
      userRole: data.userRole,
      ipAddress: data.ipAddress,
      deviceInfo: data.deviceInfo,
      attemptedRoute: data.attemptedRoute,
      requestMethod: data.requestMethod,
      isAuthenticated: data.isAuthenticated ?? false,
      wasBlocked: data.wasBlocked ?? false,
      blockReason: data.blockReason,
      additionalData: data.additionalData,
    });

    // Also log to console for real-time monitoring
    console.log(`[AUDIT] ${data.severity} - ${data.eventType}:`, {
      user: data.username || 'anonymous',
      role: data.userRole || 'none',
      route: data.attemptedRoute,
      blocked: data.wasBlocked,
      reason: data.blockReason,
    });
  } catch (error: any) {
    // If audit logging fails, log to console but don't throw
    // We don't want audit logging failures to break the app
    console.error('[AUDIT] Failed to log audit event:', error);
    console.error('[AUDIT] Event data:', data);
  }
}

/**
 * Log unauthorized access attempt
 */
export async function logUnauthorizedAccess(data: {
  userId?: string | null;
  username?: string | null;
  userRole?: string | null;
  attemptedRoute: string;
  blockReason: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  isAuthenticated?: boolean;
  requestMethod?: string;
  severity?: string;
  additionalData?: Record<string, any>;
}): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.UNAUTHORIZED_ACCESS,
    eventCategory: AuditEventCategory.SECURITY,
    severity: data.severity || AuditSeverity.WARNING,
    ...data,
    wasBlocked: true,
  });
}

/**
 * Log access denied event
 */
export async function logAccessDenied(data: {
  userId?: string | null;
  username?: string | null;
  userRole?: string | null;
  attemptedRoute: string;
  blockReason: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  requestMethod?: string;
  additionalData?: Record<string, any>;
}): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.ACCESS_DENIED,
    eventCategory: AuditEventCategory.AUTHORIZATION,
    severity: AuditSeverity.WARNING,
    isAuthenticated: true,
    ...data,
    wasBlocked: true,
  });
}

/**
 * Log forbidden route access
 */
export async function logForbiddenRoute(data: {
  userId?: string | null;
  username?: string | null;
  userRole?: string | null;
  attemptedRoute: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  requestMethod?: string;
  additionalData?: Record<string, any>;
}): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.FORBIDDEN_ROUTE,
    eventCategory: AuditEventCategory.ACCESS,
    severity: AuditSeverity.ERROR,
    isAuthenticated: true,
    blockReason: `Role "${data.userRole}" does not have permission to access "${data.attemptedRoute}"`,
    ...data,
    wasBlocked: true,
  });
}

/**
 * Log login attempt
 */
export async function logLoginAttempt(data: {
  success: boolean;
  username: string;
  userId?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  failureReason?: string;
  additionalData?: Record<string, any>;
}): Promise<void> {
  await logAuditEvent({
    eventType: data.success
      ? AuditEventType.LOGIN_SUCCESS
      : AuditEventType.LOGIN_FAILED,
    eventCategory: AuditEventCategory.AUTHENTICATION,
    severity: data.success ? AuditSeverity.INFO : AuditSeverity.WARNING,
    userId: data.userId,
    username: data.username,
    userRole: data.userRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: '/login',
    requestMethod: 'POST',
    isAuthenticated: data.success,
    wasBlocked: !data.success,
    blockReason: data.failureReason,
    additionalData: data.additionalData,
  });
}

/**
 * Get client IP address from request headers
 */
export function getClientIp(headers: Headers): string | null {
  // Check common headers for client IP
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return null;
}

/**
 * Query audit logs with filters
 */
export async function getAuditLogs(filters?: {
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
  eventCategory?: string;
  severity?: string;
  userId?: string;
  username?: string;
  attemptedRoute?: string;
  limit?: number;
  offset?: number;
}) {
  const result = await queryAuditLogs({
    startDate: filters?.startDate,
    endDate: filters?.endDate,
    eventType: filters?.eventType,
    eventCategory: filters?.eventCategory,
    severity: filters?.severity,
    userId: filters?.userId,
    username: filters?.username,
    attemptedRoute: filters?.attemptedRoute,
    limit: filters?.limit,
    offset: filters?.offset,
  });

  return {
    logs: result.logs,
    total: result.total,
    limit: result.limit,
    offset: result.offset,
  };
}

/**
 * Get audit log statistics
 */
export async function getAuditStatistics(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const result = await queryAuditStats({
    startDate: filters?.startDate,
    endDate: filters?.endDate,
  });

  return {
    totalEvents: result.totalEvents,
    blockedAttempts: result.blockedAttempts,
    criticalEvents: result.criticalEvents,
    eventsByType: result.eventsByType,
    eventsBySeverity: result.eventsBySeverity,
  };
}

/**
 * Log request approval
 */
export async function logRequestApproval(data: {
  requestType: string;
  requestId: string;
  employeeId?: string;
  employeeName?: string;
  employeeZanId?: string;
  approvedById: string;
  approvedByUsername: string;
  approvedByRole: string;
  reviewStage?: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.REQUEST_APPROVED,
    eventCategory: AuditEventCategory.DATA_MODIFICATION,
    severity: AuditSeverity.INFO,
    userId: data.approvedById,
    username: data.approvedByUsername,
    userRole: data.approvedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/${data.requestType.toLowerCase()}/${data.requestId}`,
    requestMethod: 'PUT',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: null,
    additionalData: {
      requestType: data.requestType,
      requestId: data.requestId,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      employeeZanId: data.employeeZanId,
      reviewStage: data.reviewStage,
      action: 'APPROVED',
      ...data.additionalData,
    },
  });
}

/**
 * Log request rejection
 */
export async function logRequestRejection(data: {
  requestType: string;
  requestId: string;
  employeeId?: string;
  employeeName?: string;
  employeeZanId?: string;
  rejectedById: string;
  rejectedByUsername: string;
  rejectedByRole: string;
  rejectionReason?: string;
  reviewStage?: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.REQUEST_REJECTED,
    eventCategory: AuditEventCategory.DATA_MODIFICATION,
    severity: AuditSeverity.WARNING,
    userId: data.rejectedById,
    username: data.rejectedByUsername,
    userRole: data.rejectedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/${data.requestType.toLowerCase()}/${data.requestId}`,
    requestMethod: 'PUT',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: data.rejectionReason || null,
    additionalData: {
      requestType: data.requestType,
      requestId: data.requestId,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      employeeZanId: data.employeeZanId,
      rejectionReason: data.rejectionReason,
      reviewStage: data.reviewStage,
      action: 'REJECTED',
      ...data.additionalData,
    },
  });
}

/**
 * Log request submission
 */
export async function logRequestSubmission(data: {
  requestType: string;
  requestId: string;
  employeeId?: string;
  employeeName?: string;
  employeeZanId?: string;
  submittedById: string;
  submittedByUsername: string;
  submittedByRole: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.REQUEST_SUBMITTED,
    eventCategory: AuditEventCategory.DATA_MODIFICATION,
    severity: AuditSeverity.INFO,
    userId: data.submittedById,
    username: data.submittedByUsername,
    userRole: data.submittedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/${data.requestType.toLowerCase()}`,
    requestMethod: 'POST',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: null,
    additionalData: {
      requestType: data.requestType,
      requestId: data.requestId,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      employeeZanId: data.employeeZanId,
      action: 'SUBMITTED',
      ...data.additionalData,
    },
  });
}

/**
 * Log request update (non-approval/rejection)
 */
export async function logRequestUpdate(data: {
  requestType: string;
  requestId: string;
  employeeId?: string;
  employeeName?: string;
  updatedById: string;
  updatedByUsername: string;
  updatedByRole: string;
  updateDetails?: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.REQUEST_UPDATED,
    eventCategory: AuditEventCategory.DATA_MODIFICATION,
    severity: AuditSeverity.INFO,
    userId: data.updatedById,
    username: data.updatedByUsername,
    userRole: data.updatedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/${data.requestType.toLowerCase()}/${data.requestId}`,
    requestMethod: 'PATCH',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: null,
    additionalData: {
      requestType: data.requestType,
      requestId: data.requestId,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      updateDetails: data.updateDetails,
      action: 'UPDATED',
      ...data.additionalData,
    },
  });
}

/**
 * Log employee creation or update
 */
export async function logEmployeeAction(data: {
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  employeeId: string;
  employeeName?: string;
  employeeZanId?: string;
  performedById: string;
  performedByUsername: string;
  performedByRole: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  const eventTypeMap = {
    CREATED: AuditEventType.EMPLOYEE_CREATED,
    UPDATED: AuditEventType.EMPLOYEE_UPDATED,
    DELETED: AuditEventType.EMPLOYEE_DELETED,
  };
  await logAuditEvent({
    eventType: eventTypeMap[data.action],
    eventCategory: AuditEventCategory.DATA_MODIFICATION,
    severity: data.action === 'DELETED' ? AuditSeverity.CRITICAL : AuditSeverity.INFO,
    userId: data.performedById,
    username: data.performedByUsername,
    userRole: data.performedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/employees${data.action === 'CREATED' ? '' : `/${data.employeeId}`}`,
    requestMethod: data.action === 'CREATED' ? 'POST' : data.action === 'UPDATED' ? 'PATCH' : 'DELETE',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: null,
    additionalData: {
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      employeeZanId: data.employeeZanId,
      action: data.action,
      ...data.additionalData,
    },
  });
}

/**
 * Log user management action
 */
export async function logUserAction(data: {
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  targetUserId: string;
  targetUsername?: string;
  performedById: string;
  performedByUsername: string;
  performedByRole: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  const eventTypeMap = {
    CREATED: AuditEventType.USER_CREATED,
    UPDATED: AuditEventType.USER_UPDATED,
    DELETED: AuditEventType.USER_DELETED,
  };
  await logAuditEvent({
    eventType: eventTypeMap[data.action],
    eventCategory: AuditEventCategory.DATA_MODIFICATION,
    severity: data.action === 'DELETED' ? AuditSeverity.CRITICAL : AuditSeverity.INFO,
    userId: data.performedById,
    username: data.performedByUsername,
    userRole: data.performedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/users${data.action === 'CREATED' ? '' : `/${data.targetUserId}`}`,
    requestMethod: data.action === 'CREATED' ? 'POST' : data.action === 'UPDATED' ? 'PATCH' : 'DELETE',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: null,
    additionalData: {
      targetUserId: data.targetUserId,
      targetUsername: data.targetUsername,
      action: data.action,
      ...data.additionalData,
    },
  });
}

/**
 * Log complaint lifecycle event
 */
export async function logComplaintAction(data: {
  action: 'SUBMITTED' | 'UPDATED' | 'RESOLVED';
  complaintId: string;
  complainantId?: string;
  subject?: string;
  performedById: string;
  performedByUsername: string;
  performedByRole: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  const eventTypeMap = {
    SUBMITTED: AuditEventType.COMPLAINT_SUBMITTED,
    UPDATED: AuditEventType.COMPLAINT_UPDATED,
    RESOLVED: AuditEventType.COMPLAINT_RESOLVED,
  };
  const severityMap = {
    SUBMITTED: AuditSeverity.INFO,
    UPDATED: AuditSeverity.INFO,
    RESOLVED: AuditSeverity.INFO,
  };
  await logAuditEvent({
    eventType: eventTypeMap[data.action],
    eventCategory: AuditEventCategory.DATA_MODIFICATION,
    severity: severityMap[data.action],
    userId: data.performedById,
    username: data.performedByUsername,
    userRole: data.performedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/complaints${data.action === 'SUBMITTED' ? '' : `/${data.complaintId}`}`,
    requestMethod: data.action === 'SUBMITTED' ? 'POST' : 'PUT',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: null,
    additionalData: {
      complaintId: data.complaintId,
      complainantId: data.complainantId,
      subject: data.subject,
      action: data.action,
      ...data.additionalData,
    },
  });
}

/**
 * Log file operation
 */
export async function logFileAction(data: {
  action: 'UPLOADED' | 'DELETED';
  fileName?: string;
  objectKey?: string;
  performedById: string;
  performedByUsername: string;
  performedByRole: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  const eventTypeMap = {
    UPLOADED: AuditEventType.FILE_UPLOADED,
    DELETED: AuditEventType.FILE_DELETED,
  };
  await logAuditEvent({
    eventType: eventTypeMap[data.action],
    eventCategory: AuditEventCategory.DATA_MODIFICATION,
    severity: AuditSeverity.INFO,
    userId: data.performedById,
    username: data.performedByUsername,
    userRole: data.performedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/files/${data.action === 'UPLOADED' ? 'upload' : 'delete'}`,
    requestMethod: data.action === 'UPLOADED' ? 'POST' : 'DELETE',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: null,
    additionalData: {
      fileName: data.fileName,
      objectKey: data.objectKey,
      action: data.action,
      ...data.additionalData,
    },
  });
}

/**
 * Log institution management action
 */
export async function logInstitutionAction(data: {
  action: 'CREATED' | 'UPDATED';
  institutionId: string;
  institutionName?: string;
  performedById: string;
  performedByUsername: string;
  performedByRole: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  const eventTypeMap = {
    CREATED: AuditEventType.INSTITUTION_CREATED,
    UPDATED: AuditEventType.INSTITUTION_UPDATED,
  };
  await logAuditEvent({
    eventType: eventTypeMap[data.action],
    eventCategory: AuditEventCategory.DATA_MODIFICATION,
    severity: AuditSeverity.INFO,
    userId: data.performedById,
    username: data.performedByUsername,
    userRole: data.performedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/institutions${data.action === 'CREATED' ? '' : `/${data.institutionId}`}`,
    requestMethod: data.action === 'CREATED' ? 'POST' : 'PATCH',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: null,
    additionalData: {
      institutionId: data.institutionId,
      institutionName: data.institutionName,
      action: data.action,
      ...data.additionalData,
    },
  });
}

/**
 * Log account lock/unlock event
 */
export async function logAccountAction(data: {
  action: 'LOCKED' | 'UNLOCKED';
  targetUserId: string;
  targetUsername?: string;
  performedById: string;
  performedByUsername: string;
  performedByRole: string;
  reason?: string;
  ipAddress?: string | null;
  deviceInfo?: Record<string, any> | null;
  additionalData?: Record<string, any>;
}): Promise<void> {
  await logAuditEvent({
    eventType: data.action === 'LOCKED' ? AuditEventType.ACCOUNT_LOCKED : AuditEventType.ACCOUNT_UNLOCKED,
    eventCategory: AuditEventCategory.SECURITY,
    severity: data.action === 'LOCKED' ? AuditSeverity.WARNING : AuditSeverity.INFO,
    userId: data.performedById,
    username: data.performedByUsername,
    userRole: data.performedByRole,
    ipAddress: data.ipAddress,
    deviceInfo: data.deviceInfo,
    attemptedRoute: `/api/admin/${data.action === 'LOCKED' ? 'lock-account' : 'unlock-account'}`,
    requestMethod: 'POST',
    isAuthenticated: true,
    wasBlocked: false,
    blockReason: data.reason || null,
    additionalData: {
      targetUserId: data.targetUserId,
      targetUsername: data.targetUsername,
      action: data.action,
      reason: data.reason,
      ...data.additionalData,
    },
  });
}

export default {
  logAuditEvent,
  logUnauthorizedAccess,
  logAccessDenied,
  logForbiddenRoute,
  logLoginAttempt,
  logRequestApproval,
  logRequestRejection,
  logRequestSubmission,
  logRequestUpdate,
  logEmployeeAction,
  logUserAction,
  logComplaintAction,
  logFileAction,
  logInstitutionAction,
  logAccountAction,
  getClientIp,
  getAuditLogs,
  getAuditStatistics,
  ensurePartitions,
};