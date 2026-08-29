@echo off
title BidVerify Platform runner
echo =======================================================
echo   BidVerify - GeM Bid Compliance Platform Launcher
echo =======================================================
echo.

echo Freeing port 8000 if occupied...
powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000...
start "GeM Backend (FastAPI)" cmd /c "cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo [2/2] Launching Vite Frontend on http://localhost:5173...
start "GeM Frontend (React/Vite)" cmd /c "cd frontend && npm run dev"

echo.
echo =======================================================
echo   Both services launched in separate windows!
echo   - Backend: http://127.0.0.1:8000/docs (Swagger Docs)
echo   - Frontend: http://localhost:5173
echo =======================================================
pause


