import sys
import os
import unittest
import uuid

backend_path = os.path.abspath('backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from app.main import app as fastapi_app
from app.db.database import initialize_database, Base, engine

class TestAllProductionAPIs(unittest.TestCase):
    officer_token = None
    bidder_token = None

    @classmethod
    def setUpClass(cls):
        initialize_database()
        import app.models
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(fastapi_app)
        cls.suffix = str(uuid.uuid4())[:8]
        cls.officer_email = f"officer_{cls.suffix}@gem.gov.in"
        cls.bidder_email = f"bidder_{cls.suffix}@corp.com"
        cls.password = "ProductionPass123!"

    def test_01_health_check(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

    def test_02_auth_flow(self):
        # Register Bidder (Public registration allows BIDDER)
        res_bid = self.client.post("/api/auth/register", json={
            "full_name": "Corp Bidder",
            "email": self.bidder_email,
            "password": self.password,
            "role": "BIDDER"
        })
        self.assertEqual(res_bid.status_code, 201, f"Bidder registration failed: {res_bid.text}")

        # Register non-BIDDER (Should return 403)
        res_off_pub = self.client.post("/api/auth/register", json={
            "full_name": "Procurement Officer",
            "email": self.officer_email,
            "password": self.password,
            "role": "OFFICER"
        })
        self.assertEqual(res_off_pub.status_code, 403)

        # Login Bidder
        res_bid_login = self.client.post("/api/auth/login", json={
            "email": self.bidder_email,
            "password": self.password
        })
        self.assertEqual(res_bid_login.status_code, 200)
        TestAllProductionAPIs.bidder_token = res_bid_login.json()["access_token"]

    def test_03_bid_stats(self):
        res = self.client.get("/api/bids/stats")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))

    def test_04_tenders_and_bids(self):
        bid_headers = {"Authorization": f"Bearer {TestAllProductionAPIs.bidder_token}"}

        # Get Tenders
        res_tenders = self.client.get("/api/tenders", headers=bid_headers)
        self.assertEqual(res_tenders.status_code, 200)

        # Get My Bids
        res_my_bids = self.client.get("/api/bids/my-bids", headers=bid_headers)
        self.assertEqual(res_my_bids.status_code, 200)

    def test_05_notifications(self):
        bid_headers = {"Authorization": f"Bearer {TestAllProductionAPIs.bidder_token}"}
        res_notif = self.client.get("/api/notifications", headers=bid_headers)
        self.assertEqual(res_notif.status_code, 200)

if __name__ == "__main__":
    unittest.main()
