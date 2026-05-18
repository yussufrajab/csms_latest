/**
 * Script to delete all employees and their related data from a specific institution
 *
 * Usage:
 *   npx ts-node scripts/delete-institution-employees.ts
 *
 * The script will interactively ask for:
 *   - Institution name (partial match supported)
 *   - OR TIN number (exact match)
 *   - OR Vote code (exact match)
 */

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
type Institution = pkg.Institution;

import { Client as MinioClient } from 'minio';
import * as readline from 'readline';

const prisma = new PrismaClient();

// MinIO client configuration
const minioClient = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'documents';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Extract MinIO path from API URL
function extractMinioPath(url: string | null): string | null {
  if (!url) return null;

  // Handle /api/files/employee-photos/filename.jpg
  if (url.includes('/api/files/employee-photos/')) {
    return 'employee-photos/' + url.split('/api/files/employee-photos/')[1];
  }

  // Handle /api/files/employee-documents/filename.pdf
  if (url.includes('/api/files/employee-documents/')) {
    return 'employee-documents/' + url.split('/api/files/employee-documents/')[1];
  }

  return null;
}

async function deleteFileFromMinio(path: string): Promise<boolean> {
  try {
    await minioClient.removeObject(BUCKET_NAME, path);
    console.log(`  ✓ Deleted file: ${path}`);
    return true;
  } catch (error: any) {
    if (error.code === 'NoSuchKey' || error.code === 'NotFound') {
      console.log(`  - File not found (skipped): ${path}`);
      return true;
    }
    console.error(`  ✗ Failed to delete file: ${path}`, error.message);
    return false;
  }
}

async function findInstitution(): Promise<Institution | null> {
  console.log('\n' + '='.repeat(80));
  console.log('DELETE ALL EMPLOYEES FROM INSTITUTION');
  console.log('='.repeat(80));
  console.log('\nSearch for institution by:');
  console.log('  1. Institution Name (partial match)');
  console.log('  2. TIN Number (exact match)');
  console.log('  3. Vote Code (exact match)');
  console.log('');

  const searchType = await askQuestion('Enter search type (1/2/3): ');

  let institutions: Institution[] = [];

  switch (searchType) {
    case '1':
      const name = await askQuestion('Enter institution name (or part of it): ');
      if (!name) {
        console.log('Name cannot be empty.');
        return null;
      }
      institutions = await prisma.institution.findMany({
        where: {
          name: {
            contains: name,
            mode: 'insensitive',
          },
        },
      });
      break;

    case '2':
      const tinNumber = await askQuestion('Enter TIN number: ');
      if (!tinNumber) {
        console.log('TIN number cannot be empty.');
        return null;
      }
      const instByTin = await prisma.institution.findFirst({
        where: { tinNumber },
      });
      if (instByTin) institutions = [instByTin];
      break;

    case '3':
      const voteNumber = await askQuestion('Enter Vote code: ');
      if (!voteNumber) {
        console.log('Vote code cannot be empty.');
        return null;
      }
      const instByVote = await prisma.institution.findFirst({
        where: { voteNumber },
      });
      if (instByVote) institutions = [instByVote];
      break;

    default:
      console.log('Invalid option. Please enter 1, 2, or 3.');
      return null;
  }

  if (institutions.length === 0) {
    console.log('\n❌ No institution found matching your search.');
    return null;
  }

  if (institutions.length === 1) {
    return institutions[0];
  }

  // Multiple matches - let user select
  console.log(`\n📋 Found ${institutions.length} matching institutions:\n`);
  institutions.forEach((inst, index) => {
    console.log(`  ${index + 1}. ${inst.name}`);
    console.log(`     TIN: ${inst.tinNumber || 'N/A'} | Vote: ${inst.voteNumber || 'N/A'}`);
    console.log('');
  });

  const selection = await askQuestion(`Select institution (1-${institutions.length}): `);
  const selectedIndex = parseInt(selection) - 1;

  if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= institutions.length) {
    console.log('Invalid selection.');
    return null;
  }

  return institutions[selectedIndex];
}

async function deleteEmployeesFromInstitution(institution: Institution) {
  console.log('\n' + '='.repeat(80));
  console.log('INSTITUTION DETAILS');
  console.log('='.repeat(80));
  console.log(`Name: ${institution.name}`);
  console.log(`ID: ${institution.id}`);
  console.log(`TIN: ${institution.tinNumber || 'N/A'}`);
  console.log(`Vote: ${institution.voteNumber || 'N/A'}`);
  console.log(`Email: ${institution.email || 'N/A'}`);
  console.log(`Phone: ${institution.phoneNumber || 'N/A'}`);

  // Get employee count
  const employeeCount = await prisma.employee.count({
    where: { institutionId: institution.id },
  });

  console.log(`\n📊 Employees in this institution: ${employeeCount}`);

  if (employeeCount === 0) {
    console.log('\n✅ Institution already has no employees. Nothing to delete.');
    return;
  }

  // Confirm deletion
  console.log('\n⚠️  WARNING: This will permanently delete:');
  console.log(`   - ${employeeCount} employees`);
  console.log('   - All their documents (profile photos, certificates, contracts, etc.)');
  console.log('   - All related requests (promotions, confirmations, LWOP, etc.)');
  console.log('\n   The institution itself will NOT be deleted.');

  const confirm = await askQuestion('\nType "DELETE" to confirm deletion: ');

  if (confirm !== 'DELETE') {
    console.log('\n❌ Deletion cancelled.');
    return;
  }

  // Get all employees
  const employees = await prisma.employee.findMany({
    where: { institutionId: institution.id },
    include: {
      EmployeeCertificate: true,
    },
  });

  const employeeIds = employees.map(e => e.id);

  // Collect all file paths to delete
  const filePaths: string[] = [];

  for (const emp of employees) {
    // Employee profile image
    const profilePath = extractMinioPath(emp.profileImageUrl);
    if (profilePath) filePaths.push(profilePath);

    // Employee documents
    const ardhilHaliPath = extractMinioPath(emp.ardhilHaliUrl);
    if (ardhilHaliPath) filePaths.push(ardhilHaliPath);

    const confirmationLetterPath = extractMinioPath(emp.confirmationLetterUrl);
    if (confirmationLetterPath) filePaths.push(confirmationLetterPath);

    const jobContractPath = extractMinioPath(emp.jobContractUrl);
    if (jobContractPath) filePaths.push(jobContractPath);

    const birthCertificatePath = extractMinioPath(emp.birthCertificateUrl);
    if (birthCertificatePath) filePaths.push(birthCertificatePath);

    // Certificates
    for (const cert of emp.EmployeeCertificate) {
      const certPath = extractMinioPath(cert.url);
      if (certPath) filePaths.push(certPath);
    }
  }

  console.log(`\n📁 Found ${filePaths.length} files to delete from MinIO`);

  // Start deletion in a transaction
  console.log('\n🗑️  Starting deletion...\n');

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete related requests (these have foreign key to Employee)
      console.log('Deleting related requests...');

      const promotionCount = await tx.promotionRequest.deleteMany({
        where: { employeeId: { in: employeeIds } },
      });
      console.log(`  ✓ Deleted ${promotionCount.count} promotion requests`);

      const confirmationCount = await tx.confirmationRequest.deleteMany({
        where: { employeeId: { in: employeeIds } },
      });
      console.log(`  ✓ Deleted ${confirmationCount.count} confirmation requests`);

      const cadreChangeCount = await tx.cadreChangeRequest.deleteMany({
        where: { employeeId: { in: employeeIds } },
      });
      console.log(`  ✓ Deleted ${cadreChangeCount.count} cadre change requests`);

      const lwopCount = await tx.lwopRequest.deleteMany({
        where: { employeeId: { in: employeeIds } },
      });
      console.log(`  ✓ Deleted ${lwopCount.count} LWOP requests`);

      const retirementCount = await tx.retirementRequest.deleteMany({
        where: { employeeId: { in: employeeIds } },
      });
      console.log(`  ✓ Deleted ${retirementCount.count} retirement requests`);

      const resignationCount = await tx.resignationRequest.deleteMany({
        where: { employeeId: { in: employeeIds } },
      });
      console.log(`  ✓ Deleted ${resignationCount.count} resignation requests`);

      const separationCount = await tx.separationRequest.deleteMany({
        where: { employeeId: { in: employeeIds } },
      });
      console.log(`  ✓ Deleted ${separationCount.count} separation requests`);

      const serviceExtCount = await tx.serviceExtensionRequest.deleteMany({
        where: { employeeId: { in: employeeIds } },
      });
      console.log(`  ✓ Deleted ${serviceExtCount.count} service extension requests`);

      // 2. Delete employee certificates (has onDelete: Cascade but let's be explicit)
      console.log('\nDeleting employee certificates...');
      const certCount = await tx.employeeCertificate.deleteMany({
        where: { employeeId: { in: employeeIds } },
      });
      console.log(`  ✓ Deleted ${certCount.count} certificates`);

      // 3. Unlink users from employees (set employeeId to null)
      console.log('\nUnlinking users from employees...');
      const userCount = await tx.user.updateMany({
        where: { employeeId: { in: employeeIds } },
        data: { employeeId: null },
      });
      console.log(`  ✓ Unlinked ${userCount.count} users`);

      // 4. Delete employees
      console.log('\nDeleting employees...');
      const deletedCount = await tx.employee.deleteMany({
        where: { institutionId: institution.id },
      });
      console.log(`  ✓ Deleted ${deletedCount.count} employees`);
    });

    console.log('\n✅ Database records deleted successfully!');

    // 5. Delete files from MinIO (outside transaction as MinIO doesn't support transactions)
    if (filePaths.length > 0) {
      console.log('\n📁 Deleting files from MinIO storage...');
      let deletedFiles = 0;
      let failedFiles = 0;

      for (const path of filePaths) {
        const success = await deleteFileFromMinio(path);
        if (success) deletedFiles++;
        else failedFiles++;
      }

      console.log(`\n✅ MinIO cleanup complete: ${deletedFiles} files deleted, ${failedFiles} failures`);
    }

    // Final verification
    const remainingEmployees = await prisma.employee.count({
      where: { institutionId: institution.id },
    });

    console.log('\n' + '='.repeat(80));
    console.log('DELETION COMPLETE');
    console.log('='.repeat(80));
    console.log(`Institution: ${institution.name}`);
    console.log(`Remaining employees: ${remainingEmployees}`);

    if (remainingEmployees === 0) {
      console.log('\n🎉 Institution is now empty!');
    }

  } catch (error) {
    console.error('\n❌ Error during deletion:', error);
    throw error;
  }
}

async function main() {
  try {
    const institution = await findInstitution();

    if (!institution) {
      console.log('\nExiting...');
      process.exit(1);
    }

    await deleteEmployeesFromInstitution(institution);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
