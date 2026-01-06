@echo off
TITLE Pawnshop App - Update
CLS
echo ==========================================
echo      PAWNSHOP APP UPDATE
echo ==========================================
echo.
echo Pulling latest changes from release/cape-coral-store...
echo.

cd /d "%~dp0"
git pull origin release/cape-coral-store

echo.
echo ==========================================
echo Building Server...
echo ==========================================
echo.
cd server
call npm run build
cd ..

echo.
echo ==========================================
echo Building Client...
echo ==========================================
echo.
cd client
call npm run build
cd ..

echo.
echo ==========================================
echo Update and build complete!
echo ==========================================
pause
