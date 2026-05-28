# CSMS Complete Disaster Recovery Package

## Package Overview

This directory contains everything needed to restore the CSMS application on a new VPS.

**Total Files:** 34  
**Documentation:** ~68KB (9 guides)  
**Backup Archives:** 7.1MB (2 options)  
**Last Updated:** 2026-05-28

---

## Backup Archives

### Option 1: With Employee Data (Recommended)
- **File:** `csms-disaster-recovery-with-employees-20260528_220934.tar.gz`
- **Size:** 5.2MB
- **Contents:** Complete database with employee data, excluding MinIO documents
- **Recovery Time:** ~10 minutes

### Option 2: Without Employee Data
- **File:** `csms-disaster-recovery-20260528_212614.tar.gz`
- **Size:** 1.9MB
- **Contents:** Database without employee data (requires HRIMS re-import)
- **Recovery Time:** ~5 minutes

---

## Documentation Files

### Essential Guides (Start Here)

1. **RESTORE_GUIDE.md** (19KB) - ⭐ START HERE
   - Complete step-by-step restoration instructions
   - Covers VPS setup to application deployment
   - Includes troubleshooting for common issues

2. **QUICK_REFERENCE.md** (3KB)
   - Copy-paste commands for emergency recovery
   - Quick reference for backups and restoration

3. **BACKUP_OPTIONS.md** (7KB)
   - Comparison of backup options
   - Which backup to use and when

### Detailed Guides

4. **DISASTER_RECOVERY_WITH_EMPLOYEES.md** (8KB)
   - Recovery guide for backup with employee data

5. **DISASTER_RECOVERY.md** (6KB)
   - Recovery guide for backup without employee data

6. **BACKUP_MANIFEST.md** (4KB)
   - Detailed list of what's in each backup

### Reference Documentation

7. **README.md** (5KB)
   - Database schema overview
   - Architecture documentation

8. **MIGRATION_CHANGELOG.md** (6KB)
   - All database migrations in detail

9. **UPDATE_SUMMARY.md** (5KB)
   - Recent changes summary

---

## Backup Scripts

### Primary Backup Scripts

- **backup-with-employees.sh** (2.5KB)
  Creates backup including employee data (excludes documents)
  ```bash
  ./backup-with-employees.sh
  ```

- **backup-full.sh** (2.6KB)
  Creates backup excluding employee data
  ```bash
  ./backup-full.sh
  ```

### Packaging Scripts

- **package-backup-with-employees.sh** (3.0KB)
  Creates compressed archive with employee data
  ```bash
  ./package-backup-with-employees.sh
  ```

- **package-backup.sh** (2.8KB)
  Creates compressed archive without employee data
  ```bash
  ./package-backup.sh
  ```

### Recovery Scripts

- **disaster-recovery.sh** (2.9KB)
  Automated recovery script

- **restore.sh** (1.1KB)
  Basic restore utility

---

## Database Files

### Schema Files
- **schema.prisma** (26KB) - Prisma ORM schema
- **schema_full_*.sql** (122KB) - PostgreSQL schema SQL
- **schema_*.sql** (122KB) - Schema without employee table

### Data Backups
- **nody_with_employees_*.sql** (30MB) - Full data with employees
- **nody_full_*.sql** (11MB) - Data without employees
- **nody_core_*.sql** (80-87KB) - Core tables only

---

## Quick Start Guide

### For Emergency Recovery (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/yussufrajab/nextjs.git
cd nextjs/docs/database

# 2. Extract backup
tar -xzf csms-disaster-recovery-with-employees-*.tar.gz
cd csms-disaster-recovery-with-employees-*

# 3. Restore database
sudo -u postgres createdb nody
sudo -u postgres psql -d nody -f schema_full_*.sql
sudo -u postgres psql -d nody -f nody_with_employees_*.sql

# 4. Verify
sudo -u postgres psql -d nody -c "SELECT count(*) FROM \"Employee\";"
```

### For Complete Setup (30-60 minutes)

Follow `RESTORE_GUIDE.md` for complete instructions including:
- VPS setup (PostgreSQL, Node.js, MinIO)
- Database restoration
- Application deployment
- SSL and Nginx configuration
- Automated backups

---

## What's Included in Each Backup

### With Employee Data (5.2MB)
- ✓ Employee personal information
- ✓ All system users
- ✓ All institutions
- ✓ All request workflows
- ✓ Audit logs
- ✓ System settings
- ✗ Employee documents (in MinIO)

### Without Employee Data (1.9MB)
- ✓ All system users
- ✓ All institutions
- ✓ All request workflows
- ✓ Audit logs
- ✓ System settings
- ✗ Employee data
- ✗ Employee documents (in MinIO)

---

## File Structure

```
docs/database/
├── README.md                    # Database overview
├── RESTORE_GUIDE.md             # Step-by-step restoration
├── QUICK_REFERENCE.md           # Quick commands
├── BACKUP_OPTIONS.md            # Backup comparison
├── DISASTER_RECOVERY_WITH_EMPLOYEES.md  # Recovery guide (with employees)
├── DISASTER_RECOVERY.md         # Recovery guide (without employees)
├── BACKUP_MANIFEST.md           # Backup contents
├── MIGRATION_CHANGELOG.md       # Migration history
├── UPDATE_SUMMARY.md            # Recent changes
├── COMPLETE_PACKAGE_SUMMARY.md  # This file
│
├── backup-with-employees.sh     # Backup script
├── backup-full.sh               # Backup without employees
├── package-backup-with-employees.sh  # Package script
├── package-backup.sh            # Package without employees
├── disaster-recovery.sh         # Recovery script
├── restore.sh                   # Restore utility
│
├── schema.prisma                # Prisma schema
├── schema_full_*.sql            # Full schema SQL
├── nody_with_employees_*.sql    # Data with employees
├── nody_full_*.sql              # Data without employees
└── migrations/                  # Database migrations
```

---

## Support

### Documentation
- Start with `RESTORE_GUIDE.md` for complete instructions
- Use `QUICK_REFERENCE.md` for emergency commands
- Check `BACKUP_OPTIONS.md` to choose the right backup

### Troubleshooting
- See "Troubleshooting" section in `RESTORE_GUIDE.md`
- Check application logs: `pm2 logs csms`
- Check system logs: `sudo journalctl -f`

### Commands
```bash
# View all documentation
ls -lh /home/latest/docs/database/*.md

# View all backups
ls -lh /home/latest/docs/database/*.tar.gz

# Create new backup
./backup-with-employees.sh
./package-backup-with-employees.sh
```

---

## GitHub Repository

All files are pushed to: `github.com/yussufrajab/nextjs`

### Recent Commits
```
13214256 docs: add comprehensive step-by-step database restoration guide
5291905a docs: add quick reference card for disaster recovery
9620bc88 docs: add backup options comparison guide
467d8c0d feat: add disaster recovery backup with employee data
ee666e06 docs: add backup manifest documenting disaster recovery contents
8414bc16 feat: add disaster recovery backup excluding employee data
4d72a02b docs: update database documentation with recent schema changes
```

---

## Recommended Recovery Workflow

1. **Choose Backup:** Use "With Employee Data" (5.2MB) for complete recovery
2. **Follow Guide:** Start with `RESTORE_GUIDE.md`
3. **Quick Commands:** Use `QUICK_REFERENCE.md` for copy-paste commands
4. **Verify:** Use checklists in `RESTORE_GUIDE.md`
5. **Post-Setup:** Configure SSL, Nginx, automated backups

---

**Package Created:** 2026-05-28  
**Location:** `/home/latest/docs/database/`  
**GitHub:** `github.com/yussufrajab/nextjs/tree/main/docs/database`
