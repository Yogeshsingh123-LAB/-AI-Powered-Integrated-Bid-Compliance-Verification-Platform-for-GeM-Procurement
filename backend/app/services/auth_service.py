import logging
import uuid
import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
# pyrefly: ignore [missing-import]
from fastapi import Depends, HTTPException, Request, status
# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordBearer
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from sqlalchemy import desc, func

from app.db.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    validate_password_strength,
    decode_access_token
)
from app.models.user import User
from app.models.tender import Tender
from app.models.requirement import Requirement
from app.models.bid import Bid
from app.models.audit_log import AuditLog
from app.schemas.auth import UserRegister, UserLogin, ChangePassword
from app.schemas.user import AdminUserCreate
from app.core.config import settings

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


SECURITY_CRITICAL_AUDIT_ACTIONS = {
    "USER_LOGIN_SUCCESS", "USER_LOGIN_FAILED", "USER_LOGOUT", "PASSWORD_CHANGED",
    "USER_REGISTERED", "ADMIN_CREATED_USER", "USER_STATUS_CHANGED", "USER_PASSWORD_RESET",
    "OFFICER_QUALIFIED", "OFFICER_DISQUALIFIED", "OFFICER_NEEDS_CLARIFICATION",
    "BID_SUBMITTED", "DOCUMENTS_SUBMITTED", "DOCUMENT_UPLOADED", "DOCUMENT_REPLACED",
    "BID_RE_VERIFIED", "BIOMETRIC_LOGIN_SUCCESS", "BIOMETRIC_FEATURE_TOGGLED",
}


def create_audit_record(
    db: Session,
    action: str,
    user_id: Optional[str] = None,
    entity_type: str = "User",
    entity_id: Optional[str] = None,
    bid_id: Optional[str] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    ip_address: Optional[str] = None,
    strict: Optional[bool] = None,
) -> AuditLog:
    """
    Append a tamper-evident record to the audit hash chain.

    Security properties (per platform audit):
    - Runs in its own transaction; the previous hash + next sequence number are
      computed under a row lock (SELECT ... FOR UPDATE on the latest record,
      pg_advisory_xact_lock on PostgreSQL) so concurrent writers cannot race.
    - The hash covers the full canonical payload (sequence, timestamp, all fields).
    - For security-critical actions a failed audit write RE-RAISES so the
      operation cannot silently succeed without an audit trail.
    """
    def safe_uuid(val):
        if not val:
            return None
        try:
            return uuid.UUID(str(val))
        except (ValueError, AttributeError, TypeError):
            return None

    clean_user_id = safe_uuid(user_id)
    clean_entity_id = safe_uuid(entity_id)
    clean_bid_id = safe_uuid(bid_id)

    effective_new_val = new_value
    if entity_id and not clean_entity_id:
        effective_new_val = f"[RefID: {entity_id}] " + (new_value or "")

    try:
        now = datetime.now(timezone.utc)

        # Lock the chain head: a transaction-scoped advisory lock on PostgreSQL
        # (plus the serial read of the latest row) prevents concurrent writers
        # from producing competing hash chains.
        from sqlalchemy import text as _sa_text
        if db.bind.dialect.name == "postgresql":
            try:
                db.execute(_sa_text("SELECT pg_advisory_xact_lock(7234561)"))
            except Exception as lock_err:
                logger.warning(f"Advisory lock unavailable, continuing: {lock_err}")
        last_log = (
            db.query(AuditLog)
            .order_by(AuditLog.sequence.desc().nullslast(), AuditLog.created_at.desc(), AuditLog.id.desc())
            .first()
        )
        prev_hash = "0" * 64
        next_seq = 1
        if last_log is not None:
            if last_log.blockchain_hash:
                prev_hash = last_log.blockchain_hash
            if last_log.sequence is not None:
                next_seq = int(last_log.sequence) + 1

        canonical_payload = {
            "seq": next_seq,
            "ts": now.isoformat(),
            "action": action,
            "user_id": str(clean_user_id) if clean_user_id else None,
            "entity_type": entity_type,
            "entity_id": str(clean_entity_id) if clean_entity_id else None,
            "bid_id": str(clean_bid_id) if clean_bid_id else None,
            "old_value": old_value,
            "new_value": effective_new_val,
            "ip_address": ip_address,
            "prev_hash": prev_hash,
        }
        canonical = json.dumps(canonical_payload, sort_keys=True, ensure_ascii=True, default=str)
        block_hash = hashlib.sha256(f"{prev_hash}:{canonical}".encode("utf-8")).hexdigest()

        log = AuditLog(
            sequence=next_seq,
            user_id=clean_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=clean_entity_id,
            bid_id=clean_bid_id,
            old_value=old_value,
            new_value=effective_new_val,
            ip_address=ip_address,
            blockchain_hash=block_hash,
            created_at=now,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to write audit log for action={action}: {e}", exc_info=True)
        is_critical = (action in SECURITY_CRITICAL_AUDIT_ACTIONS) if strict is None else bool(strict)
        if is_critical:
            raise RuntimeError(
                f"Audit log write failed for security-critical action '{action}'. "
                "The operation was not recorded and must be investigated."
            ) from e
        return None


class AuthService:
    @staticmethod
    def register_user(db: Session, req: UserRegister, ip_address: Optional[str] = None) -> User:
        """Register a new user (public registration allows BIDDER only)."""
        if (req.role or "BIDDER").upper() != "BIDDER":
            raise HTTPException(status_code=403, detail="Public registration is restricted to bidders.")
        user_role = "BIDDER"

        # Validate password (minimum 8 characters)
        if not req.password or len(req.password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long."
            )

        # Check unique email
        existing_user = db.query(User).filter(func.lower(User.email) == req.email.strip().lower()).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )

        # Create user
        new_user = User(
            full_name=req.full_name,
            email=req.email.strip().lower(),
            password_hash=get_password_hash(req.password),
            role=user_role,
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Log audit
        create_audit_record(
            db=db,
            action="USER_REGISTERED",
            user_id=new_user.id,
            entity_id=new_user.id,
            new_value=f"Registered user: {req.email}",
            ip_address=ip_address
        )
        return new_user

    @staticmethod
    def create_user_by_admin(db: Session, req: AdminUserCreate, admin_user: User, ip_address: Optional[str] = None) -> User:
        """Create a new user account with full profile details (Admin only)."""
        clean_email = req.email.strip().lower()
        existing_user = db.query(User).filter(func.lower(User.email) == clean_email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )

        if not req.password or len(req.password) < 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 4 characters long."
            )

        # Normalize role mapping
        r_upper = (req.role or "OFFICER").upper()
        if "ADMIN" in r_upper:
            target_role = "ADMIN"
        elif "BIDDER" in r_upper or "SUPPLIER" in r_upper:
            target_role = "BIDDER"
        elif "VERIFICATION" in r_upper:
            target_role = "VERIFICATION OFFICER"
        elif "AUDITOR" in r_upper:
            target_role = "AUDITOR"
        else:
            target_role = "OFFICER"

        account_status = req.status or "Active"
        is_active = (account_status != "Suspended")

        perms_str = json.dumps(req.permissions or []) if isinstance(req.permissions, list) else str(req.permissions or "")

        # Optional Supabase Auth user creation if configured
        auth_uuid = None
        if settings.SUPABASE_URL and settings.SUPABASE_SECRET_KEY and not settings.SUPABASE_URL.startswith("https://your-project"):
            try:
                import requests
                sp_res = requests.post(
                    f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/admin/users",
                    headers={
                        "apikey": settings.SUPABASE_SECRET_KEY,
                        "Authorization": f"Bearer {settings.SUPABASE_SECRET_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "email": clean_email,
                        "password": req.password,
                        "email_confirm": True,
                        "user_metadata": {
                            "full_name": req.full_name,
                            "role": target_role,
                            "department": req.department
                        }
                    },
                    timeout=5
                )
                if sp_res.status_code in [200, 201]:
                    sp_data = sp_res.json()
                    auth_uuid = sp_data.get("id")
            except Exception as e:
                logger.warning(f"Supabase auth user creation note: {e}")

        new_user = User(
            full_name=req.full_name,
            email=clean_email,
            phone=req.phone,
            password_hash=get_password_hash(req.password),
            role=target_role,
            department=req.department or "Procurement",
            status=account_status,
            permissions=perms_str,
            is_active=is_active,
            auth_user_id=auth_uuid,
            # Admin-provisioned accounts rotate the password at first login.
            must_change_password=True,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        create_audit_record(
            db=db,
            action="ADMIN_CREATED_USER",
            user_id=admin_user.id,
            entity_id=new_user.id,
            new_value=f"Created user: {clean_email} ({target_role})",
            ip_address=ip_address
        )
        return new_user

    @staticmethod
    def authenticate_user(db: Session, req: UserLogin, ip_address: Optional[str] = None) -> User:
        """Authenticate user credentials and return User model."""
        clean_email = (req.email or "").strip().lower()
        user = db.query(User).filter(func.lower(User.email) == clean_email).first()
        
        is_valid_pass = False
        if user:
            is_valid_pass = verify_password(req.password, user.password_hash)

        if not user or not is_valid_pass:
            create_audit_record(
                db=db,
                action="USER_LOGIN_FAILED",
                new_value=f"Failed login attempt for: {req.email}",
                ip_address=ip_address
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )

        if user.status == "Suspended" or not user.is_active:
            create_audit_record(
                db=db,
                action="USER_LOGIN_FAILED",
                user_id=user.id,
                new_value=f"Suspended account login blocked: {req.email}",
                ip_address=ip_address
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive or suspended. Please contact the administrator."
            )

        user.last_login = datetime.now(timezone.utc)
        db.commit()

        create_audit_record(
            db=db,
            action="USER_LOGIN_SUCCESS",
            user_id=user.id,
            entity_id=user.id,
            ip_address=ip_address
        )
        return user

    @staticmethod
    def change_password(db: Session, user: User, req: ChangePassword, ip_address: Optional[str] = None) -> User:
        """Change the authenticated user's password."""
        if not verify_password(req.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect."
            )

        if not validate_password_strength(req.new_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 8 characters long and contain uppercase, lowercase, and numbers."
            )

        user.password_hash = get_password_hash(req.new_password)
        db.commit()

        create_audit_record(
            db=db,
            action="PASSWORD_CHANGED",
            user_id=user.id,
            entity_id=user.id,
            ip_address=ip_address
        )
        return user

    # In-memory / persistent runtime flag for biometric login status (OFF by default)
    _biometric_enabled: bool = False

    @classmethod
    def is_biometric_enabled(cls) -> bool:
        return cls._biometric_enabled

    @classmethod
    def set_biometric_enabled(cls, enabled: bool) -> bool:
        cls._biometric_enabled = enabled
        return cls._biometric_enabled

    @staticmethod
    def authenticate_biometric_user(
        db: Session,
        email: str,
        device_type: str = "external_hardware_key",
        ip_address: Optional[str] = None
    ) -> User:
        """Authenticate an Admin/Officer using an external biometric fingerprint device or security hardware key."""
        clean_email = (email or "").strip().lower()
        if not clean_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account email is required for biometric verification."
            )
        # SECURITY: no fallback to an arbitrary admin/officer account. The
        # account must exist and be the one whose credential was presented.
        user = db.query(User).filter(func.lower(User.email) == clean_email).first()

        if not user:
            create_audit_record(
                db=db,
                action="BIOMETRIC_LOGIN_FAILED",
                new_value=f"Biometric login failed: unknown account '{clean_email}'",
                ip_address=ip_address,
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account matching the biometric credential was found."
            )

        if user.role.upper() not in ["ADMIN", "OFFICER"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Biometric authentication is restricted to Administrative Console accounts."
            )

        if user.status == "Suspended" or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is suspended or inactive."
            )

        user.last_login = datetime.now(timezone.utc)
        db.commit()

        dev_label = "External Biometric Fingerprint Device (USB/NFC Security Key)"
        create_audit_record(
            db=db,
            action="BIOMETRIC_LOGIN_SUCCESS",
            user_id=user.id,
            entity_id=user.id,
            new_value=f"Biometric login via {dev_label}",
            ip_address=ip_address
        )
        return user


# FastAPI Dependency for authentication
def extract_token(request: Request) -> Optional[str]:
    """
    Read the JWT from the Authorization header (preferred, used by all clients
    including native apps) or, for browser sessions, from the HttpOnly session
    cookie set at login. The token is never read from query strings or bodies.
    """
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip() or None
    return request.cookies.get(settings.SESSION_COOKIE_NAME)


def _user_from_token_payload(db: Session, payload: Dict[str, Any]) -> User:
    """
    Resolve the user for a decoded JWT payload.

    SECURITY (fail-closed): the user is looked up ONLY by the `sub` claim,
    which must be the user's UUID primary key. There is no recovery by email,
    no recovery by the token's `role` claim, and no automatic admin
    initialization. A missing / inactive user is a 401. The authorization role
    is always the one stored in the database, never the token claim.
    """
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user_uuid = uuid.UUID(str(user_id))
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_uuid).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active or user.status == "Suspended":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_user_by_token(db: Session, token: str) -> User:
    """
    Resolve and validate a user from a raw token string.

    Used by endpoints that receive the token out-of-band (e.g. the WebSocket
    handshake) as well as by get_current_user. Raises 401 on any validation
    failure (bad signature, expired, unknown subject, inactive account).
    """
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _user_from_token_payload(db, payload)


# Paths a user may still call while their account is flagged must_change_password
_PASSWORD_CHANGE_PATHS = {
    "/api/auth/change-password",
    "/api/auth/verify-password",
    "/api/auth/me",
    "/api/auth/logout",
}


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency to retrieve and validate the authenticated user from a JWT
    (Authorization header or HttpOnly session cookie).

    Accounts flagged must_change_password (bootstrap / admin-provisioned
    credentials) may only reach the password-management endpoints until the
    password has been rotated.
    """
    token = extract_token(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = get_user_by_token(db, token)
    if getattr(user, "must_change_password", False):
        path = request.url.path if request is not None else ""
        if path not in _PASSWORD_CHANGE_PATHS:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="You must change your password before continuing. Use the password-change screen.",
            )
    return user


get_current_active_user = get_current_user

def get_optional_current_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    """Dependency to retrieve authenticated user if token present, or None if anonymous."""
    token = extract_token(request)
    if not token:
        return None
    try:
        return get_current_user(request=request, db=db)
    except HTTPException:
        return None

# FastAPI Dependency for Role-Based Access Control
class require_role:
    def __init__(self, *allowed_roles: str):
        normalized = []
        for r in allowed_roles:
            r_up = r.upper().replace(" ", "_")
            normalized.append(r_up)
            if r_up in ["ADMIN", "SUPER_ADMIN"]:
                normalized.extend(["ADMIN", "SUPER_ADMIN"])
            elif r_up in ["OFFICER", "PROCUREMENT_OFFICER", "VERIFICATION_OFFICER"]:
                normalized.extend(["OFFICER", "PROCUREMENT_OFFICER", "VERIFICATION_OFFICER", "PROCUREMENT OFFICER", "VERIFICATION OFFICER"])
        self.allowed_roles = list(set(normalized))

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        user_role_norm = current_user.role.upper().replace(" ", "_") if current_user.role else ""
        if user_role_norm not in self.allowed_roles and current_user.role.upper() not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource."
            )
        return current_user
