"""
Unit tests for Mobile Procurement Officer App API & Push Notification Service
"""

# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from app.main import app
from app.services.push_notification_service import push_notification_service

client = TestClient(app)

def test_get_vapid_public_key():
    """Verifies VAPID public key retrieval for mobile push notifications."""
    response = client.get("/api/v1/mobile/vapid-public-key")
    assert response.status_code == 200
    data = response.json()
    assert "vapid_public_key" in data
    assert data["vapid_public_key"] == push_notification_service.VAPID_PUBLIC_KEY

def test_subscribe_mobile_push():
    """Verifies mobile Web Push subscription registration."""
    payload = {
        "user_id": "officer-test-99",
        "subscription_token": {
            "endpoint": "https://fcm.googleapis.com/fcm/send/test_endpoint_token",
            "keys": {"p256dh": "test_p256", "auth": "test_auth"}
        }
    }
    response = client.post("/api/v1/mobile/subscribe-push", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "officer-test-99"
    assert "subscription_id" in data

def test_get_mobile_pending_bids():
    """Verifies retrieval of mobile-optimized pending bid review cards."""
    response = client.get("/api/v1/mobile/pending-bids")
    assert response.status_code == 200
    data = response.json()
    assert "total_pending" in data
    assert len(data["cards"]) > 0
    card = data["cards"][0]
    assert "bid_id" in card
    assert "compliance_score" in card

def test_mobile_quick_action_approve():
    """Verifies 1-tap mobile officer quick approval action."""
    payload = {
        "bid_id": "123e4567-e89b-12d3-a456-426614174000",
        "action": "APPROVE",
        "notes": "Approved on Mobile Device"
    }
    response = client.post("/api/v1/mobile/quick-action", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["action_taken"] == "APPROVE"
    assert data["new_status"] == "APPROVED_BY_OFFICER"

def test_trigger_urgent_push_alert():
    """Verifies urgent mobile push alert dispatching."""
    payload = {
        "bid_id": "BID-URGENT-101",
        "tender_title": "Procurement of High-Capacity Medical Ventilators",
        "bidder_name": "MedTech Infra Solutions Ltd"
    }
    response = client.post("/api/v1/mobile/send-test-push", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "DELIVERED_TO_MOBILE_PUSH_QUEUE"
    assert "URGENT BID" in data["payload"]["title"]
