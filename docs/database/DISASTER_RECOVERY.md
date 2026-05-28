# Disaster Recovery Guide

This document provides instructions for recovering the CSMS database in case of VPS failure or data loss.

## Overview

The disaster recovery backup includes:
- Database schema (structure)
- All data except employee personal information and documents

**Excluded from backup:**
- Employee table (personal data)
- EmployeeCertificate table (documents)
- Employee-related file storage

This approach saves significant storage space while preserving all critical system data.

## Recovery Files

All backup files are stored in `/home/latest/docs/database/`:

| File | Description | Size |
|------|-------------|------|
| `schema_YYYYMMDD_HHMMSS.sql` | Database schema only | ~124K |
| `nody_full_YYYYMMDD_HHMMSS.sql` | All data except employees | ~11M |
| `nody_core_YYYYMMDD_HHMMSS.sql` | Core tables only (legacy) | ~87K |

## Quick Recovery Steps

### Prerequisites

1. Fresh VPS with PostgreSQL installed
2. Node.js and npm installed
3. Application code deployed
4. Environment variables configured (`.env` file)

### Step 1: Restore Database

```bash
# Copy backup files to new VPS
scp docs/database/schema_*.sql user@new-vps:/path/to/docs/database/
scp docs/database/nody_full_*.sql user@new-vps:/path/to/docs/database/

# SSH to new VPS
ssh user@new-vps

# Set database password
export PGPASSWORD="your_password"

# Run disaster recovery script
cd /path/to/docs/database
./disaster-recovery.sh
```

### Step 2: Verify Database

```bash
# Connect to database
psql -h localhost -U postgres -d nody

# Check tables
\dt

# Verify users exist
SELECT count(*) FROM "User";

# Verify institutions exist
SELECT count(*) FROM "Institution";

# Exit
\q
```

### Step 3: Configure Application

```bash
# Copy environment file
cp .env.example .env

# Edit database connection
nano .env
# Update DATABASE_URL with new credentials

# Install dependencies
npm install

# Run database migrations (if any new migrations)
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Start application
npm run dev
```

### Step 4: Re-import Employee Data

Employee data needs to be re-imported from HRIMS:

1. Access the HRIMS system
2. Export employee data for the institution
3. Use the application's bulk import feature
4. Or manually add employees through the dashboard

## Backup Scripts

### Full Backup (Recommended)

Creates a complete backup excluding employee data:

```bash
cd /home/latest/docs/database
export PGPASSWORD="Mamlaka2020"
./backup-full.sh
```

**Output:**
- `schema_YYYYMMDD_HHMMSS.sql` - Database schema
- `nody_full_YYYYMMDD_HHMMSS.sql` - All data except employees

### Core Backup (Legacy)

Creates a backup of core tables only:

```bash
cd /home/latest/docs/database
export PGPASSWORD="Mamlaka2020"
./backup.sh
```

**Output:**
- `nody_core_YYYYMMDD_HHMMSS.sql` - Users, Institutions, SystemSettings only

## Automated Backups

### Daily Backup Cron Job

Add to crontab for automated daily backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /home/latest/docs/database && PGPASSWORD="Mamlaka2020" ./backup-full.sh >> /var/log/csms-backup.log 2>&1
```

### Backup Rotation

Keep only last 7 days of backups:

```bash
# Add to crontab (runs after backup)
0 3 * * * find /home/latest/docs/database -name "nody_full_*.sql" -mtime +7 -delete
0 3 * * * find /home/latest/docs/database -name "schema_*.sql" -mtime +7 -delete
```

## What's Included in Backup

### Users and Authentication
- All user accounts (admin, HR officers, HRRP, etc.)
- User roles and permissions
- Session data
- MFA tokens
- Password history and lockout information

### Institutions
- All government institutions
- Institution contact information
- Vote numbers and TIN numbers

### Request Workflows
All request types with full workflow history:
- CadreChangeRequest
- ConfirmationRequest
- LwopRequest
- PromotionRequest
- ResignationRequest
- RetirementRequest
- SeparationRequest
- ServiceExtensionRequest

### System Data
- SystemSettings
- Notifications
- Complaints
- Audit logs (partitioned)

## What's NOT Included

### Employee Personal Data
- Employee names, contact information
- Employee IDs (ZAN-ID, ZSSF, payroll)
- Personal documents (certificates, contracts, etc.)

### Employee Documents
- Uploaded files
- Certificates
- Contract documents

## Post-Recovery Checklist

- [ ] Database restored successfully
- [ ] Application connects to database
- [ ] Users can login
- [ ] Institutions are visible
- [ ] Request types are accessible
- [ ] Employee data re-imported from HRIMS
- [ ] File storage configured (S3 or local)
- [ ] Application tested end-to-end
- [ ] Backup schedule re-established

## Troubleshooting

### Connection Refused

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start if needed
sudo systemctl start postgresql
```

### Permission Denied

```bash
# Check PostgreSQL user exists
sudo -u postgres psql -c "\du"

# Create user if needed
sudo -u postgres createuser -s postgres
```

### Database Already Exists

```bash
# Drop and recreate
dropdb -U postgres nody
createdb -U postgres nody
```

### Restore Fails

```bash
# Check backup file integrity
head -20 schema_*.sql
head -20 nody_full_*.sql

# Try manual restore
psql -U postgres -d nody -f schema_*.sql
psql -U postgres -d nody -f nody_full_*.sql
```

## Security Considerations

1. **Backup Storage**: Store backups in a secure, encrypted location
2. **Access Control**: Limit access to backup files
3. **Encryption**: Encrypt backups before transferring
4. **Testing**: Regularly test recovery procedures
5. **Documentation**: Keep recovery documentation updated

## Contact

For disaster recovery assistance:
- Check application logs: `/var/log/csms-*.log`
- Review database logs: `/var/log/postgresql/*.log`
- Contact system administrator

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-05-28 | 1.0 | Initial disaster recovery documentation |
| 2026-05-28 | 1.1 | Added full backup excluding employee data |
