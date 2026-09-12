import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, UUID
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="BIDDER")  # "BIDDER", "OFFICER", "ADMIN"
    department = Column(String(100), nullable=True, default="Procurement")
    status = Column(String(20), nullable=False, default="Active")  # "Active", "Pending", "Suspended"
    permissions = Column(String(500), nullable=True)
    last_login = Column(DateTime, nullable=True)
    auth_user_id = Column(String(100), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
