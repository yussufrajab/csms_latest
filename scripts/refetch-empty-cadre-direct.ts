/**
 * Direct HRIMS Refetch for Empty-Cadre Employees
 *
 * This script directly calls the HRIMS API and saves employee data using
 * the same logic as the sync worker (titlePrefixName + titleName + gradeName
 * for cadre). It bypasses the HTTP auth layer entirely.
 *
 * Usage:
 *   npx tsx scripts/refetch-empty-cadre-direct.ts [--dry-run] [--vote XXX]
 *
 * Options:
 *   --dry-run       Show what would be refetched without making API calls
 *   --vote XXX      Process only institution with this vote number
 *   --institution X Process only institution matching this name (partial)
 *   --delay N       Delay between API calls in ms (default: 200)
 */

import { PrismaClient } from '@prisma/client';
import { getHrimsApiConfig } from '../src/lib/hrims-config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

const VOTE_FILTER = (() => {
  const idx = process.argv.indexOf('--vote');
  return idx >= 0 ? process.argv[idx + 1] : '';
})();

const INSTITUTION_FILTER = (() => {
  const idx = process.argv.indexOf('--institution');
  return idx >= 0 ? process.argv[idx + 1] : '';
})();

const DELAY = (() => {
  const idx = process.argv.indexOf('--delay');
  return idx >= 0 ? parseInt(process.argv[idx + 1], 10) : 200;
})();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchEmployeeFromHRIMS(
  zanId: string,
  voteNumber: string,
  hrimsConfig: { BASE_URL: string; API_KEY: string; TOKEN: string }
): Promise<any> {
  const response = await axios.post(
    `${hrimsConfig.BASE_URL}/Employees`,
    {
      RequestId: '202',
      RequestPayloadData: {
        IdentifierType: 'ZANID',
        Identifier: zanId,
        VoteNumber: voteNumber,
      },
    },
    {
      headers: {
        ApiKey: hrimsConfig.API_KEY,
        Token: hrimsConfig.TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );
  return response.data;
}

async function saveEmployeeFromDetailedData(
  hrimsData: any,
  institutionId: string
) {
  try {
    const personalInfo = hrimsData.personalInfo;

    if (!personalInfo?.zanIdNumber || personalInfo.zanIdNumber.trim() === '') {
      return null;
    }

    const currentEmployment =
      hrimsData.employmentHistories?.find((emp: any) => emp.isCurrent) ||
      hrimsData.employmentHistories?.[0];
    const currentSalary =
      hrimsData.salaryInformation?.find((sal: any) => sal.isCurrent) ||
      hrimsData.salaryInformation?.[0];

    const existingEmployee = await prisma.employee.findUnique({
      where: { zanId: personalInfo.zanIdNumber },
    });

    const employeeId = existingEmployee?.id || uuidv4();

    const fullName = [
      personalInfo.firstName,
      personalInfo.middleName,
      personalInfo.lastName,
    ]
      .filter((name) => name && name.trim())
      .join(' ');

    let gender = 'Male';
    if (personalInfo.genderName) {
      if (personalInfo.genderName === 'Mwanamme') {
        gender = 'Male';
      } else if (personalInfo.genderName === 'Mwanamke') {
        gender = 'Female';
      } else if (
        personalInfo.genderName === 'Male' ||
        personalInfo.genderName === 'Female'
      ) {
        gender = personalInfo.genderName;
      }
    }

    const contactAddress =
      [personalInfo.houseNumber, personalInfo.street, personalInfo.city]
        .filter((part) => part && part.trim())
        .join(', ') || null;

    // Use the SAME cadre logic as the sync worker (3-field composite)
    const cadre = currentEmployment
      ? [
          currentEmployment.titlePrefixName,
          currentEmployment.titleName,
          currentEmployment.gradeName,
        ]
          .filter((part) => part && part.trim())
          .join(' ')
      : null;

    let status = 'On Probation';
    if (personalInfo.isEmployeeConfirmed) {
      status = 'Confirmed';
    } else if (currentEmployment) {
      const empStatus = currentEmployment.employeeStatusName?.toLowerCase();
      if (empStatus?.includes('staafu')) status = 'Retired';
      else if (empStatus?.includes('hayupo')) status = 'Resigned';
      else if (empStatus?.includes('aachishwa')) status = 'Terminated';
      else if (empStatus?.includes('fukuzwa')) status = 'Dismissed';
      else if (
        currentEmployment.employmentStatusName?.toLowerCase().includes('hai')
      )
        status = 'Confirmed';
    }

    let retirementDate = null;
    const activeContract = hrimsData.contractDetails?.find(
      (c: any) => c.isActive
    );
    if (
      activeContract?.toDate &&
      activeContract.toDate !== '1900-01-01T00:00:00'
    ) {
      retirementDate = new Date(activeContract.toDate);
    }

    const dbEmployeeData = {
      id: employeeId,
      name: fullName,
      gender: gender,
      dateOfBirth: personalInfo.birthDate
        ? new Date(personalInfo.birthDate)
        : null,
      placeOfBirth: personalInfo.placeOfBirth,
      region:
        personalInfo.districtName ||
        personalInfo.birthRegionName ||
        personalInfo.regionName,
      countryOfBirth: personalInfo.birthCountryName,
      zanId: personalInfo.zanIdNumber,
      phoneNumber: personalInfo.primaryPhone || personalInfo.workPhone,
      contactAddress: contactAddress,
      zssfNumber: personalInfo.zssfNumber,
      payrollNumber: personalInfo.payrollNumber || '',
      cadre: cadre,
      salaryScale: currentSalary?.salaryScaleName,
      ministry:
        currentEmployment?.parentEntityName || currentEmployment?.entityName,
      department: currentEmployment?.subEntityName,
      appointmentType: currentEmployment?.appointmentTypeName,
      contractType: activeContract?.contractTypeName,
      recentTitleDate: currentEmployment?.fromDate
        ? new Date(currentEmployment.fromDate)
        : null,
      currentReportingOffice:
        currentEmployment?.divisionName || currentEmployment?.subEntityName,
      currentWorkplace: currentEmployment?.entityName,
      employmentDate: personalInfo.employmentDate
        ? new Date(personalInfo.employmentDate)
        : null,
      confirmationDate: personalInfo.employmentConfirmationDate
        ? new Date(personalInfo.employmentConfirmationDate)
        : null,
      retirementDate: retirementDate,
      status: status,
      institutionId: institutionId,
      employeeEntityId: personalInfo.zanIdNumber,
    };

    const { institutionId: _, ...employeeDataWithoutInstId } = dbEmployeeData;

    await prisma.employee.upsert({
      where: { zanId: personalInfo.zanIdNumber },
      update: dbEmployeeData,
      create: {
        ...employeeDataWithoutInstId,
        Institution: {
          connect: { id: institutionId },
        },
      },
    });

    return {
      employeeId,
      zanId: dbEmployeeData.zanId,
      name: dbEmployeeData.name,
      cadre: dbEmployeeData.cadre,
      ministry: dbEmployeeData.ministry,
      status: dbEmployeeData.status,
    };
  } catch (error) {
    console.error('Error saving employee:', error);
    throw error;
  }
}

async function main() {
  console.log('=== Direct HRIMS Refetch for Empty-Cadre Employees ===\n');
  console.log(`Dry run: ${DRY_RUN}`);
  console.log(`Vote filter: ${VOTE_FILTER || 'none'}`);
  console.log(`Institution filter: ${INSTITUTION_FILTER || 'none'}`);
  console.log(`Delay: ${DELAY}ms\n`);

  // Step 1: Get HRIMS config
  console.log('Step 1: Loading HRIMS API config...');
  const hrimsConfig = await getHrimsApiConfig();
  console.log(`  API Base URL: ${hrimsConfig.BASE_URL}\n`);

  // Step 2: Find employees with empty cadre
  console.log('Step 2: Finding employees with empty cadre...');
  const where: any = {
    OR: [{ cadre: null }, { cadre: '' }],
  };

  if (VOTE_FILTER) {
    where.Institution = { voteNumber: VOTE_FILTER };
  }
  if (INSTITUTION_FILTER) {
    where.Institution = {
      ...where.Institution,
      name: { contains: INSTITUTION_FILTER, mode: 'insensitive' },
    };
  }

  const employees = await prisma.employee.findMany({
    where,
    select: {
      id: true,
      zanId: true,
      name: true,
      cadre: true,
      status: true,
      Institution: {
        select: { id: true, name: true, voteNumber: true, tinNumber: true },
      },
    },
    orderBy: { Institution: { name: 'asc' } },
  });

  console.log(`  Found ${employees.length} employees with empty cadre\n`);

  if (employees.length === 0) {
    console.log('No employees with empty cadre found. Exiting.');
    await prisma.$disconnect();
    return;
  }

  // Separate employees by whether they have a vote number
  const withVote = employees.filter(
    (e) => e.Institution?.voteNumber && e.Institution.voteNumber.trim() !== ''
  );
  const withoutVote = employees.filter(
    (e) => !e.Institution?.voteNumber || e.Institution.voteNumber.trim() === ''
  );

  console.log(`  With vote number: ${withVote.length}`);
  console.log(`  Without vote number: ${withoutVote.length}`);

  if (withoutVote.length > 0) {
    console.log('\n  Employees without vote number (cannot refetch via HRIMS single-employee API):');
    const byInstitution = withoutVote.reduce(
      (acc, e) => {
        const key = e.Institution?.name || 'Unknown';
        if (!acc[key]) acc[key] = { count: 0, tin: e.Institution?.tinNumber || 'none' };
        acc[key].count++;
        return acc;
      },
      {} as Record<string, { count: number; tin: string }>
    );
    for (const [name, data] of Object.entries(byInstitution)) {
      console.log(`    - ${name} (${data.count} employees, TIN: ${data.tin})`);
    }
    console.log(
      '\n  For these, use: ./scripts/batch-refetch.sh --cookie COOKIE --tin TIN_NUMBER'
    );
  }

  console.log('');

  // Step 3: Refetch each employee
  let success = 0;
  let failed = 0;
  let skipped = 0;
  let cadreFilled = 0;
  let stillEmpty = 0;
  let prevInstitution = '';

  for (let i = 0; i < withVote.length; i++) {
    const emp = withVote[i];
    const instName = emp.Institution?.name || 'Unknown';
    const voteNumber = emp.Institution!.voteNumber!;

    // Print institution header
    if (instName !== prevInstitution) {
      console.log(`\n--- ${instName} (vote: ${voteNumber}) ---`);
      prevInstitution = instName;
    }

    const progress = `[${i + 1}/${withVote.length}]`;

    if (DRY_RUN) {
      console.log(
        `  ${progress} WOULD FETCH: ${emp.name} (${emp.zanId}) — vote ${voteNumber}`
      );
      success++;
      continue;
    }

    try {
      const response = await fetchEmployeeFromHRIMS(emp.zanId, voteNumber, hrimsConfig);

      if (!response?.data?.Employee) {
        console.log(
          `  ${progress} SKIP: ${emp.name} (${emp.zanId}) — no employee data in HRIMS response`
        );
        skipped++;
        await sleep(DELAY);
        continue;
      }

      // Extract employee data from HRIMS response
      const hrimsEmployeeData = response.data.Employee;

      // Find institution by vote number
      const institution = await prisma.institution.findFirst({
        where: { voteNumber: voteNumber },
      });

      if (!institution) {
        console.log(
          `  ${progress} SKIP: ${emp.name} (${emp.zanId}) — institution not found for vote ${voteNumber}`
        );
        skipped++;
        await sleep(DELAY);
        continue;
      }

      // Save using the same logic as the sync worker
      const result = await saveEmployeeFromDetailedData(hrimsEmployeeData, institution.id);

      if (result) {
        const cadreDisplay = result.cadre || '(empty)';
        if (result.cadre && result.cadre.trim() !== '') {
          cadreFilled++;
        } else {
          stillEmpty++;
        }
        console.log(
          `  ${progress} OK: ${emp.name} (${emp.zanId}) -> cadre="${cadreDisplay}" status=${result.status}`
        );
        success++;
      } else {
        console.log(
          `  ${progress} SKIP: ${emp.name} (${emp.zanId}) — no zanId in HRIMS data`
        );
        skipped++;
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Unknown error';
      console.log(`  ${progress} FAIL: ${emp.name} (${emp.zanId}) — ${msg}`);
      failed++;
    }

    await sleep(DELAY);
  }

  // Step 4: Summary
  console.log('\n=== Refetch Summary ===');
  console.log(`Total with vote number: ${withVote.length}`);
  console.log(`Total without vote:    ${withoutVote.length} (cannot refetch)`);
  console.log(`Success:               ${success}`);
  console.log(`Failed:                ${failed}`);
  console.log(`Skipped:               ${skipped}`);
  console.log(`Cadre filled:          ${cadreFilled}`);
  console.log(`Cadre still empty:      ${stillEmpty}`);

  // Step 5: Verify remaining empty cadre count
  if (!DRY_RUN) {
    const remainingEmpty = await prisma.employee.count({
      where: { OR: [{ cadre: null }, { cadre: '' }] },
    });
    const totalEmployees = await prisma.employee.count();
    console.log(`\nRemaining employees with empty cadre: ${remainingEmpty}`);
    console.log(`Total employees: ${totalEmployees}`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});