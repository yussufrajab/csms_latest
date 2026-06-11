/**
 * Fetch Empty-Cadre Employees Individually from HRIMS
 *
 * Reads the employee list from docs/empty-cadre-employees-by-institution-part1.md,
 * fetches each employee individually from HRIMS using RequestId 202 (by ZAN ID or
 * payroll number), and upserts the data into the database.
 *
 * Usage:
 *   npx tsx scripts/fetch-empty-cadre-individual.ts [options]
 *
 * Options:
 *   --file PATH        Markdown file to process (default: part1)
 *   --dry-run          Show what would be fetched without making API calls
 *   --vote XXX         Process only institution with this vote number
 *   --limit N          Process only first N employees
 *   --delay N          Delay between API calls in ms (default: 300)
 *   --skip-documents   Skip fetching documents and photos (faster)
 *   --use-payroll      Use payroll number instead of ZAN ID for HRIMS lookup
 *   --offset N         Skip first N employees (for resuming)
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Config from CLI args
// ---------------------------------------------------------------------------
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_DOCS = process.argv.includes('--skip-documents');
const USE_PAYROLL = process.argv.includes('--use-payroll');

function getArg(name: string, defaultVal: string = ''): string {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : defaultVal;
}

const VOTE_FILTER = getArg('--vote');
const LIMIT = parseInt(getArg('--limit', '0'), 10) || 0;
const DELAY = parseInt(getArg('--delay', '300'), 10);
const OFFSET = parseInt(getArg('--offset', '0'), 10);
const FILE_ARG = getArg('--file');

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Prisma client (direct, not via the app singleton)
// ---------------------------------------------------------------------------
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// HRIMS config — loaded from SystemSettings table, falls back to env vars
// ---------------------------------------------------------------------------
interface HrimsApiConfig {
  BASE_URL: string;
  API_KEY: string;
  TOKEN: string;
}

async function getHrimsApiConfig(): Promise<HrimsApiConfig> {
  const keys = ['hrims_host', 'hrims_port', 'hrims_api_key', 'hrims_token'];
  const settings = await prisma.systemSettings.findMany({
    where: { key: { in: keys } },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const host = map['hrims_host'] || process.env.HRIMS_HOST || '10.0.217.11';
  const port = map['hrims_port'] || process.env.HRIMS_PORT || '8135';
  const apiKey = map['hrims_api_key'] || process.env.HRIMS_API_KEY || '';
  const token = map['hrims_token'] || process.env.HRIMS_TOKEN || '';

  return {
    BASE_URL: `http://${host}:${port}/api`,
    API_KEY: apiKey,
    TOKEN: token,
  };
}

// ---------------------------------------------------------------------------
// Parse the markdown file
// ---------------------------------------------------------------------------
interface EmployeeEntry {
  name: string;
  zanId: string;
  payrollNumber: string;
  institutionName: string;
  voteNumber: string;
}

function parseMarkdownFile(filePath: string): EmployeeEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const employees: EmployeeEntry[] = [];
  let currentInstitution = '';
  let currentVote = '';
  let foundFirstInstitution = false;

  for (const line of lines) {
    // Match institution headers: ## WIZARA YA AFYA
    const instMatch = line.match(/^## (.+)$/);
    if (instMatch) {
      currentInstitution = instMatch[1].trim();
      foundFirstInstitution = true;
      continue;
    }

    // Skip everything before the first institution header (summary table, etc.)
    if (!foundFirstInstitution) continue;

    // Match vote info: **Vote:** 008 | **TIN:** 101817180 | **Empty Cadre Count:** 449
    const voteMatch = line.match(/\*\*Vote:\*\*\s*([^\s|]+)/);
    if (voteMatch) {
      currentVote = voteMatch[1].trim();
      continue;
    }

    // Match employee rows: | 1 | Abdalla Hamad Abdalla | 030294596 | 587651 |
    // The zanId and payrollNumber must be numeric strings
    const empMatch = line.match(
      /^\|\s*\d+\s*\|\s*(.+?)\s*\|\s*(\d{5,})\s*\|\s*(\d{4,})\s*\|/
    );
    if (empMatch && currentInstitution) {
      employees.push({
        name: empMatch[1].trim(),
        zanId: empMatch[2].trim(),
        payrollNumber: empMatch[3].trim(),
        institutionName: currentInstitution,
        voteNumber: currentVote,
      });
    }
  }

  return employees;
}

// ---------------------------------------------------------------------------
// HRIMS API call — RequestId 202 (single employee by zanId or payroll)
// ---------------------------------------------------------------------------
async function fetchEmployeeFromHRIMS(
  identifier: string,
  hrimsConfig: HrimsApiConfig
): Promise<any> {
  const response = await axios.post(
    `${hrimsConfig.BASE_URL}/Employees`,
    {
      RequestId: '202',
      RequestPayloadData: {
        RequestBody: identifier,
      },
    },
    {
      headers: {
        ApiKey: hrimsConfig.API_KEY,
        Token: hrimsConfig.TOKEN,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Fetch photo (RequestId 203)
// ---------------------------------------------------------------------------
async function fetchPhoto(
  payrollNumber: string,
  hrimsConfig: HrimsApiConfig
): Promise<string | null> {
  try {
    const response = await axios.post(
      `${hrimsConfig.BASE_URL}/Employees`,
      {
        RequestId: '203',
        SearchCriteria: payrollNumber,
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

    const photoData = response.data;
    let photoBase64: string | null = null;

    if (photoData.data && typeof photoData.data === 'string') {
      photoBase64 = photoData.data;
    } else if (photoData.photo?.content) {
      photoBase64 = photoData.photo.content;
    } else if (photoData.data?.photo?.content) {
      photoBase64 = photoData.data.photo.content;
    } else if (photoData.data?.Picture) {
      photoBase64 = photoData.data.Picture;
    } else if (photoData.Picture) {
      photoBase64 = photoData.Picture;
    }

    return photoBase64;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fetch document (RequestId 206)
// ---------------------------------------------------------------------------
async function fetchDocument(
  payrollNumber: string,
  docTypeCode: string,
  hrimsConfig: HrimsApiConfig
): Promise<Array<{ content?: string; attachmentContent?: string; attachmentType?: string }>> {
  try {
    const response = await axios.post(
      `${hrimsConfig.BASE_URL}/Employees`,
      {
        RequestId: '206',
        SearchCriteria: payrollNumber,
        RequestPayloadData: {
          RequestBody: docTypeCode,
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

    const data = response.data;
    if (data.code === 500 || data.status === 'Failure') return [];
    return Array.isArray(data.data) ? data.data : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Document type definitions
// ---------------------------------------------------------------------------
const DOCUMENT_TYPES = [
  { code: '2', name: 'Ardhilihal', dbField: 'ardhilHaliUrl' },
  { code: '3', name: 'Employment Contract', dbField: 'jobContractUrl' },
  { code: '4', name: 'Birth Certificate', dbField: 'birthCertificateUrl' },
  { code: '23', name: 'Confirmation Letter', dbField: 'confirmationLetterUrl' },
] as const;

// ---------------------------------------------------------------------------
// Save employee data to database (same logic as sync worker)
// ---------------------------------------------------------------------------
async function saveEmployeeFromDetailedData(
  hrimsData: any,
  institutionId: string
) {
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
    .filter((n) => n && n.trim())
    .join(' ');

  let gender = 'Male';
  if (personalInfo.genderName === 'Mwanamme') gender = 'Male';
  else if (personalInfo.genderName === 'Mwanamke') gender = 'Female';
  else if (personalInfo.genderName === 'Male' || personalInfo.genderName === 'Female')
    gender = personalInfo.genderName;

  const contactAddress =
    [personalInfo.houseNumber, personalInfo.street, personalInfo.city]
      .filter((p) => p && p.trim())
      .join(', ') || null;

  // Cadre: titlePrefixName + titleName + gradeName (same as sync worker)
  const cadre = currentEmployment
    ? [
        currentEmployment.titlePrefixName,
        currentEmployment.titleName,
        currentEmployment.gradeName,
      ]
        .filter((p) => p && p.trim())
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

  let retirementDate: Date | null = null;
  const activeContract = hrimsData.contractDetails?.find((c: any) => c.isActive);
  if (activeContract?.toDate && activeContract.toDate !== '1900-01-01T00:00:00') {
    retirementDate = new Date(activeContract.toDate);
  }

  const dbEmployeeData = {
    id: employeeId,
    name: fullName,
    gender,
    dateOfBirth: personalInfo.birthDate ? new Date(personalInfo.birthDate) : null,
    placeOfBirth: personalInfo.placeOfBirth,
    region:
      personalInfo.districtName ||
      personalInfo.birthRegionName ||
      personalInfo.regionName,
    countryOfBirth: personalInfo.birthCountryName,
    zanId: personalInfo.zanIdNumber,
    phoneNumber: personalInfo.primaryPhone || personalInfo.workPhone,
    contactAddress,
    zssfNumber: personalInfo.zssfNumber,
    payrollNumber: personalInfo.payrollNumber || '',
    cadre,
    salaryScale: currentSalary?.salaryScaleName,
    ministry: currentEmployment?.parentEntityName || currentEmployment?.entityName,
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
    retirementDate,
    status,
    institutionId,
    employeeEntityId: personalInfo.zanIdNumber,
    dataSource: 'HRIMS',
  };

  const { institutionId: _, ...createData } = dbEmployeeData;

  await prisma.employee.upsert({
    where: { zanId: personalInfo.zanIdNumber },
    update: dbEmployeeData,
    create: {
      ...createData,
      Institution: { connect: { id: institutionId } },
    },
  });

  return {
    employeeId,
    zanId: dbEmployeeData.zanId,
    name: dbEmployeeData.name,
    cadre: dbEmployeeData.cadre,
    status: dbEmployeeData.status,
    payrollNumber: dbEmployeeData.payrollNumber,
  };
}

// ---------------------------------------------------------------------------
// Process documents and photo for an employee
// ---------------------------------------------------------------------------
async function processDocumentsAndPhoto(
  employeeId: string,
  payrollNumber: string,
  hrimsConfig: HrimsApiConfig
): Promise<{ photoStored: boolean; docsStored: number }> {
  let photoStored = false;
  let docsStored = 0;

  // Photo
  if (payrollNumber) {
    const photoBase64 = await fetchPhoto(payrollNumber, hrimsConfig);
    if (photoBase64) {
      try {
        let base64Data = photoBase64;
        let mimeType = 'image/jpeg';
        if (photoBase64.startsWith('data:image')) {
          const matches = photoBase64.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            base64Data = matches[2];
          }
        }
        const extMap: Record<string, string> = {
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'image/gif': 'gif',
          'image/webp': 'webp',
        };
        const ext = extMap[mimeType.toLowerCase()] || 'jpg';

        // We store the base64 data URL directly as the profile image reference
        // (MinIO upload would require the minio client; store data URI for now)
        const dataUri = `data:${mimeType};base64,${base64Data}`;
        await prisma.employee.update({
          where: { id: employeeId },
          data: { profileImageUrl: dataUri },
        });
        photoStored = true;
      } catch {
        // silently skip photo errors
      }
    }
  }

  // Documents
  if (payrollNumber) {
    for (const docType of DOCUMENT_TYPES) {
      try {
        const attachments = await fetchDocument(payrollNumber, docType.code, hrimsConfig);
        if (attachments.length === 0) continue;

        const doc = attachments[0];
        const docContent = doc.content || doc.attachmentContent || '';
        if (!docContent) continue;

        let cleanBase64 = docContent;
        let mimeType = 'application/pdf';
        if (docContent.startsWith('data:')) {
          const matches = docContent.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            cleanBase64 = matches[2];
          }
        }

        // Store as data URI in the document URL field
        const dataUri = `data:${mimeType};base64,${cleanBase64}`;
        await prisma.employee.update({
          where: { id: employeeId },
          data: { [docType.dbField]: dataUri },
        });
        docsStored++;
      } catch {
        // silently skip doc errors
      }
    }
  }

  return { photoStored, docsStored };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== Fetch Empty-Cadre Employees Individually from HRIMS ===\n');
  console.log(`Mode:          ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Use payroll:   ${USE_PAYROLL}`);
  console.log(`Skip docs:     ${SKIP_DOCS}`);
  console.log(`Vote filter:   ${VOTE_FILTER || 'none'}`);
  console.log(`Offset:        ${OFFSET}`);
  console.log(`Limit:         ${LIMIT || 'none'}`);
  console.log(`Delay:         ${DELAY}ms\n`);

  // Step 1: Load HRIMS config
  console.log('Step 1: Loading HRIMS API config...');
  const hrimsConfig = await getHrimsApiConfig();
  console.log(`  API Base URL: ${hrimsConfig.BASE_URL}`);
  console.log(`  API Key:      ${hrimsConfig.API_KEY ? '****' + hrimsConfig.API_KEY.slice(-4) : '(empty)'}`);
  console.log(`  Token:        ${hrimsConfig.TOKEN ? '****' + hrimsConfig.TOKEN.slice(-4) : '(empty)'}\n`);

  // Step 2: Parse the markdown file
  const mdPath = FILE_ARG
    ? path.resolve(FILE_ARG)
    : path.resolve(__dirname, '../docs/empty-cadre-employees-by-institution-part1.md');
  console.log(`Step 2: Parsing ${mdPath}...`);

  if (!fs.existsSync(mdPath)) {
    console.error(`ERROR: File not found: ${mdPath}`);
    process.exit(1);
  }

  let employees = parseMarkdownFile(mdPath);
  console.log(`  Found ${employees.length} employees in markdown file\n`);

  // Apply vote filter
  if (VOTE_FILTER) {
    employees = employees.filter((e) => e.voteNumber === VOTE_FILTER);
    console.log(`  After vote filter (${VOTE_FILTER}): ${employees.length} employees\n`);
  }

  // Apply offset
  if (OFFSET > 0) {
    employees = employees.slice(OFFSET);
    console.log(`  After offset (${OFFSET}): ${employees.length} employees\n`);
  }

  // Apply limit
  if (LIMIT > 0) {
    employees = employees.slice(0, LIMIT);
    console.log(`  After limit (${LIMIT}): ${employees.length} employees\n`);
  }

  if (employees.length === 0) {
    console.log('No employees to process. Exiting.');
    await prisma.$disconnect();
    return;
  }

  // Step 3: Pre-resolve institutions
  console.log('Step 3: Resolving institutions...');
  const voteNumbers = Array.from(new Set(employees.map((e) => e.voteNumber).filter(Boolean)));
  const institutionMap = new Map<string, string>(); // voteNumber -> institutionId

  for (const vote of voteNumbers) {
    const inst = await prisma.institution.findFirst({
      where: { voteNumber: vote },
      select: { id: true, name: true },
    });
    if (inst) {
      institutionMap.set(vote, inst.id);
      console.log(`  Vote ${vote}: ${inst.name} -> ${inst.id}`);
    } else {
      console.log(`  Vote ${vote}: NOT FOUND IN DB`);
    }
  }
  console.log('');

  // Step 4: Fetch each employee
  console.log('Step 4: Fetching employees from HRIMS...\n');

  let success = 0;
  let failed = 0;
  let skipped = 0;
  let cadreFilled = 0;
  let cadreStillEmpty = 0;
  let docsTotal = 0;
  let photosTotal = 0;
  let prevInstitution = '';

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const progress = `[${i + 1}/${employees.length}]`;

    // Print institution header
    if (emp.institutionName !== prevInstitution) {
      console.log(`\n--- ${emp.institutionName} (vote: ${emp.voteNumber}) ---`);
      prevInstitution = emp.institutionName;
    }

    // Resolve institution
    const institutionId = institutionMap.get(emp.voteNumber);
    if (!institutionId) {
      console.log(`  ${progress} SKIP: ${emp.name} (${emp.zanId}) — institution not found for vote ${emp.voteNumber}`);
      skipped++;
      continue;
    }

    // Choose identifier
    const identifier = USE_PAYROLL ? emp.payrollNumber : emp.zanId;
    const idLabel = USE_PAYROLL ? 'payroll' : 'zanId';

    if (DRY_RUN) {
      console.log(
        `  ${progress} WOULD FETCH: ${emp.name} (${idLabel}=${identifier}, payroll=${emp.payrollNumber})`
      );
      success++;
      continue;
    }

    try {
      // Fetch from HRIMS
      const response = await fetchEmployeeFromHRIMS(identifier, hrimsConfig);

      if (response.code !== 200 || !response.data?.personalInfo) {
        // If zanId failed, retry with payroll number
        if (!USE_PAYROLL && emp.payrollNumber) {
          const retryResponse = await fetchEmployeeFromHRIMS(emp.payrollNumber, hrimsConfig);
          if (retryResponse.code === 200 && retryResponse.data?.personalInfo) {
            const result = await saveEmployeeFromDetailedData(retryResponse.data, institutionId);
            if (result) {
              const cadreDisplay = result.cadre || '(empty)';
              if (result.cadre && result.cadre.trim()) cadreFilled++;
              else cadreStillEmpty++;

              // Fetch docs/photos unless skipped
              let docInfo = '';
              if (!SKIP_DOCS && result.payrollNumber) {
                const { photoStored, docsStored } = await processDocumentsAndPhoto(
                  result.employeeId,
                  result.payrollNumber,
                  hrimsConfig
                );
                docInfo = ` | photo=${photoStored ? 'Y' : 'N'} docs=${docsStored}`;
                if (photoStored) photosTotal++;
                docsTotal += docsStored;
              }

              console.log(
                `  ${progress} OK (retry payroll): ${emp.name} (${emp.zanId}) -> cadre="${cadreDisplay}" status=${result.status}${docInfo}`
              );
              success++;
              await sleep(DELAY);
              continue;
            }
          }
        }

        console.log(
          `  ${progress} NOT FOUND: ${emp.name} (${emp.zanId}) — ${response.message || 'no data in HRIMS'}`
        );
        failed++;
        await sleep(DELAY);
        continue;
      }

      // Save to database
      const result = await saveEmployeeFromDetailedData(response.data, institutionId);

      if (result) {
        const cadreDisplay = result.cadre || '(empty)';
        if (result.cadre && result.cadre.trim()) cadreFilled++;
        else cadreStillEmpty++;

        // Fetch docs/photos unless skipped
        let docInfo = '';
        if (!SKIP_DOCS && result.payrollNumber) {
          const { photoStored, docsStored } = await processDocumentsAndPhoto(
            result.employeeId,
            result.payrollNumber,
            hrimsConfig
          );
          docInfo = ` | photo=${photoStored ? 'Y' : 'N'} docs=${docsStored}`;
          if (photoStored) photosTotal++;
          docsTotal += docsStored;
        }

        console.log(
          `  ${progress} OK: ${emp.name} (${emp.zanId}) -> cadre="${cadreDisplay}" status=${result.status}${docInfo}`
        );
        success++;
      } else {
        console.log(
          `  ${progress} SKIP: ${emp.name} (${emp.zanId}) — no zanId in HRIMS response`
        );
        skipped++;
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || error?.message || 'Unknown error';
      console.log(`  ${progress} FAIL: ${emp.name} (${emp.zanId}) — ${msg}`);
      failed++;
    }

    await sleep(DELAY);
  }

  // Step 5: Summary
  console.log('\n\n=== Summary ===');
  console.log(`Total employees in file: ${employees.length}`);
  console.log(`Processed:               ${success + failed + skipped}`);
  console.log(`Success:                 ${success}`);
  console.log(`Failed:                  ${failed}`);
  console.log(`Skipped:                 ${skipped}`);
  console.log(`Cadre filled:            ${cadreFilled}`);
  console.log(`Cadre still empty:       ${cadreStillEmpty}`);
  if (!SKIP_DOCS) {
    console.log(`Photos stored:           ${photosTotal}`);
    console.log(`Documents stored:        ${docsTotal}`);
  }

  // Verify DB state
  if (!DRY_RUN) {
    const totalEmployees = await prisma.employee.count();
    const emptyCadre = await prisma.employee.count({
      where: { OR: [{ cadre: null }, { cadre: '' }] },
    });
    console.log(`\nDB total employees:      ${totalEmployees}`);
    console.log(`DB empty cadre:          ${emptyCadre}`);
  }

  await prisma.$disconnect();
  console.log('\nDone.');
}

main().catch((error) => {
  console.error('Script failed:', error);
  prisma.$disconnect().catch(() => {});
  process.exit(1);
});
