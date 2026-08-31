# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from app.main import app
from app.core.gem_auth import get_gem_token
from app.services.gem_client import GeMClient

client = TestClient(app)


def test_get_gem_token():
    token = get_gem_token()
    assert isinstance(token, str)
    assert len(token) > 0


def test_gem_client_methods():
    gem_client = GeMClient()
    assert gem_client.token is not None
    assert "Authorization" in gem_client.headers

    # Fetch Tender
    tender = gem_client.fetch_tender("GEM-2026-TND-8801")
    assert tender["tender_id"] == "GEM-2026-TND-8801"
    assert "title" in tender
    assert isinstance(tender["requirements"], list)

    # Submit Report
    report = {"overall_score": 92.5, "status": "COMPLIANT"}
    sub_res = gem_client.submit_compliance_report("GEM-2026-TND-8801", report)
    assert sub_res["status"] == "ACCEPTED"
    assert sub_res["tender_id"] == "GEM-2026-TND-8801"

    # Fetch Bids
    bids = gem_client.fetch_tender_bids("GEM-2026-TND-8801")
    assert bids["tender_id"] == "GEM-2026-TND-8801"
    assert "total_bids" in bids


def test_sync_tender_endpoint():
    response = client.post("/api/v1/sync-tender/GEM-2026-TND-9901")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "synced"
    assert data["tender_id"] == "GEM-2026-TND-9901"
    assert "data" in data
    assert data["data"]["tender_id"] == "GEM-2026-TND-9901"


def test_sync_tender_get_endpoint():
    response = client.get("/api/v1/sync-tender/GEM-2026-TND-9901")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "synced"


def test_sync_submit_report_endpoint():
    payload = {
        "report": {
            "overall_score": 95.0,
            "cartel_risk": "LOW",
            "statutory_compliance": "VERIFIED"
        }
    }
    response = client.post("/api/v1/sync/submit-report/GEM-2026-TND-9901", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "submitted"
    assert data["result"]["status"] == "ACCEPTED"


def test_sync_bids_endpoint():
    response = client.get("/api/v1/sync/bids/GEM-2026-TND-9901")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "bids_data" in data
