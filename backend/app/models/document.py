import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, UUID
from sqlalchemy.orm import relationship
from app.db.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bid_id = Column(UUID(as_uuid=True), ForeignKey("bids.id", ondelete="CASCADE"), nullable=False, index=True)
    requirement_id = Column(UUID(as_uuid=True), ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(50), nullable=False)  # e.g. "GST_CERTIFICATE"
    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(512), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)  # SHA-256 is 64 hex chars
    document_status = Column(String(50), nullable=False, default="UPLOADED")  # "UPLOADED", "PROCESSING", "VERIFIED", "REJECTED", etc.
    rejection_reason = Column(String(512), nullable=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    bid = relationship("Bid", back_populates="documents")
    requirement = relationship("Requirement", back_populates="documents")
    uploader = relationship("User")
    ocr_records = relationship("DocumentOCR", back_populates="document", cascade="all, delete-orphan")
    extractions = relationship("DocumentExtraction", back_populates="document", cascade="all, delete-orphan")

