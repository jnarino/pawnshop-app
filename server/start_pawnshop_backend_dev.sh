#!/bin/bash
# Start API (DEV)
echo "Starting Pawnshop Backend (dev)..."
cd "/Users/olinad/Documents/proyectos/pawnshop/pawnshop-app/server"
export PORT=3001
export NODE_ENV=development
npm run start
