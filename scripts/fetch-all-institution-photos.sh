#!/bin/bash

# ============================================================================
# HRIMS Photo Fetch Script - All Institutions
# ============================================================================
# This script fetches employee photos from HRIMS for all institutions.
# Similar to the get-photo page functionality at:
#   https://test.zanajira.go.tz/dashboard/admin/get-photo
#
# Features:
#   - Automatically checks database for already-fetched photos (skips by default)
#   - Runs in background mode with nohup to avoid interruption
#   - Maintains detailed logs for monitoring
#   - Streams progress updates from the API
#
# Usage:
#   ./scripts/fetch-all-institution-photos.sh [OPTIONS]
#
# Options:
#   --pause NUM         Seconds to pause between institutions (default: 3)
#   --start-from NUM    Start from institution number N (1-based)
#   --dry-run           List institutions without fetching
#   --force             Force re-fetch even for institutions with existing photos
#   --background        Run script in background (detached from terminal)
#   --min-photos NUM    Skip institutions where >= NUM% of employees have photos (default: 80)
#   --help              Show this help message
#
# Prerequisites:
#   - jq (JSON processor) must be installed
#   - psql (PostgreSQL client) must be installed
#   - Server must be running on port 9002
# ============================================================================

set -e

# ============================================================================
# CONFIGURATION
# ============================================================================
BASE_URL="${NEXT_PUBLIC_API_URL:-http://localhost:9002}"
# Remove trailing /api if present
BASE_URL="${BASE_URL%/api}"
PAUSE_SECONDS=3
START_FROM=1
DRY_RUN=false
FORCE_REFETCH=false
RUN_BACKGROUND=false
MIN_PHOTOS_PERCENT=60  # Skip institutions where >= this % of employees have photos
LOG_DIR="./scripts/logs"
DB_URL="${DATABASE_URL:-postgresql://postgres:Mamlaka2020@localhost:5432/nody}"

# ============================================================================
# COLORS
# ============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
log_info() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[$timestamp]${NC} INFO: $1"
    [ -n "$LOG_FILE" ] && echo "[$timestamp] INFO: $1" >> "$LOG_FILE" || true
}

log_success() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[$timestamp]${NC} SUCCESS: $1"
    [ -n "$LOG_FILE" ] && echo "[$timestamp] SUCCESS: $1" >> "$LOG_FILE" || true
}

log_error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[$timestamp]${NC} ERROR: $1"
    [ -n "$LOG_FILE" ] && echo "[$timestamp] ERROR: $1" >> "$LOG_FILE" || true
}

log_warning() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[$timestamp]${NC} WARNING: $1"
    [ -n "$LOG_FILE" ] && echo "[$timestamp] WARNING: $1" >> "$LOG_FILE" || true
}

log_divider() {
    local char="${1:-=}"
    local length="${2:-80}"
    printf '%*s\n' "$length" '' | tr ' ' "$char"
}

format_duration() {
    local seconds=$1
    local hours=$((seconds / 3600))
    local minutes=$(((seconds % 3600) / 60))
    local secs=$((seconds % 60))

    if [ $hours -gt 0 ]; then
        echo "${hours}h ${minutes}m ${secs}s"
    elif [ $minutes -gt 0 ]; then
        echo "${minutes}m ${secs}s"
    else
        echo "${secs}s"
    fi
}

show_help() {
    echo "HRIMS Photo Fetch Script - All Institutions"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --pause NUM         Seconds to pause between institutions (default: 3)"
    echo "  --start-from NUM    Start from institution number N (1-based)"
    echo "  --dry-run           List institutions without fetching"
    echo "  --force             Force re-fetch even for institutions with existing photos"
    echo "  --background        Run script in background (detached from terminal)"
    echo "  --min-photos NUM    Skip if >= NUM% of employees have photos (default: 60)"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run with defaults (skips already-fetched)"
    echo "  $0 --pause 5                          # Custom pause between institutions"
    echo "  $0 --start-from 25                    # Resume from institution 25"
    echo "  $0 --dry-run                          # Just list institutions with status"
    echo "  $0 --force                            # Re-fetch all institutions"
    echo "  $0 --background                       # Run in background mode"
    echo "  $0 --min-photos 50                    # Only skip if >= 50% have photos"
    echo ""
}

# ============================================================================
# PARSE COMMAND LINE ARGUMENTS
# ============================================================================
while [[ $# -gt 0 ]]; do
    case $1 in
        --pause)
            PAUSE_SECONDS="$2"
            shift 2
            ;;
        --start-from)
            START_FROM="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE_REFETCH=true
            shift
            ;;
        --background)
            RUN_BACKGROUND=true
            shift
            ;;
        --min-photos)
            MIN_PHOTOS_PERCENT="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# ============================================================================
# BACKGROUND MODE HANDLER
# ============================================================================
# If --background flag is set and script is not already running in background,
# re-launch with nohup
if [ "$RUN_BACKGROUND" = true ] && [ -z "$RUNNING_IN_BACKGROUND" ]; then
    # Create log directory first
    mkdir -p "$LOG_DIR"

    TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
    BG_LOG_FILE="${LOG_DIR}/fetch-photos-bg-${TIMESTAMP}.log"
    BG_PID_FILE="${LOG_DIR}/fetch-photos.pid"

    echo "Starting script in background mode..."
    echo "Log file: $BG_LOG_FILE"
    echo "PID file: $BG_PID_FILE"

    # Reconstruct arguments without --background
    ARGS=""
    [ "$PAUSE_SECONDS" != "3" ] && ARGS="$ARGS --pause $PAUSE_SECONDS"
    [ "$START_FROM" != "1" ] && ARGS="$ARGS --start-from $START_FROM"
    [ "$DRY_RUN" = true ] && ARGS="$ARGS --dry-run"
    [ "$FORCE_REFETCH" = true ] && ARGS="$ARGS --force"
    [ "$MIN_PHOTOS_PERCENT" != "80" ] && ARGS="$ARGS --min-photos $MIN_PHOTOS_PERCENT"

    # Export marker to prevent infinite loop
    export RUNNING_IN_BACKGROUND=1

    # Launch in background with nohup
    nohup bash "$0" $ARGS > "$BG_LOG_FILE" 2>&1 &
    BG_PID=$!

    # Save PID for monitoring
    echo "$BG_PID" > "$BG_PID_FILE"

    echo "Background process started with PID: $BG_PID"
    echo ""
    echo "To monitor progress:"
    echo "  tail -f $BG_LOG_FILE"
    echo ""
    echo "To check if running:"
    echo "  ps -p $BG_PID"
    echo ""
    echo "To stop:"
    echo "  kill $BG_PID"

    exit 0
fi

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================
echo ""
log_divider "="
echo -e "${CYAN}  HRIMS Photo Fetch - All Institutions${NC}"
log_divider "="
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    log_error "jq is required but not installed."
    echo "Please install jq:"
    echo "  Ubuntu/Debian: sudo apt-get install jq"
    echo "  CentOS/RHEL:   sudo yum install jq"
    echo "  macOS:         brew install jq"
    exit 1
fi
log_info "jq is available"

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    log_error "psql is required but not installed."
    echo "Please install PostgreSQL client:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  CentOS/RHEL:   sudo yum install postgresql"
    echo "  macOS:         brew install postgresql"
    exit 1
fi
log_info "psql is available"

# Check if server is running
log_info "Checking server status at ${BASE_URL}..."
if ! curl -s "${BASE_URL}/api/institutions" > /dev/null 2>&1; then
    log_error "Server is not running on ${BASE_URL}"
    echo "Please start the server first:"
    echo "  npm run dev"
    exit 1
fi
log_success "Server is running"

# Create log directory
mkdir -p "$LOG_DIR"

# Create log file
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
LOG_FILE="${LOG_DIR}/fetch-photos-${TIMESTAMP}.log"
log_info "Log file: $LOG_FILE"

# ============================================================================
# DATABASE HELPER FUNCTIONS
# ============================================================================

# Get photo status for all employees in all institutions
# A photo is considered "fetched" if profileImageUrl starts with /api/files/employee-photos/
# Returns: institutionId|name|total_employees|employees_with_photos|employees_without_photos
get_all_institutions_photo_status() {
    log_info "Fetching photo status for all institutions from database..."
    psql "$DB_URL" -t -A -c "
        SELECT
            i.id,
            i.name,
            COALESCE(e.total, 0) as total,
            COALESCE(e.with_photos, 0) as with_photos,
            COALESCE(e.without_photos, 0) as without_photos
        FROM \"Institution\" i
        LEFT JOIN (
            SELECT
                \"institutionId\",
                COUNT(*) as total,
                SUM(CASE
                    WHEN \"profileImageUrl\" LIKE '/api/files/employee-photos/%'
                    THEN 1 ELSE 0 END) as with_photos,
                SUM(CASE
                    WHEN \"profileImageUrl\" IS NULL
                         OR \"profileImageUrl\" NOT LIKE '/api/files/employee-photos/%'
                    THEN 1 ELSE 0 END) as without_photos
            FROM \"Employee\"
            GROUP BY \"institutionId\"
        ) e ON i.id = e.\"institutionId\"
        ORDER BY i.name;
    " 2>/dev/null
}

# ============================================================================
# FETCH INSTITUTIONS AND PHOTO STATUS
# ============================================================================
echo ""
log_divider "-"
log_info "Fetching institutions list..."

INSTITUTIONS_RESPONSE=$(curl -s "${BASE_URL}/api/institutions")
INSTITUTIONS=$(echo "$INSTITUTIONS_RESPONSE" | jq -c '.data // []')
TOTAL_INSTITUTIONS=$(echo "$INSTITUTIONS" | jq 'length')

if [ "$TOTAL_INSTITUTIONS" -eq 0 ]; then
    log_error "No institutions found in the database"
    exit 1
fi

log_success "Found $TOTAL_INSTITUTIONS institutions"

# Cache photo status for all institutions (single query instead of N queries)
log_info "Checking existing photo status..."
declare -A PHOTO_STATUS_TOTAL
declare -A PHOTO_STATUS_WITH
declare -A PHOTO_STATUS_WITHOUT

while IFS='|' read -r inst_id inst_name total with_photos without_photos; do
    if [ -n "$inst_id" ]; then
        PHOTO_STATUS_TOTAL["$inst_id"]="${total:-0}"
        PHOTO_STATUS_WITH["$inst_id"]="${with_photos:-0}"
        PHOTO_STATUS_WITHOUT["$inst_id"]="${without_photos:-0}"
    fi
done < <(get_all_institutions_photo_status)
log_success "Photo status loaded"

# Count institutions to fetch vs skip
FETCH_NEEDED=0
ALREADY_FETCHED=0

for i in $(seq 0 $((TOTAL_INSTITUTIONS - 1))); do
    INST_ID=$(echo "$INSTITUTIONS" | jq -r ".[$i].id")
    TOTAL="${PHOTO_STATUS_TOTAL[$INST_ID]:-0}"
    WITH_PHOTOS="${PHOTO_STATUS_WITH[$INST_ID]:-0}"

    # Calculate percentage with photos
    if [ "$TOTAL" -gt 0 ]; then
        PHOTO_PERCENT=$((WITH_PHOTOS * 100 / TOTAL))
    else
        PHOTO_PERCENT=0
    fi

    if [ "$FORCE_REFETCH" = true ] || [ "$PHOTO_PERCENT" -lt "$MIN_PHOTOS_PERCENT" ]; then
        FETCH_NEEDED=$((FETCH_NEEDED + 1))
    else
        ALREADY_FETCHED=$((ALREADY_FETCHED + 1))
    fi
done

# Show configuration
echo ""
log_divider "-"
log_info "CONFIGURATION:"
log_info "  Base URL: $BASE_URL"
log_info "  Pause between institutions: ${PAUSE_SECONDS}s"
log_info "  Starting from: Institution #$START_FROM"
log_info "  Min photos threshold: ${MIN_PHOTOS_PERCENT}%"
log_info "  Force re-fetch: $FORCE_REFETCH"
echo ""
log_info "SUMMARY:"
log_info "  Total institutions: $TOTAL_INSTITUTIONS"
log_success "  Need to fetch: $FETCH_NEEDED"
log_info "  Already fetched (>= ${MIN_PHOTOS_PERCENT}% complete): $ALREADY_FETCHED"
if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN MODE - No actual fetching will occur"
fi
log_divider "-"
echo ""

# ============================================================================
# DRY RUN - LIST INSTITUTIONS WITH PHOTO STATUS
# ============================================================================
if [ "$DRY_RUN" = true ]; then
    log_info "Listing all institutions with photo status:"
    echo ""
    printf "%-4s %-50s %-8s %-10s %-10s %s\n" "#" "INSTITUTION" "TOTAL" "W/PHOTO" "NO PHOTO" "STATUS"
    log_divider "-" 110

    for i in $(seq 0 $((TOTAL_INSTITUTIONS - 1))); do
        INST=$(echo "$INSTITUTIONS" | jq -r ".[$i]")
        INST_ID=$(echo "$INST" | jq -r '.id')
        INST_NAME=$(echo "$INST" | jq -r '.name')

        TOTAL="${PHOTO_STATUS_TOTAL[$INST_ID]:-0}"
        WITH_PHOTOS="${PHOTO_STATUS_WITH[$INST_ID]:-0}"
        WITHOUT_PHOTOS="${PHOTO_STATUS_WITHOUT[$INST_ID]:-0}"

        # Calculate percentage with photos
        if [ "$TOTAL" -gt 0 ]; then
            PHOTO_PERCENT=$((WITH_PHOTOS * 100 / TOTAL))
        else
            PHOTO_PERCENT=0
        fi

        if [ "$FORCE_REFETCH" = true ]; then
            STATUS="${YELLOW}WILL FETCH (force)${NC}"
        elif [ "$TOTAL" -eq 0 ]; then
            STATUS="${YELLOW}WILL FETCH (no employees)${NC}"
        elif [ "$PHOTO_PERCENT" -lt "$MIN_PHOTOS_PERCENT" ]; then
            STATUS="${GREEN}WILL FETCH (${PHOTO_PERCENT}% have photos)${NC}"
        else
            STATUS="${BLUE}SKIP (${PHOTO_PERCENT}% have photos)${NC}"
        fi

        # Truncate long names
        DISPLAY_NAME="${INST_NAME:0:48}"
        printf "%-4d %-50s %-8s %-10s %-10s " "$((i + 1))" "$DISPLAY_NAME" "$TOTAL" "$WITH_PHOTOS" "$WITHOUT_PHOTOS"
        echo -e "$STATUS"
    done

    echo ""
    log_divider "-" 110
    log_info "Total: $TOTAL_INSTITUTIONS institutions"
    log_success "Will fetch: $FETCH_NEEDED"
    log_info "Will skip: $ALREADY_FETCHED"
    exit 0
fi

# ============================================================================
# FETCH PHOTOS FOR EACH INSTITUTION
# ============================================================================
SCRIPT_START_TIME=$(date +%s)
SUCCESS_COUNT=0
FAILURE_COUNT=0
SKIPPED_COUNT=0
SKIPPED_ALREADY_FETCHED=0
SKIPPED_NO_EMPLOYEES=0
TOTAL_PHOTOS_FETCHED=0

# Arrays to store results (bash 4+)
declare -a SUCCESS_LIST
declare -a FAILURE_LIST
declare -a SKIPPED_LIST
declare -a ALREADY_FETCHED_LIST

log_info "Starting photo fetch..."
echo ""

# Adjust index for 1-based start
START_INDEX=$((START_FROM - 1))

for i in $(seq $START_INDEX $((TOTAL_INSTITUTIONS - 1))); do
    INST=$(echo "$INSTITUTIONS" | jq -r ".[$i]")
    INST_ID=$(echo "$INST" | jq -r '.id')
    INST_NAME=$(echo "$INST" | jq -r '.name')

    CURRENT_NUM=$((i + 1))
    PROGRESS="[$CURRENT_NUM/$TOTAL_INSTITUTIONS]"

    # Get photo status
    TOTAL="${PHOTO_STATUS_TOTAL[$INST_ID]:-0}"
    WITH_PHOTOS="${PHOTO_STATUS_WITH[$INST_ID]:-0}"
    WITHOUT_PHOTOS="${PHOTO_STATUS_WITHOUT[$INST_ID]:-0}"

    # Calculate percentage with photos
    if [ "$TOTAL" -gt 0 ]; then
        PHOTO_PERCENT=$((WITH_PHOTOS * 100 / TOTAL))
    else
        PHOTO_PERCENT=0
    fi

    # Check if institution already has enough photos (skip unless --force is used)
    if [ "$FORCE_REFETCH" != true ] && [ "$PHOTO_PERCENT" -ge "$MIN_PHOTOS_PERCENT" ]; then
        log_info "$PROGRESS SKIPPING: $INST_NAME (${PHOTO_PERCENT}% already have photos)"
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        SKIPPED_ALREADY_FETCHED=$((SKIPPED_ALREADY_FETCHED + 1))
        ALREADY_FETCHED_LIST+=("$INST_NAME: ${WITH_PHOTOS}/${TOTAL} employees (${PHOTO_PERCENT}%)")
        continue
    fi

    # Check if institution has any employees
    if [ "$TOTAL" -eq 0 ]; then
        log_info "$PROGRESS SKIPPING: $INST_NAME (no employees)"
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        SKIPPED_NO_EMPLOYEES=$((SKIPPED_NO_EMPLOYEES + 1))
        SKIPPED_LIST+=("$INST_NAME (no employees)")
        continue
    fi

    log_divider "-" 70
    log_info "$PROGRESS INSTITUTION: $INST_NAME"
    log_info "Employees: $TOTAL total | $WITH_PHOTOS with photos | $WITHOUT_PHOTOS without"
    log_info "Photo coverage: ${PHOTO_PERCENT}%"
    log_divider "-" 70

    FETCH_START_TIME=$(date +%s)

    # Call the photo fetch API
    log_info "Calling photo fetch API..."

    # Make the POST request to fetch photos
    # The API returns a streaming response, so we capture it line by line
    RESPONSE_FILE=$(mktemp)
    HTTP_CODE=$(curl -s -w "%{http_code}" \
        --max-time 600 \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Accept: text/event-stream" \
        -d "{\"institutionId\": \"$INST_ID\"}" \
        -o "$RESPONSE_FILE" \
        "${BASE_URL}/api/hrims/fetch-photos-by-institution" 2>&1) || HTTP_CODE="000"

    # Check for curl errors
    if ! [[ "$HTTP_CODE" =~ ^[0-9]+$ ]]; then
        log_error "Network error: $HTTP_CODE"
        FAILURE_COUNT=$((FAILURE_COUNT + 1))
        FAILURE_LIST+=("$INST_NAME: Network error")
        rm -f "$RESPONSE_FILE"
        continue
    fi

    if [ "$HTTP_CODE" != "200" ]; then
        ERROR_MSG=$(cat "$RESPONSE_FILE" | jq -r '.message // "HTTP error"' 2>/dev/null || echo "HTTP $HTTP_CODE")
        log_error "$INST_NAME: $ERROR_MSG"
        FAILURE_COUNT=$((FAILURE_COUNT + 1))
        FAILURE_LIST+=("$INST_NAME: $ERROR_MSG")
        rm -f "$RESPONSE_FILE"
        continue
    fi

    # Parse the streaming response to get the final result
    # Look for the complete event
    FINAL_RESULT=""
    while IFS= read -r line; do
        if [[ "$line" =~ ^data:\ .* ]]; then
            DATA="${line#data: }"
            TYPE=$(echo "$DATA" | jq -r '.type // ""' 2>/dev/null || echo "")

            if [ "$TYPE" = "progress" ]; then
                CURRENT=$(echo "$DATA" | jq -r '.current // 0' 2>/dev/null || echo "0")
                TOTAL_EMP=$(echo "$DATA" | jq -r '.total // 0' 2>/dev/null || echo "0")
                EMPLOYEE=$(echo "$DATA" | jq -r '.employee // ""' 2>/dev/null || echo "")
                SUMMARY_SUCCESS=$(echo "$DATA" | jq -r '.summary.success // 0' 2>/dev/null || echo "0")
                SUMMARY_FAILED=$(echo "$DATA" | jq -r '.summary.failed // 0' 2>/dev/null || echo "0")
                SUMMARY_SKIPPED=$(echo "$DATA" | jq -r '.summary.skipped // 0' 2>/dev/null || echo "0")

                # Show progress inline
                printf "\r  Progress: %d/%d - %s [OK:%d FAIL:%d SKIP:%d]    " \
                    "$CURRENT" "$TOTAL_EMP" "${EMPLOYEE:0:25}" \
                    "$SUMMARY_SUCCESS" "$SUMMARY_FAILED" "$SUMMARY_SKIPPED"
            elif [ "$TYPE" = "complete" ]; then
                FINAL_RESULT="$DATA"
                echo ""  # New line after progress
            fi
        fi
    done < "$RESPONSE_FILE"

    FETCH_END_TIME=$(date +%s)
    FETCH_DURATION=$((FETCH_END_TIME - FETCH_START_TIME))

    rm -f "$RESPONSE_FILE"

    # Parse the final result
    if [ -n "$FINAL_RESULT" ]; then
        SUCCESS_STATUS=$(echo "$FINAL_RESULT" | jq -r '.success // false' 2>/dev/null || echo "false")
        SUMMARY_TOTAL=$(echo "$FINAL_RESULT" | jq -r '.data.summary.total // 0' 2>/dev/null || echo "0")
        SUMMARY_SUCCESS=$(echo "$FINAL_RESULT" | jq -r '.data.summary.success // 0' 2>/dev/null || echo "0")
        SUMMARY_FAILED=$(echo "$FINAL_RESULT" | jq -r '.data.summary.failed // 0' 2>/dev/null || echo "0")
        SUMMARY_SKIPPED=$(echo "$FINAL_RESULT" | jq -r '.data.summary.skipped // 0' 2>/dev/null || echo "0")

        if [ "$SUCCESS_STATUS" = "true" ]; then
            log_success "$INST_NAME: Processed $SUMMARY_TOTAL employees"
            log_info "  Results: $SUMMARY_SUCCESS success, $SUMMARY_FAILED failed, $SUMMARY_SKIPPED skipped"
            log_info "  Duration: $(format_duration $FETCH_DURATION)"

            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            TOTAL_PHOTOS_FETCHED=$((TOTAL_PHOTOS_FETCHED + SUMMARY_SUCCESS))
            SUCCESS_LIST+=("$INST_NAME: $SUMMARY_SUCCESS/$SUMMARY_TOTAL photos fetched")
        else
            log_error "$INST_NAME: Processing completed with issues"
            FAILURE_COUNT=$((FAILURE_COUNT + 1))
            FAILURE_LIST+=("$INST_NAME: $SUMMARY_FAILED failed out of $SUMMARY_TOTAL")
        fi
    else
        log_error "$INST_NAME: No final result received from API"
        FAILURE_COUNT=$((FAILURE_COUNT + 1))
        FAILURE_LIST+=("$INST_NAME: No response")
    fi

    # Show running progress
    PROCESSED=$((SUCCESS_COUNT + FAILURE_COUNT + SKIPPED_COUNT))
    PROGRESS_PCT=$(awk "BEGIN {printf \"%.1f\", ($PROCESSED / $TOTAL_INSTITUTIONS) * 100}")
    log_info "Overall Progress: $PROCESSED/$TOTAL_INSTITUTIONS ($PROGRESS_PCT%) | SUCCESS: $SUCCESS_COUNT | FAIL: $FAILURE_COUNT | SKIP: $SKIPPED_COUNT"

    # Pause between institutions (except for the last one)
    if [ $i -lt $((TOTAL_INSTITUTIONS - 1)) ]; then
        log_info "Pausing ${PAUSE_SECONDS}s before next institution..."
        sleep "$PAUSE_SECONDS"
    fi

    echo ""
done

# ============================================================================
# FINAL SUMMARY
# ============================================================================
SCRIPT_END_TIME=$(date +%s)
TOTAL_DURATION=$((SCRIPT_END_TIME - SCRIPT_START_TIME))

echo ""
log_divider "="
echo -e "${CYAN}  FINAL SUMMARY - Photo Fetch${NC}"
log_divider "="
log_info "Completed at: $(date '+%Y-%m-%d %H:%M:%S')"
log_info "Total duration: $(format_duration $TOTAL_DURATION)"
echo ""
log_info "Total institutions: $TOTAL_INSTITUTIONS"
log_success "Successfully processed: $SUCCESS_COUNT"
log_error "Failed: $FAILURE_COUNT"
log_info "Skipped total: $SKIPPED_COUNT"
if [ $SKIPPED_ALREADY_FETCHED -gt 0 ]; then
    log_info "  - Already have photos (>= ${MIN_PHOTOS_PERCENT}%): $SKIPPED_ALREADY_FETCHED"
fi
if [ $SKIPPED_NO_EMPLOYEES -gt 0 ]; then
    log_warning "  - No employees: $SKIPPED_NO_EMPLOYEES"
fi
log_info "Total photos successfully fetched: $TOTAL_PHOTOS_FETCHED"
log_divider "="

# Print successful fetches
if [ $SUCCESS_COUNT -gt 0 ]; then
    echo ""
    log_info "SUCCESSFUL FETCHES:"
    log_divider "-"
    for item in "${SUCCESS_LIST[@]}"; do
        echo "  - $item"
    done
fi

# Print failed fetches
if [ $FAILURE_COUNT -gt 0 ]; then
    echo ""
    log_info "FAILED FETCHES:"
    log_divider "-"
    for item in "${FAILURE_LIST[@]}"; do
        echo "  - $item"
    done
fi

# Print skipped institutions (no employees)
if [ $SKIPPED_NO_EMPLOYEES -gt 0 ]; then
    echo ""
    log_info "SKIPPED (no employees):"
    log_divider "-"
    for item in "${SKIPPED_LIST[@]}"; do
        echo "  - $item"
    done
fi

# Print already fetched institutions
if [ $SKIPPED_ALREADY_FETCHED -gt 0 ]; then
    echo ""
    log_info "SKIPPED (already have photos - >= ${MIN_PHOTOS_PERCENT}% complete):"
    log_divider "-"
    for item in "${ALREADY_FETCHED_LIST[@]}"; do
        echo "  - $item"
    done
fi

echo ""
log_divider "="
log_info "Log file: $LOG_FILE"
log_success "Script completed!"
log_divider "="
echo ""

# Exit with error if there were failures
if [ $FAILURE_COUNT -gt 0 ]; then
    exit 1
fi

exit 0
