/**
 * Script to delete orphan MinIO files that were referenced by
 * the deleted orphan employee records.
 *
 * Reads the file list from orphan-minio-files.txt and deletes
 * each object from the MinIO 'documents' bucket.
 */

import { minioClient, DEFAULT_BUCKET } from '../src/lib/minio';

async function main() {
  const fs = await import('fs');
  const filePaths = fs.readFileSync('/home/nextjstest/csms/scripts/orphan-minio-files.txt', 'utf-8')
    .split('\n')
    .filter(line => line.trim() !== '');

  console.log(`Found ${filePaths.length} MinIO file references to delete\n`);

  // Convert API URLs to MinIO object keys
  // /api/files/employee-photos/abc.jpg -> employee-photos/abc.jpg
  // /api/files/employee-documents/abc_cert.pdf -> employee-documents/abc_cert.pdf
  const objectKeys = filePaths.map(path => {
    // Remove /api/files/ prefix
    const key = path.replace(/^\/api\/files\//, '');
    return key;
  }).filter(key => key.length > 0);

  console.log(`Converted to ${objectKeys.length} MinIO object keys\n`);

  let deleted = 0;
  let failed = 0;
  let notFound = 0;

  for (const key of objectKeys) {
    try {
      // Check if object exists first
      try {
        await minioClient.statObject(DEFAULT_BUCKET, key);
      } catch (err: any) {
        if (err.code === 'NoSuchKey') {
          notFound++;
          continue;
        }
        // Might still exist, try to delete anyway
      }

      await minioClient.removeObject(DEFAULT_BUCKET, key);
      deleted++;
      if (deleted % 100 === 0) {
        console.log(`  Deleted ${deleted} files so far...`);
      }
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        notFound++;
      } else {
        failed++;
        if (failed <= 10) {
          console.error(`  Error deleting ${key}: ${err.message || err.code || err}`);
        }
      }
    }
  }

  console.log('\n=== MinIO Cleanup Summary ===');
  console.log(`Total references:   ${filePaths.length}`);
  console.log(`Successfully deleted: ${deleted}`);
  console.log(`Not found (already deleted): ${notFound}`);
  console.log(`Failed:             ${failed}`);

  process.exit(0);
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});