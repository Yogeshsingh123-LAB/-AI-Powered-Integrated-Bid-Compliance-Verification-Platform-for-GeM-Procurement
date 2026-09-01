import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.bid import Bid
from app.models.user import User
from app.models.officer_annotation import OfficerAnnotation
from app.services.auth_service import get_current_active_user, create_audit_record
from app.services.explainable_ai_engine import ExplainableAIEngine
from app.scoring.compliance_scorer import ComplianceScorer

router = APIRouter(prefix="/v1/override", tags=["Explainable AI & Officer Override Engine"])

class OfficerDecisionRequest(BaseModel):
    bid_id: str = Field(..., json_schema_extra={"example": "123e4567-e89b-12d3-a456-426614174000"})
    officer_status: str = Field(..., json_schema_extra={"example": "Approved with Deviation"}) # "Approved", "Rejected", "Approved with Deviation"
    deviation_category: Optional[str] = Field(default="Minor Administrative", json_schema_extra={"example": "Minor Administrative"})
    justification: str = Field(..., min_length=10, json_schema_extra={"example": "Approved under GFR Rule 173 due to minor formatting variation."})

class AnnotationRequest(BaseModel):
    bid_id: str
    target_component: str = Field(..., json_schema_extra={"example": "GSTIN"})
    comment_text: str = Field(..., min_length=2, json_schema_extra={"example": "Verified manual tax payment receipt attached."})
    is_internal: bool = Field(default=True)

@router.get("/explainable/{bid_id}", response_model=Dict[str, Any])
def get_explainable_report(bid_id: str, db: Session = Depends(get_db)):
    """Fetches Explainable AI (XAI) evidence snippets and score component explanations for a bid."""
    try:
        bid_uuid = uuid.UUID(bid_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid bid_id UUID format: '{bid_id}'"
        )

    bid = db.query(Bid).filter(Bid.id == bid_uuid).first()
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bid '{bid_id}' not found."
        )

    # Compute compliance score report
    mock_verification = {
        "gstin": [{"verified": True, "data": {"status": "Active", "legal_name": "Apex Infra Solution Ltd"}}],
        "pan": [{"verified": True, "data": {"status": "Active", "name": "Apex Infra Solution Ltd"}}]
    }
    report = ComplianceScorer.calculate_compliance_score(verification_results=mock_verification)
    
    xai_report = ExplainableAIEngine.generate_explainable_report(
        bid_id=str(bid.id),
        compliance_report=report
    )

    # Attach current officer override status & annotations
    annotations = db.query(OfficerAnnotation).filter(OfficerAnnotation.bid_id == bid_uuid).order_by(OfficerAnnotation.created_at.desc()).all()
    
    xai_report["officer_review"] = {
        "officer_status": bid.officer_status or "Pending",
        "deviation_category": bid.deviation_category,
        "deviation_justification": bid.deviation_justification,
        "reviewed_at": bid.reviewed_at.isoformat() if bid.reviewed_at else None,
        "annotations": [
            {
                "id": str(a.id),
                "target_component": a.target_component,
                "comment_text": a.comment_text,
                "is_internal": a.is_internal,
                "created_at": a.created_at.isoformat()
            }
            for a in annotations
        ]
    }

    return xai_report

@router.post("/decision", response_model=Dict[str, Any])
def submit_officer_decision(
    payload: OfficerDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Submits Procurement Officer decision override ('Approved', 'Rejected', 'Approved with Deviation') with audit log."""
    if current_user.role not in {"ADMIN", "OFFICER"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Procurement Officers and Admins can submit bid override decisions."
        )

    try:
        bid_uuid = uuid.UUID(payload.bid_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid bid_id UUID format: '{payload.bid_id}'"
        )

    bid = db.query(Bid).filter(Bid.id == bid_uuid).first()
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bid '{payload.bid_id}' not found."
        )

    if getattr(bid, "is_locked", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision has already been finalized and locked for this bid. Submitting a second decision is blocked."
        )

    old_status = bid.officer_status or "Pending"
    new_status = payload.officer_status

    if new_status not in {"Approved", "Rejected", "Approved with Deviation"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid officer_status. Must be 'Approved', 'Rejected', or 'Approved with Deviation'."
        )

    # Update Bid Model & Lock Decision
    bid.officer_status = new_status
    bid.status = "Compliant" if "Approved" in new_status else "Non-Compliant"
    bid.deviation_category = payload.deviation_category if "Deviation" in new_status else None
    bid.deviation_justification = payload.justification
    bid.officer_id = current_user.id
    bid.reviewed_at = datetime.now(timezone.utc)
    bid.is_locked = True  # Decision locked permanently

    # Record Cryptographic Blockchain-Hashed Audit Log
    create_audit_record(
        db=db,
        action=f"OFFICER_OVERRIDE_{new_status.upper().replace(' ', '_')}",
        user_id=str(current_user.id),
        entity_type="Bid",
        entity_id=str(bid.id),
        bid_id=str(bid.id),
        old_value=old_status,
        new_value=f"Status: {new_status} | Category: {payload.deviation_category} | Rationale: {payload.justification}"
    )

    db.commit()
    db.refresh(bid)

    return {
        "success": True,
        "message": f"Officer decision '{new_status}' submitted successfully for Bid '{bid.id}'.",
        "bid_id": str(bid.id),
        "officer_status": bid.officer_status,
        "deviation_category": bid.deviation_category,
        "deviation_justification": bid.deviation_justification,
        "reviewed_at": bid.reviewed_at.isoformat()
    }

@router.post("/annotations", response_model=Dict[str, Any])
def add_officer_annotation(
    payload: AnnotationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Adds a targeted officer comment or annotation to a specific compliance score component."""
    try:
        bid_uuid = uuid.UUID(payload.bid_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid bid_id UUID format: '{payload.bid_id}'"
        )

    bid = db.query(Bid).filter(Bid.id == bid_uuid).first()
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bid '{payload.bid_id}' not found."
        )

    annotation = OfficerAnnotation(
        bid_id=bid_uuid,
        officer_id=current_user.id,
        target_component=payload.target_component,
        comment_text=payload.comment_text,
        is_internal=payload.is_internal
    )
    db.add(annotation)
    db.commit()
    db.refresh(annotation)

    return {
        "success": True,
        "message": "Officer annotation saved successfully.",
        "annotation_id": str(annotation.id),
        "target_component": annotation.target_component,
        "comment_text": annotation.comment_text,
        "created_at": annotation.created_at.isoformat()
    }
