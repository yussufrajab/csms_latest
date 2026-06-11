#!/usr/bin/env bash
# =============================================================================
#  Refetch Remaining Institutions
# =============================================================================
#  Re-runs the HRIMS refetch for the 2 institutions that have not yet completed
#  their sync. These are institutions with 0 employees having data populated.
#
#  Institutions:
#    1. WIZARA YA ELIMU NA MAFUNZO YA AMALI   (TIN: 101817709, Vote: 011)
#    2. WIZARA YA UTALII NA MAMBO YA KALE       (TIN: 104480454, Vote: 010)
#
#  Usage:
#    ./scripts/refetch-remaining.sh [options]
#
#  Options:
#    --host <url>        API base URL (default: http://localhost:9002)
#    --cookie <value>    Auth cookie value (auth-storage)
#    --timeout <seconds>  Max wait per sync job (default: 600, large inst.)
#    -h, --help          Show this help message
#
#  Auth Cookie:
#    You need a valid auth-storage cookie from a logged-in Admin/HHRMD/CSCS
#    session. Get it from your browser's devtools (Application > Cookies)
#    after logging in, then pass it via --cookie.
#
#  Example:
#    ./scripts/refetch-remaining.sh --cookie 'YOUR_AUTH_COOKIE'
#
#  Note: The worker process must be running to process sync jobs.
#        Start it with: npm run worker
# =============================================================================

set -euo pipefail

HOST="http://localhost:9002"
AUTH_COOKIE=""
TIMEOUT=600

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)     HOST="$2";       shift 2 ;;
    --cookie)   AUTH_COOKIE="$2"; shift 2 ;;
    --timeout)  TIMEOUT="$2";    shift 2 ;;
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
  echo ""
  echo "Example:"
  echo "  ./scripts/refetch-remaining.sh --cookie '{\"state\":{\"user\":{\"id\":\"...\",\"role\":\"Admin\",...}}}'"
  exit 1
fi

# Remaining institutions that have not yet synced
declare -a INSTITUTIONS=(
  "101817709|011|WIZARA YA ELIMU NA MAFUNZO YA AMALI"
  "104480454|010|WIZARA YA UTALII NA MAMBO YA KALE"
)

TOTAL=${#INSTITUTIONS[@]}
CURRENT=0
SUCCESS=0
FAILED=0

echo "============================================================"
echo "  REFETCH REMAINING INSTITUTIONS - $TOTAL to process"
echo "  Host: $HOST"
echo "  Timeout per job: ${TIMEOUT}s (10 min)"
echo "============================================================"
echo ""

ENCODED_COOKIE=$(echo -n "$AUTH_COOKIE" | python3 -c "import sys,urllib.parse; print(urllib.parse.quote(sys.stdin.read()))")

for ENTRY in "${INSTITUTIONS[@]}"; do
  CURRENT=$((CURRENT + 1))
  TIN=$(echo "$ENTRY" | cut -d'|' -f1)
  VOTE=$(echo "$ENTRY" | cut -d'|' -f2)
  NAME=$(echo "$ENTRY" | cut -d'|' -f3)

  # Build JSON body — include both TIN and vote
  JSON_BODY="{\"tinNumber\":\"$TIN\",\"voteNumber\":\"$VOTE\"}"

  echo "[$CURRENT/$TOTAL] $NAME (TIN: $TIN, Vote: $VOTE)"

  # Send refetch request
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$HOST/api/hrims/refetch-employees" \
    -H "Content-Type: application/json" \
    -H "Cookie: auth-storage=$ENCODED_COOKIE" \
    -d "$JSON_BODY")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [[ "$HTTP_CODE" != "200" ]]; then
    echo "  X Request failed (HTTP $HTTP_CODE)"
    echo "  Response: $(echo "$BODY" | head -c 500)"
    FAILED=$((FAILED + 1))
    echo ""
    continue
  fi

  SUCCESS_FLAG=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "False")

  if [[ "$SUCCESS_FLAG" == "False" ]]; then
    MSG=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message','Unknown error'))" 2>/dev/null || echo "Unknown")
    echo "  SKIP: $MSG"
    echo ""
    continue
  fi

  JOB_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('jobId',''))" 2>/dev/null || echo "")
  EMP_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('employeeCount',''))" 2>/dev/null || echo "?")
  INST_NAME=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('institutionName',''))" 2>/dev/null || echo "?")

  echo "  Employees cleared: $EMP_COUNT"
  echo "  Job ID: $JOB_ID"
  echo "  Tracking progress (timeout: ${TIMEOUT}s)..."

  # Wait for job completion with extended timeout (large institutions)
  WAITED=0
  while [[ $WAITED -lt $TIMEOUT ]]; do
    sleep 5
    WAITED=$((WAITED + 5))

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
      echo "  COMPLETED! Saved: $SAVED, Skipped: $SKIPPED"
      SUCCESS=$((SUCCESS + 1))
      break
    fi

    if [[ "$STATE" == "failed" ]]; then
      REASON=$(echo "$JOB_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('failedReason','unknown'))" 2>/dev/null || echo "unknown")
      echo "  FAILED: $REASON"
      FAILED=$((FAILED + 1))
      break
    fi

    PROGRESS=$(echo "$JOB_RESPONSE" | python3 -c "
import sys,json
d=json.load(sys.stdin)
p=d.get('progress',{}) or {}
if isinstance(p,dict):
  pct=p.get('progressPercent',0)
  fetched=p.get('totalFetched',0)
  phase=p.get('phase','?')
  msg=p.get('message','')
  print(f'{pct:.0f}% | fetched:{fetched} | {phase} | {msg}')
else:
  print(str(p))" 2>/dev/null || echo "unknown")

    echo "  [$WAITED/${TIMEOUT}s] [$STATE] $PROGRESS"
  done

  if [[ $WAITED -ge $TIMEOUT ]]; then
    echo "  TIMEOUT after ${TIMEOUT}s — the sync job is still running in the background."
    echo "  Check status manually:"
    echo "    curl -s $HOST/api/hrims/job-status/$JOB_ID | python3 -m json.tool"
  fi

  echo ""
done

echo "============================================================"
echo "  DONE"
echo "  Total:    $TOTAL"
echo "  Success:  $SUCCESS"
echo "  Failed:   $FAILED"
echo "============================================================"

if [[ $FAILED -gt 0 ]]; then
  exit 1
fi