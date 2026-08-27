import uuid
from sqlalchemy import Column, String, ForeignKey, Numeric, UUID
from sqlalchemy.orm import relationship
from app.db.database import Base

class Bid(Base):
    __tablename__ = "bids"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tender_id = Column(String(50), ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False, index=True)
    bidder_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    compliance_score = Column(Numeric(5, 2), nullable=True)
    status = Column(String(50), nullable=False, default="Pending")  # "Pending", "Compliant", "Non-Compliant"

    # Relationships
    tender = relationship("Tender", back_populates="bids")
    bidder = relationship("User")
    documents = relationship("Document", back_populates="bid", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="bid", cascade="all, delete-orphan")
