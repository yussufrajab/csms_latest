import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Fallback HRO user (yhzubeir - WIZARA YA AFYA) for institutions without their own HRO
const FALLBACK_HRO_ID = 'cme471pqo00032bidhttxmboj';

// Map known HRO users to their institutions
const HRO_BY_INSTITUTION: Record<string, string> = {
  'cmd059ion0000e6d85kexfukl': '69b8c30e-ffab-466c-8c86-6e6d1c1ff4ee', // TUME YA UTUMISHI SERIKALINI - Shuwekha
  'cmd06nn7u0003e67wa4hiyie7': 'cme471pqo00032bidhttxmboj', // WIZARA YA AFYA - yhzubeir
  'cmd4caf3852445c2568bc7c': 'af32eb80-1b18-4e38-b687-995c7677f708', // Baraza la Manispaa Magharibi A - khadija
  'cmd1545dfaf1f7a12e14814': '19a51f0c-57ea-4f42-b42a-faf5302785b6', // Baraza la Mitihani - Lela
  'cmdbcf753dfb9d0ae18259a': '914a6ddb-1bf0-4956-b46a-5ee2917cc4f1', // Baraza la Manispaa Magharibi B - naima
  'cmd06xe2h0007e6bqta680e3b': 'f965a775-0572-4469-aab3-ad1d0f7e2032', // KAMISHENI YA ARDHI ZANZIBAR - Harith
};

// Cadres used in the system for promotions
const CADRES = [
  'Afisa Utumishi II', 'Afisa Utumishi I', 'Afisa Utumishi Mwandamizi',
  'Afisa Fedha II', 'Afisa Fedha I', 'Afisa Fedha Mwandamizi',
  'Katibu Msaidizi', 'Katibu', 'Katibu Mwandamizi',
  'Mhasibu II', 'Mhasibu I', 'Mhasibu Mwandamizi',
  'Afisa Sera II', 'Afisa Sera I', 'Afisa Sera Mwandamizi',
  'Mkaguzi II', 'Mkaguzi I', 'Mkaguzi Mwandamizi',
  'Afisa Uchumi II', 'Afisa Uchumi I', 'Afisa Uchumi Mwandamizi',
];

const RETIREMENT_TYPES = ['compulsory', 'voluntary', 'illness'];
const PROMOTION_TYPES = ['Experience', 'EducationAdvancement'];
const LWOP_DURATIONS = ['1 Month', '2 Months', '3 Months', '6 Months', '1 Year'];
const EXTENSION_PERIODS = ['1 Year', '2 Years', '6 Months', '3 Years'];
const COMPLAINT_TYPES = ['Unfair Treatment', 'Harassment', 'Discrimination', 'Breach of Contract', 'Unpaid Dues', 'Other'];

const RESIGNATION_REASONS = [
  'Personal reasons',
  'Pursuing further studies',
  'Family obligations',
  'Health concerns',
  'Career change opportunity',
  'Relocation to another region',
];

const CADRE_CHANGE_REASONS = [
  'Qualification upgrade',
  'Reclassification of position',
  'Organizational restructuring',
  'Performance-based promotion',
  'Special skills identification',
];

const LWOP_REASONS = [
  'Medical treatment',
  'Further studies abroad',
  'Family emergency',
  'Personal development',
  'Maternity/Paternity leave additional',
  'Religious pilgrimage',
];

const SERVICE_EXTENSION_JUSTIFICATIONS = [
  'Critical skills shortage in the department',
  'Pending project completion',
  'Knowledge transfer to successor',
  'Exceptional performance record',
  'Lack of qualified replacement',
];

const TERMINATION_REASONS = [
  'Poor performance',
  'Breach of contract terms',
  'Reorganization of department',
  'Medical incapacity',
  'Unsuitability for continued service',
];

const DISMISSAL_REASONS = [
  'Gross misconduct',
  'Fraudulent activities',
  'Insubordination',
  'Absence without leave',
  'Misappropriation of public funds',
  'Criminal conviction',
];

const COMPLAINT_SUBJECTS = [
  'Unfair performance evaluation',
  'Delayed salary payment',
  'Workplace harassment complaint',
  'Incorrect cadre classification',
  'Denied leave application',
  'Unfair disciplinary action',
  'Missing benefits',
  'Hostile work environment',
];

const COMPLAINT_DETAILS = [
  'the unfair treatment I have been receiving at my workplace.',
  'the delayed processing of my entitled benefits.',
  'the hostile work environment created by my supervisor.',
  'the incorrect classification of my position.',
  'the denial of my statutory rights.',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number): Date {
  const today = new Date();
  const past = new Date(today);
  past.setDate(past.getDate() - Math.floor(Math.random() * daysBack));
  return past;
}

function futureDate(daysForward: number): Date {
  const today = new Date();
  const future = new Date(today);
  future.setDate(future.getDate() + Math.floor(Math.random() * daysForward));
  return future;
}

// Shuffle array to randomize employee selection
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface InstitutionInfo {
  id: string;
  name: string;
}

interface EmployeeBrief {
  id: string;
  name: string;
  status: string | null;
  cadre: string | null;
  retirementDate: Date | null;
}

async function seedInstitution(
  institution: InstitutionInfo,
  stats: Record<string, number>,
): Promise<void> {
  const hroId = HRO_BY_INSTITUTION[institution.id] || FALLBACK_HRO_ID;
  const isUsingFallback = !HRO_BY_INSTITUTION[institution.id];

  // Fetch employees for this institution
  const allEmployees = await db.employee.findMany({
    where: { institutionId: institution.id },
    select: { id: true, name: true, status: true, cadre: true, retirementDate: true },
  });

  if (allEmployees.length === 0) {
    console.log(`  ⚠ ${institution.name}: No employees found, skipping`);
    return;
  }

  // Categorize employees
  const activeEmployees = allEmployees.filter(e =>
    ['Confirmed', 'On Probation', undefined, null].includes(e.status)
  );

  // We need to use different employees for different request modules
  // Shuffle active employees for random distribution
  const shuffledActive = shuffle(activeEmployees.length > 0 ? activeEmployees : allEmployees);

  if (shuffledActive.length === 0) {
    console.log(`  ⚠ ${institution.name}: No eligible employees found, skipping`);
    return;
  }

  console.log(`\n--- ${institution.name} (${institution.id}) ---`);
  console.log(`  Employees: ${allEmployees.length}, Active: ${activeEmployees.length}`);
  if (isUsingFallback) {
    console.log(`  HRO: Using fallback HRO (yhzubeir) — no local HRO assigned`);
  }

  let empIndex = 0;
  const getNextEmployee = (): EmployeeBrief | null => {
    if (empIndex >= shuffledActive.length) {
      // Wrap around if we've used all unique employees
      empIndex = 0;
    }
    if (shuffledActive.length === 0) return null;
    const emp = shuffledActive[empIndex];
    empIndex++;
    return emp;
  };

  // Each module uses a different employee via getNextEmployee()
  const modulesToAttempt = [
    'promotion',
    'confirmation',
    'retirement',
    'resignation',
    'cadreChange',
    'lwop',
    'serviceExtension',
    'termination',
    'dismissal',
    'complaint',
  ] as const;

  for (const moduleName of modulesToAttempt) {
    const emp = getNextEmployee();
    if (!emp) break;

    try {
      switch (moduleName) {
        case 'promotion': {
          if (activeEmployees.length === 0) break; // only for active employees
          const promoType = randomItem(PROMOTION_TYPES);
          await db.promotionRequest.create({
            data: {
              id: uuidv4(),
              employeeId: emp.id,
              submittedById: hroId,
              proposedCadre: randomItem(CADRES.filter(c => c !== emp.cadre)),
              promotionType: promoType,
              studiedOutsideCountry: Math.random() > 0.7,
              status: 'Pending HRRP Review',
              reviewStage: 'initial',
              documents: [],
              updatedAt: new Date(),
            },
          });
          stats.promotion++;
          break;
        }

        case 'confirmation': {
          await db.confirmationRequest.create({
            data: {
              id: uuidv4(),
              employeeId: emp.id,
              submittedById: hroId,
              status: 'Pending HRRP Review',
              reviewStage: 'initial',
              documents: [],
              updatedAt: new Date(),
            },
          });
          stats.confirmation++;
          break;
        }

        case 'retirement': {
          const retType = randomItem(RETIREMENT_TYPES);
          await db.retirementRequest.create({
            data: {
              id: uuidv4(),
              employeeId: emp.id,
              submittedById: hroId,
              proposedDate: futureDate(365),
              retirementType: retType,
              illnessDescription: retType === 'illness' ? 'Chronic health condition requiring early retirement' : null,
              delayReason: Math.random() > 0.8 ? 'Administrative processing delay' : null,
              status: 'Pending HRRP Review',
              reviewStage: 'initial',
              documents: [],
              updatedAt: new Date(),
            },
          });
          stats.retirement++;
          break;
        }

        case 'resignation': {
          await db.resignationRequest.create({
            data: {
              id: uuidv4(),
              employeeId: emp.id,
              submittedById: hroId,
              effectiveDate: futureDate(90),
              reason: randomItem(RESIGNATION_REASONS),
              status: 'Pending HRRP Review',
              reviewStage: 'initial',
              documents: [],
              updatedAt: new Date(),
            },
          });
          stats.resignation++;
          break;
        }

        case 'cadreChange': {
          await db.cadreChangeRequest.create({
            data: {
              id: uuidv4(),
              employeeId: emp.id,
              submittedById: hroId,
              originalCadre: emp.cadre || 'Unknown',
              newCadre: randomItem(CADRES.filter(c => c !== emp.cadre)),
              reason: randomItem(CADRE_CHANGE_REASONS),
              studiedOutsideCountry: Math.random() > 0.7,
              status: 'Pending HRRP Review',
              reviewStage: 'initial',
              documents: [],
              updatedAt: new Date(),
            },
          });
          stats.cadreChange++;
          break;
        }

        case 'lwop': {
          const duration = randomItem(LWOP_DURATIONS);
          const startDate = futureDate(30);
          const endDate = new Date(startDate);
          const months = parseInt(duration.match(/\d+/)?.[0] || '1');
          endDate.setMonth(endDate.getMonth() + months);

          await db.lwopRequest.create({
            data: {
              id: uuidv4(),
              employeeId: emp.id,
              submittedById: hroId,
              startDate,
              endDate,
              duration,
              reason: randomItem(LWOP_REASONS),
              status: 'Pending HRRP Review',
              reviewStage: 'initial',
              documents: [],
              updatedAt: new Date(),
            },
          });
          stats.lwop++;
          break;
        }

        case 'serviceExtension': {
          const retDate = emp.retirementDate || futureDate(180);
          await db.serviceExtensionRequest.create({
            data: {
              id: uuidv4(),
              employeeId: emp.id,
              submittedById: hroId,
              currentRetirementDate: retDate,
              requestedExtensionPeriod: randomItem(EXTENSION_PERIODS),
              justification: randomItem(SERVICE_EXTENSION_JUSTIFICATIONS),
              status: 'Pending HRRP Review',
              reviewStage: 'initial',
              documents: [],
              updatedAt: new Date(),
            },
          });
          stats.serviceExtension++;
          break;
        }

        case 'termination': {
          await db.separationRequest.create({
            data: {
              id: uuidv4(),
              employeeId: emp.id,
              submittedById: hroId,
              type: 'TERMINATION',
              reason: randomItem(TERMINATION_REASONS),
              status: 'Pending HRRP Review',
              reviewStage: 'initial',
              documents: [],
              updatedAt: new Date(),
            },
          });
          stats.termination++;
          break;
        }

        case 'dismissal': {
          await db.separationRequest.create({
            data: {
              id: uuidv4(),
              employeeId: emp.id,
              submittedById: hroId,
              type: 'DISMISSAL',
              reason: randomItem(DISMISSAL_REASONS),
              status: 'Pending HRRP Review',
              reviewStage: 'initial',
              documents: [],
              updatedAt: new Date(),
            },
          });
          stats.dismissal++;
          break;
        }

        case 'complaint': {
          await db.complaint.create({
            data: {
              id: uuidv4(),
              complaintType: randomItem(COMPLAINT_TYPES),
              subject: randomItem(COMPLAINT_SUBJECTS),
              details: `I am writing to formally lodge a complaint regarding ${randomItem(COMPLAINT_DETAILS)} This matter requires urgent attention as it affects my wellbeing and ability to perform my duties effectively. I request a thorough investigation into this matter and appropriate action to be taken.`,
              complainantPhoneNumber: '+255' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
              nextOfKinPhoneNumber: '+255' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
              attachments: [],
              status: 'Submitted',
              reviewStage: 'initial',
              assignedOfficerRole: 'DO',
              complainantId: hroId,
              updatedAt: new Date(),
            },
          });
          stats.complaint++;
          break;
        }
      }
    } catch (err: any) {
      console.log(`  ✗ Failed to create ${moduleName} request for ${emp.name}: ${err.message}`);
    }
  }
}

async function main() {
  console.log('=== SEEDING REQUESTS FOR ALL INSTITUTIONS ===\n');

  // Fetch all institutions that have employees
  const institutions = await db.institution.findMany({
    where: {
      Employee: { some: {} },
    },
    select: { id: true, name: true },
  });

  console.log(`Found ${institutions.length} institutions with employees\n`);

  const stats: Record<string, number> = {
    promotion: 0,
    confirmation: 0,
    retirement: 0,
    resignation: 0,
    cadreChange: 0,
    lwop: 0,
    serviceExtension: 0,
    termination: 0,
    dismissal: 0,
    complaint: 0,
  };

  // Also delete existing requests that were seeded (optional — comment out to keep)
  // Uncomment the following lines if you want to start fresh:
  // console.log('Clearing existing seeded requests first...');
  // await db.promotionRequest.deleteMany({});
  // await db.confirmationRequest.deleteMany({});
  // await db.retirementRequest.deleteMany({});
  // await db.resignationRequest.deleteMany({});
  // await db.cadreChangeRequest.deleteMany({});
  // await db.lwopRequest.deleteMany({});
  // await db.serviceExtensionRequest.deleteMany({});
  // await db.separationRequest.deleteMany({});
  // await db.complaint.deleteMany({});

  for (const institution of institutions) {
    await seedInstitution(institution, stats);
  }

  // Summary
  const total =
    stats.promotion +
    stats.confirmation +
    stats.retirement +
    stats.resignation +
    stats.cadreChange +
    stats.lwop +
    stats.serviceExtension +
    stats.termination +
    stats.dismissal +
    stats.complaint;

  console.log('\n========================================');
  console.log('=== FINAL SEEDING SUMMARY ===');
  console.log(`Institutions processed:       ${institutions.length}`);
  console.log(`Promotion Requests:           ${stats.promotion}`);
  console.log(`Confirmation Requests:        ${stats.confirmation}`);
  console.log(`Retirement Requests:          ${stats.retirement}`);
  console.log(`Resignation Requests:         ${stats.resignation}`);
  console.log(`Cadre Change Requests:        ${stats.cadreChange}`);
  console.log(`LWOP Requests:                ${stats.lwop}`);
  console.log(`Service Extension Requests:   ${stats.serviceExtension}`);
  console.log(`Termination Requests:         ${stats.termination}`);
  console.log(`Dismissal Requests:           ${stats.dismissal}`);
  console.log(`Complaints:                   ${stats.complaint}`);
  console.log('----------------------------------------');
  console.log(`TOTAL REQUESTS CREATED:       ${total}`);
  console.log('========================================');
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
