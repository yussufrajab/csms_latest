#!/bin/bash
# Backup CSMS database including employee data but excluding documents
# Employee documents are stored in MinIO and don't need to be in database backup
# This backup includes all employee personal information and workflow data

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-nody}"
DB_USER="${DB_USER:-postgres}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$SCRIPT_DIR/nody_with_employees_${TIMESTAMP}.sql"
BACKUP_SCHEMA="$SCRIPT_DIR/schema_full_${TIMESTAMP}.sql"

echo "=========================================="
echo "CSMS Full Backup (Including Employees, Excluding Documents)"
echo "=========================================="
echo ""
echo "Database: $DB_NAME on $DB_HOST:$DB_PORT"
echo "Output: $BACKUP_FILE"
echo ""

# Step 1: Backup schema only
echo "[1/3] Backing up database schema..."
PGPASSWORD="${PGPASSWORD:-}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --schema-only \
  --no-owner \
  --no-privileges \
  -f "$BACKUP_SCHEMA"

echo "  Schema backup: $(du -h "$BACKUP_SCHEMA" | cut -f1)"

# Step 2: Full backup including employees but excluding certificates
echo "[2/3] Backing up all data including employees..."
echo "  Including:"
echo "    - Employee (personal information)"
echo "    - User (all users)"
echo "    - Institution"
echo "    - SystemSettings"
echo "    - Session"
echo "    - MfaToken"
echo "    - Notification"
echo "    - Complaint"
echo "    - AuditLog (audit schema)"
echo "    - All Request Types"
echo ""
echo "  Excluding:"
echo "    - EmployeeCertificate (documents stored in MinIO)"
echo ""

PGPASSWORD="${PGPASSWORD:-}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --exclude-table='"EmployeeCertificate"' \
  --no-owner \
  --no-privileges \
  --clean --if-exists \
  -f "$BACKUP_FILE"

echo "[3/3] Backup complete!"
echo ""
echo "=========================================="
echo "Backup Summary"
echo "=========================================="
echo "Schema backup: $BACKUP_SCHEMA ($(du -h "$BACKUP_SCHEMA" | cut -f1))"
echo "Data backup:   $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
echo ""
echo "To restore:"
echo "  1. Restore schema: psql -d $DB_NAME -f $BACKUP_SCHEMA"
echo "  2. Restore data:   psql -d $DB_NAME -f $BACKUP_FILE"
echo "  3. Re-sync documents from MinIO"
echo "=========================================="