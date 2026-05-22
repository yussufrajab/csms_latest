#!/bin/bash
# Restore CSMS core database (User, Institution, SystemSettings)
# This will DROP existing data in those tables and replace with backup data.
# Employee/request tables are NOT affected.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-nody}"
DB_USER="${DB_USER:-postgres}"

# Find the latest backup file
BACKUP_FILE=$(ls -t "$SCRIPT_DIR"/nody_core_*.sql 2>/dev/null | head -1)

if [ -z "$BACKUP_FILE" ]; then
  echo "ERROR: No backup file found in $SCRIPT_DIR"
  echo "Expected files matching: nody_core_YYYYMMDD_HHMMSS.sql"
  exit 1
fi

echo "WARNING: This will replace data in User, Institution, and SystemSettings tables!"
echo "  Backup file: $BACKUP_FILE"
echo "  Database: $DB_NAME on $DB_HOST:$DB_PORT"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo "Restoring..."
PGPASSWORD="${PGPASSWORD:-}" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f "$BACKUP_FILE"

echo "Restore complete."