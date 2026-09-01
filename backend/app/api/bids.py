import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Request, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.tender import Tender
from app.models.bid import Bid
from app.models.document import Document
from app.models.requirement import Requirement
from app.schemas.bid import BidCreate, BidResponse
from app.services.auth_service import get_current_user, require_role, create_audit_record

router = APIRouter(prefix="/bids", tags=["Bid Applications & Management"])

@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def apply_bid(
    req: BidCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Apply for an active tender (BIDDER only).
    Creates real Bid record in PostgreSQL database.
    Prevents duplicate applications to the same tender.
    """
    ip_address = request.client.host if request.client else None

    # 1. Enforce BIDDER role
    if current_user.role.upper() != "BIDDER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only registered bidders are authorized to submit bids."
        )

    # 2. Verify tender exists and is active/published
    tender = db.query(Tender).filter(Tender.id == req.tender_id).first()
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tender '{req.tender_id}' not found."
        )

    if tender.status.upper() not in {"ACTIVE", "PUBLISHED"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot apply to tender '{tender.id}' because its status is '{tender.status}'."
        )

    # 3. Check for existing bid duplicate
    existing_bid = db.query(Bid).filter(
        Bid.tender_id == req.tender_id,
        Bid.bidder_id == current_user.id
    ).first()

    if existing_bid:
        return {
            "success": True,
            "message": "Bid application already exists for this tender.",
            "bid": {
                "id": str(existing_bid.id),
                "tender_id": existing_bid.tender_id,
                "bidder_id": str(existing_bid.bidder_id),
                "status": existing_bid.status,
                "compliance_score": float(existing_bid.compliance_score) if existing_bid.compliance_score is not None else 0.0,
                "submitted_at": existing_bid.submitted_at.isoformat()
            }
        }

    # 4. Create new Bid record
    new_bid = Bid(
        id=uuid.uuid4(),
        tender_id=req.tender_id,
        bidder_id=current_user.id,
        status="Pending",
        compliance_score=0.0,
        is_locked=False,
        submitted_at=datetime.now(timezone.utc)
    )
    db.add(new_bid)
    db.commit()
    db.refresh(new_bid)

    # 5. Create audit record
    create_audit_record(
        db=db,
        action="BID_SUBMITTED",
        user_id=current_user.id,
        entity_type="Bid",
        entity_id=new_bid.id,
        bid_id=new_bid.id,
        new_value=f"Submitted bid for tender '{req.tender_id}' by bidder '{current_user.email}'",
        ip_address=ip_address
    )

    return {
        "success": True,
        "message": "Application Submitted successfully.",
        "bid": {
            "id": str(new_bid.id),
            "tender_id": new_bid.tender_id,
            "bidder_id": str(new_bid.bidder_id),
            "status": new_bid.status,
            "compliance_score": float(new_bid.compliance_score) if new_bid.compliance_score is not None else 0.0,
            "submitted_at": new_bid.submitted_at.isoformat()
        }
    }

@router.get("/my-bids", response_model=List[Dict[str, Any]])
def get_my_bids(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all submitted bids belonging to the logged-in bidder."""
    if current_user.role.upper() != "BIDDER":
        # If officer or admin views my-bids, return empty or all
        return []

    bids = db.query(Bid).filter(Bid.bidder_id == current_user.id).order_by(Bid.submitted_at.desc()).all()

    results = []
    for b in bids:
        tender = db.query(Tender).filter(Tender.id == b.tender_id).first()
        doc_count = db.query(Document).filter(Document.bid_id == b.id, Document.document_status != "REPLACED").count()
        score_val = float(b.compliance_score) if b.compliance_score is not None else 0.0

        # Calculate risk derived from actual score
        risk_level = "LOW" if score_val >= 80 else ("MEDIUM" if score_val >= 50 else "HIGH")

        results.append({
            "id": str(b.id),
            "tender_id": b.tender_id,
            "tender_title": tender.title if tender else "Procurement Bid Submission",
            "bidderName": current_user.full_name,
            "submittedOn": b.submitted_at.strftime("%d %b %Y, %H:%M"),
            "score": score_val,
            "risk": risk_level,
            "status": b.officer_status if b.officer_status and b.officer_status != "Pending" else b.status,
            "is_locked": b.is_locked,
            "documents_count": doc_count
        })

    return results

@router.get("/tender/{tender_id}", response_model=List[Dict[str, Any]])
def list_bids_for_tender(
    tender_id: str,
    current_user: User = Depends(require_role("OFFICER", "ADMIN")),
    db: Session = Depends(get_db)
):
    """Retrieve all bidders who applied to a specific tender (Officer / Admin access)."""
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tender '{tender_id}' not found."
        )

    bids = db.query(Bid).filter(Bid.tender_id == tender_id).order_by(Bid.submitted_at.desc()).all()

    results = []
    for b in bids:
        bidder = db.query(User).filter(User.id == b.bidder_id).first()
        score_val = float(b.compliance_score) if b.compliance_score is not None else 0.0
        risk_level = "LOW" if score_val >= 80 else ("MEDIUM" if score_val >= 50 else "HIGH")

        doc_count = db.query(Document).filter(Document.bid_id == b.id, Document.document_status != "REPLACED").count()

        results.append({
            "id": str(b.id),
            "tender_id": b.tender_id,
            "bidder_id": str(b.bidder_id),
            "bidderName": bidder.full_name if bidder else "Registered Bidder",
            "bidderEmail": bidder.email if bidder else "",
            "submittedOn": b.submitted_at.strftime("%d %b %Y, %H:%M"),
            "score": score_val,
            "risk": risk_level,
            "status": b.officer_status if b.officer_status and b.officer_status != "Pending" else b.status,
            "officer_status": b.officer_status or "Pending",
            "is_locked": b.is_locked,
            "documents_count": doc_count
        })

    return results

@router.get("/{bid_id}", response_model=Dict[str, Any])
def get_bid_details(
    bid_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve detailed verification status of a specific bid."""
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bid '{bid_id}' not found."
        )

    # BIDDER role check: cannot view another bidder's bid
    if current_user.role.upper() == "BIDDER" and bid.bidder_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view another bidder's submission."
        )

    bidder = db.query(User).filter(User.id == bid.bidder_id).first()
    tender = db.query(Tender).filter(Tender.id == bid.tender_id).first()
    documents = db.query(Document).filter(Document.bid_id == bid.id, Document.document_status != "REPLACED").all()
    requirements = db.query(Requirement).filter(Requirement.tender_id == bid.tender_id).all()

    score_val = float(bid.compliance_score) if bid.compliance_score is not None else 0.0
    risk_level = "LOW" if score_val >= 80 else ("MEDIUM" if score_val >= 50 else "HIGH")

    return {
        "id": str(bid.id),
        "tender_id": bid.tender_id,
        "tender_title": tender.title if tender else "Procurement Bid Submission",
        "bidder_id": str(bid.bidder_id),
        "bidder_name": bidder.full_name if bidder else "Registered Bidder",
        "bidder_email": bidder.email if bidder else "",
        "status": bid.status,
        "officer_status": bid.officer_status or "Pending",
        "is_locked": bid.is_locked,
        "deviation_category": bid.deviation_category,
        "deviation_justification": bid.deviation_justification,
        "reviewed_at": bid.reviewed_at.isoformat() if bid.reviewed_at else None,
        "compliance_score": score_val,
        "risk_level": risk_level,
        "submitted_at": bid.submitted_at.isoformat(),
        "documents": [
            {
                "id": str(d.id),
                "requirement_id": str(d.requirement_id),
                "document_type": d.document_type,
                "original_filename": d.original_filename,
                "file_size": d.file_size,
                "document_status": d.document_status,
                "uploaded_at": d.uploaded_at.isoformat()
            }
            for d in documents
        ],
        "requirements": [
            {
                "id": str(r.id),
                "code": r.code,
                "description": r.description,
                "is_mandatory": r.is_mandatory
            }
            for r in requirements
        ]
    }
