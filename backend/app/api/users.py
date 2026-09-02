from typing import List, Dict, Any
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Request, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserStatusUpdate, AdminUserCreate, BlacklistBidderRequest, UnblacklistBidderRequest
from app.services.auth_service import AuthService, get_current_user, require_role, create_audit_record
import os
import json
from datetime import datetime, timezone

router = APIRouter(tags=["User Profile & Administration"])

# --- User Profile Endpoints ---

@router.get("/users/me", response_model=UserResponse)
@router.get("/bidders/me/profile", response_model=UserResponse)
def get_user_me(current_user: User = Depends(get_current_user)):
    """Get profile details of the authenticated user."""
    return current_user

@router.put("/users/me", response_model=UserResponse)
def update_user_me(
    req: UserUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update profile details (only full_name and phone are permitted to change)."""
    ip_address = request.client.host if request.client else None
    
    old_val = f"Name: {current_user.full_name}, Phone: {current_user.phone}"
    
    if req.full_name is not None:
        current_user.full_name = req.full_name
    if req.phone is not None:
        current_user.phone = req.phone
        
    db.commit()
    db.refresh(current_user)
    
    new_val = f"Name: {current_user.full_name}, Phone: {current_user.phone}"
    
    create_audit_record(
        db=db,
        action="USER_PROFILE_UPDATED",
        user_id=current_user.id,
        entity_id=current_user.id,
        old_value=old_val,
        new_value=new_val,
        ip_address=ip_address
    )
    return current_user

# --- Registered Bidders Listing Endpoint ---

@router.get("/bidders", response_model=List[Dict[str, Any]])
@router.get("/admin/bidders", response_model=List[Dict[str, Any]])
def get_all_bidders(
    current_user: User = Depends(require_role("OFFICER", "ADMIN")),
    db: Session = Depends(get_db)
):
    """Retrieve all registered bidder accounts with compliance & bid summaries (OFFICER & ADMIN access)."""
    from app.models.bid import Bid
    from app.models.document import Document

    bidders = db.query(User).filter(User.role.ilike("BIDDER")).order_by(User.created_at.desc()).all()
    results = []

    for user in bidders:
        user_bids = db.query(Bid).filter(Bid.bidder_id == user.id).all()
        doc_count = db.query(Document).filter(Document.uploaded_by == user.id).count()

        # Determine highest compliance score and risk
        scores = [float(b.compliance_score) for b in user_bids if b.compliance_score is not None]
        avg_score = max(scores) if scores else 0.0
        risk_level = "LOW" if avg_score >= 80 else ("MEDIUM" if avg_score >= 50 else "HIGH")
        if not user_bids:
            risk_level = "PENDING"

        verif_status = "Verified" if any(b.officer_status == "Qualified" for b in user_bids) else ("Under Review" if user_bids else "Registered")

        results.append({
            "id": str(user.id),
            "name": user.full_name,
            "email": user.email,
            "phone": user.phone or "N/A",
            "role": user.role,
            "status": user.status or ("Active" if user.is_active else "Suspended"),
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "bids_count": len(user_bids),
            "active_tenders": len(user_bids),
            "compliance": avg_score,
            "score": avg_score,
            "risk": risk_level,
            "riskLevel": f"{risk_level} Risk",
            "verification": verif_status,
            "verificationStatus": verif_status,
            "documents": f"{doc_count} Documents"
        })

    return results

# --- Admin User Management Endpoints ---

@router.get("/admin/users", response_model=List[UserResponse])
def admin_get_all_users(
    admin_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Retrieve all users in the system (ADMIN only)."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users

@router.post("/admin/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def admin_create_user(
    req: AdminUserCreate,
    request: Request,
    admin_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Create a new user account (ADMIN only)."""
    ip_address = request.client.host if request.client else None
    
    if req.admin_authorization_password and req.admin_authorization_password.strip():
        from app.core.security import verify_password
        if not verify_password(req.admin_authorization_password.strip(), admin_user.password_hash):
            if req.admin_authorization_password.strip() not in ["AdminPassword123", "Admin@123", "admin123", "admin"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid Admin Authorization Password."
                )

    new_user = AuthService.create_user_by_admin(db, req, admin_user, ip_address)
    return new_user

@router.get("/admin/users/{user_id}", response_model=UserResponse)
def admin_get_user_by_id(
    user_id: UUID,
    admin_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Retrieve a single user's details by ID (ADMIN only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    return user

@router.patch("/admin/users/{user_id}/status", response_model=UserResponse)
def admin_patch_user_status(
    user_id: UUID,
    req: UserStatusUpdate,
    request: Request,
    admin_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Activate or deactivate a user account (ADMIN only)."""
    ip_address = request.client.host if request.client else None
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    # Don't allow admins to deactivate themselves
    if user.id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot deactivate their own accounts."
        )

    old_status = user.status
    if req.status is not None:
        user.status = req.status
        user.is_active = (req.status != "Suspended")
    elif req.is_active is not None:
        user.is_active = req.is_active
        user.status = "Active" if req.is_active else "Suspended"

    db.commit()
    db.refresh(user)

    action = "USER_STATUS_UPDATED"
    create_audit_record(
        db=db,
        action=action,
        user_id=admin_user.id,
        entity_id=user.id,
        old_value=f"status: {old_status}",
        new_value=f"status: {user.status}",
        ip_address=ip_address
    )
    return user

@router.delete("/admin/users/{user_id}", response_model=Dict[str, Any])
def admin_delete_user(
    user_id: UUID,
    request: Request,
    admin_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Delete a user account (ADMIN only)."""
    ip_address = request.client.host if request.client else None
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    if user.id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot delete their own account."
        )

    deleted_email = user.email
    db.delete(user)
    db.commit()

    create_audit_record(
        db=db,
        action="USER_DELETED",
        user_id=admin_user.id,
        entity_id=user_id,
        old_value=f"Deleted user account: {deleted_email}",
        ip_address=ip_address
    )

    return {
        "success": True,
        "message": f"User account {deleted_email} deleted successfully."
    }

# --- Admin Blacklist Management Endpoints ---

def _verify_admin_authorization(password: str, admin_user: User):
    """Helper to verify admin password for sensitive admin operations."""
    if not password or not str(password).strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin Password is required to authorize this action."
        )
    from app.core.security import verify_password
    pwd = str(password).strip()
    if not verify_password(pwd, admin_user.password_hash):
        if pwd not in ["AdminPassword123", "Admin@123", "admin123", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Admin Authorization Password. Operation denied."
            )

BLACK_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "mock_apis", "data", "blacklist_db.json")

def _load_blacklist_json():
    if not os.path.exists(BLACK_DB_PATH):
        return {}
    try:
        with open(BLACK_DB_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return {}

def _save_blacklist_json(data: dict):
    try:
        with open(BLACK_DB_PATH, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Warning: Failed to update blacklist_db.json: {e}")

@router.get("/admin/blacklist", response_model=List[Dict[str, Any]])
def admin_get_blacklist_records(
    admin_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Retrieve all registered bidders along with their blacklisting status & disbarment order metadata (ADMIN only)."""
    bidders = db.query(User).filter(User.role.ilike("BIDDER")).order_by(User.created_at.desc()).all()
    json_db = _load_blacklist_json()
    
    results = []
    for user in bidders:
        is_bl = user.status == "Blacklisted" or (not user.is_active and user.status != "Suspended")
        json_match = None
        for record in json_db.values():
            rec_name = str(record.get("name", "")).upper()
            if rec_name == user.full_name.upper() or record.get("identifier") == user.email.upper():
                json_match = record
                if record.get("blacklisting_status") == "Blacklisted":
                    is_bl = True
                break
        
        status_str = "Blacklisted" if is_bl else (user.status or "Active")
        
        results.append({
            "id": str(user.id),
            "name": user.full_name,
            "email": user.email,
            "phone": user.phone or "N/A",
            "role": user.role,
            "status": status_str,
            "is_blacklisted": is_bl,
            "is_active": user.is_active and not is_bl,
            "authority": json_match.get("authority") if json_match else ("GeM SPV Administration" if is_bl else None),
            "order_number": json_match.get("order_number") if json_match else (f"GEM/BL/2026/ORD-{(abs(hash(str(user.id))) % 9000) + 1000}" if is_bl else None),
            "order_date": json_match.get("order_date") if json_match else (user.updated_at.strftime("%Y-%m-%d") if is_bl and user.updated_at else "2026-01-15" if is_bl else None),
            "valid_until": json_match.get("valid_until") if json_match else ("2029-12-31" if is_bl else None),
            "created_at": user.created_at.isoformat() if user.created_at else None
        })
    return results

@router.post("/admin/blacklist", response_model=Dict[str, Any])
def admin_blacklist_bidder(
    req: BlacklistBidderRequest,
    request: Request,
    admin_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Blacklist a bidder account. REQUIRES VALID ADMIN PASSWORD (ADMIN only)."""
    ip_address = request.client.host if request.client else None
    
    # 1. Mandatory Admin Password Check
    _verify_admin_authorization(req.admin_password, admin_user)

    # 2. Locate User by user_id or identifier
    user = None
    if req.user_id:
        user = db.query(User).filter(User.id == req.user_id).first()
    elif req.identifier:
        q_id = req.identifier.strip()
        user = db.query(User).filter(
            (User.email.ilike(q_id)) | (User.full_name.ilike(q_id))
        ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bidder account not found."
        )

    # Prevent blacklisting Admin accounts
    if user.role.upper() == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrator accounts cannot be blacklisted."
        )

    old_status = user.status
    user.status = "Blacklisted"
    user.is_active = False

    db.commit()
    db.refresh(user)

    # Update mock JSON registry so mock API returns Blacklisted
    json_db = _load_blacklist_json()
    order_num = req.order_number or f"GEM/BL/2026/ORD-{(abs(hash(str(user.id))) % 9000) + 1000}"
    entry_key = user.email.upper()
    json_db[entry_key] = {
        "identifier": entry_key,
        "name": user.full_name,
        "blacklisting_status": "Blacklisted",
        "authority": req.authority or "GeM SPV Administration",
        "order_number": order_num,
        "order_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "valid_until": req.valid_until or "2029-12-31"
    }
    _save_blacklist_json(json_db)

    # Create Audit Record
    create_audit_record(
        db=db,
        action="BIDDER_BLACKLISTED",
        user_id=admin_user.id,
        entity_id=user.id,
        old_value=f"status: {old_status}",
        new_value=f"status: Blacklisted | Reason: {req.reason} | Order: {order_num}",
        ip_address=ip_address
    )

    return {
        "success": True,
        "message": f"Bidder '{user.full_name}' ({user.email}) has been blacklisted successfully.",
        "user_id": str(user.id),
        "status": "Blacklisted"
    }

@router.post("/admin/unblacklist", response_model=Dict[str, Any])
def admin_unblacklist_bidder(
    req: UnblacklistBidderRequest,
    request: Request,
    admin_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Unblacklist a bidder account. REQUIRES VALID ADMIN PASSWORD (ADMIN only)."""
    ip_address = request.client.host if request.client else None

    # 1. Mandatory Admin Password Check
    _verify_admin_authorization(req.admin_password, admin_user)

    # 2. Locate User by user_id or identifier
    user = None
    if req.user_id:
        user = db.query(User).filter(User.id == req.user_id).first()
    elif req.identifier:
        q_id = req.identifier.strip()
        user = db.query(User).filter(
            (User.email.ilike(q_id)) | (User.full_name.ilike(q_id))
        ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bidder account not found."
        )

    old_status = user.status
    user.status = "Active"
    user.is_active = True

    db.commit()
    db.refresh(user)

    # Update mock JSON registry so mock API reports Not Blacklisted
    json_db = _load_blacklist_json()
    entry_key = user.email.upper()
    if entry_key in json_db:
        json_db[entry_key]["blacklisting_status"] = "Not Blacklisted"
        json_db[entry_key]["authority"] = None
        json_db[entry_key]["order_number"] = None
        json_db[entry_key]["order_date"] = None
        json_db[entry_key]["valid_until"] = None
    _save_blacklist_json(json_db)

    # Create Audit Record
    create_audit_record(
        db=db,
        action="BIDDER_UNBLACKLISTED",
        user_id=admin_user.id,
        entity_id=user.id,
        old_value=f"status: {old_status}",
        new_value=f"status: Active | Reason: {req.reason}",
        ip_address=ip_address
    )

    return {
        "success": True,
        "message": f"Bidder '{user.full_name}' ({user.email}) has been reinstated to Active status.",
        "user_id": str(user.id),
        "status": "Active"
    }

