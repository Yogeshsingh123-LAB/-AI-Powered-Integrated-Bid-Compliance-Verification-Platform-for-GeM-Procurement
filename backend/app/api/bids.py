import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Request, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from sqlalchemy import func

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

@router.get("", response_model=List[Dict[str, Any]])
@router.get("/all", response_model=List[Dict[str, Any]])
def list_all_bids(
    current_user: User = Depends(require_role("OFFICER", "ADMIN")),
    db: Session = Depends(get_db)
):
    """Retrieve all bids across all tenders for Officer / Admin portals."""
    bids = db.query(Bid).order_by(Bid.submitted_at.desc()).all()

    results = []
    for b in bids:
        bidder = db.query(User).filter(User.id == b.bidder_id).first()
        tender = db.query(Tender).filter(Tender.id == b.tender_id).first()
        score_val = float(b.compliance_score) if b.compliance_score is not None else 0.0
        risk_level = "LOW" if score_val >= 80 else ("MEDIUM" if score_val >= 50 else "HIGH")

        doc_count = db.query(Document).filter(Document.bid_id == b.id, Document.document_status != "REPLACED").count()

        results.append({
            "id": str(b.id),
            "tender_id": b.tender_id,
            "tender_title": tender.title if tender else "Procurement Bid",
            "bidder_id": str(b.bidder_id),
            "bidderName": bidder.full_name if bidder else "Registered Bidder",
            "bidderEmail": bidder.email if bidder else "",
            "submittedOn": b.submitted_at.strftime("%d %b %Y, %H:%M") if b.submitted_at else "N/A",
            "score": score_val,
            "compliance": score_val,
            "risk": risk_level,
            "status": b.officer_status if b.officer_status and b.officer_status != "Pending" else b.status,
            "officer_status": b.officer_status or "Pending",
            "is_locked": b.is_locked,
            "documents_count": doc_count,
            "documents": f"{doc_count} Documents"
        })

    return results

@router.get("/tender/{tender_id:path}", response_model=List[Dict[str, Any]])
def list_bids_for_tender(
    tender_id: str,
    current_user: User = Depends(require_role("OFFICER", "ADMIN")),
    db: Session = Depends(get_db)
):
    """Retrieve all bidders who applied to a specific tender (Officer / Admin access)."""
    # Look up by exact tender_id or title
    tender = db.query(Tender).filter((Tender.id == tender_id) | (Tender.title == tender_id)).first()
    target_tender_id = tender.id if tender else tender_id

    bids = db.query(Bid).filter(Bid.tender_id == target_tender_id).order_by(Bid.submitted_at.desc()).all()

    results = []
    for b in bids:
        bidder = db.query(User).filter(User.id == b.bidder_id).first()
        score_val = float(b.compliance_score) if b.compliance_score is not None else 0.0
        off_status = (b.officer_status or "Pending").upper()
        if off_status == "PENDING":
            risk_level = "HIGH"
        elif score_val >= 80:
            risk_level = "LOW"
        elif score_val >= 50:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"

        doc_count = db.query(Document).filter(Document.bid_id == b.id, Document.document_status != "REPLACED").count()

        results.append({
            "id": str(b.id),
            "bid_id": str(b.id),
            "tender_id": b.tender_id,
            "bidder_id": str(b.bidder_id),
            "bidderName": bidder.full_name if bidder else "Registered Bidder",
            "bidderEmail": bidder.email if bidder else "",
            "submittedOn": b.submitted_at.strftime("%d %b %Y, %H:%M") if b.submitted_at else "N/A",
            "score": score_val,
            "compliance": score_val,
            "risk": risk_level,
            "status": b.officer_status if b.officer_status and b.officer_status != "Pending" else b.status,
            "officer_status": b.officer_status or "Pending",
            "is_locked": b.is_locked,
            "documents_count": doc_count,
            "documents": f"{doc_count} Documents"
        })

    return results

@router.get("/stats", response_model=Dict[str, Any])
def get_officer_bid_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve real database KPI statistics for Officer/Admin dashboard:
    - active_tenders: Total count of active/published tenders
    - total_bids: Total count of bids submitted for active tenders
    - pending_verification: Total count of bids requiring officer review
    - high_risk: Total count of bids with HIGH risk tiering
    - completed: Total count of bids where officer review is completed/qualified/disqualified
    """
    if current_user.role.upper() not in ["OFFICER", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Officers and Admins can view platform bid statistics."
        )

    active_tenders = db.query(Tender).filter(
        func.upper(Tender.status).in_(["ACTIVE", "PUBLISHED", "DRAFT"])
    ).all()
    active_tender_ids = [t.id for t in active_tenders]
    active_tenders_count = len(active_tenders) if active_tenders else db.query(Tender).count()

    all_bids = db.query(Bid).all()
    valid_bids = [b for b in all_bids if not active_tender_ids or b.tender_id in active_tender_ids]

    total_bids = len(valid_bids)
    pending_verification = 0
    high_risk = 0
    completed = 0

    for b in valid_bids:
        st = (b.officer_status or b.status or "Pending").upper()
        if st in ["QUALIFIED", "DISQUALIFIED", "COMPLETED", "VERIFIED", "APPROVED", "REJECTED"]:
            completed += 1
        else:
            pending_verification += 1

        score_val = float(b.compliance_score) if b.compliance_score is not None else 0.0
        risk_level = "LOW" if score_val >= 80 else ("MEDIUM" if score_val >= 50 else "HIGH")
        if risk_level == "HIGH":
            high_risk += 1

    return {
        "active_tenders": active_tenders_count,
        "total_bids": total_bids,
        "pending_verification": pending_verification,
        "high_risk": high_risk,
        "completed": completed
    }

@router.get("/{bid_id}", response_model=Dict[str, Any])
def get_bid_details(
    bid_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve detailed verification status of a specific bid."""
    bid = None
    clean_id = str(bid_id).replace("-", "").lower()
    clean_target = clean_id.replace("/", "")
    all_bids = db.query(Bid).all()
    for b in all_bids:
        b_id_clean = str(b.id).replace("-", "").lower()
        b_bidder_clean = str(b.bidder_id).replace("-", "").lower() if b.bidder_id else ""
        b_tender_clean = str(b.tender_id).replace("-", "").replace("/", "").lower() if b.tender_id else ""
        
        b_email_clean = str(b.bidder.email).lower() if b.bidder and b.bidder.email else ""
        b_name_clean = str(b.bidder.full_name).lower() if b.bidder and b.bidder.full_name else ""
        
        if (b_id_clean == clean_id or 
            b_bidder_clean == clean_id or 
            b_tender_clean == clean_target or 
            b_email_clean == str(bid_id).lower() or 
            b_name_clean == str(bid_id).lower()):
            bid = b
            break

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

    # Determine risk level: if officer verification is pending, report HIGH or derived risk
    score_val = float(bid.compliance_score) if bid.compliance_score is not None else 0.0
    if (bid.officer_status or "Pending").upper() == "PENDING":
        risk_level = "HIGH"
    elif score_val >= 80:
        risk_level = "LOW"
    elif score_val >= 50:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    # Map requirement items to uploaded documents
    doc_map = {str(d.requirement_id): d for d in documents}

    compliance_matrix = []
    uploaded_cnt = 0
    verified_cnt = 0
    missing_cnt = 0

    for r in requirements:
        req_id_str = str(r.id)
        d_obj = doc_map.get(req_id_str)
        if not d_obj:
            # Fallback: check matching code if requirement_id UUID didn't match directly
            d_obj = next((doc for doc in documents if doc.document_type.upper() == r.code.upper()), None)

        if d_obj:
            uploaded_cnt += 1
            if d_obj.document_status.upper() in ["VERIFIED", "PROCESSED", "APPROVED"]:
                verified_cnt += 1
            status_text = d_obj.document_status
            compliance_matrix.append({
                "requirement_id": req_id_str,
                "code": r.code,
                "description": r.description,
                "is_mandatory": r.is_mandatory,
                "uploaded": True,
                "document_id": str(d_obj.id),
                "file_name": d_obj.original_filename,
                "status": status_text,
                "uploaded_at": d_obj.uploaded_at.isoformat() if d_obj.uploaded_at else None
            })
        else:
            missing_cnt += 1
            compliance_matrix.append({
                "requirement_id": req_id_str,
                "code": r.code,
                "description": r.description,
                "is_mandatory": r.is_mandatory,
                "uploaded": False,
                "document_id": None,
                "file_name": None,
                "status": "MISSING",
                "uploaded_at": None
            })

    # Fetch audit logs for this bid
    from app.models.audit_log import AuditLog
    audit_records = db.query(AuditLog).filter(
        (AuditLog.bid_id == bid.id) | (AuditLog.entity_id == str(bid.id))
    ).order_by(AuditLog.created_at.desc()).all()

    audit_trail = [
        {
            "id": str(a.id),
            "action": a.action,
            "user_id": str(a.user_id) if a.user_id else None,
            "timestamp": a.created_at.isoformat() if a.created_at else None,
            "details": a.new_value or a.old_value or f"Action: {a.action}"
        }
        for a in audit_records
    ]

    return {
        "id": str(bid.id),
        "tender_id": bid.tender_id,
        "tender_title": tender.title if tender else "Procurement Bid Submission",
        "tender_department": tender.department if tender else None,
        "tender_category": tender.category if tender else None,
        "bidder_id": str(bid.bidder_id),
        "bidder_name": bidder.full_name if bidder else "Registered Bidder",
        "bidder_email": bidder.email if bidder else None,
        "bidder_phone": bidder.phone if bidder else None,
        "bidder_status": bidder.status if bidder else "Active",
        "bidder_organization": (bidder.department or bidder.full_name) if bidder else None,
        "pan": None,
        "gstin": None,
        "udyam": None,
        "constitution": None,
        "incorporation_date": None,
        "address": None,
        "country": None,
        "bid_value": getattr(bid, "bid_value", None),
        "status": bid.status,
        "officer_status": bid.officer_status or "Pending",
        "is_locked": bid.is_locked,
        "deviation_category": bid.deviation_category,
        "deviation_justification": bid.deviation_justification,
        "reviewed_at": bid.reviewed_at.isoformat() if bid.reviewed_at else None,
        "compliance_score": score_val,
        "risk_level": risk_level,
        "submitted_at": bid.submitted_at.isoformat() if bid.submitted_at else None,
        "summary_counts": {
            "required": len(requirements),
            "uploaded": len(documents),
            "verified": verified_cnt,
            "missing": max(0, len(requirements) - len(documents)),
            "pending_verification": max(0, len(documents) - verified_cnt)
        },
        "compliance_matrix": compliance_matrix,
        "documents": [
            {
                "id": str(d.id),
                "requirement_id": str(d.requirement_id) if d.requirement_id else None,
                "document_type": d.document_type,
                "original_filename": d.original_filename,
                "file_size": d.file_size,
                "document_status": d.document_status,
                "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None
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
        ],
        "audit_trail": audit_trail
    }


@router.post("/{bid_id}/submit", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
def submit_bid_documents(
    bid_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit bid compliance package after verifying mandatory document completeness.
    """
    ip_address = request.client.host if request.client else None

    # 1. Enforce BIDDER role
    if current_user.role.upper() != "BIDDER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only bidders are authorized to submit bid documents."
        )

    # 2. Verify bid exists
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid not found."
        )

    # 3. Check ownership
    if bid.bidder_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to submit documents for another bidder's bid."
        )

    # 4. Fetch tender requirements
    requirements = db.query(Requirement).filter(Requirement.tender_id == bid.tender_id).all()
    documents = db.query(Document).filter(
        Document.bid_id == bid.id,
        Document.document_status != "REPLACED"
    ).all()

    uploaded_req_ids = {str(d.requirement_id) for d in documents}
    missing_mandatory = []

    for r in requirements:
        if r.is_mandatory and str(r.id) not in uploaded_req_ids:
            missing_mandatory.append(r.description or r.code)

    if len(missing_mandatory) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{len(missing_mandatory)} mandatory document(s) are still missing: {', '.join(missing_mandatory)}"
        )

    # 5. Update bid status
    bid.status = "DOCUMENTS_SUBMITTED"
    bid.submitted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(bid)

    # 6. Log audit
    create_audit_record(
        db=db,
        action="DOCUMENTS_SUBMITTED",
        user_id=current_user.id,
        entity_type="Bid",
        entity_id=bid.id,
        bid_id=bid.id,
        new_value=f"Submitted all compliance documents for bid {bid.id}",
        ip_address=ip_address
    )

    # 7. Create persistent DB notification
    try:
        from app.services.notification_service import create_notification
        tender = db.query(Tender).filter(Tender.id == bid.tender_id).first()
        tender_num = tender.id if tender else "CPCL/2026/003"
        create_notification(
            db=db,
            user_id=current_user.id,
            tender_id=bid.tender_id,
            bid_id=bid.id,
            type="BID_SUBMISSION_REQUIRED",
            title="Documents Submitted Successfully",
            message=f"All {len(requirements)} compliance documents for Tender {tender_num} have been submitted for official verification."
        )
    except Exception as notif_err:
        pass

    return {
        "success": True,
        "message": "Bid compliance documents submitted successfully for verification.",
        "bid": {
            "id": str(bid.id),
            "status": bid.status,
            "submitted_at": bid.submitted_at.isoformat()
        }
    }

