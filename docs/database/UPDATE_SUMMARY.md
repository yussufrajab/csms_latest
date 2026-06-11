# Database Documentation Update Summary

**Date:** 2026-06-11

## Overview

Updated all database documentation and created fresh backup reflecting the complete live schema including 2 additional migrations that were not captured in the 2026-05-28 backup.

## Changes Made

### 1. Updated Schema File (`schema.prisma`)

Synced with the current production schema from `/home/nextjstest/csms/prisma/schema.prisma`.

### 2. Updated Migrations Folder

Copied live migrations that were missing from docs (2 new migrations):

| Migration | Description |
|-----------|-------------|
| `20260602000000_add_missing_columns` | Added `email` to Employee; `hrrpReviewedById`, `hrrpReviewedAt`, `commissionLetterKey` to CadreChange/Retirement/Separation/ServiceExtension/Resignation requests; `commissionLetterKey` to Confirmation/Promotion/Lwop |
| `20260602010000_add_decision_date_columns` | Added `decisionDate` and `commissionDecisionDate` to 7 request tables |

### 3. Updated Migration Changelog

Added detailed documentation of the 2 new migrations to `MIGRATION_CHANGELOG.md`.

### 4. Created Fresh Backups

| Backup File | Date | Size | Description |
|-------------|------|------|-------------|
| `nody_with_employees_20260611_191958.sql` | 2026-06-11 | 28M | Full data backup including employees (excludes EmployeeCertificate) |
| `schema_full_20260611_191955.sql` | 2026-06-11 | 120K | Schema-only backup |

### 5. Schema Drift Detected (May 28 vs June 11)

The docs backup from 2026-05-28 was missing 2 migrations that were present on the live database:
- `20260602000000_add_missing_columns` — Completes HRRP fields across all request types
- `20260602010000_add_decision_date_columns` — Adds decision date tracking across all tables

Both migrations are now synced into the docs folder.

## File Structure

```
docs/database/
├── backup.sh                          # Database backup script (core only)
├── backup-full.sh                     # Database backup script (full)
├── backup-with-employees.sh           # Database backup script (with employees)
├── restore.sh                         # Database restore script
├── disaster-recovery.sh               # Automated disaster recovery
├── package-backup.sh                  # Package recovery archive
├── package-backup-with-employees.sh   # Package recovery archive (with employees)
├── schema.prisma                      # Current schema (updated 2026-06-11)
├── README.md
├── MIGRATION_CHANGELOG.md             # Updated with 2 new migrations
├── UPDATE_SUMMARY.md                  # This file (updated 2026-06-11)
├── QUICK_REFERENCE.md
├── DISASTER_RECOVERY.md
├── DISASTER_RECOVERY_WITH_EMPLOYEES.md
├── RESTORE_GUIDE.md
├── COMPLETE_PACKAGE_SUMMARY.md
├── BACKUP_MANIFEST.md
├── BACKUP_OPTIONS.md
├── *.tar.gz archives
├── *.sql backups
└── migrations/
    ├── 20250712105050_init/
    ├── 20250715102327_add_commission_decision_reason_to_promotion/
    ├── 20260104120500_add_institution_fields/
    ├── 20260522000000_add_audit_comprehensive_logging/
    ├── 20260522010000_migrate_audit_to_partitioned/
    ├── 20260525000000_add_hrrp_review_fields/
    ├── 20260525010000_add_hrrp_review_fields_to_lwop/
    ├── 20260525020000_add_hrrp_review_fields_to_promotion/
    ├── 20260602000000_add_missing_columns/         # NEW
    └── 20260602010000_add_decision_date_columns/   # NEW
```

## Verification

To verify the documentation is up to date:

1. Compare schema files:
   ```bash
   diff /home/nextjstest/csms/prisma/schema.prisma /home/nextjstest/csms/docs/database/schema.prisma
   ```

2. Check migration count (should match: 10 migrations):
   ```bash
   echo "Docs: $(ls -1d /home/nextjstest/csms/docs/database/migrations/2026*/ 2>/dev/null | wc -l)"
   echo "Live: $(ls -1d /home/nextjstest/csms/prisma/migrations/2026*/ 2>/dev/null | wc -l)"
   ```

3. Verify backup integrity:
   ```bash
   head -5 /home/nextjstest/csms/docs/database/nody_with_employees_20260611_191958.sql
   ```
