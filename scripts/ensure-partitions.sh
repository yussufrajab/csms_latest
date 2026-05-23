#!/bin/bash
set -e

# CSMS Audit Partition Pre-creation Script
# Ensures that audit log partitions exist for the next N months
# preventing insert failures when new months arrive.

DB_NAME="${CSMS_DB_NAME:-nody}"
DB_USER="${CSMS_DB_USER:-postgres}"
MONTHS_AHEAD="${CSMS_PARTITION_MONTHS:-6}"

echo "[$(date -u +%FT%TZ)] Ensuring audit partitions exist for next ${MONTHS_AHEAD} months"

for i in $(seq 0 "$MONTHS_AHEAD"); do
  MONTH_DATE=$(date -d "+${i} months" +"%Y_%m")
  PARTITION="audit_log_${MONTH_DATE}"

  # Check if partition exists
  EXISTS=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'audit'
      AND table_name = '${PARTITION}'
    );
  " | tr -d '[:space:]')

  if [ "$EXISTS" != "t" ]; then
    # Calculate date range for the partition
    START_DATE=$(date -d "+${i} months" +"%Y-%m-01")
    END_DATE=$(date -d "+$((i+1)) months" +"%Y-%m-01")

    psql -U "$DB_USER" -d "$DB_NAME" <<EOSQL
CREATE TABLE IF NOT EXISTS audit.${PARTITION}
  PARTITION OF audit.audit_log
  FOR VALUES FROM ('${START_DATE}') TO ('${END_DATE}');
EOSQL
    echo "[$(date -u +%FT%TZ)] Created partition: audit.${PARTITION}"
  else
    echo "[$(date -u +%FT%TZ)] Partition already exists: audit.${PARTITION}"
  fi
done

echo "[$(date -u +%FT%TZ)] Partition check complete"