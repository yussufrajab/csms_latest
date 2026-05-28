# Database Documentation Update Summary

**Date:** 2026-05-28

## Overview

Updated all database documentation in `/home/latest/docs/database/` to reflect recent schema changes.

## Changes Made

### 1. Updated Schema File (`schema.prisma`)

Synced with the current production schema from `/home/latest/prisma/schema.prisma`.

**Key Changes:**
- Added HRRP review fields to all request types
- Added `email` field to Employee model
- Added indexes on `hrrpReviewedById` fields
- Added `MfaToken` model
- Updated `Notification` model with indexes
- Removed `AuditLog` model (moved to partitioned table in `audit` schema)

### 2. Updated Migrations Folder

Copied all new migrations from `/home/latest/prisma/migrations/`:

| Migration | Description |
|-----------|-------------|
| `20260522000000_add_audit_comprehensive_logging` | Enhanced audit logging fields |
| `20260522010000_migrate_audit_to_partitioned` | Partitioned audit table |
| `20260525000000_add_hrrp_review_fields` | HRRP review for ConfirmationRequest |
| `20260525010000_add_hrrp_review_fields_to_lwop` | HRRP review for LwopRequest |
| `20260525020000_add_hrrp_review_fields_to_promotion` | HRRP review for PromotionRequest |

### 3. Updated Backup Script (`backup.sh`)

**Changes:**
- Added `MfaToken` to exclusion list
- Added `--exclude-schema='audit'` to exclude partitioned audit tables
- Ensures backup only includes core configuration tables

### 4. Created Documentation Files

#### `README.md`
- Overview of database schema
- Description of core entities and request types
- List of recent schema changes
- Migration history table
- Database maintenance instructions

#### `MIGRATION_CHANGELOG.md`
- Detailed documentation of all migrations
- SQL changes for each migration
- Purpose and impact of each change
- Migration best practices
- Rollback procedures

#### `UPDATE_SUMMARY.md`
- This file
- Summary of all changes made during this update

### 5. Created New Backup

- `nody_core_20260528_211830.sql` (87K)
- Includes current User, Institution, and SystemSettings data
- Excludes MfaToken and audit schema

## Schema Changes Summary

### New Fields Added

**All Request Types (CadreChange, Confirmation, LWOP, Promotion, Resignation, Retirement, Separation, ServiceExtension):**
- `hrrpReviewedById` - HRRP reviewer user ID
- `hrrpReviewedAt` - HRRP review timestamp
- `commissionLetterKey` - Commission letter key
- `decisionDate` - Decision date
- `commissionDecisionDate` - Commission decision date

**Employee:**
- `email` - Employee email address

**Notification:**
- Added indexes on `userId`, `createdAt`, `isRead`

### New Models

**MfaToken:**
- Multi-factor authentication token management
- Supports OTP and Magic Link token types
- Tracks email, attempts, expiration, and usage

### Removed Models

**AuditLog (public schema):**
- Migrated to partitioned table in `audit` schema
- Improved performance and data management

## File Structure

```
docs/database/
├── backup.sh                 # Database backup script (updated)
├── restore.sh                # Database restore script
├── schema.prisma             # Current schema (updated)
├── README.md                 # Documentation overview (new)
├── MIGRATION_CHANGELOG.md    # Migration details (new)
├── UPDATE_SUMMARY.md         # This file (new)
├── nody_core_20260518_123735.sql  # Previous backup
├── nody_core_20260528_211830.sql  # New backup
└── migrations/
    ├── 20250712105050_init/
    ├── 20250715102327_add_commission_decision_reason_to_promotion/
    ├── 20260104120500_add_institution_fields/
    ├── 20260522000000_add_audit_comprehensive_logging/      # New
    ├── 20260522010000_migrate_audit_to_partitioned/          # New
    ├── 20260525000000_add_hrrp_review_fields/               # New
    ├── 20260525010000_add_hrrp_review_fields_to_lwop/       # New
    └── 20260525020000_add_hrrp_review_fields_to_promotion/  # New
```

## Verification

To verify the documentation is up to date:

1. Compare schema files:
   ```bash
   diff /home/latest/prisma/schema.prisma /home/latest/docs/database/schema.prisma
   ```

2. Check migration count:
   ```bash
   ls -1 /home/latest/docs/database/migrations/ | wc -l
   ls -1 /home/latest/prisma/migrations/ | wc -l
   ```

3. Verify backup works:
   ```bash
   cd /home/latest/docs/database && ./backup.sh
   ```

## Next Steps

- Review documentation for accuracy
- Test backup/restore procedures
- Update any related documentation in other folders
- Commit changes to version control