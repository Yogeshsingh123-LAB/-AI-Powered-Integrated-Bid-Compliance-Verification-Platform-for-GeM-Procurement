import os
import sys

# Ensure api directory is in Python path for Vercel Serverless Function execution
api_dir = os.path.dirname(os.path.abspath(__file__))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

# Fallback to backend directory if running locally
backend_path = os.path.abspath(os.path.join(api_dir, "..", "backend"))
if os.path.exists(backend_path) and backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app

# Export the ASGI app for Vercel Python runtime
__all__ = ["app"]

