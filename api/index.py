import os
import sys
import logging

logger = logging.getLogger(__name__)

# Ensure api directory and repository root are in Python path for Vercel execution
api_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(api_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

if os.path.exists(backend_dir) and backend_dir not in sys.path:
    sys.path.append(backend_dir)

try:
    from app.main import app as fastapi_app
except ImportError as e:
    logger.warning(f"Initial import from api/app failed: {e}. Trying backend/app fallback...")
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    from app.main import app as fastapi_app

app = fastapi_app

__all__ = ["app"]
