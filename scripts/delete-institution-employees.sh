#!/bin/bash

#
# Delete Institution Employees Script
#
# This script deletes all employees and their related data from a specific institution.
# The institution itself is NOT deleted, only emptied.
#
# Usage: ./scripts/delete-institution-employees.sh
#

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to project directory
cd "$PROJECT_DIR"

# Load environment variables
if [ -f .env ]; then
    set -a
    source .env
    set +a
elif [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
else
    echo "Warning: No .env or .env.local file found"
fi

echo ""
echo "========================================"
echo "  Delete Institution Employees Script"
echo "========================================"
echo ""

# Run the TypeScript script
npx ts-node "$SCRIPT_DIR/delete-institution-employees.ts"
