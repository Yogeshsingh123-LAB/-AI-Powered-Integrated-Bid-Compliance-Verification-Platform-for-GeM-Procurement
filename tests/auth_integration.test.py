import sys
import os
import unittest
import uuid

# Ensure backend directory is in Python path for app imports
backend_path = os.path.abspath('backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from app.main import app as fastapi_app
from app.db.database import initialize_database, Base, engine

class TestAuthIntegration(unittest.TestCase):
    test_token = None

    @classmethod
    def setUpClass(cls):
        initialize_database()
        import app.models
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(fastapi_app)
        cls.unique_suffix = str(uuid.uuid4())[:8]
        cls.test_email = f"bidder_{cls.unique_suffix}@techsolutions.com"
        cls.test_password = "SecurePassword123!"
        cls.test_name = f"Tech Solutions {cls.unique_suffix}"

    def test_01_register_new_bidder(self):
        """Test bidder registration endpoint (POST /api/auth/register)."""
        payload = {
            "full_name": self.test_name,
            "email": self.test_email,
            "password": self.test_password,
            "role": "BIDDER"
        }
        res = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res.status_code, 201, f"Registration failed: {res.text}")
        data = res.json()
        self.assertEqual(data["email"], self.test_email)
        self.assertEqual(data["role"], "BIDDER")

    def test_02_register_duplicate_email(self):
        """Test registering duplicate email returns 400 Bad Request with JSON error."""
        payload = {
            "full_name": self.test_name,
            "email": self.test_email,
            "password": self.test_password,
            "role": "BIDDER"
        }
        res = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res.status_code, 400)
        data = res.json()
        self.assertIn("detail", data)
        self.assertTrue("already exists" in data["detail"].lower())

    def test_03_login_valid_credentials(self):
        """Test login with correct password returns 200 with access token."""
        payload = {
            "email": self.test_email,
            "password": self.test_password
        }
        res = self.client.post("/api/auth/login", json=payload)
        self.assertEqual(res.status_code, 200, f"Login failed: {res.text}")
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")
        self.assertEqual(data["user"]["email"], self.test_email)
        TestAuthIntegration.test_token = data["access_token"]

    def test_04_login_wrong_password(self):
        """Test login with incorrect password returns 401 Unauthorized with JSON error."""
        payload = {
            "email": self.test_email,
            "password": "WrongPassword999!"
        }
        res = self.client.post("/api/auth/login", json=payload)
        self.assertEqual(res.status_code, 401)
        data = res.json()
        self.assertIn("detail", data)
        self.assertIn("Incorrect email or password", data["detail"])

    def test_05_login_nonexistent_user(self):
        """Test login with non-existent email returns 401 Unauthorized with JSON error."""
        payload = {
            "email": f"nonexistent_{str(uuid.uuid4())[:6]}@domain.com",
            "password": "Password123!"
        }
        res = self.client.post("/api/auth/login", json=payload)
        self.assertEqual(res.status_code, 401)
        data = res.json()
        self.assertIn("detail", data)

    def test_06_protected_get_me(self):
        """Test accessing GET /api/auth/me with JWT token."""
        self.assertIsNotNone(TestAuthIntegration.test_token, "Token from test_03 should be present")
        headers = {"Authorization": f"Bearer {TestAuthIntegration.test_token}"}
        res = self.client.get("/api/auth/me", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["email"], self.test_email)

    def test_07_bidder_role_access_control(self):
        """Test bidder trying to access officer audit logs returns 403 Forbidden with JSON error."""
        self.assertIsNotNone(TestAuthIntegration.test_token, "Token should be present")
        headers = {"Authorization": f"Bearer {TestAuthIntegration.test_token}"}
        res = self.client.get("/api/audit/logs", headers=headers)
        self.assertEqual(res.status_code, 403)
        data = res.json()
        self.assertIn("detail", data)

    def test_08_logout(self):
        """Test logout endpoint POST /api/auth/logout."""
        self.assertIsNotNone(TestAuthIntegration.test_token, "Token should be present")
        headers = {"Authorization": f"Bearer {TestAuthIntegration.test_token}"}
        res = self.client.post("/api/auth/logout", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))

if __name__ == "__main__":
    unittest.main()
