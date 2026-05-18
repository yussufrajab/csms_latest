#!/bin/bash
#####################################
# MinIO Data Backup Script
# This script backs up actual file data
# from MinIO buckets
#####################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="/home/latest"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Load environment
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

MINIO_DATA_DIR="$BACKUP_ROOT/minio-data"
mkdir -p "$MINIO_DATA_DIR"

echo -e "${GREEN}=== MinIO Data Backup ===${NC}"
echo "Timestamp: $TIMESTAMP"
echo ""

# Check if mc is installed
if ! command -v mc &> /dev/null; then
    echo -e "${RED}Error: MinIO client (mc) is not installed${NC}"
    echo "Install with: wget https://dl.min.io/client/mc/release/linux-amd64/mc"
    echo "             chmod +x mc && sudo mv mc /usr/local/bin/"
    exit 1
fi

# Configure mc alias
echo "Configuring MinIO client..."
mc alias set backup-source "http://$MINIO_ENDPOINT:$MINIO_PORT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"

# Define buckets
BUCKETS=(
    "$MINIO_BUCKET_NAME"
    "$MINIO_BUCKET_CERTIFICATES"
    "$MINIO_BUCKET_PHOTOS"
    "$MINIO_BUCKET_ATTACHMENTS"
)

# Backup each bucket
for bucket in "${BUCKETS[@]}"; do
    echo -e "${YELLOW}Backing up bucket: $bucket${NC}"

    # Create bucket directory
    BUCKET_DIR="$MINIO_DATA_DIR/$bucket"
    mkdir -p "$BUCKET_DIR"

    # Mirror bucket contents
    if mc ls "backup-source/$bucket" &> /dev/null; then
        mc mirror "backup-source/$bucket" "$BUCKET_DIR/" --preserve
        FILE_COUNT=$(find "$BUCKET_DIR" -type f | wc -l)
        TOTAL_SIZE=$(du -sh "$BUCKET_DIR" | cut -f1)
        echo -e "${GREEN}✓ $bucket backed up: $FILE_COUNT files ($TOTAL_SIZE)${NC}"
    else
        echo -e "${YELLOW}⚠ Bucket $bucket not found or empty${NC}"
    fi
    echo ""
done

# Remove alias
mc alias remove backup-source

# Create tarball for easy transfer
echo -e "${YELLOW}Creating compressed archive...${NC}"
cd "$BACKUP_ROOT"
tar -czf "minio-data-${TIMESTAMP}.tar.gz" -C "$BACKUP_ROOT" "minio-data"

ARCHIVE_SIZE=$(du -sh "minio-data-${TIMESTAMP}.tar.gz" | cut -f1)
echo -e "${GREEN}✓ Archive created: minio-data-${TIMESTAMP}.tar.gz ($ARCHIVE_SIZE)${NC}"

# Create latest symlink
ln -sf "minio-data-${TIMESTAMP}.tar.gz" "$BACKUP_ROOT/minio-data-latest.tar.gz"

echo ""
echo -e "${GREEN}=== MinIO Data Backup Complete ===${NC}"
echo "Location: $MINIO_DATA_DIR"
echo "Archive: minio-data-${TIMESTAMP}.tar.gz"
echo ""
echo "To restore on new server:"
echo "1. Extract: tar -xzf minio-data-latest.tar.gz"
echo "2. Run: ./scripts/restore-minio-data.sh"
