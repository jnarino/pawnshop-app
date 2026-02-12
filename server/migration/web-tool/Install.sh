#!/bin/bash
# Install.sh - macOS/Linux Entry Point for Pawnshop Installer

echo "=========================================="
echo "      PAWNSHOP APP SETUP WIZARD"
echo "=========================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is NOT installed. Please install Node.js 16+ first."
    echo "Visit https://nodejs.org/"
    exit 1
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "Installing installer dependencies..."
    npm install
fi

echo "Starting Web Installer..."
node server.js
