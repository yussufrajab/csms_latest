#!/bin/bash
#####################################
# CSMS Database Backup Script
# This script backs up PostgreSQL database,
# Prisma schema, migrations, and MinIO data
#####################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="/home/latest"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Directories
DB_BACKUP_DIR="$BACKUP_ROOT/database"
PRISMA_BACKUP_DIR="$BACKUP_ROOT/prisma"
MINIO_BACKUP_DIR="$BACKUP_ROOT/minio"
ENV_BACKUP_DIR="$BACKUP_ROOT/env"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
else
    echo -e "${RED}Error: .env file not found at $PROJECT_ROOT/.env${NC}"
    exit 1
fi

# Parse DATABASE_URL
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
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

echo -e "${GREEN}=== CSMS Backup Script ===${NC}"
echo "Timestamp: $TIMESTAMP"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

#####################################
# 1. Backup PostgreSQL Database
#####################################
echo -e "${YELLOW}[1/5] Backing up PostgreSQL database...${NC}"

# Export password for pg_dump
export PGPASSWORD="$DB_PASSWORD"

# Create full database dump
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -F c -b -v -f "$DB_BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.backup"

# Create SQL dump (more portable)
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -F p -b -v -f "$DB_BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"

# Create schema-only dump
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -s -F p -f "$DB_BACKUP_DIR/${DB_NAME}_schema_only.sql"

# Create latest symlink
ln -sf "${DB_NAME}_${TIMESTAMP}.backup" "$DB_BACKUP_DIR/${DB_NAME}_latest.backup"
ln -sf "${DB_NAME}_${TIMESTAMP}.sql" "$DB_BACKUP_DIR/${DB_NAME}_latest.sql"

unset PGPASSWORD

echo -e "${GREEN}✓ Database backup completed${NC}"
echo "  - Binary: ${DB_NAME}_${TIMESTAMP}.backup"
echo "  - SQL: ${DB_NAME}_${TIMESTAMP}.sql"
echo "  - Schema: ${DB_NAME}_schema_only.sql"
echo ""

#####################################
# 2. Backup Prisma Files
#####################################
echo -e "${YELLOW}[2/5] Backing up Prisma schema and migrations...${NC}"

# Copy Prisma schema
cp "$PROJECT_ROOT/prisma/schema.prisma" "$PRISMA_BACKUP_DIR/"

# Copy migrations directory
if [ -d "$PROJECT_ROOT/prisma/migrations" ]; then
    rsync -av --delete "$PROJECT_ROOT/prisma/migrations/" "$PRISMA_BACKUP_DIR/migrations/"
    echo -e "${GREEN}✓ Prisma migrations backed up${NC}"
else
    echo -e "${YELLOW}⚠ No migrations directory found${NC}"
fi

# Generate Prisma client info
cd "$PROJECT_ROOT"
npx prisma version > "$PRISMA_BACKUP_DIR/prisma-version.txt" 2>&1 || true

echo -e "${GREEN}✓ Prisma files backed up${NC}"
echo ""

#####################################
# 3. Backup MinIO Configuration
#####################################
echo -e "${YELLOW}[3/5] Backing up MinIO configuration...${NC}"

# Create MinIO config file
cat > "$MINIO_BACKUP_DIR/minio-config.json" <<EOF
{
  "endpoint": "$MINIO_ENDPOINT",
  "port": $MINIO_PORT,
  "use_ssl": $MINIO_USE_SSL,
  "access_key": "$MINIO_ACCESS_KEY",
  "secret_key": "$MINIO_SECRET_KEY",
  "buckets": {
    "documents": "$MINIO_BUCKET_NAME",
    "certificates": "$MINIO_BUCKET_CERTIFICATES",
    "photos": "$MINIO_BUCKET_PHOTOS",
    "attachments": "$MINIO_BUCKET_ATTACHMENTS"
  },
  "public_endpoint": "$NEXT_PUBLIC_MINIO_ENDPOINT",
  "console_url": "$MINIO_CONSOLE_URL"
}
EOF

# List MinIO buckets and their contents (metadata only)
if command -v mc &> /dev/null; then
    echo "Generating MinIO bucket inventory..."

    # Configure mc alias
    mc alias set backup-minio "http://$MINIO_ENDPOINT:$MINIO_PORT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" 2>&1 || true

    # List all buckets and their contents
    for bucket in "$MINIO_BUCKET_NAME" "$MINIO_BUCKET_CERTIFICATES" "$MINIO_BUCKET_PHOTOS" "$MINIO_BUCKET_ATTACHMENTS"; do
        if mc ls "backup-minio/$bucket" &> /dev/null; then
            mc ls -r "backup-minio/$bucket" > "$MINIO_BACKUP_DIR/${bucket}_inventory.txt" 2>&1 || true
            echo "  ✓ Inventory created for bucket: $bucket"
        fi
    done

    mc alias remove backup-minio 2>&1 || true
else
    echo -e "${YELLOW}⚠ MinIO client (mc) not installed. Skipping bucket inventory.${NC}"
    echo "  Install with: wget https://dl.min.io/client/mc/release/linux-amd64/mc && chmod +x mc"
fi

echo -e "${GREEN}✓ MinIO configuration backed up${NC}"
echo ""

#####################################
# 4. Backup Environment Configuration
#####################################
echo -e "${YELLOW}[4/5] Backing up environment configuration...${NC}"

# Create sanitized .env template (without sensitive data)
cat > "$ENV_BACKUP_DIR/.env.template" <<'EOF'
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:9002/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:9002

# Application URL (update for production)
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com

# Database URL
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/nody?schema=public"

# AI Configuration
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=YOUR_ACCESS_KEY
MINIO_SECRET_KEY=YOUR_SECRET_KEY
MINIO_BUCKET_NAME=documents
MINIO_BUCKET_CERTIFICATES=certificates
MINIO_BUCKET_PHOTOS=photos
MINIO_BUCKET_ATTACHMENTS=attachments
NEXT_PUBLIC_MINIO_ENDPOINT=http://YOUR_IP:9000
MINIO_CONSOLE_URL=http://YOUR_IP:9001

# CSRF Protection
CSRF_SECRET=YOUR_CSRF_SECRET
EOF

# Copy actual .env to secure location (with warning)
cp "$PROJECT_ROOT/.env" "$ENV_BACKUP_DIR/.env.backup"
chmod 600 "$ENV_BACKUP_DIR/.env.backup"

echo -e "${GREEN}✓ Environment configuration backed up${NC}"
echo -e "${RED}⚠ WARNING: .env.backup contains sensitive data. Keep it secure!${NC}"
echo ""

#####################################
# 5. Create Backup Metadata
#####################################
echo -e "${YELLOW}[5/5] Creating backup metadata...${NC}"

cat > "$BACKUP_ROOT/backup-info.json" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$(date -Iseconds)",
  "database": {
    "name": "$DB_NAME",
    "host": "$DB_HOST",
    "port": $DB_PORT,
    "user": "$DB_USER"
  },
  "files": {
    "database_backup": "database/${DB_NAME}_${TIMESTAMP}.backup",
    "database_sql": "database/${DB_NAME}_${TIMESTAMP}.sql",
    "schema_only": "database/${DB_NAME}_schema_only.sql",
    "prisma_schema": "prisma/schema.prisma",
    "prisma_migrations": "prisma/migrations/",
    "minio_config": "minio/minio-config.json",
    "env_template": "env/.env.template",
    "env_backup": "env/.env.backup"
  },
  "system_info": {
    "hostname": "$(hostname)",
    "os": "$(uname -s)",
    "kernel": "$(uname -r)"
  }
}
EOF

# Create backup README
cat > "$BACKUP_ROOT/README.md" <<'EOF'
# CSMS Database Backup

This directory contains a complete backup of the CSMS database and configuration.

## Contents

- `database/` - PostgreSQL database dumps
- `prisma/` - Prisma schema and migrations
- `minio/` - MinIO configuration and bucket inventory
- `env/` - Environment configuration files
- `scripts/` - Backup and restore scripts

## Files

### Database Backups
- `nody_TIMESTAMP.backup` - Binary format (recommended for restore)
- `nody_TIMESTAMP.sql` - SQL format (portable)
- `nody_schema_only.sql` - Database schema only
- `nody_latest.backup` - Symlink to latest backup

### Prisma
- `schema.prisma` - Database schema definition
- `migrations/` - All database migrations

### MinIO
- `minio-config.json` - MinIO server configuration
- `*_inventory.txt` - Bucket contents listing

### Environment
- `.env.template` - Template for new installation
- `.env.backup` - Full backup (SENSITIVE - keep secure!)

## Restore Instructions

See `scripts/restore.sh` for automated restore process.

For manual restore:
1. Set up new VPS with PostgreSQL and MinIO
2. Copy this directory to new server
3. Update `.env.backup` with new server details
4. Run `./scripts/restore.sh`

## Security Notes

- `.env.backup` contains sensitive credentials
- Keep this backup in a secure location
- Restrict file permissions (chmod 600)
- Delete old backups after migration

## Backup Information

See `backup-info.json` for detailed metadata about this backup.
EOF

echo -e "${GREEN}✓ Backup metadata created${NC}"
echo ""

#####################################
# Summary
#####################################
echo -e "${GREEN}=== Backup Completed Successfully ===${NC}"
echo ""
echo "Backup Location: $BACKUP_ROOT"
echo "Timestamp: $TIMESTAMP"
echo ""
echo "Next Steps:"
echo "1. Copy the entire /home/latest/backedDB directory to your new VPS"
echo "2. On the new VPS, run: ./scripts/restore.sh"
echo ""
echo -e "${RED}IMPORTANT:${NC}"
echo "- Keep this backup secure (contains sensitive data)"
echo "- Test the restore process before relying on this backup"
echo "- Backup file storage (MinIO buckets) separately if needed"
echo ""
