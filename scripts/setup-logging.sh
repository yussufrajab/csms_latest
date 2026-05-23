#!/bin/bash
set -e

# CSMS Logging Infrastructure Setup
# Run this script on the production/staging server to create
# log directories, set permissions, and configure cron jobs.

CSMS_USER="${CSMS_USER:-nextjs}"
LOG_DIR="/var/log/csms"

echo "=== CSMS Logging Infrastructure Setup ==="
echo ""

# Phase 1: Create log directories
echo "[1/4] Creating log directories..."
sudo mkdir -p "${LOG_DIR}/app"
sudo mkdir -p "${LOG_DIR}/audit"
sudo mkdir -p "${LOG_DIR}/workers"
sudo mkdir -p "${LOG_DIR}/archive/audit"

# Set ownership and permissions
sudo chown -R "${CSMS_USER}:${CSMS_USER}" "${LOG_DIR}"
sudo chmod -R 750 "${LOG_DIR}"

echo "  Directories created: ${LOG_DIR}/{app,audit,workers,archive/audit}"
echo "  Owner: ${CSMS_USER}:${CSMS_USER}"
echo "  Permissions: 750"
echo ""

# Phase 3: Deploy logrotate config
echo "[2/4] Deploying logrotate configuration..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/deploy-logrotate.sh" ]; then
  bash "${SCRIPT_DIR}/deploy-logrotate.sh"
else
  echo "  WARNING: deploy-logrotate.sh not found, skipping logrotate setup"
fi
echo ""

# Phase 5: Configure cron jobs
echo "[3/4] Configuring cron jobs..."
CRON_ARCHIVE="0 2 1 * * ${SCRIPT_DIR}/archive-audit.sh >> /var/log/csms/workers/archive.log 2>&1"
CRON_PARTITIONS="0 3 1 * * ${SCRIPT_DIR}/ensure-partitions.sh >> /var/log/csms/workers/partitions.log 2>&1"

# Add cron entries if they don't exist
(crontab -l 2>/dev/null | grep -v "archive-audit.sh"; echo "$CRON_ARCHIVE") | crontab -
(crontab -l 2>/dev/null | grep -v "ensure-partitions.sh"; echo "$CRON_PARTITIONS") | crontab -

echo "  Archive cron: 2 AM on 1st of each month"
echo "  Partition cron: 3 AM on 1st of each month"
echo ""

# Verify setup
echo "[4/4] Verifying setup..."
echo ""
echo "  Log directories:"
ls -la "${LOG_DIR}/"
echo ""
echo "  Logrotate config:"
cat /etc/logrotate.d/csms 2>/dev/null || echo "  (not yet deployed)"
echo ""
echo "  Cron jobs:"
crontab -l 2>/dev/null | grep -E "(archive-audit|ensure-partitions)" || echo "  (none configured)"
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Deploy the application with the new Pino logger"
echo "  2. Verify logs are writing to ${LOG_DIR}/app/"
echo "  3. Configure Wazuh agent (see docs/superpowers/csms-logging-plan.md Phase 6)"
echo "  4. Test archive script: sudo -u ${CSMS_USER} ${SCRIPT_DIR}/archive-audit.sh"