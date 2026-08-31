"""
Unit tests for Real-Time Bid Monitoring, WebSocket Manager, and Alert System
"""

# pyrefly: ignore [missing-import]
import pytest
from app.services.websocket_manager import ws_manager
from app.services.alert_service import AlertService

@pytest.mark.anyio
async def test_alert_service_threshold_evaluation():
    """Verifies that non-compliant scores and blacklisting generate appropriate alert payloads."""
    score_report = {
        "score": 45,
        "risk_level": "HIGH",
        "breakdown": {"document_completeness": "20/30"},
        "deductions": ["Vendor is blacklisted (-30 pts)", "GSTIN status is 'Suspended' (-10 pts)"]
    }

    forgery_report = {
        "authentic": False,
        "document_name": "Tampered_Tax_Doc.pdf",
        "anomalies": ["Font mismatch on page 1"]
    }

    event = await AlertService.process_and_broadcast_bid_event(
        tender_id="TENDER-TEST-99",
        bid_id="BID-TEST-99",
        bidder_name="NonCompliant Corp",
        score_report=score_report,
        forgery_report=forgery_report
    )

    assert event["is_non_compliant"] is True
    assert event["alert_count"] >= 3
    
    alert_titles = [a["title"] for a in event["alerts"]]
    assert "Non-Compliant Bid Submission" in alert_titles
    assert "Blacklisted Vendor Submission" in alert_titles
    assert "AI PDF Forgery & Tampering Alert" in alert_titles

def test_websocket_manager_recent_events_log():
    """Verifies that events are stored in recent events buffer."""
    ws_manager.recent_events_log.clear()
    event_mock = {"event_type": "BID_EVALUATION_COMPLETED", "bid_id": "BID-1"}
    
    # Manually append to log
    ws_manager.recent_events_log.append(event_mock)
    events = ws_manager.get_recent_events(limit=5)
    assert len(events) == 1
    assert events[0]["bid_id"] == "BID-1"
