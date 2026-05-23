import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shouldApplyInstitutionFilter } from '@/lib/role-utils';
import { v4 as uuidv4 } from 'uuid';
import {
  logRequestSubmission,
  logRequestApproval,
  logRequestRejection,
  getClientIp,
} from '@/lib/audit-logger';
import { createNotificationForRole, NotificationTemplates } from '@/lib/notifications';
import { sendRequestSubmissionEmails, sendRequestStatusUpdateEmail } from '@/lib/email';
import { ROLES } from '@/lib/constants';
import { logger } from '@/lib/logger';

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
     }, 'Termination API called with');

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
        `Role ${userRole} is a CSC role - showing all termination data across institutions`
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
      db.separationRequest.findMany({
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
              dateOfBirth: true,
              employmentDate: true,
              Institution: { select: { id: true, name: true } },
            },
          },
          User_SeparationRequest_submittedByIdToUser: {
            select: { id: true, name: true, username: true },
          },
          User_SeparationRequest_reviewedByIdToUser: {
            select: { id: true, name: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      db.separationRequest.count({ where: whereClause }),
    ]);

    // Transform the data to match frontend expectations
    const transformedRequests = requests.map((req: any) => ({
      ...req,
      submittedBy: req.User_SeparationRequest_submittedByIdToUser,
      reviewedBy: req.User_SeparationRequest_reviewedByIdToUser,
      User_SeparationRequest_submittedByIdToUser: undefined,
      User_SeparationRequest_reviewedByIdToUser: undefined,
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
    logger.error({ err: error }, 'TERMINATION GET');
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    logger.info({ value: body }, 'Creating termination request');

    // Basic validation
    if (!body.employeeId || !body.submittedById || !body.type || !body.reason) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Missing required fields: employeeId, submittedById, type, reason',
        },
        { status: 400 }
      );
    }

    const separationRequest = await db.separationRequest.create({
      data: {
        id: uuidv4(),
        employeeId: body.employeeId,
        submittedById: body.submittedById,
        type: body.type,
        reason: body.reason,
        documents: body.documents || [],
        status: body.status || 'Pending HRMO/HHRMD Review',
        reviewStage: body.reviewStage || 'initial',
        rejectionReason: body.rejectionReason,
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
            dateOfBirth: true,
            employmentDate: true,
            Institution: { select: { id: true, name: true } },
          },
        },
        User_SeparationRequest_submittedByIdToUser: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    logger.info({ value: separationRequest.id }, 'Created termination request');

    // Create notification for CSC reviewers
    const notification = NotificationTemplates.terminationSubmitted(
      separationRequest.Employee.name,
      separationRequest.id
    );

    await createNotificationForRole(ROLES.HHRMD || 'HHRMD', notification.message, notification.link);
    await createNotificationForRole(ROLES.HRMO || 'HRMO', notification.message, notification.link);
    await createNotificationForRole(ROLES.DO || 'DO', notification.message, notification.link);

    // Send email notifications to CSC reviewers
    await sendRequestSubmissionEmails({
      requestType: 'Termination',
      employeeName: separationRequest.Employee.name,
      requestId: separationRequest.id,
      submittedByName: separationRequest.User_SeparationRequest_submittedByIdToUser?.name || 'Unknown',
      dashboardPath: '/dashboard/termination',
    });

    // Log request submission for audit
    const submittedByUser = await db.user.findUnique({
      where: { id: body.submittedById },
      select: { id: true, username: true, role: true },
    });
    await logRequestSubmission({
      requestType: 'Termination',
      requestId: separationRequest.id,
      employeeId: separationRequest.employeeId,
      employeeName: separationRequest.Employee?.name,
      employeeZanId: separationRequest.Employee?.zanId,
      submittedById: body.submittedById,
      submittedByUsername: submittedByUser?.username || 'Unknown',
      submittedByRole: submittedByUser?.role || 'Unknown',
      ipAddress: getClientIp(req.headers),
      deviceInfo: JSON.parse(req.headers.get('x-device-info') || 'null'),
    }).catch(() => {});

    // Transform the data to match frontend expectations
    const transformedRequest = {
      ...separationRequest,
      submittedBy: (separationRequest as any)
        .User_SeparationRequest_submittedByIdToUser,
      User_SeparationRequest_submittedByIdToUser: undefined,
    };

    return NextResponse.json({
      success: true,
      data: transformedRequest,
    });
  } catch (error) {
    logger.error({ err: error }, 'TERMINATION POST');
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Request ID is required',
        },
        { status: 400 }
      );
    }

    // Get IP and device info for audit logging
    const headers = new Headers(req.headers);
    const ipAddress = getClientIp(headers);
    const deviceInfo = JSON.parse(headers.get('x-device-info') || 'null');

    // No date conversion needed for separation requests

    const updatedRequest = await db.separationRequest.update({
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
            dateOfBirth: true,
            employmentDate: true,
            status: true,
            Institution: { select: { id: true, name: true } },
          },
        },
      },
    });

    // If separation request is approved by Commission, update employee status based on current employee status
    if (
      updateData.status === 'Approved by Commission' &&
      updatedRequest.Employee
    ) {
      const currentEmployeeStatus = updatedRequest.Employee.status;
      let newStatus;

      if (currentEmployeeStatus === 'Confirmed') {
        newStatus = 'Dismissed';
      } else if (
        currentEmployeeStatus === 'Probation' ||
        currentEmployeeStatus === 'On Probation'
      ) {
        newStatus = 'Terminated';
      } else {
        // For other statuses, default based on separation type
        newStatus =
          updatedRequest.type === 'DISMISSAL' ? 'Dismissed' : 'Terminated';
      }

      await db.employee.update({
        where: { id: updatedRequest.Employee.id },
        data: { status: newStatus },
      });

      logger.info(
        `Employee ${updatedRequest.Employee.name} status updated from "${currentEmployeeStatus}" to "${newStatus}" after ${updatedRequest.type.toLowerCase()} approval`
      );
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
        const requestType =
          updatedRequest.type === 'TERMINATION' ? 'Termination' : 'Dismissal';

        logger.info({ 
          status: updateData.status,
          isApproval,
          isRejection,
          reviewedById: updateData.reviewedById,
          reviewer: reviewer.username,
         }, 'Termination/Dismissal status update:');

        if (isApproval) {
          await logRequestApproval({
            requestType,
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
              type: updatedRequest.type,
              reason: updatedRequest.reason,
            },
          });
        } else if (isRejection) {
          await logRequestRejection({
            requestType,
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
              type: updatedRequest.type,
            },
          });
        }
      }
    }

    // Send email notification to the HRO submitter on approval/rejection
    if (updateData.status) {
      const termPatchStatusLower = updateData.status.toLowerCase();
      const termPatchIsApproval = termPatchStatusLower.includes('approved') && !termPatchStatusLower.includes('rejected');
      const termPatchIsRejection = termPatchStatusLower.includes('rejected');
      if (termPatchIsApproval || termPatchIsRejection) {
        await sendRequestStatusUpdateEmail({
          requestType: 'Termination',
          employeeName: updatedRequest.Employee?.name || 'Unknown',
          requestId: id,
          submittedById: updatedRequest.submittedById,
          status: updateData.status,
          rejectionReason: updateData.rejectionReason,
          dashboardPath: '/dashboard/termination',
        });
      }
    }

    // Transform the data to match frontend expectations
    const transformedRequest = {
      ...updatedRequest,
      submittedBy: (updatedRequest as any)
        .User_TerminationRequest_submittedByIdToUser,
      reviewedBy: (updatedRequest as any)
        .User_TerminationRequest_reviewedByIdToUser,
      User_TerminationRequest_submittedByIdToUser: undefined,
      User_TerminationRequest_reviewedByIdToUser: undefined,
    };

    return NextResponse.json({
      success: true,
      data: transformedRequest,
    });
  } catch (error) {
    logger.error({ err: error }, 'TERMINATION PATCH');
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
