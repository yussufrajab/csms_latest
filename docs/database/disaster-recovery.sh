#!/bin/bash
# Disaster Recovery Script for CSMS Database
# This script restores the database from backup files
# Excludes employee personal data and documents

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-nody}"
DB_USER="${DB_USER:-postgres}"

echo "=========================================="
echo "CSMS Database Disaster Recovery"
echo "=========================================="
echo ""

# Find latest backup files
SCHEMA_FILE=$(ls -t "$SCRIPT_DIR"/schema_*.sql 2>/dev/null | head -1)
DATA_FILE=$(ls -t "$SCRIPT_DIR"/nody_full_*.sql 2>/dev/null | head -1)

if [ -z "$SCHEMA_FILE" ] || [ -z "$DATA_FILE" ]; then
  echo "ERROR: Backup files not found in $SCRIPT_DIR"
  echo "Expected files:"
  echo "  - schema_YYYYMMDD_HHMMSS.sql"
  echo "  - nody_full_YYYYMMDD_HHMMSS.sql"
  exit 1
fi

echo "Recovery files found:"
echo "  Schema: $SCHEMA_FILE ($(du -h "$SCHEMA_FILE" | cut -f1))"
echo "  Data:   $DATA_FILE ($(du -h "$DATA_FILE" | cut -f1))"
echo ""
echo "Database: $DB_NAME on $DB_HOST:$DB_PORT"
echo ""
echo "WARNING: This will DROP and recreate all tables!"
echo "  - Employee data will NOT be restored (excluded from backup)"
echo "  - All other data will be restored"
echo ""
read -p "Continue with recovery? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Recovery aborted."
  exit 0
fi

echo ""
echo "[1/3] Dropping existing database..."
PGPASSWORD="${PGPASSWORD:-}" dropdb \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  --if-exists \
  "$DB_NAME" 2>/dev/null || true

echo "[2/3] Creating new database..."
PGPASSWORD="${PGPASSWORD:-}" createdb \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  "$DB_NAME"

echo "[3/3] Restoring schema and data..."
echo "  Restoring schema..."
PGPASSWORD="${PGPASSWORD:-}" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f "$SCHEMA_FILE" \
  -q

echo "  Restoring data..."
PGPASSWORD="${PGPASSWORD:-}" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f "$DATA_FILE" \
  -q

echo ""
echo "=========================================="
echo "Recovery Complete!"
echo "=========================================="
echo ""
echo "Restored:"
echo "  ✓ Database schema"
echo "  ✓ All users (except employee personal data)"
echo "  ✓ All institutions"
echo "  ✓ All request types (without employee references)"
echo "  ✓ Sessions and MFA tokens"
echo "  ✓ Notifications and complaints"
echo "  ✓ Audit logs"
echo "  ✓ System settings"
echo ""
echo "NOT Restored (excluded from backup):"
echo "  ✗ Employee personal information"
echo "  ✗ Employee certificates/documents"
echo ""
echo "Next steps:"
echo "  1. Verify database connection"
echo "  2. Run application tests"
echo "  3. Re-import employee data from HRIMS if needed"
echo "=========================================="