import { db } from '@/lib/db';

const HRRP_USER_ID = 'cmd06nnbi000he67wz9doivi6'; // khamadi
const HRRP_ROLE = 'HRRP';

const APPROVED_STATUS = 'Approved by HRRP - Awaiting Commission Review';

// All module tables and their ID fields
const MODULES: { name: string; table: any; idField: string }[] = [
  { name: 'Promotion',       table: 'promotionRequest',       idField: 'id' },
  { name: 'Confirmation',    table: 'confirmationRequest',    idField: 'id' },
  { name: 'Retirement',      table: 'retirementRequest',      idField: 'id' },
  { name: 'Resignation',     table: 'resignationRequest',     idField: 'id' },
  { name: 'Cadre-Change',    table: 'cadreChangeRequest',     idField: 'id' },
  { name: 'LWOP',            table: 'lwopRequest',            idField: 'id' },
  { name: 'Service-Extension', table: 'serviceExtensionRequest', idField: 'id' },
  { name: 'Termination',     table: 'separationRequest',      idField: 'id' },
  { name: 'Dismissal',       table: 'separationRequest',      idField: 'id' },
];

async function forwardRequests(module: typeof MODULES[0]) {
  console.log(`\n=== Forwarding ${module.name} Requests ===`);

  // Build where clause
  const where: any = {
    status: 'Pending HRRP Review',
    reviewStage: 'initial',
  };

  // For termination/dismissal, filter by type
  if (module.name === 'Termination') {
    where.type = 'TERMINATION';
  }
  if (module.name === 'Dismissal') {
    where.type = 'DISMISSAL';
  }

  // Get all pending requests
  const requests = await (db as any)[module.table].findMany({
    where,
    include: { Employee: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${requests.length} pending ${module.name} requests`);

  let forwarded = 0;
  let failed = 0;

  for (const req of requests) {
    try {
      await (db as any)[module.table].update({
        where: { id: req.id },
        data: {
          status: APPROVED_STATUS,
          reviewStage: 'hrrp_review',
          hrrpReviewedById: HRRP_USER_ID,
          hrrpReviewedAt: new Date(),
        },
      });
      forwarded++;
      console.log(`  ✓ ${module.name} #${forwarded}: ${req.Employee?.name || req.id} forwarded`);
    } catch (err: any) {
      failed++;
      console.log(`  ✗ Failed ${req.id}: ${err.message}`);
    }
  }

  return { forwarded, failed };
}

async function main() {
  console.log('=== Forwarding Requests to Commission ===');
  console.log(`HRRP User: Khamis Hamadi (${HRRP_USER_ID})`);

  const results: Record<string, { forwarded: number; failed: number }> = {};

  for (const module of MODULES) {
    const result = await forwardRequests(module);
    results[module.name] = result;
  }

  // Summary
  console.log('\n========================================');
  console.log('=== FORWARDING SUMMARY ===');
  let totalForwarded = 0;
  let totalFailed = 0;
  for (const [name, result] of Object.entries(results)) {
    console.log(`${name.padEnd(20)}: ${result.forwarded} forwarded, ${result.failed} failed`);
    totalForwarded += result.forwarded;
    totalFailed += result.failed;
  }
  console.log('----------------------------------------');
  console.log(`TOTAL: ${totalForwarded} forwarded to commission, ${totalFailed} failed`);
  console.log('========================================');
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
