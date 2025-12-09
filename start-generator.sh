#!/bin/bash
cd "$(dirname "$0")/client/package-generator"
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi
echo "Starting Package Generator Tool..."
npm start
