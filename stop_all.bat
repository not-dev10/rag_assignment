@echo off
chcp 65001 >nul
title DocuMind RAG - Stop All Services
color 0C

echo.
echo ======================================================================
echo              Stopping All DocuMind Services...                        
echo ======================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$conns = Get-NetTCPConnection -LocalPort 3000, 4000, 8000 -ErrorAction SilentlyContinue; " ^
  "if ($conns) { " ^
  "  $pids = $conns.OwningProcess | Select-Object -Unique; " ^
  "  Stop-Process -Id $pids -Force -ErrorAction SilentlyContinue; " ^
  "  Write-Host ' [OK] Successfully stopped all services on ports 3000, 4000, and 8000.' -ForegroundColor Green; " ^
  "} else { " ^
  "  Write-Host ' [INFO] No active services detected on ports 3000, 4000, or 8000.' -ForegroundColor Yellow; " ^
  "}"

echo.
echo ======================================================================
echo All DocuMind processes have been cleaned up.
echo ======================================================================
timeout /t 3 >nul
exit /b
