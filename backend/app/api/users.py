from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserStatusUpdate
from app.services.auth_service import get_current_user, require_role, create_audit_record

router = APIRouter(tags=["User Profile & Administration"])

# --- User Profile Endpoints ---

@router.get("/users/me", response_model=UserResponse)
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

# --- Admin User Management Endpoints ---

@router.get("/admin/users", response_model=List[UserResponse])
def admin_get_all_users(
    admin_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Retrieve all users in the system (ADMIN only)."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users

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

    old_active = user.is_active
    user.is_active = req.is_active
    db.commit()
    db.refresh(user)

    action = "USER_ACTIVATED" if req.is_active else "USER_DEACTIVATED"
    create_audit_record(
        db=db,
        action=action,
        user_id=admin_user.id,
        entity_id=user.id,
        old_value=f"is_active: {old_active}",
        new_value=f"is_active: {req.is_active}",
        ip_address=ip_address
    )
    return user
