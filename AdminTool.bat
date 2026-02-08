@echo off
TITLE Pawnshop Admin Tool
echo ==================================================
echo   Starting Pawnshop Admin Tool (Installer + Generator)
echo ==================================================
echo.
cd /d "%~dp0"

cd server\migration\web-tool
if exist Install.bat (
    call Install.bat
) else (
    echo [ERROR] Could not find Install.bat in server\migration\web-tool
    pause
)
