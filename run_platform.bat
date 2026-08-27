@echo off
title GeM Bid Compliance Platform runner
echo =======================================================
echo   GeM Bid Compliance Verification Platform Launcher
echo =======================================================
echo.

echo [1/2] Launching FastAPI Backend...
start "GeM Backend (FastAPI)" cmd /c "cd backend && venv\Scripts\activate && pip install -r requirements.txt && uvicorn app.main:app --reload"

echo [2/2] Launching Vite Frontend...
start "GeM Frontend (React/Vite)" cmd /c "cd frontend && npm install && npm run dev"

echo.
echo =======================================================
echo   Both services launched in separate windows!
echo   - Backend: http://127.0.0.1:8000/docs (Swagger Docs)
echo   - Frontend: Check the terminal for Vite URL
echo =======================================================
pause
