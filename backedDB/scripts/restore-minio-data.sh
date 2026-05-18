#!/bin/bash
#####################################
# MinIO Data Restore Script
# This script restores file data to
# MinIO buckets on new server
#####################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="/home/latest"

MINIO_DATA_DIR="$BACKUP_ROOT/minio-data"

echo -e "${BLUE}=== MinIO Data Restore ===${NC}"
echo ""

# Check if data directory exists
if [ ! -d "$MINIO_DATA_DIR" ]; then
    echo -e "${RED}Error: MinIO data directory not found: $MINIO_DATA_DIR${NC}"
    echo "Extract the backup first: tar -xzf minio-data-latest.tar.gz"
    exit 1
fi

# Load environment
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Check if mc is installed
if ! command -v mc &> /dev/null; then
    echo -e "${RED}Error: MinIO client (mc) is not installed${NC}"
    echo "Install with: wget https://dl.min.io/client/mc/release/linux-amd64/mc"
    exit 1
fi

# Configure mc alias
echo "Configuring MinIO client..."
mc alias set restore-target "http://$MINIO_ENDPOINT:$MINIO_PORT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"

# Verify connection
if ! mc admin info restore-target &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to MinIO server${NC}"
    echo "Check your MinIO configuration in .env"
    exit 1
fi

echo -e "${GREEN}✓ Connected to MinIO server${NC}"
echo ""

# Restore each bucket
for bucket_dir in "$MINIO_DATA_DIR"/*; do
    if [ -d "$bucket_dir" ]; then
        bucket=$(basename "$bucket_dir")
        echo -e "${YELLOW}Restoring bucket: $bucket${NC}"

        # Ensure bucket exists
        if ! mc ls "restore-target/$bucket" &> /dev/null; then
            mc mb "restore-target/$bucket"
            echo "  Created bucket: $bucket"
        fi

        # Mirror files to bucket
        mc mirror "$bucket_dir/" "restore-target/$bucket" --preserve --overwrite
        FILE_COUNT=$(find "$bucket_dir" -type f | wc -l)
        echo -e "${GREEN}✓ $bucket restored: $FILE_COUNT files${NC}"
        echo ""
    fi
done

# Remove alias
mc alias remove restore-target

echo -e "${GREEN}=== MinIO Data Restore Complete ===${NC}"
echo ""
echo "All buckets have been restored to the MinIO server."
echo "Verify by accessing MinIO Console: $MINIO_CONSOLE_URL"
