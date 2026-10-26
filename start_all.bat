@echo off
title DocuMind RAG - Service Launcher
color 0B

echo.
echo ========================================================================
echo          DocuMind RAG - Starting All Services
echo ========================================================================
echo.

cd /d "%~dp0"

REM Check if virtual environment exists
if not exist "python-ai\.venv\" (
    echo [ERROR] Python virtual environment not found!
    echo.
    echo Please run setup first:
    echo   cd python-ai
    echo   python -m venv .venv
    echo   .venv\Scripts\activate
    echo   pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

REM Check if .env exists
if not exist "python-ai\.env" (
    echo [WARNING] python-ai\.env not found!
    echo Please create it from .env.example and add your API keys.
    echo.
    pause
    exit /b 1
)

echo [1/3] Starting Python AI Service (Port 8000)...
start "DocuMind - Python AI" cmd /k "cd /d "%~dp0python-ai" && .venv\Scripts\activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 >nul

echo [2/3] Starting Node Backend (Port 4000)...
start "DocuMind - Node Backend" cmd /k "cd /d "%~dp0backend-node" && npm run dev"
timeout /t 3 >nul

echo [3/3] Starting Frontend (Port 3000)...
start "DocuMind - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================================
echo  Services are starting...
echo  Please wait 15-20 seconds for all services to initialize.
echo ========================================================================
echo.
echo  Frontend:   http://localhost:3000
echo  Backend:    http://localhost:4000
echo  Python AI:  http://localhost:8000
echo.
echo  Terminal windows will open for each service.
echo  Check those windows for any errors.
echo.

timeout /t 5 >nul
echo Opening browser...
start http://localhost:3000

echo.
echo Press any key to open menu (or just use the terminal windows)...
pause >nul

:MENU
cls
echo ========================================================================
echo  DocuMind Quick Actions
echo ========================================================================
echo.
echo  [1] Check Service Status
echo  [2] Open Browser
echo  [3] Stop All Services
echo  [4] Exit (keep services running)
echo.
set /p opt="Enter choice [1-4]: "

if "%opt%"=="1" (
    echo.
    echo Checking services...
    python check_status.py
    echo.
    pause
    goto MENU
)

if "%opt%"=="2" (
    start http://localhost:3000
    goto MENU
)

if "%opt%"=="3" (
    goto STOP
)

if "%opt%"=="4" (
    exit /b 0
)

goto MENU

:STOP
echo.
echo Stopping all services...
powershell -Command "Get-NetTCPConnection -LocalPort 3000,4000,8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
echo Services stopped.
timeout /t 2 >nul
exit /b 0
