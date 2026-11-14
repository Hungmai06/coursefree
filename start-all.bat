@echo off
echo ===================================================
echo   COURSEFREE - Starting Full-Stack Platform
echo ===================================================

echo Starting Backend API on http://localhost:5000...
start "CourseFree Backend (Port 5000)" cmd /k "cd Backend && npm.cmd run dev"

echo Waiting 2 seconds for Backend to initialize...
timeout /t 2 /nobreak >nul

echo Starting Frontend UI on http://localhost:3000...
start "CourseFree Frontend (Port 3000)" cmd /k "cd Frontend && npm.cmd run dev"

echo.
echo Both services have been launched in separate windows!
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:5000
echo ===================================================
pause

