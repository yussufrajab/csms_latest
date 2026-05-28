#!/bin/bash
# Full backup of CSMS database excluding employee personal data and documents
# Includes: Users, Institutions, all request types, sessions, MFA, notifications, complaints, audit logs
# Excludes: Employee table, EmployeeCertificate table (personal data and documents)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-nody}"
DB_USER="${DB_USER:-postgres}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$SCRIPT_DIR/nody_full_${TIMESTAMP}.sql"
BACKUP_SCHEMA="$SCRIPT_DIR/schema_${TIMESTAMP}.sql"

echo "=========================================="
echo "CSMS Full Database Backup (Excluding Employee Data)"
echo "=========================================="
echo ""
echo "Database: $DB_NAME on $DB_HOST:$DB_PORT"
echo "Output: $BACKUP_FILE"
echo ""

# Step 1: Backup schema only (for disaster recovery)
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

# Step 2: Full backup excluding employee tables
echo "[2/3] Backing up all data except employee tables..."
echo "  Including:"
echo "    - User (all users)"
echo "    - Institution"
echo "    - SystemSettings"
echo "    - Session"
echo "    - MfaToken"
echo "    - Notification"
echo "    - Complaint"
echo "    - AuditLog (audit schema)"
echo "    - All Request Types (CadreChange, Confirmation, LWOP, Promotion,"
echo "      Resignation, Retirement, Separation, ServiceExtension)"
echo ""
echo "  Excluding:"
echo "    - Employee (personal data)"
echo "    - EmployeeCertificate (documents)"
echo ""

PGPASSWORD="${PGPASSWORD:-}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --exclude-table='"Employee"' \
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
echo "=========================================="