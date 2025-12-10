@echo off
TITLE Pawnshop Installer
CLS
echo ==========================================
echo      PAWNSHOP APP SETUP WIZARD
echo ==========================================
echo.
echo Checking for Node.js...
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Node.js is NOT installed. Please install Node.js 16+ first.
    echo Opening download page...
    start https://nodejs.org/
    pause
    exit
)

cd /d "%~dp0"
IF NOT EXIST "node_modules" (
    echo Installing installer dependencies...
    call npm install
)

echo Starting Web Installer...
node server.js
pause
