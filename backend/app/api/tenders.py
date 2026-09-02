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
from app.models.requirement import Requirement
from app.models.bid import Bid
from app.schemas.tender import TenderCreate, TenderUpdate, TenderResponse
from app.services.auth_service import get_current_user, require_role, create_audit_record

router = APIRouter(prefix="/tenders", tags=["Tender Management"])

def compute_tender_date_info(t: Tender, db: Optional[Session] = None) -> tuple:
    """
    Computes (publishedDate_str, closingDate_str, daysLeft_str, effective_status)
    dynamically based on t.published_at, t.closing_date, and t.status.
    If closing_date is in the past for an Active tender, auto-closes the tender in DB if db session is provided.
    """
    now = datetime.now(timezone.utc)

    pub_date_str = t.published_at.strftime("%d %b %Y") if t.published_at else (t.created_at.strftime("%d %b %Y") if t.created_at else "01 Sep 2026")

    if t.closing_date:
        closing_date_str = t.closing_date.strftime("%d %b %Y")
        c_dt = t.closing_date
        if c_dt.tzinfo is None:
            c_dt = c_dt.replace(tzinfo=timezone.utc)

        diff = c_dt - now
        days_remaining = diff.days
        seconds_remaining = diff.total_seconds()

        if t.status.lower() in ["cancelled", "draft"]:
            effective_status = t.status.capitalize()
            days_left_str = effective_status
        elif seconds_remaining <= 0:
            effective_status = "Closed"
            days_left_str = "Closed"
            # Auto-update database status if active
            if t.status.lower() == "active" and db:
                t.status = "Closed"
                db.commit()
        else:
            effective_status = t.status.capitalize()
            if days_remaining == 0:
                hours_remaining = max(1, int(seconds_remaining // 3600))
                days_left_str = f"{hours_remaining} hours left" if hours_remaining > 1 else "1 hour left"
            elif days_remaining == 1:
                days_left_str = "1 day left"
            else:
                days_left_str = f"{days_remaining} days left"
    else:
        closing_date_str = "30 Sep 2026"
        effective_status = t.status.capitalize()
        days_left_str = "30 days left" if effective_status == "Active" else effective_status

    return pub_date_str, closing_date_str, days_left_str, effective_status

@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_tender(
    req: TenderCreate,
    request: Request,
    current_user: User = Depends(require_role("OFFICER", "ADMIN")),
    db: Session = Depends(get_db)
):
    """
    Create a new tender (Procurement Officer / Admin only).
    Can be saved as 'Draft' or 'Active'.
    Automatically attaches mandatory compliance requirements (GST, PAN, Udyam, OEM, MII).
    """
    ip_address = request.client.host if request.client else None

    # Generate tender ID if not specified
    tender_id = req.id
    if not tender_id:
        existing_count = db.query(Tender).count()
        tender_id = f"GEM/CPCL/2026/{(existing_count + 1):03d}"

    # Check ID conflict
    existing = db.query(Tender).filter(Tender.id == tender_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Tender with ID '{tender_id}' already exists."
        )

    initial_status = req.status or "Draft"
    published_at = datetime.now(timezone.utc) if initial_status.upper() in {"ACTIVE", "PUBLISHED"} else None

    closing_date_dt = None
    if req.closing_date:
        try:
            if "T" in req.closing_date or "Z" in req.closing_date:
                closing_date_dt = datetime.fromisoformat(req.closing_date.replace("Z", "+00:00"))
            else:
                closing_date_dt = datetime.strptime(req.closing_date, "%Y-%m-%d")
        except Exception:
            pass

    # Date Validation: Closing date cannot be in the past for Active / Published tenders
    now = datetime.now(timezone.utc)
    if closing_date_dt:
        c_check = closing_date_dt if closing_date_dt.tzinfo else closing_date_dt.replace(tzinfo=timezone.utc)
        if initial_status.upper() in {"ACTIVE", "PUBLISHED"} and c_check < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Closing date must be later than the publication/start date."
            )

    new_tender = Tender(
        id=tender_id,
        title=req.title,
        description=req.description,
        category=req.category or "General Procurement",
        department=req.department or "Chennai Petroleum Corporation Limited (CPCL)",
        tender_type=req.tender_type or "Custom Bid",
        budget_limit=req.budget_limit,
        status=initial_status,
        eligibility_requirements=req.eligibility_requirements or "GST Registration, PAN Card, Udyam MSME Certificate, OEM Authorization Certificate, Make in India Declaration",
        created_by=current_user.id,
        published_at=published_at,
        closing_date=closing_date_dt
    )
    db.add(new_tender)
    db.commit()
    db.refresh(new_tender)

    # Attach officer-selected compliance requirements ONLY
    reqs_to_add = req.selected_requirements or req.requirements or []
    if reqs_to_add:
        for r_item in reqs_to_add:
            code = (r_item.get("code") or r_item.get("requirement_code") or "GENERAL").upper()
            desc = r_item.get("description") or r_item.get("desc") or r_item.get("name") or r_item.get("title") or code
            is_mand = r_item.get("is_mandatory", True) if "is_mandatory" in r_item else r_item.get("mandatory", True)

            req_obj = Requirement(
                id=uuid.uuid4(),
                tender_id=new_tender.id,
                code=code,
                description=desc,
                is_mandatory=is_mand
            )
            db.add(req_obj)
        db.commit()

    create_audit_record(
        db=db,
        action="TENDER_CREATED",
        user_id=current_user.id,
        entity_type="Tender",
        entity_id=None,
        new_value=f"Tender ID: {new_tender.id}, Status: {new_tender.status}, Title: {new_tender.title}",
        ip_address=ip_address
    )

    return {
        "success": True,
        "message": f"Tender '{new_tender.id}' created successfully as '{new_tender.status}'.",
        "tender": {
            "id": new_tender.id,
            "title": new_tender.title,
            "status": new_tender.status,
            "category": new_tender.category,
            "department": new_tender.department,
            "budget_limit": float(new_tender.budget_limit),
            "requirements": [
                {
                    "id": r.id,
                    "code": r.code,
                    "description": r.description,
                    "is_mandatory": r.is_mandatory
                }
                for r in new_tender.requirements
            ]
        }
    }

@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
def list_tenders(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List tenders in system:
    - BIDDER role: ONLY sees Published/Active tenders. Draft tenders are strictly hidden.
    - OFFICER/ADMIN role: Sees all tenders (Draft, Active, Closed, Cancelled).
    """
    # pyrefly: ignore [missing-import]
    from sqlalchemy import func

    query = db.query(Tender)

    is_bidder = current_user.role.upper() == "BIDDER"

    if is_bidder:
        # Strict security rule: Bidders only see Active or Published tenders (case-insensitive)
        query = query.filter(func.lower(Tender.status).in_(["active", "published"]))
    elif status_filter and status_filter.upper() != "ALL":
        query = query.filter(Tender.status.ilike(status_filter))

    tenders = query.order_by(Tender.created_at.desc()).all()

    results = []
    for t in tenders:
        # Count bids and pending verification count dynamically
        bids_count = db.query(Bid).filter(Bid.tender_id == t.id).count()
        pending_count = db.query(Bid).filter(
            Bid.tender_id == t.id,
            func.lower(Bid.officer_status) == "pending"
        ).count()

        pub_date_str, closing_date_str, days_left_str, effective_status = compute_tender_date_info(t, db)

        reqs = db.query(Requirement).filter(Requirement.tender_id == t.id).all()
        reqs_list = [
            {
                "id": str(r.id),
                "code": r.code,
                "description": r.description,
                "is_mandatory": r.is_mandatory
            }
            for r in reqs
        ]

        results.append({
            "id": t.id,
            "title": t.title,
            "description": t.description or "",
            "category": t.category or "Industrial Equipment & Heavy Machinery",
            "department": t.department or "Chennai Petroleum Corporation Limited (CPCL)",
            "tender_type": t.tender_type or "Custom Bid",
            "value": f"₹{float(t.budget_limit):,.2f}" if t.budget_limit else "₹50,00,000",
            "budget_limit": float(t.budget_limit) if t.budget_limit else 5000000.0,
            "status": effective_status,
            "eligibility_requirements": t.eligibility_requirements or "GST, PAN, Udyam, OEM",
            "published_at": t.published_at.isoformat() if t.published_at else None,
            "publishedDate": pub_date_str,
            "closingDate": closing_date_str,
            "deadline": closing_date_str,
            "daysLeft": days_left_str,
            "bids_count": bids_count,
            "bidders": bids_count,
            "pending": pending_count,
            "requirements": reqs_list
        })

    return results

@router.get("/{tender_id:path}", response_model=Dict[str, Any])
def get_tender_details(
    tender_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get full details of a specific tender and its statutory requirements."""
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tender '{tender_id}' not found."
        )

    # BIDDER check: cannot view Draft tender
    if current_user.role.upper() == "BIDDER" and tender.status.upper() == "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Draft tenders are not accessible to bidders."
        )

    reqs = db.query(Requirement).filter(Requirement.tender_id == tender.id).all()
    pub_date_str, closing_date_str, days_left_str, effective_status = compute_tender_date_info(tender, db)

    return {
        "id": tender.id,
        "title": tender.title,
        "description": tender.description,
        "category": tender.category,
        "department": tender.department,
        "tender_type": tender.tender_type,
        "budget_limit": float(tender.budget_limit),
        "status": effective_status,
        "publishedDate": pub_date_str,
        "closingDate": closing_date_str,
        "daysLeft": days_left_str,
        "eligibility_requirements": tender.eligibility_requirements,
        "published_at": tender.published_at.isoformat() if tender.published_at else None,
        "requirements": [
            {
                "id": str(r.id),
                "code": r.code,
                "description": r.description,
                "is_mandatory": r.is_mandatory
            }
            for r in reqs
        ]
    }

@router.post("/{tender_id:path}/publish", response_model=Dict[str, Any])
def publish_tender(
    tender_id: str,
    request: Request,
    current_user: User = Depends(require_role("OFFICER", "ADMIN")),
    db: Session = Depends(get_db)
):
    """Publish a draft tender so it becomes active and visible to eligible bidders."""
    ip_address = request.client.host if request.client else None

    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tender '{tender_id}' not found."
        )

    old_status = tender.status
    tender.status = "Active"
    tender.published_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(tender)

    create_audit_record(
        db=db,
        action="TENDER_PUBLISHED",
        user_id=current_user.id,
        entity_type="Tender",
        entity_id=None,
        old_value=old_status,
        new_value=f"Status: Active, Published At: {tender.published_at}",
        ip_address=ip_address
    )

    return {
        "success": True,
        "message": f"Tender '{tender.id}' is now PUBLISHED and live on the Bidder Portal.",
        "tender": {
            "id": tender.id,
            "status": tender.status,
            "published_at": tender.published_at.isoformat()
        }
    }

@router.patch("/{tender_id:path}/status", response_model=Dict[str, Any])
def update_tender_status(
    tender_id: str,
    payload: Dict[str, Any],
    request: Request,
    current_user: User = Depends(require_role("OFFICER", "ADMIN")),
    db: Session = Depends(get_db)
):
    """Update tender status (Active, Closed, Cancelled, Draft)."""
    ip_address = request.client.host if request.client else None
    new_status = payload.get("status")

    if not new_status or new_status not in {"Active", "Closed", "Cancelled", "Draft"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be 'Active', 'Closed', 'Cancelled', or 'Draft'."
        )

    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tender '{tender_id}' not found."
        )

    old_status = tender.status
    tender.status = new_status
    if new_status == "Active" and not tender.published_at:
        tender.published_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(tender)

    create_audit_record(
        db=db,
        action=f"TENDER_STATUS_{new_status.upper()}",
        user_id=current_user.id,
        entity_type="Tender",
        entity_id=None,
        old_value=old_status,
        new_value=new_status,
        ip_address=ip_address
    )

    return {
        "success": True,
        "message": f"Tender '{tender.id}' status updated to '{new_status}'.",
        "tender_id": tender.id,
        "status": tender.status
    }

@router.put("/{tender_id:path}", response_model=Dict[str, Any])
def edit_tender(
    tender_id: str,
    payload: Dict[str, Any],
    request: Request,
    current_user: User = Depends(require_role("OFFICER", "ADMIN")),
    db: Session = Depends(get_db)
):
    """Edit tender parameters (title, description, category, department, budget_limit, closing_date, status)."""
    ip_address = request.client.host if request.client else None

    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tender '{tender_id}' not found."
        )

    old_info = f"Title: {tender.title}, Budget: {tender.budget_limit}, Status: {tender.status}"

    if "title" in payload and payload["title"]:
        tender.title = payload["title"]
    if "description" in payload and payload["description"] is not None:
        tender.description = payload["description"]
    if "category" in payload and payload["category"]:
        tender.category = payload["category"]
    if "department" in payload and payload["department"]:
        tender.department = payload["department"]
    if "budget_limit" in payload and payload["budget_limit"] is not None:
        try:
            tender.budget_limit = float(payload["budget_limit"])
        except Exception:
            pass
    if "status" in payload and payload["status"]:
        tender.status = payload["status"]
    if "closing_date" in payload and payload["closing_date"]:
        try:
            c_date = payload["closing_date"]
            if "T" in c_date or "Z" in c_date:
                tender.closing_date = datetime.fromisoformat(c_date.replace("Z", "+00:00"))
            else:
                tender.closing_date = datetime.strptime(c_date, "%Y-%m-%d")
        except Exception:
            pass

    db.commit()
    db.refresh(tender)

    new_info = f"Title: {tender.title}, Budget: {tender.budget_limit}, Status: {tender.status}"

    create_audit_record(
        db=db,
        action="TENDER_UPDATED",
        user_id=current_user.id,
        entity_type="Tender",
        entity_id=tender_id,
        old_value=old_info,
        new_value=new_info,
        ip_address=ip_address
    )

    return {
        "success": True,
        "message": f"Tender '{tender.id}' updated successfully.",
        "tender": {
            "id": tender.id,
            "title": tender.title,
            "status": tender.status,
            "category": tender.category,
            "department": tender.department,
            "budget_limit": float(tender.budget_limit) if tender.budget_limit else 0.0
        }
    }

@router.delete("/{tender_id:path}", response_model=Dict[str, Any])
def delete_tender(
    tender_id: str,
    request: Request,
    current_user: User = Depends(require_role("OFFICER", "ADMIN")),
    db: Session = Depends(get_db)
):
    """
    Delete or cancel a tender.
    - If 0 bids: Permanently delete tender and its statutory requirements.
    - If > 0 bids: DO NOT delete. Change status to 'Cancelled' to preserve audit trails & bidder activity.
    """
    ip_address = request.client.host if request.client else None

    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tender '{tender_id}' not found."
        )

    bids_count = db.query(Bid).filter(Bid.tender_id == tender_id).count()

    if bids_count == 0:
        # CASE A: Safe to permanently delete
        old_title = tender.title
        db.delete(tender)
        db.commit()

        create_audit_record(
            db=db,
            action="TENDER_DELETED",
            user_id=current_user.id,
            entity_type="Tender",
            entity_id=tender_id,
            old_value=f"Title: {old_title}",
            new_value="Permanently Deleted (0 bids)",
            ip_address=ip_address
        )

        return {
            "success": True,
            "action": "DELETED",
            "message": f"Tender '{tender_id}' deleted successfully.",
            "bids_count": 0
        }
    else:
        # CASE B: Contains bidder activity -> Cancel instead of permanent delete
        old_status = tender.status
        tender.status = "Cancelled"
        db.commit()
        db.refresh(tender)

        create_audit_record(
            db=db,
            action="TENDER_CANCELLED",
            user_id=current_user.id,
            entity_type="Tender",
            entity_id=tender_id,
            old_value=old_status,
            new_value=f"Cancelled due to deletion request with {bids_count} bids preserved.",
            ip_address=ip_address
        )

        return {
            "success": True,
            "action": "CANCELLED",
            "message": f"Tender '{tender_id}' contains bidder activity ({bids_count} bids) and cannot be permanently deleted. It has been CANCELLED instead to preserve audit records.",
            "bids_count": bids_count,
            "status": "Cancelled"
        }


@router.put("/{tender_id:path}/requirements", response_model=Dict[str, Any])
def update_tender_requirements(
    tender_id: str,
    payload: Dict[str, Any],
    request: Request,
    current_user: User = Depends(require_role("OFFICER", "ADMIN")),
    db: Session = Depends(get_db)
):
    """Update officer-selected requirements for a specific tender."""
    ip_address = request.client.host if request.client else None

    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tender '{tender_id}' not found."
        )

    bids_count = db.query(Bid).filter(Bid.tender_id == tender_id).count()
    selected_reqs = payload.get("requirements") or payload.get("selected_requirements") or []

    # Remove existing requirement records for this tender
    db.query(Requirement).filter(Requirement.tender_id == tender_id).delete()
    db.commit()

    added = []
    for r_item in selected_reqs:
        code = (r_item.get("code") or r_item.get("requirement_code") or "GENERAL").upper()
        desc = r_item.get("description") or r_item.get("desc") or r_item.get("name") or r_item.get("title") or code
        is_mand = r_item.get("is_mandatory", True) if "is_mandatory" in r_item else r_item.get("mandatory", True)

        req_obj = Requirement(
            id=uuid.uuid4(),
            tender_id=tender.id,
            code=code,
            description=desc,
            is_mandatory=is_mand
        )
        db.add(req_obj)
        added.append({"id": str(req_obj.id), "code": code, "description": desc, "is_mandatory": is_mand})

    db.commit()

    create_audit_record(
        db=db,
        action="TENDER_REQUIREMENTS_UPDATED",
        user_id=current_user.id,
        entity_type="Tender",
        entity_id=tender_id,
        new_value=f"Updated requirements count: {len(added)}. Bids count: {bids_count}",
        ip_address=ip_address
    )

    return {
        "success": True,
        "message": f"Updated requirements for tender '{tender_id}'.",
        "tender_id": tender.id,
        "requirements_count": len(added),
        "requirements": added
    }


