# CSMS Database Backup Options

## Quick Comparison

| Feature | With Employees | Without Employees |
|---------|----------------|-------------------|
| **Archive Size** | 5.2MB | 1.9MB |
| **Employee Data** | ✓ Included | ✗ Excluded |
| **User Accounts** | ✓ Included | ✓ Included |
| **Request Workflows** | ✓ Complete | ✓ Complete |
| **Audit Logs** | ✓ Included | ✓ Included |
| **Documents** | MinIO Only | MinIO Only |
| **Recovery Time** | ~10 min | ~5 min |
| **HRIMS Re-import** | Not needed | Required |

## Option 1: With Employee Data (Recommended)

**Best for:** Most scenarios, complete data preservation

### Backup Archive
- **File:** `csms-disaster-recovery-with-employees-20260528_220934.tar.gz`
- **Size:** 5.2MB
- **Location:** `docs/database/`

### What's Included
- ✓ Employee personal information
- ✓ Employee IDs (ZAN-ID, ZSSF, payroll)
- ✓ Contact information
- ✓ Employment history and dates
- ✓ Cadre and salary information
- ✓ Ministry and department assignments
- ✓ All user accounts and roles
- ✓ All request workflows
- ✓ Complete audit trail
- ✓ System settings

### What's Excluded
- ✗ Employee certificates (in MinIO)
- ✗ Employment contracts (in MinIO)
- ✗ Profile photos (in MinIO)
- ✗ Other documents (in MinIO)

### Recovery Steps
```bash
# 1. Transfer to new VPS
scp csms-disaster-recovery-with-employees-*.tar.gz user@new-vps:/path/

# 2. Extract and recover
tar -xzf csms-disaster-recovery-with-employees-*.tar.gz
cd csms-disaster-recovery-with-employees-*
export PGPASSWORD="your_password"
psql -U postgres -c "CREATE DATABASE nody;"
psql -U postgres -d nody -f schema_full_*.sql
psql -U postgres -d nody -f nody_with_employees_*.sql

# 3. Configure MinIO and deploy
# See DISASTER_RECOVERY_WITH_EMPLOYEES.md for details
```

### Pros
- Complete data preservation
- No need to re-import employees from HRIMS
- Faster full recovery
- Employee profiles immediately available

### Cons
- Larger backup size (5.2MB vs 1.9MB)
- Includes all employee data (may include sensitive info)

---

## Option 2: Without Employee Data

**Best for:** When backup size is critical or employee data available in HRIMS

### Backup Archive
- **File:** `csms-disaster-recovery-20260528_212614.tar.gz`
- **Size:** 1.9MB
- **Location:** `docs/database/`

### What's Included
- ✓ All user accounts and roles
- ✓ All request workflows
- ✓ Complete audit trail
- ✓ System settings
- ✓ Institutions

### What's Excluded
- ✗ Employee table (entirely)
- ✗ Employee certificates (in MinIO)

### Recovery Steps
```bash
# 1. Transfer to new VPS
scp csms-disaster-recovery-*.tar.gz user@new-vps:/path/

# 2. Extract and recover
tar -xzf csms-disaster-recovery-*.tar.gz
cd csms-disaster-recovery-*
export PGPASSWORD="your_password"
psql -U postgres -c "CREATE DATABASE nody;"
psql -U postgres -d nody -f schema_*.sql
psql -U postgres -d nody -f nody_full_*.sql

# 3. Re-import employees from HRIMS
# 4. Configure MinIO and deploy
```

### Pros
- Smaller backup size
- Faster backup and restore
- No sensitive employee data in backup

### Cons
- Must re-import employees from HRIMS
- Longer total recovery time
- Request workflows won't have employee references until re-import

---

## Recommendation

**Use Option 1 (With Employees)** for production systems:
- Complete data preservation
- No dependency on HRIMS for recovery
- Faster total recovery time
- Employee data immediately available

**Use Option 2 (Without Employees)** when:
- Backup storage is extremely limited
- Employee data is readily available in HRIMS
- You want to exclude sensitive data from backups

## Creating New Backups

### With Employee Data
```bash
cd /home/latest/docs/database
export PGPASSWORD="Mamlaka2020"
./backup-with-employees.sh
./package-backup-with-employees.sh
```

### Without Employee Data
```bash
cd /home/latest/docs/database
export PGPASSWORD="Mamlaka2020"
./backup-full.sh
./package-backup.sh
```

## Automated Backups

### Daily Backup (Recommended)
```bash
# Add to crontab
0 2 * * * cd /home/latest/docs/database && PGPASSWORD="Mamlaka2020" ./backup-with-employees.sh

# Weekly package
0 3 * * 0 cd /home/latest/docs/database && ./package-backup-with-employees.sh

# Cleanup old backups (keep 7 days)
0 4 * * * find /home/latest/docs/database -name "nody_with_employees_*.sql" -mtime +7 -delete
0 4 * * * find /home/latest/docs/database -name "schema_full_*.sql" -mtime +7 -delete
```

## Document Recovery (MinIO)

Employee documents are stored separately in MinIO:

```bash
# Check MinIO status
mc alias set local http://localhost:9000 minioadmin minioadmin
mc ls local/csms-documents/

# Restore from MinIO backup (if available)
mc mirror /backup/minio/csms-documents local/csms-documents
```

If no MinIO backup:
1. Documents can be re-uploaded through the application
2. Or re-imported from HRIMS if available

## Security Considerations

### With Employee Data
- Backup contains sensitive employee information
- Encrypt backup before storing offsite
- Limit access to backup files
- Consider excluding from public repositories

### Without Employee Data
- Backup contains less sensitive data
- Still contains user accounts and audit logs
- Encrypt and protect appropriately

## Testing Recovery

Always test recovery procedures:

```bash
# Test in isolated environment
createdb nody_test
psql -d nody_test -f schema_full_*.sql
psql -d nody_test -f nody_with_employees_*.sql

# Verify data
psql -d nody_test -c "SELECT count(*) FROM \"Employee\";"
psql -d nody_test -c "SELECT count(*) FROM \"User\";"

# Cleanup
dropdb nody_test
```

## Files in This Directory

```
docs/database/
├── csms-disaster-recovery-with-employees-20260528_220934.tar.gz  # 5.2MB
├── csms-disaster-recovery-20260528_212614.tar.gz                 # 1.9MB
├── backup-with-employees.sh
├── backup-full.sh
├── package-backup-with-employees.sh
├── package-backup.sh
├── disaster-recovery.sh
├── restore.sh
├── schema.prisma
├── README.md
├── DISASTER_RECOVERY.md
├── DISASTER_RECOVERY_WITH_EMPLOYEES.md
├── BACKUP_MANIFEST.md
├── BACKUP_OPTIONS.md (this file)
├── MIGRATION_CHANGELOG.md
└── migrations/
    └── (8 migration files)
```

## Quick Reference

### Recommended Backup Command
```bash
cd /home/latest/docs/database
export PGPASSWORD="Mamlaka2020"
./backup-with-employees.sh && ./package-backup-with-employees.sh
```

### Recovery Command (With Employees)
```bash
tar -xzf csms-disaster-recovery-with-employees-*.tar.gz
cd csms-disaster-recovery-with-employees-*
psql -U postgres -c "CREATE DATABASE nody;"
psql -U postgres -d nody -f schema_full_*.sql
psql -U postgres -d nody -f nody_with_employees_*.sql
```

### Recovery Command (Without Employees)
```bash
tar -xzf csms-disaster-recovery-*.tar.gz
cd csms-disaster-recovery-*
psql -U postgres -c "CREATE DATABASE nody;"
psql -U postgres -d nody -f schema_*.sql
psql -U postgres -d nody -f nody_full_*.sql
```
