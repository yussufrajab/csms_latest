import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shouldApplyInstitutionFilter } from '@/lib/role-utils';
import { validateEmployeeStatusForRequest } from '@/lib/employee-status-validation';
import { v4 as uuidv4 } from 'uuid';
import {
  logRequestSubmission,
  logRequestApproval,
  logRequestRejection,
  getClientIp,
} from '@/lib/audit-logger';
import { ROLES } from '@/lib/constants';
import { createNotificationForRole, NotificationTemplates } from '@/lib/notifications';
import { sendRequestSubmissionEmails, sendRequestStatusUpdateEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

// Cache configuration for confirmation requests
const CACHE_TTL = 30; // 30 seconds cache (request status changes frequently)

// Role-based authorization helper
function checkRoleAuthorization(
  userRole: string | null,
  allowedRoles: readonly string[]
): { authorized: boolean; message?: string } {
  if (!userRole) {
    return { authorized: false, message: 'User role is required' };
  }

  if (!allowedRoles.includes(userRole)) {
    return {
      authorized: false,
      message: `Unauthorized: ${userRole} cannot perform this action. Allowed roles: ${allowedRoles.join(', ')}`,
    };
  }

  return { authorized: true };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');
    const userInstitutionId = searchParams.get('userInstitutionId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const size = parseInt(searchParams.get('size') || '50', 10);
    const status = searchParams.get('status') || 'all';

    logger.info({ 
      userId,
      userRole,
      userInstitutionId,
      page,
      size,
      status,
     }, 'Confirmations API called with');

    // Build where clause based on user role and institution
    const whereClause: any = {};

    // Apply institution filtering based on role
    if (shouldApplyInstitutionFilter(userRole, userInstitutionId)) {
      logger.info(
        `Applying institution filter for role ${userRole} with institutionId ${userInstitutionId}`
      );
      whereClause.Employee = {
        institutionId: userInstitutionId,
      };
    } else {
      logger.info(
        `Role ${userRole} is a CSC role - showing all confirmation data across institutions`
      );
    }

    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'pending') {
        whereClause.OR = [
          { status: { contains: 'Pending' } },
          { status: { contains: 'Awaiting' } },
        ];
      } else if (status === 'approved') {
        whereClause.status = { contains: 'Approved' };
      } else if (status === 'rejected') {
        whereClause.OR = [
          { status: { contains: 'Rejected' } },
        ];
      }
    }

    const [requests, total] = await Promise.all([
      db.confirmationRequest.findMany({
        where: whereClause,
        include: {
          Employee: {
            select: {
              id: true,
              name: true,
              zanId: true,
              payrollNumber: true,
              zssfNumber: true,
              department: true,
              cadre: true,
              status: true,
              dateOfBirth: true,
              employmentDate: true,
              Institution: { select: { id: true, name: true } },
            },
          },
          User_ConfirmationRequest_submittedByIdToUser: {
            select: { id: true, name: true, username: true },
          },
          User_ConfirmationRequest_reviewedByIdToUser: {
            select: { id: true, name: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      db.confirmationRequest.count({ where: whereClause }),
    ]);

    // Transform the data to match frontend expectations
    const transformedRequests = requests.map((req: any) => ({
      ...req,
      submittedBy: req.User_ConfirmationRequest_submittedByIdToUser,
      reviewedBy: req.User_ConfirmationRequest_reviewedByIdToUser,
      User_ConfirmationRequest_submittedByIdToUser: undefined,
      User_ConfirmationRequest_reviewedByIdToUser: undefined,
    }));

    return NextResponse.json({
      data: transformedRequests,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / size),
        size,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'CONFIRMATIONS GET');
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    logger.info({ value: body }, 'Creating confirmation request');

    // Authorization: Only HRO and HRRP can create confirmation requests
    const authCheck = checkRoleAuthorization(body.userRole, [
      'HRO' as const,
      'HRRP' as const,
    ]);
    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: authCheck.message,
        },
        { status: 403 }
      );
    }

    // Basic validation
    if (!body.employeeId || !body.submittedById) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: employeeId, submittedById',
        },
        { status: 400 }
      );
    }

    // Get employee details to check status
    const employee = await db.employee.findUnique({
      where: { id: body.employeeId },
      select: { id: true, name: true, status: true },
    });

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          message: 'Employee not found',
        },
        { status: 404 }
      );
    }

    // Validate employee status for confirmation request
    const statusValidation = validateEmployeeStatusForRequest(
      employee.status,
      'confirmation'
    );
    if (!statusValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: statusValidation.message,
        },
        { status: 403 }
      );
    }

    const confirmationRequest = await db.confirmationRequest.create({
      data: {
        id: uuidv4(),
        employeeId: body.employeeId,
        submittedById: body.submittedById,
        status: body.status || 'Pending',
        reviewStage: body.reviewStage || 'initial',
        documents: body.documents || [],
        updatedAt: new Date(),
      },
      include: {
        Employee: {
          select: {
            id: true,
            name: true,
            zanId: true,
            payrollNumber: true,
            zssfNumber: true,
            department: true,
            cadre: true,
            status: true,
            dateOfBirth: true,
            employmentDate: true,
            Institution: { select: { id: true, name: true } },
          },
        },
        User_ConfirmationRequest_submittedByIdToUser: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    logger.info({ value: confirmationRequest.id }, 'Created confirmation request');

    // Create notification for CSC reviewers
    const notification = NotificationTemplates.confirmationSubmitted(
      confirmationRequest.Employee.name,
      confirmationRequest.id
    );

    await createNotificationForRole(
      ROLES.HHRMD || 'HHRMD',
      notification.message,
      notification.link
    );
    await createNotificationForRole(
      ROLES.HRMO || 'HRMO',
      notification.message,
      notification.link
    );
    await createNotificationForRole(
      ROLES.DO || 'DO',
      notification.message,
      notification.link
    );

    // Send email notifications to CSC reviewers
    await sendRequestSubmissionEmails({
      requestType: 'Confirmation',
      employeeName: confirmationRequest.Employee.name,
      requestId: confirmationRequest.id,
      submittedByName: confirmationRequest.User_ConfirmationRequest_submittedByIdToUser?.name || 'Unknown',
      dashboardPath: '/dashboard/confirmation',
    });

    // Log request submission for audit
    const submittedByUser = await db.user.findUnique({
      where: { id: body.submittedById },
      select: { id: true, username: true, role: true },
    });
    await logRequestSubmission({
      requestType: 'Confirmation',
      requestId: confirmationRequest.id,
      employeeId: confirmationRequest.employeeId,
      employeeName: confirmationRequest.Employee?.name,
      employeeZanId: confirmationRequest.Employee?.zanId,
      submittedById: body.submittedById,
      submittedByUsername: submittedByUser?.username || 'Unknown',
      submittedByRole: submittedByUser?.role || 'Unknown',
      ipAddress: getClientIp(req.headers),
      deviceInfo: JSON.parse(req.headers.get('x-device-info') || 'null'),
    }).catch(() => {});

    // Transform the data to match frontend expectations
    const transformedRequest = {
      ...confirmationRequest,
      submittedBy: (confirmationRequest as any)
        .User_ConfirmationRequest_submittedByIdToUser,
      User_ConfirmationRequest_submittedByIdToUser: undefined,
    };

    return NextResponse.json({
      success: true,
      data: transformedRequest,
    });
  } catch (error) {
    logger.error({ err: error }, 'CONFIRMATIONS POST');
    return NextResponse.json(
      {
        success: false,
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, userRole, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Request ID is required',
        },
        { status: 400 }
      );
    }

    // Authorization: Different roles can perform different update actions
    // - HHRMD/HRMO: Can approve/reject (when reviewedById is present)
    // - HRO/HRRP: Can resubmit corrected documents (when resetting to Pending status)
    const isApprovalOrRejection = updateData.reviewedById !== undefined;
    const isResubmission =
      updateData.status === 'Pending HRMO/HHRMD Review' &&
      !updateData.reviewedById;

    let authCheck;
    if (isApprovalOrRejection) {
      // Approval/rejection action - only HHRMD/HRMO
      authCheck = checkRoleAuthorization(userRole, [
        'HHRMD' as const,
        'HRMO' as const,
      ]);
    } else if (isResubmission) {
      // Resubmission action - only HRO/HRRP
      authCheck = checkRoleAuthorization(userRole, [
        'HRO' as const,
        'HRRP' as const,
      ]);
    } else {
      // Unknown action type - deny by default
      authCheck = { authorized: false, message: 'Invalid update action' };
    }

    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: authCheck.message,
        },
        { status: 403 }
      );
    }

    // Get IP and device info for audit logging
    const headers = new Headers(req.headers);
    const ipAddress = getClientIp(headers);
    const deviceInfo = JSON.parse(headers.get('x-device-info') || 'null');

    const updatedRequest = await db.confirmationRequest.update({
      where: { id },
      data: updateData,
      include: {
        Employee: {
          select: {
            id: true,
            name: true,
            zanId: true,
            payrollNumber: true,
            zssfNumber: true,
            department: true,
            cadre: true,
            status: true,
            dateOfBirth: true,
            employmentDate: true,
            Institution: { select: { id: true, name: true } },
          },
        },
        User_ConfirmationRequest_submittedByIdToUser: {
          select: { id: true, name: true, username: true },
        },
        User_ConfirmationRequest_reviewedByIdToUser: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    // Check if the confirmation request was approved by commission
    if (updateData.status === 'Approved by Commission') {
      try {
        // Update employee status from "On Probation" to "Confirmed"
        await db.employee.update({
          where: { id: updatedRequest.employeeId },
          data: {
            status: 'Confirmed',
            confirmationDate: new Date(),
          },
        });

        logger.info(
          `Employee ${updatedRequest.Employee.name} (${updatedRequest.Employee.zanId}) status updated to "Confirmed" due to commission approval`
        );
      } catch (employeeUpdateError) {
        logger.error({ value: employeeUpdateError }, 'Failed to update employee status');
        // Don't fail the entire request if employee update fails
      }
    }

    // Log audit event for approvals and rejections
    if (updateData.reviewedById && updateData.status) {
      const reviewer = await db.user.findUnique({
        where: { id: updateData.reviewedById },
        select: { username: true, role: true },
      });

      if (reviewer) {
        const statusLower = updateData.status.toLowerCase();
        const isApproval =
          statusLower.includes('approved') && !statusLower.includes('rejected');
        const isRejection = statusLower.includes('rejected');

        logger.info({ 
          status: updateData.status,
          isApproval,
          isRejection,
          reviewedById: updateData.reviewedById,
          reviewer: reviewer.username,
         }, 'Confirmation status update:');

        if (isApproval) {
          await logRequestApproval({
            requestType: 'Confirmation',
            requestId: id,
            employeeId: updatedRequest.employeeId,
            employeeName: updatedRequest.Employee?.name,
            employeeZanId: updatedRequest.Employee?.zanId,
            approvedById: updateData.reviewedById,
            approvedByUsername: reviewer.username,
            approvedByRole: reviewer.role || 'Unknown',
            reviewStage: updateData.reviewStage,
            ipAddress,
            deviceInfo,
            additionalData: {
              currentStatus: updatedRequest.Employee?.status,
            },
          });
        } else if (isRejection) {
          await logRequestRejection({
            requestType: 'Confirmation',
            requestId: id,
            employeeId: updatedRequest.employeeId,
            employeeName: updatedRequest.Employee?.name,
            employeeZanId: updatedRequest.Employee?.zanId,
            rejectedById: updateData.reviewedById,
            rejectedByUsername: reviewer.username,
            rejectedByRole: reviewer.role || 'Unknown',
            rejectionReason: updateData.rejectionReason,
            reviewStage: updateData.reviewStage,
            ipAddress,
            deviceInfo,
            additionalData: {
              currentStatus: updatedRequest.Employee?.status,
            },
          });
        }
      }
    }

    // Send email notification to the HRO submitter on approval/rejection
    if (updateData.status) {
      const patchStatusLower = updateData.status.toLowerCase();
      const patchIsApproval = patchStatusLower.includes('approved') && !patchStatusLower.includes('rejected');
      const patchIsRejection = patchStatusLower.includes('rejected');
      if (patchIsApproval || patchIsRejection) {
        await sendRequestStatusUpdateEmail({
          requestType: 'Confirmation',
          employeeName: updatedRequest.Employee?.name || 'Unknown',
          requestId: id,
          submittedById: updatedRequest.submittedById,
          status: updateData.status,
          rejectionReason: updateData.rejectionReason,
          dashboardPath: '/dashboard/confirmation',
        });
      }
    }

    // Transform the data to match frontend expectations
    const transformedRequest = {
      ...updatedRequest,
      submittedBy: (updatedRequest as any)
        .User_ConfirmationRequest_submittedByIdToUser,
      reviewedBy: (updatedRequest as any)
        .User_ConfirmationRequest_reviewedByIdToUser,
      User_ConfirmationRequest_submittedByIdToUser: undefined,
      User_ConfirmationRequest_reviewedByIdToUser: undefined,
    };

    return NextResponse.json({
      success: true,
      data: transformedRequest,
    });
  } catch (error) {
    logger.error({ err: error }, 'CONFIRMATIONS PATCH');
    return NextResponse.json(
      {
        success: false,
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
