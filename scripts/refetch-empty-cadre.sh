#!/usr/bin/env bash
# =============================================================================
#  Refetch Employees with Empty Cadre
# =============================================================================
#  This script refetches individual employees who have an empty cadre field
#  from HRIMS. Unlike the institution-level refetch (which clears ALL employee
#  data for an institution), this script uses the single-employee fetch API
#  which only updates the specific employee without clearing existing data.
#
#  This is safe to run because:
#  - It only targets employees with empty cadre (1,157 out of 36,897)
#  - It uses upsert, so existing data is preserved
#  - It does NOT clear any fields before fetching
#
#  Usage:
#    ./scripts/refetch-empty-cadre.sh --cookie 'YOUR_AUTH_COOKIE' [options]
#
#  Options:
#    --host <url>          API base URL (default: http://localhost:9002)
#    --cookie <value>      Auth cookie value (auth-storage)
#    --vote <number>       Process only this institution by vote number
#    --institution <name>  Process only this institution by name (partial match)
#    --timeout <seconds>   Max seconds per employee fetch (default: 15)
#    --delay <ms>          Delay between requests in ms (default: 500)
#    --dry-run             Show what would be refetched without making API calls
#    -h, --help            Show this help message
#
#  Auth Cookie:
#    You need a valid auth-storage cookie from a logged-in Admin/HHRMD/CSCS
#    session. Get it from browser devtools (Application > Cookies) after login.
#
#  Examples:
#    # Dry run — see what would be refetched:
#    ./scripts/refetch-empty-cadre.sh --cookie 'YOUR_COOKIE' --dry-run
#
#    # Refetch all empty-cadre employees:
#    ./scripts/refetch-empty-cadre.sh --cookie 'YOUR_COOKIE'
#
#    # Refetch only WIZARA YA AFYA employees:
#    ./scripts/refetch-empty-cadre.sh --cookie 'YOUR_COOKIE' --vote 008
#
#    # Refetch with longer timeout:
#    ./scripts/refetch-empty-cadre.sh --cookie 'YOUR_COOKIE' --timeout 30
#
#  Notes:
#    - The fetch-employee API requires institutionVoteNumber. 24 employees
#      belong to institutions without a vote number and will be skipped.
#      These require a manual institution-level refetch using --tin instead.
#    - Estimated runtime for 1,157 employees at 500ms delay: ~10 minutes.
# =============================================================================

set -euo pipefail

HOST="http://localhost:9002"
AUTH_COOKIE=""
VOTE_FILTER=""
INSTITUTION_FILTER=""
TIMEOUT=15
DELAY=500
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)        HOST="$2";          shift 2 ;;
    --cookie)      AUTH_COOKIE="$2";    shift 2 ;;
    --vote)        VOTE_FILTER="$2";    shift 2 ;;
    --institution) INSTITUTION_FILTER="$2"; shift 2 ;;
    --timeout)     TIMEOUT="$2";        shift 2 ;;
    --delay)       DELAY="$2";          shift 2 ;;
    --dry-run)    DRY_RUN=true;         shift ;;
    -h|--help)
      sed -n '/^#  Usage:/,/^#  =/p' "$0" | sed 's/^#  //; s/^#//'
      exit 0
      ;;
    *) echo "ERROR: Unknown option: $1"; echo; sed -n '/^#  Usage:/,/^#  =/p' "$0" | sed 's/^#  //; s/^#//'; exit 1 ;;
  esac
done

if [[ -z "$AUTH_COOKIE" ]]; then
  echo "ERROR: --cookie is required."
  echo "Provide a valid auth-storage cookie value from a logged-in Admin session."
  exit 1
fi

# ---------------------------------------------------------------------------
# Query database for employees with empty cadre
# ---------------------------------------------------------------------------
build_employee_list() {
  local SQL="
    SELECT e.\"zanId\" || '|' || e.name || '|' || COALESCE(i.\"voteNumber\", '') || '|' || COALESCE(i.\"tinNumber\", '') || '|' || i.name
    FROM \"Employee\" e
    JOIN \"Institution\" i ON e.\"institutionId\" = i.id
    WHERE (e.cadre = '' OR e.cadre IS NULL)
  "

  if [[ -n "$VOTE_FILTER" ]]; then
    SQL="$SQL AND i.\"voteNumber\" = '$VOTE_FILTER'"
  fi

  if [[ -n "$INSTITUTION_FILTER" ]]; then
    SQL="$SQL AND i.name ILIKE '%${INSTITUTION_FILTER}%'"
  fi

  SQL="$SQL ORDER BY i.name, e.name;"

  PGPASSWORD=postgres psql -h localhost -U postgres -d nody -t -A -c "$SQL" 2>/dev/null
}

echo "==> Querying database for employees with empty cadre..."
RAW_LIST=$(build_employee_list)

if [[ -z "$RAW_LIST" ]]; then
  echo "No employees with empty cadre found."
  exit 0
fi

# Build arrays
declare -a ZAN_IDS=()
declare -a NAMES=()
declare -a VOTES=()
declare -a TINS=()
declare -a INSTITUTIONS=()

while IFS='|' read -r zanid name vote tin inst; do
  [[ -z "$zanid" ]] && continue
  ZAN_IDS+=("$zanid")
  NAMES+=("$name")
  VOTES+=("$vote")
  TINS+=("$tin")
  INSTITUTIONS+=("$inst")
done <<< "$RAW_LIST"

echo "============================================================"
echo "  REFETCH EMPTY CADRE - ${#ZAN_IDS[@]} employees to process"
echo "  Host: $HOST"
echo "  Timeout per employee: ${TIMEOUT}s"
echo "  Delay between requests: ${DELAY}ms"
echo "  Dry run: $DRY_RUN"
echo "============================================================"
echo ""

# URL-encode the cookie
ENCODED_COOKIE=$(echo -n "$AUTH_COOKIE" | python3 -c "import sys,urllib.parse; print(urllib.parse.quote(sys.stdin.read()))" 2>/dev/null || echo "$AUTH_COOKIE")

CURRENT=0
SUCCESS=0
FAILED=0
SKIPPED=0

# Track current institution for grouping
PREV_INST=""

for i in "${!ZAN_IDS[@]}"; do
  CURRENT=$((CURRENT + 1))
  ZANID="${ZAN_IDS[$i]}"
  NAME="${NAMES[$i]}"
  VOTE="${VOTES[$i]}"
  TIN="${TINS[$i]}"
  INST="${INSTITUTIONS[$i]}"

  # Print institution header when it changes
  if [[ "$INST" != "$PREV_INST" ]]; then
    echo ""
    echo "--- $INST (vote: ${VOTE:-none}, tin: ${TIN:-none}) ---"
    PREV_INST="$INST"
  fi

  # Skip if no vote number (fetch-employee API requires it)
  if [[ -z "$VOTE" ]]; then
    echo "  [$CURRENT/${#ZAN_IDS[@]}] SKIP $NAME ($ZANID) — no vote number (use batch-refetch with --tin $TIN for this institution)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo "  [$CURRENT/${#ZAN_IDS[@]}] WOULD FETCH: $NAME ($ZANID) — vote $VOTE"
    SUCCESS=$((SUCCESS + 1))
    continue
  fi

  # Call the single-employee fetch API
  JSON_BODY="{\"zanId\":\"$ZANID\",\"institutionVoteNumber\":\"$VOTE\"}"

  RESPONSE=$(curl -s -w "\n%{http_code}" --max-time "$TIMEOUT" \
    -X POST "$HOST/api/hrims/fetch-employee" \
    -H "Content-Type: application/json" \
    -H "Cookie: auth-storage=$ENCODED_COOKIE" \
    -d "$JSON_BODY" 2>/dev/null || echo -e "\n000")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [[ "$HTTP_CODE" == "200" ]]; then
    # Check if the response was successful
    SUCCESS_FLAG=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "False")
    if [[ "$SUCCESS_FLAG" == "True" ]]; then
      EMP_CADRE=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('employee',{}).get('cadre','?'))" 2>/dev/null || echo "?")
      echo "  [$CURRENT/${#ZAN_IDS[@]}] OK $NAME ($ZANID) -> cadre=$EMP_CADRE"
      SUCCESS=$((SUCCESS + 1))
    else
      MSG=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message','Unknown error'))" 2>/dev/null || echo "Unknown error")
      echo "  [$CURRENT/${#ZAN_IDS[@]}] FAIL $NAME ($ZANID) — $MSG"
      FAILED=$((FAILED + 1))
    fi
  else
    echo "  [$CURRENT/${#ZAN_IDS[@]}] FAIL $NAME ($ZANID) — HTTP $HTTP_CODE"
    FAILED=$((FAILED + 1))
  fi

  # Rate limiting — delay between requests
  if [[ "$DELAY" -gt 0 ]]; then
    sleep "$((DELAY / 1000)).$((DELAY % 1000))"
  fi
done

echo ""
echo "============================================================"
echo "  REFETCH COMPLETE"
echo "  Total:      ${#ZAN_IDS[@]}"
echo "  Success:    $SUCCESS"
echo "  Failed:     $FAILED"
echo "  Skipped:    $SKIPPED (no vote number)"
echo "============================================================"

if [[ "$SKIPPED" -gt 0 ]]; then
  echo ""
  echo "  NOTE: $SKIPPED employees were skipped because their institutions"
  echo "  have no vote number. To refetch these, use the institution-level"
  echo "  batch-refetch script with --tin for each institution:"
  echo ""
  echo "    ./scripts/batch-refetch.sh --cookie 'YOUR_COOKIE' --tin <TIN>"
  echo ""
  echo "  Affected institutions (no vote number):"
  # Extract unique institutions with no vote number from the pipe-delimited list
  echo "$RAW_LIST" | while IFS='|' read -r zid nm vt tn inst; do
    [[ -z "$vt" && -n "$inst" ]] && echo "    - $inst (TIN: ${tn:-none})"
  done | sort -u
  echo ""
fi

if [[ "$DRY_RUN" == true ]]; then
  echo "  This was a dry run. No API calls were made."
  echo "  Run without --dry-run to actually refetch the employees."
fi

if [[ $FAILED -gt 0 ]]; then
  exit 1
fi