#!/bin/bash
# Start API (PROD)
echo "Starting Pawnshop Backend (prod)..."
cd "/Users/olinad/Documents/proyectos/pawnshop/pawnshop-app/server"
export PORT=3000
export NODE_ENV=production
npm run start
