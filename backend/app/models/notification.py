import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, UUID
from sqlalchemy.orm import relationship
from app.db.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tender_id = Column(String(100), ForeignKey("tenders.id", ondelete="CASCADE"), nullable=True, index=True)
    bid_id = Column(UUID(as_uuid=True), ForeignKey("bids.id", ondelete="CASCADE"), nullable=True, index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True)
    
    type = Column(String(50), nullable=False)  # DOCUMENT_REJECTED, DOCUMENT_VERIFIED, DOCUMENT_REQUIRES_REVIEW, DOCUMENT_MISSING, DOCUMENT_SUBMISSION_REQUIRED, BID_SUBMISSION_REQUIRED, TENDER_CLOSING_SOON, FINAL_DECISION
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    status = Column(String(20), nullable=False, default="UNREAD")  # UNREAD, READ, ARCHIVED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    read_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User")
    tender = relationship("Tender")
    bid = relationship("Bid")
    document = relationship("Document")
