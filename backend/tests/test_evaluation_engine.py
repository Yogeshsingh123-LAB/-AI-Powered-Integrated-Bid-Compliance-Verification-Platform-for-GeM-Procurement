# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from app.main import app
from app.services.evaluation_engine import (
    calculate_l1,
    detect_ra_collusion,
    evaluate_tender_bids
)

client = TestClient(app)


def test_calculate_l1_ranking():
    sample_bids = [
        {
            "bidder_id": "b1",
            "bidder_name": "Vendor A",
            "total_price": 5000000.0,
            "technical_score": 85.0
        },
        {
            "bidder_id": "b2",
            "bidder_name": "Vendor B (L1)",
            "total_price": 4200000.0,
            "technical_score": 92.0
        },
        {
            "bidder_id": "b3",
            "bidder_name": "Vendor C",
            "total_price": 4800000.0,
            "technical_score": 78.0
        },
        {
            "bidder_id": "b4",
            "bidder_name": "Disqualified Vendor",
            "total_price": 3800000.0,
            "technical_score": 62.0  # < 70% threshold
        }
    ]

    res = calculate_l1(sample_bids)
    assert res["total_bids"] == 4
    assert res["compliant_bids_count"] == 3
    assert res["disqualified_bids_count"] == 1
    assert res["l1_bidder"]["bidder_id"] == "b2"
    assert res["l1_price"] == 4200000.0
    assert res["ranked_bids"][0]["rank"] == "L1"
    assert res["ranked_bids"][1]["rank"] == "L2"
    assert res["ranked_bids"][2]["rank"] == "L3"


def test_detect_ra_collusion_shared_ip():
    sample_bids = [
        {"bidder_id": "b1", "bidder_name": "Alpha Corp", "ip_address": "203.0.113.50"},
        {"bidder_id": "b2", "bidder_name": "Beta Services", "ip_address": "203.0.113.50"}  # Shared IP!
    ]
    res = detect_ra_collusion(sample_bids)
    assert res["collusion_detected"] is True
    assert res["risk_level"] == "HIGH"
    assert "203.0.113.50" in res["duplicate_ips"]


def test_detect_ra_collusion_synchronized_timestamps():
    sample_bids = [
        {"bidder_id": "b1", "bidder_name": "Alpha Corp", "bid_timestamp": "2026-08-31T10:00:00.100Z"},
        {"bidder_id": "b2", "bidder_name": "Beta Services", "bid_timestamp": "2026-08-31T10:00:00.800Z"}  # 0.7s interval!
    ]
    res = detect_ra_collusion(sample_bids)
    assert res["collusion_detected"] is True
    assert len(res["synchronized_bids"]) == 1


def test_evaluate_tender_bids_pipeline():
    sample_bids = [
        {"bidder_id": "b1", "bidder_name": "Vendor A", "total_price": 1000000.0, "technical_score": 80.0, "ip_address": "10.0.0.1"},
        {"bidder_id": "b2", "bidder_name": "Vendor B", "total_price": 950000.0, "technical_score": 88.0, "ip_address": "10.0.0.2"}
    ]
    res = evaluate_tender_bids(sample_bids, tender_value=1200000.0)
    assert res["status"] == "success"
    assert res["l1_evaluation"]["l1_bidder"]["bidder_id"] == "b2"
    assert res["reverse_auction_collusion"]["status"] == "clean"


def test_api_evaluate_endpoint():
    payload = {
        "tender_value": 2500000.0,
        "bids": [
            {"bidder_id": "b1", "bidder_name": "Supplier X", "total_price": 2200000.0, "technical_score": 82.0},
            {"bidder_id": "b2", "bidder_name": "Supplier Y", "total_price": 2100000.0, "technical_score": 89.0}
        ]
    }
    response = client.post("/api/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["l1_evaluation"]["l1_bidder"]["bidder_id"] == "b2"
