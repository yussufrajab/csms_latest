# Database Documentation

This directory contains the database schema, migrations, and documentation for the CSMS PostgreSQL database.

## Overview

The CSMS application uses PostgreSQL with Prisma ORM for database management. The database handles all HR operations including employee management, requests workflows, and audit logging.

## Schema Overview

### Core Entities

- **Employee**: Central entity for civil service employees
- **User**: System users with role-based access control
- **Institution**: Government institutions/organizations

### Request Types

All request types follow a consistent workflow pattern with status tracking and review stages:

- **CadreChangeRequest**: Employee cadre changes
- **ConfirmationRequest**: Employee confirmation requests
- **LwopRequest**: Leave Without Pay requests
- **PromotionRequest**: Employee promotion requests
- **ResignationRequest**: Employee resignation requests
- **RetirementRequest**: Employee retirement requests
- **SeparationRequest**: Employee separation requests
- **ServiceExtensionRequest**: Service extension requests

### Common Fields Across Request Types

- `id`: Unique identifier
- `status`: Current status (PENDING, REVIEWED, APPROVED, REJECTED, etc.)
- `reviewStage`: Current review stage in the workflow
- `employeeId`: Reference to the employee
- `submittedById`: Reference to the user who submitted
- `reviewedById`: Reference to the user who reviewed
- `documents`: Array of document URLs
- `rejectionReason`: Reason for rejection (if applicable)
- `createdAt`/`updatedAt`: Timestamps

### HRRP Review Fields (Added May 2025)

Request types now include HRRP (Human Resource Review Panel) review tracking:

- `hrrpReviewedById`: Reference to the HRRP reviewer
- `hrrpReviewedAt`: Timestamp of HRRP review
- `commissionLetterKey`: Key for commission letter
- `decisionDate`: Date of decision
- `commissionDecisionDate`: Date of commission decision

### Audit Logging

The system uses a partitioned audit logging system in a separate `audit` schema:

- Monthly partitions for efficient data management
- Comprehensive event tracking
- Security event logging
- Performance monitoring

## Recent Schema Changes

### May 2025 Updates

1. **HRRP Review Fields** (2026-05-25)
   - Added HRRP review tracking to ConfirmationRequest, LwopRequest, PromotionRequest
   - Added `hrrpReviewedById`, `hrrpReviewedAt`, `commissionLetterKey` fields
   - Added `decisionDate`, `commissionDecisionDate` fields

2. **Audit Logging Enhancements** (2026-05-22)
   - Migrated to partitioned audit log table in `audit` schema
   - Added `deviceInfo` JSON field (replaced `userAgent`)
   - Changed `wasBlocked` default to `false`
   - Monthly partitions from 2025-11 to 2027-05

### January 2025 Updates

1. **Institution Fields** (2026-01-04)
   - Added `email`, `phoneNumber`, `voteNumber`, `tinNumber` to Institution
   - Added unique constraint on `tinNumber`

## Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| `20250712105050_init` | 2025-07-12 | Initial database schema |
| `20250715102327_add_commission_decision_reason_to_promotion` | 2025-07-15 | Added commission decision reason to promotions |
| `20260104120500_add_institution_fields` | 2026-01-04 | Added institution contact fields |
| `20260522000000_add_audit_comprehensive_logging` | 2026-05-22 | Enhanced audit logging |
| `20260522010000_migrate_audit_to_partitioned` | 2026-05-22 | Migrated to partitioned audit table |
| `20260525000000_add_hrrp_review_fields` | 2026-05-25 | Added HRRP review fields to ConfirmationRequest |
| `20260525010000_add_hrrp_review_fields_to_lwop` | 2026-05-25 | Added HRRP review fields to LwopRequest |
| `20260525020000_add_hrrp_review_fields_to_promotion` | 2026-05-25 | Added HRRP review fields to PromotionRequest |

## Database Maintenance

### Backup

Use the backup script to create database backups:

```bash
./backup.sh
```

### Restore

Use the restore script to restore from backup:

```bash
./restore.sh <backup_file>
```

## Schema File

The current schema is located in `schema.prisma`. This file should be kept in sync with the main `prisma/schema.prisma` file in the project root.

## Performance Considerations

- Indexes are added on frequently queried fields
- Audit log uses monthly partitions for efficient data management
- Foreign key constraints ensure data integrity

## Security

- All user passwords are hashed
- Session management with expiration tracking
- Failed login attempt tracking with lockout mechanisms
- Audit logging for security events