import { db } from '@/lib/db';

const USER_ID = 'cme471pqo00032bidhttxmboj'; // yhzubeir
const INSTITUTION_ID = 'cmd06nn7u0003e67wa4hiyie7'; // WIZARA YA AFYA

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

async function getEmployees(): Promise<any[]> {
  const employees = await db.employee.findMany({
    where: { institutionId: INSTITUTION_ID },
    select: { id: true, name: true, status: true, cadre: true, employmentDate: true, retirementDate: true },
    take: 200,
  });
  return employees;
}

async function main() {
  console.log('=== Fetching Employees for WIZARA YA AFYA ===');
  const allEmployees = await getEmployees();
  console.log(`Found ${allEmployees.length} employees`);

  if (allEmployees.length === 0) {
    console.error('No employees found! Exiting.');
    return;
  }

  // Filter employees by status for different request types
  const activeEmployees = allEmployees.filter(e => 
    ['Confirmed', 'On Probation', undefined, null].includes(e.status)
  );
  
  const probationalEmployees = allEmployees.filter(e => 
    e.status === 'On Probation' || !e.status
  );

  console.log(`Active employees: ${activeEmployees.length}`);
  console.log(`Probational employees: ${probationalEmployees.length}`);

  // ============================
  // 1. PROMOTION REQUESTS (20)
  // ============================
  console.log('\n=== Creating Promotion Requests ===');
  let promotionCount = 0;
  for (const emp of activeEmployees.slice(0, 20)) {
    try {
      const promoType = randomItem(PROMOTION_TYPES);
      await db.promotionRequest.create({
        data: {
          id: require('uuid').v4(),
          employeeId: emp.id,
          submittedById: USER_ID,
          proposedCadre: randomItem(CADRES.filter(c => c !== emp.cadre)),
          promotionType: promoType,
          studiedOutsideCountry: Math.random() > 0.7,
          status: 'Pending HRRP Review',
          reviewStage: 'initial',
          documents: [],
          updatedAt: new Date(),
        },
      });
      promotionCount++;
      console.log(`  ✓ Promotion request #${promotionCount} for ${emp.name}`);
    } catch (err: any) {
      console.log(`  ✗ Failed for ${emp.name}: ${err.message}`);
    }
  }

  // ============================
  // 2. CONFIRMATION REQUESTS (20)
  // ============================
  console.log('\n=== Creating Confirmation Requests ===');
  let confirmationCount = 0;
  for (const emp of allEmployees.slice(0, 20)) {
    try {
      await db.confirmationRequest.create({
        data: {
          id: require('uuid').v4(),
          employeeId: emp.id,
          submittedById: USER_ID,
          status: 'Pending HRRP Review',
          reviewStage: 'initial',
          documents: [],
          updatedAt: new Date(),
        },
      });
      confirmationCount++;
      console.log(`  ✓ Confirmation request #${confirmationCount} for ${emp.name}`);
    } catch (err: any) {
      console.log(`  ✗ Failed for ${emp.name}: ${err.message}`);
    }
  }

  // ============================
  // 3. RETIREMENT REQUESTS (20)
  // ============================
  console.log('\n=== Creating Retirement Requests ===');
  let retirementCount = 0;
  for (const emp of allEmployees.slice(0, 20)) {
    try {
      const retType = randomItem(RETIREMENT_TYPES);
      await db.retirementRequest.create({
        data: {
          id: require('uuid').v4(),
          employeeId: emp.id,
          submittedById: USER_ID,
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
      retirementCount++;
      console.log(`  ✓ Retirement request #${retirementCount} for ${emp.name}`);
    } catch (err: any) {
      console.log(`  ✗ Failed for ${emp.name}: ${err.message}`);
    }
  }

  // ============================
  // 4. RESIGNATION REQUESTS (20)
  // ============================
  console.log('\n=== Creating Resignation Requests ===');
  let resignationCount = 0;
  for (const emp of activeEmployees.slice(0, 20)) {
    try {
      await db.resignationRequest.create({
        data: {
          id: require('uuid').v4(),
          employeeId: emp.id,
          submittedById: USER_ID,
          effectiveDate: futureDate(90),
          reason: randomItem([
            'Personal reasons',
            'Pursuing further studies',
            'Family obligations',
            'Health concerns',
            'Career change opportunity',
            'Relocation to another region',
          ]),
          status: 'Pending HRRP Review',
          reviewStage: 'initial',
          documents: [],
          updatedAt: new Date(),
        },
      });
      resignationCount++;
      console.log(`  ✓ Resignation request #${resignationCount} for ${emp.name}`);
    } catch (err: any) {
      console.log(`  ✗ Failed for ${emp.name}: ${err.message}`);
    }
  }

  // ============================
  // 5. CADRE CHANGE REQUESTS (20)
  // ============================
  console.log('\n=== Creating Cadre Change Requests ===');
  let cadreChangeCount = 0;
  for (const emp of activeEmployees.slice(0, 20)) {
    try {
      await db.cadreChangeRequest.create({
        data: {
          id: require('uuid').v4(),
          employeeId: emp.id,
          submittedById: USER_ID,
          originalCadre: emp.cadre || 'Unknown',
          newCadre: randomItem(CADRES.filter(c => c !== emp.cadre)),
          reason: randomItem([
            'Qualification upgrade',
            'Reclassification of position',
            'Organizational restructuring',
            'Performance-based promotion',
            'Special skills identification',
          ]),
          studiedOutsideCountry: Math.random() > 0.7,
          status: 'Pending HRRP Review',
          reviewStage: 'initial',
          documents: [],
          updatedAt: new Date(),
        },
      });
      cadreChangeCount++;
      console.log(`  ✓ Cadre Change request #${cadreChangeCount} for ${emp.name}`);
    } catch (err: any) {
      console.log(`  ✗ Failed for ${emp.name}: ${err.message}`);
    }
  }

  // ============================
  // 6. LWOP REQUESTS (20)
  // ============================
  console.log('\n=== Creating LWOP Requests ===');
  let lwopCount = 0;
  for (const emp of activeEmployees.slice(0, 20)) {
    try {
      const duration = randomItem(LWOP_DURATIONS);
      const startDate = futureDate(30);
      const endDate = new Date(startDate);
      const months = parseInt(duration.match(/\d+/)?.[0] || '1');
      endDate.setMonth(endDate.getMonth() + months);

      await db.lwopRequest.create({
        data: {
          id: require('uuid').v4(),
          employeeId: emp.id,
          submittedById: USER_ID,
          startDate,
          endDate,
          duration,
          reason: randomItem([
            'Medical treatment',
            'Further studies abroad',
            'Family emergency',
            'Personal development',
            'Maternity/Paternity leave additional',
            'Religious pilgrimage',
          ]),
          status: 'Pending HRRP Review',
          reviewStage: 'initial',
          documents: [],
          updatedAt: new Date(),
        },
      });
      lwopCount++;
      console.log(`  ✓ LWOP request #${lwopCount} for ${emp.name}`);
    } catch (err: any) {
      console.log(`  ✗ Failed for ${emp.name}: ${err.message}`);
    }
  }

  // ============================
  // 7. SERVICE EXTENSION REQUESTS (20)
  // ============================
  console.log('\n=== Creating Service Extension Requests ===');
  let seCount = 0;
  for (const emp of allEmployees.slice(0, 20)) {
    try {
      const retDate = emp.retirementDate || futureDate(180);
      await db.serviceExtensionRequest.create({
        data: {
          id: require('uuid').v4(),
          employeeId: emp.id,
          submittedById: USER_ID,
          currentRetirementDate: retDate,
          requestedExtensionPeriod: randomItem(EXTENSION_PERIODS),
          justification: randomItem([
            'Critical skills shortage in the department',
            'Pending project completion',
            'Knowledge transfer to successor',
            'Exceptional performance record',
            'Lack of qualified replacement',
          ]),
          status: 'Pending HRRP Review',
          reviewStage: 'initial',
          documents: [],
          updatedAt: new Date(),
        },
      });
      seCount++;
      console.log(`  ✓ Service Extension request #${seCount} for ${emp.name}`);
    } catch (err: any) {
      console.log(`  ✗ Failed for ${emp.name}: ${err.message}`);
    }
  }

  // ============================
  // 8. TERMINATION REQUESTS (20)
  // ============================
  console.log('\n=== Creating Termination Requests ===');
  let terminationCount = 0;
  for (const emp of allEmployees.slice(0, 20)) {
    try {
      await db.separationRequest.create({
        data: {
          id: require('uuid').v4(),
          employeeId: emp.id,
          submittedById: USER_ID,
          type: 'TERMINATION',
          reason: randomItem([
            'Poor performance',
            'Breach of contract terms',
            'Reorganization of department',
            'Medical incapacity',
            'Unsuitability for continued service',
          ]),
          status: 'Pending HRRP Review',
          reviewStage: 'initial',
          documents: [],
          updatedAt: new Date(),
        },
      });
      terminationCount++;
      console.log(`  ✓ Termination request #${terminationCount} for ${emp.name}`);
    } catch (err: any) {
      console.log(`  ✗ Failed for ${emp.name}: ${err.message}`);
    }
  }

  // ============================
  // 9. DISMISSAL REQUESTS (20)
  // ============================
  console.log('\n=== Creating Dismissal Requests ===');
  let dismissalCount = 0;
  for (const emp of allEmployees.slice(0, 20)) {
    try {
      await db.separationRequest.create({
        data: {
          id: require('uuid').v4(),
          employeeId: emp.id,
          submittedById: USER_ID,
          type: 'DISMISSAL',
          reason: randomItem([
            'Gross misconduct',
            'Fraudulent activities',
            'Insubordination',
            'Absence without leave',
            'Misappropriation of public funds',
            'Criminal conviction',
          ]),
          status: 'Pending HRRP Review',
          reviewStage: 'initial',
          documents: [],
          updatedAt: new Date(),
        },
      });
      dismissalCount++;
      console.log(`  ✓ Dismissal request #${dismissalCount} for ${emp.name}`);
    } catch (err: any) {
      console.log(`  ✗ Failed for ${emp.name}: ${err.message}`);
    }
  }

  // ============================
  // 10. COMPLAINTS (20) - Using employee as complainants
  // ============================
  console.log('\n=== Creating Complaints ===');
  let complaintCount = 0;
  // Find employee-linked users or use the HRO user as complainant
  const complainants = [USER_ID];
  const empUsers = await db.user.findMany({
    where: { 
      institutionId: INSTITUTION_ID,
      role: { in: ['EMPLOYEE', 'HRO'] },
    },
    select: { id: true },
    take: 10,
  });
  empUsers.forEach(u => {
    if (!complainants.includes(u.id)) complainants.push(u.id);
  });

  for (let i = 0; i < 20; i++) {
    try {
      const emp = allEmployees[i % allEmployees.length];
      await db.complaint.create({
        data: {
          id: require('uuid').v4(),
          complaintType: randomItem(COMPLAINT_TYPES),
          subject: randomItem([
            'Unfair performance evaluation',
            'Delayed salary payment',
            'Workplace harassment complaint',
            'Incorrect cadre classification',
            'Denied leave application',
            'Unfair disciplinary action',
            'Missing benefits',
            'Hostile work environment',
          ]),
          details: `I am writing to formally lodge a complaint regarding ${randomItem([
            'the unfair treatment I have been receiving at my workplace.',
            'the delayed processing of my entitled benefits.',
            'the hostile work environment created by my supervisor.',
            'the incorrect classification of my position.',
            'the denial of my statutory rights.',
          ])} This matter requires urgent attention as it affects my wellbeing and ability to perform my duties effectively. I request a thorough investigation into this matter and appropriate action to be taken.`,
          complainantPhoneNumber: '+255' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
          nextOfKinPhoneNumber: '+255' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
          attachments: [],
          status: 'Submitted',
          reviewStage: 'initial',
          assignedOfficerRole: 'DO',
          complainantId: randomItem(complainants),
          updatedAt: new Date(),
        },
      });
      complaintCount++;
      console.log(`  ✓ Complaint #${complaintCount} by ${emp.name}`);
    } catch (err: any) {
      console.log(`  ✗ Failed: ${err.message}`);
    }
  }

  // Summary
  console.log('\n========================================');
  console.log('=== SEEDING SUMMARY ===');
  console.log(`Promotion Requests:       ${promotionCount}/20`);
  console.log(`Confirmation Requests:    ${confirmationCount}/20`);
  console.log(`Retirement Requests:      ${retirementCount}/20`);
  console.log(`Resignation Requests:     ${resignationCount}/20`);
  console.log(`Cadre Change Requests:    ${cadreChangeCount}/20`);
  console.log(`LWOP Requests:            ${lwopCount}/20`);
  console.log(`Service Extension Req:    ${seCount}/20`);
  console.log(`Termination Requests:     ${terminationCount}/20`);
  console.log(`Dismissal Requests:       ${dismissalCount}/20`);
  console.log(`Complaints:               ${complaintCount}/20`);
  console.log('========================================');
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
