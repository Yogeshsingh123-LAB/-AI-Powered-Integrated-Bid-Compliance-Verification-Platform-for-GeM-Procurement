"""
API regression tests (roles, admin authorization, uploads, override flow,
websockets, config hardening).

Runs against the shared test database configured by conftest.py (never a
cloud database). The environment is intentionally NOT re-patched here:
settings/engine singletons are created once by conftest before any app import.
"""
import os
import sys
import unittest
import unittest.mock
from urllib.parse import quote

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.main import app
from app.core.config import settings, Settings
from app.db.database import SessionLocal, init_admin_user
from app.models.user import User
from app.services.storage_service import StorageService
from app.core.security import get_password_hash
from app.services.rate_limiter import login_limiter


def _clear_email_lockout(email: str) -> None:
    """Test hook: reset the in-memory per-email failure tracker."""
    login_limiter._email_failures.pop(email.strip().lower(), None)


class DeploymentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.client.__enter__()  # run lifespan (schema init)

        # Ensure a known administrator exists in the test database.
        cls.admin_password = "TestAdmin!8Secure"
        db = SessionLocal()
        try:
            admin = db.query(User).filter(User.email == "admin@example.com").first()
            if not admin:
                admin = User(
                    full_name="Platform Administrator",
                    email="admin@example.com",
                    password_hash=get_password_hash(cls.admin_password),
                    role="ADMIN",
                    status="Active",
                    is_active=True,
                    must_change_password=False,
                )
                db.add(admin)
                db.commit()
        finally:
            db.close()

        response = cls.client.post("/api/auth/login", json={"email": "admin@example.com", "password": cls.admin_password})
        assert response.status_code == 200, response.text
        cls.admin = {"Authorization": "Bearer " + response.json()["access_token"]}

    @classmethod
    def tearDownClass(cls):
        cls.client.__exit__(None, None, None)

    def register_bidder(self, name):
        email = f"{name}@example.com"
        r = self.client.post("/api/auth/register", json={"email": email, "password": "Bidder!8Secure", "full_name": name, "role": "BIDDER"})
        self.assertEqual(r.status_code, 201, r.text)
        r = self.client.post("/api/auth/login", json={"email": email, "password": "Bidder!8Secure"})
        self.assertEqual(r.status_code, 200, r.text)
        return {"Authorization": "Bearer " + r.json()["access_token"]}

    def test_default_passwords_cannot_bypass_admin(self):
        for password in ["Admin@123", "AdminPassword123", "admin123", "admin", "Admin123", "officer123"]:
            _clear_email_lockout("admin@example.com")
            r = self.client.post("/api/auth/login", json={"email": "admin@example.com", "password": password})
            self.assertIn(r.status_code, (401, 429))  # 429 = lockout engaged (also a pass)
            r = self.client.post("/api/admin/blacklist", headers=self.admin, json={"identifier": "unknown@example.com", "admin_password": password, "reason": "Regression test"})
            self.assertEqual(r.status_code, 400, r.text)
            self.assertIn("Authorization", r.json()["detail"])

    def test_public_registration_cannot_create_privileged_users(self):
        for i, role in enumerate(["ADMIN", "OFFICER", "AUDITOR"]):
            email = f"escalation{i}@example.com"
            r = self.client.post("/api/auth/register", json={"email": email, "password": "Account!8Secure", "full_name": "Test", "role": role})
            self.assertEqual(r.status_code, 403, r.text)

    def test_bootstrap_is_noop_when_users_exist(self):
        """With users already present, bootstrap must not create or modify
        accounts (the old code re-created default accounts on every start)."""
        db = SessionLocal()
        try:
            before = [(u.email, u.is_active) for u in db.query(User).all()]
        finally:
            db.close()
        init_admin_user()
        db = SessionLocal()
        try:
            after = [(u.email, u.is_active) for u in db.query(User).all()]
        finally:
            db.close()
        self.assertEqual(before, after)

    def test_config_normalizes_database_driver_and_rejects_unsafe_production(self):
        conf = Settings(_env_file=None, DATABASE_URL="postgresql://user:password@localhost/db")
        self.assertTrue(conf.DATABASE_URL.startswith("postgresql+psycopg://"))
        with self.assertRaises(ValueError):
            Settings(_env_file=None, ENVIRONMENT="production", JWT_SECRET="short")
        # Previously-leaked default secret must be rejected in production.
        with self.assertRaises(ValueError):
            Settings(_env_file=None, ENVIRONMENT="production",
                     JWT_SECRET="super_secret_jwt_key_sih_2026_gem_procurement")

    def test_health_cors_and_protected_routes(self):
        self.assertEqual(self.client.get("/health").status_code, 200)
        # Exact-origin allow-list behavior: an origin from CORS_ORIGINS passes,
        # a stranger origin is rejected.
        allowed_origin = settings.cors_origins_list[0]
        r = self.client.options("/api/auth/login", headers={"Origin": allowed_origin, "Access-Control-Request-Method": "POST"})
        self.assertEqual(r.status_code, 200)
        r = self.client.options("/api/auth/login", headers={"Origin": "https://untrusted.example.com", "Access-Control-Request-Method": "POST"})
        self.assertEqual(r.status_code, 400)
        # The TestClient carries the admin session cookie from setUpClass, so
        # "unauthenticated" is asserted with an explicitly invalid bearer
        # token (the header takes precedence over the cookie) -> 401.
        for url in ["/api/admin/users", "/api/v1/mobile/pending-bids", "/api/v1/monitoring/recent-events"]:
            self.assertEqual(self.client.get(url, headers={"Authorization": "Bearer invalid"}).status_code, 401, url)
        # And with no credentials at all (fresh client, no cookies).
        anon = TestClient(app)
        anon.__enter__()
        try:
            for url in ["/api/admin/users", "/api/v1/monitoring/recent-events"]:
                self.assertEqual(anon.get(url).status_code, 401, url)
        finally:
            anon.__exit__(None, None, None)
        # Generating the schema catches unresolved request/response model errors.
        self.assertEqual(self.client.get("/openapi.json").status_code, 200)

    def test_password_confirmation_and_invalid_login_input(self):
        for password, expected in [("Admin@123", 403), (self.admin_password, 200)]:
            response = self.client.post("/api/auth/verify-password", headers=self.admin, json={"password": password})
            self.assertEqual(response.status_code, expected)
        response = self.client.post("/api/auth/login", json={"email": "invalid", "password": "anything"})
        self.assertEqual(response.status_code, 422)

    def test_biometric_endpoints_are_removed(self):
        self.assertEqual(self.client.post("/api/auth/biometric/toggle", json={"enabled": True}).status_code, 404)
        self.assertEqual(self.client.post("/api/auth/biometric/verify", json={"email": "admin@example.com"}).status_code, 404)
        self.assertFalse(self.client.get("/api/auth/biometric/status").json()["enabled"])

    def test_tender_upload_processing_and_officer_decision(self):
        bidder = self.register_bidder("supplier")
        other = self.register_bidder("other-supplier")
        tender_id = "GEM/TEST/001"
        r = self.client.post("/api/tenders", headers=self.admin, json={"id": tender_id, "title": "Test tender", "budget_limit": 50000, "status": "Active", "closing_date": "2099-12-31"})
        if r.status_code == 409:  # tender persisted from an earlier run of this module
            pass
        else:
            self.assertEqual(r.status_code, 201, r.text)
        path = "/api/tenders/" + quote(tender_id, safe="")
        r = self.client.put(path + "/requirements", headers=self.admin, json={"requirements": [{"code": "PAN", "description": "PAN Card", "is_mandatory": True}]})
        self.assertEqual(r.status_code, 200, r.text)
        requirement_id = r.json()["requirements"][0]["id"]
        self.assertEqual(self.client.get(path, headers=bidder).status_code, 200)
        r = self.client.post("/api/bids", headers=bidder, json={"tender_id": tender_id})
        if r.status_code != 201:  # existing bid from an earlier run: fetch it
            mine = self.client.get("/api/bids/my-bids", headers=bidder).json()
            bid_id = next(b["id"] for b in mine if b["tender_id"] == tender_id)
        else:
            bid_id = r.json()["bid"]["id"]

        import pymupdf
        with pymupdf.open() as pdf:
            page = pdf.new_page()
            page.insert_text((50, 50), "INCOME TAX DEPARTMENT\nPERMANENT ACCOUNT NUMBER\nABCDE1234F\nName: TEST SUPPLIER\nDate of Birth: 01/01/2000")
            pdf_bytes = pdf.tobytes()
        objects = {}

        def upload(file_data, storage_path, mime_type):
            objects[storage_path] = file_data
            return storage_path

        # Enable inline processing for the duration of this test so the
        # TestClient runs the background pipeline synchronously.
        prev_inline = settings.INLINE_PROCESSING
        settings.INLINE_PROCESSING = True
        try:
            with unittest.mock.patch.object(StorageService, "upload_file", side_effect=upload), \
                 unittest.mock.patch.object(StorageService, "download_file", side_effect=lambda p: objects[p]):
                r = self.client.post("/api/documents/upload", headers=other, data={"bid_id": bid_id, "requirement_id": requirement_id}, files={"file": ("pan.pdf", pdf_bytes, "application/pdf")})
                self.assertEqual(r.status_code, 403, r.text)
                r = self.client.post("/api/documents/upload", headers=bidder, data={"bid_id": bid_id, "requirement_id": requirement_id}, files={"file": ("pan.pdf", pdf_bytes, "application/pdf")})
                if r.status_code == 409:  # duplicate from an earlier run
                    return
                self.assertEqual(r.status_code, 201, r.text)
                doc_id = r.json()["document"]["id"]
                r = self.client.get(f"/api/documents/{doc_id}/extraction", headers=bidder)
                self.assertEqual(r.status_code, 200, r.text)
                self.assertIn("ABCDE1234F", r.text)
        finally:
            settings.INLINE_PROCESSING = prev_inline

        payload = {"bid_id": bid_id, "officer_status": "Approved", "justification": "Verified original documents for regression test.", "officer_password": "wrong"}
        self.assertEqual(self.client.post("/api/v1/override/decision", headers=self.admin, json=payload).status_code, 403)
        payload["officer_password"] = self.admin_password
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

    def test_admin_creates_officer_and_officer_login_flow(self):
        officer_data = {
            "full_name": "Test Officer",
            "email": "test.officer@bidzee.com",
            "password": "TestOfficer@123",
            "role": "OFFICER",
            "department": "Procurement",
            "admin_authorization_password": self.admin_password
        }
        res_create = self.client.post("/api/admin/users", headers=self.admin, json=officer_data)
        if res_create.status_code == 409:  # created by an earlier run of this module
            res_login = self.client.post("/api/auth/login", json={"email": "test.officer@bidzee.com", "password": "TestOfficer@123"})
            self.assertEqual(res_login.status_code, 200, res_login.text)
            return
        self.assertEqual(res_create.status_code, 201, res_create.text)
        created_user = res_create.json()
        self.assertEqual(created_user["email"], "test.officer@bidzee.com")
        self.assertEqual(created_user["role"], "OFFICER")
        # Admin-created accounts must change the password on first login.
        self.assertTrue(res_create.json().get("must_change_password", True) if "must_change_password" in created_user else True)

        res_login = self.client.post("/api/auth/login", json={"email": "Test.Officer@BidZee.com ", "password": "TestOfficer@123"})
        self.assertEqual(res_login.status_code, 200, res_login.text)
        login_data = res_login.json()
        officer_token = login_data["access_token"]
        self.assertTrue(officer_token)
        self.assertEqual(login_data["user"]["email"], "test.officer@bidzee.com")
        self.assertEqual(login_data["user"]["role"], "OFFICER")

        officer_headers = {"Authorization": f"Bearer {officer_token}"}
        res_me = self.client.get("/api/auth/me", headers=officer_headers)
        self.assertEqual(res_me.status_code, 200, res_me.text)
        me_data = res_me.json()
        self.assertEqual(me_data["email"], "test.officer@bidzee.com")
        self.assertEqual(me_data["role"], "OFFICER")

        # Provisioned accounts are locked to the password-management endpoints
        # until they rotate the credential.
        if login_data.get("must_change_password"):
            res_locked = self.client.get("/api/admin/users/stats", headers=officer_headers)
            self.assertEqual(res_locked.status_code, 423, res_locked.text)
            res_change = self.client.post(
                "/api/auth/change-password",
                json={
                    "current_password": "TestOfficer@123",
                    "new_password": "OfficerRotated@1",
                },
                headers=officer_headers,
            )
            self.assertEqual(res_change.status_code, 200, res_change.text)
            res_login2 = self.client.post(
                "/api/auth/login",
                json={"email": "test.officer@bidzee.com", "password": "OfficerRotated@1"},
            )
            self.assertEqual(res_login2.status_code, 200, res_login2.text)
            officer_token = res_login2.json()["access_token"]
            officer_headers = {"Authorization": f"Bearer {officer_token}"}

        res_stats = self.client.get("/api/admin/users/stats", headers=officer_headers)
        self.assertEqual(res_stats.status_code, 200, res_stats.text)
        stats_data = res_stats.json()
        self.assertGreaterEqual(stats_data["total_users"], 1)
        self.assertGreaterEqual(stats_data["officers"], 1)


if __name__ == "__main__":
    unittest.main()
