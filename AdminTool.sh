#!/bin/bash
# AdminTool.sh - macOS/Linux Entry Point for Admin Tool

echo "=================================================="
echo "   Starting Pawnshop Admin Tool (Installer + Generator)"
echo "=================================================="
echo ""

# Navigate to installer directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/server/migration/web-tool"

if [ -f "Install.sh" ]; then
    # Ensure it is executable using chmod (best effort for user)
    chmod +x Install.sh
    ./Install.sh
else
    echo "[ERROR] Could not find Install.sh in server/migration/web-tool"
    exit 1
fi
