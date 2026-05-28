#!/bin/bash
# Backup CSMS core database (User, Institution, SystemSettings only)
# Excludes Employee, all request types, AuditLog, Notification, Complaint, Session, MfaToken

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-nody}"
DB_USER="${DB_USER:-postgres}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$SCRIPT_DIR/nody_core_${TIMESTAMP}.sql"

echo "Backing up core tables from '$DB_NAME'..."
echo "  Including: User, Institution, SystemSettings"
echo "  Output: $BACKUP_FILE"

PGPASSWORD="${PGPASSWORD:-}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --exclude-table='"Employee"' \
  --exclude-table='"EmployeeCertificate"' \
  --exclude-table='"CadreChangeRequest"' \
  --exclude-table='"ConfirmationRequest"' \
  --exclude-table='"LwopRequest"' \
  --exclude-table='"PromotionRequest"' \
  --exclude-table='"ResignationRequest"' \
  --exclude-table='"RetirementRequest"' \
  --exclude-table='"SeparationRequest"' \
  --exclude-table='"ServiceExtensionRequest"' \
  --exclude-table='"AuditLog"' \
  --exclude-table='"Notification"' \
  --exclude-table='"Complaint"' \
  --exclude-table='"Session"' \
  --exclude-table='"MfaToken"' \
  --exclude-schema='audit' \
  --clean --if-exists \
  -f "$BACKUP_FILE"

echo "Backup complete: $(du -h "$BACKUP_FILE" | cut -f1)"