@echo off
chcp 65001 > nul
echo ========================================
echo  L.PMS Frontend Setup
echo ========================================
echo.

echo [1/1] 프론트엔드 패키지 설치...
cd /d "%~dp0frontend"
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo ERROR: 패키지 설치 실패
    pause
    exit /b 1
)

echo.
echo Setup complete! Run start.bat to launch.
pause
