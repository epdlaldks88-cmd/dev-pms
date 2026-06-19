@echo off
echo ====================================
echo  PMS 프론트엔드 업데이트 시작
echo ====================================

echo.
echo [1/2] Git pull...
git pull origin main
if %errorlevel% neq 0 (
    echo Git pull 실패!
    pause
    exit /b 1
)

echo.
echo [2/2] 프론트엔드 패키지 설치...
cd frontend
npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo 프론트엔드 패키지 설치 실패!
    pause
    exit /b 1
)
cd ..

echo.
echo ====================================
echo  업데이트 완료!
echo  프론트: http://localhost:5173
echo ====================================
pause
