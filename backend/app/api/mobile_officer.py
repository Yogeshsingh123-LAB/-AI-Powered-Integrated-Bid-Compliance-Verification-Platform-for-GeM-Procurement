import uuid
from typing import Dict, List, Any, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field

from app.services.push_notification_service import push_notification_service

router = APIRouter(prefix="/v1/mobile", tags=["Mobile Procurement Officer App"])

class PushSubscribeRequest(BaseModel):
    user_id: str = Field(default="officer-dem0-01", json_schema_extra={"example": "officer-demo-01"})
    subscription_token: Dict[str, Any] = Field(..., json_schema_extra={"example": {"endpoint": "https://fcm.googleapis.com/fcm/send/...", "keys": {"p256dh": "...", "auth": "..."}}})

class QuickActionRequest(BaseModel):
    bid_id: str = Field(..., json_schema_extra={"example": "123e4567-e89b-12d3-a456-426614174000"})
    action: str = Field(..., json_schema_extra={"example": "APPROVE"}) # "APPROVE", "REJECT", "DEVIATION"
    notes: Optional[str] = Field(default=None, json_schema_extra={"example": "Approved via Mobile Quick Review under GFR 173."})

class TriggerPushRequest(BaseModel):
    bid_id: str = Field(default="BID-URGENT-99", json_schema_extra={"example": "BID-URGENT-99"})
    tender_title: str = Field(default="Procurement of High-Capacity Server Racks", json_schema_extra={"example": "Procurement of High-Capacity Server Racks"})
    bidder_name: str = Field(default="Apex Infra Solution Ltd", json_schema_extra={"example": "Apex Infra Solution Ltd"})

@router.get("/vapid-public-key", response_model=Dict[str, str])
def get_vapid_public_key():
    """Returns Web Push VAPID Public Key for mobile Service Worker registration."""
    return {"vapid_public_key": push_notification_service.VAPID_PUBLIC_KEY}

@router.post("/subscribe-push", response_model=Dict[str, Any])
def subscribe_push_notifications(payload: PushSubscribeRequest):
    """Registers mobile device Web Push subscription token."""
    return push_notification_service.register_subscription(
        user_id=payload.user_id,
        subscription_token=payload.subscription_token
    )

@router.get("/pending-bids", response_model=Dict[str, Any])
def get_mobile_pending_bids():
    """Retrieves mobile-optimized pending bid review cards for 1-tap officer approval."""
    pending_cards = [
        {
            "bid_id": "123e4567-e89b-12d3-a456-426614174000",
            "tender_id": "TENDER-2026-88",
            "tender_title": "Procurement of High-Capacity Server Racks",
            "bidder_name": "Apex Infra Solution Ltd",
            "compliance_score": 92,
            "status": "PENDING_OFFICER_REVIEW",
            "urgency": "HIGH",
            "submitted_at": "10 minutes ago",
            "oem_verified": True,
            "gstin_verified": True,
            "key_highlights": ["OEM Authorization valid", "Turnover > ₹5 Cr", "Clean Blacklist Record"]
        },
        {
            "bid_id": "223e4567-e89b-12d3-a456-426614174001",
            "tender_id": "TENDER-2026-89",
            "tender_title": "Annual Maintenance for Data Center HVAC",
            "bidder_name": "CyberTech Global Pvt Ltd",
            "compliance_score": 45,
            "status": "PENDING_OFFICER_REVIEW",
            "urgency": "CRITICAL",
            "submitted_at": "25 minutes ago",
            "oem_verified": False,
            "gstin_verified": True,
            "key_highlights": ["⚠️ Compliance Score Below 50", "EMD Exemption Claimed", "PDF Tampering Warning"]
        }
    ]

    return {
        "total_pending": len(pending_cards),
        "cards": pending_cards
    }

@router.post("/quick-action", response_model=Dict[str, Any])
def process_mobile_quick_action(payload: QuickActionRequest):
    """Processes 1-tap mobile officer quick decision (Approve, Reject, Approve with Deviation)."""
    action_upper = payload.action.upper()

    if action_upper not in ["APPROVE", "REJECT", "DEVIATION"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid mobile action '{payload.action}'. Must be 'APPROVE', 'REJECT', or 'DEVIATION'."
        )

    status_mapping = {
        "APPROVE": "APPROVED_BY_OFFICER",
        "REJECT": "REJECTED_BY_OFFICER",
        "DEVIATION": "APPROVED_WITH_DEVIATION"
    }

    return {
        "bid_id": payload.bid_id,
        "action_taken": action_upper,
        "new_status": status_mapping[action_upper],
        "notes": payload.notes or "Processed via Mobile Officer App",
        "timestamp": "2026-08-31T19:25:00Z",
        "status": "SUCCESS"
    }

@router.post("/send-test-push", response_model=Dict[str, Any])
def trigger_urgent_push_alert(payload: TriggerPushRequest):
    """Dispatches a test urgent lockscreen push notification to mobile devices."""
    return push_notification_service.dispatch_urgent_bid_alert(
        bid_id=payload.bid_id,
        tender_title=payload.tender_title,
        bidder_name=payload.bidder_name
    )
