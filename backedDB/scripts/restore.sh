#!/bin/bash
#####################################
# CSMS Database Restore Script
# This script restores PostgreSQL database,
# Prisma schema, and MinIO configuration
# on a new VPS
#####################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_ROOT="$(dirname "$SCRIPT_DIR")"
TARGET_PROJECT_ROOT="/home/latest"

# Directories
DB_BACKUP_DIR="$BACKUP_ROOT/database"
PRISMA_BACKUP_DIR="$BACKUP_ROOT/prisma"
MINIO_BACKUP_DIR="$BACKUP_ROOT/minio"
ENV_BACKUP_DIR="$BACKUP_ROOT/env"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  CSMS Database Restore Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

#####################################
# Pre-flight Checks
#####################################
echo -e "${YELLOW}[Pre-flight] Checking system requirements...${NC}"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: This script should be run with sudo${NC}"
    echo "Usage: sudo ./restore.sh"
    exit 1
fi

# Check for required tools
REQUIRED_TOOLS=("psql" "pg_restore" "node" "npm")
for tool in "${REQUIRED_TOOLS[@]}"; do
    if ! command -v "$tool" &> /dev/null; then
        echo -e "${RED}Error: Required tool '$tool' is not installed${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ All required tools are installed${NC}"
echo ""

#####################################
# Environment Configuration
#####################################
echo -e "${YELLOW}[Step 1] Configuring environment...${NC}"

# Check if .env.backup exists
if [ ! -f "$ENV_BACKUP_DIR/.env.backup" ]; then
    echo -e "${RED}Error: .env.backup not found${NC}"
    exit 1
fi

# Ask user if they want to use the backed up .env or create new one
echo "Found backed up environment configuration."
read -p "Do you want to use the backed up .env file? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create project directory if it doesn't exist
    mkdir -p "$TARGET_PROJECT_ROOT"

    # Copy .env file
    cp "$ENV_BACKUP_DIR/.env.backup" "$TARGET_PROJECT_ROOT/.env"
    chmod 600 "$TARGET_PROJECT_ROOT/.env"
    echo -e "${GREEN}✓ Environment file copied${NC}"
else
    echo "Please edit the .env file at $TARGET_PROJECT_ROOT/.env manually"
    echo "Template available at: $ENV_BACKUP_DIR/.env.template"
    read -p "Press enter when you've configured the .env file..."
fi

# Source the environment file
if [ -f "$TARGET_PROJECT_ROOT/.env" ]; then
    source "$TARGET_PROJECT_ROOT/.env"
else
    echo -e "${RED}Error: .env file not found at $TARGET_PROJECT_ROOT/.env${NC}"
    exit 1
fi

# Parse DATABASE_URL
DB_URL_REGEX='postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/([^?]+)'
if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    echo -e "${RED}Error: Could not parse DATABASE_URL${NC}"
    exit 1
fi

echo "Database Configuration:"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

#####################################
# Database Restore
#####################################
echo -e "${YELLOW}[Step 2] Restoring PostgreSQL database...${NC}"

# Export password for PostgreSQL commands
export PGPASSWORD="$DB_PASSWORD"

# Check if database exists
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -w "$DB_NAME" | wc -l)

if [ "$DB_EXISTS" -eq 1 ]; then
    echo -e "${YELLOW}⚠ Database '$DB_NAME' already exists${NC}"
    read -p "Do you want to DROP and recreate it? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
        echo "Creating new database..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"
    else
        echo -e "${RED}Cannot restore into existing database. Exiting.${NC}"
        exit 1
    fi
else
    echo "Creating database '$DB_NAME'..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"
fi

# Find the latest backup file
BACKUP_FILE="$DB_BACKUP_DIR/${DB_NAME}_latest.backup"
if [ ! -f "$BACKUP_FILE" ]; then
    # Try to find any backup file
    BACKUP_FILE=$(find "$DB_BACKUP_DIR" -name "${DB_NAME}_*.backup" -type f | sort -r | head -n 1)
    if [ -z "$BACKUP_FILE" ]; then
        echo -e "${RED}Error: No backup file found${NC}"
        exit 1
    fi
fi

echo "Restoring from: $(basename $BACKUP_FILE)"
pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v "$BACKUP_FILE"

unset PGPASSWORD

echo -e "${GREEN}✓ Database restored successfully${NC}"
echo ""

#####################################
# Prisma Setup
#####################################
echo -e "${YELLOW}[Step 3] Setting up Prisma...${NC}"

# Create prisma directory in project
mkdir -p "$TARGET_PROJECT_ROOT/prisma"

# Copy Prisma schema
cp "$PRISMA_BACKUP_DIR/schema.prisma" "$TARGET_PROJECT_ROOT/prisma/"

# Copy migrations
if [ -d "$PRISMA_BACKUP_DIR/migrations" ]; then
    cp -r "$PRISMA_BACKUP_DIR/migrations" "$TARGET_PROJECT_ROOT/prisma/"
    echo -e "${GREEN}✓ Prisma migrations copied${NC}"
fi

# Generate Prisma Client (if project exists)
if [ -f "$TARGET_PROJECT_ROOT/package.json" ]; then
    echo "Generating Prisma Client..."
    cd "$TARGET_PROJECT_ROOT"
    npx prisma generate
    echo -e "${GREEN}✓ Prisma Client generated${NC}"
else
    echo -e "${YELLOW}⚠ package.json not found. Run 'npx prisma generate' manually after project setup${NC}"
fi

echo ""

#####################################
# MinIO Setup
#####################################
echo -e "${YELLOW}[Step 4] Setting up MinIO...${NC}"

# Check if MinIO config exists
if [ -f "$MINIO_BACKUP_DIR/minio-config.json" ]; then
    echo "MinIO configuration found:"
    cat "$MINIO_BACKUP_DIR/minio-config.json" | head -n 15
    echo ""

    # Parse MinIO config
    MINIO_BUCKETS=(
        "$MINIO_BUCKET_NAME"
        "$MINIO_BUCKET_CERTIFICATES"
        "$MINIO_BUCKET_PHOTOS"
        "$MINIO_BUCKET_ATTACHMENTS"
    )

    echo "MinIO Configuration:"
    echo "  Endpoint: $MINIO_ENDPOINT:$MINIO_PORT"
    echo "  Access Key: $MINIO_ACCESS_KEY"
    echo "  Buckets: ${MINIO_BUCKETS[@]}"
    echo ""

    # Check if mc is installed
    if command -v mc &> /dev/null; then
        read -p "Do you want to create MinIO buckets? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Configure mc alias
            mc alias set restore-minio "http://$MINIO_ENDPOINT:$MINIO_PORT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"

            # Create buckets
            for bucket in "${MINIO_BUCKETS[@]}"; do
                if mc mb "restore-minio/$bucket" 2>/dev/null; then
                    echo "  ✓ Created bucket: $bucket"
                else
                    echo "  ℹ Bucket already exists: $bucket"
                fi

                # Set public policy for public buckets if needed
                # mc anonymous set download "restore-minio/$bucket"
            done

            mc alias remove restore-minio
            echo -e "${GREEN}✓ MinIO buckets created${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ MinIO client (mc) not installed${NC}"
        echo "Install with: wget https://dl.min.io/client/mc/release/linux-amd64/mc && chmod +x mc && sudo mv mc /usr/local/bin/"
    fi
else
    echo -e "${YELLOW}⚠ MinIO configuration not found${NC}"
fi

echo ""

#####################################
# Project Setup (if needed)
#####################################
echo -e "${YELLOW}[Step 5] Checking project setup...${NC}"

if [ ! -d "$TARGET_PROJECT_ROOT/node_modules" ]; then
    echo -e "${YELLOW}⚠ Node modules not installed${NC}"
    read -p "Do you want to install dependencies? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$TARGET_PROJECT_ROOT"
        npm install
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    fi
fi

echo ""

#####################################
# Verification
#####################################
echo -e "${YELLOW}[Step 6] Verifying restore...${NC}"

# Export password for verification
export PGPASSWORD="$DB_PASSWORD"

# Count tables in database
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

echo "Database verification:"
echo "  Tables found: $TABLE_COUNT"

# Get row counts for main tables
echo ""
echo "Sample table row counts:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
    schemaname,
    tablename,
    n_tup_ins AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_tup_ins DESC
LIMIT 10;
" 2>/dev/null || echo "Could not retrieve row counts"

unset PGPASSWORD

echo ""

#####################################
# Summary
#####################################
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Restore Completed Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Database: $DB_NAME (restored)"
echo "Project: $TARGET_PROJECT_ROOT"
echo ""
echo "Next Steps:"
echo "1. Verify database contents"
echo "2. Update application URLs in .env if needed"
echo "3. Start the application: npm run dev"
echo "4. Test critical functionality"
echo "5. Restore MinIO file storage if needed"
echo ""
echo -e "${YELLOW}Important Reminders:${NC}"
echo "- Update DNS/domain settings"
echo "- Configure SSL certificates"
echo "- Set up firewall rules"
echo "- Configure backup schedule"
echo "- Test all application features"
echo ""
echo -e "${GREEN}Restore process complete!${NC}"
