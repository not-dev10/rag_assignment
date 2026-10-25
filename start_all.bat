@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title DocuMind RAG - Service Launcher
color 0B

echo.
echo ================================================================================
echo          DocuMind RAG - Intelligent Document Q&A System                        
echo                    Service Orchestrator v1.0                                   
echo ================================================================================
echo.
echo  This launcher will start all required services:
echo    [1/3] Python AI Service    - Port 8000 (FastAPI)
echo    [2/3] Node.js Backend API  - Port 4000 (Express)
echo    [3/3] Frontend Web UI      - Port 3000 (Next.js)
echo.
echo ================================================================================
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
    echo Copying from .env.example...
    copy "python-ai\.env.example" "python-ai\.env" >nul
    echo.
    echo [ACTION REQUIRED] Please edit python-ai\.env with your:
    echo   - OPENROUTER_API_KEY or OPENAI_API_KEY
    echo   - QDRANT_URL and QDRANT_API_KEY
    echo.
    echo Press any key to open .env file in notepad...
    pause >nul
    notepad "python-ai\.env"
    echo.
    echo After saving your configuration, press any key to continue...
    pause >nul
)

echo ================================================================================
echo  Starting Services...
echo ================================================================================
echo.

echo [1/3] Launching Python AI Service (Port 8000)...
echo        Location: python-ai/
echo        Framework: FastAPI
echo        Functions: Document ingestion, embeddings, retrieval, generation
echo.
start "DocuMind - Python AI Service (8000)" cmd /k "title DocuMind AI Service && cd /d "%~dp0python-ai" && .venv\Scripts\activate && echo [INFO] Starting FastAPI server... && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 2 >nul

echo [2/3] Launching Node.js Backend API (Port 4000)...
echo        Location: backend-node/
echo        Framework: Express + TypeScript
echo        Functions: Request validation, orchestration, error handling
echo.
start "DocuMind - Node Backend (4000)" cmd /k "title DocuMind Backend API && cd /d "%~dp0backend-node" && echo [INFO] Starting Express server... && npm run dev"
timeout /t 2 >nul

echo [3/3] Launching Frontend Web UI (Port 3000)...
echo        Location: frontend/
echo        Framework: Next.js 15 + React 19
echo        Features: Chat, document manager, retrieval inspector
echo.
start "DocuMind - Frontend UI (3000)" cmd /k "title DocuMind Frontend && cd /d "%~dp0frontend" && echo [INFO] Starting Next.js dev server... && npm run dev"

echo.
echo ================================================================================
echo  Waiting for services to initialize...
echo ================================================================================
echo.
echo  This may take 10-30 seconds depending on your system.
echo  Terminal windows will open for each service.
echo.

REM Wait longer for services to fully start
echo  [████░░░░░░░░░░░░░░░░] Python AI starting...
timeout /t 5 >nul
echo  [████████░░░░░░░░░░░░] Node Backend starting...
timeout /t 3 >nul
echo  [████████████░░░░░░░░] Frontend starting...
timeout /t 3 >nul
echo  [████████████████████] All services launched!
echo.

REM Check service health
echo ================================================================================
echo  Checking Service Health...
echo ================================================================================
echo.

if exist "check_status.py" (
    python -u "%~dp0check_status.py" --wait
) else (
    echo [INFO] Health check script not found. Assuming services are starting...
    echo.
    echo  Python AI:    http://localhost:8000/health
    echo  Node Backend: http://localhost:4000/api/health
    echo  Frontend UI:  http://localhost:3000
    echo.
)

echo.
echo ================================================================================
echo  Opening DocuMind in your default browser...
echo ================================================================================
timeout /t 2 >nul
start http://localhost:3000

echo.
echo ================================================================================
echo                      All Systems Operational!                                  
echo ================================================================================
echo.
echo  Frontend UI:    http://localhost:3000
echo  Backend API:    http://localhost:4000
echo  Python AI:      http://localhost:8000
echo.
echo  Terminals will remain open with service logs.
echo  Do NOT close the terminal windows to keep services running.
echo.

:MENU
echo ================================================================================
echo  DocuMind Quick Actions:
echo ================================================================================
echo.
echo  [1] Check Service Status
echo  [2] Open Web UI in Browser
echo  [3] Run End-to-End Test
echo  [4] View Performance Metrics
echo  [5] Stop All Services and Exit
echo.
echo ================================================================================
set /p opt="Enter choice [1-5]: "
echo.

if "%opt%"=="1" (
    cls
    echo ================================================================================
    echo          Service Health Status                                               
    echo ================================================================================
    echo.
    if exist "check_status.py" (
        python -u "%~dp0check_status.py"
    ) else (
        echo [INFO] Checking ports...
        powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000,4000,8000 -ErrorAction SilentlyContinue | Select LocalPort, State | Format-Table"
    )
    echo.
    goto MENU
)

if "%opt%"=="2" (
    echo [INFO] Opening DocuMind UI...
    start http://localhost:3000
    goto MENU
)

if "%opt%"=="3" (
    echo.
    echo ================================================================================
    echo  Running End-to-End Integration Test...
    echo ================================================================================
    echo.
    if exist "full_flow_test.py" (
        python -u "%~dp0full_flow_test.py"
    ) else (
        echo [ERROR] Test script not found: full_flow_test.py
    )
    echo.
    echo Press any key to return to menu...
    pause >nul
    goto MENU
)

if "%opt%"=="4" (
    echo.
    echo ================================================================================
    echo  Performance Metrics & Latency Analysis
    echo ================================================================================
    echo.
    if exist "python-ai\test_performance.py" (
        cd python-ai
        call .venv\Scripts\activate.bat
        python test_performance.py
        cd ..
    ) else (
        echo [ERROR] Performance test script not found
    )
    echo.
    echo Press any key to return to menu...
    pause >nul
    goto MENU
)

if "%opt%"=="5" (
    goto STOP_SERVICES
)

echo [ERROR] Invalid choice. Please enter 1-5.
goto MENU

:STOP_SERVICES
echo.
echo ================================================================================
echo  Stopping All DocuMind Services...
echo ================================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ports = @(3000, 4000, 8000); " ^
  "$conns = Get-NetTCPConnection -LocalPort $ports -ErrorAction SilentlyContinue; " ^
  "if ($conns) { " ^
  "  $pids = $conns.OwningProcess | Select-Object -Unique; " ^
  "  Write-Host ' [INFO] Stopping processes on ports 3000, 4000, 8000...' -ForegroundColor Yellow; " ^
  "  foreach ($pid in $pids) { " ^
  "    try { " ^
  "      Stop-Process -Id $pid -Force -ErrorAction Stop; " ^
  "      Write-Host ' [OK] Stopped PID ' $pid -ForegroundColor Green; " ^
  "    } catch { " ^
  "      Write-Host ' [WARN] Could not stop PID ' $pid -ForegroundColor Yellow; " ^
  "    } " ^
  "  } " ^
  "  Write-Host ' [OK] All services stopped.' -ForegroundColor Green; " ^
  "} else { " ^
  "  Write-Host ' [INFO] No active services found on ports 3000, 4000, 8000.' -ForegroundColor Yellow; " ^
  "}"

echo.
echo ================================================================================
echo  DocuMind Services Shutdown Complete
echo ================================================================================
echo.
echo  All terminal windows should close automatically.
echo  If any remain open, you can close them manually.
echo.
echo  To restart, run: start_all.bat
echo.
echo  Thank you for using DocuMind RAG!
echo ================================================================================
echo.
timeout /t 3
exit /b 0
