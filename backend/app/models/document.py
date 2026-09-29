import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, BigInteger, ForeignKey, DateTime, UUID, LargeBinary
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
    # Durable queue support: how many times the worker has (re)tried this
    # document. Documents exceeding MAX_PROCESSING_ATTEMPTS stay in
    # PROCESSING_FAILED for manual review instead of retrying forever.
    processing_attempts = Column(Integer, nullable=False, default=0)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    bid = relationship("Bid", back_populates="documents")
    requirement = relationship("Requirement", back_populates="documents")
    uploader = relationship("User")
    ocr_records = relationship("DocumentOCR", back_populates="document", cascade="all, delete-orphan")
    extractions = relationship("DocumentExtraction", back_populates="document", cascade="all, delete-orphan")



class DocumentBlob(Base):
    """Durable byte store for uploaded bid documents.

    Why this exists
    ---------------
    ``StorageService`` used to refuse to write anything when Supabase Storage
    was not configured and the app ran in a production/serverless environment
    ("Local storage is prohibited").  On Vercel that is exactly the situation,
    so ``POST /api/documents/upload`` returned HTTP 500 for every bidder and
    the whole downstream pipeline (OCR, extraction, verification, scoring) was
    unreachable.

    The guard's *intent* — "never store bidder evidence on an ephemeral
    filesystem" — is still honoured: the bytes now go into the configured
    PostgreSQL database, which is durable across cold starts, instead of
    ``/tmp``.  Use ``DOCUMENT_STORAGE_BACKEND=supabase`` to keep cloud object
    storage as the primary backend when it is configured.
    """

    __tablename__ = "document_blobs"

    # storage_path is the application-level key used everywhere else
    # (Document.storage_path), so no schema change is needed on `documents`.
    storage_path = Column(String(512), primary_key=True)
    file_data = Column(LargeBinary, nullable=False)
    mime_type = Column(String(100), nullable=True)
    file_size = Column(BigInteger, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
