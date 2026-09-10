"""Temporary local preview with synthetic data. No configured database or AI calls.

Run from backend: venv/Scripts/python.exe tests/chat_preview.py
Point VITE_API_URL at http://127.0.0.1:8011 when starting Vite.
"""
import os
from pathlib import Path
import sys
import tempfile
import uuid

TEMP = tempfile.TemporaryDirectory(prefix="chat-preview-")
os.environ.update({
    "ENVIRONMENT": "test", "DATABASE_URL": "sqlite:///" + str(Path(TEMP.name) / "preview.db").replace("\\", "/"),
    "JWT_SECRET": "local-preview-only-not-for-production-secret",
    "INITIAL_ADMIN_EMAIL": "support@example.com", "INITIAL_ADMIN_PASSWORD": "Preview!8Support",
    "AI_PROVIDER": "disabled", "AI_API_KEY": "", "GROQ_API_KEY": "", "SUPABASE_URL": "", "SUPABASE_SECRET_KEY": "",
    "ENABLE_REAL_API_LOOKUP": "false", "CORS_ORIGINS": "http://127.0.0.1:5175,http://localhost:5175",
})
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app
from app.db.database import initialize_database, SessionLocal, engine
from app.models.user import User
from app.models.tender import Tender
from app.models.bid import Bid
from app.core.security import get_password_hash


if __name__ == "__main__":
    import uvicorn
    initialize_database()
    with SessionLocal() as db:
        user = User(id=uuid.uuid4(), full_name="Preview Applicant", email="applicant@example.com",
                    password_hash=get_password_hash("Preview!8Applicant"), role="BIDDER", is_active=True)
        tender = Tender(id="PREVIEW-2026", title="Preview office supplies", budget_limit=125000, status="Active")
        db.add_all([user, tender])
        db.flush()
        bid = Bid(id=uuid.UUID("712fa735-c13b-487b-bad8-33c3f38dbf16"), tender_id=tender.id, bidder_id=user.id, status="DOCUMENTS_SUBMITTED")
        db.add(bid)
        db.commit()
    print("Synthetic applicant: applicant@example.com / Preview!8Applicant", flush=True)
    print("Synthetic administrator: support@example.com / Preview!8Support", flush=True)
    print("Application reference: 712fa735-c13b-487b-bad8-33c3f38dbf16", flush=True)
    try:
        uvicorn.run(app, host="127.0.0.1", port=8011)
    finally:
        engine.dispose()
        TEMP.cleanup()
