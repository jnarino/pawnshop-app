@echo off
echo Starting Pawnshop Backend (PROD)...
cd "F:\projects\backend-frontend\pawnshop-app\server"
set PORT=3300
set NODE_ENV=production
npm run start
pause
