@echo off
REM Amal Platform - Run All Services
REM This script starts the mobile app, backend, and NGO dashboard

echo =========================================
echo        Amal Platform - Starting All
echo =========================================
echo.

REM Get the directory where the script is located
set SCRIPT_DIR=%~dp0

REM Start Backend (if it exists)
if exist "%SCRIPT_DIR%rubble-report-backend" (
    echo Starting Backend...
    start "Amal Backend" cmd /k "cd /d %SCRIPT_DIR%rubble-report-backend && npm install && npm run dev"
    echo Backend starting on port 3001
) else (
    echo Backend directory not found, skipping...
)

REM Start NGO Dashboard
if exist "%SCRIPT_DIR%ngo-dashboard" (
    echo Starting NGO Dashboard...
    start "Amal NGO Dashboard" cmd /k "cd /d %SCRIPT_DIR%ngo-dashboard && npm install && npm run dev"
    echo NGO Dashboard starting on port 3002
) else (
    echo NGO Dashboard directory not found!
)

REM Start Mobile App (Expo)
if exist "%SCRIPT_DIR%rubble-report-mobile" (
    echo Starting Mobile App ^(Expo^)...
    start "Amal Mobile App" cmd /k "cd /d %SCRIPT_DIR%rubble-report-mobile && npm install && npx expo start"
    echo Mobile App starting...
) else (
    echo Mobile App directory not found!
)

echo.
echo =========================================
echo          All Services Started
echo =========================================
echo.
echo Services:
echo   - Mobile App:    Expo DevTools ^(scan QR code^)
echo   - NGO Dashboard: http://localhost:3002
echo   - Backend:       http://localhost:3001 ^(if available^)
echo.
echo Each service runs in its own window.
echo Close the windows to stop the services.
echo.
pause
