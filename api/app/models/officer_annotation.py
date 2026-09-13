import uuid
from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Boolean, UUID
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
from app.db.database import Base

class OfficerAnnotation(Base):
    __tablename__ = "officer_annotations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bid_id = Column(UUID(as_uuid=True), ForeignKey("bids.id", ondelete="CASCADE"), nullable=False, index=True)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    target_component = Column(String(100), nullable=False)  # e.g., "GSTIN", "RFP-07", "CustomRule-01"
    comment_text = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    bid = relationship("Bid", back_populates="annotations")
    officer = relationship("User")
