@echo off
chcp 65001 > nul
echo ========================================
echo  L.PMS Frontend Start
echo ========================================
echo.

echo Starting Frontend...
start "PMS Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Frontend starting...
echo   http://localhost:5173
echo.
pause
