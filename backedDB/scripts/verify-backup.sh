#!/bin/bash
#####################################
# Backup Verification Script
# Validates the integrity of backup files
#####################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}=== Backup Verification ===${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Check database backups
echo -e "${YELLOW}[1] Checking database backups...${NC}"
if [ -d "$BACKUP_ROOT/database" ]; then
    BACKUP_COUNT=$(find "$BACKUP_ROOT/database" -name "*.backup" -o -name "*.sql" | wc -l)
    if [ $BACKUP_COUNT -gt 0 ]; then
        echo -e "${GREEN}✓ Found $BACKUP_COUNT database backup files${NC}"
        ls -lh "$BACKUP_ROOT/database"/*.{backup,sql} 2>/dev/null || true
    else
        echo -e "${RED}✗ No database backups found${NC}"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗ Database backup directory not found${NC}"
    ((ERRORS++))
fi
echo ""

# Check Prisma files
echo -e "${YELLOW}[2] Checking Prisma files...${NC}"
if [ -f "$BACKUP_ROOT/prisma/schema.prisma" ]; then
    echo -e "${GREEN}✓ Prisma schema found${NC}"
    SCHEMA_SIZE=$(wc -l < "$BACKUP_ROOT/prisma/schema.prisma")
    echo "  Schema: $SCHEMA_SIZE lines"
else
    echo -e "${RED}✗ Prisma schema not found${NC}"
    ((ERRORS++))
fi

if [ -d "$BACKUP_ROOT/prisma/migrations" ]; then
    MIGRATION_COUNT=$(find "$BACKUP_ROOT/prisma/migrations" -type d -mindepth 1 | wc -l)
    echo -e "${GREEN}✓ Found $MIGRATION_COUNT migrations${NC}"
else
    echo -e "${YELLOW}⚠ No migrations directory${NC}"
    ((WARNINGS++))
fi
echo ""

# Check MinIO configuration
echo -e "${YELLOW}[3] Checking MinIO configuration...${NC}"
if [ -f "$BACKUP_ROOT/minio/minio-config.json" ]; then
    echo -e "${GREEN}✓ MinIO configuration found${NC}"
    cat "$BACKUP_ROOT/minio/minio-config.json" | head -n 10
else
    echo -e "${YELLOW}⚠ MinIO configuration not found${NC}"
    ((WARNINGS++))
fi
echo ""

# Check environment files
echo -e "${YELLOW}[4] Checking environment files...${NC}"
if [ -f "$BACKUP_ROOT/env/.env.backup" ]; then
    echo -e "${GREEN}✓ Environment backup found${NC}"
    FILE_SIZE=$(ls -lh "$BACKUP_ROOT/env/.env.backup" | awk '{print $5}')
    echo "  Size: $FILE_SIZE"
else
    echo -e "${RED}✗ Environment backup not found${NC}"
    ((ERRORS++))
fi

if [ -f "$BACKUP_ROOT/env/.env.template" ]; then
    echo -e "${GREEN}✓ Environment template found${NC}"
else
    echo -e "${YELLOW}⚠ Environment template not found${NC}"
    ((WARNINGS++))
fi
echo ""

# Check metadata
echo -e "${YELLOW}[5] Checking backup metadata...${NC}"
if [ -f "$BACKUP_ROOT/backup-info.json" ]; then
    echo -e "${GREEN}✓ Backup metadata found${NC}"
    cat "$BACKUP_ROOT/backup-info.json"
else
    echo -e "${YELLOW}⚠ Backup metadata not found${NC}"
    ((WARNINGS++))
fi
echo ""

# Calculate total size
echo -e "${YELLOW}[6] Backup size analysis...${NC}"
TOTAL_SIZE=$(du -sh "$BACKUP_ROOT" | cut -f1)
DB_SIZE=$(du -sh "$BACKUP_ROOT/database" 2>/dev/null | cut -f1 || echo "0")
MINIO_SIZE=$(du -sh "$BACKUP_ROOT/minio-data" 2>/dev/null | cut -f1 || echo "0 (not backed up)")

echo "Total backup size: $TOTAL_SIZE"
echo "  Database: $DB_SIZE"
echo "  MinIO data: $MINIO_SIZE"
echo ""

# Summary
echo -e "${BLUE}=== Verification Summary ===${NC}"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Backup is complete and valid!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Backup is valid but has $WARNINGS warnings${NC}"
    exit 0
else
    echo -e "${RED}✗ Backup has $ERRORS errors and $WARNINGS warnings${NC}"
    echo "Please run the backup script again"
    exit 1
fi
