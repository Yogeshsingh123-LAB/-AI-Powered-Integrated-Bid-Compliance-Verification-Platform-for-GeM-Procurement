import uuid
from datetime import timedelta
from typing import Any, Dict
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import create_access_token
from app.core.config import settings
from app.schemas.auth import (
    UserRegister, TokenResponse, ChangePassword, PasswordVerification,
    BiometricRegisterRequest
)
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService, get_current_user, create_audit_record
from app.services.rate_limiter import login_limiter
from app.models.user import User
from app.models.tender import Tender
from app.models.requirement import Requirement
from app.models.bid import Bid
from app.core.security import get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _set_session_cookie(response: Response, token: str) -> None:
    """Store the JWT in an HttpOnly cookie so browsers never keep it in
    localStorage (XSS cannot read it). SameSite=Lax blocks cross-site POST
    submission of the cookie."""
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE and settings.is_production,
        samesite="lax",
        path="/",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(settings.SESSION_COOKIE_NAME, path="/")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(req: UserRegister, request: Request, db: Session = Depends(get_db)):
    """Register a new user (public registration allows BIDDER only)."""
    ip_address = request.client.host if request.client else None
    login_limiter.check_ip(request, kind="register")
    user = AuthService.register_user(db, req, ip_address)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Authenticate a user. Supports both:
    1. JSON request body: {"email": "...", "password": "..."}
    2. Form data (OAuth2 Password flow in Swagger): username=...&password=...

    Security: backend rate limiting (per-IP throttle + per-email lockout) is
    enforced before any credential check. No client-side captcha is used.
    On success the JWT is returned in the body AND stored in an HttpOnly
    session cookie for browser clients.
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

    # --- Server-side abuse protection (checked before touching credentials) ---
    login_limiter.check_ip(request, kind="login")
    login_limiter.check_email_locked(email)

    from app.schemas.auth import UserLogin
    from pydantic import ValidationError
    try:
        login_req = UserLogin(email=email, password=password)
    except ValidationError:
        raise HTTPException(status_code=422, detail="Enter a valid email address and password.") from None

    try:
        user = AuthService.authenticate_user(db, login_req, ip_address)
    except HTTPException as exc:
        # Track failed attempts for per-email lockout (bad password OR suspended).
        if exc.status_code in (401, 403):
            login_limiter.record_failure(email)
        raise

    login_limiter.record_success(email)

    access_token = create_access_token(
        subject=str(user.id),
        role=user.role,
        must_change_password=bool(getattr(user, "must_change_password", False)),
    )
    _set_session_cookie(response, access_token)

    result: Dict[str, Any] = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }
    if getattr(user, "must_change_password", False):
        result["must_change_password"] = True
    return result


@router.get("/biometric/status")
def get_biometric_status():
    """
    Biometric hardware-key login is NOT available in this release.

    The previous public toggle/verify endpoints were removed after audit
    because they issued tokens without verifying any WebAuthn assertion. The
    feature will return only after server-side WebAuthn challenge generation
    and assertion verification are implemented.
    """
    return {
        "enabled": False,
        "supported_devices": [],
        "message": "Biometric login is disabled pending a secure WebAuthn implementation. Please use email and password."
    }


@router.post("/biometric/register")
def register_biometric_credential(
    req: BiometricRegisterRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Placeholder for the future WebAuthn credential registry. Authentication is
    required; no credential material is stored or trusted until real
    server-side challenge/verification is implemented.
    """
    ip_address = request.client.host if request.client else None
    create_audit_record(
        db=db,
        action="BIOMETRIC_CREDENTIAL_REGISTERED",
        user_id=current_user.id,
        entity_id=current_user.id,
        new_value=f"Biometric device registration requested ({req.device_type}). Feature pending secure implementation.",
        ip_address=ip_address,
    )
    return {
        "success": True,
        "message": "Noted. Biometric login is not yet available; it will be enabled after secure WebAuthn verification is implemented.",
        "device_type": req.device_type,
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user."""
    return current_user


@router.get("/ws-token", tags=["Authentication"])
def get_ws_token(current_user: User = Depends(get_current_user)):
    """
    Issue a short-lived (60s) WebSocket handshake token.

    Browsers cannot attach cookies or Authorization headers to a WebSocket
    handshake, and the session cookie is HttpOnly (unreadable by JS). The
    client exchanges its valid session for this one-time-use ticket, which the
    monitoring endpoint validates exactly like an access token.
    """
    ws_token = create_access_token(
        subject=str(current_user.id),
        role=current_user.role,
        expires_delta=timedelta(seconds=60),
    )
    return {"ws_token": ws_token, "expires_in": 60}


@router.post("/verify-password")
def verify_current_password(req: PasswordVerification, current_user: User = Depends(get_current_user)):
    if not verify_password(req.password, current_user.password_hash):
        raise HTTPException(status_code=403, detail="Incorrect account password.")
    return {"success": True}


@router.post("/change-password", response_model=Dict[str, Any])
def change_password(req: ChangePassword, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Change current password of the logged-in user (also clears the
    first-login forced-change flag)."""
    ip_address = request.client.host if request.client else None
    AuthService.change_password(db, current_user, req, ip_address)
    if getattr(current_user, "must_change_password", False):
        current_user.must_change_password = False
        db.commit()
    return {
        "success": True,
        "message": "Password changed successfully."
    }


@router.post("/logout", response_model=Dict[str, Any])
def logout(request: Request, response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Log out: clears the HttpOnly session cookie and writes an audit entry."""
    ip_address = request.client.host if request.client else None
    create_audit_record(
        db=db,
        action="USER_LOGOUT",
        user_id=current_user.id,
        entity_id=current_user.id,
        ip_address=ip_address,
    )
    _clear_session_cookie(response)
    return {
        "success": True,
        "message": "Logout successful. Session cookie cleared."
    }


# ---------------------------------------------------------------------------
# Development-only seed route.
#
# This router is NOT mounted in production (see app.main.create_app). It is
# also disabled by default in development unless ALLOW_SEED_ENDPOINT=true.
# ---------------------------------------------------------------------------
seed_router = APIRouter(prefix="/auth", tags=["Development Seeding"])


@seed_router.post("/seed", status_code=status.HTTP_200_OK)
def seed_dev_data(db: Session = Depends(get_db)):
    """Seed the database with development mock users, tender, requirement, and bid."""
    if settings.is_production or not settings.ALLOW_SEED_ENDPOINT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Database seeding is disabled in this environment."
        )

    # Seed Users. Passwords are generated per run and returned ONCE in this
    # response — no default credentials live in the source code.
    import secrets as _secrets
    users_data = [
        {"email": "bidder@example.com", "role": "BIDDER", "full_name": "Mock Bidder Company"},
        {"email": "officer@example.com", "role": "OFFICER", "full_name": "Procurement Officer 1"},
        {"email": "admin@example.com", "role": "ADMIN", "full_name": "Admin User"}
    ]
    for ud in users_data:
        ud["password"] = _secrets.token_urlsafe(12)

    seeded_users = {}
    for ud in users_data:
        existing = db.query(User).filter(User.email == ud["email"]).first()
        if not existing:
            u = User(
                full_name=ud["full_name"],
                email=ud["email"],
                password_hash=get_password_hash(ud["password"]),
                role=ud["role"],
                is_active=True,
                must_change_password=True,
            )
            db.add(u)
            db.commit()
            db.refresh(u)
            seeded_users[ud["role"]] = u
            ud["created"] = True
        else:
            seeded_users[ud["role"]] = existing
            ud["created"] = False

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
        "message": "Database seeded with development accounts (development only).",
        "accounts": {
            "BIDDER": {
                "email": "bidder@example.com",
                "password": users_data[0]["password"],
                "password_shown_once": users_data[0]["created"],
                "bid_id": "550e8400-e29b-11d4-a716-446655440000",
            },
            "OFFICER": {
                "email": "officer@example.com",
                "password": users_data[1]["password"],
                "password_shown_once": users_data[1]["created"],
            },
            "ADMIN": {
                "email": "admin@example.com",
                "password": users_data[2]["password"],
                "password_shown_once": users_data[2]["created"],
            },
            "TENDER_ID": tender_id,
            "REQUIREMENT_ID": "440e8400-e29b-11d4-a716-446655440000 (Code: GST)"
        }
    }
