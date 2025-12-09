#!/bin/bash
cd "$(dirname "$0")"

# Check client dependencies (needed for tsc/build)
if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client
    npm install
    cd ..
fi

cd client/package-generator
if [ ! -d "node_modules" ]; then
    echo "Installing tool dependencies..."
    npm install
fi

echo "Starting Package Generator Tool..."
npm start
