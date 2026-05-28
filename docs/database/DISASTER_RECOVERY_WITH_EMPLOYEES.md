# Disaster Recovery Guide (With Employee Data)

This document provides instructions for recovering the CSMS database including employee data but excluding documents stored in MinIO.

## Overview

This disaster recovery backup includes:
- **All employee personal information** (names, IDs, contact info, employment history)
- **All system users and authentication**
- **All request workflows** (promotions, confirmations, retirements, etc.)
- **Complete audit trail**

**Excluded from backup:**
- Employee certificates and documents (stored in MinIO)

## Recovery Files

### Option 1: With Employee Data (Recommended)
- `csms-disaster-recovery-with-employees-YYYYMMDD_HHMMSS.tar.gz` (5.2MB)
- Includes complete database except documents

### Option 2: Without Employee Data
- `csms-disaster-recovery-YYYYMMDD_HHMMSS.tar.gz` (1.9MB)
- Excludes employee table entirely

## Quick Recovery Steps

### Prerequisites

1. Fresh VPS with PostgreSQL installed
2. Node.js and npm installed
3. MinIO server running (for employee documents)
4. Application code deployed
5. Environment variables configured

### Step 1: Restore Database

```bash
# Copy backup to new VPS
scp csms-disaster-recovery-with-employees-*.tar.gz user@new-vps:/path/

# SSH to new VPS
ssh user@new-vps

# Extract backup
tar -xzf csms-disaster-recovery-with-employees-*.tar.gz
cd csms-disaster-recovery-with-employees-*

# Set database password
export PGPASSWORD="your_password"

# Create database
createdb -U postgres nody

# Restore schema
psql -U postgres -d nody -f schema_full_*.sql

# Restore data
psql -U postgres -d nody -f nody_with_employees_*.sql
```

### Step 2: Configure MinIO Connection

```bash
# Copy environment file
cp .env.example .env

# Edit MinIO configuration
nano .env
```

Update these MinIO variables:
```env
MINIO_ENDPOINT=your-minio-server:9000
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=csms-documents
MINIO_USE_SSL=false
```

### Step 3: Verify Employee Documents

Employee documents are stored in MinIO with this structure:
```
csms-documents/
├── employee-photos/
│   └── {employee-id}.jpg
├── employee-documents/
│   └── {employee-id}/
│       ├── certificate-1.pdf
│       ├── contract.pdf
│       └── ...
└── promotion-forms/
    └── {request-id}/
```

The application will automatically retrieve documents from MinIO when accessing employee profiles.

### Step 4: Deploy Application

```bash
cd /path/to/csms

# Install dependencies
npm install

# Run any new migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Build and start
npm run build
npm start
```

### Step 5: Verify Data Integrity

```bash
# Connect to database
psql -h localhost -U postgres -d nody

# Check employee count
SELECT count(*) FROM "Employee";

# Check user count
SELECT count(*) FROM "User";

# Check request counts
SELECT 'PromotionRequest' as table_name, count(*) FROM "PromotionRequest"
UNION ALL
SELECT 'ConfirmationRequest', count(*) FROM "ConfirmationRequest"
UNION ALL
SELECT 'RetirementRequest', count(*) FROM "RetirementRequest";

# Exit
\q
```

## What's Included

### Employee Data
- ✓ Employee names and personal information
- ✓ Employee IDs (ZAN-ID, ZSSF, payroll numbers)
- ✓ Contact information (phone, email, address)
- ✓ Employment dates and status
- ✓ Cadre and salary scale
- ✓ Ministry and department assignments
- ✓ Profile image URLs (pointing to MinIO)
- ✓ Document URLs (pointing to MinIO)

### System Data
- ✓ All user accounts and roles
- ✓ Institution information
- ✓ System settings
- ✓ Active sessions
- ✓ MFA tokens
- ✓ Notifications
- ✓ Complaints
- ✓ Complete audit trail

### Request Workflows
- ✓ CadreChangeRequest (all workflow data)
- ✓ ConfirmationRequest
- ✓ LwopRequest
- ✓ PromotionRequest
- ✓ ResignationRequest
- ✓ RetirementRequest
- ✓ SeparationRequest
- ✓ ServiceExtensionRequest

## What's NOT Included

### Employee Documents (Stored in MinIO)
- ✗ Employee certificates
- ✗ Employment contracts
- ✗ Ardhi Hali documents
- ✗ Confirmation letters
- ✗ Birth certificates
- ✗ Profile photos (actual files)

**Note:** The database contains URLs pointing to these documents in MinIO. Once MinIO is restored, all document links will work automatically.

## MinIO Recovery

### Option 1: MinIO Backup (If Available)

If you have a MinIO backup:

```bash
# Restore MinIO data
mc mirror /backup/minio/csms-documents local/csms-documents

# Or from S3-compatible backup
mc mirror s3://backup-bucket/csms-documents local/csms-documents
```

### Option 2: Re-upload Documents

If no MinIO backup exists:

1. Access employee profiles in the application
2. Re-upload documents manually
3. Or import from HRIMS if documents are available there

## Backup Scripts

### Backup with Employee Data (Recommended)

```bash
cd /home/latest/docs/database
export PGPASSWORD="Mamlaka2020"
./backup-with-employees.sh
```

Creates:
- `schema_full_YYYYMMDD_HHMMSS.sql` - Database schema
- `nody_with_employees_YYYYMMDD_HHMMSS.sql` - All data including employees

### Backup without Employee Data

```bash
cd /home/latest/docs/database
export PGPASSWORD="Mamlaka2020"
./backup-full.sh
```

Creates:
- `schema_YYYYMMDD_HHMMSS.sql` - Database schema
- `nody_full_YYYYMMDD_HHMMSS.sql` - All data except employees

### Package Backup

```bash
cd /home/latest/docs/database
./package-backup-with-employees.sh
```

Creates compressed archive with all recovery files.

## Automated Backups

### Daily Backup (With Employees)

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * cd /home/latest/docs/database && PGPASSWORD="Mamlaka2020" ./backup-with-employees.sh >> /var/log/csms-backup.log 2>&1

# Weekly package on Sundays at 3 AM
0 3 * * 0 cd /home/latest/docs/database && ./package-backup-with-employees.sh >> /var/log/csms-backup.log 2>&1

# Keep only last 7 days of backups
0 4 * * * find /home/latest/docs/database -name "nody_with_employees_*.sql" -mtime +7 -delete
0 4 * * * find /home/latest/docs/database -name "schema_full_*.sql" -mtime +7 -delete
```

## Post-Recovery Checklist

- [ ] Database restored successfully
- [ ] Employee count matches expected
- [ ] Application connects to database
- [ ] MinIO connection configured
- [ ] Employee documents accessible via URLs
- [ ] Users can login
- [ ] Institutions visible
- [ ] Request workflows functional
- [ ] Audit trail intact
- [ ] Backup schedule re-established

## Troubleshooting

### Employee Documents Not Loading

1. Check MinIO connection:
   ```bash
   mc alias set local http://localhost:9000 minioadmin minioadmin
   mc ls local/csms-documents/
   ```

2. Verify environment variables:
   ```bash
   grep MINIO .env
   ```

3. Check application logs for MinIO errors

### Foreign Key Errors During Restore

If you get foreign key errors:

```bash
# Disable triggers during restore
psql -U postgres -d nody -c "SET session_replication_role = 'replica';"
psql -U postgres -d nody -f nody_with_employees_*.sql
psql -U postgres -d nody -c "SET session_replication_role = 'origin';"
```

### Large Restore Times

For faster restoration:

```bash
# Use pg_restore with parallel jobs
pg_restore -U postgres -d nody -j 4 nody_with_employees_*.dump
```

## Comparison: With vs Without Employee Data

| Aspect | With Employees | Without Employees |
|--------|----------------|-------------------|
| Backup Size | 5.2MB | 1.9MB |
| Employee Data | ✓ Included | ✗ Excluded |
| Request Workflows | ✓ Complete | ✓ Complete (no employee refs) |
| Recovery Time | ~10 min | ~5 min |
| MinIO Required | Yes (for documents) | Yes (for documents) |
| HRIMS Re-import | Not needed | Required |

## Recommendation

**Use "With Employee Data" backup** for most scenarios:
- Complete data preservation
- No need to re-import from HRIMS
- Faster full recovery
- Employee profiles immediately available

**Use "Without Employee Data" backup** only when:
- Backup size is critical
- Employee data is readily available in HRIMS
- Storage space is extremely limited

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-05-28 | 1.0 | Initial disaster recovery documentation |
| 2026-05-28 | 1.1 | Added full backup excluding employee data |
| 2026-05-28 | 2.0 | Added backup including employee data (excluding documents) |
