# Migration Changelog

This document tracks all database migrations and their changes in detail.

## 2026-05-25: HRRP Review Fields

### Migration: `20260525000000_add_hrrp_review_fields`

**Affected Table:** `ConfirmationRequest`

**Changes:**
- Added `hrrpReviewedById` (TEXT) - Reference to the HRRP reviewer user
- Added `hrrpReviewedAt` (TIMESTAMP) - Timestamp when HRRP review was completed
- Added index on `hrrpReviewedById`
- Added foreign key constraint to `User` table

**Purpose:** Track Human Resource Review Panel review status for confirmation requests.

---

### Migration: `20260525010000_add_hrrp_review_fields_to_lwop`

**Affected Table:** `LwopRequest`

**Changes:**
- Added `hrrpReviewedById` (TEXT) - Reference to the HRRP reviewer user
- Added `hrrpReviewedAt` (TIMESTAMP) - Timestamp when HRRP review was completed
- Added index on `hrrpReviewedById`
- Added foreign key constraint to `User` table

**Purpose:** Track Human Resource Review Panel review status for leave without pay requests.

---

### Migration: `20260525020000_add_hrrp_review_fields_to_promotion`

**Affected Table:** `PromotionRequest`

**Changes:**
- Added `hrrpReviewedById` (TEXT) - Reference to the HRRP reviewer user
- Added `hrrpReviewedAt` (TIMESTAMP) - Timestamp when HRRP review was completed
- Added index on `hrrpReviewedById`
- Added foreign key constraint to `User` table

**Purpose:** Track Human Resource Review Panel review status for promotion requests.

---

## 2026-05-22: Audit Logging Enhancements

### Migration: `20260522000000_add_audit_comprehensive_logging`

**Affected Table:** `AuditLog`

**Changes:**
- Dropped `userAgent` column
- Added `deviceInfo` (JSON) - Stores device information as structured JSON
- Changed `wasBlocked` default from `true` to `false`

**Purpose:** Improve audit logging with structured device information and better defaults.

---

### Migration: `20260522010000_migrate_audit_to_partitioned`

**Affected Schema:** `audit` (new schema)

**Changes:**
- Created new `audit` schema
- Created partitioned `audit_log` table with monthly partitions
- Migrated data from old `public."AuditLog"` table
- Dropped old `public."AuditLog"` table

**New Table Structure:**
```sql
CREATE TABLE audit.audit_log (
    id BIGSERIAL,
    event_id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id TEXT,
    username TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    event_category TEXT NOT NULL DEFAULT 'SYSTEM',
    severity TEXT NOT NULL DEFAULT 'INFO',
    entity_type TEXT NOT NULL DEFAULT 'SYSTEM',
    entity_id TEXT,
    ip_address INET,
    device_info JSONB,
    request_method TEXT,
    request_route TEXT NOT NULL,
    is_authenticated BOOLEAN DEFAULT false,
    was_blocked BOOLEAN DEFAULT false,
    block_reason TEXT,
    additional_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
```

**Partitions Created:**
- Monthly partitions from 2025-11 to 2027-05 (19 partitions)
- Each partition covers one calendar month

**Indexes Created:**
- `idx_audit_log_action`
- `idx_audit_log_event_category`
- `idx_audit_log_severity`
- `idx_audit_log_user_id`
- `idx_audit_log_created_at`
- `idx_audit_log_request_route`
- `idx_audit_log_event_id`

**Purpose:** Improve audit log performance and management through partitioning. Enables efficient querying by date range and automatic data lifecycle management.

---

## 2026-01-04: Institution Fields

### Migration: `20260104120500_add_institution_fields`

**Affected Table:** `Institution`

**Changes:**
- Added `email` (TEXT) - Institution email address
- Added `phoneNumber` (TEXT) - Institution phone number
- Added `voteNumber` (TEXT) - Government vote number
- Added `tinNumber` (TEXT) - Tax Identification Number
- Added unique constraint on `tinNumber`

**Purpose:** Store additional contact and identification information for institutions.

---

## 2025-07-15: Commission Decision Reason

### Migration: `20250715102327_add_commission_decision_reason_to_promotion`

**Affected Table:** `PromotionRequest`

**Changes:**
- Added `commissionDecisionReason` (TEXT) - Reason for commission's decision

**Purpose:** Track the reason behind commission decisions on promotion requests.

---

## 2025-07-12: Initial Schema

### Migration: `20250712105050_init`

**Tables Created:**
- `CadreChangeRequest`
- `Complaint`
- `ConfirmationRequest`
- `Employee`
- `EmployeeCertificate`
- `Institution`
- `LwopRequest`
- `Notification`
- `PromotionRequest`
- `ResignationRequest`
- `RetirementRequest`
- `SeparationRequest`
- `ServiceExtensionRequest`
- `User`
- `AuditLog`
- `Session`
- `SystemSettings`

**Purpose:** Initial database schema for the CSMS application.

---

## 2026-06-02: Remaining HRRP Fields & Decision Dates (LIVE — added after docs backup)

### Migration: `20260602000000_add_missing_columns`

**Affected Tables:** `Employee`, `CadreChangeRequest`, `ConfirmationRequest`, `PromotionRequest`, `LwopRequest`, `RetirementRequest`, `SeparationRequest`, `ServiceExtensionRequest`, `ResignationRequest`

**Changes:**
- Added `email` (TEXT) to `Employee`
- Added `hrrpReviewedById` (TEXT), `hrrpReviewedAt` (TIMESTAMP), `commissionLetterKey` (TEXT) to remaining request tables: `CadreChangeRequest`, `RetirementRequest`, `SeparationRequest`, `ServiceExtensionRequest`, `ResignationRequest`
- Added `commissionLetterKey` (TEXT) to `ConfirmationRequest`, `PromotionRequest`, `LwopRequest`
- Added 5 indexes on `hrrpReviewedById` for all newly added columns
- Added 5 foreign key constraints linking `hrrpReviewedById` to `User` table

**Purpose:** Complete the HRRP review workflow across all request types and add commission letter tracking.

---

### Migration: `20260602010000_add_decision_date_columns`

**Affected Tables:** `CadreChangeRequest`, `LwopRequest`, `PromotionRequest`, `RetirementRequest`, `SeparationRequest`, `ServiceExtensionRequest`, `ResignationRequest`

**Changes:**
- Added `decisionDate` (TIMESTAMP) to 7 request tables
- Added `commissionDecisionDate` (TIMESTAMP) to 7 request tables

**Purpose:** Track decision and commission decision dates across all request types for audit and reporting.

---

## Migration Best Practices

1. **Always backup** before running migrations in production
2. **Test migrations** in a development environment first
3. **Review migration SQL** before applying
4. **Document changes** in this changelog
5. **Use transactions** where possible (Prisma handles this automatically)

## Rollback Procedures

For rollback procedures, refer to the individual migration files. Each migration contains the SQL statements needed to apply the changes. To rollback:

1. Create a new migration with reverse SQL statements
2. Test in development environment
3. Apply to production with proper backup

## Related Files

- `schema.prisma` - Current database schema
- `backup.sh` - Database backup script (updated to exclude MfaToken and audit schema)
- `restore.sh` - Database restore script
- `nody_core_YYYYMMDD_HHMMSS.sql` - Database backup files
- `README.md` - Database documentation overview

## Recent Backups

| Backup File | Date | Size |
|-------------|------|------|
| `nody_with_employees_20260611_191958.sql` | 2026-06-11 | 28M |
| `schema_full_20260611_191955.sql` | 2026-06-11 | 120K |
| `nody_full_20260601_074200.sql` | 2026-06-01 | 31M |
| `nody_core_20260528_211830.sql` | 2026-05-28 | 87K |
| `nody_core_20260518_123735.sql` | 2026-05-18 | 80K |