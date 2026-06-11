/**
 * Direct institution-level HRIMS refetch for empty-cadre employees.
 *
 * This script directly calls the HRIMS paginated employee API (RequestId 204/205)
 * for each institution that has employees with empty cadre, and updates only those
 * employees using Prisma upsert. It does NOT clear any existing data.
 *
 * Unlike the single-employee fetch (RequestId 202), the paginated institution-level
 * API returns employmentHistories data which includes titlePrefixName, titleName,
 * and gradeName — the fields needed to populate the cadre field.
 *
 * Usage:
 *   npx tsx scripts/refetch-empty-cadre-institutions.ts [--dry-run] [--vote XXX]
 */

import { getHrimsApiConfig } from '../src/lib/hrims-config';
import { db } from '../src/lib/db';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const DRY_RUN = process.argv.includes('--dry-run');
const VOTE_FILTER = (() => {
  const idx = process.argv.indexOf('--vote');
  return idx >= 0 ? process.argv[idx + 1] : '';
})();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MAX_PAGES = 200;
const PAGE_SIZE = 100;

async function fetchFromHRIMS(
  requestId: string,
  payloadData: any,
  hrimsConfig: { BASE_URL: string; API_KEY: string; TOKEN: string }
): Promise<any> {
  const response = await axios.post(
    `${hrimsConfig.BASE_URL}/Employees`,
    {
      RequestId: requestId,
      RequestPayloadData: payloadData,
    },
    {
      headers: {
        ApiKey: hrimsConfig.API_KEY,
        Token: hrimsConfig.TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 900000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );
  return response.data;
}

async function processInstitution(
  institutionId: string,
  institutionName: string,
  identifierType: string,
  identifier: string,
  hrimsConfig: { BASE_URL: string; API_KEY: string; TOKEN: string },
  emptyCadreZanIds: Set<string>
): Promise<{ fetched: number; updated: number; alreadyFilled: number; notInHRIMS: number }> {
  let fetched = 0;
  let updated = 0;
  let alreadyFilled = 0;
  let notInHRIMS = 0;

  const requestId = identifierType === 'tin' ? '205' : '204';
  let overallDataSize = 0;

  // Fetch all pages for this institution — same format as hrims-sync-worker.ts
  for (let page = 0; page < MAX_PAGES; page++) {
    const payloadData = {
      PageNumber: page,
      PageSize: PAGE_SIZE,
      RequestBody: identifier,
    };

    try {
      const response = await fetchFromHRIMS(requestId, payloadData, hrimsConfig);

      // Check response code (same as worker)
      if (response.code !== 200) {
        console.log(`    HRIMS returned code ${response.code}: ${response.message || 'Unknown error'}`);
        break;
      }

      // Worker uses response.data as a direct array (not response.data.Employees)
      if (!response?.data || !Array.isArray(response.data)) {
        if (page === 0) {
          console.log(`    No employee data returned from HRIMS`);
        }
        break;
      }

      const employees = response.data;

      if (page === 0) {
        overallDataSize = response.overallDataSize || 0;
        console.log(`    HRIMS reports ${overallDataSize} total employees for this institution`);
      }

      for (const emp of employees) {
        const zanId = emp.personalInfo?.zanIdNumber;
        if (!zanId) continue;

        fetched++;

        // Only update employees that have empty cadre
        if (!emptyCadreZanIds.has(zanId)) {
          alreadyFilled++;
          continue;
        }

        // Process and update
        const result = await saveEmployeeFromDetailedData(emp, institutionId);
        if (result) {
          updated++;
          if (result.cadre) {
            console.log(`    ✓ ${result.name} (${zanId}): cadre="${result.cadre}"`);
          } else {
            console.log(`    ~ ${result.name} (${zanId}): HRIMS returned no cadre data`);
          }
        } else {
          notInHRIMS++;
        }
      }

      // Check pagination — same logic as worker
      const currentDataSize = response.currentDataSize || employees.length || 0;
      if (
        currentDataSize === 0 ||
        currentDataSize < PAGE_SIZE ||
        (overallDataSize > 0 && fetched >= overallDataSize)
      ) {
        break;
      }

      // Small delay between pages
      await sleep(50);
    } catch (error: any) {
      console.error(`    Error on page ${page}: ${error.message}`);
      break;
    }
  }

  return { fetched, updated, alreadyFilled, notInHRIMS };
}

async function saveEmployeeFromDetailedData(hrimsData: any, institutionId: string) {
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

    const existingEmployee = await db.employee.findUnique({
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
      if (personalInfo.genderName === 'Mwanamme') gender = 'Male';
      else if (personalInfo.genderName === 'Mwanamke') gender = 'Female';
      else if (personalInfo.genderName === 'Male' || personalInfo.genderName === 'Female') {
        gender = personalInfo.genderName;
      }
    }

    const cadre = currentEmployment
      ? [currentEmployment.titlePrefixName, currentEmployment.titleName, currentEmployment.gradeName]
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
      else if (currentEmployment.employmentStatusName?.toLowerCase().includes('hai'))
        status = 'Confirmed';
    }

    let retirementDate = null;
    const activeContract = hrimsData.contractDetails?.find((c: any) => c.isActive);
    if (activeContract?.toDate && activeContract.toDate !== '1900-01-01T00:00:00') {
      retirementDate = new Date(activeContract.toDate);
    }

    const dbEmployeeData = {
      id: employeeId,
      name: fullName,
      gender: gender,
      dateOfBirth: personalInfo.birthDate ? new Date(personalInfo.birthDate) : null,
      placeOfBirth: personalInfo.placeOfBirth,
      region: personalInfo.districtName || personalInfo.birthRegionName || personalInfo.regionName,
      countryOfBirth: personalInfo.birthCountryName,
      zanId: personalInfo.zanIdNumber,
      phoneNumber: personalInfo.primaryPhone || personalInfo.workPhone,
      contactAddress: [personalInfo.houseNumber, personalInfo.street, personalInfo.city].filter((part) => part && part.trim()).join(', ') || null,
      zssfNumber: personalInfo.zssfNumber,
      payrollNumber: personalInfo.payrollNumber || '',
      cadre: cadre,
      salaryScale: currentSalary?.salaryScaleName,
      ministry: currentEmployment?.parentEntityName || currentEmployment?.entityName,
      department: currentEmployment?.subEntityName,
      appointmentType: currentEmployment?.appointmentTypeName,
      contractType: activeContract?.contractTypeName,
      recentTitleDate: currentEmployment?.fromDate ? new Date(currentEmployment.fromDate) : null,
      currentReportingOffice: currentEmployment?.divisionName || currentEmployment?.subEntityName,
      currentWorkplace: currentEmployment?.entityName,
      employmentDate: personalInfo.employmentDate ? new Date(personalInfo.employmentDate) : null,
      confirmationDate: personalInfo.employmentConfirmationDate ? new Date(personalInfo.employmentConfirmationDate) : null,
      retirementDate: retirementDate,
      status: status,
      institutionId: institutionId,
      employeeEntityId: personalInfo.zanIdNumber,
    };

    const { institutionId: _, ...employeeDataWithoutInstId } = dbEmployeeData;

    await db.employee.upsert({
      where: { zanId: personalInfo.zanIdNumber },
      update: dbEmployeeData,
      create: {
        ...employeeDataWithoutInstId,
        Institution: { connect: { id: institutionId } },
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
    console.error('    Error saving employee:', error);
    throw error;
  }
}

async function main() {
  console.log('=== Institution-Level HRIMS Refetch for Empty-Cadre Employees ===\n');
  console.log(`Dry run: ${DRY_RUN}`);
  console.log(`Vote filter: ${VOTE_FILTER || 'none'}\n`);

  // Step 1: Get HRIMS config
  console.log('Step 1: Loading HRIMS API config...');
  const hrimsConfig = await getHrimsApiConfig();
  console.log(`  API Base URL: ${hrimsConfig.BASE_URL}\n`);

  // Step 2: Find all institutions with empty-cadre employees
  console.log('Step 2: Finding institutions with empty-cadre employees...');
  let institutionQuery = `
    SELECT i.id, i.name, i."voteNumber", i."tinNumber", COUNT(e.id)::int as "emptyCount"
    FROM "Institution" i
    JOIN "Employee" e ON e."institutionId" = i.id
    WHERE (e.cadre = '' OR e.cadre IS NULL)
  `;
  if (VOTE_FILTER) {
    institutionQuery += ` AND i."voteNumber" = '${VOTE_FILTER}'`;
  }
  institutionQuery += ` GROUP BY i.id, i.name, i."voteNumber", i."tinNumber" ORDER BY "emptyCount" DESC`;

  const institutionsFinal = await db.$queryRawUnsafe<Array<{id: string, name: string, voteNumber: string | null, tinNumber: string | null, emptyCount: number}>>(institutionQuery);

  console.log(`  Found ${institutionsFinal.length} institutions with empty-cadre employees\n`);

  // Step 3: Get all empty-cadre zanIds for targeted updating
  const emptyCadreZanIds = new Set<string>();
  if (!DRY_RUN) {
    const emptyCadreEmployees = await db.employee.findMany({
      where: { OR: [{ cadre: null }, { cadre: '' }] },
      select: { zanId: true },
    });
    for (const e of emptyCadreEmployees) {
      emptyCadreZanIds.add(e.zanId);
    }
    console.log(`  Total empty-cadre ZAN-IDs: ${emptyCadreZanIds.size}\n`);
  }

  // Step 4: Process each institution
  let totalUpdated = 0;
  let totalFetched = 0;
  let totalAlreadyFilled = 0;
  let totalNotInHRIMS = 0;
  let institutionsProcessed = 0;

  for (const inst of institutionsFinal) {
    const identifierType = inst.voteNumber ? 'votecode' : 'tin';
    const identifier = inst.voteNumber || inst.tinNumber;

    if (!identifier) {
      console.log(`  SKIP: ${inst.name} — no vote number or TIN`);
      continue;
    }

    console.log(`\n--- [${institutionsProcessed + 1}/${institutionsFinal.length}] ${inst.name} (empty cadre: ${inst.emptyCount}, ${identifierType}: ${identifier}) ---`);

    if (DRY_RUN) {
      console.log(`  WOULD FETCH: Institution-level paginated HRIMS data`);
      institutionsProcessed++;
      continue;
    }

    const result = await processInstitution(
      inst.id,
      inst.name,
      identifierType,
      identifier,
      hrimsConfig,
      emptyCadreZanIds
    );

    console.log(`    Fetched: ${result.fetched}, Updated: ${result.updated}, Already filled: ${result.alreadyFilled}, Not in HRIMS: ${result.notInHRIMS}`);

    totalUpdated += result.updated;
    totalFetched += result.fetched;
    totalAlreadyFilled += result.alreadyFilled;
    totalNotInHRIMS += result.notInHRIMS;
    institutionsProcessed++;

    // Delay between institutions
    await sleep(500);
  }

  // Step 5: Verify results
  console.log('\n\n=== Refetch Summary ===');
  console.log(`Institutions processed:  ${institutionsProcessed}`);
  console.log(`Total employees fetched: ${totalFetched}`);
  console.log(`Empty-cadre updated:     ${totalUpdated}`);
  console.log(`Already had cadre:       ${totalAlreadyFilled}`);
  console.log(`Not in HRIMS response:   ${totalNotInHRIMS}`);

  if (!DRY_RUN) {
    const remainingEmpty = await db.employee.count({
      where: { OR: [{ cadre: null }, { cadre: '' }] },
    });
    const totalEmployees = await db.employee.count();
    console.log(`\nRemaining empty-cadre employees: ${remainingEmpty}`);
    console.log(`Total employees: ${totalEmployees}`);
  }

  await db.$disconnect();
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});