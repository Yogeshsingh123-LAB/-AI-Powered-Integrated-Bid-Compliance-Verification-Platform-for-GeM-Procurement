import uuid
import asyncio
from typing import Dict, List, Any, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field

from app.services.auth_service import get_current_user, require_role
from app.db.database import SessionLocal
from app.core.config import settings
from app.scoring.risk_classifier import risk_level_for_score
from app.services.websocket_manager import ws_manager
from app.services.alert_service import AlertService
from app.scoring.compliance_scorer import ComplianceScorer

router = APIRouter(prefix="/v1/monitoring", tags=["Real-Time Bid Monitoring & WebSockets"])

class SimulateBidRequest(BaseModel):
    tender_id: str = Field(default="TENDER-DEMO-01", json_schema_extra={"example": "TENDER-DEMO-01"})
    bidder_name: str = Field(default="Apex Infra Solution Ltd", json_schema_extra={"example": "Apex Infra Solution Ltd"})
    score: int = Field(default=45, json_schema_extra={"example": 45}) # Set low score to demonstrate non-compliant alert
    include_forgery_alert: bool = Field(default=False)
    include_cartel_alert: bool = Field(default=False)

OFFICER_ROLES = {"ADMIN", "OFFICER", "PROCUREMENT_OFFICER", "VERIFICATION_OFFICER", "AUDITOR"}


def _is_officer_role(role: Optional[str]) -> bool:
    if not role:
        return False
    norm = role.upper().replace(" ", "_")
    return norm in OFFICER_ROLES or role.upper() in OFFICER_ROLES


async def authenticate_socket(websocket: WebSocket) -> bool:
    """WebSocket handshake authentication.

    - Origin (when present) must be on the exact CORS allow-list.
    - A valid, non-expired JWT must be delivered within 10 seconds.
    - Only officer/admin/auditor roles (read from the database, never from the
      token claim) may subscribe.
    """
    origin = websocket.headers.get("origin")
    if origin and origin not in settings.cors_origins_list:
        await websocket.close(code=1008)
        return False
    await websocket.accept()
    try:
        message = await asyncio.wait_for(websocket.receive_json(), timeout=10)
        token = message.get("token")
        if not isinstance(token, str) or not token:
            raise ValueError("Missing token")
        from app.db.database import SessionLocal
        from app.services.auth_service import get_user_by_token
        with SessionLocal() as db:
            user = get_user_by_token(db, token)
            if getattr(user, "must_change_password", False):
                raise ValueError("Password change required")
            if not _is_officer_role(user.role):
                raise ValueError("Officer access required")
        await websocket.send_json({"type": "authenticated"})
        return True
    except (HTTPException, ValueError, AttributeError, asyncio.TimeoutError, WebSocketDisconnect):
        try:
            await websocket.close(code=1008)
        except Exception:
            pass
        return False


@router.websocket("/live")
async def websocket_global_live_monitoring(websocket: WebSocket):
    if not await authenticate_socket(websocket):
        return
    await ws_manager.connect_global(websocket, accepted=True)
    try:
        while True:
            if await websocket.receive_text() == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect_global(websocket)


@router.websocket("/tender/{tender_id:path}")
async def websocket_tender_live_monitoring(websocket: WebSocket, tender_id: str):
    if not await authenticate_socket(websocket):
        return
    await ws_manager.connect_tender(tender_id, websocket, accepted=True)
    try:
        while True:
            if await websocket.receive_text() == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect_tender(tender_id, websocket)

@router.get("/recent-events", response_model=Dict[str, Any], dependencies=[Depends(require_role("OFFICER", "ADMIN", "AUDITOR"))])
def get_recent_monitoring_events(limit: int = 20):
    """Returns recently logged bid evaluation events for live dashboard fallback/polling."""
    events = ws_manager.get_recent_events(limit=limit)
    return {
        "total_events": len(events),
        "events": events
    }

@router.post("/simulate-bid", response_model=Dict[str, Any], dependencies=[Depends(require_role("OFFICER", "ADMIN"))])
async def simulate_live_bid_evaluation(payload: SimulateBidRequest):
    """API trigger to simulate an incoming live bid evaluation for real-time WebSocket broadcast and alert testing."""
    mock_report = {
        "score": payload.score,
        "risk_level": risk_level_for_score(payload.score),
        "breakdown": {
            "document_completeness": "20/30",
            "database_verification": "15/40",
            "registry_integrity": "10/30"
        },
        "deductions": [
            "GSTIN status is 'Suspended' (-10 pts)",
            "Missing mandatory Udyam registration certificate (-10 pts)"
        ] if payload.score < settings.RISK_MEDIUM_MIN else []
    }

    mock_forgery = {
        "authentic": not payload.include_forgery_alert,
        "document_name": "GST_Certificate_Scan.pdf",
        "anomalies": ["Font modification on Page 1 line 4"]
    } if payload.include_forgery_alert else None

    mock_cartel = {
        "is_cartel_suspected": payload.include_cartel_alert
    } if payload.include_cartel_alert else None

    event_payload = await AlertService.process_and_broadcast_bid_event(
        tender_id=payload.tender_id,
        bid_id=f"BID-SIM-{uuid.uuid4().hex[:8]}",
        bidder_name=payload.bidder_name,
        score_report=mock_report,
        forgery_report=mock_forgery,
        cartel_report=mock_cartel
    )

    return {
        "success": True,
        "message": "Simulated live bid evaluation broadcasted to WebSocket stream.",
        "broadcast_event": event_payload
    }
