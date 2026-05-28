#!/bin/bash
# Package all disaster recovery files into a single archive
# This creates a complete backup package for VPS recovery

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="csms-disaster-recovery-${TIMESTAMP}"
PACKAGE_DIR="$SCRIPT_DIR/$PACKAGE_NAME"
ARCHIVE_FILE="$SCRIPT_DIR/${PACKAGE_NAME}.tar.gz"

echo "=========================================="
echo "Packaging CSMS Disaster Recovery Files"
echo "=========================================="
echo ""

# Create package directory
echo "[1/6] Creating package directory..."
mkdir -p "$PACKAGE_DIR"

# Copy schema files
echo "[2/6] Copying schema files..."
cp "$SCRIPT_DIR/schema.prisma" "$PACKAGE_DIR/"
cp "$SCRIPT_DIR/schema_"*.sql "$PACKAGE_DIR/" 2>/dev/null || echo "  No schema SQL files found"

# Copy data backup
echo "[3/6] Copying data backup..."
cp "$SCRIPT_DIR/nody_full_"*.sql "$PACKAGE_DIR/" 2>/dev/null || echo "  No full backup files found"

# Copy migration files
echo "[4/6] Copying migration files..."
cp -r "$SCRIPT_DIR/migrations" "$PACKAGE_DIR/"

# Copy scripts and documentation
echo "[5/6] Copying scripts and documentation..."
cp "$SCRIPT_DIR/backup-full.sh" "$PACKAGE_DIR/"
cp "$SCRIPT_DIR/backup.sh" "$PACKAGE_DIR/"
cp "$SCRIPT_DIR/restore.sh" "$PACKAGE_DIR/"
cp "$SCRIPT_DIR/disaster-recovery.sh" "$PACKAGE_DIR/"
cp "$SCRIPT_DIR/package-backup.sh" "$PACKAGE_DIR/"
cp "$SCRIPT_DIR/README.md" "$PACKAGE_DIR/"
cp "$SCRIPT_DIR/DISASTER_RECOVERY.md" "$PACKAGE_DIR/"
cp "$SCRIPT_DIR/MIGRATION_CHANGELOG.md" "$PACKAGE_DIR/"
cp "$SCRIPT_DIR/UPDATE_SUMMARY.md" "$PACKAGE_DIR/"

# Create archive
echo "[6/6] Creating archive..."
cd "$SCRIPT_DIR"
tar -czf "$ARCHIVE_FILE" "$PACKAGE_NAME"

# Clean up temporary directory
rm -rf "$PACKAGE_DIR"

echo ""
echo "=========================================="
echo "Package Created Successfully!"
echo "=========================================="
echo ""
echo "Archive: $ARCHIVE_FILE"
echo "Size: $(du -h "$ARCHIVE_FILE" | cut -f1)"
echo ""
echo "Contents:"
echo "  - schema.prisma (Prisma schema)"
echo "  - schema_*.sql (Database schema SQL)"
echo "  - nody_full_*.sql (All data except employees)"
echo "  - migrations/ (All migration files)"
echo "  - backup-full.sh (Full backup script)"
echo "  - backup.sh (Core backup script)"
echo "  - restore.sh (Restore script)"
echo "  - disaster-recovery.sh (Recovery script)"
echo "  - package-backup.sh (This script)"
echo "  - README.md (Documentation)"
echo "  - DISASTER_RECOVERY.md (Recovery guide)"
echo "  - MIGRATION_CHANGELOG.md (Migration history)"
echo "  - UPDATE_SUMMARY.md (Update summary)"
echo ""
echo "To use:"
echo "  1. Transfer archive to new VPS"
echo "  2. Extract: tar -xzf ${PACKAGE_NAME}.tar.gz"
echo "  3. Follow DISASTER_RECOVERY.md instructions"
echo "=========================================="