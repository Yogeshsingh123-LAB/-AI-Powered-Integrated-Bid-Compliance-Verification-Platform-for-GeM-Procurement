import uuid
from datetime import timedelta
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import create_access_token
from app.core.config import settings
from app.schemas.auth import UserRegister, TokenResponse, ChangePassword
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService, get_current_user, create_audit_record
from app.models.user import User
from app.models.tender import Tender
from app.models.requirement import Requirement
from app.models.bid import Bid
from app.core.security import get_password_hash

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(req: UserRegister, request: Request, db: Session = Depends(get_db)):
    """Register a new user (public registration allows BIDDER only)."""
    ip_address = request.client.host if request.client else None
    user = AuthService.register_user(db, req, ip_address)
    return user

@router.post("/login", response_model=TokenResponse)
async def login(request: Request, db: Session = Depends(get_db)):
    """
    Authenticate a user. Supports both:
    1. JSON request body: {"email": "...", "password": "..."}
    2. Form data (OAuth2 Password flow in Swagger): username=...&password=...
    """
    ip_address = request.client.host if request.client else None
    content_type = request.headers.get("content-type", "")
    
    email = None
    password = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            email = body.get("email")
            password = body.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload."
            )
    else:
        try:
            form = await request.form()
            email = form.get("username") or form.get("email")
            password = form.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid form data."
            )

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required."
        )

    from app.schemas.auth import UserLogin
    login_req = UserLogin(email=email, password=password)
    user = AuthService.authenticate_user(db, login_req, ip_address)
    
    access_token = create_access_token(subject=str(user.id), role=user.role)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user."""
    return current_user

@router.post("/change-password", response_model=Dict[str, Any])
def change_password(req: ChangePassword, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Change current password of the logged-in user."""
    ip_address = request.client.host if request.client else None
    AuthService.change_password(db, current_user, req, ip_address)
    return {
        "success": True,
        "message": "Password changed successfully."
    }

@router.post("/logout", response_model=Dict[str, Any])
def logout(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Log out of the system.
    Note: JWT is stateless. Token must be removed client-side.
    """
    ip_address = request.client.host if request.client else None
    create_audit_record(
        db=db,
        action="USER_LOGOUT",
        user_id=current_user.id,
        entity_id=current_user.id,
        ip_address=ip_address
    )
    return {
        "success": True,
        "message": "Logout successful. Please delete your client-side storage token."
    }

@router.post("/seed", status_code=status.HTTP_200_OK)
def seed_dev_data(db: Session = Depends(get_db)):
    """Seed the database with development mock users, tender, requirement, and bid."""
    if getattr(settings, "ENVIRONMENT", "development") == "production" and not getattr(settings, "ALLOW_SEED", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Database seeding is disabled in production environment."
        )
    # Seed Users
    users_data = [
        {"email": "bidder@example.com", "role": "BIDDER", "full_name": "Mock Bidder Company", "password": "BidderPassword123"},
        {"email": "officer@example.com", "role": "OFFICER", "full_name": "Procurement Officer 1", "password": "OfficerPassword123"},
        {"email": "admin@example.com", "role": "ADMIN", "full_name": "Admin User", "password": "AdminPassword123"}
    ]
    
    seeded_users = {}
    for ud in users_data:
        existing = db.query(User).filter(User.email == ud["email"]).first()
        if not existing:
            u = User(
                full_name=ud["full_name"],
                email=ud["email"],
                password_hash=get_password_hash(ud["password"]),
                role=ud["role"],
                is_active=True
            )
            db.add(u)
            db.commit()
            db.refresh(u)
            seeded_users[ud["role"]] = u
        else:
            seeded_users[ud["role"]] = existing

    # Seed Tender
    tender_id = "GEM/2026/001"
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        tender = Tender(
            id=tender_id,
            title="Procurement of IT Hardware",
            description="Tender for supplying laptops and servers for government office usage.",
            budget_limit=1500000.00,
            status="Active"
        )
        db.add(tender)
        db.commit()
        db.refresh(tender)

    # Seed Requirement
    requirement = db.query(Requirement).filter(
        Requirement.tender_id == tender_id,
        Requirement.code == "GST"
    ).first()
    if not requirement:
        requirement = Requirement(
            id=uuid.UUID("440e8400-e29b-11d4-a716-446655440000"),
            tender_id=tender_id,
            code="GST",
            description="Valid GST registration certificate document.",
            is_mandatory=True
        )
        db.add(requirement)
        db.commit()
        db.refresh(requirement)

    # Seed Bid
    bidder_user = seeded_users["BIDDER"]
    bid = db.query(Bid).filter(
        Bid.tender_id == tender_id,
        Bid.bidder_id == bidder_user.id
    ).first()
    if not bid:
        bid = Bid(
            id=uuid.UUID("550e8400-e29b-11d4-a716-446655440000"),
            tender_id=tender_id,
            bidder_id=bidder_user.id,
            status="Pending"
        )
        db.add(bid)
        db.commit()
        db.refresh(bid)

    return {
        "success": True,
        "message": "Database seeded with development accounts.",
        "accounts": {
            "BIDDER": "bidder@example.com (Password: BidderPassword123, Bid ID: 550e8400-e29b-11d4-a716-446655440000)",
            "OFFICER": "officer@example.com (Password: OfficerPassword123)",
            "ADMIN": "admin@example.com (Password: AdminPassword123)",
            "TENDER_ID": tender_id,
            "REQUIREMENT_ID": "440e8400-e29b-11d4-a716-446655440000 (Code: GST)"
        }
    }
