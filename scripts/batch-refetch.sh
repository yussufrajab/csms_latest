#!/usr/bin/env bash
# =============================================================================
#  Batch Refetch Employees from HRIMS
# =============================================================================
#  Clears employee data for ALL institutions and queues background HRIMS sync
#  jobs to re-populate them. Preserves documents, certificates, and photos.
#
#  The HRIMS refetch API accepts either a tinNumber or voteNumber (or both).
#  This script queries the database for all institutions that have at least
#  one of these identifiers and builds the appropriate request for each.
#
#  Usage:
#    ./scripts/batch-refetch.sh [options]
#
#  Options:
#    --host <url>          API base URL (default: http://localhost:9002)
#    --cookie <value>      Auth cookie value (auth-storage)
#    --tin <number>        Process only this institution by TIN number
#    --vote <number>       Process only this institution by vote number
#    --exclude <ids>       Comma-separated identifiers (TIN or vote) to exclude
#    --timeout <seconds>   Max wait per sync job (default: 90)
#    --skip-wait           Don't wait for sync jobs to complete
#    -h, --help            Show this help message
#
#  Auth Cookie:
#    You need a valid auth-storage cookie from a logged-in Admin/HHRMD/CSCS
#    session. Get it from your browser's devtools (Application > Cookies)
#    after logging in, then pass it via --cookie.
#
#  Examples:
#    # Refetch all institutions (auto-detects from database):
#    ./scripts/batch-refetch.sh --cookie 'YOUR_AUTH_COOKIE'
#
#    # Refetch a single institution by TIN:
#    ./scripts/batch-refetch.sh --tin 141811827 --cookie 'YOUR_AUTH_COOKIE'
#
#    # Refetch a single institution by vote number (no TIN):
#    ./scripts/batch-refetch.sh --vote 053 --cookie 'YOUR_AUTH_COOKIE'
#
#    # Refetch all except certain institutions (by TIN or vote):
#    ./scripts/batch-refetch.sh --exclude 141811827,005 --cookie 'YOUR_AUTH_COOKIE'
#
#    # Skip waiting for sync completion (fire-and-forget):
#    ./scripts/batch-refetch.sh --skip-wait --cookie 'YOUR_AUTH_COOKIE'
#
#  Note: The worker process must be running to process sync jobs.
#        Start it with: npm run worker
# =============================================================================

set -euo pipefail

HOST="http://localhost:9002"
AUTH_COOKIE=""
TIN_FILTER=""
VOTE_FILTER=""
EXCLUDE_IDS=""
TIMEOUT=90
SKIP_WAIT=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)      HOST="$2";         shift 2 ;;
    --cookie)    AUTH_COOKIE="$2";   shift 2 ;;
    --tin)       TIN_FILTER="$2";   shift 2 ;;
    --vote)      VOTE_FILTER="$2";  shift 2 ;;
    --exclude)   EXCLUDE_IDS="$2";  shift 2 ;;
    --timeout)   TIMEOUT="$2";      shift 2 ;;
    --skip-wait) SKIP_WAIT=true;    shift ;;
    -h|--help)
      sed -n '/^#  Usage:/,/^  \*\//p' "$0" | sed 's/^#  //; s/^#//'
      exit 0
      ;;
    *) echo "ERROR: Unknown option: $1"; echo; sed -n '/^#  Usage:/,/^  \*\//p' "$0" | sed 's/^#  //; s/^#//'; exit 1 ;;
  esac
done

if [[ -z "$AUTH_COOKIE" ]]; then
  echo "ERROR: --cookie is required."
  echo "Provide a valid auth-storage cookie value from a logged-in Admin session."
  exit 1
fi

# ---------------------------------------------------------------------------
# Build institution list from the database.
# Each line format:  TIN<tab>VOTE<tab>NAME
# TIN or VOTE may be empty but at least one will be populated.
# ---------------------------------------------------------------------------
build_institution_list() {
  local PGPASSWORD_VAR="" PGHOST_VAR="" PGUSER_VAR="" PGDB_VAR=""

  if [[ -f .env ]]; then
    DB_CONN=$(grep '^DATABASE_URL=' .env | head -1 | sed 's/DATABASE_URL="//' | sed 's/"$//')
    if [[ -n "$DB_CONN" ]]; then
      PGPASSWORD_VAR=$(echo "$DB_CONN" | sed -n 's/.*:\([^@]*\)@.*/\1/p')
      PGHOST_VAR=$(echo "$DB_CONN" | sed -n 's/.*@\([^:\/]*\).*/\1/p')
      PGUSER_VAR=$(echo "$DB_CONN" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
      PGDB_VAR=$(echo "$DB_CONN" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    fi
  fi

  PGHOST_VAR="${PGHOST_VAR:-localhost}"
  PGUSER_VAR="${PGUSER_VAR:-postgres}"
  PGDB_VAR="${PGDB_VAR:-nody}"

  # Select institutions that have at least a TIN or a vote number
  # Use string concatenation with tab delimiter to avoid psql column separators
  local SQL="SELECT COALESCE(\"tinNumber\",'') || E'\t' || COALESCE(\"voteNumber\",'') || E'\t' || name FROM \"Institution\" WHERE (\"tinNumber\" IS NOT NULL AND \"tinNumber\" <> '') OR (\"voteNumber\" IS NOT NULL AND \"voteNumber\" <> '') ORDER BY name;"

  if [[ -n "$PGPASSWORD_VAR" ]]; then
    PGPASSWORD="$PGPASSWORD_VAR" psql -h "$PGHOST_VAR" -U "$PGUSER_VAR" -d "$PGDB_VAR" -t -A -c "$SQL" 2>/dev/null || echo ""
  else
    PGPASSWORD=postgres psql -h "$PGHOST_VAR" -U "$PGUSER_VAR" -d "$PGDB_VAR" -t -A -c "$SQL" 2>/dev/null || echo ""
  fi
}

# Build the institution list
echo "==> Building institution list from database..."
RAW_LIST=$(build_institution_list)

if [[ -z "$RAW_LIST" ]]; then
  echo "ERROR: Could not fetch institution list from database."
  echo "Make sure PostgreSQL is accessible and the Institution table has data."
  exit 1
fi

# Convert to filtered array
# Each entry format: TIN<tab>VOTE<tab>NAME
INSTITUTIONS=()
while IFS= read -r line; do
  [[ -z "$line" ]] && continue

  ENTRY_TIN=$(echo "$line" | cut -f1)
  ENTRY_VOTE=$(echo "$line" | cut -f2)
  ENTRY_NAME=$(echo "$line" | cut -f3)

  # Apply --tin filter
  if [[ -n "$TIN_FILTER" && "$ENTRY_TIN" != "$TIN_FILTER" ]]; then
    continue
  fi

  # Apply --vote filter
  if [[ -n "$VOTE_FILTER" && "$ENTRY_VOTE" != "$VOTE_FILTER" ]]; then
    continue
  fi

  # Apply exclusion filter (matches TIN or vote)
  if [[ -n "$EXCLUDE_IDS" ]]; then
    SKIP=false
    IFS=',' read -ra EXCLUDE_ARRAY <<< "$EXCLUDE_IDS"
    for exc_id in "${EXCLUDE_ARRAY[@]}"; do
      if [[ "$ENTRY_TIN" == "$exc_id" || "$ENTRY_VOTE" == "$exc_id" ]]; then
        SKIP=true
        break
      fi
    done
    if [[ "$SKIP" == true ]]; then
      continue
    fi
  fi

  # Must have at least one identifier
  if [[ -z "$ENTRY_TIN" && -z "$ENTRY_VOTE" ]]; then
    continue
  fi

  INSTITUTIONS+=("$line")
done <<< "$RAW_LIST"

TOTAL=${#INSTITUTIONS[@]}

if [[ $TOTAL -eq 0 ]]; then
  echo "ERROR: No institutions found matching the specified filters."
  exit 1
fi

CURRENT=0
SUCCESS=0
FAILED=0
NO_EMPLOYEES=0
TIMEOUT_COUNT=0

echo "============================================================"
echo "  BATCH REFETCH - $TOTAL institutions to process"
echo "  Host: $HOST"
echo "  Timeout per job: ${TIMEOUT}s"
echo "  Skip wait: $SKIP_WAIT"
echo "============================================================"
echo ""

ENCODED_COOKIE=$(echo -n "$AUTH_COOKIE" | python3 -c "import sys,urllib.parse; print(urllib.parse.quote(sys.stdin.read()))")

for ENTRY in "${INSTITUTIONS[@]}"; do
  CURRENT=$((CURRENT + 1))
  TIN=$(echo "$ENTRY" | cut -f1)
  VOTE=$(echo "$ENTRY" | cut -f2)
  NAME=$(echo "$ENTRY" | cut -f3)

  # Build JSON request body — include only the identifiers that are available.
  # The API requires at least one of tinNumber or voteNumber.
  # If both are present, both are sent so the API can use tinNumber (preferred).
  JSON_BODY="{"
  if [[ -n "$TIN" ]]; then
    JSON_BODY+="\"tinNumber\":\"$TIN\""
    if [[ -n "$VOTE" ]]; then
      JSON_BODY+=",\"voteNumber\":\"$VOTE\""
    fi
  else
    JSON_BODY+="\"voteNumber\":\"$VOTE\""
  fi
  JSON_BODY+="}"

  # Display which identifier(s) we're using
  if [[ -n "$TIN" && -n "$VOTE" ]]; then
    echo "[$CURRENT/$TOTAL] $NAME (TIN: $TIN, Vote: $VOTE)"
  elif [[ -n "$TIN" ]]; then
    echo "[$CURRENT/$TOTAL] $NAME (TIN: $TIN)"
  else
    echo "[$CURRENT/$TOTAL] $NAME (Vote: $VOTE)"
  fi

  # Send refetch request
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$HOST/api/hrims/refetch-employees" \
    -H "Content-Type: application/json" \
    -H "Cookie: auth-storage=$ENCODED_COOKIE" \
    -d "$JSON_BODY")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [[ "$HTTP_CODE" != "200" ]]; then
    echo "  X Request failed (HTTP $HTTP_CODE)"
    echo "  Response: $(echo "$BODY" | head -c 300)"
    FAILED=$((FAILED + 1))
    echo ""
    continue
  fi

  # Check if it's a 200 but with success:false
  SUCCESS_FLAG=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "False")

  if [[ "$SUCCESS_FLAG" == "False" ]]; then
    MSG=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message','Unknown error'))" 2>/dev/null || echo "Unknown")
    echo "  SKIP: $MSG"
    NO_EMPLOYEES=$((NO_EMPLOYEES + 1))
    echo ""
    continue
  fi

  JOB_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('jobId',''))" 2>/dev/null || echo "")
  EMP_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('employeeCount',''))" 2>/dev/null || echo "?")
  INST_NAME=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('institutionName',''))" 2>/dev/null || echo "?")

  echo "  Employees cleared: $EMP_COUNT"
  echo "  Job ID: $JOB_ID"

  if [[ "$SKIP_WAIT" == true ]]; then
    echo "  (skipping wait for completion)"
    SUCCESS=$((SUCCESS + 1))
    echo ""
    continue
  fi

  # Wait for job completion
  WAITED=0
  while [[ $WAITED -lt $TIMEOUT ]]; do
    sleep 3
    WAITED=$((WAITED + 3))

    JOB_RESPONSE=$(curl -s "$HOST/api/hrims/job-status/$JOB_ID" 2>/dev/null || echo '{}')
    STATE=$(echo "$JOB_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('state','unknown'))" 2>/dev/null || echo "unknown")

    if [[ "$STATE" == "completed" ]]; then
      SAVED=$(echo "$JOB_RESPONSE" | python3 -c "
import sys,json
r=json.load(sys.stdin).get('returnvalue',{})
if isinstance(r,dict):
    print(r.get('savedCount','?'))
else:
    print('?')" 2>/dev/null || echo "?")
      SKIPPED=$(echo "$JOB_RESPONSE" | python3 -c "
import sys,json
r=json.load(sys.stdin).get('returnvalue',{})
if isinstance(r,dict):
    print(r.get('skippedCount','?'))
else:
    print('?')" 2>/dev/null || echo "?")
      echo "  OK Sync completed! Saved: $SAVED, Skipped: $SKIPPED"
      SUCCESS=$((SUCCESS + 1))
      break
    fi

    if [[ "$STATE" == "failed" ]]; then
      REASON=$(echo "$JOB_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('failedReason','unknown'))" 2>/dev/null || echo "unknown")
      echo "  X Sync FAILED: $REASON"
      FAILED=$((FAILED + 1))
      break
    fi

    PROGRESS=$(echo "$JOB_RESPONSE" | python3 -c "
import sys,json
d=json.load(sys.stdin)
p=d.get('progress',{}) or {}
if isinstance(p,dict):
  print(f\"{p.get('progressPercent',0):.0f}% phase:{p.get('phase','?')} msg:{p.get('message','')}\")
else:
  print(str(p))" 2>/dev/null || echo "unknown")
    echo "  [$STATE] $PROGRESS"
  done

  if [[ $WAITED -ge $TIMEOUT ]]; then
    echo "  TIMEOUT waiting for sync (job will continue in background)"
    TIMEOUT_COUNT=$((TIMEOUT_COUNT + 1))
  fi

  echo ""
done

echo "============================================================"
echo "  BATCH COMPLETE"
echo "  Total:      $TOTAL"
echo "  Success:    $SUCCESS"
echo "  Failed:     $FAILED"
echo "  No data:    $NO_EMPLOYEES"
echo "  Timed out:  $TIMEOUT_COUNT (jobs still running in background)"
echo "============================================================"

if [[ $FAILED -gt 0 ]]; then
  exit 1
fi