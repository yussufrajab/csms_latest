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
import { createNotificationForRole, NotificationTemplates } from '@/lib/notifications';
import { sendRequestSubmissionEmails, sendRequestStatusUpdateEmail } from '@/lib/email';
import { ROLES } from '@/lib/constants';

// Cache configuration for cadre change requests
const CACHE_TTL = 30; // 30 seconds cache (request status changes frequently)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');
    const userInstitutionId = searchParams.get('userInstitutionId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const size = parseInt(searchParams.get('size') || '50', 10);
    const status = searchParams.get('status') || 'all';

    console.log('Cadre Change API called with:', {
      userId,
      userRole,
      userInstitutionId,
      page,
      size,
      status,
    });

    // Build where clause based on user role and institution
    const whereClause: any = {};

    // Apply institution filtering based on role
    if (shouldApplyInstitutionFilter(userRole, userInstitutionId)) {
      console.log(
        `Applying institution filter for role ${userRole} with institutionId ${userInstitutionId}`
      );
      whereClause.Employee = {
        institutionId: userInstitutionId,
      };
    } else {
      console.log(
        `Role ${userRole} is a CSC role - showing all cadre change data across institutions`
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
      db.cadreChangeRequest.findMany({
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
          User_CadreChangeRequest_submittedByIdToUser: {
            select: { id: true, name: true, username: true },
          },
          User_CadreChangeRequest_reviewedByIdToUser: {
            select: { id: true, name: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      db.cadreChangeRequest.count({ where: whereClause }),
    ]);

    console.log(`Found ${requests.length} cadre change requests (page ${page} of ${Math.ceil(total / size)})`);

    // Transform the data to match frontend expectations
    const transformedRequests = requests.map((req: any) => ({
      ...req,
      submittedBy: req.User_CadreChangeRequest_submittedByIdToUser,
      reviewedBy: req.User_CadreChangeRequest_reviewedByIdToUser,
      User_CadreChangeRequest_submittedByIdToUser: undefined,
      User_CadreChangeRequest_reviewedByIdToUser: undefined,
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
    console.error('[CADRE_CHANGE_GET]', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Creating cadre change request:', body);

    // Basic validation
    if (!body.employeeId || !body.submittedById || !body.newCadre) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Missing required fields: employeeId, submittedById, newCadre',
        },
        { status: 400 }
      );
    }

    // Get employee details to check status and get current cadre
    const employee = await db.employee.findUnique({
      where: { id: body.employeeId },
      select: { id: true, name: true, status: true, cadre: true },
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

    // Validate employee status for cadre change request
    const statusValidation = validateEmployeeStatusForRequest(
      employee.status,
      'cadre-change'
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

    const cadreChangeRequest = await db.cadreChangeRequest.create({
      data: {
        id: uuidv4(),
        employeeId: body.employeeId,
        submittedById: body.submittedById,
        originalCadre: employee.cadre, // Store original cadre before change
        newCadre: body.newCadre,
        reason: body.reason,
        studiedOutsideCountry: body.studiedOutsideCountry || false,
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
        User_CadreChangeRequest_submittedByIdToUser: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    console.log('Created cadre change request:', cadreChangeRequest.id);

    // Create notification for CSC reviewers
    const notification = NotificationTemplates.cadreChangeSubmitted(
      cadreChangeRequest.Employee.name,
      cadreChangeRequest.id
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
      requestType: 'Cadre Change',
      employeeName: cadreChangeRequest.Employee.name,
      requestId: cadreChangeRequest.id,
      submittedByName: cadreChangeRequest.User_CadreChangeRequest_submittedByIdToUser?.name || 'Unknown',
      dashboardPath: '/dashboard/cadre-change',
    });

    // Log request submission for audit
    const submittedByUser = await db.user.findUnique({
      where: { id: body.submittedById },
      select: { id: true, username: true, role: true },
    });
    await logRequestSubmission({
      requestType: 'CadreChange',
      requestId: cadreChangeRequest.id,
      employeeId: cadreChangeRequest.employeeId,
      employeeName: cadreChangeRequest.Employee?.name,
      employeeZanId: cadreChangeRequest.Employee?.zanId,
      submittedById: body.submittedById,
      submittedByUsername: submittedByUser?.username || 'Unknown',
      submittedByRole: submittedByUser?.role || 'Unknown',
      ipAddress: getClientIp(req.headers),
      deviceInfo: JSON.parse(req.headers.get('x-device-info') || 'null'),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      data: cadreChangeRequest,
    });
  } catch (error) {
    console.error('[CADRE_CHANGE_POST]', error);
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

    const updatedRequest = await db.cadreChangeRequest.update({
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
            Institution: { select: { id: true, name: true } },
          },
        },
        User_CadreChangeRequest_submittedByIdToUser: {
          select: { id: true, name: true, username: true },
        },
        User_CadreChangeRequest_reviewedByIdToUser: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    // If cadre change request is approved by Commission, update employee cadre
    if (
      updateData.status === 'Approved by Commission' &&
      updatedRequest.Employee
    ) {
      await db.employee.update({
        where: { id: updatedRequest.Employee.id },
        data: { cadre: updatedRequest.newCadre },
      });
      console.log(
        `Employee ${updatedRequest.Employee.name} cadre updated to "${updatedRequest.newCadre}" after cadre change approval`
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

        console.log('[AUDIT] Cadre Change status update:', {
          status: updateData.status,
          isApproval,
          isRejection,
          reviewedById: updateData.reviewedById,
          reviewer: reviewer.username,
        });

        if (isApproval) {
          await logRequestApproval({
            requestType: 'Cadre Change',
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
              newCadre: updatedRequest.newCadre,
              currentCadre: updatedRequest.Employee?.cadre,
              reason: updatedRequest.reason,
            },
          });
        } else if (isRejection) {
          await logRequestRejection({
            requestType: 'Cadre Change',
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
              newCadre: updatedRequest.newCadre,
              currentCadre: updatedRequest.Employee?.cadre,
              reason: updatedRequest.reason,
            },
          });
        }
      }
    }

    // Send email notification to the HRO submitter on approval/rejection
    if (updateData.status) {
      const ccPatchStatusLower = updateData.status.toLowerCase();
      const ccPatchIsApproval = ccPatchStatusLower.includes('approved') && !ccPatchStatusLower.includes('rejected');
      const ccPatchIsRejection = ccPatchStatusLower.includes('rejected');
      if (ccPatchIsApproval || ccPatchIsRejection) {
        await sendRequestStatusUpdateEmail({
          requestType: 'Cadre Change',
          employeeName: updatedRequest.Employee?.name || 'Unknown',
          requestId: id,
          submittedById: updatedRequest.submittedById,
          status: updateData.status,
          rejectionReason: updateData.rejectionReason,
          dashboardPath: '/dashboard/cadre-change',
        });
      }
    }

    // Transform the data to match frontend expectations
    const transformedRequest = {
      ...updatedRequest,
      submittedBy: (updatedRequest as any)
        .User_CadreChangeRequest_submittedByIdToUser,
      reviewedBy: (updatedRequest as any)
        .User_CadreChangeRequest_reviewedByIdToUser,
      User_CadreChangeRequest_submittedByIdToUser: undefined,
      User_CadreChangeRequest_reviewedByIdToUser: undefined,
    };

    return NextResponse.json({
      success: true,
      data: transformedRequest,
    });
  } catch (error) {
    console.error('[CADRE_CHANGE_PATCH]', error);
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
