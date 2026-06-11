#!/usr/bin/env bash
# =============================================================================
#  Refetch Employees from HRIMS
# =============================================================================
#  Clears employee data for an institution and queues a background HRIMS sync
#  to re-populate it. Preserves documents, certificates, and photos.
#
#  Usage:
#    ./scripts/refetch-employees.sh --tin <TIN_NUMBER>
#    ./scripts/refetch-employees.sh --vote <VOTE_NUMBER>
#    ./scripts/refetch-employees.sh --tin <TIN> --vote <VOTE>
#
#  Examples:
#    ./scripts/refetch-employees.sh --tin 141811827
#    ./scripts/refetch-employees.sh --vote 005
#
#  Options:
#    --tin <number>     Institution TIN number
#    --vote <number>    Institution vote number
#    --host <url>       API base URL (default: http://localhost:9002)
#    --cookie <value>   Auth cookie value (auth-storage)
#    -h, --help         Show this help message
#
#  Auth Cookie:
#   You need a valid auth-storage cookie from a logged-in Admin/HHRMD/CSCS
#   session. Get it from your browser's devtools (Application > Cookies)
#   after logging in, then pass it via --cookie.
#
#  One-liner (replace the cookie value):
#    ./scripts/refetch-employees.sh --tin 141811827 \
#      --cookie '{"state":{"user":{"id":"...","role":"Admin",...}}}'
#
#  Note: The worker process must be running to process the sync job.
#        Start it with: npm run worker
# =============================================================================

set -euo pipefail

HOST="http://localhost:9002"
TIN=""
VOTE=""
AUTH_COOKIE=""

help() {
  sed -n '/^#  Usage:/,/^  \*\//p' "$0" | sed 's/^#  //; s/^#//'
  exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tin)    TIN="$2";     shift 2 ;;
    --vote)   VOTE="$2";    shift 2 ;;
    --host)   HOST="$2";    shift 2 ;;
    --cookie) AUTH_COOKIE="$2"; shift 2 ;;
    -h|--help) help ;;
    *) echo "ERROR: Unknown option: $1"; echo; help ;;
  esac
done

if [[ -z "$TIN" && -z "$VOTE" ]]; then
  echo "ERROR: Either --tin or --vote is required."
  echo
  help
fi

if [[ -n "$TIN" && -z "$VOTE" ]]; then
  echo "==> Refetching employee data using TIN: $TIN"
else
  echo "==> Refetching employee data using Vote Code: $VOTE"
fi

echo "==> API Host: $HOST"

# Build request body
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

echo "==> Request body: $JSON_BODY"

# Build curl command
CURL_CMD=(curl -s -w "\n%{http_code}" -X POST "$HOST/api/hrims/refetch-employees" \
  -H "Content-Type: application/json" \
  -d "$JSON_BODY")

if [[ -n "$AUTH_COOKIE" ]]; then
  CURL_CMD+=(-H "Cookie: auth-storage=$(echo -n "$AUTH_COOKIE" | python3 -c "import sys,urllib.parse; print(urllib.parse.quote(sys.stdin.read()))")")
fi

echo ""
echo "==> Sending request..."
RESPONSE=$("${CURL_CMD[@]}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "==> HTTP Status: $HTTP_CODE"
echo "==> Response:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

# Parse and show summary if successful
if [[ "$HTTP_CODE" == "200" ]]; then
  JOB_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('jobId',''))" 2>/dev/null || echo "")
  STATUS_URL=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('statusUrl',''))" 2>/dev/null || echo "")
  EMP_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('employeeCount',''))" 2>/dev/null || echo "")

  echo "============================================"
  echo "  ✅ Refetch initiated successfully"
  echo "  Employees cleared: $EMP_COUNT"
  echo "  Job ID:            $JOB_ID"
  echo "  Track progress:    $HOST$STATUS_URL"
  echo "============================================"
  echo ""
  echo "To check sync status:"
  echo "  curl -s $HOST$STATUS_URL | python3 -m json.tool"
  echo ""
  echo "NOTE: Make sure the worker is running:"
  echo "  npm run worker"
  echo ""

  # Wait for job completion
  echo "==> Tracking sync progress (Ctrl+C to stop waiting)..."
  echo ""
  while true; do
    JOB_RESPONSE=$(curl -s "$HOST/api/hrims/job-status/$JOB_ID" 2>/dev/null || echo '{}')
    STATE=$(echo "$JOB_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('state','unknown'))" 2>/dev/null || echo "unknown")
    PROGRESS=$(echo "$JOB_RESPONSE" | python3 -c "
import sys,json
d=json.load(sys.stdin)
p=d.get('progress',{}) or {}
if isinstance(p,dict):
  print(f\"{p.get('progressPercent',0):.1f}% | fetched:{p.get('totalFetched',0)} saved:{p.get('saved',0)} skipped:{p.get('skipped',0)} phase:{p.get('phase','?')} message:{p.get('message','')}\")
else:
  print(str(p))
" 2>/dev/null || echo "unknown")

    echo "  [$STATE] $PROGRESS"

    if [[ "$STATE" == "completed" ]]; then
      echo ""
      echo "============================================"
      echo "  ✅ HRIMS sync completed successfully!"
      echo "============================================"

      RETURN_VALUE=$(echo "$JOB_RESPONSE" | python3 -c "
import sys,json
r=json.load(sys.stdin).get('returnvalue',{})
if isinstance(r,dict):
    print(json.dumps(r,indent=2))
else:
    print(str(r))
" 2>/dev/null || echo "unknown")

      echo "$RETURN_VALUE"
      break
    fi

    if [[ "$STATE" == "failed" ]]; then
      echo ""
      echo "============================================"
      echo "  ❌ HRIMS sync FAILED"
      echo "============================================"
      echo "$JOB_RESPONSE" | python3 -c "
import sys,json
r=json.load(sys.stdin)
print('Failed reason:', r.get('failedReason','unknown'))
" 2>/dev/null
      break
    fi

    sleep 3
  done
else
  echo "❌ Request failed. Check the error message above."
  exit 1
fi
