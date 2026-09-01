import uuid
from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Text, ForeignKey, Numeric, DateTime, UUID, Boolean
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
from app.db.database import Base

class Bid(Base):
    __tablename__ = "bids"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id = Column(String(50), ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False, index=True)
    bidder_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    compliance_score = Column(Numeric(5, 2), nullable=True)
    status = Column(String(50), nullable=False, default="Pending")  # "Pending", "Compliant", "Non-Compliant"
    is_locked = Column(Boolean, nullable=False, default=False)  # Prevents decision double-submission
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Officer Override Fields
    officer_status = Column(String(50), nullable=True, default="Pending")  # "Approved", "Rejected", "Approved with Deviation"
    deviation_justification = Column(Text, nullable=True)
    deviation_category = Column(String(100), nullable=True)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    tender = relationship("Tender", back_populates="bids")
    bidder = relationship("User", foreign_keys=[bidder_id])
    officer = relationship("User", foreign_keys=[officer_id])
    documents = relationship("Document", back_populates="bid", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="bid", cascade="all, delete-orphan")
    annotations = relationship("OfficerAnnotation", back_populates="bid", cascade="all, delete-orphan")

