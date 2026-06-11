/**
 * Cleanup script to delete orphan employee records that were left behind
 * after the HRIMS re-fetch scripts failed to repopulate data.
 *
 * Orphan employees are identified by:
 * - Empty name AND empty gender (cleared by refetch script)
 * - All critical data fields null/empty: cadre, currentWorkplace, payrollNumber, status
 * - No related HR requests, no linked User accounts
 *
 * This script will:
 * 1. Find all orphan employees
 * 2. Safety check: ensure no related HR requests or User accounts
 * 3. Delete their EmployeeCertificate records
 * 4. Collect MinIO file references for cleanup
 * 5. Delete the employee records
 * 6. Report statistics
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

// Use raw SQL to find orphans since Prisma Client filter syntax is problematic with null/empty mix
async function getOrphanIds(): Promise<string[]> {
  const result = await prisma.$queryRaw<Array<{id: string}>>`
    SELECT id FROM "Employee"
    WHERE (name = '' OR name IS NULL)
      AND (gender = '' OR gender IS NULL)
      AND (cadre = '' OR cadre IS NULL)
      AND ("currentWorkplace" = '' OR "currentWorkplace" IS NULL)
      AND ("payrollNumber" = '' OR "payrollNumber" IS NULL)
      AND (status = '' OR status IS NULL)
  `;
  return result.map(r => r.id);
}

async function main() {
  console.log('=== Orphan Employee Cleanup Script ===\n');

  // Step 1: Find all orphan employee IDs
  console.log('Step 1: Finding orphan employees...');
  const orphanIds = await getOrphanIds();
  console.log(`Found ${orphanIds.length} orphan employees\n`);

  if (orphanIds.length === 0) {
    console.log('No orphan employees found. Exiting.');
    await prisma.$disconnect();
    return;
  }

  // Print sample orphans using Prisma client
  const sampleOrphans = await prisma.employee.findMany({
    where: { id: { in: orphanIds.slice(0, 5) } },
    select: {
      zanId: true,
      Institution: { select: { name: true } },
      EmployeeCertificate: { select: { id: true } },
    },
  });
  console.log('Sample orphan employees:');
  for (const o of sampleOrphans) {
    console.log(`  zanId=${o.zanId}, institution=${o.Institution?.name}, certificates=${o.EmployeeCertificate.length}`);
  }
  console.log('');

  // Step 2: Safety check - ensure no orphans have related HR requests or User accounts
  console.log('Step 2: Safety check for related records...');

  const usersLinked = await prisma.user.count({
    where: { employeeId: { in: orphanIds } },
  });

  const promotionRequests = await prisma.promotionRequest.count({
    where: { employeeId: { in: orphanIds } },
  });

  const confirmationRequests = await prisma.confirmationRequest.count({
    where: { employeeId: { in: orphanIds } },
  });

  const lwopRequests = await prisma.lwopRequest.count({
    where: { employeeId: { in: orphanIds } },
  });

  const separationRequests = await prisma.separationRequest.count({
    where: { employeeId: { in: orphanIds } },
  });

  const retirementRequests = await prisma.retirementRequest.count({
    where: { employeeId: { in: orphanIds } },
  });

  const resignationRequests = await prisma.resignationRequest.count({
    where: { employeeId: { in: orphanIds } },
  });

  const serviceExtensionRequests = await prisma.serviceExtensionRequest.count({
    where: { employeeId: { in: orphanIds } },
  });

  const cadreChangeRequests = await prisma.cadreChangeRequest.count({
    where: { employeeId: { in: orphanIds } },
  });

  const totalRelated = usersLinked + promotionRequests + confirmationRequests +
    lwopRequests + separationRequests + retirementRequests + resignationRequests +
    serviceExtensionRequests + cadreChangeRequests;

  console.log(`  - Linked Users: ${usersLinked}`);
  console.log(`  - Promotion Requests: ${promotionRequests}`);
  console.log(`  - Confirmation Requests: ${confirmationRequests}`);
  console.log(`  - LWOP Requests: ${lwopRequests}`);
  console.log(`  - Separation Requests: ${separationRequests}`);
  console.log(`  - Retirement Requests: ${retirementRequests}`);
  console.log(`  - Resignation Requests: ${resignationRequests}`);
  console.log(`  - Service Extension Requests: ${serviceExtensionRequests}`);
  console.log(`  - Cadre Change Requests: ${cadreChangeRequests}`);
  console.log(`  Total related records: ${totalRelated}\n`);

  if (totalRelated > 0) {
    console.error('ABORTING: Orphan employees have related records! Manual review required.');
    await prisma.$disconnect();
    process.exit(1);
  }

  // Step 3: Collect MinIO file URLs for cleanup
  console.log('Step 3: Collecting MinIO file references...');
  const orphanRecords = await prisma.employee.findMany({
    where: { id: { in: orphanIds } },
    select: {
      id: true,
      profileImageUrl: true,
      ardhilHaliUrl: true,
      jobContractUrl: true,
      birthCertificateUrl: true,
      confirmationLetterUrl: true,
      EmployeeCertificate: {
        select: { id: true, url: true },
      },
    },
  });

  const minioFiles: string[] = [];

  for (const orphan of orphanRecords) {
    if (orphan.profileImageUrl) minioFiles.push(orphan.profileImageUrl);
    if (orphan.ardhilHaliUrl) minioFiles.push(orphan.ardhilHaliUrl);
    if (orphan.jobContractUrl) minioFiles.push(orphan.jobContractUrl);
    if (orphan.birthCertificateUrl) minioFiles.push(orphan.birthCertificateUrl);
    if (orphan.confirmationLetterUrl) minioFiles.push(orphan.confirmationLetterUrl);
    for (const cert of orphan.EmployeeCertificate) {
      if (cert.url) minioFiles.push(cert.url);
    }
  }

  console.log(`  Found ${minioFiles.length} MinIO file references\n`);

  // Step 4: Delete EmployeeCertificate records
  console.log('Step 4: Deleting EmployeeCertificate records...');
  const certDeleteResult = await prisma.employeeCertificate.deleteMany({
    where: { employeeId: { in: orphanIds } },
  });
  console.log(`  Deleted ${certDeleteResult.count} certificate records\n`);

  // Step 5: Unlink any employees from User records (set employeeId = null)
  // This is a safety measure even though we checked for linked users above
  console.log('Step 5: Unlinking orphan employees from User records...');
  const unlinkResult = await prisma.user.updateMany({
    where: { employeeId: { in: orphanIds } },
    data: { employeeId: null },
  });
  console.log(`  Unlinked ${unlinkResult.count} user records\n`);

  // Step 6: Delete Employee records using raw SQL for reliable null/empty matching
  console.log('Step 6: Deleting orphan employee records...');
  const deleteResult = await prisma.$executeRaw`
    DELETE FROM "Employee"
    WHERE (name = '' OR name IS NULL)
      AND (gender = '' OR gender IS NULL)
      AND (cadre = '' OR cadre IS NULL)
      AND ("currentWorkplace" = '' OR "currentWorkplace" IS NULL)
      AND ("payrollNumber" = '' OR "payrollNumber" IS NULL)
      AND (status = '' OR status IS NULL)
  `;
  console.log(`  Deleted ${deleteResult} employee records\n`);

  // Step 7: Verify cleanup
  console.log('Step 7: Verifying cleanup...');
  const remainingOrphans = await getOrphanIds();
  const totalEmployees = await prisma.employee.count();
  console.log(`  Remaining orphan employees: ${remainingOrphans.length}`);
  console.log(`  Total employees in database: ${totalEmployees}\n`);

  // Save MinIO file list for cleanup
  if (minioFiles.length > 0) {
    const fileListPath = '/home/nextjstest/csms/scripts/orphan-minio-files.txt';
    fs.writeFileSync(fileListPath, minioFiles.join('\n'));
    console.log(`  MinIO file list saved to: ${fileListPath}`);
    console.log(`  Note: MinIO files need to be cleaned up separately using the file list.`);
    console.log(`  ${minioFiles.length} orphan file references saved.\n`);
  }

  // Summary
  console.log('=== Cleanup Summary ===');
  console.log(`Orphan employees found:     ${orphanIds.length}`);
  console.log(`Certificates deleted:        ${certDeleteResult.count}`);
  console.log(`Users unlinked:              ${unlinkResult.count}`);
  console.log(`Employees deleted:            ${deleteResult}`);
  console.log(`MinIO files to clean up:      ${minioFiles.length}`);
  console.log(`Remaining total employees:    ${totalEmployees}`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});