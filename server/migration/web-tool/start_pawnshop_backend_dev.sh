#!/bin/bash
# Start API (DEV)
echo "Starting Pawnshop Backend (dev)..."
cd "/Users/olinad/Documents/proyectos/pawnshop/pawnshop-express"
export PORT=3001
export NODE_ENV=development
npm run start
