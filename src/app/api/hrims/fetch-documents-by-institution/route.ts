import { NextRequest, NextResponse } from 'next/server';
import { getHrimsApiConfig } from '@/lib/hrims-config';
import { db as prisma } from '@/lib/db';
import { uploadFile, getFileMetadata } from '@/lib/minio';
import { validateFileUpload } from '@/lib/file-validation';
import { hrimsLogger } from '@/lib/logger';
import { verifyAuth } from '@/lib/api-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

// Configure route for long-running operations
export const maxDuration = 900; // 15 minutes for large institutions
export const dynamic = 'force-dynamic';

// Utility function to add delay between requests
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Maps HRIMS certificate names to standardized types
 */
function mapCertificateType(attachmentType: string): string | null {
  const normalized = attachmentType.toLowerCase().trim();

  if (
    normalized.includes('form iv') || normalized.includes('form 4') ||
    normalized.includes('o-level') || normalized.includes('o level') ||
    normalized.includes('csee') ||
    (normalized.includes('secondary') && (normalized.includes('certificate') || normalized.includes('education')) && !normalized.includes('advanced'))
  ) {
    return 'Certificate of Secondary education (Form IV)';
  }

  if (
    normalized.includes('form vi') || normalized.includes('form 6') ||
    normalized.includes('a-level') || normalized.includes('a level') ||
    normalized.includes('acsee') ||
    (normalized.includes('advanced') && normalized.includes('secondary'))
  ) {
    return 'Advanced Certificate of Secondary education (Form VII)';
  }

  if (normalized.includes('phd') || normalized.includes('ph.d') || normalized.includes('doctorate') || normalized.includes('doctoral')) {
    return 'PHd';
  }

  if (normalized.includes('master') || normalized.includes('msc') || normalized.includes('mba') || normalized.includes('med') || normalized.includes('m.sc') || normalized.includes('m.a')) {
    return 'Master Degree';
  }

  if (normalized.includes('bachelor') || normalized.includes('bsc') || normalized.includes('ba ') || normalized.includes('bed') || normalized.includes('beng') || normalized.includes('b.sc') || normalized.includes('b.a') ||
    (normalized.includes('degree') && !normalized.includes('master') && !normalized.includes('advanced'))
  ) {
    return 'Bachelor Degree';
  }

  if (normalized.includes('advanced diploma') || normalized.includes('higher diploma') || normalized.includes('postgraduate diploma')) {
    return 'Advanced Diploma';
  }

  if (normalized.includes('diploma') && !normalized.includes('advanced') && !normalized.includes('higher') && !normalized.includes('postgraduate')) {
    return 'Diploma';
  }

  if ((normalized.includes('certificate') && !normalized.includes('secondary') && !normalized.includes('form')) || normalized.includes('cert.')) {
    return 'Certificate';
  }

  return null;
}

// Document types for HRIMS RequestId 206
const DOCUMENT_TYPES = [
 {
 code: '2',
 name: 'Ardhilihal',
 dbField: 'ardhilHaliUrl',
 dbKey: 'ardhilHali',
 },
 {
 code: '3',
 name: 'Employment Contract',
 dbField: 'jobContractUrl',
 dbKey: 'jobContract',
 },
 {
 code: '4',
 name: 'Birth Certificate',
 dbField: 'birthCertificateUrl',
 dbKey: 'birthCertificate',
 },
 {
 code: '23',
 name: 'Confirmation Letter',
 dbField: 'confirmationLetterUrl',
 dbKey: 'confirmationLetter',
 },
 { code: '8', name: 'Educational Certificate', dbField: null, dbKey: null }, // Stored as certificate, not core document
] as const;

interface DocumentResult {
 employeeId: string;
 employeeName: string;
 payrollNumber: string;
 documentsStored: {
 ardhilHali?: string;
 confirmationLetter?: string;
 jobContract?: string;
 birthCertificate?: string;
 };
 certificatesStored: Array<{
 type: string;
 fileUrl: string;
 }>;
 status: 'success' | 'partial' | 'failed';
  message?: string;
}

// Fetch documents from HRIMS using RequestId 206 with 3 separate API calls
async function fetchDocumentsFromHRIMS(
 payrollNumber: string,
 employee: {
 id: string;
 name: string;
 ardhilHaliUrl: string | null;
 confirmationLetterUrl: string | null;
 jobContractUrl: string | null;
 birthCertificateUrl: string | null;
 },
 hrimsConfig: { BASE_URL: string; API_KEY: string; TOKEN: string }
): Promise<{ success: boolean; data?: any; error?: string }> {
 try {
 hrimsLogger.info(
 ` Fetching documents for ${employee.name} (Payroll: ${payrollNumber})`
 );
 hrimsLogger.info(` Making 3 separate HRIMS API calls (one per document type)`);

 const allAttachments: any[] = [];

 // Make separate API call for each document type
 for (let i = 0; i < DOCUMENT_TYPES.length; i++) {
 const docType = DOCUMENT_TYPES[i];

 // Skip if document already exists in MinIO (verify file actually exists)
 const currentUrl = employee[docType.dbField as keyof typeof employee] as
 | string
 | null;
 if (
 currentUrl &&
 currentUrl.startsWith('/api/files/employee-documents/')
 ) {
 const filename = currentUrl.split('/').pop();
 const filePath = `employee-documents/${filename}`;
 try {
 await getFileMetadata(filePath);
 hrimsLogger.info(
 `⏭ Skipping ${docType.name} - already stored in MinIO for ${employee.name}`
 );
 continue;
 } catch {
 // File not found in MinIO, clear stale URL and proceed to re-fetch
 hrimsLogger.info(
 ` Document URL exists in DB but file not found in MinIO: ${filePath}. Re-fetching ${docType.name} for ${employee.name}.`
 );
 await prisma.employee.update({
 where: { id: employee.id },
 data: { [docType.dbField as string]: null },
 });
 }
 }

 hrimsLogger.info(
 ` Fetching document type: ${docType.name} (RequestBody: ${docType.code})...`
 );

 const payload = {
 RequestId: '206',
 SearchCriteria: payrollNumber,
 RequestPayloadData: {
 RequestBody: docType.code,
 },
 };

 try {
 const response = await fetch(`${hrimsConfig.BASE_URL}/Employees`, {
 method: 'POST',
 headers: {
 ApiKey: hrimsConfig.API_KEY,
 Token: hrimsConfig.TOKEN,
 'Content-Type': 'application/json',
 },
 body: JSON.stringify(payload),
 signal: AbortSignal.timeout(120000), // 120 second timeout
 });

 if (!response.ok) {
 hrimsLogger.error(
 ` HRIMS API error for ${docType.name}: ${response.status}`
 );
 continue; // Skip to next document type
 }

 const hrimsData = await response.json();

 // Check for HRIMS internal errors
 if (hrimsData.code === 500 || hrimsData.status === 'Failure') {
 hrimsLogger.error(
 `HRIMS internal error for ${docType.name}: ${hrimsData.message}`
 );
 continue; // Skip to next document type
 }

 hrimsLogger.info(` Received response from HRIMS for ${docType.name}`);

 // Extract attachments and add to allAttachments array
 const attachments = Array.isArray(hrimsData.data) ? hrimsData.data : [];
 if (attachments.length > 0) {
 hrimsLogger.info(
 ` Found ${attachments.length} attachment(s) for ${docType.name}`
 );
 allAttachments.push(...attachments);
 } else {
 hrimsLogger.info(` No attachments found for ${docType.name}`);
 }

 // Add delay between requests (except after last request)
 if (i < DOCUMENT_TYPES.length - 1) {
 hrimsLogger.info(
 ' Waiting 2 seconds before next document type request...'
 );
 await delay(2000);
 }
 } catch (error) {
 hrimsLogger.error(
 `Error fetching ${docType.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
 );
 continue; // Skip to next document type
 }
 }

 if (allAttachments.length === 0) {
 hrimsLogger.info(
 ` No documents found across all HRIMS requests for ${employee.name}`
 );
 return { success: false, error: 'No documents found' };
 }

 hrimsLogger.info(
 ` Total attachments collected for ${employee.name}: ${allAttachments.length}`
 );

 // Return data in the same format as before (with data array)
 return { success: true, data: { data: allAttachments } };
 } catch (error) {
 return {
 success: false,
 error: error instanceof Error ? error.message : 'Unknown error',
 };
 }
}

// Store document in MinIO
async function storeDocumentInMinIO(
 employeeId: string,
 documentType: string,
 base64Data: string
): Promise<{ success: boolean; url?: string; error?: string }> {
 try {
 // Strip data URI prefix if present (e.g., "data:application/pdf;base64,")
 let cleanBase64 = base64Data;
 let mimeType = 'application/pdf';
 let extension = 'pdf';

 if (base64Data.startsWith('data:')) {
 const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
 if (matches) {
 mimeType = matches[1];
 cleanBase64 = matches[2];
 // Determine extension from MIME type
 const extensionMap: Record<string, string> = {
 'application/pdf': 'pdf',
 'image/jpeg': 'jpg',
 'image/png': 'png',
 'image/gif': 'gif',
 'image/webp': 'webp',
 };
 extension = extensionMap[mimeType.toLowerCase()] || 'pdf';
 }
 }

 // Convert base64 to buffer
 const buffer = Buffer.from(cleanBase64, 'base64');

 // Validate file before uploading
 const validation = await validateFileUpload(buffer, `${documentType}.${extension}`, mimeType, 'documents');
 if (!validation.success) {
 hrimsLogger.error(`File validation failed for ${documentType}: ${validation.error}`);
 return {
 success: false,
 error: `File validation failed: ${validation.error}`,
 };
 }

 // Generate file path
 const fileName = `${employeeId}_${documentType}.${extension}`;
 const filePath = `employee-documents/${fileName}`;

 // Upload to MinIO
 await uploadFile(buffer, filePath, mimeType);

 // Return MinIO URL
 const url = `/api/files/employee-documents/${fileName}`;
 return { success: true, url };
 } catch (error) {
 return {
 success: false,
 error: error instanceof Error ? error.message : 'Upload failed',
 };
 }
}

// Process documents for a single employee using RequestId 206
async function processEmployeeDocuments(
 employee: {
 id: string;
 name: string;
 payrollNumber: string | null;
 ardhilHaliUrl: string | null;
 confirmationLetterUrl: string | null;
 jobContractUrl: string | null;
 birthCertificateUrl: string | null;
 },
 hrimsConfig: { BASE_URL: string; API_KEY: string; TOKEN: string }
): Promise<DocumentResult> {
 const result: DocumentResult = {
 employeeId: employee.id,
 employeeName: employee.name,
 payrollNumber: employee.payrollNumber || 'N/A',
 documentsStored: {},
 certificatesStored: [],
 status: 'failed',
 };

 // Skip if no payroll number
 if (!employee.payrollNumber) {
 result.message = 'No payroll number available';
 return result;
 }

 // Fetch documents from HRIMS using RequestId 206 (3 separate API calls)
 const fetchResult = await fetchDocumentsFromHRIMS(
 employee.payrollNumber,
 employee,
 hrimsConfig
 );

 if (!fetchResult.success || !fetchResult.data) {
 result.message =
 fetchResult.error || 'Failed to fetch documents from HRIMS';
 return result;
 }

 const hrimsData = fetchResult.data;
 const updateData: any = {};
 let documentsProcessed = 0;

 // Extract documents data from response - it's an array of attachment objects
 const attachments = Array.isArray(hrimsData.data) ? hrimsData.data : [];

 if (attachments.length === 0) {
 result.message = 'No documents found in HRIMS response';
 return result;
 }

 hrimsLogger.info(`Found ${attachments.length} attachments for ${employee.name}`);

 // Document type mapping: HRIMS attachmentType -> Database field
 const documentTypeMapping: Record<
 string,
 { field: string; dbKey: string; label: string }
 > = {
 ardhilhali: {
 field: 'ardhilHaliUrl',
 dbKey: 'ardhilHali',
 label: 'Ardhil Hali',
 },
 ardhilhaliurl: {
 field: 'ardhilHaliUrl',
 dbKey: 'ardhilHali',
 label: 'Ardhil Hali',
 },
 comfirmationletter: {
 field: 'confirmationLetterUrl',
 dbKey: 'confirmationLetter',
 label: 'Confirmation Letter',
 },
 confirmationletter: {
 field: 'confirmationLetterUrl',
 dbKey: 'confirmationLetter',
 label: 'Confirmation Letter',
 },
 employmentcontract: {
 field: 'jobContractUrl',
 dbKey: 'jobContract',
 label: 'Job Contract',
 },
 jobcontract: {
 field: 'jobContractUrl',
 dbKey: 'jobContract',
 label: 'Job Contract',
 },
 birthcertificate: {
 field: 'birthCertificateUrl',
 dbKey: 'birthCertificate',
 label: 'Birth Certificate',
 },
 };

 // Process each attachment
 for (const attachment of attachments) {
 const attachmentType = attachment.attachmentType || '';
 // Check both content and attachmentContent fields (HRIMS may use either)
 const attachmentContent = attachment.content || attachment.attachmentContent || '';

 if (!attachmentContent) {
 hrimsLogger.warn(
 ` Skipping ${attachmentType || 'unknown'} attachment for ${employee.name} - no content provided by HRIMS (contentSize: ${attachment.contentSize || attachment.contentLength || 'unknown'})`
 );
 continue;
 }

 // Normalize attachment type for matching
 const normalizedType = attachmentType.toLowerCase().replace(/[\s_-]/g, '');

 // Check if it's a core document type
 const docMapping = documentTypeMapping[normalizedType];

 if (docMapping) {
 // Check if already stored in MinIO (verify file actually exists)
 const currentUrl = employee[docMapping.field as keyof typeof employee] as
 | string
 | null;
 if (
 currentUrl &&
 currentUrl.startsWith('/api/files/employee-documents/')
 ) {
 const existingFilename = currentUrl.split('/').pop();
 const existingFilePath = `employee-documents/${existingFilename}`;
 try {
 await getFileMetadata(existingFilePath);
 hrimsLogger.info(
 `⏭ Skipping ${docMapping.label} - already stored in MinIO for ${employee.name}`
 );
 result.documentsStored[
 docMapping.dbKey as keyof typeof result.documentsStored
 ] = currentUrl;
 continue;
 } catch {
 // File not found in MinIO, clear stale URL and proceed
 hrimsLogger.info(
 ` Document URL exists in DB but file not found in MinIO: ${existingFilePath}. Re-fetching ${docMapping.label} for ${employee.name}.`
 );
 await prisma.employee.update({
 where: { id: employee.id },
 data: { [docMapping.field]: null },
 });
 }
 }

 // Store document in MinIO
 const storeResult = await storeDocumentInMinIO(
 employee.id,
 docMapping.dbKey,
 attachmentContent
 );

 if (storeResult.success && storeResult.url) {
 result.documentsStored[
 docMapping.dbKey as keyof typeof result.documentsStored
 ] = storeResult.url;
 updateData[docMapping.field] = storeResult.url;
 documentsProcessed++;
 hrimsLogger.info(` Stored ${docMapping.label} for ${employee.name}`);
 } else {
 hrimsLogger.error(
 `Failed to store ${docMapping.label}: ${storeResult.error ?? 'Unknown error'}`
 );
 }
 } else if (
 attachmentType.toLowerCase().includes('educational') ||
 attachmentType.toLowerCase().includes('certification') ||
 attachmentType.toLowerCase().includes('certificate')
 ) {
 // It's an educational certificate - use standardized type name
 const certificateType = mapCertificateType(attachmentType) || attachmentType;

 // Check if certificate already exists in database
 const existingCert = await prisma.employeeCertificate.findFirst({
 where: {
 employeeId: employee.id,
 type: certificateType,
 },
 });

 if (
 existingCert &&
 existingCert.url &&
 existingCert.url.startsWith('/api/files/')
 ) {
 // Verify the file actually exists in MinIO before skipping
 const certFilename = existingCert.url.split('/').pop();
 const certFilePath = `employee-documents/${certFilename}`;
 try {
 await getFileMetadata(certFilePath);
 hrimsLogger.info(
 `⏭ Skipping certificate "${certificateType}" - already stored in MinIO for ${employee.name}`
 );
 result.certificatesStored.push({
 type: certificateType,
 fileUrl: existingCert.url,
 });
 continue;
 } catch {
 // File not found in MinIO, delete stale certificate record
 hrimsLogger.info(
 ` Certificate URL exists in DB but file not found in MinIO: ${certFilePath}. Re-fetching for ${employee.name}.`
 );
 await prisma.employeeCertificate.delete({
 where: { id: existingCert.id },
 });
 }
 }

 // Store new certificate
 const storeResult = await storeDocumentInMinIO(
 employee.id,
 `certificate_${certificateType.replace(/[\s_-]/g, '_')}`,
 attachmentContent
 );

 if (storeResult.success && storeResult.url) {
 result.certificatesStored.push({
 type: certificateType,
 fileUrl: storeResult.url,
 });
 documentsProcessed++;
 hrimsLogger.info(
 ` Stored certificate: ${certificateType} for ${employee.name}`
 );
 }
 }
 }

 // Update employee record if we stored any documents
 if (Object.keys(updateData).length > 0) {
 try {
 await prisma.employee.update({
 where: { id: employee.id },
 data: updateData,
 });
 hrimsLogger.info(` Updated database for ${employee.name}`);
 } catch (error) {
 hrimsLogger.error({ err: error }, `Failed to update employee ${employee.id}:`);
 }
 }

 // Save certificates to database if any
 if (result.certificatesStored.length > 0) {
 try {
 for (const cert of result.certificatesStored) {
 // Check if certificate already exists
 const existing = await prisma.employeeCertificate.findFirst({
 where: {
 employeeId: employee.id,
 type: cert.type,
 },
 });

 if (existing) {
 // If URL matches, it was already stored - skip update
 if (existing.url === cert.fileUrl) {
 hrimsLogger.info(
 `ℹ Certificate "${cert.type}" already exists in database for ${employee.name}`
 );
 } else {
 // Update existing certificate with new URL
 await prisma.employeeCertificate.update({
 where: { id: existing.id },
 data: {
 url: cert.fileUrl,
 name: cert.type,
 },
 });
 hrimsLogger.info(
 ` Updated certificate "${cert.type}" with new URL for ${employee.name}`
 );
 }
 } else {
 // Create new certificate
 try {
 await prisma.employeeCertificate.create({
 data: {
 id: `${employee.id}_${cert.type.replace(/\s+/g, '_')}`,
 employeeId: employee.id,
 type: cert.type,
 name: cert.type,
 url: cert.fileUrl,
 },
 });
 hrimsLogger.info(
 ` Created new certificate "${cert.type}" for ${employee.name}`
 );
 } catch (createError: any) {
 // Handle duplicate key errors gracefully
 if (createError?.code === 'P2002') {
 hrimsLogger.info(
 ` Certificate "${cert.type}" already exists (concurrent create) for ${employee.name}`
 );
 } else {
 throw createError;
 }
 }
 }
 }
 hrimsLogger.info(
 ` Processed ${result.certificatesStored.length} certificates for ${employee.name}`
 );
 } catch (error) {
 hrimsLogger.error({ err: error }, `Failed to save certificates for ${employee.id}:`);
 }
 }

 // Determine overall status
 const totalExpected = Object.keys(documentTypeMapping).length;
 const coreDocsStored = Object.keys(result.documentsStored).length;
 const certsStored = result.certificatesStored.length;

 if (documentsProcessed === 0) {
 result.status = 'failed';
 result.message = 'No documents found in HRIMS response';
 } else if (coreDocsStored + certsStored < totalExpected && totalExpected > 0) {
 result.status = 'partial';
 result.message = `Partially stored ${documentsProcessed} document(s) - some document types were not available`;
 } else {
 result.status = 'success';
 result.message = `Successfully stored ${documentsProcessed} document(s)`;
 }

 return result;
}

export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    return authResult.response!;
  }
  const auth = authResult.context!;

  const rateLimitResult = await checkRateLimit(`ratelimit:${getClientIp(request)}:write`, 'write');
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests', errorCode: 'RATE_LIMIT_EXCEEDED', retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
    );
  }

  // Role restriction for bulk document fetch
  const allowedRoles = ['HHRMD', 'ADMIN', 'CSCS'];
  if (!allowedRoles.includes(auth.role.toUpperCase())) {
    return NextResponse.json(
      { success: false, message: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  try {
    const HRIMS_CONFIG = await getHrimsApiConfig();
    const { institutionId } = await request.json();

 if (!institutionId) {
 return NextResponse.json(
 { success: false, message: 'Institution ID is required' },
 { status: 400 }
 );
 }

 // Fetch employees from database for this institution
 const employees = await prisma.employee.findMany({
 where: {
 institutionId: institutionId,
 },
 select: {
 id: true,
 name: true,
 payrollNumber: true,
 ardhilHaliUrl: true,
 confirmationLetterUrl: true,
 jobContractUrl: true,
 birthCertificateUrl: true,
 },
 orderBy: {
 name: 'asc',
 },
 });

 if (employees.length === 0) {
 return NextResponse.json({
 success: true,
 message: 'No employees found for this institution',
 summary: {
 total: 0,
 successful: 0,
 partial: 0,
 failed: 0,
 },
 results: [],
 });
 }

 hrimsLogger.info(`Processing documents for ${employees.length} employees...`);

 // Create a streaming response
 const encoder = new TextEncoder();
 const stream = new ReadableStream({
 async start(controller) {
 const results: DocumentResult[] = [];
 let successfulCount = 0;
 let partialCount = 0;
 let failedCount = 0;

 // Send initial progress update
 const initialData = {
 type: 'progress',
 current: 0,
 total: employees.length,
 message: 'Starting document fetch...',
 };
 controller.enqueue(
 encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`)
 );

 // Process each employee
 for (let i = 0; i < employees.length; i++) {
 const employee = employees[i];

 if (!employee.payrollNumber) {
 results.push({
 employeeId: employee.id,
 employeeName: employee.name,
 payrollNumber: 'N/A',
 documentsStored: {},
 certificatesStored: [],
 status: 'failed',
 message: 'No payroll number',
 });
 failedCount++;

 // Send progress update
 const progressData = {
 type: 'progress',
 current: i + 1,
 total: employees.length,
 employee: employee.name,
 status: 'failed',
 message: 'No payroll number',
 };
 controller.enqueue(
 encoder.encode(`data: ${JSON.stringify(progressData)}\n\n`)
 );
 continue;
 }

 const result = await processEmployeeDocuments(employee, HRIMS_CONFIG);
 results.push(result);

 if (result.status === 'success') {
 successfulCount++;
 } else if (result.status === 'partial') {
 partialCount++;
 } else {
 failedCount++;
 }

 hrimsLogger.info(
 `Processed ${employee.name}: ${result.status} (${Object.keys(result.documentsStored).length} documents)`
 );

 // Send progress update after each employee
 const progressData = {
 type: 'progress',
 current: i + 1,
 total: employees.length,
 employee: employee.name,
 status: result.status,
 documentsCount:
 Object.keys(result.documentsStored).length +
 result.certificatesStored.length,
 summary: {
 successful: successfulCount,
 partial: partialCount,
 failed: failedCount,
 },
 };
 controller.enqueue(
 encoder.encode(`data: ${JSON.stringify(progressData)}\n\n`)
 );

 // Add delay between HRIMS requests to prevent server overload
 // Skip delay after the last employee
 if (i < employees.length - 1) {
 await delay(1500); // 1.5 second delay between requests
 }
 }

 // Send final result
 const finalData = {
 type: 'complete',
 success: true,
 message: `Processed ${employees.length} employees`,
 summary: {
 total: employees.length,
 successful: successfulCount,
 partial: partialCount,
 failed: failedCount,
 },
 results,
 };
 controller.enqueue(
 encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`)
 );
 controller.close();
 },
 });

 return new Response(stream, {
 headers: {
 'Content-Type': 'text/event-stream',
 'Cache-Control': 'no-cache',
 Connection: 'keep-alive',
 },
 });
 } catch (error) {
 hrimsLogger.error({ err: error }, 'Error in fetch-documents-by-institution:');
 return NextResponse.json(
 {
 success: false,
 message: 'Failed to process documents',
 error: error instanceof Error ? error.message : 'Unknown error',
 },
 { status: 500 }
 );
 }
}
