@echo off
echo Starting Pawnshop Backend (DEV)...
cd "C:\Users\admin\Documents\pawnshopApp\pawnshop-app\server"
set PORT=3001
set NODE_ENV=development
npm run start
pause
