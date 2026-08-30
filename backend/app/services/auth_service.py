import logging
import uuid
import hashlib
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import desc

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

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def create_audit_record(
    db: Session,
    action: str,
    user_id: Optional[str] = None,
    entity_type: str = "User",
    entity_id: Optional[str] = None,
    bid_id: Optional[str] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    """Helper to log security-sensitive events in the database with cryptographic blockchain hashing."""
    try:
        # Calculate SHA-256 blockchain hash chain
        last_log = db.query(AuditLog).order_by(desc(AuditLog.created_at)).first()
        prev_hash = last_log.blockchain_hash if (last_log and last_log.blockchain_hash) else "0" * 64
        chain_payload = f"{prev_hash}:{action}:{user_id or ''}:{entity_type}:{entity_id or ''}:{bid_id or ''}:{new_value or ''}"
        block_hash = hashlib.sha256(chain_payload.encode("utf-8")).hexdigest()

        log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            bid_id=bid_id,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            blockchain_hash=block_hash
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to write audit log: {e}")
        # Continue execution without crashing the main flow
        return None

class AuthService:
    @staticmethod
    def register_user(db: Session, req: UserRegister, ip_address: Optional[str] = None) -> User:
        """Register a new user (public registration allows BIDDER only)."""
        # Validate role
        if req.role.upper() != "BIDDER":
            create_audit_record(db=db, action="ROLE_CHANGE_ATTEMPT", new_value=req.role, ip_address=ip_address)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Public registration is only permitted for the 'BIDDER' role."
            )

        # Validate password strength
        if not validate_password_strength(req.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long and contain uppercase, lowercase, and numbers."
            )

        # Check unique email
        existing_user = db.query(User).filter(User.email == req.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )

        # Create user
        new_user = User(
            full_name=req.full_name,
            email=req.email,
            password_hash=get_password_hash(req.password),
            role="BIDDER",
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
    def authenticate_user(db: Session, req: UserLogin, ip_address: Optional[str] = None) -> User:
        """Authenticate user credentials and return User model."""
        user = db.query(User).filter(User.email == req.email).first()
        if not user or not verify_password(req.password, user.password_hash):
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

        if not user.is_active:
            create_audit_record(
                db=db,
                action="USER_LOGIN_FAILED",
                user_id=user.id,
                new_value=f"Inactive account login blocked: {req.email}",
                ip_address=ip_address
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive."
            )

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

# FastAPI Dependency for authentication
def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    """Dependency to retrieve and validate the authenticated user from JWT."""
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user

def get_optional_current_user(db: Session = Depends(get_db), token: Optional[str] = Depends(oauth2_scheme_optional)) -> Optional[User]:
    """Dependency to retrieve authenticated user if token present, or None if anonymous."""
    if not token:
        return None
    try:
        return get_current_user(db=db, token=token)
    except HTTPException:
        return None

# FastAPI Dependency for Role-Based Access Control
class require_role:
    def __init__(self, *allowed_roles: str):
        self.allowed_roles = [role.upper() for role in allowed_roles]

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.upper() not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource."
            )
        return current_user
