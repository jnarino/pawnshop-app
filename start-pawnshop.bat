@echo off
echo Starting Pawnshop Application...
echo.

REM Start the server in a new window
start "Pawnshop Server" cmd /k "cd server && npm run dev"

REM Wait a moment before starting the client
timeout /t 3 /nobreak > nul

REM Start the client in a new window
start "Pawnshop Client" cmd /k "cd client && npm run start:dev"

echo.
echo Both server and client are starting in separate windows.
echo Close this window or press any key to exit this launcher.
pause > nul
