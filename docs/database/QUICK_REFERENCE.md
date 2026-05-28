# CSMS Disaster Recovery - Quick Reference Card

## 🚨 EMERGENCY RECOVERY (5-10 Minutes)

### With Employee Data (Recommended)
```bash
# 1. Get backup from GitHub
git clone https://github.com/yussufrajab/nextjs.git
cd nextjs/docs/database

# 2. Restore database
tar -xzf csms-disaster-recovery-with-employees-*.tar.gz
cd csms-disaster-recovery-with-employees-*
psql -U postgres -c "CREATE DATABASE nody;"
psql -U postgres -d nody -f schema_full_*.sql
psql -U postgres -d nody -f nody_with_employees_*.sql

# 3. Deploy application
cd /path/to/csms
npm install && npm run build && npm start
```

### Without Employee Data
```bash
tar -xzf csms-disaster-recovery-*.tar.gz
cd csms-disaster-recovery-*
psql -U postgres -c "CREATE DATABASE nody;"
psql -U postgres -d nody -f schema_*.sql
psql -U postgres -d nody -f nody_full_*.sql
# Re-import employees from HRIMS
```

## 📦 BACKUP FILES

| File | Size | Contents |
|------|------|----------|
| `csms-disaster-recovery-with-employees-*.tar.gz` | 5.2MB | Everything except MinIO docs |
| `csms-disaster-recovery-*.tar.gz` | 1.9MB | No employee data |

## 🔄 CREATE NEW BACKUP

```bash
cd /home/latest/docs/database
export PGPASSWORD="Mamlaka2020"

# With employees (recommended)
./backup-with-employees.sh
./package-backup-with-employees.sh

# Without employees
./backup-full.sh
./package-backup.sh
```

## 📋 WHAT'S INCLUDED

### Option 1 (With Employees)
- ✓ Employee personal data
- ✓ All users and roles
- ✓ All request workflows
- ✓ Audit logs
- ✗ Documents (in MinIO)

### Option 2 (Without Employees)
- ✓ All users and roles
- ✓ All request workflows
- ✓ Audit logs
- ✗ Employee data
- ✗ Documents (in MinIO)

## 🔐 MINIO DOCUMENTS

Employee documents are in MinIO, not in backup:
```bash
# Check MinIO
mc alias set local http://localhost:9000 minioadmin minioadmin
mc ls local/csms-documents/

# Restore documents (if backup available)
mc mirror /backup/minio/csms-documents local/csms-documents
```

## 📖 DETAILED DOCS

- `BACKUP_OPTIONS.md` - Full comparison
- `DISASTER_RECOVERY_WITH_EMPLOYEES.md` - Recovery guide (with employees)
- `DISASTER_RECOVERY.md` - Recovery guide (without employees)
- `BACKUP_MANIFEST.md` - Complete contents list

## ⚡ AUTOMATED BACKUPS

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * cd /home/latest/docs/database && PGPASSWORD="Mamlaka2020" ./backup-with-employees.sh

# Weekly package on Sunday at 3 AM
0 3 * * 0 cd /home/latest/docs/database && ./package-backup-with-employees.sh
```

## 🆘 TROUBLESHOOTING

### Database connection error
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Restore fails
```bash
# Check file integrity
head -20 schema_full_*.sql
head -20 nody_with_employees_*.sql
```

### Documents not loading
1. Check MinIO connection in `.env`
2. Verify MinIO is running
3. Check application logs

---

**Last Updated:** 2026-05-28
**GitHub:** github.com/yussufrajab/nextjs
