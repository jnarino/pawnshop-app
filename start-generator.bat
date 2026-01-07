@echo off
SETLOCAL EnableDelayedExpansion

cd /d "%~dp0"

echo ==========================================
echo   Pawnshop Package Generator - Windows
echo ==========================================

REM Check if client dependencies exist (needed for tsc/build)
if not exist "client\node_modules" (
    echo [INFO] Client dependencies not found. Installing...
    cd client
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install client dependencies.
        pause
        exit /b %ERRORLEVEL%
    )
    cd ..
) else (
    echo [INFO] Client dependencies found.
)

REM Check if generator tool dependencies exist
cd client\package-generator
if not exist "node_modules" (
    echo [INFO] Generator tool dependencies not found. Installing...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install generator dependencies.
        pause
        exit /b %ERRORLEVEL%
    )
)

echo [INFO] Starting Package Generator Tool...
echo.
echo Open http://localhost:3002 in your browser if it doesn't open automatically.
echo.

call npm start
pause
