#!/bin/bash
# Start API (Production)
echo "Starting Pawnshop API..."
cd "/Users/olinad/Documents/proyectos/pawnshop/pawnshop-express"
npm run start > api.log 2>&1 &
API_PID=$!

echo "Waiting for API..."
sleep 5

# Start Client (Electron Production)
echo "Starting Pawnshop Client..."
cd "/Users/olinad/Documents/proyectos/pawnshop/pawnshop-app/client"
export NODE_ENV=production
npx electron dist-electron/main.js > client.log 2>&1 &
CLIENT_PID=$!

echo "Pawnshop started (PIDs: $API_PID, $CLIENT_PID)"
