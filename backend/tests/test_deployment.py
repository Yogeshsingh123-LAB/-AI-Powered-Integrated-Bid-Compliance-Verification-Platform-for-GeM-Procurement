"""Isolated API regression tests. Never connect to the configured cloud database."""
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.parse import quote

TEMP = tempfile.TemporaryDirectory(prefix="bidverify-tests-")
os.environ.update({
    "ENVIRONMENT": "test",
    "DATABASE_URL": "sqlite:///" + str(Path(TEMP.name) / "test.db").replace("\\", "/"),
    "JWT_SECRET": "test-only-unique-secret-for-api-regressions",
    "INITIAL_ADMIN_PASSWORD": "TestAdmin!8Secure",
    "INITIAL_ADMIN_EMAIL": "admin@example.com",
    "SUPABASE_URL": "", "SUPABASE_SECRET_KEY": "",
    "GEMINI_API_KEY": "", "AI_API_KEY": "", "GROQ_API_KEY": "",
    "ENABLE_REAL_API_LOOKUP": "false",
    "CORS_ORIGINS": "https://frontend.example.com",
})
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings, Settings
settings.ENVIRONMENT = "test"
settings.DATABASE_URL = "sqlite:///" + str(Path(TEMP.name) / "test.db").replace("\\", "/")
settings.JWT_SECRET = "test-only-unique-secret-for-api-regressions"
settings.INITIAL_ADMIN_PASSWORD = "TestAdmin!8Secure"
settings.INITIAL_ADMIN_EMAIL = "admin@example.com"
settings.SUPABASE_URL = ""
settings.SUPABASE_SECRET_KEY = ""
settings.ENABLE_REAL_API_LOOKUP = False
settings.CORS_ORIGINS = "https://frontend.example.com"

from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect
from app.main import app
from app.models.user import User
from app.services.storage_service import StorageService
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


class DeploymentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import app.db.database as db_mod
        db_mod.is_sqlite = settings.DATABASE_URL.startswith("sqlite")
        db_mod.connect_args = {"check_same_thread": False} if db_mod.is_sqlite else {"connect_timeout": 10}
        db_mod.engine = create_engine(settings.DATABASE_URL, connect_args=db_mod.connect_args, pool_pre_ping=True)
        db_mod.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_mod.engine)
        db_mod.initialize_database()

        cls.client = TestClient(app)
        cls.client.__enter__()
        response = cls.client.post("/api/auth/login", json={"email": "admin@example.com", "password": "TestAdmin!8Secure"})
        assert response.status_code == 200, response.text
        cls.admin = {"Authorization": "Bearer " + response.json()["access_token"]}

    @classmethod
    def tearDownClass(cls):
        cls.client.__exit__(None, None, None)
        import app.db.database as db_mod
        db_mod.engine.dispose()
        try:
            TEMP.cleanup()
        except Exception:
            pass

    def register_bidder(self, name):
        email = f"{name}@example.com"
        r = self.client.post("/api/auth/register", json={"email": email, "password": "Bidder!8Secure", "full_name": name, "role": "BIDDER"})
        self.assertEqual(r.status_code, 201, r.text)
        r = self.client.post("/api/auth/login", json={"email": email, "password": "Bidder!8Secure"})
        self.assertEqual(r.status_code, 200, r.text)
        return {"Authorization": "Bearer " + r.json()["access_token"]}

    def test_default_passwords_cannot_bypass_admin(self):
        for password in ["Admin@123", "AdminPassword123", "admin123", "admin", "Admin123", "officer123"]:
            r = self.client.post("/api/auth/login", json={"email": "admin@example.com", "password": password})
            self.assertEqual(r.status_code, 401)
            r = self.client.post("/api/admin/blacklist", headers=self.admin, json={"identifier": "unknown@example.com", "admin_password": password, "reason": "Regression test"})
            self.assertEqual(r.status_code, 400, r.text)
            self.assertIn("Authorization", r.json()["detail"])

    def test_public_registration_cannot_create_privileged_users(self):
        for role in ["ADMIN", "OFFICER", "AUDITOR"]:
            r = self.client.post("/api/auth/register", json={"email": "escalation@example.com", "password": "Account!8Secure", "full_name": "Test", "role": role})
            self.assertEqual(r.status_code, 403, r.text)

    def test_bootstrap_preserves_existing_admin(self):
        import app.db.database as db_mod
        with db_mod.SessionLocal() as db:
            user = db.query(User).filter(User.role == "ADMIN").first()
            user.email = "renamed@example.com"
            user.is_active = False
            db.commit()
        try:
            db_mod.init_admin_user()
            with db_mod.SessionLocal() as db:
                user = db.query(User).filter(User.role == "ADMIN").first()
                self.assertEqual(user.email, "renamed@example.com")
                self.assertFalse(user.is_active)
        finally:
            with db_mod.SessionLocal() as db:
                user = db.query(User).filter(User.role == "ADMIN").first()
                user.email, user.is_active = "admin@example.com", True
                db.commit()

    def test_config_normalizes_database_driver_and_rejects_unsafe_production(self):
        conf = Settings(_env_file=None, DATABASE_URL="postgresql://user:password@localhost/db")
        self.assertTrue(conf.DATABASE_URL.startswith("postgresql+psycopg://"))
        with self.assertRaises(ValueError):
            Settings(_env_file=None, ENVIRONMENT="production", JWT_SECRET="short")

    def test_health_cors_and_protected_routes(self):
        self.assertEqual(self.client.get("/health").status_code, 200)
        for origin, expected in [("https://frontend.example.com", 200), ("https://untrusted.example.com", 400)]:
            r = self.client.options("/api/auth/login", headers={"Origin": origin, "Access-Control-Request-Method": "POST"})
            self.assertEqual(r.status_code, expected)
        for url in ["/api/admin/users", "/api/v1/mobile/pending-bids", "/api/v1/monitoring/recent-events"]:
            self.assertEqual(self.client.get(url).status_code, 401, url)
        # Generating the schema catches unresolved request/response model errors.
        self.assertEqual(self.client.get("/openapi.json").status_code, 200)

    def test_password_confirmation_and_invalid_login_input(self):
        for password, expected in [("Admin@123", 403), ("TestAdmin!8Secure", 200)]:
            response = self.client.post("/api/auth/verify-password", headers=self.admin, json={"password": password})
            self.assertEqual(response.status_code, expected)
        response = self.client.post("/api/auth/login", json={"email": "invalid", "password": "anything"})
        self.assertEqual(response.status_code, 422)

    def test_tender_upload_processing_and_officer_decision(self):
        bidder = self.register_bidder("supplier")
        other = self.register_bidder("other-supplier")
        tender_id = "GEM/TEST/001"
        r = self.client.post("/api/tenders", headers=self.admin, json={"id": tender_id, "title": "Test tender", "budget_limit": 50000, "status": "Active", "closing_date": "2099-12-31"})
        self.assertEqual(r.status_code, 201, r.text)
        path = "/api/tenders/" + quote(tender_id, safe="")
        r = self.client.put(path + "/requirements", headers=self.admin, json={"requirements": [{"code": "PAN", "description": "PAN Card", "is_mandatory": True}]})
        self.assertEqual(r.status_code, 200, r.text)
        requirement_id = r.json()["requirements"][0]["id"]
        self.assertEqual(self.client.get(path, headers=bidder).status_code, 200)
        r = self.client.post("/api/bids", headers=bidder, json={"tender_id": tender_id})
        self.assertEqual(r.status_code, 201, r.text)
        bid_id = r.json()["bid"]["id"]
        r = self.client.put(path + "/requirements", headers=self.admin, json={"requirements": []})
        self.assertEqual(r.status_code, 409, r.text)
        import pymupdf
        with pymupdf.open() as pdf:
            page = pdf.new_page()
            page.insert_text((50, 50), "INCOME TAX DEPARTMENT\nPERMANENT ACCOUNT NUMBER\nABCDE1234F\nName: TEST SUPPLIER\nDate of Birth: 01/01/2000")
            pdf_bytes = pdf.tobytes()
        objects = {}
        def upload(file_data, storage_path, mime_type):
            objects[storage_path] = file_data
            return storage_path
        with patch.object(StorageService, "upload_file", side_effect=upload), patch.object(StorageService, "download_file", side_effect=lambda path: objects[path]):
            r = self.client.post("/api/documents/upload", headers=other, data={"bid_id": bid_id, "requirement_id": requirement_id}, files={"file": ("pan.pdf", pdf_bytes, "application/pdf")})
            self.assertEqual(r.status_code, 403, r.text)
            r = self.client.post("/api/documents/upload", headers=bidder, data={"bid_id": bid_id, "requirement_id": requirement_id}, files={"file": ("pan.pdf", pdf_bytes, "application/pdf")})
            self.assertEqual(r.status_code, 201, r.text)
            doc_id = r.json()["document"]["id"]
            r = self.client.get(f"/api/documents/{doc_id}/extraction", headers=bidder)
            self.assertEqual(r.status_code, 200, r.text)
            self.assertIn("ABCDE1234F", r.text)
        payload = {"bid_id": bid_id, "officer_status": "Approved", "justification": "Verified original documents for regression test.", "officer_password": "wrong"}
        self.assertEqual(self.client.post("/api/v1/override/decision", headers=self.admin, json=payload).status_code, 403)
        payload["officer_password"] = "TestAdmin!8Secure"
        r = self.client.post("/api/v1/override/decision", headers=self.admin, json=payload)
        self.assertEqual(r.status_code, 200, r.text)
        self.assertTrue(r.json()["audit_hash"])
        self.assertEqual(self.client.post("/api/v1/override/decision", headers=self.admin, json=payload).status_code, 400)

    def test_websocket_authentication_and_routing(self):
        with self.client.websocket_connect("/api/v1/monitoring/live") as socket:
            socket.send_json({"token": "invalid"})
            with self.assertRaises(WebSocketDisconnect):
                socket.receive_json()
        with self.client.websocket_connect("/api/v1/monitoring/tender/GEM/TEST/001") as socket:
            socket.send_json({"token": self.admin["Authorization"].split(" ", 1)[1]})
            self.assertEqual(socket.receive_json(), {"type": "authenticated"})
            socket.send_text("ping")
            self.assertEqual(socket.receive_text(), "pong")


if __name__ == "__main__":
    unittest.main()
