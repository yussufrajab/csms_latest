/**
 * POST /api/hrims/refetch-employees
 *
 * Refetch employee data for an institution from HRIMS.
 * - Clears employee data fields (name, gender, cadre, dates, etc.)
 * - PRESERVES document URLs, photo URLs, certificates, and User relationships
 * - Queues a background HRIMS sync to re-populate cleared employee data
 *
 * Only ADMIN, HHRMD, and CSCS roles can trigger this operation.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { addHRIMSSyncJob } from '@/lib/jobs/hrims-sync-queue';
import { withAuth } from '@/lib/api-auth';
import { hrimsLogger } from '@/lib/logger';

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

export const POST = withAuth(
  async (req, { auth }) => {
    try {
      const body = await req.json();
      const { tinNumber, voteNumber } = body;

      if (!tinNumber && !voteNumber) {
        return NextResponse.json(
          {
            success: false,
            message: 'Either tinNumber or voteNumber is required',
          },
          { status: 400 }
        );
      }

      // Find institution by TIN or vote number
      const institution = tinNumber
        ? await db.institution.findUnique({ where: { tinNumber } })
        : await db.institution.findFirst({ where: { voteNumber } });

      if (!institution) {
        return NextResponse.json(
          {
            success: false,
            message: `Institution not found with ${tinNumber ? 'TIN' : 'vote number'}: ${tinNumber || voteNumber}`,
          },
          { status: 404 }
        );
      }

      // Find employees for the institution
      const employees = await db.employee.findMany({
        where: { institutionId: institution.id },
        select: { id: true, zanId: true, name: true },
      });

      if (employees.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: `No employees found for institution: ${institution.name}`,
          },
          { status: 404 }
        );
      }

      // Clear employee data fields but preserve:
      // - id, zanId (identity)
      // - profileImageUrl, ardhilHaliUrl, confirmationLetterUrl, jobContractUrl, birthCertificateUrl (documents/photos)
      // - institutionId, dataSource (metadata)
      // - EmployeeCertificate records (kept via cascade preservation)
      const employeeIds = employees.map((e) => e.id);
      hrimsLogger.info(
        { count: employeeIds.length, institution: institution.name },
        'Clearing employee data fields before refetch'
      );

      await db.employee.updateMany({
        where: { id: { in: employeeIds } },
        data: {
          // Clear all HRIMS-sourced data fields
          name: '',
          gender: '',
          dateOfBirth: null,
          placeOfBirth: null,
          region: null,
          countryOfBirth: null,
          phoneNumber: null,
          contactAddress: null,
          zssfNumber: null,
          payrollNumber: null,
          cadre: null,
          salaryScale: null,
          ministry: null,
          department: null,
          appointmentType: null,
          contractType: null,
          recentTitleDate: null,
          currentReportingOffice: null,
          currentWorkplace: null,
          employmentDate: null,
          confirmationDate: null,
          retirementDate: null,
          status: null,
          employeeEntityId: null,
          email: null,
        },
      });

      // Queue background HRIMS sync to re-populate employee data
      const identifierType = tinNumber ? 'tin' : 'votecode';
      const identifier = tinNumber || voteNumber!;
      const identifierLabel = tinNumber ? 'TIN' : 'Vote Code';
      const requestId = tinNumber ? '205' : '204';

      const jobId = await addHRIMSSyncJob({
        institutionId: institution.id,
        institutionName: institution.name,
        identifierType,
        voteNumber: voteNumber,
        tinNumber: tinNumber,
        identifier,
        identifierLabel,
        requestId,
        pageSize: 100,
      });

      hrimsLogger.info(
        {
          employeeCount: employees.length,
          institution: institution.name,
          jobId,
        },
        'Employee data cleared and sync job queued'
      );

      return NextResponse.json({
        success: true,
        message: `Cleared data for ${employees.length} employees and queued HRIMS sync for ${institution.name}`,
        institutionId: institution.id,
        institutionName: institution.name,
        employeeCount: employees.length,
        jobId,
        statusUrl: `/api/hrims/sync-status/${jobId}`,
      });
    } catch (error) {
      hrimsLogger.error({ err: error }, 'Error in refetch-employees');
      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Internal server error',
        },
        { status: 500 }
      );
    }
  },
  { allowedRoles: ['Admin', 'HHRMD', 'CSCS'] }
);
