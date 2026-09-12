import os
import sys

# Ensure backend directory is in Python path for Vercel Serverless Function execution
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app

# Export the ASGI app for Vercel Python runtime
__all__ = ["app"]
