#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================="
echo "      PAWNSHOP APP SETUP WIZARD"
echo "=========================================="
echo ""

if ! command -v node &> /dev/null; then
    echo "Node.js is NOT installed. Please install Node.js 16+ first."
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Installing installer dependencies..."
    npm install
fi

echo "Starting Web Installer..."
node server.js
