from datetime import datetime, timezone, timedelta
# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from app.main import app
from app.services.post_award import (
    track_crac,
    simulate_pfms_payment,
    get_post_award_lifecycle
)

client = TestClient(app)


def test_track_crac_on_track():
    now = datetime.now(timezone.utc)
    delivery_date = now - timedelta(days=5)
    crac_upload_date = now - timedelta(days=3)

    res = track_crac(delivery_date, crac_upload_date, order_amount=500000.0)
    assert res["status"] == "on_track"
    assert res["is_overdue"] is False
    assert res["remaining_days"] >= 0


def test_track_crac_overdue_penal_interest():
    now = datetime.now(timezone.utc)
    delivery_date = now - timedelta(days=25)
    crac_upload_date = now - timedelta(days=20)  # 20 days ago (10 days past deadline!)

    res = track_crac(delivery_date, crac_upload_date, order_amount=1000000.0)
    assert res["status"] == "overdue"
    assert res["is_overdue"] is True
    assert res["overdue_days"] >= 10
    assert res["penal_interest_amount"] > 0
    assert "RBI rate" in res["penalty"]


def test_simulate_pfms_payment():
    res = simulate_pfms_payment(
        bid_id="GEM-BID-9988",
        amount=750000.0,
        vendor_gstin="27AAACA12341Z5"
    )
    assert res["status"] == "payment_initiated"
    assert res["pfms_status"] == "SUCCESS_CREDITED"
    assert "PFMS-2026-TXN" in res["transaction_id"]
    assert "UTR" in res["utr_number"]
    assert res["disbursed_amount"] == 750000.0


def test_get_post_award_lifecycle():
    res = get_post_award_lifecycle(bid_id="GEM-BID-100", order_amount=1200000.0)
    assert res["status"] == "success"
    assert len(res["lifecycle_timeline"]) == 4
    assert res["lifecycle_timeline"][0]["name"] == "AWARD_ISSUED"
    assert res["lifecycle_timeline"][3]["name"] == "PFMS_DISBURSED"


def test_api_track_crac_endpoint():
    payload = {
        "delivery_date": "2026-08-01T10:00:00Z",
        "crac_upload_date": "2026-08-03T14:00:00Z",
        "order_amount": 2000000.0
    }
    response = client.post("/api/post-award/track-crac", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "crac_tracking" in data


def test_api_simulate_pfms_endpoint():
    payload = {
        "bid_id": "GEM-BID-456",
        "amount": 500000.0,
        "vendor_gstin": "07AAAAA0000A1Z5"
    }
    response = client.post("/api/post-award/simulate-pfms", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["pfms_payment"]["pfms_status"] == "SUCCESS_CREDITED"


def test_api_get_post_award_status_endpoint():
    response = client.get("/api/post-award/status/GEM-BID-789?amount=1500000.0")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["bid_id"] == "GEM-BID-789"
