#!/usr/bin/env bash

# =======================================================
#   BidVerify - GeM Bid Compliance Platform Launcher (macOS / Linux)
# =======================================================

echo "======================================================="
echo "  BidVerify - GeM Bid Compliance Platform Launcher"
echo "======================================================="
echo ""

# Locate root directory
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR" || exit 1

# Free ports 8000 and 5173 if occupied
echo "Freeing ports 8000 and 5173 if occupied..."
if command -v lsof >/dev/null 2>&1; then
  lsof -ti:8000 | xargs kill -9 2>/dev/null || true
  lsof -ti:5173 | xargs kill -9 2>/dev/null || true
fi

# Detect macOS environment for multi-window launching
if [[ "$OSTYPE" == "darwin"* ]] && command -v osascript >/dev/null 2>&1; then
  echo "[1/2] Launching FastAPI Backend on http://127.0.0.1:8000..."
  osascript -e "tell application \"Terminal\" to do script \"cd '$REPO_DIR/backend' && if [ -d 'venv/bin' ]; then source venv/bin/activate; elif [ -d 'venv/Scripts' ]; then source venv/Scripts/activate; fi && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000\""

  echo "[2/2] Launching Vite Frontend on http://localhost:5173..."
  osascript -e "tell application \"Terminal\" to do script \"cd '$REPO_DIR/frontend' && npm run dev\""

  echo ""
  echo "======================================================="
  echo "  Both services launched in separate Terminal windows!"
  echo "  - Backend:  http://127.0.0.1:8000/docs (Swagger Docs)"
  echo "  - Frontend: http://localhost:5173"
  echo "======================================================="

else
  echo "[1/2] Launching FastAPI Backend on http://127.0.0.1:8000..."
  echo "[2/2] Launching Vite Frontend on http://localhost:5173..."
  echo "Press Ctrl+C to gracefully stop both services."
  echo ""

  cleanup() {
    echo ""
    echo "Shutting down platform services..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
  }
  trap cleanup SIGINT SIGTERM EXIT

  (
    cd "$REPO_DIR/backend" || exit 1
    if [ -d "venv/bin" ]; then
      source venv/bin/activate
    elif [ -d "venv/Scripts" ]; then
      source venv/Scripts/activate
    fi
    uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
  ) &

  (
    cd "$REPO_DIR/frontend" || exit 1
    npm run dev
  ) &

  wait
fi
