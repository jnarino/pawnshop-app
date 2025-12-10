#!/bin/bash
# Start API (DEV)
echo "Starting Pawnshop Backend (dev)..."
cd "/Users/daniel.parra/Personal/pawnshop-app/server"
export PORT=3001
export NODE_ENV=development
npm run start
