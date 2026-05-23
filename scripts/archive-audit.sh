#!/bin/bash
set -e

# CSMS Audit Log Archival Script
# Exports the previous month's audit partition to compressed JSON
# and optionally drops the partition after verification.
#
# Usage: ./archive-audit.sh [--drop-partition]
#   --drop-partition  Also drop the PostgreSQL partition after archiving

DB_NAME="${CSMS_DB_NAME:-nody}"
DB_USER="${CSMS_DB_USER:-postgres}"
ARCHIVE_DIR="/var/log/csms/archive/audit"
DROP_PARTITION=false

if [[ "${1:-}" == "--drop-partition" ]]; then
  DROP_PARTITION=true
fi

YEAR=$(date -d "last month" +"%Y")
MONTH=$(date -d "last month" +"%m")
PARTITION="audit_log_${YEAR}_${MONTH}"
OUTPUT="${ARCHIVE_DIR}/${YEAR}/${PARTITION}.json"

mkdir -p "${ARCHIVE_DIR}/${YEAR}"

echo "[$(date -u +%FT%TZ)] Starting archive: ${PARTITION}"

# Check if partition exists
PARTITION_EXISTS=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'audit'
    AND table_name = '${PARTITION}'
  );
" 2>/dev/null | tr -d '[:space:]')

if [ "$PARTITION_EXISTS" != "t" ]; then
  echo "[$(date -u +%FT%TZ)] ERROR: Partition audit.${PARTITION} does not exist"
  exit 1
fi

# Export partition to JSON
psql -U "$DB_USER" -d "$DB_NAME" <<EOF
COPY (
    SELECT row_to_json(t)
    FROM (
        SELECT * FROM audit.${PARTITION} ORDER BY created_at
    ) t
) TO '${OUTPUT}';
EOF

ROW_COUNT=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "
  SELECT COUNT(*) FROM audit.${PARTITION};
" | tr -d '[:space:]')

echo "[$(date -u +%FT%TZ)] Exported ${ROW_COUNT} rows to ${OUTPUT}"

# Compress and checksum
gzip -f "${OUTPUT}"
sha256sum "${OUTPUT}.gz" > "${OUTPUT}.gz.sha256"

echo "[$(date -u +%FT%TZ)] Archive complete: ${OUTPUT}.gz"
echo "[$(date -u +%FT%TZ)] Checksum: $(cat ${OUTPUT}.gz.sha256)"

# Optionally drop partition after verifying archive
if [ "$DROP_PARTITION" = true ]; then
  if [ -s "${OUTPUT}.gz" ]; then
    psql -U "$DB_USER" -d "$DB_NAME" -c "DROP TABLE IF EXISTS audit.${PARTITION};"
    echo "[$(date -u +%FT%TZ)] Partition dropped: ${PARTITION}"
  else
    echo "[$(date -u +%FT%TZ)] ERROR: Archive empty — partition NOT dropped"
    exit 1
  fi
fi