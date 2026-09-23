import os
import sys

# Vercel serverless entrypoint.
#
# SECURITY/MAINTAINABILITY: the canonical backend lives in backend/.
# An older partial copy of the app package used to live next to this file and was imported with
# higher path priority, causing the deployed API to silently diverge from
# the repository. The duplicate has been removed; only backend/ is used.
api_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(api_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

if not os.path.isdir(backend_dir):
    raise RuntimeError(
        "Vercel entrypoint cannot find the backend/ package. "
        "Restore backend/ or update vercel.json to point at it."
    )

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Remove this directory from the import path (defensive): only backend/ provides 'app'.
sys.path = [p for p in sys.path if os.path.abspath(p) != api_dir]

from app.main import app as fastapi_app  # noqa: E402

app = fastapi_app

__all__ = ["app"]
