#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../config/logrotate/csms"

echo "Deploying logrotate configuration..."
sudo cp "$CONFIG_FILE" /etc/logrotate.d/csms
sudo chmod 644 /etc/logrotate.d/csms

echo "Testing logrotate configuration..."
sudo logrotate --debug /etc/logrotate.d/csms

echo "Logrotate configuration deployed successfully."
echo ""
echo "To manually test rotation:"
echo "  sudo logrotate --force /etc/logrotate.d/csms"