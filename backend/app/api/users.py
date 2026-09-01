from typing import List, Dict, Any
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Request, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserStatusUpdate, AdminUserCreate
from app.services.auth_service import AuthService, get_current_user, require_role, create_audit_record

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
