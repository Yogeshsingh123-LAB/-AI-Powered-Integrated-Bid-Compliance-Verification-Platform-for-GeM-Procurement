import re
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
    try:
        if hashed_password.startswith("$2"):
            return bcrypt.checkpw(clean_pass.encode("utf-8"), hashed_password.encode("utf-8"))
        return pwd_context.verify(clean_pass, hashed_password)
    except Exception:
        try:
            return pwd_context.verify(clean_pass, hashed_password)
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

def create_access_token(subject: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token for a subject (user ID) and role."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "role": str(role),
        "exp": expire
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode a JWT access token and return its payload."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None
