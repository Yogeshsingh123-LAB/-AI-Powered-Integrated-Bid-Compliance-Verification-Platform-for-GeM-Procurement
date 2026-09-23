import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import settings

import bcrypt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _prepare_password(password: str) -> str:
    if not password:
        return ""
    if isinstance(password, str):
        return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")
    return str(password)[:72]

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password with timing attack mitigation."""
    if not plain_password or not hashed_password:
        return False
    clean_pass = _prepare_password(plain_password)
    clean_hash = hashed_password.strip()
    try:
        if clean_hash.startswith("$2"):
            return bcrypt.checkpw(clean_pass.encode("utf-8"), clean_hash.encode("utf-8"))
        return pwd_context.verify(clean_pass, clean_hash)
    except Exception:
        try:
            return pwd_context.verify(clean_pass, clean_hash)
        except Exception:
            return False

def get_password_hash(password: str) -> str:
    """Generate bcrypt hash of password."""
    clean_pass = _prepare_password(password)
    try:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(clean_pass.encode("utf-8"), salt).decode("utf-8")
    except Exception:
        return pwd_context.hash(clean_pass)

def validate_password_strength(password: str) -> bool:
    """
    Validate that password meets security requirements:
    - Minimum 8 characters
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one number
    """
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    return True


_COMMON_PASSWORDS = {
    "password", "admin123", "admin@123", "12345678", "qwerty123", "password123",
    "admin2026", "adminsecret2026!", "bidderpassword123", "officerpassword123",
    "gem@123", "changeme", "welcome1", "letmein1",
}


def is_weak_or_demo_password(password: str) -> bool:
    """Reject common, default, and demo passwords for privileged accounts."""
    if not password:
        return True
    low = password.lower()
    if low in _COMMON_PASSWORDS:
        return True
    if "password" in low and len(password) < 12:
        return True
    return False


def create_access_token(
    subject: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
    must_change_password: bool = False,
) -> str:
    """
    Create a JWT access token for a subject (user ID) and role.

    Security:
    - `sub` is always the user's primary key (UUID), never an email.
    - `iss` / `aud` are validated on decode so tokens are bound to this service.
    - `iat` guards against back-dated tokens; `jti` allows future revocation.
    - The `role` claim is informational only. Authorization is always enforced
      from the database record (see auth_service.get_current_user / require_role).
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "sub": str(subject),
        "role": str(role),
        "exp": int(expire.timestamp()),
        "iat": int(now.timestamp()),
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "jti": uuid.uuid4().hex,
    }
    if must_change_password:
        to_encode["pw_change_required"] = True

    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT access token.

    Strict validation: signature, expiry, issuer, audience and issue-time are
    all enforced. Returns the payload, or None on any failure.
    """
    if not token or not isinstance(token, str):
        return None
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            audience=settings.JWT_AUDIENCE,
            issuer=settings.JWT_ISSUER,
            options={"require": ["exp", "iat", "sub", "jti"]},
        )
    except JWTError:
        return None

    # Reject tokens issued in the future (clock drift tolerance: 60s).
    iat = payload.get("iat")
    if iat is not None and iat > datetime.now(timezone.utc).timestamp() + 60:
        return None
    return payload
