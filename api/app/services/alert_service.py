import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from app.services.websocket_manager import ws_manager

logger = logging.getLogger(__name__)

class AlertService:
    """
    Evaluates compliance scores and generates real-time alert objects for non-compliant submissions,
    statutory blacklisting, PDF forgery tampering, and cartel risk.
    """

    @classmethod
    async def process_and_broadcast_bid_event(
        cls,
        tender_id: str,
        bid_id: str,
        bidder_name: str,
        score_report: Dict[str, Any],
        forgery_report: Optional[Dict[str, Any]] = None,
        cartel_report: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Processes an incoming bid evaluation, checks alert criteria, and broadcasts real-time WebSocket events.
        """
        score = score_report.get("score", 100)
        risk_level = score_report.get("risk_level", "LOW")
        deductions = score_report.get("deductions", [])

        alerts: List[Dict[str, Any]] = []

        # 1. Non-Compliant Score Threshold Alert
        if score < 50:
            alerts.append({
                "alert_id": f"ALT-{hash(bid_id) & 0xFFFF}",
                "severity": "CRITICAL",
                "title": "Non-Compliant Bid Submission",
                "message": f"Bidder '{bidder_name}' achieved a compliance score of only {score}/100.",
                "action_required": "Immediate Rejection / Procurement Officer Review Required"
            })
        elif score < 70:
            alerts.append({
                "alert_id": f"ALT-{hash(bid_id) & 0xFFFF}",
                "severity": "HIGH",
                "title": "Compliance Threshold Warning",
                "message": f"Bidder '{bidder_name}' scored {score}/100 with active deductions.",
                "action_required": "Request Clarification / Audit Statutory Proof"
            })

        # 2. Blacklisting Alert
        if any("blacklisted" in d.lower() for d in deductions):
            alerts.append({
                "alert_id": f"ALT-BLK-{hash(bid_id) & 0xFFFF}",
                "severity": "CRITICAL",
                "title": "Blacklisted Vendor Submission",
                "message": f"CRITICAL: Vendor '{bidder_name}' is blacklisted in government registries.",
                "action_required": "Reject Bid Immediately & Disqualify Entity"
            })

        # 3. PDF Forgery & Tampering Alert
        if forgery_report and not forgery_report.get("authentic", True):
            anomalies = forgery_report.get("anomalies", [])
            alerts.append({
                "alert_id": f"ALT-FORG-{hash(bid_id) & 0xFFFF}",
                "severity": "CRITICAL",
                "title": "AI PDF Forgery & Tampering Alert",
                "message": f"Tampering detected in '{forgery_report.get('document_name', 'PDF')}': {', '.join(anomalies)}.",
                "action_required": "Escalate to Fraud Investigation Committee"
            })

        # 4. Cartel Ring Alert
        if cartel_report and cartel_report.get("is_cartel_suspected"):
            alerts.append({
                "alert_id": f"ALT-CARTEL-{hash(bid_id) & 0xFFFF}",
                "severity": "HIGH",
                "title": "Cartel Ring & Collusion Alert",
                "message": f"Bidder '{bidder_name}' linked to suspicious bidding pattern / shared entity cluster.",
                "action_required": "Review Cartel Relationship Graph Dashboard"
            })

        # Construct Master Real-Time Event Payload
        event_payload = {
            "event_type": "BID_EVALUATION_COMPLETED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tender_id": tender_id,
            "bid_id": bid_id,
            "bidder_name": bidder_name,
            "compliance_score": score,
            "risk_level": risk_level,
            "alerts": alerts,
            "alert_count": len(alerts),
            "is_non_compliant": score < 70 or len(alerts) > 0,
            "score_breakdown": score_report.get("breakdown", {})
        }

        # Broadcast via WebSockets to connected live monitoring clients
        await ws_manager.broadcast_event(event_payload, tender_id=tender_id)

        return event_payload
